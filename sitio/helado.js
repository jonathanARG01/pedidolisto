/*
  Helado: dibuja en SVG un helado armable (vaso o cono) con sabores, salsas y agregados.
  Lo usa la ficha de productos con "armador" (tienda.json) y las tarjetas con { arte: "helado" }.

  Helado.dibujo({ base: "vaso"|"cono", relleno: "frutillas"|null, sabores: [...], salsas: [...], agregados: [...], animar: "sabor"|"salsa:<id>"|"agregado:<id>", pista: true })
    Cada sabor/salsa/agregado puede ser un id ("chocolate") o un objeto { id, color, dibujo }.
  Helado.svg(s)            -> <svg> completo (sin fondo si s.fondo no viene)
  Helado.muestra(tipo, o)  -> miniatura redonda para los selectores (tipo: sabor | salsa | agregado)
*/
(function () {
  'use strict';
  var uid = 0;

  function f(n) { return Math.round(n * 10) / 10; }
  function mezcla(hex, pct) {
    var n = parseInt(String(hex).slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var t = pct < 0 ? 0 : 255, p = Math.abs(pct);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function rng(semilla) {
    var s = 7;
    for (var i = 0; i < semilla.length; i++) s = (s * 31 + semilla.charCodeAt(i)) | 0;
    return function () {
      s = (s + 0x6D2B79F5) | 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Colores por defecto. Cada opción de tienda.json puede cambiarlos con "color". */
  var PALETA = {
    sabor: {
      chocolate: { color: '#7a4a2f', motas: '#4b2817' },
      vainilla: { color: '#f8e7b5', motas: '#9b7743' },
      frutilla: { color: '#f59bb6', motas: '#d8365f' },
      menta: { color: '#a8e6cf', motas: '#2f4a3a' },
      lucuma: { color: '#e9b36a', motas: '#b5762f' },
      manjar: { color: '#d9a066', motas: '#8f5523' }
    },
    salsa: {
      manjar: { color: '#b8722c' },
      chocolate: { color: '#3f1f12' },
      frutilla: { color: '#d7264f' },
      caramelo: { color: '#d08a2c' }
    },
    agregado: {
      crema: { dibujo: 'crema' },
      'chispas-chocolate': { dibujo: 'trozos', color: '#4a2617' },
      oreo: { dibujo: 'oreo' },
      chubis: { dibujo: 'lentejas' },
      'chispas-colores': { dibujo: 'chispas' },
      perlitas: { dibujo: 'perlas' },
      virutas: { dibujo: 'virutas' },
      'chispas-pastel': { dibujo: 'chispas-pastel' },
      granulado: { dibujo: 'granulado', color: '#3a2014' },
      mani: { dibujo: 'mani', color: '#c98d4f' },
      frutillas: { dibujo: 'frutillas' }
    }
  };
  function resolver(tipo, o) {
    if (typeof o === 'string') o = { id: o };
    var base = PALETA[tipo][o.id] || {}, r = {};
    Object.keys(base).forEach(function (k) { r[k] = base[k]; });
    Object.keys(o).forEach(function (k) { if (o[k] != null) r[k] = o[k]; });
    if (!r.color) r.color = tipo === 'sabor' ? '#f3d9c4' : tipo === 'salsa' ? '#7a3b1c' : '#8a5a3c';
    if (!r.motas) r.motas = mezcla(r.color, -0.4);
    if (!r.dibujo) r.dibujo = r.id;
    return r;
  }

  /* ---------- formas base ---------- */
  // Bola o copo: cúpula con borde ondulado. c = { cx, by (base), rx, h }
  function domoPath(c, n) {
    n = n || 7;
    var w = 2 * c.rx / n, d = 'M' + f(c.cx - c.rx) + ' ' + f(c.by) +
      ' C' + f(c.cx - c.rx) + ' ' + f(c.by - c.h * 0.8) + ' ' + f(c.cx - c.rx * 0.56) + ' ' + f(c.by - c.h) + ' ' + f(c.cx) + ' ' + f(c.by - c.h) +
      ' C' + f(c.cx + c.rx * 0.56) + ' ' + f(c.by - c.h) + ' ' + f(c.cx + c.rx) + ' ' + f(c.by - c.h * 0.8) + ' ' + f(c.cx + c.rx) + ' ' + f(c.by);
    for (var i = 0; i < n; i++) d += ' a' + f(w / 2) + ' ' + f(w * 0.3) + ' 0 0 1 ' + f(-w) + ' 0';
    return d + 'Z';
  }
  function topY(c, x) {
    var u = (x - c.cx) / c.rx;
    return c.by - c.h * Math.sqrt(Math.max(0, 1 - u * u * u * u)) * (0.86 + 0.14 * (1 - Math.abs(u)));
  }
  function puntoEn(c, r, margen) {
    var x = c.cx + (r() * 2 - 1) * c.rx * (margen || 0.8);
    var yt = topY(c, x);
    var y = yt + 6 + r() * (c.by - yt - 8) * 0.72;
    return [x, y];
  }

  function bola(c, s, semilla) {
    var id = 'hb' + (++uid), r = rng((semilla || '') + s.id), col = s.color;
    var d = domoPath(c, Math.max(4, Math.round(c.rx / 13)));
    var k = c.rx / 90, out = '';
    out += '<defs><radialGradient id="' + id + '" cx=".36" cy=".28" r=".85"><stop offset="0" stop-color="' + mezcla(col, 0.32) + '"/>' +
      '<stop offset=".55" stop-color="' + col + '"/><stop offset="1" stop-color="' + mezcla(col, -0.2) + '"/></radialGradient>' +
      '<clipPath id="' + id + 'c"><path d="' + d + '"/></clipPath></defs>';
    out += '<path d="' + d + '" fill="url(#' + id + ')"/>';
    out += '<g clip-path="url(#' + id + 'c)">';
    // borde inferior más oscuro (pliegue de la cuchara)
    out += '<ellipse cx="' + f(c.cx) + '" cy="' + f(c.by + 6 * k) + '" rx="' + f(c.rx * 1.05) + '" ry="' + f(17 * k) + '" fill="' + mezcla(col, -0.28) + '" opacity=".45"/>';
    // surcos de la cuchara
    for (var i = 0; i < 3; i++) {
      var yy = c.by - c.h * (0.28 + i * 0.2), a = c.rx * (0.85 - i * 0.2);
      out += '<path d="M' + f(c.cx - a) + ' ' + f(yy + 6 * k) + ' Q' + f(c.cx) + ' ' + f(yy - 12 * k) + ' ' + f(c.cx + a * 0.9) + ' ' + f(yy + 2 * k) + '" stroke="' + mezcla(col, 0.4) + '" stroke-width="' + f(3 * k) + '" fill="none" opacity=".5" stroke-linecap="round"/>' +
        '<path d="M' + f(c.cx - a * 0.8) + ' ' + f(yy + 10 * k) + ' Q' + f(c.cx) + ' ' + f(yy - 6 * k) + ' ' + f(c.cx + a * 0.8) + ' ' + f(yy + 6 * k) + '" stroke="' + mezcla(col, -0.25) + '" stroke-width="' + f(1.6 * k) + '" fill="none" opacity=".35" stroke-linecap="round"/>';
    }
    // motas (cacao, vainilla, trocitos de fruta)
    var n = Math.round(22 * k);
    for (var j = 0; j < n; j++) {
      var p = [c.cx + (r() * 2 - 1) * c.rx, c.by - r() * c.h];
      out += '<ellipse cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" rx="' + f((1 + r() * 2.4) * k) + '" ry="' + f((0.8 + r() * 1.4) * k) + '" fill="' + s.motas + '" opacity="' + f(0.35 + r() * 0.4) + '"/>';
    }
    out += '</g>';
    // brillo
    out += '<ellipse cx="' + f(c.cx - c.rx * 0.38) + '" cy="' + f(c.by - c.h * 0.7) + '" rx="' + f(c.rx * 0.24) + '" ry="' + f(c.h * 0.11) + '" fill="#fff" opacity=".42" transform="rotate(-24 ' + f(c.cx - c.rx * 0.38) + ' ' + f(c.by - c.h * 0.7) + ')"/>';
    return out;
  }

  /* ---------- vaso transparente ---------- */
  var VASO = 'M110 190 L138 334 Q200 345 262 334 L290 190 Z';
  var VASO_IN = 'M113 192 L140 332 Q200 342 260 332 L287 192 Z';

  function vasoAtras() {
    return '<path d="M114 196 L141 330 Q200 340 259 330 L286 196 Z" fill="#fff" opacity=".16"/>' +
      '<ellipse cx="200" cy="333" rx="58" ry="7" fill="#fff" opacity=".35"/>' +
      '<ellipse cx="200" cy="190" rx="90" ry="13" fill="#fff" fill-opacity=".22" stroke="#fff" stroke-opacity=".75" stroke-width="2"/>';
  }
  function vasoFrente() {
    var id = 'hv' + (++uid);
    return '<defs><linearGradient id="' + id + '" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".22" stop-color="#fff" stop-opacity=".08"/>' +
      '<stop offset=".7" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#fff" stop-opacity=".38"/></linearGradient></defs>' +
      '<path d="' + VASO + '" fill="url(#' + id + ')"/>' +
      '<path d="' + VASO + '" fill="none" stroke="#7a2c52" stroke-opacity=".14" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="' + VASO + '" fill="none" stroke="#fff" stroke-opacity=".92" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<path d="M127 208 L150 322" stroke="#fff" stroke-width="7" opacity=".5" stroke-linecap="round"/>' +
      '<path d="M141 208 L158 290" stroke="#fff" stroke-width="2.2" opacity=".45" stroke-linecap="round"/>' +
      '<path d="M273 210 L256 318" stroke="#fff" stroke-width="3.2" opacity=".32" stroke-linecap="round"/>' +
      '<path d="M135 318 Q200 330 265 318" stroke="#fff" stroke-width="2" opacity=".45" fill="none"/>' +
      '<path d="M110 190 A90 13 0 0 0 290 190" stroke="#fff" stroke-width="4.5" opacity=".95" fill="none" stroke-linecap="round"/>';
  }
  function interiorHelado(sab) {
    var id = 'hi' + (++uid), out = '<defs><clipPath id="' + id + '"><path d="' + VASO_IN + '"/></clipPath></defs><g clip-path="url(#' + id + ')">';
    sab.forEach(function (s, i) {
      var x0 = 100 + i * (200 / sab.length), w = 200 / sab.length + 1, r = rng('in' + s.id + i);
      out += '<rect x="' + f(x0) + '" y="186" width="' + f(w) + '" height="170" fill="' + s.color + '"/>';
      for (var j = 0; j < 16; j++) {
        var x = x0 + r() * w, y = 196 + r() * 140;
        out += '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(8 + r() * 22) + '" ry="' + f(5 + r() * 10) + '" fill="' + (j % 3 ? mezcla(s.color, 0.28) : mezcla(s.color, -0.22)) + '" opacity=".55" transform="rotate(' + f(r() * 40 - 20) + ' ' + f(x) + ' ' + f(y) + ')"/>';
      }
      for (var m = 0; m < 26; m++) out += '<circle cx="' + f(x0 + r() * w) + '" cy="' + f(196 + r() * 140) + '" r="' + f(0.8 + r() * 1.8) + '" fill="' + s.motas + '" opacity=".55"/>';
      for (var a = 0; a < 5; a++) out += '<ellipse cx="' + f(x0 + r() * w) + '" cy="' + f(210 + r() * 120) + '" rx="' + f(3 + r() * 6) + '" ry="' + f(2 + r() * 3) + '" fill="#fff" opacity=".28"/>';
    });
    // sombra interna en los bordes del vaso
    out += '<path d="M113 192 L140 332" stroke="#000" stroke-opacity=".12" stroke-width="16"/><path d="M287 192 L260 332" stroke="#000" stroke-opacity=".14" stroke-width="16"/>';
    return out + '</g>';
  }
  function fresa(x, y, s, rot, hojas) {
    var p = function (k) {
      var q = s * k;
      return 'M0 ' + f(-q * 0.75) + ' C' + f(q * 0.5) + ' ' + f(-q * 1.1) + ' ' + f(q * 1.05) + ' ' + f(-q * 0.75) + ' ' + f(q * 0.9) + ' ' + f(-q * 0.1) +
        ' C' + f(q * 0.75) + ' ' + f(q * 0.55) + ' ' + f(q * 0.25) + ' ' + f(q * 0.95) + ' 0 ' + f(q) +
        ' C' + f(-q * 0.25) + ' ' + f(q * 0.95) + ' ' + f(-q * 0.75) + ' ' + f(q * 0.55) + ' ' + f(-q * 0.9) + ' ' + f(-q * 0.1) +
        ' C' + f(-q * 1.05) + ' ' + f(-q * 0.75) + ' ' + f(-q * 0.5) + ' ' + f(-q * 1.1) + ' 0 ' + f(-q * 0.75) + 'Z';
    };
    var out = '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(rot) + ')">' +
      (hojas ? '<path d="M0 ' + f(-s * 0.7) + ' l' + f(-s * 0.6) + ' ' + f(-s * 0.35) + ' l' + f(s * 0.35) + ' ' + f(s * 0.05) + ' l' + f(-s * 0.1) + ' ' + f(-s * 0.45) + ' l' + f(s * 0.35) + ' ' + f(s * 0.3) + ' l' + f(s * 0.35) + ' ' + f(-s * 0.3) + ' l' + f(-s * 0.1) + ' ' + f(s * 0.45) + ' l' + f(s * 0.35) + ' ' + f(-s * 0.05) + 'z" fill="#3e9a4a"/>' : '') +
      '<path d="' + p(1) + '" fill="#e2304d"/>' +
      '<path d="' + p(0.72) + '" fill="#ff7a90"/>' +
      '<path d="M0 ' + f(-s * 0.5) + ' Q' + f(s * 0.16) + ' ' + f(s * 0.1) + ' 0 ' + f(s * 0.62) + ' Q' + f(-s * 0.16) + ' ' + f(s * 0.1) + ' 0 ' + f(-s * 0.5) + 'Z" fill="#ffd3da"/>';
    [[-0.62, -0.2], [0.62, -0.2], [-0.45, 0.35], [0.45, 0.35], [0, 0.82], [-0.3, -0.6], [0.3, -0.6]].forEach(function (q) {
      out += '<ellipse cx="' + f(q[0] * s) + '" cy="' + f(q[1] * s) + '" rx="' + f(s * 0.05) + '" ry="' + f(s * 0.08) + '" fill="#ffe7a1"/>';
    });
    return out + '<path d="M' + f(-s * 0.55) + ' ' + f(-s * 0.55) + ' q' + f(s * 0.1) + ' ' + f(-s * 0.2) + ' ' + f(s * 0.35) + ' ' + f(-s * 0.25) + '" stroke="#fff" stroke-width="' + f(s * 0.1) + '" opacity=".5" fill="none" stroke-linecap="round"/></g>';
  }
  function interiorFrutillas() {
    var id = 'hf' + (++uid), r = rng('frutillas'), out = '<defs><clipPath id="' + id + '"><path d="' + VASO_IN + '"/></clipPath></defs><g clip-path="url(#' + id + ')">';
    out += '<rect x="100" y="186" width="200" height="170" fill="#fff6ee"/>';
    for (var b = 0; b < 6; b++) out += '<path d="M100 ' + (204 + b * 24) + ' q25 -8 50 0 t50 0 t50 0 t50 0" stroke="#f1dccd" stroke-width="3" fill="none" opacity=".8"/>';
    [[205, 6], [250, 5], [298, 5]].forEach(function (fila, i) {
      for (var k = 0; k < fila[1]; k++) {
        var x = 118 + (k + (i % 2 ? 0.5 : 0.2)) * (164 / fila[1]) + (r() - 0.5) * 8;
        out += fresa(x, fila[0] + 14 + (r() - 0.5) * 10, 19 + r() * 4, (r() - 0.5) * 70, false);
      }
    });
    out += '<path d="M113 192 L140 332" stroke="#000" stroke-opacity=".08" stroke-width="14"/><path d="M287 192 L260 332" stroke="#000" stroke-opacity=".1" stroke-width="14"/>';
    return out + '</g>';
  }
  function chorreosInternos(sal) {
    var id = 'hs' + (++uid), out = '<defs><clipPath id="' + id + '"><path d="' + VASO_IN + '"/></clipPath></defs><g clip-path="url(#' + id + ')">';
    sal.forEach(function (s, i) {
      var r = rng('ch' + s.id + i);
      [126, 168, 236, 274].forEach(function (x0, j) {
        if ((j + i) % 2 && sal.length > 1) return;
        var x = x0 + i * 10 + (r() - 0.5) * 8, L = 40 + r() * 70;
        out += '<path d="M' + f(x) + ' 190 q' + f(6 + r() * 4) + ' ' + f(L * 0.35) + ' 0 ' + f(L * 0.6) + ' q' + f(-5) + ' ' + f(L * 0.25) + ' ' + f(2) + ' ' + f(L * 0.4) + '" stroke="' + s.color + '" stroke-width="' + f(5 + r() * 3) + '" fill="none" stroke-linecap="round" opacity=".88"/>';
      });
    });
    return out + '</g>';
  }

  /* ---------- cono de galleta ---------- */
  var CONO = 'M128 168 L272 168 L206 336 Q200 347 194 336 Z';
  function cono() {
    var id = 'hc' + (++uid), out = '<defs><linearGradient id="' + id + '" x1="0" x2="1"><stop offset="0" stop-color="#c7823a"/><stop offset=".45" stop-color="#eab36c"/><stop offset="1" stop-color="#b9732f"/></linearGradient>' +
      '<clipPath id="' + id + 'c"><path d="' + CONO + '"/></clipPath></defs>';
    out += '<path d="' + CONO + '" fill="url(#' + id + ')"/><g clip-path="url(#' + id + 'c)">';
    for (var i = -8; i < 12; i++) {
      out += '<path d="M' + (60 + i * 22) + ' 160 l130 200" stroke="#9b5b22" stroke-width="3.2" opacity=".55"/>' +
        '<path d="M' + (340 - i * 22) + ' 160 l-130 200" stroke="#9b5b22" stroke-width="3.2" opacity=".55"/>' +
        '<path d="M' + (62 + i * 22) + ' 160 l130 200" stroke="#ffe0a8" stroke-width="1.2" opacity=".45"/>';
    }
    out += '<path d="M128 168 L206 336" stroke="#000" stroke-opacity=".12" stroke-width="18"/></g>';
    out += '<rect x="120" y="156" width="160" height="24" rx="12" fill="#d8954a"/><rect x="124" y="158" width="152" height="7" rx="3.5" fill="#f4c886" opacity=".8"/>' +
      '<path d="M124 172 h152" stroke="#9b5b22" stroke-width="2" opacity=".45"/>';
    return out;
  }

  /* ---------- crema batida ---------- */
  function crema(c, semilla) {
    var k = c.rx / 96 * (c.h ? 0.95 : 1), baseY = c.h ? c.by - c.h * 0.52 : c.by, rx = c.rx * (c.h ? 0.86 : 0.96), id = 'hk' + (++uid), out = '';
    out += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f1e2d3"/></linearGradient></defs>';
    var pisos = [[rx, 0, 44 * k, 8], [rx * 0.68, 28 * k, 38 * k, 6], [rx * 0.4, 52 * k, 32 * k, 4]];
    pisos.forEach(function (p) {
      var cc = { cx: c.cx, by: baseY - p[1], rx: p[0], h: p[2] };
      out += '<path d="' + domoPath(cc, p[3]) + '" fill="url(#' + id + ')" stroke="#ead6c4" stroke-width="' + f(1.4 * k) + '"/>';
      for (var i = 1; i < p[3]; i++) {
        var x = cc.cx - cc.rx + i * (2 * cc.rx / p[3]);
        out += '<path d="M' + f(x) + ' ' + f(cc.by + 2 * k) + ' Q' + f(x + (x - cc.cx) * 0.12) + ' ' + f(cc.by - cc.h * 0.5) + ' ' + f(cc.cx + (x - cc.cx) * 0.4) + ' ' + f(cc.by - cc.h * 0.92) + '" stroke="#e7d1bd" stroke-width="' + f(1.8 * k) + '" fill="none" opacity=".8"/>';
      }
    });
    var ty = baseY - 52 * k - 32 * k;
    out += '<path d="M' + f(c.cx - 9 * k) + ' ' + f(ty + 6 * k) + ' q' + f(6 * k) + ' ' + f(-22 * k) + ' ' + f(22 * k) + ' ' + f(-20 * k) + ' q' + f(-8 * k) + ' ' + f(6 * k) + ' ' + f(-6 * k) + ' ' + f(20 * k) + 'z" fill="#fffaf4" stroke="#ead6c4" stroke-width="' + f(1.2 * k) + '"/>';
    out += '<ellipse cx="' + f(c.cx - rx * 0.4) + '" cy="' + f(baseY - 26 * k) + '" rx="' + f(10 * k) + '" ry="' + f(5 * k) + '" fill="#fff" opacity=".9"/>';
    return { svg: out, cima: { cx: c.cx, by: baseY + 4 * k, rx: rx, h: (baseY - ty) + 4 * k } };
  }

  /* ---------- salsa ---------- */
  function salsa(c, s, idx) {
    var r = rng('salsa' + s.id + idx), col = s.color, cla = mezcla(col, 0.38), k = c.rx / 90, w = 6.4 * k, out = '';
    var lado = idx % 2 ? 1 : -1;
    // charco arriba
    var py = topY(c, c.cx) + 6 * k, a = c.rx * 0.36;
    out += '<path d="M' + f(c.cx - a) + ' ' + f(py + 6 * k) + ' Q' + f(c.cx - a * 0.5) + ' ' + f(py - 9 * k) + ' ' + f(c.cx + a * 0.1) + ' ' + f(py - 6 * k) + ' Q' + f(c.cx + a * 0.8) + ' ' + f(py - 6 * k) + ' ' + f(c.cx + a) + ' ' + f(py + 8 * k) +
      ' Q' + f(c.cx + a * 0.5) + ' ' + f(py + 18 * k) + ' ' + f(c.cx) + ' ' + f(py + 14 * k) + ' Q' + f(c.cx - a * 0.6) + ' ' + f(py + 20 * k) + ' ' + f(c.cx - a) + ' ' + f(py + 6 * k) + 'Z" fill="' + col + '" transform="translate(' + f(idx * 14 * lado * k) + ' ' + f(idx * 4 * k) + ')"/>';
    // hilos de salsa: recorrido suave y algo aleatorio sobre la cúpula
    var pts = [], n = 6;
    for (var i = 0; i < n; i++) {
      var y = c.by - c.h * (0.9 - (i / (n - 1)) * 0.55) + (r() - 0.5) * 8 * k + idx * 5 * k;
      var u = Math.min(0.999, (c.by - y) / c.h), half = c.rx * Math.sqrt(1 - u * u);
      pts.push([c.cx + (i % 2 ? 1 : -1) * lado * half * (0.45 + r() * 0.45), y]);
    }
    var d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    for (var j = 1; j < pts.length; j++) {
      var p0 = pts[j - 2] || pts[j - 1], p1 = pts[j - 1], p2 = pts[j], p3 = pts[j + 1] || p2;
      d += ' C' + f(p1[0] + (p2[0] - p0[0]) / 5) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 5 + 12 * k) + ' ' +
        f(p2[0] - (p3[0] - p1[0]) / 5) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 5 + 12 * k) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    out += '<path d="' + d + '" stroke="' + mezcla(col, -0.2) + '" stroke-width="' + f(w + 1.6 * k) + '" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".35" transform="translate(0 ' + f(1.5 * k) + ')"/>' +
      '<path d="' + d + '" stroke="' + col + '" stroke-width="' + f(w) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + d + '" stroke="' + cla + '" stroke-width="' + f(w * 0.26) + '" fill="none" stroke-linecap="round" opacity=".75" transform="translate(' + f(-1.2 * k) + ' ' + f(-1.8 * k) + ')"/>';
    // gotas que caen por el borde, con punta redonda
    [-0.8, -0.3, 0.25, 0.72].forEach(function (u, m) {
      if ((m + idx) % 2 === 1) return;
      var x = c.cx + (u + (r() - 0.5) * 0.12) * c.rx, yt = topY(c, x), y0 = yt + (c.by - yt) * 0.62, y1 = c.by + (2 + r() * 16) * k, hw = w * (0.5 + r() * 0.15);
      out += '<path d="M' + f(x - hw * 1.6) + ' ' + f(y0 - 3 * k) + ' C' + f(x - hw * 0.5) + ' ' + f(y0 + (y1 - y0) * 0.5) + ' ' + f(x - hw * 0.8) + ' ' + f(y1 - hw) + ' ' + f(x - hw * 0.9) + ' ' + f(y1) +
        ' A' + f(hw * 0.95) + ' ' + f(hw * 0.95) + ' 0 1 0 ' + f(x + hw * 0.9) + ' ' + f(y1) + ' C' + f(x + hw * 0.8) + ' ' + f(y1 - hw) + ' ' + f(x + hw * 0.5) + ' ' + f(y0 + (y1 - y0) * 0.5) + ' ' + f(x + hw * 1.6) + ' ' + f(y0 - 3 * k) + 'Z" fill="' + col + '"/>' +
        '<path d="M' + f(x - hw * 0.35) + ' ' + f(y0 + 3 * k) + ' L' + f(x - hw * 0.35) + ' ' + f(y1 - 1 * k) + '" stroke="' + cla + '" stroke-width="' + f(w * 0.2) + '" stroke-linecap="round" opacity=".65"/>';
    });
    return out;
  }

  /* ---------- agregados que caen encima ---------- */
  var COLORES_CHUBI = ['#e53935', '#fdd835', '#1e88e5', '#43a047', '#fb8c00', '#ec407a', '#8e24aa'];
  var COLORES_CHISPA = ['#ff4f86', '#ffd23f', '#35bdf0', '#6fd08c', '#a77bff', '#ff9a3c', '#ffffff'];
  function piezas(c, s, anim, total) {
    var r = rng('p' + s.id), k = Math.max(0.55, c.rx / 90), out = '', tipo = s.dibujo;
    var escala = total || 1;
    var cuantas = { trozos: 16, oreo: 34, lentejas: 11, chispas: 30, mani: 10, frutillas: 3, perlas: 26, virutas: 14, 'chispas-pastel': 30, granulado: 42 }[tipo] || 12;
    cuantas = Math.max(4, Math.round(cuantas * escala));
    var pieza = function (html, i) {
      return anim ? '<g class="h-pieza" style="animation-delay:' + Math.round(i * 28 + r() * 60) + 'ms">' + html + '</g>' : html;
    };
    if (tipo === 'oreo' && s.galletas) {
      for (var o = 0; o < (escala < 1 ? 1 : 2); o++) {
        var po = puntoEn(c, r, 0.45), cx = po[0], cy = po[1] - 10 * k, rr = 13 * k, ang = (o ? 24 : -18) + r() * 10;
        out += pieza('<g transform="rotate(' + f(ang) + ' ' + f(cx) + ' ' + f(cy) + ')">' +
          '<rect x="' + f(cx - rr) + '" y="' + f(cy - 5 * k) + '" width="' + f(rr * 2) + '" height="' + f(10 * k) + '" rx="' + f(4 * k) + '" fill="#241a19"/>' +
          '<rect x="' + f(cx - rr + 1.5 * k) + '" y="' + f(cy - 1.6 * k) + '" width="' + f(rr * 2 - 3 * k) + '" height="' + f(3.4 * k) + '" fill="#f6f1e6"/>' +
          '<ellipse cx="' + f(cx) + '" cy="' + f(cy - 5 * k) + '" rx="' + f(rr) + '" ry="' + f(3.4 * k) + '" fill="#3a2d2b"/>' +
          '<ellipse cx="' + f(cx) + '" cy="' + f(cy - 5 * k) + '" rx="' + f(rr * 0.7) + '" ry="' + f(2 * k) + '" fill="none" stroke="#56443f" stroke-width="' + f(0.9 * k) + '"/></g>', o);
      }
    }
    for (var i = 0; i < cuantas; i++) {
      var p = puntoEn(c, r), x = p[0], y = p[1], rot = f(r() * 180), h = '';
      if (tipo === 'trozos') {
        var a = (6 + r() * 4) * k, b = (5 + r() * 3) * k;
        h = '<g transform="rotate(' + rot + ' ' + f(x) + ' ' + f(y) + ')"><rect x="' + f(x - a / 2) + '" y="' + f(y - b / 2) + '" width="' + f(a) + '" height="' + f(b) + '" rx="' + f(1.6 * k) + '" fill="' + s.color + '"/>' +
          '<rect x="' + f(x - a / 2 + 1) + '" y="' + f(y - b / 2 + 1) + '" width="' + f(a * 0.5) + '" height="' + f(1.4 * k) + '" rx="1" fill="' + mezcla(s.color, 0.35) + '"/></g>';
      } else if (tipo === 'oreo') {
        var rr2 = (1.6 + r() * 3) * k;
        h = '<path d="M' + f(x - rr2) + ' ' + f(y) + ' l' + f(rr2 * 0.8) + ' ' + f(-rr2) + ' l' + f(rr2 * 1.3) + ' ' + f(rr2 * 0.3) + ' l' + f(-rr2 * 0.3) + ' ' + f(rr2 * 1.3) + 'z" fill="' + (i % 4 ? '#2b2221' : '#5a4a47') + '"/>';
      } else if (tipo === 'lentejas') {
        var colr = COLORES_CHUBI[i % COLORES_CHUBI.length];
        h = '<g transform="rotate(' + f(r() * 60 - 30) + ' ' + f(x) + ' ' + f(y) + ')"><ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(6.6 * k) + '" ry="' + f(5 * k) + '" fill="' + colr + '" stroke="' + mezcla(colr, -0.25) + '" stroke-width="' + f(0.8 * k) + '"/>' +
          '<ellipse cx="' + f(x - 2 * k) + '" cy="' + f(y - 1.8 * k) + '" rx="' + f(2.2 * k) + '" ry="' + f(1.2 * k) + '" fill="#fff" opacity=".7"/></g>';
      } else if (tipo === 'perlas') {
        var blanca = i % 2, rp = (2.6 + r() * 0.8) * k;
        h = '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(rp) + '" fill="' + (blanca ? '#f1e6cf' : '#3b2216') + '"/><circle cx="' + f(x - rp * 0.35) + '" cy="' + f(y - rp * 0.35) + '" r="' + f(rp * 0.35) + '" fill="#fff" opacity="' + (blanca ? '.8' : '.35') + '"/>';
      } else if (tipo === 'virutas') {
        var cv = i % 3 === 2 ? '#f0e3c6' : '#8a5636', lv = (9 + r() * 6) * k, av = (2.6 + r() * 1.6) * k;
        h = '<g transform="rotate(' + rot + ' ' + f(x) + ' ' + f(y) + ')"><rect x="' + f(x - lv / 2) + '" y="' + f(y - av / 2) + '" width="' + f(lv) + '" height="' + f(av) + '" rx="' + f(0.8 * k) + '" fill="' + cv + '"/>' +
          '<path d="M' + f(x - lv / 2 + 1) + ' ' + f(y) + ' h' + f(lv - 2) + '" stroke="' + mezcla(cv, cv === '#8a5636' ? -0.3 : -0.12) + '" stroke-width="' + f(0.7 * k) + '"/></g>';
      } else if (tipo === 'chispas-pastel') {
        var cp = ['#f7b6cf', '#9fd3f0', '#ffffff', '#f2c6e0', '#b9e0f7', '#fbe3ec'][i % 6];
        if (i % 5 === 0) h = '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(3.4 * k) + '" fill="' + cp + '" stroke="#e7d7e2" stroke-width="' + f(0.6 * k) + '"/><circle cx="' + f(x - 1.1 * k) + '" cy="' + f(y - 1.1 * k) + '" r="' + f(1 * k) + '" fill="#fff"/>';
        else { var Lp = 4.4 * k; h = '<path d="M' + f(x - Lp) + ' ' + f(y) + ' L' + f(x + Lp) + ' ' + f(y) + '" stroke="' + cp + '" stroke-width="' + f(2.8 * k) + '" stroke-linecap="round" transform="rotate(' + rot + ' ' + f(x) + ' ' + f(y) + ')"/>'; }
      } else if (tipo === 'granulado') {
        var rg = (1.4 + r() * 1.6) * k;
        h = '<path d="M' + f(x - rg) + ' ' + f(y) + ' l' + f(rg * 0.7) + ' ' + f(-rg) + ' l' + f(rg * 1.3) + ' ' + f(rg * 0.4) + ' l' + f(-rg * 0.4) + ' ' + f(rg * 1.2) + 'z" fill="' + (i % 4 ? s.color : '#5a3322') + '"/>';
      } else if (tipo === 'chispas') {
        var colc = COLORES_CHISPA[i % COLORES_CHISPA.length], L = 4.6 * k;
        h = '<path d="M' + f(x - L) + ' ' + f(y) + ' L' + f(x + L) + ' ' + f(y) + '" stroke="' + colc + '" stroke-width="' + f(3.2 * k) + '" stroke-linecap="round" transform="rotate(' + rot + ' ' + f(x) + ' ' + f(y) + ')"/>';
      } else if (tipo === 'mani') {
        h = '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(5.5 * k) + '" ry="' + f(4 * k) + '" fill="' + s.color + '" transform="rotate(' + rot + ' ' + f(x) + ' ' + f(y) + ')"/><ellipse cx="' + f(x - 1.5 * k) + '" cy="' + f(y - 1.2 * k) + '" rx="' + f(1.8 * k) + '" ry="' + f(1 * k) + '" fill="#fff" opacity=".45"/>';
      } else if (tipo === 'frutillas') {
        h = fresa(x, y - 6 * k, 15 * k, r() * 60 - 30, true);
      } else {
        h = '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(4 * k) + '" fill="' + s.color + '"/>';
      }
      out += pieza(h, i + 2);
    }
    return out;
  }

  /* ---------- composición ---------- */
  function dibujo(s) {
    s = s || {};
    var A = s.animar || '', out = '', c = null, cono_ = s.base === 'cono';
    var sab = (s.sabores || []).slice(0, 3).map(function (x) { return resolver('sabor', x); });
    var sal = (s.salsas || []).map(function (x) { return resolver('salsa', x); });
    var agr = (s.agregados || []).map(function (x) { return resolver('agregado', x); });
    var cremas = agr.filter(function (a) { return a.dibujo === 'crema'; });
    var resto = agr.filter(function (a) { return a.dibujo !== 'crema'; });
    var animSabor = A === 'sabor';

    if (cono_) {
      out += cono();
      if (sab.length) {
        var pilas = [{ cx: 200, by: 166, rx: 84, h: 96 }, { cx: 200, by: 118, rx: 72, h: 68 }, { cx: 200, by: 76, rx: 60, h: 56 }];
        if (sab.length > 1) { pilas[0].h = 66; }
        var bolas = '';
        sab.forEach(function (x, i) { bolas += bola(pilas[i], x, 'c' + i); c = pilas[i]; });
        out += '<g class="' + (animSabor ? 'h-cae' : '') + '">' + bolas + '</g>';
      }
    } else {
      out += vasoAtras();
      if (s.relleno === 'frutillas') out += interiorFrutillas();
      else if (sab.length) out += '<g class="' + (animSabor ? 'h-llena' : '') + '">' + interiorHelado(sab) + '</g>';
      if (sal.length && (sab.length || s.relleno)) out += '<g class="' + (A.indexOf('salsa') === 0 ? 'h-chorrea' : '') + '">' + chorreosInternos(sal) + '</g>';
      out += vasoFrente();
      if (s.relleno === 'frutillas') {
        var k0 = crema({ cx: 200, by: 198, rx: 98, h: 0 });
        out += k0.svg; c = k0.cima;
        out += fresa(150, 150, 20, -25, true) + fresa(246, 156, 18, 30, true);
      } else if (sab.length) {
        var dom = sab.length === 1 ? [{ cx: 200, by: 196, rx: 94, h: 102 }] :
          sab.length === 2 ? [{ cx: 160, by: 198, rx: 60, h: 80 }, { cx: 240, by: 198, rx: 60, h: 80 }] :
            [{ cx: 160, by: 198, rx: 60, h: 66 }, { cx: 240, by: 198, rx: 60, h: 66 }, { cx: 200, by: 160, rx: 58, h: 56 }];
        var b2 = '';
        sab.forEach(function (x, i) { b2 += bola(dom[i], x, 'v' + i); });
        out += '<g class="' + (animSabor ? 'h-cae' : '') + '">' + b2 + '</g>';
        c = sab.length === 1 ? dom[0] : sab.length === 2 ? { cx: 200, by: 198, rx: 100, h: 82 } : { cx: 200, by: 198, rx: 100, h: 100 };
      }
    }

    if (!c && s.pista) {
      var g = cono_ ? { cx: 200, by: 166, rx: 84, h: 96 } : { cx: 200, by: 196, rx: 94, h: 102 };
      out += '<path class="h-pista" d="' + domoPath(g, 7) + '" fill="#fff" fill-opacity=".18" stroke="#fff" stroke-width="3" stroke-dasharray="9 9" stroke-linecap="round"/>' +
        '<path d="M200 ' + (g.by - 52) + ' v26 M187 ' + (g.by - 39) + ' h26" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".95"/>';
    }

    if (c) {
      cremas.forEach(function (x) {
        var k = crema(c);
        out += '<g class="' + (A === 'agregado:' + x.id ? 'h-cae' : '') + '">' + k.svg + '</g>';
        c = k.cima;
      });
      sal.forEach(function (x, i) {
        out += '<g class="' + (A === 'salsa:' + x.id ? 'h-chorrea' : '') + '">' + salsa(c, x, i) + '</g>';
      });
      resto.forEach(function (x) {
        var an = A === 'agregado:' + x.id;
        out += '<g class="' + (an ? 'h-llueve' : '') + '">' + piezas(c, x, an) + '</g>';
      });
      // si el helado queda muy alto (varias bolas, crema), se achica para que quepa entero
      var cima = c.by - c.h - 14, esc = Math.min(1, (345 - 42) / (345 - cima));
      if (esc < 0.999) out = '<g transform="translate(200 345) scale(' + Math.round(esc * 1000) / 1000 + ') translate(-200 -345)">' + out + '</g>';
    }
    return out;
  }

  function svg(s) {
    s = s || {};
    var fondo = '';
    if (s.fondo) {
      var id = 'hg' + (++uid);
      fondo = '<defs><radialGradient id="' + id + '" gradientUnits="userSpaceOnUse" cx="200" cy="170" r="300"><stop offset="0" stop-color="' + mezcla(s.fondo, 0.3) + '"/><stop offset="1" stop-color="' + mezcla(s.fondo, -0.06) + '"/></radialGradient></defs>' +
        '<rect x="-400" y="-400" width="1200" height="1200" fill="url(#' + id + ')"/>';
    }
    return '<svg viewBox="' + (s.viewBox || '34 30 332 332') + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid ' + (s.ajuste || 'meet') + '" style="overflow:visible">' + fondo +
      '<ellipse cx="200" cy="342" rx="' + (s.base === 'cono' ? 44 : 92) + '" ry="13" fill="#7a2c52" opacity=".14"/>' + dibujo(s) + '</svg>';
  }

  /* ---------- miniaturas para los selectores ---------- */
  function muestra(tipo, o) {
    var s = resolver(tipo, o), out = '';
    if (tipo === 'sabor') {
      out += '<ellipse cx="40" cy="64" rx="22" ry="4" fill="#000" opacity=".12"/>' + bola({ cx: 40, by: 60, rx: 27, h: 34 }, s, 'm');
    } else if (tipo === 'salsa') {
      out += '<ellipse cx="40" cy="66" rx="24" ry="4" fill="#000" opacity=".12"/>' +
        '<path d="M13 40 Q13 66 40 66 Q67 66 67 40 Z" fill="#fff" fill-opacity=".55" stroke="#fff" stroke-width="1.5"/>' +
        '<ellipse cx="40" cy="40" rx="27" ry="8" fill="' + s.color + '"/><ellipse cx="40" cy="41.5" rx="22" ry="5" fill="' + mezcla(s.color, -0.15) + '"/>' +
        '<path d="M26 38 q8 -3 18 -2" stroke="' + mezcla(s.color, 0.45) + '" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M18 46 Q22 60 36 62" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7" stroke-linecap="round"/>';
    } else {
      var c = { cx: 40, by: 62, rx: 28, h: 22 };
      out += '<ellipse cx="40" cy="64" rx="26" ry="5" fill="#000" opacity=".1"/>';
      if (s.dibujo === 'crema') out += crema({ cx: 40, by: 64, rx: 30, h: 0 }).svg;
      else out += '<path d="' + domoPath(c, 5) + '" fill="#fff6ee" opacity=".9"/>' + piezas(c, s, false, 0.7);
    }
    return '<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + out + '</svg>';
  }

  window.Helado = { dibujo: dibujo, svg: svg, muestra: muestra, resolver: resolver, mezcla: mezcla };
})();
