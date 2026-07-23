import Link from "next/link";
import type { HomeProductCard } from "@techprice/shared";
import { formatPrice, formatPct, formatRelative } from "@/lib/format";
import { Icon } from "./Icon";

export function PriceDropCard({ card }: { card: HomeProductCard }) {
  const currency = card.offers[0]?.currency ?? "UYU";
  const change = card.change;
  if (!change) return null;
  const saved = Math.abs(change.changeAmount);

  return (
    <Link href={`/productos/${card.productId}`} className="drop-card">
      <div className="drop-card__thumb">
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt={card.name} loading="lazy" />
        ) : (
          <span className="showcase-card__placeholder">
            <Icon name="box" size={20} />
          </span>
        )}
      </div>

      <div className="drop-card__body">
        <span className="drop-card__pct">
          <Icon name="trendingDown" size={13} />
          {formatPct(change.changePct)}
        </span>
        <p className="drop-card__name">{card.name}</p>
        <div className="drop-card__prices">
          <span className="drop-card__now">{formatPrice(change.currentPrice, currency)}</span>
          <span className="drop-card__was">{formatPrice(change.previousPrice, currency)}</span>
        </div>
        <div className="drop-card__foot">
          <span className="drop-card__saved">
            Ahorrás <b>{formatPrice(saved, currency)}</b>
          </span>
          <span>{formatRelative(change.changedAt)}</span>
        </div>
      </div>
    </Link>
  );
}
