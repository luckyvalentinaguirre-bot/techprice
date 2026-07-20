import { cleanText } from "@techprice/core";

/**
 * Default keyword list used to keep pre-built/pre-configured computers and
 * bundles out of the catalog even if a store lists them under an otherwise
 * valid component category (e.g. a "PC Gamer Armada" mis-tagged under CPU).
 * Store-specific terms can be added via StoreConfig.excludeKeywords.
 */
export const DEFAULT_EXCLUDE_KEYWORDS: string[] = [
  "pc armada",
  "pc gamer armada",
  "computadora armada",
  "computador armado",
  "equipo armado",
  "equipo gamer armado",
  "pc de escritorio armada",
  "desktop armado",
  "prebuilt",
  "pre-armada",
  "pre armada",
  "setup completo",
  "combo gamer",
  "kit gamer completo",
  "pc lista para usar",
  "torre gamer armada",
];

export function isExcludedProduct(name: string, extraKeywords: string[] = []): boolean {
  const cleaned = cleanText(name);
  const keywords = [...DEFAULT_EXCLUDE_KEYWORDS, ...extraKeywords];
  return keywords.some((keyword) => cleaned.includes(cleanText(keyword)));
}
