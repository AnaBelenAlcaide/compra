# AhorraCesta (MVP)
Páginas: `index.html` (buscar), `ofertas.html` (ofertas vigentes), `cesta.html` (lista, distancias y resultado).

## Verlo en local
Doble clic en `index.html`: no necesita servidor (los precios se cargan desde `data/catalog.js`).
La lista se guarda con localStorage; si tu navegador no la comparte entre archivos abiertos con doble clic, usa `python -m http.server`.

## GitHub Pages
Sube el contenido → Settings → Pages → rama `main`, raíz.

## Cesta y distancias
Para cada combinación de tiendas se calcula compra + viaje (ruta casa → tiendas → casa más corta, con coste por km y valor del tiempo). Distancias editables en «Mi cesta»; valores de ejemplo en `js/config.js`.
Futuro: sustituir distancias manuales por coordenadas de tu casa y de cada tienda.

## Datos reales
`js/config.js` elige la fuente: `ScriptSource` (data/catalog.js), `JsonSource` (data/catalog.json) o `ApiSource`.
Cada extractor debe producir filas `{productId, storeId, price, offer}` unidas por EAN en el formato de `data/catalog.json`; `catalog.js` es ese mismo JSON con el prefijo `window.CATALOG = `.
Respeta los términos de uso y el robots.txt de cada cadena. Precios y EAN de la demo son ficticios.
