// Genera las 3 tiendas demo (tienda.json + manifest + icon.svg). Uso: node herramientas/generar-tiendas.js
const fs = require('fs');
const path = require('path');
const RAIZ = path.join(__dirname, '..', 'sitio', 'tiendas');
const WA_PRUEBA = '56941497083'; // WhatsApp de Brote Digital: los pedidos de las demos llegan aquí

const logos = {
  'vivero-raiz': (bg, fg) => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="${bg}"/><circle cx="32" cy="32" r="21" fill="none" stroke="${fg}" stroke-width="2"/><path d="M32 47c0-12 0-18 0-24" stroke="${fg}" stroke-width="2" stroke-linecap="round"/><path d="M32 30c-8-1-12-6-12-12 7 0 12 5 12 12z M32 26c7-1 11-5 11-11-6 0-11 4-11 11z" fill="${fg}"/><path d="M22 44c6-4 14-4 20 0" stroke="${fg}" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
  'carbon': (bg, fg) => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="${bg}"/><circle cx="38" cy="26" r="13" fill="none" stroke="${fg}" stroke-width="5"/><path d="M20 22h18l-2 28H22z" fill="#f1ede6"/></svg>`,
  'cerro-alegre': (bg, fg) => `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="${bg}"/><path d="M10 46 L24 26 L32 36 L40 22 L54 46 Z" fill="${fg}"/><ellipse cx="32" cy="18" rx="5" ry="7" fill="${fg}" transform="rotate(30 32 18)"/><path d="M30 13c3 3 1 7 4 10" stroke="${bg}" stroke-width="1.5" fill="none"/></svg>`
};

function img(base, extras) { return [base].concat(extras.map(e => Object.assign({}, base, e))); }

const tiendas = [
  {
    slug: 'vivero-raiz', plan: 'pro', demo: true,
    negocio: {
      nombre: 'Vivero Raíz', bajada: 'Plantas de interior cultivadas en Santiago, listas para tu casa.',
      whatsapp: WA_PRUEBA, instagram: '@vivero.raiz', horario: 'Lun a sáb, 10:00 a 19:00'
    },
    tema: {
      fuenteTitulos: 'Cormorant Garamond', fuenteTexto: 'Manrope', pesoTitulos: 600, radio: 18, modoInicial: 'oscuro',
      claro: { bg: '#f3efe6', surface: '#fffcf5', 'surface-2': '#e7e1d3', ink: '#14302a', muted: '#5b6b63', line: '#d9d1c0', accent: '#a8713a', 'accent-ink': '#fffaf0', wa: '#1f8f4e', 'wa-ink': '#ffffff' },
      oscuro: { bg: '#0c2620', surface: '#12332b', 'surface-2': '#0f2c25', ink: '#f1eadb', muted: '#a9b8ae', line: '#24493f', accent: '#d2a46a', 'accent-ink': '#10241e', wa: '#25a35a', 'wa-ink': '#ffffff' }
    },
    estructura: { portada: 'dividido', tarjetas: 'tarjeta', columnas: { movil: 2, escritorio: 4 }, descripcion: true },
    banner: {
      titulo: 'Plantas que hacen hogar', texto: 'Elige tus plantas, arma tu pedido y te lo confirmamos por WhatsApp. Despacho en Santiago o retiro en el vivero.',
      boton: 'Ver plantas', imagen: { arte: 'planta', variante: 'monstera', hoja: '#3f7d4e', maceta: '#c08a5a', fondo: '#1d4a3d' }
    },
    entrega: {
      retiro: { activo: true, lugar: 'el vivero, Providencia', direccion: 'Av. Italia 1450, Providencia', horario: 'Lun a sáb, 10:00 a 19:00' },
      domicilio: {
        activo: true, gratisDesde: 60000, nota: 'Despachamos de martes a sábado. Te avisamos el horario por WhatsApp.',
        comunas: [{ nombre: 'Providencia', costo: 3000 }, { nombre: 'Ñuñoa', costo: 3000 }, { nombre: 'Santiago Centro', costo: 3500 }, { nombre: 'Las Condes', costo: 3500 }, { nombre: 'La Reina', costo: 4000 }, { nombre: 'Vitacura', costo: 4000 }, { nombre: 'Maipú', costo: 5000 }]
      }
    },
    pago: 'Pago por transferencia al confirmar el pedido.',
    mensaje: { saludo: 'Hola Vivero Raíz, quiero hacer este pedido:', despedida: '¡Gracias! Quedo atento a la confirmación.' },
    categorias: [{ id: 'interior', nombre: 'Plantas de interior' }, { id: 'suculentas', nombre: 'Cactus y suculentas' }, { id: 'complementos', nombre: 'Maceteros y cuidado' }],
    productos: [
      { id: 'monstera', nombre: 'Monstera deliciosa', categoria: 'interior', precio: 24990, etiqueta: 'Más vendida', descripcion: 'Hojas grandes y abiertas. Luz indirecta, riego semanal.', detalle: 'Planta de 60 a 70 cm en macetero de greda de 22 cm. Ideal para living con luz indirecta. Riego una vez por semana en verano y cada 10 días en invierno.', opciones: ['Macetero greda', 'Macetero blanco', 'Macetero negro'], tituloOpciones: 'Macetero',
        imagenes: img({ arte: 'planta', variante: 'monstera', hoja: '#3f7d4e', maceta: '#c08a5a', fondo: '#dfe8dc' }, [{ fondo: '#1d4a3d' }, { zoom: true, fondo: '#e9e2d2' }]) },
      { id: 'sansevieria', nombre: 'Sansevieria', categoria: 'interior', precio: 14990, descripcion: 'Casi indestructible. Purifica el aire y tolera poca luz.', opciones: ['Macetero greda', 'Macetero blanco'], tituloOpciones: 'Macetero',
        imagenes: img({ arte: 'planta', variante: 'sansevieria', hoja: '#4c7a46', maceta: '#e8e2d6', fondo: '#e4e9df' }, [{ fondo: '#24463b' }]) },
      { id: 'helecho', nombre: 'Helecho de Boston', categoria: 'interior', precio: 12990, descripcion: 'Frondoso y colgante. Le gusta la humedad.', imagenes: img({ arte: 'planta', variante: 'helecho', hoja: '#5b9a4f', maceta: '#a86b45', fondo: '#e3ebde' }, [{ zoom: true }]) },
      { id: 'ficus', nombre: 'Ficus lyrata', categoria: 'interior', precio: 32990, precioAntes: 36990, etiqueta: 'Oferta', descripcion: 'Árbol de interior de hojas en forma de violín.', imagenes: img({ arte: 'planta', variante: 'ficus', hoja: '#2f6b45', maceta: '#7a5134', fondo: '#e7e3d8' }, [{ fondo: '#1d4a3d' }]) },
      { id: 'cactus', nombre: 'Cactus con flor', categoria: 'suculentas', precio: 7990, etiqueta: 'Nuevo', descripcion: 'Pequeño, florece en primavera. Riego cada 15 días.', imagenes: img({ arte: 'planta', variante: 'cactus', hoja: '#5f8f4e', maceta: '#d9b48a', fondo: '#efe6d6', flor: '#e98aa5' }, [{ flor: '#f2b35d', fondo: '#e4ddcf' }]) },
      { id: 'cactus-trio', nombre: 'Trío de suculentas', categoria: 'suculentas', precio: 15990, descripcion: 'Tres suculentas en maceteros de cerámica a mano.', imagenes: [{ arte: 'planta', variante: 'cactus', hoja: '#7aa36a', maceta: '#e8e2d6', fondo: '#dfe6da', flor: '#f2b35d' }] },
      { id: 'macetero', nombre: 'Macetero de greda 22 cm', categoria: 'complementos', precio: 8990, descripcion: 'Greda de Pomaire con plato.', opciones: ['Natural', 'Pintado blanco', 'Pintado verde'], tituloOpciones: 'Terminación', imagenes: [{ arte: 'caja', color: '#c08a5a', acento: '#8a5a35', fondo: '#efe6d6' }] },
      { id: 'abono', nombre: 'Fertilizante líquido 250 ml', categoria: 'complementos', precio: 5990, descripcion: 'Orgánico, para plantas de interior. Rinde 50 riegos.', imagenes: [{ arte: 'gotero', color: '#2f5d46', acento: '#d8b77a', fondo: '#e6e9df' }] },
      { id: 'vela', nombre: 'Vela de soya Bosque', categoria: 'complementos', precio: 9990, descripcion: 'Aroma a ciprés y tierra mojada. 40 horas.', imagenes: img({ arte: 'vela', color: '#1f4d3f', acento: '#d2a46a', fondo: '#e9e3d6' }, [{ fondo: '#0f2c25' }]) },
      { id: 'kit-regalo', nombre: 'Caja regalo verde', categoria: 'complementos', precio: 29990, disponible: false, descripcion: 'Sansevieria, vela de soya y tarjeta escrita a mano.', imagenes: [{ arte: 'caja', color: '#d2a46a', acento: '#1f4d3f', fondo: '#e4ebe0' }] }
    ]
  },
  {
    slug: 'carbon', plan: 'pro', demo: true,
    negocio: { nombre: 'Carbón', bajada: 'Vasos y termos negros para todo el día.', whatsapp: WA_PRUEBA, instagram: '@carbon.store', horario: 'Lun a vie, 9:00 a 18:00' },
    tema: {
      fuenteTitulos: 'Outfit', fuenteTexto: 'Outfit', pesoTitulos: 700, trackingTitulos: '-0.03em', radio: 10, modoInicial: 'oscuro',
      claro: { bg: '#eceef1', surface: '#ffffff', 'surface-2': '#e2e5ea', ink: '#1b1e24', muted: '#5f6672', line: '#d5d9e0', accent: '#ff6a2b', 'accent-ink': '#ffffff', wa: '#1f8f4e', 'wa-ink': '#ffffff' },
      oscuro: { bg: '#1f2228', surface: '#272b33', 'surface-2': '#2b2f37', ink: '#f1ede6', muted: '#9aa1ad', line: '#363b45', accent: '#ff6a2b', 'accent-ink': '#160b05', wa: '#25a35a', 'wa-ink': '#ffffff' }
    },
    estructura: { portada: 'centrado', tarjetas: 'minimal', columnas: { movil: 2, escritorio: 3 }, descripcion: true },
    banner: { titulo: 'Todo negro. Todo el día.', fantasma: 'CARBÓN', texto: 'Vasos y termos de acero que mantienen tu bebida fría 24 horas o caliente 12. Despacho en el Gran Concepción.', boton: 'Ver productos' },
    entrega: {
      retiro: { activo: true, lugar: 'Concepción centro', direccion: 'Barros Arana 820, oficina 304, Concepción', horario: 'Lun a vie, 9:00 a 18:00' },
      domicilio: { activo: true, gratisDesde: 45000, comunas: [{ nombre: 'Concepción', costo: 2500 }, { nombre: 'Talcahuano', costo: 3500 }, { nombre: 'San Pedro de la Paz', costo: 3500 }, { nombre: 'Chiguayante', costo: 3500 }, { nombre: 'Hualpén', costo: 3500 }] }
    },
    pago: 'Pago por transferencia. Te enviamos los datos al confirmar.',
    mensaje: { saludo: 'Hola Carbón, quiero pedir:', despedida: 'Gracias.' },
    categorias: [{ id: 'vasos', nombre: 'Vasos' }, { id: 'termos', nombre: 'Termos' }, { id: 'accesorios', nombre: 'Accesorios' }],
    productos: [
      { id: 'vaso-600', nombre: 'Vaso térmico 600 ml', categoria: 'vasos', precio: 16990, etiqueta: 'Más vendido', descripcion: 'Acero doble pared, tapa y bombilla.', opciones: ['Negro mate', 'Negro brillante'], tituloOpciones: 'Terminación',
        imagenes: img({ arte: 'vaso', color: '#1b1d22', acento: '#ff6a2b', fondo: '#30343c' }, [{ anillo: false, fondo: '#262a31' }, { zoom: true, fondo: '#30343c' }]) },
      { id: 'vaso-900', nombre: 'Vaso térmico 900 ml', categoria: 'vasos', precio: 19990, descripcion: 'Para el día completo. Cabe en el portavasos del auto.', imagenes: img({ arte: 'vaso', color: '#24272d', acento: '#ff6a2b', fondo: '#2a2e35', anillo: false }, [{ fondo: '#383d46' }]) },
      { id: 'vaso-naranjo', nombre: 'Vaso edición naranja', categoria: 'vasos', precio: 17990, etiqueta: 'Nuevo', descripcion: 'El mismo vaso, con tapa y bombilla naranja.', imagenes: [{ arte: 'vaso', color: '#1b1d22', acento: '#ff6a2b', fondo: '#ff6a2b' }] },
      { id: 'termo-1l', nombre: 'Termo 1 litro', categoria: 'termos', precio: 24990, descripcion: 'Con asa. Caliente 12 h, frío 24 h.', imagenes: img({ arte: 'termo', color: '#2a2d33', acento: '#ff6a2b', fondo: '#30343c' }, [{ zoom: true }]) },
      { id: 'termo-500', nombre: 'Botella 500 ml', categoria: 'termos', precio: 14990, descripcion: 'Liviana, para el gimnasio o la oficina.', imagenes: [{ arte: 'termo', color: '#1b1d22', acento: '#f1ede6', fondo: '#2a2e35' }] },
      { id: 'taza', nombre: 'Taza enlozada negra', categoria: 'accesorios', precio: 8990, descripcion: 'Borde de acero, 350 ml.', imagenes: [{ arte: 'taza', color: '#24272d', acento: '#3a2a20', fondo: '#30343c' }] },
      { id: 'kit', nombre: 'Kit regalo Carbón', categoria: 'accesorios', precio: 34990, precioAntes: 41980, etiqueta: 'Ahorra 17%', descripcion: 'Vaso 600 ml, botella 500 ml y caja.', imagenes: [{ arte: 'caja', color: '#24272d', acento: '#ff6a2b', fondo: '#30343c' }] }
    ]
  },
  {
    slug: 'cerro-alegre', plan: 'basico', demo: true,
    negocio: { nombre: 'Tostaduría Cerro Alegre', bajada: 'Café de especialidad tostado cada semana en Valparaíso.', whatsapp: WA_PRUEBA, instagram: '@tostaduria.cerroalegre', horario: 'Lun a sáb, 10:00 a 19:00' },
    tema: {
      fuenteTitulos: 'Fraunces', fuenteTexto: 'Inter', pesoTitulos: 600, radio: 22, modoInicial: 'auto',
      claro: { bg: '#f1e9df', surface: '#fbf6ef', 'surface-2': '#e6dbcd', ink: '#2f2219', muted: '#75645a', line: '#dccfbf', accent: '#8b5a3c', 'accent-ink': '#fff8f0', wa: '#1f8f4e', 'wa-ink': '#ffffff' },
      oscuro: { bg: '#1e1714', surface: '#2a201b', 'surface-2': '#241b17', ink: '#f3e8dc', muted: '#b9a796', line: '#3a2e27', accent: '#d29a6c', 'accent-ink': '#22160f', wa: '#25a35a', 'wa-ink': '#ffffff' }
    },
    estructura: { portada: 'simple', tarjetas: 'lista', columnas: { movil: 1, escritorio: 2 }, descripcion: true },
    banner: { titulo: 'Tostaduría Cerro Alegre', texto: 'Café de especialidad tostado cada semana en Valparaíso. Pide por WhatsApp y retira o recibe en casa.' },
    entrega: {
      retiro: { activo: true, lugar: 'Cerro Alegre', direccion: 'Templeman 412, Cerro Alegre, Valparaíso', horario: 'Lun a sáb, 10:00 a 19:00' },
      domicilio: { activo: true, gratisDesde: 40000, comunas: [{ nombre: 'Valparaíso', costo: 2500 }, { nombre: 'Viña del Mar', costo: 3000 }, { nombre: 'Concón', costo: 4000 }, { nombre: 'Quilpué', costo: 4500 }, { nombre: 'Villa Alemana', costo: 4500 }] }
    },
    pago: 'Pago por transferencia. Te enviamos los datos bancarios por WhatsApp al confirmar el pedido.',
    mensaje: { saludo: 'Hola Tostaduría Cerro Alegre, quiero hacer este pedido:' },
    categorias: [{ id: 'cafe', nombre: 'Café' }, { id: 'packs', nombre: 'Packs y regalos' }, { id: 'accesorios', nombre: 'Accesorios' }],
    productos: [
      { id: 'colombia', nombre: 'Colombia Huila 250 g', categoria: 'cafe', precio: 8990, etiqueta: 'Más vendido', descripcion: 'Notas a panela, naranja y cacao. Tueste medio.', opciones: ['En grano', 'Molido para prensa', 'Molido para filtro', 'Molido para espresso'], tituloOpciones: 'Molienda', imagenes: [{ arte: 'bolsa', color: '#c2492e', acento: '#f2e6d0', fondo: '#efe3d3' }] },
      { id: 'brasil', nombre: 'Brasil Cerrado 250 g', categoria: 'cafe', precio: 7990, descripcion: 'Chocolate y maní tostado, cuerpo alto. Ideal con leche.', opciones: ['En grano', 'Molido para prensa', 'Molido para filtro', 'Molido para espresso'], tituloOpciones: 'Molienda', imagenes: [{ arte: 'bolsa', color: '#2f7a55', acento: '#f2e6d0', fondo: '#e7e3d6' }] },
      { id: 'etiopia', nombre: 'Etiopía Yirgacheffe 250 g', categoria: 'cafe', precio: 10990, etiqueta: 'Nuevo', descripcion: 'Floral, jazmín y limón. Tueste claro para filtro.', opciones: ['En grano', 'Molido para filtro'], tituloOpciones: 'Molienda', imagenes: [{ arte: 'bolsa', color: '#3a5ba8', acento: '#f2e6d0', fondo: '#e4e3e3' }] },
      { id: 'peru', nombre: 'Perú Orgánico 250 g', categoria: 'cafe', precio: 8490, descripcion: 'Caramelo y nuez, acidez suave.', opciones: ['En grano', 'Molido para prensa', 'Molido para filtro', 'Molido para espresso'], tituloOpciones: 'Molienda', imagenes: [{ arte: 'bolsa', color: '#8a5a2b', acento: '#f2e6d0', fondo: '#efe3d3' }] },
      { id: 'descafeinado', nombre: 'Descafeinado 250 g', categoria: 'cafe', precio: 9490, disponible: false, descripcion: 'Proceso de agua suiza.', imagenes: [{ arte: 'bolsa', color: '#6b6f7a', acento: '#f2e6d0', fondo: '#e6e2dc' }] },
      { id: 'pack', nombre: 'Pack degustación 3 orígenes', categoria: 'packs', precio: 12990, descripcion: 'Colombia, Brasil y Etiopía en bolsas de 100 g.', imagenes: [{ arte: 'caja', color: '#c9a46a', acento: '#8b5a3c', fondo: '#efe3d3' }] },
      { id: 'taza', nombre: 'Taza enlozada 350 ml', categoria: 'accesorios', precio: 6990, descripcion: 'Con el logo de la tostaduría.', opciones: ['Crema', 'Verde'], tituloOpciones: 'Color', imagenes: [{ arte: 'taza', color: '#efe7dc', acento: '#6b4226', fondo: '#e6dbcd' }] }
    ]
  }
];

for (const t of tiendas) {
  const dir = path.join(RAIZ, t.slug);
  fs.mkdirSync(dir, { recursive: true });
  const bg = t.tema.oscuro.bg, fg = t.tema.oscuro.accent;
  const icon = logos[t.slug](bg, fg);
  t.negocio.logo = logos[t.slug](t.tema.oscuro.bg, t.tema.oscuro.accent);
  fs.writeFileSync(path.join(dir, 'tienda.json'), JSON.stringify(t, null, 2));
  fs.writeFileSync(path.join(dir, 'icon.svg'), icon);
  fs.writeFileSync(path.join(dir, 'manifest.webmanifest'), JSON.stringify({
    name: t.negocio.nombre, short_name: t.negocio.nombre.slice(0, 12), description: t.negocio.bajada,
    id: '/' + t.slug, start_url: '/' + t.slug, scope: '/' + t.slug, display: 'standalone', lang: 'es-CL',
    background_color: t.tema.oscuro.bg, theme_color: t.tema.oscuro.bg,
    icons: [
      { src: '/tiendas/' + t.slug + '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/tiendas/' + t.slug + '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/tiendas/' + t.slug + '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }, null, 2));
  console.log('ok', t.slug);
}
