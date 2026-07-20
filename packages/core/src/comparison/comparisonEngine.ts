import type { Category, ComparisonCard, PriceHistoryPoint, StoreOffer } from "@techprice/shared";

export interface ComparisonInput {
  productId: string;
  name: string;
  category: Category;
  brand?: string;
  imageUrl?: string;
  offers: StoreOffer[];
  priceHistory: PriceHistoryPoint[];
}

/**
 * Builds the full comparison card for a canonical product: lowest/average/
 * highest price across current store offers, the price gap and maximum
 * possible savings buying from the cheapest store instead of the priciest.
 * Only offers currently in stock are used for the price stats — an offer
 * that's out of stock is still shown, but doesn't set the "lowest price".
 */
export function buildComparisonCard(input: ComparisonInput): ComparisonCard {
  if (input.offers.length === 0) {
    throw new Error(`Cannot build a comparison card for product ${input.productId} with no offers`);
  }

  const pricedOffers = input.offers.filter((o) => o.available);
  const referenceOffers = pricedOffers.length > 0 ? pricedOffers : input.offers;

  const prices = referenceOffers.map((o) => o.price);
  const lowestPrice = Math.min(...prices);
  const highestPrice = Math.max(...prices);
  const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  const cheapestOffer = referenceOffers.find((o) => o.price === lowestPrice) ?? referenceOffers[0]!;
  const priceDifference = highestPrice - lowestPrice;
  const maxSavingsPct = highestPrice > 0 ? (priceDifference / highestPrice) * 100 : 0;

  const lastUpdated = input.offers.reduce(
    (latest, offer) => (offer.lastUpdated > latest ? offer.lastUpdated : latest),
    input.offers[0]!.lastUpdated,
  );

  return {
    productId: input.productId,
    name: input.name,
    category: input.category,
    brand: input.brand,
    imageUrl: input.imageUrl,
    offers: [...input.offers].sort((a, b) => a.price - b.price),
    lowestPrice,
    averagePrice: Math.round(averagePrice * 100) / 100,
    highestPrice,
    priceDifference,
    maxSavings: priceDifference,
    maxSavingsPct: Math.round(maxSavingsPct * 100) / 100,
    cheapestStoreId: cheapestOffer.storeId,
    priceHistory: [...input.priceHistory].sort((a, b) => a.date.localeCompare(b.date)),
    lastUpdated,
  };
}
