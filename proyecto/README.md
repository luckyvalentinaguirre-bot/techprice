# TechPrice Uruguay — versión local (sin base de datos)

Versión simple que funciona **solo con archivos**: `index.html` + `js/app.js` +
tres archivos JSON. No necesita Node, ni base de datos, ni build. Permite
**buscar productos, comparar precios entre tiendas y ver el historial**.

## Cómo abrirlo

Los navegadores **bloquean** la lectura de archivos JSON si abrís el HTML con
doble clic (`file://`). Hay que servirlo por **HTTP**. Con **XAMPP** es directo:

1. Copiá la carpeta `proyecto/` dentro de `htdocs`
   (ej. `C:\xampp\htdocs\proyecto\`).
2. Encendé **Apache** desde el panel de XAMPP.
3. Entrá a **http://localhost/proyecto/**

> Alternativas sin XAMPP: la extensión **Live Server** de VS Code, o en una
> terminal dentro de la carpeta: `python3 -m http.server 8090` y abrir
> `http://localhost:8090/`.

## Estructura

```
proyecto/
├── index.html          # la página (diseño + estilos embebidos)
├── js/
│   └── app.js          # carga los JSON, arma la comparación y dibuja todo
└── data/
    ├── productos.json  # catálogo
    ├── tiendas.json    # tiendas
    └── precios.json    # precios por tienda y fecha (esto es el historial)
```

## Cómo editar los datos

Todo sale de los tres JSON: editalos y recargá la página.

**`productos.json`** — un objeto por producto:
```json
{ "id": 1, "nombre": "Asus Dual RTX 4060 OC 8GB", "marca": "Asus", "categoria": "GPU", "imagen": null }
```

**`tiendas.json`** — un objeto por tienda:
```json
{ "id": 1, "nombre": "PC Store Uruguay", "plataforma": "generic_html" }
```

**`precios.json`** — un objeto por (producto, tienda, fecha). Varias fechas del
mismo producto+tienda arman el **historial**; el precio actual es el de la
**fecha más reciente**:
```json
{ "producto": 1, "tienda": 1, "precio": 18900, "moneda": "UYU", "disponible": true, "fecha": "2026-07-20" }
```

Reglas que aplica `app.js` automáticamente:
- **Mejor precio / promedio / más alto**: se calculan entre las ofertas actuales
  de cada tienda (la fila más reciente por tienda).
- **Bajó de precio**: si el menor precio de la última fecha es menor que el de la
  fecha anterior.
- **Categorías / tiendas / tendencias**: se derivan solos de los datos.

Los campos `marca`, `imagen`, `plataforma`, `moneda` y `disponible` son
opcionales (si faltan, se usan valores por defecto).

## Regenerar los datos de ejemplo

Los JSON de ejemplo se generan con
[`scripts/build-json-app.mjs`](../scripts/build-json-app.mjs) desde la raíz del
repo (`node scripts/build-json-app.mjs`). Pero podés editar los JSON a mano sin
problema; el script solo sirve para volver a crear el ejemplo.
