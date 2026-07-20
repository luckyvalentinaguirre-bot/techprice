import { isExcludedProduct } from "@techprice/scrapers";
import type { RawProduct } from "@techprice/shared";

/**
 * Defense in depth: scraper adapters already apply the exclude-keyword check
 * before yielding a product, but this second pass runs here too, against
 * both the name and the raw category breadcrumb, in case a store changes
 * its category taxonomy and starts tagging bundles/pre-built PCs under a
 * component category the adapter didn't catch.
 */
export function isPrebuiltOrBundle(raw: RawProduct, extraKeywords: string[] = []): boolean {
  if (isExcludedProduct(raw.name, extraKeywords)) return true;
  if (raw.rawCategoryPath && isExcludedProduct(raw.rawCategoryPath, extraKeywords)) return true;
  return false;
}
