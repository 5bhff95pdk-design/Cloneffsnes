/* ============================================================
   Police bitmap générée au runtime (aucun asset externe).
   Principe : rasteriser la police système en grand, réduire
   par moyenne en grille 1 bit -> rendu « pixels » net, avec
   tous les accents, et métrique proportionnelle.
   ============================================================ */
(function (FF) {
  'use strict';
  var F = FF.Font = FF.Font || {};

  F.CW = 8;    // largeur de cellule (px logiques)
  F.CH = 12;   // hauteur de cellule (jambages inclus)
  F.SPACE = 1; // interlettre
  F.LINE = 13; // interligne
  var SX = 3, SY = 2; // facteur de réduction source -> pixels

  var SET = (" ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
    "012356789.,:;!?'\u2019\u201C\u201D\"\u00AB\u00BB()\u00BB[]{}-_\u2013\u2014/\\%&*+=<>#~^$|`" +
    "0123456789" +
    "\u00E0\u00E2\u00E4\u00E7\u00E8\u00E9\u00EA\u00EB\u00EE\u00EF\u00F4\u00F9\u00FB\u00FC\u00FF\u0153" +
    "\u00C0\u00C2\u00C7\u00C8\u00C9\u00CA\u00CB\u00CE\u00CF\u00D4\u00D9\u00DB\u00DC\u0152" +
    "\u00B0\u00B7\u2026\u2666\u2665\u2192\u2190\u2191\u2193\u25CF\u2605\u00D7\u2715\u2713");

  var glyphs = null;

  function bake() {
    var doc = (typeof document !== 'undefined') ? document : null;
    if (!doc || !doc.createElement) return {};
    var cw = F.CW * SX, ch = F.CH * SY;
    var cv = doc.createElement('canvas'); cv.width = cw; cv.height = ch;
    var ctx;
    try { ctx = cv.getContext('2d', { willReadFrequently: true }); } catch (e) { return {}; }
    if (!ctx || !ctx.getImageData) return {};
    var src = Math.round(ch * 0.92), base = Math.round(ch * 0.74);
    var uniq = {}, keys = [], i;
    for (i = 0; i < SET.length; i++) if (!uniq[SET[i]]) { uniq[SET[i]] = 1; keys.push(SET[i]); }
    var g = {};
    for (var k = 0; k < keys.length; k++) {
      var chx = keys[k];
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.imageSmoothingEnabled = true;
      ctx.font = '700 ' + src + 'px ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace';
      ctx.fillText(chx, cw / 2, base);
      var data;
      try { data = ctx.getImageData(0, 0, cw, ch).data; } catch (e) { return g; }
      var bits = new Uint8Array(F.CW * F.CH), minx = 99, maxx = -1;
      for (var y = 0; y < F.CH; y++) {
        for (var x = 0; x < F.CW; x++) {
          var acc = 0;
          for (var sy = 0; sy < SY; sy++) for (var sx = 0; sx < SX; sx++)
            acc += data[((y * SY + sy) * cw + (x * SX + sx)) * 4 + 3];
          if (acc / (SX * SY * 255) > 0.40) { bits[y * F.CW + x] = 1; if (x < minx) minx = x; if (x > maxx) maxx = x; }
        }
      }
      if (minx > 0 && minx < 99) {
        var nb = new Uint8Array(F.CW * F.CH);
        for (var yy = 0; yy < F.CH; yy++) for (var xx = 0; xx < F.CW; xx++)
          if (bits[yy * F.CW + xx]) nb[yy * F.CW + (xx - minx)] = 1;
        bits = nb;
      }
      var adv = (maxx >= minx) ? (maxx - minx + 1) : (chx === ' ' ? 4 : 3);
      g[chx] = { b: bits, a: Math.min(F.CW, adv) + F.SPACE };
    }
    return g;
  }

  F.build = function () { glyphs = bake(); return glyphs; };
  F.ready = function () { if (!glyphs) F.build(); return glyphs; };

  F.width = function (str) {
    var g = F.ready(), w = 0, s = String(str);
    for (var i = 0; i < s.length; i++) w += (g[s[i]] || g['?'] || { a: 5 }).a;
    return w;
  };
  F.height = function (str, px) {
    return F.lines(str, px).length * F.LINE;
  };
  /* découpe au plus juste : on mesure la police, pas le nombre de lettres */
  F.lines = function (str, px) {
    px = px || 208;
    var out = [], para = String(str == null ? '' : str).split('\n');
    for (var pi = 0; pi < para.length; pi++) {
      var words = para[pi].split(' '), line = '';
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (!w.length) continue;
        var t = line ? line + ' ' + w : w;
        if (F.width(t) <= px || !line) {
          if (F.width(t) > px && !line) {
            /* mot trop long : on le coupe */
            var cut = '';
            for (var q = 0; q < w.length; q++) {
              if (F.width(cut + w[q]) > px && cut) { out.push(cut); cut = w[q]; }
              else cut += w[q];
            }
            line = cut;
          } else line = t;
        } else { out.push(line); line = w; }
      }
      out.push(line);
    }
    return out.filter(function (l, i) { return l.length || i < 2; });
  };
  F.fit = function (str, px) {
    str = String(str == null ? '' : str);
    if (F.width(str) <= px) return str;
    while (str.length > 1 && F.width(str + '…') > px) str = str.slice(0, -1);
    return str + '…';
  };

  /** opt: {color, shadow, align:'left|center|right', scale:1} */
  F.draw = function (ctx, str, x, y, opt) {
    opt = opt || {};
    var g = F.ready(); str = String(str);
    var w = F.width(str);
    if (opt.align === 'center') x -= (w / 2) | 0; else if (opt.align === 'right') x -= w;
    x = Math.round(x); y = Math.round(y);
    var sc = opt.scale || 1;
    function pass(ox, oy, col) {
      if (!col) return;
      ctx.fillStyle = col;
      var cx = x;
      for (var i = 0; i < str.length; i++) {
        var gl = g[str[i]];
        if (gl) {
          var b = gl.b, last = -1;
          for (var yy = 0; yy < F.CH; yy++) {
            for (var xx = 0; xx <= F.CW; xx++) {
              var on = xx < F.CW && b[yy * F.CW + xx];
              if (on && last < 0) last = xx;
              if (!on && last >= 0) {
                ctx.fillRect(cx + last + ox, y + yy + oy, (xx - last) * sc, sc);
                last = -1;
              }
            }
          }
        }
        cx += (gl ? gl.a : 4) * sc;
      }
    }
    pass(sc, sc, opt.shadow !== undefined ? opt.shadow : '#070a14');
    pass(0, 0, opt.color || '#eef3ff');
    return w * sc;
  };
})(this.FF = this.FF || {});
