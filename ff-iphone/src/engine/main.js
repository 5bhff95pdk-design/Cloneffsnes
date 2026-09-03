/* ============================================================
   Game — amorçage, boucle, titres, enchaînement des scènes
   ============================================================ */
(function (FF) {
  'use strict';
  var U = FF.U, G = FF.Gfx, D = FF.D, S = FF.S, In = FF.In;
  var Game = FF.Game = {};
  var F = FF.Font;

  Game.state = 'boot';
  Game.modal = null;
  Game.noEnc = false;
  Game.lastSave = null;
  var raf = null, last = 0, acc = 0, pendingBoot = null;

  /* ---------- amorçage ---------- */
  Game.boot = function (canvas) {
    G.init(canvas);
    F.build();
    In.init();
    FF.Bake.buildThemes();
    var t0 = performance.now();
    var ms = FF.Assets.build();
    FF.Dun.all();
    Game.bootMs = Math.round(performance.now() - t0);
    Game.state = 'title';
    Game.titleIdx = 0;
    console.log('Cuisson des sprites : ' + ms + ' ms · cartes : ' + Object.keys(D.MAPS).length);
    try {
      if (navigator.serviceWorker && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () { });
    } catch (e) { }
    return true;
  };

  /* ---------- boucle ---------- */
  Game.frame = function (ts) {
    raf = requestAnimationFrame(Game.frame);
    var dt = Math.min(.05, ((ts || 0) - last) / 1000 || 0);
    last = ts || 0;
    if (In.turbo) dt *= 1.8;
    G.time += dt;
    try { Game.step(dt); } catch (e) {
      console.error('Erreur de frame', e);
      Game.error = e;
    }
    G.present();
    In.endFrame();
  };
  Game.step = function (dt) {
    In.update(dt);
    G.updateFx(dt);
    if (FF.S.playTick) FF.S.playTick(dt);
    if (Wo.placeT > 0) Wo.placeT = Math.max(0, Wo.placeT - dt);
    switch (Game.state) {
      case 'title': Game.updateTitle(dt); break;
      case 'field':
        if (Game.modal && !UI.dlg && !UI.menu) Game.modal = null;
        if (UI.dlg) UI.update(dt);
        else if (UI.menu) { UI.update(dt); }
        else { FF.Wld.update(dt); UI.update(dt); }
        break;
      case 'battle':
        if (FF.Bat.st) FF.Bat.update(dt);
        break;
      case 'over': Game.updateOver(dt); break;
      case 'credits': Game.updateCredits(dt); break;
    }
    G.updateParts(dt);
    Game.draw();
  };
  var Wo = FF.Wld, UI = FF.UI;

  Game.draw = function () {
    switch (Game.state) {
      case 'title': Game.drawTitle(); break;
      case 'field':
        FF.Wld.draw();
        UI.drawDialog();
        UI.draw();
        break;
      case 'battle': FF.Bat.draw(); break;
      case 'over': Game.drawOver(); break;
      case 'credits': Game.drawCredits(); break;
    }
    if (Game.error) {
      G.win(6, G.H - 26, G.W - 12, 20, { style: 1 });
      G.text('Erreur : ' + String(Game.error.message || Game.error).slice(0, 42), 10, G.H - 22, { color: '#ff9a9a' });
    }
  };

  /* ---------------- TITRE ---------------- */
  Game.updateTitle = function (dt) {
    Game.tt = (Game.tt || 0) + dt;
    var opts = Game.titleOpts();
    if (In.tap('up', [.25, .12])) Game.titleIdx = (Game.titleIdx + opts.length - 1) % opts.length;
    if (In.tap('down', [.25, .12])) Game.titleIdx = (Game.titleIdx + 1) % opts.length;
    if (In.pressed('a')) { Game.titlePick(opts[Game.titleIdx]); }
  };
  /* casiers dont la partie est ALLÉE AU BOUT (le New Game + repose dessus) */
  Game.clearedSlots = function () {
    return ['1', '2', '3', 'auto'].filter(function (k) {
      try { var m = FF.Save.meta(k); return !!(m && m.cleared); } catch (e) { return false; }
    });
  };
  Game.titleOpts = function () {
    var o = [];
    o.push({ t: 'NOUVELLE PARTIE', k: 'new' });
    if (Game.clearedSlots().length) o.push({ t: 'NOUVELLE PARTIE + (niveaux conservés)', k: 'ngp' });
    var any = ['1', '2', '3', 'auto'].some(function (k) { try { return !!FF.Save.meta(k); } catch (e) { return false; } });
    if (any) o.push({ t: 'CONTINUER', k: 'continue' });
    o.push({ t: 'SALON DES CRISTAUX (choix du casier)', k: 'load' });
    o.push({ t: 'OPTIONS AUDIO', k: 'audio' });
    return o;
  };
  Game.titlePick = function (o) {
    if (!o) return;
    FF.Snd.play('ok');
    if (o.k === 'new') { Game.newGame(); }
    else if (o.k === 'ngp') { Game.newGamePlus(); }
    else if (o.k === 'continue') {
      var pick = ['1', '2', '3', 'auto'].filter(function (k) { return !!FF.Save.meta(k); })[0];
      if (FF.Save.load(pick)) Game.reload();
    } else if (o.k === 'load') { Game.state = 'field'; UI.saveScreen('load'); Game.titleLoad = 1; }
    else if (o.k === 'audio') { FF.Snd.toggleMute(); }
  };
  Game.drawTitle = function () {
    var g = G.ctx;
    G.gradRect(0, 0, G.W, G.H, '#070b1c', '#132043');
    /* étoiles */
    var r = U.rng(7);
    for (var i = 0; i < 90; i++) {
      var x = r() * G.W, y = r() * G.H * .7;
      var tw = .4 + .6 * Math.abs(Math.sin(G.time * (0.6 + r() * 2) + i));
      g.fillStyle = 'rgba(200,225,255,' + tw.toFixed(2) + ')';
      g.fillRect(x | 0, y | 0, 1, 1);
    }
    /* cristaux flottants */
    for (i = 0; i < 4; i++) {
      var cx = 40 + i * 54, cy = 96 + Math.sin(G.time * 1.1 + i * 1.7) * 5;
      var col = ['#6fe3ff', '#ff8a3d', '#8fd66a', '#b06fff'][i];
      drawCrystal(cx, cy, col, 1 + Math.sin(G.time + i) * .04);
    }
    /* sol */
    g.fillStyle = '#0b1327';
    for (var x2 = 0; x2 < G.W; x2++) {
      var h2 = 18 + Math.sin(x2 * .06 + 1.2) * 6;
      g.fillRect(x2, G.H - h2, 1, h2);
    }
    G.text('LES QUATRE', G.W / 2, 34, { align: 'center', color: '#eaf2ff', scale: 1 });
    G.text('CRISTAUX', G.W / 2, 50, { align: 'center', color: '#ffe6a8' });
    g.fillStyle = '#ffd257';
    g.fillRect(G.W / 2 - 40, 64, 80, 1);
    G.text('un conte de 16 bits, pour iPhone', G.W / 2, 70, { align: 'center', color: '#9fb3ff' });
    /* menu */
    var opts = Game.titleOpts();
    var yy = opts.length >= 5 ? 92 : 112;
    opts.forEach(function (o, i) {
      G.text(o.t, G.W / 2, yy + i * 12, { align: 'center', color: i === Game.titleIdx ? '#ffe66e' : '#cfd8e6' });
    });
    G.text('Clavier : flèches + Z/X — Tactile : boutons à l’écran', G.W / 2, G.H - 10, { align: 'center', color: '#5f6f95' });
    var v = 'v1.0 · ' + (S.play ? 'reprise' : 'nouvelle');
    G.text(v, 4, 4, { color: '#41507a' });
  };
  function drawCrystal(x, y, col, s) {
    var g = G.ctx, h = 14 * s, w = 9 * s;
    for (var i = 0; i < h * 2; i++) {
      var k = Math.abs(i - h) / h;
      var ww = Math.round(w * (1 - k * .8));
      g.fillStyle = U.shade(col, .6 + .7 * (1 - k));
      g.fillRect(Math.round(x - ww / 2), Math.round(y - h + i), Math.max(1, ww), 1);
    }
    g.fillStyle = 'rgba(255,255,255,.7)';
    g.fillRect(Math.round(x - 1), Math.round(y - h + 3), 1, Math.round(h * .8));
  }

  /* ---------------- NOUVELLE PARTIE ---------------- */
  Game.newGame = function () {
    FF.P.newGame();
    Game.beginNewRun();
  };
  /* début d'une run : pose le joueur à Aurélia puis lance la scène d'intro */
  Game.beginNewRun = function () {
    Game.state = 'field';
    UI.menu = null; UI.dlg = null;
    Game.noEnc = true;
    FF.Wld.enter('aurelia', 15, 20, 'down');
    Wo.placeT = 0;
    G.fx.fade = 1; G.fadeTo(0, 1.6);
    setTimeout(function () { FF.Wld.play(D.STARTSCENE, function () { Game.noEnc = false; }); }, 250);
  };
  /* Nouvelle Partie + : reprend les niveaux/emplois/esprits d'une partie finie */
  Game.newGamePlus = function () {
    var slots = Game.clearedSlots();
    if (!slots.length) { Game.newGame(); return; }
    /* on prend la partie finie la plus avancée (plus haute somme de niveaux) */
    var best = slots.slice().sort(function (a, b) { return ((FF.Save.meta(b) || {}).lv || 0) - ((FF.Save.meta(a) || {}).lv || 0); })[0];
    var carried = null;
    if (FF.Save.load(best)) carried = FF.P.captureCarry();
    if (!carried) { Game.newGame(); return; }
    FF.P.newGameCarry(carried);
    Game.beginNewRun();
    FF.Save.save('auto');
  };
  Game.reload = function () {
    Game.state = 'field';
    UI.menu = null; UI.dlg = null;
    FF.Wld.enter(S.loc.map, S.loc.x, S.loc.y, S.loc.dir || 'down');
    G.fx.fade = 1; G.fadeTo(0, 2.5);
    FF.Snd.playMusic(Wo.map.music || 'world');
    Game.titleLoad = 0;
  };
  Game.onStateLoad = function () {
    S.order.forEach(function (id) {
      var m = S.members[id]; if (!m) return;
      FF.P.recalc(m);
      m.hp = U.clamp(m.hp, 0, m.stats.pv); m.mp = U.clamp(m.mp, 0, m.stats.pm);
    });
  };

  /* ---------------- COMBAT ---------------- */
  Game.battle = function (opts) {
    if (Game.state === 'battle') return;
    Game.prevMusic = FF.Snd.musicName();
    Game.state = 'battle';
    UI.menu = null; UI.dlg = null;
    /* on CONSERVE les callbacks de l'appelant (bossgate, scènes) :
       le moteur les invoque APRÈS son propre traitement */
    var ow = opts.onWin || null, ol = opts.onLose || null, oe = opts.onEscape || null;
    opts.onWin = function (res) { Game.endBattle(res, 'win', opts); if (ow) ow(res); };
    opts.onLose = function () { Game.gameOver(); if (ol) ol(); };
    opts.onEscape = function () { Game.endBattle(null, 'flee'); if (oe) oe(); };
    FF.Bat.start(opts);
  };
  Game.endBattle = function (res, how, opts) {
    Game.state = 'field';
    var st = null;
    if (how === 'win') Game.applyVictory(res, opts);
    FF.Bat.st = null;
    if (Wo.map.enc && res && res.exp) Wo.placeT = 0;
    FF.Snd.playMusic(Wo.map.music || 'world');
    Game.noEnc = false;
    G.fadeTo(0, 2.2);
  }
  Game.applyVictory = function (res, opts) {
    var wins = [];
    (res.mon || []).forEach(function (id) {
      var mo = D.MON[id]; if (!mo || !mo.win) return;
      var w = mo.win;
      if (w.it) { S.add(w.it, 1); wins.push('Obtenu : ' + (D.IT[w.it] ? D.IT[w.it].n : w.it)); }
      if (w.job && !S.jobs[w.job]) { S.jobs[w.job] = 1; wins.push('Nouvel emploi : ' + D.JOBS[w.job].n); }
      if (w.spell) { S.order.forEach(function (mid) { var mm = S.members[mid]; if (mm) { mm.gifted = (mm.gifted || []).concat([w.spell]); FF.P.recalc(mm); } }); wins.push('Sort appris : ' + D.SP[w.spell].n); }
      if (w.summon) { S.summons[w.summon] = 1; wins.push('Esprit lié : ' + D.SP[w.summon].n); }
      if (w.ability) { }
    });
    if (res.levels && res.levels.length) {
      res.levels.forEach(function (l) {
        wins.push(l.name + ' atteint le niveau ' + l.ups[l.ups.length - 1].lv + ' !');
        l.ups.forEach(function (u) { (u.learned || []).forEach(function (sid) { wins.push(l.name + ' apprend ' + D.SP[sid].n + '.'); }); });
      });
      FF.Snd.play('level');
    }
    if (wins.length) {
      if (opts && opts.script) UI.toast(wins.join(' · '));
      else UI.dialog(wins.map(function (w) { return ['', w]; }));
    }
  };
  Game.afterBoss = function (gate) {
    /* si un donjon avait une scène prévue, on la déclenche sinon simple toast */
    var cfg = D.DUNGEONS[Wo.map.dungeon];
    if (cfg && cfg.sceneOnWin && !S.f(cfg.sceneOnWin)) { Wo.play(cfg.sceneOnWin); return; }
    UI.toast('Le gardien est tombé.');
  };

  /* ---------------- GAME OVER ---------------- */
  Game.updateOver = function (dt) {
    Game.overT = (Game.overT || 0) + dt;
    if (In.pressed('a') && Game.overT > 1) Game.revive();
  };
  Game.gameOver = function () {
    Game.state = 'over';
    Game.overT = 0;
    FF.Snd.stopMusic();
    FF.Snd.playMusic('gameover');
    G.fx.fade = 0;
    G.fadeTo(1, .4);
  };
  Game.drawOver = function () {
    G.clear('#000');
    G.text('VOS HÉROS ONT SUCCOMBÉ', G.W / 2, G.H / 2 - 14, { align: 'center', color: '#ff6a6a' });
    if (Game.overT > 1) G.text('Appuyez sur A pour reprendre au dernier cristal', G.W / 2, G.H / 2 + 8, { align: 'center', color: '#8fa0c9' });
  };
  Game.revive = function () {
    var last = S.flags.__lastSave || { map: 'aurelia', x: 15, y: 20 };
    S.allMembers().forEach(function (m) { if (m) { m.hp = Math.max(1, Math.round(m.stats.pv * .6)); m.mp = Math.max(0, Math.round(m.stats.pm * .4)); m.status = {}; } });
    Game.state = 'field';
    FF.Wld.enter(last.map, last.x, last.y, 'down');
    G.fx.fade = 1; G.fadeTo(0, 1.2);
    UI.dialog([['', 'Vous vous réveillez près d’un cristal, la bouche pleine de poussière.']]);
  };

  /* ---------------- CRÉDITS ---------------- */
  Game.credits = function () {
    Game.state = 'credits';
    Game.credT = 0;
    FF.Snd.playMusic('save');
    S.set('ending');
    /* clôturer la scène AVANT le générique : sinon Wo.cut reste actif
       (pause/wait à 0) et runCut ne reprend jamais au retour terrain. */
    if (FF.Wld) FF.Wld.cut = null;
    if (FF.UI) { FF.UI.dlg = null; FF.UI.menu = null; }
    Game.modal = null;
    /* persiste cleared=true pour le New Game+ (S.save lit flags.ending) */
    try { if (FF.Save && FF.Save.save) FF.Save.save('auto'); } catch (e) { }
  };
  Game.CREDIT = [
    '', 'LES QUATRE CRISTAUX', '',
    'Un jeu écrit, dessiné et programmé', 'à la main, pour votre iPhone.', '',
    'Moteur : canvas 2D, 240×160,', 'pixel art procédural, audio synthétisé.', '',
    'Avec la pensée émue pour', 'les JRPG des années 90,', 'ceux qui tenaient sur une cartouche', 'et duraient cent heures.', '',
    'PERSONNAGES', 'Arno — le chevalier qui frappe d’abord', 'Myrelle — la novice qui prie juste', 'Sica — les toits, les poches', 'Gault — quatre cents lieues, sans chaussures', 'Kael — le serment, et son prix', 'Lysandre — la lyre et le chroniqueur', '',
    'BOSSES', 'Croc-Boue · Gargouille de Pyrite · Chancelier Vaux', 'Néréide l’Avare · Comte Gelignard · Borée', 'Cendrix · Léviathan · Kael Brisé', 'Archonte Obsidien · Nyxaré · Momon Étoilé', '',
    'Ce texte défile comme les génériques', 'de l’époque : lentement,', 'et pendant qu’on éteint la console.', '',
    'MERCI D’AVOIR JOUÉ.', '', 'Gardez la sauvegarde :', 'le New Game+ reprend vos niveaux.', ''
  ];
  Game.updateCredits = function (dt) {
    Game.credT += dt * (In.down('a') ? 3 : 1);
    if (Game.credT > Game.CREDIT.length * 1.05 + 6) {
      Game.state = 'field';
      if (FF.Wld) FF.Wld.cut = null;
      G.fadeTo(0, 1);
      try { FF.Snd.playMusic((Wo.map && Wo.map.music) || 'world'); } catch (e) { }
    }
  };
  Game.drawCredits = function () {
    G.clear('#000');
    var y = G.H + 8 - Game.credT * 12;
    Game.CREDIT.forEach(function (l, i) {
      var yy = y + i * 12;
      if (yy > -12 && yy < G.H) G.text(l, G.W / 2, yy, { align: 'center', color: i === 1 ? '#ffe6a8' : '#cfd8e6' });
    });
  };

  /* ---------------- tap écran ---------------- */
  Game.onScreenTap = function (ev) {
    var rect = document.getElementById('game').getBoundingClientRect();
    var sc = rect.width / G.W;
    var x = (ev.clientX - rect.left) / sc, y = (ev.clientY - rect.top) / sc;
    if (Game.state === 'battle' && FF.Bat.st) { FF.Bat.onScreenTap(x, y); return; }
    if (UI.dlg) { In.force('a'); return; }
    if (Game.state === 'title') { In.force('a'); return; }
    if (UI.menu) {
      var M = UI.menu;
      if (M.L) {
        var L = M.L;
        if (x >= L.x && x <= L.x + L.w && y >= L.y && y <= L.y + L.h) {
          var i = Math.floor((y - L.y - 5) / 12) + L.top;
          if (i >= 0 && i < L.items.length) {
            if (i === L.idx) { if (L.onSel && !L.items[i].dis) L.onSel(L.items[i], i); }
            else { L.idx = i; FF.Snd.play('cursor'); }
          }
          return;
        }
      }
      if (M.slots) {
        var SL = M.slots;
        if (x >= SL.x && x <= SL.x + SL.w && y >= SL.y && y <= SL.y + SL.h) {
          var i2 = Math.floor((y - SL.y - 5) / 12) + SL.top;
          if (i2 >= 0 && i2 < SL.items.length) { SL.idx = i2; if (SL.onSel) SL.onSel(SL.items[i2]); }
          return;
        }
      }
      if (M.kind === 'main') {
        var yy = 9 + (Math.floor((y - 4) / 14));
        if (x > 100 && yy >= 0 && yy < S.order.length) { M.who = yy; FF.Snd.play('cursor'); return; }
      }
      return;
    }
    if (Game.state === 'field') In.force('a');
  };

  /* ---------------- sauvegarde rapide + per-sistance ---------------- */
  Game.savePrefs = function () { if (FF.Prefs && FF.Prefs.save) return FF.Prefs.save(); S.saveSettings(); };
  Game.loadPrefs = function () {
    if (FF.Prefs && FF.Prefs.load) FF.Prefs.load();
    else S.loadSettings();
  };
  Game.autoSave = function () {
    if (!S.order || !S.order.length) return;
    FF.Save.save('auto');
  };

  /* enregistrement du point de sauvegarde courant */
  Game.markSavePoint = function () {
    S.flags.__lastSave = { map: Wo.map.id, x: Wo.p.gx, y: Wo.p.gy };
  };

  /* hook quand on sort d'un donjon */
  var enterOld = FF.Wld.enter;
  FF.Wld.enter = function (id, x, y, dir) {
    var m = enterOld.call(FF.Wld, id, x, y, dir);
    Game.markSavePoint();
    Wo.placeT = 2.6;
    return m;
  };

  /* ---------------- démarrage ---------------- */
  Game.start = function () {
    last = 0;
    raf = requestAnimationFrame(Game.frame);
  };
  Game.pendingBoot = null;
})(this.FF = this.FF || {});

/* ---------- FF.Save (miroir pratique) ---------- */
(function (FF) {
  'use strict';
  var Save = FF.Save = {};
  Save.meta = function (k) { return FF.S.meta(k); };
  Save.save = function (k) { if (FF.Game && FF.Game.markSavePoint) FF.Game.markSavePoint(); return FF.S.save(k); };
  Save.load = function (k) { return FF.S.load(k); };
  Save.del = function (k) { FF.S.del(k); };
  Save.savePrefs = function () { FF.Game.savePrefs(); };
})(this.FF = this.FF || {});

/* ---------- câblage du démarrage (geste requis pour l'audio iOS) ---------- */
(function (FF) {
  'use strict';
  var Game = FF.Game;
  var started = false;
  function applyFx() {
    var st = FF.S.settings || {};
    document.body.classList.toggle('fx-scan', st.scan !== 0);
    document.body.classList.toggle('fx-vig', st.vig !== 0);
    document.body.classList.toggle('pad-hidden', !!st.padHidden);
    if (FF.Gfx.resize) FF.Gfx.resize();
  }
  FF.Game.applyFx = applyFx;
  function start() {
    if (started) return;
    started = true;
    var cv = document.getElementById('game');
    try {
      FF.Game.boot(cv);
      if (FF.Game.loadPrefs) FF.Game.loadPrefs();
      applyFx();
      FF.Game.start();
      /* Pas de musique ici : planifier sur un AudioContext encore suspendu (autoplay iOS)
         jouerait faux au déblocage. La musique de titre démarre au PREMIER geste réel
         (Game.unlockAudio), seule façon de débloquer l'audio sur iPhone. */
    } catch (e) {
      console.error('Échec du démarrage', e);
      FF.Game.error = e;
      var el = document.querySelector('.boot-s');
      if (el) el.textContent = 'Erreur au démarrage : ' + (e.message || e);
    }
    var b = document.getElementById('boot');
    if (b) { b.classList.add('gone'); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 800); }
  }
  Game.startOnce = start;
  /* Débloque l'audio (geste requis iOS) puis lance la musique de titre UNE fois.
     Idempotent : safe à brancher sur touchstart/keydown/pointerdown + clic de boot. */
  Game.unlockAudio = function () {
    try { if (FF.Snd && FF.Snd.unlock) FF.Snd.unlock(); } catch (e) { }
    if (Game.audioTitle) return;
    Game.audioTitle = true;
    try { if (FF.Snd) FF.Snd.playMusic('title'); } catch (e) { }
  };
  function arm() {
    var b = document.getElementById('boot-go');
    if (b) b.addEventListener('click', function (e) { e.preventDefault(); start(); Game.unlockAudio && Game.unlockAudio(); });
    ['touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
      document.addEventListener(ev, function () { start(); Game.unlockAudio && Game.unlockAudio(); }, { passive: true });
    });
    if (document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(start, 80);
    else document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 80); });
    window.addEventListener('load', function () { setTimeout(start, 80); });
    /* iOS : plein écran manuel si l'app n'est pas installée */
    window.addEventListener('orientationchange', function () { setTimeout(function () { FF.Gfx.resize(); }, 320); });
  }
  arm();
})(this.FF = this.FF || {});

