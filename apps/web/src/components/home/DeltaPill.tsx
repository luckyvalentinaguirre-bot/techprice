import type { ProductPriceChange } from "@techprice/shared";
import { formatPct } from "@/lib/format";
import { Icon } from "./Icon";

/** Small signed price-movement badge. Green = drop (good), red = rise. */
export function DeltaPill({ change, className }: { change: ProductPriceChange | null; className?: string }) {
  if (!change || change.changeAmount === 0) return null;
  const down = change.changeAmount < 0;
  return (
    <span className={`showcase-card__delta ${down ? "delta--down" : "delta--up"} ${className ?? ""}`}>
      <Icon name={down ? "trendingDown" : "trendingUp"} size={13} />
      {formatPct(change.changePct)}
    </span>
  );
}
