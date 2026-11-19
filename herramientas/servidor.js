// Servidor local que imita las reglas de Netlify (_redirects): archivos reales primero, si no /app.html.
const http = require('http'), fs = require('fs'), path = require('path');
const RAIZ = path.join(__dirname, '..', 'sitio');
const tipos = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  let f = path.join(RAIZ, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
  if (!fs.existsSync(f)) {
    if (/^\/[a-z0-9-]+\/?$/.test(p)) f = path.join(RAIZ, 'app.html');
    else { res.writeHead(404); return res.end('404'); }
  }
  res.writeHead(200, { 'Content-Type': tipos[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(process.env.PORT || 4321);
