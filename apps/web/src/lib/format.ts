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
