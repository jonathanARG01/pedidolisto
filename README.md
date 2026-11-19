# PedidoListo v1 (antes "Brota") (catálogo con pedidos por WhatsApp)

- `pedidolisto-sitio.zip`: el sitio listo para publicar (landing + motor de tiendas + 3 tiendas demo).
  Publicar: arrastrar el zip a https://app.netlify.com/drop (o `netlify deploy --prod` dentro de la carpeta).
- Estructura del repositorio:
  - `index.html` landing · `marcas.html` nombres y logos · `personalizar.html` personalizador de diseño.
  - `app.html/app.css/app.js/arte.js/sw.js`: motor del catálogo. Una tienda vive en `/<slug>` y lee `tiendas/<slug>/tienda.json`.
  - `_redirects`: envía `/<slug>` a la app.
  - `herramientas/generar-tiendas.js` genera las tiendas demo; `herramientas/iconos.js` los íconos PNG; `herramientas/servidor.js` es un servidor local (`node herramientas/servidor.js`, puerto 4321).
- Tienda nueva: copiar una carpeta en `tiendas/`, editar `tienda.json` (negocio, whatsapp 569XXXXXXXX, tema claro/oscuro, estructura, entrega, productos) y generar íconos.
- `"plan": "pro"` activa favoritos, varias fotos y enlace al comprobante (PDF/imagen); `"basico"` los oculta.
- Pendiente: número de WhatsApp de Brote en `index.html` (variable WHATSAPP_BROTE); panel para que el cliente edite su tienda (hoy se edita el JSON); dominio.

## Publicación
Netlify publica la carpeta `sitio/` (ver `netlify.toml`). Sin paso de build.
Probar en local: `node herramientas/servidor.js` y abrir http://localhost:4321
