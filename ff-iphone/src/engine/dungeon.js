/* ============================================================
   Dun — donjons générés (déterministes via graine fixe)
   Salles + couloirs + salle du boss la plus éloignée.
   ============================================================ */
(function (FF) {
  'use strict';
  var U = FF.U, D = FF.D;
  var Dun = FF.Dun = {};

  Dun.maps = {};

  function carve(cfg) {
    var r = U.rng(U.hash(cfg.seed + '|' + cfg.floor));
    var w = cfg.size[0], h = cfg.size[1];
    var g = [];
    for (var y = 0; y < h; y++) { var row = []; for (var x = 0; x < w; x++) row.push('#'); g.push(row); }
    var rooms = [];
    var target = cfg.rooms || (5 + cfg.floor * 2);
    var guard = 0;
    while (rooms.length < target && guard++ < 400) {
      var rw = 4 + r.int(7), rh = 3 + r.int(5);
      var rx = 1 + r.int(Math.max(1, w - rw - 2)), ry = 1 + r.int(Math.max(1, h - rh - 2));
      var ok = true;
      for (var i = 0; i < rooms.length; i++) {
        var o = rooms[i];
        if (rx < o.x + o.w + 1 && rx + rw + 1 > o.x && ry < o.y + o.h + 1 && ry + rh + 1 > o.y) { ok = false; break; }
      }
      if (!ok) continue;
      rooms.push({ x: rx, y: ry, w: rw, h: rh, cx: (rx + rw / 2) | 0, cy: (ry + rh / 2) | 0 });
      for (y = ry; y < ry + rh; y++) for (x = rx; x < rx + rw; x++) g[y][x] = '.';
    }
    /* couloirs entre salles successives (graphe en anneau + aléa) */
    function tunnel(a, b) {
      var x = a.cx, y = a.cy;
      var step = 0;
      while ((x !== b.cx || y !== b.cy) && step++ < 400) {
        if (g[y][x] === '#') g[y][x] = '.';
        if (x !== b.cx && (y === b.cy || r() < .55)) x += x < b.cx ? 1 : -1;
        else if (y !== b.cy) y += y < b.cy ? 1 : -1;
      }
    }
    for (i = 1; i < rooms.length; i++) tunnel(rooms[i - 1], rooms[i]);
    if (rooms.length > 3) tunnel(rooms[rooms.length - 1], rooms[0]);
    if (rooms.length > 5) tunnel(rooms[1], rooms[rooms.length - 2]);
    return { g: g, rooms: rooms, r: r, w: w, h: h };
  }

  /* garantit qu'une tuile est praticable en creusant vers le sol le plus proche */
  function openAt(g, x, y, w, h, r) {
    x = U.clamp(x | 0, 1, w - 2); y = U.clamp(y | 0, 1, h - 2);
    if (g[y][x] !== '#') return;
    var best = null, bd = 1e9;
    for (var yy = 1; yy < h - 1; yy++) for (var xx = 1; xx < w - 1; xx++) {
      if (g[yy][xx] !== '.') continue;
      var d = Math.abs(xx - x) + Math.abs(yy - y);
      if (d < bd) { bd = d; best = [xx, yy]; }
    }
    g[y][x] = '.';
    if (!best) return;
    var cx = x, cy = y, guard = 0;
    while ((cx !== best[0] || cy !== best[1]) && guard++ < 300) {
      g[cy][cx] = '.';
      if (cx !== best[0] && (cy === best[1] || r() < .5)) cx += cx < best[0] ? 1 : -1;
      else if (cy !== best[1]) cy += cy < best[1] ? 1 : -1;
    }
  }

  Dun.build = function (name) {
    var cfg = D.DUNGEONS[name];
    if (!cfg) return null;
    var out = {};
    var floors = [];
    for (var f = 1; f <= cfg.floors; f++) {
      var id = name + '_' + f;
      if (D.MAPS[id]) { floors.push(D.MAPS[id]); continue; }
      var c = U.copy(cfg); c.floor = f;
      var k = carve(c), g = k.g, rooms = k.rooms, r = k.r;
      var w = c.size[0], h = c.size[1];
      var ents = [];
      /* entrée au niveau 1 */
      var entryRoom = rooms[0], exitRoom = rooms[rooms.length - 1];
      /* distances depuis l'entrée pour placer le boss loin */
      var dist = {};
      (function () {
        var q = [[entryRoom.cx, entryRoom.cy, 0]];
        var seen = {};
        while (q.length) {
          var cur = q.shift(), x = cur[0], y = cur[1], d = cur[2];
          if (x < 0 || y < 0 || x >= w || y >= h) continue;
          var kk = x + ',' + y;
          if (seen[kk] || g[y][x] === '#') continue;
          seen[kk] = d;
          q.push([x + 1, y, d + 1]); q.push([x - 1, y, d + 1]); q.push([x, y + 1, d + 1]); q.push([x, y - 1, d + 1]);
        }
        rooms.forEach(function (rm, i2) { rm.d = seen[rm.cx + ',' + rm.cy] || 0; });
        rooms.sort(function (a, b) { return b.d - a.d; });
        exitRoom = rooms[0];
      })();
      openAt(g, entryRoom.cx, entryRoom.cy + 1, w, h, r);
      var isBossFloor = cfg.boss && cfg.boss.floor === f;
      var isBossFloor2 = cfg.boss2 && cfg.boss2.floor === f;
      var hasSave = (cfg.save || []).indexOf(f) >= 0;
      /* point d'entrée */
      var inx = f === 1 ? entryRoom.cx : null, iny = f === 1 ? entryRoom.cy : null;
      if (f === 1) {
        ents.push({ t: 'door', x: entryRoom.cx, y: entryRoom.cy, to: cfg.back.map, tx: cfg.back.x, ty: cfg.back.y, out: 1 });
        /* marque l'entrée par une tuile sortie */
      }
      /* escaliers vers l'étage suivant (ou vers la salle du boss) */
      var nextFloorId = name + '_' + (f + 1);
      var stairsHere = f < cfg.floors && !isBossFloor;
      if (stairsHere) {
        openAt(g, exitRoom.cx, exitRoom.cy, w, h, r);
        g[exitRoom.cy][exitRoom.cx] = 'e';
        ents.push({ t: 'stairs', x: exitRoom.cx, y: exitRoom.cy, to: nextFloorId, tx: 'in', dir: 'down' });
        /* entrée de l'étage suivant = même pièce */
        D.DUNGEONS[name]['_in' + (f + 1)] = { x: exitRoom.cx, y: exitRoom.cy + 1 };
      }
      if (f > 1 && D.DUNGEONS[name]['_in' + f]) {
        var pin = D.DUNGEONS[name]['_in' + f];
        openAt(g, pin.x, pin.y, w, h, r);
        ents.push({ t: 'stairsback', x: pin.x, y: pin.y, to: name + '_' + (f - 1), tx: pin.x, ty: pin.y - 1 });
      }
      /* sauvegarde / cristal */
      if (hasSave) {
        var sr = rooms[Math.min(rooms.length - 1, 1)];
        g[sr.cy][sr.cx] = 'c';
        ents.push({ t: 'save', x: sr.cx, y: sr.cy });
      }
      /* torche / décor */
      for (var i = 0; i < Math.min(10, rooms.length * 2); i++) {
        var rr = rooms[i % rooms.length];
        var px = U.clamp(rr.x + r.int(rr.w), 1, w - 2), py = U.clamp(rr.y + r.int(rr.h), 1, h - 2);
        if (g[py][px] === '.' && r() < .55) { g[py][px] = 'l'; }
      }
      /* coffres */
      var nChest = Math.min(3 + cfg.floors - f, 4);
      for (i = 0; i < nChest; i++) {
        var rm = rooms[(i * 2 + f) % rooms.length];
        var cx = U.clamp(rm.x + 1 + r.int(Math.max(1, rm.w - 2)), 1, w - 2);
        var cy = U.clamp(rm.y + 1 + r.int(Math.max(1, rm.h - 2)), 1, h - 2);
        if (g[cy][cx] !== '.') continue;
        g[cy][cx] = '.';
        var loot = cfg.chests && cfg.chests[(f * 3 + i) % cfg.chests.length];
        if (loot) ents.push({ t: 'chest', x: cx, y: cy, loot: loot });
      }
      /* PNJ égarés (quête mineur) */
      if (cfg.npc && f === (cfg.boss ? cfg.boss.floor : 1)) {
        var nr = rooms[Math.max(0, rooms.length - 2)];
        ents.push({ t: 'npc', x: nr.cx, y: nr.cy, look: cfg.npc.look, say: '@' + (cfg.npc.say || '').replace('@', ''), dir: 'down', once: 1 });
      }
      /* boss */
      if (isBossFloor || isBossFloor2) {
        var br = isBossFloor2 ? rooms[Math.max(0, rooms.length - 1)] : exitRoom;
        ents.push({ t: 'bossgate', need: cfg.key, x: br.cx, y: br.cy, foes: (isBossFloor2 ? cfg.boss2 : cfg.boss).foes, name: (isBossFloor2 ? cfg.boss2 : cfg.boss).name, scene: (isBossFloor2 ? cfg.boss2 : cfg.boss).scene, bossFloor: true });
        /* anneau de cristaux autour du boss */
        for (var a = 0; a < 6; a++) {
          var ax = U.clamp(br.cx + Math.round(Math.cos(a / 6 * 6.283) * 3), 1, w - 2);
          var ay = U.clamp(br.cy + Math.round(Math.sin(a / 6 * 6.283) * 2), 1, h - 2);
          if (g[ay][ax] === '.') g[ay][ax] = 'c';
        }
      }
      var rows = g.map(function (rw) { return rw.join(''); });
      var m = D.MAPS[name + '_' + f] = {
        n: cfg.n + ' — ' + (cfg.floors > 1 ? 'Niveau ' + U.roman(f) : ''), id: name + '_' + f,
        theme: cfg.theme, bg: cfg.bg, music: cfg.music, rows: rows, ents: ents, w: w, h: h, void: '#',
        gen: true, floor: f, dungeon: name,
        enc: { list: cfg.list || [], rate: (D.ENC_RATE || .11) - (cfg.open ? .02 : 0), lv: cfg.lv },
        entry: { x: entryRoom.cx, y: entryRoom.cy + 1 }
      };
      /* borner les murs extérieurs */
      floors.push(m);
      out[m.id] = m;
    }
    Dun.maps[name] = floors;
    return floors;
  };
  Dun.all = function () {
    for (var k in D.DUNGEONS) if (!Dun.maps[k]) Dun.build(k);
    return Dun.maps;
  };
})(this.FF = this.FF || {});
