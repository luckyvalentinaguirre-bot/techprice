import type { Category } from "@techprice/shared";
import { alnumOnly } from "./text.js";

/**
 * Category-specific regexes that pull out the actual chip/series code from a
 * product name — the part that MUST match for two listings to be the same
 * product, independent of word order, spacing or cooler/edition marketing
 * (e.g. "RTX 5070" in "ASUS Dual RTX 5070 OC 12GB" and "RTX5070 ASUS Dual OC").
 */
const MODEL_PATTERNS: Partial<Record<Category, RegExp[]>> = {
  gpu: [
    /rtx\s?(\d{3,5})\s?(ti\s?super|ti|super)?/i,
    /gtx\s?(\d{3,5})\s?(ti|super)?/i,
    /rx\s?(\d{3,5})\s?(xtx|xt|gre)?/i,
    /arc\s?(a\d{3,4}|b\d{3,4})/i,
  ],
  cpu: [
    /(core\s?)?i[3579]\s?-?\s?(\d{4,5})\s?([a-z]{0,3})/i,
    /ryzen\s?([3579])\s?(\d{4})\s?([a-z]{0,3})/i,
    /ryzen\s?(threadripper)\s?(\d{4})\s?([a-z]{0,3})/i,
  ],
  motherboard: [/[a-z]\d{3,4}[a-z]{0,3}(-[a-z0-9]+)?/i],
  console: [/(ps5|ps4|playstation\s?[45]|xbox\s?series\s?[xs]|xbox\s?one|switch\s?2|switch)/i],
};

export function extractModel(category: Category, cleanedName: string): string | undefined {
  const patterns = MODEL_PATTERNS[category];
  if (!patterns) return undefined;
  for (const pattern of patterns) {
    const match = cleanedName.match(pattern);
    if (match) {
      return alnumOnly(match[0]);
    }
  }
  return undefined;
}

/** Capacity in GB, parsed from tokens like "16gb", "1tb", "512mb". */
export function extractCapacityGb(cleanedName: string): number | undefined {
  const tbMatch = cleanedName.match(/(\d+(?:\.\d+)?)tb\b/);
  if (tbMatch?.[1]) return parseFloat(tbMatch[1]) * 1024;
  const gbMatch = cleanedName.match(/(\d+)gb\b/);
  if (gbMatch?.[1]) return parseInt(gbMatch[1], 10);
  const mbMatch = cleanedName.match(/(\d+)mb\b/);
  if (mbMatch?.[1]) return parseInt(mbMatch[1], 10) / 1024;
  return undefined;
}

/** RAM/GPU memory speed or clock in MHz, e.g. "6000mhz", "3200mhz". */
export function extractSpeedMhz(cleanedName: string): number | undefined {
  const match = cleanedName.match(/(\d{3,5})mhz\b/);
  return match?.[1] ? parseInt(match[1], 10) : undefined;
}

/** DDR generation for RAM, e.g. "ddr5", "ddr4". */
export function extractMemoryType(cleanedName: string): string | undefined {
  const match = cleanedName.match(/ddr\s?([2345])/);
  return match?.[1] ? `ddr${match[1]}` : undefined;
}

/** Screen size in inches for monitors, e.g. 27", 24 pulgadas. */
export function extractScreenInches(cleanedName: string): number | undefined {
  const match = cleanedName.match(/(\d{2}(?:\.\d)?)(?:"|pulgadas?)\b/);
  return match?.[1] ? parseFloat(match[1]) : undefined;
}
