const {chromium} = require('playwright');
(async()=>{ try{ const b= await chromium.launch({args:['--no-sandbox']}); const p= await b.newPage(); await p.setContent('<canvas id=c width=10 height=10></canvas>'); const r = await p.evaluate(()=>{const c=document.getElementById('c');const g=c.getContext('2d');g.font='700 22px monospace';g.fillText('A',2,18);return Array.from(g.getImageData(0,0,10,10).data).filter(v=>v>128).length;});
console.log('OK pixels:',r); await b.close(); }catch(e){ console.log('FAIL', e.message.split('\n')[0]); } })();
