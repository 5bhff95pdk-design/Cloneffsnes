(()=>{
 FF.Bake.buildThemes(); FF.Assets.build(); var dm=FF.Dun.all();
 const D=FF.D, T=FF.Bake.themes;
 const chars=(n)=>new Set(Object.keys(T[n]||{}).filter(k=>k[0]!=='_'&&k!=='walk'));
 const need={}, res=[];
 const all=Object.assign({},D.MAPS,dm);
 Object.values(all).forEach(m=>{ const s=chars(m.theme);
   if(!s.size){res.push('thème inconnu '+m.theme+' pour '+m.id);return;}
   const bad=new Set(); m.rows.forEach(r=>{for(const ch of r) if(ch!==' '&&!s.has(ch)) bad.add(ch);});
   if(bad.size) res.push(m.id+' ('+m.theme+') ← '+[...bad].join(''));
 });
 /* entités hors limites / tuiles manquantes */
 Object.values(all).forEach(m=>{ (m.ents||[]).forEach(e=>{ if(e.x==null||e.y==null) return;
   if(e.x<0||e.y<0||e.x>=m.w||e.y>=m.h) res.push('ENT HORS-CARTE '+m.id+' '+e.t+' '+e.x+','+e.y); }); });
 /* warps */
 Object.values(all).forEach(m=>(m.ents||[]).forEach(e=>{ if((e.t==='door'||e.t==='stairs'||e.t==='stairsback')&&e.to&&!all[e.to]) res.push('WUP INVALIDE '+m.id+' → '+e.to);}));
 return JSON.stringify({maps:Object.keys(all).length, res, themeChars:Object.keys(T).map(n=>n+':'+[...chars(n)].sort().join(''))},null,1);
})()
