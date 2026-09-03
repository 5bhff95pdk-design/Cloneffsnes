/* Test Phase C / item 11 — New Game +.
   Vérifie que, après une partie ALLÉE AU BOUT (flag 'ending', save), une
   « Nouvelle Partie + » reparaît bien : la run reprend niveaux / maîtrises
   d'emploi / emplois débloqués / esprits des trois héros fondateurs, tout en
   réinitialisant l'histoire (chapitre 1, drapeaux vierges, carte Aurélia).

   Usage : node tools/ngplus-test.js
*/
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'ff-iphone', 'src');
const ORDER = ['core/util.js','core/font.js','core/gfx.js','core/input.js','core/audio.js','core/sprites.js','data/tables.js','data/monsters.js','data/story.js','data/maps.js','engine/save.js','engine/bake.js','engine/assets.js','engine/dungeon.js','engine/party.js','engine/battle.js','engine/ui.js','engine/world.js','engine/main.js'];
const noop = () => {};
const recCL = c => ({ add: x=>{ if(!c.includes(x))c.push(x); }, remove: x=>{ const i=c.indexOf(x); if(i>=0)c.splice(i,1); }, toggle:(x,on)=>{ if(on){ if(!c.includes(x))c.push(x);}else{const i=c.indexOf(x);if(i>=0)c.splice(i,1);} }, contains: x=>c.includes(x) });
function fakeCtx(){ return { fillStyle:'',strokeStyle:'',globalAlpha:1,imageSmoothingEnabled:false,font:'',fillRect:noop,clearRect:noop,strokeRect:noop,drawImage:noop,save:noop,restore:noop,translate:noop,scale:noop,setTransform:noop,beginPath:noop,moveTo:noop,lineTo:noop,stroke:noop,fill:noop,fillText:noop,arc:noop,measureText:()=>({width:0}),createLinearGradient:()=>({addColorStop:noop}),createRadialGradient:()=>({addColorStop:noop}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(Math.max(4,w*h)*4),width:w,height:h}),createImageData:(w,h)=>({data:new Uint8ClampedArray(Math.max(4,w*h)*4),width:w,height:h}),putImageData:noop }; }
function fakeCanvas(){ const c={ style:{},width:0,height:0,classList:recCL([]),addEventListener:noop,removeEventListener:noop,querySelectorAll:()=>[],getAttribute:()=>null,getBoundingClientRect:()=>({left:0,top:0,width:720,height:480}),getContext:()=>fakeCtx() }; return c; }
function fakeEl(){ return { style:{}, classList:recCL([]), addEventListener:noop, removeEventListener:noop, querySelectorAll:()=>[], setAttribute:noop, parentNode:{removeChild:noop} }; }
const store = {};
function makeContext(){
  const bootS = fakeEl();
  const document = {
    createElement: t => (t==='canvas'? fakeCanvas() : fakeEl()),
    getElementById: () => fakeCanvas(),
    querySelector: () => bootS, querySelectorAll: () => [],
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
  return { FF:ctx.FF, run:code=>vm.runInContext(code,ctx) };
}
const { FF, run } = makeContext();
const results=[];
function check(name,ok,detail){ results.push((ok?'PASS ':'FAIL ')+name+(detail?'  ['+detail+']':'')); }

/* ---------- 1. une partie menée au bout ---------- */
run('FF.Game.startOnce();');
check('boot sans erreur', !FF.Game.error);
run('FF.Game.newGame();');                       // run fraîche (Aurélia, trio lvl 1)
check('run initiale : trio lvl 1', run(`FF.S.members.arno && FF.S.members.arno.lv === 1`));
// on fait progresser l'équipe puis on TERMINE
run(`(function(){ FF.S.order.forEach(function(id){ var m=FF.S.members[id]; m.lv=20; m.jlv[m.job]=20; FF.P.recalc(m); }); FF.S.jobs.war=1; FF.S.summons.gault=1; FF.S.members.arno.gifted=(FF.S.members.arno.gifted||[]).concat(["soin"]); FF.S.set("ending"); })();`);
check('avant fin : arno lvl 20', run('FF.S.members.arno.lv') === 20);
run('FF.Save.save("1");');
const meta1 = run('FF.Save.meta("1")');
check('save casier 1 marqué cleared', !!(meta1 && meta1.cleared), 'cleared='+!!(meta1&&meta1.cleared));
check('clearedSlots contient 1', run('FF.Game.clearedSlots().indexOf("1") >= 0'), JSON.stringify(run('FF.Game.clearedSlots()')));
check('titre propose la Nouvelle Partie +', run('FF.Game.titleOpts().some(function(o){ return o.k === "ngp"; })'));

/* ---------- 2. lancer la Nouvelle Partie + ---------- */
run('FF.Game.newGamePlus();');
check('NG+ : chapitre 1', run('FF.S.ch') === 1, 'ch='+run('FF.S.ch'));
check('NG+ : carte Aurélia (state field)', run('FF.Wld.map.id') === 'aurelia', run('FF.Wld.map.id'));
check('NG+ : drapeau ngp posé', run('FF.S.f("ngp")') === true);
check('NG+ : histoire réinitialisée (ending absent)', run('FF.S.f("ending")') === false);
check('NG+ : arno garde son niveau 20', run('FF.S.members.arno.lv') === 20, 'lv='+run('FF.S.members.arno.lv'));
check('NG+ : myrelle garde son niveau 20', run('FF.S.members.myrelle.lv') === 20);
check('NG+ : sica garde son niveau 20', run('FF.S.members.sica.lv') === 20);
check('NG+ : emploi Guerrier conservé', run('!!FF.S.jobs.war') === true);
check('NG+ : esprit conservé', run('!!FF.S.summons.gault') === true);
check('NG+ : sorts offerts conservés (gifted arno)', run('(FF.S.members.arno.gifted||[]).indexOf("soin") >= 0'));
check('NG+ : inventaire reparti des défauts (gils 250)', run('FF.S.gils') === 250, 'gils='+run('FF.S.gils'));
check('NG+ : sorts de maîtrise ré-appris (myrelle)', run('Object.keys(FF.S.members.myrelle.learn).length') >= 1);

/* ---------- 3. sans partie finie : NG+ indisponible, fallback frais ---------- */
run('FF.Save.del("1");');
check('sans partie finie : clearedSlots vide', run('FF.Game.clearedSlots().length') === 0);
check('sans partie finie : pas d’option ngp au titre', run('!FF.Game.titleOpts().some(function(o){ return o.k === "ngp"; })'));
run('FF.Game.newGamePlus();');                    // doit retomber sur une nouvelle partie fraîche
check('fallback NG+ = nouvelle partie fraîche (arno lvl 1)', run('FF.S.members.arno.lv') === 1, 'lv='+run('FF.S.members.arno.lv'));

console.log(results.join('\n'));
console.log('--- '+results.filter(r=>r.startsWith('PASS')).length+'/'+results.length+' ok ---');
process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
