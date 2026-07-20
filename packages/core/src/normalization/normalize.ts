import type { NormalizedProduct, ProductAttributes, RawProduct } from "@techprice/shared";
import { BRANDS, NOISE_WORDS, normalizeBrand } from "./dictionaries.js";
import {
  extractCapacityGb,
  extractMemoryType,
  extractModel,
  extractScreenInches,
  extractSpeedMhz,
} from "./modelPatterns.js";
import { alnumOnly, cleanText, tokenize } from "./text.js";

const BRAND_LOOKUP = new Set(BRANDS.map(normalizeBrand));

function detectBrand(cleanedName: string, tokens: string[]): string | undefined {
  // Multi-word brands first (e.g. "cooler master"), then single tokens.
  for (const brand of BRANDS) {
    if (brand.includes(" ") && cleanedName.includes(brand)) {
      return normalizeBrand(brand);
    }
  }
  for (const token of tokens) {
    const alnum = alnumOnly(token);
    if (BRAND_LOOKUP.has(alnum)) return alnum;
  }
  return undefined;
}

/**
 * Produces a cleaned, order-insensitive representation of a product name
 * (brand/noise words removed) used as the fallback token set for fuzzy
 * matching when no strict model code can be extracted for the category.
 */
function coreTokens(tokens: string[], brand: string | undefined): string[] {
  const noise = new Set(NOISE_WORDS);
  return tokens
    .map((t) => alnumOnly(t))
    .filter((t) => t.length > 0)
    .filter((t) => !noise.has(t))
    .filter((t) => t !== brand);
}

export function extractAttributes(raw: RawProduct, cleanedName: string, tokens: string[]): ProductAttributes {
  const brand = raw.brand ? normalizeBrand(alnumOnly(raw.brand)) : detectBrand(cleanedName, tokens);
  const model = extractModel(raw.category, cleanedName);
  const capacityGb = extractCapacityGb(cleanedName);

  const attributes: ProductAttributes = { brand, model, capacityGb };

  if (raw.category === "ram") {
    attributes.memoryType = extractMemoryType(cleanedName);
    attributes.speedMhz = extractSpeedMhz(cleanedName);
  }
  if (raw.category === "monitor") {
    attributes.screenInches = extractScreenInches(cleanedName);
  }

  return attributes;
}

export function normalizeProduct(raw: RawProduct): NormalizedProduct {
  const cleanedName = cleanText(raw.name);
  const tokens = tokenize(raw.name);
  const attributes = extractAttributes(raw, cleanedName, tokens);

  return {
    ...raw,
    normalizedName: cleanedName,
    tokens: coreTokens(tokens, attributes.brand),
    attributes,
  };
}
