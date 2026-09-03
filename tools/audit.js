/* Audit de cohérence des données du jeu : références croisées entre
   tables, bestiaire, dialogues, scènes, cartes et boutiques. */
const vm = require('vm'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', 'ff-iphone', 'src');
const files = ['core/util.js', 'data/tables.js', 'data/monsters.js', 'data/story.js', 'data/maps.js', 'engine/dungeon.js'];
function fakeCanvas() {
  return { style: {}, width: 0, height: 0, getContext: () => ({}), classList: { add(){}, remove(){}, toggle(){}, contains: () => false } };
}
const store = {};
const ctx = vm.createContext({
  console, Math, JSON, Object, Array, String, Number, Boolean, Date, parseInt, parseFloat, isFinite, isNaN, Set, Map, Error,
  Uint8ClampedArray, Uint8Array,
  document: { createElement: (t) => t === 'canvas' ? fakeCanvas() : { style: {}, classList: { add(){}, remove(){}, toggle(){}, contains: () => false } },
    getElementById: () => fakeCanvas(), querySelector: () => null, body: { classList: { add(){}, remove(){}, toggle(){}, contains: () => false } } },
  localStorage: { getItem: k => k in store ? store[k] : null, setItem: (k, v) => { store[k] = '' + v }, removeItem: k => { delete store[k] } },
  navigator: {}, performance: { now: () => Date.now() },
});
ctx.window = ctx; ctx.globalThis = ctx; ctx.self = ctx;
for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }); }
  catch (e) { console.log('LOAD FAIL ' + f + ': ' + e.message); process.exit(1); }
}
const snippet = `
(function(){
  var D = FF.D, Dun = FF.Dun;
  Dun.all();
  var bad = [];
  function chk(c, msg){ if(!c) bad.push(msg); }
  /* 1. monstres : arts + sorts/capacités */
  Object.keys(D.MON).forEach(function(id){
    var m = D.MON[id];
    chk(m.n, 'MON '+id+' sans nom');
    (m.acts||[]).forEach(function(a){
      if(a.a==='sp') chk(D.SP[a.id], 'MON '+id+' joue sort inconnu '+a.id);
      if(a.a==='ab') chk(D.ABILITIES[a.id], 'MON '+id+' utilise capacité inconnue '+a.id);
    });
    if(m.drop) chk(D.IT[m.drop.it], 'MON '+id+' drop inconnu '+m.drop.it);
    if(m.steal) chk(D.IT[m.steal.it], 'MON '+id+' steal inconnu '+m.steal.it);
    if(m.win){
      if(m.win.it) chk(D.IT[m.win.it], 'MON '+id+' win.it inconnu '+m.win.it);
      if(m.win.job) chk(D.JOBS[m.win.job], 'MON '+id+' win.job inconnu '+m.win.job);
      if(m.win.spell) chk(D.SP[m.win.spell], 'MON '+id+' win.spell inconnu '+m.win.spell);
      if(m.win.summon) chk(D.SP[m.win.summon], 'MON '+id+' win.summon inconnu '+m.win.summon);
    }
  });
  /* 2. rencontres : ids de monstres existants */
  Object.keys(D.MAPS).forEach(function(id){
    var m = D.MAPS[id];
    (m.ents||[]).forEach(function(e){
      if(e.t==='bossgate' || e.foes) (e.foes||[]).forEach(function(f){ chk(D.MON[f], 'MAP '+id+' ent foes inconnu '+f); });
      if(e.say && e.say[0]==='@') chk(D.DLG[e.say.slice(1)], 'MAP '+id+' npc dialogue manquant '+e.say);
    });
    var enc = m.enc;
    if(enc){
      (enc.list||[]).forEach(function(f){ chk(D.MON[f], 'MAP '+id+' enc.list inconnu '+f); });
      (enc.zones||[]).forEach(function(z){ (z.list||[]).forEach(function(f){ chk(D.MON[f], 'MAP '+id+' zone inconnu '+f); }); });
      (enc.sea||[]).forEach(function(f){ chk(D.MON[f], 'MAP '+id+' sea inconnu '+f); });
      (enc.snow||[]).forEach(function(f){ chk(D.MON[f], 'MAP '+id+' snow inconnu '+f); });
      (enc.desert||[]).forEach(function(f){ chk(D.MON[f], 'MAP '+id+' desert inconnu '+f); });
    }
    /* portes ciblent des cartes existantes */
    (m.ents||[]).forEach(function(e){
      if((e.t==='door'||e.t==='stairs'||e.t==='stairsback') && e.to) chk(D.MAPS[e.to], 'MAP '+id+' porte vers carte inexistante '+e.to);
    });
  });
  /* 3. donjons : boss + coffres + liste */
  Object.keys(D.DUNGEONS).forEach(function(id){
    var c = D.DUNGEONS[id];
    (c.list||[]).forEach(function(f){ chk(D.MON[f], 'DUN '+id+' list inconnu '+f); });
    [c.boss, c.boss2].forEach(function(b){ if(b) (b.foes||[]).forEach(function(f){ chk(D.MON[f], 'DUN '+id+' boss inconnu '+f); }); });
    (c.chests||[]).forEach(function(l){ if(l.it) chk(D.IT[l.it], 'DUN '+id+' coffre inconnu '+l.it); });
    if(c.key) chk(D.IT[c.key], 'DUN '+id+' clé inconnue '+c.key);
    if(c.sceneOnWin) chk(D.SCENES[c.sceneOnWin], 'DUN '+id+' sceneOnWin inconnue '+c.sceneOnWin);
  });
  /* 4. objets : icônes & slots connus */
  var SLOTS = ['weap','armor','helm','acc'];
  Object.keys(D.IT).forEach(function(id){
    var it = D.IT[id];
    chk(it.n, 'IT '+id+' sans nom');
    if(it.k==='weap') chk(it.type, 'IT '+id+' arme sans type');
    if(it.k==='armor'||it.k==='helm'||it.k==='acc') chk(it.k==='armor' ? it.slot==='armor' : true, 'IT '+id+' slot');
  });
  /* 5. boutiques : items existants */
  Object.keys(D.SHOPS).forEach(function(id){
    var s = D.SHOPS[id];
    (s.arms||[]).forEach(function(a){ chk(D.IT[a] && (D.IT[a].k==='weap'||D.IT[a].k==='armor'||D.IT[a].k==='helm'||D.IT[a].k==='acc'), 'SHOP '+id+' équipement inconnue '+a); });
    (s.obj||[]).forEach(function(o){ chk(D.IT[o], 'SHOP '+id+' objet inconnu '+o); });
  });
  /* 6. scenes : dialogues, monstres, items, jobs, sorts */
  Object.keys(D.SCENES).forEach(function(id){
    D.SCENES[id].forEach(function(s){
      if(s.s==='battle') (s.foes||[]).forEach(function(f){ chk(D.MON[f], 'SCENE '+id+' foes inconnu '+f); });
      if(s.s==='give') chk(D.IT[s.it], 'SCENE '+id+' give inconnu '+s.it);
      if(s.s==='job') chk(D.JOBS[s.j], 'SCENE '+id+' job inconnu '+s.j);
      if(s.s==='summon') chk(D.SP[s.k], 'SCENE '+id+' summon inconnu '+s.k);
      if(s.s==='map') chk(D.MAPS[s.to], 'SCENE '+id+' map inconnue '+s.to);
      if(s.s==='scene' && String(s.to).indexOf('dlg:')===0) chk(D.DLG[String(s.to).slice(4)], 'SCENE '+id+' dlg manquant '+s.to);
      if(s.s==='join'||s.s==='leave') chk(D.CAST[s.who], 'SCENE '+id+' cast inconnu '+s.who);
      if(s.s==='say' && s.who && !D.CAST[s.who]) chk(D.NPCLOOK[s.who], 'SCENE '+id+' speaker inconnu '+s.who);
    });
  });
  /* 7. dialogues : speakers du cast ou npc */
  Object.keys(D.DLG).forEach(function(id){
    D.DLG[id].forEach(function(e){
      (e.l||[]).forEach(function(l){
        var w = l[0];
        if(w) chk(D.CAST[w] || D.NPCLOOK[w], 'DLG '+id+' speaker inconnu '+w);
      });
    });
  });
  /* 8. sorts/capacités : cibles cohérentes, TIER */
  Object.keys(D.SP).forEach(function(id){
    var s = D.SP[id];
    chk(['foe','foes','ally','allies','self','dead'].indexOf(s.tgt)>=0, 'SP '+id+' cible invalide '+s.tgt);
  });
  Object.keys(D.JOBS).forEach(function(id){
    var j = D.JOBS[id];
    Object.keys(j.learn||{}).forEach(function(kind){
      var tiers = D.TIER[kind];
      chk(tiers, 'JOB '+id+' apprends dans voie inconnue '+kind);
    });
    (j.ab||[]).forEach(function(a){ chk(D.ABILITIES[a], 'JOB '+id+' capacité inconnue '+a); });
    (j.eq||[]).forEach(function(t){ chk(t, 'JOB '+id+' slot inconnu '+t); });
  });
  /* 9. tuiles des thèmes : peintures disponibles (heuristic : chars des maps présents dans un thème) */
  return { bad: bad, counts: { mon: Object.keys(D.MON).length, maps: Object.keys(D.MAPS).length, scenes: Object.keys(D.SCENES).length, dlg: Object.keys(D.DLG).length, items: Object.keys(D.IT).length, jobs: Object.keys(D.JOBS).length, spells: Object.keys(D.SP).length } };
})();
`;
try {
  const out = vm.runInContext(snippet, ctx);
  /* contrôles hors VM : glyphes de la police + fichiers PWA */
  const fontSrc = fs.readFileSync(path.join(ROOT, 'core/font.js'), 'utf8');
  if (fontSrc.indexOf('\\u25BC') < 0) out.bad.push('FONT ▼ (U+25BC) absent du SET');
  if (fontSrc.indexOf('\\u25B6') < 0) out.bad.push('FONT ▶ (U+25B6) absent du SET');
  ['manifest.webmanifest', 'assets/icon-180.png', 'assets/icon-512.png'].forEach(function (f) {
    if (!fs.existsSync(path.join(__dirname, '..', 'ff-iphone', f))) out.bad.push('PWA manquant : ' + f);
  });
  console.log(JSON.stringify(out, null, 1));
  process.exit(out.bad.length ? 1 : 0);
} catch (e) { console.log('SNIPPET FAIL: ' + (e.stack || e.message)); process.exit(1); }
