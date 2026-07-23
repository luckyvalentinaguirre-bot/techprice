# Usar una base de datos online (Supabase) + Netlify

La página funciona de dos formas, **sin tocar código**:

- **Sin configurar nada** → usa los archivos `data/*.json` (ideal para XAMPP o
  para subir a Netlify tal cual).
- **Con Supabase configurado** → lee los datos de tu base online.

Sólo cambia lo que pongas en `js/config.js`.

## Pasos (una vez, ~5 min)

### 1. Crear el proyecto en Supabase
1. Entrá a **https://supabase.com** y creá una cuenta gratis.
2. **New project** → ponele nombre y una contraseña de base (guardala). Esperá
   ~1 min a que se cree.

### 2. Crear las tablas y cargar los datos
1. En el menú lateral: **SQL Editor** → **New query**.
2. Abrí el archivo `supabase/schema.sql` de este proyecto, copiá **todo** su
   contenido, pegalo y apretá **Run**. (Crea las tablas `productos`, `tiendas`,
   `precios` y deja la lectura pública.)
3. Nueva query otra vez: copiá y pegá **todo** `supabase/seed.sql` y **Run**.
   (Carga los datos de ejemplo.)

### 3. Copiar tus claves en la página
1. En Supabase: **Project Settings** (el engranaje) → **API**.
2. Copiá la **Project URL** y la clave **anon public**.
3. Abrí `js/config.js` y pegalas:
   ```js
   window.TECHPRICE_CONFIG = {
     supabaseUrl: "https://TU-PROYECTO.supabase.co",
     supabaseKey: "eyJ...TU-CLAVE-ANON...",
   };
   ```
   > La clave **anon public** es segura para poner en el navegador: con las
   > reglas del `schema.sql`, sólo permite **leer** los datos, no modificarlos.

### 4. Subir a Netlify
- Arrastrá la carpeta `proyecto/` a **https://app.netlify.com/drop** (o conectá
  el repo con **Base directory: `proyecto`**).
- Listo: tu link público ahora lee los precios desde Supabase.

## Cambiar los datos

Con Supabase configurado, editás los datos desde Supabase (**Table Editor**) o
volviendo a correr un `seed.sql` con tus datos. No hace falta re-subir archivos
a Netlify: la página los pide a la base cada vez que se abre.

## Volver a los archivos JSON

Dejá `supabaseUrl` y `supabaseKey` vacíos en `js/config.js` y la página vuelve a
usar `data/*.json`.
