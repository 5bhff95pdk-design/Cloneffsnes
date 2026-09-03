/* ============================================================
   Wld — scène du monde : déplacement, caméra, rencontres,
   interactions, exécution des scènes scénarisées.
   ============================================================ */
(function (FF) {
  'use strict';
  var U = FF.U, G = FF.Gfx, D = FF.D, S = FF.S;
  var T = 16;
  var Wo = FF.Wld = {};

  Wo.p = null;         // joueur
  Wo.cam = { x: 0, y: 0 };
  Wo.map = null;
  Wo.mode = 'foot';    // 'foot' | 'ship'
  Wo.cut = null;       // scène en cours
  Wo.msgQ = [];
  Wo.steps = 0;
  Wo.encCd = 0;
  Wo.shipPos = { x: 42, y: 33 };

  function tile(map, x, y) { return D.at(map.id, x, y); }

  Wo.enter = function (mapId, x, y, dir) {
    var m = D.MAPS[mapId];
    if (!m) { console.warn('carte inconnue', mapId); m = D.MAPS.aurelia; mapId = 'aurelia'; x = 15; y = 20; }
    Wo.map = m;
    S.loc.map = mapId;
    var p = Wo.p = Wo.p || { x: 0, y: 0, dir: 'down', t: 0, moving: 0, gx: 0, gy: 0, trail: [], followers: [] };
    p.gx = U.clamp(x | 0, 0, m.w - 1); p.gy = U.clamp(y | 0, 0, m.h - 1);
    var free = Wo.freeSpot(p.gx, p.gy);
    p.gx = free.x; p.gy = free.y;
    p.x = p.gx; p.y = p.gy;
    if (dir) p.dir = dir;
    p.trail.length = 0;
    Wo.cam.x = p.x * T - G.W / 2; Wo.cam.y = p.y * T - G.H / 2;
    G.resetParts();
    if (m.music && m.music !== FF.Snd.musicName()) FF.Snd.playMusic(m.music);
    S.loc.x = p.gx; S.loc.y = p.gy; S.loc.dir = p.dir;
    Wo.steps = 0; /* grâce : pas de rencontre dès la 1re case d'une carte */
    return m;
  };

  Wo.solidAt = function (gx, gy) {
    var m = Wo.map; if (!m) return true;
    if (gx < 0 || gy < 0 || gx >= m.w || gy >= m.h) {
      if (m.world && Wo.mode === 'ship') return false;
      return true;
    }
    var ch = tile(m, gx, gy);
    var th = G.tiles(m.theme);
    var def = th[ch];
    if (!def) { return ch !== '.'; }
    if (Wo.mode === 'ship') return ch === '#' || ch === 'M' || ch === 'K';
    if (def.solid) return true;
    /* entités bloquantes */
    var e = D.entAt(m.id, gx, gy);
    if (e && (e.t === 'npc' || e.t === 'chest' || e.t === 'save' || e.t === 'shop' || e.t === 'sign' || e.t === 'bossgate' || e.t === 'bed')) return true;
    if (Wo.shipHere(gx, gy)) return true;
    return false;
  };
  Wo.shipHere = function (gx, gy) {
    return S.ship && Wo.map && Wo.map.world && Wo.mode !== 'ship' && Math.round(Wo.shipPos.x) === gx && Math.round(Wo.shipPos.y) === gy;
  };

  G.tiles = function (name) { return (FF.Bake.themes && FF.Bake.themes[name]) || FF.Bake.themes.field; }

  /* ---------------- update ---------------- */
  Wo.update = function (dt) {
    var p = Wo.p, m = Wo.map;
    if (!p || !m) return;
    p.t += dt;
    if (Wo.cut) {
      Wo.runCut(dt);
      /* filet : cutteur inerte (ni wait, ni pause, ni dialogue) → clôturer
         (régression crédits / étape oubliée de cutStep). */
      if (Wo.cut && !Wo.cut.pause && !(Wo.cut.wait > 0) && !(FF.UI && FF.UI.dlg) && !Wo.cut.battleWait) {
        Wo.cut._idle = (Wo.cut._idle || 0) + dt;
        if (Wo.cut._idle > 1) Wo.cut = null;
      } else if (Wo.cut) Wo.cut._idle = 0;
      return;
    }
    if (FF.Game.modal) return;
    var speed = Wo.mode === 'ship' ? 7.2 : 3.5;
    if (S.settings && S.settings.fast) speed *= 1.4;
    if (p.moving) {
      var d = U.dirs[p.dir];
      var tx = p.gx, ty = p.gy;
      var dx = tx - p.x, dy = ty - p.y;
      var step = speed * dt;
      if (Math.abs(dx) <= step && Math.abs(dy) <= step) {
        p.x = tx; p.y = ty; p.moving = 0;
        p.trail.unshift({ x: p.x, y: p.y });
        if (p.trail.length > 40) p.trail.pop();
        Wo.onArrive();
      } else {
        p.x += Math.sign(dx) * Math.min(step, Math.abs(dx));
        p.y += Math.sign(dy) * Math.min(step, Math.abs(dy));
      }
    } else {
      var dir = FF.In.dir();
      if (dir) {
        p.dir = dir;
        var v = U.dirs[dir];
        if (!Wo.solidAt(p.gx + v[0], p.gy + v[1])) {
          p.gx += v[0]; p.gy += v[1]; p.moving = 1;
          if (FF.U.rand(3) === 0) FF.Snd.play('step');
        } else {
          p.moving = 0;
          Wo.blocked(dir);
        }
      } else if (FF.In.pressed('a')) Wo.interact();
    }
    /* caméra */
    var cw = G.W, chh = G.H;
    var tx = p.x * T - cw / 2 + T / 2, ty = p.y * T - chh / 2 + T / 2;
    if (m.w * T <= cw) tx = (m.w * T - cw) / 2;
    if (m.h * T <= chh) ty = (m.h * T - chh) / 2;
    tx = U.clamp(tx, 0, Math.max(0, m.w * T - cw));
    ty = U.clamp(ty, 0, Math.max(0, m.h * T - chh));
    var k = Wo.mode === 'ship' ? 4 : 8;
    Wo.cam.x = U.approach(Wo.cam.x, tx, k * dt * Math.max(1, Math.abs(tx - Wo.cam.x)));
    Wo.cam.y = U.approach(Wo.cam.y, ty, k * dt * Math.max(1, Math.abs(ty - Wo.cam.y)));
    if (Wo.encCd > 0) Wo.encCd -= dt;
    /* particules d'ambiance */
    if (m.bg === 'lava' && Math.random() < .25) G.burst(Wo.cam.x + Math.random() * G.W, Wo.cam.y + G.H - 4, 1, { c: '#ff9a3d', c2: '#ffe066', vy: -22, g: -6, life: 1.6, s: 1, sp: 0, dir: 0, jit: 4 });
    if (m.theme === 'ice' && Math.random() < .35) G.p(Wo.cam.x + Math.random() * G.W, Wo.cam.y + Math.random() * G.H, { vy: 12, vx: -6, life: 2, c: '#ffffff', s: 1 });
    G.updateParts(dt);
  };

  Wo.blocked = function (dir) {
    var p = Wo.p, v = U.dirs[dir];
    var e = D.entAt(Wo.map.id, p.gx + v[0], p.gy + v[1]);
    if (e) Wo.tryInteract(e, v);
  };
  Wo.onArrive = function () {
    var p = Wo.p, m = Wo.map;
    S.loc.x = p.gx; S.loc.y = p.gy;
    var e = D.entAt(m.id, p.gx, p.gy);
    if (e && (e.t === 'door' || e.t === 'stairs' || e.t === 'stairsback' || e.t === 'scene' || e.t === 'bossgate' || e.t === 'locked' || e.t === 'ship' || e.t === 'save')) {
      Wo.tryInteract(e, null, true);
      return;
    }
    var ch = tile(m, p.gx, p.gy);
    var th = G.tiles(m.theme);
    if (th[ch] && th[ch].dmg && Wo.mode !== 'ship') {
      S.party().forEach(function (mm) { if (mm && mm.hp > 0) mm.hp = Math.max(1, mm.hp - (th[ch].dmg | 0)); });
      FF.Snd.play('fire'); G.fx.flash(.2, '#ff7a3d');
    }
    Wo.tryEncounter();
  };
  Wo.canEncounter = function () {
    if (!Wo.map || Wo.mode !== 'foot') return false;
    if (FF.Game && FF.Game.noEnc) return false;
    if (S.settings && S.settings.encounters === 0) return false;
    if (S.f('noenc')) return false;
    var enc = Wo.map.enc;
    if (!enc) return false;
    if (enc.list && enc.list.length) return true;
    if (enc.zones && enc.zones.length) return true;
    if (enc.sea && enc.sea.length) return true;
    return false;
  };
  Wo.tryEncounter = function () {
    if (!Wo.canEncounter()) return false;
    Wo.steps++;
    S.steps++;
    var enc = Wo.map.enc;
    var rate = (enc && enc.rate != null) ? enc.rate : (D.ENC_RATE || 0);
    if (Wo.steps > 14 && Math.random() < rate) {
      Wo.steps = 0;
      Wo.triggerEncounter();
      return true;
    }
    return false;
  };

  /* ---------------- interactions ---------------- */
  Wo.interact = function () {
    var p = Wo.p, v = U.dirs[p.dir];
    var e = D.entAt(Wo.map.id, p.gx + v[0], p.gy + v[1]) || D.entAt(Wo.map.id, p.gx, p.gy);
    if (Wo.mode === 'ship') { Wo.land(); return; }
    if (Wo.shipHere(p.gx + v[0], p.gy + v[1]) || Wo.shipHere(p.gx, p.gy)) { Wo.board(); return; }
    if (e) Wo.tryInteract(e, v);
    else if (FF.UI.openMenu) FF.UI.openMenu();
  };

  Wo.tryInteract = function (e, v, auto) {
    var m = Wo.map;
    switch (e.t) {
      case 'door': case 'stairs': case 'stairsback': {
        if (!Wo.needOk(e.need)) { Wo.say(['', 'Le passage est scellé. Il manque : ' + (D.IT[e.need] ? D.IT[e.need].n : e.need) + '.']); return; }
        var tid = e.to;
        if (e.tx === 'in') {
          var dd = D.MAPS[tid];
          if (dd && dd.entry) { Wo.warpTo(tid, dd.entry.x, dd.entry.y, 'up'); }
          else Wo.warpTo(tid, 2, 2, 'down');
          return;
        }
        if (e.to === 'mines_1' && !S.has('lanterne') && !S.f('lanterne')) { }
        Wo.warpTo(e.to, e.tx | 0, e.ty | 0, e.dir || (e.t === 'stairs' ? 'down' : 'down'));
        FF.Snd.play('door');
        break;
      }
      case 'chest': {
        if (S.treasure[m.id + ':' + e.x + ',' + e.y]) return;
        S.treasure[m.id + ':' + e.x + ',' + e.y] = 1;
        FF.Snd.play('chest');
        var l = e.loot || {};
        var txt = '';
        if (l.g) { S.gil(l.g); txt = U.num(l.g) + ' gils !'; }
        else if (l.it) {
          S.add(l.it, l.n || 1);
          txt = (D.IT[l.it] ? D.IT[l.it].n : l.it) + (l.n > 1 ? ' ×' + l.n : '') + ' !';
        }
        if (l.spell) { S.order.forEach(function (id) { var mm = S.members[id]; mm.gifted = (mm.gifted || []).concat([l.spell]); FF.P.recalc(mm); }); txt = 'Sort : ' + D.SP[l.spell].n; }
        if (l.job) { S.jobs[l.job] = 1; txt = 'Emploi obtenu : ' + D.JOBS[l.job].n; }
        Wo.say(['', 'Un coffre ! ' + txt], { title: null });
        break;
      }
      case 'sign': Wo.say(['', e.t2 || '...']); break;
      case 'save': FF.UI.crystal(); break;
      case 'shop': FF.UI.shop(e); break;
      case 'bed': case 'inn': FF.UI.inn(e); break;
      case 'npc': case 'obj': {
        if (e.c && !FF.Cond(e.c, S)) return;
        Wo.talk(e);
        break;
      }
      case 'scene': {
        if (e.once && S.f('sc_' + e.scene)) return;
        if (e.c && !FF.Cond(e.c, S)) return;
        if (e.once) S.set('sc_' + e.scene);
        Wo.play(e.scene);
        break;
      }
      case 'bossgate': {
        if (e.once && S.f('boss_' + (e.scene || e.name))) return;
        if (!Wo.needOk(e.need)) { Wo.say(['', 'Rien ne s’ouvre. Il manque : ' + Wo.needName(e.need) + '.']); return; }
        if (e.c && !FF.Cond(e.c, S)) return;
        FF.Game.battle({ foes: e.foes, bg: m.bg, music: 'boss', bossName: e.name, noFlee: 1, onWin: function () {
          S.set('boss_' + (e.scene || e.name));
          if (e.scene) S.set('sc_' + e.scene);
          if (e.scene && D.SCENES[e.scene]) Wo.play(e.scene);
          else { FF.Game.afterBoss(e); }
        } });
        break;
      }

      case 'ship': Wo.board(); break;
    }
  };
  /* exigences d'une porte : 'flag:x', 'item:y', ou id d'objet/drapeau */
  /*true. Only the tile itself blocks (entities are ignored on purpose). */
  Wo.wallAt = function (x, y) {
    var m = Wo.map; if (!m) return true;
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
    var ch = tile(m, x, y);
    var th = G.tiles(m.theme);
    var def = th[ch];
    if (!def) return ch !== '.';
    return !!def.solid;
  };
  /* si la tuile d’arrivée est pleine, on déplace sur la tuile libre la plus proche */
  Wo.freeSpot = function (x, y) {
    if (!Wo.wallAt(x, y)) return { x: x, y: y };
    for (var r = 1; r <= 4; r++) {
      for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) + Math.abs(dy) !== r) continue;
        if (!Wo.wallAt(x + dx, y + dy)) return { x: x + dx, y: y + dy };
      }
    }
    return { x: x, y: y };
  };
  Wo.needOk = function (need) {
    if (!need) return true;
    var k = String(need);
    if (k.indexOf('flag:') === 0) return !!S.flags[k.slice(5)];
    if (k.indexOf('item:') === 0) return S.count(k.slice(5)) > 0;
    return S.count(k) > 0 || !!S.flags[k];
  };
  Wo.needName = function (need) {
    var k = String(need || '').replace(/^(flag|item):/, '');
    return (D.IT[k] && D.IT[k].n) || k;
  };
  Wo.town = function () {
    var m = Wo.map; if (!m) return null;
    if (m.town) return m.town;
    if (D.SHOPS[m.id]) return m.id;
    return null;
  };
  Wo.tileAt = function (x, y, m) { return tile(m || Wo.map, x | 0, y | 0); };
  Wo.warpTo = function (id, x, y, dir) {
    G.fadeTo(1, 3.2);
    setTimeout(function () { Wo.enter(id, x, y, dir); G.fadeTo(0, 3.2); }, 180);
  };
  Wo.exitToWorld = function (e) {
    var p = Wo.p;
    Wo.warpTo(e.to, S.loc.wx != null ? S.loc.wx : e.tx, S.loc.wy != null ? S.loc.wy : e.ty, 'down');
  };

  /* dialogues */
  Wo.normLines = function (lines) {
    if (typeof lines === 'string') lines = [[null, lines]];
    if (!lines || !lines.length) return [['', '…']];
    if (lines.length === 2 && typeof lines[0] === 'string' && typeof lines[1] === 'string') lines = [lines];
    return lines.map(function (l) {
      if (typeof l === 'string') return ['', l];
      if (!l || !l.length) return ['', ''];
      var w = l[0] == null ? '' : String(l[0]), t = l[1] == null ? '' : String(l[1]);
      if (w && !t) { t = w; w = ''; }   /* ['texte'] */
      return [w, t];
    });
  };
  Wo.say = function (lines, opt) {
    FF.UI.dialog(Wo.normLines(lines), opt);
  };
  Wo.talk = function (e) {
    var who = e.who || null;
    var lines = e.say;
    if (typeof lines === 'string' && lines[0] === '@') {
      var id = lines.slice(1);
      var set = D.DLG[id];
      if (!set) { Wo.say([['', '…']]); return; }
      for (var i = 0; i < set.length; i++) if (!set[i].c || FF.Cond(set[i].c, S)) { lines = set[i].l; break; }
    }
    if (!lines) lines = [['', '…']];
    if (e.inn) { FF.UI.inn(e); return; }
    var nn = Wo.normLines(lines).map(function (l) {
      var k = l[0];
      return [k === '' ? '' : (D.CAST[k] ? D.CAST[k].n : (D.NPCLOOK[k] ? nameOf(k) : k)), l[1]];
    });
    Wo.say(nn);
    if (e.give) { S.add(e.give.it, e.give.n || 1); }
    if (e.once) e.used = 1;
  };
  function nameOf(k) { return ({ roi: 'Roi Aldric', vieux: 'Villageois', mineur: 'Mineur', marin: 'Marin', forgeron: 'Forgeron', ermite: 'Ermite', aubergiste: 'Aubergiste', marchand: 'Marchand', pretre: 'Prêtre', garde: 'Garde', gosse: 'Enfant', enfant: 'Enfant', vielle: 'Vieille femme', mere: 'Mère', noble: 'Noble', lys: 'Lysandre' })[k] || 'Habitant'; }
  Wo.nameOf = nameOf;

  /* ---------------- aéronef ---------------- */
  Wo.board = function () {
    if (!S.f('ship') && S.count('nacelle') <= 0) { Wo.say(['', 'La nacelle du dirigeable n’est pas encore installée.']); return; }
    Wo.mode = 'ship';
    FF.Snd.playMusic('ship');
    G.fx.flash(.25, '#ffffff');
    Wo.say(['', 'L’Aube s’élève. Plus rien ne vous arrête — sauf les montagnes.']);
  };
  Wo.land = function () {
    var p = Wo.p;
    if (Wo.solidAt(p.gx, p.gy)) { Wo.say(['', 'Ici, on ne peut pas se poser.']); return; }
    Wo.mode = 'foot';
    Wo.shipPos.x = p.gx; Wo.shipPos.y = p.gy;
    FF.Snd.play('ship');
    FF.Snd.playMusic(Wo.map.music || 'world');
  };

  /* ---------------- rencontres ---------------- */
  Wo.triggerEncounter = function (force) {
    var m = Wo.map, enc = m.enc;
    if (!enc) return;
    var list = enc.list;
    if (m.world) {
      var p = Wo.p;
      var zones = enc.zones || [];
      for (var i = 0; i < zones.length; i++) {
        var z = zones[i];
        if (p.gx >= z.x0 && p.gx <= z.x1 && p.gy >= z.y0 && p.gy <= z.y1) { list = z.list || z.foes; break; }
      }
      var ch = tile(m, p.gx, p.gy);
      if (ch === '~') list = enc.sea || list;
      else if (ch === 'W') list = enc.snow || list;
      else if (ch === 'D') list = enc.desert || list;
    }
    if (!list || !list.length) return;
    var lv = S.order.reduce(function (a, id) { return a + (S.members[id] ? S.members[id].lv : 0); }, 0) / Math.max(1, S.order.length);
    var n = 1 + U.rand(3);
    if (lv > 22 && Math.random() < .35) n = 4;
    var foes = [];
    for (i = 0; i < n; i++) {
      var pick = list[U.rand(list.length)];
      if (D.MON[pick]) foes.push(pick);
    }
    if (!foes.length) return;
    FF.Game.battle({ foes: foes, bg: m.bg || 'field', back: Math.random() < .12 });
  };

  /* ---------------- scènes scénarisées ---------------- */
  Wo.play = function (id, cb) {
    var sc = D.SCENES[id];
    if (!sc) { console.warn('scène inconnue', id); if (cb) cb(); return; }
    Wo.cut = { id: id, steps: sc, i: 0, t: 0, cb: cb, wait: 0 };
    Wo.cutStep();
  };
  Wo.runCut = function (dt) {
    var c = Wo.cut;
    if (!c) return;
    c.t += dt;
    /* un dialogue clos sans closeDialog ne doit pas figer la scène */
    if (c.pause && !FF.UI.dlg && !c.battleWait && c.t > .3) { c.pause = false; Wo.cutStep(); return; }
    if (c.wait > 0) {
      c.wait -= dt;
      if (c.wait > 0) return;
      c.wait = 0;
      /* à l'expiration du wait, la scène REPREND (étapes map/wait/fade sans pause) */
      if (c.pause) c.pause = false;
      Wo.cutStep();
      return;
    }
    if (FF.UI.dlg) return;   /* attend la fin du dialogue */
    if (FF.In.pressed('a') && c.autoAdvance) { c.autoAdvance = false; Wo.cutStep(); }
  };
  Wo.cutStep = function () {
    var c = Wo.cut;
    if (!c) return;
    if (c.i >= c.steps.length) {
      var cb = c.cb;
      Wo.cut = null;
      if (cb) cb();
      return;
    }
    var s = c.steps[c.i++];
    c.t = 0;
    switch (s.s) {
      case 'say': {
        var who = s.who ? (D.CAST[s.who] ? D.CAST[s.who].n : Wo.nameOf(s.who)) : '';
        c.pause = true;
        Wo.say([[who || '', s.t]]);
        break;
      }
      case 'sayl': c.pause = true; Wo.say(s.l); break;
      case 'scene': {
        if (String(s.to).indexOf('dlg:') === 0) {
          var id = s.to.slice(4);
          var set = D.DLG[id];
          var lines = set && set[0] && set[0].l;
          for (var i = 0; set && i < set.length; i++) if (!set[i].c || FF.Cond(set[i].c, S)) { lines = set[i].l; break; }
          c.pause = true;
          Wo.say(lines || [['', '…']]);
        }
        break;
      }
      case 'wait': c.wait = s.t || .6; break;
      case 'fade': G.fadeTo(s.to == null ? 1 : s.to, 2.2); c.wait = .55; break;
      case 'flash': G.fx.flash(.3, s.c || '#fff'); Wo.cutStep(); break;
      case 'shake': G.fx.shake(3, .5); Wo.cutStep(); break;
      case 'heal': case 'revive':
        S.allMembers().forEach(function (m) { if (m) FF.P.healFull(m); });
        Wo.cutStep(); break;
      case 'give': if (s.n !== 0) S.add(s.it, s.n || 1); Wo.cutStep(); break;
      case 'gil': S.gil(s.n || 0); Wo.cutStep(); break;
      case 'flag': S.set(s.k, s.v); Wo.cutStep(); break;
      case 'job': S.jobs[s.j] = 1; if (D.JOBS[s.j]) Wo.say(['', 'Nouvel emploi appris : ' + D.JOBS[s.j].n + ' !']), c.pause = true; Wo.cutStep(); break;
      case 'summon': S.summons[s.k] = 1; if (D.SP[s.k]) S.order.forEach(function (id2) { var mm = S.members[id2]; if (mm) { mm.gifted = (mm.gifted || []).concat([s.k]); FF.P.recalc(mm); } }); Wo.say(['', 'Esprit lié : ' + (D.SP[s.k] ? D.SP[s.k].n : s.k) + ' !']); c.pause = true; break;
      case 'join': {
        var m2 = S.members[s.who] || FF.P.make(s.who);
        S.addMember(m2, !S.reserve.length || S.order.length < 4);
        S.join(s.who);
        FF.P.healFull(S.members[s.who]);
        Wo.cutStep(); break;
      }
      case 'leave': S.leave(s.who); Wo.cutStep(); break;
      case 'chapter': S.ch = s.n; Wo.cutStep(); break;
      case 'map': Wo.enter(s.to, s.x, s.y, s.dir); G.fadeTo(0, 2); c.wait = .5; break;
      case 'title': Wo.cutStep(); break;
      case 'ship': S.set('ship'); S.ship = 1; Wo.cutStep(); break;
      case 'label': c.labels = c.labels || {}; c.labels[s.k] = c.i; Wo.cutStep(); break;
      case 'battle': {
        var onWin = null;
        if (s.on && s.on.indexOf('win:') === 0) {
          var lab = s.on.slice(4);
          onWin = function () {
            var c2 = Wo.cut;
            if (c2 && c2.labels && c2.labels[lab] != null) { c2.i = c2.labels[lab]; Wo.cutStep(); }
            else if (c2) Wo.cutStep();
          };
        }
        c.pause = true;
        FF.Game.battle({ foes: s.foes, bg: s.bg || Wo.map.bg, music: s.music, bossName: s.name, noFlee: 1, onWin: onWin, script: true });
        break;
      }
      case 'warp': Wo.warpTo(s.to, s.x, s.y); c.wait = .5; break;
      case 'endscene': case 'end': {
        if (s.end === 'credits' || s.s === 'end') { }
        if (s.credit || s.s === 'end' && s.credits) { }
        if (s.s === 'end' && s.to) Wo.warpTo(s.to, s.x, s.y);
        var cb2 = c.cb; Wo.cut = null; if (cb2) cb2();
        break;
      }
      case 'credits':
        /* Game.credits() clôt le cutteur, pose ending et sauve :
           sans ça, wait=0/pause=false → runCut ne reprend jamais et le joueur gèle. */
        FF.Game.credits();
        break;
      default: Wo.cutStep();
    }
    /* après une scène 'say', la reprise se fait quand le dialogue se ferme */
    if (!c.pause && !c.wait) Wo.runCut(0);
  };
  /* appelé par UI quand un dialogue de scène se termine */
  Wo.cutResume = function () {
    var c = Wo.cut;
    if (!c) return;
    c.pause = false;
    Wo.cutStep();
  };

  /* ---------------- rendu ---------------- */
  Wo.draw = function () {
    var m = Wo.map, p = Wo.p;
    if (!m || !p) return;
    var th = G.tiles(m.theme);
    var ox = Math.round(Wo.cam.x), oy = Math.round(Wo.cam.y);
    var x0 = Math.max(0, Math.floor(ox / T) - 1), y0 = Math.max(0, Math.floor(oy / T) - 1);
    var x1 = Math.min(m.w - 1, Math.ceil((ox + G.W) / T)), y1 = Math.min(m.h - 1, Math.ceil((oy + G.H) / T));
    var f = (G.time * 6) | 0;
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        var ch = tile(m, x, y);
        var d = th[ch] || th['#'];
        var fr = d.frames, img = d.anim ? fr[f % fr.length] : fr[0];
        G.spr(img, x * T - ox, y * T - oy, {});
      }
    }
    /* entités */
    m.ents.forEach(function (e) {
      if (e.c && !FF.Cond(e.c, S)) return;
      if (e.hide && FF.Cond(e.hide, S)) return;
      var sx = e.x * T - ox, sy = e.y * T - oy;
      if (sx < -24 || sy < -24 || sx > G.W + 24 || sy > G.H + 24) return;
      if (e.t === 'npc' || e.t === 'obj') {
        var set = FF.Assets.npc[e.look] || FF.Assets.npc.vieux;
        G.spr(FF.Assets.frame(set, e.dir || 'down', G.time + (e.x * .3), e.roam && 1), sx, sy - 2, {});
      } else if (e.t === 'chest') {
        var opened = !!S.treasure[m.id + ':' + e.x + ',' + e.y];
        G.spr(FF.Bake.chestTile(m.theme, !!opened), sx, sy, {});
      } else if (e.t === 'save') {
        var img = th['c'] ? th['c'].frames[0] : null;
        G.spr(img, sx, sy, {});
        G.rect(sx + 4, sy + 1, 8, 1, 'rgba(160,240,255,' + (.25 + .2 * Math.sin(G.time * 3)) + ')');
      } else if (e.t === 'bossgate') {
        G.rect(sx + 4, sy + 6, 8, 3, Math.floor(G.time * 3) % 2 ? '#ff6a6a' : '#8a2f2f');
      } else if (e.t === 'ship') {
        G.spr(FF.Assets.ship, sx - 8, sy - 4, {});
      }
    });
    /* dirigeable posé */
    if (Wo.mode !== 'ship' && S.f('ship') && m.world) G.spr(FF.Assets.ship, Wo.shipPos.x * T - ox, Wo.shipPos.y * T - oy - 4, {});
    /* suiveurs */
    var order = S.order.map(function (id) { return S.members[id]; }).filter(Boolean);
    for (var i = order.length - 1; i >= 1; i--) {
      var idx = i * 6;
      var tr = p.trail[Math.min(p.trail.length - 1, idx)] || { x: p.x, y: p.y };
      var set2 = FF.Assets.hero[order[i].id] || FF.Assets.npc.vieux;
      var bob = (Math.abs(tr.x - p.x) + Math.abs(tr.y - p.y)) > .1 ? 1 : 0;
      G.spr(FF.Assets.frame(set2, p.dir, G.time, p.moving ? 1 : 0), Math.round(tr.x * T - ox), Math.round(tr.y * T - oy) - 2 - bob, { alpha: .98 });
    }
    /* joueur / vaisseau */
    if (Wo.mode === 'ship') {
      G.spr(FF.Assets.ship, Math.round(p.x * T - ox) - 8, Math.round(p.y * T - oy) - 6, {});
      G.rect(Math.round(p.x * T - ox) - 4, Math.round(p.y * T - oy) + 16, 24, 2, 'rgba(255,255,255,.15)');
    } else {
      var hs = FF.Assets.hero[order[0] ? order[0].id : 'arno'] || FF.Assets.npc.vieux;
      G.spr(FF.Assets.frame(hs, p.dir, G.time, p.moving ? 1 : 0), Math.round(p.x * T - ox), Math.round(p.y * T - oy) - 2, {});
    }
    G.drawParts();
    /* bannière de lieu */
    if (Wo.placeT > 0) {
      var a = U.clamp(Wo.placeT, 0, 1);
      G.ctx.globalAlpha = a;
      G.win(G.W / 2 - 60, 6, 120, 16, { alpha: .8 });
      G.text(m.n, G.W / 2, 10, { align: 'center', color: '#ffe6a8' });
      G.ctx.globalAlpha = 1;
    }
    if (Wo.mode === 'ship') { G.text('DIRIGEABLE', 4, G.H - 12, { color: '#9fe8ff', shadow: '#000' }); }
  };
  Wo.placeT = 0;
})(this.FF = this.FF || {});
