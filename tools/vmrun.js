/* exécute les modules du jeu dans un vm avec un DOM factice, puis un snippet */
const vm=require('vm'), fs=require('fs');
const ROOT='/home/user/ff-iphone/src/';
const files=process.argv[2].split(',');
const snippet=fs.readFileSync(process.argv[3],'utf8');
function fakeCanvas(){return {style:{},width:0,height:0,getContext:()=>({fillStyle:'',strokeStyle:'',globalAlpha:1,lineWidth:1,imageSmoothingEnabled:false,
 fillRect(){},clearRect(){},strokeRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},scale(){},
 getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(Math.max(4,(w|h)*Math.max(4,(h|1))*4)),width:w||1,height:h||1}),
 createImageData:(w,h)=>({data:new Uint8ClampedArray(Math.max(4,(w*h)*4)),width:w,height:h}),
 putImageData(){},drawImage(){},createLinearGradient:()=>({addColorStop(){}})}) ,parentNode:{removeChild(){},appendChild(){}},classList:{add(){},remove(){},toggle(){},contains:()=>false},addEventListener(){},getBoundingClientRect:()=>({left:0,top:0,width:720,height:480})};}
const store={};
const ctx=vm.createContext({console,Math,JSON,Object,Array,String,Number,Boolean,Date,parseInt,parseFloat,isFinite,isNaN,Set,Map,Error,TypeError,Uint8Array,Uint8ClampedArray,Float32Array,
 document:{createElement:(t)=>t==='canvas'?fakeCanvas():{style:{},appendChild(){},classList:{add(){},remove(){},toggle(){},contains:()=>false},addEventListener(){},setAttribute(){},remove(){},querySelectorAll:()=>[],getBoundingClientRect:()=>({left:0,top:0,width:1,height:1}),offsetHeight:100},
  getElementById:(id)=>fakeCanvas(),querySelector:()=>null,querySelectorAll:()=>[],body:{classList:{add(){},remove(){},toggle(){},contains:()=>false}},documentElement:{style:{setProperty(){}}},addEventListener(){},readyState:'loading'},
 localStorage:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=''+v},removeItem:k=>{delete store[k]}},
 navigator:{userAgent:'node',serviceWorker:null,vibrate(){},getGamepads:()=>[]},
 performance:{now:()=>Date.now()},
 requestAnimationFrame(){},cancelAnimationFrame(){},
 setTimeout(cb){return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},
 AudioContext:null,addEventListener(){},innerWidth:780,innerHeight:520,devicePixelRatio:1,matchMedia:()=>({matches:false,addListener(){}}),URL:{createObjectURL:()=>''},Worker:null,location:{protocol:'http:',href:'http://x/index.html',origin:'http://x'}
});
ctx.window=ctx; ctx.globalThis=ctx;
for(const f of files){ try{ vm.runInContext(fs.readFileSync(ROOT+f,'utf8'),ctx,{filename:f}); }catch(e){ console.log('LOAD FAIL '+f+': '+e.message); process.exit(1);} }
try{ const r=vm.runInContext(snippet,ctx,{filename:'snippet'}); console.log(typeof r==='string'?r:JSON.stringify(r,null,1)); }
catch(e){ console.log('SNIPPET FAIL: '+(e.stack||e.message)); process.exit(1); }
