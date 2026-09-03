const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:780,height:520}})).newPage();
p.on('console',m=>console.log('log:',m.text().slice(0,200)));
p.on('pageerror',e=>console.log('ERR',e.stack.slice(0,400)));
await p.goto('http://127.0.0.1:4178/ff-iphone/index.html');
await p.waitForTimeout(2500);
console.log(JSON.stringify(await p.evaluate(()=>({state:FF.Game.state, ms:FF.Game.bootMs, err:String(FF.Game.error||'')}))));
await b.close();})();
