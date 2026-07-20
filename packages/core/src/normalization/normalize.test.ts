import { describe, expect, it } from "vitest";
import type { RawProduct } from "@techprice/shared";
import { normalizeProduct } from "./normalize.js";

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

describe("normalizeProduct", () => {
  it("extracts a consistent GPU model regardless of word order/spacing", () => {
    const variants = [
      "ASUS Dual RTX 5070 OC 12GB",
      "Asus RTX5070 Dual OC",
      "RTX 5070 ASUS Dual OC",
    ];
    const results = variants.map((name) => normalizeProduct(makeRaw(name)));

    for (const result of results) {
      expect(result.attributes.brand).toBe("asus");
      expect(result.attributes.model).toBe("rtx5070");
    }
  });

  it("distinguishes RTX 5070 from RTX 5070 Ti", () => {
    const base = normalizeProduct(makeRaw("ASUS Dual RTX 5070 OC 12GB"));
    const ti = normalizeProduct(makeRaw("ASUS Dual RTX 5070 Ti OC 16GB"));
    expect(base.attributes.model).not.toBe(ti.attributes.model);
  });

  it("extracts RAM attributes (capacity, speed, type)", () => {
    const result = normalizeProduct(
      makeRaw("Kingston Fury Beast 16GB DDR5 6000MHz", { category: "ram" }),
    );
    expect(result.attributes.brand).toBe("kingston");
    expect(result.attributes.capacityGb).toBe(16);
    expect(result.attributes.memoryType).toBe("ddr5");
    expect(result.attributes.speedMhz).toBe(6000);
  });

  it("converts TB capacity to GB", () => {
    const result = normalizeProduct(makeRaw("Samsung 990 Pro 2TB NVMe", { category: "ssd" }));
    expect(result.attributes.capacityGb).toBe(2048);
  });
});
