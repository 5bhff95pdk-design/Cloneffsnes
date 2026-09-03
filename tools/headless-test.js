/* Test fonctionnel headless : charge le jeu dans un vm avec DOM factice,
   amorce le moteur et joue plusieurs scénarios (intro, combat, sauvegarde,
   déplacement, boutique, rendu de toutes les cartes). */
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'ff-iphone', 'src');
const ORDER = [
  'core/util.js', 'core/font.js', 'core/gfx.js', 'core/input.js', 'core/audio.js', 'core/sprites.js',
  'data/tables.js', 'data/monsters.js', 'data/story.js', 'data/maps.js',
  'engine/save.js', 'engine/bake.js', 'engine/assets.js', 'engine/dungeon.js',
  'engine/party.js', 'engine/battle.js', 'engine/ui.js', 'engine/world.js', 'engine/main.js',
];
const results = [];
function rec(name, ok, detail) { results.push({ name, ok: !!ok, detail: detail || '' }); if (!ok) { process.exitCode = 1; console.log('FAIL  ' + name + '  [' + (detail || '') + ']'); } }

/* ---------------- horloge virtuelle ---------------- */
let vnow = 0; const timers = []; let tid = 1;
function vSetTimeout(cb, ms) { timers.push({ id: tid, t: vnow + (ms | 0), cb }); return tid++; }
function pumpTimers() {
  for (let i = 0; i < 500; i++) {
    timers.sort((a, b) => a.t - b.t);
    const nxt = timers[0];
    if (!nxt || nxt.t > vnow) return;
    timers.shift(); try { nxt.cb(); } catch (e) { /* ignore */ }
  }
}

/* ---------------- DOM factice ---------------- */
function fakeCtx() {
  const noop = () => { };
  return {
    canvas: null, fillStyle: '', strokeStyle: '', globalAlpha: 1, lineWidth: 1,
    imageSmoothingEnabled: false, font: '', textAlign: '', textBaseline: '', globalCompositeOperation: 'source-over',
    fillRect: noop, clearRect: noop, strokeRect: noop, drawImage: noop,
    save: noop, restore: noop, translate: noop, scale: noop, setTransform: noop, rotate: noop,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop, stroke: noop, fill: noop, fillText: noop, strokeText: noop,
    arc: noop, ellipse: noop, clip: noop, measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }),
    createPattern: () => ({}), getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h) * 4), width: w, height: h }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h) * 4), width: w, height: h }),
    putImageData: noop,
  };
}
function fakeCanvas() {
  const c = {
    style: {}, width: 0, height: 0,
    classList: { add: noop2, remove: noop2, toggle: noop2, contains: () => false },
    addEventListener: noop2, removeEventListener: noop2,
    querySelectorAll: () => [], getAttribute: () => null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 720, height: 480 }),
  };
  c.getContext = () => fakeCtx();
  return c;
}
function noop2() { }
const store = {};
const listeners = {};
const document = {
  createElement: (t) => (t === 'canvas' ? fakeCanvas() : { style: {}, classList: { add: noop2, remove: noop2, toggle: noop2, contains: () => false }, addEventListener: noop2, setAttribute: noop2, querySelectorAll: () => [] }),
  getElementById: (id) => (id === 'game' || id === 'dpad' ? fakeCanvas() : null),
  querySelector: () => null, querySelectorAll: () => [],
  body: { classList: { add: noop2, remove: noop2, toggle: noop2, contains: () => false } },
  documentElement: { style: { setProperty: noop2 } },
  addEventListener: (ev, cb) => { (listeners[ev] = listeners[ev] || []).push(cb); },
  readyState: 'complete',
};
const ctx = vm.createContext({
  console: { log: noop2, warn: noop2, error: () => { } },
  Math, JSON, Object, Array, String, Number, Boolean, Date, parseInt, parseFloat, isFinite, isNaN,
  Set, Map, Error, TypeError, RangeError, Uint8Array, Uint8ClampedArray, Float32Array,
  document, navigator: { userAgent: 'node', serviceWorker: null, vibrate: noop2, getGamepads: () => [] },
  addEventListener: (ev, cb) => { (listeners[ev] = listeners[ev] || []).push(cb); },
  removeEventListener: noop2, innerWidth: 780, innerHeight: 520, devicePixelRatio: 2,
  visualViewport: null, AudioContext: undefined, webkitAudioContext: undefined,
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = '' + v }, removeItem: k => { delete store[k] } },
  performance: { now: () => vnow },
  requestAnimationFrame: () => 0, cancelAnimationFrame: noop2,
  setTimeout: vSetTimeout, clearTimeout: noop2, setInterval: () => 0, clearInterval: noop2,
  matchMedia: () => ({ matches: false, addListener: noop2 }),
  location: { protocol: 'http:', href: 'http://x/index.html', origin: 'http://x' },
});
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;

for (const f of ORDER) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { console.log('CHARGEMENT ÉCHEOUÉ ' + f + ': ' + e.message); process.exit(1); }
}
const run = (code) => vm.runInContext(code, ctx);

/* ---------------- boucle de frames ---------------- */
const DT = 1 / 60;
function frames(n, perFrame) {
  for (let i = 0; i < n; i++) {
    vnow += DT * 1000; pumpTimers();
    try {
      run(`
        FF.Gfx.time += ${DT};
        FF.Game.step(${DT});
        FF.Gfx.present();
        FF.In.endFrame();
      `);
    } catch (e) { throw new Error('frame ' + i + ': ' + e.message); }
    if (perFrame) perFrame(i);
  }
}

/* ---------------- 1. amorçage ---------------- */
let bootOk = true, bootErr = '';
try {
  /* simule le tap utilisateur : amorçage unique (désactive aussi l'auto-start à 80 ms) */
  run('FF.Game.startOnce();');
  bootOk = !run('FF.Game.error');
  bootErr = run('FF.Game.error && String(FF.Game.error)') || '';
} catch (e) { bootOk = false; bootErr = e.message; }
rec('Amorçage moteur (boot + assets + donjons)', bootOk, bootErr);
rec('Amorçage < 2 s', run('FF.Game.bootMs') < 2000, run('FF.Game.bootMs') + ' ms');
rec('Cartes chargées', run('Object.keys(FF.D.MAPS).length') >= 45, run('Object.keys(FF.D.MAPS).length') + ' cartes');
rec('Thèmes cuits', run('Object.keys(FF.Bake.themes).length') >= 9, run('Object.keys(FF.Bake.themes).join(",")'));
rec('Sprites ennemis', run('Object.keys(FF.Assets.enemy).length') > 20, run('Object.keys(FF.Assets.enemy).length') + ' variantes');

/* ---------------- 2. nouvelle partie + intro ---------------- */
run('FF.Game.newGame();');
frames(10);
let introState = run('JSON.stringify({state:FF.Game.state, map:FF.Wld.map && FF.Wld.map.id, party:FF.S.order.join(",")})');
rec('Nouvelle partie (terrain Aurélia, équipe 3)', introState.indexOf('field') >= 0 && introState.indexOf('aurelia') >= 0 && run('FF.S.order.length') === 3, introState);
/* l'intro démarre via setTimeout(250 ms) : on pompe l'horloge */
frames(30);
const cutStarted = run('!!FF.Wld.cut');
rec('Scène d\'intro lancée', cutStarted);
/* on avance la scène en appuyant sur A régulièrement */
frames(300, (i) => { if (i % 12 === 0) run('FF.In.force("a")'); });
const introDone = run('!FF.Wld.cut && !FF.UI.dlg && FF.S.f("introDone")');
rec('Scène d\'intro terminée (fanfare, dialogue, retour en ville)', introDone,
  'cut=' + run('!!FF.Wld.cut') + ' dlg=' + run('!!FF.UI.dlg') + ' ch=' + run('FF.S.ch'));
rec('Chapitre avancé après intro', run('FF.S.ch') >= 1, 'ch=' + run('FF.S.ch'));

/* ---------------- 3. déplacement ---------------- */
run('FF.Game.noEnc = true; FF.Wld.cut = null; FF.UI.dlg = null; FF.Game.modal = null; FF.UI.menu = null; FF.Wld.enter("aurelia", 16, 12, "up");');
frames(5);
if (process.env.DBG) console.log('DBG depl: ' + run('JSON.stringify({cut: !!FF.Wld.cut, dlg: !!FF.UI.dlg, menu: !!FF.UI.menu, modal: FF.Game.modal, state: FF.Game.state, mode: FF.Wld.mode, gx: FF.Wld.p.gx, gy: FF.Wld.p.gy, solidUp: FF.Wld.solidAt(16, 11), hp: FF.S.members.arno.hp})'));
const p0 = run('JSON.stringify({x:FF.Wld.p.gx, y:FF.Wld.p.gy})');
run('FF.In.keys.up = 1;');
frames(45);
run('FF.In.keys.up = 0;');
const p1 = run('JSON.stringify({x:FF.Wld.p.gx, y:FF.Wld.p.gy})');
rec('Déplacement joueur (monte 3 cases)', p1 !== p0 && JSON.parse(p1).y < JSON.parse(p0).y, p0 + ' -> ' + p1);
/* bord de carte : en bas à (15,20) on ne peut pas descendre */
run('FF.Wld.enter("aurelia", 15, 20, "down");');
frames(5);
const q0 = run('JSON.stringify({x:FF.Wld.p.gx, y:FF.Wld.p.gy})');
run('FF.In.keys.down = 1;');
frames(30);
run('FF.In.keys.down = 0;');
const q1 = run('JSON.stringify({x:FF.Wld.p.gx, y:FF.Wld.p.gy})');
rec('Collision en bord de carte (ne descend pas)', q0 === q1, q0 + ' -> ' + q1);

/* ---------------- 4. dialogue PNJ ---------------- */
run('FF.UI.dialog([["", "Test de dialogue."]]);');
frames(30);
const dlgOpen = run('!!FF.UI.dlg');
run('FF.In.force("a");');
frames(40);
rec('Dialogue s\'ouvre et se ferme', dlgOpen && !run('!!FF.UI.dlg'));

/* ---------------- 5. combat ---------------- */
run(`
  FF.S.order.forEach(function(id){ var m=FF.S.members[id]; m.lv=10; m.jlv[m.job]=10; FF.P.recalc(m); FF.P.healFull(m); m.gifted=(m.gifted||[]).concat(["soin","etincelle"]); FF.P.recalc(m); FF.P.healFull(m); });
  FF.Game.battle({foes:["limule","chatsouris","ratmusq"], bg:"field", music:"battle"});
`);
frames(60);
const batStarted = run('!!FF.Bat.st');
rec('Combat démarré (ATB)', batStarted, 'state=' + run('FF.Game.state'));
let outcome = 'timeout';
frames(2400, (i) => {
  if (i % 8 === 0) {
    try {
      run(`
        if (FF.Bat.st) {
          var st = FF.Bat.st;
          if (st.mode === "cmd" || st.mode === "sub" || st.mode === "target" || st.mode === "lose") FF.In.force("a");
          if (st.mode === "say") FF.In.force("a");
          if (st.mode === "win" && st.showResult) FF.In.force("a");
        }
        if (FF.Game.state === "over") FF.In.force("a");
      `);
    } catch (e) { }
  }
});
outcome = run('FF.Game.state') + '/' + (run('FF.Bat.st && FF.Bat.st.mode') || '-');
const expGained = run('FF.S.members.arno.exp');
rec('Combat mené à son terme (victoire ou défaite, pas de blocage)',
  !run('!!FF.Bat.st') || run('FF.Game.state') === 'over', outcome + ' · exp Arno=' + expGained);
if (run('FF.Game.state') === 'over') {
  run('FF.In.force("a");');
  frames(80);
  rec('Game over -> résurrection au dernier cristal', run('FF.Game.state') === 'field', 'state=' + run('FF.Game.state'));
}

/* ---------------- 6. sauvegarde / chargement ---------------- */
const g0 = run('FF.S.gils');
run('FF.Save.save("1");');
const meta = run('FF.Save.meta("1")');
rec('Sauvegarde casier 1 + méta', meta && meta.gils === g0, JSON.stringify(meta));
run('FF.S.gils = 1; FF.Save.load("1");');
rec('Chargement restaure les gils', run('FF.S.gils') === g0, 'gils=' + run('FF.S.gils'));
run('FF.Save.save("auto");');
rec('Sauvegarde automatique', !!run('FF.Save.meta("auto")'));
run('FF.Save.del("auto");');
rec('Suppression de casier', !run('FF.Save.meta("auto")'));

/* ---------------- 7. boutique ---------------- */
const gBefore = run('FF.S.gils');
run('FF.UI.shop({shop:"aurelia", kind:"obj", n:"Bazaar"});');
frames(10);
run('FF.In.force("a");');
frames(20);
run('FF.In.force("a");');
frames(20);
const shopOpen = run('FF.UI.menu && FF.UI.menu.kind === "shop"');
rec('Boutique ouverte après dialogue', shopOpen);
if (shopOpen) {
  const before = run('FF.S.count("potion")');
  run('FF.In.force("a");');
  frames(10);
  const after = run('FF.S.count("potion")');
  const paid = run('FF.S.gils');
  rec('Achat en boutique (potion 60 G)', after === before + 1 && paid === gBefore - 60, 'gils ' + gBefore + '->' + paid + ' potions ' + before + '->' + after);
  /* passer en vente */
  run('FF.In.force("right");');
  frames(5);
  run('FF.In.force("a");');
  frames(10);
  rec('Mode vente actif', run('FF.UI.menu.mode') === 'sell');
  run('FF.UI.close();');
}

/* ---------------- 8. auberge ---------------- */
run('FF.UI.inn({});');
frames(10);
run('FF.In.force("a");');
frames(20);
run('FF.In.force("a");');
frames(20);
const innOpen = run('FF.UI.menu && FF.UI.menu.kind === "inn"');
rec('Auberge ouverte', innOpen);
if (innOpen) {
  const gInn = run('FF.S.gils');
  run('FF.In.force("a");');
  frames(20);
  const healed = run('FF.S.order.every(id => { var m = FF.S.members[id]; return m && m.hp === m.stats.pv && m.mp === m.stats.pm; })');
  rec('Nuit à l\'auberge soigne l\'équipe', healed, 'gils ' + gInn + '->' + run('FF.S.gils'));
  run('FF.In.force("a");');
  frames(20);
  run('FF.UI.close();');
}

/* ---------------- 9. menu principal + statut + équipement ---------------- */
run('FF.UI.openMenu();');
frames(5);
rec('Menu principal ouvert', run('FF.UI.menu && FF.UI.menu.kind') === 'main');
run('FF.In.force("a");');
frames(5);
rec('Sous-menu objets', run('FF.UI.menu.kind') === 'item');
run('FF.In.force("b");');
frames(5);
run('FF.UI.close();');

/* ---------------- 10. cristal (sauvegarde au cristal) ---------------- */
run('FF.UI.crystal();');
frames(5);
rec('Cristal de sauvegarde', run('FF.UI.menu.kind') === 'crystal');
run('FF.In.force("b");');
frames(5);

/* ---------------- 11. donjon : entrée, escalier, boss ---------------- */
const dun = run(`
  (function(){
    var m = FF.D.MAPS.sanctuaire_2;
    var ents = m ? m.ents : [];
    var boss = ents.filter(e => e.t === "bossgate");
    var stairs = ents.filter(e => e.t === "stairs" || e.t === "stairsback");
    return JSON.stringify({floors: Object.keys(FF.Dun.maps.sanctuaire).length, boss: boss.length, stairs: stairs.length});
  })()
`);
rec('Donjon Sanctuaire : 2 niveaux, boss, escaliers', dun.indexOf('"boss":1') >= 0 && dun.indexOf('"floors":2') >= 0, dun);
run('FF.Game.noEnc=true; var e=FF.D.MAPS.sanctuaire_1.entry; FF.Wld.enter("sanctuaire_1", e.x, e.y, "up");');
frames(5);
rec('Entrée dans le donjon (niveau 1)', run('FF.Wld.map.id') === 'sanctuaire_1', run('FF.Wld.map.id'));

/* ---------------- 12. boss : combat via bossgate ---------------- */
run(`
  (function(){
    var m = FF.D.MAPS.sanctuaire_2, e = m.ents.filter(x => x.t === "bossgate")[0];
    FF.S.order.forEach(function(id){ var mm=FF.S.members[id]; mm.lv=6; mm.jlv[mm.job]=6; FF.P.recalc(mm); FF.P.healFull(mm); });
    FF.Wld.tryInteract(e, null, true);
    return !!FF.Bat.st;
  })()
`);
frames(30);
rec('Bossgate déclenche le combat du boss', run('!!FF.Bat.st'), 'state=' + run('FF.Bat.st && FF.Bat.st.bossName'));
frames(2400, (i) => {
  if (i % 8 === 0) {
    try {
      run(`
        if (FF.Bat.st) {
          var st = FF.Bat.st;
          if (st.mode === "cmd" || st.mode === "sub" || st.mode === "target" || st.mode === "say" || st.mode === "lose") FF.In.force("a");
          if (st.mode === "win" && st.showResult) FF.In.force("a");
        }
        if (FF.Game.state === "over") FF.In.force("a");
      `);
    } catch (e) { }
  }
});
const bossDone = !run('!!FF.Bat.st');
const gateFlag = run('var e = FF.D.MAPS.sanctuaire_2.ents.filter(x => x.t === "bossgate")[0]; "boss_" + (e.scene || e.name)');
const gateFlagSet = run('!!FF.S.f(' + JSON.stringify(gateFlag) + ')');
rec('Combat boss terminé (pas de blocage)', bossDone, 'state=' + (run('FF.Game.state') || '-') + ' flag ' + gateFlag + '=' + gateFlagSet);
rec('Flag boss posé par onWin du bossgate (verrouillage de la porte)', gateFlagSet, 'flag ' + gateFlag + '=' + gateFlagSet);
/* la scène post-boss (sanctuaire1) doit se jouer JUSQU'AU BOUT : dialogues + étape map (régression du gel) */
frames(3600, (i) => {
  if (i % 8 === 0) {
    try {
      run(`
        if (FF.UI.dlg) FF.In.force("a");
        if (FF.Game.state === "over") FF.In.force("a");
      `);
    } catch (e) { }
  }
});
const s1 = run('JSON.stringify({cut: !!FF.Wld.cut, sanctuaire: !!FF.S.f("sanctuaire"), ch: FF.S.ch, map: FF.Wld.map && FF.Wld.map.id})');
rec('Scène post-boss sanctuaire1 terminée (étapes dialogues + map, pas de gel)',
  !run('!!FF.Wld.cut') && run('!!FF.S.f("sanctuaire")') && run('FF.S.ch === 1.5'), s1);

/* ---------------- 12b. mages rouges : apprennent-ils des sorts rouges ? ---------------- */
const redLearn = run(`
  (function(){
    var m = { id:'redtest', name:'R', job:'red', lv:1, jlv:{red:1}, hp:1, mp:1, equip:{weap:null,armor:null,helm:null,acc:null}, bias:{}, status:{} };
    FF.S.members[m.id] = m;
    FF.P.changeJob(m, 'red');
    for (var lv = 1; lv <= 12; lv++) { m.lv = lv; m.jlv.red = lv; FF.P.recalc(m); }
    var reds = Object.keys(m.learn).filter(function(id){ return (FF.D.SP[id]||{}).kind === 'red'; });
    delete FF.S.members[m.id];
    return JSON.stringify({lv: m.lv, sorts: Object.keys(m.learn).length, rouges: reds});
  })()
`);
rec('Mage rouge lvl 12 possède des sorts rouges (voie "red" de D.TIER)', redLearn.indexOf('"rouges":[]') < 0, redLearn);

/* ---------------- 13. scène de tuile avec combat (trahison) + garde 'once' ---------------- */
run(`
  (function(){
    FF.Wld.cut = null; FF.UI.dlg = null; FF.Game.modal = null; FF.UI.menu = null; FF.Bat.st = null;
    FF.Game.state = "field"; FF.Game.noEnc = true;
    FF.S.set("sanctuaire");                       /* condition de la tuile (déjà posée par sanctuaire1) */
    FF.D.MON['kael1'].hp = 1; FF.D.MON['kael1'].atk = 5;  /* ennemi neutre : le test cible le moteur de scène, pas l'équilibrage */
    FF.S.order.forEach(function (id) { var m = FF.S.members[id]; m.lv = 15; m.jlv[m.job] = 15; FF.P.recalc(m); m.hp = Math.floor(m.stats.pv * 1.5); m.mp = m.stats.pm; });
    FF.Wld.enter("aurelia", 12, 17, "right");      /* à 3 cases de la tuile */
    FF.__played = []; FF.__realPlay = FF.Wld.play;
    FF.Wld.play = function (id) { FF.__played.push(id); return FF.__realPlay.apply(FF.Wld, arguments); };
    FF.In.keys.right = 1;                          /* on MARCHE vers la tuile (15,17) */
  })()
`);
frames(80);
run('FF.In.keys.right = 0; FF.Wld.play = FF.__realPlay;');
const played1 = run('JSON.stringify(FF.__played)');
rec('Marche sur la tuile (15,17) déclenche la scène trahison', played1 === '["trahison"]', 'scènes : ' + played1);
frames(6000, (i) => {
  if (i % 4 === 0) {
    try {
      run(`
        if (FF.Bat.st) {
          var st = FF.Bat.st;
          if (st.mode === "cmd" || st.mode === "sub" || st.mode === "target" || st.mode === "say" || st.mode === "lose" || st.mode === "win") FF.In.force("a");
        }
        if (FF.UI.dlg) FF.In.force("a");
        if (FF.Game.state === "over") FF.In.force("a");
      `);
    } catch (e) { }
  }
});
const trah = run('JSON.stringify({cut: !!FF.Wld.cut, trahi: !!FF.S.f("trahi"), ch: FF.S.ch, jobWar: !!FF.S.jobs.war, sc: !!FF.S.f("sc_trahison")})');
if (process.env.DBG && run('!!FF.Wld.cut')) {
  console.log('DBG trah: ' + run('(function(){ var c = FF.Wld.cut; return JSON.stringify({i: c.i, pause: c.pause, wait: c.wait, s: c.script[c.i], dlg: !!FF.UI.dlg, dlgTxt: FF.UI.dlg && FF.UI.dlg.txt.slice(0, 30), bat: !!FF.Bat.st, batMode: FF.Bat.st && FF.Bat.st.mode, foes: FF.Bat.st && JSON.stringify(FF.Bat.st.foes.map(function (f) { return [f.hp, f.dead] })), state: FF.Game.state }); })()'));
}
rec('Scène trahison menée à son terme (dialogues + combat + saut de label + chapitre 2)',
  !run('!!FF.Wld.cut') && run('!!FF.S.f("trahi")') && run('FF.S.ch === 2'), trah);
/* 2e passage sur la même tuile : la scène ne doit pas se rejouer */
const replayed = run(`
  (function(){
    FF.Wld.cut = null; FF.UI.dlg = null; FF.Game.modal = null; FF.Bat.st = null;
    FF.Game.state = "field";
    var played = [];
    var oldPlay = FF.Wld.play;
    FF.Wld.play = function (id) { played.push(id); return oldPlay.apply(FF.Wld, arguments); };
    var e = FF.D.entAt("aurelia", 15, 17, "scene");
    FF.Wld.tryInteract(e, null, true);
    FF.Wld.play = oldPlay;
    FF.Wld.cut = null; FF.UI.dlg = null;
    return JSON.stringify(played);
  })()
`);
rec('Scène "once" déjà vue ne se rejoue PAS (2e passage sur la tuile)', replayed === '[]', 'scènes relancées : ' + replayed);

/* ---------------- 14. rendu : une frame par carte ---------------- */
const drawOut = run(`
  (function(){
    var out = [];
    Object.keys(FF.D.MAPS).forEach(function (id) {
      try {
        var m = FF.D.MAPS[id];
        FF.Game.state = "field";
        FF.Wld.enter(id, (m.entry && m.entry.x != null) ? m.entry.x : 1, (m.entry && m.entry.y != null) ? m.entry.y : 1, "down");
        FF.Wld.draw();
      } catch (e) { out.push(id + ': ' + e.message); }
    });
    return JSON.stringify(out);
  })()
`);
const drawErrs = JSON.parse(drawOut);
rec('Rendu 1 frame de toutes les ' + run('Object.keys(FF.D.MAPS).length') + ' cartes', drawErrs.length === 0, drawErrs.slice(0, 3).join(' | ') || 'aucune erreur');

/* ---------------- synthèse ---------------- */
console.log('--- RÉSULTATS ---');
let ok = 0;
for (const r of results) { console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.name + (r.detail ? '  [' + r.detail + ']' : '')); if (r.ok) ok++; }
console.log('--- ' + ok + '/' + results.length + ' réussis ---');
process.exit(ok === results.length ? 0 : 1);
