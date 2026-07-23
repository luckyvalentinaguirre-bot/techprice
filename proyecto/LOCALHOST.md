# 🖥️ Cómo ver mis páginas en localhost (machete)

## ¿Qué es "localhost"?
Es tu propia PC actuando como servidor web. Abrís el navegador y en vez de una
web de internet, ves los archivos que tenés en tu PC, como si estuvieran
publicados. `localhost` = "esta computadora".

Los navegadores **bloquean** abrir el sitio con doble clic (`file://`) porque no
deja cargar los datos (`data/*.json`). Por eso hay que **servirlo por HTTP**.
Tenés dos formas:

---

## Opción A — XAMPP (la que ya uso)

XAMPP levanta un servidor Apache que muestra todo lo que esté en la carpeta
`/opt/lampp/htdocs/`.

### 1. Prender XAMPP
```bash
sudo /opt/lampp/lampp start
```

### 2. Poner mi página en htdocs
Cada carpeta dentro de `/opt/lampp/htdocs/` es una página distinta.
```
/opt/lampp/htdocs/proyecto/     -> se ve en  http://localhost/proyecto/
/opt/lampp/htdocs/otra-pagina/  -> se ve en  http://localhost/otra-pagina/
```

### 3. Abrir en el navegador
```
http://localhost/proyecto/
```

### 4. Apagar XAMPP cuando termino (opcional)
```bash
sudo /opt/lampp/lampp stop
```

---

## Opción B — Python (rápida, sin XAMPP)

Sirve la carpeta en la que estás parado. No necesita instalar nada.
```bash
cd ~/Descargas/proyecto
python3 -m http.server 8000
```
Y lo abrís en:
```
http://localhost:8000
```
Para cortarlo: `Ctrl + C` en esa terminal.

---

## 📄 Cargar UNA PÁGINA MÁS

### Caso 1 — Otra web aparte (otro proyecto)
Poné la carpeta nueva dentro de htdocs:
```bash
sudo cp -rf ~/Descargas/mi-otra-pagina /opt/lampp/htdocs/
```
Se ve en: `http://localhost/mi-otra-pagina/`

### Caso 2 — Otra página dentro del MISMO sitio
Agregá un archivo `.html` en la carpeta del proyecto. Ejemplo, `nosotros.html`:
```
/opt/lampp/htdocs/proyecto/nosotros.html
```
Se ve en: `http://localhost/proyecto/nosotros.html`
Y lo enlazás desde `index.html` con:  `<a href="nosotros.html">Nosotros</a>`

---

## 🔄 Regla de oro (lo que siempre me olvido)
Cuando cambio archivos en `~/Descargas/proyecto`, **NO se actualizan solos** en
`localhost`. Tengo que **copiarlos a htdocs** y **refrescar fuerte** el navegador:

```bash
# 1. Copiar lo nuevo a XAMPP
sudo cp -rf ~/Descargas/proyecto/index.html ~/Descargas/proyecto/js ~/Descargas/proyecto/data /opt/lampp/htdocs/proyecto/

# 2. En el navegador: Ctrl + Shift + R  (refresco sin caché)
```
