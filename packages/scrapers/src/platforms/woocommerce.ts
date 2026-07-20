import type { RawProduct, StoreConfig } from "@techprice/shared";
import type { StoreScraper } from "../types.js";
import { delay, fetchJson } from "../utils/http.js";
import { isExcludedProduct } from "../utils/exclude.js";

/**
 * WooCommerce's built-in Store API (/wp-json/wc/store/v1/products) is public
 * and read-only by default on any WooCommerce shop, no key required. We
 * scrape it category by category using StoreConfig.categoryMappings, which
 * both scopes requests and doubles as the individual-products-only filter.
 */
interface WooProduct {
  id: number;
  name: string;
  permalink: string;
  prices: { price: string; currency_minor_unit: number };
  images: { src: string }[];
  is_in_stock: boolean;
  categories: { id: number; name: string; slug: string }[];
}

export class WooCommerceScraper implements StoreScraper {
  constructor(readonly config: StoreConfig) {}

  async *fetchProducts(): AsyncGenerator<RawProduct> {
    for (const mapping of this.config.categoryMappings) {
      yield* this.fetchCategory(mapping.storeCategoryRef, mapping.category);
      await delay(this.config.requestDelayMs ?? 500);
    }
  }

  private async *fetchCategory(categoryRef: string, category: RawProduct["category"]): AsyncGenerator<RawProduct> {
    const perPage = 50;
    let page = 1;

    while (true) {
      const url = `${this.config.baseUrl.replace(/\/$/, "")}/wp-json/wc/store/v1/products?category=${encodeURIComponent(categoryRef)}&page=${page}&per_page=${perPage}`;
      const products = await fetchJson<WooProduct[]>(url);
      if (!products || products.length === 0) break;

      for (const product of products) {
        if (isExcludedProduct(product.name, this.config.excludeKeywords)) continue;

        const minorUnit = product.prices.currency_minor_unit ?? 2;
        const price = parseFloat(product.prices.price) / 10 ** minorUnit;

        yield {
          storeId: this.config.id,
          externalId: String(product.id),
          name: product.name,
          price,
          currency: this.config.currency,
          url: product.permalink,
          imageUrl: product.images[0]?.src,
          available: product.is_in_stock,
          category,
          rawCategoryPath: product.categories.map((c) => c.name).join(" > "),
          scrapedAt: new Date().toISOString(),
        };
      }

      if (products.length < perPage) break;
      page++;
      await delay(this.config.requestDelayMs ?? 500);
    }
  }
}
