# Architecture — Les Quatre Cristaux

RPG 16-bit pour navigateur / iPhone. **Pas de bundler, pas d’assets binaires** : pixel art cuit au boot, audio WebAudio, police bitmap. Canvas logique **240×160**.

Point d’entrée : `ff-iphone/index.html` (scripts IIFE dans l’ordre ci-dessous, namespace global `FF`).

```
ff-iphone/
  index.html          PWA + canvas + pad tactile
  sw.js               cache hors-ligne
  css/style.css
  src/core/           moteur bas niveau
  src/data/           contenu (cartes, monstres, scènes, tables)
  src/engine/         boucle de jeu, combat, UI, monde
```

## Couches

| Couche | Fichiers | Rôle |
|---|---|---|
| **core** | `util` `font` `gfx` `input` `audio` `sprites` | Tampon 240×160, FX, clavier/tactile, chiptune, silhouettes |
| **data** | `tables` `monsters` `story` `maps` | Emplois, sorts, objets, 72 monstres, 16 scènes, 48 cartes |
| **engine** | `save` `bake` `assets` `dungeon` `party` `battle` `ui` `world` `main` | Persistance, cuisson des tuiles, ATB, menus, scènes, titre |

Le contenu pilote le moteur : une carte, un monstre ou une scène s’ajoute dans `data/` sans toucher à la boucle.

## Boucle

`Game.frame` → `Game.step(dt)` selon `Game.state` :

- `title` — menu (nouvelle partie, NG+, casiers, mute)
- `field` — `Wld.update` (déplacement, rencontres **à l’arrivée sur une case**) + UI
- `battle` — ATB (`Bat.update`)
- `over` / `credits`

Un cut-scène (`Wld.cut`) court-circuite le déplacement jusqu’à `cutStep` / `end` / `credits`. Filet : un cutteur inerte > 1 s est clôturé.

## Persistance (`localStorage`)

| Clé | Contenu |
|---|---|
| `q4c.prefs` | Réglages appareil **et** audio (`FF.Prefs.load/save/apply`) |
| `q4c.settings` / `q4c.audio` | Miroirs legacy (lus si pas de `q4c.prefs`) |
| `q4c.save.1/2/3/auto` | Casiers (`S.VERSION = 3`) |

`cleared` sur un casier (flag `ending`) débloque **Nouvelle Partie +**.

## Tests

`npm test` enchaîne des VM Node (DOM/canvas factices) : headless, prefs, boot, audio iOS, NG+, parcours, crédits, rencontres, chapitres 3–6, économie.

Lancer le jeu : `npm run serve` puis ouvrir `ff-iphone/`.
