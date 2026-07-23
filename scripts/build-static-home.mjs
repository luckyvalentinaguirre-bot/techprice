/**
 * Genera una versión estática y autocontenida de la Home (un solo index.html
 * con estilos e íconos embebidos y datos de ejemplo). Pensada para abrir con
 * doble clic o servir desde XAMPP (htdocs) sin Node, API ni base de datos.
 *
 *   node scripts/build-static-home.mjs
 *   -> escribe static/index.html
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(resolve(ROOT, "apps/web/src/app/globals.css"), "utf8");

/* ---------------------------------------------------------------- íconos ---
   Mismos glifos que apps/web/src/components/home/Icon.tsx (24×24, stroke 1.75). */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  store: '<path d="M4 9h16l-1-4H5L4 9Zm0 0v10h16V9M9 19v-5h6v5"/>',
  chart: '<path d="M4 4v16h16M8 15l3-4 3 2 4-6"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 21a2 2 0 0 0 4 0"/>',
  trendingUp: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  trendingDown: '<path d="M3 7l6 6 4-4 8 8M15 17h6v-6"/>',
  flame: '<path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s0 2 2 2c1.5 0 2-1.5 1-4-.6-1.4 1-3 0-4Z"/>',
  plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  github:
    '<path d="M9 19c-4 1.4-4-2.4-5.5-3M15 21v-3.2c0-.9.2-1.6-.5-2.2 2.3-.3 4.5-1.2 4.5-5a3.8 3.8 0 0 0-1-2.7 3.6 3.6 0 0 0-.1-2.7s-.9-.3-3 1a12 12 0 0 0-6 0C6 3.9 5 4.2 5 4.2a3.6 3.6 0 0 0-.1 2.7A3.8 3.8 0 0 0 4 9.6c0 3.7 2.2 4.7 4.5 5-.5.5-.5 1-.5 1.8V21"/>',
  x: '<path d="M4 4l16 16M20 4 4 20"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17 7h.01"/>',
  gpu: '<path d="M3 6h15a2 2 0 0 1 2 2v7H7a2 2 0 0 1-2-2V6ZM3 6v13M9 15v3M14 15v3M9 9.5h6M9 12h4"/>',
  cpu: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 10.5h4v4h-4zM9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2"/>',
  memory: '<path d="M4 8h16v8H4zM7 8V6M12 8V6M17 8V6M6 20v-4M10 20v-4M14 20v-4M18 20v-4"/>',
  drive: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15h6"/><circle cx="16.5" cy="15" r="1"/>',
  board: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4v4h4M16 20v-4M8 12h3v4M16 8h-3M14 12h2v2"/><circle cx="8" cy="16" r="1"/>',
  power: '<path d="M12 3v8M8 6a7 7 0 1 0 8 0"/>',
  case: '<path d="M6 3h12v18H6zM9 6h6M9 9h6M10 20v-2h4v2"/>',
  monitor: '<path d="M3 5h18v11H3zM8 20h8M12 16v4"/>',
  keyboard: '<rect x="3" y="7" width="18" height="10" rx="1.5"/><path d="M7 10h.01M11 10h.01M15 10h.01M8 13h8"/>',
  mouse: '<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 7v3"/>',
  headphones: '<path d="M4 13a8 8 0 0 1 16 0M4 13v4a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2Zm16 0v4a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2Z"/>',
  laptop: '<path d="M5 6h14v10H5zM3 19h18M9 19l.5-3h5l.5 3"/>',
  box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3ZM4 7.5l8 4.5 8-4.5M12 12v9"/>',
};
const icon = (name, size = 20, cls = "") =>
  `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ICONS.box}</svg>`;

const CAT_ICON = {
  gpu: "gpu", cpu: "cpu", ram: "memory", ssd: "drive", monitor: "monitor",
  notebook: "laptop", motherboard: "board", keyboard: "keyboard", mouse: "mouse",
  headset: "headphones", power_supply: "power", case: "case",
};

/* ------------------------------------------------------------- utilidades --- */
const money = (n) => new Intl.NumberFormat("es-UY", { style: "currency", currency: "UYU", maximumFractionDigits: 0 }).format(n);
const num = (n) => new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 }).format(n);
const pct = (n) => `${n > 0 ? "+" : ""}${new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 }).format(n)}%`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ------------------------------------------------------------------ datos --- */
const stores = ["PC Store Uruguay", "Hard PC", "ZonaTecno", "NNET"];
function mk(id, name, brand, cat, base, nStores, changePct) {
  const offers = Array.from({ length: nStores }, (_, i) => Math.round(base * (1 + i * 0.03)));
  const low = Math.min(...offers), high = Math.max(...offers);
  const avg = Math.round(offers.reduce((a, b) => a + b, 0) / offers.length);
  const prev = changePct ? Math.round(low / (1 + changePct / 100)) : null;
  return {
    id, name, brand, cat, nStores, low, avg, high,
    change: changePct ? { cur: low, prev, amount: low - prev, pct: changePct } : null,
    updated: "hace 2 h",
  };
}
const featured = [
  mk("gpu1", "ASUS Dual GeForce RTX 5070 OC 12GB GDDR7", "ASUS", "gpu", 719900, 3, -4.2),
  mk("cpu1", "Intel Core i5-13400F 10 núcleos", "Intel", "cpu", 275000, 3, 1.8),
  mk("ssd1", "Samsung 990 Pro 2TB NVMe M.2", "Samsung", "ssd", 339900, 3, -6.1),
  mk("mon1", 'LG UltraGear 27GP850 27" 165Hz QHD', "LG", "monitor", 425000, 2, -2.4),
  mk("ram1", "Kingston Fury Beast 16GB DDR5 6000MHz", "Kingston", "ram", 84500, 2, 0),
  mk("note1", "Lenovo IdeaPad 3 Ryzen 5 8GB 512GB SSD", "Lenovo", "notebook", 899000, 1, -3.3),
  mk("kb1", "Logitech G Pro X Mecánico TKL", "Logitech", "keyboard", 118000, 2, -1.1),
  mk("gpu2", "MSI Gaming X RTX 5060 Ti 16GB", "MSI", "gpu", 561000, 2, -5.0),
];
const drops = featured.filter((c) => c.change && c.change.amount < 0).sort((a, b) => a.change.pct - b.change.pct);
const rises = featured.filter((c) => c.change && c.change.amount > 0).sort((a, b) => b.change.pct - a.change.pct);
const categories = [
  ["gpu", "Tarjetas gráficas (GPU)", 142], ["cpu", "Procesadores (CPU)", 98],
  ["ram", "Memorias RAM", 76], ["ssd", "SSD", 121], ["monitor", "Monitores", 89],
  ["notebook", "Notebooks", 64], ["motherboard", "Motherboards", 57], ["keyboard", "Teclados", 45],
  ["mouse", "Mouse", 38], ["headset", "Auriculares", 41], ["power_supply", "Fuentes", 33], ["case", "Gabinetes", 29],
];
const storeCards = [
  ["PS", "PC Store Uruguay", "generic html", 1120, "Actualizada", true],
  ["HP", "Hard PC", "generic html", 980, "hace 2 h", true],
  ["Z", "ZonaTecno", "tiendanube", 1340, "hace 5 h", true],
  ["N", "NNET", "generic html", 520, "hace 4 días", false],
];

/* --------------------------------------------------------------- fragmentos --- */
const deltaPill = (c) => {
  if (!c.change || c.change.amount === 0) return "";
  const down = c.change.amount < 0;
  return `<span class="showcase-card__delta ${down ? "delta--down" : "delta--up"}">${icon(down ? "trendingDown" : "trendingUp", 13)}${pct(c.change.pct)}</span>`;
};
const showcaseCard = (c) => `
  <article class="showcase-card">
    <a class="showcase-card__media" href="#" aria-label="${esc(c.name)}">
      <span class="showcase-card__placeholder">${icon("box", 26)}</span>
      ${deltaPill(c)}
    </a>
    <div class="showcase-card__body">
      <span class="showcase-card__brand">${esc(c.brand)}</span>
      <a href="#"><h3 class="showcase-card__name">${esc(c.name)}</h3></a>
      <div class="showcase-card__prices">
        <span class="showcase-card__price">${money(c.low)}</span>
        <span class="showcase-card__avg">prom. <b>${money(c.avg)}</b></span>
      </div>
      <div class="showcase-card__meta">
        <span>${icon("store")}${c.nStores} ${c.nStores === 1 ? "tienda" : "tiendas"}</span>
        <span>${icon("clock")}${c.updated}</span>
      </div>
    </div>
    <div class="showcase-card__actions">
      <a href="#" class="btn btn--primary">${icon("chart", 15)} Ver historial</a>
      <button type="button" class="btn btn--icon js-alert" aria-pressed="false" title="Avisarme cuando baje de precio" aria-label="Activar alerta para ${esc(c.name)}">${icon("bell", 16)}</button>
    </div>
  </article>`;

const dropCard = (c) => `
  <a href="#" class="drop-card">
    <div class="drop-card__thumb"><span class="showcase-card__placeholder">${icon("box", 20)}</span></div>
    <div class="drop-card__body">
      <span class="drop-card__pct">${icon("trendingDown", 13)}${pct(c.change.pct)}</span>
      <p class="drop-card__name">${esc(c.name)}</p>
      <div class="drop-card__prices">
        <span class="drop-card__now">${money(c.change.cur)}</span>
        <span class="drop-card__was">${money(c.change.prev)}</span>
      </div>
      <div class="drop-card__foot">
        <span class="drop-card__saved">Ahorrás <b>${money(Math.abs(c.change.amount))}</b></span>
        <span>hace 1 día</span>
      </div>
    </div>
  </a>`;

const trendRow = (c, i, sub, val, valClass = "") => `
  <li class="trend-item">
    <span class="trend-item__rank">${i + 1}</span>
    <a href="#" class="trend-item__body">
      <span class="trend-item__name">${esc(c.name)}</span>
      <span class="trend-item__sub">${sub}</span>
    </a>
    <span class="trend-item__val ${valClass}">${val}</span>
  </li>`;

const trendCol = (title, ic, mod, rows) => `
  <div class="trend-col">
    <div class="trend-col__head ${mod}"><span class="ico">${icon(ic)}</span>${title}</div>
    <ol class="trend-list">${rows}</ol>
  </div>`;

const mostCompared = [...featured].sort((a, b) => b.nStores - a.nStores).slice(0, 6);
const recent = featured.slice(2, 8);

const trends = `
  <div class="trends-grid">
    ${trendCol("Más comparados", "flame", "trend-col__head--hot",
      mostCompared.map((c, i) => trendRow(c, i, money(c.low), `${c.nStores} ${c.nStores === 1 ? "tienda" : "tiendas"}`)).join(""))}
    ${trendCol("Mayor subida", "trendingUp", "trend-col__head--up",
      rises.map((c, i) => trendRow(c, i, money(c.change.cur), pct(c.change.pct), "val--neg")).join(""))}
    ${trendCol("Mayor bajada", "trendingDown", "trend-col__head--down",
      drops.map((c, i) => trendRow(c, i, money(c.change.cur), pct(c.change.pct), "val--pos")).join(""))}
    ${trendCol("Recién agregados", "plus", "",
      recent.map((c, i) => trendRow(c, i, `${c.nStores} ${c.nStores === 1 ? "tienda" : "tiendas"}`, money(c.low))).join(""))}
  </div>`;

const section = (title, subtitle, link, body) => `
  <section class="section">
    <div class="section__head">
      <div>
        <h2 class="section__title">${title}</h2>
        <p class="section__subtitle">${subtitle}</p>
      </div>
      ${link ? `<a href="#" class="section__link">${link} ${icon("arrowRight", 16)}</a>` : ""}
    </div>
    ${body}
  </section>`;

const footerCols = [
  ["Producto", ["Productos", "Productos que bajaron", "Tendencias"]],
  ["Categorías", ["Tarjetas gráficas", "Procesadores", "Monitores", "Notebooks"]],
  ["Plataforma", ["Tiendas", "Contacto", "Política de privacidad", "Términos"]],
];

/* ------------------------------------------------------------------- HTML --- */
const html = `<!doctype html>
<html lang="es-UY">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>TechPrice Uruguay — Compará precios de tecnología</title>
<meta name="description" content="Comparador de precios de tecnología entre tiendas de Uruguay." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
:root { --font-inter: "Inter"; }
${css}
</style>
</head>
<body>
<header class="site-header">
  <div class="container site-header__inner">
    <a href="#" class="brand"><span class="brand__mark">${icon("chart", 18)}</span>TechPrice <span>Uruguay</span></a>
    <nav class="site-nav">
      <a href="#">Productos</a>
      <a href="#" class="site-nav__cta">Explorar</a>
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
        <form class="searchbar" role="search" onsubmit="return false">
          ${icon("search", 22, "searchbar__icon")}
          <input type="search" placeholder="Buscá una RTX 5070, un i5-13400F, un SSD 2TB…" aria-label="Buscar producto" autocomplete="off" />
          <button type="submit" class="searchbar__submit"><span class="searchbar__submit-label">Buscar</span>${icon("arrowRight", 18)}</button>
        </form>
      </div>
      <div class="statbar" aria-label="Estado de la plataforma">
        <div class="statbar__item"><span class="statbar__value">${num(1284)}</span><span class="statbar__label">Productos indexados</span></div>
        <span class="statbar__divider"></span>
        <div class="statbar__item"><span class="statbar__value">4</span><span class="statbar__label">Tiendas</span></div>
        <span class="statbar__divider"></span>
        <div class="statbar__item"><span class="statbar__value">${icon("clock", 16)} hace 42 min</span><span class="statbar__label">Última actualización</span></div>
        <span class="statbar__divider"></span>
        <div class="statbar__item"><span class="statbar__value">${num(5432)}</span><span class="statbar__label">Usuarios activos</span></div>
      </div>
    </section>

    ${section("Explorá por categoría", "Componentes y productos individuales, organizados y con la cantidad de fichas comparadas.", "Ver todas",
      `<div class="category-strip">${categories.map(([id, label, count]) => `
        <a href="#" class="category-chip">
          <span class="category-chip__icon">${icon(CAT_ICON[id] || "box", 20)}</span>
          <span class="category-chip__body">
            <span class="category-chip__name">${esc(label)}</span>
            <span class="category-chip__count">${num(count)} ${count === 1 ? "producto" : "productos"}</span>
          </span>
        </a>`).join("")}</div>`)}

    ${section("Productos destacados", "Las fichas más recientes: el mejor precio, el promedio y cuánto se movió respecto al día anterior.", "Ver todos",
      `<div class="showcase-grid">${featured.map(showcaseCard).join("")}</div>`)}

    ${section("Bajaron de precio", "Productos cuyo mejor precio disminuyó recientemente. Cuánto bajó, cuánto ahorrás y hace cuánto.", null,
      `<div class="drops-grid">${drops.map(dropCard).join("")}</div>`)}

    ${section("Tendencias", "Lo más comparado, las mayores subidas y bajadas, y lo recién agregado al catálogo.", null, trends)}

    ${section("Tiendas", "Las tiendas que sincronizamos, con su cobertura y estado de actualización.", null,
      `<div class="stores-grid">${storeCards.map(([ini, name, plat, count, sync, ok]) => `
        <div class="store-card">
          <div class="store-card__top">
            <span class="store-card__logo" aria-hidden>${ini}</span>
            <div style="min-width:0">
              <div class="store-card__name">${esc(name)}</div>
              <div class="store-card__platform">${plat}</div>
            </div>
          </div>
          <div class="store-card__foot">
            <span class="store-card__count"><b>${num(count)}</b> ${count === 1 ? "producto" : "productos"}</span>
            <span class="store-status ${ok ? "store-status--ok" : "store-status--stale"}"><span class="dot"></span>${sync}</span>
          </div>
        </div>`).join("")}</div>`)}
  </div>
</main>

<footer class="site-footer">
  <div class="container">
    <div class="site-footer__inner">
      <div class="site-footer__brandcol">
        <span class="brand"><span class="brand__mark">${icon("chart", 18)}</span>TechPrice <span>Uruguay</span></span>
        <p>Herramienta para analizar y comparar precios de tecnología entre tiendas de Uruguay. Comparamos componentes y productos individuales, no PCs armadas.</p>
      </div>
      ${footerCols.map(([h, links]) => `
        <div class="footer-col">
          <h4>${h}</h4>
          <ul>${links.map((l) => `<li><a href="#">${l}</a></li>`).join("")}</ul>
        </div>`).join("")}
    </div>
    <div class="site-footer__bar">
      <span>© ${new Date().getFullYear()} TechPrice Uruguay</span>
      <div class="site-footer__social">
        <a href="#" aria-label="GitHub">${icon("github", 17)}</a>
        <a href="#" aria-label="X">${icon("x", 17)}</a>
        <a href="#" aria-label="Instagram">${icon("instagram", 17)}</a>
      </div>
    </div>
  </div>
</footer>

<script>
  // Toggle visual de las alertas (mismo comportamiento que la app).
  document.querySelectorAll(".js-alert").forEach(function (b) {
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") === "true";
      b.setAttribute("aria-pressed", String(!on));
      b.style.color = !on ? "var(--brand)" : "";
      b.style.borderColor = !on ? "var(--brand)" : "";
    });
  });
</script>
</body>
</html>`;

mkdirSync(resolve(ROOT, "static"), { recursive: true });
writeFileSync(resolve(ROOT, "static/index.html"), html, "utf8");
console.log("static/index.html generado (" + (html.length / 1024).toFixed(1) + " KB)");
