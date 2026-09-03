import re,glob,sys,os
ROOT='/home/user/ff-iphone/src/'
def read(f): return open(ROOT+f).read() if os.path.exists(ROOT+f) else ''
# définitions par espace de noms
def defs_of(files, pat):
    out=set()
    for f in files:
        s=read(f)
        out |= set(re.findall(pat.replace('NS',re.escape(f[1])), s)) if False else set()
    return out
def collect(files, names):
    """renvoie l'ensemble des clés définies par `N.x =` ou `x:` ou `x(` (méthode d'objet) dans les fichiers"""
    keys=set()
    for f in files:
        s=read(f)
        for n in names:
            keys |= set(re.findall(r'\b'+n+r'\.([A-Za-z_$][\w$]*)\s*=', s))
            keys |= set(re.findall(r'\b'+n+r'\.prototype\.([A-Za-z_$][\w$]*)', s))
        # littéraux d'objet au premier niveau de ces fichiers : « clé: » ou « clé( ) {»
        keys |= set(re.findall(r'^\s{2,6}([A-Za-z_$][\w$]*)\s*[:=]\s*(?:function|[{(\'"\d\-\[]|U\.|Math)', s, re.M))
        keys |= set(re.findall(r'^\s{2,6}(?:var\s+)?([A-Za-z_$][\w$]*)\s*=\s*function', s, re.M))
    return keys
MODULES = {
 'U': (['core/util.js'], ['U']),
 'Font': (['core/font.js'], ['F','Font']),
 'Gfx': (['core/gfx.js'], ['G']),
 'In': (['core/input.js'], ['I']),
 'Snd': (['core/audio.js'], ['Snd','Music','S','M']),
 'Spr': (['core/sprites.js'], ['Spr']),
 'D': (['data/tables.js','data/monsters.js','data/story.js','data/maps.js'], ['D']),
 'Bake': (['engine/bake.js'], ['B']),
 'Assets': (['engine/assets.js'], ['A','Assets']),
 'Dun': (['engine/dungeon.js'], ['Dun']),
 'P': (['engine/party.js'], ['P']),
 'Bat': (['engine/battle.js'], ['Bat']),
 'UI': (['engine/ui.js'], ['UI']),
 'Wld': (['engine/world.js'], ['Wo','Wld']),
 'S': (['engine/save.js'], ['S']),
 'Game': (['engine/main.js'], ['Game']),
}
# pour D, les sous-tables (IT, SP, JOBS, MON, MAPS...) sont des données : on accepte tout ce qui est assigné quelque part
datakeys=set()
for f in MODULES['D'][0]:
    s=read(f)
    datakeys |= set(re.findall(r'\bD\.([A-Za-z_$][\w$]*)', s))
    datakeys |= set(re.findall(r'^\s{4}([A-Za-z_$][\w$]*)\s*[:=]', s, re.M))
mods_all = read('data/tables.js')
builtin = {'length','slice','push','map','filter','forEach','indexOf','concat','some','every','join','sort','reduce','split','trim','replace','toUpperCase','toLowerCase','charCodeAt','padStart','keys','from','assign','round','floor','max','min','abs','sqrt','cos','sin','random','pow','hypot','atan2','PI','log','exp','tan','call','apply','bind','name','message','stack','now','stringify','parse','freeze','hasOwnProperty','vibrate','resume','state','currentTime','destination','createGain','createOscillator'}
usage={}
files=glob.glob(ROOT+'**/*.js',recursive=True)
for f in files:
    s=open(f).read()
    rel=os.path.relpath(f,ROOT)
    for ns in MODULES:
        for alias in (MODULES[ns][1]+['FF.'+ns]):
            for m in re.finditer(r'\b'+re.escape(alias)+r'\.([A-Za-z_$][\w$]*)', s):
                k=m.group(1)
                if k in builtin: continue
                usage.setdefault((ns,k),set()).add(rel)
bad=[]
for (ns,k),where in sorted(usage.items()):
    if ns=='D':
        if k in datakeys: continue
    else:
        files_ns, names = MODULES[ns]
        d=collect(files_ns, names)
        if k in d: continue
        # propriété d'état « X.y = » créée à l'exécution dans d'autres fichiers
        found=False
        for g in glob.glob(ROOT+'**/*.js',recursive=True):
            if re.search(r'\b'+re.escape(names[0])+r'\.'+re.escape(k)+r'\s*=', open(g).read()) or re.search(r'FF\.'+re.escape(ns)+r'\.'+re.escape(k)+r'\s*=', open(g).read()): found=True
        if found: continue
    bad.append((ns,k,sorted(where)))
print('=== Références possiblement cassées (%d) ==='%len(bad))
for ns,k,w in bad:
    print(f'{ns}.{k}  <- '+', '.join(x.replace('.js','') for x in w[:6]))
