/* ============================================================
   Gfx — tampon 240x160, rendu pixel, fenêtres, effets
   ============================================================ */
(function (FF) {
  'use strict';
  var U = FF.U;
  var G = FF.Gfx = {};

  G.W = 240; G.H = 160;
  G.TILE = 16;
  G.time = 0;
  G.buf = null; G.ctx = null;      // tampon logique
  G.cv = null; G.vis = null;       // canvas visible
  G.scale = 3;
  G.tint = null;                   // teinte globale (réserve)

  G.canvas = function (w, h) {
    var c = (typeof document !== 'undefined' && document.createElement) ? document.createElement('canvas') : null;
    if (!c) return { width: w, height: h, getContext: function () { return null; } };
    c.width = w; c.height = h;
    return c;
  };

  G.init = function (canvas) {
    G.cv = canvas;
    G.buf = G.canvas(G.W, G.H);
    G.ctx = G.buf.getContext('2d');
    G.vis = G.cv.getContext('2d');
    [G.ctx, G.vis].forEach(function (c) { if (c && 'imageSmoothingEnabled' in c) c.imageSmoothingEnabled = false; });
    G.resize();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', G.resize, { passive: true });
      window.addEventListener('orientationchange', function () { setTimeout(G.resize, 250); }, { passive: true });
      window.visualViewport && window.visualViewport.addEventListener('resize', G.resize);
    }
  };

  G.resize = function () {
    if (!G.cv || typeof window === 'undefined') return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var dpr = Math.min(3, window.devicePixelRatio || 1);
    var landscape = vw > vh * 1.12;
    var padHidden = document.body.classList.contains('pad-hidden');
    var touchH = padHidden ? 0 :
      (landscape ? 0 : (document.getElementById('touch') ? document.getElementById('touch').offsetHeight : 150));
    var availH = Math.max(120, vh - touchH - (landscape ? 2 : 4));
    var availW = Math.max(160, vw - 2);
    var sc = Math.min(availH / G.H, availW / G.W);
    /* facteur qui tombe pile en pixels physiques (netteté maximale) */
    var k = Math.max(1, Math.floor(sc * dpr));
    sc = k / dpr;
    G.scale = sc;
    G.cv.style.width = Math.floor(G.W * sc) + 'px';
    G.cv.style.height = Math.floor(G.H * sc) + 'px';
    G.cv.width = Math.round(G.W * k);
    G.cv.height = Math.round(G.H * k);
    if (G.vis) G.vis.imageSmoothingEnabled = false;

    /* placement des commandes tactiles */
    var sideRoom = (vw - Math.floor(G.W * sc)) / 2;
    var b = document.body;
    b.classList.toggle('pad-side', landscape && !padHidden && sideRoom >= 118);
    b.classList.toggle('pad-overlay', landscape && !padHidden && sideRoom < 118);
    if (!landscape) { b.classList.remove('pad-side'); b.classList.remove('pad-overlay'); }
    document.documentElement.style.setProperty('--gw', Math.floor(G.W * sc) + 'px');
    var padsc = U.clamp(Math.min(sideRoom / 190, vh / 460), .58, 1.15);
    document.documentElement.style.setProperty('--padscale', (b.classList.contains('pad-side') ? padsc : U.clamp(sc / 4.2, .62, 1)).toFixed(3));
    b.classList.toggle('compact', vw < 380 || availH < 170);
  };

  G.flash = function (d, c) { G.fx.flash(d, c); };
  G.shake = function (a, d) { G.fx.shake(a, d); };
  G.px = function (x, y, c) { if (!G.ctx) return; G.ctx.fillStyle = c; G.ctx.fillRect(x | 0, y | 0, 1, 1); };

  G.present = function () {
    if (!G.vis) return;
    var sx = G.fx;
    var ox = sx.shakeX, oy = sx.shakeY;
    G.vis.setTransform(1, 0, 0, 1, 0, 0);
    G.vis.imageSmoothingEnabled = false;
    G.vis.fillStyle = '#05070f';
    G.vis.fillRect(0, 0, G.cv.width, G.cv.height);
    var s = G.scale * (G.cv.width / (G.W * G.scale));
    G.vis.drawImage(G.buf, Math.round(ox * s), Math.round(oy * s), Math.round(G.W * s), Math.round(G.H * s));
  };

  /* ---------- primitives ---------- */
  G.clear = function (c) { G.ctx.fillStyle = c || '#05070f'; G.ctx.fillRect(0, 0, G.W, G.H); };
  G.rect = function (x, y, w, h, c) { if (c) { G.ctx.fillStyle = c; G.ctx.fillRect(x | 0, y | 0, w | 0, h | 0); } };
  G.frame = function (x, y, w, h, c) {
    var g = G.ctx; g.fillStyle = c || '#fff';
    g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1);
    g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h);
  };
  G.hlineGrad = function (x, y, w, c1, c2) {
    var g = G.ctx;
    for (var i = 0; i < w; i++) {
      g.fillStyle = U.mix(c1, c2, w > 1 ? i / (w - 1) : 0);
      g.fillRect(x + i, y, 1, 1);
    }
  };
  G.gradRect = function (x, y, w, h, c1, c2) {
    var g = G.ctx;
    for (var i = 0; i < h; i++) { g.fillStyle = U.mix(c1, c2, h > 1 ? i / (h - 1) : 0); g.fillRect(x, y + i, w, 1); }
  };
  G.circle = function (cx, cy, r, c) {
    var g = G.ctx; g.fillStyle = c;
    for (var y = -r; y <= r; y++) {
      var w = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
      if (w > 0) g.fillRect(cx - w, cy + y, w * 2 + 1, 1);
    }
  };
  G.line = function (x0, y0, x1, y1, c) {
    var g = G.ctx; g.fillStyle = c;
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy;
    for (var n = 0; n < 4000; n++) {
      g.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  };

  /* ---------- sprites ---------- */
  G.spr = function (img, x, y, o) {
    if (!img) return;
    o = o || {};
    var g = G.ctx;
    var w = img.width, h = img.height, sc = o.scale || 1;
    var dw = Math.round(w * sc), dh = Math.round(h * sc);
    x = Math.round(x - (o.ox || 0)); y = Math.round(y - (o.oy || 0));
    if (o.anchor === 'c') { x -= dw / 2 | 0; y -= dh / 2 | 0; }
    g.save();
    if (o.flash) { g.globalAlpha = 1; }
    if (o.alpha != null) g.globalAlpha = o.alpha;
    if (o.flip) { g.translate(x + dw, y); g.scale(-1, 1); x = 0; y = 0; }
    if (o.silhouette) {
      // ombre portée simple
      g.globalAlpha = (o.alpha != null ? o.alpha : 1) * 0.35;
      g.fillStyle = '#000';
      g.fillRect(x + 1, y + 1, dw, dh);
      g.globalAlpha = (o.alpha != null ? o.alpha : 1);
    }
    try { g.drawImage(img, x, y, dw, dh); } catch (e) { }
    g.restore();
    if (o.flash) G.tintRect(x, y, dw, dh, o.flash, o.alpha == null ? 0.55 : o.alpha * 0.55);
  };
  G.tintRect = function (x, y, w, h, col, a) {
    if (!col) return;
    var g = G.ctx;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a == null ? 0.6 : a;
    g.fillStyle = col; g.fillRect(x, y, w, h);
    g.restore();
  };
  /* sprite de tuile avec scroll continu */
  G.tileAt = function (img, sx, sy, dx, dy) {
    if (img) { try { G.ctx.drawImage(img, sx, sy, G.TILE, G.TILE, dx, dy, G.TILE, G.TILE); } catch (e) { } }
  };

  /* ---------- fenêtres façon FF ---------- */
  var WIN_SKIN = null;
  G.makeWinSkin = function (pal) {
    var w = 32, h = 24, cv = G.canvas(w, h), g = cv.getContext('2d');
    if (!g) return null;
    var fill = g.createLinearGradient(0, 0, 0, h);
    fill.addColorStop(0, pal[0]); fill.addColorStop(0.5, pal[1]); fill.addColorStop(1, pal[2]);
    g.fillStyle = fill; g.fillRect(0, 0, w, h);
    return cv;
  };
  /**
   * style: 0 = bleu classique, 1 = sombre, 2 = or/temple, 3 = translucide
   */
  G.win = function (x, y, w, h, opt) {
    opt = opt || {};
    var g = G.ctx;
    var styles = [
      ['#2f4d9e', '#1a2c63', '#0f1a3d', '#8fb3ff', '#050914'],
      ['#2a2f45', '#171b2b', '#0b0e18', '#7b88b8', '#04050a'],
      ['#8a6b1f', '#5c4413', '#2f2209', '#ffe9a8', '#100b02'],
      ['#27407c', '#16265a', '#0c1434', '#88a8ff', 'rgba(0,0,0,.35)']
    ];
    var s = styles[opt.style != null ? opt.style : 0];
    x |= 0; y |= 0; w |= 0; h |= 0;
    g.save();
    if (opt.alpha != null) g.globalAlpha = opt.alpha;
    // ombre
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 2, y + 2, w, h);
    // corps dégradé (3 bandes)
    var top = 3, bot = 3;
    var grad = null;
    try { grad = g.createLinearGradient(0, y, 0, y + h); } catch (e) { }
    if (grad) { grad.addColorStop(0, s[0]); grad.addColorStop(0.45, s[1]); grad.addColorStop(1, s[2]); g.fillStyle = grad; }
    else g.fillStyle = s[1];
    g.fillRect(x, y, w, h);
    // biseautés coins
    g.clearRect && 0;
    g.fillStyle = s[4];
    [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]].forEach(function (p) { g.fillRect(p[0], p[1], 1, 1); });
    // bordure lumineuse
    g.fillStyle = s[3];
    g.fillRect(x + 1, y, w - 2, 1); g.fillRect(x + 1, y + h - 1, w - 2, 1);
    g.fillRect(x, y + 1, 1, h - 2); g.fillRect(x + w - 1, y + 1, 1, h - 2);
    g.fillStyle = U.shade(s[3], 0.55);
    g.fillRect(x + 1, y + 1, w - 2, 1);
    g.restore();
  };
  G.bar = function (x, y, w, h, v, max, c1, c2, back) {
    var g = G.ctx, f = U.clamp(v / (max || 1), 0, 1);
    g.fillStyle = back || '#05080f'; g.fillRect(x, y, w, h);
    if (f > 0) G.gradRect(x, y, Math.max(1, Math.round(w * f)), h, c1, c2 || c1);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x, y, Math.max(1, Math.round(w * f)), 1);
  };

  /* ---------- curseur ---------- */
  G.cursor = function (x, y, o) {
    o = o || {};
    var t = (G.time * 4) | 0;
    var bob = (t % 2) ? 0 : 1;
    var g = G.ctx;
    g.fillStyle = '#0b1020';
    g.fillRect(x - 1 + bob, y - 1, 9, 9);
    g.fillStyle = o.color || '#ffe66e';
    var p = [[5, 1], [6, 2], [7, 3], [8, 4], [7, 5], [6, 6], [5, 7], [4, 6], [3, 5], [2, 4], [3, 3], [4, 2]];
    for (var i = 0; i < p.length; i++) g.fillRect(x + p[i][0] - 1 + bob, y + p[i][1] - 1, 1, 1);
  };
  G.pointer = function (x, y, on) {
    if (!on) return;
    var g = G.ctx; g.fillStyle = '#ffe66e';
    g.fillRect(x, y + 2, 3, 1); g.fillRect(x + 1, y + 1, 2, 1); g.fillRect(x + 1, y + 3, 2, 1);
    g.fillRect(x + 2, y, 1, 1); g.fillRect(x + 2, y + 4, 1, 1);
  };

  /* ---------- effets d'écran ---------- */
  G.fx = {
    flashT: 0, flashC: '#fff', flashMax: 0,
    shakeT: 0, shakeMax: 1, shakeMag: 0, shakeX: 0, shakeY: 0,
    fade: 1, fadeTo: 1, fadeSpd: 1,
    flash: function (dur, col) { G.fx.flashT = dur; G.fx.flashMax = dur; G.fx.flashC = col || '#fff'; },
    shake: function (mag, dur) { G.fx.shakeMag = mag; G.fx.shakeT = dur; G.fx.shakeMax = dur; },
    fadeTo_: null
  };
  G.fadeTo = function (to, spd) { G.fx.fadeTo = to; G.fx.fadeSpd = spd || 2.2; };
  G.updateFx = function (dt) {
    var f = G.fx;
    if (f.flashT > 0) f.flashT = Math.max(0, f.flashT - dt);
    if (f.shakeT > 0) {
      f.shakeT = Math.max(0, f.shakeT - dt);
      var k = f.shakeT / f.shakeMax, m = f.shakeMag * k;
      f.shakeX = Math.round((Math.random() * 2 - 1) * m);
      f.shakeY = Math.round((Math.random() * 2 - 1) * m);
    } else { f.shakeX = f.shakeY = 0; }
    if (f.fadeTo != null) {
      f.fade = U.approach(f.fade, f.fadeTo, (f.fadeSpd || 2) * dt);
      if (Math.abs(f.fade - f.fadeTo) < 0.002) { f.fade = f.fadeTo; f.fadeTo = null; if (f.onDone) { var cb = f.onDone; f.onDone = null; cb(); } }
    }
  };
  G.drawFlash = function () {
    var f = G.fx, g = G.ctx;
    if (f.flashT > 0) {
      var k = f.flashT / f.flashMax;
      g.save(); g.globalAlpha = Math.min(1, k * 1.4); g.fillStyle = f.flashC; g.fillRect(0, 0, G.W, G.H); g.restore();
    }
    if (f.fade > 0.001) {
      g.save(); g.globalAlpha = U.clamp(f.fade, 0, 1); g.fillStyle = '#000'; g.fillRect(0, 0, G.W, G.H); g.restore();
    }
  };

  /* ---------- particules ---------- */
  var parts = [];
  G.resetParts = function () { parts.length = 0; };
  G.p = function (x, y, o) {
    o = o || {};
    parts.push({
      x: x, y: y, vx: o.vx || 0, vy: o.vy || 0, g: o.g || 0,
      life: o.life || 0.5, t: 0, s: o.s || 1, c: o.c || '#fff', f: o.f || null, a: o.a == null ? 1 : o.a
    });
  };
  G.burst = function (x, y, n, o) {
    o = o || {};
    for (var i = 0; i < n; i++) {
      var a = (o.dir != null ? o.dir + (Math.random() - 0.5) * (o.spread || 1.5) : Math.random() * 6.283);
      var sp = (o.sp || 30) * (0.35 + Math.random() * 0.9);
      G.p(x + (Math.random() - 0.5) * (o.jit || 6), y + (Math.random() - 0.5) * (o.jit || 6), {
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.g || 0,
        life: (o.life || 0.5) * (0.6 + Math.random() * 0.8), c: U.pick([o.c || '#fff', o.c2 || o.c || '#fff']),
        s: o.s || 1, f: o.f
      });
    }
  };
  G.updateParts = function (dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.t += dt;
      if (p.t >= p.life) { parts.splice(i, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.f) p.f(p, dt);
    }
  };
  G.drawParts = function () {
    var g = G.ctx;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i], k = 1 - p.t / p.life;
      g.globalAlpha = U.clamp(k, 0, 1) * p.a;
      g.fillStyle = p.c;
      g.fillRect(Math.round(p.x), Math.round(p.y), Math.max(1, Math.round(p.s * (0.4 + k))), Math.max(1, Math.round(p.s * (0.4 + k))));
    }
    g.globalAlpha = 1;
  };
  G.parts = function () { return parts; };

  /* ---------- texte ---------- */
  G.text = function (s, x, y, o) { return FF.Font.draw(G.ctx, s, x, y, o); };
  G.textW = function (s) { return FF.Font.width(s); };
  G.num = function (n, x, y, o) { G.text(U.num(n), x, y, o); };
})(this.FF = this.FF || {});
