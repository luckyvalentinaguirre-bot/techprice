import Link from "next/link";
import { getCategories } from "@/lib/api";

export const revalidate = 3600;

export default async function HomePage() {
  const categories = await getCategories().catch(() => []);

  return (
    <div>
      <section className="hero">
        <h1>Comparador de precios de tecnologia en Uruguay</h1>
        <p>
          Comparamos componentes y productos individuales -no PCs armadas- entre las tiendas de tecnologia de
          Uruguay: el mismo producto, el precio mas bajo, el promedio y cuanto podes ahorrar.
        </p>
      </section>

      <div className="category-grid">
        {categories.map((cat) => (
          <Link key={cat.id} href={`/productos?category=${cat.id}`} className="category-tile">
            {cat.label}
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <p className="empty-state">
          No se pudo conectar con la API ({process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}). Levantala
          con <code>pnpm api:dev</code>.
        </p>
      )}
    </div>
  );
}
