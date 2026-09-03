/* Traçage pas-à-pas de la scène d'intro : reproduit la séquence du harnais
   (nouvelle partie, puis une impulsion A toutes les ~90 ms) et journalise
   l'état du moteur de scènes pour localiser le point de blocage. */
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'ff-iphone', 'src');
const ORDER = [
  'core/util.js', 'core/font.js', 'core/gfx.js', 'core/input.js', 'core/audio.js', 'core/sprites.js',
  'data/tables.js', 'data/monsters.js', 'data/story.js', 'data/maps.js',
  'engine/save.js', 'engine/bake.js', 'engine/assets.js', 'engine/dungeon.js',
  'engine/party.js', 'engine/battle.js', 'engine/ui.js', 'engine/world.js', 'engine/main.js',
];
function noop() { }
let vnow = 0; const timers = []; let tid = 1;
function vSetTimeout(cb, ms) { timers.push({ id: tid, t: vnow + (ms | 0), cb }); return tid++; }
function pumpTimers() { for (let i = 0; i < 500; i++) { timers.sort((a, b) => a.t - b.t); const n = timers[0]; if (!n || n.t > vnow) return; timers.shift(); try { n.cb(); } catch (e) { } } }
function fakeCtx() {
  const n = () => { };
  return {
    fillStyle: '', strokeStyle: '', globalAlpha: 1, imageSmoothingEnabled: false, font: '', textAlign: '', textBaseline: '',
    fillRect: n, clearRect: n, strokeRect: n, drawImage: n, save: n, restore: n, translate: n, scale: n, setTransform: n,
    beginPath: n, closePath: n, moveTo: n, lineTo: n, stroke: n, fill: n, fillText: n, arc: n, ellipse: n, clip: n,
    measureText: () => ({ width: 0 }), createLinearGradient: () => ({ addColorStop: n }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h) * 4), width: w, height: h }),
    createImageData: (w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h) * 4), width: w, height: h }), putImageData: n,
  };
}
function fakeCanvas() {
  const c = { style: {}, width: 0, height: 0, classList: { add: n0, remove: n0, toggle: n0, contains: () => false }, addEventListener: n0, querySelectorAll: () => [] };
  c.getContext = () => fakeCtx(); return c;
}
function n0() { }
const store = {};
const document = {
  createElement: (t) => (t === 'canvas' ? fakeCanvas() : { style: {}, classList: { add: n0, remove: n0, toggle: n0, contains: () => false }, addEventListener: n0, querySelectorAll: () => [] }),
  getElementById: (id) => (id === 'game' || id === 'dpad' ? fakeCanvas() : null),
  querySelector: () => null, querySelectorAll: () => [],
  body: { classList: { add: n0, remove: n0, toggle: n0, contains: () => false } },
  documentElement: { style: { setProperty: n0 } }, addEventListener: n0, readyState: 'complete',
};
const ctx = vm.createContext({
  console, Math, JSON, Object, Array, String, Number, Boolean, Date, parseInt, parseFloat, isFinite, isNaN,
  Set, Map, Error, TypeError, RangeError, Uint8Array, Uint8ClampedArray, Float32Array,
  document, navigator: { userAgent: 'node', serviceWorker: null, vibrate: n0, getGamepads: () => [] },
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = '' + v }, removeItem: k => { delete store[k] } },
  performance: { now: () => vnow }, requestAnimationFrame: () => 0, cancelAnimationFrame: n0,
  setTimeout: vSetTimeout, clearTimeout: n0, setInterval: () => 0, clearInterval: n0,
  addEventListener: n0, removeEventListener: n0, innerWidth: 780, innerHeight: 520, devicePixelRatio: 2, visualViewport: null,
  matchMedia: () => ({ matches: false, addListener: n0 }), location: { protocol: 'http:', href: 'http://x/', origin: 'http://x' },
});
ctx.window = ctx; ctx.globalThis = ctx;
for (const f of ORDER) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const run = (c) => vm.runInContext(c, ctx);
const DT = 1 / 60;
let frameNo = 0;
function frame() {
  frameNo++;
  vnow += DT * 1000; pumpTimers();
  run(`FF.Gfx.time += ${DT}; FF.Game.step(${DT}); FF.Gfx.present(); FF.In.endFrame();`);
}
function snap(label) {
  const s = run(`(function(){
    var cut = FF.Wld.cut;
    var dlg = FF.UI.dlg;
    return {
      t: (FF.Gfx.time|0),
      state: FF.Game.state,
      cut: cut ? (cut.i + '/' + cut.steps.length + ' pause:' + (cut.pause?1:0) + ' wait:' + cut.wait.toFixed(2) + ' step:' + JSON.stringify(cut.steps[Math.min(cut.i, cut.steps.length-1)]).slice(0,60)) : '-',
      dlg: dlg ? ('L' + dlg.i + ' n:' + Math.floor(dlg.n) + '/' + dlg.total + ' pg:' + dlg.page + '/' + dlg.pages.length) : '-',
      map: FF.Wld.map && FF.Wld.map.id,
      ch: FF.S.ch, introDone: FF.S.f('introDone')
    };
  })()`);
  console.log(label, JSON.stringify(s));
}

run('FF.Game.startOnce();');
run('FF.Game.newGame();');
snap('t0000ms ');
/* 1400 ms comme le harnais, puis 26 impulsions A à 90 ms */
for (let ms = 0; ms < 1400; ms += 90) { for (let f = 0; f < 5; f++) frame(); snap('t' + String(1000 + ms).padStart(4, '0') + 'ms'); }
for (let i = 0; i < 26; i++) {
  run('FF.In.force("a");');
  for (let f = 0; f < 5; f++) frame();
  snap('Z' + String(i + 1).padStart(2, '0') + '     ');
}
/* et on laisse tourner encore 5 s sans input */
for (let ms = 0; ms < 5000; ms += 300) { for (let f = 0; f < 18; f++) frame(); if (ms % 1500 === 0) snap('idle+' + ms + 'ms'); }
snap('FIN     ');
function safe(label, code) { try { console.log(label, run(code)); } catch (e) { console.log(label, 'ERR ' + e.message); } }
safe('toast   :', '(function(){ var t = FF.UI._toast; return t ? JSON.stringify({ t: t.t, w: FF.Font.width(t.t) + 12, life: t.life }) : "null"; })()');
safe('dlg/menu:', 'JSON.stringify({ dlg: !!FF.UI.dlg, menu: !!FF.UI.menu, modal: FF.Game.modal })');
safe('placeT  :', 'FF.Wld.placeT');
safe('fade    :', 'FF.Gfx.fx.fade');
safe('pos     :', 'FF.Wld.p ? FF.Wld.p.gx + "," + FF.Wld.p.gy : "-"');
