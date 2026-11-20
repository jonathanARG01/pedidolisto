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

## Alta de clientes nuevos
1. El cliente completa el formulario en `/alta` (`sitio/alta.html`). Usa **Netlify Forms**: los envíos quedan en Netlify > Forms > `alta`.
   Primera vez: en Netlify activar *Forms > Enable form detection* y volver a publicar; luego en *Forms > Form notifications* agregar un aviso por correo.
   Límite de Netlify: 8 MB por envío (logo + planilla). Las fotos van por enlace (Drive, Google Fotos, Dropbox) o por WhatsApp.
2. Si tiene muchos productos, descarga `/planilla-productos.xlsx`, la completa y la sube en el mismo formulario.
3. Para crear la tienda: copiar el campo `tienda_json` del envío a un archivo `alta.json` y ejecutar
   `node herramientas/nueva-tienda.js alta.json [planilla.xlsx] [--fotos carpeta-de-fotos]`
   Luego `node herramientas/iconos.js`, revisar en `http://localhost:4321/<slug>` y ajustar `tienda.json` si hace falta.
   El tema claro/oscuro se calcula desde el color principal del cliente; si el cliente subió logo, guardarlo en `tiendas/<slug>/` y poner su ruta en `negocio.logo` (si no, el script crea uno con sus iniciales).
