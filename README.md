# TechPrice Uruguay

Comparador de precios de **componentes y productos individuales de tecnologia**
entre tiendas de Uruguay. El sistema identifica cuando el mismo producto
aparece publicado con nombres distintos en distintas tiendas (ej. "ASUS Dual
RTX 5070 OC 12GB" / "Asus RTX5070 Dual OC" / "RTX 5070 ASUS Dual OC") y los
agrupa en una unica ficha con precio minimo, promedio, maximo, historial,
disponibilidad y ahorro maximo posible.

**Nunca compara PCs armadas ni equipos preconfigurados** — solo componentes y
productos individuales (GPU, CPU, RAM, SSD/HDD, motherboards, gabinetes,
perifericos, notebooks, celulares, etc.). Ver
[`packages/shared/src/category.ts`](./packages/shared/src/category.ts) para
el listado completo de categorias soportadas.

## Arquitectura

Monorepo (pnpm workspaces) en TypeScript, con la logica de comparacion
totalmente desacoplada del frontend:

```
packages/
  shared/      Tipos de dominio compartidos (Category, RawProduct, ComparisonCard...)
  core/        Normalizacion de nombres, matching entre tiendas y motor de comparacion
               (min/avg/max, diferencia de precio, ahorro maximo). Sin dependencias
               de DB, HTTP ni frontend: logica pura y testeada.
  scrapers/    Adaptadores por plataforma de e-commerce (Tiendanube, WooCommerce,
               VTEX, HTML generico) + registro de tiendas (stores.config.ts).
  database/    Schema de Prisma (Postgres) + cliente.
  ingestion/   Orquestador: corre los scrapers, filtra PCs armadas/combos,
               normaliza, matchea contra el catalogo existente (o crea producto
               nuevo) y guarda precios + historial. CLI para correrlo manualmente
               o desde un cron.
apps/
  api/         API REST (Fastify) que expone el catalogo. Unico punto de
               contacto del frontend con el sistema.
  web/         Frontend (Next.js) que consume la API. No contiene logica de
               negocio: solo presentacion.
```

Flujo de datos:

```
Tienda (Tiendanube/WooCommerce/VTEX/HTML) 
  -> Scraper adapter (packages/scrapers)         RawProduct
  -> Filtro anti PC-armada (packages/ingestion)
  -> Normalizacion + extraccion de atributos      NormalizedProduct
  -> Matching contra catalogo existente           (packages/core)
  -> Producto canonico (nuevo o existente) + Listing + PriceHistory (Postgres)
  -> API REST (apps/api)                          ComparisonCard
  -> Frontend (apps/web)
```

### Como agrupa productos de distintas tiendas

`packages/core/src/normalization` extrae marca, modelo (ej. "rtx5070",
independiente de espaciado/orden de palabras) y atributos como capacidad
(GB), tipo de memoria, velocidad, pulgadas de pantalla. `packages/core/src/matching`
compara marca+modelo exacto (score 1.0) o cae a similitud de tokens (Jaccard)
+ coincidencia de atributos cuando la categoria no tiene un patron de modelo
estricto (ej. RAM). Ver los tests en `packages/core/src/**/*.test.ts` para
casos concretos, incluido el ejemplo de la spec (las 3 variantes de nombre de
la RTX 5070 se agrupan; una RTX 5070 Ti NO se agrupa con una RTX 5070).

### Como se agregan tiendas nuevas

El sistema esta preparado para sumar tiendas sin tocar el resto de la
arquitectura:

1. Si la tienda corre sobre **Tiendanube, WooCommerce o VTEX** (las
   plataformas de e-commerce mas comunes en Uruguay), agregar una entrada en
   [`packages/scrapers/src/stores.config.ts`](./packages/scrapers/src/stores.config.ts)
   con su `baseUrl` y el mapeo de categorias de la tienda a nuestras
   categorias canonicas — **sin escribir codigo nuevo**. Solo mapear
   categorias que sean componentes/productos individuales; nunca mapear una
   categoria de "PC armada" o combos.
2. Si la tienda tiene un sitio a medida, usar `platform: "generic_html"` y
   completar `htmlSelectors` (selectores CSS) en la misma config.
3. Si la tienda corre sobre una plataforma nueva no soportada, implementar la
   interfaz `StoreScraper` (un archivo en `packages/scrapers/src/platforms/`)
   y registrarla en `packages/scrapers/src/registry.ts` (una linea). Nada mas
   en el sistema necesita cambiar: ni el matcher, ni la API, ni el frontend.

Las 4 entradas actuales en `stores.config.ts` son **plantillas** (`enabled:
false`) — no apuntan a tiendas reales verificadas. Antes de habilitar una
tienda hay que confirmar sus URLs/ids de categoria reales y revisar su
`robots.txt`/terminos de uso.

## Deploy de demo (Render, gratis)

`render.yaml` en la raiz define un Blueprint que levanta los 3 componentes
(Postgres + API + web) en un solo deploy, con datos de ejemplo precargados
(`packages/database/src/seedDemo.ts` — **no son datos reales**, son solo
para que la demo se vea con contenido mientras no hay tiendas verificadas).

1. Crear cuenta gratis en [render.com](https://render.com) (podes entrar con
   tu cuenta de GitHub).
2. Dashboard -> **New +** -> **Blueprint**.
3. Elegir el repo `luckyvalentinaguirre-bot/techprice`, rama
   `claude/techprice-product-comparison-rfzvxm`. Render va a detectar
   `render.yaml` solo.
4. Aplicar el blueprint. Va a crear 3 recursos: `techprice-db` (Postgres),
   `techprice-api` y `techprice-web`. El primer deploy tarda unos minutos.
5. Cuando `techprice-web` termine, su URL (`https://techprice-web.onrender.com`,
   o la que Render le haya asignado si ese nombre ya estaba tomado) es la
   pagina publica.

Nota: los planes free de Render "duermen" el servicio tras un rato sin
trafico (el primer request después de eso tarda ~30s en responder) y la
base de datos free expira a los 90 dias — para un uso real hay que pasar a
un plan pago o cambiar de proveedor.

## Arranque rápido (un solo comando)

Si ya tenés **Node 20+**, **pnpm** y **Docker Desktop** (abierto), no hace falta
seguir el paso a paso: desde la carpeta del proyecto corré

```bash
pnpm local        # o:  ./dev.sh
```

Ese comando levanta la base de datos, aplica las migraciones, carga datos de
ejemplo y arranca la API + el frontend, todo junto. Cuando termine, abrí
**http://localhost:8080**. Es reejecutable: podés cerrarlo con `Ctrl+C` y volver
a correr `pnpm local` cuando quieras. Cada archivo que se edite recarga la
página sola.

> ¿No tenés Docker? Seguí el paso a paso de abajo (podés usar una base gratis
> en la nube como neon.tech en lugar de Docker).

## Probarlo en tu compu (Linux), paso a paso

Guía pensada para no tener que andar exportando variables de entorno a
mano: todo se lee de un archivo `.env`.

```bash
# 1. Si no tenes Node.js 20+, instalalo (podes verificar con: node -v)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc   # o abrí una terminal nueva
nvm install 20

# 2. Instalar pnpm
npm install -g pnpm@10.33.0

# 3. Traer el codigo (o descargalo como zip desde GitHub y entra a la carpeta)
git clone https://github.com/luckyvalentinaguirre-bot/techprice.git
cd techprice
git checkout claude/techprice-product-comparison-rfzvxm

# 4. Instalar dependencias del proyecto
pnpm install

# 5. Base de datos: la mas simple es Docker...
docker compose up -d
# ...si no tenes Docker, podes usar una gratis en la nube (neon.tech: te
# registras, creas un proyecto, copias el "connection string" que te dan y
# lo pegas en el archivo .env del paso 6, en DATABASE_URL).

# 6. Copiar la config de ejemplo (y editarla si usaste Neon en vez de Docker)
cp .env.example .env

# 7. Crear las tablas
pnpm db:migrate

# 8. Cargar datos de EJEMPLO para ver la pagina con contenido
#    (no son datos reales, son solo para ver el diseño funcionando)
pnpm db:seed:demo

# 9. Levantar la API — dejala corriendo en esta terminal
pnpm api:dev
```

Abrí una **segunda terminal** (misma carpeta `techprice`) para el frontend:

```bash
pnpm web:dev
```

Y abrí **http://localhost:3000** en el navegador. Cada vez que edites un
archivo del proyecto, la página se actualiza sola.

## Requisitos

- Node.js 20+
- pnpm 10+
- PostgreSQL 16 (o Docker, ver `docker-compose.yml`)

## Uso local (referencia rápida)

```bash
cp .env.example .env   # y ajustar DATABASE_URL si hace falta

pnpm install

# Levantar Postgres (opcion Docker)
docker compose up -d

# Migrar y generar el cliente de Prisma
pnpm db:migrate

# Sembrar las tiendas configuradas en stores.config.ts
pnpm db:seed

# (opcional) cargar datos de ejemplo para ver la UI con contenido
pnpm db:seed:demo

# Correr el pipeline de scraping + matching (requiere al menos una tienda
# enabled: true en stores.config.ts con datos reales)
pnpm ingest

# Levantar la API (http://localhost:4000)
pnpm api:dev

# Levantar el frontend (http://localhost:3000)
pnpm web:dev
```

## Tests

```bash
pnpm --filter @techprice/core test       # normalizacion, matching, comparison engine
pnpm --filter @techprice/scrapers test   # parseo de precios, utilidades
```

## Estado actual / pendiente

Lo construido y verificado end-to-end (incluye una corrida real contra
Postgres reproduciendo el ejemplo de la spec: 3 nombres distintos de RTX 5070
en 3 tiendas se agrupan en 1 ficha con min/avg/max y ahorro correctos):

- [x] Modelo de datos (Prisma) para catalogo canonico, listings, historial de
      precios y auditoria de scraping.
- [x] Normalizacion + extraccion de atributos + matcher difuso, con tests.
- [x] Motor de comparacion (min/avg/max, diferencia, ahorro maximo).
- [x] Framework de scrapers por plataforma (Tiendanube/WooCommerce/VTEX/HTML
      generico) + filtro anti PC-armada, con tests de utilidades.
- [x] Pipeline de ingestion (orquestador + CLI).
- [x] API REST (categorias, tiendas, listado de productos, ficha de
      comparacion con historial).
- [x] Frontend Next.js (home por categoria, listado con filtros/busqueda,
      ficha de producto con tabla de precios por tienda + grafico de
      historial).

### Tiendas: 8 confirmadas, plataforma sin verificar

`stores.config.ts` ya tiene una entrada por cada una de estas 8 tiendas
reales de Uruguay, con su `baseUrl` confirmado por busqueda web:

| Tienda | id | baseUrl | Plataforma (sin confirmar) |
|---|---|---|---|
| Banifox | `banifox` | banifox.com.uy | generic_html (guess) |
| Thot Computación | `thot-computacion` | thotcomputacion.com.uy | woocommerce (guess, tiene `/shop/`) |
| LOi | `loi` | loi.com.uy | generic_html (guess) |
| NetPC | `netpc` | netpc.uy | generic_html (guess, precios en USD) |
| PC Store | `pcstore` | pcstore.com.uy | generic_html (guess) |
| ZonaTecno | `zonatecno` | zonatecno.com.uy | tiendanube (guess) |
| Hard PC | `hardpc` | hardpc.com.uy | generic_html (guess) |
| NNET | `nnet` | nnet.com.uy | generic_html (guess) |

Todas quedaron con `enabled: false` porque **no pude verificar la
plataforma real de ninguna**: este entorno de desarrollo no tiene salida de
red hacia dominios `.uy` (los intentos de fetch a las 8 tiendas devolvieron
403 o timeout de DNS, incluso para `/robots.txt`, que normalmente es
publico). La columna "Plataforma" de la tabla es una estimacion a partir de
patrones de URL vistos en los resultados de busqueda (ej. Thot tiene una
pagina `/shop/`, el slug por defecto de WooCommerce), no una confirmacion.

**Para habilitar cada tienda** (desde una red que sí llegue a los sitios):

1. Abrir en el navegador `{baseUrl}/products.json?page=1` (Tiendanube),
   `{baseUrl}/wp-json/wc/store/v1/products` (WooCommerce) o
   `{baseUrl}/api/catalog_system/pub/products/search?_from=0&_to=9` (VTEX).
   Si alguno devuelve JSON, esa es la plataforma real — ajustar `platform`
   en `stores.config.ts` si mi estimacion estaba mal.
2. Si ninguno responde JSON, es un sitio a medida: dejar `generic_html` e
   inspeccionar el HTML de una pagina de categoria para completar los
   selectores CSS reales en `htmlSelectors` (los que puse son placeholders
   `"TODO_SELECTOR"`).
3. Completar `categoryMappings` con los ids/slugs reales de categoria de la
   tienda — **solo** las que sean componentes/productos individuales, nunca
   "PC armada" ni combos.
4. Revisar `robots.txt` y terminos de uso del sitio.
5. Poner `enabled: true`.

## Pendiente

- [ ] Verificar la plataforma real y completar selectores/category ids de
      las 8 tiendas de la tabla de arriba (ver pasos 1-5).
- [ ] Programar `pnpm ingest` en un cron/scheduler para actualizar precios
      periodicamente.
- [ ] Autenticacion/rate-limiting en la API si se expone publicamente.
- [ ] Deduplicar filas de `PriceHistory` cuando el precio no cambio entre
      corridas (hoy inserta un punto por scrape; funcionalmente correcto,
      pero se puede optimizar el volumen de datos).
