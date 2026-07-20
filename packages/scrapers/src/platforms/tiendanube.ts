import type { RawProduct, StoreCategoryMapping, StoreConfig } from "@techprice/shared";
import type { StoreScraper } from "../types.js";
import { delay, fetchJson } from "../utils/http.js";
import { isExcludedProduct } from "../utils/exclude.js";

/**
 * Tiendanube/Nuvemshop storefronts expose a public, unauthenticated product
 * feed at /products.json?page=N (the same convention Shopify uses), so no
 * HTML scraping or API key is needed. This is the dominant SMB e-commerce
 * platform in Uruguay, so a single adapter here covers many stores — adding
 * one of them is just a StoreConfig entry with platform: "tiendanube".
 */
interface TiendanubeProduct {
  id: number;
  name: Record<string, string>;
  categories: { id: number; name: Record<string, string> }[];
  variants: { id: number; price: string; stock_management: boolean; stock: number | null }[];
  images: { src: string }[];
  permalink: string;
}

function firstLocalized(value: Record<string, string>): string {
  return value.es ?? value.pt ?? value.en ?? Object.values(value)[0] ?? "";
}

export class TiendanubeScraper implements StoreScraper {
  constructor(readonly config: StoreConfig) {}

  async *fetchProducts(): AsyncGenerator<RawProduct> {
    const perPage = 50;
    let page = 1;

    while (true) {
      const url = `${this.config.baseUrl.replace(/\/$/, "")}/products.json?page=${page}&per_page=${perPage}`;
      const products = await fetchJson<TiendanubeProduct[]>(url);
      if (!products || products.length === 0) break;

      for (const product of products) {
        const mapping = this.matchCategory(product);
        if (!mapping) continue;

        const name = firstLocalized(product.name);
        if (isExcludedProduct(name, this.config.excludeKeywords)) continue;

        const variant = product.variants[0];
        if (!variant) continue;

        yield {
          storeId: this.config.id,
          externalId: String(product.id),
          name,
          price: parseFloat(variant.price),
          currency: this.config.currency,
          url: product.permalink,
          imageUrl: product.images[0]?.src,
          available: variant.stock === null ? true : variant.stock > 0,
          category: mapping.category,
          rawCategoryPath: product.categories.map((c) => firstLocalized(c.name)).join(" > "),
          scrapedAt: new Date().toISOString(),
        };
      }

      if (products.length < perPage) break;
      page++;
      await delay(this.config.requestDelayMs ?? 500);
    }
  }

  private matchCategory(product: TiendanubeProduct): StoreCategoryMapping | undefined {
    for (const category of product.categories) {
      const ref = String(category.id);
      const name = firstLocalized(category.name).toLowerCase();
      const found = this.config.categoryMappings.find(
        (m) => m.storeCategoryRef === ref || m.storeCategoryRef.toLowerCase() === name,
      );
      if (found) return found;
    }
    return undefined;
  }
}
