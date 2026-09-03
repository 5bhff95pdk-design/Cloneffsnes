/* Test — scène finale / crédits.
   Régression du gel post-générique : Wo.cut restait actif (pause/wait à 0)
   donc runCut ne reprenait jamais, et flags.ending n'était pas persisté
   → New Game+ impossible après une vraie fin.

   Scénario : boot → nouvelle partie → play('final') → dialogues + fade
   → crédits → retour terrain libre + casier auto cleared.

   Usage : node tools/credits-test.js
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
    timers.shift(); try { nxt.cb(); } catch (e) { /* ignore */ }
  }
}
function noop() { }
function fakeCtx() {
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
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    addEventListener: noop, removeEventListener: noop,
    querySelectorAll: () => [], getAttribute: () => null,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 720, height: 480 }),
  };
  c.getContext = () => fakeCtx();
  return c;
}
const store = {};
const listeners = {};
const document = {
  createElement: (t) => (t === 'canvas' ? fakeCanvas() : { style: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false }, addEventListener: noop, setAttribute: noop, querySelectorAll: () => [] }),
  getElementById: (id) => (id === 'game' || id === 'dpad' ? fakeCanvas() : null),
  querySelector: () => null, querySelectorAll: () => [],
  body: { classList: { add: noop, remove: noop, toggle: noop, contains: () => false } },
  documentElement: { style: { setProperty: noop } },
  addEventListener: (ev, cb) => { (listeners[ev] = listeners[ev] || []).push(cb); },
  readyState: 'complete',
};
const ctx = vm.createContext({
  console: { log: noop, warn: noop, error: () => { } },
  Math, JSON, Object, Array, String, Number, Boolean, Date, parseInt, parseFloat, isFinite, isNaN,
  Set, Map, Error, TypeError, RangeError, Uint8Array, Uint8ClampedArray, Float32Array,
  document, navigator: { userAgent: 'node', serviceWorker: null, vibrate: noop, getGamepads: () => [] },
  addEventListener: (ev, cb) => { (listeners[ev] = listeners[ev] || []).push(cb); },
  removeEventListener: noop, innerWidth: 780, innerHeight: 520, devicePixelRatio: 2,
  visualViewport: null, AudioContext: undefined, webkitAudioContext: undefined,
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = '' + v; }, removeItem: k => { delete store[k]; } },
  performance: { now: () => vnow },
  requestAnimationFrame: () => 0, cancelAnimationFrame: noop,
  setTimeout: vSetTimeout, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
  matchMedia: () => ({ matches: false, addListener: noop }),
  location: { protocol: 'http:', href: 'http://x/index.html', origin: 'http://x' },
});
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;

for (const f of ORDER) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { console.log('CHARGEMENT ÉCHOUÉ ' + f + ': ' + e.message); process.exit(1); }
}
const run = (code) => vm.runInContext(code, ctx);

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

const results = [];
function check(name, ok, detail) {
  results.push((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  [' + detail + ']' : ''));
}

run('FF.Game.startOnce();');
check('boot sans erreur', !run('FF.Game.error'));

/* pas de Game.newGame() : beginNewRun() programme l'intro à 250 ms
   et écraserait la scène `final`. On pose une run fraîche à la main. */
run(`
  FF.P.newGame();
  FF.Wld.cut = null; FF.UI.dlg = null; FF.UI.menu = null; FF.Game.modal = null;
  FF.Game.noEnc = true; FF.Game.state = "field";
  FF.Wld.enter("aurelia", 15, 20, "down");
`);
frames(5);
check('run fraîche à Aurélia (field, pas de cut)', run('FF.Game.state') === 'field' && !run('!!FF.Wld.cut') && run('FF.Wld.map.id') === 'aurelia', 'state=' + run('FF.Game.state'));

/* scène finale : 4 say + fade + flag + credits — pas de combat */
run('FF.Wld.play("final");');
check('scène final lancée', run('FF.Wld.cut && FF.Wld.cut.id') === 'final', 'id=' + run('FF.Wld.cut && FF.Wld.cut.id'));

let sawCredits = false;
frames(2400, (i) => {
  if (i % 6 === 0) {
    try { run('if (FF.UI.dlg) FF.In.force("a");'); } catch (e) { }
  }
  if (run('FF.Game.state') === 'credits') sawCredits = true;
});
check('générique atteint (Game.state = credits)', sawCredits, 'state=' + run('FF.Game.state') + ' ending=' + run('!!FF.S.f("ending")'));
check('flag ending posé dès le début des crédits', run('!!FF.S.f("ending")'));
check('casier auto marqué cleared pendant les crédits', !!(run('FF.Save.meta("auto")') && run('FF.Save.meta("auto").cleared')), JSON.stringify(run('FF.Save.meta("auto")')));
check('cutteur clôturé pendant les crédits (pas de gel latent)', !run('!!FF.Wld.cut'));

/* accélérer le générique (A maintenu ≈ ×3, puis saut de credT) */
run('FF.In.keys.a = 1;');
frames(30);
run('FF.Game.credT = 9999;');
frames(5);
run('FF.In.keys.a = 0;');

const after = run('JSON.stringify({state: FF.Game.state, cut: !!FF.Wld.cut, dlg: !!FF.UI.dlg, menu: !!FF.UI.menu, ending: !!FF.S.f("ending")})');
check('retour terrain après crédits', run('FF.Game.state') === 'field', after);
check('aucun cut / dialogue / menu bloquant', !run('!!FF.Wld.cut') && !run('!!FF.UI.dlg') && !run('!!FF.UI.menu'), after);

/* le joueur doit pouvoir marcher (preuve que Wo.update n'est plus court-circuité) */
run('FF.Game.noEnc = true; FF.Wld.enter("aurelia", 16, 12, "up");');
frames(5);
const p0 = run('JSON.stringify({x:FF.Wld.p.gx, y:FF.Wld.p.gy})');
run('FF.In.keys.up = 1;');
frames(45);
run('FF.In.keys.up = 0;');
const p1 = run('JSON.stringify({x:FF.Wld.p.gx, y:FF.Wld.p.gy})');
check('terrain libre : le joueur marche (monte)', p1 !== p0 && JSON.parse(p1).y < JSON.parse(p0).y, p0 + ' -> ' + p1);

check('clearedSlots contient auto', run('FF.Game.clearedSlots().indexOf("auto") >= 0'), JSON.stringify(run('FF.Game.clearedSlots()')));
check('titre propose la Nouvelle Partie +', run('FF.Game.titleOpts().some(function(o){ return o.k === "ngp"; })'));

console.log(results.join('\n'));
console.log('--- ' + results.filter(r => r.startsWith('PASS')).length + '/' + results.length + ' ok ---');
process.exit(results.some(r => r.startsWith('FAIL')) ? 1 : 0);
