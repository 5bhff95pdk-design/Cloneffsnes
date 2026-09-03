(()=>{
 const D=FF.D;
 const types={}, eq={};
 Object.entries(D.IT).forEach(([id,it])=>{ const t=(it.k==='weap'?'W:':'A:')+(it.type||it.k); types[t]=(types[t]||0)+1; });
 Object.entries(D.JOBS).forEach(([j,o])=>{ (o.eq||[]).forEach(t=>{ eq[t]=(eq[t]||0)+1; }); });
 const tset=Object.keys(types).map(x=>x.split(':')[1]);
 const orphanTypes=Object.keys(types).filter(x=>!eq[x.split(':')[1]]);
 const deadEq=Object.keys(eq).filter(x=>tset.indexOf(x)<0);
 return JSON.stringify({types, eqCount:eq, orphanTypes, deadEq, jobs:Object.keys(D.JOBS).map(j=>j+': '+(D.JOBS[j].eq||[]).join(',')) },null,1);
})()
