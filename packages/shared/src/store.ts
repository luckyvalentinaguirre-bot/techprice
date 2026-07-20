import type { Category } from "./category.js";

/**
 * Supported scraping strategies. New stores are added by picking one of
 * these (or implementing a new one) — the comparison engine, matcher and API
 * never need to change when a store is added.
 */
export const SCRAPER_PLATFORMS = [
  "tiendanube", // Nuvemshop/Tiendanube storefront JSON (/products.json)
  "woocommerce", // WooCommerce Store API (/wp-json/wc/store/v1/products)
  "vtex", // VTEX Search API (catalog_system/pub/products/search)
  "generic_html", // configurable CSS-selector scraper (cheerio) fallback
] as const;

export type ScraperPlatform = (typeof SCRAPER_PLATFORMS)[number];

/** Maps a store's own category/collection identifier to our canonical Category. */
export interface StoreCategoryMapping {
  /** Category/collection id, handle, slug or search term as used by the store. */
  storeCategoryRef: string;
  category: Category;
}

export interface GenericHtmlSelectors {
  listUrlTemplate: string; // e.g. "https://store.uy/categoria/{ref}?page={page}"
  productItem: string;
  name: string;
  price: string;
  url: string;
  image?: string;
  availability?: string;
  nextPage?: string;
}

export interface StoreConfig {
  id: string; // stable slug, primary key in DB
  name: string;
  baseUrl: string;
  platform: ScraperPlatform;
  currency: "UYU" | "USD";
  categoryMappings: StoreCategoryMapping[];
  /**
   * Terms that, if found in a product's name/description/category path,
   * mark it as a pre-built/pre-configured computer or bundle and exclude it
   * from ingestion regardless of category mapping.
   */
  excludeKeywords?: string[];
  /** Only used when platform === "generic_html". */
  htmlSelectors?: GenericHtmlSelectors;
  /** Polite crawling: ms to wait between requests to this store. */
  requestDelayMs?: number;
  enabled: boolean;
}
