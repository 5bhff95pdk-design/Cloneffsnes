(()=>{
 FF.Bake.buildThemes(); FF.Dun.all();
 const D=FF.D, T=FF.Bake.themes;
 const maps=Object.assign({},D.MAPS,FF.Dun.maps);
 const solid=(mid,x,y)=>{ const m=maps[mid]; if(!m) return 'MISSING'; const th=T[m.theme]||{}; 
   let ch = (y<0||y>=m.rows.length||x<0||x>=m.rows[0].length) ? (m.void||' ') : m.rows[y][x];
   const def=th[ch]; return def? !!def.solid : (ch!=='.'&&ch!==' ');
 };
 const bad=[];
 Object.values(maps).forEach(m=>{ (m.ents||[]).forEach(e=>{
   if(!/^(door|stairs|stairsback)$/.test(e.t)) return;
   const t=maps[e.to]; if(!t){bad.push(m.id+' → ('+e.to+') carte absente');return;}
   let x=e.tx|0, y=e.ty|0;
   if(e.tx==='in'){ const en=t.entry||{x:2,y:2}; x=en.x; y=en.y; }
   if(solid(e.to,x,y)===true) bad.push(m.id+' ('+e.t+' '+e.x+','+e.y+') → '+e.to+' bloqué en tuile '+JSON.stringify(t.rows[y]&&t.rows[y][x])+' @'+x+','+y);
   if(e.to==='world' && !(e.need)) { /* porte de sortie de donjon : vérifier qu'on ressort sur une tuile porte */ }
 }); });
 /* les PNJ/marchands cachés par un solid ? */
 Object.values(maps).forEach(m=>{const th=T[m.theme]||{}; (m.ents||[]).forEach(e=>{ if(e.t==='chest'||e.t==='save'||e.t==='bed'||e.t==='shop'||e.t==='bossgate'||e.t==='sign'){ if(solid(m.id,e.x,e.y)===true && e.t!=='sign'&&e.t!=='bossgate') bad.push(m.id+' : '+e.t+' posé sur un mur @'+e.x+','+e.y); } });});
 return (bad.length? bad.join('\n') : 'OK — toutes les destinations sont praticables ('+Object.keys(maps).length+' cartes)');
})()
