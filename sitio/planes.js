/*
  PedidoListo: límites por plan. Los usa el panel /admin (y deben coincidir con firestore.rules).
  productos: máximo de productos; fotos: fotos por producto; categorias: máximo de categorías.
*/
window.PLANES = {
  basico: { nombre: 'Básico', precio: '$9.990/mes', productos: 40, fotos: 1, categorias: 6, favoritos: false, galeria: false, comprobante: false },
  pro: { nombre: 'Pro', precio: '$15.990/mes', productos: 200, fotos: 5, categorias: 20, favoritos: true, galeria: true, comprobante: true },
  unico: { nombre: 'Pago único', precio: '$159.990', productos: 100, fotos: 3, categorias: 12, favoritos: true, galeria: true, comprobante: true }
};
window.FOTO_MAX_LADO = 1080;      // px del lado mayor al comprimir
window.FOTO_MAX_BYTES = 260000;   // tamaño máximo de cada foto ya comprimida (como texto base64)
