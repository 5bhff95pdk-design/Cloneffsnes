const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:500,height:600}})).newPage();
p.on('pageerror',e=>console.log('ERR',e.stack.split('\n').slice(0,4).join(' | ')));
p.on('console',m=>{if(m.type()==='error')console.log('C',m.text().slice(0,300));});
await p.goto('http://127.0.0.1:4178/ff-iphone/index.html');await p.waitForTimeout(900);
console.log(JSON.stringify(await p.evaluate(()=>{
 FF.Game.boot(document.getElementById('game')); FF.Game.newGame(); FF.Game.noEnc=true; FF.Wld.cut=null; FF.UI.dlg=null; FF.Game.modal=null;
 FF.Wld.enter('aurelia',12,13,'down');
 const out={};
 // 1) marche avec les touches
 const before={x:FF.Wld.p.gx,y:FF.Wld.p.gy};
 FF.In.K=FF.In.K||{};
 return new Promise(res=>{ FF.In.K.left=1; setTimeout(()=>{FF.In.K.left=0; setTimeout(()=>{ out.marche={avant:before, apres:{x:FF.Wld.p.gx,y:FF.Wld.p.gy}};
   // 2) sort de champ
   const a=FF.S.members.arno, mr=FF.S.members.myrelle; a.mp=a.stats.pm; mr.hp=1;
   FF.UI.castField(a, FF.D.SP.soin);
   out.soin={mp:a.mp, hpMr:mr.hp, pv:mr.stats.pv, dlg: FF.UI.dlg?FF.UI.dlg.linesArr:null};
   FF.UI.dlg=null; FF.Game.modal=null;
   // 3) dirigeable
   FF.S.ship=1; FF.S.set('ship'); FF.Wld.enter('world',30,14,'down'); FF.Wld.board();
   const p0={x:FF.Wld.p.gx,y:FF.Wld.p.gy}; FF.In.K.up=1;
   setTimeout(()=>{FF.In.K.up=0; out.vol={avant:p0, apres:{x:FF.Wld.p.gx,y:FF.Wld.p.gy}, mode:FF.Wld.mode, vitesse:FF.Wld.speed||null}; res(JSON.stringify(out));},700);
  },80);},500);
})));
await b.close();})();
