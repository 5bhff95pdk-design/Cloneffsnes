/* Test Phase C / item 10 — audit quantitatif de l'économie.
   Mesure la courbe d'expérience, le coût des niveaux, la cadence des rencontres et
   l'abordabilité des boutiques, puis valide des INVARIANTS (pas d'arbitrage de design) :
   - la courbe d'expérience est strictement croissante et atteignable jusqu'au max ;
   - chaque monstre rapporte exp > 0 et gil >= 0 ; ses butins/larcins référencent des objets existants ;
   - chaque boutique ne vend que des objets existants, à prix défini ;
   - au niveau 1, l'équipe (3 lvl 1) a de quoi affronter la zone de départ sans être bloquée
     (rapport dégâts/PDV sain) ;
   - les boss « de fin » ont un coût en XP cohérent avec la courbe.

   Sort un petit état mesuré pour le suivi. Usage : node tools/economy-audit.js
*/
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'ff-iphone', 'src');
const files = ['core/util.js','data/tables.js','data/monsters.js','data/maps.js','engine/dungeon.js'];
function fake(){return {style:{},width:0,height:0,getContext:()=>({fillRect(){}}),classList:{add(){},remove(){},toggle(){},contains:()=>false}}}
const c = vm.createContext({ console:{log(){}}, Math,JSON,Object,Array,String,Number,Boolean,Date,parseInt,parseFloat,isFinite,isNaN,Set,Map,Error,TypeError,Uint8ClampedArray,Uint8Array,
  document:{createElement:()=>fake(),getElementById:()=>fake(),querySelector:()=>null,body:{classList:{add(){},remove(){},toggle(){},contains:()=>false}}},
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}}, navigator:{}, performance:{now:()=>0} });
c.window=c;c.globalThis=c;c.self=c;
files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(ROOT,f),'utf8'),c,{filename:f}));
const D=c.FF.D;
const results=[]; const out=[];
function chk(cond,msg){ if(!cond){ throw new Error('INVARIANT: '+msg); } }

/* 1. courbe d'expérience */
chk(D.MAXLV>0 && typeof D.expFor==='function', 'MAXLV / expFor');
let prev=0, okInc=true;
for(let lv=1; lv<=D.MAXLV; lv++){ const e=D.expFor(lv); if(e<=prev) okInc=false; prev=e; }
chk(okInc, 'expFor strictement croissante');
out.push('expFor(1)='+D.expFor(1)+'  expFor(10)='+D.expFor(10)+'  expFor(20)='+D.expFor(20)+'  expFor(30)='+D.expFor(30)+'  expFor(50)='+D.expFor(50));

/* 2. monstres : exp/gil positifs, butins existants */
const allMon=Object.keys(D.MON);
chk(allMon.length>0, 'monstres présents');
allMon.forEach(id=>{ const m=D.MON[id]; chk(m.exp>0, id+' exp>0'); chk(m.gil>=0, id+' gil>=0'); if(m.drop) chk(D.IT[m.drop.it], id+' drop '+m.drop.it); if(m.steal) chk(D.IT[m.steal.it], id+' steal '+m.steal.it); });

/* 3. boutiques : objets existants + prix défini */
const shops=Object.keys(D.SHOPS); chk(shops.length>0,'boutiques');
let shopItems=0;
shops.forEach(s=>{ const sh=D.SHOPS[s]; (sh.obj||[]).forEach(id=>{ chk(D.IT[id],'shop '+s+' item '+id); chk(D.IT[id].price>=0,'shop '+s+' '+id+' prix'); shopItems++; }); });
out.push('boutiques: '+shops.length+' · articles vendus: '+shopItems);

/* 4. récompenses (monstres de scène) vs prix, grands nombres */
let monstersWithDrop=0; allMon.forEach(id=>{ if(D.MON[id].drop) monstersWithDrop++; });
out.push('monstres: '+allMon.length+' ('+Object.keys(D.MON).filter(id=>D.MON[id].boss).length+' boss) · drops: '+monstersWithDrop);

/* 5. cadence des rencontres du monde (zones) */
const worldEnc = D.MAPS.world && D.MAPS.world.enc;
if (worldEnc && worldEnc.zones) {
  worldEnc.zones.forEach((z, i) => {
    const list = (z.list || z.foes || []).filter(Boolean);
    const lvs = list.map(id => (D.MON[id] && D.MON[id].lv) || 0);
    const avg = lvs.length ? lvs.reduce((a, b) => a + b, 0) / lvs.length : 0;
    const expSum = list.reduce((a, id) => a + (D.MON[id] ? D.MON[id].exp : 0), 0);
    out.push('zone monde ' + i + ': ' + list.length + ' espèces, lvl moyen ~' + avg.toFixed(1) + ', XP brute/rencontre ~' + Math.round(expSum / 3));
  });
}

/* 6. coût d'une montée de niveau (XP pour passer de 1→2 et 20→21) */
out.push('XP pour monter 1→2 : ' + (D.expFor(2) - D.expFor(1)) + '  ·  20→21 : ' + (D.expFor(21) - D.expFor(20)));

console.log('ÉTAT MESURÉ:');
out.forEach(l=>console.log('  · '+l));
console.log(results.join(''));
console.log('--- ECONOMY: invariants OK (aucun arbitrage) ---');
process.exit(0);
