import Link from "next/link";
import type { HomeProductCard, HomeTrends } from "@techprice/shared";
import { formatPct, formatPrice } from "@/lib/format";
import { Icon, type IconName } from "./Icon";

interface Row {
  productId: string;
  name: string;
  sub: string;
  value: string;
  valueClass?: string;
}

function currencyOf(card: HomeProductCard): string {
  return card.offers[0]?.currency ?? "UYU";
}

function TrendColumn({
  title,
  icon,
  headModifier,
  rows,
}: {
  title: string;
  icon: IconName;
  headModifier: string;
  rows: Row[];
}) {
  return (
    <div className="trend-col">
      <div className={`trend-col__head ${headModifier}`}>
        <span className="ico">
          <Icon name={icon} />
        </span>
        {title}
      </div>
      {rows.length === 0 ? (
        <p className="trend-item__sub">Sin datos por ahora.</p>
      ) : (
        <ol className="trend-list">
          {rows.map((row, i) => (
            <li key={row.productId} className="trend-item">
              <span className="trend-item__rank">{i + 1}</span>
              <Link href={`/productos/${row.productId}`} className="trend-item__body">
                <span className="trend-item__name">{row.name}</span>
                <span className="trend-item__sub">{row.sub}</span>
              </Link>
              <span className={`trend-item__val ${row.valueClass ?? ""}`}>{row.value}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function TrendsSection({ trends }: { trends: HomeTrends }) {
  const mostCompared: Row[] = trends.mostCompared.map((c) => ({
    productId: c.productId,
    name: c.name,
    sub: formatPrice(c.lowestPrice, currencyOf(c)),
    value: `${c.offers.length} ${c.offers.length === 1 ? "tienda" : "tiendas"}`,
  }));

  const biggestRises: Row[] = trends.biggestRises.map((c) => ({
    productId: c.productId,
    name: c.name,
    sub: formatPrice(c.change?.currentPrice ?? c.lowestPrice, currencyOf(c)),
    value: c.change ? formatPct(c.change.changePct) : "—",
    valueClass: "val--neg",
  }));

  const biggestDrops: Row[] = trends.biggestDrops.map((c) => ({
    productId: c.productId,
    name: c.name,
    sub: formatPrice(c.change?.currentPrice ?? c.lowestPrice, currencyOf(c)),
    value: c.change ? formatPct(c.change.changePct) : "—",
    valueClass: "val--pos",
  }));

  const recentlyAdded: Row[] = trends.recentlyAdded.map((c) => ({
    productId: c.productId,
    name: c.name,
    sub: `${c.offers.length} ${c.offers.length === 1 ? "tienda" : "tiendas"}`,
    value: formatPrice(c.lowestPrice, currencyOf(c)),
  }));

  return (
    <div className="trends-grid">
      <TrendColumn title="Más comparados" icon="flame" headModifier="trend-col__head--hot" rows={mostCompared} />
      <TrendColumn title="Mayor subida" icon="trendingUp" headModifier="trend-col__head--up" rows={biggestRises} />
      <TrendColumn title="Mayor bajada" icon="trendingDown" headModifier="trend-col__head--down" rows={biggestDrops} />
      <TrendColumn title="Recién agregados" icon="plus" headModifier="" rows={recentlyAdded} />
    </div>
  );
}
