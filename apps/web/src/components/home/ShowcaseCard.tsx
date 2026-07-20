import Link from "next/link";
import type { HomeProductCard } from "@techprice/shared";
import { formatPrice, formatRelative } from "@/lib/format";
import { AlertButton } from "./AlertButton";
import { DeltaPill } from "./DeltaPill";
import { Icon } from "./Icon";

export function ShowcaseCard({ card }: { card: HomeProductCard }) {
  const currency = card.offers[0]?.currency ?? "UYU";
  const href = `/productos/${card.productId}`;

  return (
    <article className="showcase-card">
      <Link href={href} className="showcase-card__media" aria-label={card.name}>
        {card.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.imageUrl} alt={card.name} loading="lazy" />
        ) : (
          <span className="showcase-card__placeholder">
            <Icon name="box" size={26} />
          </span>
        )}
        <DeltaPill change={card.change} />
      </Link>

      <div className="showcase-card__body">
        {card.brand && <span className="showcase-card__brand">{card.brand}</span>}
        <Link href={href}>
          <h3 className="showcase-card__name">{card.name}</h3>
        </Link>

        <div className="showcase-card__prices">
          <span className="showcase-card__price">{formatPrice(card.lowestPrice, currency)}</span>
          <span className="showcase-card__avg">
            prom. <b>{formatPrice(card.averagePrice, currency)}</b>
          </span>
        </div>

        <div className="showcase-card__meta">
          <span>
            <Icon name="store" />
            {card.offers.length} {card.offers.length === 1 ? "tienda" : "tiendas"}
          </span>
          <span>
            <Icon name="clock" />
            {formatRelative(card.lastUpdated)}
          </span>
        </div>
      </div>

      <div className="showcase-card__actions">
        <Link href={href} className="btn btn--primary">
          <Icon name="chart" size={15} /> Ver historial
        </Link>
        <AlertButton productName={card.name} />
      </div>
    </article>
  );
}
