import re,glob,os
ROOT='/home/user/ff-iphone/src/'
MOD={'util':'core/util.js','font':'core/font.js','gfx':'core/gfx.js','input':'core/input.js','audio':'core/audio.js','sprites':'core/sprites.js',
 'tables':'data/tables.js','monsters':'data/monsters.js','story':'data/story.js','maps':'data/maps.js',
 'bake':'engine/bake.js','assets':'engine/assets.js','dungeon':'engine/dungeon.js','party':'engine/party.js',
 'battle':'engine/battle.js','ui':'engine/ui.js','world':'engine/world.js','save':'engine/save.js','main':'engine/main.js'}
NS={'FF.U':'util','FF.Font':'font','FF.Gfx':'gfx','FF.In':'input','FF.Snd':'audio','FF.Music':'audio','FF.Spr':'sprites',
 'FF.D':'tables','FF.Cond':'story','FF.Bake':'bake','FF.Assets':'assets','FF.Dun':'dungeon','FF.P':'party','FF.Bat':'battle',
 'FF.UI':'ui','FF.Wld':'world','FF.S':'save','FF.Game':'main','FF.Save':'main'}
def rd(p): return open(ROOT+p).read()
builtin=set('length slice push map filter forEach indexOf concat some every join sort reduce split trim replace toUpperCase charCodeAt keys from assign round floor max min abs sqrt cos sin random pow hypot atan2 PI log exp tan call apply bind name message stack now stringify parse freeze hasOwnProperty prototype constructor style width height getContext fillStyle strokeText fillText createLinearGradient createRadialGradient addEventListener removeEventListener classList contains setItem getItem removeItem play pause currentTime state destination sampleRate'.split())
# 1) pour chaque fichier : alias locaux -> module
filealias={}
defs={}
for name,p in MOD.items():
    s=rd(p)
    al={}
    for a,tgt in re.findall(r'var\s+([A-Za-z_$][\w$]*)\s*=\s*(FF\.[A-Za-z_$][\w$]*)\b', s):
        if tgt in NS: al[a]=NS[tgt]
    al['FF']=None
    filealias[name]=(s,al)
    d=defs.setdefault(name,set())
    for k in re.findall(r'\b[A-Za-z_$][\w$]*\.([A-Za-z_$][\w$]*)\s*=(?!=)', s): d.add(k)
    for k in re.findall(r'^\s{0,6}(?:var\s+)?([A-Za-z_$][\w$]*)\s*=\s*function', s, re.M): d.add(k)
    for k in re.findall(r'^\s{0,6}function\s+([A-Za-z_$][\w$]*)', s, re.M): d.add(k)
    for k in re.findall(r'^\s{0,6}([A-Za-z_$][\w$]*)\s*:\s*function', s, re.M): d.add(k)
    for k in re.findall(r'^\s{0,8}([A-Za-z_$][\w$]*)\s*:', s, re.M): d.add(k)
# tables de données : toutes les clés rencontrées quelque part
for k in re.findall(r'\bD\.([A-Za-z_$][\w$]*)', rd('data/tables.js')+rd('data/monsters.js')+rd('data/story.js')+rd('data/maps.js')): defs['tables'].add(k)
usage={}
for name,p in MOD.items():
    s,al=filealias[name]
    for a,tgt in list(al.items())+list(NS.items()):
        if tgt is None: continue
        for m in re.finditer(r'(?<![\w$.])'+re.escape(a)+r'\.([A-Za-z_$][\w$]*)', s):
            k=m.group(1)
            if k in builtin or k=='FF': continue
            usage.setdefault((tgt,k),set()).add(name)
# un alias local doit pointer vers SON module, pas tous ; on filtre : si dans le fichier l'alias 'S' = FF.S alors S.x -> save
bad=[]
for (tgt,k),w in sorted(usage.items()):
    if k in defs.get(tgt,set()): continue
    # toléré si défini dans n'importe quel module de données
    if tgt=='tables' and any(k in defs[d] for d in ('tables','monsters','story','maps')): continue
    bad.append((tgt,k,sorted(w)))
print('=== %d refs non résolues ==='%len(bad))
for t,k,w in bad: print(f'{t}.{k}  <- '+', '.join(w[:6]))
