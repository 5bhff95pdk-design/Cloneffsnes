const fs=require('fs'),vm=require('vm');
const ctx={console};ctx.global=ctx;vm.createContext(ctx);
for(const f of ['src/core/util.js','src/core/sprites.js']) vm.runInContext(fs.readFileSync('/home/user/ff-iphone/'+f,'utf8'),ctx,{filename:f});
const A=ctx.FF.Spr.ART, ok='k1234epfm t.';
let bad=0;
for(const [name,art] of Object.entries(A)){
  const w=art.rows[0].length;
  art.rows.forEach((r,i)=>{
    if(r.length!==w){console.log(`${name} row ${i}: len ${r.length} != ${w}`);bad++;}
    for(const c of r) if(!ok.includes(c)){console.log(`${name} row ${i}: bad char '${c}'`);bad++;}
  });
  console.log(`${name}: ${w}x${art.rows.length} ${art.rows.every(r=>r.length===w)?'ok':'BAD'}`);
}
console.log(bad?`${bad} problems`:'ALL SPRITES OK');
