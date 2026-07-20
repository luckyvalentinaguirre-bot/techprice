import * as cheerio from "cheerio";
import type { RawProduct, StoreConfig } from "@techprice/shared";
import type { StoreScraper } from "../types.js";
import { delay, fetchText } from "../utils/http.js";
import { isExcludedProduct } from "../utils/exclude.js";
import { parsePriceUYU } from "../utils/price.js";

const MAX_PAGES = 50;

/**
 * Fallback for stores that don't run on a platform with a public product
 * API: scrapes rendered category pages with configurable CSS selectors
 * (StoreConfig.htmlSelectors). More brittle than the JSON-API adapters —
 * prefer tiendanube/woocommerce/vtex whenever the store supports one of
 * those. Only handles static/server-rendered HTML, not client-rendered SPAs.
 */
export class GenericHtmlScraper implements StoreScraper {
  constructor(readonly config: StoreConfig) {
    if (!config.htmlSelectors) {
      throw new Error(`Store ${config.id} uses generic_html but has no htmlSelectors configured`);
    }
  }

  async *fetchProducts(): AsyncGenerator<RawProduct> {
    const selectors = this.config.htmlSelectors!;

    for (const mapping of this.config.categoryMappings) {
      for (let page = 1; page <= MAX_PAGES; page++) {
        const url = selectors.listUrlTemplate
          .replace("{ref}", mapping.storeCategoryRef)
          .replace("{page}", String(page));

        const html = await fetchText(url);
        const $ = cheerio.load(html);
        const items = $(selectors.productItem);
        if (items.length === 0) break;

        items.each((_, el) => {
          const node = $(el);
          const name = node.find(selectors.name).first().text().trim();
          const priceText = node.find(selectors.price).first().text().trim();
          const href = node.find(selectors.url).first().attr("href") ?? "";
          const image = selectors.image ? node.find(selectors.image).first().attr("src") : undefined;
          const availabilityText = selectors.availability
            ? node.find(selectors.availability).first().text().trim().toLowerCase()
            : undefined;

          if (!name || !priceText) return;
          if (isExcludedProduct(name, this.config.excludeKeywords)) return;

          const price = parsePriceUYU(priceText);
          if (!Number.isFinite(price)) return;

          const productUrl = href.startsWith("http") ? href : new URL(href, this.config.baseUrl).toString();
          const available = availabilityText
            ? !/agotado|sin stock|no disponible|out of stock/.test(availabilityText)
            : true;

          this.pending.push({
            storeId: this.config.id,
            externalId: productUrl,
            name,
            price,
            currency: this.config.currency,
            url: productUrl,
            imageUrl: image,
            available,
            category: mapping.category,
            scrapedAt: new Date().toISOString(),
          });
        });

        yield* this.drain();

        const hasNext = selectors.nextPage ? $(selectors.nextPage).length > 0 : items.length > 0;
        if (!hasNext) break;
        await delay(this.config.requestDelayMs ?? 800);
      }
    }
  }

  private pending: RawProduct[] = [];

  private *drain(): Generator<RawProduct> {
    while (this.pending.length > 0) {
      yield this.pending.shift()!;
    }
  }
}
