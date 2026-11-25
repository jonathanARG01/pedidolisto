#!/usr/bin/env node
/*
  Convierte la carpeta sitio/ en el sitio de UNA sola tienda (para su propio proyecto de Netlify).
  Uso en Netlify: variable de entorno TIENDA_UNICA=<slug> (ej: dulces-y-helados). Sin la variable no hace nada,
  así el sitio principal (pedidolisto-cl) se publica igual que siempre.
  Resultado: la tienda se abre en "/", el panel en "/admin", y se quitan la landing y las demás tiendas.
*/
const fs = require('fs');
const path = require('path');

const slug = (process.env.TIENDA_UNICA || process.argv[2] || '').trim().toLowerCase();
if (!slug) { console.log('tienda-unica: sin TIENDA_UNICA, no se cambia nada.'); process.exit(0); }
if (!/^[a-z0-9-]+$/.test(slug)) { console.error('tienda-unica: slug inválido: ' + slug); process.exit(1); }

const SITIO = path.join(__dirname, '..', 'sitio');
const TIENDAS = path.join(SITIO, 'tiendas');
if (!fs.existsSync(path.join(TIENDAS, slug, 'tienda.json'))) { console.error('tienda-unica: no existe sitio/tiendas/' + slug); process.exit(1); }

// 1) app.html siempre abre esta tienda.
const appHtml = path.join(SITIO, 'app.html');
const marca = "if (!/^[a-z0-9-]+$/.test(slug)) slug = '';";
let html = fs.readFileSync(appHtml, 'utf8');
if (!html.includes(marca)) { console.error('tienda-unica: no encontré dónde fijar el slug en app.html'); process.exit(1); }
html = html.replace(marca, marca + "\n    slug = '" + slug + "';");
fs.writeFileSync(appHtml, html);

// 2) Redirecciones: panel y tienda en la raíz (el ! gana aunque exista index.html).
fs.writeFileSync(path.join(SITIO, '_redirects'), [
  '/admin   /admin.html  200',
  '/admin/  /admin.html  200',
  '/        /app.html    200!',
  '/:slug   /app.html    200',
  '/:slug/  /app.html    200',
  ''
].join('\n'));

// 3) Fuera la landing, el alta y las demás tiendas.
['index.html', 'alta.html', 'alta-gracias.html', 'marcas.html', 'personalizar.html', 'planilla-productos.xlsx']
  .forEach((f) => fs.rmSync(path.join(SITIO, f), { force: true }));
fs.readdirSync(TIENDAS).forEach((d) => { if (d !== slug) fs.rmSync(path.join(TIENDAS, d), { recursive: true, force: true }); });

console.log('tienda-unica: sitio listo solo para /' + slug);
