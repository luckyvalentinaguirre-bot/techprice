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
  ["RAM", /memoria ram|\bram\b|\bddr[345]\b|\bdimm\b|sodimm/],
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

// Notebooks: se detectan ANTES que RAM/CPU/GPU, si no una "Notebook Ryzen 5 16GB"
// caería en RAM o CPU por tener esos componentes en el nombre.
const NOTEBOOK = /\bnotebook\b|\blaptop\b|port[aá]til|ultrabook|\bmacbook\b|\bnetbook\b|\b2 en 1\b|convertible/;

// PC pre-armadas / de escritorio (equipo completo). También ANTES que los
// componentes: una "PC Gamer Ryzen 5 + RTX 4060 + 16GB RAM" no es ni CPU ni GPU
// ni RAM, es un equipo armado.
const PREBUILT = /\bpc\s?gamer\b|\bpc\s?armad|\bpc\s?completa|\bpc\s?(de\s?)?escritorio|\bpc\s?oficina|\bpc\s?home\b|\bpc\s?full\b|\bpc\s?intel\b|\bpc\s?amd\b|\bpc\s?ryzen\b|computador(a)?\b|\bdesktop\b|equipo\s?(gamer|completo|armad|pc|de\s?escritorio)|combo\s?(pc|gamer)|mini\s?pc|all[\s-]?in[\s-]?one|\baio\s?pc\b|cpu\s?armad|torre\s?gamer/;

// Basura real (no son productos comparables): se descartan por completo.
const NOISE = /diferencia (de )?equipo|\bse[nñ]a\b|\breserva\b|garant[ií]a extendida|servicio t[eé]cnico|mano de obra|armado y (testeo|pruebas)|\bcuota[s]?\b|env[ií]o (gratis|a domicilio)?$/;

function esNotebook(n) {
  // Evitar accesorios: "soporte/base/cooler/funda para notebook" no es una notebook.
  if (/(soporte|base|funda|maletin|malet[ií]n|mochila|cooler|almohadilla|cargador|bater[ií]a|teclado|filtro)\b.*\bnotebook\b/.test(n)) return false;
  return NOTEBOOK.test(n);
}
function esPrebuilt(n) {
  if (PREBUILT.test(n)) return true;
  // "PC ..." al inicio del nombre + un componente de cómputo => equipo armado.
  if (/^\s*pc\b/.test(n) && /(ryzen|core\s?i\d|intel|rtx|gtx|geforce|radeon|\d+\s?gb)/.test(n)) return true;
  return false;
}

function clasificar(nombre) {
  const n = norm(nombre);
  if (esNotebook(n)) return "Notebook";
  if (esPrebuilt(n)) return "PC Armada";
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
async function detectPlatform(store) {
  const base = store.baseUrl.replace(/\/$/, "");
  const tries = [
    ["woocommerce", `${base}/wp-json/wc/store/v1/products?per_page=1`, (d) => d[0] && (d[0].prices || d[0].permalink)],
    ["tiendanube", `${base}/products.json?page=1`, (d) => d[0] && (d[0].variants || d[0].handle || d[0].name)],
    ["vtex", `${base}/api/catalog_system/pub/products/search?_from=0&_to=0`, (d) => d[0] && (d[0].items || d[0].productName || d[0].linkText)],
  ];
  for (const [plat, url, ok] of tries) {
    try {
      const data = await getJson(url, {}, 10000);
      if (Array.isArray(data) && data.length > 0 && ok(data)) return plat;
    } catch { /* probar la siguiente */ }
  }
  return null;
}

async function fromWoo(store) {
  const out = [];
  for (let page = 1; page <= (store.maxPages || 20); page++) {
    const url = `${store.baseUrl.replace(/\/$/, "")}/wp-json/wc/store/v1/products?page=${page}&per_page=100`;
    const arr = await getJson(url).catch(() => []);
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
  return out;
}

async function fromTiendanube(store) {
  const out = [];
  for (let page = 1; page <= (store.maxPages || 20); page++) {
    const url = `${store.baseUrl.replace(/\/$/, "")}/products.json?page=${page}`;
    const arr = await getJson(url).catch(() => []);
    if (!Array.isArray(arr) || arr.length === 0) break;
    for (const p of arr) {
      const v = (p.variants && p.variants[0]) || {};
      const nombre = typeof p.name === "object" ? p.name.es || Object.values(p.name)[0] : p.name;
      out.push({
        nombre, precio: parseFloat(v.price), moneda: store.moneda || "UYU",
        imagen: p.images?.[0]?.src || null, url: p.canonical_url || (store.baseUrl + "/" + (p.handle?.es || "")),
        disponible: v.available !== false,
      });
    }
    if (arr.length < 1) break;
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

const FETCHERS = { woocommerce: fromWoo, tiendanube: fromTiendanube, vtex: fromVtex, mercadolibre: fromMercadoLibre };

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
      preciosHoy.push({ producto: id, tienda: store.id, precio: Math.round(it.precio), moneda: it.moneda, disponible: it.disponible, fecha: HOY });
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

insert into precios (producto, tienda, precio, moneda, disponible, fecha) values
${ds.precios.map((r) => `(${r.producto}, ${r.tienda}, ${r.precio}, ${sqlv(r.moneda)}, ${r.disponible}, ${sqlv(r.fecha)})`).join(",\n")};
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
];

main().catch((e) => { console.error(e); process.exit(1); });
