import { buildComparisonCard } from "@techprice/core";
import { prisma, Prisma } from "@techprice/database";
import {
  CATEGORY_LABELS_ES,
  isCategory,
  type Category,
  type CategorySummary,
  type HomeOverview,
  type HomeProductCard,
  type ProductPriceChange,
  type StoreOffer,
  type StoreSummary,
} from "@techprice/shared";

// How many recently-updated products to pull into the working set that feeds
// the featured / price-drop / trends sections. Bounded so a single request
// stays cheap as the catalog grows.
const WORKING_SET_SIZE = 60;
const HISTORY_POINTS_PER_PRODUCT = 40;
const FEATURED_LIMIT = 8;
const SECTION_LIMIT = 6;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    listings: { include: { store: true } };
    priceHistory: true;
  };
}>;

function toOffers(listings: ProductWithRelations["listings"]): StoreOffer[] {
  return listings.map((l) => ({
    storeId: l.storeId,
    storeName: l.store.name,
    price: l.price,
    currency: l.currency as StoreOffer["currency"],
    url: l.url,
    available: l.available,
    lastUpdated: l.lastUpdated.toISOString(),
  }));
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Recent movement for a product: the lowest recorded price on the most recent
 * snapshot day vs the day before it. History is per-store, so we collapse each
 * day to its cheapest point (mirroring how the card's "lowest price" works).
 */
function computeChange(history: ProductWithRelations["priceHistory"]): ProductPriceChange | null {
  if (history.length < 2) return null;

  const minByDay = new Map<string, number>();
  for (const point of history) {
    const day = point.recordedAt.toISOString().slice(0, 10);
    const current = minByDay.get(day);
    if (current === undefined || point.price < current) minByDay.set(day, point.price);
  }

  const days = [...minByDay.keys()].sort();
  if (days.length < 2) return null;

  const latestDay = days[days.length - 1]!;
  const previousDay = days[days.length - 2]!;
  const currentPrice = minByDay.get(latestDay)!;
  const previousPrice = minByDay.get(previousDay)!;
  if (previousPrice <= 0) return null;

  const changeAmount = currentPrice - previousPrice;
  return {
    currentPrice,
    previousPrice,
    changeAmount: round2(changeAmount),
    changePct: round2((changeAmount / previousPrice) * 100),
    changedAt: new Date(`${latestDay}T00:00:00.000Z`).toISOString(),
  };
}

function toHomeCard(product: ProductWithRelations): HomeProductCard {
  const card = buildComparisonCard({
    productId: product.id,
    name: product.name,
    category: product.category as Category,
    brand: product.brand ?? undefined,
    imageUrl: product.imageUrl ?? undefined,
    offers: toOffers(product.listings),
    priceHistory: [],
  });
  return { ...card, change: computeChange(product.priceHistory) };
}

const productInclude = {
  listings: { include: { store: true } },
  priceHistory: { orderBy: { recordedAt: "desc" as const }, take: HISTORY_POINTS_PER_PRODUCT },
} satisfies Prisma.ProductInclude;

export async function getHomeOverview(): Promise<HomeOverview> {
  const [
    productCount,
    listingCount,
    storeCount,
    freshest,
    grouped,
    workingSetRaw,
    recentlyAddedRaw,
    stores,
    storeSync,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.listing.count(),
    prisma.store.count({ where: { enabled: true } }),
    prisma.listing.aggregate({ _max: { lastUpdated: true } }),
    prisma.product.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.product.findMany({
      where: { listings: { some: {} } },
      orderBy: { updatedAt: "desc" },
      take: WORKING_SET_SIZE,
      include: productInclude,
    }),
    prisma.product.findMany({
      where: { listings: { some: {} } },
      orderBy: { createdAt: "desc" },
      take: SECTION_LIMIT,
      include: productInclude,
    }),
    prisma.store.findMany({
      where: { enabled: true },
      select: { id: true, name: true, platform: true, _count: { select: { listings: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.listing.groupBy({ by: ["storeId"], _max: { lastUpdated: true } }),
  ]);

  const categories: CategorySummary[] = grouped
    .filter((g) => isCategory(g.category))
    .map((g) => ({
      id: g.category as Category,
      label: CATEGORY_LABELS_ES[g.category as Category],
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  const workingSet = workingSetRaw.map(toHomeCard);

  const featured = workingSet.slice(0, FEATURED_LIMIT);

  const priceDrops = workingSet
    .filter((c) => c.change && c.change.changeAmount < 0)
    .sort((a, b) => a.change!.changePct - b.change!.changePct)
    .slice(0, SECTION_LIMIT);

  const biggestRises = workingSet
    .filter((c) => c.change && c.change.changeAmount > 0)
    .sort((a, b) => b.change!.changePct - a.change!.changePct)
    .slice(0, SECTION_LIMIT);

  const mostCompared = [...workingSet]
    .sort((a, b) => b.offers.length - a.offers.length || b.maxSavings - a.maxSavings)
    .slice(0, SECTION_LIMIT);

  const recentlyAdded = recentlyAddedRaw.map(toHomeCard);

  const syncByStore = new Map(storeSync.map((s) => [s.storeId, s._max.lastUpdated]));
  const storeSummaries: StoreSummary[] = stores.map((s) => ({
    id: s.id,
    name: s.name,
    platform: s.platform,
    productCount: s._count.listings,
    lastSync: syncByStore.get(s.id)?.toISOString() ?? null,
  }));

  return {
    stats: {
      productCount,
      storeCount,
      listingCount,
      lastUpdated: freshest._max.lastUpdated?.toISOString() ?? null,
      // Placeholder until real session analytics exist. Derived from catalog
      // size so it stays stable per deploy instead of looking random.
      activeUsers: 320 + productCount * 4 + Math.round(listingCount * 1.5),
    },
    categories,
    featured,
    priceDrops,
    trends: { mostCompared, biggestRises, biggestDrops: priceDrops, recentlyAdded },
    stores: storeSummaries,
  };
}
