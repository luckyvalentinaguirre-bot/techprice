import Link from "next/link";
import type { CategorySummary } from "@techprice/shared";
import { formatNumber } from "@/lib/format";
import { categoryIcon, Icon } from "./Icon";

export function CategoryStrip({ categories }: { categories: CategorySummary[] }) {
  if (categories.length === 0) return null;

  return (
    <div className="category-strip">
      {categories.map((cat) => (
        <Link key={cat.id} href={`/productos?category=${cat.id}`} className="category-chip">
          <span className="category-chip__icon">
            <Icon name={categoryIcon(cat.id)} size={20} />
          </span>
          <span className="category-chip__body">
            <span className="category-chip__name">{cat.label}</span>
            <span className="category-chip__count">
              {formatNumber(cat.count)} {cat.count === 1 ? "producto" : "productos"}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
