/* ============================================================
   LES QUATRE CRISTAUX — utilitaires
   ============================================================ */
(function (FF) {
  'use strict';
  var U = FF.U = {};

  /* ---- math ---- */
  U.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  U.lerp = function (a, b, t) { return a + (b - a) * t; };
  U.approach = function (v, t, s) { return v < t ? Math.min(v + s, t) : Math.max(v - s, t); };
  U.wrap = function (v, n) { return ((v % n) + n) % n; };
  U.ease = function (t) { return t * t * (3 - 2 * t); };
  U.easeOut = function (t) { return 1 - (1 - t) * (1 - t); };

  /* ---- RNG déterministe (mulberry32) ---- */
  U.rng = function (seed) {
    var s = (seed >>> 0) || 1;
    var r = function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.int = function (n) { return Math.floor(r() * n); };
    r.range = function (a, b) { return a + Math.floor(r() * (b - a + 1)); };
    r.pick = function (arr) { return arr[Math.floor(r() * arr.length)]; };
    r.chance = function (p) { return r() < p; };
    r.shuffle = function (arr) {
      for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(r() * (i + 1)), t = arr[i]; arr[i] = arr[j]; arr[j] = t;
      }
      return arr;
    };
    return r;
  };
  U.hash = function (str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < String(str).length; i++) { h ^= String(str).charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  U.rand = function (n) { return Math.floor(Math.random() * n); };
  U.pick = function (a) { return a[Math.floor(Math.random() * a.length)]; };

  /* ---- couleur ---- */
  U.hex = function (c) {
    if (typeof c === 'number') c = (c | 0).toString(16).slice(-6).padStart(6, '0'), c = '#' + c;
    return c;
  };
  U.shade = function (hex, k) {
    var c = U.rgb(hex);
    return U.rgb2hex([U.clamp(Math.round(c[0] * k), 0, 255), U.clamp(Math.round(c[1] * k), 0, 255), U.clamp(Math.round(c[2] * k), 0, 255)]);
  };
  U.rgb = function (hex) {
    hex = String(hex).replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.rgb2hex = function (a) {
    return '#' + ((1 << 24) + (a[0] << 16) + (a[1] << 8) + a[2]).toString(16).slice(1);
  };
  U.mix = function (h1, h2, t) {
    var a = U.rgb(h1), b = U.rgb(h2);
    return U.rgb2hex([Math.round(U.lerp(a[0], b[0], t)), Math.round(U.lerp(a[1], b[1], t)), Math.round(U.lerp(a[2], b[2], t))]);
  };
  /* dégrade une palette en N tons (pour tuiles / ombrages) */
  U.ramp = function (base, n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(U.shade(base, 0.55 + 0.85 * (i / Math.max(1, n - 1))));
    return out;
  };

  /* ---- format FR ---- */
  U.num = function (n) {
    n = Math.round(n || 0);
    var s = String(Math.abs(n)), o = '', c = 0;
    for (var i = s.length - 1; i >= 0; i--) { o = s[i] + o; if (++c % 3 === 0 && i > 0) o = '\u2009' + o; }
    return (n < 0 ? '-' : '') + o;
  };
  U.pad = function (s, n, r) { s = String(s); while (s.length < n) s = r ? s + ' ' : ' ' + s; return s; };

  /* ---- stockage ---- */
  U.store = {
    ok: (function () { try { var k = '__t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; } catch (e) { return false; } })(),
    get: function (k, def) {
      if (!this.ok) return def;
      try { var v = localStorage.getItem(k); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
    },
    set: function (k, v) {
      if (!this.ok) return false;
      try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; }
    },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { } }
  };

  /* ---- petites structures ---- */
  U.Signal = function () {
    var l = [];
    return {
      add: function (f) { l.push(f); return f; },
      fire: function () { for (var i = 0; i < l.length; i++) l[i].apply(null, arguments); }
    };
  };

  U.roman = function (n) {
    var t = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']], s = '';
    for (var i = 0; i < t.length; i++) while (n >= t[i][0]) { s += t[i][1]; n -= t[i][0]; }
    return s || '—';
  };

  /* tranche de texte (pour les boîtes de dialogue) */
  U.wrapText = function (str, maxChars) {
    var words = String(str).split(/\s+/), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (w.indexOf('\n') >= 0) {
        var parts = w.split('\n');
        for (var j = 0; j < parts.length; j++) {
          if (j > 0) { lines.push(cur); cur = ''; }
          if ((cur + ' ' + parts[j]).trim().length > maxChars && cur) { lines.push(cur); cur = parts[j]; }
          else cur = (cur ? cur + ' ' : '') + parts[j];
        }
        continue;
      }
      if ((cur + ' ' + w).replace(/^\s+/, '').length > maxChars && cur) { lines.push(cur); cur = w; }
      else cur = cur ? cur + ' ' + w : w;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  U.deep = function (o) { return JSON.parse(JSON.stringify(o)); };
  U.copy = function (o) { var r = {}; for (var k in o) r[k] = o[k]; return r; };
  U.dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
})(this.FF = this.FF || {});
