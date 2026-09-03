/* ============================================================
   UI — dialogues, menus (objet, magie, équipement, statut,
   emploi, cristal, boutique, auberge, sauvegarde, config)
   ============================================================ */
(function (FF) {
  'use strict';
  var U = FF.U, G = FF.Gfx, D = FF.D, S = FF.S, In = FF.In;
  var UI = FF.UI = {};
  var F = FF.Font;

  UI.dlg = null;
  UI.menu = null;

  /* ---------------- DIALOGUE ---------------- */
  UI.dialog = function (lines, opt) {
    opt = opt || {};
    if (FF.Wld && FF.Wld.normLines) lines = FF.Wld.normLines(lines);
    UI.dlg = { lines: (lines && lines.length ? lines : [['', '…']]), i: 0, t: 0, n: 0, done: 0, opt: opt, who: null, page: 0, pages: [[]], cur: [], total: 0 };
    UI.dlgOpt = opt.after ? opt : null;
    FF.Game.modal = 'dialog';
    UI.setLine(UI.dlg);
  };
  /* dimensions de la boîte selon le nombre de lignes wrappées */
  UI.dlgBox = function (d) {
    var who = d.who ? 12 : 0;
    var nl = Math.max(1, (d.linesArr || ['']).length);
    var h = U.clamp(who + nl * F.LINE + 8, 32, G.H - 34);
    var per = Math.max(1, Math.floor((h - who - 7) / F.LINE));
    return { h: h, y: G.H - h - 2, per: per, who: who };
  };
  UI.setLine = function (d) {
    var ln = d.lines[d.i];
    d.who = ln && ln[0] ? ln[0] : null;
    d.linesArr = F.lines(String(ln ? (ln[1] == null ? '' : ln[1]) : ''), G.W - 30);
    var box = UI.dlgBox(d), all = d.linesArr;
    d.pages = [];
    for (var i = 0; i < all.length; i += box.per) d.pages.push(all.slice(i, i + box.per));
    if (!d.pages.length) d.pages = [['']];
    d.page = 0;
    UI.pageStart(d);
  };
  UI.pageStart = function (d) {
    d.cur = d.pages[d.page] || [''];
    d.total = d.cur.join('').length;
    d.n = 0; d.t = 0;
    d.done = (d.i >= d.lines.length - 1 && d.page >= d.pages.length - 1) ? 1 : 0;
  };
  UI.nextLine = function () { var d = UI.dlg; if (d) { d.i = Math.min(d.i + 1, d.lines.length - 1); d.page = 0; UI.setLine(d); } };
  UI.updateDialog = function (dt) {
    var d = UI.dlg; if (!d) return;
    var spd = 62 * (S.settings.textSpeed || 1);
    if (d.n < d.total) {
      var prev = Math.floor(d.n);
      d.n += dt * spd;
      if (In.pressed('a')) d.n = d.total;
      if (Math.floor(d.n) !== prev && Math.floor(d.n) % 3 === 0) FF.Snd.play('beep');
      return;
    }
    if (In.pressed('a') || In.pressed('b')) {
      if (d.page < d.pages.length - 1) { d.page++; UI.pageStart(d); FF.Snd.play('ok'); }
      else if (d.i < d.lines.length - 1) { d.i++; UI.setLine(d); FF.Snd.play('cursor'); }
      else UI.closeDialog();
    }
  };
  UI.closeDialog = function () {
    var o = UI.dlgOpt; UI.dlgOpt = null;
    var after = UI._afterDialog; UI._afterDialog = null;
    UI.dlg = null;
    FF.Game.modal = null;
    if (FF.Wld && FF.Wld.cut) { FF.Wld.cutResume(); return; }
    if (o && o.after) o.after();
    if (after) after();
  };
  UI.drawDialog = function () {
    var d = UI.dlg; if (!d) return;
    var box = UI.dlgBox(d);
    G.win(2, box.y, G.W - 4, box.h, { alpha: .96 });
    var left = Math.floor(d.n), shown = 0;
    for (var i = 0; i < d.cur.length; i++) {
      var line = d.cur[i];
      var take = U.clamp(left - shown, 0, line.length);
      G.text(line.substring(0, take), 8, box.y + (d.who ? 14 : 7) + i * F.LINE, { color: '#eef3ff' });
      shown += line.length;
      if (take < line.length) break;
    }
    if (d.who) {
      G.win(6, box.y - 9, Math.max(30, F.width(d.who) + 10), 13, { style: 2, alpha: .96 });
      G.text(d.who, 11, box.y - 7, { color: '#fff8d0' });
    }
    if (Math.floor(d.n) >= d.total) {
      var t = (G.time * 3) | 0;
      if (t % 2) G.text(d.pages.length > 1 ? (d.page < d.pages.length - 1 ? '▼' : '▶') : '▼', G.W - 14, box.y + box.h - 12, { color: '#ffe66e' });
    }
  };

  /* ---------------- LISTE GÉNÉRIQUE ---------------- */
  function list(o) {
    return {
      items: o.items, idx: o.idx || 0, top: 0, per: o.per || 8, x: o.x, y: o.y, w: o.w, h: o.h,
      style: o.style, onSel: o.onSel, onCancel: o.onCancel, fmt: o.fmt, onChange: o.onChange,
      cols: o.cols || 1, side: o.side, sub: 0, key: o.key
    };
  }
  function nav(L, wrap) {
    var n = L.items.length;
    if (!n) return;
    var per = L.per;
    if (L.cols > 1) {
      if (In.tap('left', [.28, .1])) L.idx = (L.idx + n - 1) % n;
      if (In.tap('right', [.28, .1])) L.idx = (L.idx + 1) % n;
      if (In.tap('up', [.28, .1])) L.idx = (L.idx - per + n) % n;
      if (In.tap('down', [.28, .1])) L.idx = (L.idx + per) % n;
    } else {
      if (In.tap('up', [.26, .1])) L.idx = (L.idx + n - 1) % n;
      if (In.tap('down', [.26, .1])) L.idx = (L.idx + 1) % n;
      if (In.tap('left', [.26, .1])) L.idx = (L.idx - per + n) % n;
      if (In.tap('right', [.26, .1])) L.idx = (L.idx + per) % n;
    }
    L.top = U.clamp(L.idx - per + 1, Math.floor(L.idx / per) * per, L.idx);
    L.top = U.clamp(L.idx, 0, Math.max(0, n - 1));
    while (L.top > L.idx) L.top -= per;
    while (L.top + per <= L.idx && L.top + per < n) L.top += per;
  }
  function drawList(L, opt) {
    opt = opt || {};
    G.win(L.x, L.y, L.w, L.h, { alpha: opt.alpha == null ? .95 : opt.alpha, style: L.style });
    var n = Math.min(L.per, L.items.length);
    for (var i = 0; i < n; i++) {
      var idx = L.top + i, it = L.items[idx];
      if (!it) continue;
      var y = L.y + 5 + i * (opt.lh || 12);
      var dis = it.dis;
      var txt = it.t;
      var avail = L.w - 12 - (L.fmt ? 30 : 6) - (it.icon ? 8 : 0);
      if (txt != null && F.width(String(txt), 1) > avail) txt = F.fit(String(txt), avail);
      var col = dis ? '#6f7893' : (idx === L.idx ? '#ffe66e' : '#eef3ff');
      G.text(txt, L.x + 12, y, { color: col });
      if (L.fmt) { var r = L.fmt(it, idx); if (r != null) G.text(String(r), L.x + L.w - 6, y, { align: 'right', color: col }); }
      if (it.icon && FF.Assets.icon[it.id]) G.spr(FF.Assets.icon[it.id], L.x + 1, y - 2, { alpha: dis ? .5 : 1 });
      if (idx === L.idx) G.cursor(L.x + 3, y - 1, { color: '#ffe66e' });
    }
  }

  /* ---------------- MENU PRINCIPAL ---------------- */
  UI.openMenu = function () {
    if (UI.menu || UI.dlg) return;
    FF.Game.modal = 'menu';
    var items = [
      { t: 'OBJETS', k: 'item' }, { t: 'MAGIE', k: 'magic' }, { t: 'ÉQUIPEMENT', k: 'equip' },
      { t: 'STATUT', k: 'stat' }, { t: 'EMPLOIS', k: 'job' }, { t: 'ÉQUIPE', k: 'party' },
      { t: 'CRISTAL', k: 'save' }, { t: 'OPTIONS', k: 'config' }
    ];
    if (S.f('ship')) items.push({ t: 'POSER DIRIGEABLE', k: 'land' });
    UI.menu = {
      kind: 'main', who: 0,
      L: list({ items: items, x: 4, y: 4, w: 104, h: items.length * 12 + 8, per: items.length, onSel: function (it) { UI.openSub(it.k); } }),
      P: list({
        items: S.party().map(function (m, i) { return { t: m.name, id: m.id, m: m }; }),
        x: 112, y: 4, w: 124, h: 60, per: 4, onSel: function (it) { UI.menu.who = S.order.indexOf(it.id); UI.closeMenu(); UI.openSub('stat'); }
      })
    };
  };
  UI.closeMenu = function () { UI.menu = null; FF.Game.modal = null; };
  UI.close = function () { UI.menu = null; UI.dlg = null; FF.Game.modal = null; };

  UI.openSub = function (kind) {
    var who = S.members[S.order[UI.menu ? UI.menu.who : 0]];
    if (!who && S.order.length) who = S.members[S.order[0]];
    var m2 = UI.menu;
    if (kind === 'land') { UI.closeMenu(); FF.Wld.land(); return; }
    if (kind === 'save') { UI.closeMenu(); UI.crystal(); return; }
    if (kind === 'config') { UI.closeMenu(); UI.config(); return; }
    if (kind === 'party') { UI.closeMenu(); UI.partyMenu(); return; }
    if (kind === 'job') { UI.closeMenu(); UI.jobMenu(who); return; }
    if (kind === 'item') {
      var items = S.invList(['inv']).filter(function (o) { return o.it.k !== 'key'; }).map(function (o) {
        return { t: o.it.n, id: o.id, c: o.c, dis: o.c <= 0, it: o.it };
      });
      var keys = S.invList(['key']);
      UI.closeMenu();
      UI.menu = {
        kind: 'item', who: UI.whoIdx(who),
        L: list({
          items: items.length ? items : [{ t: '(rien)', dis: true }], x: 4, y: 4, w: 118, h: 108, per: 8,
          fmt: function (it) { return it.c != null ? 'x' + it.c : ''; },
          onSel: function (it) { if (!it.dis) UI.useItem(who, it); }
        })
      };
      return;
    }
    if (kind === 'magic') {
      var sp = Object.keys(who.learn || {}).map(function (id) {
        var s2 = D.SP[id];
        return { t: s2.n, id: id, sp: s2, dis: who.mp < (s2.cost || 0) || !s2.field, cost: s2.cost };
      });
      /* sorts utilisables hors combat seulement */
      sp = sp.filter(function (o) { return o.sp.field; });
      UI.closeMenu();
      UI.menu = {
        kind: 'magic', who: UI.whoIdx(who),
        L: list({ items: sp.length ? sp : [{ t: '(aucun sort utile ici)', dis: true }], x: 4, y: 4, w: 118, h: 108, per: 8, fmt: function (o) { return o.cost || ''; }, onSel: function (o) { if (!o.dis) UI.castField(who, o.sp); } })
      };
      return;
    }
    if (kind === 'equip') { UI.closeMenu(); UI.equipMenu(who); return; }
    if (kind === 'stat') { UI.closeMenu(); UI.statMenu(who); return; }
  };
  UI.whoIdx = function (m) { m = UI.member(m); return m ? S.order.indexOf(m.id) : 0; };
  UI.member = function (x) {
    if (!x) return S.members[S.order[0]];
    if (typeof x === 'object' && x.id) return x;
    if (typeof x === 'number') return S.members[S.order[U.clamp(x | 0, 0, S.order.length - 1)]];
    return S.members[x] || S.members[S.order[0]];
  };

  /* --- objet --- */
  UI.useItem = function (who, o) {
    var it = D.IT[o.id];
    var targets = it.all || it.heal || it.cure ? S.party() : [who];
    UI.menu = {
      kind: 'use', item: o.id, who: who,
      L: list({
        items: targets.map(function (mm) { return { t: mm.name + '  ' + mm.hp + '/' + mm.stats.pv, m: mm, id: mm.id }; }),
        x: 126, y: 4, w: 108, h: 12 + targets.length * 12, per: 8,
        onSel: function (sel) {
          /* P.useItem retire déjà l'objet de l'inventaire */
          var r = FF.P.useItem(sel.m, o.id);
          FF.Snd.play(r.revive ? 'revive' : r.heal ? 'heal' : 'ok');
          var msg = r.revive ? sel.m.name + ' se relève !' : r.heal ? sel.m.name + ' récupère ' + r.heal + ' PV.' : r.mp ? sel.m.name + ' récupère ' + r.mp + ' PM.' : r.cure ? sel.m.name + ' est délivré.' : 'Aucun effet.';
          UI.closeMenu(); UI.dialog([['', msg]]);
        }
      })
    };
  };
  /* --- magie hors combat --- */
  UI.castField = function (who, sp) {
    who = UI.member(who);
    if (!who || !sp) return;
    var cost = sp.cost || 0;
    if (who.mp < cost) { UI.toast('Pas assez de PM pour ' + sp.n + '.'); FF.Snd.play('cancel'); return; }
    var party = S.party().filter(Boolean);
    var isHeal = sp.kind === 'white' && (sp.heal || sp.healp || (sp.pow > 0 && sp.tgt !== 'foe' && sp.tgt !== 'foes' && !sp.dmg && !sp.st));
    var list;
    if (sp.tgt === 'allies') list = party.slice();
    else if (sp.tgt === 'self') list = [who];
    else if (sp.tgt === 'dead') {
      var dead = party.filter(function (m) { return m.hp <= 0; });
      list = dead.length ? dead : [who];
    } else if (isHeal || sp.cure || sp.mp) {
      var cand = party.slice().sort(function (a, b) { return (a.hp / a.stats.pv) - (b.hp / b.stats.pv); });
      list = (who.hp < who.stats.pv ? [who] : [cand[0] || who]);
    } else list = [who];
    who.mp = Math.max(0, who.mp - cost);
    list.forEach(function (m) {
      if (!m) return;
      if (sp.heal || sp.healp || isHeal) {
        var amt = sp.healp ? Math.round(m.stats.pv * sp.healp)
          : (sp.pow ? Math.round(sp.pow * (0.6 + (who.stats.mag || 0) / 115)) : 30);
        m.hp = Math.min(m.stats.pv, m.hp + amt);
      }
      if (sp.mp) m.mp = Math.min(m.stats.pm, m.mp + (sp.mp < 1 ? Math.round(m.stats.pm * sp.mp) : sp.mp));
      if (sp.revive && m.hp <= 0) { m.hp = Math.max(1, Math.round(m.stats.pv * (sp.revive < 1 ? sp.revive : 1))); m.dead = 0; m.status = {}; }
      if (sp.cure) FF.P.cureAll(m);
      if (m.hp > 0) m.dead = 0;
    });
    var names = list.filter(Boolean).map(function (m) { return m.name; });
    FF.Snd.play(isHeal || sp.cure || sp.revive || sp.mp ? 'heal' : 'magic');
    if (G.fx.flash) G.fx.flash(.2, isHeal ? '#9fe8ff' : '#c9a0ff');
    UI.closeMenu();
    UI.dialog([['', who.name + ' lance ' + sp.n + (names.length && names.length < 4 ? ' sur ' + names.join(' et ') + '.' : '!')]]);
  };

  /* --- équipement --- */
  var SLOTS = [['weap', 'Arme'], ['armor', 'Armure'], ['helm', 'Tête'], ['acc', 'Accessoire']];
  UI.equipMenu = function (who) { who = UI.member(who);
    var state = { slot: 0 };
    function build() {
      var pool = [];
      for (var id in S.gear) {
        var it = D.IT[id]; if (!it) continue;
        var slot = it.k === 'weap' ? 'weap' : it.k;
        if (slot !== SLOTS[state.slot][0]) continue;
        pool.push({ id: id, t: it.n, it: it, c: S.gear[id], on: who.equip[slot] === id, ok: FF.P.canEquip(who, it) });
      }
      pool.push({ id: null, t: '(rien retirer)', it: null });
      pool.sort(function (a, b) { return (b.it ? (b.it.atk || 0) + (b.it.def || 0) + (b.it.mdef || 0) : 0) - (a.it ? (a.it.atk || 0) + (a.it.def || 0) + (a.it.mdef || 0) : 0); });
      return pool;
    }
    function refresh() {
      UI.menu = {
        kind: 'equip', who: who, slot: state.slot,
        slots: list({
          items: SLOTS.map(function (s, i) {
            var cur = who.equip[s[0]];
            return { t: s[1] + ' : ' + (cur ? D.IT[cur].n : '—'), i: i };
          }), x: 4, y: 4, w: 132, h: 56, per: 4,
          onSel: function (o) { state.slot = o.i; refresh(); }
        }),
        L: list({
          items: build(), x: 4, y: 64, w: 132, h: 92, per: 7,
          fmt: function (o) { return o.id ? (o.on ? 'É' : (o.ok ? '' : '✕')) : ''; },
          onSel: function (o) {
            if (!o.id) { FF.P.unequip(who, SLOTS[state.slot][0]); FF.Snd.play('ok'); }
            else if (!o.ok) { FF.Snd.play('cancel'); UI.toast(who.name + ' ne peut pas porter ça.'); return; }
            else { FF.P.equip(who, o.id); FF.Snd.play('ok'); }
            refresh();
          }
        }),
        info: who
      };
    }
    refresh();
  };
  UI.toast = function (t) { UI._toast = { t: t, life: 1.8 }; };

  /* --- statut --- */
  UI.statMenu = function (who) { who = UI.member(who);
    UI.menu = { kind: 'stat', who: who, x: 4, y: 4 };
  };
  UI.statDraw = function (st) {
    var m = st.who;
    G.win(4, 4, G.W - 8, G.H - 8);
    G.spr(FF.Assets.portrait[m.id], 10, 10, { scale: 1 });
    G.text(m.name, 50, 12, { color: '#ffe6a8' });
    G.text(D.JOBS[m.job].n + '  Niv ' + m.lv, 50, 24);
    G.text('PV ' + m.hp + '/' + m.stats.pv, 50, 36, { color: m.hp / m.stats.pv < .3 ? '#ff8a8a' : '#9fff9f' });
    G.text('PM ' + m.mp + '/' + m.stats.pm, 50, 48, { color: '#9fc8ff' });
    G.text('PE ' + U.num(m.exp) + ' / ' + U.num(D.expFor(m.lv + 1)), 50, 60, { color: '#cfd8e6' });
    var y = 76;
    D.STATS.forEach(function (k, i) {
      G.text(D.STATN[k], 12, y + i * 11);
      G.text(String(m.stats.raw[k]), 62, y + i * 11, { align: 'right', color: '#eef3ff' });
    });
    var x2 = 100;
    [['ATTAQUE', m.stats.atk], ['DÉFENSE', m.stats.def], ['M. DÉFENSE', m.stats.mdef], ['MAGIE', m.stats.mag], ['VITESSE', m.stats.spd], ['ESQUIVE', m.stats.eva + '%'], ['CRITIQUE', m.stats.crit + '%']].forEach(function (o, i) {
      G.text(o[0], x2, 12 + i * 11);
      G.text(String(o[1]), x2 + 62, 12 + i * 11, { align: 'right', color: '#eef3ff' });
    });
    var yy = y + 5 * 11 + 6;
    var sl = { weap: 'Arme', armor: 'Armure', helm: 'Casque', acc: 'Acc.' };
    var ix = 10;
    ['weap', 'armor', 'helm', 'acc'].forEach(function (k, i) {
      var cur = m.equip[k];
      G.text(sl[k] + ' :', ix, yy + i * 10, { color: '#8fa0c9' });
      if (cur) { G.spr(FF.Assets.icon[cur], ix + 40, yy + i * 10 - 2, {}); G.text(D.IT[cur].n, ix + 58, yy + i * 10); }
    });
    G.text(D.CAST[m.id] ? D.CAST[m.id].bio : '', G.W / 2, G.H - 18, { align: 'center', color: '#9fb3ff' });
  };

  /* --- emplois --- */
  UI.jobMenu = function (who) { who = UI.member(who);
    var unlocked = D.JOBORDER.filter(function (j) { return S.jobUnlocked(j); });
    function refresh() {
      UI.menu = {
        kind: 'job', who: who,
        L: list({
          items: unlocked.map(function (j) {
            var J = D.JOBS[j];
            return { t: J.n, id: j, on: who.job === j, dis: !S.jobUnlocked(j), jl: who.jlv[j] || 0 };
          }), x: 4, y: 4, w: 118, h: 118, per: 9,
          fmt: function (o) { return o.jl ? 'N' + o.jl : ''; },
          onSel: function (o) {
            if (o.on) { FF.Snd.play('cancel'); return; }
            FF.P.changeJob(who, o.id);
            FF.Snd.play('level');
            UI.toast(who.name + ' devient ' + D.JOBS[o.id].n + '.');
            refresh();
          }
        }),
        info: D.JOBS[unlocked[UI.menu ? UI.menu.L.idx : 0]]
      };
    }
    refresh();
  };
  /* --- équipe --- */
  UI.partyMenu = function () {
    function refresh() {
      var items = S.allMembers().map(function (m, i) {
        return { t: (S.order.indexOf(m.id) >= 0 ? '• ' : '  ') + m.name + ' ' + m.lv, id: m.id, m: m, i: i };
      });
      UI.menu = {
        kind: 'party',
        L: list({
          items: items, x: 4, y: 4, w: 116, h: 116, per: 9,
          onSel: function (o) {
            var cur = S.order.indexOf(o.id);
            if (cur >= 0 && S.order.length > 1) { S.leave(o.id); }
            else { S.join(o.id); }
            FF.Snd.play('ok');
            refresh();
          }
        })
      };
    }
    refresh();
  };

  /* ---------------- CRISTAL (sauvegarde / soin / emploi) ---------------- */
  UI.crystal = function () {
    FF.Snd.play('crystal');
    var opts = [
      { t: 'REPOS COMPLET', k: 'heal' },
      { t: 'SAUVEGARDER', k: 'save' },
      { t: 'CHANGER D’EMPLOI', k: 'job' },
      { t: 'COMPOSITION DE L’ÉQUIPE', k: 'party' },
      { t: 'QUITTER', k: 'x' }
    ];
    UI.menu = {
      kind: 'crystal',
      L: list({
        items: opts, x: G.W / 2 - 62, y: 30, w: 124, h: opts.length * 12 + 8, per: opts.length,
        onSel: function (o) {
          if (o.k === 'heal') {
            S.allMembers().forEach(function (m) { if (m) FF.P.healFull(m); });
            FF.Snd.play('heal'); G.flash(.3, '#9fe8ff');
            UI.closeMenu(); UI.dialog([['', 'La lumière du cristal referme vos blessures.']]);
          } else if (o.k === 'save') { UI.saveScreen('save'); }
          else if (o.k === 'job') { UI.closeMenu(); UI.jobMenu(S.members[S.order[0]]); }
          else if (o.k === 'party') { UI.closeMenu(); UI.partyMenu(); }
          else UI.closeMenu();
        }
      })
    };
    G.fx.flash(.25, '#9fe8ff');
  };

  /* ---------------- BOUTIQUE ---------------- */
  UI.shop = function (e) {
    var shop = D.SHOPS[e.shop] || { arms: [], obj: [] };
    var ids = (e.kind === 'arms' ? shop.arms : shop.obj) || [];
    var mode = 'buy';
    function items() {
      if (mode === 'buy') {
        return ids.map(function (id) {
          var it = D.IT[id]; if (!it) return null;
          var canBuy = S.gils >= it.price;
          return { t: it.n, id: id, price: it.price, dis: !canBuy, it: it };
        }).filter(Boolean);
      }
      var pool = S.invList(['inv', 'gear']).filter(function (o) { return D.IT[o.id] && D.IT[o.id].price; });
      return pool.map(function (o) { return { t: o.n, id: o.id, price: Math.floor(D.IT[o.id].price / 2), c: o.c, it: D.IT[o.id] }; });
    }
    function refresh() {
      var L = items();
      UI.menu = {
        kind: 'shop', mode: mode,
        head: shop.nom + '  —  ' + U.num(S.gils) + ' G',
        L: list({
          items: L.length ? L : [{ t: '(rien en rayon)', dis: true }], x: 4, y: 22, w: 150, h: 130 > G.H - 26 ? G.H - 26 : 100, per: 7,
          fmt: function (o) { return (o.price ? U.num(mode === 'buy' ? o.price : -o.price) : '') + (o.c ? ' x' + o.c : ''); },
          onSel: function (o) {
            if (!o.id) return;
            if (mode === 'buy') {
              if (S.gils < o.price) { FF.Snd.play('cancel'); UI.toast('Pas assez de gils.'); return; }
              S.gil(-o.price); S.add(o.id, 1); FF.Snd.play('buy'); UI.toast('Acheté : ' + o.it.n + '.');
            } else {
              var half = Math.floor((o.it.price || 0) / 2);
              S.remove(o.id, 1); S.gil(half); FF.Snd.play('gil'); UI.toast('Vendu : ' + o.it.n + ' (+' + half + ' G)');
            }
            refresh();
          }
        }),
        tabs: list({
          items: [{ t: 'ACHETER' }, { t: 'VENDRE' }], x: 4, y: 4, w: 150, h: 16, per: 1, cols: 2,
          onSel: function (o) { mode = o.t === 'ACHETER' ? 'buy' : 'sell'; refresh(); }
        })
      };
    }
    UI.dialog([['', e.greet || ('Bienvenue chez ' + (shop.nom || 'le marchand') + '.')]], {});
    UI._shopAfter = refresh;
    UI._afterDialog = refresh;
  };

  /* ---------------- AUBERGE ---------------- */
  UI.inn = function (e) {
    var town = (FF.Wld && FF.Wld.town) ? FF.Wld.town() : null;
    var price = e.inn || (D.INN && (D.INN[town] || D.INN.aurelia)) || 80;
    UI.dialog([['', 'Une nuit au chaud : ' + price + ' gils. On paie d’avance, on ne pleure pas après.']]);
    UI._afterDialog = function () {
      UI.menu = {
        kind: 'inn',
        L: list({
          items: [{ t: 'PRENDRE UNE CHAMBRE (' + price + ' G)', k: 1 }, { t: 'SIMPLEMENT SE REPOSER (0 G)', k: 2 }, { t: 'REFUSER', k: 0 }],
          x: G.W / 2 - 78, y: 40, w: 156, h: 44, per: 3,
          onSel: function (o) {
            if (UI.menu) UI.menu.keep = 1;
            if (!o.k) { UI.closeMenu(); return; }
            if (o.k === 1 && S.gils < price) { UI.toast('Pas assez de gils.'); FF.Snd.play('cancel'); return; }
            if (o.k === 1) S.gil(-price);
            S.allMembers().forEach(function (m) { if (m) FF.P.healFull(m); });
            UI.closeMenu();
            FF.Snd.play('heal');
            G.fx.flash(.5, '#ffe6a8');
            UI.dialog([['', 'Vous dormez profondément. PV et PM sont au maximum.']]);
          }
        })
      };
    };
  };

  /* ---------------- SAUVEGARDE / CHARGEMENT ---------------- */
  UI.saveScreen = function (mode) {
    var slots = ['1', '2', '3', 'auto'];
    function refresh() {
      var items = slots.map(function (k) {
        var mt = FF.Save.meta ? FF.Save.meta(k) : null;
        return { t: 'Casier ' + (k === 'auto' ? 'Auto' : k), id: k, meta: mt, dis: mode === 'load' && !mt };
      });
      UI.menu = {
        kind: 'save', mode: mode,
        L: list({
          items: items, x: 20, y: 30, w: 200, h: items.length * 16 + 10, per: items.length,
          fmt: function (o) { return o.meta ? ('Niv ' + o.meta.lv + ' · ' + U.num(o.meta.gils) + 'G') : '—'; },
          onSel: function (o) {
            if (mode === 'save') {
              var ok = FF.Save.save(o.id);
              UI.closeMenu();
              UI.dialog([['', ok ? 'Sauvegardé dans le casier ' + (o.id === 'auto' ? 'automatique' : o.id) + '.' : 'Échec de la sauvegarde (stockage plein ?).']]);
            } else {
              if (FF.Save.load(o.id)) {
                UI.closeMenu();
                FF.Game.reload();
                UI.toast('Chargé.');
              } else { FF.Snd.play('cancel'); UI.toast(FF.S.lastErr === 'ver' ? 'Sauvegarde d’une autre version.' : 'Casier vide.'); }
            }
          }
        })
      };
    }
    refresh();
  };

  /* ---------------- CONFIG ---------------- */
  UI.config = function () {
    function refresh() {
      var st = S.settings;
      UI.menu = {
        kind: 'config',
        L: list({
          items: [
            { t: 'Rencontres : ' + (st.encounters ? 'OUI' : 'NON'), k: 'enc' },
            { t: 'Vitesse de texte : ' + ({ .5: 'LENTE', 1: 'NORMALE', 2: 'RAPIDE', 4: 'TRÈS RAPIDE' }[st.textSpeed] || 'NORMALE'), k: 'spd' },
            { t: 'Secousses : ' + (st.shake ? 'OUI' : 'NON'), k: 'shake' },
            { t: 'Scanlines : ' + (st.scan === 0 ? 'NON' : 'OUI'), k: 'scan' },
            { t: 'Vignette : ' + (st.vig === 0 ? 'NON' : 'OUI'), k: 'vig' },
            { t: 'Masquer les boutons tactiles : ' + (st.padHidden ? 'OUI' : 'NON'), k: 'pad' },
            { t: 'Musique : ' + (FF.Snd.settings.muted ? 'COUPÉE' : 'ON'), k: 'mute' },
            { t: 'Volume musique : ' + Math.round(FF.Snd.settings.musVol * 100) + '%', k: 'mus' },
            { t: 'Volume effets : ' + Math.round(FF.Snd.settings.sfxVol * 100) + '%', k: 'sfx' },
            { t: 'Charger une partie', k: 'load' },
            { t: 'Retour', k: 'x' }
          ], x: 20, y: 10, w: 200, h: 11 * 12 + 8, per: 11,
          onSel: function (o) {
            if (o.k === 'enc') st.encounters = st.encounters ? 0 : 1;
            else if (o.k === 'spd') st.textSpeed = ({ .5: 1, 1: 2, 2: 4, 4: .5 })[st.textSpeed] || 1;
            else if (o.k === 'shake') st.shake = st.shake ? 0 : 1;
            else if (o.k === 'scan') st.scan = st.scan === 0 ? 1 : 0;
            else if (o.k === 'vig') st.vig = st.vig === 0 ? 1 : 0;
            else if (o.k === 'pad') st.padHidden = !st.padHidden;
            else if (o.k === 'mute') FF.Snd.toggleMute();
            else if (o.k === 'mus') FF.Snd.setVol('musVol', (FF.Snd.settings.musVol + .25) % 1.25);
            else if (o.k === 'sfx') FF.Snd.setVol('sfxVol', (FF.Snd.settings.sfxVol + .25) % 1.25);
            else if (o.k === 'load') { UI.closeMenu(); UI.saveScreen('load'); return; }
            else if (o.k === 'x') { UI.closeMenu(); return; }
            FF.Save.savePrefs && FF.Save.savePrefs();
            FF.Snd.savePrefs();
            if (FF.Game && FF.Game.applyFx) FF.Game.applyFx(); else FF.Gfx.resize();
            refresh();
          }
        })
      };
    }
    refresh();
  };

  /* ---------------- UPDATE / DRAW ---------------- */
  UI.update = function (dt) {
    /* un dialogue disparu sans closeDialog ne doit pas laisser le jeu en mode « modal » */
    if (FF.Game.modal === 'dialog' && !UI.dlg) FF.Game.modal = null;
    if (UI._toast) { UI._toast.life -= dt; if (UI._toast.life <= 0) UI._toast = null; }
    if (UI.dlg) { UI.updateDialog(dt); return; }
    var M = UI.menu;
    if (!M) return;
    if (In.pressed('b') || In.pressed('menu')) {
      if (M.kind === 'equip' || M.kind === 'stat' || M.kind === 'job' || M.kind === 'party' || M.kind === 'item' || M.kind === 'magic' || M.kind === 'use') {
        if (M.kind === 'stat') { UI.closeMenu(); UI.openMenu(); UI.menu.sub = 'stat'; return; }
        UI.closeMenu(); UI.openMenu(); return;
      }
      UI.closeMenu(); FF.Snd.play('cancel'); return;
    }
    if (M.L) { nav(M.L); if (In.pressed('a')) { var it = M.L.items[M.L.idx]; if (it && !it.dis && M.L.onSel) M.L.onSel(it, M.L.idx); else FF.Snd.play('cancel'); } }
    if (M.slots) { nav(M.slots); if (In.pressed('a')) M.slots.onSel(M.slots.items[M.slots.idx]); }
    if (M.tabs) { nav(M.tabs); if (In.pressed('a')) M.tabs.onSel(M.tabs.items[M.tabs.idx]); }
    if (M.kind === 'stat' && (In.tap('left') || In.tap('right'))) {
      var d = In.tap('right') ? 1 : -1;
      var i = S.order.indexOf(M.who.id);
      var ni = (i + d + S.order.length) % S.order.length;
      M.who = S.members[S.order[ni]];
    }
  };
  UI.draw = function () {
    var M = UI.menu;
    if (UI._toast) {
      var w = F.width(UI._toast.t) + 12;
      G.win(G.W - w - 4, G.H - 20, w, 16);
      G.text(UI._toast.t, G.W - w + 2, G.H - 17, { color: '#ffe6a8' });
    }
    if (!M) return;
    if (M.kind === 'main') {
      drawList(M.L);
      /* aperçu équipe */
      G.win(100, 4, 136, 60);
      S.party().forEach(function (m, i) {
        if (!m) return;
        var y = 9 + i * 14;
        G.spr(FF.Assets.portrait[m.id], 103, y - 3, {});
        G.text(m.name, 124, y, { color: i === M.who ? '#ffe66e' : '#eef3ff' });
        G.text(m.hp + '/' + m.stats.pv, 232, y, { align: 'right', color: m.hp / m.stats.pv < .3 ? '#ff8a8a' : '#cfd8e6' });
        G.rect(124, y + 8, 60, 2, '#0a0d18');
        G.rect(124, y + 8, Math.round(60 * U.clamp(m.hp / m.stats.pv, 0, 1)), 2, '#7ad06a');
      });
      var sel = S.members[S.order[M.who]];
      if (sel) {
        G.win(100, 68, 136, 88);
        G.text(D.JOBS[sel.job].n + '  Niv ' + sel.lv, 106, 73, { color: '#ffe6a8' });
        G.text('PV ' + sel.hp + '/' + sel.stats.pv + '   PM ' + sel.mp + '/' + sel.stats.pm, 106, 85);
        var lines = F.lines(D.JOBS[sel.job].d, 118);
        lines.forEach(function (l, i) { G.text(l, 106, 97 + i * 11, { color: '#9fb3ff' }); });
        var yy = 97 + lines.length * 11 + 4;
        G.text('ATK ' + sel.stats.atk + '  DEF ' + sel.stats.def, 106, yy, { color: '#cfd8e6' });
        G.text('MAG ' + sel.stats.mag + '  VIT ' + sel.stats.spd, 106, yy + 11, { color: '#cfd8e6' });
        G.text('Prochain niv. : ' + U.num(Math.max(0, D.expFor(sel.lv + 1) - sel.exp)) + ' PE', 106, yy + 22, { color: '#8fa0c9' });
      }
      return;
    }
    if (M.kind === 'stat') { UI.statDraw(M); return; }
    if (M.kind === 'equip') {
      drawList(M.slots, { alpha: .95 });
      drawList(M.L);
      var m2 = M.who;
      G.win(140, 4, 96, 108);
      G.text('ATT ' + m2.stats.atk, 145, 10);
      G.text('DEF ' + m2.stats.def, 145, 22);
      G.text('MDEF ' + m2.stats.mdef, 145, 34);
      G.text('MAG ' + m2.stats.mag, 145, 46);
      G.text('VIT ' + m2.stats.spd, 145, 58);
      var cur = M.L.items[M.L.idx];
      if (cur && cur.it) {
        var txt = [];
        if (cur.it.atk) txt.push('+' + cur.it.atk + ' attaque');
        if (cur.it.def) txt.push('+' + cur.it.def + ' déf.');
        if (cur.it.mdef) txt.push('+' + cur.it.mdef + ' m.déf.');
        if (cur.it.elem) txt.push('Élément : ' + D.ELEM[cur.it.elem].n);
        if (cur.it.st) txt.push('État : ' + D.STATUS[cur.it.st].n);
        if (cur.it.sp) for (var k in cur.it.sp) txt.push((D.STATN[k] || k) + ' +' + cur.it.sp[k]);
        if (cur.it.imm) txt.push('immunisé');
        txt.forEach(function (t, i) { G.text(t, 145, 74 + i * 10, { color: '#ffe6a8' }); });
      }
      return;
    }
    if (M.kind === 'shop') {
      G.win(4, 4, 150, 16);
      G.text(M.head, 10, 8, { color: '#ffe6a8' });
      drawList(M.tabs);
      drawList(M.L);
      var o = M.L.items[M.L.idx];
      G.win(158, 4, 78, 120);
      if (o && o.it) {
        G.spr(FF.Assets.icon[o.id], 164, 10, {});
        var d2 = o.it.d || '';
        F.lines(d2, 70).forEach(function (l, i) { G.text(l, 162, 30 + i * 11, { color: '#cfd8e6' }); });
        if (o.it.atk) G.text('ATK +' + o.it.atk, 162, 80);
        if (o.it.def) G.text('DEF +' + o.it.def, 162, 92);
        if (o.it.mdef) G.text('M.DEF +' + o.it.mdef, 162, 104);
      }
      return;
    }
    if (M.L) drawList(M.L, { lh: M.kind === 'crystal' ? 12 : 12 });
    if (M.kind === 'job') {
      var it2 = M.L.items[M.L.idx];
      if (it2 && D.JOBS[it2.id]) {
        G.win(126, 4, 110, 118);
        var j = D.JOBS[it2.id];
        F.lines(j.d, 100).forEach(function (l, i) { G.text(l, 132, 12 + i * 11, { color: '#cfd8e6' }); });
        var yy2 = 16 + F.lines(j.d, 100).length * 11;
        G.text('Équipement :', 132, yy2 + 4, { color: '#8fa0c9' });
        var eqs = (j.eq || []).slice(0, 8);
        G.text(eqs.join(', '), 132, yy2 + 15, { color: '#9fb3ff' });
        var kinds = Object.keys(j.learn || {});
        var yy3 = yy2 + 30;
        kinds.forEach(function (k3, i) {
          var tiers = D.TIER[k3] || [];
          var need = j.learn[k3];
          for (var i3 = 0; i3 < Math.min(3, tiers.length); i3++) {
            G.text(D.SP[tiers[i3]].n + ' N' + (need[i3] || '-'), 132, yy3 + (i * 3 + i3) * 10, { color: '#eef3ff' });
          }
        });
      }
      return;
    }
    if (M.kind === 'item' || M.kind === 'magic' || M.kind === 'use') {
      var oo = M.L.items[M.L.idx];
      if (oo) {
        G.win(126, 4, 110, 60);
        var desc = (oo.it && (oo.it.d || '')) || (oo.sp && (oo.sp.d || '')) || '';
        F.lines(desc, 100).forEach(function (l, i) { G.text(l, 132, 10 + i * 11, { color: '#cfd8e6' }); });
        if (oo.sp) {
          G.text('Coût : ' + (oo.sp.cost || 0) + ' PM', 132, 40, { color: '#9fc8ff' });
          if (oo.sp.elem) G.text('Élément : ' + D.ELEM[oo.sp.elem].n, 132, 51, { color: (D.ELEM[oo.sp.elem] || {}).c || '#fff' });
        }
      }
      var who = M.who && M.who.id ? M.who : S.members[S.order[0]];
      if (who) {
        G.win(126, 68, 110, 40);
        G.spr(FF.Assets.portrait[who.id], 130, 72, {});
        G.text(who.name + '  Niv ' + who.lv, 152, 74, { color: '#ffe6a8' });
        G.text('PV ' + who.hp + '/' + who.stats.pv, 152, 86);
        G.text('PM ' + who.mp + '/' + who.stats.pm, 152, 98, { color: '#9fc8ff' });
      }
      G.text('GILS : ' + U.num(S.gils), 4, G.H - 14, { color: '#ffd257' });
    }
  };
  UI.list = list; UI.drawList = drawList; UI.nav = nav;
})(this.FF = this.FF || {});
