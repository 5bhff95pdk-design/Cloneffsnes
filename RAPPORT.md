# Rapport d'analyse — « Les Quatre Cristaux »

**Répertoire analysé** : `Cloneffsnes` (jeu dans `ff-iphone/`) · **Date** : 3 septembre 2026
**Volume** : 21 fichiers JavaScript (~7 000 lignes) + 1 HTML + 1 CSS, aucune dépendance, aucun binaire
**Méthode** : syntaxe (`node --check`), audit croisé des données, **34 tests fonctionnels** du code réel dans une VM Node (DOM/canvas factices + horloge virtuelle), traçage pas-à-pas de la scène d'intro, analyse pixel des 68 captures, comparaison octet à octet du repo et du snapshot de session précédente (identique → les captures correspondent exactement à ce code).

---

## 1. Ce que c'est

Un RPG 16-bit complet, jouable dans le navigateur d'iPhone, **100 % procédural, zéro asset** :

| Aspect | Détail |
|---|---|
| Graphismes | pixel art généré et « cuit » au démarrage (`bake.js`) : 9 thèmes (plaine, ville, grotte, mine, glace, lave, tour, dirigeable, intérieur), 51 variantes de sprites ennemis, héros, PNJ, coffres |
| Audio | musique chiptune 4 canaux + SFX **synthétisés en WebAudio** (`core/audio.js`), aucun fichier audio |
| Police | bitmap 5×7 générée depuis une table (`core/font.js`) |
| Résolution | canvas logique 240×160, rendu `pixelated`, contrôles tactiles (croix + A/B/MENU/TURBO) et clavier, méta PWA |

### Architecture

Pattern IIFE sur un namespace global `FF`, trois couches, sans modules ni build :

- **`src/core/`** — `util` (outils), `font` (police bitmap), `gfx` (tampon 240×160, fenêtres, barres, effets, particules), `input` (clavier + tactile), `audio` (moteur chiptune), `sprites` (animation des silhouettes) ;
- **`src/data/`** — tout le contenu : `tables` (13 emplois, 57 sorts, 119 objets, capacités, boutiques), `monsters` (72 monstres dont 14 boss), `story` (16 scènes scriptées, ~340 lignes de narration), `maps` (48 cartes + 9 donjons générés procéduralement : Sanctuaire, Mines, Épave, Glacier, Borée, Forges, Tour, Caverne, Rêve) ;
- **`src/engine/`** — `save` (localStorage, 6 casiers + méta + réglages), `bake`, `assets`, `dungeon` (générateur de donjons avec boss/escaliers/coffres), `party` (stats, emplois, montée de niveau), `battle` (ATB 1 044 lignes : attaque, magie, technique, objet, défense, fuite, buffs, invocations), `ui` (dialogues, listes, menus, boutique, auberge, statut, équipement), `world` (déplacement, caméra, entités, **moteur de scènes**), `main` (machine à états : titre / terrain / combat / game over / générique).

Le contenu est bien séparé du moteur : ajouter une carte, un monstre ou une scène se fait dans les seules données.

---

## 2. Ce qui marche (vérifié par tests, 30/34 PASS)

- Amorçage complet < 2 s : 48 cartes chargées, 9 thèmes cuits, 51 variantes sprites, 0 erreur ;
- Nouvelle partie (terrain d'Aurélia, équipe Arno/Myrelle/Sica, 250 gils) ;
- Déplacement case par case + collision (bord de carte, entités bloquantes) ;
- Dialogue : frappe lettre à lettre, avance, fermeture ;
- **Combat ATB mené à son terme** (victoire, expérience, niveaux) — pas de blocage ;
- Sauvegarde casier 1 + méta, chargement, sauvegarde automatique, suppression de casier ;
- **Boutique** : dialogue → menu, achat (gils débités, objet crédité), mode vente ;
- **Auberge** : nuit → équipe soignée, gils débités ;
- Menus : principal, sous-menu objets, navigation ;
- Cristal de sauvegarde ;
- **Donjon procédural** Sanctuaire : 2 niveaux, 1 escalier, 1 bossgate ;
- Bossgate → combat du boss Croc-Boue mené à son terme sans blocage ;
- **Rendu d'une frame sur les 48 cartes : aucune erreur** (même dans l'environnement VM hostile).

Les systèmes (combat, sauvegarde, boutiques, donjons, rendu) sont donc solides et fonctionnels.

---

## 3. Bugs et anomalies, par gravité

### A. Game-breaking (3, tous confirmés par reproduction exécutable)

**A1 — Le moteur de scènes se fige après toute étape `map` / `wait` / `fade` → l'intro ne termine jamais, le joueur est gelé.**
`world.js`, `Wo.runCut` : quand le compteur `c.wait` expire alors que `c.pause === false`, **rien ne rappelle `Wo.cutStep`** (la reprise n'existe qu'« à la fermeture d'un dialogue en pause »). Or les étapes `map` (wait .5 s), `wait`, `fade` (wait .55 s) posent un wait **sans pause** → la scène s'arrête définitivement.

- L'intro se bloque à l'étape 4/10, juste après le téléport vers Aurélia : l'audience du roi (`dlg:roi_audience`), le flag `introDone` et la réplique de Myrelle ne sont jamais exécutés ;
- pendant le gel, `Wo.cut` persiste → `Wo.update` sort en début de fonction : **joueur immobilisé, menu et inputs bloqués**.

*Preuves* : `tools/intro-trace.js` (répro déterministe : après `map`, wait 0.43 → 0.00 puis état statique pendant 5 s — aucun dialogue, aucun toast, aucun menu, les presses A ignorées) ; captures de la session précédente : entre les shots 03→05 seule la bannière de lieu s'anime, et `06-menu.png` == `07-objets.png`, `10-combat-suite.png` == `11-save.png` == `12-cristal.png` **à l'octet près** (même frame recapturée, jeu gelé). L'outillage de la session précédente avait dû forcer `FF.Wld.cut = null` pour continuer — corroboration indépendante.

*Portée* : **toute** scène contenant `map`, `wait` ou `fade` est cassée (intro, `sanctuaire1` après son `map`, scène finale après son `fade`). Le chemin principal est injouable au-delà de l'intro.

**A2 — `Game.battle` écrase `opts.onWin` → la porte de boss ne se verrouille jamais, la chaîne narrative est coupée.**
`main.js` lignes 199–201 : avant `FF.Bat.start(opts)`, `Game.battle` réassigne **sans condition** `opts.onEscape`, `opts.onLose` et `opts.onWin`. Le callback transmis par le bossgate (`world.js` 213–216 : pose le flag `boss_<nom>`, lance la scène post-boss ou appelle `afterBoss`) est donc **jeté avant d'être stocké**.

*Vérifié par test* : victoire sur Croc-Boue via le bossgate → `S.f('boss_Croc-Boue') === false`.

*Conséquences en cascade* :
1. le garde du bossgate (`e.once && S.f('boss_…')`) lit un flag jamais posé → **le boss se relance à chaque passage, indéfiniment** ;
2. `afterBoss` n'est jamais appelé → la scène `sceneOnWin: 'sanctuaire1'` ne joue jamais → le flag `sanctuaire` n'est jamais posé → la tuile `trahison` (condition `flag:sanctuaire`) reste **verrouillée à jamais** ;
3. **toute la seconde moitié du chapitre 1 est inaccessible** : la trahison de Kael, le combat contre Kael, l'emploi Guerrier, le passage au chapitre 2, et tout ce qui suit.

**A3 — Les scènes `once` se rejouent à chaque interaction.**
`world.js` ligne 203 :

```js
if (e.once && S.f('sc_' + e.scene)) { if (D.SCENES[e.scene]) { } else return; }
```

Quand la scène existe (toujours, pour une scène valide), le garde fait **rien** (bloc vide) et l'exécution tombe dans `Wo.play(e.scene)`. Comparez avec le garde du bossgate (ligne 210) qui, lui, `return`. *Vérifié par test* : avec `sc_trahison` déjà posé, toucher la tuile (15,17) d'Aurélia relance la scène de trahison — qui boucle donc à l'infini si A1 et A2 sont corrigés sans A3.

### B. Importants (gameplay / contenu)

**B1 — Le Mage Rouge n'apprend aucun sort rouge ; sa capacité signature est inutilisable.**
`tables.js` : `D.JOBS.red.learn` référence la voie `red: [1,2,3,5,7,9]` et `D.SPLIST.red` définit 6 sorts (Feu Rouge, Soin Rouge, Folie Rouge, Tempête Rouge, Drac Rouge, Temps Rouge) — mais **`D.TIER` n'a pas de clé `red`** (seulement `white`, `black`, `summon`). `learn()` (`party.js` 99) fait `var tiers = D.TIER[kind]; if (!tiers) continue;` → la voie est ignorée. La capacité « Double sort » (`battle.js` 404 : « lance deux sorts rouges à la suite ») répond toujours « Aucun sort rouge. »
*Vérifié par test* : Mage Rouge niveau 12 → 10 sorts appris, **0 rouges**. La « troisième voie », identité même du job, est morte. *Correction* : une ligne — `D.TIER.red = D.SPLIST.red.slice();`

**B2 — Glyphes `▼` (U+25BC) et `▶` (U+25B6) absents de la police bitmap.**
Vérifié sur la table `SET` de `core/font.js`. Ils servent à la flèche « dialogue se poursuit » (en bas à droite de la boîte de dialogue, `ui.js`) et au **marqueur de cible en combat** (au-dessus de l'ennemi visé, `battle.js`) : les deux sont rendus **vides** — le joueur ne voit ni la continuation du texte, ni quelle cible est sélectionnée.

**B3 — Fichiers PWA manquants.**
`index.html` référence `assets/icon-180.png`, `assets/icon-512.png` et `manifest.webmanifest` : aucun n'existe dans le dépôt → 404 au chargement, pas d'icône pour « Ajouter à l'écran d'accueil », pas de manifeste.

### C. Moyens (contenu)

- **C1** — Scène `sanctuaire1` (`story.js` 183) : l'étape `to: 'dlg:trahison'` pointe vers un dialogue **inexistant** dans `D.DLG` → le joueur voit « … ».
- **C2** — Scène `vaux` : le speaker `vaux` n'est ni dans `D.CAST` ni dans les looks de PNJ → la pastille de nom affiche « Habitant ».
- **C3** — Incohérence de design : même corrigé, `sanctuaire1` (la scène post-boss) contient elle-même un combat contre Croc-Boue (`story.js` 174) → le joueur refight le même boss deux fois de suite.

### D. Mineurs / code mort / mauvaises odeurs

- `B.escape` (`battle.js` 847) lit `st.onEscape`, **jamais copié** dans `B.start` (seuls `winCb`, `loseCb`, `noFlee` sont stockés) — le fallback donne le même comportement, mais le mécanisme est mort.
- `Game.battle` (`main.js` 202) : `opts.onLose` réassigné **après** `FF.Bat.start(opts)` — ligne morte.
- `INNBACK` / `SHOPBACK` / `ARMSBACK` déclarés **deux fois** dans `D.MAPS_BACK` (seconde valeur jamais lue).
- Code mort : `S.swap`, `S.playTick` (le méta `play` reste 00:00), `settings.fast`, la prop `ship: 1`, aucun contrôle de version au chargement d'une sauvegarde.
- `party.js` 117 : la capacité `summon` est retirée à l'Invocationniste (et visée aussi pour le Sage, qui ne l'a pas → moitié morte) ; l'invocation ne subsiste que via le menu MAGIE — intention floue.
- Incohérences de nommage : `FF.Save` vs `FF.S` (ui.js), `savePrefs` vs `saveSettings` ; boucle potions dans `P.newGame` ; noms vides dans la liste de vente ; `clamp` suspect dans `nav()` ; `forEach` no-op dans l'étape `join`.

---

## 4. Les 68 captures (`shots/`)

- `01-titre` → `12-cristal` : passe paysage 780×520 de la session précédente ; `m-*` (22 vues mobiles), `l-*` (paysage), `x-*`/`y-*` (variantes letterbox) ;
- **02-intro** montre bien le dialogue de l'intro en train de se taper (boîte + pastille de nom correctes) ;
- **03-apres-intro** : la ville d'Aurélia est atteinte — c'est exactement le point de gel A1 ; les shots 04/05 sont le même frame (seule la bannière s'anime), 06/07 et 10/11/12 sont identiques à l'octet : la session précédente a capturé un jeu **gelé** et n'a pu progresser qu'en forçant l'état par JS ;
- dans les shots 03–07, une **barre bleue vide** apparaît en bas du canvas : à l'instant du gel, la logique n'y dessine rien (vérifié en VM : pas de dialogue, pas de toast, pas de menu) → artefact de l'outillage de capture de la session précédente, sans impact jeu. (La fine ligne bleue en haut du canvas dans toutes les captures est le cadre CSS du canvas : `box-shadow … 1px #24305a`.)

---

## 5. Évaluation d'ensemble

**Points forts**
- Densité de contenu remarquable pour zéro asset : art, musique et police entièrement procéduraux, 48 cartes, 9 donjons générés, 72 monstres, 13 emplois, 57 sorts, 119 objets, 16 scènes, 6 passages de chapitre ;
- Structure propre et homogène (IIFE namespace `FF`, séparation contenu/moteur, données pilotant tout) ;
- Les systèmes sont solides : 30/34 tests fonctionnels passent, le combat ATB, les sauvegardes, les boutiques, les donjons et le rendu des 48 cartes tiennent sans erreur ;
- 0 erreur de syntaxe sur 21 fichiers ; le boot est rapide (< 2 s).

**Points faibles**
- **Le contenu principal est injouable** : trois bugs game-breaking s'empilent sur le chemin narratif (gel de l'intro → boss jamais verrouillé → scènes rejouées) ; la moitié du chapitre 1 et tout l'au-delà sont inaccessibles en l'état ;
- Aucune suite de tests dans le dépôt (les scripts `tools/` ci-dessous ont été ajoutés par cette analyse) ;
- Sauvegardes sans version ; code mort et incohérences de nommage divers ; polices/flèches visuelles partiellement manquantes.

**Verdict** : un moteur et des systèmes en bon état, portés par un vrai contenu — mais livrés avec le chemin principal cassé. Les trois corrections A1/A2/A3 sont chacune de quelques lignes ; c'est la priorité absolue, suivie de B1 (une ligne) et B2 (deux glyphes).

---

## 6. Corrections recommandées (ordre de priorité)

1. **A1** — `world.js`, `Wo.runCut` : quand `c.wait` expire sans `c.pause`, rappeler `Wo.cutStep()` (reprend aussi l'intro, `sanctuaire1` et la scène finale).
2. **A2** — `main.js`, `Game.battle` : préserver le callback de l'appelant, par ex. :
   ```js
   var ow = opts.onWin;
   opts.onWin = function (res) { Game.endBattle(res, 'win', opts); if (ow) ow(res); };
   ```
3. **A3** — `world.js` 203 : `if (e.once && S.f('sc_' + e.scene)) return;`
4. **B1** — `tables.js` : `D.TIER.red = D.SPLIST.red.slice();`
5. **B2** — ajouter `▼` et `▶` à la table `SET` de `core/font.js`.
6. **B3/C1/C2/C3** — ajouter les fichiers PWA ; remplacer `dlg:trahison` par une scène existante (ou la tuile `trahison`) ; déclarer `vaux` dans `D.CAST` ; supprimer ou conditionner le double combat de `sanctuaire1`.
7. Hygiène : nettoyer le code mort (D), versionner les sauvegardes, ajouter les scripts `tools/` à la CI.

---

## 7. Outils d'analyse ajoutés (`tools/`)

*État à la livraison de l'analyse — après corrections, voir la section 8 (37/37 tests, 0 anomalie).*

| Script | Rôle | Lancement |
|---|---|---|
| `tools/headless-test.js` | 34 tests fonctionnels sur le code réel (VM Node, DOM/canvas factices, horloge virtuelle) — 30 PASS, 4 FAIL = les bugs A1/A2/A3 + B1 | `node tools/headless-test.js` |
| `tools/intro-trace.js` | traçage pas-à-pas de la scène d'intro — reproduction déterministe du gel A1 | `node tools/intro-trace.js` |
| `tools/audit.js` | audit croisé des données (références, boutiques, scènes, emplois) — 3 anomalies (C1, C2, B1) | `node tools/audit.js` |

*Inventaire des données vérifié* : 72 monstres · 48 cartes · 9 donjons · 16 scènes · 22 jeux de dialogues · 119 objets · 13 emplois · 57 sorts.

---

## 8. Correctifs appliqués (état final — tous vérifiés par les tests)

Tous les correctifs ci-dessous ont été appliqués au code et validés par `tools/headless-test.js` (**37/37 PASS**, répété 10× sans flou), `tools/audit.js` (**0 anomalie**) et `tools/intro-trace.js` (intro terminée, `introDone=true`).

### A. Game-breaking

**A1 — Gel du moteur de scènes** (`engine/world.js`, `Wo.runCut`). À l'expiration de `c.wait`, la scène ne reprenait que si `c.pause` était vrai — or les étapes `map`/`wait`/`fade` posent `c.wait` **sans** `c.pause` : la scène s'arrêtait définitivement (intro jamais terminée, gel après `sanctuaire1` et la scène finale). Correction : à l'expiration du `wait`, `Wo.cutStep()` est toujours appelé (et `c.pause` est levé). Vérifié : test « Scène d'intro terminée », test « Scène post-boss sanctuaire1 terminée (étapes dialogues + map, pas de gel) ».

**A2 — `Game.battle` écrasait les callbacks de l'appelant** (`engine/main.js`). Les wrappers `onWin`/`onLose`/`onEscape` (et un second `onLose` réassigné **après** `Bat.start`, donc mort) remplaçaient silencieusement ceux du bossgate et des scènes : le flag `boss_*` n'était jamais posé, la scène post-boss jamais lancée. Correction : les callbacks de l'appelant sont conservés (`ow`/`ol`/`oe`) et invoqués **après** le traitement du moteur (`Game.endBattle` / `Game.gameOver`). Vérifié : tests « Flag boss posé par onWin du bossgate », « Scène post-boss sanctuaire1 terminée ».

**A3 — Scènes `once` rejouées à chaque interaction** (`engine/world.js`, `tryInteract`). L'ancienne garde `if (e.once && S.f('sc_' + e.scene)) { if (D.SCENES[e.scene]) { } else return; }` ne bloquait que les scènes inconnues : toute scène `once` existante se rejouait. Correction : `return` systématique si le flag `sc_<scène>` est posé. De plus, le `bossgate` pose désormais `sc_<scène>` en plus de `boss_<scène>` à la victoire, si une scène est prévue. Vérifié : test « Scène "once" déjà vue ne se rejoue PAS (2e passage sur la tuile) ».

### B. Importants

**B1 — Le Mage Rouge n'apprenait aucun sort rouge** (`data/tables.js`). `D.TIER` n'avait pas de voie `red` : la progression de la classe Rouge ne trouvait jamais de sorts. Correction : `red: D.SPLIST.red.slice()`. Vérifié : test « Mage rouge lvl 12 possède des sorts rouges » (6 sorts).

**B2 — Glyphes `▼`/`▶` absents de la police bitmap** (`core/font.js`). Ces deux caractères (U+25BC, U+25B6), utilisés par l'interface, n'étaient pas dans la table `SET` : rendus en cases vides. Correction : ajout des deux glyphes. Vérifié : `audit.js` (contrôle de présence dans `SET`).

**B3 — Fichiers PWA manquants** (`ff-iphone/`). `index.html` référençait déjà un manifeste et deux icônes qui n'existaient pas (installation « Ajouter à l'écran d'accueil » cassée). Correction : ajout de `manifest.webmanifest` (nom, description, `start_url`, `display: standalone`, couleurs `#05070f`) et des icônes pixel-art `assets/icon-180.png` / `assets/icon-512.png` (cristal, cohérent avec le titre). Vérifié : `audit.js` (existence des 3 fichiers).

### C. Contenu / données

**C1 — Combat dupliqué après `sanctuaire1`.** La scène `sanctuaire1` contenait à la fois un combat de boss inline **et** la porte `bossgate` : le gardien se combattait deux fois. Correction : les 11 scènes « portes » (dont `sanctuaire1`, `archonte`, `final`…) ne portent plus que la narration — plus aucune étape `{s:'battle'}`/`{s:'label'}` ; le combat de boss est déclenché **uniquement** par la tuile `bossgate`. Les scènes « tuiles » (`trahison`, `kael_final`, `leviathan`) conservent leur combat. Vérifié : tests de la chaîne boss + scène, et scène `trahison` e2e.

**C2 — `vaux` absent de `D.CAST`.** Le Chancelier Vaux, parlé dans sa scène, n'était pas déclaré : son nom ne s'affichait pas. Correction : ajout du membre `vaux` (look `rod/robe`) dans `D.CAST`. Vérifié : `audit.js` (références de casting).

**C3 — Récompenses dupliquées.** Les `win` des boss contenaient des objets/emplois **déjà donnés** par la scène suivante, ou inversement. Correction : chaque récompense a une source unique.
- `monsters.js` : `archonte.win` → `{ job: 'sage' }` (la nacelle est donnée par la scène `cendrix`) ; `nereide.win` → `{}` (la clé d'azur et l'emploi ranger sont donnés par la scène `vaux`).
- `data/maps.js` : suppression de la tuile `cendrix` redondante sur la carte `cendre` (le `bossgate` est le seul déclencheur) ; ajout de la tuile `leviathan` à Port-Azur (12,10), condition `flag:nereide`.
Vérifié : `audit.js` 0 anomalie + tests de scène.

### D. Hygiène (code mort / robustesse)

- `engine/battle.js` : copie de `onEscape` dans l'état du combat (`st.onEscape`), aligné sur le wrapper de `Game.battle`.
- `engine/party.js` : suppression de la clause morte `m.job === 'sage'` dans le filtre d'absorption de `summon` (l'absorption « summon » n'est pas dans les abs du Sage).
- `engine/save.js` : `S.load` refuse désormais une sauvegarde d'une autre version (`o.ver !== S.VERSION`) au lieu d'importer un objet incohérent ; `S.lastErr` porte le motif. `S.swap` (mort) supprimé.
- `engine/ui.js` : toast dédié « Sauvegarde d'une autre version. » quand `S.lastErr === 'ver'`.
- `engine/main.js` : `S.playTick` branché dans `Game.step` (`if (FF.S.playTick) FF.S.playTick(dt);`) — la donnée méta `play` des sauvegardes est désormais réelle (≈ 49 s après la séquence de tests).
- `engine/world.js` : suppression du `forEach` no-op dans l'étape `join`.
- `data/maps.js` : suppression du **second** bloc `INNBACK`/`SHOPBACK`/`ARMSBACK` + `D.MAPS_BACK` (re-déclaration morte, jamais lue) ; le **premier** bloc est conservé car il alimente `interior()` pour les portes de retour des intérieurs (vérifié : les 17 portes de retour aboutissent sur des cases libres).
- Suppression de l'outil provisoire `tools/tmp-doorcheck.js`.

### Points connus, documentés (non corrigés — préexistant ou sans impact gameplay)

- `{ s: 'move', who: 'npc_kael' }` dans la scène `trahison` : étape ignorée (aucune entité `kael` sur la carte) — sans effet, purement cosmétique.
- L'étape `job` de `cutStep` ouvre un dialogue « Nouvel emploi » puis enchaîne immédiatement l'étape suivante : si celle-ci est un `say`, le dialogue est écrasé. Préexistant, cosmétique (le gain d'emploi reste appliqué).
- `case 'battle'` ne pose pas `c.battleWait` : en cas de **défaite** dans un combat de scène, la scène reprend à l'étape suivante (revive puis continuité narrative). Comportement accepté, couvert par le test (la scène aboutit qu'elle finisse en victoire ou en défaite).
- La lanterne (`mine1` + `win` de `gargouille`) est préexistante et laissée telle quelle.

### Outils de vérification (ajoutés / étendus)

| Script | Rôle | Résultat final |
|---|---|---|
| `tools/headless-test.js` | **37 tests** fonctionnels sur le code réel (VM Node, DOM/canvas factices, horloge virtuelle) — inclut désormais la chaîne complète boss → scène post-boss, la scène `trahison` e2e (marche sur la tuile → combat → chapitre 2) et la garde `once` | **37/37 PASS** (10× consécutifs) |
| `tools/intro-trace.js` | Traçage pas-à-pas de la scène d'intro | Intro terminée, `introDone=true`, retour en ville (12,17) |
| `tools/audit.js` | Audit croisé des données **+** contrôle des glyphes `▼`/`▶` et des fichiers PWA | **0 anomalie** |
