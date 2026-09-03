/* ============================================================
   P — personnages : stats, niveaux d'emploi, sorts, équipement
   ============================================================ */
(function (FF) {
  'use strict';
  var U = FF.U, D = FF.D, S = FF.S;
  var P = FF.P = {};

  var HP_MUL = 1.5, MP_MUL = 1.35;

  P.make = function (id, opts) {
    var c = D.CAST[id] || {};
    var st = D.STARTERS[id] || { job: 'chev', lv: 1 };
    var m = {
      id: id, name: c.n || id, n: c.n || id, job: st.job, lv: st.lv,
      jlv: {}, job: st.job, hp: 1, mp: 1, exp: 0, dead: 0, status: {},
      equip: { weap: null, armor: null, helm: null, acc: null },
      bias: c.bias || {}, look: c.look || {}, xtra: c.xtra || {},
      note: ''
    };
    m.jlv[m.job] = st.lv;
    var eq = st.gear || [];
    eq.forEach(function (idg, i) {
      var it = D.IT[idg]; if (!it) return;
      S.add(idg, 1);
      var slot = it.k === 'weap' ? 'weap' : it.k;
      if (slot === 'armor' || slot === 'helm' || slot === 'acc') m.equip[slot] = idg;
    });
    m.lvMax = m.lv;
    recalc(m);
    m.hp = m.stats.pv; m.mp = m.stats.pm;
    if (opts && opts.lv) { m.lv = opts.lv; m.jlv[m.job] = opts.lv; recalc(m); m.hp = m.stats.pv; m.mp = m.stats.pm; }
    return m;
  };

  function statAt(m, i) {
    var j = D.JOBS[m.job] || D.JOBS.chev;
    var key = D.STATS[i];
    var b = j.base[i] || 0, g = j.grow[i] || 0;
    var bias = (m.bias[key] || 0);
    return Math.max(1, Math.round(b + g * (m.lv - 1) + bias * (m.lv - 1) * 0.34));
  }

  function recalc(m) {
    var j = D.JOBS[m.job] || D.JOBS.chev;
    var e = { for: 0, vit: 0, agi: 0, int: 0, esp: 0, pv: 0, pm: 0, atk: 0, def: 0, mdef: 0, eva: 0, crit: 0 };
    var parts = [];
    ['weap', 'armor', 'helm', 'acc'].forEach(function (sl) {
      var it = m.equip[sl] && D.IT[m.equip[sl]];
      if (it) parts.push(it);
    });
    parts.forEach(function (it) {
      if (it.sp) for (var k in it.sp) { if (k === 'all') continue; e[k] = (e[k] || 0) + it.sp[k]; }
      if (it.sp && it.sp.all) for (var k2 in e) if (D.STATS.indexOf(k2) >= 0) e[k2] += it.sp.all;
      if (it.def) e.def += it.def;
      if (it.mdef) e.mdef += it.mdef;
    });
    var st = {
      for: statAt(m, 0) + e.for, vit: statAt(m, 1) + e.vit, agi: statAt(m, 2) + e.agi,
      int: statAt(m, 3) + e.int, esp: statAt(m, 4) + e.esp
    };
    var pvBase = Math.round((j.pv[0] + j.pv[1] * (m.lv - 1) + (m.bias.pv || 0) * m.lv * 0.3 + e.pv) * HP_MUL);
    var pmBase = Math.round((j.pm[0] + j.pm[1] * (m.lv - 1) + (m.bias.pm || 0) * m.lv * 0.3 + e.pm) * MP_MUL);
    var wep = m.equip.weap && D.IT[m.equip.weap];
    var atk = Math.round(st.for * 1.35 + (wep ? wep.atk * 1.45 : 3) + m.lv * 0.5);
    if (wep && wep.two) atk = Math.round(atk * 1.15);
    var def = Math.round(st.vit * 0.55 + e.def * 1.15 + m.lv * 0.15);
    var mdef = Math.round(st.esp * 0.5 + e.mdef * 1.15 + m.lv * 0.12);
    var mag = Math.round(st.int * 1.0 + st.esp * 0.5 + m.lv * 0.4);
    var spd = Math.round(st.agi * 1.15 + m.lv * 0.25);
    var eva = U.clamp(Math.round(st.agi * 0.45 - e.def * 0.35 - (D.IT[m.equip.armor] && D.IT[m.equip.armor].type === 'heavy' ? 6 : 0)), 0, 32);
    var crit = U.clamp(Math.round(5 + st.agi * 0.16), 4, 26);
    if (wep && wep.two) eva -= 4;
    m.stats = {
      pv: pvBase, pm: pmBase, atk: atk, def: def, mdef: mdef, mag: mag, spd: spd,
      eva: U.clamp(eva, 0, 32), crit: crit, raw: st
    };
    /* résistances élémentaires & immunités via l'équipement */
    var res = {}, imm = {};
    parts.forEach(function (it) {
      if (it.res) for (var k in it.res) res[k] = (res[k] || 1) * it.res[k];
      if (it.imm) { if (it.imm === 'all') Object.keys(D.STATUS).forEach(function (s) { if (D.STATUS[s].bad) imm[s] = 1; }); else imm[it.imm] = 1; }
      if (it.reflect) m.reflectKit = it.reflect;
    });
    m.res = res; m.imm = imm;
    m.hp = Math.min(m.hp, pvBase); m.mp = Math.min(m.mp, pmBase);
    if (m.hp > pvBase) m.hp = pvBase;
    learn(m);
    abilities(m);
    return m.stats;
  }
  P.recalc = function (m) { return recalc(m); };

  /* --------- sorts appris selon le niveau d'emploi --------- */
  function learn(m) {
    var j = D.JOBS[m.job] || {};
    var out = m.learn = {};
    for (var kind in (j.learn || {})) {
      var tiers = D.TIER[kind]; if (!tiers) continue;
      for (var i = 0; i < tiers.length; i++) {
        var need = (j.learn[kind] && j.learn[kind][i]) || 0;
        if (!need) continue;
        var id = tiers[i];
        if (kind === 'summon' && S.summons && !S.summons[id]) continue;
        if (m.lv >= need) out[id] = 1;
      }
    }
    /* les sorts « offerts » par un événement (grimoires, boss) */
    (m.gifted || []).forEach(function (id) { out[id] = 1; });
    return out;
  }
  function abilities(m) {
    var j = D.JOBS[m.job] || {};
    var jl = m.jlv[m.job] || 1;
    var list = (j.ab || []).filter(function (a, i) { return i === 0 || jl >= 2 + i * 3; });
    m.abs = list.map(function (a) { var A = D.ABILITIES[a]; return A ? Object.assign({ id: a }, A) : null; }).filter(Boolean);
    if (m.job === 'summon' || m.job === 'sage') m.abs = m.abs.filter(function (a) { return a.id !== 'summon'; });
    return m.abs;
  }
  P.canEquip = function (m, it) {
    if (!it) return false;
    var j = D.JOBS[m.job]; if (!j) return false;
    var t = it.type || it.atype;
    if (it.k === 'weap') return j.eq.indexOf(it.type) >= 0;
    return j.eq.indexOf(t) >= 0 || j.eq.indexOf(it.k) >= 0;
  };
  P.equip = function (m, itemId) {
    var it = D.IT[itemId]; if (!it) return false;
    if (!P.canEquip(m, it)) return false;
    var slot = it.k === 'weap' ? 'weap' : (it.k === 'armor' ? 'armor' : (it.k === 'helm' ? 'helm' : 'acc'));
    var old = m.equip[slot];
    S.add(itemId, -1);
    if (old) S.add(old, 1);
    m.equip[slot] = itemId;
    recalc(m);
    return old;
  };
  P.unequip = function (m, slot) {
    var old = m.equip[slot]; if (!old) return false;
    m.equip[slot] = null; S.add(old, 1); recalc(m); return true;
  };
  P.changeJob = function (m, job) {
    if (!D.JOBS[job]) return false;
    m.prevJob = m.job; m.job = job;
    m.jlv[job] = Math.max(1, m.jlv[job] || Math.max(1, Math.floor(m.lv * 0.7)));
    /* l'équipement devenu interdit retourne à l'inventaire */
    ['weap', 'armor', 'helm', 'acc'].forEach(function (sl) {
      var it = m.equip[sl] && D.IT[m.equip[sl]];
      if (it && !P.canEquip(m, it)) { m.equip[sl] = null; S.add(m.equip[sl] || it.id, 1); }
    });
    recalc(m);
    return true;
  };
  P.jobLevelUp = function (m, n) {
    m.jlv[m.job] = (m.jlv[m.job] || 1) + (n || 1);
    recalc(m);
  };

  /* --------- expérience --------- */
  P.giveExp = function (m, amount) {
    var ups = [];
    m.exp += Math.max(0, Math.round(amount));
    while (m.lv < D.MAXLV && m.exp >= D.expFor(m.lv + 1)) {
      m.lv++;
      m.jlv[m.job] = (m.jlv[m.job] || 1) + 1;
      var before = m.stats ? { pv: m.stats.pv, pm: m.stats.pm } : { pv: 0, pm: 0 };
      recalc(m);
      m.hp = Math.min(m.stats.pv, m.hp + (m.stats.pv - before.pv) + Math.round(m.stats.pv * 0.12));
      m.mp = Math.min(m.stats.pm, m.mp + (m.stats.pm - before.pm) + Math.round(m.stats.pm * 0.12));
      if (!m.hp) m.hp = 1;
      ups.push({ lv: m.lv, pv: m.stats.pv - before.pv, pm: m.stats.pm - before.pm, learned: newSpells(m) });
    }
    if (m.lv >= D.MAXLV) m.exp = Math.min(m.exp, D.expFor(D.MAXLV));
    return ups;
  };
  function newSpells(m) {
    m._prevLearn = m._prevLearn || {};
    var out = [];
    for (var id in m.learn) if (!m._prevLearn[id]) out.push(id);
    m._prevLearn = U.copy(m.learn);
    return out;
  }

  /* --------- soins --------- */
  P.healFull = function (m) { recalc(m); m.hp = m.stats.pv; m.mp = m.stats.pm; m.dead = 0; m.status = {}; };
  P.healHalf = function (m) { m.hp = Math.min(m.stats.pv, m.hp + Math.ceil(m.stats.pv / 2)); m.mp = Math.min(m.stats.pm, m.mp + Math.ceil(m.stats.pm / 2)); };
  P.cureAll = function (m) { m.status = {}; if (m.dead && m.hp <= 0) { } };
  P.totalHP = function () { return S.party().reduce(function (a, m) { return a + (m ? m.stats.pv : 0); }, 0); };

  /* --------- objets consommables --------- */
  P.useItem = function (m, itemId, ctx) {
    var it = D.IT[itemId]; if (!it) return { ok: false };
    var r = { ok: true, txt: it.n, m: m };
    if (it.heal) {
      var amt = it.full ? m.stats.pv : (it.heal < 1 ? Math.round(m.stats.pv * it.heal) : it.heal);
      m.hp = Math.min(m.stats.pv, m.hp + amt); r.heal = amt;
    }
    if (it.mp) {
      var a2 = it.mp < 1 ? Math.round(m.stats.pm * it.mp) : it.mp;
      m.mp = Math.min(m.stats.pm, m.mp + a2); r.mp = a2;
    }
    if (it.revive) { if (m.hp <= 0) { m.hp = Math.max(1, Math.round(m.stats.pv * (it.revive < 1 ? it.revive : 1))); m.dead = 0; r.revive = 1; } m.status = {}; }
    if (it.cure) {
      if (it.cure === 1) { m.status = {}; r.cure = 1; }
      else if (m.status[it.cure]) { delete m.status[it.cure]; r.cure = it.cure; }
    }
    if (it.buff) { r.buff = it.buff; }
    if (!r.heal && !r.mp && !r.revive && !r.cure && !it.buff) r.nothing = 1;
    if (!ctx || !ctx.preview) S.remove(itemId, 1);
    recalc(m);
    return r;
  };

  /* --------- stuff de départ (nouvelle partie) --------- */
  P.newGame = function () {
    var st = S.fresh();
    for (var k in st) S[k] = st[k];
    S.ver = S.VERSION;
    ['arno', 'myrelle', 'sica'].forEach(function (id) {
      var m = P.make(id);
      S.members[id] = m;
      S.order.push(id);
    });
    S.gils = 250;
    ['potion', 'potion', 'potion', 'tent', 'phoenix'].forEach(function (i) { S.add(i, i === 'potion' ? 3 : 1); });
    S.add('antidote', 2);
    S.flags = {};
    S.jobs = {};
    S.settings.fx = detectFx();
    return S;
  };
  function detectFx() {
    try { return (window.devicePixelRatio || 1) > 2 ? 'auto' : 'none'; } catch (e) { return 'none'; }
  }
  P.autoBattle = function (m) { return m.auto; };

  /* description pour le menu statut */
  P.desc = function (m) {
    var j = D.JOBS[m.job];
    return j ? j.d : '';
  };
})(this.FF = this.FF || {});
