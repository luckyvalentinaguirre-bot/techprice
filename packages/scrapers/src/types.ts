import type { RawProduct, StoreConfig } from "@techprice/shared";

/**
 * Every store integration — regardless of platform — implements this single
 * interface. The rest of the system (ingestion pipeline, matcher, API) only
 * ever depends on this, never on a specific platform. Adding a store that
 * runs on an already-supported platform requires zero new code: just a new
 * entry in stores.config.ts. A genuinely new platform means implementing
 * this interface once in src/platforms/ and registering it in registry.ts.
 */
export interface StoreScraper {
  readonly config: StoreConfig;
  fetchProducts(): AsyncGenerator<RawProduct>;
}

export type ScraperFactory = (config: StoreConfig) => StoreScraper;
