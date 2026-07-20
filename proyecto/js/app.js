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
  const icon = (name, size = 16, cls = "") =>
    '<svg class="' + cls + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (PATHS[name] || PATHS.box) + "</svg>";

  const CAT_ICON = {
    gpu: "gpu", cpu: "cpu", ram: "memory", ssd: "drive", hdd: "drive", monitor: "monitor",
    notebook: "laptop", teclado: "keyboard", mouse: "mouse", auriculares: "headphones",
    motherboard: "board", fuente: "power", gabinete: "case",
  };
  const catIcon = (cat) => CAT_ICON[String(cat).toLowerCase()] || "box";

  /* ------------------------------------------------------- normalización */
  const norm = (s) =>
    String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  /* =========================== MODELO EN MEMORIA ========================= */
  let MODEL = { productos: [], tiendas: new Map(), ultimaFecha: null };

  function construirModelo(productos, tiendas, precios) {
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
        moneda: r.moneda || "UYU",
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
      const moneda = (ref[0] && ref[0].moneda) || "UYU";
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

  function showcaseCard(m) {
    return '' +
      '<article class="showcase-card" data-id="' + m.id + '">' +
        '<div class="showcase-card__media" data-open="' + m.id + '" role="button" tabindex="0" aria-label="' + esc(m.nombre) + '">' +
          '<span class="showcase-card__placeholder">' + icon(catIcon(m.categoria), 26) + "</span>" +
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
        '<div class="drop-card__thumb"><span class="showcase-card__placeholder">' + icon(catIcon(m.categoria), 20) + "</span></div>" +
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

    // Destacados (por fecha reciente, luego id)
    const destacados = [...M].sort((a, b) => (b.lastFecha || "").localeCompare(a.lastFecha || "") || b.id - a.id).slice(0, 8);
    $("#grid-destacados").innerHTML = destacados.map(showcaseCard).join("");

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
    wireCards();
  }

  /* =============================== BUSCADOR ============================= */
  function buscar(q) {
    const query = norm(q.trim());
    const grid = $("#grid-destacados");
    const title = $("#title-destacados");
    const subtitle = $("#subtitle-destacados");
    if (!query) {
      title.textContent = "Productos destacados";
      subtitle.textContent = "El mejor precio, el promedio y cuánto se movió respecto al día anterior.";
      const destacados = [...MODEL.productos].sort((a, b) => (b.lastFecha || "").localeCompare(a.lastFecha || "") || b.id - a.id).slice(0, 8);
      grid.innerHTML = destacados.map(showcaseCard).join("");
      wireCards();
      return;
    }
    const res = MODEL.productos.filter((m) => m._buscable.includes(query));
    title.textContent = 'Resultados para "' + q.trim() + '"';
    subtitle.textContent = res.length + " " + (res.length === 1 ? "producto encontrado" : "productos encontrados");
    grid.innerHTML = res.length ? res.map(showcaseCard).join("") : '<p class="empty-results">No encontramos productos que coincidan.</p>';
    wireCards();
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
    const filas = m.offers.map((o) =>
      '<tr class="' + (o.tiendaId === m.cheapestTiendaId ? "price-table__row--best" : "") + '">' +
        "<td>" + esc(o.tienda) + "</td>" +
        "<td>" + money(o.precio, o.moneda) + "</td>" +
        "<td>" + (o.disponible ? "En stock" : "Sin stock") + "</td>" +
        '<td><a href="' + esc(o.url) + '" target="_blank" rel="noopener noreferrer">Ver en tienda</a></td>' +
      "</tr>").join("");

    const root = $("#modal-root");
    root.innerHTML =
      '<div class="modal" role="document">' +
        '<div class="modal__head"><div>' +
          (m.marca ? '<div class="modal__brand">' + esc(m.marca) + " · " + esc(m.categoria) + "</div>" : "") +
          '<h2 class="modal__title">' + esc(m.nombre) + "</h2></div>" +
          '<button class="btn btn--icon" id="modal-close" aria-label="Cerrar">' + icon("close", 16) + "</button>" +
        "</div>" +
        '<div class="modal__body">' +
          '<div class="stat-row">' +
            '<div class="stat"><div class="stat__label">Precio más bajo</div><div class="stat__value stat__value--good">' + money(m.lowest, m.moneda) + "</div></div>" +
            '<div class="stat"><div class="stat__label">Precio promedio</div><div class="stat__value">' + money(m.avg, m.moneda) + "</div></div>" +
            '<div class="stat"><div class="stat__label">Precio más alto</div><div class="stat__value">' + money(m.highest, m.moneda) + "</div></div>" +
            '<div class="stat"><div class="stat__label">Ahorro máximo</div><div class="stat__value stat__value--good">' + money(savings, m.moneda) + "</div></div>" +
          "</div>" +
          "<div><div class=\"modal__section-title\">Precios por tienda</div>" +
            '<table class="price-table"><thead><tr><th>Tienda</th><th>Precio</th><th>Disponibilidad</th><th></th></tr></thead><tbody>' + filas + "</tbody></table></div>" +
          "<div><div class=\"modal__section-title\">Historial de precios (mejor precio por fecha)</div>" + sparkline(m.historia, m.moneda) + "</div>" +
        "</div>" +
      "</div>";
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add("is-open"));
    $("#modal-close").addEventListener("click", cerrarDetalle);
  }

  function cerrarDetalle() {
    const root = $("#modal-root");
    root.classList.remove("is-open");
    setTimeout(() => { root.hidden = true; root.innerHTML = ""; }, 180);
  }

  /* ============================== EVENTOS =============================== */
  function wireCards() {
    document.querySelectorAll("[data-open]").forEach((el) => {
      const open = () => abrirDetalle(Number(el.getAttribute("data-open")));
      el.addEventListener("click", open);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
    document.querySelectorAll(".js-alert").forEach((b) =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const on = b.getAttribute("aria-pressed") === "true";
        b.setAttribute("aria-pressed", String(!on));
        b.style.color = !on ? "var(--brand)" : "";
        b.style.borderColor = !on ? "var(--brand)" : "";
      }));
    document.querySelectorAll("[data-cat]").forEach((el) =>
      el.addEventListener("click", () => {
        const input = $("#search-input");
        input.value = el.getAttribute("data-cat");
        buscar(input.value);
        $("#section-destacados").scrollIntoView({ behavior: "smooth", block: "start" });
      }));
  }

  function wireGlobal() {
    $("#search-form").addEventListener("submit", (e) => { e.preventDefault(); buscar($("#search-input").value); });
    $("#search-input").addEventListener("input", (e) => buscar(e.target.value));
    $("#modal-root").addEventListener("click", (e) => { if (e.target.id === "modal-root") cerrarDetalle(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarDetalle(); });
  }

  /* =============================== INIT ================================= */
  async function init() {
    try {
      const [productos, tiendas, precios] = await Promise.all([
        fetch("data/productos.json").then((r) => r.json()),
        fetch("data/tiendas.json").then((r) => r.json()),
        fetch("data/precios.json").then((r) => r.json()),
      ]);
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
