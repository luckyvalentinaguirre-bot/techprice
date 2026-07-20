/**
 * Seeds illustrative, made-up listings across categories and demo stores so
 * a fresh deploy has something to show in the UI. These are NOT scraped
 * data — the demo store ids/prices are invented. Real ingestion happens via
 * `pnpm ingest` once stores.config.ts has verified, enabled stores.
 * Safe to re-run: every write is keyed on stable ids (upsert).
 */
import { findBestMatch, normalizeProduct, type MatchCandidate } from "@techprice/core";
import type { RawProduct } from "@techprice/shared";
import { prisma } from "./client.js";

const now = new Date();

function daysAgo(n: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
}

const demoStores = [
  { id: "demo-pcstore", name: "PC Store Uruguay (demo)", baseUrl: "https://pcstore.com.uy", platform: "generic_html" },
  { id: "demo-hardpc", name: "Hard PC (demo)", baseUrl: "https://www.hardpc.com.uy", platform: "generic_html" },
  { id: "demo-zonatecno", name: "ZonaTecno (demo)", baseUrl: "https://www.zonatecno.com.uy", platform: "tiendanube" },
  { id: "demo-nnet", name: "NNET (demo)", baseUrl: "https://www.nnet.com.uy", platform: "generic_html" },
];

interface DemoListing {
  storeId: string;
  externalId: string;
  name: string;
  price: number;
  category: RawProduct["category"];
  available: boolean;
  imageUrl?: string;
}

const demoListings: DemoListing[] = [
  { storeId: "demo-pcstore", externalId: "gpu-1", name: "ASUS Dual RTX 5070 OC 12GB", price: 745000, category: "gpu", available: true },
  { storeId: "demo-hardpc", externalId: "gpu-2", name: "Asus RTX5070 Dual OC", price: 719900, category: "gpu", available: true },
  { storeId: "demo-zonatecno", externalId: "gpu-3", name: "RTX 5070 ASUS Dual OC", price: 768000, category: "gpu", available: true },
  { storeId: "demo-pcstore", externalId: "gpu-4", name: "MSI Gaming X RTX 5060 Ti 16GB", price: 589000, category: "gpu", available: true },
  { storeId: "demo-nnet", externalId: "gpu-5", name: "MSI RTX5060 Ti Gaming X 16GB", price: 561000, category: "gpu", available: false },
  { storeId: "demo-pcstore", externalId: "cpu-1", name: "Intel Core i5-13400F", price: 289000, category: "cpu", available: true },
  { storeId: "demo-hardpc", externalId: "cpu-2", name: "Intel i5 13400F Box", price: 275000, category: "cpu", available: true },
  { storeId: "demo-zonatecno", externalId: "cpu-3", name: "Procesador Intel Core i5-13400F 10 nucleos", price: 299900, category: "cpu", available: true },
  { storeId: "demo-pcstore", externalId: "ram-1", name: "Kingston Fury Beast 16GB DDR5 6000MHz", price: 89000, category: "ram", available: true },
  { storeId: "demo-hardpc", externalId: "ram-2", name: "Kingston Fury Beast DDR5 16GB 6000 MHz", price: 84500, category: "ram", available: true },
  { storeId: "demo-nnet", externalId: "ssd-1", name: "Samsung 990 Pro 2TB NVMe", price: 349000, category: "ssd", available: true },
  { storeId: "demo-zonatecno", externalId: "ssd-2", name: "SSD Samsung 990 PRO 2TB M.2 NVMe", price: 362000, category: "ssd", available: true },
  { storeId: "demo-pcstore", externalId: "ssd-3", name: "Samsung SSD 990Pro 2TB", price: 339900, category: "ssd", available: true },
  { storeId: "demo-hardpc", externalId: "mon-1", name: "LG UltraGear 27GP850 27\" 165Hz", price: 425000, category: "monitor", available: true },
  { storeId: "demo-nnet", externalId: "mon-2", name: "Monitor LG UltraGear 27GP850 165Hz 27 pulgadas", price: 449000, category: "monitor", available: true },
  { storeId: "demo-zonatecno", externalId: "note-1", name: "Lenovo IdeaPad 3 Ryzen 5 8GB 512GB SSD", price: 899000, category: "notebook", available: true },
  { storeId: "demo-pcstore", externalId: "kb-1", name: "Logitech G Pro X Mecanico", price: 129000, category: "keyboard", available: true },
  { storeId: "demo-nnet", externalId: "kb-2", name: "Logitech GPro X Teclado Mecanico Gaming", price: 118000, category: "keyboard", available: false },
];

async function main() {
  for (const store of demoStores) {
    await prisma.store.upsert({
      where: { id: store.id },
      create: { id: store.id, name: store.name, baseUrl: store.baseUrl, platform: store.platform, enabled: true },
      update: { name: store.name, baseUrl: store.baseUrl, platform: store.platform, enabled: true },
    });
  }

  const categoryCache = new Map<string, MatchCandidate[]>();

  let i = 0;
  for (const listing of demoListings) {
    i++;
    const raw: RawProduct = {
      storeId: listing.storeId,
      externalId: listing.externalId,
      name: listing.name,
      price: listing.price,
      currency: "UYU",
      url: `${demoStores.find((s) => s.id === listing.storeId)!.baseUrl}/producto/${listing.externalId}`,
      imageUrl: listing.imageUrl,
      available: listing.available,
      category: listing.category,
      scrapedAt: now.toISOString(),
    };

    const normalized = normalizeProduct(raw);

    if (!categoryCache.has(listing.category)) {
      const existing = await prisma.product.findMany({ where: { category: listing.category } });
      categoryCache.set(
        listing.category,
        existing.map((p) => ({
          productId: p.id,
          category: p.category as RawProduct["category"],
          tokens: p.tokens,
          attributes: p.attributes as MatchCandidate["attributes"],
        })),
      );
    }
    const candidates = categoryCache.get(listing.category)!;
    const match = findBestMatch(normalized, candidates);

    let productId = match.productId;
    if (!productId) {
      const product = await prisma.product.create({
        data: {
          name: listing.name,
          category: listing.category,
          brand: normalized.attributes.brand,
          model: normalized.attributes.model,
          imageUrl: listing.imageUrl,
          attributes: JSON.parse(JSON.stringify(normalized.attributes)),
          tokens: normalized.tokens,
        },
      });
      productId = product.id;
      candidates.push({ productId, category: listing.category, tokens: normalized.tokens, attributes: normalized.attributes });
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
      update: { productId, rawName: raw.name, price: raw.price, available: raw.available, lastUpdated: now },
    });

    const historyCount = await prisma.priceHistory.count({ where: { productId, storeId: raw.storeId } });
    if (historyCount === 0) {
      for (const daysBack of [30, 20, 10, 3, 0]) {
        const jitter = 1 + Math.sin(i * 7 + daysBack) * 0.04;
        await prisma.priceHistory.create({
          data: {
            productId,
            storeId: raw.storeId,
            price: Math.round(raw.price * jitter),
            currency: raw.currency,
            recordedAt: daysAgo(daysBack),
          },
        });
      }
    }
  }

  console.log(`Seeded ${demoListings.length} demo listings across ${demoStores.length} demo stores.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
