/* ============================================================
   Bake — fabrique les tuiles, personnages et icônes en pixel art.
   Tout est dessiné par du code : aucune image n'est chargée.
   ============================================================ */
(function (FF) {
  'use strict';
  var U = FF.U, B = FF.Bake = {};
  var T = FF.Gfx ? FF.Gfx.TILE : 16;
  T = T || 16;

  function cv(w, h) { return FF.Gfx.canvas(w || T, h || T); }

  /* ------- petite API de dessin ------- */
  function pen(c) {
    var g = c.getContext('2d');
    return {
      g: g,
      px: function (x, y, col) { if (col) { g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); } },
      r: function (x, y, w, h, col) { if (col) { g.fillStyle = col; g.fillRect(x | 0, y | 0, w, h); } },
      line: function (x0, y0, x1, y1, col) {
        if (!col) return; g.fillStyle = col;
        x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
        var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx - dy;
        for (var i = 0; i < 200; i++) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; var e2 = 2 * e; if (e2 > -dy) { e -= dy; x0 += sx; } if (e2 < dx) { e += dx; y0 += sy; } }
      }
    };
  }
  B.pen = pen;
  var _chestCache = {};
  /* tuile coffre (posée sur le sol du thème), version fermée/ouverte */
  B.chestTile = function (themeName, ouvert) {
    var k = themeName + (ouvert ? '1' : '0');
    if (_chestCache[k]) return _chestCache[k];
    var th = B.themes[themeName] || B.themes.field;
    var c = cv(T, T), g = pen(c);
    var base = th['.'] && th['.'].frames && th['.'].frames[0];
    if (base && base.getContext) { try { g.g.drawImage(base, 0, 0); } catch (e) { } }
    (ouvert ? PAINT.chestOpen : PAINT.chest)(g, {}, U.rng(3));
    _chestCache[k] = c;
    return c;
  };

  function speck(g, rng, col, n, x0, y0, w, h) {
    g.fillStyle = col;
    for (var i = 0; i < n; i++) g.fillRect((x0 + rng() * w) | 0, (y0 + rng() * h) | 0, 1, 1);
  }
  function patches(g, rng, col, n, size, w, h) {
    g.fillStyle = col;
    for (var i = 0; i < n; i++) {
      var x = (rng() * w) | 0, y = (rng() * h) | 0, s = size + ((rng() * 2) | 0);
      g.fillRect(x, y, s, Math.max(1, s - 1));
    }
  }

  /* ============================================================
     TUILES
     ============================================================ */
  var PAINT = {};
  PAINT.grass = function (g, o, rng) {
    g.r(0, 0, T, T, o.c1);
    patches(g.g, rng, o.c2, 5, 2, T, T);
    speck(g.g, rng, o.c3, 14, 0, 0, T, T);
    if (o.flowers) speck(g.g, rng, o.flowers, 3, 0, 0, T, T);
  };
  PAINT.dirt = function (g, o, rng) {
    g.r(0, 0, T, T, o.c1);
    speck(g.g, rng, o.c2, 26, 0, 0, T, T);
    speck(g.g, rng, o.c3, 10, 0, 0, T, T);
  };
  PAINT.sand = function (g, o, rng) {
    g.r(0, 0, T, T, o.c1);
    speck(g.g, rng, o.c2, 16, 0, 0, T, T);
    for (var i = 0; i < 3; i++) { var y = (rng() * T) | 0; g.r(0, y, T, 1, o.c3); }
  };
  PAINT.water = function (g, o, rng) {
    g.r(0, 0, T, T, o.c1);
    g.r(0, 0, T, 2, o.c2);
    speck(g.g, rng, o.c3, 10, 0, 3, T, T - 3);
    g.r(2, 11, 5, 1, o.c4 || U.shade(o.c1, 1.5));
    g.r(9, 5, 4, 1, o.c4 || U.shade(o.c1, 1.5));
  };
  PAINT.lava = function (g, o, rng) {
    g.r(0, 0, T, T, o.c1);
    patches(g.g, rng, o.c2, 4, 3, T, T);
    speck(g.g, rng, o.c3, 14, 0, 0, T, T);
    g.r(0, 0, T, 1, '#00000055');
  };
  PAINT.rock = function (g, o, rng) {
    g.r(0, 0, T, T, o.c1);
    g.r(0, 0, T, 1, o.c3); g.r(0, 0, 1, T, o.c3);
    g.r(0, T - 1, T, 1, o.c2); g.r(T - 1, 0, 1, T, o.c2);
    speck(g.g, rng, o.c2, 18, 1, 1, T - 2, T - 2);
    g.line(3, 4, 9, 11, o.c2); g.line(11, 3, 6, 8, U.shade(o.c2, .8));
  };
  PAINT.wall = function (g, o, rng) { /* mur de briques */
    g.r(0, 0, T, T, o.c1);
    var bh = 4, i, j;
    for (j = 0; j < T / bh; j++) {
      var off = (j % 2) * 4;
      g.r(0, j * bh, T, 1, o.c2);
      for (i = 0; i < 4; i++) g.r(((i * 8 + off) % T), j * bh, 1, bh, o.c2);
    }
    speck(g.g, rng, o.c3, 12, 0, 0, T, T);
    g.r(0, 0, T, 1, U.shade(o.c3, 1.15));
  };
  PAINT.floor = function (g, o, rng) {
    g.r(0, 0, T, T, o.c1);
    g.r(0, 0, T, 1, o.c2); g.r(0, 0, 1, T, o.c2);
    speck(g.g, rng, o.c3, 12, 1, 1, T - 1, T - 1);
    if (o.rug) { g.r(0, 6, T, 4, o.rug); g.r(0, 6, T, 1, U.shade(o.rug, .7)); }
  };
  PAINT.marble = function (g, o, rng) {
    g.r(0, 0, T, T, o.c1);
    var i;
    for (i = 0; i < 5; i++) {
      var x = (rng() * T) | 0, y = (rng() * T) | 0;
      g.line(x, y, (x + 4 + rng() * 6) | 0, (y + 3 - rng() * 6) | 0, o.c2);
    }
    speck(g.g, rng, o.c3, 8, 0, 0, T, T);
    g.r(0, 0, T, 1, o.c3); g.r(0, T - 1, T, 1, o.c2);
  };
  PAINT.tree = function (g, o) {
    g.r(0, 0, T, T, o.bg || '#00000000');
    /* tronc */
    g.r(7, 10, 2, 6, o.trunk || '#5a3d24');
    g.r(6, 15, 4, 1, o.trunk || '#5a3d24');
    /* feuillage en choux */
    var c = o.c1, d = o.c2, l = o.c3;
    g.r(4, 2, 8, 9, c); g.r(2, 4, 12, 6, c);
    g.r(4, 2, 8, 1, l); g.r(3, 3, 2, 2, l); g.r(2, 6, 2, 2, l);
    g.r(4, 9, 8, 2, d); g.r(11, 4, 3, 4, d);
    g.px(6, 4, l); g.px(9, 6, l); g.px(5, 7, l);
  };
  PAINT.pine = function (g, o) {
    g.r(0, 0, T, T, o.bg || '#00000000');
    g.r(7, 12, 2, 4, o.trunk || '#4a3520');
    for (var i = 0; i < 5; i++) {
      var w = 3 + i * 2, y = 1 + i * 2;
      g.r((T - w) / 2 | 0, y, w, 2, o.c1);
      g.r((T - w) / 2 | 0, y, w - 1, 1, o.c3);
      if (i > 0) g.r((T - w) / 2 | 0, y + 1, w, 1, o.c2);
    }
    if (o.snow) { g.r(4, 3, 8, 1, '#eef6ff'); g.r(2, 7, 12, 1, '#dfeaff'); }
  };
  PAINT.rockpile = function (g, o) {
    g.r(0, 0, T, T, o.bg || '#00000000');
    g.r(2, 6, 12, 9, o.c1); g.r(4, 3, 8, 4, o.c1);
    g.r(4, 3, 8, 1, o.c3); g.r(2, 6, 12, 1, o.c3);
    g.r(2, 13, 12, 2, o.c2); g.r(9, 5, 3, 2, o.c2);
    speck(g.g, U.rng(7), o.c2, 8, 3, 6, 10, 8);
  };
  PAINT.mountain = function (g, o) {
    for (var y = 0; y < T; y++) {
      var w = Math.min(T, 4 + y * 1.4);
      g.r(((T - w) / 2) | 0, y, w | 0, 1, o.c1);
    }
    g.r(5, 2, 6, 3, o.c3 || '#ffffff');
    g.r(4, 5, 8, 1, U.shade(o.c3 || '#fff', .8));
    for (y = 3; y < T; y += 3) g.r(3, y, 10, 1, o.c2);
  };
  PAINT.house = function (g, o) { /* mur de maison avec liseré */
    g.r(0, 0, T, T, o.c1);
    g.r(0, 0, T, 1, o.c2);
    g.r(0, T - 1, T, 1, o.c3);
    speck(g.g, U.rng(3), o.c3, 10, 1, 1, T - 2, T - 2);
  };
  PAINT.roof = function (g, o) {
    g.r(0, 0, T, T, o.c1);
    for (var y = 2; y < T; y += 4) { g.r(0, y, T, 1, o.c2); g.r(0, y + 1, T, 1, U.shade(o.c1, 1.15)); }
    g.r(0, 0, T, 2, U.shade(o.c1, 1.25));
  };
  PAINT.window = function (g, o) {
    PAINT.house(g, o, U.rng(3));
    g.r(3, 4, 10, 8, '#1b2438');
    g.r(4, 5, 8, 6, o.lit ? '#ffd98a' : '#5a7fb0');
    g.r(4, 5, 8, 1, o.lit ? '#fff0c0' : '#8fb3e0');
    g.line(8, 5, 8, 10, '#1b2438'); g.line(4, 8, 12, 8, '#1b2438');
    g.r(3, 12, 10, 1, o.c2);
  };
  PAINT.door = function (g, o) {
    g.r(0, 0, T, T, o.wall || '#6a5140');
    g.r(3, 2, 10, 14, o.c1 || '#4a3520');
    g.r(4, 3, 8, 12, o.c2 || '#6a4b2c');
    g.r(4, 3, 8, 1, '#00000033');
    g.px(10, 9, '#ffd257'); g.px(10, 10, '#c9a02c');
    g.r(6, 5, 4, 3, '#2b3a55'); g.r(6, 5, 4, 1, '#8fb3e0');
  };
  PAINT.stairs = function (g, o, rng) {
    g.r(0, 0, T, T, o.c1);
    for (var i = 0; i < 4; i++) {
      var y = i * 4;
      g.r(0, y, T, 2, U.shade(o.c2, 1 + i * .05));
      g.r(0, y + 2, T, 2, o.c2);
      g.r(0, y, T, 1, o.c3);
    }
  };
  PAINT.chest = function (g, o) {
    g.r(0, 0, T, T, o.bg);
    g.r(2, 5, 12, 9, '#6a4b2c'); g.r(2, 5, 12, 3, '#8a5f38');
    g.r(2, 8, 12, 1, '#3a2616');
    g.r(6, 7, 4, 4, '#ffd257'); g.r(7, 8, 2, 2, '#8a6b1f');
    g.r(2, 5, 12, 1, '#ffe88a'); g.r(2, 13, 12, 1, '#3a2616');
  };
  PAINT.chestOpen = function (g, o) {
    g.r(0, 0, T, T, o.bg);
    g.r(2, 3, 12, 4, '#3a2616'); g.r(3, 4, 10, 2, '#6a4b2c');
    g.r(2, 8, 12, 6, '#6a4b2c'); g.r(3, 9, 10, 4, '#2b1c10');
  };
  PAINT.crystal = function (g, o) {
    g.r(0, 0, T, T, o.bg || o.floor || '#12172b');
    var c = o.c1 || '#6fe3ff', d = o.c2 || '#1f4a6b';
    g.r(7, 2, 2, 12, d);
    for (var y = 0; y < 12; y++) {
      var w = Math.max(1, 6 - Math.abs(y - 5));
      g.r((8 - w / 2) | 0, y + 2, w | 0, 1, y < 6 ? U.shade(c, 1.2) : c);
    }
    g.px(7, 4, '#ffffff'); g.px(8, 3, '#ffffff');
    g.r(4, 13, 8, 2, '#00000055');
  };
  PAINT.sign = function (g, o) {
    g.r(0, 0, T, T, o.bg);
    g.r(7, 9, 2, 6, '#5a3d24');
    g.r(2, 3, 12, 7, '#8a5f38'); g.r(3, 4, 10, 5, '#c9a86a');
    g.r(4, 6, 8, 1, '#5a3d24'); g.r(4, 8, 6, 1, '#5a3d24');
  };
  PAINT.barrel = function (g, o) {
    g.r(0, 0, T, T, o.bg);
    g.r(3, 3, 10, 12, '#6a4b2c'); g.r(3, 3, 10, 2, '#8a5f38');
    g.r(3, 6, 10, 1, '#3a2616'); g.r(3, 11, 10, 1, '#3a2616');
    g.r(4, 4, 2, 10, '#8a5f38');
  };
  PAINT.lamp = function (g, o) {
    g.r(0, 0, T, T, o.bg);
    g.r(7, 8, 2, 7, '#3a3550');
    g.r(5, 2, 6, 7, '#5a5170'); g.r(6, 3, 4, 5, o.c1 || '#ffd98a');
    g.r(6, 3, 4, 1, '#fff6d0');
  };
  PAINT.bridge = function (g, o) {
    g.r(0, 0, T, T, o.water || '#2b4f7a');
    g.r(0, 2, T, 12, o.c1 || '#6a4b2c');
    for (var i = 0; i < T; i += 4) g.r(i, 2, 1, 12, o.c2 || '#4a3520');
    g.r(0, 1, T, 1, '#3a2616'); g.r(0, 14, T, 1, '#3a2616');
  };
  PAINT.fence = function (g, o) {
    g.r(0, 0, T, T, o.bg);
    g.r(1, 6, 14, 2, o.c1); g.r(1, 10, 14, 2, o.c1);
    g.r(2, 4, 2, 10, o.c2); g.r(12, 4, 2, 10, o.c2);
  };
  PAINT.grave = function (g, o) {
    g.r(0, 0, T, T, o.bg);
    g.r(4, 4, 8, 11, o.c1); g.r(5, 3, 6, 2, o.c1);
    g.r(4, 4, 8, 1, o.c2); g.r(6, 7, 4, 1, o.c3); g.r(7, 6, 2, 4, o.c3);
  };
  PAINT.pillar = function (g, o) {
    g.r(0, 0, T, T, o.bg || '#0b1020');
    g.r(3, 0, 10, 16, o.c1);
    g.r(3, 0, 2, 16, o.c2); g.r(11, 0, 2, 16, o.c3);
    g.r(2, 1, 12, 2, o.c2); g.r(2, 13, 12, 2, o.c2);
  };
  PAINT.counter = function (g, o) {
    g.r(0, 0, T, T, o.bg);
    g.r(0, 4, T, 6, o.c1); g.r(0, 4, T, 2, o.c2); g.r(0, 9, T, 1, U.shade(o.c1, .6));
    g.r(0, 10, T, 6, U.shade(o.c1, .8));
  };
  PAINT.shelf = function (g, o) {
    g.r(0, 0, T, T, o.c1 || '#4a3520');
    g.r(1, 2, 14, 1, '#3a2616'); g.r(1, 8, 14, 1, '#3a2616');
    var cols = ['#c95a5a', '#5a7fc9', '#c9b45a', '#6ab06a', '#a06ac9'];
    for (var i = 0; i < 5; i++) g.r(2 + i * 3, 3, 2, 5, cols[i]);
    for (i = 0; i < 4; i++) g.r(3 + i * 3, 9, 2, 5, cols[(i + 2) % 5]);
    g.r(0, 14, T, 2, '#3a2616');
  };
  PAINT.bed = function (g, o) {
    g.r(0, 0, T, T, o.bg);
    g.r(1, 2, 14, 13, '#6a4b2c');
    g.r(2, 3, 12, 8, o.c1 || '#e6eef6');
    g.r(2, 3, 12, 2, '#ffffff');
    g.r(2, 11, 12, 3, o.c2 || '#c95a7a');
  };
  PAINT.torch = function (g, o) {
    g.r(0, 0, T, T, o.bg);
    g.r(7, 6, 2, 9, '#5a4a35');
    g.r(6, 2, 4, 5, o.c1 || '#ff9a3d');
    g.r(7, 1, 2, 3, o.c2 || '#ffe066');
    g.px(7, 4, '#fff6c0');
  };
  PAINT.cave = function (g, o, rng) {
    (PAINT[o.floor || 'grass'] || PAINT.grass)(g, o, rng);
    g.r(2, 4, 12, 12, o.c1 || '#181420');
    g.r(3, 5, 10, 10, '#0a0810');
    g.r(1, 3, 14, 2, o.c2 || '#4a4258'); g.r(1, 3, 2, 6, o.c2 || '#4a4258'); g.r(13, 3, 2, 6, o.c2 || '#4a4258');
    g.r(6, 1, 4, 3, o.c2 || '#4a4258');
    for (var i = 0; i < 4; i++) g.px(4 + i * 3, 6 + (i % 2) * 2, '#000');
  };
  PAINT.castle = function (g, o, rng) {
    (PAINT[o.floor || 'grass'] || PAINT.grass)(g, o, rng);
    g.r(1, 2, 14, 14, o.c1 || '#8a90a8');
    g.r(1, 2, 14, 2, o.c2 || '#a6aec6');
    for (var i = 0; i < 4; i++) { g.r(1 + i * 4, 0, 2, 3, o.c1 || '#8a90a8'); }
    g.r(6, 8, 4, 8, '#2b2018'); g.r(6, 8, 4, 1, '#4a3520');
    g.px(4, 5, '#2b3a55'); g.px(11, 5, '#2b3a55');
  };
  PAINT.tent2 = function (g, o, rng) {
    (PAINT[o.floor || 'grass'] || PAINT.grass)(g, o, rng);
    for (var y = 0; y < 11; y++) { var w = 15 - Math.abs(y - 10); g.r(8 - (w / 2 | 0), 5 + y, w, 1, y % 3 ? '#8a5f38' : '#a67845'); }
    g.r(6, 13, 4, 3, '#2b2018');
  };
  PAINT.flowers = function (g, o, rng) {
    PAINT.grass(g, o, rng);
    var cs = o.cs || ['#ff6a8a', '#ffd257', '#a06aff'];
    for (var i = 0; i < 4; i++) {
      var x = 1 + ((rng() * 13) | 0), y = 3 + ((rng() * 11) | 0), c = cs[i % cs.length];
      g.px(x, y, c); g.px(x - 1, y + 1, c); g.px(x + 1, y + 1, c); g.px(x, y + 1, '#ffffff'); g.px(x, y + 2, '#4a8a3d');
    }
  };
  PAINT.ice = function (g, o, rng) {
    g.r(0, 0, T, T, o.c1);
    g.r(0, 0, T, 2, o.c2);
    for (var i = 0; i < 3; i++) g.line(rng() * T | 0, rng() * T | 0, rng() * T | 0, rng() * T | 0, o.c3);
    speck(g.g, rng, '#ffffff', 8, 0, 0, T, T);
  };
  PAINT.carpet = function (g, o, rng) {
    g.r(0, 0, T, T, o.c1);
    g.r(0, 0, T, 1, o.c2); g.r(0, T - 1, T, 1, o.c2);
    for (var i = 2; i < T - 2; i += 4) g.r(i, 4, 2, T - 8, o.c3);
  };

  /* ---------- thèmes ---------- */
  function theme(o) {
    B.DEFS = B.DEFS || {}; B.DEFS[o.name] = o;
    /* o.tiles: char -> {p:'grass', solid:1, ...} ; construit {char: [frames]} */
    var out = {};
    for (var ch in o.tiles) {
      var t = o.tiles[ch], frames = [];
      var rng = U.rng(U.hash(o.name + ch));
      var anim = t.anim || 0;
      var n = anim ? 4 : 1;
      for (var f = 0; f < n; f++) {
        var c = cv(T, T), p = pen(c);
        var opt = U.copy(t);
        if (anim === 'water') { opt.c1 = U.shade(t.c1, 1 + 0.06 * Math.sin((f / n) * 6.283)); opt.c4 = U.shade(t.c3 || t.c1, 1.5 - .1 * f); }
        if (anim === 'lava') { opt.c2 = U.shade(t.c2, 1 + .12 * Math.sin((f / n) * 6.283 + 1)); }
        if (anim === 'torch') { opt.c1 = U.shade(t.c1 || '#ff9a3d', 1 + .12 * Math.sin((f / n) * 6.283)); opt.c2 = U.shade(t.c2 || '#ffe066', 1 + .1 * Math.cos((f / n) * 6.283)); }
        (PAINT[t.p] || PAINT.grass)(p, opt, U.rng(U.hash(o.name + ch + f)));
        frames.push(c);
      }
      out[ch] = { frames: frames, solid: !!t.solid, anim: anim ? 4 : 0, over: t.over, script: t.script, half: t.half, bg: t.bg };
    }
    out._name = o.name;
    out.walk = o.walk;
    out.voidChar = o.voidChar || ' ';
    out.encTiles = o.encTiles || '';
    return out;
  }
  B.themes = {};

  B.buildThemes = function () {
    var TH = B.themes;
    TH.field = theme({
      name: 'field', walk: 'plaine',
      tiles: {
        '.': { p: 'grass', c1: '#3f7a41', c2: '#356a37', c3: '#4f8f4f' },
        ',': { p: 'flowers', c1: '#3f7a41', c2: '#356a37', c3: '#4f8f4f', cs: ['#ffd257', '#ff6a8a'] },
        'T': { p: 'tree', c1: '#2f5f33', c2: '#244a28', c3: '#4a8a4c', trunk: '#4a3520', solid: 1 },
        'P': { p: 'pine', c1: '#24513a', c2: '#1a3a2a', c3: '#3a7050', solid: 1 },
        '#': { p: 'mountain', c1: '#6a6f80', c2: '#464b5c', c3: '#cfe0e6', solid: 1 },
        'R': { p: 'rockpile', c1: '#7a7f90', c2: '#4d5160', c3: '#a6b0c9', solid: 1 },
        '~': { p: 'water', c1: '#1f4f8a', c2: '#2b62a0', c3: '#4a8fd0', anim: 'water', solid: 1 },
        '=': { p: 'bridge', c1: '#8a6b4a', c2: '#5a4530', water: '#1f4f8a' },
        'p': { p: 'dirt', c1: '#9e8a63', c2: '#8a7752', c3: '#b4a078' },
        'S': { p: 'sand', c1: '#dcc78a', c2: '#c9b478', c3: '#f0e0b0' },
        'f': { p: 'fence', c1: '#a68a5a', c2: '#6a5138', solid: 1 },
        's': { p: 'sign', c1: '#c9a86a', c2: '#5a3d24', bg: '#3f7a41', solid: 1 },
        'b': { p: 'barrel', bg: '#9e8a63', solid: 1 },
        'g': { p: 'grave', c1: '#8f9bb3', c2: '#5a6378', c3: '#c9d6e6', bg: '#356a37', solid: 1 },
        'W': { p: 'ice', c1: '#dbeeff', c2: '#f5fbff', c3: '#a8c8e6' },
        'D': { p: 'sand', c1: '#e0cd96', c2: '#cbb478', c3: '#f2e3b6' },
        'V': { p: 'rockpile', c1: '#4a3d3d', c2: '#2e2424', c3: '#6a5555', solid: 1 },
        'L': { p: 'lava', c1: '#c9431f', c2: '#ff8a3d', c3: '#ffe066', anim: 'lava', solid: 1 },
        'M': { p: 'mountain', c1: '#5a5f70', c2: '#3d4152', c3: '#cfe0e6', solid: 1 },
        'c': { p: 'crystal', c1: '#8ef0ff', c2: '#20485a', bg: '#3f7a41', solid: 1 },
        'h': { p: 'house', c1: '#b08a5a', c2: '#7a5a35', c3: '#c9a878', solid: 1 },
        'r': { p: 'roof', c1: '#a34a3d', c2: '#7a2f28', c3: '#c46a58', solid: 1 },
        'w': { p: 'window', c1: '#b08a5a', c2: '#7a5a35', c3: '#c9a878', solid: 1 },
        'K': { p: 'castle', c1: '#8a90a8', c2: '#a6aec6', floor: 'dirt', solid: 1 },
        'e': { p: 'cave', c1: '#181420', c2: '#5a5168', floor: 'grass', solid: 0, script: 'door' },
        'E': { p: 'cave', c1: '#181420', c2: '#5a5168', floor: 'sand', solid: 0, script: 'door' },
        't': { p: 'tent2', floor: 'snow', solid: 0, script: 'door' }
      }
    });
    TH.town = theme({
      name: 'town',
      tiles: {
        '.': { p: 'grass', c1: '#3f7a41', c2: '#356a37', c3: '#4f8f4f' },
        ',': { p: 'flowers', c1: '#3f7a41', c2: '#356a37', c3: '#4f8f4f', cs: ['#ffd257', '#ff6a8a', '#a06aff'] },
        'p': { p: 'floor', c1: '#8f8776', c2: '#6e685b', c3: '#a8a090' },
        'h': { p: 'house', c1: '#b08a5a', c2: '#7a5a35', c3: '#c9a878', solid: 1 },
        'r': { p: 'roof', c1: '#a34a3d', c2: '#7a2f28', c3: '#c46a58', solid: 1 },
        'w': { p: 'window', c1: '#b08a5a', c2: '#7a5a35', c3: '#c9a878', solid: 1 },
        'd': { p: 'door', wall: '#b08a5a', solid: 0, script: 'door' },
        'T': { p: 'tree', c1: '#2f5f33', c2: '#244a28', c3: '#4a8a4c', solid: 1 },
        '#': { p: 'wall', c1: '#6a6f80', c2: '#4a4e5c', c3: '#8f9bb3', solid: 1 },
        '~': { p: 'water', c1: '#1f4f8a', c2: '#2b62a0', c3: '#4a8fd0', anim: 'water', solid: 1 },
        'f': { p: 'fence', c1: '#a68a5a', c2: '#6a5138', solid: 1 },
        'l': { p: 'lamp', c1: '#ffd98a', anim: 'torch', solid: 1 },
        'b': { p: 'barrel', bg: '#8f8776', solid: 1 },
        's': { p: 'sign', bg: '#8f8776', c1: '#c9a86a', solid: 1 },
        'c': { p: 'crystal', c1: '#6fe3ff', c2: '#1f4a6b', bg: '#8f8776', solid: 1 },
        'C': { p: 'crystal', c1: '#ff8ad0', c2: '#6b1f5a', bg: '#8f8776', solid: 1 },
        'g': { p: 'grave', c1: '#8f9bb3', c2: '#5a6378', c3: '#c9d6e6', bg: '#3f7a41', solid: 1 },
        'e': { p: 'stairs', c1: '#8f8776', c2: '#6e685b', c3: '#a8a090', solid: 0, script: 'stairs' },
        'E': { p: 'cave', c1: '#181420', c2: '#5a5168', floor: 'grass', solid: 0, script: 'door' },
        'K': { p: 'castle', c1: '#8a90a8', c2: '#a6aec6', floor: 'floor', solid: 1 },
        'M': { p: 'mountain', c1: '#6a6f80', c2: '#464b5c', c3: '#cfe0e6', solid: 1 }
      }
    });
    TH.cave = theme({
      name: 'cave',
      tiles: {
        '#': { p: 'wall', c1: '#4a4258', c2: '#2e2938', c3: '#655a78', solid: 1 },
        '.': { p: 'floor', c1: '#3a3547', c2: '#2a2536', c3: '#4e4760' },
        '~': { p: 'water', c1: '#1c3a5a', c2: '#264a6e', c3: '#3f6f9e', anim: 'water', solid: 1 },
        'R': { p: 'rockpile', c1: '#5a5168', c2: '#37313f', c3: '#786f8a', solid: 1 },
        'l': { p: 'torch', c1: '#ff9a3d', c2: '#ffe066', bg: '#3a3547', anim: 'torch', solid: 1 },
        'b': { p: 'barrel', bg: '#3a3547', solid: 1 },
        's': { p: 'sign', bg: '#3a3547', c1: '#8a7a5a', solid: 1 },
        'c': { p: 'crystal', c1: '#8ef0ff', c2: '#20485a', bg: '#3a3547', solid: 1 },
        'e': { p: 'stairs', c1: '#3a3547', c2: '#2a2536', c3: '#5f5676', script: 'stairs' },
        'T': { p: 'pine', c1: '#2a3a3a', c2: '#1a2626', c3: '#3a5050', trunk: '#241a14', solid: 1 }
      }
    });
    TH.mine = theme({
      name: 'mine',
      tiles: {
        '#': { p: 'wall', c1: '#5a4a3d', c2: '#3a2f26', c3: '#7a665a', solid: 1 },
        '.': { p: 'floor', c1: '#4a3d33', c2: '#352b24', c3: '#65564a' },
        'R': { p: 'rockpile', c1: '#6a5a4a', c2: '#3d332a', c3: '#8f7a5a', solid: 1 },
        'o': { p: 'floor', c1: '#2b3a55', c2: '#1e2a3d', c3: '#3f5478' },
        'l': { p: 'torch', c1: '#ffd257', c2: '#fff0b0', bg: '#4a3d33', anim: 'torch', solid: 1 },
        'b': { p: 'barrel', bg: '#4a3d33', solid: 1 },
        's': { p: 'sign', bg: '#4a3d33', c1: '#a68a5a', solid: 1 },
        'c': { p: 'crystal', c1: '#ffd257', c2: '#6b4a1f', bg: '#4a3d33', solid: 1 },
        'e': { p: 'stairs', c1: '#4a3d33', c2: '#352b24', c3: '#6a5a4a', script: 'stairs' },
        '~': { p: 'water', c1: '#2b3a55', c2: '#37476a', c3: '#4f6a95', anim: 'water', solid: 1 }
      }
    });
    TH.ice = theme({
      name: 'ice',
      tiles: {
        '.': { p: 'ice', c1: '#9fc8e6', c2: '#c6e2f6', c3: '#7aa8cc' },
        '#': { p: 'wall', c1: '#5f7fa8', c2: '#3d5675', c3: '#a8c8e6', solid: 1 },
        'R': { p: 'rockpile', c1: '#8aa8c9', c2: '#5a7695', c3: '#cfe6ff', solid: 1 },
        'P': { p: 'pine', c1: '#2a4a55', c2: '#1a3540', c3: '#4a7a88', trunk: '#2a2f35', snow: 1, solid: 1 },
        '~': { p: 'water', c1: '#2b5f8a', c2: '#3a78a8', c3: '#7fc0e6', anim: 'water', solid: 1 },
        'c': { p: 'crystal', c1: '#c6f0ff', c2: '#3d6a8a', bg: '#9fc8e6', solid: 1 },
        'l': { p: 'torch', c1: '#a6e8ff', c2: '#e6faff', bg: '#9fc8e6', anim: 'torch', solid: 1 },
        's': { p: 'sign', bg: '#9fc8e6', c1: '#dfeaff', solid: 1 },
        'e': { p: 'stairs', c1: '#9fc8e6', c2: '#7aa8cc', c3: '#dfeaff', script: 'stairs' },
        'b': { p: 'barrel', bg: '#9fc8e6', solid: 1 }
      }
    });
    TH.lava = theme({
      name: 'lava',
      tiles: {
        '.': { p: 'floor', c1: '#3a2b2b', c2: '#2a1e1e', c3: '#5a4040' },
        '#': { p: 'wall', c1: '#4a3535', c2: '#2e2020', c3: '#6f4a42', solid: 1 },
        '~': { p: 'lava', c1: '#d84a1f', c2: '#ff9a3d', c3: '#ffe066', anim: 'lava', solid: 1, dmg: 40 },
        'R': { p: 'rockpile', c1: '#5a3d35', c2: '#33221e', c3: '#8a5a48', solid: 1 },
        'l': { p: 'torch', c1: '#ff9a3d', c2: '#ffe066', bg: '#3a2b2b', anim: 'torch', solid: 1 },
        'c': { p: 'crystal', c1: '#ff7a3d', c2: '#6b2a10', bg: '#3a2b2b', solid: 1 },
        's': { p: 'sign', bg: '#3a2b2b', c1: '#8a5a48', solid: 1 },
        'e': { p: 'stairs', c1: '#3a2b2b', c2: '#2a1e1e', c3: '#5a4040', script: 'stairs' },
        'b': { p: 'barrel', bg: '#3a2b2b', solid: 1 }
      }
    });
    TH.tower = theme({
      name: 'tower',
      tiles: {
        '.': { p: 'marble', c1: '#2b2f4a', c2: '#1e2138', c3: '#464a6e' },
        '#': { p: 'wall', c1: '#3a3f5c', c2: '#232740', c3: '#565c85', solid: 1 },
        '|': { p: 'pillar', c1: '#4a4f70', c2: '#2e3250', c3: '#6a7095', bg: '#2b2f4a', solid: 1 },
        'c': { p: 'crystal', c1: '#b06fff', c2: '#3d1f5a', bg: '#2b2f4a', solid: 1 },
        'l': { p: 'torch', c1: '#b06fff', c2: '#e0c6ff', bg: '#2b2f4a', anim: 'torch', solid: 1 },
        'e': { p: 'stairs', c1: '#2b2f4a', c2: '#1e2138', c3: '#464a6e', script: 'stairs' },
        '~': { p: 'water', c1: '#2b2050', c2: '#3d2f6a', c3: '#6a5a9e', anim: 'water', solid: 1 },
        's': { p: 'sign', bg: '#2b2f4a', c1: '#6a7095', solid: 1 },
        'R': { p: 'rockpile', c1: '#4a4f70', c2: '#2e3250', c3: '#6a7095', solid: 1 }
      }
    });
    TH.ship = theme({
      name: 'ship',
      tiles: {
        '.': { p: 'floor', c1: '#8a6b4a', c2: '#6a4f35', c3: '#a6855f' },
        '#': { p: 'wall', c1: '#6a4f35', c2: '#4a3520', c3: '#8a6b4a', solid: 1 },
        '~': { p: 'water', c1: '#1f4f8a', c2: '#2b62a0', c3: '#4a8fd0', anim: 'water', solid: 1 },
        'l': { p: 'lamp', c1: '#ffd98a', bg: '#8a6b4a', anim: 'torch', solid: 1 },
        'b': { p: 'barrel', bg: '#8a6b4a', solid: 1 },
        's': { p: 'sign', bg: '#8a6b4a', c1: '#c9a86a', solid: 1 },
        'e': { p: 'stairs', c1: '#8a6b4a', c2: '#6a4f35', c3: '#a6855f', script: 'stairs' }
      }
    });
    TH.indo = theme({
      name: 'indo',
      tiles: {
        '.': { p: 'wood', c1: '#8a5f38', c2: '#6a4b2c', c3: '#a67845' },
        '#': { p: 'wall', c1: '#6a5140', c2: '#4a3520', c3: '#8a6b52', solid: 1 },
        'c': { p: 'carpet', c1: '#8a3d4a', c2: '#5f2a33', c3: '#c9718a' },
        'b': { p: 'bed', c1: '#e6eef6', c2: '#c95a7a', bg: '#8a5f38', solid: 1 },
        'k': { p: 'counter', c1: '#a67845', c2: '#c9a86a', bg: '#8a5f38', solid: 1 },
        'h': { p: 'shelf', c1: '#5a4126', bg: '#8a5f38', solid: 1 },
        'l': { p: 'lamp', c1: '#ffd98a', bg: '#8a5f38', anim: 'torch', solid: 1 },
        'd': { p: 'door', wall: '#6a5140', solid: 0, script: 'door' },
        'e': { p: 'stairs', c1: '#8a5f38', c2: '#6a4b2c', c3: '#a67845', script: 'stairs' },
        's': { p: 'sign', bg: '#8a5f38', c1: '#c9a86a', solid: 1 },
        'R': { p: 'rockpile', c1: '#6a5140', c2: '#4a3520', c3: '#8a6b52', solid: 1 },
        't': { p: 'torch', c1: '#ff9a3d', c2: '#ffe066', bg: '#6a5140', anim: 'torch', solid: 1 }
      }
    });
    if (B.DEFS.town) {
      B.DEFS.town.tiles['k'] = { p: 'counter', c1: '#a67845', c2: '#c9a86a', bg: '#8f8776', solid: 1 };
      B.DEFS.town.tiles['h'] = { p: 'shelf', c1: '#5a4126', bg: '#8f8776', solid: 1 };
    }
    /* bois pour l'intérieur */
    PAINT.wood = function (g, o, rng) {
      g.r(0, 0, T, T, o.c1);
      for (var i = 0; i < T; i += 4) { g.r(0, i, T, 1, o.c2); speck(g.g, rng, o.c3, 6, 0, i + 1, T, 3); }
    };
    B.rebuildIndo = function () {
      delete TH.indo;
      TH.indo = theme({
        name: 'indo',
        tiles: {
          '.': { p: 'wood', c1: '#8a5f38', c2: '#6a4b2c', c3: '#a67845' },
          '#': { p: 'wall', c1: '#6a5140', c2: '#4a3520', c3: '#8a6b52', solid: 1 },
          'c': { p: 'carpet', c1: '#8a3d4a', c2: '#5f2a33', c3: '#c9718a' },
          'b': { p: 'bed', c1: '#e6eef6', c2: '#c95a7a', bg: '#8a5f38', solid: 1 },
          'k': { p: 'counter', c1: '#a67845', c2: '#c9a86a', bg: '#8a5f38', solid: 1 },
          'h': { p: 'shelf', c1: '#5a4126', bg: '#8a5f38', solid: 1 },
          'l': { p: 'lamp', c1: '#ffd98a', bg: '#8a5f38', anim: 'torch', solid: 1 },
          'd': { p: 'door', wall: '#6a5140', solid: 0, script: 'door' },
          'e': { p: 'stairs', c1: '#8a5f38', c2: '#6a4b2c', c3: '#a67845', script: 'stairs' },
          's': { p: 'sign', bg: '#8a5f38', c1: '#c9a86a', solid: 1 },
          't': { p: 'torch', c1: '#ff9a3d', c2: '#ffe066', bg: '#6a5140', anim: 'torch', solid: 1 }
        }
      });
    };
    B.rebuildIndo();

  /* tuiles utilitaires partagées (bâtiments, cristaux, sable…) */
  (function () {
    var TH = B.DEFS;
    var common = {
      'h': { p: 'house', c1: '#b08a5a', c2: '#7a5a35', c3: '#c9a878', solid: 1 },
      'r': { p: 'roof', c1: '#a34a3d', c2: '#7a2f28', c3: '#c46a58', solid: 1 },
      'w': { p: 'window', c1: '#b08a5a', c2: '#7a5a35', c3: '#c9a878', solid: 1 },
      'd': { p: 'door', wall: '#b08a5a', solid: 0, script: 'door' },
      'C': { p: 'crystal', c1: '#ff8ad0', c2: '#6b1f5a', bg: '#3a3547', solid: 1 },
      'D': { p: 'sand', c1: '#e0cd96', c2: '#cbb478', c3: '#f2e3b6' },
      'S': { p: 'sand', c1: '#d8c286', c2: '#bda86a', c3: '#ecdcae' },
      'T': { p: 'tree', c1: '#2f5f33', c2: '#244a28', c3: '#4a8a4c', solid: 1 },
      'i': { p: 'ice', c1: '#9fc8e6', c2: '#c6e2f6', c3: '#7aa8cc' },
      'K': { p: 'castle', c1: '#8a90a8', c2: '#a6aec6', floor: 'floor', solid: 1 },
      'R': { p: 'rockpile', c1: '#7a7f90', c2: '#4d5160', c3: '#a6b0c9', solid: 1 },
      'W': { p: 'sand', c1: '#e8f1f8', c2: '#cfe0ec', c3: '#ffffff' },
      'p': { p: 'dirt', c1: '#9a8158', c2: '#7a6444', c3: '#b89a6a' },
      'L': { p: 'lava', c1: '#8a2410', c2: '#ff6a1e', c3: '#ffd257', anim: 'lava', solid: 1 },
      'V': { p: 'rock', c1: '#3a3547', c2: '#241f2e', c3: '#5a5470', solid: 1 },
      'c': { p: 'floor', c1: '#6a5a48', c2: '#4f4335', c3: '#877763' }
    };
    for (var tn in TH) {
      if (!TH[tn] || !TH[tn].tiles) continue;
      for (var ch in common) if (!TH[tn].tiles[ch]) TH[tn].tiles[ch] = common[ch];
    }
    if (TH.field) TH.field.tiles['D'] = { p: 'sand', c1: '#d8c286', c2: '#bda86a', c3: '#ecdcae' };
    if (TH.field) TH.field.tiles['W'] = { p: 'sand', c1: '#eaf3fa', c2: '#d2e4f0', c3: '#ffffff' };
    if (TH.ice) { TH.ice.tiles['p'] = { p: 'dirt', c1: '#8fa8bd', c2: '#6f8aa1', c3: '#b6d2e8' }; TH.ice.tiles['c'] = { p: 'floor', c1: '#41566b', c2: '#2e4052', c3: '#5b7590' }; }
    if (TH.lava) { TH.lava.tiles['c'] = { p: 'floor', c1: '#4a3a3a', c2: '#332727', c3: '#655050' }; TH.lava.tiles['p'] = { p: 'dirt', c1: '#6a4a40', c2: '#4d352d', c3: '#8a6455' }; TH.lava.tiles['S'] = { p: 'sand', c1: '#5a4038', c2: '#3f2c26', c3: '#7a5a4c' }; }
    if (TH.ship) TH.ship.tiles['c'] = { p: 'wood', c1: '#7a5c3a', c2: '#5a4228', c3: '#96764d' };
    if (TH.town) { TH.town.tiles['R'] = { p: 'rockpile', c1: '#8a8f9e', c2: '#5b5f70', c3: '#b3bccf', solid: 1 }; }
  /* régénère les thèmes avec les tuiles ajoutées */
    for (var k in TH) B.themes[k] = theme(TH[k]);
  })();
  };

  /* ============================================================
     PERSO — papier découpé (têtes, cheveux, armures)
     ============================================================ */
  /* opts: skin, hair:{c,style}, eye, cloth, cloth2, metal, hat, cape, weapon, size */
  function drawHead(g, x, y, o, dir) {
    var sk = o.skin || '#e8b98a', hr = o.hair && o.hair.c || '#6a4520', ey = o.eye || '#2a3550';
    if (dir === 'left' || dir === 'right') {
      g.r(x + 1, y, 5, 6, sk);
      if (o.hat === 'hood') { g.r(x, y - 1, 7, 4, o.hatc || '#3a3550'); g.r(x + (dir === 'left' ? 4 : 0), y + 3, 3, 3, o.hatc || '#3a3550'); }
      else if (o.hat === 'helm') { g.r(x, y - 1, 7, 3, o.metal || '#b0b8c9'); g.r(x + (dir === 'left' ? 4 : 0), y + 2, 3, 1, o.metal || '#b0b8c9'); }
      else { g.r(x + (dir === 'left' ? 0 : 1), y - 1, 5, 2, hr); g.r(x + (dir === 'left' ? 0 : 4), y, 2, 4, hr); }
      g.px(x + (dir === 'left' ? 1 : 4), y + 3, ey);
      return;
    }
    var back = dir === 'up';
    g.r(x, y, 7, 6, sk);
    if (back) { g.r(x - 1, y - 1, 9, 4, hr); g.r(x - 1, y + 2, 9, 3, hr); }
    else {
      g.r(x - 1, y - 1, 9, 2, hr);
      if (o.hair.style === 'long') { g.r(x - 1, y, 1, 6, hr); g.r(x + 7, y, 1, 6, hr); }
      else if (o.hair.style === 'short') { g.r(x - 1, y, 1, 3, hr); g.r(x + 7, y, 1, 3, hr); }
      else if (o.hair.style === 'bald') { g.r(x - 1, y - 1, 9, 1, sk); }
      else if (o.hair.style === 'pony') { g.r(x - 1, y, 1, 6, hr); g.r(x + 7, y, 1, 4, hr); g.r(x + 8, y + 4, 1, 4, hr); }
      g.px(x + 1, y + 3, ey); g.px(x + 5, y + 3, ey);
      if (o.hat === 'hood') { g.r(x - 1, y - 2, 9, 3, o.hatc || '#3a3550'); g.r(x - 1, y - 2, 1, 7, o.hatc || '#3a3550'); g.r(x + 7, y - 2, 1, 7, o.hatc || '#3a3550'); }
      else if (o.hat === 'helm') { g.r(x - 1, y - 2, 9, 3, o.metal || '#b0b8c9'); g.r(x + 3, y - 2, 1, 3, o.hatc || '#ff6a6a'); g.r(x - 1, y + 1, 9, 1, U.shade(o.metal || '#b0b8c9', .7)); }
      else if (o.hat === 'hat') { g.r(x - 2, y - 1, 11, 1, o.hatc || '#6a4fc9'); g.r(x + 1, y - 4, 5, 3, o.hatc || '#6a4fc9'); g.r(x + 1, y - 4, 5, 1, U.shade(o.hatc || '#6a4fc9', 1.3)); }
      else if (o.hat === 'crown') { g.r(x - 1, y - 3, 9, 2, '#ffd257'); g.px(x, y - 4, '#ffd257'); g.px(x + 4, y - 4, '#ffd257'); g.px(x + 7, y - 4, '#ffd257'); }
    }
  }
  B.hero = function (o) {
    /* renvoie {down:[c,c,c], up:[...], left:[...], right:[...]} de 16x16 */
    var out = {};
    ['down', 'up', 'left', 'right'].forEach(function (dir) {
      out[dir] = [0, 1, 2].map(function (f) { return heroFrame(o, dir, f); });
    });
    return out;
  };
  function heroFrame(o, dir, f) {
    var c = cv(T, T), g = pen(c);
    var bob = f === 1 ? 0 : (f === 2 ? 1 : 0);
    var yb = 1 - bob;
    var cloth = o.cloth || '#8a2f2f', cloth2 = o.cloth2 || U.shade(cloth, .7), metal = o.metal || '#b0b8c9';
    /* ombre */
    g.r(4, 15, 8, 1, 'rgba(0,0,0,.28)');
    /* cape */
    if (o.cape) {
      var cc = o.capeC || cloth2;
      if (dir === 'up') g.r(2, 7, 12, 8, cc);
      else g.r(dir === 'left' ? 3 : 2, 7, 11, 7, cc);
    }
    /* jambes */
    var legY = 11 + bob * 0;
    var step = f === 1 ? 1 : (f === 2 ? -1 : 0);
    g.r(4, legY, 3, 4, o.pants || U.shade(cloth, .6));
    g.r(9, legY, 3, 4, o.pants || U.shade(cloth, .6));
    if (dir === 'left' || dir === 'right') { g.r(5 + step, legY, 4, 4, o.pants || U.shade(cloth, .6)); }
    g.r(4, 14, 3, 1, '#3a2616'); g.r(9, 14, 3, 1, '#3a2616');
    /* torse */
    if (o.armor === 'plate') {
      g.r(3, 6 + yb, 10, 6, metal);
      g.r(3, 6 + yb, 10, 1, U.shade(metal, 1.3));
      g.r(3, 11 + yb, 10, 1, U.shade(metal, .6));
      g.r(4, 7 + yb, 2, 4, U.shade(metal, 1.15));
      if (o.cape) g.r(2, 6 + yb, 2, 6, o.capeC || cloth2);
    } else if (o.armor === 'robe') {
      g.r(3, 6 + yb, 10, 7, cloth);
      g.r(3, 6 + yb, 10, 2, cloth2);
      g.r(2, 12 + yb, 12, 1, cloth2);
      g.r(7, 8 + yb, 2, 5, o.trim || '#ffd257');
    } else { /* tunique */
      g.r(3, 6 + yb, 10, 6, cloth);
      g.r(3, 6 + yb, 10, 1, U.shade(cloth, 1.25));
      g.r(3, 10 + yb, 10, 1, cloth2);
      if (o.belt !== false) { g.r(3, 11 + yb, 10, 1, '#5a4126'); g.px(7, 11 + yb, '#ffd257'); }
    }
    /* bras */
    var armC = o.armor === 'plate' ? metal : U.shade(cloth, .85);
    if (dir === 'down' || dir === 'up') {
      g.r(2, 7 + yb + (f === 1 ? 1 : 0), 1, 4, armC);
      g.r(13, 7 + yb + (f === 2 ? 1 : 0), 1, 4, armC);
    } else {
      g.r(dir === 'left' ? 2 : 12, 7 + yb, 2, 4, armC);
    }
    /* tête */
    drawHead(g, 5, 1 + yb, o, dir);
    /* arme */
    if (o.weapon === 'sword') { g.r(dir === 'left' ? 1 : 14, 4, 1, 8, '#dfe6ee'); g.r(dir === 'left' ? 0 : 13, 6, 3, 1, '#8a6b1f'); }
    else if (o.weapon === 'lance' || o.weapon === 'spear') { g.r(dir === 'left' ? 1 : 14, 1, 1, 14, '#a6855f'); g.r(dir === 'left' ? 0 : 13, 0, 3, 3, '#dfe6ee'); }
    else if (o.weapon === 'staff') { g.r(dir === 'left' ? 1 : 14, 2, 1, 13, '#6a4b2c'); g.px(dir === 'left' ? 1 : 14, 1, o.gem || '#8ef0ff'); g.r(dir === 'left' ? 0 : 13, 0, 3, 2, o.gem || '#8ef0ff'); }
    else if (o.weapon === 'axe') { g.r(14, 3, 1, 12, '#6a4b2c'); g.r(12, 2, 4, 4, '#cfd8e6'); }
    else if (o.weapon === 'bow') { g.r(13, 4, 1, 8, '#8a5f38'); g.px(12, 5, '#e6eef6'); g.px(12, 11, '#e6eef6'); }
    else if (o.weapon === 'fist') { g.r(13, 8 + yb, 2, 2, metal); }
    return c;
  }
  /* portrait 20x20 pour les menus */
  B.portrait = function (o) {
    var c = cv(20, 20), g = pen(c), sk = o.skin || '#e8b98a';
    g.r(0, 0, 20, 20, o.bg || '#1b2138');
    g.r(2, 16, 16, 4, o.cloth || '#6a3a3a');
    g.r(4, 4, 12, 12, sk);
    g.r(3, 3, 14, 3, (o.hair && o.hair.c) || '#6a4520');
    if (o.hair && o.hair.style === 'long') { g.r(3, 5, 2, 10, o.hair.c); g.r(15, 5, 2, 10, o.hair.c); }
    g.r(4, 6, 12, 1, U.shade((o.hair && o.hair.c) || '#6a4520', 1.25));
    var ey = o.eye || '#2a3550';
    g.r(6, 9, 2, 2, '#fff'); g.r(12, 9, 2, 2, '#fff');
    g.px(7, 10, ey); g.px(13, 10, ey);
    g.r(9, 12, 2, 1, U.shade(sk, .75));
    g.r(7, 14, 6, 1, U.shade(sk, .6));
    if (o.hat === 'helm') { g.r(3, 2, 14, 4, o.metal || '#b0b8c9'); g.r(9, 0, 2, 3, '#ff6a6a'); }
    if (o.hat === 'hat') { g.r(1, 3, 18, 2, o.hatc || '#6a4fc9'); g.r(5, 0, 10, 3, o.hatc || '#6a4fc9'); }
    if (o.hat === 'hood') { g.r(1, 1, 18, 12, o.hatc || '#3a3550'); g.r(4, 4, 12, 12, sk); g.r(4, 4, 12, 1, U.shade(o.hatc || '#3a3550', 1.4)); g.r(1, 1, 18, 2, U.shade(o.hatc || '#3a3550', 1.3)); }
    if (o.hat === 'crown') { g.r(3, 1, 14, 3, '#ffd257'); g.px(5, 0, '#ffd257'); g.px(10, 0, '#ffd257'); g.px(14, 0, '#ffd257'); }
    g.r(0, 0, 20, 20, null);
    g.line(0, 19, 19, 19, '#00000055');
    return c;
  };
  /* silhouette de combat (vue de dos, 20x24) */
  B.back = function (o) {
    var c = cv(18, 22), g = pen(c);
    var cloth = o.cloth || '#8a2f2f', metal = o.metal || '#b0b8c9';
    g.r(5, 1, 8, 7, cloth);
    drawHead(g, 5, -1, o, 'up');
    if (o.armor === 'plate') { g.r(4, 8, 10, 8, metal); g.r(4, 8, 10, 1, U.shade(metal, 1.3)); }
    else { g.r(4, 8, 10, 8, cloth); g.r(4, 14, 10, 2, U.shade(cloth, .7)); }
    g.r(4, 16, 3, 5, U.shade(cloth, .55)); g.r(11, 16, 3, 5, U.shade(cloth, .55));
    g.r(3, 8, 1, 6, U.shade(cloth, .8)); g.r(14, 8, 1, 6, U.shade(cloth, .8));
    if (o.cape) { g.r(3, 7, 12, 12, o.capeC || U.shade(cloth, .6)); g.r(4, 8, 10, 10, o.capeC || U.shade(cloth, .6)); }
    if (o.weapon === 'sword') { g.r(15, 4, 1, 12, '#dfe6ee'); g.r(14, 8, 3, 1, '#8a6b1f'); }
    if (o.weapon === 'staff') { g.r(15, 2, 1, 16, '#6a4b2c'); g.r(14, 0, 3, 3, o.gem || '#8ef0ff'); }
    if (o.weapon === 'lance' || o.weapon === 'spear') { g.r(15, 0, 1, 20, '#a6855f'); g.r(14, 0, 3, 3, '#dfe6ee'); }
    return c;
  };

  /* ============================================================
     ICÔNES D'OBJETS (16x16)
     ============================================================ */
  var ICON = {};
  ICON.potion = function (g, c1) { g.r(5, 2, 6, 2, '#cfd8e6'); g.r(4, 4, 8, 10, '#bfe6ff'); g.r(5, 5, 6, 8, c1); g.r(5, 5, 2, 8, U.shade(c1, 1.35)); g.r(4, 13, 8, 1, '#8fb3d6'); g.px(6, 3, '#fff'); };
  ICON.flask = function (g, c1) { g.r(6, 1, 4, 3, '#cfd8e6'); g.r(3, 6, 10, 8, '#bfe6ff'); g.r(4, 7, 8, 6, c1); g.line(3, 6, 8, 3, '#bfe6ff'); g.line(12, 6, 8, 3, '#bfe6ff'); };
  ICON.bombs = function (g, c1) { g.r(3, 5, 8, 8, U.shade(c1, .7)); g.r(4, 6, 6, 6, c1); g.px(5, 7, '#fff'); g.r(9, 2, 1, 3, '#8a6b4a'); g.px(10, 1, '#ffd257'); g.r(11, 7, 3, 4, U.shade(c1, .55)); };
  ICON.herb = function (g, c1) { g.r(7, 8, 2, 7, '#3d6a2f'); g.r(3, 3, 5, 6, c1); g.r(8, 5, 5, 5, U.shade(c1, .8)); g.px(4, 4, '#fff'); };
  ICON.dust = function (g, c1) { for (var i = 0; i < 16; i++) { var x = 3 + ((i * 7) % 11), y = 4 + ((i * 5) % 9); g.px(x, y, c1); } g.r(4, 12, 8, 2, U.shade(c1, .7)); };
  ICON.feather = function (g, c1) { g.line(4, 13, 11, 2, c1); for (var i = 0; i < 6; i++) { g.r(4 + i, 12 - i * 2, 3, 1, U.shade(c1, 1.2)); g.r(6 + i, 11 - i * 2, 2, 1, U.shade(c1, .7)); } };
  ICON.shell = function (g, c1) { for (var i = 0; i < 5; i++) g.line(8, 13, 2 + i * 3, 3, c1); g.r(2, 12, 12, 2, U.shade(c1, .7)); };
  ICON.horn = function (g, c1) { g.line(3, 12, 11, 4, c1); g.line(4, 13, 12, 5, U.shade(c1, .7)); g.r(11, 2, 3, 3, U.shade(c1, 1.3)); g.r(2, 11, 3, 3, U.shade(c1, .5)); };
  ICON.bell = function (g, c1) { g.r(5, 3, 6, 8, c1); g.r(4, 10, 8, 2, U.shade(c1, .7)); g.px(7, 13, '#ffd257'); g.r(7, 1, 2, 2, U.shade(c1, .8)); };
  ICON.mirror = function (g, c1) { g.r(4, 2, 8, 10, '#8f9bb3'); g.r(5, 3, 6, 8, c1); g.line(6, 9, 10, 4, '#fff'); g.r(7, 12, 2, 3, '#8f9bb3'); };
  ICON.tent = function (g, c1) { for (var y = 0; y < 10; y++) { var w = 3 + y; g.r(8 - (w / 2 | 0), 4 + y, w, 1, y % 2 ? U.shade(c1, .75) : c1); } g.line(8, 4, 8, 14, '#2b2018'); };
  ICON.glass = function (g, c1) { g.r(4, 2, 8, 2, '#8f9bb3'); g.r(5, 4, 6, 4, c1); g.r(5, 10, 6, 3, c1); g.r(4, 13, 8, 1, '#8f9bb3'); g.px(7, 8, '#fff'); };
  ICON.needle = function (g, c1) { g.line(4, 12, 12, 3, '#cfd8e6'); g.r(3, 12, 3, 2, c1); };
  ICON.key = function (g, c1) { g.r(3, 3, 6, 6, c1); g.px(5, 5, '#2b2018'); g.r(8, 5, 6, 2, c1); g.r(11, 7, 2, 3, c1); };
  ICON.sword = function (g, c1) { g.line(4, 13, 12, 2, c1); g.line(5, 13, 13, 2, U.shade(c1, .7)); g.r(3, 11, 5, 2, '#8a6b1f'); g.r(4, 13, 2, 2, '#6a4b2c'); };
  ICON.greatsword = function (g, c1) { g.line(3, 14, 13, 1, c1); g.line(4, 14, 14, 1, U.shade(c1, .65)); g.r(2, 11, 6, 2, '#8a6b1f'); g.r(3, 13, 2, 3, '#5a3d24'); };
  ICON.dagger = function (g, c1) { g.line(5, 11, 12, 3, c1); g.r(4, 10, 4, 2, '#8a6b1f'); g.r(4, 12, 2, 3, '#5a3d24'); };
  ICON.spear = function (g, c1) { g.r(8, 1, 3, 5, c1); g.r(7, 4, 2, 11, '#8a5f38'); g.px(9, 2, '#fff'); };
  ICON.staff = function (g, c1) { g.r(7, 4, 2, 11, '#8a5f38'); g.r(5, 1, 6, 4, c1); g.px(6, 2, '#fff'); };
  ICON.rod = function (g, c1) { g.r(8, 3, 2, 12, '#6a4b2c'); g.r(6, 1, 5, 3, c1); g.px(7, 2, '#fff'); };
  ICON.bow = function (g, c1) { g.line(5, 2, 11, 8, c1); g.line(11, 8, 5, 14, c1); g.line(6, 3, 6, 13, '#e6eef6'); g.r(4, 7, 8, 1, '#8a5f38'); };
  ICON.fist = function (g, c1) { g.r(4, 5, 9, 7, c1); g.r(4, 5, 9, 2, U.shade(c1, 1.3)); g.r(12, 6, 2, 5, U.shade(c1, .7)); };
  ICON.mace = function (g, c1) { g.r(5, 2, 6, 6, c1); g.r(7, 8, 2, 7, '#8a5f38'); g.px(6, 3, '#fff'); };
  ICON.axe = function (g, c1) { g.r(7, 3, 2, 11, '#8a5f38'); g.r(9, 2, 5, 6, c1); g.r(9, 2, 5, 1, U.shade(c1, 1.3)); };
  ICON.lyre = function (g, c1) { g.r(4, 3, 2, 10, c1); g.r(10, 3, 2, 10, c1); g.r(4, 12, 8, 2, c1); for (var i = 0; i < 4; i++) g.r(6 + i * 2, 4, 1, 9, '#e6eef6'); g.r(4, 2, 8, 2, U.shade(c1, .8)); };
  ICON.heavy = function (g, c1) { g.r(4, 3, 8, 9, c1); g.r(4, 3, 8, 2, U.shade(c1, 1.3)); g.r(5, 12, 6, 2, U.shade(c1, .7)); g.px(7, 7, '#fff'); };
  ICON.robe = function (g, c1) { g.r(6, 3, 4, 2, c1); g.r(4, 5, 8, 4, c1); g.r(3, 9, 10, 5, U.shade(c1, .8)); g.r(5, 13, 6, 1, U.shade(c1, 1.3)); };
  ICON.light = function (g, c1) { g.r(4, 4, 8, 8, c1); g.r(4, 4, 8, 1, U.shade(c1, 1.3)); g.r(6, 6, 4, 4, U.shade(c1, .7)); };
  ICON.helm = function (g, c1) { g.r(4, 4, 8, 7, c1); g.r(4, 4, 8, 2, U.shade(c1, 1.3)); g.r(7, 6, 2, 5, '#2b2018'); g.r(6, 2, 4, 2, U.shade(c1, .8)); };
  ICON.ring = function (g, c1) { g.r(5, 6, 6, 6, c1); g.r(6, 7, 4, 4, '#0000'); g.r(7, 3, 3, 3, '#8ef0ff'); };
  ICON.amulet = function (g, c1) { g.line(4, 3, 8, 8, '#c9a86a'); g.line(12, 3, 8, 8, '#c9a86a'); g.r(6, 8, 5, 5, c1); g.px(8, 10, '#fff'); };
  ICON.boots = function (g, c1) { g.r(5, 3, 4, 7, c1); g.r(5, 10, 8, 3, U.shade(c1, .75)); g.r(5, 3, 4, 1, U.shade(c1, 1.3)); };
  ICON.gloves = function (g, c1) { g.r(4, 5, 8, 6, c1); g.r(11, 6, 2, 4, U.shade(c1, .8)); g.r(4, 4, 8, 1, U.shade(c1, 1.3)); };
  ICON.shield = function (g, c1) { g.r(4, 3, 8, 7, c1); g.r(5, 10, 6, 3, U.shade(c1, .7)); g.r(7, 5, 2, 5, '#ffd257'); g.r(4, 3, 8, 1, U.shade(c1, 1.3)); };
  ICON.book = function (g, c1) { g.r(3, 3, 10, 11, c1); g.r(5, 5, 6, 7, '#f0e6c8'); g.r(3, 3, 2, 11, U.shade(c1, .7)); g.px(8, 7, '#c95a5a'); };
  ICON.wings = function (g, c1) { g.r(2, 5, 5, 3, c1); g.r(9, 5, 5, 3, c1); g.r(3, 8, 4, 2, U.shade(c1, .8)); g.r(9, 8, 4, 2, U.shade(c1, .8)); g.r(7, 4, 2, 9, '#ffd257'); };
  ICON.orb = function (g, c1) { g.r(5, 4, 7, 7, c1); g.r(6, 3, 5, 9, c1); g.px(7, 5, '#fff'); g.px(8, 6, '#fff'); };
  ICON.crystal = function (g, c1) { g.r(7, 2, 2, 12, c1); g.r(5, 5, 6, 6, c1); g.r(6, 4, 4, 8, c1); g.px(7, 4, '#fff'); g.px(8, 9, U.shade(c1, .7)); };
  ICON.bag = function (g, c1) { g.r(4, 6, 9, 8, c1); g.r(6, 4, 5, 2, U.shade(c1, .8)); g.r(7, 9, 3, 2, '#ffd257'); };
  ICON.gear = function (g, c1) { g.r(6, 6, 5, 5, c1); g.r(4, 7, 2, 2, c1); g.r(11, 7, 2, 2, c1); g.r(7, 4, 2, 2, c1); g.r(7, 11, 2, 2, c1); g.r(7, 7, 2, 2, '#2b2018'); };
  ICON.lantern = function (g, c1) { g.r(6, 2, 5, 2, '#8f9bb3'); g.r(5, 4, 7, 8, c1); g.r(6, 5, 5, 6, '#fff6c0'); g.r(5, 12, 7, 2, '#8f9bb3'); };
  ICON.map = function (g, c1) { g.r(3, 4, 11, 9, '#e6dcb8'); g.r(3, 4, 2, 9, c1); g.r(12, 4, 2, 9, c1); g.line(6, 6, 11, 10, '#8a6b4a'); };
  B.icon = function (kind, color, w, h) {
    w = w || T; h = h || T;
    var c = cv(w, h), g = pen(c);
    g.r(0, 0, w, h, null);
    var fn = ICON[kind] || ICON.crystal;
    fn(g, color || '#cfd8e6');
    return c;
  };
  B.ICONS = ICON;

  /* tuiles de décor pour l'éditeur de thème (boss, coffres…) */
  B.special = function () {
    var out = {};
    var c = cv(T, T), g = pen(c);
    g.r(0, 0, T, T, '#00000000');
    out.exit = c;
    return out;
  };
})(this.FF = this.FF || {});
