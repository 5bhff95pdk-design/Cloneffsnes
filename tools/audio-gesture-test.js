/* Test Phase C / item 9 — l'audio ne démarre qu'au premier geste utilisateur réel.
   Reproduit le câblage de démarrage (main.js `arm()`) : boot auto + gestes document.
   Vérifie l'ORDRE : au boot automatique (Game.startOnce) AUCUNE musique de titre ;
   au premier geste (keydown/touchstart/pointerdown ou clic boot-go) Game.unlockAudio
   débloque le contexte et lance la musique de titre, une seule fois.

   Usage : node tools/audio-gesture-test.js
*/
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'ff-iphone', 'src');
const ORDER = ['core/util.js','core/font.js','core/gfx.js','core/input.js','core/audio.js','core/sprites.js','data/tables.js','data/monsters.js','data/story.js','data/maps.js','engine/save.js','engine/bake.js','engine/assets.js','engine/dungeon.js','engine/party.js','engine/battle.js','engine/ui.js','engine/world.js','engine/main.js'];

const noop = () => {};
const recCL = c => ({ add: x=>{ if(!c.includes(x))c.push(x); }, remove: x=>{ const i=c.indexOf(x); if(i>=0)c.splice(i,1); }, toggle:(x,on)=>{ if(on){ if(!c.includes(x))c.push(x);}else{const i=c.indexOf(x);if(i>=0)c.splice(i,1);} }, contains: x=>c.includes(x) });
function fakeCtx(){ return { fillStyle:'',strokeStyle:'',globalAlpha:1,imageSmoothingEnabled:false,font:'',fillRect:noop,clearRect:noop,strokeRect:noop,drawImage:noop,save:noop,restore:noop,translate:noop,scale:noop,setTransform:noop,beginPath:noop,moveTo:noop,lineTo:noop,stroke:noop,fill:noop,fillText:noop,arc:noop,measureText:()=>({width:0}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(Math.max(4,w*h)*4),width:w,height:h}),createImageData:(w,h)=>({data:new Uint8ClampedArray(Math.max(4,w*h)*4),width:w,height:h}),putImageData:noop }; }
function fakeCanvas(){ const c={ style:{},width:0,height:0,classList:recCL([]),addEventListener:noop,removeEventListener:noop,querySelectorAll:()=>[],getAttribute:()=>null,getBoundingClientRect:()=>({left:0,top:0,width:720,height:480}),getContext:()=>fakeCtx() }; return c; }
function fakeEl(cl){ return { style:{}, classList:recCL(cl), addEventListener:noop, removeEventListener:noop, querySelectorAll:()=>[], setAttribute:noop, parentNode:null }; }

const docListeners = {};      // docListeners['keydown'] = [fn]
const elementListeners = {};  // boot-go 'click' etc.
const classes = [];
function mkDocument(){
  const bootEl = fakeEl(['boot']); bootEl.parentNode = { removeChild: noop };
  const goEl = fakeEl([]); goEl.addEventListener = (ev,fn)=>{ (elementListeners['go:'+ev]=elementListeners['go:'+ev]||[]).push(fn); };
  const bootS = fakeEl([]);
  const canvas = fakeCanvas();
  return {
    createElement: t => (t==='canvas' ? fakeCanvas() : fakeEl([])),
    getElementById: id => id==='game'?canvas : id==='boot'?bootEl : id==='boot-go'?goEl : id==='dpad'?fakeCanvas() : bootS,
    querySelector: () => bootS,
    querySelectorAll: () => [],
    body: { classList: recCL(classes) },
    documentElement: { style: { setProperty: noop } },
    addEventListener: (ev, fn) => { (docListeners[ev]=docListeners[ev]||[]).push(fn); },
    readyState: 'complete'
  };
}
const document = mkDocument();
const listeners = {};
const ctx = vm.createContext({
  console:{log:noop,warn:noop,error:noop},
  Math,JSON,Object,Array,String,Number,Boolean,Date,parseInt,parseFloat,isFinite,isNaN,Set,Map,Error,TypeError,Uint8Array,Uint8ClampedArray,Float32Array,
  document, navigator:{userAgent:'node',serviceWorker:null,vibrate:noop,getGamepads:()=>[]},
  addEventListener:(ev,cb)=>{(listeners[ev]=listeners[ev]||[]).push(cb)}, removeEventListener:noop,
  innerWidth:800,innerHeight:600,devicePixelRatio:2, visualViewport:null,
  AudioContext:undefined, webkitAudioContext:undefined,
  localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},
  performance:{now:()=>0}, requestAnimationFrame:()=>0, cancelAnimationFrame:noop,
  setTimeout:noop, clearTimeout:noop, setInterval:()=>0, clearInterval:noop,
  matchMedia:()=>({matches:false,addListener:noop}), location:{protocol:'http:',href:'http://x/',origin:'http://x'}
});
ctx.window=ctx; ctx.globalThis=ctx; ctx.self=ctx;
ORDER.forEach(f=>vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f}));
const FF=ctx.FF;
const run = code => vm.runInContext(code,ctx);
const results=[];
function check(name,ok,detail){ results.push((ok?'PASS ':'FAIL ')+name+(detail?'  ['+detail+']':'')); }

/* 1) Boot automatique : la musique de titre ne doit PAS être lancée */
run('FF.Game.startOnce();');
check('boot auto sans erreur', !FF.Game.error);
check('audioTitle NON déclenché au boot', !FF.Game.audioTitle, 'audioTitle='+FF.Game.audioTitle);
check('musique de titre pas démarrée (M.name != title)', run('FF.Snd.musicName()') !== 'title', 'music='+String(run('FF.Snd.musicName()')));

/* 2) Premier geste réel (keydown) -> unlockAudio lance la musique UNE fois */
const g = docListeners['keydown'] && docListeners['keydown'][0];
check('geste keydown bien enregistré', !!g);
if (g){ g({}); }
check('audioTitle déclenché au premier geste', FF.Game.audioTitle === true);
check('musique de titre démarrée après geste', run('FF.Snd.musicName()') === 'title', 'music='+String(run('FF.Snd.musicName()')));

/* 3) Un 2e geste ne relance pas (idempotent) */
const beforeName = run('FF.Snd.musicName()');
if (g){ g({}); }
check('2e geste : musique inchangée (idempotent)', run('FF.Snd.musicName()') === beforeName, 'music='+String(run('FF.Snd.musicName()')));

/* 4) Le clic « TOUCHEZ POUR COMMENCER » déclenche aussi l'audio */
if (elementListeners['go:click'] && elementListeners['go:click'][0]) elementListeners['go:click'][0]({ preventDefault: noop });
check('clic boot-go = geste (audioTitle true)', FF.Game.audioTitle === true);

console.log(results.join('\n'));
console.log('--- '+results.filter(r=>r.startsWith('PASS')).length+'/'+results.length+' ok ---');
process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
