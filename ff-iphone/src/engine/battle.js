/* ============================================================
   Bat — combats au tour par tour avec jauge ATB (demi-active)
   ============================================================ */
(function (FF) {
  'use strict';
  var U = FF.U, D = FF.D, S = FF.S, G = FF.Gfx;
  var B = FF.Bat = {};

  var W = G.W, H = G.H;
  B.st = null;

  /* ---------------- utilitaires ---------------- */
  function foePos(i, n) {
    var base = n > 3 ? [146, 176, 204, 130, 218] : [158, 192, 214, 134];
    var row = n > 3 ? [2, 0, 3, 1, 4] : [1, 0, 2, 3];
    return { x: U.clamp(base[row[i % base.length]] + (i % 2) * 6, 108, 214), y: 44 + row[i % row.length] * 8 + (i % 3) * 4 };
  }
  function allyPos(i) { return { x: 20 + (i % 2) * 20, y: 52 + Math.floor(i / 2) * 22 }; }

  function mk(m, i) {
    return {
      side: 'ally', ref: m, id: m.id, name: m.name, lv: m.lv, job: m.job,
      hp: m.hp, mp: m.mp, max: m.stats.pv, maxmp: m.stats.pm,
      atk: m.stats.atk, def: m.stats.def, mdef: m.stats.mdef, mag: m.stats.mag, spd: m.stats.spd,
      eva: m.stats.eva, crit: m.stats.crit, res: m.res, imm: m.imm,
      status: {}, atb: 0, buffs: {}, row: m.row || 'front', dead: m.hp <= 0,
      spr: FF.Assets.hero[m.id], back: FF.Assets.back[m.id], x: 0, y: 0, flash: 0, shake: 0, dx: 0, dy: 0, guard: 0, hide: 0, jump: 0,
      look: m.look || {}, doom: 0, reflectT: 0, invul: 0, taunt: 0
    };
  }
  function mkFoe(mon, i, opts) {
    opts = opts || {};
    var sc = mon.scale || 2;
    var art = FF.Assets.enemy[mon.art + '#' + (mon.skin || 0)];
    return {
      side: 'foe', mon: mon, id: mon.id + '#' + i, name: mon.n, lv: mon.lv, boss: mon.boss,
      hp: opts.hp || mon.hp, mp: mon.mp, max: mon.hp, maxmp: mon.mp,
      atk: mon.atk, def: mon.def, mdef: mon.mdef, mag: mon.mag, spd: mon.spd,
      eva: Math.min(28, 2 + mon.lv * 0.35), crit: 4, res: mon.res || {}, imm: mon.imm || {},
      status: {}, atb: 0, buffs: {}, row: mon.back ? 'back' : 'front', dead: false,
      spr: art, x: 0, y: 0, flash: 0, shake: 0, dx: 0, dy: 0, scale: sc, guard: 0, dieT: 0,
      phase: 0, ai: mon.ai, counterT: 0, hp0: mon.hp
    };
  }

  /* ---------------- démarrage ---------------- */
  B.start = function (opts) {
    var foes = (opts.foes || []).map(function (id, i) { return mkFoe(D.MON[id] || D.MON['limule'], i); });
    var allies = S.order.map(function (id) { return S.members[id]; }).filter(Boolean).map(mk);
    if (opts.pre) opts.pre.forEach(function (p) { });
    var st = B.st = {
      foes: foes, allies: allies, order: [], mode: 'intro', t: 0, tl: [], tlc: 0,
      cmd: null, target: 0, cursor: 0, sub: null, subIdx: 0, pending: null,
      cmds: ['atk', 'mag', 'tea', 'it', 'def', 'run'],
      bg: opts.bg || (S.loc && S.loc.bg) || 'field', music: opts.music || (foes[0] && foes[0].boss ? 'boss' : 'battle'),
      winCb: opts.onWin || null, loseCb: opts.onLose || null, noFlee: opts.noFlee || (foes[0] && foes[0].mon.noFlee),
      back: opts.back, result: null, ended: false, introT: 0, turns: 0, firstTime: 1,
      bossName: opts.bossName || (foes[0] && foes[0].boss ? foes[0].name : null),
      noExp: opts.noExp, script: opts.script || null, autoT: 0, ended2: 0,
      treasure: opts.treasure || null
    };
    st.allies.forEach(function (a, i) { var p = allyPos(i); a.x = p.x; a.y = p.y; });
    st.foes.forEach(function (f, i) { var p = foePos(i, st.foes.length); f.x = p.x; f.y = p.y; });
    /* tour initial : l'agilité décide */
    st.allies.concat(st.foes).forEach(function (c) { c.atb = 60 + Math.random() * 30 + c.spd * 0.4; });
    G.fx.fade = 1; G.fadeTo(0, 3.2);
    FF.Snd.playMusic(st.music);
    if (st.bossName && st.foes[0].mon.intro) { st.mode = 'say'; st.say = st.foes[0].mon.intro; st.sayT = 0; }
    else if (st.foes[0].mon.intro && st.foes[0].boss) { st.mode = 'say'; st.say = st.foes[0].mon.intro; st.sayT = 0; }
    S.battles = (S.battles || 0) + 1;
    return st;
  };

  /* ---------------- timeline d'animation ---------------- */
  function at(st, t, fn) { st.tl.push({ t: t, f: fn }); }
  function push(st, delay, fn) { at(st, st.t + delay, fn); }
  function busy(st) { return st.tl.length > 0; }

  /* ---------------- calculs ---------------- */
  function buffVal(c, k) { var b = c.buffs[k]; return b ? b.v : 0; }
  function atkOf(c) { return Math.max(1, Math.round(c.atk * (1 + buffVal(c, 'atk')))); }
  function defOf(c) { var g = c.guard ? .5 : 0; return Math.max(0, Math.round(c.def * (1 + buffVal(c, 'def')) * (1 - g))); }
  function mdefOf(c) { var g = c.guard ? .5 : 0; return Math.max(0, Math.round(c.mdef * (1 + buffVal(c, 'mdef')) * (1 - g))); }
  function spdOf(c) { var h = c.buffs.haste ? 1.55 : 1, s = c.buffs.slow ? .6 : 1; return Math.max(3, Math.round(c.spd * h * s)); }
  function elemMult(c, elem) {
    if (!elem || elem === 'phys') return 1;
    var r = c.res && c.res[elem];
    if (r === 0) return 0;
    return r != null ? r : 1;
  }
  function isDead(c) { return c.dead || c.hp <= 0; }
  function living(st, side) { return st[side].filter(function (c) { return !isDead(c) && !c.hide; }); }
  function rowMod(c, att) {
    if (c.row === 'back' && att === 'phys') return .68;
    if (c.row === 'back' && att === 'magic') return .92;
    return 1;
  }

  B.physDamage = function (att, def, mult, opts) {
    opts = opts || {};
    if (att.phys === 0) return 0;
    var base = atkOf(att) * (mult || 1) * 1.95 - defOf(def) * 0.92;
    base *= rowMod(def, 'phys') * (opts.pierce ? 1.3 : 1);
    var e = elemMult(def, opts.elem || (att.weap && att.weap.elem) || null);
    base *= e;
    if (e === 0) return 0;
    base *= 0.88 + Math.random() * 0.24;
    var crit = Math.random() * 100 < (att.crit + buffVal(att, 'crit'));
    if (crit) base *= 1.85;
    if (def.status.defend) base *= .45;
    if (def.buffs.shield) base *= .55;
    return { dmg: Math.max(1, Math.round(base)), crit: crit, elem: e };
  };
  B.magicDamage = function (att, def, pow, opts) {
    opts = opts || {};
    var mag = att.mag + (opts.magAdd || 0);
    var base = pow * (0.52 + mag / 118) * (opts.mult || 1);
    base -= mdefOf(def) * (opts.pierce ? 0.15 : 0.5);
    base *= rowMod(def, 'magic');
    var e = elemMult(def, opts.elem);
    if (e === 0) return { dmg: 0, elem: 0, absorb: 1 };
    base *= e;
    base *= 0.92 + Math.random() * 0.16;
    if (def.buffs.shield) base *= .6;
    return { dmg: Math.max(1, Math.round(base)), elem: e };
  };

  /* ---------------- statuts ---------------- */
  function canAct(c) {
    if (isDead(c)) return false;
    if (c.status.stop) return false;
    if (c.status.sleep && Math.random() > .25) return false;
    if (c.status.paralyze && Math.random() < .3) return false;
    return true;
  }
  function setStatus(st, c, s, p, dur) {
    if (!s || !D.STATUS[s]) return false;
    if (Math.random() > (p == null ? 1 : p)) return false;
    if (c.imm && c.imm[s]) return false;
    if (c.status[s]) return false;
    if (D.STATUS[s].bad && c.buffs.immune) return false;
    c.status[s] = 1;
    if (dur) c.status[s] = dur;
    B.msg(st, c.name + ' : ' + D.STATUS[s].n + ' !', D.STATUS[s].c);
    if (s === 'stone') { c.hide = 1; }
    return true;
  }
  function cureStatus(c, s) {
    if (s === 1) { c.status = {}; return true; }
    if (c.status[s]) { delete c.status[s]; return true; }
    return false;
  }

  /* ---------------- textes flottants ---------------- */
  function dmgText(st, c, n, kind, col) {
    c.dmg = { v: (n === null ? kind : n), t: 0, kind: kind, col: col };
    if (n != null && typeof n === 'number') {
      c.flash = kind === 'heal' ? 0 : .32;
      if (c.flash) G.fx.shake(1.5, .16);
    }
  }

  /* ---------------- actions ---------------- */
  function targetsFor(st, c, spec) {
    var all = [];
    if (spec === 'foes') all = living(st, c.side === 'foe' ? 'allies' : 'foes');
    else if (spec === 'ally') all = living(st, c.side);
    else if (spec === 'allies') all = living(st, c.side);
    else if (spec === 'self') all = [c];
    else if (spec === 'foe') all = living(st, c.side === 'foe' ? 'allies' : 'foes');
    else if (spec === 'dead') all = st[c.side === 'foe' ? 'foes' : 'allies'].filter(isDead);
    else all = living(st, c.side === 'foe' ? 'allies' : 'foes');
    if (!all.length) all = living(st, c.side === 'foe' ? 'allies' : 'foes');
    return all;
  }
  function pickOne(list) { return list.length ? list[U.rand(list.length)] : null; }

  B.actAttack = function (st, c, tgt, opts) {
    opts = opts || {};
    var hits = opts.hits || 1, i;
    if (c.side === 'ally' && c.buffs && c.buffs.aim) hits += 1;
    var mult = opts.pow || 1;
    for (i = 0; i < hits; i++) {
      (function (hit) {
        push(st, 0.34 + hit * 0.28, function () {
          var t = tgt && !isDead(tgt) ? tgt : pickOne(living(st, c.side === 'foe' ? 'allies' : 'foes'));
          if (!t) return;
          if (Math.random() * 100 < t.eva && !opts.pierce && !t.status.stone) { dmgText(st, t, null, 'RATÉ', '#cfd8e6'); FF.Snd.play('miss'); return; }
          var r = B.physDamage(c, t, mult, { elem: opts.elem, pierce: opts.pierce, weap: opts.weap });
          if (!r || !r.dmg) { dmgText(st, t, null, 'AUCUN EFFET', '#9fb3ff'); return; }
          t.hp -= r.dmg;
          dmgText(st, t, r.dmg, 'dmg', r.crit ? '#ffe066' : '#ffffff');
          if (r.crit) B.msg(st, 'COUP CRITIQUE !', '#ffe066');
          FF.Snd.play(opts.snd || 'hit');
          if (S.settings.shake !== 0) G.fx.shake(c.side === 'ally' ? 1 : 2, .18);
          G.burst(t.x + 6, t.y + 6, 8, { c: '#fff', c2: r.crit ? '#ffe066' : '#ffb06a', sp: 60, life: .35, g: 120 });
          t.shake = 1;
          if (opts.st) setStatus(st, t, opts.st, opts.p);
          if (t.hp <= 0) kill(st, t, c);
          /* riposte / contre */
          if (t.mon && t.mon.counters) checkCounter(st, t, c, 'phys');
        });
      })(i);
    }
    push(st, 0.3 + hits * 0.28, function () { c.dx = 0; c.dy = 0; });
    push(st, 0.05, function () { c.dx = c.side === 'ally' ? 12 : -12; FF.Snd.play('slash'); });
  };
  function checkCounter(st, t, c, kind) {
    var cs = t.mon.counters || [];
    cs.forEach(function (cn) {
      if ((cn.if === kind || cn.if === 'any') && Math.random() < cn.p) {
        B.msg(st, t.name + ' riposte !', '#ffb0d0');
        doAct(st, t, { kind: 'sp', id: cn.a.id, sp: D.SP[cn.a.id] }, c);
      }
    });
  }
  function kill(st, c, by) {
    if (c.dead) return;
    c.dead = true; c.hp = 0;
    c.dieT = 0.001;
    FF.Snd.play('death');
    if (c.side === 'foe') { S.kills++; }
  }

  B.actSpell = function (st, c, sp, id, tgt) {
    var list = targetsFor(st, c, sp.tgt === 'foes' ? 'foes' : sp.tgt === 'allies' ? 'allies' : sp.tgt === 'self' ? 'self' : (sp.tgt === 'dead' ? 'dead' : 'foe'));
    if (tgt && (sp.tgt === 'foe' || sp.tgt === 'ally' || sp.tgt === 'dead')) list = [tgt];
    if (sp.tgt === 'foes' || sp.tgt === 'allies') list = targetsFor(st, c, sp.tgt);
    if (!list.length) { B.msg(st, 'Aucune cible.', '#c9d6e6'); return; }
    var isHeal = sp.kind === 'white' && (sp.heal || (sp.pow > 0 && sp.tgt !== 'foe' && sp.tgt !== 'foes' && !sp.dmg && !sp.st && !sp.shield && !sp.buff && !sp.cure && !sp.revive && !sp.regen && !sp.immunity && !sp.holy));
    var cost = sp.cost || 0;
    if (c.mp < cost) { B.msg(st, 'Plus assez de PM !', '#ff8a8a'); return; }
    c.mp -= cost;
    var kind = sp.elem || 'holy';
    push(st, 0.28, function () {
      FF.Snd.play(sp.kind === 'summon' ? 'thunder' : 'magic');
      var col = (D.ELEM[sp.elem] || {}).c || '#c9a0ff';
      st.castFx = { c: col, t: 0, big: sp.pow > 300 || sp.kind === 'summon', kind: sp.kind, name: sp.n };
      G.fx.flash(.18, col);
    });
    list.forEach(function (t, i) {
      push(st, 0.62 + i * 0.09, function () {
        if (sp.dualDone) { }
        applySpell(st, c, sp, t, isHeal);
      });
    });
    push(st, 1.05 + list.length * .1, function () { st.castFx = null; });
    /* contre magique des boss */
    if (st.foes) st.foes.forEach(function (f) { if (!isDead(f) && f.mon.counters && sp.kind !== 'phys') checkCounter(st, f, c, 'magic'); });
  };

  function applySpell(st, c, sp, t, isHeal) {
    if (sp.heal || isHeal) {
      var amt = sp.pow ? Math.round(sp.pow * (0.6 + (c.mag || 0) / 115)) : 30;
      if (sp.healp) amt = Math.round(t.max * sp.healp);
      t.hp = Math.min(t.max, t.hp + amt);
      if (t.hp > 0) t.dead = false;
      dmgText(st, t, amt, 'heal', '#9fff9f');
      FF.Snd.play('heal');
    }
    if (sp.cure) { if (cureStatus(t, sp.cure)) { B.msg(st, t.name + ' est soigné.', '#9fff9f'); } }
    if (sp.buff) {
      t.buffs[sp.buff.stat] = { v: sp.buff.v, dur: sp.buff.dur };
      dmgText(st, t, null, D.STATUS[sp.buff.stat === 'atk' ? 'might' : 'shield'] ? D.STATUS[sp.buff.stat === 'atk' ? 'might' : 'shield'].n : 'BOOST', '#a6ffbf');
      FF.Snd.play('revive');
    }
    if (sp.debuff) { t.buffs[sp.debuff.stat] = { v: sp.debuff.v, dur: sp.debuff.dur }; }
    if (sp.shield) { t.buffs.shield = { v: .5, dur: 8 }; dmgText(st, t, null, 'GARDE', '#ffd257'); }
    if (sp.immunity) { t.buffs.immune = sp.immunity; dmgText(st, t, null, 'VOILE', '#8fe8ff'); }
    if (sp.regen) { t.buffs.regen = sp.regen; }
    if (sp.reflect) { t.buffs.reflect = sp.reflect; }
    if (sp.holy) {
      st.foes.forEach(function (f) { if (!isDead(f)) { var d = B.magicDamage(c, f, 90, { elem: 'holy' }); if (d.dmg) { f.hp -= d.dmg; dmgText(st, f, f.dmg, 'dmg'); } } });
    }
    if (sp.atb) { /* vitesse */ }
    if (sp.atbdown) { st.foes.forEach(function (f) { if (!isDead(f)) f.atb = 0; }); B.msg(st, 'Le temps des ennemis se fige !', '#c9a0ff'); }
    if (sp.revive) {
      if (t.dead || t.hp <= 0) { t.hp = Math.max(1, Math.round(t.max * (sp.revive < 1 ? sp.revive : 1))); t.dead = false; t.hide = 0; t.status = {}; dmgText(st, t, t.hp, 'heal', '#ffe066'); FF.Snd.play('revive'); }
      else dmgText(st, t, null, 'INUTILE', '#cfd8e6');
    }
    if (sp.st) { setStatus(st, t, sp.st, sp.p == null ? .8 : sp.p); }
    if (sp.drain) {
      var d0 = B.magicDamage(c, t, sp.pow, { elem: sp.elem || 'dark' });
      if (d0.dmg) { t.hp -= d0.dmg; c.hp = Math.min(c.max, c.hp + Math.round(d0.dmg * .6)); dmgText(st, t, d0.dmg, 'dmg', '#c9a0ff'); dmgText(st, c, Math.round(d0.dmg * .6), 'heal', '#9fff9f'); if (t.hp <= 0) kill(st, t, c); }
    }
    if (sp.insta) {
      if (t.imm && (t.imm.stone || t.mon && t.mon.imm && t.mon.imm.doom)) { dmgText(st, t, null, 'RÉSISTE', '#cfd8e6'); }
      else if (Math.random() < (sp.p || .5) && !t.boss) { t.hp = 0; kill(st, t, c); dmgText(st, t, null, 'MORT', '#ff6a6a'); }
      else if (t.boss && Math.random() < (sp.p || .5) * .25) { t.hp = Math.max(1, Math.round(t.hp * .15)); dmgText(st, t, Math.round(t.hp), 'dmg', '#ff6a6a'); }
      else dmgText(st, t, null, 'RATÉ', '#cfd8e6');
    }
    if (sp.grav) { var g0 = Math.max(1, Math.round(t.hp * sp.grav)); t.hp -= g0; dmgText(st, t, g0, 'dmg', '#c9a0ff'); if (t.hp <= 0) kill(st, t, c); }
    if (sp.flares) {
      st.foes.concat(st.allies).forEach(function (f) {
        if (f === c || isDead(f)) return;
        if (f.side === c.side) return;
        var d = Math.max(1, sp.dmgPer + U.rand(40));
        if (f.buffs && f.buffs.shield) d = Math.round(d * .4);
        f.hp -= d; dmgText(st, f, d, 'dmg', '#ff8ad0');
        if (f.hp <= 0) kill(st, f, c);
      });
      G.fx.shake(3, .4);
    }
    if (sp.dmg) {
      var dd = B.magicDamage(c, t, sp.pow || sp.dmg.pow, { elem: sp.dmg.elem || sp.elem });
      if (dd.absorb) { dmgText(st, t, null, 'ABSORBÉ', '#9fff9f'); t.hp = Math.min(t.max, t.hp + Math.round((sp.pow || 40) * .4)); }
      else {
        t.hp -= dd.dmg;
        dmgText(st, t, dd.dmg, 'dmg', (D.ELEM[sp.elem] || {}).c || '#fff');
        if (dd.elem > 1) B.msg(st, 'FAIBLESSE !', '#ffe066');
        if (t.hp <= 0) kill(st, t, c);
      }
      FF.Snd.play(sp.elem === 'ice' ? 'ice' : sp.elem === 'lit' ? 'thunder' : sp.elem === 'fire' ? 'fire' : 'hit');
      G.fx.shake(sp.pow > 300 ? 2.4 : 1.2, .2);
    }
    if (sp.elems) {
      var el = U.pick(sp.elems);
      var d3 = B.magicDamage(c, t, sp.pow, { elem: el });
      t.hp -= d3.dmg; dmgText(st, t, d3.dmg, 'dmg', (D.ELEM[el] || {}).c);
      if (t.hp <= 0) kill(st, t, c);
      FF.Snd.play('magic');
    }
  }

  B.actAbility = function (st, c, ab, tgt) {
    var cost = ab.cost || 0;
    if (c.mp < cost) { B.msg(st, 'Plus assez de PM !', '#ff8a8a'); return false; }
    c.mp -= cost;
    var kind = ab.kind;
    if (kind === 'phys') {
      B.actAttack(st, c, tgt, { pow: ab.pow, hits: ab.hits, elem: ab.elem, st: ab.st, p: ab.p, pierce: ab.pierce, snd: ab.hits > 1 ? 'slash' : 'hit' });
    } else if (kind === 'magic') {
      var sp = { pow: Math.round(30 + (ab.pow || 1) * 120), elem: ab.elem, tgt: ab.tgt, st: ab.st, p: ab.p, kind: 'ability' };
      var list = ab.tgt === 'foes' ? living(st, c.side === 'foe' ? 'allies' : 'foes') : (tgt ? [tgt] : living(st, c.side === 'foe' ? 'allies' : 'foes'));
      push(st, .3, function () { FF.Snd.play('magic'); G.fx.flash(.16, (D.ELEM[ab.elem] || {}).c || '#fff'); });
      list.forEach(function (t, i) {
        push(st, .45 + i * .1, function () {
          var d = B.magicDamage(c, t, sp.pow, { elem: ab.elem });
          if (!d.dmg) { dmgText(st, t, null, 'RATÉ', '#cfd8e6'); return; }
          t.hp -= d.dmg; dmgText(st, t, d.dmg, 'dmg', (D.ELEM[ab.elem] || {}).c || '#fff');
          if (sp.st) setStatus(st, t, sp.st, sp.p);
          if (t.hp <= 0) kill(st, t, c);
        });
      });
    } else if (kind === 'heal') {
      push(st, .35, function () {
        var v = Math.round(c.max * (ab.pow || .4));
        c.hp = Math.min(c.max, c.hp + v); dmgText(st, c, v, 'heal', '#9fff9f'); FF.Snd.play('heal');
      });
    } else if (kind === 'buff' || kind === 'debuff') {
      var list2 = ab.tgt === 'ally' ? living(st, c.side) : ab.tgt === 'allies' ? living(st, c.side) : ab.tgt === 'foes' ? living(st, c.side === 'foe' ? 'allies' : 'foes') : (tgt ? [tgt] : living(st, c.side === 'foe' ? 'allies' : 'foes'));
      push(st, .3, function () { FF.Snd.play('revive'); });
      list2.forEach(function (t, i) {
        push(st, .4 + i * .07, function () {
          t.buffs[ab.stat] = { v: ab.v, dur: ab.dur || 6 };
          dmgText(st, t, null, (D.STATUS[ab.stat === 'atk' ? 'might' : ab.stat === 'def' ? 'shield' : 'defend'] || { n: 'EFFET' }).n, ab.v > 0 ? '#a6ffbf' : '#ff9a9a');
        });
      });
    } else if (kind === 'st') {
      push(st, .3, function () { if (tgt) setStatus(st, tgt, ab.st || ab.inf, ab.p); else c.buffs.taunt = { v: 1, dur: ab.dur }; });
      if (ab.inf === 'taunt') push(st, .35, function () { c.taunt = 1; dmgText(st, c, null, 'PROVOCATION', '#ffd257'); });
    } else if (kind === 'mp') {
      push(st, .4, function () {
        var v = Math.min(c.maxmp - c.mp, Math.round((ab.v === 2 ? 26 : 9) + c.lv * .8));
        c.mp = Math.min(c.maxmp, c.mp + v); dmgText(st, c, v, 'mp', '#8fb3ff'); FF.Snd.play('heal');
      });
    } else if (kind === 'steal') {
      push(st, .4, function () {
        var t = tgt || pickOne(living(st, c.side === 'foe' ? 'allies' : 'foes'));
        if (!t || !t.mon || !t.mon.steal) { dmgText(st, t || c, null, 'RIEN À VOLER', '#cfd8e6'); FF.Snd.play('fail'); return; }
        var p = U.clamp(.35 + (c.stats ? c.stats.raw.agi : 12) * .012 - t.mon.lv * .006, .12, .85);
        if (Math.random() < p) { S.add(t.mon.steal.it, 1); B.msg(st, c.name + ' vole ' + (D.IT[t.mon.steal.it] || { n: 'quelque chose' }).n + ' !', '#ffd257'); FF.Snd.play('gil'); t.mon = U.copy(t.mon); t.mon.steal = null; }
        else { FF.Snd.play('fail'); dmgText(st, t, null, 'RATÉ', '#cfd8e6'); }
      });
    } else if (kind === 'drain') {
      push(st, .4, function () {
        var t = tgt || pickOne(living(st, c.side === 'foe' ? 'allies' : 'foes'));
        if (!t) return;
        var d = B.magicDamage(c, t, 110, { elem: 'dark' });
        t.hp -= d.dmg; c.hp = Math.min(c.max, c.hp + Math.round(d.dmg * .55));
        dmgText(st, t, d.dmg, 'dmg', '#c9a0ff'); dmgText(st, c, Math.round(d.dmg * .55), 'heal', '#9fff9f');
        FF.Snd.play('magic');
        if (t.hp <= 0) kill(st, t, c);
      });
    } else if (kind === 'jump') {
      push(st, .25, function () { c.hide = 1; c.jump = 1; FF.Snd.play('flee'); B.msg(st, c.name + ' saute très haut…', '#cfd8e6'); });
      c.pendingJump = { tgt: tgt };
      c.atb = 100; /* reviendra au prochain tour */
    } else if (kind === 'song') {
      push(st, .3, function () {
        if (ab.song === 'hero') {
          living(st, c.side).forEach(function (t) { t.buffs.atk = { v: .35, dur: 12 }; t.buffs.def = { v: .2, dur: 12 }; dmgText(st, t, null, 'HÉROS', '#ffd257'); });
          FF.Snd.play('revive');
        } else {
          living(st, c.side === 'foe' ? 'allies' : 'foes').forEach(function (t) { setStatus(st, t, 'sleep', .6); t.buffs.slow = { v: 1, dur: 10 }; });
          FF.Snd.play('ice');
        }
      });
    } else if (kind === 'summon') {
      var pool = D.SPLIST.summon.filter(function (s) { return S.summons[s] && c.learn[s]; });
      if (!pool.length) { B.msg(st, 'Aucun esprit lié.', '#c9d6e6'); return false; }
      var id = ab.pick || U.pick(pool);
      B.actSpell(st, c, Object.assign({}, D.SP[id], { tgt: 'foes', cost: 0 }), null, null);
    } else if (kind === 'dual') {
      var pool2 = Object.keys(c.learn || {}).filter(function (k) { return (D.SP[k] || {}).kind === 'red'; });
      if (!pool2.length) { B.msg(st, 'Aucun sort rouge.', '#c9d6e6'); return false; }
      var picks = [];
      for (var q = 0; q < 2; q++) picks.push(U.pick(pool2));
      picks.forEach(function (pid, i) {
        push(st, .1 + i * .5, function () { B.actSpell(st, c, D.SP[pid], null, tgt); });
      });
    }
    if (ab.st && kind !== 'st' && kind !== 'magic') { }
    return true;
  };

  function doAct(st, c, act, tgt) {
    if (act.kind === 'sp' || act.sp) {
      var sp = act.sp || D.SP[act.id];
      if (sp) B.actSpell(st, c, sp, act.id, tgt);
      else if (D.SP[act.id]) B.actSpell(st, c, D.SP[act.id], act.id, tgt);
      else B.actAttack(st, c, tgt);
    } else if (act.kind === 'ab' || act.ab) {
      var ab = D.ABILITIES[act.id] || act.ab;
      if (ab) B.actAbility(st, c, ab, tgt);
    } else if (act.kind === 'item') {
      useItemInBattle(st, c, act.item, tgt);
    } else B.actAttack(st, c, tgt);
  }

  function useItemInBattle(st, c, id, tgt) {
    var it = D.IT[id];
    if (!it) return;
    if (it.heal || it.cure || it.revive || it.mp || it.buff) {
      var list = it.all ? living(st, c.side) : (tgt ? [tgt] : [c]);
      list.forEach(function (t, i) {
        push(st, .3 + i * .1, function () {
          var m = t.ref || t;
          var r = FF.P.useItem(m, id, { preview: true });   /* objet déjà retiré par doPlayer */
          if (r.revive) { t.dead = false; t.hide = 0; t.hp = m.hp; t.hp = m.hp; }
          if (r.heal) { t.hp = m.hp; dmgText(st, t, r.heal, 'heal', '#9fff9f'); FF.Snd.play('heal'); }
          else if (r.mp) { t.mp = m.mp; dmgText(st, t, r.mp, 'mp', '#8fb3ff'); }
          else if (r.cure) { t.status = m.status; dmgText(st, t, null, 'SOIGNÉ', '#9fff9f'); }
          else dmgText(st, t, null, 'INUTILE', '#cfd8e6');
        });
      });
    } else if (it.dmg) {
      var foes = it.tgt === 'foes' ? living(st, c.side === 'foe' ? 'allies' : 'foes') : [tgt || pickOne(living(st, c.side === 'foe' ? 'allies' : 'foes'))];
      foes.forEach(function (t, i) {
        push(st, .35 + i * .1, function () {
          if (!t) return;
          var d = Math.max(1, Math.round((140 + c.lv * 9) * it.dmg * elemMult(t, it.elem)));
          t.hp -= d; dmgText(st, t, d, 'dmg', (D.ELEM[it.elem] || {}).c || '#ff9a3d');
          FF.Snd.play('fire'); G.fx.shake(1.4, .2);
          if (t.hp <= 0) kill(st, t, c);
        });
      });
    }
  }

  /* ---------------- messages ---------------- */
  B.msg = function (st, txt, col) {
    st.log = st.log || [];
    st.log.unshift({ t: txt, c: col || '#eef3ff', life: 2.6 });
    if (st.log.length > 3) st.log.pop();
  };

  /* ---------------- IA ennemie ---------------- */
  function aiChoose(st, c) {
    var mon = c.mon, acts = mon.acts.slice();
    /* phases de boss */
    var fr = c.hp / c.max;
    acts = acts.filter(function (a) { return !a.hp || fr <= a.hp; });
    if (!acts.length) acts = [{ a: 'atk' }];
    if (mon.ai === 'lache' && mon.fleeAt && fr < mon.fleeAt && Math.random() < .5) return { kind: 'flee' };
    if (mon.ai === 'sage' && c.mp < 8) acts = [{ a: 'atk', w: 1 }];
    var tot = acts.reduce(function (s, a) { return s + (a.w || 1); }, 0), r = Math.random() * tot, acc = 0, sel = acts[0];
    for (var i = 0; i < acts.length; i++) { acc += (acts[i].w || 1); if (r <= acc) { sel = acts[i]; break; } }
    if (sel.a === 'atk') return { kind: 'atk' };
    if (sel.a === 'sp') return { kind: 'sp', id: sel.id, sp: D.SP[sel.id] };
    if (sel.a === 'ab') return { kind: 'ab', id: sel.id };
    if (sel.a === 'split') return { kind: 'split' };
    if (sel.a === 'reflect') return { kind: 'ab', id: 'guard' };
    return { kind: 'atk' };
  }
  function foeAct(st, c) {
    if (!canAct(c)) { endTurn(st, c); return; }
    if (c.status.confuse) { B.actAttack(st, c, pickOne(living(st, 'foes'))); endTurn(st, c); return; }
    var act = aiChoose(st, c);
    if (act.kind === 'flee') { B.msg(st, c.name + ' prend la fuite !', '#cfd8e6'); c.dead = true; c.hp = 0; c.fled = 1; endTurn(st, c); return; }
    if (act.kind === 'split') {
      push(st, .3, function () {
        if (st.foes.length < 5) {
          var n = mkFoe(c.mon, st.foes.length); n.hp = n.max = Math.max(1, Math.round(c.hp / 2)); c.hp -= n.max; c.mp = 0;
          var p = foePos(st.foes.length, st.foes.length + 1); n.x = p.x + 8; n.y = p.y + 4;
          st.foes.push(n); B.msg(st, 'La limule se scinde !', '#9fff9f');
          st.foes.forEach(function (f, i) { var q = foePos(i, st.foes.length); f.x = q.x; f.y = q.y; });
        }
      });
      endTurn(st, c); return;
    }
    var tgt = null;
    if (act.kind === 'ab' && (D.ABILITIES[act.id] || {}).tgt === 'foes') tgt = null;
    else tgt = pickTargetFor(st, c);
    if (act.kind === 'sp' && D.SP[act.id] && c.mp < (D.SP[act.id].cost || 0)) act = { kind: 'atk' };
    if (act.kind === 'ab' && D.ABILITIES[act.id] && c.mp < (D.ABILITIES[act.id].cost || 0)) act = { kind: 'atk' };
    doAct(st, c, act, tgt);
    endTurn(st, c);
  }
  function pickTargetFor(st, c) {
    var alive = living(st, 'allies');
    if (!alive.length) return null;
    var taunters = alive.filter(function (a) { return a.taunt; });
    if (taunters.length) return pickOne(taunters);
    if (c.ai === 'sage') return pickOne(alive.slice().sort(function (a, b) { return b.hp - a.hp; }).slice(0, 2));
    if (c.ai === 'fonce' && Math.random() < .35) { var weak = alive.slice().sort(function (a, b) { return a.hp / a.max - b.hp / b.max; })[0]; if (weak && weak.hp / weak.max < .35) return weak; }
    return pickOne(alive);
  }

  /* ---------------- tours ---------------- */
  function endTurn(st, c) {
    c.atb = 0;
    c.guard = 0;
    for (var k in c.buffs) {
      var b = c.buffs[k];
      if (b && b.dur != null) { b.dur--; if (b.dur <= 0) delete c.buffs[k]; }
    }
    tickStatus(st, c);
    /* check fin */
    if (!living(st, 'allies').length) { lose(st); return; }
    if (!living(st, 'foes').length) { win(st); return; }
  }
  function tickStatus(st, c) {
    if (c.status.poison) {
      var d = Math.max(1, Math.round(c.max * .08));
      c.hp = Math.max(c.hp > 0 ? 1 : 0, c.hp - d);
      dmgText(st, c, d, 'dmg', '#7ad06a');
    }
    if (c.buffs.regen) { var h = Math.round(c.max * .06); c.hp = Math.min(c.max, c.hp + h); dmgText(st, c, h, 'heal', '#9fff9f'); }
    if (c.status.sleep && Math.random() < .3) { delete c.status.sleep; }
    if (c.status.doom) { c.doom = (c.doom || 6) - 1; if (c.doom <= 0) { c.hp = 0; kill(st, c); } }
    if (c.status.confuse && Math.random() < .2) delete c.status.confuse;
    if (c.status.blind && Math.random() < .12) delete c.status.blind;
  }

  function win(st) {
    if (st.ended) return;
    st.ended = 1; st.mode = 'win'; st.t = 0;
    st.tl.length = 0;
    var exp = 0, gil = 0, drops = [];
    st.foes.forEach(function (f) {
      exp += f.mon.exp || 0;
      if (!f.mon.noGil) gil += f.mon.gil || 0;
      var dr = f.mon.drop;
      if (dr && Math.random() < (dr.p || .2)) drops.push(dr.it);
    });
    var res = { exp: exp, gil: gil, drops: drops, levels: [], mon: st.foes.map(function (f) { return f.mon.id; }) };
    if (!st.noExp) {
      S.party().forEach(function (m) {
        if (!m) return;
        var ups = FF.P.giveExp(m, m.hp > 0 ? res.exp : Math.round(res.exp * .4));
        if (ups.length) res.levels.push({ id: m.id, name: m.name, ups: ups });
        FF.P.recalc(m);
        m.hp = m.hp; m.mp = m.mp;
      });
      S.gil(gil);
      drops.forEach(function (d) { S.add(d, 1); });
    }
    st.result = res;
    FF.Snd.playMusic('victory', { oneshot: 1, restart: 1 });
    if (st.foes[0] && st.foes[0].mon.win && st.foes[0].mon.win.msg) B.msg(st, st.foes[0].mon.win.msg, '#ffe066');
    push(st, .8, function () { st.showResult = 1; st.t = 0; });
  }
  function lose(st) {
    if (st.ended) return;
    st.ended = 1; st.mode = 'lose'; st.tl.length = 0;
    FF.Snd.stopMusic();
    FF.Snd.play('death');
    G.fadeTo(1, .8);
  }
  B.finish = function () {
    var st = B.st;
    var cb = st.winCb;
    syncBack(st);
    B.st = null;
    if (cb) cb(st.result || {});
    else FF.Game.endBattle(st.result || {}, 'win');
  };
  /* rapporte dans l'état permanent ce qui s'est passé au combat */
  function syncBack(st) {
    if (!st) return;
    st.allies.forEach(function (a) {
      var m = S.members[a.id]; if (!m) return;
      FF.P.recalc(m);
      m.hp = U.clamp(Math.round(a.hp), 0, m.stats.pv);
      m.mp = U.clamp(Math.round(a.mp), 0, m.stats.pm);
      m.dead = m.hp <= 0 ? 1 : 0;
      var stt = {};
      for (var k in a.status) if (D.STATUS[k] && D.STATUS[k].keep !== 0) stt[k] = a.status[k];
      m.status = stt;
      m.row = a.row;
    });
  }

  /* ---------------- commande du joueur ---------------- */
  var CMDS = ['atk', 'mag', 'tea', 'it', 'def', 'run'];
  var CMDN = { atk: 'ATTAQUE', mag: 'MAGIE', tea: 'TECHNIQUE', it: 'OBJET', def: 'DÉFENSE', run: 'FUIR' };

  function openMenu(st, c) {
    st.mode = 'cmd'; st.cursor = 0; st.sub = null; st.actor = c;
    st.cmds = CMDS.filter(function (k) {
      if (k === 'run' && (st.noFlee || st.foes.every(function (f) { return f.mon.noFlee; }))) return false;
      if (k === 'mag' && !Object.keys(c.ref.learn || {}).length) return false;
      if (k === 'tea' && !(c.ref.abs || []).length) return false;
      if (k === 'it' && !FF.S.invList(['inv']).length) return false;
      return true;
    });
  }
  function subList(st, c, kind) {
    if (kind === 'mag') {
      var l = Object.keys(c.ref.learn || {}).filter(function (id) { return D.SP[id]; });
      l.sort(function (a, b) { return (D.SP[a].kind + D.SP[a].cost) < (D.SP[b].kind + D.SP[b].cost) ? -1 : 1; });
      return l.map(function (id) { return { id: id, n: D.SP[id].n, cost: D.SP[id].cost, ok: c.mp >= (D.SP[id].cost || 0), sp: D.SP[id] }; });
    }
    if (kind === 'tea') return (c.ref.abs || []).map(function (a) { return { id: a.id, n: a.n, cost: a.cost, ok: c.mp >= (a.cost || 0), ab: a }; });
    if (kind === 'it') {
      return S.invList(['inv']).filter(function (o) { return o.it.k !== 'key'; })
        .map(function (o) { return { id: o.id, n: o.it.n, cost: 0, ok: true, count: o.c, it: o.it }; });
    }
    return [];
  }
  function needsTarget(sp) {
    if (!sp) return false;
    return sp.tgt === 'foe' || sp.tgt === 'ally' || sp.tgt === 'dead';
  }

  /* ---------------- update ---------------- */
  B.update = function (dt) {
    var st = B.st;
    if (!st) return;
    st.t += dt;
    /* timeline */
    var due = [];
    for (var i = st.tl.length - 1; i >= 0; i--) {
      if (st.tl[i].t <= st.t) { due.unshift(st.tl[i]); st.tl.splice(i, 1); }
    }
    due.forEach(function (d) { try { d.f(); } catch (e) { console.warn('battle fx', e); } });
    if (st.log) st.log.forEach(function (l) { l.life -= dt; });
    if (st.log) st.log = st.log.filter(function (l) { return l.life > 0; });
    if (st.castFx) st.castFx.t += dt;
    /* sprites */
    st.allies.concat(st.foes).forEach(function (c) {
      c.flash = Math.max(0, (c.flash || 0) - dt * 2);
      c.shake = Math.max(0, (c.shake || 0) - dt * 4);
      c.dx = U.approach(c.dx || 0, 0, dt * 40);
      c.dy = U.approach(c.dy || 0, 0, dt * 40);
      if (c.dmg) { c.dmg.t += dt; if (c.dmg.t > 1.15) c.dmg = null; }
      if (c.dieT) { c.dieT += dt; if (c.dieT > 1) { c.dead = 1; c.dieT = 0; } }
      if (c.jump) { c.jump += dt; }
    });
    if (st.mode === 'say') {
      st.sayT += dt;
      if (FF.In.tap('a') || st.sayT > 4.5) { st.sayT = 0; st.mode = 'idle'; st.say = null; }
      return;
    }
    if (st.mode === 'win') {
      if (st.showResult && (FF.In.tap('a') || st.t > 12)) { B.finish(); }
      return;
    }
    if (st.mode === 'lose') { if (st.t > 2.2 && FF.In.tap('a')) { st.allies.forEach(function (a) { a.hp = 0; }); syncBack(st); if (st.loseCb) st.loseCb(); else FF.Game.gameOver(); } return; }
    if (st.ended) return;

    if (st.mode === 'intro') { if (!busy(st) && st.t > .4) st.mode = 'idle'; }
    if (busy(st)) { st.mode = 'anim'; return; }
    if (st.mode === 'anim') st.mode = 'idle';   /* animation terminée : on reprend la main */

    /* ATB demi-active : gel pendant les menus */
    var menuOpen = st.mode === 'cmd' || st.mode === 'sub' || st.mode === 'target';
    if (!menuOpen) {
      var list = st.allies.concat(st.foes).filter(function (c) { return !isDead(c); });
      list.forEach(function (c) {
        if (c.side === 'foe' && st.allies.some(function (a) { return !isDead(a); })) { }
        c.atb += dt * (9 + spdOf(c) * .58);
        if (c.atb >= 100) {
          c.atb = 0;
          if (c.side === 'foe') { foeAct(st, c); st.mode = 'anim'; }
          else if (canAct(c) === false) { B.msg(st, c.name + ' ne peut pas agir', '#cfd8e6'); endTurn(st, c); }
          else { openMenu(st, c); }
          return;
        }
      });
    }
    /* réveil des sorts de statut (durées en tours) géré dans endTurn */
    handleMenu(st, dt);
  };

  /* ---------------- menus & entrées ---------------- */
  function handleMenu(st, dt) {
    var In = FF.In, c = st.actor;
    if (st.mode === 'cmd') {
      var n = st.cmds.length;
      if (In.tap('up', [.3, .13])) st.cursor = (st.cursor + n - 2) % n;
      if (In.tap('down', [.3, .13])) st.cursor = (st.cursor + 2) % n;
      if (In.tap('left', [.3, .13])) st.cursor = (st.cursor + (st.cursor % 2 ? -1 : n - 1)) % n;
      if (In.tap('right', [.3, .13])) st.cursor = (st.cursor + (st.cursor % 2 ? n - 1 : 1)) % n;
      if (In.pressed('b')) { st.cursor = 0; }
      if (In.pressed('a')) {
        var k = st.cmds[st.cursor];
        if (k === 'atk') { doPlayer(st, c, { kind: 'atk' }); }
        else if (k === 'def') { c.guard = 1; c.atb = 0; B.msg(st, c.name + ' se met en garde.', '#8fb3ff'); endTurn(st, c); st.mode = 'anim'; push(st, .3, function () { }); }
        else if (k === 'run') { tryFlee(st, c); }
        else { st.mode = 'sub'; st.sub = k; st.subIdx = 0; }
      }
      return;
    }
    if (st.mode === 'sub') {
      var list = st.subL = subList(st, c, st.sub);
      if (!list.length) { st.mode = 'cmd'; st.sub = null; return; }
      st.subIdx = U.clamp(st.subIdx, 0, list.length - 1);
      st.subTop = U.clamp(st.subIdx - 3, 0, Math.max(0, list.length - 7));
      if (In.tap('up', [.28, .1])) st.subIdx = (st.subIdx + list.length - 1) % list.length;
      if (In.tap('down', [.28, .1])) st.subIdx = (st.subIdx + 1) % list.length;
      if (In.pressed('b')) { st.mode = 'cmd'; st.sub = null; return; }
      if (In.pressed('a')) {
        var s = list[st.subIdx];
        if (!s.ok) { FF.Snd.play('cancel'); B.msg(st, 'Pas assez de PM.', '#ff8a8a'); return; }
        var sp = s.sp || (st.sub === 'tea' ? s.ab : null);
        if (st.sub === 'it' && !needsTarget(s.it)) {
          doPlayer(st, c, { kind: 'item', item: s.id });
          return;
        }
        if (st.sub === 'tea' && (s.ab.tgt === 'allies' || s.ab.tgt === 'foes' || s.ab.tgt === 'ally' || s.ab.tgt === 'self' || s.ab.tgt === 'foe')) {
          if (s.ab.tgt === 'ally' || s.ab.tgt === 'foe') { st.mode = 'target'; st.tgtSide = s.ab.tgt === 'foe' ? 'foes' : 'allies'; st.pending = { kind: 'ab', id: s.id, ab: s.ab }; st.target = 0; return; }
          doPlayer(st, c, { kind: 'ab', id: s.id });
          return;
        }
        if (st.sub === 'mag' && needsTarget(s.sp)) {
          st.mode = 'target';
          st.tgtSide = s.sp.tgt === 'ally' || s.sp.tgt === 'dead' ? 'allies' : 'foes';
          st.pending = { kind: 'sp', id: s.id, sp: s.sp };
          st.target = 0; return;
        }
        doPlayer(st, c, st.sub === 'mag' ? { kind: 'sp', id: s.id, sp: s.sp } : st.sub === 'tea' ? { kind: 'ab', id: s.id } : { kind: 'item', item: s.id });
      }
      return;
    }
    if (st.mode === 'target') {
      var side = st.tgtSide === 'allies' ? st.allies : st.foes;
      var pool = side.filter(function (x) { return st.pending && (st.pending.sp || st.pending.it) && (st.pending.sp && st.pending.sp.tgt === 'dead') ? x.dead : !isDead(x); });
      if (!pool.length) pool = side.filter(function (x) { return !isDead(x); });
      if (!pool.length) { st.mode = 'cmd'; return; }
      if (In.pressed('left') || In.pressed('up')) st.target = (pool.indexOf(st.curTgt || {}) + pool.length - 1 + (st.target || 0)) % pool.length;
      if (In.pressed('right') || In.pressed('down')) st.target = ((st.target || 0) + 1) % pool.length;
      if (In.tap('left', [.3, .12])) st.target = ((st.target || 0) + pool.length - 1) % pool.length;
      if (In.tap('right', [.3, .12])) st.target = ((st.target || 0) + 1) % pool.length;
      st.curTgt = pool[st.target || 0];
      if (In.pressed('b')) { st.mode = st.pending && st.pending.fromSub ? 'sub' : 'cmd'; st.pending = null; return; }
      if (In.pressed('a')) {
        var t = st.curTgt;
        var p = st.pending; st.pending = null;
        if (t) doPlayer(st, c, Object.assign({}, p, { tgt: t }));
      }
      return;
    }
  }
  B.onScreenTap = function (x, y) {
    var st = B.st; if (!st) return;
    if (st.mode === 'say') { st.sayT = 99; return; }
    if (st.mode === 'win' && st.showResult) { B.finish(); return; }
    if (st.mode === 'cmd') {
      /* zones de commande cliquables */
      var i = B.cmdHitTest(x, y);
      if (i >= 0 && i < st.cmds.length) { st.cursor = i; var In = FF.In; FF.In.force('a'); }
      return;
    }
    if (st.mode === 'target') {
      var side = st.tgtSide === 'allies' ? st.allies : st.foes;
      var pool = side.filter(function (x) { return !isDead(x); });
      for (var j = 0; j < pool.length; j++) {
        var c = pool[j];
        if (x > c.x - 12 && x < c.x + (c.spr ? c.spr.width : 16) * (c.scale || 1) / 1 + 12 && y > c.y - 10 && y < c.y + 26) { st.target = j; FF.In.force('a'); return; }
      }
    }
    if (st.mode === 'sub') { FF.In.force('a'); }
  };
  B.cmdHitTest = function (x, y) {
    var st = B.st; if (!st) return -1;
    var mx = 2, my = 112, cw = 58;
    if (x < mx + 6 || x > mx + cw * 2 + 6 || y < my + 3 || y > my + 3 + Math.ceil(st.cmds.length / 2) * 12) return -1;
    var col = x > mx + 6 + cw ? 1 : 0;
    var row = Math.floor((y - my - 3) / 12);
    var i = row * 2 + col;
    return i < st.cmds.length ? i : -1;
  };

  function doPlayer(st, c, act) {
    st.mode = 'anim';
    var tgt = act.tgt;
    if (act.kind === 'atk') {
      if (!tgt) {
        var pool = living(st, 'foes');
        if (!pool.length) { endTurn(st, c); return; }
        tgt = pool[st.target || 0] || pool[0];
      }
      if (c.pendingJump) { /* atterissage */ }
      B.actAttack(st, c, tgt);
      endTurn(st, c);
      return;
    }
    if (act.kind === 'sp') {
      if (!tgt && act.sp && needsTarget(act.sp)) tgt = pickOne(living(st, act.sp.tgt === 'ally' || act.sp.tgt === 'dead' ? 'allies' : 'foes'));
      B.actSpell(st, c, act.sp, act.id, tgt);
      endTurn(st, c);
      return;
    }
    if (act.kind === 'ab') {
      var ab = D.ABILITIES[act.id];
      B.actAbility(st, c, ab, tgt);
      endTurn(st, c);
      return;
    }
    if (act.kind === 'item') {
      S.remove(act.item, 1);
      useItemInBattle(st, c, act.item, tgt);
      endTurn(st, c);
      return;
    }
    endTurn(st, c);
  }
  function tryFlee(st, c) {
    if (st.noFlee) { B.msg(st, 'Impossible de fuir !', '#ff8a8a'); FF.Snd.play('cancel'); st.mode = 'anim'; push(st, .3, function () { }); return; }
    var has = S.invList(['inv']).some(function (o) { return o.it.k === 'escape'; });
    var p = .4 + (U.clamp(avgSpd(st, 'allies') / Math.max(1, avgSpd(st, 'foes')), .4, 2.4)) * .28;
    if (has && S.invList(['inv']).some(function (o) { return o.it.k === 'escape'; })) p = 1;
    st.mode = 'anim';
    push(st, .3, function () {
      if (Math.random() < p) {
        FF.Snd.play('flee');
        st.escaped = 1; st.ended = 1;
        S.runs = (S.runs || 0) + 1;
        G.fadeTo(1, 3);
        push(st, .5, function () { B.escape(); });
      } else { B.msg(st, 'La fuite échoue !', '#ff8a8a'); FF.Snd.play('fail'); endTurn(st, c); }
    });
  }
  B.escape = function () {
    var st = B.st, cb = st && st.onEscape;
    if (st) syncBack(st);
    B.st = null;
    if (cb) cb(); else FF.Game.endBattle(null, 'flee');
  };
  function avgSpd(st, side) { var l = living(st, side); return l.length ? l.reduce(function (a, c) { return a + c.spd; }, 0) / l.length : 1; }

  /* ---------------- rendu ---------------- */
  B.draw = function () {
    var st = B.st; if (!st) return;
    var ctx = G.ctx;
    drawBg(st);
    /* cibles / acteurs */
    var tgt = st.mode === 'target' ? st.curTgt : null;
    st.foes.forEach(function (f) { drawCombatant(st, f, f === tgt); });
    st.allies.forEach(function (a, i) {
      drawCombatant(st, a, a === tgt, i);
    });
    /* effet d'incantation */
    if (st.castFx) {
      var k = st.castFx.t / .8;
      ctx.save();
      ctx.globalAlpha = Math.max(0, .5 * (1 - k));
      ctx.fillStyle = st.castFx.c;
      for (var i = 0; i < 26; i++) {
        var yy = (i * 7 + st.t * 260) % (H + 20) - 10;
        ctx.fillRect((i * 41 + st.t * 60) % W, yy, st.castFx.big ? 3 : 2, 1);
      }
      ctx.restore();
    }
    drawHud(st);
    G.drawParts();
    if (st.log) {
      st.log.forEach(function (l, i) {
        G.text(l.t, W / 2, 4 + i * 11, { align: 'center', color: l.c, shadow: '#000' });
      });
    }
    if (st.mode === 'say' && st.say) {
      G.win(12, 118, W - 24, 36);
      G.text(st.say, W / 2, 128, { align: 'center', color: '#ffe6a8' });
    }
    if (st.mode === 'win') drawWin(st);
    if (st.mode === 'lose') drawLose(st);
  };

  function drawCombatant(st, c, isTgt, idx) {
    if (c.dead && !c.dieT && !c.status.stone) return;
    var g = G.ctx;
    var sc = c.spr ? c.spr.width : 16;
    var x = c.x + (c.shake ? (Math.random() * 2 - 1) * 2 : 0) + (c.dx || 0);
    var y = c.y + (c.dy || 0) - (c.jump ? Math.min(28, Math.sin(Math.min(1, c.jump / 1.2) * 3.14) * 30) : 0);
    var img = c.side === 'ally' ? (c.back || c.spr) : c.spr;
    var scale = c.side === 'ally' ? 2 : (c.scale || 2);
    /* ombre */
    g.fillStyle = 'rgba(0,0,0,.3)';
    G.rect(x - 2, y + (c.side === 'ally' ? 44 : 30), sc * scale * 0.6, 3, 'rgba(0,0,0,.28)');
    if (c.status.stone) { G.spr(FF.Assets.stone, x, y, { scale: 1 }); }
    else G.spr(img, x, y, {
      scale: scale, alpha: c.dead ? Math.max(0, 1 - c.dieT) : (c.side === 'ally' ? 1 : 1),
      flip: c.side === 'ally', flash: c.flash > 0 ? (c.flash > .18 ? '#ffffff' : null) : null
    });
    if (c.guard) G.spr(FF.Assets.barrier, x - 4, y - 4, { alpha: .6 });
    if (c.buffs.shield) G.rect(x - 3, y - 3, sc * scale + 6, (c.spr ? c.spr.height : 16) * scale + 6, 'rgba(255,210,87,.14)');
    if (isTgt) {
      var t = (G.time * 5) | 0;
      G.text('▼', x + sc * scale / 2 - 3 + (t % 2 ? 0 : 1), y - 10, { color: '#ffe66e' });
    }
    if (c.actor === st.actor && st.mode === 'cmd') G.text('>', x - 8, y + 2, { color: '#ffe66e' });
    /* chiffres */
    if (c.dmg) {
      var k = 1 - c.dmg.t / 1.15;
      var dy = -(1 - k) * 12;
      G.text(String(c.dmg.v == null ? c.dmg.kind : (c.dmg.kind === 'heal' ? '+' : c.dmg.kind === 'mp' ? '◦' : '') + U.num(c.dmg.v)), x + (sc * scale) / 2, y - 6 + dy, { align: 'center', color: c.dmg.col || '#fff', shadow: '#000' });
    }
    /* barre de vie au-dessus des ennemis */
    if (c.side === 'foe' && !c.dead && c.hp < c.max) {
      G.rect(x, y - 5, 20, 2, '#0a0d18');
      G.rect(x, y - 5, Math.max(0, Math.round(20 * c.hp / c.max)), 2, c.hp / c.max < .3 ? '#ff6a6a' : '#7ad06a');
    }
  }

  function drawHud(st) {
    /* panneau d'équipe */
    var y0 = 96, x0 = W - 96;
    G.win(x0 - 2, y0 - 2, 98, st.allies.length * 13 + 8, { alpha: .93 });
    st.allies.forEach(function (a, i) {
      var yy = y0 + 2 + i * 13;
      var sel = st.actor === a && (st.mode === 'cmd' || st.mode === 'sub' || st.mode === 'target');
      G.text(U.pad(a.name, 7), x0 + 2, yy, { color: a.dead ? '#6a7288' : (sel ? '#ffe66e' : '#eef3ff') });
      G.text(String(a.hp), x0 + 56, yy, { align: 'right', color: a.hp / a.max < .25 ? '#ff8a8a' : '#dff0d0' });
      G.text(String(a.mp), x0 + 74, yy, { align: 'right', color: '#9fc8ff' });
      G.text(String(a.lv), x0 + 90, yy, { align: 'right', color: '#cfd8e6' });
      /* ATB */
      G.rect(x0 + 2, yy + 9, 90, 2, '#0a0d18');
      G.rect(x0 + 2, yy + 9, Math.round(90 * U.clamp(a.atb / 100, 0, 1)), 2, a.atb >= 100 ? '#ffe66e' : '#4a7fb0');
      var sts = Object.keys(a.status).filter(function (s) { return D.STATUS[s]; });
      sts.forEach(function (s, j) { G.text(D.STATUS[s].n[0], x0 + 92 + j * 3, yy, { color: D.STATUS[s].c }); });
    });
    /* menu commandes */
    if (st.mode === 'cmd' && st.cmds) {
      var n = st.cmds.length, mx = 2, my = 112, cw = 58;
      var rows = Math.ceil(n / 2);
      G.win(mx, my, cw * 2 + 8, rows * 12 + 8);
      st.cmds.forEach(function (k, i) {
        var col = i % 2, rw = Math.floor(i / 2);
        G.text(FF.Font.fit(CMDN[k], cw - 14), mx + 10 + col * cw, my + 5 + rw * 12, { color: i === st.cursor ? '#ffe66e' : '#eef3ff' });
      });
      G.cursor(mx + 4 + (st.cursor % 2) * cw, my + 5 + Math.floor(st.cursor / 2) * 12);
    }
    if (st.mode === 'sub' && st.subL) {
      var w = 112, hgt = Math.min(7, st.subL.length) * 11 + 8, sx = 2, sy = 108 - hgt;
      G.win(sx, sy, w, hgt);
      var top = st.subTop || 0;
      st.subL.slice(top, top + 7).forEach(function (o, i) {
        var idx = top + i;
        G.text(FF.Font.fit(o.n, w - 34), sx + 10, sy + 4 + i * 11, { color: o.ok ? (idx === st.subIdx ? '#ffe66e' : '#eef3ff') : '#7a8298' });
        if (o.cost) G.text(String(o.cost), sx + w - 6, sy + 4 + i * 11, { align: 'right', color: o.ok ? '#9fc8ff' : '#7a8298' });
        if (o.count != null) G.text('x' + o.count, sx + w - 6, sy + 4 + i * 11, { align: 'right', color: '#cfd8e6' });
      });
      G.cursor(sx + 3, sy + 4 + (st.subIdx - top) * 11);
      if (top > 0) G.text('^', sx + w - 8, sy - 6, { color: '#ffe66e' });
      if (top + 7 < st.subL.length) G.text('v', sx + w - 8, sy + 7 * 11 + 2, { color: '#ffe66e' });
      var sel = st.subL[st.subIdx];
      if (sel) {
        var d = (sel.sp || sel.ab || sel.it || {}).d || '';
        G.win(4, 4, W - 210, 30);
        var lns = FF.Font.lines(d, W - 218);
        lns.slice(0, 2).forEach(function (l, i) { G.text(l, 8, 8 + i * 11, { color: '#cfd8e6' }); });
        var txt = sel.sp && D.ELEM[sel.sp.elem] ? D.ELEM[sel.sp.elem].n : (sel.it ? (sel.it.k === 'use' ? 'Consommable' : 'Objet') : '');
        if (txt) G.text(txt, 8, 8 + Math.min(2, lns.length) * 11, { color: '#9fb3ff' });
      }
    }
  }
  function drawWin(st) {
    var r = st.result || {};
    G.win(30, 40, W - 60, 76);
    G.text('VICTOIRE', W / 2, 46, { align: 'center', color: '#ffe66e' });
    G.text(U.num(r.exp || 0) + ' PE', 46, 62, { color: '#eef3ff' });
    if (!st.noExp) G.text(U.num(r.gil || 0) + ' Gils', 46, 74, { color: '#ffd257' });
    var drops = r.drops || [];
    drops.forEach(function (d, i) { G.text((D.IT[d] || { n: d }).n, 46, 86 + i * 10, { color: '#a6ffbf' }); });
    var lv = r.levels && r.levels.length;
    if (lv) {
      G.text(lv + ' niveau(x) !', W - 46, 62, { align: 'right', color: '#9fff9f' });
      r.levels.forEach(function (l, i) { G.text(l.name + ' → Lv' + l.ups[l.ups.length - 1].lv, W - 46, 74 + i * 10, { align: 'right', color: '#eef3ff' }); });
    }
    if (st.t > 1.4 || st.showResult) G.text('A : continuer', W / 2, 108, { align: 'center', color: '#8fa0c9' });
  }
  function drawLose(st) {
    G.clear('#000');
    G.text('VOS HÉROS ONT SUCCOMBÉ…', W / 2, H / 2 - 8, { align: 'center', color: '#ff6a6a' });
    if (st.t > 2.2) G.text('Appuyez sur B', W / 2, H / 2 + 10, { align: 'center', color: '#8fa0c9' });
  }

  function drawBg(st) {
    var g = G.ctx, k = st.bg || 'field';
    var pal = B.BG[k] || B.BG.field;
    G.gradRect(0, 0, W, H, pal[0], pal[1]);
    /* sol */
    var horizon = 74;
    g.fillStyle = pal[2];
    g.fillRect(0, horizon, W, H - horizon);
    for (var i = 0; i < 14; i++) {
      var y = horizon + i * 6;
      g.fillStyle = U.mix(pal[2], pal[3], i / 14);
      g.fillRect(0, y, W, 3);
    }
    /* reliefs */
    g.fillStyle = pal[4];
    var r = U.rng(U.hash(k));
    for (i = 0; i < 9; i++) {
      var w = 20 + r() * 60, x = r() * W - w / 2, hh = 10 + r() * 26;
      g.beginPath && 0;
      for (var yy = 0; yy < hh; yy++) {
        var ww = Math.round(w * (1 - yy / hh) / 2);
        g.fillRect(x + w / 2 - ww, horizon - yy, ww * 2, 1);
      }
    }
    if (pal.stars) {
      for (i = 0; i < 30; i++) { g.fillStyle = i % 3 ? '#ffffff55' : '#ffffff'; g.fillRect((i * 37 + Math.sin(st.t + i) * 2) % W, (i * 13) % 60, 1, 1); }
    }
    if (pal.snow) for (i = 0; i < 30; i++) { var sx = (i * 53 + st.t * 26) % W, sy = (i * 29 + st.t * 42) % H; g.fillStyle = '#ffffff77'; g.fillRect(sx, sy, 1, 1); }
    if (pal.embers) for (i = 0; i < 24; i++) { var ex = (i * 71 - st.t * 30) % W, ey = (H - (i * 41 + st.t * 60) % H); g.fillStyle = i % 2 ? '#ff9a3d' : '#ffe066'; g.fillRect((ex + W) % W, ey, 1, 1); }
  }
  B.BG = {
    field: ['#1b3a6b', '#3f6fa8', '#3d6a3a', '#2c4f2b', '#25405f'],
    town: ['#25355f', '#4f6f9e', '#4a5a6a', '#374554', '#2b3f5f'],
    cave: ['#0d1020', '#232a45', '#2a2f45', '#1b2030', '#151a2c'],
    mine: ['#1b1410', '#3d2b20', '#4a3528', '#35241c', '#241a14'],
    sea: ['#123f6b', '#3f8fc9', '#2b5f7a', '#1e4a60', '#164a7a', { stars: 0 }],
    ice: ['#2b4a6b', '#7fb0d6', '#a6c8e0', '#6f9ac0', '#4a6f8f', { snow: 1 }],
    lava: ['#2b0f0a', '#6b2a14', '#3a1a14', '#241010', '#4a1a10', { embers: 1 }],
    tower: ['#0a0a1c', '#2b1f4a', '#1e1a35', '#141026', '#3a2b5f', { stars: 1 }],
    sky: ['#1b4a8a', '#7fb8ff', '#cfe6ff', '#a6c8e6', '#5f8fc9', { stars: 0 }],
    dream: ['#1a1030', '#3d2b5f', '#2b2045', '#1e1835', '#4a3570', { stars: 1 }]
  };
  B.bgFor = function (theme) { return ({ field: 'field', town: 'town', cave: 'cave', mine: 'mine', ice: 'ice', lava: 'lava', tower: 'tower', ship: 'sea', indo: 'town' })[theme] || 'field'; };
})(this.FF = this.FF || {});
