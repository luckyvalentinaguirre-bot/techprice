import type { StoreConfig } from "@techprice/shared";

/**
 * Registry of stores TechPrice Uruguay compares. THIS is the file you touch
 * to add a new store — nothing else in the codebase needs to change.
 *
 * The four entries below are TEMPLATES (enabled: false), one per supported
 * platform, showing exactly what to fill in. They are intentionally not
 * pointed at verified real store URLs/category ids: those must be confirmed
 * against the actual site (and its robots.txt/terms) before enabling.
 *
 * To onboard a real store:
 *   1. Duplicate the template matching its e-commerce platform.
 *   2. Set id/name/baseUrl.
 *   3. Fill categoryMappings with that store's real category ids/slugs
 *      mapped to our canonical Category — ONLY map categories that hold
 *      individual components/products, never "PC armada" / bundle
 *      categories.
 *   4. Set enabled: true.
 */
export const STORE_CONFIGS: StoreConfig[] = [
  {
    id: "template-tiendanube",
    name: "[Plantilla] Tienda Tiendanube",
    baseUrl: "https://www.example-tiendanube.uy",
    platform: "tiendanube",
    currency: "UYU",
    categoryMappings: [
      { storeCategoryRef: "TIENDANUBE_CATEGORY_ID_GPU", category: "gpu" },
      { storeCategoryRef: "TIENDANUBE_CATEGORY_ID_CPU", category: "cpu" },
      { storeCategoryRef: "TIENDANUBE_CATEGORY_ID_RAM", category: "ram" },
    ],
    excludeKeywords: [],
    requestDelayMs: 500,
    enabled: false,
  },
  {
    id: "template-woocommerce",
    name: "[Plantilla] Tienda WooCommerce",
    baseUrl: "https://www.example-woocommerce.uy",
    platform: "woocommerce",
    currency: "UYU",
    categoryMappings: [
      { storeCategoryRef: "tarjetas-graficas", category: "gpu" },
      { storeCategoryRef: "procesadores", category: "cpu" },
      { storeCategoryRef: "notebooks", category: "notebook" },
    ],
    excludeKeywords: ["pc gamer armada"],
    requestDelayMs: 500,
    enabled: false,
  },
  {
    id: "template-vtex",
    name: "[Plantilla] Tienda VTEX",
    baseUrl: "https://www.example-vtex.uy",
    platform: "vtex",
    currency: "UYU",
    categoryMappings: [{ storeCategoryRef: "VTEX_CATEGORY_ID_MONITORES", category: "monitor" }],
    excludeKeywords: [],
    requestDelayMs: 500,
    enabled: false,
  },
  {
    id: "template-generic-html",
    name: "[Plantilla] Tienda con sitio a medida",
    baseUrl: "https://www.example-generic.uy",
    platform: "generic_html",
    currency: "UYU",
    categoryMappings: [{ storeCategoryRef: "gpu", category: "gpu" }],
    excludeKeywords: [],
    htmlSelectors: {
      listUrlTemplate: "https://www.example-generic.uy/categoria/{ref}?page={page}",
      productItem: ".product-card",
      name: ".product-card__title",
      price: ".product-card__price",
      url: "a.product-card__link",
      image: "img.product-card__image",
      availability: ".product-card__stock",
      nextPage: ".pagination__next:not(.disabled)",
    },
    requestDelayMs: 800,
    enabled: false,
  },
];
