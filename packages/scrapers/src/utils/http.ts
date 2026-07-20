export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; TechPriceUYBot/1.0; +https://techprice.uy/bot) - comparador de precios",
  Accept: "application/json, text/html;q=0.9,*/*;q=0.8",
};

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
  ) {
    super(`HTTP ${status} fetching ${url}`);
  }
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: DEFAULT_HEADERS });
      if (res.status === 404) {
        throw new HttpError(404, url);
      }
      if (!res.ok) {
        throw new HttpError(res.status, url);
      }
      return res;
    } catch (err) {
      lastError = err;
      if (err instanceof HttpError && err.status === 404) throw err;
      if (attempt < retries) await delay(500 * (attempt + 1));
    }
  }
  throw lastError;
}

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetchWithRetry(url);
  return (await res.json()) as T;
}

export async function fetchText(url: string): Promise<string> {
  const res = await fetchWithRetry(url);
  return res.text();
}
