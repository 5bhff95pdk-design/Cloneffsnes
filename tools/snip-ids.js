(()=>{
 FF.Bake.buildThemes(); FF.Assets.build(); FF.Dun.all();
 const D=FF.D, IT=D.IT, bad=new Set(), used=new Set();
 const files=[
  ['src/engine/world.js',['S.add(','S.count(','S.remove(','it:','loot:{it:']],
 ];
 /* parcours textuel non possible ici : on vérifie en évaluant les chemins */
 /* 1) tous les coffres du monde et des donjons */
 const maps=Object.assign({},D.MAPS,FF.Dun.maps);
 Object.values(maps).forEach(m=>(m.ents||[]).forEach(e=>{
   if(e.t==='chest'&&e.loot){ if(e.loot.it&&!IT[e.loot.it]) bad.add('coffre '+m.id+' → '+e.loot.it);
     if(e.loot.spell&&!D.SP[e.loot.spell]) bad.add('coffre '+m.id+' sort → '+e.loot.spell);
     if(e.loot.job&&!D.JOBS[e.loot.job]) bad.add('coffre '+m.id+' emploi → '+e.loot.job); }
   if(e.t==='door'&&e.need&&!IT[e.need]&&!(e.need in {})) { if(!/^(sceau|lanterne|harmonium|clé)/.test(e.need)) bad.add('porte '+m.id+' need → '+e.need); }
   if(e.t==='shop'&&e.shop&&!(e.shop in D.SHOPS)) bad.add('boutique '+m.id+' → '+e.shop);
   if(e.t==='bossgate'){ (e.foes||[]).forEach(f=>{ if(!D.MON[f]) bad.add('bossgate '+m.id+' → '+f); }); if(e.scene&&!(e.scene in (D.SCENES||{}))) bad.add('scène bossgate '+m.id+' → '+e.scene); }
   if(e.t==='scene'&&e.scene&&!(e.scene in (D.SCENES||{}))) bad.add('scène '+m.id+' → '+e.scene);
   if(e.t==='npc'&&e.say&&e.say[0]==='@'&&!(e.say.slice(1) in (D.DLG||{}))) bad.add('réplique '+m.id+' → '+e.say);
 }));
 /* 2) donjons : monstres, boss, trésors, npcs */
 Object.entries(D.DUNGEONS).forEach(([n,c])=>{
  (c.list||[]).forEach(m=>{if(!D.MON[m]) bad.add('rencontre '+n+' → '+m)});
  ['boss','boss2'].forEach(k=>{const b=c[k]; if(b){ (b.foes||[]).forEach(m=>{if(!D.MON[m]) bad.add('boss '+n+' → '+m)}); if(b.scene&&!(b.scene in D.SCENES)) bad.add('scène boss '+n+' → '+b.scene); }});
  (c.chests||[]).forEach(x=>{ if(!IT[x.it]) bad.add('coffre donjon '+n+' → '+x.it); });
  if(c.key&&!IT[c.key]) bad.add('clé '+n+' → '+c.key);
  if(c.npc){ if(c.npc.look&&!(c.npc.look in (D.NPCLOOK||{}))) bad.add('look npc '+n+' → '+c.npc.look); if(c.npc.say&&!(String(c.npc.say).replace('@','') in D.DLG)) bad.add('réplique npc '+n+' → '+c.npc.say); }
  if(c.back&&c.back.map&&!D.MAPS[c.back.map]&&!/^\w+_\d+$/.test(c.back.map)) bad.add('retour '+n+' → '+c.back.map);
  if(!D.MAPS[n+'_1']) bad.add('pas de 1er étage pour '+n);
  else { const m=D.MAPS[n+'_1']; if(!m.entry) bad.add('entrée manquante '+n); }
 });
 /* 3) boutiques */
 Object.entries(D.SHOPS).forEach(([t,s])=>{ (s.obj||[]).forEach(o=>{if(!IT[o.it]) bad.add('boutique '+t+' → '+o.it)}); (s.arms||[]).forEach(o=>{if(!IT[o]) bad.add('armurerie '+t+' → '+o)}); });
 /* 4) sorts des emplois */
 Object.entries(D.JOBS).forEach(([j,o])=>{ Object.entries(o.learn||{}).forEach(([k,arr])=>{ const T=D.TIER[k]||[]; arr.forEach((lv,i)=>{ if(lv&&T[i]&&!D.SP[T[i]]) bad.add('apprentissage '+j+'/'+k+' → '+T[i]); }); }); (o.ab||[]).forEach(a=>{ if(!(a in D.ABILITIES)) bad.add('technique '+j+' → '+a); }); o.eq.forEach(t=>{ if(!/^(sword|greatsword|axe|dagger|spear|staff|rod|bow|fist|harp|light|heavy|hat|helm|acc|shield|robe|armor)$/.test(t)) bad.add('compétence d’équipement inconnue '+j+' → '+t); }); });
 /* 5) monstres : art, butin, sorts */
 Object.entries(D.MON).forEach(([m,mo])=>{
  if(!FF.Assets.enemy[(mo.art||m)+'#'+(mo.skin||0)]) bad.add('art absent pour monstre '+m+' ('+(mo.art||m)+'#'+(mo.skin||0)+')');
  if(mo.drop&&mo.drop.it&&!IT[mo.drop.it]) bad.add('butin '+m+' → '+mo.drop.it);
  if(mo.win){ if(mo.win.it&&!IT[mo.win.it]) bad.add('gain '+m+' → '+mo.win.it); if(mo.win.job&&!D.JOBS[mo.win.job]) bad.add('emploi '+m+' → '+mo.win.job); if(mo.win.spell&&!D.SP[mo.win.spell]) bad.add('sort '+m+' → '+mo.win.spell); }
  (mo.acts||[]).forEach(a=>{ if(a.sp&&!D.SP[a.sp]) bad.add('sort monstre '+m+' → '+a.sp); if(a.ab&&!(a.ab in D.ABILITIES)) bad.add('tech monstre '+m+' → '+a.ab); });
 });
 /* 6) zones de rencontre du monde */
 Object.values(D.MAPS).forEach(m=>{ if(m.enc&&m.enc.list) m.enc.list.forEach(x=>{ if(!D.MON[x]) bad.add('rencontre monde '+m.id+' → '+x); }); if(m.enc&&m.enc.zones) m.enc.zones.forEach(z=>z.list.forEach(x=>{if(!D.MON[x]) bad.add('zone '+m.id+' → '+x)})); });
 /* 7) scènes et répliques */
 Object.entries(D.SCENES||{}).forEach(([n,sc])=>{ (sc.steps||[]).forEach((s,i)=>{ if(s.battle&&s.battle.foes) s.battle.foes.forEach(f=>{if(!D.MON[f]) bad.add('scène '+n+' combat → '+f)}); if(s.scene&&!D.SCENES[s.scene]&&false){} }); });
 return JSON.stringify({n:bad.size, bad:[...bad].slice(0,80)},null,1);
})()
