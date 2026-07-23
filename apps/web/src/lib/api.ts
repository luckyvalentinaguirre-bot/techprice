import type { Category, ComparisonCard, HomeOverview } from "@techprice/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface CategoryOption {
  id: Category;
  label: string;
}

export interface StoreOption {
  id: string;
  name: string;
  baseUrl: string;
  platform: string;
}

export interface ProductListResult {
  items: ComparisonCard[];
  total: number;
  page: number;
  pageSize: number;
}

async function apiFetch<T>(path: string, revalidateSeconds = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: revalidateSeconds } });
  if (!res.ok) {
    throw new Error(`API request to ${path} failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getCategories(): Promise<CategoryOption[]> {
  return apiFetch<CategoryOption[]>("/api/categories", 3600);
}

export function getHomeOverview(): Promise<HomeOverview> {
  return apiFetch<HomeOverview>("/api/home", 60);
}

export function getStores(): Promise<StoreOption[]> {
  return apiFetch<StoreOption[]>("/api/stores", 300);
}

export function listProducts(params: {
  category?: string;
  search?: string;
  storeId?: string;
  page?: number;
  pageSize?: number;
}): Promise<ProductListResult> {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.search) qs.set("search", params.search);
  if (params.storeId) qs.set("storeId", params.storeId);
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));

  return apiFetch<ProductListResult>(`/api/products?${qs.toString()}`, 30);
}

export async function getProduct(id: string): Promise<ComparisonCard | null> {
  const res = await fetch(`${API_URL}/api/products/${id}`, { next: { revalidate: 30 } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`API request for product ${id} failed with status ${res.status}`);
  return res.json() as Promise<ComparisonCard>;
}
