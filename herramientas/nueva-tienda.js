// Crea una tienda nueva a partir del formulario de alta (/alta) y, si viene, la planilla de productos.
//
// Uso:
//   node herramientas/nueva-tienda.js <alta.json> [planilla.xlsx | planilla.csv] [--fotos carpeta]
//
// - alta.json: el contenido del campo "tienda_json" del envío del formulario (Netlify > Forms > alta).
// - planilla: la planilla-productos.xlsx que completó el cliente (o un CSV con las mismas columnas).
//   Si viene, sus productos reemplazan a los escritos a mano en el formulario.
// - --fotos: carpeta con las fotos del cliente. Se copian a sitio/tiendas/<slug>/img/.
//
// Resultado: sitio/tiendas/<slug>/ con tienda.json, manifest.webmanifest e icon.svg.
// Después: node herramientas/iconos.js (genera los PNG) y revisar en http://localhost:4321/<slug>
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const RESERVADOS = ['alta', 'app', 'tiendas', 'terminos', 'marcas', 'personalizar', 'index', 'img'];

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}
function numero(v) { const n = parseInt(String(v == null ? '' : v).replace(/[^\d]/g, ''), 10); return isNaN(n) ? null : n; }

/* ---------- lectura de planillas ---------- */
function leerCSV(txt) {
  txt = txt.replace(/^﻿/, '');
  const sep = (txt.split('\n')[0].match(/;/g) || []).length >= (txt.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const filas = []; let fila = [], campo = '', comillas = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (comillas) {
      if (c === '"' && txt[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') comillas = false;
      else campo += c;
    } else if (c === '"') comillas = true;
    else if (c === sep) { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && txt[i + 1] === '\n') i++;
      fila.push(campo); filas.push(fila); fila = []; campo = '';
    } else campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  return filas;
}

function leerZip(buf) {
  const archivos = {};
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('El archivo no parece un .xlsx válido');
  let p = buf.readUInt32LE(eocd + 16);
  const total = buf.readUInt16LE(eocd + 10);
  for (let i = 0; i < total; i++) {
    const metodo = buf.readUInt16LE(p + 10), tam = buf.readUInt32LE(p + 20);
    const ln = buf.readUInt16LE(p + 28), le = buf.readUInt16LE(p + 30), lc = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42), nombre = buf.toString('utf8', p + 46, p + 46 + ln);
    const ini = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const datos = buf.subarray(ini, ini + tam);
    archivos[nombre] = metodo === 8 ? zlib.inflateRawSync(datos) : datos;
    p += 46 + ln + le + lc;
  }
  return archivos;
}
function xmlTexto(s) {
  return s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}
function leerXLSX(buf, hoja) {
  const z = leerZip(buf), txt = n => z[n] ? z[n].toString('utf8') : '';
  const comunes = (txt('xl/sharedStrings.xml').match(/<si>[\s\S]*?<\/si>/g) || [])
    .map(si => (si.match(/<t[^>]*>[\s\S]*?<\/t>/g) || []).map(xmlTexto).join(''));
  const libro = txt('xl/workbook.xml'), rels = txt('xl/_rels/workbook.xml.rels');
  const hojas = [...libro.matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)];
  const h = hojas.find(m => m[1] === hoja) || hojas[0];
  const destino = new RegExp('Id="' + h[2] + '"[^>]*Target="([^"]+)"').exec(rels) || new RegExp('Target="([^"]+)"[^>]*Id="' + h[2] + '"').exec(rels);
  const xml = txt('xl/' + destino[1].replace(/^\/?xl\//, ''));
  const col = ref => ref.replace(/\d+/g, '').split('').reduce((a, c) => a * 26 + c.charCodeAt(0) - 64, 0) - 1;
  return (xml.match(/<row[\s\S]*?<\/row>/g) || []).map(row => {
    const fila = [];
    for (const c of row.match(/<c [^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []) {
      const ref = /r="([A-Z]+\d+)"/.exec(c)[1], tipo = (/t="(\w+)"/.exec(c) || [])[1];
      const v = (/<v>([\s\S]*?)<\/v>/.exec(c) || [])[1];
      let val = '';
      if (tipo === 's') val = comunes[+v];
      else if (tipo === 'inlineStr') val = xmlTexto((/<is>([\s\S]*?)<\/is>/.exec(c) || ['', ''])[1]);
      else if (v != null) val = xmlTexto(v);
      fila[col(ref)] = val;
    }
    return Array.from(fila, x => x == null ? '' : String(x));
  });
}

/* ---------- planilla -> productos ---------- */
const COLUMNAS = {
  categoria: ['categoria'], nombre: ['producto', 'nombre', 'nombre del producto'], precio: ['precio'],
  precioAntes: ['precio antes', 'precio anterior'], descripcion: ['descripcion'], tituloOpciones: ['titulo de opciones', 'titulo opciones'],
  opciones: ['opciones'], etiqueta: ['etiqueta'], disponible: ['disponible'], fotos: ['fotos', 'foto']
};
function productosDesdePlanilla(filas, slug, plan) {
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\*/g, '').trim();
  const cab = filas[0].map(norm), idx = {};
  for (const k in COLUMNAS) idx[k] = cab.findIndex(c => COLUMNAS[k].includes(c));
  if (idx.nombre < 0 || idx.precio < 0) throw new Error('La planilla debe tener las columnas "Producto" y "Precio"');
  const cats = [], productos = [], usados = {}, avisos = [];
  const lista = v => String(v || '').split(/\s*[|]\s*/).map(s => s.trim()).filter(Boolean);
  filas.slice(1).forEach((f, i) => {
    const get = k => idx[k] >= 0 ? String(f[idx[k]] || '').trim() : '';
    if (!get('nombre')) return;
    const cn = get('categoria') || 'Productos', cid = slugify(cn) || 'productos';
    if (!cats.some(c => c.id === cid)) cats.push({ id: cid, nombre: cn });
    let id = slugify(get('nombre')) || 'producto', n = 2; while (usados[id]) id = slugify(get('nombre')) + '-' + n++; usados[id] = 1;
    const precio = numero(get('precio'));
    if (precio == null) avisos.push('Fila ' + (i + 2) + ': "' + get('nombre') + '" no tiene precio');
    const p = { id, nombre: get('nombre'), categoria: cid, precio: precio || 0 };
    if (numero(get('precioAntes'))) p.precioAntes = numero(get('precioAntes'));
    if (get('etiqueta')) p.etiqueta = get('etiqueta');
    if (/^no$/i.test(get('disponible'))) p.disponible = false;
    if (get('descripcion')) p.descripcion = get('descripcion');
    const ops = lista(get('opciones'));
    if (ops.length) { p.opciones = ops; p.tituloOpciones = get('tituloOpciones') || 'Opción'; }
    const fotos = lista(get('fotos')).slice(0, plan === 'basico' ? 1 : 5);
    if (fotos.length) p.imagenes = fotos.map(f => '/tiendas/' + slug + '/img/' + f);
    productos.push(p);
  });
  return { categorias: cats, productos, avisos };
}

/* ---------- logo de respaldo ---------- */
function logoIniciales(nombre, bg, fg) {
  const ini = nombre.split(/\s+/).filter(w => w.length > 2 || /^[A-ZÁÉÍÓÚÑ]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('') || nombre[0].toUpperCase();
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="${bg}"/><text x="32" y="41" text-anchor="middle" font-family="Georgia, serif" font-size="${ini.length > 1 ? 24 : 30}" font-weight="600" fill="${fg}">${ini}</text></svg>`;
}

/* ---------- principal ---------- */
function main() {
  const args = process.argv.slice(2);
  const iF = args.indexOf('--fotos'); const fotos = iF >= 0 ? args.splice(iF, 2)[1] : null;
  if (!args[0]) { console.log('Uso: node herramientas/nueva-tienda.js <alta.json> [planilla.xlsx|csv] [--fotos carpeta]'); process.exit(1); }
  const t = JSON.parse(fs.readFileSync(args[0], 'utf8'));
  t.slug = slugify(t.slug || t.negocio.nombre);
  if (!t.slug || RESERVADOS.includes(t.slug)) throw new Error('La dirección "' + t.slug + '" no se puede usar. Cambia "slug" en ' + args[0]);
  if (!/^569\d{8}$/.test(t.negocio.whatsapp || '')) console.warn('Ojo: el WhatsApp "' + t.negocio.whatsapp + '" no tiene el formato 569XXXXXXXX');

  if (args[1]) {
    const buf = fs.readFileSync(args[1]);
    const filas = /\.csv$/i.test(args[1]) ? leerCSV(buf.toString('utf8')) : leerXLSX(buf, 'Productos');
    const r = productosDesdePlanilla(filas, t.slug, t.plan);
    if (!r.productos.length) throw new Error('La hoja "Productos" está vacía');
    t.categorias = r.categorias; t.productos = r.productos;
    r.avisos.forEach(a => console.warn('Ojo: ' + a));
  }

  const dir = path.join(__dirname, '..', 'sitio', 'tiendas', t.slug);
  if (fs.existsSync(path.join(dir, 'tienda.json')) && !process.env.SOBRESCRIBIR) {
    throw new Error('Ya existe ' + dir + '. Para reemplazarla: SOBRESCRIBIR=1 node herramientas/nueva-tienda.js ...');
  }
  fs.mkdirSync(dir, { recursive: true });

  if (fotos) {
    fs.mkdirSync(path.join(dir, 'img'), { recursive: true });
    for (const f of fs.readdirSync(fotos)) if (/\.(jpe?g|png|webp)$/i.test(f)) fs.copyFileSync(path.join(fotos, f), path.join(dir, 'img', f));
    const faltan = t.productos.flatMap(p => (p.imagenes || []).filter(s => typeof s === 'string' && !fs.existsSync(path.join(dir, 'img', path.basename(s)))));
    faltan.forEach(f => console.warn('Ojo: falta la foto ' + path.basename(f)));
  }

  const bg = t.tema.oscuro.bg, fg = t.tema.oscuro.accent;
  const icon = t.negocio.logo && t.negocio.logo.trim().startsWith('<svg') ? t.negocio.logo : logoIniciales(t.negocio.nombre, bg, fg);
  if (!t.negocio.logo) t.negocio.logo = icon;
  fs.writeFileSync(path.join(dir, 'tienda.json'), JSON.stringify(t, null, 2));
  fs.writeFileSync(path.join(dir, 'icon.svg'), icon);
  fs.writeFileSync(path.join(dir, 'manifest.webmanifest'), JSON.stringify({
    name: t.negocio.nombre, short_name: t.negocio.nombre.slice(0, 12), description: t.negocio.bajada,
    id: '/' + t.slug, start_url: '/' + t.slug, scope: '/' + t.slug, display: 'standalone', lang: 'es-CL',
    background_color: bg, theme_color: bg,
    icons: [
      { src: '/tiendas/' + t.slug + '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/tiendas/' + t.slug + '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/tiendas/' + t.slug + '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }, null, 2));
  console.log('Tienda creada: sitio/tiendas/' + t.slug + ' (' + t.productos.length + ' productos, plan ' + t.plan + ')');
  console.log('Siguiente: node herramientas/iconos.js  y revisar http://localhost:4321/' + t.slug);
}

try { main(); } catch (e) { console.error('Error: ' + e.message); process.exit(1); }
