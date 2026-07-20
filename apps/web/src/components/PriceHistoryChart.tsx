import type { PriceHistoryPoint, StoreOffer } from "@techprice/shared";

const COLORS = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed", "#0891b2", "#db2777"];

const WIDTH = 640;
const HEIGHT = 220;
const PADDING = 32;

export function PriceHistoryChart({ history, offers }: { history: PriceHistoryPoint[]; offers: StoreOffer[] }) {
  if (history.length < 2) {
    return <p className="price-history__empty">Todavia no hay suficiente historial de precios para graficar.</p>;
  }

  const storeName = new Map(offers.map((o) => [o.storeId, o.storeName]));
  const byStore = new Map<string, PriceHistoryPoint[]>();
  for (const point of history) {
    const list = byStore.get(point.storeId) ?? [];
    list.push(point);
    byStore.set(point.storeId, list);
  }

  const allPrices = history.map((h) => h.price);
  const allDates = history.map((h) => new Date(h.date).getTime());
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const minDate = Math.min(...allDates);
  const maxDate = Math.max(...allDates);

  const priceRange = maxPrice - minPrice || 1;
  const dateRange = maxDate - minDate || 1;

  const x = (date: string) => PADDING + ((new Date(date).getTime() - minDate) / dateRange) * (WIDTH - 2 * PADDING);
  const y = (price: number) => HEIGHT - PADDING - ((price - minPrice) / priceRange) * (HEIGHT - 2 * PADDING);

  const stores = [...byStore.entries()];

  return (
    <div className="price-history">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Historial de precios por tienda">
        <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke="#cbd5e1" />
        <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke="#cbd5e1" />
        <text x={PADDING} y={PADDING - 8} fontSize="11" fill="#64748b">
          {new Intl.NumberFormat("es-UY").format(Math.round(maxPrice))}
        </text>
        <text x={PADDING} y={HEIGHT - PADDING + 16} fontSize="11" fill="#64748b">
          {new Intl.NumberFormat("es-UY").format(Math.round(minPrice))}
        </text>
        {stores.map(([storeId, points], i) => {
          const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
          const path = sorted.map((p) => `${x(p.date)},${y(p.price)}`).join(" ");
          const color = COLORS[i % COLORS.length];
          return (
            <g key={storeId}>
              <polyline points={path} fill="none" stroke={color} strokeWidth={2} />
              {sorted.map((p, idx) => (
                <circle key={idx} cx={x(p.date)} cy={y(p.price)} r={2.5} fill={color} />
              ))}
            </g>
          );
        })}
      </svg>
      <ul className="price-history__legend">
        {stores.map(([storeId], i) => (
          <li key={storeId}>
            <span className="price-history__swatch" style={{ background: COLORS[i % COLORS.length] }} />
            {storeName.get(storeId) ?? storeId}
          </li>
        ))}
      </ul>
    </div>
  );
}
