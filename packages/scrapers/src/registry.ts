import type { ScraperPlatform, StoreConfig } from "@techprice/shared";
import type { ScraperFactory, StoreScraper } from "./types.js";
import { TiendanubeScraper } from "./platforms/tiendanube.js";
import { WooCommerceScraper } from "./platforms/woocommerce.js";
import { VtexScraper } from "./platforms/vtex.js";
import { GenericHtmlScraper } from "./platforms/genericHtml.js";

/**
 * This map is the ONLY place platform implementations are wired together.
 * Adding a store on an existing platform never touches this file — only
 * stores.config.ts. Adding a genuinely new platform means writing one class
 * implementing StoreScraper and adding one line here.
 */
const PLATFORM_FACTORIES: Record<ScraperPlatform, ScraperFactory> = {
  tiendanube: (config) => new TiendanubeScraper(config),
  woocommerce: (config) => new WooCommerceScraper(config),
  vtex: (config) => new VtexScraper(config),
  generic_html: (config) => new GenericHtmlScraper(config),
};

export function createScraper(config: StoreConfig): StoreScraper {
  const factory = PLATFORM_FACTORIES[config.platform];
  if (!factory) {
    throw new Error(`No scraper implementation registered for platform "${config.platform}"`);
  }
  return factory(config);
}
