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

  // ---------------------------------------------------------------------
  // Tiendas reales de Uruguay — PENDIENTES DE VERIFICACION (enabled: false)
  // ---------------------------------------------------------------------
  // baseUrl confirmado por busqueda web para cada una de estas 8 tiendas.
  // La plataforma (platform) es una ESTIMACION a partir de senales
  // indirectas (patrones de URL vistos en resultados de busqueda) — NO se
  // pudo confirmar contra el sitio real: este entorno de desarrollo no
  // tiene salida de red hacia dominios .uy (los fetches devuelven 403 o
  // timeout de DNS incluso para /robots.txt, en todos los casos).
  //
  // Antes de poner enabled: true en cualquiera de estas:
  //   1. Confirmar la plataforma real:
  //      - Tiendanube: abrir {baseUrl}/products.json?page=1 en el navegador,
  //        debe devolver JSON.
  //      - WooCommerce: abrir {baseUrl}/wp-json/wc/store/v1/products, debe
  //        devolver JSON.
  //      - VTEX: abrir {baseUrl}/api/catalog_system/pub/products/search?_from=0&_to=9
  //      - Si ninguna responde JSON, es un sitio a medida -> generic_html,
  //        e inspeccionar el HTML real para completar htmlSelectors.
  //   2. Reemplazar los categoryMappings/htmlSelectors de ejemplo por los
  //      ids/slugs/selectores reales de la tienda.
  //   3. Revisar robots.txt y terminos de uso del sitio.
  //   4. Confirmar que las categorias mapeadas son SOLO componentes/
  //      productos individuales (nunca "PC armada" o combos).
  {
    id: "banifox",
    name: "Banifox",
    baseUrl: "https://www.banifox.com.uy",
    // Guess: plataforma a medida (URLs tipo /computadoras/n1-2/az/pag/9/,
    // no coincide con el patron de Tiendanube/WooCommerce/VTEX).
    platform: "generic_html",
    currency: "UYU",
    categoryMappings: [{ storeCategoryRef: "TODO_CATEGORY_REF_GPU", category: "gpu" }],
    excludeKeywords: [],
    htmlSelectors: {
      listUrlTemplate: "https://www.banifox.com.uy/{ref}/n1-2/az/pag/{page}/",
      productItem: "TODO_SELECTOR",
      name: "TODO_SELECTOR",
      price: "TODO_SELECTOR",
      url: "TODO_SELECTOR",
    },
    requestDelayMs: 800,
    enabled: false,
  },
  {
    id: "thot-computacion",
    name: "Thot Computación",
    baseUrl: "https://thotcomputacion.com.uy",
    // Guess: WooCommerce (el sitio tiene una pagina "/shop/", el slug por
    // defecto de WooCommerce) — verificar /wp-json/wc/store/v1/products.
    platform: "woocommerce",
    currency: "UYU",
    categoryMappings: [
      { storeCategoryRef: "TODO_WOOCOMMERCE_CATEGORY_SLUG_GPU", category: "gpu" },
      { storeCategoryRef: "TODO_WOOCOMMERCE_CATEGORY_SLUG_NOTEBOOK", category: "notebook" },
    ],
    excludeKeywords: [],
    requestDelayMs: 500,
    enabled: false,
  },
  {
    id: "loi",
    name: "LOi (La Oferta Irresistible)",
    baseUrl: "https://loi.com.uy",
    // Guess: plataforma a medida/multi-rubro (vende desde tecnologia hasta
    // electrodomesticos y herramientas) — no confirmada.
    platform: "generic_html",
    currency: "UYU",
    categoryMappings: [{ storeCategoryRef: "informatica", category: "notebook" }],
    excludeKeywords: [],
    htmlSelectors: {
      listUrlTemplate: "https://loi.com.uy/categorias/{ref}?page={page}",
      productItem: "TODO_SELECTOR",
      name: "TODO_SELECTOR",
      price: "TODO_SELECTOR",
      url: "TODO_SELECTOR",
    },
    requestDelayMs: 800,
    enabled: false,
  },
  {
    id: "netpc",
    name: "NetPC",
    baseUrl: "https://netpc.uy",
    // Guess: plataforma a medida — no confirmada. Ojo: precios publicados
    // en USD segun la busqueda, confirmar StoreConfig.currency real.
    platform: "generic_html",
    currency: "USD",
    categoryMappings: [{ storeCategoryRef: "TODO_CATEGORY_REF_GPU", category: "gpu" }],
    excludeKeywords: [],
    htmlSelectors: {
      listUrlTemplate: "https://netpc.uy/{ref}?page={page}",
      productItem: "TODO_SELECTOR",
      name: "TODO_SELECTOR",
      price: "TODO_SELECTOR",
      url: "TODO_SELECTOR",
    },
    requestDelayMs: 800,
    enabled: false,
  },
  {
    id: "pcstore",
    name: "PC Store Uruguay",
    baseUrl: "https://pcstore.com.uy",
    // Guess: plataforma a medida (URLs tipo /catalogo?sort=highest_price,
    // no coincide con Tiendanube/WooCommerce/VTEX) — no confirmada.
    platform: "generic_html",
    currency: "UYU",
    categoryMappings: [{ storeCategoryRef: "TODO_CATEGORY_REF_GPU", category: "gpu" }],
    excludeKeywords: [],
    htmlSelectors: {
      listUrlTemplate: "https://pcstore.com.uy/catalogo?categoria={ref}&page={page}",
      productItem: "TODO_SELECTOR",
      name: "TODO_SELECTOR",
      price: "TODO_SELECTOR",
      url: "TODO_SELECTOR",
    },
    requestDelayMs: 800,
    enabled: false,
  },
  {
    id: "zonatecno",
    name: "ZonaTecno",
    baseUrl: "https://www.zonatecno.com.uy",
    // Guess: Tiendanube (los slugs de blog vistos en la busqueda tienen el
    // formato numerico tipico de Tiendanube) — verificar /products.json.
    platform: "tiendanube",
    currency: "UYU",
    categoryMappings: [
      { storeCategoryRef: "TODO_TIENDANUBE_CATEGORY_ID_NOTEBOOK", category: "notebook" },
      { storeCategoryRef: "TODO_TIENDANUBE_CATEGORY_ID_SMARTPHONE", category: "smartphone" },
    ],
    excludeKeywords: [],
    requestDelayMs: 500,
    enabled: false,
  },
  {
    id: "hardpc",
    name: "Hard PC",
    baseUrl: "https://www.hardpc.com.uy",
    // Guess: plataforma a medida/legacy (URLs tipo productos.php?secc=...) —
    // no confirmada.
    platform: "generic_html",
    currency: "UYU",
    categoryMappings: [{ storeCategoryRef: "TODO_CATEGORY_REF_GPU", category: "gpu" }],
    excludeKeywords: [],
    htmlSelectors: {
      listUrlTemplate: "https://www.hardpc.com.uy/catalogo/{ref}/pag/{page}/",
      productItem: "TODO_SELECTOR",
      name: "TODO_SELECTOR",
      price: "TODO_SELECTOR",
      url: "TODO_SELECTOR",
    },
    requestDelayMs: 800,
    enabled: false,
  },
  {
    id: "nnet",
    name: "NNET",
    baseUrl: "https://www.nnet.com.uy",
    // Guess: plataforma a medida/legacy (URLs tipo representaciones_masinfo.php) —
    // no confirmada.
    platform: "generic_html",
    currency: "UYU",
    categoryMappings: [{ storeCategoryRef: "TODO_CATEGORY_REF_GPU", category: "gpu" }],
    excludeKeywords: [],
    htmlSelectors: {
      listUrlTemplate: "https://www.nnet.com.uy/{ref}/pag/{page}/",
      productItem: "TODO_SELECTOR",
      name: "TODO_SELECTOR",
      price: "TODO_SELECTOR",
      url: "TODO_SELECTOR",
    },
    requestDelayMs: 800,
    enabled: false,
  },
];
