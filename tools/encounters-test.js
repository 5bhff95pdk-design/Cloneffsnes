/* Test — rencontres : un pas = une case, pas une frame.
   Régression : Wo.update incrémentait Wo.steps chaque frame à l'arrêt
   → farm / spam de combats. Le monde n'avait pas enc.list (seulement
   enc.zones) donc canEncounter le rejetait.

   Usage : node tools/encounters-test.js
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
  for (let i = 0; i < 200; i++) {
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
function frames(n) {
  for (let i = 0; i < n; i++) {
    vnow += DT * 1000; pumpTimers();
    run(`FF.Gfx.time += ${DT}; FF.Game.step(${DT}); FF.Gfx.present(); FF.In.endFrame();`);
  }
}
const results = [];
function check(name, ok, detail) { results.push((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  [' + detail + ']' : '')); }

run('FF.Game.startOnce();');
check('boot sans erreur', !run('FF.Game.error'));
run(`
  FF.P.newGame();
  FF.Wld.cut = null; FF.UI.dlg = null; FF.UI.menu = null; FF.Game.modal = null;
  FF.Game.state = "field"; FF.Game.noEnc = false;
  FF.S.settings.encounters = 1;
`);

/* ----- ville : pas de table de rencontres ----- */
run('FF.Wld.enter("aurelia", 15, 20, "down");');
check('Aurélia : canEncounter = false', run('FF.Wld.canEncounter()') === false);

/* ----- monde : zones (pas enc.list) ----- */
run('FF.Wld.enter("world", 10, 12, "down");');
check('monde : canEncounter = true (zones)', run('FF.Wld.canEncounter()') === true, 'enc.list=' + run('!!(FF.Wld.map.enc && FF.Wld.map.enc.list && FF.Wld.map.enc.list.length)'));
check('entrée de carte remet steps à 0', run('FF.Wld.steps') === 0);

/* ----- donjon : liste ----- */
run('var e = FF.D.MAPS.sanctuaire_1.entry; FF.Wld.enter("sanctuaire_1", e.x, e.y, "down");');
check('Sanctuaire : canEncounter = true (list)', run('FF.Wld.canEncounter()') === true);
run('FF.Wld.cut = null; FF.UI.dlg = null; FF.UI.menu = null; FF.Game.modal = null; FF.Game.state = "field"; FF.Game.noEnc = false; FF.Wld.mode = "foot"; FF.Bat.st = null;');

const s0 = run('FF.Wld.steps');
const st0 = run('FF.S.steps');
frames(90);
check('immobile 90 frames : Wo.steps inchangé', run('FF.Wld.steps') === s0, 'steps ' + s0 + '->' + run('FF.Wld.steps'));
check('immobile : S.steps inchangé', run('FF.S.steps') === st0);
check('immobile : pas de combat', run('FF.Game.state') === 'field' && !run('!!FF.Bat.st'), 'state=' + run('FF.Game.state'));

/* 10 arrivées de case → +10 pas, pas encore de jet (seuil 14) */
run('FF.Wld.steps = 0; FF.S.steps = 0;');
for (let i = 0; i < 10; i++) run('FF.Wld.tryEncounter();');
check('10 cases : +10 pas', run('FF.Wld.steps') === 10 && run('FF.S.steps') === 10, 'Wo.steps=' + run('FF.Wld.steps'));
check('10 cases : pas de combat (seuil 14)', run('FF.Game.state') === 'field' && !run('!!FF.Bat.st'));

/* 15e case avec random=0 → combat */
run('Math.random = function () { return 0; }; FF.Wld.steps = 14; FF.Bat.st = null; FF.Game.state = "field";');
const rolled = run('FF.Wld.tryEncounter()');
check('15e case (random=0) déclenche une rencontre', rolled === true && run('FF.Game.state') === 'battle', 'state=' + run('FF.Game.state') + ' rolled=' + rolled);

/* gardes */
run('FF.Bat.st = null; FF.Game.state = "field"; FF.Wld.enter("sanctuaire_1", FF.D.MAPS.sanctuaire_1.entry.x, FF.D.MAPS.sanctuaire_1.entry.y, "down"); FF.Game.noEnc = false;');
run('FF.S.settings.encounters = 0;');
check('réglage Rencontres NON → canEncounter false', run('FF.Wld.canEncounter()') === false);
run('FF.S.settings.encounters = 1; FF.Game.noEnc = true;');
check('Game.noEnc → canEncounter false', run('FF.Wld.canEncounter()') === false);
run('FF.Game.noEnc = false; FF.Wld.mode = "ship";');
check('mode ship → canEncounter false', run('FF.Wld.canEncounter()') === false);
run('FF.Wld.mode = "foot";');

console.log(results.join('\n'));
console.log('--- ' + results.filter(r => r.startsWith('PASS')).length + '/' + results.length + ' ok ---');
process.exit(results.some(r => r.startsWith('FAIL')) ? 1 : 0);
