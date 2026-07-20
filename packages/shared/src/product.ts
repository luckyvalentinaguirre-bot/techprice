import type { Category } from "./category.js";

/** A single product as scraped from one store, before normalization/matching. */
export interface RawProduct {
  storeId: string;
  externalId: string; // store's own product id/sku, must be stable across scrapes
  name: string;
  price: number;
  currency: "UYU" | "USD";
  url: string;
  imageUrl?: string;
  available: boolean;
  category: Category;
  brand?: string;
  rawCategoryPath?: string; // for debugging / re-classification
  scrapedAt: string; // ISO timestamp
}

/** RawProduct after name normalization + attribute extraction, ready for matching. */
export interface NormalizedProduct extends RawProduct {
  normalizedName: string;
  tokens: string[];
  attributes: ProductAttributes;
}

/** Structured attributes extracted from a product name, used by the matcher. */
export interface ProductAttributes {
  brand?: string;
  model?: string; // e.g. "RTX 5070", "i5-13400F", "WD Black SN850X"
  capacityGb?: number; // RAM/SSD/HDD size
  variant?: string; // e.g. "OC", "Dual", "12GB", color, size
  [key: string]: string | number | undefined;
}

/** One store's current offer for a canonical product. */
export interface StoreOffer {
  storeId: string;
  storeName: string;
  price: number;
  currency: "UYU" | "USD";
  url: string;
  available: boolean;
  lastUpdated: string; // ISO timestamp
}

export interface PriceHistoryPoint {
  date: string; // ISO date
  storeId: string;
  price: number;
}

/** The fully assembled comparison card shown for a canonical product. */
export interface ComparisonCard {
  productId: string;
  name: string;
  category: Category;
  brand?: string;
  imageUrl?: string;
  offers: StoreOffer[];
  lowestPrice: number;
  averagePrice: number;
  highestPrice: number;
  priceDifference: number; // highestPrice - lowestPrice
  maxSavings: number; // same as priceDifference, kept explicit per spec
  maxSavingsPct: number; // maxSavings / highestPrice * 100
  cheapestStoreId: string;
  priceHistory: PriceHistoryPoint[];
  lastUpdated: string; // ISO timestamp, max(offers.lastUpdated)
}
