/* ============================================================
   Assets — pré-cuisson de tous les sprites du jeu
   ============================================================ */
(function (FF) {
  'use strict';
  var U = FF.U, D = FF.D, B = FF.Bake;
  var A = FF.Assets = {};

  A.ready = false;
  A.build = function (opt) {
    var t0 = Date.now();
    B.buildThemes();
    A.tiles = B.themes;
    A.hero = {}; A.back = {}; A.portrait = {}; A.npc = {}; A.enemy = {}; A.icon = {};
    /* héros + compagnons */
    for (var id in D.CAST) {
      var look = D.CAST[id].look || {};
      A.hero[id] = B.hero(look);
      A.back[id] = B.back(look);
      A.portrait[id] = B.portrait(look);
    }
    /* PNJ */
    for (var k in D.NPCLOOK) A.npc[k] = B.hero(D.NPCLOOK[k]);
    /* ennemis : toutes les variantes de peau, puis mises à l'échelle */
    for (var mid in D.MON) {
      var mo = D.MON[mid];
      var art = B.themes && FF.Spr.ART[mo.art];
      if (!art) { continue; }
      var key = mo.art + '#' + (mo.skin || 0);
      if (!A.enemy[key]) {
        var base = FF.Spr.build(art, FF.Spr.skin(mo.art, mo.skin), 1);
        A.enemy[key] = base;
      }
    }
    /* icônes d'objets */
    for (var iid in D.IT) {
      var it = D.IT[iid];
      var ic = it.icon || { k: 'crystal', c: '#c9d6e6' };
      A.icon[iid] = B.icon(ic.k, ic.c, 16, 16);
    }
    /* divers */
    A.stone = B.icon('crystal', '#c9c9c9');
    A.barrier = mkBarrier();
    A.ship = mkShip();
    A.chocobo = mkChoc();
    A.arrow = mkArrow();
    A.ready = true;
    return Date.now() - t0;
  };

  function mkBarrier() {
    var c = FF.Gfx.canvas(20, 20), g = B.pen(c);
    for (var a = 0; a < 24; a++) {
      var x = 10 + Math.cos(a / 24 * 6.283) * 9, y = 10 + Math.sin(a / 24 * 6.283) * 9;
      g.px(x | 0, y | 0, '#8fb3ff');
    }
    return c;
  }
  function mkShip() {
    var c = FF.Gfx.canvas(32, 20), g = B.pen(c);
    g.r(4, 10, 24, 6, '#8a6b4a'); g.r(6, 8, 20, 2, '#a6855f');
    g.r(10, 2, 12, 6, '#cfd8e6'); g.r(11, 3, 10, 4, '#8fb3ff');
    g.r(14, 0, 4, 2, '#6a4b2c');
    g.r(2, 15, 28, 2, '#5a4530');
    g.r(15, 12, 2, 4, '#ffd257');
    return c;
  }
  function mkChoc() {
    var c = FF.Gfx.canvas(16, 16), g = B.pen(c);
    g.r(5, 3, 6, 6, '#ff8a3d'); g.r(7, 1, 4, 3, '#ff8a3d');
    g.px(8, 2, '#2b2018'); g.r(10, 3, 2, 1, '#ffd257');
    g.r(4, 8, 8, 4, '#e0663d'); g.r(6, 12, 2, 3, '#c98a4a'); g.r(9, 12, 2, 3, '#c98a4a');
    return c;
  }
  function mkArrow() {
    var c = FF.Gfx.canvas(8, 8), g = B.pen(c);
    g.r(1, 3, 6, 2, '#fff');
    return c;
  }

  /* accès pratique */
  A.enemyOf = function (mon) {
    return A.enemy[mon.art + '#' + (mon.skin || 0)] || A.enemy['slime#0'];
  };
  A.heroOf = function (id) { return A.hero[id] || A.hero.arno; };
  A.npcOf = function (e) {
    if (e.look && A.npc[e.look]) return A.npc[e.look];
    if (e.who && A.npc[e.who]) return A.npc[e.who];
    return A.npc.vieux;
  };
  A.frame = function (set, dir, t, moving) {
    if (!set) return null;
    var d = set[dir] || set.down;
    if (!moving) return d[0];
    var i = (Math.floor(t * 7) % 3);
    return d[i === 1 ? 1 : (i === 2 ? 2 : 0)];
  };
})(this.FF = this.FF || {});
