import { buildComparisonCard } from "@techprice/core";
import { prisma, Prisma } from "@techprice/database";
import type { Category, ComparisonCard, PriceHistoryPoint, StoreOffer } from "@techprice/shared";

export interface ListProductsParams {
  category?: Category;
  search?: string;
  storeId?: string;
  page: number;
  pageSize: number;
}

export interface ListProductsResult {
  items: ComparisonCard[];
  total: number;
  page: number;
  pageSize: number;
}

function toOffers(
  listings: Array<{
    storeId: string;
    store: { name: string };
    price: number;
    currency: string;
    url: string;
    available: boolean;
    lastUpdated: Date;
  }>,
): StoreOffer[] {
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

/** List view intentionally omits price history (cheap to compute for a grid of cards). */
export async function listProducts(params: ListProductsParams): Promise<ListProductsResult> {
  const where: Prisma.ProductWhereInput = {};
  if (params.category) where.category = params.category;
  if (params.search) where.name = { contains: params.search, mode: "insensitive" };
  if (params.storeId) where.listings = { some: { storeId: params.storeId } };

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      orderBy: { updatedAt: "desc" },
      include: { listings: { include: { store: true } } },
    }),
  ]);

  const items = products
    .filter((p) => p.listings.length > 0)
    .map((p) =>
      buildComparisonCard({
        productId: p.id,
        name: p.name,
        category: p.category as Category,
        brand: p.brand ?? undefined,
        imageUrl: p.imageUrl ?? undefined,
        offers: toOffers(p.listings),
        priceHistory: [],
      }),
    );

  return { items, total, page: params.page, pageSize: params.pageSize };
}

export async function getProductCard(productId: string): Promise<ComparisonCard | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { listings: { include: { store: true } } },
  });
  if (!product || product.listings.length === 0) return null;

  const history = await prisma.priceHistory.findMany({
    where: { productId },
    orderBy: { recordedAt: "asc" },
  });

  const priceHistory: PriceHistoryPoint[] = history.map((h) => ({
    date: h.recordedAt.toISOString(),
    storeId: h.storeId,
    price: h.price,
  }));

  return buildComparisonCard({
    productId: product.id,
    name: product.name,
    category: product.category as Category,
    brand: product.brand ?? undefined,
    imageUrl: product.imageUrl ?? undefined,
    offers: toOffers(product.listings),
    priceHistory,
  });
}
