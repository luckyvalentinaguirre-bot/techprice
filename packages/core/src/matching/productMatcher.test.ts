import { describe, expect, it } from "vitest";
import type { RawProduct } from "@techprice/shared";
import { normalizeProduct } from "../normalization/normalize.js";
import { findBestMatch, type MatchCandidate } from "./productMatcher.js";

function makeRaw(name: string, overrides: Partial<RawProduct> = {}): RawProduct {
  return {
    storeId: "store-a",
    externalId: "1",
    name,
    price: 1000,
    currency: "UYU",
    url: "https://example.com/1",
    available: true,
    category: "gpu",
    scrapedAt: new Date().toISOString(),
    ...overrides,
  };
}

function toCandidate(productId: string, name: string, overrides: Partial<RawProduct> = {}): MatchCandidate {
  const normalized = normalizeProduct(makeRaw(name, overrides));
  return {
    productId,
    category: normalized.category,
    tokens: normalized.tokens,
    attributes: normalized.attributes,
  };
}

describe("findBestMatch", () => {
  it("groups the three spec example listings as the same product", () => {
    const canonical = toCandidate("prod-1", "ASUS Dual RTX 5070 OC 12GB");

    const matchA = findBestMatch(normalizeProduct(makeRaw("Asus RTX5070 Dual OC")), [canonical]);
    const matchB = findBestMatch(normalizeProduct(makeRaw("RTX 5070 ASUS Dual OC")), [canonical]);

    expect(matchA.productId).toBe("prod-1");
    expect(matchA.reason).toBe("exact_model");
    expect(matchB.productId).toBe("prod-1");
    expect(matchB.reason).toBe("exact_model");
  });

  it("does not match a different GPU model from the same brand", () => {
    const canonical = toCandidate("prod-1", "ASUS Dual RTX 5070 OC 12GB");
    const result = findBestMatch(normalizeProduct(makeRaw("ASUS Dual RTX 5060 OC 8GB")), [canonical]);
    expect(result.productId).toBeNull();
  });

  it("does not match across categories even with similar names", () => {
    const canonical = toCandidate("prod-1", "Logitech G Pro Wireless", { category: "mouse" });
    const result = findBestMatch(
      normalizeProduct(makeRaw("Logitech G Pro Wireless Headset", { category: "headset" })),
      [canonical],
    );
    expect(result.productId).toBeNull();
  });

  it("uses fuzzy token matching when no strict model pattern applies (RAM)", () => {
    const canonical = toCandidate("prod-1", "Kingston Fury Beast 16GB DDR5 6000MHz", { category: "ram" });
    const result = findBestMatch(
      normalizeProduct(makeRaw("Kingston Fury Beast DDR5 16GB 6000 MHz", { category: "ram" })),
      [canonical],
    );
    expect(result.productId).toBe("prod-1");
  });
});
