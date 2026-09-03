const vm=require('vm');const fs=require('fs');const B='/home/user/ff-iphone/src/';
const ctx={console,Math,JSON,Object,Array,String,Number,parseInt,parseFloat,isFinite,isNaN,document:{createElement:()=>({style:{},width:0,height:0,getContext:()=>({fillStyle:'',fillRect(){},getImageData:()=>({data:new Uint8ClampedArray(4)}),putImageData(){},drawImage(){},clearRect(){},save(){},restore(){},translate(){},scale(){}})}),getElementById:()=>null,body:{classList:{add(){},remove(){},toggle(){},contains:()=>false}},querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){},devicePixelRatio:1,innerWidth:780,innerHeight:520,navigator:{userAgent:'x'}},navigator:{userAgent:'x',serviceWorker:null},performance:{now:()=>0},requestAnimationFrame(){},setTimeout(){},localStorage:null};
ctx.window=ctx; ctx.globalThis=ctx;
for(const f of ['core/util.js','core/font.js','core/gfx.js','core/input.js','core/audio.js','core/sprites.js','data/tables.js','data/monsters.js','data/story.js','data/maps.js','engine/save.js','engine/bake.js']) vm.runInContext(fs.readFileSync(B+f,'utf8'),ctx,{filename:f});
vm.runInContext('FF.Bake.buildThemes()',ctx);
const out=vm.runInContext(`(()=>{
 const D=FF.D, T=FF.Bake.themes, bad=[];
 const charsOf=(n)=>Object.keys(T[n]||{}).filter(k=>k[0]!=='_'&&k!=='walk'&&k!=='voidChar'&&k!=='encTiles');
 const set={}; Object.keys(T).forEach(n=>{set[n]=new Set(charsOf(n))});
 const need={};
 const scan=(id,rows,theme)=>{rows.forEach(r=>{for(const ch of r) if(ch!==' '&&ch!=='\\n'){ if(!set[theme]||!set[theme].has(ch)) (need[theme]=need[theme]||new Set()).add(ch); if(!D.at(id,0,0)) {} }})};
 Object.values(D.MAPS).forEach(m=>scan(m.id,m.rows,m.theme));
 Object.values(D.DUNGEONS).forEach(c=>{c.floors.forEach(f=>{ [...(f.chars||''),...(f.fill||'')].forEach(ch=>{ if(!set[c.theme]||!set[c.theme].has(ch)) (need[c.theme]=need[c.theme]||new Set()).add(ch);}) })});
 return {themes:Object.keys(T).map(n=>n+':'+charsOf(n).sort().join('')), need:Object.keys(need).map(n=>n+' ← '+[...need[n]].join('')), themeCount:Object.keys(T).length};
})()`,ctx);
console.log(JSON.stringify(out,null,1).slice(0,3000));
