/*
  Ilustraciones SVG de productos para las tiendas demo.
  En una tienda real cada producto usa fotos (URL o ruta); esto solo evita depender de fotos de terceros.
  Uso: Arte.svg({ arte: "planta", hoja: "#3f7d4e", maceta: "#b9774a", fondo: "#e8efe6", variante: "monstera", zoom: false })
*/
(function () {
  var uid = 0;

  function sombra(cx, cy, rx) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + (rx * 0.16) + '" fill="#000" opacity=".18"/>';
  }
  function mezcla(hex, pct) { // aclara (pct>0) u oscurece (pct<0)
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    var t = pct < 0 ? 0 : 255, p = Math.abs(pct);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function hoja(x, y, largo, ancho, ang, color, nervio) {
    var p = 'M0 0 C ' + (ancho) + ' ' + (-largo * 0.3) + ', ' + (ancho * 0.8) + ' ' + (-largo * 0.8) + ', 0 ' + (-largo) +
      ' C ' + (-ancho * 0.8) + ' ' + (-largo * 0.8) + ', ' + (-ancho) + ' ' + (-largo * 0.3) + ', 0 0 Z';
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + ang + ')"><path d="' + p + '" fill="' + color + '"/>' +
      (nervio ? '<path d="M0 -4 L0 ' + (-largo * 0.92) + '" stroke="' + nervio + '" stroke-width="2" opacity=".55" fill="none"/>' : '') + '</g>';
  }

  function maceta(c, x, y, w, h) {
    var top = w, bot = w * 0.72;
    return '<path d="M' + (x - top / 2) + ' ' + y + ' L' + (x + top / 2) + ' ' + y + ' L' + (x + bot / 2) + ' ' + (y + h) + ' L' + (x - bot / 2) + ' ' + (y + h) + ' Z" fill="' + c + '"/>' +
      '<rect x="' + (x - top / 2 - 6) + '" y="' + (y - 4) + '" width="' + (top + 12) + '" height="22" rx="5" fill="' + mezcla(c, 0.12) + '"/>' +
      '<path d="M' + (x - top / 2 + 10) + ' ' + (y + 26) + ' L' + (x - bot / 2 + 8) + ' ' + (y + h - 6) + '" stroke="#fff" stroke-width="5" opacity=".14" stroke-linecap="round"/>';
  }

  var dibujos = {
    planta: function (s) {
      var h = s.hoja || '#3f7d4e', hc = mezcla(h, 0.18), ho = mezcla(h, -0.25), out = '';
      var v = s.variante || 'monstera';
      if (v === 'monstera') {
        out += hoja(200, 250, 150, 70, -38, ho, hc) + hoja(200, 250, 165, 78, 30, h, hc) + hoja(200, 250, 130, 64, -5, hc, h) +
          hoja(200, 250, 110, 56, -70, h, hc) + hoja(200, 250, 105, 52, 68, ho, hc);
      } else if (v === 'sansevieria') {
        [[-34, -8, 175], [-16, -3, 205], [2, 2, 190], [20, 6, 215], [36, 10, 160]].forEach(function (b, i) {
          out += '<g transform="translate(' + (200 + b[0]) + ' 255) rotate(' + b[1] + ')"><path d="M-11 0 C -14 ' + (-b[2] * .6) + ', -6 ' + (-b[2] * .9) + ', 0 ' + (-b[2]) + ' C 6 ' + (-b[2] * .9) + ', 14 ' + (-b[2] * .6) + ', 11 0 Z" fill="' + (i % 2 ? h : ho) + '"/>' +
            '<path d="M-6 -20 L6 -40 M-6 -60 L6 -80 M-6 -100 L6 -120" stroke="' + hc + '" stroke-width="3" opacity=".5"/></g>';
        });
      } else if (v === 'cactus') {
        out += '<rect x="178" y="110" width="44" height="150" rx="22" fill="' + h + '"/>' +
          '<path d="M178 190 h-22 a14 14 0 0 1 -14 -14 v-40 a12 12 0 0 1 24 0 v30 h12" fill="' + ho + '"/>' +
          '<path d="M222 170 h20 a14 14 0 0 0 14 -14 v-30 a12 12 0 0 0 -24 0 v20 h-10" fill="' + ho + '"/>' +
          '<path d="M200 118 v135 M189 125 v128 M211 125 v128" stroke="' + hc + '" stroke-width="2" opacity=".6"/>' +
          '<circle cx="200" cy="108" r="9" fill="' + (s.flor || '#e98aa5') + '"/>';
      } else if (v === 'helecho') {
        for (var i = 0; i < 7; i++) {
          var ang = -75 + i * 25, l = 150 - Math.abs(i - 3) * 14;
          out += '<g transform="translate(200 255) rotate(' + ang + ')"><path d="M0 0 L0 ' + (-l) + '" stroke="' + ho + '" stroke-width="3"/>';
          for (var j = 1; j < 9; j++) {
            var yy = -l * j / 9, w = 22 * (1 - j / 11);
            out += '<ellipse cx="' + (-w / 2) + '" cy="' + yy + '" rx="' + (w / 2) + '" ry="4" fill="' + (j % 2 ? h : hc) + '"/><ellipse cx="' + (w / 2) + '" cy="' + yy + '" rx="' + (w / 2) + '" ry="4" fill="' + (j % 2 ? hc : h) + '"/>';
          }
          out += '</g>';
        }
      } else { // ficus / ovaladas
        out += '<path d="M200 255 C 198 200, 205 160, 200 100" stroke="' + mezcla(s.maceta || '#7a5134', -0.2) + '" stroke-width="6" fill="none"/>';
        [[-50, 205, -60], [48, 190, 58], [-40, 160, -40], [44, 140, 44], [-26, 118, -25], [20, 100, 20], [0, 95, 0]].forEach(function (p, k) {
          out += hoja(200 + p[0] * 0.2, p[1] + 30, 70, 30, p[2] * 1.4, k % 2 ? h : ho, hc);
        });
      }
      return out + maceta(s.maceta || '#b9774a', 200, 250, 120, 92);
    },

    frasco: function (s) {
      var c = s.color || '#e9e1d2', a = s.acento || '#2f5d46', id = 'f' + (++uid);
      return '<defs><linearGradient id="' + id + '" x1="0" x2="1"><stop offset="0" stop-color="' + mezcla(c, -0.1) + '"/><stop offset=".45" stop-color="' + mezcla(c, 0.25) + '"/><stop offset="1" stop-color="' + mezcla(c, -0.18) + '"/></linearGradient></defs>' +
        '<rect x="183" y="72" width="34" height="22" rx="3" fill="' + a + '"/>' +
        '<path d="M200 72 v-14 h46 v10" stroke="' + a + '" stroke-width="9" fill="none" stroke-linecap="round"/>' +
        '<rect x="176" y="92" width="48" height="26" rx="4" fill="' + mezcla(a, 0.15) + '"/>' +
        '<rect x="144" y="114" width="112" height="210" rx="26" fill="url(#' + id + ')"/>' +
        '<rect x="160" y="180" width="80" height="86" rx="6" fill="' + a + '" opacity=".92"/>' +
        '<path d="M200 196 c 16 10, 16 32, 0 46 c -16 -14, -16 -36, 0 -46 z" fill="' + mezcla(a, 0.55) + '"/>' +
        '<rect x="168" y="250" width="64" height="4" rx="2" fill="' + mezcla(a, 0.55) + '" opacity=".7"/>';
    },

    gotero: function (s) {
      var c = s.color || '#6b3d1f', a = s.acento || '#d8b77a';
      return '<rect x="186" y="78" width="28" height="44" rx="12" fill="#222"/>' +
        '<rect x="180" y="118" width="40" height="26" rx="4" fill="' + a + '"/>' +
        '<rect x="150" y="140" width="100" height="180" rx="22" fill="' + c + '" opacity=".95"/>' +
        '<rect x="150" y="140" width="100" height="180" rx="22" fill="#fff" opacity=".08"/>' +
        '<rect x="164" y="196" width="72" height="72" rx="4" fill="' + mezcla(a, 0.6) + '"/>' +
        '<rect x="176" y="214" width="48" height="6" rx="3" fill="' + c + '"/><rect x="182" y="230" width="36" height="4" rx="2" fill="' + c + '" opacity=".6"/>' +
        '<path d="M164 156 v140" stroke="#fff" stroke-width="7" opacity=".16" stroke-linecap="round"/>';
    },

    vaso: function (s) {
      var c = s.color || '#1b1d22', a = s.acento || '#ff6a2b', id = 'v' + (++uid);
      return '<defs><linearGradient id="' + id + '" x1="0" x2="1"><stop offset="0" stop-color="' + mezcla(c, -0.2) + '"/><stop offset=".4" stop-color="' + mezcla(c, 0.16) + '"/><stop offset="1" stop-color="' + mezcla(c, -0.3) + '"/></linearGradient></defs>' +
        '<path d="M214 104 L238 30" stroke="' + mezcla(c, 0.1) + '" stroke-width="11" stroke-linecap="round"/>' +
        '<path d="M150 118 L250 118 L238 330 L162 330 Z" fill="url(#' + id + ')"/>' +
        '<rect x="140" y="96" width="120" height="26" rx="12" fill="' + mezcla(c, 0.08) + '"/>' +
        '<rect x="160" y="300" width="80" height="12" fill="' + mezcla(c, -0.3) + '" opacity=".6"/>' +
        '<rect x="166" y="196" width="68" height="34" rx="4" fill="' + mezcla(c, -0.35) + '" opacity=".55"/>' +
        (s.anillo !== false ? '<circle cx="262" cy="96" r="44" fill="none" stroke="' + a + '" stroke-width="12" opacity=".95"/>' : '');
    },

    termo: function (s) {
      var c = s.color || '#2a2d33', a = s.acento || '#ff6a2b', id = 't' + (++uid);
      return '<defs><linearGradient id="' + id + '" x1="0" x2="1"><stop offset="0" stop-color="' + mezcla(c, -0.25) + '"/><stop offset=".42" stop-color="' + mezcla(c, 0.2) + '"/><stop offset="1" stop-color="' + mezcla(c, -0.3) + '"/></linearGradient></defs>' +
        '<rect x="176" y="50" width="48" height="40" rx="8" fill="' + mezcla(c, -0.1) + '"/>' +
        '<path d="M224 62 h16 a12 12 0 0 1 0 24 h-16" stroke="' + mezcla(c, -0.1) + '" stroke-width="8" fill="none"/>' +
        '<rect x="160" y="86" width="80" height="248" rx="30" fill="url(#' + id + ')"/>' +
        '<rect x="160" y="150" width="80" height="10" fill="' + a + '"/>';
    },

    bolsa: function (s) {
      var c = s.color || '#8a5a2b', a = s.acento || '#f2e6d0';
      return '<path d="M140 108 L260 108 L270 330 L130 330 Z" fill="' + c + '"/>' +
        '<path d="M140 108 L160 86 L240 86 L260 108 Z" fill="' + mezcla(c, -0.2) + '"/>' +
        '<path d="M150 96 h100" stroke="' + mezcla(c, 0.3) + '" stroke-width="3" stroke-dasharray="6 5"/>' +
        '<rect x="160" y="170" width="80" height="96" rx="6" fill="' + a + '"/>' +
        '<circle cx="200" cy="202" r="16" fill="' + c + '" opacity=".85"/><path d="M200 190 c -6 8, 6 16, 0 24" stroke="' + a + '" stroke-width="3" fill="none"/>' +
        '<rect x="172" y="230" width="56" height="6" rx="3" fill="' + c + '"/><rect x="180" y="244" width="40" height="4" rx="2" fill="' + c + '" opacity=".6"/>' +
        '<path d="M148 120 L140 320" stroke="#fff" stroke-width="6" opacity=".1" stroke-linecap="round"/>';
    },

    taza: function (s) {
      var c = s.color || '#efe7dc', a = s.acento || '#6b4226';
      return '<path d="M262 190 a34 34 0 0 1 0 68" stroke="' + mezcla(c, -0.12) + '" stroke-width="16" fill="none"/>' +
        '<path d="M140 160 h124 v120 a40 40 0 0 1 -40 40 h-44 a40 40 0 0 1 -40 -40 z" fill="' + c + '"/>' +
        '<ellipse cx="202" cy="160" rx="62" ry="12" fill="' + a + '"/>' +
        '<path d="M184 138 c -10 -14, 10 -20, 0 -36 M212 140 c -10 -14, 10 -20, 0 -36" stroke="' + mezcla(c, -0.25) + '" stroke-width="4" fill="none" opacity=".5" stroke-linecap="round"/>' +
        '<path d="M152 176 v100" stroke="#fff" stroke-width="7" opacity=".3" stroke-linecap="round"/>';
    },

    caja: function (s) {
      var c = s.color || '#c9a46a', a = s.acento || '#2f5d46';
      return '<rect x="128" y="170" width="144" height="150" rx="6" fill="' + c + '"/>' +
        '<rect x="118" y="146" width="164" height="34" rx="6" fill="' + mezcla(c, 0.1) + '"/>' +
        '<rect x="190" y="146" width="20" height="174" fill="' + a + '"/>' +
        '<path d="M200 146 c -30 -40, -64 -20, -40 0 z M200 146 c 30 -40, 64 -20, 40 0 z" fill="' + a + '"/>' +
        '<rect x="128" y="180" width="144" height="8" fill="#000" opacity=".08"/>';
    },

    // Bolsita de celofán con cinta (maní, chubis, gomitas, dulces). contenido: mani-chocolate | chubis | gomitas | dulces
    bolsita: function (s) {
      var id = 'b' + (++uid), tipo = s.contenido || 'chubis', cinta = s.cinta || '#e3243b', semilla = 11;
      var r = function () { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
      var BOLSA = 'M136 150 L264 150 L278 330 Q200 346 122 330 Z';
      var out = '<defs><clipPath id="' + id + '"><path d="' + BOLSA + '"/></clipPath></defs>';
      out += '<g clip-path="url(#' + id + ')"><rect x="110" y="140" width="180" height="210" fill="' + (s.relleno || '#f6e7da') + '"/>';
      var colores = ['#e53935', '#fdd835', '#1e88e5', '#43a047', '#fb8c00', '#ec407a', '#8e24aa'];
      for (var y = 336; y > 150; y -= 15) {
        for (var x = 118 + (y % 2) * 8; x < 286; x += 17) {
          var px = x + (r() - 0.5) * 7, py = y + (r() - 0.5) * 6, c = colores[Math.floor(r() * colores.length)];
          if (tipo === 'mani-chocolate') {
            out += '<circle cx="' + px + '" cy="' + py + '" r="10" fill="#5b2f1b"/><circle cx="' + (px - 3) + '" cy="' + (py - 3.5) + '" r="3.4" fill="#a1694a" opacity=".8"/>';
          } else if (tipo === 'gomitas') {
            out += '<circle cx="' + px + '" cy="' + py + '" r="9.5" fill="' + c + '" opacity=".92"/><circle cx="' + px + '" cy="' + py + '" r="3.6" fill="#fff" opacity=".55"/>' +
              '<circle cx="' + (px - 4) + '" cy="' + (py - 4) + '" r="1.3" fill="#fff"/><circle cx="' + (px + 3) + '" cy="' + (py - 5) + '" r="1" fill="#fff"/>';
          } else if (tipo === 'dulces') {
            var rot = Math.round(r() * 80 - 40);
            out += '<g transform="rotate(' + rot + ' ' + px + ' ' + py + ')"><path d="M' + (px - 11) + ' ' + py + ' l-7 -6 v12 z M' + (px + 11) + ' ' + py + ' l7 -6 v12 z" fill="' + mezcla(c, 0.25) + '"/>' +
              '<ellipse cx="' + px + '" cy="' + py + '" rx="11" ry="7.5" fill="' + c + '"/><path d="M' + (px - 4) + ' ' + (py - 7) + ' v14 M' + (px + 4) + ' ' + (py - 7) + ' v14" stroke="#fff" stroke-width="2" opacity=".75"/></g>';
          } else {
            out += '<ellipse cx="' + px + '" cy="' + py + '" rx="9" ry="7" fill="' + c + '" stroke="' + mezcla(c, -0.25) + '"/><ellipse cx="' + (px - 3) + '" cy="' + (py - 2.5) + '" rx="3" ry="1.6" fill="#fff" opacity=".7"/>';
          }
        }
      }
      out += '</g>';
      out += '<path d="' + BOLSA + '" fill="#fff" opacity=".14"/>' +
        '<path d="' + BOLSA + '" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="M148 166 L138 318" stroke="#fff" stroke-width="7" opacity=".45" stroke-linecap="round"/><path d="M254 170 L262 300" stroke="#fff" stroke-width="3" opacity=".4" stroke-linecap="round"/>';
      // parte de arriba fruncida
      out += '<path d="M142 150 C146 120 140 96 126 62 L274 62 C260 96 254 120 258 150 Z" fill="#fff" fill-opacity=".28" stroke="#fff" stroke-opacity=".85" stroke-width="2"/>' +
        '<path d="M160 148 L150 70 M185 148 L182 64 M213 148 L218 64 M240 148 L250 70" stroke="#fff" stroke-width="2" opacity=".55"/>';
      // cinta y rosa
      out += '<rect x="136" y="140" width="128" height="14" rx="7" fill="' + cinta + '"/>' +
        '<path d="M200 146 C176 116 146 122 160 146 C146 170 176 172 200 146 Z" fill="' + cinta + '"/><path d="M200 146 C224 116 254 122 240 146 C254 170 224 172 200 146 Z" fill="' + cinta + '"/>' +
        '<path d="M196 150 L182 190 L192 186 L198 196 Z M204 150 L218 190 L208 186 L202 196 Z" fill="' + mezcla(cinta, -0.15) + '"/>' +
        '<circle cx="200" cy="146" r="9" fill="' + mezcla(cinta, -0.12) + '"/>' +
        '<path d="M166 134 q12 -6 22 6 M234 134 q-12 -6 -22 6" stroke="#fff" stroke-width="2.5" opacity=".45" fill="none" stroke-linecap="round"/>';
      // etiqueta
      if (s.etiqueta) {
        var lineas = String(s.etiqueta).split('\n');
        out += '<ellipse cx="200" cy="258" rx="58" ry="' + (lineas.length > 1 ? 34 : 26) + '" fill="#fff" stroke="' + cinta + '" stroke-width="2.5"/>' +
          '<text x="200" y="' + (lineas.length > 1 ? 252 : 266) + '" text-anchor="middle" font-family="Fredoka, Nunito, system-ui, sans-serif" font-weight="600" font-size="22" fill="#4a1530">' +
          lineas.map(function (l, i) { return '<tspan x="200" dy="' + (i ? 24 : 0) + '">' + l.replace(/[<&>]/g, '') + '</tspan>'; }).join('') + '</text>';
      }
      return out;
    },
    vela: function (s) {
      var c = s.color || '#2f5d46', a = s.acento || '#d8b77a';
      return '<path d="M200 96 c 14 18, 10 34, 0 40 c -10 -6, -14 -22, 0 -40 z" fill="#ffb347"/>' +
        '<path d="M200 112 c 6 8, 4 16, 0 20 c -4 -4, -6 -12, 0 -20 z" fill="#fff3c4"/>' +
        '<rect x="198" y="134" width="4" height="18" fill="#333"/>' +
        '<rect x="146" y="150" width="108" height="170" rx="16" fill="' + c + '"/>' +
        '<rect x="146" y="150" width="108" height="22" rx="10" fill="' + mezcla(c, 0.6) + '"/>' +
        '<rect x="162" y="210" width="76" height="62" rx="4" fill="' + a + '"/>' +
        '<rect x="176" y="232" width="48" height="5" rx="2" fill="' + c + '"/><rect x="184" y="244" width="32" height="4" rx="2" fill="' + c + '" opacity=".6"/>';
    }
  };

  function svg(s) {
    s = s || {};
    if (s.arte === 'helado' && window.Helado) return window.Helado.svg(s);
    var fondo = s.fondo || '#ece7de', id = 'g' + (++uid);
    var dib = (dibujos[s.arte] || dibujos.caja)(s);
    var zoom = s.zoom ? ' transform="translate(-130 -110) scale(1.65)"' : '';
    return '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">' +
      '<defs><radialGradient id="' + id + '" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="' + mezcla(fondo, 0.18) + '"/><stop offset="1" stop-color="' + mezcla(fondo, -0.08) + '"/></radialGradient></defs>' +
      '<rect width="400" height="400" fill="url(#' + id + ')"/>' +
      '<g' + zoom + '>' + sombra(200, 338, 92) + dib + '</g></svg>';
  }

  window.Arte = { svg: svg, mezcla: mezcla };
})();
