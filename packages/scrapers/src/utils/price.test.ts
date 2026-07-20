import { describe, expect, it } from "vitest";
import { parsePriceUYU } from "./price.js";

describe("parsePriceUYU", () => {
  it("parses dot-thousands prices", () => {
    expect(parsePriceUYU("$ 45.990")).toBe(45990);
  });
  it("parses dot-thousands + comma-decimal prices", () => {
    expect(parsePriceUYU("U$S 1.234,50")).toBe(1234.5);
  });
  it("parses plain integer prices", () => {
    expect(parsePriceUYU("45990")).toBe(45990);
  });
  it("parses comma-decimal prices", () => {
    expect(parsePriceUYU("399,99")).toBeCloseTo(399.99);
  });
});
