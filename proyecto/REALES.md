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

Ya viene una **lista grande de tiendas de tecnología de Uruguay** con
`plataforma: "auto"`: el script **detecta solo** si cada una es WooCommerce,
Tiendanube o VTEX, y **la que no tenga API, la saltea** (vas a ver en pantalla
"sin API detectada, la salteo"). No hace falta que sepas la plataforma de cada
una. Sacá o agregá tiendas libremente (poné `enabled: false` para apagar una).

> **Mercado Libre está apagado**: restringió su API de búsqueda (devuelve 403
> aun con token válido), así que por ahora no se puede leer por API.

Los tipos soportados (para detección automática o manual) son:

- **WooCommerce** — `"plataforma": "woocommerce"`, `baseUrl`. (Para saber si una
  tienda es WooCommerce: abrí `TIENDA/wp-json/wc/store/v1/products` en el
  navegador; si muestra JSON, lo es.)
- **Tiendanube** — `"plataforma": "tiendanube"`, `baseUrl`. (Se confirma abriendo
  `TIENDA/products.json`.)
- **Mercado Libre** — `"plataforma": "mercadolibre"`, con `queries` (qué buscar)
  y un `token`. Es la opción que más rinde: una sola API trae muchísimos
  productos con imagen y precio. La API hoy **pide token**:

  **1. Crear la aplicación.** Entrá a **https://developers.mercadolibre.com.uy**,
  iniciá sesión y creá una aplicación. Anotá el **App ID** (client_id) y el
  **Secret Key** (client_secret). En **Redirect URI** poné exactamente
  `https://localhost`.

  **2. Autorizar (navegador).** Abrí esta URL cambiando `TU_APP_ID`:
  ```
  https://auth.mercadolibre.com.uy/authorization?response_type=code&client_id=TU_APP_ID&redirect_uri=https://localhost
  ```
  Autorizá. El navegador te manda a `https://localhost/?code=TG-xxxx` (la página
  da "no se puede conectar", es normal). Copiá el valor de `code=` (empieza con
  `TG-`). Ese código se usa una sola vez y vence en minutos: canjealo enseguida.

  **3. Canjear el código por el token.** En una terminal:
  ```bash
  curl -X POST "https://api.mercadolibre.com/oauth/token" \
    -H "accept: application/json" \
    -H "content-type: application/x-www-form-urlencoded" \
    -d "grant_type=authorization_code&client_id=TU_APP_ID&client_secret=TU_SECRET&code=TG-tu-codigo&redirect_uri=https://localhost"
  ```
  Devuelve un JSON con `"access_token": "APP_USR-…"` (y un `refresh_token`).

  **4. Usar el token.** Pegá el `APP_USR-…` en `scripts/stores.config.json`
  (store de Mercado Libre, campo `token`), poné `enabled: true` y corré
  `node scripts/fetch-real-data.mjs --fresh`.

  > El token dura ~6 horas (`expires_in: 21600`). Cuando venza (error 401),
  > repetís el paso 3 con el `refresh_token`, o rehacés 2-3. Ajustá qué se busca
  > en `queries` y cuántos por término en `maxPorBusqueda`.
  >
  > Probar el token a mano (tiene que devolver JSON con `results`):
  > `curl -H "Authorization: Bearer APP_USR-tu-token" "https://api.mercadolibre.com/sites/MLU/search?q=rtx&limit=1"`

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
