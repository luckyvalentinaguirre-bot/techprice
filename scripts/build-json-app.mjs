/**
 * Genera la versión SIN base de datos: proyecto/ con index.html (diseño +
 * armador de PC), data/*.json (productos con specs, tiendas, precios con
 * historial) y usa js/app.js (la lógica). Reutiliza el globals.css del front.
 *
 *   node scripts/build-json-app.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "proyecto");
const css = readFileSync(resolve(ROOT, "apps/web/src/app/globals.css"), "utf8");

/* ============================ DATOS DE EJEMPLO ============================
 * Cada producto: { nombre, marca, categoria, base (UYU), nStores, trend%, specs }
 * Las specs son las que usa el armador para chequear compatibilidad.
 * ------------------------------------------------------------------------- */
const P = [
  // --- CPU Intel (LGA1700) ---
  { nombre: "Intel Core i3-12100F", marca: "Intel", categoria: "CPU", base: 5200, nStores: 3, trend: -1.5, specs: { plataforma: "Intel", socket: "LGA1700", tdp: 58 } },
  { nombre: "Intel Core i5-12400F", marca: "Intel", categoria: "CPU", base: 8200, nStores: 3, trend: -2.1, specs: { plataforma: "Intel", socket: "LGA1700", tdp: 65 } },
  { nombre: "Intel Core i5-13400F", marca: "Intel", categoria: "CPU", base: 11500, nStores: 4, trend: 1.8, specs: { plataforma: "Intel", socket: "LGA1700", tdp: 65 } },
  { nombre: "Intel Core i7-13700K", marca: "Intel", categoria: "CPU", base: 21000, nStores: 3, trend: -1.2, specs: { plataforma: "Intel", socket: "LGA1700", tdp: 125 } },
  // --- CPU AMD (AM5 / AM4) ---
  { nombre: "AMD Ryzen 5 5500", marca: "AMD", categoria: "CPU", base: 5200, nStores: 3, trend: -3.0, specs: { plataforma: "AMD", socket: "AM4", tdp: 65 } },
  { nombre: "AMD Ryzen 5 5600", marca: "AMD", categoria: "CPU", base: 7200, nStores: 3, trend: -2.4, specs: { plataforma: "AMD", socket: "AM4", tdp: 65 } },
  { nombre: "AMD Ryzen 5 7500F", marca: "AMD", categoria: "CPU", base: 10500, nStores: 3, trend: -1.0, specs: { plataforma: "AMD", socket: "AM5", tdp: 65 } },
  { nombre: "AMD Ryzen 5 7600", marca: "AMD", categoria: "CPU", base: 12900, nStores: 3, trend: 0, specs: { plataforma: "AMD", socket: "AM5", tdp: 65 } },
  { nombre: "AMD Ryzen 7 7700", marca: "AMD", categoria: "CPU", base: 18500, nStores: 2, trend: -0.8, specs: { plataforma: "AMD", socket: "AM5", tdp: 65 } },
  // --- Motherboards ---
  { nombre: "ASRock H610M-HDV/M.2", marca: "ASRock", categoria: "Motherboard", base: 3900, nStores: 3, trend: -1.0, specs: { plataforma: "Intel", socket: "LGA1700", chipset: "H610", ramType: "DDR4", formFactor: "mATX" } },
  { nombre: "MSI PRO B660M-A DDR4", marca: "MSI", categoria: "Motherboard", base: 5600, nStores: 3, trend: -1.6, specs: { plataforma: "Intel", socket: "LGA1700", chipset: "B660", ramType: "DDR4", formFactor: "mATX" } },
  { nombre: "Gigabyte B760 Gaming X DDR5", marca: "Gigabyte", categoria: "Motherboard", base: 8900, nStores: 3, trend: -2.2, specs: { plataforma: "Intel", socket: "LGA1700", chipset: "B760", ramType: "DDR5", formFactor: "ATX" } },
  { nombre: "ASUS TUF Gaming B650-PLUS", marca: "ASUS", categoria: "Motherboard", base: 7900, nStores: 3, trend: 1.4, specs: { plataforma: "AMD", socket: "AM5", chipset: "B650", ramType: "DDR5", formFactor: "ATX" } },
  { nombre: "Gigabyte X670 AORUS Elite AX", marca: "Gigabyte", categoria: "Motherboard", base: 14500, nStores: 2, trend: -0.6, specs: { plataforma: "AMD", socket: "AM5", chipset: "X670", ramType: "DDR5", formFactor: "ATX" } },
  { nombre: "MSI B550-A PRO", marca: "MSI", categoria: "Motherboard", base: 4800, nStores: 3, trend: -1.1, specs: { plataforma: "AMD", socket: "AM4", chipset: "B550", ramType: "DDR4", formFactor: "ATX" } },
  { nombre: "ASRock A520M-HDV", marca: "ASRock", categoria: "Motherboard", base: 3200, nStores: 2, trend: 0, specs: { plataforma: "AMD", socket: "AM4", chipset: "A520", ramType: "DDR4", formFactor: "mATX" } },
  // --- RAM ---
  { nombre: "Kingston Fury Beast 16GB DDR5 6000MHz", marca: "Kingston", categoria: "RAM", base: 3400, nStores: 3, trend: 0, specs: { ramType: "DDR5", capacidadGb: 16 } },
  { nombre: "Corsair Vengeance 32GB (2x16) DDR5 6000MHz", marca: "Corsair", categoria: "RAM", base: 6900, nStores: 2, trend: -4.0, specs: { ramType: "DDR5", capacidadGb: 32 } },
  { nombre: "Kingston Fury Beast 16GB DDR4 3200MHz", marca: "Kingston", categoria: "RAM", base: 2400, nStores: 3, trend: -1.2, specs: { ramType: "DDR4", capacidadGb: 16 } },
  { nombre: "Corsair Vengeance LPX 8GB DDR4 3200MHz", marca: "Corsair", categoria: "RAM", base: 1300, nStores: 3, trend: 0.5, specs: { ramType: "DDR4", capacidadGb: 8 } },
  // --- GPU ---
  { nombre: "Asus Dual RTX 4060 OC 8GB", marca: "Asus", categoria: "GPU", base: 18900, nStores: 3, trend: -5.2, specs: { tdp: 115 } },
  { nombre: "Sapphire Pulse Radeon RX 7600 8GB", marca: "Sapphire", categoria: "GPU", base: 16500, nStores: 2, trend: -2.0, specs: { tdp: 165 } },
  { nombre: "MSI Gaming X RTX 4060 Ti 16GB", marca: "MSI", categoria: "GPU", base: 26500, nStores: 2, trend: -3.1, specs: { tdp: 165 } },
  { nombre: "Gigabyte RTX 4070 WINDFORCE 12GB", marca: "Gigabyte", categoria: "GPU", base: 34000, nStores: 2, trend: -1.4, specs: { tdp: 200 } },
  // --- SSD ---
  { nombre: "Kingston A400 480GB SATA", marca: "Kingston", categoria: "SSD", base: 1500, nStores: 3, trend: -1.0, specs: { interfaz: "SATA" } },
  { nombre: "WD Black SN770 1TB NVMe", marca: "Western Digital", categoria: "SSD", base: 4200, nStores: 3, trend: -1.2, specs: { interfaz: "NVMe" } },
  { nombre: "Samsung 990 Pro 2TB NVMe", marca: "Samsung", categoria: "SSD", base: 14500, nStores: 3, trend: -6.1, specs: { interfaz: "NVMe" } },
  // --- Fuente ---
  { nombre: "Corsair CV550 550W", marca: "Corsair", categoria: "Fuente", base: 2600, nStores: 3, trend: -0.5, specs: { watts: 550, cert: "80+ White" } },
  { nombre: "Corsair RM650e 650W 80+ Gold", marca: "Corsair", categoria: "Fuente", base: 3600, nStores: 2, trend: -0.8, specs: { watts: 650, cert: "80+ Gold" } },
  { nombre: "Corsair RM750e 750W 80+ Gold", marca: "Corsair", categoria: "Fuente", base: 4300, nStores: 3, trend: -0.8, specs: { watts: 750, cert: "80+ Gold" } },
  { nombre: "Corsair RM850e 850W 80+ Gold", marca: "Corsair", categoria: "Fuente", base: 5200, nStores: 2, trend: 0, specs: { watts: 850, cert: "80+ Gold" } },
  // --- Gabinete ---
  { nombre: "Cooler Master MasterBox MB311L (mATX)", marca: "Cooler Master", categoria: "Gabinete", base: 2400, nStores: 3, trend: 0, specs: { formFactor: "mATX" } },
  { nombre: "NZXT H5 Flow (ATX)", marca: "NZXT", categoria: "Gabinete", base: 3200, nStores: 2, trend: 0, specs: { formFactor: "ATX" } },
  { nombre: "Lian Li A4-H2O (ITX)", marca: "Lian Li", categoria: "Gabinete", base: 5900, nStores: 2, trend: 1.0, specs: { formFactor: "ITX" } },
  // --- Cooler ---
  { nombre: "DeepCool AK400", marca: "DeepCool", categoria: "Cooler", base: 1600, nStores: 3, trend: -1.0, specs: { sockets: ["LGA1700", "AM5", "AM4"] } },
  { nombre: "Noctua NH-U12S redux", marca: "Noctua", categoria: "Cooler", base: 2300, nStores: 2, trend: 0, specs: { sockets: ["LGA1700", "AM5", "AM4"] } },
  // --- Periféricos (para el catálogo; no entran al armador) ---
  { nombre: 'LG UltraGear 27GP850 27" 165Hz', marca: "LG", categoria: "Monitor", base: 17000, nStores: 2, trend: -2.4, specs: {} },
  { nombre: "Logitech G Pro X Mecánico", marca: "Logitech", categoria: "Teclado", base: 4700, nStores: 3, trend: -1.1, specs: {} },
  { nombre: "Logitech G502 Hero", marca: "Logitech", categoria: "Mouse", base: 1900, nStores: 3, trend: 0.9, specs: {} },
  { nombre: "HyperX Cloud II", marca: "HyperX", categoria: "Auriculares", base: 2600, nStores: 2, trend: -2.0, specs: {} },
].map((p, i) => ({ id: i + 1, imagen: null, ...p }));

const stores = [
  [1, "PC Store Uruguay", "generic_html"],
  [2, "Hard PC", "generic_html"],
  [3, "ZonaTecno", "tiendanube"],
  [4, "Thot Computación", "woocommerce"],
  [5, "NNET", "generic_html"],
];
// Cada tienda tiene un factor de precio distinto para que el "más barato" varíe.
const storeFactor = { 1: 1.0, 2: 0.985, 3: 1.025, 4: 0.965, 5: 1.008 };
const DATES = ["2026-07-04", "2026-07-09", "2026-07-14", "2026-07-18", "2026-07-20"];

// PC Store (1) aparece en todo (buena cobertura); el resto rota.
const OTHERS = [4, 2, 3, 5];
function storesFor(id, n) {
  const set = [1];
  for (let j = 0; j < n - 1; j++) set.push(OTHERS[(id - 1 + j) % OTHERS.length]);
  return [...new Set(set)].slice(0, n);
}

const productosJson = P.map((p) => ({ id: p.id, nombre: p.nombre, marca: p.marca, categoria: p.categoria, imagen: p.imagen, specs: p.specs }));
const tiendasJson = stores.map(([id, nombre, plataforma]) => ({ id, nombre, plataforma }));

const precios = [];
for (const p of P) {
  const prev = 1 / (1 + p.trend / 100);
  const path = [prev * 1.05, prev * 1.035, prev * 1.02, prev, 1.0];
  for (const tienda of storesFor(p.id, p.nStores)) {
    const factor = storeFactor[tienda];
    for (let k = 0; k < DATES.length; k++) {
      precios.push({
        producto: p.id,
        tienda,
        precio: Math.round(p.base * factor * path[k]),
        moneda: "UYU",
        disponible: !(k === DATES.length - 1 && (p.id + tienda) % 11 === 0),
        fecha: DATES[k],
      });
    }
  }
}

mkdirSync(resolve(OUT, "data"), { recursive: true });
mkdirSync(resolve(OUT, "js"), { recursive: true });
const writeJson = (name, obj) => writeFileSync(resolve(OUT, "data", name), JSON.stringify(obj, null, 2) + "\n", "utf8");
writeJson("productos.json", productosJson);
writeJson("tiendas.json", tiendasJson);
writeJson("precios.json", precios);

/* ============================ CSS EXTRA ================================== */
const extraCss = `
/* --- versión JSON: buscador, modal, chart y armador --- */
.searchbar__submit { cursor: pointer; }
.section.is-hidden { display: none; }
[data-open], [data-cat] { cursor: pointer; }
[data-open]:focus-visible, [data-cat]:focus-visible {
  outline: 2px solid var(--brand); outline-offset: 2px; border-radius: var(--radius-md);
}

.modal-backdrop {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(16, 18, 22, 0.45);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 6vh 1rem 3rem; overflow: auto;
  opacity: 0; pointer-events: none; transition: opacity var(--dur) var(--ease);
}
.modal-backdrop.is-open { opacity: 1; pointer-events: auto; }
.modal {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-xl); width: 100%; max-width: 760px;
  box-shadow: var(--shadow-md); transform: translateY(6px);
  transition: transform var(--dur) var(--ease);
}
.modal-backdrop.is-open .modal { transform: none; }
.modal__head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 1rem; padding: var(--space-5) var(--space-5) var(--space-4);
  border-bottom: 1px solid var(--border);
}
.modal__brand { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: var(--muted-2); }
.modal__title { font-size: 1.2rem; font-weight: 650; letter-spacing: -0.02em; margin-top: 0.2rem; }
.modal__body { padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-5); }
.modal__section-title { font-size: 0.95rem; font-weight: 600; margin-bottom: var(--space-3); }

.chart svg { width: 100%; height: auto; display: block; }
.chart__area { fill: color-mix(in srgb, var(--brand) 8%, transparent); }
.chart__line { fill: none; stroke: var(--brand); stroke-width: 2; }
.chart__dot { fill: var(--surface); stroke: var(--brand); stroke-width: 2; }
.chart__label { fill: var(--muted-2); font-size: 11px; }
.chart__grid { stroke: var(--border); stroke-width: 1; }
.empty-results { color: var(--muted); padding: var(--space-6); text-align: center; }

/* ---- Armador de PC ---- */
.builder { display: grid; grid-template-columns: 1fr 340px; gap: var(--space-5); align-items: start; }
.builder__slots { display: flex; flex-direction: column; gap: var(--space-3); }
.slot {
  display: flex; align-items: center; gap: var(--space-4);
  padding: var(--space-4); background: var(--surface);
  border: 1px solid var(--border); border-radius: var(--radius-md);
}
.slot__icon {
  display: grid; place-items: center; width: 40px; height: 40px; flex-shrink: 0;
  border-radius: 10px; background: var(--surface-2); color: var(--brand);
}
.slot__main { flex: 1; min-width: 0; }
.slot__label { font-size: 0.75rem; color: var(--muted-2); }
.slot__value { font-size: 0.95rem; font-weight: 550; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.slot__empty { font-size: 0.9rem; color: var(--muted-2); }
.slot__price { font-size: 0.8rem; color: var(--muted); margin-top: 0.1rem; }
.slot__price b { color: var(--positive); font-weight: 700; }
.slot__actions { display: flex; gap: var(--space-2); flex-shrink: 0; }

.builder__summary {
  position: sticky; top: 84px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: var(--space-5);
  display: flex; flex-direction: column; gap: var(--space-4);
}
.summary__row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--space-3); font-size: 0.9rem; }
.summary__total { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.02em; }
.summary__hint { font-size: 0.8rem; color: var(--muted); }
.summary__best {
  padding: var(--space-3); border-radius: var(--radius-md);
  background: var(--positive-soft); color: var(--positive);
  font-size: 0.85rem; font-weight: 550; display: flex; gap: 0.4rem; align-items: flex-start;
}
.summary__best svg { flex-shrink: 0; margin-top: 1px; }
.summary__warn {
  padding: var(--space-3); border-radius: var(--radius-md);
  background: var(--negative-soft); color: var(--negative);
  font-size: 0.82rem; display: flex; gap: 0.4rem; align-items: flex-start;
}
.summary__note { font-size: 0.82rem; color: var(--muted); display: flex; gap: 0.4rem; align-items: flex-start; }
.summary__note svg, .summary__warn svg { flex-shrink: 0; margin-top: 1px; }

.pick-tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
.pick-tab { font: inherit; font-size: 0.85rem; font-weight: 550; padding: 0.35rem 0.8rem; border-radius: var(--radius-pill); border: 1px solid var(--border-strong); background: var(--surface); color: var(--muted); cursor: pointer; }
.pick-tab.is-active { background: var(--brand); border-color: var(--brand); color: #fff; }
.pick-list { display: flex; flex-direction: column; gap: var(--space-2); max-height: 52vh; overflow: auto; }
.pick-item {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4); border: 1px solid var(--border);
  border-radius: var(--radius-md); background: var(--surface);
}
.pick-item__main { flex: 1; min-width: 0; }
.pick-item__name { font-size: 0.9rem; font-weight: 550; }
.pick-item__spec { font-size: 0.76rem; color: var(--muted-2); }
.pick-item__price { font-size: 0.95rem; font-weight: 700; color: var(--positive); white-space: nowrap; }

@media (max-width: 860px) {
  .builder { grid-template-columns: 1fr; }
  .builder__summary { position: static; }
}
`;

/* ============================ HTML SHELL ================================= */
const ic = (paths, size = 18, cls = "") =>
  `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const G = {
  chart: '<path d="M4 4v16h16M8 15l3-4 3 2 4-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  wrench: '<path d="M14.5 5.5a3.5 3.5 0 0 0-4.6 4.3L3 16.7V21h4.3l6.9-6.9a3.5 3.5 0 0 0 4.3-4.6l-2.4 2.4-2.1-.5-.5-2.1 2.4-2.4Z"/>',
  github:
    '<path d="M9 19c-4 1.4-4-2.4-5.5-3M15 21v-3.2c0-.9.2-1.6-.5-2.2 2.3-.3 4.5-1.2 4.5-5a3.8 3.8 0 0 0-1-2.7 3.6 3.6 0 0 0-.1-2.7s-.9-.3-3 1a12 12 0 0 0-6 0C6 3.9 5 4.2 5 4.2a3.6 3.6 0 0 0-.1 2.7A3.8 3.8 0 0 0 4 9.6c0 3.7 2.2 4.7 4.5 5-.5.5-.5 1-.5 1.8V21"/>',
  x: '<path d="M4 4l16 16M20 4 4 20"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17 7h.01"/>',
};

const html = `<!doctype html>
<html lang="es-UY">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>TechPrice Uruguay — Compará precios y armá tu PC</title>
<meta name="description" content="Comparador de precios de tecnología entre tiendas de Uruguay + armador de PC con compatibilidad." />
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%232563eb'/><path d='M8 8v16h16' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/><path d='M10 19l4-5 3 2 5-7' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/></svg>" />
<meta property="og:type" content="website" />
<meta property="og:title" content="TechPrice Uruguay — Compará precios y armá tu PC" />
<meta property="og:description" content="El mejor precio entre múltiples tiendas de Uruguay, historial de precios y armador de PC con compatibilidad." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
:root { --font-inter: "Inter"; }
${css}
${extraCss}
</style>
</head>
<body>
<header class="site-header">
  <div class="container site-header__inner">
    <a href="#" class="brand"><span class="brand__mark">${ic(G.chart, 18)}</span>TechPrice <span>Uruguay</span></a>
    <nav class="site-nav">
      <a href="#section-destacados">Productos</a>
      <a href="#section-armar" class="site-nav__cta">Armá tu PC</a>
    </nav>
  </div>
</header>

<main>
  <div class="container">
    <section class="hero">
      <span class="hero__eyebrow"><span class="dot"></span> Precios de tecnología en Uruguay, en un solo lugar</span>
      <h1>Compará precios y armá tu PC.</h1>
      <p class="hero__subtitle">Encontrá el mejor precio entre múltiples tiendas, seguí el historial y armá una PC compatible pieza por pieza — sin ruido, solo la información.</p>
      <div class="hero__search">
        <form class="searchbar" role="search" id="search-form">
          ${ic(G.search, 22, "searchbar__icon")}
          <input type="search" id="search-input" placeholder="Buscá una RTX 4060, un i5-13400F, un SSD 2TB…" aria-label="Buscar producto" autocomplete="off" />
          <button type="submit" class="searchbar__submit"><span class="searchbar__submit-label">Buscar</span>${ic(G.arrowRight, 18)}</button>
        </form>
      </div>
      <div class="statbar" aria-label="Estado de la plataforma">
        <div class="statbar__item"><span class="statbar__value" id="stat-productos">—</span><span class="statbar__label">Productos indexados</span></div>
        <span class="statbar__divider"></span>
        <div class="statbar__item"><span class="statbar__value" id="stat-tiendas">—</span><span class="statbar__label">Tiendas</span></div>
        <span class="statbar__divider"></span>
        <div class="statbar__item"><span class="statbar__value" id="stat-actualizacion">—</span><span class="statbar__label">Última actualización</span></div>
        <span class="statbar__divider"></span>
        <div class="statbar__item"><span class="statbar__value" id="stat-usuarios">—</span><span class="statbar__label">Usuarios activos</span></div>
      </div>
    </section>

    <section class="section" id="section-armar">
      <div class="section__head"><div><h2 class="section__title">Armá tu PC</h2><p class="section__subtitle">Elegí las partes: solo te dejamos combinar componentes compatibles (Intel/AMD, socket, tipo de RAM, gabinete) y te decimos dónde conviene comprar.</p></div>
        <button class="section__link" id="reset-build" type="button">Vaciar selección</button></div>
      <div class="builder">
        <div class="builder__slots" id="builder-slots"></div>
        <aside class="builder__summary" id="builder-summary"></aside>
      </div>
    </section>

    <section class="section" id="section-categorias">
      <div class="section__head"><div><h2 class="section__title">Explorá por categoría</h2><p class="section__subtitle">Componentes y productos individuales, con la cantidad de productos comparados.</p></div></div>
      <div class="category-strip" id="grid-categorias"></div>
    </section>

    <section class="section" id="section-destacados">
      <div class="section__head"><div><h2 class="section__title" id="title-destacados">Productos destacados</h2><p class="section__subtitle" id="subtitle-destacados">El mejor precio, el promedio y cuánto se movió respecto al día anterior.</p></div></div>
      <div class="showcase-grid" id="grid-destacados"></div>
    </section>

    <section class="section" id="section-bajaron">
      <div class="section__head"><div><h2 class="section__title">Bajaron de precio</h2><p class="section__subtitle">Productos cuyo mejor precio disminuyó recientemente. Cuánto bajó, cuánto ahorrás y hace cuánto.</p></div></div>
      <div class="drops-grid" id="grid-bajaron"></div>
    </section>

    <section class="section" id="section-tendencias">
      <div class="section__head"><div><h2 class="section__title">Tendencias</h2><p class="section__subtitle">Lo más comparado, las mayores subidas y bajadas, y lo recién agregado.</p></div></div>
      <div id="grid-tendencias"></div>
    </section>

    <section class="section" id="section-tiendas">
      <div class="section__head"><div><h2 class="section__title">Tiendas</h2><p class="section__subtitle">Las tiendas que comparamos, con su cobertura y última actualización.</p></div></div>
      <div class="stores-grid" id="grid-tiendas"></div>
    </section>
  </div>
</main>

<footer class="site-footer">
  <div class="container">
    <div class="site-footer__inner">
      <div class="site-footer__brandcol">
        <span class="brand"><span class="brand__mark">${ic(G.chart, 18)}</span>TechPrice <span>Uruguay</span></span>
        <p>Herramienta para analizar y comparar precios de tecnología entre tiendas de Uruguay, y armar una PC compatible al mejor precio.</p>
      </div>
      <div class="footer-col"><h4>Producto</h4><ul><li><a href="#section-destacados">Productos</a></li><li><a href="#section-armar">Armá tu PC</a></li><li><a href="#section-tendencias">Tendencias</a></li></ul></div>
      <div class="footer-col"><h4>Categorías</h4><ul><li><a href="#">Tarjetas gráficas</a></li><li><a href="#">Procesadores</a></li><li><a href="#">Motherboards</a></li><li><a href="#">Fuentes</a></li></ul></div>
      <div class="footer-col"><h4>Plataforma</h4><ul><li><a href="#section-tiendas">Tiendas</a></li><li><a href="#">Contacto</a></li><li><a href="#">Política de privacidad</a></li><li><a href="#">Términos</a></li></ul></div>
    </div>
    <div class="site-footer__bar">
      <span>© <span id="year"></span> TechPrice Uruguay — versión local (JSON)</span>
      <div class="site-footer__social">
        <a href="#" aria-label="GitHub">${ic(G.github, 17)}</a>
        <a href="#" aria-label="X">${ic(G.x, 17)}</a>
        <a href="#" aria-label="Instagram">${ic(G.instagram, 17)}</a>
      </div>
    </div>
  </div>
</footer>

<div class="modal-backdrop" id="modal-root" role="dialog" aria-modal="true" hidden></div>

<script src="js/app.js"></script>
</body>
</html>`;

writeFileSync(resolve(OUT, "index.html"), html, "utf8");
console.log("proyecto/ generado. Productos:", productosJson.length, "| Precios:", precios.length);
