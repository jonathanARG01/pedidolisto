/*
  PedidoListo: panel de administración (/admin) sobre Firebase (Auth + Firestore).
  - Cada cliente entra con su correo y edita sus productos, fotos, categorías y datos del negocio.
  - Los límites (productos, fotos por producto, categorías) salen del plan: sitio/planes.js y firestore.rules.
  - Superadministrador (doc admins/{correo}): ve todas las tiendas, cambia el plan, da acceso a clientes e importa tiendas.
*/
const V = '10.12.2';
const CDN = 'https://www.gstatic.com/firebasejs/' + V + '/';
const CFG = window.FIREBASE_CONFIG;
const PLANES = window.PLANES;
const WA_BROTE = '56941497083';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const raiz = $('#raiz');
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plata = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');
const slugify = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'item';

const I = {
  hoja: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4c-8 0-14 4-14 11 0 1.5.4 2.9 1 4l-2 2 1.4 1.4 2-2c1.1.7 2.5 1.1 4 1.1 7 0 9.6-7.5 9.6-17.5z"/></svg>',
  mas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  editar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
  borrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  arriba: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>',
  abajo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
  cerrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  camara: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  ojo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  salir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/></svg>'
};

let A, F, app, auth, db;
const S = { usuario: null, esAdmin: false, tiendas: [], slug: '', tienda: null, acceso: { duenos: [] }, productos: [], vista: 'productos' };

/* ---------- utilidades de interfaz ---------- */
function aviso(txt, mal) {
  const t = $('#toast'); t.textContent = txt; t.className = mal ? 'mal' : ''; t.hidden = false;
  clearTimeout(aviso.t); aviso.t = setTimeout(() => { t.hidden = true; }, mal ? 4200 : 2400);
}
function mensajeError(e) {
  const c = (e && e.code) || '';
  if (c.includes('invalid-credential') || c.includes('wrong-password') || c.includes('user-not-found') || c.includes('invalid-email')) return 'Correo o contraseña incorrectos.';
  if (c.includes('too-many-requests')) return 'Demasiados intentos. Espera unos minutos.';
  if (c.includes('permission-denied')) return 'No tienes permiso para este cambio o superaste el límite de tu plan.';
  if (c.includes('email-already-in-use')) return 'Ese correo ya tiene una cuenta. Solo agrégalo como dueño.';
  if (c.includes('weak-password')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (c.includes('unavailable') || c.includes('network')) return 'Sin conexión. Revisa tu internet e intenta de nuevo.';
  return (e && e.message) || 'Algo salió mal.';
}
function abrirHoja(titulo, cuerpo, pie, chica) {
  cerrarHoja();
  const f = document.createElement('div'); f.className = 'fondo'; f.dataset.hoja = '1';
  const h = document.createElement('section'); h.className = 'hoja-ed' + (chica ? ' chica' : ''); h.dataset.hoja = '1';
  h.setAttribute('role', 'dialog'); h.setAttribute('aria-modal', 'true'); h.setAttribute('aria-label', titulo);
  h.innerHTML = '<header><h2>' + esc(titulo) + '</h2><button class="icono" data-cerrar aria-label="Cerrar">' + I.cerrar + '</button></header>' +
    '<div class="cuerpo">' + cuerpo + '</div>' + (pie ? '<footer>' + pie + '</footer>' : '');
  document.body.append(f, h);
  f.onclick = cerrarHoja; h.querySelector('[data-cerrar]').onclick = cerrarHoja;
  document.body.style.overflow = 'hidden';
  return h;
}
function cerrarHoja() { $$('[data-hoja]').forEach((n) => n.remove()); document.body.style.overflow = ''; }
function confirmar(titulo, texto, boton) {
  return new Promise((ok) => {
    const h = abrirHoja(titulo, '<p style="margin:0">' + esc(texto) + '</p>',
      '<button class="btn" data-no>Cancelar</button><button class="btn btn-peligro lleno" data-si>' + esc(boton || 'Sí, eliminar') + '</button>', true);
    h.querySelector('[data-no]').onclick = () => { cerrarHoja(); ok(false); };
    h.querySelector('[data-si]').onclick = () => { cerrarHoja(); ok(true); };
  });
}
function cargando(btn, si, txt) {
  if (!btn) return;
  if (si) { btn.dataset.txt = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px"></span>' + esc(txt || 'Guardando…'); }
  else { btn.disabled = false; if (btn.dataset.txt) btn.innerHTML = btn.dataset.txt; }
}
const plan = () => PLANES[(S.tienda && S.tienda.plan) || 'basico'] || PLANES.basico;

/* ---------- sin configuración ---------- */
function sinConfig() {
  raiz.innerHTML = '<div class="config"><div class="marca-pl"><span class="hoja">' + I.hoja + '</span>Panel PedidoListo</div>' +
    '<h1 style="margin:18px 0 8px">Falta conectar Firebase</h1>' +
    '<p>Pega la configuración de tu app web de Firebase en <code>sitio/firebase-config.js</code> y vuelve a publicar el sitio. ' +
    'Los pasos completos están en la guía de configuración.</p>' +
    '<pre>window.FIREBASE_CONFIG = {\n  apiKey: "…",\n  authDomain: "…firebaseapp.com",\n  projectId: "…",\n  appId: "…"\n};</pre></div>';
}

/* ---------- arranque ---------- */
async function iniciar() {
  try {
    const [m, a, f] = await Promise.all([import(CDN + 'firebase-app.js'), import(CDN + 'firebase-auth.js'), import(CDN + 'firebase-firestore.js')]);
    A = a; F = f;
    app = m.initializeApp(CFG);
    auth = A.getAuth(app);
    db = F.getFirestore(app);
    if (CFG.emulador) {
      A.connectAuthEmulator(auth, 'http://' + (CFG.emulador.auth || 'localhost:9099'), { disableWarnings: true });
      const [h, p] = (CFG.emulador.firestore || 'localhost:8085').split(':');
      F.connectFirestoreEmulator(db, h, Number(p));
    }
    window.__app = { m, appCfg: CFG };
    A.onAuthStateChanged(auth, (u) => { if (u) entrar(u); else pantallaLogin(); });
  } catch (e) {
    raiz.innerHTML = '<div class="config"><h1>No se pudo cargar el panel</h1><p>' + esc(mensajeError(e)) + '</p><p><button class="btn" onclick="location.reload()">Reintentar</button></p></div>';
  }
}

/* ---------- ingreso ---------- */
function pantallaLogin(msg) {
  S.usuario = null;
  raiz.innerHTML = '<div class="login"><form class="caja" id="f-login" novalidate>' +
    '<div class="marca-pl"><span class="hoja">' + I.hoja + '</span>PedidoListo</div>' +
    '<div><h1>Administra tu tienda</h1><p>Entra con tu cuenta de Google o con el correo y la contraseña que te dio Brote Digital.</p></div>' +
    '<label class="campo"><span>Correo</span><input id="l-correo" type="email" autocomplete="email" required inputmode="email"></label>' +
    '<label class="campo"><span>Contraseña</span><input id="l-clave" type="password" autocomplete="current-password" required></label>' +
    '<p class="error" id="l-err"' + (msg ? '' : ' hidden') + '>' + esc(msg || '') + '</p>' +
    '<button class="btn btn-prim" type="submit">Entrar</button>' +
    '<div class="o-sep"><span>o</span></div>' +
    '<button class="btn btn-google" type="button" id="l-google"><svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Entrar con Google</button>' +
    '<button class="enlace" type="button" id="l-olvido">Olvidé mi contraseña</button></form></div>';
  const err = (t) => { const e = $('#l-err'); e.textContent = t; e.hidden = !t; };
  $('#f-login').onsubmit = async (ev) => {
    ev.preventDefault();
    const correo = $('#l-correo').value.trim(), clave = $('#l-clave').value;
    if (!correo || !clave) { err('Escribe tu correo y contraseña.'); return; }
    const b = ev.submitter || $('#f-login .btn-prim'); cargando(b, true, 'Entrando…');
    try { await A.signInWithEmailAndPassword(auth, correo, clave); }
    catch (e) { cargando(b, false); err(mensajeError(e)); }
  };
  $('#l-google').onclick = async (ev) => {
    const b = ev.currentTarget; cargando(b, true, 'Abriendo Google…');
    try { const p = new A.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' }); await A.signInWithPopup(auth, p); }
    catch (e) {
      cargando(b, false);
      if (/popup-blocked|operation-not-supported/.test((e && e.code) || '')) { try { await A.signInWithRedirect(auth, new A.GoogleAuthProvider()); return; } catch (e2) { e = e2; } }
      if (!/popup-closed|cancelled-popup/.test((e && e.code) || '')) err(mensajeError(e));
    }
  };
  $('#l-olvido').onclick = async () => {
    const correo = $('#l-correo').value.trim();
    if (!correo) { err('Escribe tu correo arriba y vuelve a tocar "Olvidé mi contraseña".'); return; }
    try { await A.sendPasswordResetEmail(auth, correo); err(''); aviso('Te enviamos un correo para cambiar la contraseña'); }
    catch (e) { err(mensajeError(e)); }
  };
}

async function entrar(u) {
  S.usuario = u;
  raiz.innerHTML = '<div class="cargando"><span class="spinner"></span>Cargando tus tiendas…</div>';
  const correo = (u.email || '').toLowerCase();
  try {
    const adm = await F.getDoc(F.doc(db, 'admins', correo)).catch(() => null);
    S.esAdmin = !!(adm && adm.exists());
    if (S.esAdmin) {
      const ts = await F.getDocs(F.collection(db, 'tiendas'));
      S.tiendas = ts.docs.map((d) => ({ slug: d.id, nombre: (d.data().negocio || {}).nombre || d.id }));
    } else {
      const q = F.query(F.collectionGroup(db, 'privado'), F.where('duenos', 'array-contains', correo));
      const ds = await F.getDocs(q);
      S.tiendas = [];
      for (const d of ds.docs) {
        const slug = d.ref.parent.parent.id;
        const t = await F.getDoc(F.doc(db, 'tiendas', slug));
        if (t.exists()) S.tiendas.push({ slug, nombre: (t.data().negocio || {}).nombre || slug });
      }
    }
  } catch (e) {
    raiz.innerHTML = '<div class="config"><h1>No pudimos cargar tus tiendas</h1><p>' + esc(mensajeError(e)) + '</p><p><button class="btn" id="salir">Salir</button></p></div>';
    $('#salir').onclick = () => A.signOut(auth);
    return;
  }
  if (!S.tiendas.length && !S.esAdmin) {
    raiz.innerHTML = '<div class="login"><div class="caja"><h1>Tu cuenta aún no tiene una tienda</h1><p>Entraste como ' + esc(correo) + ', pero no tienes una tienda asignada. Escríbele a Brote Digital para activarla.</p>' +
      '<a class="btn btn-prim" href="https://wa.me/' + WA_BROTE + '" target="_blank" rel="noopener">Escribir por WhatsApp</a><button class="btn" id="salir">Salir</button></div></div>';
    $('#salir').onclick = () => A.signOut(auth);
    return;
  }
  let pref = ''; try { pref = localStorage.getItem('admin:tienda') || ''; } catch (e) {}
  const slug = (S.tiendas.find((t) => t.slug === pref) || S.tiendas[0] || {}).slug;
  if (slug) await abrirTienda(slug); else { S.vista = 'admin'; S.tienda = null; pintar(); }
}

async function abrirTienda(slug) {
  S.slug = slug;
  try { localStorage.setItem('admin:tienda', slug); } catch (e) {}
  const [t, ps, ac] = await Promise.all([
    F.getDoc(F.doc(db, 'tiendas', slug)),
    F.getDocs(F.collection(db, 'tiendas', slug, 'productos')),
    F.getDoc(F.doc(db, 'tiendas', slug, 'privado', 'acceso')).catch(() => null)
  ]);
  S.tienda = t.exists() ? t.data() : null;
  S.tienda.categorias = S.tienda.categorias || [];
  S.acceso = ac && ac.exists() ? ac.data() : { duenos: [] };
  S.productos = ps.docs.map((d) => Object.assign({ _cupo: d.id }, d.data())).sort((a, b) => (a.orden || 0) - (b.orden || 0));
  pintar();
}

/* ---------- estructura general ---------- */
function pintar() {
  const t = S.tienda, p = plan();
  const tabs = [['productos', 'Productos'], ['categorias', 'Categorías'], ['negocio', 'Mi negocio'], ['plan', 'Mi plan']];
  if (S.esAdmin) tabs.push(['admin', 'Superadmin']);
  if (!t && S.vista !== 'admin') S.vista = 'admin';
  raiz.innerHTML = '<header class="top"><div class="wrap">' +
    '<div class="marca-pl"><span class="hoja">' + I.hoja + '</span></div>' +
    '<div class="tienda"><b>' + esc(t ? (t.negocio || {}).nombre || S.slug : 'Sin tienda') + '</b>' +
    (t ? '<small>Plan <span class="insignia">' + esc(p.nombre) + '</span></small>' : '') + '</div>' +
    (S.tiendas.length > 1 ? '<select id="sel-tienda" aria-label="Cambiar de tienda">' + S.tiendas.map((x) => '<option value="' + esc(x.slug) + '"' + (x.slug === S.slug ? ' selected' : '') + '>' + esc(x.nombre) + '</option>').join('') + '</select>' : '') +
    (t ? '<a class="icono" href="/' + esc(S.slug) + '" target="_blank" rel="noopener" aria-label="Ver mi tienda" title="Ver mi tienda">' + I.ojo + '</a>' : '') +
    '<button class="icono" id="b-salir" aria-label="Salir" title="Salir">' + I.salir + '</button></div>' +
    '<div class="wrap"><nav class="tabs" role="tablist">' + tabs.map(([id, n]) => '<button role="tab" data-vista="' + id + '" aria-selected="' + (S.vista === id) + '">' + n + '</button>').join('') + '</nav></div></header>' +
    '<main class="wrap" id="vista"></main>';
  $('#b-salir').onclick = () => A.signOut(auth);
  const sel = $('#sel-tienda'); if (sel) sel.onchange = () => abrirTienda(sel.value);
  $$('.tabs [data-vista]').forEach((b) => { b.onclick = () => { S.vista = b.dataset.vista; pintar(); }; });
  ({ productos: vistaProductos, categorias: vistaCategorias, negocio: vistaNegocio, plan: vistaPlan, admin: vistaAdmin }[S.vista] || vistaProductos)();
}

function usoHTML(n, max, etiqueta) {
  const pct = Math.min(100, Math.round((n / max) * 100));
  return '<div class="uso"><div class="linea-uso"><span>' + esc(etiqueta) + '</span><span class="num">' + n + ' de ' + max + '</span></div>' +
    '<div class="barra-uso' + (n >= max ? ' lleno' : '') + '"><i style="width:' + pct + '%"></i></div></div>';
}

/* ---------- fotos ---------- */
const cacheFotos = {};
function fotoFS(id) {
  if (!cacheFotos[id]) cacheFotos[id] = F.getDoc(F.doc(db, 'tiendas', S.slug, 'imagenes', id)).then((d) => (d.exists() ? d.data().data : '')).catch(() => '');
  return cacheFotos[id];
}
function miniatura(im, alt) {
  if (typeof im === 'string' && im.indexOf('img:') === 0) return '<img data-fs="' + esc(im.slice(4)) + '" alt="' + esc(alt || '') + '">';
  if (typeof im === 'string' && im.indexOf('data:') === 0) return '<img src="' + im + '" alt="' + esc(alt || '') + '">';
  if (typeof im === 'string') return '<img src="' + esc(im) + '" alt="' + esc(alt || '') + '" loading="lazy">';
  if (im && typeof im === 'object' && window.Arte) return window.Arte.svg(im);
  return '';
}
function cargarMiniaturas(r) { $$('img[data-fs]', r).forEach((img) => fotoFS(img.dataset.fs).then((src) => { if (src) img.src = src; })); }

function cargarImagen(file) {
  return new Promise((ok, mal) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); ok(img); };
    img.onerror = () => { URL.revokeObjectURL(url); mal(new Error('No pudimos leer esa imagen. Prueba con una foto JPG o PNG.')); };
    img.src = url;
  });
}
// Achica y comprime la foto en el navegador (webp, o jpeg si el navegador no sabe webp) hasta quedar bajo el límite.
async function comprimir(file) {
  const img = await cargarImagen(file);
  let lado = window.FOTO_MAX_LADO || 1080, max = window.FOTO_MAX_BYTES || 260000;
  for (let intento = 0; intento < 5; intento++) {
    const s = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * s)), h = Math.max(1, Math.round(img.naturalHeight * s));
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
    for (let q = 0.82; q >= 0.5; q -= 0.08) {
      let d = c.toDataURL('image/webp', q);
      if (d.indexOf('data:image/webp') !== 0) d = c.toDataURL('image/jpeg', q);
      if (d.length <= max) return d;
    }
    lado = Math.round(lado * 0.78);
  }
  throw new Error('La foto es demasiado grande incluso comprimida.');
}

/* ---------- productos ---------- */
function vistaProductos() {
  const v = $('#vista'), p = plan(), n = S.productos.length, lleno = n >= p.productos;
  const cats = S.tienda.categorias || [];
  const nomCat = (id) => (cats.find((c) => c.id === id) || {}).nombre || 'Sin categoría';
  v.innerHTML = '<div class="cab"><h2>Productos</h2><button class="btn btn-prim" id="b-nuevo"' + (lleno ? ' disabled' : '') + '>' + I.mas + 'Agregar producto</button></div>' +
    usoHTML(n, p.productos, 'Productos de tu plan ' + p.nombre) +
    (lleno ? '<p class="nota aviso" style="margin-bottom:12px">Llegaste al máximo de productos de tu plan. Para agregar más, elimina alguno o sube de plan.</p>' : '') +
    (n > 6 ? '<input class="buscar" id="q" type="search" placeholder="Buscar producto">' : '') +
    '<div class="productos" id="lista"></div>';
  const lista = $('#lista');
  const dibujar = (q) => {
    const qq = slugify(q || '');
    const ps = S.productos.filter((x) => !q || slugify(x.nombre).includes(qq));
    if (!ps.length) { lista.innerHTML = '<div class="vacio"><b>' + (n ? 'Sin resultados' : 'Aún no tienes productos') + '</b>' + (n ? 'Prueba con otra palabra.' : 'Toca "Agregar producto" para crear el primero.') + '</div>'; return; }
    lista.innerHTML = ps.map((x) => {
      const i = S.productos.indexOf(x);
      return '<article class="fila' + (x.disponible === false ? ' agotado' : '') + '" style="animation-delay:' + Math.min(i, 10) * 30 + 'ms">' +
        '<div class="foto">' + miniatura((x.imagenes || [])[0], x.nombre) + '</div>' +
        '<div><b>' + esc(x.nombre) + '</b><small>' + esc(nomCat(x.categoria)) + (x.armador ? ' · Se arma en la tienda' : '') + '</small><div class="precio num">' + plata(x.precio) + '</div></div>' +
        '<div class="acc">' +
        '<label class="interruptor" title="Disponible"><input type="checkbox" data-disp="' + esc(x._cupo) + '"' + (x.disponible === false ? '' : ' checked') + ' aria-label="Disponible ' + esc(x.nombre) + '"><span>' + (x.disponible === false ? 'Agotado' : 'Disponible') + '</span></label>' +
        (q ? '' : '<div class="orden"><button class="icono" data-sube="' + i + '" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>' + I.arriba + '</button><button class="icono" data-baja="' + i + '" aria-label="Bajar"' + (i === n - 1 ? ' disabled' : '') + '>' + I.abajo + '</button></div>') +
        '<button class="icono" data-ed="' + esc(x._cupo) + '" aria-label="Editar ' + esc(x.nombre) + '">' + I.editar + '</button>' +
        '<button class="icono" data-del="' + esc(x._cupo) + '" aria-label="Eliminar ' + esc(x.nombre) + '" style="color:var(--danger)">' + I.borrar + '</button></div></article>';
    }).join('');
    cargarMiniaturas(lista);
    $$('[data-ed]', lista).forEach((b) => { b.onclick = () => editarProducto(S.productos.find((x) => x._cupo === b.dataset.ed)); });
    $$('[data-del]', lista).forEach((b) => { b.onclick = () => eliminarProducto(S.productos.find((x) => x._cupo === b.dataset.del)); });
    $$('[data-disp]', lista).forEach((c) => { c.onchange = () => cambiarDisponible(S.productos.find((x) => x._cupo === c.dataset.disp), c); });
    $$('[data-sube]', lista).forEach((b) => { b.onclick = () => mover(+b.dataset.sube, -1); });
    $$('[data-baja]', lista).forEach((b) => { b.onclick = () => mover(+b.dataset.baja, 1); });
  };
  dibujar('');
  const q = $('#q'); if (q) q.oninput = () => dibujar(q.value.trim());
  $('#b-nuevo').onclick = () => editarProducto(null);
}

function datosProducto(x) { const d = Object.assign({}, x); delete d._cupo; return d; }

async function cambiarDisponible(x, chk) {
  const antes = x.disponible;
  x.disponible = chk.checked;
  chk.nextElementSibling.textContent = chk.checked ? 'Disponible' : 'Agotado';
  chk.closest('.fila').classList.toggle('agotado', !chk.checked);
  try { await F.setDoc(F.doc(db, 'tiendas', S.slug, 'productos', x._cupo), datosProducto(x)); aviso(chk.checked ? 'Marcado como disponible' : 'Marcado como agotado'); }
  catch (e) { x.disponible = antes; aviso(mensajeError(e), true); vistaProductos(); }
}

async function mover(i, d) {
  const j = i + d; if (j < 0 || j >= S.productos.length) return;
  const a = S.productos[i], b = S.productos[j];
  S.productos[i] = b; S.productos[j] = a;
  S.productos.forEach((x, k) => { x.orden = k; });
  vistaProductos();
  try {
    const lote = F.writeBatch(db);
    [a, b].forEach((x) => lote.set(F.doc(db, 'tiendas', S.slug, 'productos', x._cupo), datosProducto(x)));
    await lote.commit();
  } catch (e) { aviso(mensajeError(e), true); }
}

function cupoLibre() {
  const usados = new Set(S.productos.map((x) => x._cupo));
  for (let k = 0; k < plan().productos; k++) { const id = 's' + String(k).padStart(3, '0'); if (!usados.has(id)) return id; }
  return null;
}
function idUnico(nombre, actual) {
  const base = slugify(nombre); let id = base, k = 2;
  while (S.productos.some((x) => x.id === id && x !== actual)) id = base + '-' + k++;
  return id;
}

function editarProducto(x) {
  const p = plan(), nuevo = !x, cats = S.tienda.categorias || [];
  if (nuevo && S.productos.length >= p.productos) { aviso('Llegaste al máximo de productos de tu plan.', true); return; }
  // fotos: { im: valor guardado } o { nueva: dataURL }
  let fotos = ((x && x.imagenes) || []).map((im) => ({ im }));
  const cuerpo = '<form class="campos" id="f-prod" novalidate>' +
    '<label class="campo"><span>Nombre *</span><input id="p-nombre" required maxlength="120" value="' + esc(x ? x.nombre : '') + '" placeholder="Ej: Maní confitado 100 g"></label>' +
    '<div class="dos"><label class="campo"><span>Precio *</span><input id="p-precio" inputmode="numeric" required value="' + esc(x ? x.precio : '') + '" placeholder="Ej: 1000"></label>' +
    '<label class="campo"><span>Precio antes (oferta)</span><input id="p-antes" inputmode="numeric" value="' + esc(x && x.precioAntes ? x.precioAntes : '') + '" placeholder="Opcional"></label></div>' +
    '<label class="campo"><span>Categoría</span><select id="p-cat">' + (cats.length ? '' : '<option value="">Sin categorías (créalas en Categorías)</option>') +
    cats.map((c) => '<option value="' + esc(c.id) + '"' + (x && x.categoria === c.id ? ' selected' : '') + '>' + esc(c.nombre) + '</option>').join('') + '</select></label>' +
    '<label class="campo"><span>Descripción</span><textarea id="p-desc" maxlength="400" placeholder="Qué trae, tamaño, sabor…">' + esc(x ? x.descripcion || '' : '') + '</textarea></label>' +
    '<div class="campo"><span>Fotos</span><small id="p-fotos-info"></small><div class="fotos" id="p-fotos"></div>' +
    '<input type="file" id="p-archivo" accept="image/*" multiple hidden></div>' +
    '<label class="campo"><span>Etiqueta destacada</span><input id="p-etiq" maxlength="24" value="' + esc(x ? x.etiqueta || '' : '') + '" placeholder="Ej: Nuevo, Favorito, Oferta (opcional)"></label>' +
    (x && x.armador ? '<p class="nota">Este producto se arma en la tienda (sabores, salsas y agregados). Esas opciones las ajusta Brote Digital; aquí puedes cambiar nombre, precio base, descripción y fotos.</p>' :
      '<div class="dos"><label class="campo"><span>Título de opciones</span><input id="p-topc" maxlength="40" value="' + esc(x ? x.tituloOpciones || '' : '') + '" placeholder="Ej: Sabor, Tamaño"></label>' +
      '<label class="campo"><span>Opciones</span><input id="p-opc" maxlength="300" value="' + esc(x && x.opciones ? x.opciones.join(', ') : '') + '" placeholder="Separadas por coma (opcional)"></label></div>') +
    '<label class="check"><input type="checkbox" id="p-disp"' + (x && x.disponible === false ? '' : ' checked') + '> Disponible para pedir</label>' +
    '<p class="error" id="p-err" hidden></p></form>';
  const h = abrirHoja(nuevo ? 'Nuevo producto' : 'Editar producto', cuerpo,
    '<button class="btn" data-cancelar>Cancelar</button><button class="btn btn-prim" id="p-guardar">Guardar</button>');
  h.querySelector('[data-cancelar]').onclick = cerrarHoja;

  const pintarFotos = () => {
    const caja = $('#p-fotos', h), lleno = fotos.length >= p.fotos;
    $('#p-fotos-info', h).textContent = 'Tu plan ' + p.nombre + ' permite ' + p.fotos + (p.fotos === 1 ? ' foto' : ' fotos') + ' por producto. La primera es la principal.';
    caja.innerHTML = fotos.map((f, i) => '<div class="ft' + (f.nueva ? ' nueva' : '') + '">' + miniatura(f.nueva || f.im, '') +
      '<button type="button" class="quitar" data-q="' + i + '" aria-label="Quitar foto">' + I.cerrar + '</button>' +
      (i === 0 ? '<span class="principal">Principal</span>' : '<button type="button" class="hacer-principal" data-pr="' + i + '">Hacer principal</button>') + '</div>').join('') +
      '<button type="button" class="sumar" id="p-sumar"' + (lleno ? ' disabled' : '') + '>' + I.camara + (lleno ? 'Límite del plan' : 'Agregar foto') + '</button>';
    cargarMiniaturas(caja);
    $$('[data-q]', caja).forEach((b) => { b.onclick = () => { fotos.splice(+b.dataset.q, 1); pintarFotos(); }; });
    $$('[data-pr]', caja).forEach((b) => { b.onclick = () => { const f = fotos.splice(+b.dataset.pr, 1)[0]; fotos.unshift(f); pintarFotos(); }; });
    $('#p-sumar', h).onclick = () => $('#p-archivo', h).click();
  };
  pintarFotos();
  $('#p-archivo', h).onchange = async (ev) => {
    const archivos = Array.from(ev.target.files || []); ev.target.value = '';
    const libres = p.fotos - fotos.length;
    if (archivos.length > libres) aviso('Tu plan permite ' + p.fotos + (p.fotos === 1 ? ' foto' : ' fotos') + ' por producto. Usamos las primeras.', true);
    for (const a of archivos.slice(0, Math.max(0, libres))) {
      try { fotos.push({ nueva: await comprimir(a) }); pintarFotos(); }
      catch (e) { aviso(e.message, true); }
    }
  };

  $('#p-guardar', h).onclick = async () => {
    const err = $('#p-err', h), fail = (t) => { err.textContent = t; err.hidden = false; };
    const nombre = $('#p-nombre', h).value.trim();
    const precio = parseInt(String($('#p-precio', h).value).replace(/\D/g, ''), 10);
    const antes = parseInt(String($('#p-antes', h).value).replace(/\D/g, ''), 10);
    if (!nombre) return fail('Escribe el nombre del producto.');
    if (!(precio >= 0)) return fail('Escribe el precio, solo números. Ej: 1500');
    if (fotos.length > p.fotos) return fail('Tu plan ' + p.nombre + ' permite ' + p.fotos + (p.fotos === 1 ? ' foto' : ' fotos') + ' por producto. Quita ' + (fotos.length - p.fotos) + ' para poder guardar.');
    const b = $('#p-guardar', h); cargando(b, true);
    try {
      const cupo = x ? x._cupo : cupoLibre();
      if (!cupo) throw new Error('Llegaste al máximo de productos de tu plan.');
      const base = x ? datosProducto(x) : { orden: S.productos.length };
      const d = Object.assign(base, {
        id: x ? x.id : idUnico(nombre, null), nombre, precio,
        categoria: $('#p-cat', h).value || (cats[0] || {}).id || '',
        descripcion: $('#p-desc', h).value.trim(),
        etiqueta: $('#p-etiq', h).value.trim(),
        disponible: $('#p-disp', h).checked
      });
      if (antes > precio) d.precioAntes = antes; else delete d.precioAntes;
      if (!d.etiqueta) delete d.etiqueta;
      if (!d.disponible) d.disponible = false; else delete d.disponible;
      if (!x || !x.armador) {
        const opc = ($('#p-opc', h) ? $('#p-opc', h).value : '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20);
        if (opc.length) { d.opciones = opc; d.tituloOpciones = $('#p-topc', h).value.trim() || 'Elige una opción'; } else { delete d.opciones; delete d.tituloOpciones; }
      }
      // Fotos: borra las que se quitaron y sube las nuevas en números libres (sNNN-k, k < fotos del plan).
      const antesIm = (x && x.imagenes) || [];
      const quedan = fotos.filter((f) => f.im !== undefined).map((f) => f.im);
      const quitadas = antesIm.filter((im) => typeof im === 'string' && im.indexOf('img:') === 0 && quedan.indexOf(im) < 0);
      for (const im of quitadas) await F.deleteDoc(F.doc(db, 'tiendas', S.slug, 'imagenes', im.slice(4)));
      const usados = new Set(quedan.filter((im) => typeof im === 'string' && im.indexOf('img:') === 0).map((im) => im.split('-').pop()));
      const final = [];
      for (const f of fotos) {
        if (f.im !== undefined) { final.push(f.im); continue; }
        let k = 0; while (usados.has(String(k))) k++;
        if (k >= p.fotos) throw new Error('Superaste las fotos de tu plan.');
        usados.add(String(k));
        const idImg = cupo + '-' + k, ref = F.doc(db, 'tiendas', S.slug, 'imagenes', idImg);
        await F.deleteDoc(ref).catch(() => {});
        await F.setDoc(ref, { data: f.nueva, bytes: f.nueva.length, creado: Date.now() });
        cacheFotos[idImg] = Promise.resolve(f.nueva);
        final.push('img:' + idImg);
      }
      if (final.length) d.imagenes = final; else delete d.imagenes;
      await F.setDoc(F.doc(db, 'tiendas', S.slug, 'productos', cupo), d);
      const nuevoObj = Object.assign({ _cupo: cupo }, d);
      if (x) S.productos[S.productos.indexOf(x)] = nuevoObj; else S.productos.push(nuevoObj);
      cerrarHoja(); aviso(x ? 'Producto actualizado' : 'Producto agregado'); vistaProductos();
    } catch (e) { cargando(b, false); fail(mensajeError(e)); }
  };
}

async function eliminarProducto(x) {
  if (!(await confirmar('Eliminar producto', '¿Eliminar "' + x.nombre + '"? Se borra de tu tienda junto con sus fotos.'))) return;
  try {
    const lote = F.writeBatch(db);
    (x.imagenes || []).forEach((im) => { if (typeof im === 'string' && im.indexOf('img:') === 0) lote.delete(F.doc(db, 'tiendas', S.slug, 'imagenes', im.slice(4))); });
    lote.delete(F.doc(db, 'tiendas', S.slug, 'productos', x._cupo));
    await lote.commit();
    S.productos.splice(S.productos.indexOf(x), 1);
    aviso('Producto eliminado'); vistaProductos();
  } catch (e) { aviso(mensajeError(e), true); }
}

/* ---------- categorías ---------- */
function vistaCategorias() {
  const v = $('#vista'), p = plan();
  let cats = (S.tienda.categorias || []).map((c) => Object.assign({}, c));
  const uso = (id) => S.productos.filter((x) => x.categoria === id).length;
  const dibujar = () => {
    v.innerHTML = '<div class="cab"><h2>Categorías</h2></div>' + usoHTML(cats.length, p.categorias, 'Categorías de tu plan ' + p.nombre) +
      '<div class="tarjeta"><p class="nota" style="margin-bottom:12px">Ordenan tu tienda en secciones (por ejemplo: Helados, Maní y dulces). Una categoría con productos no se puede borrar.</p>' +
      '<div class="lista-ed" id="cats">' + cats.map((c, i) => '<div class="it"><input data-n="' + i + '" value="' + esc(c.nombre) + '" maxlength="40" aria-label="Nombre de la categoría">' +
        '<small>' + uso(c.id) + ' prod.</small>' +
        '<button class="icono" data-s="' + i + '" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>' + I.arriba + '</button>' +
        '<button class="icono" data-b="' + i + '" aria-label="Bajar"' + (i === cats.length - 1 ? ' disabled' : '') + '>' + I.abajo + '</button>' +
        '<button class="icono" data-x="' + i + '" aria-label="Eliminar"' + (uso(c.id) ? ' disabled title="Tiene productos"' : '') + ' style="color:var(--danger)">' + I.borrar + '</button></div>').join('') + '</div>' +
      '<p style="margin:12px 0 0"><button class="btn btn-chico" id="c-mas"' + (cats.length >= p.categorias ? ' disabled' : '') + '>' + I.mas + 'Agregar categoría</button></p></div>' +
      '<div class="guardar-fijo"><button class="btn btn-prim" id="c-guardar">Guardar categorías</button></div>';
    $$('[data-n]', v).forEach((inp) => { inp.oninput = () => { cats[+inp.dataset.n].nombre = inp.value; }; });
    $$('[data-s]', v).forEach((b) => { b.onclick = () => { const i = +b.dataset.s; [cats[i - 1], cats[i]] = [cats[i], cats[i - 1]]; dibujar(); }; });
    $$('[data-b]', v).forEach((b) => { b.onclick = () => { const i = +b.dataset.b; [cats[i + 1], cats[i]] = [cats[i], cats[i + 1]]; dibujar(); }; });
    $$('[data-x]', v).forEach((b) => { b.onclick = () => { cats.splice(+b.dataset.x, 1); dibujar(); }; });
    $('#c-mas', v).onclick = () => { cats.push({ id: '', nombre: '' }); dibujar(); const ins = $$('[data-n]', v); ins[ins.length - 1].focus(); };
    $('#c-guardar', v).onclick = async (ev) => {
      const limpias = cats.map((c) => ({ id: c.id, nombre: c.nombre.trim() })).filter((c) => c.nombre);
      limpias.forEach((c) => { if (!c.id) { let id = slugify(c.nombre), k = 2; while (limpias.some((o) => o !== c && o.id === id)) id = slugify(c.nombre) + '-' + k++; c.id = id; } });
      const b = ev.currentTarget; cargando(b, true);
      try {
        await F.updateDoc(F.doc(db, 'tiendas', S.slug), { categorias: limpias, actualizado: Date.now() });
        S.tienda.categorias = limpias; cats = limpias.map((c) => Object.assign({}, c));
        aviso('Categorías guardadas'); dibujar();
      } catch (e) { cargando(b, false); aviso(mensajeError(e), true); }
    };
  };
  dibujar();
}

/* ---------- datos del negocio ---------- */
function vistaNegocio() {
  const v = $('#vista'), t = S.tienda, n = t.negocio || {}, e = t.entrega || {}, r = e.retiro || {}, d = e.domicilio || {}, tr = t.transferencia || {};
  let sectores = (d.comunas || []).map((c) => Object.assign({}, c));
  const campo = (id, et, val, extra) => '<label class="campo"><span>' + et + '</span><input id="' + id + '" value="' + esc(val || '') + '"' + (extra || '') + '></label>';
  v.innerHTML = '<div class="cab"><h2>Mi negocio</h2></div>' +
    '<div class="tarjeta"><h3>Datos principales</h3><div class="campos">' +
    campo('n-nombre', 'Nombre del negocio', n.nombre, ' maxlength="60"') +
    campo('n-bajada', 'Frase corta', n.bajada, ' maxlength="140"') +
    '<div class="dos">' + campo('n-wa', 'WhatsApp donde llegan los pedidos', n.whatsapp ? '+' + n.whatsapp : '', ' inputmode="tel" placeholder="+56 9 1234 5678"') +
    campo('n-horario', 'Horario', n.horario, ' maxlength="80" placeholder="Ej: Lunes a sábado, 10 a 20 h"') + '</div>' +
    campo('n-insta', 'Instagram (opcional)', n.instagram, ' placeholder="@tunegocio"') + '</div></div>' +
    '<div class="tarjeta"><h3>Retiro en el local</h3><div class="campos">' +
    '<label class="check"><input type="checkbox" id="r-activo"' + (r.activo ? ' checked' : '') + '> Ofrecer retiro</label>' +
    '<div class="dos">' + campo('r-lugar', 'Nombre corto del lugar', r.lugar, ' maxlength="60" placeholder="Ej: El Vergel 1950"') + campo('r-dir', 'Dirección completa', r.direccion, ' maxlength="120"') + '</div>' +
    campo('r-mapa', 'Dirección para el mapa (opcional)', r.direccionMapa, ' maxlength="140" placeholder="Calle, número, cerro o comuna, ciudad"') + '</div></div>' +
    '<div class="tarjeta"><h3>Despacho a domicilio</h3><div class="campos">' +
    '<label class="check"><input type="checkbox" id="d-activo"' + (d.activo ? ' checked' : '') + '> Ofrecer despacho</label>' +
    '<label class="campo"><span>Las zonas se llaman</span><select id="d-etq"><option value="Comuna"' + (d.etiquetaZona ? '' : ' selected') + '>Comunas</option><option value="Sector"' + (d.etiquetaZona === 'Sector' ? ' selected' : '') + '>Sectores</option></select></label>' +
    '<div class="campo"><span>Zonas y costo de envío</span><div class="lista-ed" id="d-sect"></div><p style="margin:6px 0 0"><button class="btn btn-chico" id="d-mas" type="button">' + I.mas + 'Agregar zona</button></p></div>' +
    '<div class="dos">' + campo('d-gratis', 'Envío gratis desde (opcional)', d.gratisDesde || '', ' inputmode="numeric" placeholder="Ej: 15000"') + campo('d-nota', 'Nota de despacho', d.nota, ' maxlength="160"') + '</div></div></div>' +
    '<div class="tarjeta"><h3>Pago por transferencia</h3><div class="campos">' +
    campo('p-texto', 'Texto de pago', t.pago, ' maxlength="160" placeholder="Ej: Pago por transferencia. Envía el comprobante por WhatsApp."') +
    '<div class="dos">' + campo('t-titular', 'Nombre del titular', tr.titular) + campo('t-rut', 'RUT', tr.rut) + '</div>' +
    '<div class="dos">' + campo('t-banco', 'Banco', tr.banco) + campo('t-tipo', 'Tipo de cuenta', tr.tipo, ' placeholder="Ej: Cuenta RUT, Cuenta corriente"') + '</div>' +
    '<div class="dos">' + campo('t-num', 'N° de cuenta', tr.numero) + campo('t-correo', 'Correo (opcional)', tr.correo, ' type="email"') + '</div></div></div>' +
    '<p class="error" id="n-err" hidden></p><div class="guardar-fijo"><button class="btn btn-prim" id="n-guardar">Guardar cambios</button></div>';
  const dibSect = () => {
    const c = $('#d-sect', v);
    c.innerHTML = sectores.map((s, i) => '<div class="it"><input data-sn="' + i + '" value="' + esc(s.nombre) + '" placeholder="Nombre de la zona" maxlength="60">' +
      '<input class="costo" data-sc="' + i + '" value="' + esc(s.costo) + '" inputmode="numeric" placeholder="Costo">' +
      '<button class="icono" type="button" data-sx="' + i + '" aria-label="Quitar zona" style="color:var(--danger)">' + I.borrar + '</button></div>').join('') || '<p class="nota">Sin zonas. Agrega al menos una para ofrecer despacho.</p>';
    $$('[data-sn]', c).forEach((i) => { i.oninput = () => { sectores[+i.dataset.sn].nombre = i.value; }; });
    $$('[data-sc]', c).forEach((i) => { i.oninput = () => { sectores[+i.dataset.sc].costo = i.value; }; });
    $$('[data-sx]', c).forEach((b) => { b.onclick = () => { sectores.splice(+b.dataset.sx, 1); dibSect(); }; });
  };
  dibSect();
  $('#d-mas', v).onclick = () => { sectores.push({ nombre: '', costo: '' }); dibSect(); };
  const val = (id) => $('#' + id, v).value.trim();
  $('#n-guardar', v).onclick = async (ev) => {
    const err = $('#n-err', v), fail = (m) => { err.textContent = m; err.hidden = false; err.scrollIntoView({ block: 'center', behavior: 'smooth' }); };
    err.hidden = true;
    let wa = val('n-wa').replace(/\D/g, '');
    if (wa.length === 9 && wa[0] === '9') wa = '56' + wa;
    if (!/^569\d{8}$/.test(wa)) return fail('Revisa el WhatsApp: debe ser un celular chileno, por ejemplo +56 9 1234 5678.');
    if (!val('n-nombre')) return fail('Escribe el nombre del negocio.');
    const zonas = sectores.map((s) => ({ nombre: String(s.nombre).trim(), costo: parseInt(String(s.costo).replace(/\D/g, ''), 10) || 0 })).filter((s) => s.nombre);
    if ($('#d-activo', v).checked && !zonas.length) return fail('Agrega al menos una zona de despacho o desactiva el despacho.');
    if (!$('#d-activo', v).checked && !$('#r-activo', v).checked) return fail('Activa al menos una forma de entrega: retiro o despacho.');
    const etq = $('#d-etq', v).value;
    const negocio = Object.assign({}, n, { nombre: val('n-nombre'), bajada: val('n-bajada'), whatsapp: wa, horario: val('n-horario'), instagram: val('n-insta') });
    if (!negocio.instagram) delete negocio.instagram;
    if (!negocio.horario) delete negocio.horario;
    const retiro = Object.assign({}, r, { activo: $('#r-activo', v).checked, lugar: val('r-lugar'), direccion: val('r-dir'), direccionMapa: val('r-mapa'), horario: val('n-horario') });
    if (!retiro.direccionMapa) delete retiro.direccionMapa;
    const gratis = parseInt(val('d-gratis').replace(/\D/g, ''), 10);
    const domicilio = Object.assign({}, d, { activo: $('#d-activo', v).checked, comunas: zonas, nota: val('d-nota') });
    if (etq === 'Sector') domicilio.etiquetaZona = 'Sector'; else delete domicilio.etiquetaZona;
    if (gratis > 0) domicilio.gratisDesde = gratis; else delete domicilio.gratisDesde;
    if (zonas.length) {
      const min = Math.min.apply(null, zonas.map((z) => z.costo));
      domicilio.resumen = gratis > 0 ? 'Desde ' + plata(min) + ', gratis sobre ' + plata(gratis) : (zonas.length <= 3 ? plata(min) + ' en ' + zonas.map((z) => z.nombre).join(', ') : 'Desde ' + plata(min));
    }
    const transferencia = { titular: val('t-titular'), rut: val('t-rut'), banco: val('t-banco'), tipo: val('t-tipo'), numero: val('t-num'), correo: val('t-correo') };
    Object.keys(transferencia).forEach((k) => { if (!transferencia[k]) delete transferencia[k]; });
    const cambios = { negocio, entrega: Object.assign({}, e, { retiro, domicilio }), pago: val('p-texto'), actualizado: Date.now() };
    cambios.transferencia = Object.keys(transferencia).length ? transferencia : F.deleteField();
    const b = ev.currentTarget; cargando(b, true);
    try {
      await F.updateDoc(F.doc(db, 'tiendas', S.slug), cambios);
      Object.assign(S.tienda, cambios); if (!Object.keys(transferencia).length) delete S.tienda.transferencia; else S.tienda.transferencia = transferencia;
      cargando(b, false); aviso('Datos guardados'); pintar();
    } catch (er) { cargando(b, false); fail(mensajeError(er)); }
  };
}

/* ---------- plan ---------- */
function vistaPlan() {
  const v = $('#vista'), actual = (S.tienda.plan || 'basico');
  const lista = (p) => '<ul><li>Hasta ' + p.productos + ' productos</li><li>' + p.fotos + (p.fotos === 1 ? ' foto' : ' fotos') + ' por producto</li><li>Hasta ' + p.categorias + ' categorías</li>' +
    (p.favoritos ? '<li>Favoritos y lista para compartir</li>' : '') + (p.galeria ? '<li>Galería de fotos en cada producto</li>' : '') + (p.comprobante ? '<li>Comprobante del pedido en PDF o imagen</li>' : '') + '</ul>';
  const fotosUsadas = S.productos.reduce((s, x) => s + (x.imagenes || []).filter((im) => typeof im === 'string').length, 0);
  v.innerHTML = '<div class="cab"><h2>Mi plan</h2></div>' +
    '<div class="tarjeta">' + usoHTML(S.productos.length, plan().productos, 'Productos') + usoHTML(S.tienda.categorias.length, plan().categorias, 'Categorías') +
    '<p class="nota">Tienes ' + fotosUsadas + ' fotos en tus productos. Cada foto se achica sola al subirla para que la tienda cargue rápido.</p></div>' +
    '<div class="planes" style="margin-top:12px">' + Object.keys(PLANES).map((k) => '<div class="plan' + (k === actual ? ' actual' : '') + '"><h3>' + esc(PLANES[k].nombre) + '</h3><b class="num">' + esc(PLANES[k].precio) + '</b>' +
      (k === actual ? ' <span class="insignia">Tu plan</span>' : '') + lista(PLANES[k]) + '</div>').join('') + '</div>' +
    '<p style="margin-top:16px"><a class="btn" href="https://wa.me/' + WA_BROTE + '?text=' + encodeURIComponent('Hola, quiero cambiar el plan de mi tienda ' + ((S.tienda.negocio || {}).nombre || S.slug) + '.') + '" target="_blank" rel="noopener">Cambiar de plan por WhatsApp</a></p>';
}

/* ---------- superadministrador ---------- */
function vistaAdmin() {
  const v = $('#vista'), t = S.tienda;
  v.innerHTML = '<div class="cab"><h2>Superadmin</h2></div>' +
    (t ? '<div class="tarjeta"><h3>' + esc((t.negocio || {}).nombre || S.slug) + ' <small style="color:var(--muted)">/' + esc(S.slug) + '</small></h3><div class="campos">' +
      '<label class="campo"><span>Plan</span><select id="a-plan">' + Object.keys(PLANES).map((k) => '<option value="' + k + '"' + (t.plan === k ? ' selected' : '') + '>' + esc(PLANES[k].nombre) + '</option>').join('') + '</select>' +
      '<small>Bajar de plan no borra productos, pero no se podrán agregar más hasta quedar bajo el límite.</small></label>' +
      '<div class="campo"><span>Correos con acceso a esta tienda</span><div class="lista-ed" id="a-duenos"></div></div>' +
      '<div class="dos"><label class="campo"><span>Correo del cliente</span><input id="a-correo" type="email" placeholder="cliente@correo.cl"></label>' +
      '<label class="campo"><span>Contraseña inicial</span><input id="a-clave" placeholder="Mínimo 6 caracteres"><small>Si el correo ya tiene cuenta, deja esto vacío.</small></label></div>' +
      '<p style="margin:0"><button class="btn btn-prim btn-chico" id="a-dar">Dar acceso</button></p>' +
      '<p style="margin:0"><button class="btn btn-chico" id="a-exportar">Descargar respaldo (tienda.json)</button></p></div></div>' : '') +
    '<div class="tarjeta"><h3>Pasar una tienda a Firebase</h3><div class="campos">' +
    '<p class="nota">Copia una tienda que hoy vive en <code>/tiendas/&lt;slug&gt;/tienda.json</code>. Si ya existe en Firebase, se reemplaza.</p>' +
    '<div class="dos"><label class="campo"><span>Slug de la tienda</span><input id="i-slug" placeholder="dulces-y-helados"></label>' +
    '<label class="campo"><span>Plan</span><select id="i-plan"><option value="">El del archivo</option>' + Object.keys(PLANES).map((k) => '<option value="' + k + '">' + esc(PLANES[k].nombre) + '</option>').join('') + '</select></label></div>' +
    '<p style="margin:0"><button class="btn btn-prim btn-chico" id="i-importar">Importar tienda</button></p><p class="error" id="i-err" hidden></p></div></div>';
  if (t) {
    const dibDuenos = () => {
      $('#a-duenos', v).innerHTML = (S.acceso.duenos || []).map((c, i) => '<div class="it"><input value="' + esc(c) + '" readonly><button class="icono" data-quita="' + i + '" aria-label="Quitar acceso" style="color:var(--danger)">' + I.borrar + '</button></div>').join('') || '<p class="nota">Nadie más tiene acceso todavía.</p>';
      $$('[data-quita]', v).forEach((b) => { b.onclick = async () => {
        const lista = (S.acceso.duenos || []).slice(); lista.splice(+b.dataset.quita, 1);
        try { await F.setDoc(F.doc(db, 'tiendas', S.slug, 'privado', 'acceso'), { duenos: lista }); S.acceso.duenos = lista; dibDuenos(); aviso('Acceso quitado'); }
        catch (e) { aviso(mensajeError(e), true); }
      }; });
    };
    dibDuenos();
    $('#a-plan', v).onchange = async (ev) => {
      try { await F.updateDoc(F.doc(db, 'tiendas', S.slug), { plan: ev.target.value }); S.tienda.plan = ev.target.value; aviso('Plan actualizado a ' + PLANES[ev.target.value].nombre); pintar(); }
      catch (e) { aviso(mensajeError(e), true); }
    };
    $('#a-dar', v).onclick = async (ev) => {
      const correo = $('#a-correo', v).value.trim().toLowerCase(), clave = $('#a-clave', v).value;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) { aviso('Escribe un correo válido', true); return; }
      const b = ev.currentTarget; cargando(b, true, 'Creando…');
      try {
        if (clave) {
          // Se crea la cuenta en una instancia aparte para no cerrar la sesión del administrador.
          const sec = window.__app.m.initializeApp(CFG, 'alta-' + Date.now());
          const authSec = A.getAuth(sec);
          if (CFG.emulador) A.connectAuthEmulator(authSec, 'http://' + (CFG.emulador.auth || 'localhost:9099'), { disableWarnings: true });
          await A.createUserWithEmailAndPassword(authSec, correo, clave);
          await A.signOut(authSec);
        }
        const lista = Array.from(new Set((S.acceso.duenos || []).concat(correo)));
        await F.setDoc(F.doc(db, 'tiendas', S.slug, 'privado', 'acceso'), { duenos: lista });
        S.acceso.duenos = lista; cargando(b, false); dibDuenos();
        $('#a-correo', v).value = ''; $('#a-clave', v).value = '';
        aviso(clave ? 'Cuenta creada y acceso dado' : 'Acceso dado');
      } catch (e) { cargando(b, false); aviso(mensajeError(e), true); }
    };
    $('#a-exportar', v).onclick = () => {
      const datos = Object.assign({}, S.tienda, { slug: S.slug, productos: S.productos.map(datosProducto) });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }));
      a.download = S.slug + '-tienda.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    };
  }
  $('#i-slug', v).value = S.slug || '';
  $('#i-importar', v).onclick = async (ev) => {
    const err = $('#i-err', v); err.hidden = true;
    const slug = $('#i-slug', v).value.trim().toLowerCase();
    if (!/^[a-z0-9-]+$/.test(slug)) { err.textContent = 'Escribe un slug válido (letras, números y guiones).'; err.hidden = false; return; }
    const b = ev.currentTarget; cargando(b, true, 'Importando…');
    try {
      const r = await fetch('/tiendas/' + slug + '/tienda.json', { cache: 'no-cache' });
      if (!r.ok) throw new Error('No existe /tiendas/' + slug + '/tienda.json');
      const json = await r.json();
      await importarTienda(slug, json, $('#i-plan', v).value);
      if (!S.tiendas.some((x) => x.slug === slug)) S.tiendas.push({ slug, nombre: (json.negocio || {}).nombre || slug });
      aviso('Tienda importada'); S.vista = 'productos'; await abrirTienda(slug);
    } catch (e) { cargando(b, false); err.textContent = mensajeError(e); err.hidden = false; }
  };
}

async function importarTienda(slug, json, planForzado) {
  const t = Object.assign({}, json);
  const productos = t.productos || []; delete t.productos;
  t.slug = slug; t.plan = planForzado || t.plan || 'basico'; t.actualizado = Date.now();
  t.categorias = t.categorias || [];
  const lim = PLANES[t.plan] || PLANES.basico;
  if (productos.length > lim.productos) throw new Error('La tienda tiene ' + productos.length + ' productos y el plan ' + lim.nombre + ' permite ' + lim.productos + '.');
  const muchas = productos.find((p) => (p.imagenes || []).length > lim.fotos);
  if (muchas) throw new Error('"' + muchas.nombre + '" tiene ' + muchas.imagenes.length + ' fotos y el plan ' + lim.nombre + ' permite ' + lim.fotos + '.');
  const viejos = await F.getDocs(F.collection(db, 'tiendas', slug, 'productos')).catch(() => ({ docs: [] }));
  const fotosViejas = await F.getDocs(F.collection(db, 'tiendas', slug, 'imagenes')).catch(() => ({ docs: [] }));
  await F.setDoc(F.doc(db, 'tiendas', slug), t);
  // Firestore acepta hasta 500 escrituras por lote: se envían en tandas.
  const ops = viejos.docs.concat(fotosViejas.docs).map((d) => (l) => l.delete(d.ref))
    .concat(productos.map((p, i) => (l) => l.set(F.doc(db, 'tiendas', slug, 'productos', 's' + String(i).padStart(3, '0')), Object.assign({}, p, { orden: i }))));
  for (let i = 0; i < ops.length; i += 400) { const lote = F.writeBatch(db); ops.slice(i, i + 400).forEach((op) => op(lote)); await lote.commit(); }
  const ac = await F.getDoc(F.doc(db, 'tiendas', slug, 'privado', 'acceso')).catch(() => null);
  if (!ac || !ac.exists()) await F.setDoc(F.doc(db, 'tiendas', slug, 'privado', 'acceso'), { duenos: [] });
}

if (!CFG || !CFG.projectId) sinConfig(); else iniciar();
