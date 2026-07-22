/*
 * Trae PRECIOS E IMÁGENES REALES de tiendas y arma data/productos.json,
 * data/tiendas.json y data/precios.json (el mismo formato que usa la página).
 *
 * Correlo en TU PC (tiene que tener internet hacia las tiendas):
 *
 *   node scripts/fetch-real-data.mjs
 *
 * Configurá las tiendas en scripts/stores.config.json. Ver REALES.md.
 * Sin dependencias: usa el fetch nativo de Node (necesitás Node 18 o superior).
 *
 * Cada corrida agrega el precio de HOY: si lo corrés distintos días, se va
 * armando el historial real. Prueba: node scripts/fetch-real-data.mjs --selftest
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const DATA = resolve(ROOT, "data");
const HOY = new Date().toISOString().slice(0, 10);
const SELFTEST = process.argv.includes("--selftest");
const FRESH = process.argv.includes("--fresh"); // ignora los datos previos (arranca de cero)

/* ----------------------------- clasificación ----------------------------- */
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const CATS = [
  ["Motherboard", /motherboard|placa madre|mainboard|tarjeta madre|\bmother\b/],
  ["GPU", /\brtx\b|\bgtx\b|geforce|radeon|\brx ?\d{3,4}\b|placa de v[ií]deo|tarjeta gr[aá]fica|\bgpu\b|arc a\d/],
  ["CPU", /procesador|\bryzen\b|core i\d|intel core|core ultra|\bcpu\b|athlon|pentium|celeron|threadripper/],
  // RAM: la palabra RAM / DIMM, o capacidad en GB junto a DDR (así "DDR4" suelto
  // en un motherboard no la clasifica como RAM).
  ["RAM", /memoria\s?ram|\bram\b|\bso-?dimm\b|\bu?dimm\b|\d{1,3}\s?gb\b(?=.*\bddr[345]\b)|\bddr[345]\b(?=.*\d{1,3}\s?gb)/],
  ["SSD", /\bssd\b|\bnvme\b|\bm\.?2\b|estado s[oó]lido/],
  ["HDD", /\bhdd\b|disco duro|disco r[ií]gido/],
  ["Fuente", /fuente|\bpsu\b|power supply|\b\d{3,4} ?w\b/],
  ["Gabinete", /gabinete|\bcase\b|chasis|\btorre\b/],
  ["Cooler", /cooler|disipador|refrigeraci[oó]n|water ?cooler|\baio\b/],
  ["Monitor", /monitor|\bpantalla\b/],
  ["Teclado", /teclado|keyboard/],
  ["Mouse", /\bmouse\b|\brat[oó]n\b/],
  ["Auriculares", /auricular|headset|aud[ií]fono|headphone/],
];

// Palabras clave de notebook (portátil).
const NOTEBOOK = /\bnotebook\b|\blaptop\b|port[aá]til|ultrabook|\bmacbook\b|\bnetbook\b|\b2 en 1\b|convertible|ideapad|thinkpad|vivobook|zenbook|\baspire\b|\bnitro\b|\bvictus\b|inspiron|latitude|pavilion|\bomen\b|rog\s?(strix|zephyrus)?\s?g\d|tuf\s?gaming\s?f?a?\d|chromebook/;

// Palabras clave explícitas de PC pre-armada / de escritorio.
const PREBUILT = /\bpc\s?gamer\b|\bpc\s?armad|\bpc\s?completa|\bpc\s?(de\s?)?escritorio|\bpc\s?oficina|\bpc\s?home\b|\bpc\s?full\b|\bpc\s?intel\b|\bpc\s?amd\b|\bpc\s?ryzen\b|computador(a)?\b|\bdesktop\b|equipo\s?(gamer|completo|armad|pc|de\s?escritorio)|combo\s?(pc|gamer)|mini\s?pc|all[\s-]?in[\s-]?one|\baio\s?pc\b|cpu\s?armad|torre\s?gamer/;

// Tamaño de pantalla típico de notebook (11" a 18"), en cualquier formato.
const SCREEN = /\b1[0-8](\.\d)?\s?("|”|''|pulg|pulgadas|inch)/;

// Basura real (no son productos comparables): se descartan por completo.
const NOISE = /diferencia (de )?equipo|\bse[nñ]a\b|\breserva\b|garant[ií]a extendida|servicio t[eé]cnico|mano de obra|armado y (testeo|pruebas)|\bcuota[s]?\b|env[ií]o (gratis|a domicilio)?$/;

// Detectores de componentes: cada uno responde "el nombre menciona este tipo de
// pieza". La clave para no ensuciar las categorías es CONTAR cuántos aparecen:
// una pieza suelta menciona 1; una PC armada o notebook menciona 2 o más.
const SIG = {
  cpu: (n) => /\bryzen\s?[3579]?\b|\bcore\s?i[3579]\b|\bi[3579]-\d{3,5}|intel\s?core|core\s?ultra|\bpentium\b|\bceleron\b|\bathlon\b|\bthreadripper\b/.test(n),
  gpu: (n) => /\brtx\s?\d{3,4}\b|\bgtx\s?\d{3,4}\b|geforce|radeon|\brx\s?\d{3,4}\b|arc\s?a\d/.test(n),
  // RAM real: "memoria ram", la palabra "ram", o capacidad en GB junto a DDR3/4/5
  // (evita "GDDR" de las placas de video gracias al \b antes de ddr).
  ram: (n) => /memoria ram|\bram\b/.test(n) || (/\d{1,3}\s?gb/.test(n) && /\bddr[345]\b/.test(n)),
  ssd: (n) => /\bssd\b|\bnvme\b|\bhdd\b|\bm\.?2\b|\d\s?tb\b|disco (duro|s[oó]lido|r[ií]gido)/.test(n),
};
const contarComponentes = (n) => (SIG.cpu(n) ? 1 : 0) + (SIG.gpu(n) ? 1 : 0) + (SIG.ram(n) ? 1 : 0) + (SIG.ssd(n) ? 1 : 0);

function esNotebook(n) {
  // Evitar accesorios: "soporte/base/cooler/funda para notebook" no es una notebook.
  if (/(soporte|base|funda|maletin|malet[ií]n|mochila|cooler|almohadilla|cargador|bater[ií]a|teclado|filtro|adaptador)\b.*\bnotebook\b/.test(n)) return false;
  return NOTEBOOK.test(n);
}
const esPrebuiltKw = (n) => PREBUILT.test(n) || (/^\s*pc\b/.test(n) && contarComponentes(n) >= 1);

function clasificar(nombre) {
  const n = norm(nombre);
  // 1) Notebook explícita (por palabra clave o modelo conocido).
  if (esNotebook(n)) return "Notebook";
  // 2) PC pre-armada por palabra clave ("PC gamer", "computadora", "mini pc"…).
  if (esPrebuiltKw(n)) return "PC Armada";
  // 3) Sin palabra clave pero menciona 2+ componentes distintos => es un equipo
  //    completo, no una pieza suelta. Si además trae medida de pantalla, es una
  //    notebook (portátil sin la palabra "notebook" en el título).
  if (contarComponentes(n) >= 2) return SCREEN.test(n) ? "Notebook" : "PC Armada";
  // 4) Motherboard por chipset (B550, X670, Z790, H610, A520…) cuando el título
  //    no dice "motherboard". Se descarta si el nombre es de gabinete/cooler/
  //    fuente (ej. gabinete NZXT H510, que comparte el código con un chipset H510).
  if (/\b[abxz][3-9]\d{2}m?\b|\bh[3-9]\d{2}m?\b/.test(n) &&
      !/gabinete|\bcase\b|\btorre\b|chasis|cooler|disipador|ventilador|\bfan\b|fuente|\bpsu\b/.test(n))
    return "Motherboard";
  // 5) Pieza suelta: cae en su categoría por el primer patrón que coincide.
  for (const [cat, re] of CATS) if (re.test(n)) return cat;
  return "Otros";
}
const esRuido = (nombre) => NOISE.test(norm(nombre));

/* --------------------------- inferencia de specs ------------------------- */
function inferSpecs(cat, nombre) {
  const n = norm(nombre);
  const socket = () => (/\bam5\b|7[0-9]{3}(x|x3d)?\b|b650|x670|a620/.test(n) ? "AM5" : /\bam4\b|5[0-9]{3}(x|g)?\b|b550|x570|a520|b450/.test(n) ? "AM4" : /lga ?1700|1[234]th gen|core i\d-1[234]\d{3}/.test(n) ? "LGA1700" : null);
  const ddr = () => (/ddr5/.test(n) ? "DDR5" : /ddr4/.test(n) ? "DDR4" : null);
  const ff = () => (/micro ?atx|\bmatx\b|m-atx/.test(n) ? "mATX" : /mini ?itx|\bitx\b/.test(n) ? "ITX" : /\batx\b/.test(n) ? "ATX" : null);
  if (cat === "CPU") return clean({ plataforma: /intel|core i|pentium|celeron|core ultra/.test(n) ? "Intel" : /ryzen|athlon|threadripper/.test(n) ? "AMD" : null, socket: socket() });
  if (cat === "Motherboard") return clean({ socket: socket(), ramType: ddr(), formFactor: ff() || "ATX", chipset: (n.match(/\b([abxz]\d{3}|h\d{3})\b/) || [])[1]?.toUpperCase() });
  if (cat === "RAM") return clean({ ramType: ddr(), capacidadGb: Number((n.match(/(\d{1,3}) ?gb/) || [])[1]) || undefined });
  if (cat === "GPU") return {};
  if (cat === "Fuente") return clean({ watts: Number((n.match(/(\d{3,4}) ?w/) || [])[1]) || undefined, cert: (n.match(/gold|bronze|platinum|white/) || [])[0] });
  if (cat === "Gabinete") return clean({ formFactor: ff() || "ATX" });
  if (cat === "Cooler") { const s = socket(); return { sockets: s ? [s] : ["LGA1700", "AM5", "AM4"] }; }
  return {};
}
const clean = (o) => { for (const k of Object.keys(o)) if (o[k] == null || o[k] === "") delete o[k]; return o; };

/* ------------------------- matching entre tiendas ------------------------ */
const BRANDS = "asus msi gigabyte asrock intel amd ryzen corsair kingston samsung western wd nzxt lian deepcool noctua logitech hyperx lg acer lenovo sapphire evga zotac gainward palit xfx powercolor seasonic thermaltake redragon tp-link hp dell gskill crucial adata pny".split(" ");
function claveModelo(nombre, cat) {
  const toks = norm(nombre).replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  const brand = toks.find((t) => BRANDS.includes(t)) || "";
  let model = "";
  for (const t of toks) if (/\d/.test(t) && t.length > model.length) model = t;
  return cat + "|" + brand + "|" + (model || toks.join(" "));
}

/* --------------------------------- fetch --------------------------------- */
const UA = { "User-Agent": "Mozilla/5.0 (compatible; TechPriceUY/1.0; comparador de precios)", Accept: "application/json" };
async function getJson(url, headers = {}, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { ...UA, ...headers }, signal: ctrl.signal, redirect: "follow" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// Detecta sola la plataforma de una tienda probando los endpoints conocidos.
// Prueba varias variantes: WooCommerce (2 rutas), Shopify/products.json y VTEX.
async function detectPlatform(store) {
  const base = store.baseUrl.replace(/\/$/, "");
  const asArr = (d) => (Array.isArray(d) ? d : (d && d.products) || null);
  const tries = [
    ["woocommerce", `${base}/wp-json/wc/store/v1/products?per_page=1`, (d) => Array.isArray(d) && d[0] && (d[0].prices || d[0].permalink)],
    ["woocommerce", `${base}/wp-json/wc/store/products?per_page=1`, (d) => Array.isArray(d) && d[0] && (d[0].prices || d[0].permalink)],
    ["shopify", `${base}/products.json?limit=1`, (d) => { const a = asArr(d); return a && a[0] && (a[0].variants || a[0].handle || a[0].title || a[0].name); }],
    ["vtex", `${base}/api/catalog_system/pub/products/search?_from=0&_to=0`, (d) => Array.isArray(d) && d[0] && (d[0].items || d[0].productName || d[0].linkText)],
  ];
  for (const [plat, url, ok] of tries) {
    try {
      const data = await getJson(url, {}, 10000);
      if (ok(data)) return plat;
    } catch { /* probar la siguiente */ }
  }
  return null;
}

async function fromWoo(store) {
  const base = store.baseUrl.replace(/\/$/, "");
  // Algunos WooCommerce exponen la Store API en /wc/store/v1 y otros en /wc/store.
  for (const path of ["/wp-json/wc/store/v1/products", "/wp-json/wc/store/products"]) {
    const out = [];
    for (let page = 1; page <= (store.maxPages || 20); page++) {
      const arr = await getJson(`${base}${path}?page=${page}&per_page=100`).catch(() => null);
      if (!Array.isArray(arr) || arr.length === 0) break;
      for (const p of arr) {
        const minor = p.prices?.currency_minor_unit ?? 2;
        out.push({
          nombre: p.name, precio: parseFloat(p.prices?.price) / 10 ** minor,
          moneda: p.prices?.currency_code || store.moneda || "UYU",
          imagen: p.images?.[0]?.src || null, url: p.permalink, disponible: p.is_in_stock !== false,
        });
      }
      if (arr.length < 100) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    if (out.length) return out;
  }
  return [];
}

// Shopify (y Tiendanube que exponen /products.json). Acepta tanto un array
// suelto como { products: [...] }.
async function fromShopify(store) {
  const base = store.baseUrl.replace(/\/$/, "");
  const out = [];
  for (let page = 1; page <= (store.maxPages || 20); page++) {
    const data = await getJson(`${base}/products.json?limit=250&page=${page}`).catch(() => null);
    const arr = Array.isArray(data) ? data : (data && data.products) || [];
    if (!arr.length) break;
    for (const p of arr) {
      const v = (p.variants && p.variants[0]) || {};
      const nombre = typeof p.name === "object" ? p.name.es || Object.values(p.name)[0] : (p.title || p.name);
      const handle = typeof p.handle === "object" ? p.handle.es || Object.values(p.handle)[0] : p.handle;
      out.push({
        nombre, precio: parseFloat(v.price), moneda: store.moneda || "UYU",
        imagen: p.images?.[0]?.src || p.image?.src || null,
        url: p.canonical_url || `${base}/products/${handle || ""}`,
        disponible: v.available !== false,
      });
    }
    if (arr.length < 250) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  return out;
}

async function fromMercadoLibre(store) {
  if (!store.token) throw new Error("Mercado Libre necesita un token (ver REALES.md).");
  const site = store.site || "MLU";
  const porBusqueda = store.maxPorBusqueda || 100; // cuántos traer por término
  const seen = new Set();
  const out = [];
  for (const q of store.queries || []) {
    for (let offset = 0; offset < porBusqueda; offset += 50) {
      const url = `https://api.mercadolibre.com/sites/${site}/search?q=${encodeURIComponent(q)}&limit=50&offset=${offset}`;
      const data = await getJson(url, { Authorization: "Bearer " + store.token }).catch((e) => { console.warn("  ML '" + q + "': " + e.message); return { results: [] }; });
      const results = data.results || [];
      for (const r of results) {
        if (seen.has(r.id)) continue;
        seen.add(r.id);
        const img = (r.secure_thumbnail || r.thumbnail || "").replace("http://", "https://").replace(/-I\.jpg$/, "-O.jpg");
        out.push({
          nombre: r.title, precio: r.price, moneda: r.currency_id || store.moneda || "UYU",
          imagen: img || null, url: r.permalink, disponible: (r.available_quantity ?? 1) > 0,
        });
      }
      if (results.length < 50) break;
      await new Promise((res) => setTimeout(res, 400));
    }
  }
  return out;
}

async function fromVtex(store) {
  const out = [];
  const base = store.baseUrl.replace(/\/$/, "");
  const step = 50;
  for (let from = 0; from < (store.maxItems || 1000); from += step) {
    const url = `${base}/api/catalog_system/pub/products/search?_from=${from}&_to=${from + step - 1}`;
    const arr = await getJson(url).catch(() => []);
    if (!Array.isArray(arr) || arr.length === 0) break;
    for (const p of arr) {
      const item = (p.items && p.items[0]) || {};
      const offer = ((item.sellers && item.sellers[0]) || {}).commertialOffer || {};
      out.push({
        nombre: p.productName, precio: offer.Price, moneda: store.moneda || "UYU",
        imagen: item.images?.[0]?.imageUrl || null,
        url: p.link || `${base}/${p.linkText}/p`,
        disponible: offer.IsAvailable !== false && (offer.AvailableQuantity ?? 1) > 0,
      });
    }
    if (arr.length < step) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  return out;
}

const FETCHERS = { woocommerce: fromWoo, shopify: fromShopify, tiendanube: fromShopify, vtex: fromVtex, mercadolibre: fromMercadoLibre };

/* --------------------------- armar el dataset ---------------------------- */
function buildDataset(rawPorTienda, storesMeta, prev) {
  // prev = { productos, precios } existentes (para IDs estables + historial).
  const keyToId = new Map();
  let maxId = 0;
  for (const p of prev.productos) {
    keyToId.set(claveModelo(p.nombre, p.categoria), p.id);
    if (p.id > maxId) maxId = p.id;
  }

  const productos = new Map(prev.productos.map((p) => [p.id, p]));
  const preciosHoy = [];

  for (const { store, items } of rawPorTienda) {
    for (const it of items) {
      if (!it.nombre || !isFinite(it.precio) || it.precio <= 0) continue;
      if (esRuido(it.nombre)) continue;
      const categoria = clasificar(it.nombre);
      const key = claveModelo(it.nombre, categoria);
      let id = keyToId.get(key);
      if (!id) {
        id = ++maxId; keyToId.set(key, id);
        productos.set(id, { id, nombre: it.nombre, marca: BRANDS.find((b) => norm(it.nombre).includes(b))?.toUpperCase() || null, categoria, imagen: it.imagen || null, specs: inferSpecs(categoria, it.nombre) });
      } else if (!productos.get(id).imagen && it.imagen) {
        productos.get(id).imagen = it.imagen; // completar imagen si faltaba
      }
      preciosHoy.push({ producto: id, tienda: store.id, precio: Math.round(it.precio), moneda: it.moneda, disponible: it.disponible, url: it.url || null, fecha: HOY });
    }
  }

  // Historial: conservar precios de fechas anteriores, reemplazar los de hoy.
  const preciosPrev = prev.precios.filter((r) => r.fecha !== HOY);
  const tiendas = storesMeta.map((s) => ({ id: s.id, nombre: s.nombre, plataforma: s.plataforma }));
  return { productos: [...productos.values()].sort((a, b) => a.id - b.id), tiendas, precios: [...preciosPrev, ...preciosHoy] };
}

/* ---------------------------------- main --------------------------------- */
function readJson(path, fallback) { try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; } }

async function main() {
  const cfg = readJson(resolve(HERE, "stores.config.json"), { stores: [] });
  const enabled = cfg.stores.filter((s) => s.enabled);

  const rawPorTienda = [];
  if (SELFTEST) {
    rawPorTienda.push({ store: { id: 4, nombre: "Thot (selftest)", plataforma: "woocommerce" }, items: SAMPLE });
  } else {
    if (enabled.length === 0) { console.error("No hay tiendas con enabled:true en scripts/stores.config.json"); process.exit(1); }
    for (const store of enabled) {
      let plataforma = store.plataforma;
      if (!plataforma || plataforma === "auto") {
        process.stdout.write(`Detectando ${store.nombre}… `);
        plataforma = await detectPlatform(store).catch(() => null);
        if (!plataforma) { console.log("sin API detectada, la salteo"); continue; }
        console.log("es " + plataforma);
      }
      const fetcher = FETCHERS[plataforma];
      if (!fetcher) { console.log(`Plataforma no soportada (${plataforma}) en ${store.nombre}, la salteo`); continue; }
      const s = { ...store, plataforma };
      process.stdout.write(`Leyendo ${store.nombre} (${plataforma})… `);
      try { const items = await fetcher(s); console.log(items.length + " productos"); if (items.length) rawPorTienda.push({ store: s, items }); }
      catch (e) { console.log("ERROR: " + e.message); }
    }
  }

  const prev = FRESH || SELFTEST
    ? { productos: [], precios: [] }
    : { productos: readJson(resolve(DATA, "productos.json"), []), precios: readJson(resolve(DATA, "precios.json"), []) };
  // Solo entran a tiendas.json las que realmente trajeron productos.
  const storesMeta = SELFTEST
    ? [{ id: 4, nombre: "Thot (selftest)", plataforma: "woocommerce" }]
    : rawPorTienda.map((x) => ({ id: x.store.id, nombre: x.store.nombre, plataforma: x.store.plataforma }));
  const ds = buildDataset(rawPorTienda, storesMeta, prev);

  const resumen = `Productos: ${ds.productos.length} | Tiendas: ${ds.tiendas.length} | Precios: ${ds.precios.length} | conImagen: ${ds.productos.filter((p) => p.imagen).length}`;
  if (SELFTEST) {
    console.log("[selftest] " + resumen);
    console.log("[selftest] categorías:", JSON.stringify([...new Set(ds.productos.map((p) => p.categoria))]));
    for (const p of ds.productos) console.log("  [" + p.categoria + "] " + p.nombre);
    return;
  }
  mkdirSync(DATA, { recursive: true });
  writeFileSync(resolve(DATA, "productos.json"), JSON.stringify(ds.productos, null, 2) + "\n");
  writeFileSync(resolve(DATA, "tiendas.json"), JSON.stringify(ds.tiendas, null, 2) + "\n");
  writeFileSync(resolve(DATA, "precios.json"), JSON.stringify(ds.precios, null, 2) + "\n");

  // También dejamos el SQL para Supabase (por si usás la base online).
  const sqlv = (v) => (v == null ? "null" : "'" + String(v).replace(/'/g, "''") + "'");
  const jsonbv = (o) => "'" + JSON.stringify(o || {}).replace(/'/g, "''") + "'::jsonb";
  const seed = `-- Datos REALES. Ejecutá DESPUÉS de schema.sql en el SQL Editor de Supabase.
truncate precios, productos, tiendas restart identity cascade;

insert into tiendas (id, nombre, plataforma) values
${ds.tiendas.map((t) => `(${t.id}, ${sqlv(t.nombre)}, ${sqlv(t.plataforma)})`).join(",\n")};

insert into productos (id, nombre, marca, categoria, imagen, specs) values
${ds.productos.map((p) => `(${p.id}, ${sqlv(p.nombre)}, ${sqlv(p.marca)}, ${sqlv(p.categoria)}, ${sqlv(p.imagen)}, ${jsonbv(p.specs)})`).join(",\n")};

insert into precios (producto, tienda, precio, moneda, disponible, url, fecha) values
${ds.precios.map((r) => `(${r.producto}, ${r.tienda}, ${r.precio}, ${sqlv(r.moneda)}, ${r.disponible}, ${sqlv(r.url)}, ${sqlv(r.fecha)})`).join(",\n")};
`;
  mkdirSync(resolve(ROOT, "supabase"), { recursive: true });
  writeFileSync(resolve(ROOT, "supabase", "seed-real.sql"), seed);
  console.log("Listo → data/*.json y supabase/seed-real.sql actualizados. " + resumen);
}

/* Datos de ejemplo para --selftest (forma real de la Store API de WooCommerce). */
const SAMPLE = [
  { nombre: 'Notebook Acer Swift 3 SF313-53 i7-1165G7/8Gb/512Gb 13.5" 2K', precio: 790, moneda: "USD", imagen: "https://ej/swift.jpg", url: "#", disponible: true },
  { nombre: "ASUS Dual GeForce RTX 4060 OC 8GB GDDR6", precio: 420, moneda: "USD", imagen: "https://ej/4060.jpg", url: "#", disponible: true },
  { nombre: "Placa de Video Asus Dual RTX 4060 8GB", precio: 415, moneda: "USD", imagen: "https://ej/4060b.jpg", url: "#", disponible: true },
  { nombre: "Procesador AMD Ryzen 5 7600 AM5", precio: 210, moneda: "USD", imagen: "https://ej/7600.jpg", url: "#", disponible: true },
  { nombre: "Motherboard ASUS TUF Gaming B650-PLUS DDR5 ATX", precio: 190, moneda: "USD", imagen: "https://ej/b650.jpg", url: "#", disponible: true },
  { nombre: "Memoria RAM Kingston Fury 16GB DDR5 6000MHz", precio: 60, moneda: "USD", imagen: "https://ej/ram.jpg", url: "#", disponible: true },
  { nombre: "Diferencia equipo orden 263366", precio: 1420, moneda: "USD", imagen: null, url: "#", disponible: true },
  { nombre: "PC Gamer Armada Ryzen 5 7600 + RTX 4060", precio: 1200, moneda: "USD", imagen: null, url: "#", disponible: true },
  { nombre: "PC Gamer Ryzen 5 5600 / 16GB RAM / 500GB SSD / RTX 3060", precio: 1050, moneda: "USD", imagen: "https://ej/pc.jpg", url: "#", disponible: true },
  { nombre: "Computadora de Escritorio Intel Core i5 8GB 240GB", precio: 620, moneda: "USD", imagen: "https://ej/comp.jpg", url: "#", disponible: true },
  { nombre: "Notebook Lenovo IdeaPad Ryzen 5 7530U 16GB 512GB SSD 15.6\"", precio: 720, moneda: "USD", imagen: "https://ej/nb.jpg", url: "#", disponible: true },
  { nombre: "Laptop HP 250 G9 Intel Core i5 8GB 256GB", precio: 650, moneda: "USD", imagen: "https://ej/hp.jpg", url: "#", disponible: true },
  { nombre: "Base Cooler para Notebook con 5 ventiladores", precio: 25, moneda: "USD", imagen: "https://ej/base.jpg", url: "#", disponible: true },
  // Casos difíciles SIN la palabra "pc"/"notebook":
  { nombre: "Lenovo IdeaPad 3 15.6\" Ryzen 5 5500U 8GB 512GB SSD", precio: 700, moneda: "USD", imagen: "https://ej/l.jpg", url: "#", disponible: true },
  { nombre: "Equipo Intel Core i5-12400F 16GB RAM 500GB SSD RTX 3050", precio: 950, moneda: "USD", imagen: "https://ej/eq.jpg", url: "#", disponible: true },
  { nombre: "MSI GeForce GTX 1650 4GB GDDR5 Ventus XS", precio: 180, moneda: "USD", imagen: "https://ej/1650.jpg", url: "#", disponible: true },
  { nombre: "Gigabyte B550M DS3H DDR4 M.2 mATX", precio: 120, moneda: "USD", imagen: "https://ej/b550.jpg", url: "#", disponible: true },
  { nombre: "SSD Kingston NV2 1TB M.2 NVMe", precio: 70, moneda: "USD", imagen: "https://ej/ssd.jpg", url: "#", disponible: true },
  { nombre: "Fuente Corsair RM750e 750W 80+ Gold", precio: 110, moneda: "USD", imagen: "https://ej/f.jpg", url: "#", disponible: true },
  { nombre: "Monitor Samsung 27\" 165Hz Curvo", precio: 230, moneda: "USD", imagen: "https://ej/m.jpg", url: "#", disponible: true },
  { nombre: "Gabinete NZXT H510 Flow Vidrio Templado", precio: 90, moneda: "USD", imagen: "https://ej/h510.jpg", url: "#", disponible: true },
  { nombre: "Asus Prime H610M-K DDR4 LGA1700", precio: 105, moneda: "USD", imagen: "https://ej/h610.jpg", url: "#", disponible: true },
];

main().catch((e) => { console.error(e); process.exit(1); });
