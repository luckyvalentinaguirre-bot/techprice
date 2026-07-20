# Traer precios e imágenes REALES

El script `scripts/fetch-real-data.mjs` lee tiendas de verdad y reescribe
`data/productos.json`, `data/tiendas.json` y `data/precios.json` con **precios
e imágenes reales** (y `supabase/seed-real.sql` para la base online).

Tiene que correr en **tu PC** (con internet hacia las tiendas). Yo no puedo
hacerlo desde acá porque mi entorno tiene bloqueadas esas tiendas.

## Requisitos

- **Node 18 o superior** (usa el `fetch` nativo; no instala nada).

## Uso rápido

```bash
cd proyecto

# Probar la lógica sin internet (no toca tus archivos):
node scripts/fetch-real-data.mjs --selftest

# Traer datos reales de las tiendas activas y REEMPLAZAR el ejemplo:
node scripts/fetch-real-data.mjs --fresh

# Correrlo de nuevo otro día SIN --fresh va sumando el precio de cada día
# → se arma el historial real:
node scripts/fetch-real-data.mjs
```

Después:
- **XAMPP / local:** recargá la página, ya muestra los datos reales.
- **Netlify:** volvé a subir la carpeta (o hacé push si conectaste el repo).
- **Supabase:** pegá `supabase/seed-real.sql` en el SQL Editor y ejecutá.

## Elegir las tiendas — `scripts/stores.config.json`

Poné `enabled: true` en las que quieras. Ya viene lista **Thot** (WooCommerce,
confirmada). Tres tipos soportados:

- **WooCommerce** — `"plataforma": "woocommerce"`, `baseUrl`. (Para saber si una
  tienda es WooCommerce: abrí `TIENDA/wp-json/wc/store/v1/products` en el
  navegador; si muestra JSON, lo es.)
- **Tiendanube** — `"plataforma": "tiendanube"`, `baseUrl`. (Se confirma abriendo
  `TIENDA/products.json`.)
- **Mercado Libre** — `"plataforma": "mercadolibre"`, con `queries` (qué buscar)
  y un `token`. La API de ML hoy **pide token**:
  1. Entrá a **https://developers.mercadolibre.com.ar**, iniciá sesión y creá
     una aplicación (gratis).
  2. Generá un **access token** de prueba y pegalo en `token`.
  3. Poné `enabled: true`.

> Si una tienda no tiene API (WooCommerce/Tiendanube/ML), hay que escribir un
> lector a medida (scraping de HTML), que es más frágil. Empezá por las que sí
> tienen API.

## Qué hace por vos

- Clasifica cada producto en su categoría (GPU, CPU, RAM, …) por el nombre.
- **Descarta PCs armadas, combos y "señas"** (solo componentes/productos
  individuales).
- Toma la **imagen real** de cada producto.
- Cuando el mismo modelo aparece en varias tiendas, lo **agrupa** para comparar
  precios (matching por marca + modelo; es conservador, si duda los deja
  separados).
- Infiere specs básicas (socket, tipo de RAM, watts…) para el armador — es
  "mejor esfuerzo": los productos sin specs igual aparecen en el catálogo.

## Ojo (uso responsable)

Antes de leer una tienda seguido, mirá su `robots.txt` y términos. El script
espera entre pedidos y se identifica con un User-Agent propio. Si una tienda
responde `403`, puede estar bloqueando bots: no insistas.
