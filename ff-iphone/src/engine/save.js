/* ============================================================
   S — état du jeu + sauvegardes (localStorage, 3 emplacements + auto)
   ============================================================ */
(function (FF) {
  'use strict';
  var U = FF.U, D = FF.D;
  var S = FF.S = {};

  S.VERSION = 3;
  S.KEY = 'q4c.save.';

  S.fresh = function () {
    var st = {
      ver: S.VERSION, ch: 1, t0: Date.now(), play: 0, kills: 0, battles: 0, runs: 0, steps: 0,
      flags: {}, members: {}, order: [], reserve: [],
      inv: {}, gear: {}, keys: {}, gils: 250,
      loc: { map: 'aurelia', x: 12, y: 16, dir: 'down' },
      jobs: {}, summons: {}, ship: 0, seen: {}, treasure: {},
      settings: { encounters: 1, textSpeed: 1, shake: 1, scan: 1, vig: 1, padHidden: 0 }
    };
    return st;
  };
  S.DEFAULT_SETTINGS = { encounters: 1, textSpeed: 1, shake: 1, scan: 1, vig: 1, padHidden: 0 };

  /* l'état vit même avant la première partie (titres, config…) */
    var fresh0 = S.fresh();
  for (var k0 in fresh0) S[k0] = fresh0[k0];
  /* réinitialise aux défauts puis superpose les préférences persistées (q4c.settings) */
  S.loadSettings = function () {
    var base = S.DEFAULT_SETTINGS, out = {};
    for (var k in base) out[k] = base[k];
    var p = U.store.get('q4c.settings', null);
    if (p) for (var k2 in p) if (p[k2] != null) out[k2] = p[k2];
    S.settings = out;
  };
  S.saveSettings = function () { U.store.set('q4c.settings', S.settings); };
  S.has = function (k) { return U.store.get(S.KEY + k, null); };
  S.meta = function (k) {
    var o = U.store.get(S.KEY + k, null);
    if (!o) return null;
    return { lv: o.sumLv, gils: o.gils, ch: o.ch, map: o.mapName, play: o.play, names: o.names, party: o.partyLen, date: o.date, cleared: !!o.cleared };
  };
  S.save = function (k) {
    var o = S.export();
    o.date = Date.now();
    o.sumLv = S.order.reduce(function (a, id) { return a + (S.members[id] ? S.members[id].lv : 0); }, 0);
    o.mapName = (D.MAPS[S.loc.map] && D.MAPS[S.loc.map].n) || S.loc.map;
    o.names = S.order.map(function (id) { return S.members[id].name; });
    o.partyLen = S.order.length;
    /* partie terminée ? permet de proposer le New Game + (les crédits posent le flag 'ending') */
    o.cleared = !!(S.flags && S.flags.ending);
    return U.store.set(S.KEY + k, o);
  };
  S.export = function () {
    return {
      ver: S.ver || S.VERSION, ch: S.ch, play: S.play, kills: S.kills, battles: S.battles, runs: S.runs, steps: S.steps,
      flags: S.flags, gils: S.gils, loc: S.loc, jobs: S.jobs, summons: S.summons, ship: S.ship, seen: S.seen,
      treasure: S.treasure, settings: S.settings, keys: S.keys, inv: S.inv, gear: S.gear,
      members: JSON.parse(JSON.stringify(S.members)), order: S.order.slice(), reserve: S.reserve.slice()
    };
  };
  S.load = function (k) {
    var o = U.store.get(S.KEY + k, null);
    if (!o) { S.lastErr = null; return false; }
    if (o.ver && o.ver !== S.VERSION) { S.lastErr = 'ver'; return false; }
    S.lastErr = null;
    S.import(o);
    return true;
  };
  S.import = function (o) {
    ['ch', 'play', 'kills', 'battles', 'runs', 'steps', 'flags', 'gils', 'loc', 'jobs', 'summons', 'ship', 'seen', 'treasure', 'keys', 'inv', 'gear', 'settings', 'members', 'order', 'reserve']
      .forEach(function (kk) { if (o[kk] != null) S[kk] = o[kk]; });
    S.flags = S.flags || {}; S.inv = S.inv || {}; S.gear = S.gear || {}; S.keys = S.keys || {};
    /* comble les clés manquantes d'une ancienne sauvegarde avec les défauts */
    S.settings = S.settings || {};
    for (var kS in S.DEFAULT_SETTINGS) if (S.settings[kS] == null) S.settings[kS] = S.DEFAULT_SETTINGS[kS];
    if (FF.Game && FF.Game.onStateLoad) FF.Game.onStateLoad();
  };
  S.del = function (k) { U.store.del(S.KEY + k); };

  /* --------- inventaire --------- */
  S.add = function (id, n) {
    var it = D.IT[id]; if (!it) return;
    if (it.k === 'key') { S.keys[id] = (S.keys[id] || 0) + 1; return; }
    var slot = (it.k === 'weap' || it.k === 'armor' || it.k === 'helm' || it.k === 'acc') ? 'gear' : 'inv';
    S[slot][id] = (S[slot][id] || 0) + (n || 1);
  };
  S.remove = function (id, n) {
    var it = D.IT[id]; if (!it) return false;
    var slot = (it.k === 'weap' || it.k === 'armor' || it.k === 'helm' || it.k === 'acc') ? 'gear' : 'inv';
    if (it.k === 'key') { if (!S.keys[id]) return false; S.keys[id]--; if (S.keys[id] <= 0) delete S.keys[id]; return true; }
    if (!S[slot][id]) return false;
    S[slot][id] -= (n || 1);
    if (S[slot][id] <= 0) delete S[slot][id];
    return true;
  };
  S.count = function (id) {
    var it = D.IT[id]; if (!it) return 0;
    if (it.k === 'key') return S.keys[id] || 0;
    var slot = (it.k === 'weap' || it.k === 'armor' || it.k === 'helm' || it.k === 'acc') ? 'gear' : 'inv';
    return S[slot][id] || 0;
  };
  S.invList = function (kinds) {
    var out = [];
    kinds.forEach(function (kk) {
      var src = kk === 'gear' ? S.gear : kk === 'key' ? S.keys : S.inv;
      for (var id in src) {
        if (!src[id]) continue;
        var it = D.IT[id]; if (!it) continue;
        if (kk === 'inv' && (it.k === 'weap' || it.k === 'armor' || it.k === 'helm' || it.k === 'acc' || it.k === 'key')) continue;
        out.push({ id: id, n: it.n, c: src[id], it: it });
      }
    });
    out.sort(function (a, b) { return (a.it.price + a.it.atk + a.it.def * 3) < (b.it.price + b.it.atk + b.it.def * 3) ? -1 : 1; });
    return out;
  };
  S.gil = function (n) { S.gils = U.clamp(S.gils + n, 0, 999999); };

  /* --------- drapeaux --------- */
  S.f = function (k) { return !!S.flags[k]; };
  S.set = function (k, v) { S.flags[k] = v === undefined ? 1 : v; };
  S.chapter = function () { return S.ch; };

  /* --------- personnages --------- */
  S.member = function (id) { return S.members[id]; };
  S.alive = function () { return S.order.map(function (id) { return S.members[id]; }).filter(function (m) { return m && m.hp > 0; }); };
  S.anyAlive = function () { return S.alive().length > 0; };
  S.party = function () { return S.order.map(function (id) { return S.members[id]; }); };
  S.allMembers = function () { return S.order.concat(S.reserve).map(function (id) { return S.members[id]; }); };
  S.addMember = function (m, active) {
    S.members[m.id] = m;
    if (active) { if (S.order.indexOf(m.id) < 0 && S.order.length < 4) S.order.push(m.id); else S.reserve.push(m.id); }
    else if (S.reserve.indexOf(m.id) < 0 && S.order.indexOf(m.id) < 0) S.reserve.push(m.id);
  };
  S.join = function (id, toReserve) {
    var r = S.reserve.indexOf(id); if (r >= 0) S.reserve.splice(r, 1);
    var o = S.order.indexOf(id); if (o >= 0) return;
    if (!toReserve && S.order.length < 4) S.order.push(id); else S.reserve.push(id);
  };
  S.leave = function (id) {
    var o = S.order.indexOf(id); if (o >= 0) S.order.splice(o, 1);
    var r = S.reserve.indexOf(id); if (r >= 0) S.reserve.splice(r, 1);
    while (S.order.length < 4 && S.reserve.length) S.order.push(S.reserve.shift());
  };
  S.jobUnlocked = function (j) { return j === 'chev' || j === 'white' || j === 'thief' || j === 'monk' || j === 'bard' || !!S.jobs[j]; };
  S.summonOwned = function (s) { return !!S.summons[s]; };
  S.playTick = function (dt) { S.play += dt; };
  S.timeStr = function (t) {
    t = Math.floor(t == null ? S.play : t);
    var h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60;
    return U.pad(h, 2, 0) + ':' + U.pad(m, 2, 0) + ':' + U.pad(s, 2, 0);
  };
})(this.FF = this.FF || {});
