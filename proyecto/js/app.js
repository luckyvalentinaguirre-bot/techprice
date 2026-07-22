/*
 * TechPrice Uruguay — versión local sin base de datos.
 * Carga data/productos.json, data/tiendas.json y data/precios.json, arma el
 * modelo de comparación en memoria y renderiza la página. Permite buscar
 * productos, comparar precios entre tiendas y ver el historial.
 *
 * IMPORTANTE: los navegadores bloquean fetch() de archivos locales con file://,
 * así que hay que abrirlo por HTTP (XAMPP: poné la carpeta en htdocs y entrá a
 * http://localhost/proyecto/  ·  o usá "Live Server" / "python3 -m http.server").
 */
(function () {
  "use strict";

  /* ----------------------------------------------------------- utilidades */
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const money = (n, moneda) =>
    new Intl.NumberFormat("es-UY", { style: "currency", currency: moneda === "USD" ? "USD" : "UYU", maximumFractionDigits: 0 }).format(n);
  const num = (n) => new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 }).format(n);
  const pct = (n) => (n > 0 ? "+" : "") + new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 }).format(n) + "%";

  function relativo(fechaISO) {
    if (!fechaISO) return "—";
    const dias = Math.round((Date.now() - new Date(fechaISO + "T12:00:00").getTime()) / 86400000);
    if (dias <= 0) return "hoy";
    if (dias === 1) return "ayer";
    if (dias < 30) return "hace " + dias + " días";
    const meses = Math.round(dias / 30);
    return "hace " + meses + (meses === 1 ? " mes" : " meses");
  }

  /* ----------------------------------------------------------------- íconos */
  const PATHS = {
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
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    wrench: '<path d="M14.5 5.5a3.5 3.5 0 0 0-4.6 4.3L3 16.7V21h4.3l6.9-6.9a3.5 3.5 0 0 0 4.3-4.6l-2.4 2.4-2.1-.5-.5-2.1 2.4-2.4Z"/>',
    fan: '<circle cx="12" cy="12" r="2"/><path d="M12 10c-1-3 .5-6 1.5-6.5C15 4 14 8 12 10Zm2 2c3-1 6 .5 6.5 1.5.5 1.5-3.5.5-6.5-1.5Zm-2 2c1 3-.5 6-1.5 6.5-1.5.5-.5-3.5 1.5-6.5Zm-2-2c-3 1-6-.5-6.5-1.5C3 9.5 7 10.5 10 12Z"/>',
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
    desktop: '<rect x="4" y="3" width="9" height="18" rx="1.5"/><path d="M7 6h3M7 9h3M7 12h2"/><circle cx="8.5" cy="17" r="1"/><path d="M16 8h4v9h-4M15 20h6M17 17v3"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/>',
    tablet: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M11 18h2"/>',
    tv: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 21h8M12 6V3"/>',
    gamepad: '<path d="M7 12h4M9 10v4"/><circle cx="16" cy="11" r="1"/><circle cx="18.5" cy="13.5" r="1"/><path d="M6 8h12a3 3 0 0 1 3 3l-.7 5a2.5 2.5 0 0 1-4.6.8L14 15h-4l-1.7 1.6a2.5 2.5 0 0 1-4.6-.8L3 11a3 3 0 0 1 3-3Z"/>',
    watch: '<rect x="7" y="7" width="10" height="10" rx="3"/><path d="M9 7l.5-4h5l.5 4M9 17l.5 4h5l.5-4"/>',
    speaker: '<rect x="6" y="3" width="12" height="18" rx="2"/><circle cx="12" cy="14" r="3"/><circle cx="12" cy="7" r="1"/>',
    printer: '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M6 14h12v7H6z"/>',
    box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3ZM4 7.5l8 4.5 8-4.5M12 12v9"/>',
  };
  const icon = (name, size = 16, cls = "") =>
    '<svg class="' + cls + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (PATHS[name] || PATHS.box) + "</svg>";

  const CAT_ICON = {
    gpu: "gpu", cpu: "cpu", ram: "memory", ssd: "drive", hdd: "drive", monitor: "monitor",
    notebook: "laptop", teclado: "keyboard", mouse: "mouse", auriculares: "headphones",
    motherboard: "board", fuente: "power", gabinete: "case", cooler: "fan",
    "pc armada": "desktop", celular: "phone", tablet: "tablet", tv: "tv",
    consola: "gamepad", smartwatch: "watch", parlante: "speaker", impresora: "printer",
  };
  const catIcon = (cat) => CAT_ICON[String(cat).toLowerCase()] || "box";

  /* ------------------------------------------------------- normalización */
  const norm = (s) =>
    String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  /* =========================== MODELO EN MEMORIA ========================= */
  let MODEL = { productos: [], tiendas: new Map(), ultimaFecha: null };

  // Todo se muestra en dólares. Los precios en pesos (UYU) se pasan a USD
  // dividiendo por esta cotización aproximada.
  const USD_RATE = 40;
  const aUsd = (row) => (row.moneda === "USD" ? row : { ...row, precio: row.precio / USD_RATE, moneda: "USD" });

  function construirModelo(productos, tiendas, precios) {
    precios = precios.map(aUsd); // normalizar a USD antes de construir el modelo
    const tiendasById = new Map(tiendas.map((t) => [t.id, t]));
    const preciosPorProducto = new Map();
    let ultimaFecha = null;
    for (const row of precios) {
      if (!preciosPorProducto.has(row.producto)) preciosPorProducto.set(row.producto, []);
      preciosPorProducto.get(row.producto).push(row);
      if (!ultimaFecha || row.fecha > ultimaFecha) ultimaFecha = row.fecha;
    }

    const modelos = productos.map((p) => {
      const rows = preciosPorProducto.get(p.id) || [];

      // Oferta actual por tienda = fila más reciente de esa tienda.
      const ultimaPorTienda = new Map();
      for (const r of rows) {
        const prev = ultimaPorTienda.get(r.tienda);
        if (!prev || r.fecha > prev.fecha) ultimaPorTienda.set(r.tienda, r);
      }
      const offers = [...ultimaPorTienda.values()].map((r) => ({
        tiendaId: r.tienda,
        tienda: (tiendasById.get(r.tienda) || {}).nombre || "Tienda " + r.tienda,
        precio: r.precio,
        moneda: r.moneda || "USD",
        disponible: r.disponible !== false,
        url: r.url || "#",
        fecha: r.fecha,
      })).sort((a, b) => a.precio - b.precio);

      const disponibles = offers.filter((o) => o.disponible);
      const ref = disponibles.length ? disponibles : offers;
      const precios_ = ref.map((o) => o.precio);
      const lowest = precios_.length ? Math.min(...precios_) : 0;
      const highest = precios_.length ? Math.max(...precios_) : 0;
      const avg = precios_.length ? Math.round(precios_.reduce((a, b) => a + b, 0) / precios_.length) : 0;
      const moneda = (ref[0] && ref[0].moneda) || "USD";
      const cheapest = ref.find((o) => o.precio === lowest);

      // Cambio reciente: menor precio de la última fecha vs la fecha anterior.
      const minPorFecha = new Map();
      for (const r of rows) {
        const m = minPorFecha.get(r.fecha);
        if (m === undefined || r.precio < m) minPorFecha.set(r.fecha, r.precio);
      }
      const fechas = [...minPorFecha.keys()].sort();
      let change = null;
      if (fechas.length >= 2) {
        const cur = minPorFecha.get(fechas[fechas.length - 1]);
        const prev = minPorFecha.get(fechas[fechas.length - 2]);
        if (prev > 0) {
          const amount = cur - prev;
          change = { cur, prev, amount, pct: Math.round((amount / prev) * 1000) / 10, fecha: fechas[fechas.length - 1] };
        }
      }

      // Serie histórica: menor precio por fecha (para el gráfico).
      const historia = fechas.map((f) => ({ fecha: f, precio: minPorFecha.get(f) }));
      const lastFecha = fechas.length ? fechas[fechas.length - 1] : null;

      return {
        id: p.id, nombre: p.nombre, marca: p.marca, categoria: p.categoria, imagen: p.imagen,
        specs: p.specs || {},
        offers, lowest, highest, avg, moneda, cheapestTiendaId: cheapest ? cheapest.tiendaId : null,
        change, historia, lastFecha,
        _buscable: norm(p.nombre + " " + (p.marca || "") + " " + (p.categoria || "")),
      };
    });

    MODEL = { productos: modelos, tiendas: tiendasById, ultimaFecha, tiendasList: tiendas };
  }

  /* ============================== FRAGMENTOS ============================= */
  function deltaPill(m) {
    if (!m.change || m.change.amount === 0) return "";
    const down = m.change.amount < 0;
    return '<span class="showcase-card__delta ' + (down ? "delta--down" : "delta--up") + '">' +
      icon(down ? "trendingDown" : "trendingUp", 13) + pct(m.change.pct) + "</span>";
  }

  // Imagen real del producto si existe; si no, el ícono de la categoría.
  function mediaInner(m, sz) {
    return m.imagen
      ? '<img src="' + esc(m.imagen) + '" alt="' + esc(m.nombre) + '" loading="lazy" />'
      : '<span class="showcase-card__placeholder">' + icon(catIcon(m.categoria), sz) + "</span>";
  }

  function showcaseCard(m) {
    return '' +
      '<article class="showcase-card" data-id="' + m.id + '">' +
        '<div class="showcase-card__media" data-open="' + m.id + '" role="button" tabindex="0" aria-label="' + esc(m.nombre) + '">' +
          mediaInner(m, 26) +
          deltaPill(m) +
        "</div>" +
        '<div class="showcase-card__body">' +
          (m.marca ? '<span class="showcase-card__brand">' + esc(m.marca) + "</span>" : "") +
          '<div data-open="' + m.id + '"><h3 class="showcase-card__name">' + esc(m.nombre) + "</h3></div>" +
          '<div class="showcase-card__prices">' +
            '<span class="showcase-card__price">' + money(m.lowest, m.moneda) + "</span>" +
            '<span class="showcase-card__avg">prom. <b>' + money(m.avg, m.moneda) + "</b></span>" +
          "</div>" +
          '<div class="showcase-card__meta">' +
            "<span>" + icon("store") + m.offers.length + " " + (m.offers.length === 1 ? "tienda" : "tiendas") + "</span>" +
            "<span>" + icon("clock") + relativo(m.lastFecha) + "</span>" +
          "</div>" +
        "</div>" +
        '<div class="showcase-card__actions">' +
          '<button class="btn btn--primary" data-open="' + m.id + '">' + icon("chart", 15) + " Ver historial</button>" +
          '<button class="btn btn--icon js-alert" aria-pressed="false" title="Avisarme cuando baje de precio" aria-label="Activar alerta">' + icon("bell", 16) + "</button>" +
        "</div>" +
      "</article>";
  }

  function dropCard(m) {
    const c = m.change;
    return '' +
      '<div class="drop-card" data-open="' + m.id + '" role="button" tabindex="0">' +
        '<div class="drop-card__thumb">' + mediaInner(m, 20) + "</div>" +
        '<div class="drop-card__body">' +
          '<span class="drop-card__pct">' + icon("trendingDown", 13) + pct(c.pct) + "</span>" +
          '<p class="drop-card__name">' + esc(m.nombre) + "</p>" +
          '<div class="drop-card__prices"><span class="drop-card__now">' + money(c.cur, m.moneda) + '</span><span class="drop-card__was">' + money(c.prev, m.moneda) + "</span></div>" +
          '<div class="drop-card__foot"><span class="drop-card__saved">Ahorrás <b>' + money(Math.abs(c.amount), m.moneda) + "</b></span><span>" + relativo(c.fecha) + "</span></div>" +
        "</div>" +
      "</div>";
  }

  function trendRow(m, i, sub, val, cls) {
    return '<li class="trend-item"><span class="trend-item__rank">' + (i + 1) + "</span>" +
      '<div class="trend-item__body" data-open="' + m.id + '" role="button" tabindex="0">' +
        '<span class="trend-item__name">' + esc(m.nombre) + '</span><span class="trend-item__sub">' + sub + "</span>" +
      "</div>" +
      '<span class="trend-item__val ' + (cls || "") + '">' + val + "</span></li>";
  }

  function trendCol(title, ico, mod, rows) {
    return '<div class="trend-col"><div class="trend-col__head ' + mod + '"><span class="ico">' + icon(ico) + "</span>" + title + "</div>" +
      (rows ? '<ol class="trend-list">' + rows + "</ol>" : '<p class="trend-item__sub">Sin datos.</p>') + "</div>";
  }

  /* =============================== RENDER ================================ */
  function render() {
    const M = MODEL.productos;

    // Stats
    $("#stat-productos").textContent = num(M.length);
    $("#stat-tiendas").textContent = num(MODEL.tiendas.size);
    $("#stat-actualizacion").innerHTML = icon("clock", 16) + " " + relativo(MODEL.ultimaFecha);
    $("#stat-usuarios").textContent = num(1200 + M.length * 180); // dato ficticio

    // Categorías
    const porCat = new Map();
    for (const m of M) porCat.set(m.categoria, (porCat.get(m.categoria) || 0) + 1);
    $("#grid-categorias").innerHTML = [...porCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([cat, n]) =>
        '<div class="category-chip" data-cat="' + esc(cat) + '" role="button" tabindex="0">' +
          '<span class="category-chip__icon">' + icon(catIcon(cat), 20) + "</span>" +
          '<span class="category-chip__body"><span class="category-chip__name">' + esc(cat) + "</span>" +
          '<span class="category-chip__count">' + num(n) + " " + (n === 1 ? "producto" : "productos") + "</span></span></div>")
      .join("");

    // Destacados / grilla filtrable (se llena vía aplicarFiltros al final).
    poblarFiltros();

    // Bajaron de precio
    const drops = M.filter((m) => m.change && m.change.amount < 0).sort((a, b) => a.change.pct - b.change.pct).slice(0, 6);
    $("#grid-bajaron").innerHTML = drops.map(dropCard).join("");
    $("#section-bajaron").classList.toggle("is-hidden", drops.length === 0);

    // Tendencias
    const masComparados = [...M].sort((a, b) => b.offers.length - a.offers.length || b.lowest - a.lowest).slice(0, 6);
    const subidas = M.filter((m) => m.change && m.change.amount > 0).sort((a, b) => b.change.pct - a.change.pct).slice(0, 6);
    const bajadas = drops;
    const recientes = [...M].sort((a, b) => b.id - a.id).slice(0, 6);
    $("#grid-tendencias").innerHTML =
      '<div class="trends-grid">' +
      trendCol("Más comparados", "flame", "trend-col__head--hot",
        masComparados.map((m, i) => trendRow(m, i, money(m.lowest, m.moneda), m.offers.length + " " + (m.offers.length === 1 ? "tienda" : "tiendas"))).join("")) +
      trendCol("Mayor subida", "trendingUp", "trend-col__head--up",
        subidas.map((m, i) => trendRow(m, i, money(m.change.cur, m.moneda), pct(m.change.pct), "val--neg")).join("")) +
      trendCol("Mayor bajada", "trendingDown", "trend-col__head--down",
        bajadas.map((m, i) => trendRow(m, i, money(m.change.cur, m.moneda), pct(m.change.pct), "val--pos")).join("")) +
      trendCol("Recién agregados", "plus", "",
        recientes.map((m, i) => trendRow(m, i, m.offers.length + " " + (m.offers.length === 1 ? "tienda" : "tiendas"), money(m.lowest, m.moneda))).join("")) +
      "</div>";

    // Tiendas
    $("#grid-tiendas").innerHTML = MODEL.tiendasList.map((t) => {
      let count = 0, lastSync = null;
      for (const m of M) {
        const o = m.offers.find((o) => o.tiendaId === t.id);
        if (o) { count++; if (!lastSync || o.fecha > lastSync) lastSync = o.fecha; }
      }
      const fresh = lastSync === MODEL.ultimaFecha;
      const ini = t.nombre.replace(/\(demo\)/i, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
      return '<div class="store-card"><div class="store-card__top">' +
        '<span class="store-card__logo" aria-hidden>' + esc(ini) + "</span>" +
        '<div style="min-width:0"><div class="store-card__name">' + esc(t.nombre) + "</div>" +
        '<div class="store-card__platform">' + esc((t.plataforma || "").replace(/_/g, " ")) + "</div></div></div>" +
        '<div class="store-card__foot"><span class="store-card__count"><b>' + num(count) + "</b> " + (count === 1 ? "producto" : "productos") + "</span>" +
        '<span class="store-status ' + (fresh ? "store-status--ok" : "store-status--stale") + '"><span class="dot"></span>' + (fresh ? "Actualizada" : relativo(lastSync)) + "</span></div></div>";
    }).join("");

    $("#year").textContent = new Date().getFullYear();
    wireCategorias();
    aplicarFiltros(); // llena la grilla (destacados si no hay filtros)
    renderBuilder();
    renderMisPcs();
  }

  /* ========================= BUSCADOR + FILTROS ======================== */
  const filtros = { q: "", cat: "", marca: "", min: null, max: null, sort: "relevancia" };
  let mostrarN = 48; // paginación "cargar más"

  // Llena los <select> de categoría y marca con lo que hay en los datos.
  function poblarFiltros() {
    const cats = new Map(), marcas = new Map();
    for (const m of MODEL.productos) {
      cats.set(m.categoria, (cats.get(m.categoria) || 0) + 1);
      if (m.marca) marcas.set(m.marca, (marcas.get(m.marca) || 0) + 1);
    }
    const fill = (sel, entries, labelAll) => {
      const el = $(sel); if (!el) return;
      const cur = el.value;
      el.innerHTML = '<option value="">' + labelAll + "</option>" +
        entries.sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(b[0]))
          .map(([k, n]) => '<option value="' + esc(k) + '">' + esc(k) + " (" + n + ")</option>").join("");
      el.value = cur;
    };
    fill("#f-cat", [...cats.entries()], "Todas las categorías");
    fill("#f-marca", [...marcas.entries()], "Todas las marcas");
  }

  function listaFiltrada() {
    let list = MODEL.productos;
    if (filtros.q) list = list.filter((m) => m._buscable.includes(filtros.q));
    if (filtros.cat) list = list.filter((m) => m.categoria === filtros.cat);
    if (filtros.marca) list = list.filter((m) => m.marca === filtros.marca);
    if (filtros.min != null) list = list.filter((m) => m.lowest >= filtros.min);
    if (filtros.max != null) list = list.filter((m) => m.lowest <= filtros.max);
    const arr = [...list];
    switch (filtros.sort) {
      case "precio-asc": arr.sort((a, b) => (a.lowest || 1e12) - (b.lowest || 1e12)); break;
      case "precio-desc": arr.sort((a, b) => (b.lowest || 0) - (a.lowest || 0)); break;
      case "tiendas": arr.sort((a, b) => b.offers.length - a.offers.length || (a.lowest || 1e12) - (b.lowest || 1e12)); break;
      case "descuento": arr.sort((a, b) => (a.change ? a.change.pct : 0) - (b.change ? b.change.pct : 0)); break;
      case "nombre": arr.sort((a, b) => a.nombre.localeCompare(b.nombre)); break;
      default: arr.sort((a, b) => (b.lastFecha || "").localeCompare(a.lastFecha || "") || b.id - a.id);
    }
    return arr;
  }

  const hayFiltros = () =>
    filtros.q || filtros.cat || filtros.marca || filtros.min != null || filtros.max != null || filtros.sort !== "relevancia";

  function aplicarFiltros(resetN) {
    if (resetN !== false) mostrarN = 48;
    const arr = listaFiltrada();
    const activo = hayFiltros();
    const visibles = activo ? arr.slice(0, mostrarN) : arr.slice(0, 8);
    const title = $("#title-destacados"), sub = $("#subtitle-destacados");
    if (!activo) {
      title.textContent = "Productos destacados";
      sub.textContent = "El mejor precio, el promedio y cuánto se movió respecto al día anterior.";
    } else {
      title.textContent = filtros.cat || (filtros.q ? 'Resultados para "' + filtros.q + '"' : "Resultados");
      sub.textContent = arr.length + " producto" + (arr.length === 1 ? "" : "s") +
        (arr.length > visibles.length ? " · mostrando " + visibles.length : "");
    }
    $("#grid-destacados").innerHTML = visibles.length
      ? visibles.map(showcaseCard).join("")
      : '<p class="empty-results">No hay productos con esos filtros.</p>';
    const more = $("#load-more");
    if (more) more.classList.toggle("is-hidden", !(activo && arr.length > visibles.length));
    wireCards();
    marcarChipActivo();
  }

  function marcarChipActivo() {
    document.querySelectorAll("[data-cat]").forEach((el) =>
      el.classList.toggle("is-active", el.getAttribute("data-cat") === filtros.cat));
  }

  function syncControles() {
    const set = (sel, v) => { const el = $(sel); if (el) el.value = v; };
    set("#f-cat", filtros.cat); set("#f-marca", filtros.marca); set("#f-sort", filtros.sort);
    set("#f-min", filtros.min == null ? "" : filtros.min); set("#f-max", filtros.max == null ? "" : filtros.max);
  }

  // La búsqueda del hero alimenta el filtro de texto.
  function buscar(q) { filtros.q = norm(q.trim()); aplicarFiltros(); }
  function verDestacados() { aplicarFiltros(); }
  // Tocar un chip de categoría setea el filtro (toggle) y limpia la búsqueda.
  function filtrarPorCategoria(cat) {
    filtros.cat = (filtros.cat === cat) ? "" : cat;
    const inp = $("#search-input"); if (inp) inp.value = "";
    filtros.q = "";
    syncControles();
    aplicarFiltros();
  }

  function wireFiltros() {
    const num = (v) => { v = parseFloat(v); return isFinite(v) ? v : null; };
    const on = (sel, ev, fn) => { const el = $(sel); if (el) el.addEventListener(ev, fn); };
    on("#f-cat", "change", (e) => { filtros.cat = e.target.value; aplicarFiltros(); });
    on("#f-marca", "change", (e) => { filtros.marca = e.target.value; aplicarFiltros(); });
    on("#f-sort", "change", (e) => { filtros.sort = e.target.value; aplicarFiltros(); });
    on("#f-min", "input", (e) => { filtros.min = num(e.target.value); aplicarFiltros(); });
    on("#f-max", "input", (e) => { filtros.max = num(e.target.value); aplicarFiltros(); });
    on("#f-clear", "click", () => {
      Object.assign(filtros, { q: "", cat: "", marca: "", min: null, max: null, sort: "relevancia" });
      const inp = $("#search-input"); if (inp) inp.value = "";
      syncControles(); aplicarFiltros();
    });
    on("#load-more", "click", () => { mostrarN += 48; aplicarFiltros(false); });
  }

  /* ============================ MODAL DETALLE =========================== */
  function sparkline(historia, moneda) {
    if (historia.length < 2) return '<p class="price-history__empty">Sin historial suficiente.</p>';
    const W = 680, H = 200, padX = 12, padTop = 20, padBot = 34;
    const precios = historia.map((h) => h.precio);
    const min = Math.min(...precios), max = Math.max(...precios);
    const span = max - min || 1;
    const x = (i) => padX + (i * (W - padX * 2)) / (historia.length - 1);
    const y = (p) => padTop + (1 - (p - min) / span) * (H - padTop - padBot);
    const pts = historia.map((h, i) => x(i) + "," + y(h.precio));
    const area = "M" + x(0) + "," + (H - padBot) + " L" + pts.join(" L") + " L" + x(historia.length - 1) + "," + (H - padBot) + " Z";
    const line = "M" + pts.join(" L");
    const dots = historia.map((h, i) => '<circle class="chart__dot" cx="' + x(i) + '" cy="' + y(h.precio) + '" r="3.5"/>').join("");
    const labels = historia.map((h, i) => {
      const anchor = i === 0 ? "start" : i === historia.length - 1 ? "end" : "middle";
      const d = h.fecha.slice(8) + "/" + h.fecha.slice(5, 7);
      return '<text class="chart__label" x="' + x(i) + '" y="' + (H - 12) + '" text-anchor="' + anchor + '">' + d + "</text>";
    }).join("");
    return '<div class="chart"><svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" aria-label="Historial de precios">' +
      '<line class="chart__grid" x1="' + padX + '" y1="' + (H - padBot) + '" x2="' + (W - padX) + '" y2="' + (H - padBot) + '"/>' +
      '<path class="chart__area" d="' + area + '"/><path class="chart__line" d="' + line + '"/>' + dots + labels +
      '<text class="chart__label" x="' + padX + '" y="' + (padTop - 6) + '">máx ' + money(max, moneda) + "</text>" +
      "</svg></div>";
  }

  function abrirDetalle(id) {
    const m = MODEL.productos.find((p) => p.id === id);
    if (!m) return;
    const savings = m.highest - m.lowest;
    const tieneLink = (o) => o.url && o.url !== "#";
    const linkCell = (o) => tieneLink(o)
      ? '<a class="store-link" href="' + esc(o.url) + '" target="_blank" rel="noopener noreferrer">Ir a la tienda ' + icon("arrowRight", 13) + "</a>"
      : '<span class="store-link store-link--off">Sin enlace</span>';
    const filas = m.offers.map((o) =>
      '<tr class="' + (o.tiendaId === m.cheapestTiendaId ? "price-table__row--best" : "") + '">' +
        "<td>" + esc(o.tienda) + "</td>" +
        "<td>" + money(o.precio, o.moneda) + "</td>" +
        "<td>" + (o.disponible ? "En stock" : "Sin stock") + "</td>" +
        "<td>" + linkCell(o) + "</td>" +
      "</tr>").join("");

    // Oferta más barata con link real => botón grande para ir directo a la tienda.
    const best = m.offers.find((o) => o.tiendaId === m.cheapestTiendaId) || m.offers[0];
    const ctaTienda = best && tieneLink(best)
      ? '<a class="btn btn--primary btn--store-cta" href="' + esc(best.url) + '" target="_blank" rel="noopener noreferrer">' +
          icon("store", 16) + " Ver en " + esc(best.tienda) + " · " + money(best.precio, best.moneda) + " " + icon("arrowRight", 15) + "</a>"
      : "";

    const root = $("#modal-root");
    root.innerHTML =
      '<div class="modal" role="document">' +
        '<div class="modal__head"><div>' +
          (m.marca ? '<div class="modal__brand">' + esc(m.marca) + " · " + esc(m.categoria) + "</div>" : "") +
          '<h2 class="modal__title">' + esc(m.nombre) + "</h2></div>" +
          '<button class="btn btn--icon" data-close aria-label="Cerrar">' + icon("close", 16) + "</button>" +
        "</div>" +
        '<div class="modal__body">' +
          (m.imagen ? '<div style="display:grid;place-items:center;background:var(--surface-2);border-radius:var(--radius-md);padding:1rem"><img src="' + esc(m.imagen) + '" alt="' + esc(m.nombre) + '" style="max-height:200px;max-width:100%;object-fit:contain" /></div>' : "") +
          '<div class="stat-row">' +
            '<div class="stat"><div class="stat__label">Precio más bajo</div><div class="stat__value stat__value--good">' + money(m.lowest, m.moneda) + "</div></div>" +
            '<div class="stat"><div class="stat__label">Precio promedio</div><div class="stat__value">' + money(m.avg, m.moneda) + "</div></div>" +
            '<div class="stat"><div class="stat__label">Precio más alto</div><div class="stat__value">' + money(m.highest, m.moneda) + "</div></div>" +
            '<div class="stat"><div class="stat__label">Ahorro máximo</div><div class="stat__value stat__value--good">' + money(savings, m.moneda) + "</div></div>" +
          "</div>" +
          ctaTienda +
          "<div><div class=\"modal__section-title\">Precios por tienda</div>" +
            '<table class="price-table"><thead><tr><th>Tienda</th><th>Precio</th><th>Disponibilidad</th><th></th></tr></thead><tbody>' + filas + "</tbody></table></div>" +
          "<div><div class=\"modal__section-title\">Historial de precios (mejor precio por fecha)</div>" + sparkline(m.historia, m.moneda) + "</div>" +
        "</div>" +
      "</div>";
    openModalWired();
  }

  function openModalWired() {
    const root = $("#modal-root");
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add("is-open"));
    root.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
  }

  function closeModal() {
    const root = $("#modal-root");
    root.classList.remove("is-open");
    setTimeout(() => { root.hidden = true; root.innerHTML = ""; }, 180);
  }

  /* ============================== EVENTOS =============================== */
  // Delegación de eventos: se cablea UNA sola vez, así re-renderizar la grilla
  // (al filtrar) no acumula listeners duplicados en las tarjetas.
  let cardsWired = false;
  function wireCards() {
    if (cardsWired) return;
    cardsWired = true;
    document.addEventListener("click", (e) => {
      const alerta = e.target.closest(".js-alert");
      if (alerta) {
        e.stopPropagation();
        const on = alerta.getAttribute("aria-pressed") === "true";
        alerta.setAttribute("aria-pressed", String(!on));
        alerta.style.color = !on ? "var(--brand)" : "";
        alerta.style.borderColor = !on ? "var(--brand)" : "";
        return;
      }
      const el = e.target.closest("[data-open]");
      if (el) abrirDetalle(Number(el.getAttribute("data-open")));
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = e.target.closest && e.target.closest("[data-open]");
      if (el) { e.preventDefault(); abrirDetalle(Number(el.getAttribute("data-open"))); }
    });
  }

  // Los chips de categoría son persistentes (no se regeneran al filtrar), así que
  // se cablean UNA sola vez desde render() para no acumular listeners duplicados.
  function wireCategorias() {
    document.querySelectorAll("[data-cat]").forEach((el) => {
      const run = () => {
        filtrarPorCategoria(el.getAttribute("data-cat"));
        $("#section-destacados").scrollIntoView({ behavior: "smooth", block: "start" });
      };
      el.addEventListener("click", run);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); run(); } });
    });
  }

  function wireGlobal() {
    $("#search-form").addEventListener("submit", (e) => { e.preventDefault(); buscar($("#search-input").value); });
    $("#search-input").addEventListener("input", (e) => buscar(e.target.value));
    $("#modal-root").addEventListener("click", (e) => { if (e.target.id === "modal-root") closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
    const reset = $("#reset-build"); if (reset) reset.addEventListener("click", resetBuild);
    const clr = $("#clear-mis-pcs"); if (clr) clr.addEventListener("click", borrarTodasLasPcs);
    wireMenu();
    wireFiltros();
  }

  /* ============================ MENÚ HAMBURGUESA ======================= */
  function wireMenu() {
    const drawer = $("#drawer");
    const toggle = $("#menu-toggle");
    if (!drawer || !toggle) return;
    const closeBtn = $("#menu-close");
    const abrir = () => {
      drawer.hidden = false;
      requestAnimationFrame(() => drawer.classList.add("is-open"));
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    };
    const cerrar = () => {
      drawer.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
      setTimeout(() => { drawer.hidden = true; }, 300);
    };
    toggle.addEventListener("click", () => (drawer.hidden ? abrir() : cerrar()));
    if (closeBtn) closeBtn.addEventListener("click", cerrar);
    drawer.querySelectorAll("[data-menu-close]").forEach((b) => b.addEventListener("click", cerrar));
    drawer.querySelectorAll("[data-menu-link]").forEach((a) => a.addEventListener("click", cerrar));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden) cerrar(); });
  }

  /* =============================== ARMADOR ============================= */
  const SLOTS = [
    { cat: "CPU", label: "Procesador" },
    { cat: "Motherboard", label: "Motherboard" },
    { cat: "RAM", label: "Memoria RAM" },
    { cat: "GPU", label: "Placa de video" },
    { cat: "SSD", label: "Almacenamiento" },
    { cat: "Fuente", label: "Fuente" },
    { cat: "Gabinete", label: "Gabinete" },
    { cat: "Cooler", label: "Cooler (opcional)" },
  ];
  const FF_RANK = { ITX: 1, mATX: 2, ATX: 3 };
  let build = {}; // categoria -> productId

  const byId = (id) => MODEL.productos.find((p) => p.id === id);
  const partsOf = (cat) => MODEL.productos.filter((p) => p.categoria === cat);
  function bestOffer(m) {
    const disp = m.offers.filter((o) => o.disponible);
    const ref = disp.length ? disp : m.offers;
    return ref.length ? ref[0] : null; // offers vienen ordenadas por precio asc
  }
  const caseSupports = (caseFF, mbFF) => FF_RANK[caseFF] >= FF_RANK[mbFF];

  function ctxOf(state) {
    const cpu = state.CPU ? byId(state.CPU) : null;
    const mb = state.Motherboard ? byId(state.Motherboard) : null;
    const ram = state.RAM ? byId(state.RAM) : null;
    const cs = state.Gabinete ? byId(state.Gabinete) : null;
    return {
      socket: (cpu && cpu.specs.socket) || (mb && mb.specs.socket) || null,
      plataforma: (cpu && cpu.specs.plataforma) || (mb && mb.specs.plataforma) || null,
      ramType: (mb && mb.specs.ramType) || (ram && ram.specs.ramType) || null,
      mbFF: mb && mb.specs.formFactor,
      caseFF: cs && cs.specs.formFactor,
    };
  }

  // ¿`part` es compatible con lo ya elegido (sin contar su propia categoría)?
  function compat(part, state) {
    const s = Object.assign({}, state); delete s[part.categoria];
    const c = ctxOf(s);
    const sp = part.specs || {};
    switch (part.categoria) {
      // Nota: cada regla solo bloquea cuando el dato existe en ambas partes.
      // Así, productos reales sin specs completas no se ocultan de más.
      case "CPU":
        if (c.socket && sp.socket && sp.socket !== c.socket) return { ok: false, reason: "Socket " + sp.socket + " ≠ " + c.socket };
        return { ok: true };
      case "Motherboard":
        if (c.socket && sp.socket && sp.socket !== c.socket) return { ok: false, reason: "Socket no coincide con el CPU (" + c.socket + ")" };
        if (c.ramType && sp.ramType && sp.ramType !== c.ramType) return { ok: false, reason: "La RAM elegida es " + c.ramType };
        if (c.caseFF && sp.formFactor && !caseSupports(c.caseFF, sp.formFactor)) return { ok: false, reason: "No entra en el gabinete " + c.caseFF };
        return { ok: true };
      case "RAM":
        if (c.ramType && sp.ramType && sp.ramType !== c.ramType) return { ok: false, reason: "El motherboard usa " + c.ramType };
        return { ok: true };
      case "Gabinete":
        if (c.mbFF && sp.formFactor && !caseSupports(sp.formFactor, c.mbFF)) return { ok: false, reason: "No entra un motherboard " + c.mbFF };
        return { ok: true };
      case "Cooler":
        if (c.socket && sp.sockets && !sp.sockets.includes(c.socket)) return { ok: false, reason: "No soporta socket " + c.socket };
        return { ok: true };
      default:
        return { ok: true };
    }
  }

  function reconcile() {
    for (let pass = 0; pass < 3; pass++) {
      for (const cat of Object.keys(build)) {
        const part = byId(build[cat]);
        if (!part || !compat(part, build).ok) delete build[cat];
      }
    }
  }
  function selectPart(cat, id) { build[cat] = id; reconcile(); renderBuilder(); closeModal(); }
  function removePart(cat) { delete build[cat]; reconcile(); renderBuilder(); }
  function resetBuild() { build = {}; renderBuilder(); }

  function specLine(m) {
    const s = m.specs || {};
    if (m.categoria === "CPU") return s.plataforma + " · " + s.socket + " · " + s.tdp + "W";
    if (m.categoria === "Motherboard") return s.socket + " · " + s.chipset + " · " + s.ramType + " · " + s.formFactor;
    if (m.categoria === "RAM") return s.ramType + " · " + s.capacidadGb + "GB";
    if (m.categoria === "GPU") return "TDP " + s.tdp + "W";
    if (m.categoria === "SSD") return s.interfaz;
    if (m.categoria === "Fuente") return s.watts + "W · " + s.cert;
    if (m.categoria === "Gabinete") return "Form factor " + s.formFactor;
    if (m.categoria === "Cooler") return "Sockets: " + (s.sockets || []).join(", ");
    return "";
  }

  function openPicker(cat) {
    const slot = SLOTS.find((s) => s.cat === cat);
    const items = partsOf(cat).map((m) => ({ m, c: compat(m, build) })).filter((x) => x.c.ok);
    items.sort((a, b) => (bestOffer(a.m) ? bestOffer(a.m).precio : 1e12) - (bestOffer(b.m) ? bestOffer(b.m).precio : 1e12));

    const tabs = cat === "CPU"
      ? '<div class="pick-tabs"><button class="pick-tab is-active" data-plat="all">Todos</button><button class="pick-tab" data-plat="Intel">Intel</button><button class="pick-tab" data-plat="AMD">AMD (Ryzen)</button></div>'
      : "";
    const renderList = (plat) =>
      items.filter((x) => plat === "all" || !plat || x.m.specs.plataforma === plat).map((x) => {
        const o = bestOffer(x.m);
        return '<div class="pick-item"><div class="pick-item__main"><div class="pick-item__name">' + esc(x.m.nombre) + "</div>" +
          '<div class="pick-item__spec">' + esc(specLine(x.m)) + (o ? " · " + esc(o.tienda) : "") + "</div></div>" +
          '<div class="pick-item__price">' + (o ? money(o.precio, x.m.moneda) : "—") + "</div>" +
          '<button class="btn btn--primary" data-choose="' + x.m.id + '">Elegir</button></div>';
      }).join("") || '<p class="empty-results">No hay opciones compatibles con lo que elegiste.</p>';

    const inner =
      '<div class="modal__head"><div><div class="modal__brand">Armá tu PC</div><h2 class="modal__title">Elegí ' + slot.label.toLowerCase() + "</h2></div>" +
      '<button class="btn btn--icon" data-close aria-label="Cerrar">' + icon("close", 16) + "</button></div>" +
      '<div class="modal__body">' + tabs + '<div class="pick-list" id="pick-list">' + renderList("all") + "</div></div>";

    const root = $("#modal-root");
    root.innerHTML = '<div class="modal" role="document">' + inner + "</div>";
    openModalWired();
    const list = $("#pick-list");
    const wireChoose = () => list.querySelectorAll("[data-choose]").forEach((b) =>
      b.addEventListener("click", () => selectPart(cat, Number(b.getAttribute("data-choose")))));
    wireChoose();
    root.querySelectorAll("[data-plat]").forEach((t) => t.addEventListener("click", () => {
      root.querySelectorAll(".pick-tab").forEach((x) => x.classList.remove("is-active"));
      t.classList.add("is-active");
      list.innerHTML = renderList(t.getAttribute("data-plat"));
      wireChoose();
    }));
  }

  function renderBuilder() {
    if (!$("#builder-slots")) return;
    $("#builder-slots").innerHTML = SLOTS.map((slot) => {
      const m = build[slot.cat] ? byId(build[slot.cat]) : null;
      const o = m ? bestOffer(m) : null;
      const main = m
        ? '<div class="slot__label">' + slot.label + '</div><div class="slot__value">' + esc(m.nombre) + "</div>" +
          (o ? '<div class="slot__price">Desde <b>' + money(o.precio, m.moneda) + "</b> en " + esc(o.tienda) + "</div>" : "")
        : '<div class="slot__label">' + slot.label + '</div><div class="slot__empty">Sin elegir</div>';
      const actions = m
        ? '<button class="btn" data-pick="' + slot.cat + '">Cambiar</button><button class="btn btn--icon" data-remove="' + slot.cat + '" aria-label="Quitar">' + icon("close", 16) + "</button>"
        : '<button class="btn btn--primary" data-pick="' + slot.cat + '">Elegir</button>';
      return '<div class="slot"><span class="slot__icon">' + icon(catIcon(slot.cat), 20) + "</span>" +
        '<div class="slot__main">' + main + '</div><div class="slot__actions">' + actions + "</div></div>";
    }).join("");

    const elegidas = SLOTS.map((s) => build[s.cat]).filter(Boolean).map(byId);
    let totalBest = 0;
    const perStore = new Map();
    for (const t of MODEL.tiendasList) perStore.set(t.id, { suma: 0, tiene: 0 });
    for (const m of elegidas) {
      const o = bestOffer(m);
      if (o) totalBest += o.precio;
      for (const of of m.offers.filter((x) => x.disponible)) {
        const ps = perStore.get(of.tiendaId);
        if (ps) { ps.suma += of.precio; ps.tiene++; }
      }
    }
    let single = null;
    for (const t of MODEL.tiendasList) {
      const ps = perStore.get(t.id);
      if (elegidas.length && ps.tiene === elegidas.length && (!single || ps.suma < single.suma)) single = { nombre: t.nombre, suma: ps.suma };
    }

    const cpu = build.CPU ? byId(build.CPU) : null;
    const gpu = build.GPU ? byId(build.GPU) : null;
    const psu = build.Fuente ? byId(build.Fuente) : null;
    let psuNote = "";
    if (cpu && gpu) {
      const need = cpu.specs.tdp + gpu.specs.tdp + 90;
      const reco = Math.ceil((need * 1.5) / 50) * 50;
      if (psu && psu.specs.watts < need * 1.3)
        psuNote = '<div class="summary__warn">' + icon("bell", 14) + "<span>La fuente de " + psu.specs.watts + "W puede quedar justa. Recomendado ≈ " + reco + "W.</span></div>";
      else if (!psu)
        psuNote = '<div class="summary__note">' + icon("bell", 14) + "<span>Para este CPU + GPU, fuente recomendada ≈ " + reco + "W.</span></div>";
    }

    const c = ctxOf(build);
    const compatNote = c.plataforma
      ? '<div class="summary__note">' + icon("wrench", 14) + "<span>Plataforma <b>" + c.plataforma + "</b>" + (c.socket ? " · " + c.socket : "") + (c.ramType ? " · " + c.ramType : "") + ". Solo se ofrecen partes compatibles.</span></div>"
      : '<div class="summary__note">' + icon("wrench", 14) + "<span>Empezá por el procesador (Intel o AMD): el resto se filtra para que todo sea compatible.</span></div>";

    let bestBox = "";
    if (elegidas.length) {
      if (single && single.suma > totalBest)
        bestBox = '<div class="summary__best">' + icon("store", 14) + "<span>Comprando cada parte en la tienda más barata ahorrás <b>" + money(single.suma - totalBest, "USD") + "</b> frente a comprar todo en " + esc(single.nombre) + " (" + money(single.suma, "USD") + ").</span></div>";
      else if (single)
        bestBox = '<div class="summary__best">' + icon("store", 14) + "<span>" + esc(single.nombre) + " tiene todas las partes y es lo más conveniente: " + money(single.suma, "USD") + ".</span></div>";
      else
        bestBox = '<div class="summary__note">' + icon("store", 14) + "<span>Ninguna tienda tiene todas las partes: el total es comprando cada una donde está más barata.</span></div>";
    }

    $("#builder-summary").innerHTML =
      '<div><div class="summary__hint">Total (mejor precio por parte)</div><div class="summary__total">' + money(totalBest, "USD") + "</div>" +
      '<div class="summary__hint">' + elegidas.length + " de " + SLOTS.length + " partes elegidas</div></div>" +
      compatNote + psuNote + bestBox +
      (elegidas.length ? '<button class="btn btn--primary" id="save-build" type="button" style="width:100%">' + icon("plus", 15) + " Guardar en Mis PCs</button>" : "") +
      (elegidas.length ? '<button class="btn" id="reset-build-2" type="button" style="width:100%">Vaciar selección</button>' : "");

    $("#builder-slots").querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => openPicker(b.getAttribute("data-pick"))));
    $("#builder-slots").querySelectorAll("[data-remove]").forEach((b) => b.addEventListener("click", () => removePart(b.getAttribute("data-remove"))));
    const r2 = $("#reset-build-2"); if (r2) r2.addEventListener("click", resetBuild);
    const sb = $("#save-build"); if (sb) sb.addEventListener("click", guardarBuild);
  }

  /* ============================== MIS PCs ============================== */
  const MISPC_KEY = "techprice_mis_pcs";

  function leerMisPcs() {
    try { return JSON.parse(localStorage.getItem(MISPC_KEY)) || []; } catch { return []; }
  }
  function escribirMisPcs(lista) {
    try { localStorage.setItem(MISPC_KEY, JSON.stringify(lista)); } catch { /* sin espacio: se ignora */ }
  }

  // Toma un "snapshot" de la build actual: precio y tienda más barata de cada
  // parte, con su link. Se guarda tal cual, así queda aunque cambien los datos.
  function guardarBuild() {
    const elegidas = SLOTS.map((s) => ({ slot: s, m: build[s.cat] ? byId(build[s.cat]) : null })).filter((x) => x.m);
    if (!elegidas.length) return;
    const items = elegidas.map(({ slot, m }) => {
      const o = bestOffer(m);
      return {
        categoria: m.categoria, label: slot.label, nombre: m.nombre,
        precio: o ? o.precio : null, moneda: o ? o.moneda : m.moneda,
        tienda: o ? o.tienda : null, url: o && o.url ? o.url : null,
      };
    });
    const total = items.reduce((a, it) => a + (it.precio || 0), 0);
    const moneda = (items.find((i) => i.moneda) || {}).moneda || "USD";
    const lista = leerMisPcs();
    const pc = { id: Date.now(), nombre: "Mi PC #" + (lista.length + 1), fecha: MODEL.ultimaFecha || new Date().toISOString().slice(0, 10), items, total, moneda };
    lista.unshift(pc);
    escribirMisPcs(lista);
    renderMisPcs();
    $("#section-mis-pcs").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function borrarBuild(id) {
    escribirMisPcs(leerMisPcs().filter((p) => String(p.id) !== String(id)));
    renderMisPcs();
  }
  function borrarTodasLasPcs() {
    if (!leerMisPcs().length) return;
    if (typeof confirm === "function" && !confirm("¿Borrar todas las PCs guardadas?")) return;
    escribirMisPcs([]);
    renderMisPcs();
  }

  function misPcCard(pc) {
    const filas = pc.items.map((it) =>
      '<li class="mypc-part">' +
        '<span class="mypc-part__cat">' + esc(it.label || it.categoria) + "</span>" +
        '<span class="mypc-part__name">' + esc(it.nombre) + "</span>" +
        '<span class="mypc-part__price">' + (it.precio != null ? money(it.precio, it.moneda) : "—") + "</span>" +
        '<span class="mypc-part__store">' +
          (it.url ? '<a href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer">' + esc(it.tienda || "Ver en tienda") + " " + icon("arrowRight", 12) + "</a>"
                  : '<span class="mypc-part__store--off">' + esc(it.tienda || "Sin tienda") + "</span>") +
        "</span>" +
      "</li>").join("");
    return '<article class="mypc-card">' +
      '<div class="mypc-card__head">' +
        '<span class="mypc-card__name">' + esc(pc.nombre) + "</span>" +
        '<span class="mypc-card__date">' + relativo(pc.fecha) + "</span>" +
        '<button class="mypc-card__del" data-del-pc="' + pc.id + '">Borrar</button>' +
      "</div>" +
      '<ul class="mypc-parts">' + filas + "</ul>" +
      '<div class="mypc-card__foot"><span class="lbl">Total (mejor precio por parte)</span>' +
        '<span class="mypc-card__total">' + money(pc.total, pc.moneda) + "</span></div>" +
    "</article>";
  }

  function renderMisPcs() {
    const grid = $("#grid-mis-pcs");
    if (!grid) return;
    const lista = leerMisPcs();
    grid.innerHTML = lista.length
      ? lista.map(misPcCard).join("")
      : '<p class="mypc-empty">Todavía no guardaste ninguna PC. Armá una en <b>“Armá tu PC”</b> y tocá <b>“Guardar en Mis PCs”</b>.</p>';
    grid.querySelectorAll("[data-del-pc]").forEach((b) => b.addEventListener("click", () => borrarBuild(b.getAttribute("data-del-pc"))));
  }

  /* =============================== DATOS ================================ */
  // Lee de Supabase si hay credenciales en window.TECHPRICE_CONFIG; si no, de
  // los archivos JSON locales (data/*.json).
  async function loadData() {
    const cfg = (typeof window !== "undefined" && window.TECHPRICE_CONFIG) || {};
    if (cfg.supabaseUrl && cfg.supabaseKey) {
      const base = cfg.supabaseUrl.replace(/\/$/, "") + "/rest/v1/";
      const headers = { apikey: cfg.supabaseKey, Authorization: "Bearer " + cfg.supabaseKey };
      const q = (t) => fetch(base + t + "?select=*", { headers }).then((r) => {
        if (!r.ok) throw new Error("Supabase " + t + " HTTP " + r.status);
        return r.json();
      });
      const [productos, tiendas, precios] = await Promise.all([q("productos"), q("tiendas"), q("precios")]);
      return {
        productos: productos.map((p) => ({ ...p, id: Number(p.id) })),
        tiendas: tiendas.map((t) => ({ ...t, id: Number(t.id) })),
        precios: precios.map((r) => ({ ...r, producto: Number(r.producto), tienda: Number(r.tienda), precio: Number(r.precio) })),
      };
    }
    const j = (f) => fetch("data/" + f).then((r) => { if (!r.ok) throw new Error(f + " HTTP " + r.status); return r.json(); });
    const [productos, tiendas, precios] = await Promise.all([j("productos.json"), j("tiendas.json"), j("precios.json")]);
    return { productos, tiendas, precios };
  }

  /* =============================== INIT ================================= */
  async function init() {
    try {
      const { productos, tiendas, precios } = await loadData();
      construirModelo(productos, tiendas, precios);
      render();
      wireGlobal();
    } catch (err) {
      document.querySelector("main .container").insertAdjacentHTML(
        "afterbegin",
        '<p class="empty-state" style="margin-top:2rem">No se pudieron cargar los datos JSON. ' +
          "Abrí la página por <b>HTTP</b> (por ejemplo con XAMPP en <code>htdocs</code>, o " +
          "<code>python3 -m http.server</code>), no con doble clic (file://).<br><small>" + esc(String(err)) + "</small></p>"
      );
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
