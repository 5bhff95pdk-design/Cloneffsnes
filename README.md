# Les Quatre Cristaux

RPG 16-bit jouable dans le navigateur (cible iPhone / PWA). Pixel art, musique et police sont **générés au démarrage** — aucun fichier image ou audio.

```
ff-iphone/     le jeu (ouvrir index.html)
tools/         tests headless (Node)
ARCHITECTURE.md
```

## Lancer

```bash
npm run serve          # http://localhost:8123
```

Clavier : flèches + Z/X (A/B). Tactile : pad à l’écran.

## Tests

```bash
npm test
```

Pas de navigateur requis (sauf `npm run test:browser`, Playwright).

## Licence

MIT — voir `LICENSE`.
