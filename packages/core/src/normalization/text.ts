/** Removes accents/diacritics: "año" -> "ano", useful since stores mix ES/EN spelling. */
export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Lowercases, strips accents, standardizes unit spacing ("12 gb" -> "12gb"),
 * removes punctuation noise, and collapses whitespace. This is the shared
 * first pass both normalizeProductName and attribute extraction build on.
 */
export function cleanText(value: string): string {
  let text = stripAccents(value.toLowerCase());
  text = text.replace(/[""'’]/g, "");
  text = text.replace(/[\/,;|]+/g, " ");
  // "12 gb" / "12-gb" -> "12gb", "1 tb" -> "1tb"
  text = text.replace(/(\d+)\s*-?\s*(gb|tb|mb|mhz|w|hz|"|pulgadas?)\b/g, "$1$2");
  text = text.replace(/[()[\]]/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

export function tokenize(value: string): string[] {
  return cleanText(value)
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Removes everything but lowercase letters and digits, for strict model-code comparison. */
export function alnumOnly(value: string): string {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
