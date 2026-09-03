(()=>{const D=FF.D,m=D.MAPS.world;const o=[];o.push('w='+m.w+' h='+m.h+' len lignes: '+m.rows.map(r=>r.length).filter((v,i,a)=>a.indexOf(v)===i).join(','));
 const doors=m.ents.filter(e=>e.t==='door');
 doors.forEach(e=>{o.push(`(${e.x},${e.y})=${JSON.stringify(m.rows[e.y][e.x])} → ${e.to} ${e.tx},${e.ty} ${e.need?'need '+e.need:''}`);});
 return o.join('\n');})()
