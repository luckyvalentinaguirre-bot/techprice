import { describe, expect, it } from "vitest";
import { buildComparisonCard } from "./comparisonEngine.js";

describe("buildComparisonCard", () => {
  it("computes min/avg/max, difference and max savings across stores", () => {
    const card = buildComparisonCard({
      productId: "prod-1",
      name: "ASUS Dual RTX 5070 OC 12GB",
      category: "gpu",
      offers: [
        { storeId: "a", storeName: "Store A", price: 45000, currency: "UYU", url: "https://a", available: true, lastUpdated: "2026-07-18T10:00:00.000Z" },
        { storeId: "b", storeName: "Store B", price: 42000, currency: "UYU", url: "https://b", available: true, lastUpdated: "2026-07-19T10:00:00.000Z" },
        { storeId: "c", storeName: "Store C", price: 48000, currency: "UYU", url: "https://c", available: true, lastUpdated: "2026-07-20T10:00:00.000Z" },
      ],
      priceHistory: [],
    });

    expect(card.lowestPrice).toBe(42000);
    expect(card.highestPrice).toBe(48000);
    expect(card.averagePrice).toBeCloseTo(45000);
    expect(card.priceDifference).toBe(6000);
    expect(card.maxSavings).toBe(6000);
    expect(card.cheapestStoreId).toBe("b");
    expect(card.lastUpdated).toBe("2026-07-20T10:00:00.000Z");
    expect(card.offers[0].storeId).toBe("b"); // sorted cheapest first
  });

  it("ignores out-of-stock offers when computing price stats unless all are out of stock", () => {
    const card = buildComparisonCard({
      productId: "prod-1",
      name: "Product",
      category: "gpu",
      offers: [
        { storeId: "a", storeName: "Store A", price: 30000, currency: "UYU", url: "https://a", available: false, lastUpdated: "2026-07-18T10:00:00.000Z" },
        { storeId: "b", storeName: "Store B", price: 40000, currency: "UYU", url: "https://b", available: true, lastUpdated: "2026-07-19T10:00:00.000Z" },
      ],
      priceHistory: [],
    });

    expect(card.lowestPrice).toBe(40000);
    expect(card.offers).toHaveLength(2);
  });
});
