import type { StoreSummary } from "@techprice/shared";
import { formatNumber, formatRelative } from "@/lib/format";

const FRESH_WINDOW_MS = 48 * 60 * 60 * 1000;

function initials(name: string): string {
  const clean = name.replace(/\(demo\)/i, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}

function isFresh(lastSync: string | null): boolean {
  if (!lastSync) return false;
  const t = new Date(lastSync).getTime();
  return !Number.isNaN(t) && Date.now() - t < FRESH_WINDOW_MS;
}

export function StoresGrid({ stores }: { stores: StoreSummary[] }) {
  if (stores.length === 0) return null;

  return (
    <div className="stores-grid">
      {stores.map((store) => {
        const fresh = isFresh(store.lastSync);
        return (
          <div key={store.id} className="store-card">
            <div className="store-card__top">
              <span className="store-card__logo" aria-hidden>
                {initials(store.name)}
              </span>
              <div style={{ minWidth: 0 }}>
                <div className="store-card__name">{store.name}</div>
                <div className="store-card__platform">{store.platform.replace(/_/g, " ")}</div>
              </div>
            </div>
            <div className="store-card__foot">
              <span className="store-card__count">
                <b>{formatNumber(store.productCount)}</b>{" "}
                {store.productCount === 1 ? "producto" : "productos"}
              </span>
              <span
                className={`store-status ${fresh ? "store-status--ok" : "store-status--stale"}`}
                title={`Última sincronización ${formatRelative(store.lastSync)}`}
              >
                <span className="dot" />
                {fresh ? "Actualizada" : formatRelative(store.lastSync)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
