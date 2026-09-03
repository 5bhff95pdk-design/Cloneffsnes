const {chromium}=require('playwright');
const errs=[];
(async()=>{
 const b=await chromium.launch();
 const p=await (await b.newContext({viewport:{width:780,height:520}})).newPage();
 p.on('pageerror',e=>errs.push('PAGEERROR '+(e.stack||e.message).split('\n').slice(0,3).join(' | ')));
 p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text().slice(0,220)); });
 await p.goto('http://127.0.0.1:4178/ff-iphone/index.html'); await p.waitForTimeout(1000);
 await p.evaluate(()=>{ FF.Game.boot(document.getElementById('game')); FF.Game.newGame(); FF.Game.noEnc=true; FF.Wld.cut=null; FF.UI.dlg=null; FF.Wld.enter('aurelia',15,20,'down'); FF.S.order.forEach(id=>FF.P.giveExp(FF.S.members[id], 6000)); FF.S.allMembers().forEach(m=>{FF.P.recalc(m); FF.P.healFull(m);}); });
 const t=async(name,fn)=>{ try{ const r=await p.evaluate(fn); console.log('✓',name,JSON.stringify(r).slice(0,300)); return r;}catch(e){ console.log('✗',name,e.message.split('\n')[0]); errs.push('TEST '+name+': '+e.message.split('\n')[0]); } };
 await t('état après amorçage',()=>({state:FF.Game.state, lv:FF.S.order.map(i=>FF.S.members[i].lv), pv:FF.S.order.map(i=>FF.S.members[i].stats.pv)}));
 await t('auberge (inn-aurelia)',()=>{ FF.Wld.enter('inn-aurelia',6,6,'up'); const bed=(FF.Wld.map.ents||[]).find(e=>e.t==='bed'); FF.S.allMembers().forEach(m=>{m.hp=1;m.mp=0;}); if(bed) FF.Wld.tryInteract(bed,{},true); return {map:FF.Wld.map.id, dlg: !!FF.UI.dlg};});
 await t('confirmer la chambre',()=>{ const m=FF.UI.menu; if(!m) return 'pas de menu (dialogue ouvert ?)'; m.L.onSel(m.L.items[0]); return {hp:FF.S.order.map(i=>FF.S.members[i].hp|0)};});
 await t('sort de champ (soin)',()=>{ FF.UI.close(); const a=FF.S.members.arno, mr=FF.S.members.myrelle; a.mp=a.stats.pm; mr.hp=1; FF.UI.castField(a, FF.D.SP.soin); return {hpMyrelle:mr.hp|0, mpRestant:a.mp|0};});
 await t('équipement direct',()=>{ FF.UI.close(); FF.S.add('plaque',1); const before=FF.S.members.arno.stats.def; const ok=FF.P.equip(FF.S.members.arno,'plaque'); return {ok:!!ok, before, after:FF.S.members.arno.stats.def, slot:FF.S.members.arno.equip.armor};});
 await t('menu équipement complet',()=>{ FF.UI.close(); FF.UI.equipMenu('arno'); const m=FF.UI.menu; if(!m) return '!'; const armor=m.L.items.find(i=>/ARMURE|CORPS/.test(i.t)); if(armor){m.L.onSel(armor);} return {apres:m.sub||'ok', items:m.L.items.map(i=>i.t).slice(0,6)};});
 await t('aller sanctuaire_1 → escaliers',()=>{ const m0=FF.D.MAPS.sanctuaire_1; FF.Wld.enter('sanctuaire_1', m0.entry.x, m0.entry.y,'up'); const st=(FF.Wld.map.ents||[]).find(e=>e.t==='stairs'); if(!st) return 'pas descenders'; FF.Wld.tryInteract(st,{},true); return {vers:st.to};});
 await p.waitForTimeout(600);
 await t('à l étage 2',()=>({map:FF.Wld.map.id, pos:{x:FF.Wld.p.gx,y:FF.Wld.p.gy}, sol:FF.Wld.tileAt(FF.Wld.p.gx,FF.Wld.p.gy), ents:(FF.Wld.map.ents||[]).map(e=>e.t).join(','), entree:!!FF.Wld.map.ents.find(e=>e.t==='stairsback')}));
 await t('remonte (stairsback)',()=>{ const back=(FF.Wld.map.ents||[]).find(e=>e.t==='stairsback'); FF.Wld.tryInteract(back,{},true); return {cible:back.to};});
 await p.waitForTimeout(600);
 await t('de retour étage 1',()=>({map:FF.Wld.map.id, pos:{x:FF.Wld.p.gx,y:FF.Wld.p.gy}, sol:FF.Wld.tileAt(FF.Wld.p.gx,FF.Wld.p.gy)}));
 await t('sortie du donjon',()=>{ const d=(FF.Wld.map.ents||[]).find(e=>e.t==='door'); FF.Wld.tryInteract(d,{},true); return {to:d.to};});
 await p.waitForTimeout(600);
 await t('de retour au monde',()=>({map:FF.Wld.map.id, pos:{x:FF.Wld.p.gx,y:FF.Wld.p.gy}, sol:FF.Wld.tileAt(FF.Wld.p.gx,FF.Wld.p.gy)}));
 // boss du sanctuaire (étage 2) avec bossgate
 await t('gate du boss',()=>{ const m0=FF.D.MAPS.sanctuaire_2; FF.Wld.enter('sanctuaire_2', FF.D.MAPS.sanctuaire_1.entry.x, FF.D.MAPS.sanctuaire_1.entry.y,'up'); const g=(FF.Wld.map.ents||[]).find(e=>e.t==='bossgate'); if(!g) return 'aucun gate'; FF.Wld.tryInteract(g,{},true); return {state:FF.Game.state, mode:FF.Bat.st&&FF.Bat.st.mode, foes:FF.Bat.st&&FF.Bat.st.foes.map(f=>f.name+'|'+f.hp), script: !!(FF.Bat.st&&FF.Bat.st.script)};});
 await p.waitForTimeout(700);
 // botter les fesses du boss en tapant A jusqu'à la victoire
 await p.evaluate(()=>{ if(FF.Bat.st) FF.Bat.st.foes.forEach(f=>{f.hp=40;}); });
 let end=null;
 for(let i=0;i<160;i++){ const st=await p.evaluate(()=>{ if(!FF.Bat.st) return null; const s=FF.Bat.st; if(s.mode==='cmd'||s.mode==='target') FF.In.force('a'); else if(s.mode==='win'&&s.showResult) FF.In.force('a'); return {mode:s.mode, hp:s.foes.map(f=>f.hp|0), al:s.allies.map(a=>a.hp|0)};}); if(!st){end=i;break;} await p.waitForTimeout(90); }
 console.log('combat de boss:', end!=null?('terminé itéré='+end):'toujours en cours');
 await t('après boss',()=>({state:FF.Game.state, flags:Object.keys(FF.S.flags), map:FF.Wld.map.id, cut:FF.Wld.cut&&FF.Wld.cut.id}));
 await p.waitForTimeout(700);
 await t('scène post-boss',()=>({cut:FF.Wld.cut&&FF.Wld.cut.id, i:FF.Wld.cut&&FF.Wld.cut.i, dlg: FF.UI.dlg?FF.UI.dlg.linesArr:null}));
 for(let i=0;i<40;i++){ await p.evaluate(()=>{ if(FF.UI.dlg) FF.In.force('a'); }); await p.waitForTimeout(60); }
 await t('après scène',()=>({flags:FF.S.flags, map:FF.Wld.map.id, chap:FF.S.ch, inv:FF.S.keys}));
 await t('dirigeable',()=>{ FF.S.set('ship'); FF.S.ship=1; FF.Wld.enter('world',30,10,'down'); FF.Wld.board(); return {mode:FF.Wld.mode};});
 await p.keyboard.down('ArrowUp');
 await p.waitForTimeout(900);
 await p.keyboard.down('ArrowRight');
 await p.waitForTimeout(900);
 await p.keyboard.up('ArrowRight'); await p.keyboard.up('ArrowUp');
 await t('position en vol',()=>({x:FF.Wld.p.gx,y:FF.Wld.p.gy,mode:FF.Wld.mode}));
 await t('atterrir',()=>{ FF.Wld.land(); return {mode:FF.Wld.mode, pos:{x:FF.Wld.p.gx,y:FF.Wld.p.gy}};});
 await t('sauvegarde+chargement',()=>{ FF.S.gil(500); const ok=FF.Save.save('2'); const before=FF.S.gils; FF.Save.load('2'); return {ok, before, after:FF.S.gils, meta:FF.Save.meta('2')};});
 await p.screenshot({path:'/home/user/shots/f2-fin.png'});
 console.log(errs.length? 'ERREURS:\n  '+errs.slice(0,15).join('\n  '):'AUCUNE ERREUR');
 await b.close(); process.exit(errs.length?1:0);
})();
