/**
 * Genera la versión SIN base de datos: proyecto/ con index.html (diseño),
 * data/*.json (productos, tiendas, precios con historial) y deja lugar para
 * js/app.js (la lógica). Reutiliza el mismo globals.css del frontend.
 *
 *   node scripts/build-json-app.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, "proyecto");
const css = readFileSync(resolve(ROOT, "apps/web/src/app/globals.css"), "utf8");

/* ============================ DATOS DE EJEMPLO ============================ */
// [id, nombre, marca, categoria, precioBase (UYU), #tiendas, cambio% reciente]
const products = [
  [1, "Asus Dual RTX 4060 OC 8GB", "Asus", "GPU", 18900, 3, -5.2],
  [2, "MSI Gaming X RTX 4060 Ti 16GB", "MSI", "GPU", 26500, 2, -3.1],
  [3, "Intel Core i5-13400F", "Intel", "CPU", 11500, 3, 1.8],
  [4, "AMD Ryzen 5 7600", "AMD", "CPU", 12900, 2, -2.4],
  [5, "Kingston Fury Beast 16GB DDR5 6000MHz", "Kingston", "RAM", 3400, 3, 0],
  [6, "Corsair Vengeance 32GB DDR5 6000MHz", "Corsair", "RAM", 6900, 2, -4.0],
  [7, "Samsung 990 Pro 2TB NVMe", "Samsung", "SSD", 14500, 3, -6.1],
  [8, "WD Black SN770 1TB NVMe", "Western Digital", "SSD", 4200, 2, -1.2],
  [9, 'LG UltraGear 27GP850 27" 165Hz', "LG", "Monitor", 17000, 2, -2.4],
  [10, 'Samsung Odyssey G5 27" 144Hz', "Samsung", "Monitor", 12500, 3, 2.1],
  [11, "Lenovo IdeaPad 3 Ryzen 5 8GB 512GB", "Lenovo", "Notebook", 27000, 2, -3.3],
  [12, "Acer Swift 3 i7-1165G7 8GB 512GB", "Acer", "Notebook", 31600, 2, -1.1],
  [13, "Logitech G Pro X Mecánico", "Logitech", "Teclado", 4700, 3, -1.1],
  [14, "Redragon Kumara K552", "Redragon", "Teclado", 1800, 2, 0],
  [15, "Logitech G502 Hero", "Logitech", "Mouse", 1900, 3, 0.9],
  [16, "HyperX Cloud II", "HyperX", "Auriculares", 2600, 2, -2.0],
  [17, "ASUS TUF Gaming B650-PLUS", "Asus", "Motherboard", 7900, 2, 1.4],
  [18, "Corsair RM750e 750W 80+ Gold", "Corsair", "Fuente", 4300, 2, -0.8],
  [19, "NZXT H5 Flow", "NZXT", "Gabinete", 3200, 2, 0],
];
const stores = [
  [1, "PC Store Uruguay", "generic_html"],
  [2, "Hard PC", "generic_html"],
  [3, "ZonaTecno", "tiendanube"],
  [4, "Thot Computación", "woocommerce"],
  [5, "NNET", "generic_html"],
];
const DATES = ["2026-07-04", "2026-07-09", "2026-07-14", "2026-07-18", "2026-07-20"];

const productosJson = products.map(([id, nombre, marca, categoria]) => ({ id, nombre, marca, categoria, imagen: null }));
const tiendasJson = stores.map(([id, nombre, plataforma]) => ({ id, nombre, plataforma }));

const precios = [];
for (const [id, , , , base, nStores, trend] of products) {
  const prev = 1 / (1 + trend / 100); // multiplicador de la fecha anterior a la última
  const path = [prev * 1.05, prev * 1.035, prev * 1.02, prev, 1.0];
  for (let i = 0; i < nStores; i++) {
    const tienda = ((id + i - 1) % stores.length) + 1;
    const baseStore = Math.round(base * (1 + 0.03 * i));
    const agotado = i === nStores - 1 && id % 4 === 0;
    for (let k = 0; k < DATES.length; k++) {
      precios.push({
        producto: id,
        tienda,
        precio: Math.round(baseStore * path[k]),
        moneda: "UYU",
        disponible: k === DATES.length - 1 ? !agotado : true,
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

/* ============================ CSS EXTRA (modal, buscador, chart) ========= */
const extraCss = `
/* --- versión JSON: buscador, modal de detalle y mini-chart --- */
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
.modal__brand {
  font-size: 0.72rem; font-weight: 600; letter-spacing: 0.04em;
  text-transform: uppercase; color: var(--muted-2);
}
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
`;

/* ============================ HTML SHELL ================================= */
const ic = (paths, size = 18, cls = "") =>
  `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const P = {
  chart: '<path d="M4 4v16h16M8 15l3-4 3 2 4-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
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
<title>TechPrice Uruguay — Compará precios de tecnología</title>
<meta name="description" content="Comparador de precios de tecnología entre tiendas de Uruguay (versión local con archivos JSON)." />
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
    <a href="#" class="brand"><span class="brand__mark">${ic(P.chart, 18)}</span>TechPrice <span>Uruguay</span></a>
    <nav class="site-nav">
      <a href="#section-destacados">Productos</a>
      <a href="#section-tiendas" class="site-nav__cta">Tiendas</a>
    </nav>
  </div>
</header>

<main>
  <div class="container">
    <section class="hero">
      <span class="hero__eyebrow"><span class="dot"></span> Precios de tecnología en Uruguay, en un solo lugar</span>
      <h1>Compará precios de tecnología en Uruguay.</h1>
      <p class="hero__subtitle">Encontrá el mejor precio entre múltiples tiendas y seguí la evolución del valor de cada producto — sin ruido, solo la información.</p>
      <div class="hero__search">
        <form class="searchbar" role="search" id="search-form">
          ${ic(P.search, 22, "searchbar__icon")}
          <input type="search" id="search-input" placeholder="Buscá una RTX 4060, un i5-13400F, un SSD 2TB…" aria-label="Buscar producto" autocomplete="off" />
          <button type="submit" class="searchbar__submit"><span class="searchbar__submit-label">Buscar</span>${ic(P.arrowRight, 18)}</button>
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
        <span class="brand"><span class="brand__mark">${ic(P.chart, 18)}</span>TechPrice <span>Uruguay</span></span>
        <p>Herramienta para analizar y comparar precios de tecnología entre tiendas de Uruguay. Comparamos componentes y productos individuales, no PCs armadas.</p>
      </div>
      <div class="footer-col"><h4>Producto</h4><ul><li><a href="#section-destacados">Productos</a></li><li><a href="#section-bajaron">Productos que bajaron</a></li><li><a href="#section-tendencias">Tendencias</a></li></ul></div>
      <div class="footer-col"><h4>Categorías</h4><ul><li><a href="#">Tarjetas gráficas</a></li><li><a href="#">Procesadores</a></li><li><a href="#">Monitores</a></li><li><a href="#">Notebooks</a></li></ul></div>
      <div class="footer-col"><h4>Plataforma</h4><ul><li><a href="#section-tiendas">Tiendas</a></li><li><a href="#">Contacto</a></li><li><a href="#">Política de privacidad</a></li><li><a href="#">Términos</a></li></ul></div>
    </div>
    <div class="site-footer__bar">
      <span>© <span id="year"></span> TechPrice Uruguay — versión local (JSON)</span>
      <div class="site-footer__social">
        <a href="#" aria-label="GitHub">${ic(P.github, 17)}</a>
        <a href="#" aria-label="X">${ic(P.x, 17)}</a>
        <a href="#" aria-label="Instagram">${ic(P.instagram, 17)}</a>
      </div>
    </div>
  </div>
</footer>

<div class="modal-backdrop" id="modal-root" role="dialog" aria-modal="true" hidden></div>

<script src="js/app.js"></script>
</body>
</html>`;

writeFileSync(resolve(OUT, "index.html"), html, "utf8");
console.log("proyecto/index.html + data/*.json generados. Productos:", productosJson.length, "| Precios:", precios.length);
