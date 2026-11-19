/*
  PedidoListo: motor del catálogo con pedidos por WhatsApp.
  Una sola app sirve a todas las tiendas: /<slug> carga /tiendas/<slug>/tienda.json.
  Sin pago online, sin stock, sin cuentas. El pedido sale como texto a wa.me.
*/
(function () {
  'use strict';

  var SLUG = window.__SLUG;
  var $app = document.getElementById('app');
  var T = null;           // tienda
  var PRO = false;
  var estado = { cat: 'todas', q: '', soloFavs: false, favsCompartidos: null };
  var carrito = [];       // {k, id, opt, qty}
  var favs = [];
  var datos = { entrega: '', comuna: '', direccion: '', nombre: '', comentario: '' };
  var instalador = null;  // evento beforeinstallprompt
  var PREVIEW = /[?&]preview=1/.test(location.search);

  /* ---------- utilidades ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plata(n) { return '$' + Math.round(n).toLocaleString('es-CL'); }
  function guardar(k, v) { try { localStorage.setItem(k + ':' + SLUG, JSON.stringify(v)); } catch (e) {} }
  function leer(k, d) { try { var v = localStorage.getItem(k + ':' + SLUG); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function producto(id) { for (var i = 0; i < T.productos.length; i++) if (T.productos[i].id === id) return T.productos[i]; return null; }
  function categoria(id) { for (var i = 0; i < T.categorias.length; i++) if (T.categorias[i].id === id) return T.categorias[i]; return null; }
  function aviso(txt) {
    var t = document.getElementById('toast'); t.textContent = txt; t.hidden = false;
    clearTimeout(aviso.t); aviso.t = setTimeout(function () { t.hidden = true; }, 2200);
  }
  function imagenes(p) { var im = p.imagenes && p.imagenes.length ? p.imagenes : [{}]; return PRO ? im : im.slice(0, 1); }
  function imagen(p, i, clase) {
    var im = imagenes(p)[i || 0];
    if (typeof im === 'string') return '<img src="' + esc(im) + '" alt="' + esc(p.nombre) + '" loading="lazy"' + (clase ? ' class="' + clase + '"' : '') + '>';
    return window.Arte.svg(im);
  }

  var I = {
    carro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14l-1.4 10.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8z"/><path d="M9 7V6a3 3 0 0 1 6 0v1"/></svg>',
    mas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    lupa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    corazon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7.2 3.8 4 7.2 4c2 0 3.4 1.1 4.8 2.8C13.4 5.1 14.8 4 16.8 4c3.4 0 5.6 3.2 4.4 6.6C19.5 15.4 12 20 12 20z"/></svg>',
    luna: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
    sol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    instalar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/></svg>',
    cerrar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    compartir: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
    reloj: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    camion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/></svg>',
    tienda: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v9h16v-9M3 5h18l-1.5 5h-15z"/><path d="M10 19v-5h4v5"/></svg>',
    insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2a9.7 9.7 0 0 0-8.3 14.8L2.4 21.7l4.8-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8 1c-.1.2-.3.2-.5.1a6.5 6.5 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.8 2c0 1.2.9 2.3 1 2.5.1.2 1.7 2.6 4.2 3.6 1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.5-.3z"/></svg>',
    descargar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14"/></svg>',
    imagen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg>'
  };

  /* ---------- tema ---------- */
  var FUENTES = {
    'Cormorant Garamond': 'Cormorant+Garamond:wght@500;600;700', 'Manrope': 'Manrope:wght@400;500;600;700',
    'Outfit': 'Outfit:wght@400;500;600;700;800', 'Fraunces': 'Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700',
    'Inter': 'Inter:wght@400;500;600;700', 'DM Serif Display': 'DM+Serif+Display', 'Poppins': 'Poppins:wght@400;500;600;700',
    'Playfair Display': 'Playfair+Display:wght@500;600;700', 'Nunito': 'Nunito:wght@400;600;700;800', 'Space Grotesk': 'Space+Grotesk:wght@400;500;600;700'
  };
  function cargarFuentes(lista) {
    var fam = lista.filter(function (f, i) { return FUENTES[f] && lista.indexOf(f) === i; }).map(function (f) { return 'family=' + FUENTES[f]; });
    if (!fam.length) return;
    var href = 'https://fonts.googleapis.com/css2?' + fam.join('&') + '&display=swap';
    var l = document.getElementById('fuentes');
    if (!l) { l = document.createElement('link'); l.id = 'fuentes'; l.rel = 'stylesheet'; document.head.appendChild(l); }
    if (l.href !== href) l.href = href;
  }
  function vars(p) {
    var s = '';
    Object.keys(p).forEach(function (k) { s += '--' + k + ':' + p[k] + ';'; });
    return s;
  }
  function aplicarTema() {
    var t = T.tema || {};
    cargarFuentes([t.fuenteTitulos, t.fuenteTexto]);
    var base = '--font-t:"' + (t.fuenteTitulos || 'Georgia') + '", Georgia, serif;--font-b:"' + (t.fuenteTexto || 'Inter') + '", system-ui, sans-serif;' +
      '--radio:' + (t.radio == null ? 16 : t.radio) + 'px;--peso-t:' + (t.pesoTitulos || 600) + ';--tracking-t:' + (t.trackingTitulos || '-0.01em') + ';';
    var claro = vars(t.claro || {}) + 'color-scheme:light;';
    var oscuro = vars(t.oscuro || {}) + 'color-scheme:dark;--sombra:0 14px 40px rgba(0,0,0,.45);';
    var css = ':root{' + base + claro + '}' +
      '@media (prefers-color-scheme: dark){:root:not([data-modo="claro"]){' + oscuro + '}}' +
      ':root[data-modo="oscuro"]{' + oscuro + '}';
    var st = document.getElementById('tema');
    if (!st) { st = document.createElement('style'); st.id = 'tema'; document.head.appendChild(st); }
    st.textContent = css;
    if (!document.documentElement.dataset.modo && t.modoInicial && t.modoInicial !== 'auto') document.documentElement.dataset.modo = t.modoInicial;
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = modoActual() === 'oscuro' ? ((t.oscuro || {}).bg || '#111') : ((t.claro || {}).bg || '#fff');
  }
  function modoActual() {
    var d = document.documentElement.dataset.modo;
    if (d) return d;
    return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  }
  function cambiarModo() {
    var nuevo = modoActual() === 'oscuro' ? 'claro' : 'oscuro';
    document.documentElement.dataset.modo = nuevo;
    try { localStorage.setItem('modo:' + SLUG, nuevo); } catch (e) {}
    aplicarTema(); pintarBarra();
  }

  /* ---------- carga ---------- */
  function iniciar() {
    if (!SLUG) { location.replace('/'); return; }
    fetch('/tiendas/' + SLUG + '/tienda.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('404'); return r.json(); })
      .then(function (t) {
        T = t; PRO = T.plan === 'pro';
        document.title = T.negocio.nombre;
        carrito = leer('carrito', []).filter(function (l) { return producto(l.id); });
        favs = leer('favs', []);
        datos = Object.assign(datos, leer('datos', {}));
        if (!datos.entrega) datos.entrega = T.entrega.retiro && T.entrega.retiro.activo ? 'retiro' : 'domicilio';
        aplicarTema();
        ruta();
        window.addEventListener('hashchange', ruta);
      })
      .catch(function () {
        $app.innerHTML = '<div class="cargando"><div style="text-align:center;padding:24px"><b style="font-size:20px;display:block;margin-bottom:6px">No encontramos esta tienda</b>' +
          '<span>Revisa la dirección o vuelve al <a href="/">inicio</a>.</span></div></div>';
      });
  }

  function ruta() {
    var h = location.hash.slice(1);
    cerrarPaneles(true);
    if (h.indexOf('pedido=') === 0) { pintarComprobante(h.slice(7)); return; }
    if (!document.getElementById('catalogo')) pintarCatalogo();
    if (h.indexOf('favs=') === 0 && PRO) {
      estado.favsCompartidos = h.slice(5).split(',').filter(producto);
      estado.soloFavs = true; pintarFiltros(); pintarGrid();
    }
    if (h.indexOf('p=') === 0) { var p = producto(decodeURIComponent(h.slice(2))); if (p) abrirFicha(p); }
  }

  /* ---------- catálogo ---------- */
  function pintarCatalogo() {
    var est = T.estructura || {};
    $app.innerHTML =
      (T.demo && !PREVIEW ? '<div class="demo-aviso">Tienda de demostración: los pedidos llegan al WhatsApp de PedidoListo. <a href="/">Crea la tuya con PedidoListo</a></div>' : '') +
      '<div class="barra" id="barra"></div>' +
      '<header class="portada ' + (est.portada || 'dividido') + '" id="portada"></header>' +
      '<div class="filtros" id="filtros"></div>' +
      '<main class="catalogo" id="catalogo"><div class="wrap" id="grid"></div></main>' +
      '<footer class="pie-tienda"><div class="wrap"><span>© ' + new Date().getFullYear() + ' ' + esc(T.negocio.nombre) + '. ' + esc(T.pago || '') + '</span>' +
      '<span>Catálogo hecho con <a href="/">PedidoListo</a></span></div></footer>' +
      '<div class="flotante" id="flotante"></div>';
    pintarBarra(); pintarPortada(); pintarFiltros(); pintarGrid(); pintarFlotante();
  }

  function logoHTML() {
    var n = T.negocio;
    if (n.logo) return n.logo.trim().indexOf('<svg') === 0 ? n.logo : '<img src="' + esc(n.logo) + '" alt="">';
    return esc((n.nombre || '?').slice(0, 1));
  }

  function pintarBarra() {
    var b = document.getElementById('barra'); if (!b) return;
    var cuenta = carrito.reduce(function (s, l) { return s + l.qty; }, 0);
    var mostrarInstalar = (instalador || esIOS()) && !enModoApp();
    b.innerHTML = '<div class="wrap">' +
      '<a class="marca" href="#"><span class="logo">' + logoHTML() + '</span><b>' + esc(T.negocio.nombre) + '</b></a>' +
      '<div class="acciones">' +
      (mostrarInstalar ? '<button class="btn-instalar" id="b-instalar" aria-label="Instalar app">' + I.instalar + '<span>Instalar app</span></button>' : '') +
      '<button class="icono" id="b-modo" aria-label="' + (modoActual() === 'oscuro' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro') + '">' + (modoActual() === 'oscuro' ? I.sol : I.luna) + '</button>' +
      '<button class="icono" id="b-carro" aria-label="Ver pedido (' + cuenta + ' productos)">' + I.carro + (cuenta ? '<span class="burbuja num">' + cuenta + '</span>' : '') + '</button>' +
      '</div></div>';
    b.querySelector('#b-modo').onclick = cambiarModo;
    b.querySelector('#b-carro').onclick = abrirCarrito;
    var bi = b.querySelector('#b-instalar'); if (bi) bi.onclick = instalar;
  }

  function datosNegocio() {
    var n = T.negocio, e = T.entrega, items = [];
    if (n.horario) items.push('<li>' + I.reloj + '<span>' + esc(n.horario) + '</span></li>');
    if (e.domicilio && e.domicilio.activo) {
      var min = Math.min.apply(null, e.domicilio.comunas.map(function (c) { return c.costo; }));
      items.push('<li>' + I.camion + '<span>Envío a domicilio desde <b>' + plata(min) + '</b>' + (e.domicilio.gratisDesde ? ', gratis sobre ' + plata(e.domicilio.gratisDesde) : '') + '</span></li>');
    }
    if (e.retiro && e.retiro.activo) items.push('<li>' + I.tienda + '<span>Retiro en ' + esc(e.retiro.lugar || 'tienda') + '</span></li>');
    if (n.instagram) items.push('<li>' + I.insta + '<a href="https://instagram.com/' + esc(n.instagram.replace('@', '')) + '" target="_blank" rel="noopener">' + esc(n.instagram) + '</a></li>');
    return '<ul class="datos">' + items.join('') + '</ul>';
  }

  function pintarPortada() {
    var h = document.getElementById('portada'), b = T.banner || {}, est = (T.estructura || {}).portada || 'dividido';
    h.className = 'portada ' + est;
    var cta = '<div class="cta"><a class="btn btn-acento" href="#catalogo">' + esc(b.boton || 'Ver productos') + '</a></div>';
    if (est === 'centrado') {
      h.innerHTML = '<div class="wrap"><div class="fantasma" aria-hidden="true">' + esc(b.fantasma || T.negocio.nombre) + '</div><div class="raya"></div>' +
        '<h1>' + esc(b.titulo || T.negocio.nombre) + '</h1><p class="bajada">' + esc(b.texto || T.negocio.bajada || '') + '</p>' + cta + datosNegocio() + '</div>';
    } else if (est === 'simple') {
      h.innerHTML = '<div class="wrap"><h1>' + esc(b.titulo || T.negocio.nombre) + '</h1><p class="bajada">' + esc(b.texto || T.negocio.bajada || '') + '</p>' + datosNegocio() + '</div>';
    } else {
      var arte = typeof b.imagen === 'string' ? '<img src="' + esc(b.imagen) + '" alt="" style="width:100%;height:100%;object-fit:cover">' : window.Arte.svg(b.imagen || {});
      h.innerHTML = '<div class="wrap"><div><h1>' + esc(b.titulo || T.negocio.nombre) + '</h1><p class="bajada">' + esc(b.texto || T.negocio.bajada || '') + '</p>' + cta + datosNegocio() + '</div>' +
        '<div class="arte">' + arte + '</div></div>';
    }
  }

  function pintarFiltros() {
    var f = document.getElementById('filtros'); if (!f) return;
    var chips = '<button class="chip" data-cat="todas" aria-pressed="' + (estado.cat === 'todas' && !estado.soloFavs) + '">Todo</button>' +
      T.categorias.map(function (c) { return '<button class="chip" data-cat="' + esc(c.id) + '" aria-pressed="' + (estado.cat === c.id && !estado.soloFavs) + '">' + esc(c.nombre) + '</button>'; }).join('') +
      (PRO ? '<button class="chip" data-favs="1" aria-pressed="' + estado.soloFavs + '">' + I.corazon + 'Favoritos' + (favs.length ? ' (' + favs.length + ')' : '') + '</button>' : '');
    f.innerHTML = '<div class="wrap"><div class="chips" role="toolbar" aria-label="Categorías">' + chips + '</div>' +
      '<div class="buscar">' + I.lupa + '<label class="sr" for="q">Buscar productos</label><input id="q" type="search" placeholder="Buscar productos" value="' + esc(estado.q) + '" autocomplete="off"></div></div>';
    f.querySelectorAll('.chip').forEach(function (c) {
      c.onclick = function () {
        if (c.dataset.favs) { estado.soloFavs = !estado.soloFavs; estado.favsCompartidos = null; }
        else { estado.cat = c.dataset.cat; estado.soloFavs = false; estado.favsCompartidos = null; }
        pintarFiltros(); pintarGrid();
      };
    });
    var q = f.querySelector('#q');
    q.oninput = function () { estado.q = q.value; pintarGrid(); };
  }

  function normal(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  function tarjeta(p) {
    var agotado = p.disponible === false, fav = favs.indexOf(p.id) >= 0;
    return '<article class="card">' +
      (agotado ? '<span class="etiqueta agotado">Agotado</span>' : p.etiqueta ? '<span class="etiqueta">' + esc(p.etiqueta) + '</span>' : '') +
      (PRO ? '<button class="corazon" data-fav="' + esc(p.id) + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Quitar de favoritos' : 'Agregar a favoritos') + '">' + I.corazon + '</button>' : '') +
      '<button class="foto" data-ver="' + esc(p.id) + '" aria-label="Ver ' + esc(p.nombre) + '">' + imagen(p, 0) + '</button>' +
      '<div class="cuerpo"><h3><button data-ver="' + esc(p.id) + '">' + esc(p.nombre) + '</button></h3>' +
      ((T.estructura || {}).descripcion !== false ? '<p class="desc">' + esc(p.descripcion || '') + '</p>' : '') +
      '<div class="pie"><span class="precio num">' + plata(p.precio) + (p.precioAntes ? '<s>' + plata(p.precioAntes) + '</s>' : '') + '</span>' +
      '<button class="mas" data-add="' + esc(p.id) + '" ' + (agotado ? 'disabled aria-label="Agotado"' : 'aria-label="Agregar ' + esc(p.nombre) + '"') + '>' + I.mas + '</button></div></div></article>';
  }

  function pintarGrid() {
    var g = document.getElementById('grid'); if (!g) return;
    var est = T.estructura || {}, q = normal(estado.q.trim());
    var lista = T.productos.filter(function (p) {
      if (estado.soloFavs) { var base = estado.favsCompartidos || favs; if (base.indexOf(p.id) < 0) return false; }
      else if (estado.cat !== 'todas' && p.categoria !== estado.cat) return false;
      if (q && normal(p.nombre + ' ' + (p.descripcion || '')).indexOf(q) < 0) return false;
      return true;
    });
    var estilo = est.tarjetas || 'tarjeta';
    var gridAttr = ' class="grid ' + estilo + '" style="--cols-m:' + ((est.columnas || {}).movil || 2) + ';--cols-d:' + ((est.columnas || {}).escritorio || 4) + '"';
    var html = '';
    if (!lista.length) {
      html = '<div class="vacio"><b>' + (estado.soloFavs ? 'Aún no tienes favoritos' : 'No encontramos productos') + '</b>' +
        (estado.soloFavs ? 'Toca el corazón de un producto para guardarlo aquí.' : 'Prueba con otra palabra o categoría.') + '</div>';
    } else if (estado.soloFavs) {
      html = '<h2 class="seccion-titulo">' + (estado.favsCompartidos ? 'Lista compartida contigo' : 'Tus favoritos') + ' <span>' + lista.length + '</span></h2>' +
        '<div' + gridAttr + '>' + lista.map(tarjeta).join('') + '</div>' +
        (!estado.favsCompartidos ? '<p style="margin-top:16px"><button class="btn btn-borde" id="compartir-favs">' + I.compartir + 'Compartir mi lista</button></p>' : '');
    } else if (estado.cat === 'todas' && !q) {
      T.categorias.forEach(function (c) {
        var ps = lista.filter(function (p) { return p.categoria === c.id; });
        if (ps.length) html += '<h2 class="seccion-titulo">' + esc(c.nombre) + ' <span>' + ps.length + '</span></h2><div' + gridAttr + '>' + ps.map(tarjeta).join('') + '</div>';
      });
    } else {
      html = '<h2 class="seccion-titulo">' + (q ? 'Resultados' : esc((categoria(estado.cat) || {}).nombre || '')) + ' <span>' + lista.length + '</span></h2><div' + gridAttr + '>' + lista.map(tarjeta).join('') + '</div>';
    }
    g.innerHTML = html;
    g.querySelectorAll('[data-ver]').forEach(function (b) { b.onclick = function () { location.hash = 'p=' + encodeURIComponent(b.dataset.ver); }; });
    g.querySelectorAll('[data-add]').forEach(function (b) {
      b.onclick = function () {
        var p = producto(b.dataset.add);
        if (p.opciones && p.opciones.length) { location.hash = 'p=' + encodeURIComponent(p.id); return; }
        agregar(p.id, null, 1); aviso('Agregado: ' + p.nombre);
      };
    });
    g.querySelectorAll('[data-fav]').forEach(function (b) { b.onclick = function () { alternarFav(b.dataset.fav); }; });
    var cf = document.getElementById('compartir-favs'); if (cf) cf.onclick = compartirFavs;
  }

  function alternarFav(id) {
    var i = favs.indexOf(id);
    if (i >= 0) favs.splice(i, 1); else { favs.push(id); aviso('Guardado en favoritos'); }
    guardar('favs', favs); pintarFiltros(); pintarGrid();
    var fb = document.querySelector('.panel [data-fav-ficha]');
    if (fb) { var on = favs.indexOf(id) >= 0; fb.setAttribute('aria-pressed', on); fb.lastChild.textContent = on ? 'En favoritos' : 'Favorito'; }
  }

  function compartir(titulo, texto, url) {
    if (navigator.share) { navigator.share({ title: titulo, text: texto, url: url }).catch(function () {}); return; }
    copiar(url, 'Enlace copiado');
  }
  function copiar(txt, msg) {
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { aviso(msg); }, function () { aviso('No se pudo copiar'); });
    else aviso('No se pudo copiar');
  }
  function urlBase() { return location.origin + '/' + SLUG; }
  function compartirFavs() {
    compartir(T.negocio.nombre, 'Mira mi lista de favoritos en ' + T.negocio.nombre, urlBase() + '#favs=' + favs.join(','));
  }

  /* ---------- ficha de producto ---------- */
  function abrirFicha(p) {
    var ims = imagenes(p), sel = 0, qty = 1, opt = p.opciones && p.opciones.length ? 0 : null, fav = favs.indexOf(p.id) >= 0;
    var agotado = p.disponible === false;
    var cont = abrirPanel('centro', p.nombre,
      '<div class="ficha"><div class="galeria"><div class="principal" id="principal">' + imagen(p, 0) + '</div>' +
      (ims.length > 1 ? '<div class="miniaturas">' + ims.map(function (_, i) { return '<button data-i="' + i + '" aria-label="Imagen ' + (i + 1) + '" aria-current="' + (i === 0) + '">' + imagen(p, i) + '</button>'; }).join('') + '</div>' : '') +
      '</div><div class="info">' +
      '<span class="cat">' + esc((categoria(p.categoria) || {}).nombre || '') + '</span>' +
      '<h2>' + esc(p.nombre) + '</h2>' +
      '<span class="precio num">' + plata(p.precio) + (p.precioAntes ? '<s>' + plata(p.precioAntes) + '</s>' : '') + '</span>' +
      '<p class="texto">' + esc(p.detalle || p.descripcion || '') + '</p>' +
      (opt !== null ? '<fieldset class="opciones"><legend>' + esc(p.tituloOpciones || 'Elige una opción') + '</legend>' + p.opciones.map(function (o, i) {
        return '<label><input type="radio" name="opt" value="' + i + '"' + (i === 0 ? ' checked' : '') + '><span>' + esc(o) + '</span></label>';
      }).join('') + '</fieldset>' : '') +
      '<div class="fila-add"><div class="cantidad" aria-label="Cantidad"><button data-q="-1" aria-label="Menos">−</button><output id="qty" class="num">1</output><button data-q="1" aria-label="Más">+</button></div>' +
      '<button class="btn btn-acento" id="add-ficha"' + (agotado ? ' disabled' : '') + '>' + (agotado ? 'Agotado' : I.carro + 'Agregar al pedido') + '</button></div>' +
      '<div class="secundarias"><button class="btn btn-borde" id="share-ficha">' + I.compartir + 'Compartir</button>' +
      (PRO ? '<button class="btn btn-borde" data-fav-ficha aria-pressed="' + fav + '">' + I.corazon + '<span>' + (fav ? 'En favoritos' : 'Favorito') + '</span></button>' : '') + '</div>' +
      '</div></div>', true);
    cont.querySelectorAll('.miniaturas button').forEach(function (b) {
      b.onclick = function () {
        sel = +b.dataset.i; cont.querySelector('#principal').innerHTML = imagen(p, sel);
        cont.querySelectorAll('.miniaturas button').forEach(function (x) { x.setAttribute('aria-current', x === b); });
      };
    });
    cont.querySelectorAll('[data-q]').forEach(function (b) {
      b.onclick = function () { qty = Math.max(1, Math.min(99, qty + +b.dataset.q)); cont.querySelector('#qty').textContent = qty; };
    });
    cont.querySelectorAll('input[name="opt"]').forEach(function (r) { r.onchange = function () { opt = +r.value; }; });
    cont.querySelector('#add-ficha').onclick = function () {
      agregar(p.id, opt, qty); aviso('Agregado: ' + qty + ' × ' + p.nombre); history.back();
    };
    cont.querySelector('#share-ficha').onclick = function () {
      compartir(p.nombre, p.nombre + ' en ' + T.negocio.nombre + ': ' + plata(p.precio), urlBase() + '#p=' + encodeURIComponent(p.id));
    };
    var fb = cont.querySelector('[data-fav-ficha]'); if (fb) fb.onclick = function () { alternarFav(p.id); };
  }

  /* ---------- paneles ---------- */
  function abrirPanel(tipo, titulo, html, sinCabecera, pie) {
    cerrarPaneles(true);
    var f = document.createElement('div'); f.className = 'fondo-panel'; f.dataset.panel = '1';
    var p = document.createElement('div'); p.className = 'panel ' + tipo; p.dataset.panel = '1';
    p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-label', titulo);
    p.innerHTML = (sinCabecera ? '<button class="icono cerrar-ficha" aria-label="Cerrar">' + I.cerrar + '</button>' :
      '<header><h2>' + esc(titulo) + '</h2><button class="icono" aria-label="Cerrar">' + I.cerrar + '</button></header>') +
      (sinCabecera ? html : '<div class="contenido">' + html + '</div>') + (pie ? '<footer>' + pie + '</footer>' : '');
    document.body.appendChild(f); document.body.appendChild(p);
    document.body.style.overflow = 'hidden';
    var cerrar = function () { if (location.hash) history.back(); else cerrarPaneles(); };
    f.onclick = cerrar;
    p.querySelector('[aria-label="Cerrar"]').onclick = cerrar;
    p.querySelector('[aria-label="Cerrar"]').focus({ preventScroll: true });
    return p;
  }
  function cerrarPaneles(silencioso) {
    document.querySelectorAll('[data-panel]').forEach(function (n) { n.remove(); });
    document.body.style.overflow = '';
    if (!silencioso) pintarFlotante();
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.querySelector('[data-panel]')) { if (location.hash) history.back(); else cerrarPaneles(); }
  });

  /* ---------- carrito ---------- */
  function agregar(id, opt, qty) {
    var k = id + '|' + (opt == null ? '' : opt);
    var l = carrito.filter(function (x) { return x.k === k; })[0];
    if (l) l.qty = Math.min(99, l.qty + qty); else carrito.push({ k: k, id: id, opt: opt, qty: qty });
    guardar('carrito', carrito); pintarBarra(); pintarFlotante();
  }
  function subtotal() { return carrito.reduce(function (s, l) { return s + producto(l.id).precio * l.qty; }, 0); }
  function costoEnvio(sub) {
    if (datos.entrega !== 'domicilio') return 0;
    var d = T.entrega.domicilio; if (d.gratisDesde && sub >= d.gratisDesde) return 0;
    var c = d.comunas.filter(function (x) { return x.nombre === datos.comuna; })[0];
    return c ? c.costo : null;
  }

  function pintarFlotante() {
    var f = document.getElementById('flotante'); if (!f) return;
    var n = carrito.reduce(function (s, l) { return s + l.qty; }, 0);
    if (!n || document.querySelector('[data-panel]')) { f.innerHTML = ''; return; }
    f.innerHTML = '<button id="b-flot"><span><span class="cuenta num">' + n + '</span>&nbsp; Ver pedido</span><span class="num">' + plata(subtotal()) + '</span></button>';
    f.querySelector('#b-flot').onclick = abrirCarrito;
  }

  function abrirCarrito() {
    var e = T.entrega;
    var p = abrirPanel('lateral', 'Tu pedido', '<div id="lineas"></div><div id="form-datos"></div>', false, '<div id="pie-carro"></div>');
    p.querySelector('[aria-label="Cerrar"]').onclick = function () { cerrarPaneles(); };
    p.previousSibling.onclick = function () { cerrarPaneles(); };
    pintarLineas(p); pintarDatos(p); pintarPie(p);
  }

  function pintarLineas(p) {
    var box = p.querySelector('#lineas');
    if (!carrito.length) {
      box.innerHTML = '<div class="vacio"><b>Tu pedido está vacío</b>Agrega productos desde el catálogo.</div>';
      p.querySelector('#form-datos').innerHTML = ''; return;
    }
    box.innerHTML = carrito.map(function (l, i) {
      var pr = producto(l.id);
      return '<div class="linea"><div class="mini">' + imagen(pr, 0) + '</div><div><b>' + esc(pr.nombre) + '</b>' +
        (l.opt != null ? '<small>' + esc(pr.opciones[l.opt]) + '</small><br>' : '') + '<small class="num">' + plata(pr.precio) + ' c/u</small></div>' +
        '<div class="der"><span class="num" style="font-weight:600">' + plata(pr.precio * l.qty) + '</span>' +
        '<div class="cantidad chica"><button data-l="' + i + '" data-d="-1" aria-label="Menos">−</button><output class="num">' + l.qty + '</output><button data-l="' + i + '" data-d="1" aria-label="Más">+</button></div></div></div>';
    }).join('');
    box.querySelectorAll('[data-l]').forEach(function (b) {
      b.onclick = function () {
        var l = carrito[+b.dataset.l]; l.qty += +b.dataset.d;
        if (l.qty <= 0) carrito.splice(+b.dataset.l, 1);
        guardar('carrito', carrito); pintarBarra(); pintarLineas(p); pintarPie(p);
        if (!carrito.length) pintarPie(p);
      };
    });
  }

  function pintarDatos(p) {
    if (!carrito.length) return;
    var e = T.entrega, r = e.retiro || {}, d = e.domicilio || {};
    var html = '<div class="campos"><h3>¿Cómo quieres recibirlo?</h3><div class="entrega" role="radiogroup" aria-label="Forma de entrega">' +
      (r.activo ? '<label><input type="radio" name="entrega" value="retiro"' + (datos.entrega === 'retiro' ? ' checked' : '') + '><span class="op">' + I.tienda + '<b>Ir a retirar</b><small>' + esc(r.lugar || '') + '</small></span></label>' : '') +
      (d.activo ? '<label><input type="radio" name="entrega" value="domicilio"' + (datos.entrega === 'domicilio' ? ' checked' : '') + '><span class="op">' + I.camion + '<b>Envío a domicilio</b><small>' + (d.gratisDesde ? 'Gratis sobre ' + plata(d.gratisDesde) : 'Según comuna') + '</small></span></label>' : '') +
      '</div>' +
      '<div id="detalle-entrega"></div>' +
      '<div class="campo"><label for="f-nombre">Tu nombre</label><input id="f-nombre" autocomplete="name" value="' + esc(datos.nombre) + '" placeholder="Nombre y apellido"></div>' +
      '<div class="campo"><label for="f-com">Comentario (opcional)</label><textarea id="f-com" placeholder="Ej: es para regalo, llamar antes de llegar">' + esc(datos.comentario) + '</textarea></div>' +
      (T.pago ? '<p class="nota">' + esc(T.pago) + '</p>' : '') + '</div>';
    p.querySelector('#form-datos').innerHTML = html;
    var det = function () {
      var box = p.querySelector('#detalle-entrega');
      if (datos.entrega === 'retiro') {
        box.innerHTML = '<p class="nota"><b>Retiro:</b> ' + esc(r.direccion || '') + (r.horario ? '<br><b>Horario:</b> ' + esc(r.horario) : '') + '</p>';
      } else {
        box.innerHTML = '<div class="campos" style="margin-top:0"><div class="campo"><label for="f-comuna">Comuna</label><select id="f-comuna"><option value="">Elige tu comuna</option>' +
          d.comunas.map(function (c) { return '<option' + (c.nombre === datos.comuna ? ' selected' : '') + ' value="' + esc(c.nombre) + '">' + esc(c.nombre) + ' (' + plata(c.costo) + ')</option>'; }).join('') +
          '</select></div><div class="campo"><label for="f-dir">Dirección</label><input id="f-dir" autocomplete="street-address" value="' + esc(datos.direccion) + '" placeholder="Calle, número, depto."></div>' +
          (d.nota ? '<p class="nota">' + esc(d.nota) + '</p>' : '') + '</div>';
        box.querySelector('#f-comuna').onchange = function () { datos.comuna = this.value; guardar('datos', datos); pintarPie(p); };
        box.querySelector('#f-dir').oninput = function () { datos.direccion = this.value; guardar('datos', datos); };
      }
    };
    det();
    p.querySelectorAll('input[name="entrega"]').forEach(function (r) {
      r.onchange = function () { datos.entrega = r.value; guardar('datos', datos); det(); pintarPie(p); };
    });
    p.querySelector('#f-nombre').oninput = function () { datos.nombre = this.value; guardar('datos', datos); };
    p.querySelector('#f-com').oninput = function () { datos.comentario = this.value; guardar('datos', datos); };
  }

  function pintarPie(p) {
    var pie = p.querySelector('#pie-carro');
    if (!carrito.length) { pie.innerHTML = '<button class="btn btn-borde" style="width:100%" id="seguir">Seguir mirando</button>'; pie.querySelector('#seguir').onclick = function () { cerrarPaneles(); }; return; }
    var sub = subtotal(), env = costoEnvio(sub);
    var total = sub + (env || 0);
    pie.innerHTML = '<div class="totales num"><div><span>Subtotal</span><span>' + plata(sub) + '</span></div>' +
      (datos.entrega === 'domicilio' ? '<div><span>Envío</span><span>' + (env === null ? 'Elige comuna' : env === 0 ? 'Gratis' : plata(env)) + '</span></div>' : '<div><span>Retiro</span><span>Sin costo</span></div>') +
      '<div class="total"><span>Total</span><span>' + plata(total) + '</span></div></div>' +
      '<p class="error" id="err" hidden></p>' +
      '<div class="footer-btns"><button class="btn btn-wa" id="enviar">' + I.wa + 'Pedir por WhatsApp</button>' +
      '<button class="btn btn-borde" id="copiar">Copiar mensaje</button></div>';
    pie.querySelector('#enviar').onclick = function () {
      var err = validar(); var el = pie.querySelector('#err');
      if (err) { el.textContent = err; el.hidden = false; return; }
      el.hidden = true;
      window.open('https://wa.me/' + T.negocio.whatsapp + '?text=' + encodeURIComponent(mensaje()), '_blank', 'noopener');
    };
    pie.querySelector('#copiar').onclick = function () {
      var err = validar(); var el = pie.querySelector('#err');
      if (err) { el.textContent = err; el.hidden = false; return; }
      el.hidden = true; copiar(mensaje(), 'Mensaje copiado');
    };
  }

  function validar() {
    if (!datos.nombre.trim()) return 'Escribe tu nombre para enviar el pedido.';
    if (datos.entrega === 'domicilio') {
      if (!datos.comuna) return 'Elige tu comuna para calcular el envío.';
      if (!datos.direccion.trim()) return 'Escribe la dirección de entrega.';
    }
    return '';
  }

  /* ---------- pedido: mensaje y enlace al comprobante ---------- */
  function nroPedido() {
    var c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < 5; i++) s += c[Math.floor(Math.random() * c.length)];
    return s;
  }
  function b64url(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function deb64url(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }

  function mensaje() {
    var m = T.mensaje || {}, sub = subtotal(), env = costoEnvio(sub) || 0, nro = nroPedido();
    var lineas = carrito.map(function (l) {
      var p = producto(l.id);
      return '• ' + l.qty + ' × ' + p.nombre + (l.opt != null ? ' (' + p.opciones[l.opt] + ')' : '') + ': ' + plata(p.precio * l.qty);
    });
    var txt = (m.saludo || 'Hola ' + T.negocio.nombre + ', quiero hacer este pedido:') + '\n\n' +
      '*Pedido ' + nro + '*\n' + lineas.join('\n') + '\n\n' +
      'Subtotal: ' + plata(sub) + '\n' +
      (datos.entrega === 'domicilio' ? 'Envío (' + datos.comuna + '): ' + (env ? plata(env) : 'gratis') + '\n' : '') +
      '*Total: ' + plata(sub + env) + '*\n\n' +
      'Nombre: ' + datos.nombre.trim() + '\n' +
      'Entrega: ' + (datos.entrega === 'domicilio' ? 'Envío a domicilio\nDirección: ' + datos.direccion.trim() + ', ' + datos.comuna : 'Ir a retirar') + '\n' +
      (datos.comentario.trim() ? 'Comentario: ' + datos.comentario.trim() + '\n' : '');
    if (PRO) {
      var pack = { n: nro, f: Date.now(), c: datos.nombre.trim(), e: datos.entrega === 'domicilio' ? 'd' : 'r', co: datos.comuna, d: datos.direccion.trim(), m: datos.comentario.trim(), env: env,
        i: carrito.map(function (l) { return [l.id, l.qty, l.opt == null ? -1 : l.opt, producto(l.id).precio]; }) };
      txt += '\nVer pedido con fotos (PDF o imagen): ' + urlBase() + '#pedido=' + b64url(JSON.stringify(pack)) + '\n';
    }
    txt += '\n' + (m.despedida || '¡Gracias!');
    return txt;
  }

  function pintarComprobante(cod) {
    var o;
    try { o = JSON.parse(deb64url(cod)); } catch (e) { o = null; }
    $app.innerHTML = '<div class="barra" id="barra"></div><main class="comprobante-pagina"><div class="wrap" id="comp"></div></main>';
    pintarBarra();
    var box = document.getElementById('comp');
    if (!o || !o.i) { box.innerHTML = '<div class="vacio"><b>No pudimos leer este pedido</b>El enlace puede estar incompleto. <a href="#">Volver al catálogo</a></div>'; return; }
    var items = o.i.map(function (x) { return { p: producto(x[0]) || { nombre: x[0], opciones: [] }, qty: x[1], opt: x[2], precio: x[3] }; });
    var sub = items.reduce(function (s, x) { return s + x.precio * x.qty; }, 0), total = sub + (o.env || 0);
    var fecha = new Date(o.f).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' });
    box.innerHTML = '<div class="comprobante" id="comprobante"><div class="cab"><div><h1>' + esc(T.negocio.nombre) + '</h1><small>' + esc(fecha) + '</small></div>' +
      '<div class="nro">Pedido<b>' + esc(o.n) + '</b></div></div><div class="cuerpo">' +
      items.map(function (x) {
        return '<div class="linea"><div class="mini">' + (x.p.id ? imagen(x.p, 0) : '') + '</div><div><b>' + esc(x.p.nombre) + '</b>' +
          (x.opt >= 0 && x.p.opciones ? '<small>' + esc(x.p.opciones[x.opt] || '') + '</small><br>' : '') + '<small class="num">' + x.qty + ' × ' + plata(x.precio) + '</small></div>' +
          '<div class="der"><span class="num" style="font-weight:600">' + plata(x.precio * x.qty) + '</span></div></div>';
      }).join('') +
      '<div class="totales num" style="margin-top:12px"><div><span>Subtotal</span><span>' + plata(sub) + '</span></div>' +
      (o.e === 'd' ? '<div><span>Envío (' + esc(o.co) + ')</span><span>' + (o.env ? plata(o.env) : 'Gratis') + '</span></div>' : '') +
      '<div class="total"><span>Total</span><span>' + plata(total) + '</span></div></div>' +
      '<dl><dt>Cliente</dt><dd>' + esc(o.c) + '</dd><dt>Entrega</dt><dd>' + (o.e === 'd' ? 'Envío a domicilio: ' + esc(o.d) + ', ' + esc(o.co) : 'Ir a retirar: ' + esc((T.entrega.retiro || {}).direccion || '')) + '</dd>' +
      (o.m ? '<dt>Comentario</dt><dd>' + esc(o.m) + '</dd>' : '') + '</dl>' +
      (T.pago ? '<p class="nota" style="margin-top:16px">' + esc(T.pago) + '</p>' : '') + '</div></div>' +
      '<div class="comprobante-acciones"><button class="btn btn-acento" id="pdf">' + I.descargar + 'Descargar PDF</button>' +
      '<button class="btn btn-borde" id="img">' + I.imagen + 'Descargar imagen</button><a class="btn btn-borde" href="#">Volver al catálogo</a></div>';
    document.getElementById('pdf').onclick = function () { window.print(); };
    document.getElementById('img').onclick = function () { imagenComprobante(o, items, sub, total, fecha); };
  }

  function imagenComprobante(o, items, sub, total, fecha) {
    var cs = getComputedStyle(document.documentElement);
    var col = function (v, d) { return (cs.getPropertyValue(v) || d).trim() || d; };
    var W = 1080, pad = 70, filaH = 74, H = 420 + items.length * filaH + 260;
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var x = c.getContext('2d');
    var fT = col('--font-t', 'Georgia'), fB = col('--font-b', 'sans-serif');
    x.fillStyle = col('--surface', '#fff'); x.fillRect(0, 0, W, H);
    x.fillStyle = col('--ink', '#111'); x.fillRect(0, 0, W, 220);
    x.fillStyle = col('--bg', '#fff'); x.font = '600 54px ' + fT; x.fillText(T.negocio.nombre, pad, 115);
    x.globalAlpha = .75; x.font = '400 28px ' + fB; x.fillText(fecha, pad, 165); x.globalAlpha = 1;
    x.textAlign = 'right'; x.font = '400 26px ' + fB; x.fillText('Pedido', W - pad, 100);
    x.fillStyle = col('--accent', '#c90'); x.font = '700 44px ' + fB; x.fillText(o.n, W - pad, 150); x.textAlign = 'left';
    var y = 300; x.fillStyle = col('--ink', '#111');
    items.forEach(function (it) {
      x.font = '600 32px ' + fB; x.fillStyle = col('--ink', '#111');
      x.fillText(it.qty + ' × ' + it.p.nombre + (it.opt >= 0 && it.p.opciones && it.p.opciones[it.opt] ? ' (' + it.p.opciones[it.opt] + ')' : ''), pad, y, W - pad * 2 - 220);
      x.textAlign = 'right'; x.fillText(plata(it.precio * it.qty), W - pad, y); x.textAlign = 'left';
      x.strokeStyle = col('--line', '#ddd'); x.beginPath(); x.moveTo(pad, y + 26); x.lineTo(W - pad, y + 26); x.stroke();
      y += filaH;
    });
    y += 20;
    var fila = function (a, b, fuerte) {
      x.font = (fuerte ? '700 40px ' : '400 30px ') + fB; x.fillStyle = col('--ink', '#111');
      x.fillText(a, pad, y); x.textAlign = 'right'; x.fillText(b, W - pad, y); x.textAlign = 'left'; y += fuerte ? 70 : 50;
    };
    fila('Subtotal', plata(sub));
    if (o.e === 'd') fila('Envío (' + o.co + ')', o.env ? plata(o.env) : 'Gratis');
    fila('Total', plata(total), true);
    x.font = '400 28px ' + fB; x.fillStyle = col('--muted', '#666');
    x.fillText('Cliente: ' + o.c, pad, y); y += 42;
    x.fillText(o.e === 'd' ? 'Envío a: ' + o.d + ', ' + o.co : 'Ir a retirar', pad, y, W - pad * 2);
    c.toBlob(function (blob) {
      var archivo = new File([blob], 'pedido-' + o.n + '.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
        navigator.share({ files: [archivo], title: 'Pedido ' + o.n }).catch(function () {});
      } else {
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = archivo.name; a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      }
    }, 'image/png');
  }

  /* ---------- instalar como app ---------- */
  function esIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream; }
  function enModoApp() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); instalador = e; if (T) pintarBarra(); });
  window.addEventListener('appinstalled', function () { instalador = null; aviso('App instalada'); if (T) pintarBarra(); });
  function instalar() {
    if (instalador) { instalador.prompt(); instalador.userChoice.finally(function () { instalador = null; pintarBarra(); }); return; }
    if (esIOS()) {
      var d = document.createElement('div'); d.className = 'ios-tip'; d.setAttribute('role', 'dialog');
      d.innerHTML = '<b>Instala ' + esc(T.negocio.nombre) + ' en tu iPhone</b>Toca el botón Compartir de Safari y luego "Agregar a pantalla de inicio".' +
        '<div style="margin-top:10px"><button class="btn btn-borde">Entendido</button></div>';
      d.querySelector('button').onclick = function () { d.remove(); };
      document.body.appendChild(d);
    }
  }
  if ('serviceWorker' in navigator && !PREVIEW) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }

  /* ---------- vista previa del personalizador ---------- */
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin || !e.data || e.data.tipo !== 'brota-tema' || !T) return;
    if (e.data.tema) T.tema = e.data.tema;
    if (e.data.estructura) T.estructura = e.data.estructura;
    if (e.data.modo) document.documentElement.dataset.modo = e.data.modo;
    aplicarTema(); pintarCatalogo();
  });

  iniciar();
})();
