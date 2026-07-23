import type { HomeOverview } from "@techprice/shared";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { Hero } from "@/components/home/Hero";
import { PriceDropCard } from "@/components/home/PriceDropCard";
import { Section } from "@/components/home/Section";
import { ShowcaseCard } from "@/components/home/ShowcaseCard";
import { StoresGrid } from "@/components/home/StoresGrid";
import { TrendsSection } from "@/components/home/TrendsSection";
import { getHomeOverview } from "@/lib/api";

export const revalidate = 60;

export default async function HomePage() {
  const overview: HomeOverview | null = await getHomeOverview().catch(() => null);

  const hasTrends =
    overview &&
    (overview.trends.mostCompared.length > 0 ||
      overview.trends.biggestRises.length > 0 ||
      overview.trends.biggestDrops.length > 0 ||
      overview.trends.recentlyAdded.length > 0);

  return (
    <>
      <Hero stats={overview?.stats ?? null} />

      {!overview && (
        <p className="empty-state">
          No se pudo conectar con la API (
          {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}). Levantala con{" "}
          <code>pnpm api:dev</code> y sembrá datos con <code>pnpm db:seed:demo</code>.
        </p>
      )}

      {overview && overview.categories.length > 0 && (
        <Section
          title="Explorá por categoría"
          subtitle="Componentes y productos individuales, organizados y con la cantidad de fichas comparadas."
          link={{ href: "/productos", label: "Ver todas" }}
        >
          <CategoryStrip categories={overview.categories} />
        </Section>
      )}

      {overview && overview.featured.length > 0 && (
        <Section
          title="Productos destacados"
          subtitle="Las fichas más recientes: el mejor precio, el promedio y cuánto se movió respecto al día anterior."
          link={{ href: "/productos", label: "Ver todos" }}
        >
          <div className="showcase-grid">
            {overview.featured.map((card) => (
              <ShowcaseCard key={card.productId} card={card} />
            ))}
          </div>
        </Section>
      )}

      {overview && overview.priceDrops.length > 0 && (
        <Section
          title="Bajaron de precio"
          subtitle="Productos cuyo mejor precio disminuyó recientemente. Cuánto bajó, cuánto ahorrás y hace cuánto."
        >
          <div className="drops-grid">
            {overview.priceDrops.map((card) => (
              <PriceDropCard key={card.productId} card={card} />
            ))}
          </div>
        </Section>
      )}

      {hasTrends && (
        <Section
          title="Tendencias"
          subtitle="Lo más comparado, las mayores subidas y bajadas, y lo recién agregado al catálogo."
        >
          <TrendsSection trends={overview!.trends} />
        </Section>
      )}

      {overview && overview.stores.length > 0 && (
        <Section
          title="Tiendas"
          subtitle="Las tiendas que sincronizamos, con su cobertura y estado de actualización."
        >
          <StoresGrid stores={overview.stores} />
        </Section>
      )}
    </>
  );
}
