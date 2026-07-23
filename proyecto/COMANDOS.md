# 🧾 TechPrice — Todos los comandos

Tu proyecto vive en `~/Descargas/proyecto` y lo ves en el navegador vía XAMPP
en `http://localhost/proyecto/`.

---

## 🔄 EL CICLO COMPLETO (lo que hacés cada vez que te paso un ZIP nuevo)

```bash
# 1) Descomprimir el ZIP nuevo (reemplaza la carpeta vieja)
unzip -o ~/Descargas/techprice.zip -d ~/Descargas/

# 2) Regenerar los datos reales (scrapea las tiendas, tarda varios minutos)
cd ~/Descargas/proyecto
node scripts/fetch-real-data.mjs --fresh

# 3) Copiar TODO a XAMPP (esto es lo que ves en el navegador)
sudo rm -rf /opt/lampp/htdocs/proyecto
sudo cp -rf ~/Descargas/proyecto /opt/lampp/htdocs/proyecto

# 4) En el navegador: abrí http://localhost/proyecto/  y apretá  Ctrl + Shift + R
```

> Si el ZIP se te bajó con otro nombre (techprice(1).zip, etc.), cambialo en el
> paso 1. Para ver el nombre exacto: `ls -t ~/Descargas/*.zip | head -1`

---

## ▶️ PRENDER / APAGAR XAMPP

```bash
sudo /opt/lampp/lampp start     # prender
sudo /opt/lampp/lampp stop      # apagar
sudo /opt/lampp/lampp restart   # reiniciar
```

---

## 🔍 SOLO REGENERAR DATOS (sin tocar el diseño)

```bash
cd ~/Descargas/proyecto
node scripts/fetch-real-data.mjs --fresh      # arranca de cero
# o, para ir sumando historial de precios día a día (sin --fresh):
node scripts/fetch-real-data.mjs
```

Después SIEMPRE copiá a XAMPP (paso 3 de arriba) y refrescá con Ctrl+Shift+R.

---

## 🩺 CHEQUEOS RÁPIDOS (para diagnosticar)

```bash
# ¿Qué categorías y cuántos productos tengo?
cd ~/Descargas/proyecto
node -e 'const p=require("./data/productos.json");const m={};for(const x of p)m[x.categoria]=(m[x.categoria]||0)+1;console.log(m)'

# ¿Cuántas tiendas y precios?
node -e 'const t=require("./data/tiendas.json");const pr=require("./data/precios.json");console.log("tiendas:",t.length,"| precios:",pr.length);console.log(t.map(x=>x.nombre))'

# ¿La copia de XAMPP tiene lo nuevo? (debe dar un número > 0)
grep -c contarComponentes /opt/lampp/htdocs/proyecto/scripts/fetch-real-data.mjs
```

---

## 🌐 SUBIR A NETLIFY (cuando quieras publicarlo online)

Subís SOLO estas de la carpeta `~/Descargas/proyecto`:
- `index.html`
- carpeta `js/`
- carpeta `data/`

Por drag & drop en https://app.netlify.com/drop  (NO subas `scripts/` ni `supabase/`).

---

## 🗄️ SUPABASE (opcional, base de datos online)

En el SQL Editor de Supabase:
1. Pegás y ejecutás `supabase/schema.sql`  (una vez)
2. Pegás y ejecutás `supabase/seed-real.sql`  (cada vez que actualizás datos)
3. En `js/config.js` ponés tu Project URL + anon key
