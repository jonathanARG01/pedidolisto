// Genera la tienda de helados (tienda.json + manifest + icon.svg). Uso: node herramientas/generar-heladeria.js
// Productos con "armador": la ficha muestra el vaso o cono vacío y se arma tocando sabores, salsas y agregados.
// Reglas confirmadas por el cliente (24-11-2026): hasta 3 sabores al mismo precio; 1 salsa incluida y la 2ª +$300;
// 1 agregado incluido y cada adicional +$200. Frutillas con crema base $2.000 con las mismas reglas.
// POR CONFIRMAR: precio del cono ($1.500). WhatsApp de prueba hasta confirmar.
const fs = require('fs');
const path = require('path');
const SLUG = 'dulces-y-helados';
const DIR = path.join(__dirname, '..', 'sitio', 'tiendas', SLUG);
const WA_PRUEBA = '56941497083';   // Jonathan (Brote Digital). El del cliente es 56978953024: cambiar cuando confirme.
const SALSA_EXTRA = 300, AGREGADO_EXTRA = 200;

const logo = (bg, fg) => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="${bg}"/><path d="M22 30 L32 56 L42 30 Z" fill="#f4c886"/><path d="M24 33 l14 6 M26 39 l10 4 M40 33 l-14 6 M38 39 l-10 4" stroke="#c98436" stroke-width="1.5"/><circle cx="32" cy="24" r="12" fill="${fg}"/><circle cx="25" cy="29" r="5" fill="${fg}"/><circle cx="39" cy="29" r="5" fill="${fg}"/><circle cx="32" cy="30" r="5" fill="${fg}"/><path d="M27 18 q3 -3 7 -2" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="32" cy="11" r="3.2" fill="#e2304d"/></svg>`;

const sabores = {
  id: 'sabor', titulo: 'Elige tu sabor', corto: 'Sabor', tipo: 'sabor', min: 1, max: 3, ayuda: 'Hasta 3, mismo precio',
  opciones: [{ id: 'chocolate', nombre: 'Chocolate' }, { id: 'vainilla', nombre: 'Vainilla' }, { id: 'frutilla', nombre: 'Frutilla' }]
};
const salsas = (inicial) => ({
  id: 'salsa', titulo: 'Elige tu salsa', corto: 'Salsa', tipo: 'salsa', min: 0, max: 2, incluidas: 1, precioExtra: SALSA_EXTRA, ayuda: '1 incluida, la 2ª +$300',
  opciones: [{ id: 'manjar', nombre: 'Manjar' }, { id: 'chocolate', nombre: 'Chocolate' }], inicial: inicial || []
});
const agregados = (ids) => {
  const todos = {
    crema: { id: 'crema', nombre: 'Crema' },
    'chispas-chocolate': { id: 'chispas-chocolate', nombre: 'Trocitos de chocolate' },
    oreo: { id: 'oreo', nombre: 'Galleta Oreo' },
    chubis: { id: 'chubis', nombre: 'Chubis' },
    'chispas-colores': { id: 'chispas-colores', nombre: 'Chispas de colores' }
  };
  return { id: 'agregados', titulo: 'Agregados', corto: 'Agregados', tipo: 'agregado', min: 0, max: ids.length, incluidas: 1, precioExtra: AGREGADO_EXTRA, ayuda: '1 incluido, cada extra +$200', opciones: ids.map(i => todos[i]) };
};
const AGREGADOS_HELADO = ['crema', 'chispas-chocolate', 'oreo', 'chubis', 'chispas-colores'];

const t = {
  slug: SLUG, plan: 'pro', demo: true,
  negocio: {
    nombre: 'Dulces, Helados y Más', bajada: 'Helados, frutillas con crema, maní y dulces. Pide por WhatsApp.',
    whatsapp: WA_PRUEBA
  },
  tema: {
    fuenteTitulos: 'Fredoka', fuenteTexto: 'Nunito', pesoTitulos: 700, trackingTitulos: '-0.01em', radio: 22, modoInicial: 'claro',
    claro: { bg: '#fff0f4', surface: '#ffffff', 'surface-2': '#ffe2ea', ink: '#4a1530', muted: '#8b5a70', line: '#f6cdd9', accent: '#e4307a', 'accent-ink': '#ffffff', wa: '#1f8f4e', 'wa-ink': '#ffffff' },
    oscuro: { bg: '#2a0f1d', surface: '#3a1729', 'surface-2': '#331324', ink: '#ffe9f1', muted: '#dcaec2', line: '#5a2843', accent: '#ff6fa5', 'accent-ink': '#2a0f1d', wa: '#25a35a', 'wa-ink': '#ffffff' }
  },
  estructura: { portada: 'dividido', tarjetas: 'tarjeta', columnas: { movil: 2, escritorio: 4 }, descripcion: true },
  banner: {
    titulo: 'Dulces, helados y más', texto: '¡Endulza tu día! Arma tu helado con hasta 3 sabores, salsa y agregados, y pídelo por WhatsApp para retirar o recibir en casa.',
    boton: 'Armar mi helado',
    imagen: { arte: 'helado', base: 'vaso', relleno: 'frutillas', salsas: ['manjar', 'chocolate'], agregados: ['oreo', 'chispas-colores', 'chispas-chocolate'], fondo: '#ffbfd3' }
  },
  entrega: {
    retiro: { activo: true, lugar: 'nuestro local', direccion: 'Dirección por confirmar' },
    domicilio: { activo: true, nota: 'Costo de envío por confirmar. Te lo confirmamos por WhatsApp.', comunas: [{ nombre: 'Mi comuna (por confirmar)', costo: 1000 }] }
  },
  pago: 'Pago por transferencia. Te enviamos los datos por WhatsApp al confirmar el pedido.',
  mensaje: { saludo: 'Hola Dulces, Helados y Más, quiero hacer este pedido:', despedida: '¡Gracias!' },
  categorias: [{ id: 'helados', nombre: 'Helados' }, { id: 'frutillas', nombre: 'Frutillas con crema' }, { id: 'dulces', nombre: 'Maní y dulces' }],
  productos: [
    {
      id: 'helado-vaso', nombre: 'Helado en vaso', categoria: 'helados', precio: 2000, etiqueta: 'Arma el tuyo',
      descripcion: 'Hasta 3 sabores, con salsa y un agregado incluidos.',
      detalle: 'Elige hasta 3 sabores por el mismo precio. Incluye una salsa y un agregado; la segunda salsa suma $300 y cada agregado extra $200.',
      imagenes: [{ arte: 'helado', base: 'vaso', sabores: ['frutilla'], salsas: ['chocolate'], fondo: '#ffc8d9' }],
      armador: { base: 'vaso', pista: 'Toca uno, dos o tres sabores', pasos: [sabores, salsas(), agregados(AGREGADOS_HELADO)] }
    },
    {
      id: 'helado-cono', nombre: 'Helado en cono', categoria: 'helados', precio: 1500,
      descripcion: 'Cono de galleta con salsa y un agregado incluidos.',
      detalle: 'Elige hasta 3 sabores. Incluye una salsa y un agregado; la segunda salsa suma $300 y cada agregado extra $200. Precio por confirmar.',
      imagenes: [{ arte: 'helado', base: 'cono', sabores: ['chocolate'], salsas: ['manjar'], agregados: ['chubis'], fondo: '#cfe7ff' }],
      armador: { base: 'cono', pista: 'Toca un sabor para tu cono', pasos: [sabores, salsas(), agregados(AGREGADOS_HELADO)] }
    },
    {
      id: 'frutillas-crema', nombre: 'Frutillas con crema', categoria: 'frutillas', precio: 2000, etiqueta: 'Favorito',
      descripcion: 'Frutillas frescas con crema, con salsa y un agregado incluidos.',
      detalle: 'Base de frutillas con crema. Incluye una salsa y un agregado; la segunda salsa suma $300 y cada agregado extra $200.',
      imagenes: [{ arte: 'helado', base: 'vaso', relleno: 'frutillas', salsas: ['manjar', 'chocolate'], agregados: ['chispas-colores'], fondo: '#ffd6c2' }],
      armador: { base: 'vaso', relleno: 'frutillas', pasos: [salsas(), agregados(['chubis', 'oreo', 'chispas-colores'])] }
    },
    { id: 'mani-chocolate', nombre: 'Maní con chocolate 100 g', categoria: 'dulces', precio: 1000, descripcion: 'Bolsita de 100 gramos.', imagenes: [{ arte: 'bolsita', contenido: 'mani-chocolate', etiqueta: 'Maní con\nchocolate', fondo: '#ffe2c4' }] },
    { id: 'chubis-bolsa', nombre: 'Chubis 100 g', categoria: 'dulces', precio: 1000, descripcion: 'Bolsita de 100 gramos.', imagenes: [{ arte: 'bolsita', contenido: 'chubis', etiqueta: 'Chubis', fondo: '#d9ecff' }] },
    { id: 'gomitas', nombre: 'Gomitas surtidas 100 g', categoria: 'dulces', precio: 1000, descripcion: 'Bolsita de 100 gramos.', imagenes: [{ arte: 'bolsita', contenido: 'gomitas', etiqueta: 'Gomitas\nsurtidas', fondo: '#ffd9ea' }] },
    { id: 'dulces-surtidos', nombre: 'Dulces surtidos 100 g', categoria: 'dulces', precio: 1000, descripcion: 'Bolsita de 100 gramos.', imagenes: [{ arte: 'bolsita', contenido: 'dulces', etiqueta: 'Dulces\nsurtidos', fondo: '#e8e0ff' }] }
  ]
};

fs.mkdirSync(DIR, { recursive: true });
t.negocio.logo = logo('#e4307a', '#ffd1e1');
fs.writeFileSync(path.join(DIR, 'tienda.json'), JSON.stringify(t, null, 2));
fs.writeFileSync(path.join(DIR, 'icon.svg'), logo('#e4307a', '#ffd1e1'));
fs.writeFileSync(path.join(DIR, 'manifest.webmanifest'), JSON.stringify({
  name: t.negocio.nombre, short_name: 'Helados', description: t.negocio.bajada,
  id: '/' + SLUG, start_url: '/' + SLUG, scope: '/' + SLUG, display: 'standalone', lang: 'es-CL',
  background_color: t.tema.claro.bg, theme_color: t.tema.claro.bg,
  icons: [
    { src: '/tiendas/' + SLUG + '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/tiendas/' + SLUG + '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/tiendas/' + SLUG + '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
}, null, 2));
console.log('ok', SLUG);
