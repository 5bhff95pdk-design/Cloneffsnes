/* Test Phase B — « boot navigateur » réifié + persistance des préférences au rechargement.
   Reproduit le vrai chemin de démarrage (main.js `arm()` → `Game.startOnce()` → boot → loadPrefs → applyFx)
   dans un DOM factice avec classList qui enregistre, puis simule un RECLARGEMENT de page
   (2e contexte frais partageant le même localStorage) pour verrouiller P1/P4 par test.

   Usage : node tools/boot-prefs-test.js   (ne requiert aucun navigateur)
*/
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'ff-iphone', 'src');
const ORDER = ['core/util.js','core/font.js','core/gfx.js','core/input.js','core/audio.js','core/sprites.js','data/tables.js','data/monsters.js','data/story.js','data/maps.js','engine/save.js','engine/bake.js','engine/assets.js','engine/dungeon.js','engine/party.js','engine/battle.js','engine/ui.js','engine/world.js','engine/main.js'];

const noop = () => {};
function recordingCL(classes) {
  return {
    add: c => { if (!classes.includes(c)) classes.push(c); },
    remove: c => { const i = classes.indexOf(c); if (i >= 0) classes.splice(i, 1); },
    toggle: (c, on) => { if (on) { if (!classes.includes(c)) classes.push(c); } else { const i = classes.indexOf(c); if (i >= 0) classes.splice(i, 1); } },
    contains: c => classes.includes(c)
  };
}
function fakeCtx() {
  return { fillStyle:'',strokeStyle:'',globalAlpha:1,imageSmoothingEnabled:false,font:'',
    fillRect:noop,clearRect:noop,strokeRect:noop,drawImage:noop,save:noop,restore:noop,
    translate:noop,scale:noop,setTransform:noop,rotate:noop,beginPath:noop,moveTo:noop,lineTo:noop,
    stroke:noop,fill:noop,fillText:noop,arc:noop,measureText:()=>({width:0}),
    createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),
    getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(Math.max(4,w*h)*4),width:w,height:h}),
    createImageData:(w,h)=>({data:new Uint8ClampedArray(Math.max(4,w*h)*4),width:w,height:h}),putImageData:noop };
}
function fakeCanvas() {
  const c = { style:{}, width:0, height:0, classList:recordingCL([]),
    addEventListener:noop, removeEventListener:noop, querySelectorAll:()=>[], getAttribute:()=>null,
    getBoundingClientRect:()=>({left:0,top:0,width:720,height:480}) };
  c.getContext = () => fakeCtx();
  return c;
}

/* Construit un contexte « page » fraîche partageant un localStorage donné.
   Renvoie { FF, classes, run } */
function makeContext(store, classes) {
  const document = {
    createElement: t => (t === 'canvas' ? fakeCanvas() : { style:{}, classList:recordingCL([]), addEventListener:noop, setAttribute:noop, querySelectorAll:()=>[] }),
    getElementById: () => fakeCanvas(),
    querySelector: () => ({ classList: recordingCL([]), addEventListener:noop }),
    querySelectorAll: () => [],
    body: { classList: recordingCL(classes) },
    documentElement: { style: { setProperty: noop } },
    addEventListener: noop,
    readyState: 'complete'
  };
  const listeners = {};
  const ctx = vm.createContext({
    console: { log: noop, warn: noop, error: noop },
    Math, JSON, Object, Array, String, Number, Boolean, Date, parseInt, parseFloat, isFinite, isNaN,
    Set, Map, Error, TypeError, RangeError, Uint8Array, Uint8ClampedArray, Float32Array,
    document, navigator: { userAgent: 'node', serviceWorker: null, vibrate: noop, getGamepads: () => [] },
    addEventListener: (ev, cb) => { (listeners[ev] = listeners[ev] || []).push(cb); },
    removeEventListener: noop, innerWidth: 800, innerHeight: 600, devicePixelRatio: 2,
    visualViewport: null, AudioContext: undefined, webkitAudioContext: undefined,
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = '' + v; }, removeItem: k => { delete store[k]; } },
    performance: { now: () => 0 }, requestAnimationFrame: () => 0, cancelAnimationFrame: noop,
    setTimeout: noop, clearTimeout: noop, setInterval: () => 0, clearInterval: noop,
    matchMedia: () => ({ matches: false, addListener: noop }),
    location: { protocol: 'http:', href: 'http://x/index.html', origin: 'http://x' }
  });
  ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
  for (const f of ORDER) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  return { FF: ctx.FF, run: code => vm.runInContext(code, ctx) };
}

const store = {};
const results = [];
function check(name, ok, detail) { results.push((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  [' + detail + ']' : '')); }

/* ---------- 1er chargement : défauts ---------- */
const c1 = makeContext(store, []);
c1.run('FF.Game.startOnce();');                       // chemin de boot réel
check('boot OK (pas d’erreur) ctx1', !c1.FF.Game.error);
check('defauts : scanlines ON (scan=1)', c1.FF.S.settings.scan === 1, 'scan=' + c1.FF.S.settings.scan);
check('class fx-scan appliquée au boot', c1.run('document.body.classList.contains("fx-scan")') === true);
check('class fx-vig appliquée au boot', c1.run('document.body.classList.contains("fx-vig")') === true);

/* ---------- le joueur désactive scanlines + vignette (== actions du menu CONFIG) ---------- */
c1.run('FF.S.settings.scan = 0; FF.S.settings.vig = 0; FF.Save.savePrefs();');
const persisted = JSON.parse(store['q4c.settings']);
check('persisté dans q4c.settings', persisted.scan === 0 && persisted.vig === 0, JSON.stringify(persisted));

/* ---------- RECLARGEMENT : 2e contexte frais, même localStorage ---------- */
const c2 = makeContext(store, []);
c2.run('FF.Game.startOnce();');                        // boot réel, doit relire les préférences
check('boot OK ctx2', !c2.FF.Game.error);
check('ctx2 a relu scan=0', c2.FF.S.settings.scan === 0, 'scan=' + c2.FF.S.settings.scan);
check('ctx2 a relu vig=0', c2.FF.S.settings.vig === 0, 'vig=' + c2.FF.S.settings.vig);
check('ctx2 applyFx : fx-scan ABSENTE', c2.run('document.body.classList.contains("fx-scan")') === false);
check('ctx2 applyFx : fx-vig ABSENTE', c2.run('document.body.classList.contains("fx-vig")') === false);
/* un autre réglage embarqué est aussi restauré */
c2.run('FF.S.settings.textSpeed = 4; FF.Save.savePrefs();');
const c3 = makeContext(store, []);
c3.run('FF.Game.startOnce();');
check('rechargement conserve textSpeed=4', c3.FF.S.settings.textSpeed === 4, 'textSpeed=' + c3.FF.S.settings.textSpeed);

/* ---------- garde « Secousses » (P2) ---------- */
c3.run('FF.S.settings.shake = 0; FF.Gfx.fx.shakeT = 0; FF.Gfx.fx.shake(3, .5);');
check('Secousses OFF → aucune lancée', c3.run('FF.Gfx.fx.shakeT') === 0, 'shakeT=' + c3.run('FF.Gfx.fx.shakeT'));
c3.run('FF.S.settings.shake = 1; FF.Gfx.fx.shakeT = 0; FF.Gfx.fx.shake(3, .5);');
check('Secousses ON → lancée', c3.run('FF.Gfx.fx.shakeT') > 0, 'shakeT=' + c3.run('FF.Gfx.fx.shakeT'));

console.log(results.join('\n'));
console.log('--- ' + results.filter(r => r.startsWith('PASS')).length + '/' + results.length + ' ok ---');
process.exit(results.some(r => r.startsWith('FAIL')) ? 1 : 0);
