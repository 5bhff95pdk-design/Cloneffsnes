/* Test — chapitres 3→6 + scènes restantes (Léviathan, Cendrix, Archonte, Kael, secret).
   Joue les scènes data-driven (combats stubés à 1 PV) et vérifie flags, emplois, chapitre.

   Usage : node tools/chapters-test.js
*/
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'ff-iphone', 'src');
const ORDER = [
  'core/util.js', 'core/font.js', 'core/gfx.js', 'core/input.js', 'core/audio.js', 'core/sprites.js',
  'data/tables.js', 'data/monsters.js', 'data/story.js', 'data/maps.js',
  'engine/save.js', 'engine/bake.js', 'engine/assets.js', 'engine/dungeon.js',
  'engine/party.js', 'engine/battle.js', 'engine/ui.js', 'engine/world.js', 'engine/main.js',
];
let vnow = 0; const timers = []; let tid = 1;
function vSetTimeout(cb, ms) { timers.push({ id: tid, t: vnow + (ms | 0), cb }); return tid++; }
function pumpTimers() {
  for (let i = 0; i < 500; i++) {
    timers.sort((a, b) => a.t - b.t);
    const nxt = timers[0];
    if (!nxt || nxt.t > vnow) return;
    timers.shift(); try { nxt.cb(); } catch (e) { }
  }
}
function noop() { }
function fakeCtx() {
  return {
    fillRect: noop, clearRect: noop, strokeRect: noop, drawImage: noop, save: noop, restore: noop,
    translate: noop, scale: noop, setTransform: noop, rotate: noop, beginPath: noop, closePath: noop,
    moveTo: noop, lineTo: noop, stroke: noop, fill: noop, fillText: noop, strokeText: noop, arc: noop,
    ellipse: noop, clip: noop, measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }), createRadialGradient: () => ({ addColorStop: noop }),
    createPattern: () => ({}), getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h) * 4), width: w, height: h }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h) * 4), width: w, height: h }),
    putImageData: noop, fillStyle: '', globalAlpha: 1, imageSmoothingEnabled: false
  };
}
function fakeCanvas() {
  const c = { style: {}, width: 0, height: 0, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, addEventListener: noop, removeEventListener: noop, querySelectorAll: () => [], getAttribute: () => null, getBoundingClientRect: () => ({ left: 0, top: 0, width: 720, height: 480 }) };
  c.getContext = () => fakeCtx(); return c;
}
const store = {};
const document = {
  createElement: (t) => (t === 'canvas' ? fakeCanvas() : { style: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, addEventListener: noop, setAttribute: noop, querySelectorAll: () => [] }),
  getElementById: () => fakeCanvas(), querySelector: () => null, querySelectorAll: () => [],
  body: { classList: { add: noop, remove: noop, toggle: noop, contains: () => false } },
  documentElement: { style: { setProperty: noop } }, addEventListener: noop, readyState: 'complete'
};
const ctx = vm.createContext({
  console: { log: noop, warn: noop, error: noop },
  Math, JSON, Object, Array, String, Number, Boolean, Date, parseInt, parseFloat, isFinite, isNaN,
  Set, Map, Error, TypeError, Uint8Array, Uint8ClampedArray, Float32Array,
  document, navigator: { userAgent: 'node', serviceWorker: null, vibrate: noop, getGamepads: () => [] },
  addEventListener: noop, removeEventListener: noop, innerWidth: 780, innerHeight: 520, devicePixelRatio: 2,
  visualViewport: null, AudioContext: undefined, webkitAudioContext: undefined,
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = '' + v; }, removeItem: k => { delete store[k]; } },
  performance: { now: () => vnow }, requestAnimationFrame: () => 0, cancelAnimationFrame: noop,
  setTimeout: vSetTimeout, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
  matchMedia: () => ({ matches: false, addListener: noop }),
  location: { protocol: 'http:', href: 'http://x/index.html', origin: 'http://x' }
});
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
ORDER.forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }));
const run = (code) => vm.runInContext(code, ctx);
const DT = 1 / 60;
function frames(n, per) {
  for (let i = 0; i < n; i++) {
    vnow += DT * 1000; pumpTimers();
    run(`FF.Gfx.time += ${DT}; FF.Game.step(${DT}); FF.Gfx.present(); FF.In.endFrame();`);
    if (per) per(i);
  }
}
const results = [];
function check(name, ok, detail) { results.push((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  [' + detail + ']' : '')); }

function mash(n) {
  frames(n, (i) => {
    if (i % 4 !== 0) return;
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
  });
}
function play(id, budget) {
  run('FF.Wld.cut = null; FF.UI.dlg = null; FF.UI.menu = null; FF.Game.modal = null; FF.Bat.st = null; FF.Game.state = "field"; FF.Game.noEnc = true;');
  run('FF.Wld.play(' + JSON.stringify(id) + ');');
  mash(budget || 1800);
}

run('FF.Game.startOnce();');
check('boot sans erreur', !run('FF.Game.error'));
run(`
  FF.P.newGame();
  FF.Wld.cut = null; FF.UI.dlg = null; FF.Game.modal = null; FF.Game.state = "field"; FF.Game.noEnc = true;
  FF.Wld.enter("aurelia", 15, 20, "down");
  FF.S.order.forEach(function (id) { var m = FF.S.members[id]; m.lv = 30; m.jlv[m.job] = 30; FF.P.recalc(m); FF.P.healFull(m); });
  ["leviathan","kael2","nyxare","croc-boue"].forEach(function (id) { if (FF.D.MON[id]) { FF.D.MON[id].hp = 1; FF.D.MON[id].atk = 1; } });
`);

play('mine1', 900);
check('mine1 : lanterne + mineEnfant', run('!!FF.S.f("lanterne") && !!FF.S.f("mineEnfant")') === true, 'cut=' + run('!!FF.Wld.cut'));

play('gargouille', 900);
check('gargouille : flag posé, cut clos', run('!!FF.S.f("gargouille") && !FF.Wld.cut') === true);

play('vaux', 1200);
check('vaux → chapitre 3 + ranger', run('FF.S.ch === 3 && !!FF.S.jobs.ranger && !!FF.S.f("vaux")') === true, 'ch=' + run('FF.S.ch') + ' ranger=' + run('!!FF.S.jobs.ranger'));

play('epave', 1200);
check('epave : Néréide + Lysandre + barde', run('!!FF.S.f("nereide") && FF.S.order.indexOf("lys") >= 0 && !!FF.S.jobs.bard') === true, 'order=' + run('FF.S.order.join(",")'));

play('leviathan', 4000);
check('léviathan → chapitre 4 + esprit kraken', run('FF.S.ch === 4 && !!FF.S.f("leviathan") && !!FF.S.summons.kraken && !FF.Wld.cut') === true, 'ch=' + run('FF.S.ch') + ' cut=' + run('!!FF.Wld.cut') + ' state=' + run('FF.Game.state'));

play('gelignard', 900);
check('gelignard : flag posé', run('!!FF.S.f("gelignard") && !FF.Wld.cut') === true);

play('boree', 1200);
check('borée → chapitre 5 + esprit', run('FF.S.ch === 5 && !!FF.S.f("boree") && !!FF.S.summons.boree') === true, 'ch=' + run('FF.S.ch'));

play('cendrix', 1200);
check('cendrix → chapitre 6 + nacelle/ship', run('FF.S.ch === 6 && !!FF.S.f("cendrix") && !!FF.S.f("ship")') === true, 'ch=' + run('FF.S.ch') + ' ship=' + run('!!FF.S.f("ship")'));

play('archonte', 900);
check('archonte : flag posé', run('!!FF.S.f("archonte") && !FF.Wld.cut') === true);

play('kael_final', 4000);
check('kael_final : Kael rejoint (équipe ou réserve, party déjà à 4)', run('!!FF.S.members.kael && (FF.S.order.indexOf("kael") >= 0 || FF.S.reserve.indexOf("kael") >= 0) && !FF.Wld.cut') === true, 'order=' + run('FF.S.order.join(",")') + ' reserve=' + run('FF.S.reserve.join(",")'));

play('secret', 900);
check('secret : flag posé', run('!!FF.S.f("secret") && !FF.Wld.cut') === true);

/* bossgates des donjons tardifs existent bien */
const gates = run(`(function(){
  function g(id){ var m=FF.D.MAPS[id]; return m && (m.ents||[]).filter(function(e){return e.t==="bossgate";}).map(function(e){return e.name||e.scene;}); }
  return JSON.stringify({mines2:g("mines_2"), mines3:g("mines_3"), epave2:g("epave_2"), glacier3:g("glacier_3"), forges2:g("forges_2"), tour3:g("tour_3"), tour4:g("tour_4")});
})()`);
const G = JSON.parse(gates);
check('bossgate Gargouille (mines_2)', (G.mines2 || []).length >= 1, gates);
check('bossgate Vaux (mines_3)', (G.mines3 || []).length >= 1);
check('bossgate Néréide (epave_2)', (G.epave2 || []).length >= 1);
check('bossgate Gelignard (glacier_3)', (G.glacier3 || []).length >= 1);
check('bossgate Cendrix (forges_2)', (G.forges2 || []).length >= 1);
check('bossgate Archonte (tour_3)', (G.tour3 || []).length >= 1);
check('bossgate Nyxaré (tour_4)', (G.tour4 || []).length >= 1);

console.log(results.join('\n'));
console.log('--- ' + results.filter(r => r.startsWith('PASS')).length + '/' + results.length + ' ok ---');
process.exit(results.some(r => r.startsWith('FAIL')) ? 1 : 0);
