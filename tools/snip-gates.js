(()=>{
 const D=FF.D;
 const out=[];
 const doors=Object.values(D.MAPS).filter(m=>m.id==='world')[0].ents.filter(e=>e.t==='door');
 out.push('--- portes du monde ---');
 doors.forEach(e=>{ const t=D.MAPS[e.to]; out.push(`monde(${e.x},${e.y}) → ${e.to} @${e.tx},${e.ty}${e.need?' besoin:'+e.need:''} tailleCible:${t?t.w+'x'+t.h:'ABSENTE'} tuile:${t&&t.rows[e.ty]?'['+t.rows[e.ty][e.tx]+']':'?'}`); });
 out.push('--- tuile du monde sous la porte ---');
 const w=D.MAPS.world;
 doors.forEach(e=>{ out.push(`  monde(${e.x},${e.y}) tuile=${JSON.stringify(w.rows[e.y][e.x])} vers ${e.to}`); });
 ['aurelia','pyrite','azur','givre','cendre','chateau-givre','sanctuaire-crypto'].forEach(id=>{
   const m=D.MAPS[id]; if(!m) return out.push(id+' ABSENT');
   out.push('--- '+id+' ('+m.w+'x'+m.h+') portes vers l’extérieur: '+JSON.stringify((m.ents||[]).filter(e=>e.t==='door').map(e=>({to:e.to,x:e.x,y:e.y,tx:e.tx,ty:e.ty}))) );
   for(let y=0;y<m.h;y++) out.push('   '+String(y).padStart(2)+' '+m.rows[y]);
 });
 Object.entries(D.DUNGEONS).forEach(([n,c])=>{ const t=D.MAPS[c.back.map]; out.push('donjon '+n+' retour → '+c.back.map+' @'+c.back.x+','+c.back.y+' tuile='+JSON.stringify(t&&t.rows[c.back.y]&&t.rows[c.back.y][c.back.x])); });
 return out.join('\n');
})()
