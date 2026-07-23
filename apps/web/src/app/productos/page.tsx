import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getStores, listProducts } from "@/lib/api";

export const revalidate = 30;

interface PageProps {
  searchParams: { category?: string; search?: string; storeId?: string; page?: string };
}

const PAGE_SIZE = 24;

export default async function ProductsPage({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const [categories, stores, result] = await Promise.all([
    getCategories().catch(() => []),
    getStores().catch(() => []),
    listProducts({
      category: searchParams.category,
      search: searchParams.search,
      storeId: searchParams.storeId,
      page,
      pageSize: PAGE_SIZE,
    }).catch(() => ({ items: [], total: 0, page: 1, pageSize: PAGE_SIZE })),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));

  function pageHref(targetPage: number) {
    const qs = new URLSearchParams();
    if (searchParams.category) qs.set("category", searchParams.category);
    if (searchParams.search) qs.set("search", searchParams.search);
    if (searchParams.storeId) qs.set("storeId", searchParams.storeId);
    qs.set("page", String(targetPage));
    return `/productos?${qs.toString()}`;
  }

  return (
    <div className="productos-page">
      <h1>Productos</h1>

      <form className="toolbar" action="/productos" method="get">
        <input type="text" name="search" placeholder="Buscar producto..." defaultValue={searchParams.search ?? ""} />
        <select name="category" defaultValue={searchParams.category ?? ""}>
          <option value="">Todas las categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select name="storeId" defaultValue={searchParams.storeId ?? ""}>
          <option value="">Todas las tiendas</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button type="submit">Filtrar</button>
      </form>

      {result.items.length === 0 ? (
        <p className="empty-state">
          No hay productos para mostrar todavia. Corre <code>pnpm ingest</code> con al menos una tienda habilitada en{" "}
          <code>packages/scrapers/src/stores.config.ts</code>.
        </p>
      ) : (
        <div className="product-grid">
          {result.items.map((card) => (
            <ProductCard key={card.productId} card={card} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={pageHref(p)} className={p === page ? "is-current" : ""}>
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
