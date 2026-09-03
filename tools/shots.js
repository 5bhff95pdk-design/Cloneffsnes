const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const p=await ctx.newPage();
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('http://127.0.0.1:4178/ff-iphone/index.html'); await p.waitForTimeout(1200);
 const sh=(n)=>p.screenshot({path:'/home/user/shots/m-'+n+'.png'});
 await sh('01-titre');
 await p.evaluate(()=>{FF.Game.newGame();});
 await p.waitForTimeout(1600);
 for(let i=0;i<30;i++){ await p.evaluate(()=>{ if(FF.UI.dlg) FF.In.force('a'); }); await p.waitForTimeout(120);} 
 await sh('02-intro');
 await p.evaluate(()=>{FF.Game.noEnc=true; FF.Wld.cut=null; FF.UI.dlg=null; FF.Game.modal=null; FF.Wld.enter('aurelia',12,13,'down');});
 await p.waitForTimeout(700); await sh('03-ville');
 await p.evaluate(()=>{FF.Wld.enter('pyrite',15,10,'down');}); await p.waitForTimeout(600); await sh('04-ville2');
 await p.evaluate(()=>{FF.Wld.enter('givre',15,6,'down');}); await p.waitForTimeout(600); await sh('05-neige');
 await p.evaluate(()=>{FF.Wld.enter('cendre',13,6,'down');}); await p.waitForTimeout(600); await sh('06-lave');
 await p.evaluate(()=>{const m=FF.D.MAPS.sanctuaire_1; FF.Wld.enter('sanctuaire_1',m.entry.x,m.entry.y,'up');}); await p.waitForTimeout(600); await sh('07-donjon');
 await p.evaluate(()=>{FF.Wld.enter('inn-aurelia',6,5,'up');}); await p.waitForTimeout(500); await sh('08-auberge');
 await p.evaluate(()=>{const m=FF.D.MAPS.tour_2; if(m) FF.Wld.enter('tour_2',m.entry.x,m.entry.y,'up'); else FF.Wld.enter('tour_1',FF.D.MAPS.tour_1.entry.x,FF.D.MAPS.tour_1.entry.y,'up');}); await p.waitForTimeout(600); await sh('09-tour');
 await p.evaluate(()=>{FF.UI.openMenu();}); await p.waitForTimeout(400); await sh('10-menu');
 await p.evaluate(()=>{FF.UI.close(); FF.UI.statMenu('arno');}); await p.waitForTimeout(300); await sh('11-stat');
 await p.evaluate(()=>{FF.UI.close(); FF.UI.equipMenu('arno');}); await p.waitForTimeout(300); await sh('12-equip');
 await p.evaluate(()=>{FF.UI.close(); FF.UI.shop({shop:'azur',kind:'arms'});}); await p.waitForTimeout(300); await sh('13-boutique');
 await p.evaluate(()=>{FF.UI.close(); FF.UI.crystal();}); await p.waitForTimeout(300); await sh('14-cristal');
 await p.evaluate(()=>{FF.UI.close(); FF.UI.saveScreen('save');}); await p.waitForTimeout(300); await sh('15-save');
 await p.evaluate(()=>{FF.UI.close(); FF.UI.config();}); await p.waitForTimeout(300); await sh('16-options');
 await p.evaluate(()=>{FF.UI.close(); FF.UI.partyMenu();}); await p.waitForTimeout(300); await sh('17-equipe');
 await p.evaluate(()=>{FF.UI.close(); FF.Game.battle({foes:['grogne','araignee','squele'],bg:'cave',music:'battle'});}); await p.waitForTimeout(1800); await sh('18-combat');
 await p.evaluate(()=>{ if(FF.Bat.st){FF.Bat.st.mode='cmd'; FF.Bat.st.cmds=['atk','mag','tea','it','def','run']; FF.Bat.st.actor=FF.Bat.st.allies[0]; FF.Bat.st.mode='cmd';} });
 await p.waitForTimeout(300); await sh('19-combat-menu');
 await p.evaluate(()=>{ if(FF.Bat.st){FF.Bat.st.mode='target'; FF.Bat.st.tgtSide='foes'; FF.Bat.st.pending={kind:'atk'};} });
 await p.waitForTimeout(300); await sh('20-cible');
 await p.evaluate(()=>{ if(FF.Bat.st){ FF.Bat.st.mode='win'; FF.Bat.st.showResult=1; FF.Bat.st.result={exp:1240,gil:640,drops:['hipotion'],levels:[{id:'arno',name:'Arno',ups:[{lv:12,pv:14,pm:3,learned:['feu']}]}],mon:['grogne','araignee','squele']};} });
 await p.waitForTimeout(400); await sh('21-victoire');
 // donjon vue "sky" + dirigeable
 await p.evaluate(()=>{ FF.Bat.st=null; FF.Game.state='field'; FF.S.ship=1; FF.S.set('ship'); FF.Wld.enter('world',30,14,'down'); FF.Wld.board(); });
 await p.waitForTimeout(900); await sh('22-dirigeable');
 await p.evaluate(()=>{ FF.Wld.land && FF.Wld.land(); FF.S.ship=0; });
 await p.waitForTimeout(500);
 // cartes de monstres (bestiaire)
 await p.evaluate(()=>{ window.__b=true; });
 console.log('shots faits');
 await b.close();
})();
