const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:600,height:400}})).newPage();
await p.goto('http://127.0.0.1:4178/ff-iphone/index.html');await p.waitForTimeout(900);
console.log(JSON.stringify(await p.evaluate(()=>{
 FF.Font.build();
 const W=(s)=>FF.Font.width(s);
 const lines=FF.Font.lines("Bienvenue chez Marchand d’Azur. On vend du bon, jamais du rebut.",32);
 return {n:W('n'), upper:W('A'), space:W(' '), cw:FF.Font.CW, spaceG:FF.Font.SPACE, line:W("Bienvenue chez Marchand"), lines:lines.map(l=>({t:l,w:W(l)})), box:236, lineW:FF.Font.LINE};
})));
await b.close();})();
