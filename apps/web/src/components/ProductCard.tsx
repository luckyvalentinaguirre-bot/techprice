import Link from "next/link";
import type { ComparisonCard } from "@techprice/shared";
import { formatPrice } from "@/lib/format";

export function ProductCard({ card }: { card: ComparisonCard }) {
  return (
    <Link href={`/productos/${card.productId}`} className="product-card">
      <div className="product-card__image">
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt={card.name} loading="lazy" />
        ) : (
          <div className="product-card__image-placeholder" aria-hidden />
        )}
      </div>
      <div className="product-card__body">
        <p className="product-card__name">{card.name}</p>
        <p className="product-card__price">{formatPrice(card.lowestPrice, card.offers[0]?.currency ?? "UYU")}</p>
        <p className="product-card__meta">
          {card.offers.length} {card.offers.length === 1 ? "tienda" : "tiendas"}
          {card.maxSavings > 0 && ` · ahorrás hasta ${formatPrice(card.maxSavings, card.offers[0]?.currency ?? "UYU")}`}
        </p>
      </div>
    </Link>
  );
}
