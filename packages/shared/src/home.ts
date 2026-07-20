import type { Category } from "./category.js";
import type { ComparisonCard } from "./product.js";

/**
 * Recent price movement for a product, derived from its price history: the
 * lowest available price on the most recent snapshot day vs the day before.
 * A negative change is a price drop (good for the buyer).
 */
export interface ProductPriceChange {
  currentPrice: number;
  previousPrice: number;
  changeAmount: number; // signed: currentPrice - previousPrice
  changePct: number; // signed percentage
  changedAt: string; // ISO date of the most recent snapshot day
}

/** A comparison card enriched with recent price movement, for the home feed. */
export interface HomeProductCard extends ComparisonCard {
  change: ProductPriceChange | null;
}

/** A category with how many canonical products it currently holds. */
export interface CategorySummary {
  id: Category;
  label: string;
  count: number;
}

/** A store with coverage + freshness info for the home "Tiendas" grid. */
export interface StoreSummary {
  id: string;
  name: string;
  platform: string;
  productCount: number;
  lastSync: string | null; // ISO timestamp of the most recent listing update
}

/** Headline numbers shown under the hero search bar. */
export interface HomeStats {
  productCount: number;
  storeCount: number;
  listingCount: number;
  lastUpdated: string | null; // ISO timestamp of the freshest listing
  /** Placeholder metric until real analytics land — see homeService. */
  activeUsers: number;
}

export interface HomeTrends {
  mostCompared: HomeProductCard[];
  biggestRises: HomeProductCard[];
  biggestDrops: HomeProductCard[];
  recentlyAdded: HomeProductCard[];
}

/** Everything the home page needs, assembled in a single request. */
export interface HomeOverview {
  stats: HomeStats;
  categories: CategorySummary[];
  featured: HomeProductCard[];
  priceDrops: HomeProductCard[];
  trends: HomeTrends;
  stores: StoreSummary[];
}
