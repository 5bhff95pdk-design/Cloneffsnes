/* Test ciblé Phase A — persistance des préférences + garde « Secousses ».
   Charge le jeu complet (comme headless-test.js) puis vérifie les correctifs. */
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'ff-iphone', 'src');
const ORDER = ['core/util.js','core/font.js','core/gfx.js','core/input.js','core/audio.js','core/sprites.js','data/tables.js','data/monsters.js','data/story.js','data/maps.js','engine/save.js','engine/bake.js','engine/assets.js','engine/dungeon.js','engine/party.js','engine/battle.js','engine/ui.js','engine/world.js','engine/main.js'];

const noop2 = () => {};
const store = {}; const listeners = {}; const bodyCL = [];
function fakeCtx(){ const n=()=>{}; return {fillStyle:'',strokeStyle:'',globalAlpha:1,imageSmoothingEnabled:false,fillRect:n,clearRect:n,strokeRect:n,drawImage:n,save:n,restore:n,translate:n,scale:n,setTransform:n,beginPath:n,moveTo:n,lineTo:n,stroke:n,fill:n,fillText:n,arc:n,createLinearGradient:()=>({addColorStop:n}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(Math.max(4,w*h)*4),width:w,height:h}),createImageData:(w,h)=>({data:new Uint8ClampedArray(Math.max(4,w*h)*4),width:w,height:h}),putImageData:n}; }
function fakeCanvas(){ const c={style:{},width:0,height:0,classList:{add:noop2,remove:noop2,toggle:noop2,contains:()=>false},addEventListener:noop2,removeEventListener:noop2,querySelectorAll:()=>[],getAttribute:()=>null,getBoundingClientRect:()=>({left:0,top:0,width:720,height:480})}; c.getContext=()=>fakeCtx(); return c; }
const document = {
  createElement:(t)=>(t==='canvas'?fakeCanvas():{style:{},classList:{add:noop2,remove:noop2,toggle:noop2,contains:()=>false},addEventListener:noop2,setAttribute:noop2,querySelectorAll:()=>[]}),
  getElementById:(id)=>(id==='game'||id==='dpad'?fakeCanvas():null),
  querySelector:()=>null, querySelectorAll:()=>[],
  body:{classList:{add:c=>{if(!bodyCL.includes(c))bodyCL.push(c)},remove:c=>{const i=bodyCL.indexOf(c);if(i>=0)bodyCL.splice(i,1)},toggle:(c,on)=>{if(on){if(!bodyCL.includes(c))bodyCL.push(c)}else{const i=bodyCL.indexOf(c);if(i>=0)bodyCL.splice(i,1)}},contains:c=>bodyCL.includes(c)}},
  documentElement:{style:{setProperty:noop2}},
  addEventListener:(ev,cb)=>{(listeners[ev]=listeners[ev]||[]).push(cb)}, readyState:'complete'
};
const ctx = vm.createContext({
  console:{log:noop2,warn:noop2,error:()=>{}},
  Math,JSON,Object,Array,String,Number,Boolean,Date,parseInt,parseFloat,isFinite,isNaN,Set,Map,Error,TypeError,Uint8Array,Uint8ClampedArray,Float32Array,
  document, navigator:{userAgent:'node',serviceWorker:null,vibrate:noop2,getGamepads:()=>[]},
  addEventListener:(ev,cb)=>{(listeners[ev]=listeners[ev]||[]).push(cb)}, removeEventListener:noop2,
  innerWidth:780,innerHeight:520,devicePixelRatio:2, visualViewport:null,
  AudioContext:undefined, webkitAudioContext:undefined,
  localStorage:{getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=''+v},removeItem:k=>{delete store[k]}},
  performance:{now:()=>0}, requestAnimationFrame:()=>0, cancelAnimationFrame:noop2,
  setTimeout:noop2, clearTimeout:noop2, setInterval:()=>0, clearInterval:noop2,
  matchMedia:()=>({matches:false,addListener:noop2}), location:{protocol:'http:',href:'http://x/index.html',origin:'http://x'},
  documentElementEl:null, globalThis:null
});
ctx.window = ctx;
ORDER.forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'), ctx, { filename: f }));
const FF = ctx.FF;
const results = [];
function check(name, ok, detail){ results.push((ok?'PASS ':'FAIL ')+name+(detail?'  ['+detail+']':'')); }

// 1) défauts remplis, pas de champ fantôme fx
store['q4c.settings'] = JSON.stringify({ scan:0, vig:0, textSpeed:2 });
FF.S.loadSettings();
check('loadSettings scan=0', FF.S.settings.scan===0, 'scan='+FF.S.settings.scan);
check('loadSettings vig=0', FF.S.settings.vig===0, 'vig='+FF.S.settings.vig);
check('loadSettings textSpeed=2', FF.S.settings.textSpeed===2);
check('defauts shake/pad remplis', FF.S.settings.shake===1 && FF.S.settings.padHidden===0);
check('champ mort fx supprime', !('fx' in FF.S.settings));

// 2) chemin de boot : Game.loadPrefs recharge
store['q4c.settings'] = JSON.stringify({ scan:0, vig:0 });
FF.Game.loadPrefs();
check('Game.loadPrefs -> scan=0', FF.S.settings.scan===0);

// 3) applyFx applique les classes selon réglages
bodyCL.length=0; FF.Game.applyFx();
check('scan OFF -> pas fx-scan', !bodyCL.includes('fx-scan'));
check('vig OFF -> pas fx-vig', !bodyCL.includes('fx-vig'));
store['q4c.settings']=JSON.stringify({scan:1,vig:1}); FF.Game.loadPrefs(); bodyCL.length=0; FF.Game.applyFx();
check('scan ON -> fx-scan', bodyCL.includes('fx-scan'));
check('vig ON -> fx-vig', bodyCL.includes('fx-vig'));

// 4) découplage vig/scan
store['q4c.settings']=JSON.stringify({scan:1,vig:0}); FF.Game.loadPrefs(); bodyCL.length=0; FF.Game.applyFx();
check('decouplage scan ON / vig OFF', bodyCL.includes('fx-scan') && !bodyCL.includes('fx-vig'));

// 5) garde Secousses
const fx = FF.Gfx.fx;
FF.S.settings.shake=0; fx.shakeT=0; fx.shake(3,.5);
check('secousses OFF -> aucune', fx.shakeT===0, 'shakeT='+fx.shakeT);
FF.S.settings.shake=1; fx.shakeT=0; fx.shake(3,.5);
check('secousses ON -> lancee', fx.shakeT>0, 'shakeT='+fx.shakeT);

console.log(results.join('\n'));
console.log('--- '+results.filter(r=>r.startsWith('PASS')).length+'/'+results.length+' ok ---');
process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
