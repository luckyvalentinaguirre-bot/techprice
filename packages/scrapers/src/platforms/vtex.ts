import type { RawProduct, StoreConfig } from "@techprice/shared";
import type { StoreScraper } from "../types.js";
import { delay, fetchJson } from "../utils/http.js";
import { isExcludedProduct } from "../utils/exclude.js";

/**
 * VTEX's Search API (/api/catalog_system/pub/products/search) is public on
 * any VTEX storefront. We page through it with the `fq=C:/{categoryId}/`
 * category filter, which several larger Uruguayan tech retailers run on.
 */
interface VtexSeller {
  commertOffer: { Price: number; AvailableQuantity: number };
}

interface VtexItem {
  images: { imageUrl: string }[];
  sellers: VtexSeller[];
}

interface VtexProduct {
  productId: string;
  productName: string;
  link: string;
  categories: string[];
  items: VtexItem[];
}

const PAGE_SIZE = 50;

export class VtexScraper implements StoreScraper {
  constructor(readonly config: StoreConfig) {}

  async *fetchProducts(): AsyncGenerator<RawProduct> {
    for (const mapping of this.config.categoryMappings) {
      yield* this.fetchCategory(mapping.storeCategoryRef, mapping.category);
      await delay(this.config.requestDelayMs ?? 500);
    }
  }

  private async *fetchCategory(categoryId: string, category: RawProduct["category"]): AsyncGenerator<RawProduct> {
    let from = 0;

    while (true) {
      const to = from + PAGE_SIZE - 1;
      const url = `${this.config.baseUrl.replace(/\/$/, "")}/api/catalog_system/pub/products/search?fq=C:/${encodeURIComponent(categoryId)}/&_from=${from}&_to=${to}`;
      let products: VtexProduct[];
      try {
        products = await fetchJson<VtexProduct[]>(url);
      } catch {
        break; // VTEX returns 404 once the range is past the last page
      }
      if (!products || products.length === 0) break;

      for (const product of products) {
        if (isExcludedProduct(product.productName, this.config.excludeKeywords)) continue;

        const item = product.items[0];
        const seller = item?.sellers[0];
        if (!seller) continue;

        yield {
          storeId: this.config.id,
          externalId: product.productId,
          name: product.productName,
          price: seller.commertOffer.Price,
          currency: this.config.currency,
          url: product.link,
          imageUrl: item?.images[0]?.imageUrl,
          available: seller.commertOffer.AvailableQuantity > 0,
          category,
          rawCategoryPath: product.categories[0],
          scrapedAt: new Date().toISOString(),
        };
      }

      if (products.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    }
  }
}
