const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({viewport:{width:780,height:520}})).newPage();
  const logs=[];
  p.on('pageerror', e=>logs.push('PAGEERROR: '+(e.stack||e.message)));
  p.on('console', m=>logs.push(m.type()+': '+m.text()));
  await p.goto(process.env.URL||'http://127.0.0.1:4178/ff-iphone/index.html');
  await p.waitForTimeout(1500);
  const st = await p.evaluate(()=>({state:FF.Game.state, err:String(FF.Game.error&&FF.Game.error.message||FF.Game.error||''), Dunall: typeof FF.Dun.all, maps: Object.keys(FF.D.MAPS).length}));
  console.log(JSON.stringify(st));
  logs.slice(0,40).forEach(l=>console.log(l));
  await b.close();
})();
