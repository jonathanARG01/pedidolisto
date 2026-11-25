// Genera la tienda de helados (tienda.json + manifest + icon.svg). Uso: node herramientas/generar-heladeria.js
// Productos con "armador": la ficha muestra el vaso o cono vacío y se arma tocando sabores, salsas y agregados.
// Reglas confirmadas por el cliente (24-11-2026): hasta 3 sabores al mismo precio; 1 salsa incluida y la 2ª +$300;
// 1 agregado incluido y cada adicional +$200. Frutillas con crema base $2.000 con las mismas reglas.
// POR CONFIRMAR: WhatsApp de prueba hasta confirmar.
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
    perlitas: { id: 'perlitas', nombre: 'Perlitas de chocolate', foto: FOTOS + 'ag-perlitas.webp' },
    virutas: { id: 'virutas', nombre: 'Chocolate Costa Rama', foto: FOTOS + 'ag-virutas.webp' },
    'chispas-pastel': { id: 'chispas-pastel', nombre: 'Chispas de pastel', foto: FOTOS + 'ag-chispas-pastel.webp' },
    oreo: { id: 'oreo', nombre: 'Galleta Oreo molida', foto: FOTOS + 'ag-oreo.webp' },
    chubis: { id: 'chubis', nombre: 'Mini Chubis', foto: FOTOS + 'ag-chubis.webp' },
    granulado: { id: 'granulado', nombre: 'Escamas de chocolate', foto: FOTOS + 'ag-granulado.webp' }
  };
  return { id: 'agregados', titulo: 'Agregados', corto: 'Agregados', tipo: 'agregado', min: 0, max: ids.length, incluidas: 1, precioExtra: AGREGADO_EXTRA, ayuda: '1 incluido, cada extra +$200', opciones: ids.map(i => todos[i]) };
};
const FOTOS = '/tiendas/' + SLUG + '/fotos/';
const AGREGADOS_HELADO = ['perlitas', 'granulado', 'chubis', 'oreo', 'chispas-pastel', 'virutas'];

const t = {
  slug: SLUG, plan: 'pro', demo: true,
  negocio: {
    nombre: 'Dulces, Helados y Más', bajada: 'Helados, frutillas con crema, maní y dulces. Pide por WhatsApp.',
    whatsapp: WA_PRUEBA, horario: 'Todo el día, todos los días'
  },
  tema: {
    fuenteTitulos: 'Fredoka', fuenteTexto: 'Nunito', pesoTitulos: 700, trackingTitulos: '-0.01em', radio: 22, modoInicial: 'claro',
    claro: { bg: '#fff0f4', surface: '#ffffff', 'surface-2': '#ffe2ea', ink: '#4a1530', muted: '#8b5a70', line: '#f6cdd9', accent: '#e4307a', 'accent-ink': '#ffffff', wa: '#1f8f4e', 'wa-ink': '#ffffff' },
    oscuro: { bg: '#2a0f1d', surface: '#3a1729', 'surface-2': '#331324', ink: '#ffe9f1', muted: '#dcaec2', line: '#5a2843', accent: '#ff6fa5', 'accent-ink': '#2a0f1d', wa: '#25a35a', 'wa-ink': '#ffffff' }
  },
  estructura: { portada: 'dulce', estilo: 'dulce', tarjetas: 'tarjeta', columnas: { movil: 2, escritorio: 4 }, descripcion: true, info: true },
  banner: {
    sello: 'Hecho al momento · Cerro La Cruz',
    titulo: 'Dulces, helados', resaltado: 'y más',
    texto: 'Arma tu helado con hasta 3 sabores, salsa y agregados. Pídelo por WhatsApp y retíralo o te lo llevamos.',
    boton: 'Armar mi helado', botonProducto: 'helado-vaso', boton2: 'Ver todo',
    imagen: FOTOS + 'heroe-helado.webp',
    burbujas: ['Desde $2.000', 'Hasta 3 sabores']
  },
  entrega: {
    retiro: { activo: true, lugar: 'El Vergel 1950', direccion: 'El Vergel 1950, Cerro La Cruz', horario: 'Todo el día, todos los días' },
    domicilio: {
      activo: true, etiquetaZona: 'Sector', resumen: '$500, del paradero 9 a la Media Luna',
      nota: 'Despachamos desde el paradero 9 hasta la Media Luna.',
      comunas: [{ nombre: 'Del paradero 9 a la Media Luna', costo: 500 }]
    }
  },
  pago: 'Pago por transferencia. Envía el comprobante por WhatsApp.',
  transferencia: { titular: 'Elizabeth Cordero', banco: 'BancoEstado', tipo: 'Cuenta RUT', rut: '18.153.880-5', numero: '18153880' },
  mensaje: { saludo: 'Hola Dulces, Helados y Más, quiero hacer este pedido:', despedida: '¡Gracias!' },
  categorias: [{ id: 'helados', nombre: 'Helados' }, { id: 'frutillas', nombre: 'Frutillas con crema' }, { id: 'dulces', nombre: 'Maní y dulces' }],
  productos: [
    {
      id: 'helado-vaso', nombre: 'Helado en vaso', categoria: 'helados', precio: 2000, etiqueta: 'Arma el tuyo',
      descripcion: 'Hasta 3 sabores, con salsa y un agregado incluidos.',
      detalle: 'Elige hasta 3 sabores por el mismo precio. Incluye una salsa y un agregado; la segunda salsa suma $300 y cada agregado extra $200.',
      imagenes: [FOTOS + 'helado-vaso.webp'],
      armador: { base: 'vaso', fondo: '#ffc8d9', pista: 'Toca uno, dos o tres sabores', pasos: [sabores, salsas(), agregados(AGREGADOS_HELADO)] }
    },
    {
      id: 'frutillas-crema', nombre: 'Frutillas con crema', categoria: 'frutillas', precio: 2000, etiqueta: 'Favorito',
      descripcion: 'Frutillas frescas con crema, con salsa y un agregado incluidos.',
      detalle: 'Base de frutillas con crema. Incluye una salsa y un agregado; la segunda salsa suma $300 y cada agregado extra $200.',
      imagenes: [FOTOS + 'frutillas-crema.webp'],
      armador: { base: 'vaso', relleno: 'frutillas', fondo: '#ffd6c2', pasos: [salsas(), agregados(AGREGADOS_HELADO)] }
    },
    { id: 'mani-chocolate', nombre: 'Maní con chocolate', categoria: 'dulces', precio: 1000, descripcion: 'Bolsita de 100 g.', imagenes: ['/tiendas/' + SLUG + '/fotos/mani-chocolate.webp', '/tiendas/' + SLUG + '/fotos/mani-chocolate-2.webp'] },
    { id: 'mani-caramelizado', nombre: 'Maní caramelizado', categoria: 'dulces', precio: 1000, descripcion: 'Maní garrapiñado con caramelo. Bolsita de 100 g.', imagenes: ['/tiendas/' + SLUG + '/fotos/mani-caramelizado.webp'] },
    { id: 'mani-confitado', nombre: 'Maní confitado', categoria: 'dulces', precio: 1000, descripcion: 'Maní tostado con cobertura de azúcar. Bolsita de 100 g.', imagenes: ['/tiendas/' + SLUG + '/fotos/mani-confitado.webp'] },
    { id: 'mani-colores', nombre: 'Maní confitado de colores', categoria: 'dulces', precio: 1000, descripcion: 'Bolsita de 100 g.', imagenes: ['/tiendas/' + SLUG + '/fotos/mani-colores.webp'] },
    { id: 'mani-frambuesa', nombre: 'Maní confitado frambuesa', categoria: 'dulces', precio: 1000, descripcion: 'Bolsita de 100 g.', imagenes: ['/tiendas/' + SLUG + '/fotos/mani-frambuesa.webp'] },
    { id: 'mani-pasas', nombre: 'Maní con pasas', categoria: 'dulces', precio: 1000, descripcion: 'Maní tostado con pasas. Bolsita de 100 g.', imagenes: ['/tiendas/' + SLUG + '/fotos/mani-pasas.webp'] },
    { id: 'chubis-bolsa', nombre: 'Chubis', categoria: 'dulces', precio: 1000, descripcion: 'Confites de chocolate de colores. Bolsita de 100 g.', imagenes: ['/tiendas/' + SLUG + '/fotos/chubis.webp'] },
    { id: 'gomitas', nombre: 'Gomitas ácidas', categoria: 'dulces', precio: 1000, descripcion: 'Gusanitos ácidos surtidos. Bolsita de 100 g.', imagenes: ['/tiendas/' + SLUG + '/fotos/gomitas-acidas.webp'] }
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
