import { notFound } from "next/navigation";
import { PriceHistoryChart } from "@/components/PriceHistoryChart";
import { PriceTable } from "@/components/PriceTable";
import { getProduct } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";

export const revalidate = 30;

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const card = await getProduct(params.id);
  if (!card) notFound();

  const currency = card.offers[0]?.currency ?? "UYU";

  return (
    <div>
      <div className="product-detail__header">
        <div className="product-detail__image">
          {card.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.imageUrl} alt={card.name} />
          ) : (
            <div className="product-card__image-placeholder" aria-hidden />
          )}
        </div>
        <div className="product-detail__info">
          <h1>{card.name}</h1>
          <div className="stat-row">
            <div className="stat">
              <div className="stat__label">Precio mas bajo</div>
              <div className="stat__value stat__value--good">{formatPrice(card.lowestPrice, currency)}</div>
            </div>
            <div className="stat">
              <div className="stat__label">Precio promedio</div>
              <div className="stat__value">{formatPrice(card.averagePrice, currency)}</div>
            </div>
            <div className="stat">
              <div className="stat__label">Precio mas alto</div>
              <div className="stat__value">{formatPrice(card.highestPrice, currency)}</div>
            </div>
            <div className="stat">
              <div className="stat__label">Ahorro maximo</div>
              <div className="stat__value stat__value--good">
                {formatPrice(card.maxSavings, currency)} ({card.maxSavingsPct}%)
              </div>
            </div>
          </div>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            Ultima actualizacion: {formatDate(card.lastUpdated)}
          </p>
        </div>
      </div>

      <section className="panel">
        <h2>Precios por tienda</h2>
        <PriceTable offers={card.offers} cheapestStoreId={card.cheapestStoreId} />
      </section>

      <section className="panel">
        <h2>Historial de precios</h2>
        <PriceHistoryChart history={card.priceHistory} offers={card.offers} />
      </section>
    </div>
  );
}
