export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("es-UY", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "UYU",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-UY", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

/** Compact integer, e.g. 1.2 K / 3,4 mil — kept simple with es-UY grouping. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 }).format(value);
}

/** Short, human relative time in Spanish: "hace 2 h", "hace 3 días". */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const diffMs = Date.now() - then;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "recién";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 30) return `hace ${days} ${days === 1 ? "día" : "días"}`;
  const months = Math.round(days / 30);
  return `hace ${months} ${months === 1 ? "mes" : "meses"}`;
}

/** Signed percentage with one decimal, e.g. "-4,2%" / "+1,8%". */
export function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 }).format(value)}%`;
}
