import type { HomeStats } from "@techprice/shared";
import { formatNumber, formatRelative } from "@/lib/format";
import { Icon } from "./Icon";
import { SearchBar } from "./SearchBar";

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="statbar__item">
      <span className="statbar__value">{value}</span>
      <span className="statbar__label">{label}</span>
    </div>
  );
}

export function Hero({ stats }: { stats: HomeStats | null }) {
  return (
    <section className="hero">
      <span className="hero__eyebrow">
        <span className="dot" /> Precios de tecnología en Uruguay, en un solo lugar
      </span>

      <h1>Compará precios de tecnología en Uruguay.</h1>
      <p className="hero__subtitle">
        Encontrá el mejor precio entre múltiples tiendas y seguí la evolución del valor de cada
        producto — sin ruido, solo la información.
      </p>

      <div className="hero__search">
        <SearchBar />
      </div>

      {stats && (
        <div className="statbar" aria-label="Estado de la plataforma">
          <Stat value={formatNumber(stats.productCount)} label="Productos indexados" />
          <span className="statbar__divider" />
          <Stat value={formatNumber(stats.storeCount)} label="Tiendas" />
          <span className="statbar__divider" />
          <Stat
            value={
              <>
                <Icon name="clock" size={16} /> {formatRelative(stats.lastUpdated)}
              </>
            }
            label="Última actualización"
          />
          <span className="statbar__divider" />
          <Stat value={formatNumber(stats.activeUsers)} label="Usuarios activos" />
        </div>
      )}
    </section>
  );
}
