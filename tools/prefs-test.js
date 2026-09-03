/* Test Phase D — module Prefs unique (q4c.prefs) + migration des clés legacy.
   Usage : node tools/prefs-test.js
*/
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'ff-iphone', 'src');
const ORDER = ['core/util.js','core/font.js','core/gfx.js','core/input.js','core/audio.js','core/sprites.js','data/tables.js','data/monsters.js','data/story.js','data/maps.js','engine/save.js','engine/bake.js','engine/assets.js','engine/dungeon.js','engine/party.js','engine/battle.js','engine/ui.js','engine/world.js','engine/main.js'];
const noop = () => {};
function recCL(c){ return { add:x=>{ if(!c.includes(x))c.push(x); }, remove:x=>{ const i=c.indexOf(x); if(i>=0)c.splice(i,1); }, toggle:(x,on)=>{ if(on){ if(!c.includes(x))c.push(x);} else { const i=c.indexOf(x); if(i>=0)c.splice(i,1);} }, contains:x=>c.includes(x) }; }
function fakeCtx(){ return { fillRect:noop,clearRect:noop,strokeRect:noop,drawImage:noop,save:noop,restore:noop,translate:noop,scale:noop,setTransform:noop,beginPath:noop,moveTo:noop,lineTo:noop,stroke:noop,fill:noop,fillText:noop,arc:noop,measureText:()=>({width:0}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(Math.max(4,w*h)*4),width:w,height:h}),createImageData:(w,h)=>({data:new Uint8ClampedArray(Math.max(4,w*h)*4),width:w,height:h}),putImageData:noop,fillStyle:'',globalAlpha:1 }; }
function fakeCanvas(){ const c={ style:{},width:0,height:0,classList:recCL([]),addEventListener:noop,removeEventListener:noop,querySelectorAll:()=>[],getAttribute:()=>null,getBoundingClientRect:()=>({left:0,top:0,width:720,height:480}) }; c.getContext=()=>fakeCtx(); return c; }
function make(store){
  const document={ createElement:t=>t==='canvas'?fakeCanvas():{style:{},classList:recCL([]),addEventListener:noop,setAttribute:noop,querySelectorAll:()=>[]}, getElementById:()=>fakeCanvas(), querySelector:()=>null, querySelectorAll:()=>[], body:{classList:recCL([])}, documentElement:{style:{setProperty:noop}}, addEventListener:noop, readyState:'complete' };
  const ctx=vm.createContext({ console:{log:noop,warn:noop,error:noop}, Math,JSON,Object,Array,String,Number,Boolean,Date,parseInt,parseFloat,isFinite,isNaN,Set,Map,Error,TypeError,Uint8Array,Uint8ClampedArray,Float32Array, document, navigator:{userAgent:'node',serviceWorker:null,vibrate:noop,getGamepads:()=>[]}, addEventListener:noop, removeEventListener:noop, innerWidth:800, innerHeight:600, devicePixelRatio:2, visualViewport:null, AudioContext:undefined, webkitAudioContext:undefined, localStorage:{ getItem:k=>k in store?store[k]:null, setItem:(k,v)=>{store[k]=''+v;}, removeItem:k=>{delete store[k];} }, performance:{now:()=>0}, requestAnimationFrame:()=>0, cancelAnimationFrame:noop, setTimeout:noop, clearTimeout:noop, setInterval:()=>0, clearInterval:noop, matchMedia:()=>({matches:false,addListener:noop}), location:{protocol:'http:',href:'http://x/',origin:'http://x'} });
  ctx.window=ctx; ctx.globalThis=ctx; ctx.self=ctx;
  ORDER.forEach(f=>vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),ctx,{filename:f}));
  return { FF:ctx.FF, run:code=>vm.runInContext(code,ctx) };
}
const results=[];
function check(name,ok,detail){ results.push((ok?'PASS ':'FAIL ')+name+(detail?'  ['+detail+']':'')); }

/* 1. save écrit q4c.prefs (+ miroir legacy) */
const store={};
const a=make(store);
a.run('FF.Game.startOnce(); FF.S.settings.scan=0; FF.S.settings.vig=0; FF.Snd.settings.muted=true; FF.Snd.settings.musVol=0.25; FF.Prefs.save();');
const uni=JSON.parse(store['q4c.prefs']||'null');
check('Prefs.save écrit q4c.prefs', !!(uni && uni.settings && uni.audio), JSON.stringify(uni));
check('prefs.settings.scan=0', uni && uni.settings && uni.settings.scan===0);
check('prefs.audio.muted=true', uni && uni.audio && uni.audio.muted===true);
check('prefs.audio.musVol=0.25', uni && uni.audio && uni.audio.musVol===0.25);
check('miroir q4c.settings conservé', JSON.parse(store['q4c.settings']).scan===0);

/* 2. rechargement depuis q4c.prefs seul (plus de clés legacy) */
const store2={ 'q4c.prefs': store['q4c.prefs'] };
const b=make(store2);
b.run('FF.Game.startOnce();');
check('boot relit scan depuis q4c.prefs', b.FF.S.settings.scan===0, 'scan='+b.FF.S.settings.scan);
check('boot relit audio.muted depuis q4c.prefs', b.FF.S.audio.muted===true);

/* 3. migration : uniquement les vieilles clés */
const store3={
  'q4c.settings': JSON.stringify({ scan:0, textSpeed:4 }),
  'q4c.audio': JSON.stringify({ muted:true, sfxVol:0.1 })
};
const c=make(store3);
c.run('FF.Prefs.load();');
check('migration settings.textSpeed=4', c.FF.S.settings.textSpeed===4);
check('migration settings.scan=0 (défauts comblés)', c.FF.S.settings.scan===0 && c.FF.S.settings.shake===1);
check('migration audio.sfxVol=0.1', c.FF.S.audio.sfxVol===0.1);
check('migration audio.musVol défaut', c.FF.S.audio.musVol===0.5);

/* 4. applyFx via Prefs.apply */
const store4={ 'q4c.prefs': JSON.stringify({ settings:{ scan:0, vig:1, encounters:1, textSpeed:1, shake:1, padHidden:0 }, audio:{} }) };
const d=make(store4);
d.run('FF.Game.startOnce(); FF.Prefs.apply();');
check('Prefs.apply : pas fx-scan', d.run('document.body.classList.contains("fx-scan")')===false);
check('Prefs.apply : fx-vig', d.run('document.body.classList.contains("fx-vig")')===true);

console.log(results.join('\n'));
console.log('--- '+results.filter(r=>r.startsWith('PASS')).length+'/'+results.length+' ok ---');
process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
