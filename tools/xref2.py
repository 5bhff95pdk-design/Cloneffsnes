import re,glob,os
ROOT='/home/user/ff-iphone/src/'
NS_FILE={'U':'core/util.js','Font':'core/font.js','Gfx':'core/gfx.js','In':'core/input.js','Snd':'core/audio.js',
 'Music':'core/audio.js','Spr':'core/sprites.js','Bake':'engine/bake.js','Assets':'engine/assets.js','Dun':'engine/dungeon.js',
 'P':'engine/party.js','Bat':'engine/battle.js','UI':'engine/ui.js','Wld':'engine/world.js','S':'engine/save.js','Game':'engine/main.js'}
DATA={'D':['data/tables.js','data/monsters.js','data/story.js','data/maps.js'],'Cond':['data/story.js']}
def rd(p): return open(ROOT+p).read()
builtin=set('length slice push map filter forEach indexOf concat some every join sort reduce split trim replace toUpperCase charCodeAt keys from assign round floor max min abs sqrt cos sin random pow hypot atan2 PI log exp tan call apply bind name message stack now stringify parse freeze hasOwnProperty vibrate resume state currentTime destination prototype constructor'.split())
# alias locaux par fichier
aliasmap={}
for f in glob.glob(ROOT+'**/*.js',recursive=True):
    rel=os.path.relpath(f,ROOT); s=open(f).read()
    m={}
    for a,ns in re.findall(r'var\s+([A-Za-z_$][\w$]*)\s*=\s*FF\.([A-Za-z_$][\w$]*)\b', s): m[a]=ns
    for a,ns in re.findall(r'var\s+([A-Za-z_$][\w$]*)\s*=\s*FF\.(?:Snd|Music)\b', s): m[a]='Snd'
    aliasmap[rel]=(s,m)
# définitions
defn={}
def adddef(ns,k): defn.setdefault(ns,set()).add(k)
for ns,p in NS_FILE.items():
    s=rd(p)
    for k in re.findall(r'\b[A-Za-z_$][\w$]*\.'+re.escape(k if False else '([A-Za-z_$][\\w$]*)')+r'\s*=\s*(?:function|[a-z])', s): pass
    # motifs : X.k = function / X.k = / k: function / k: (données)
    for k in re.findall(r'^\s*(?:var\s+)?([A-Za-z_$][\w$]*)\s*=\s*function', s, re.M): adddef(ns,k)
    for k in re.findall(r'\b[A-Za-z_$][\w$]*\.([A-Za-z_$][\w$]*)\s*=', s): adddef(ns,k)
    for k in re.findall(r'^\s*([A-Za-z_$][\w$]*)\s*:\s*function', s, re.M): adddef(ns,k)
    for k in re.findall(r'^\s{2,4}([A-Za-z_$][\w$]*)\s*=\s*', s, re.M): adddef(ns,k)
for ns,ps in DATA.items():
    for p in ps:
        s=rd(p)
        for k in re.findall(r'\bD\.([A-Za-z_$][\w$]*)', s): adddef('D',k)
        for k in re.findall(r'^\s{4}([A-Za-z_$][\w$]*)\s*[:=]', s, re.M): adddef('D',k)
        for k in re.findall(r'^\s{2}([A-Za-z_$][\w$]*)\s*[:=]', s, re.M): adddef('D',k)
# champs créés à l'exécution (S.members = {} etc.) dans n'importe quel fichier
for rel,(s,m) in aliasmap.items():
    for a,ns in m.items():
        for k in re.findall(r'\b'+re.escape(a)+r'\.([A-Za-z_$][\w$]*)\s*=\s*[{\'"\[\d]', s): adddef(ns,k)
    for a in ['S','D']:
        pass
usage={}
for rel,(s,m) in aliasmap.items():
    pats=[(a,ns) for a,ns in m.items()]+[(('FF.'+ns),ns) for ns in set(list(m.values())+list(NS_FILE)+list(DATA))]
    for a,ns in pats:
        for mm in re.finditer(r'\b'+re.escape(a)+r'\.([A-Za-z_$][\w$]*)', s):
            k=mm.group(1)
            if k in builtin: continue
            usage.setdefault((ns,k),set()).add(rel)
bad=[]
for (ns,k),w in sorted(usage.items()):
    if k in defn.get(ns,set()): continue
    bad.append((ns,k,sorted(w)))
print('=== %d références non résolues ==='%len(bad))
for ns,k,w in bad: print(f'{ns}.{k}  <- '+', '.join(x[:-3] for x in w[:6]))
