/* Test Phase C / item 12 — interactions secondaires « hors chemin critique ».
   Couvre, sans nécessiter une navigation longue : ouverture de coffres (objet & gils,
   garde « une seule fois »), dialogue PNJ, et le dirigeable (verrou « nacelle »,
   embarquement/débarquement). Boutique/auberge/menus/cristal sont déjà couverts par
   headless-test.js.

   Usage : node tools/parcours-test.js
*/
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'ff-iphone', 'src');
const ORDER = ['core/util.js','core/font.js','core/gfx.js','core/input.js','core/audio.js','core/sprites.js','data/tables.js','data/monsters.js','data/story.js','data/maps.js','engine/save.js','engine/bake.js','engine/assets.js','engine/dungeon.js','engine/party.js','engine/battle.js','engine/ui.js','engine/world.js','engine/main.js'];
const noop = () => {};
const recCL = c => ({ add:x=>{ if(!c.includes(x))c.push(x); }, remove:x=>{const i=c.indexOf(x);if(i>=0)c.splice(i,1);}, toggle:(x,on)=>{ if(on){ if(!c.includes(x))c.push(x);}else{const i=c.indexOf(x);if(i>=0)c.splice(i,1);} }, contains:x=>c.includes(x) });
function fakeCtx(){ return { fillStyle:'',strokeStyle:'',globalAlpha:1,imageSmoothingEnabled:false,font:'',fillRect:noop,clearRect:noop,strokeRect:noop,drawImage:noop,save:noop,restore:noop,translate:noop,scale:noop,setTransform:noop,beginPath:noop,moveTo:noop,lineTo:noop,stroke:noop,fill:noop,fillText:noop,arc:noop,measureText:()=>({width:0}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(Math.max(4,w*h)*4),width:w,height:h}),createImageData:(w,h)=>({data:new Uint8ClampedArray(Math.max(4,w*h)*4),width:w,height:h}),putImageData:noop }; }
function fakeCanvas(){ const c={ style:{},width:0,height:0,classList:recCL([]),addEventListener:noop,removeEventListener:noop,querySelectorAll:()=>[],getAttribute:()=>null,getBoundingClientRect:()=>({left:0,top:0,width:720,height:480}),getContext:()=>fakeCtx() }; return c; }
function fakeEl(){ return { style:{}, classList:recCL([]), addEventListener:noop, removeEventListener:noop, querySelectorAll:()=>[], setAttribute:noop, parentNode:{removeChild:noop}, textContent:'' }; }
const store = {};
const document = {
  createElement: t => (t==='canvas'? fakeCanvas() : fakeEl()),
  getElementById: () => fakeCanvas(),
  querySelector: () => fakeEl(), querySelectorAll: () => [],
  body: { classList: recCL([]) }, documentElement: { style: { setProperty: noop } },
  addEventListener: noop, readyState: 'complete'
};
const ctx = vm.createContext({
  console:{log:noop,warn:noop,error:noop}, Math,JSON,Object,Array,String,Number,Boolean,Date,parseInt,parseFloat,isFinite,isNaN,Set,Map,Error,TypeError,Uint8Array,Uint8ClampedArray,Float32Array,
  document, navigator:{userAgent:'node',serviceWorker:null,vibrate:noop,getGamepads:()=>[]},
  addEventListener:noop, removeEventListener:noop, innerWidth:800,innerHeight:600,devicePixelRatio:2, visualViewport:null,
  AudioContext:undefined, webkitAudioContext:undefined,
  localStorage:{getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=''+v},removeItem:k=>{delete store[k]}},
  performance:{now:()=>0}, requestAnimationFrame:()=>0, cancelAnimationFrame:noop,
  setTimeout:noop, clearTimeout:noop, setInterval:()=>0, clearInterval:noop,
  matchMedia:()=>({matches:false,addListener:noop}), location:{protocol:'http:',href:'http://x/',origin:'http://x'}
});
ctx.window=ctx; ctx.globalThis=ctx; ctx.self=ctx;
ORDER.forEach(f=>vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f}));
const FF=ctx.FF; const run = code => vm.runInContext(code, ctx);
const results=[];
function check(name,ok,detail){ results.push((ok?'PASS ':'FAIL ')+name+(detail?'  ['+detail+']':'')); }
const entAt=(map,type,x,y)=>run(`(function(){return (FF.D.MAPS['${map}'].ents||[]).filter(function(e){return e.t==='${type}'&&e.x===${x}&&e.y===${y};})[0]||null;})()`);

run('FF.Game.startOnce();');
check('boot sans erreur', !FF.Game.error);
run('FF.Game.newGame();');                       // pose le joueur à Aurélia (15,20)
check('run fraîche à Aurélia', run('FF.Wld.map.id')==='aurelia');

/* ---------- Coffre objet (2,17) : potion x2 ---------- */
const pot0 = run('FF.S.count("potion")');
run('FF.Wld.tryInteract(' + (entAt('aurelia','chest',2,17)?'(function(){return FF.D.MAPS.aurelia.ents.filter(function(e){return e.t==="chest"&&e.x===2&&e.y===17;})[0];})()':'null') + ', null, true);');
const pot1 = run('FF.S.count("potion")');
check('coffre potion : +2 potions', pot1===pot0+2, 'potions '+pot0+'->'+pot1);
check('coffre enregistré (trésor once)', run(`FF.S.treasure['aurelia:2,17']===1`));
/* ré-ouverture : rien */
run('FF.Wld.tryInteract((function(){return FF.D.MAPS.aurelia.ents.filter(function(e){return e.t==="chest"&&e.x===2&&e.y===17;})[0];})(), null, true);');
const pot2 = run('FF.S.count("potion")');
check('réouverture coffre : aucun gain', pot2===pot1, 'potions '+pot1+'->'+pot2);

/* ---------- Coffre gils (26,3) : +120 gils once ---------- */
const g0 = run('FF.S.gils');
run('FF.Wld.tryInteract((function(){return FF.D.MAPS.aurelia.ents.filter(function(e){return e.t==="chest"&&e.x===26&&e.y===3;})[0];})(), null, true);');
const g1 = run('FF.S.gils');
check('coffre gils : +120', g1===g0+120, 'gils '+g0+'->'+g1);

/* ---------- Dialogue PNJ (5,8) ---------- */
run('FF.UI.dlg = null; FF.Game.modal = null;');
run('FF.Wld.tryInteract((function(){return FF.D.MAPS.aurelia.ents.filter(function(e){return e.t==="npc"&&e.x===5&&e.y===8;})[0];})(), null, true);');
const dlg = run('!!FF.UI.dlg');
check('PNJ ouvre un dialogue', dlg, 'dlg='+dlg);

/* ---------- Dirigeable ---------- */
run('delete FF.S.flags.ship; FF.S.ship = 0; delete FF.S.inv.nacelle; FF.S.keys.nacelle = 0; delete FF.S.keys.nacelle;');
run('FF.Wld.mode = "foot"; FF.Wld.cut = null; FF.UI.dlg = null;');
run('FF.Wld.board();');                          // sans nacelle ni drapeau
check('embarquement bloqué sans nacelle (mode foot)', run('FF.Wld.mode')==='foot', 'mode='+run('FF.Wld.mode'));
run('FF.UI.dlg = null; FF.S.add(' + "'nacelle',1" + ');');
run('FF.Wld.board();');
check('avec nacelle : embarquement (mode ship)', run('FF.Wld.mode')==='ship', 'mode='+run('FF.Wld.mode'));
/* débarquement sur une tuile ouverte */
run('FF.Wld.p.gx = 15; FF.Wld.p.gy = 20;');      // '.' à Aurélia
run('FF.Wld.land();');
check('débarquement sur terrain ouvert (mode foot)', run('FF.Wld.mode')==='foot', 'mode='+run('FF.Wld.mode'));
/* débarquement interdit sur obstacle : tuile 'M' (montagne) en ship -> solide */
run('FF.Wld.mode="ship"; FF.Wld.p.gx=8; FF.Wld.p.gy=0; FF.UI.dlg=null; FF.Wld.land();');
check('débarquement sur montagne refusé (mode ship conservé)', run('FF.Wld.mode')==='ship', 'mode='+run('FF.Wld.mode'));
run('FF.Wld.mode = "foot";');

console.log(results.join('\n'));
console.log('--- '+results.filter(r=>r.startsWith('PASS')).length+'/'+results.length+' ok ---');
process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
