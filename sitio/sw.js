// Service worker de Brota: deja el catálogo disponible sin conexión y permite instalarlo como app.
var VERSION = 'brota-v4';
var BASE = ['/app.html', '/app.css', '/app.js', '/arte.js', '/helado.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // Páginas de tienda (/slug): red primero, si no hay conexión se usa la app guardada.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(function () { return caches.match('/app.html'); }));
    return;
  }
  // Datos de la tienda y fuentes: red primero con copia en caché.
  if (url.pathname.indexOf('/tiendas/') === 0 || url.hostname.indexOf('fonts.') === 0 || BASE.indexOf(url.pathname) >= 0) {
    e.respondWith(fetch(req).then(function (r) {
      if (r.ok || r.type === 'opaque') { var copia = r.clone(); caches.open(VERSION).then(function (c) { c.put(req, copia); }); }
      return r;
    }).catch(function () { return caches.match(req); }));
  }
});
