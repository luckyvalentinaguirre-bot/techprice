import { findBestMatch, normalizeProduct, type MatchCandidate } from "@techprice/core";
import { prisma } from "@techprice/database";
import { createScraper, STORE_CONFIGS } from "@techprice/scrapers";
import type { Category, RawProduct } from "@techprice/shared";
import { isPrebuiltOrBundle } from "./filters/excludePrebuilt.js";

type CategoryCache = Partial<Record<Category, MatchCandidate[]>>;

export interface IngestionSummary {
  storeId: string;
  found: number;
  matched: number;
  created: number;
  excluded: number;
  errors: number;
}

/**
 * Runs the full ingest for one or more stores: scrape -> exclude prebuilt/
 * bundle products -> normalize -> match against (or create) a canonical
 * Product -> upsert the store's current Listing -> append a PriceHistory
 * point. Safe to re-run repeatedly (e.g. on a schedule); every write is an
 * upsert keyed on stable identifiers.
 */
export async function runIngestion(storeIds?: string[]): Promise<IngestionSummary[]> {
  const stores = STORE_CONFIGS.filter((s) => s.enabled && (!storeIds || storeIds.includes(s.id)));
  const categoryCache: CategoryCache = {};
  const summaries: IngestionSummary[] = [];

  for (const storeConfig of stores) {
    await prisma.store.upsert({
      where: { id: storeConfig.id },
      create: {
        id: storeConfig.id,
        name: storeConfig.name,
        baseUrl: storeConfig.baseUrl,
        platform: storeConfig.platform,
        enabled: storeConfig.enabled,
      },
      update: {
        name: storeConfig.name,
        baseUrl: storeConfig.baseUrl,
        platform: storeConfig.platform,
        enabled: storeConfig.enabled,
      },
    });

    const run = await prisma.scrapeRun.create({ data: { storeId: storeConfig.id, status: "running" } });
    const summary: IngestionSummary = {
      storeId: storeConfig.id,
      found: 0,
      matched: 0,
      created: 0,
      excluded: 0,
      errors: 0,
    };

    try {
      const scraper = createScraper(storeConfig);
      for await (const raw of scraper.fetchProducts()) {
        summary.found++;

        if (isPrebuiltOrBundle(raw, storeConfig.excludeKeywords)) {
          summary.excluded++;
          continue;
        }

        try {
          const created = await ingestOne(raw, categoryCache);
          if (created) summary.created++;
          else summary.matched++;
        } catch (err) {
          summary.errors++;
          console.error(`[ingestion] failed on ${raw.storeId}/${raw.externalId}:`, err);
        }
      }

      await prisma.scrapeRun.update({
        where: { id: run.id },
        data: {
          status: "success",
          finishedAt: new Date(),
          productsFound: summary.found,
          productsMatched: summary.matched,
          productsCreated: summary.created,
        },
      });
    } catch (err) {
      await prisma.scrapeRun.update({
        where: { id: run.id },
        data: { status: "failed", finishedAt: new Date(), errorMessage: String(err) },
      });
      summary.errors++;
      console.error(`[ingestion] store ${storeConfig.id} failed:`, err);
    }

    summaries.push(summary);
  }

  return summaries;
}

async function getCategoryCandidates(category: Category, cache: CategoryCache): Promise<MatchCandidate[]> {
  let candidates = cache[category];
  if (!candidates) {
    const products = await prisma.product.findMany({ where: { category } });
    candidates = products.map((p) => ({
      productId: p.id,
      category: p.category as Category,
      tokens: p.tokens,
      attributes: (p.attributes as MatchCandidate["attributes"]) ?? {},
    }));
    cache[category] = candidates;
  }
  return candidates;
}

/** Returns true if a new canonical Product was created for this listing. */
async function ingestOne(raw: RawProduct, cache: CategoryCache): Promise<boolean> {
  const normalized = normalizeProduct(raw);

  const existingListing = await prisma.listing.findUnique({
    where: { storeId_externalId: { storeId: raw.storeId, externalId: raw.externalId } },
  });

  let productId: string;
  let created = false;

  if (existingListing) {
    // Same store, same product id as before: keep the existing match even if
    // the name/attributes drifted slightly (e.g. a store tweaks its title).
    productId = existingListing.productId;
  } else {
    const alias = await prisma.productAlias.findUnique({
      where: { storeId_normalizedName: { storeId: raw.storeId, normalizedName: normalized.normalizedName } },
    });

    if (alias) {
      productId = alias.productId;
    } else {
      const candidates = await getCategoryCandidates(raw.category, cache);
      const match = findBestMatch(normalized, candidates);

      if (match.productId) {
        productId = match.productId;
      } else {
        const product = await prisma.product.create({
          data: {
            name: raw.name,
            category: raw.category,
            brand: normalized.attributes.brand,
            model: normalized.attributes.model,
            imageUrl: raw.imageUrl,
            attributes: JSON.parse(JSON.stringify(normalized.attributes)),
            tokens: normalized.tokens,
          },
        });
        productId = product.id;
        created = true;

        const list = cache[raw.category] ?? [];
        list.push({
          productId,
          category: raw.category,
          tokens: normalized.tokens,
          attributes: normalized.attributes,
        });
        cache[raw.category] = list;
      }
    }

    await prisma.productAlias.upsert({
      where: { storeId_normalizedName: { storeId: raw.storeId, normalizedName: normalized.normalizedName } },
      create: { storeId: raw.storeId, normalizedName: normalized.normalizedName, productId },
      update: { productId },
    });
  }

  await prisma.listing.upsert({
    where: { storeId_externalId: { storeId: raw.storeId, externalId: raw.externalId } },
    create: {
      productId,
      storeId: raw.storeId,
      externalId: raw.externalId,
      rawName: raw.name,
      url: raw.url,
      price: raw.price,
      currency: raw.currency,
      available: raw.available,
    },
    update: {
      productId,
      rawName: raw.name,
      url: raw.url,
      price: raw.price,
      currency: raw.currency,
      available: raw.available,
      lastUpdated: new Date(),
    },
  });

  await prisma.priceHistory.create({
    data: { productId, storeId: raw.storeId, price: raw.price, currency: raw.currency },
  });

  return created;
}
