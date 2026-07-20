/**
 * Parses a price string as shown on a Uruguayan e-commerce site into a
 * number. Handles "$ 45.990" (dot thousands separator), "1.234,50" (dot
 * thousands + comma decimal), "45990", and plain "45990.50".
 * Only needed by the generic_html adapter — JSON platform APIs already
 * return numeric prices.
 */
export function parsePriceUYU(text: string): number {
  const cleaned = text.replace(/[^\d.,]/g, "").trim();
  if (!cleaned) return NaN;

  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");

  if (hasDot && hasComma) {
    // "1.234,50" -> dot is thousands, comma is decimal
    return parseFloat(cleaned.replace(/\./g, "").replace(",", "."));
  }

  if (hasComma && !hasDot) {
    const [, decimals] = cleaned.split(",");
    // "45990,00" style with 2 decimals -> comma is decimal separator
    if (decimals && decimals.length <= 2) {
      return parseFloat(cleaned.replace(",", "."));
    }
    // otherwise treat as a (unusual) thousands separator
    return parseFloat(cleaned.replace(/,/g, ""));
  }

  if (hasDot && !hasComma) {
    const parts = cleaned.split(".");
    const lastPart = parts[parts.length - 1];
    const isLikelyDecimal = parts.length === 2 && (lastPart?.length ?? 0) <= 2;
    if (isLikelyDecimal) return parseFloat(cleaned);
    return parseFloat(parts.join(""));
  }

  return parseFloat(cleaned);
}
