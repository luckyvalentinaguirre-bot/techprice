import type { Category, NormalizedProduct, ProductAttributes } from "@techprice/shared";
import { jaccardSimilarity } from "./similarity.js";

/** Minimal shape of an already-canonical product needed to score a match against it. */
export interface MatchCandidate {
  productId: string;
  category: Category;
  tokens: string[];
  attributes: ProductAttributes;
}

export type MatchReason = "exact_model" | "fuzzy" | "no_match";

export interface MatchResult {
  productId: string | null;
  score: number;
  reason: MatchReason;
}

/** Below this score, two listings are treated as different products. */
export const MATCH_THRESHOLD = 0.72;

function compareOptional(a: unknown, b: unknown): boolean | undefined {
  if (a === undefined || a === null || b === undefined || b === null) return undefined;
  return a === b;
}

function scorePair(candidate: NormalizedProduct, product: MatchCandidate): { score: number; reason: MatchReason } {
  const brandMatch = compareOptional(candidate.attributes.brand, product.attributes.brand);
  const modelMatch = compareOptional(candidate.attributes.model, product.attributes.model);

  if (modelMatch === true && brandMatch !== false) {
    const capacityMatch = compareOptional(candidate.attributes.capacityGb, product.attributes.capacityGb);
    if (capacityMatch === false) {
      // Same chip/series but a different capacity SKU (e.g. RTX 5070 8GB vs 12GB
      // doesn't really happen, but RAM/SSD do) -> not the same product.
      return { score: 0.5, reason: "fuzzy" };
    }
    return { score: 1, reason: "exact_model" };
  }

  if (modelMatch === false) {
    return { score: 0, reason: "no_match" };
  }

  let score = jaccardSimilarity(candidate.tokens, product.tokens);
  if (brandMatch === true) score += 0.15;
  if (brandMatch === false) score -= 0.4;

  const capacityMatch = compareOptional(candidate.attributes.capacityGb, product.attributes.capacityGb);
  if (capacityMatch === true) score += 0.1;
  if (capacityMatch === false) score -= 0.35;

  score = Math.max(0, Math.min(1, score));
  return { score, reason: "fuzzy" };
}

/**
 * Finds the best existing canonical product this normalized listing should
 * be attached to, restricted to candidates in the same category (a GPU can
 * never match a keyboard). Returns productId: null when nothing clears the
 * threshold, meaning the caller should create a new canonical product.
 */
export function findBestMatch(candidate: NormalizedProduct, existing: MatchCandidate[]): MatchResult {
  let best: MatchResult = { productId: null, score: 0, reason: "no_match" };

  for (const product of existing) {
    if (product.category !== candidate.category) continue;
    const { score, reason } = scorePair(candidate, product);
    if (score > best.score) {
      best = { productId: product.productId, score, reason };
    }
  }

  if (best.score < MATCH_THRESHOLD) {
    return { productId: null, score: best.score, reason: "no_match" };
  }
  return best;
}
