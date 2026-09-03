# Révision & plan d'amélioration — « Les Quatre Cristaux »

**Revu le 3 septembre 2026** — code `ff-iphone/` (≈ 6 900 lignes JS, zéro dépendance, zéro asset).
Méthode : lecture ciblée du moteur + exécution de la suite headless (`tools/headless-test.js`) + vérification croisée de chaque point sur le code réel.

---

## 1. État constaté (le bon)

Le socle est **sain et jouable** :

- **37/37 tests headless PASS** (bootstrap <2 s, 48 cartes, 9 thèmes, intro menée à terme, combat ATB, bossgate, donjon procédural, boutique, auberge, sauvegardes, rendu des 48 cartes sans erreur).
- Les **3 bugs bloquants** documentés dans `RAPPORT.md` sont bien **corrigés** dans le code actuel :
  - le moteur de scènes **reprend** après les étapes `map`/`wait`/`fade` (`world.js` : à l'expiration du timer, `Wo.cutStep()` est rappelé) ;
  - `Game.battle` **conserve** les callbacks `onWin/onLose/onEscape` de l'appelant (`main.js`) ;
  - les scènes `once` posent bien leur drapeau.
- Vérifié par tests dédiés : flag `boss_Croc-Boue=true`, scène `sanctuaire1` terminée sans gel, scène `trahison` → chapitre 2, scène `once` non rejouée au 2ᵉ passage.
- Syntaxe : `node --check` passe sur **tous** les fichiers.

Conclusion : le jeu franchit maintenant l'intro et le chapitre 1/2 — ce qui était la priorité. Il reste surtout des **défauts UX/réglages** et des **dettes d'ingénierie**, pas de blocage connu du chemin principal.

---

## 2. Problèmes relevés (vérifiés dans le code)

### P1 — Les options du menu CONFIG ne persistent pas au rechargement (fonctionnel)
- Les réglages `encounters / textSpeed / shake / scan / padHidden` sont **écrits** dans `q4c.settings` (`main.js:344`, appelé à chaque changement via `ui.js`), mais **jamais relus au démarrage**.
- `S.loadSettings()` (`save.js:27`) n'est appelé que par `Game.loadPrefs()` (`main.js:345`), qui n'a **lui-même aucun appelant** → **code mort**.
- Effet : un joueur désactive les scanlines / les rencontres / change la vitesse de texte, recharge la page → **tout revient aux défauts**. Seuls les réglages audio persistent (clé séparée `q4c.audio`, chargée dans `S.init`).
- *Note* : les réglages embarqués dans une sauvegarde persistent, mais pas les préférences « d'appareil » du menu CONFIG.

### P2 — L'option « Secousses : OUI/NON » ne fait rien (leurre)
- `st.shake` est **modifié et sauvegardé** (`ui.js`), mais **jamais lu** nulle part. Les secousses d'écran (`G.fx.shake(...)`, `battle.js`, scènes) sont **inconditionnelles**.
- Tester « Secousses NON » n'a aucun effet → à brancher ou à retirer de l'UI.

### P3 — Réglages fantômes / code mort (propreté)
- Le champ `fx:'auto'` des défauts (`save.js:19,67`) n'est **jamais lu**.
- `Game.loadPrefs` (`main.js:345`) lit la **mauvaise clé** (`q4c.settings`) pour y chercher `muted/musVol/sfxVol` qui vivent sous `q4c.audio` → même s'il était appelé, il ne retrouverait rien d'utile. Signe de plomberie inachevée.

### P4 — Vignette (`fx-vig`) et scanlines couplées puis désynchronisées (visuel mineur)
- Au boot, `applyFx()` (`main.js:399-400`) met `fx-scan` **et** `fx-vig` selon le même `st.scan`.
- Dans le menu, le toggle « Scanlines » ne touche que `fx-scan` → après un rechargement les deux peuvent **diverger**, et la vignette ne peut être réglée indépendamment (pas d'option dédiée).

> Ces 4 points sont confirmés par lecture directe du code ; ils n'ont pas été « provoqués » par un scénario jouable, mais les chaînes d'appel sont sans ambiguïté.

---

## 2bis. Mise à jour — Phase A implémentée ✅

La **Phase A** ci-dessous a été **implémentée et validée** (suite headless toujours **37/37**, + **13/13** nouveaux contrôles dans `tools/phaseA-test.js`) :

| # | Correction | Fichiers |
|---|---|---|
| P1 | Les préférences sont **rechargées au démarrage** : `Game.loadPrefs()` → `S.loadSettings()` est maintenant appelé dans `start()` avant `applyFx()`. `loadSettings` part des défauts puis superpose `q4c.settings`. | `engine/main.js`, `engine/save.js` |
| P2 | « Secousses » est **branchée** : `G.fx.shake()` ne fait rien quand `settings.shake === 0`. | `core/gfx.js` |
| P3 | Code mort retiré : `Game.loadPrefs` ne lit plus la mauvaise clé `q4c.settings` pour l'audio ; champ fantôme `fx:'auto'` supprimé des défauts. | `engine/main.js`, `engine/save.js` |
| P4/P5 | **Vignette et scanlines découplées** : `applyFx()` lit `scan` et `vig` séparément ; nouvelle option « Vignette » dans le CONFIG ; `applyFx` est réutilisée à chaque toggle du menu. | `engine/main.js`, `engine/ui.js` |
| — | Défauts nommés `S.DEFAULT_SETTINGS` (renvoi unique, sans `fx`), clés manquantes des vieilles sauvegardes remplies à l'import. | `engine/save.js` |

*Non fait volontairement (report Phase D)* : la **fusion** des clés `q4c.settings`/`q4c.audio` en un module `prefs` unique — l'audio persiste déjà correctement seul, et fusionner est plus sûr dans la phase refactor.

---

## 3. Plan d'amélioration (par ordre de priorité)

### Phase A — Correctifs ciblés, faible risque (à faire en premier) — ✔ FAIT
1. **Rétablir le chargement des préférences** : appeler `S.loadSettings()` puis `applyFx()` au démarrage (dans `start()`/`boot`), et appliquer les classes `fx-scan`/`fx-vig`/`pad-hidden` selon le réglage lu.
2. **Supprimer `Game.loadPrefs`** (mort, mauvaise clé) ou le réparer — et en profiter pour **fusionner** les deux clés de stockage (`q4c.settings` / `q4c.audio`) en un seul objet de préférences cohérent.
3. **Brancher réellement « Secousses »** : faire dépendre `G.fx.shake` d'un garde (`if (!S.settings.shake) return;`) ou, à défaut, **retirer l'entrée du menu**.
4. Nettoyer les champs morts `fx:'auto'`.
5. **Découpler vignette / scanlines** : options distinctes, ou ignorer `fx-vig` et le retirer du CSS si redondant.

*Critère de validation* : après ces changements → changer un réglage, recharger, vérifier qu'il est conservé et appliqué.

### Phase B — Robustesse & tests — ✔ FAIT (partiellement : voir note CDN)
6. **Boot & rechargement réifiés par test** → `tools/boot-prefs-test.js` (**13/13**). Il exécute le vrai chemin de démarrage `arm() → Game.startOnce() → boot → loadPrefs → applyFx` dans un DOM factice qui enregistre les classes `body`, puis **simule un rechargement** (2ᵉ–3ᵉ contextes frais partageant le même `localStorage`). Il prouve que P1/P4 (persistance scanlines/vignette après rechargement), P2 (garde Secousses) et le rétablissement de la vitesse de texte sont **verrouillés par test**.
7. **Smoke test navigateur réel** → `tools/smoke-browser.js` **livré, prêt à l'emploi** (Playwright : boot sans erreur console, clic « TOUCHEZ POUR COMMENCER » → audio + titre, captures vers `shots/`). ⚠ **Non exécuté dans ce sandbox** : les CDN de binaires Chromium (Playwright/Google) sont **bloqués par le réseau** (seul `registry.npmjs.org` répond) → aucun navigateur installable. À lancer localement : `npm install && npx playwright install chromium && npm run test:browser`.
8. **Chemin critique** (intro → ville → combat → donjon Sanctuaire → boss → ch1 → ch2 → garde `once`) : **déjà couvert logiquement** par la suite existante `tools/headless-test.js` (37 tests) et relancé ici (**37/37**).

**Résultat consolidé : `npm test` = 37 + 13 + 13 = 63 contrôles verts** (headless + Phase A + boot/rechargement).

### Phase C — Expérience joueur & contenu — ✔ items 9, 10, 11, 12 FAITS
**Consolidé `npm test` : 37 + 13 + 13 + 8 (audio) + 21 (NG+) + 11 (parcours) = 103 contrôles verts, + audit économie (invariants OK).**
9. **Politique audio au premier geste iOS — implémenté ✅** (`tools/audio-gesture-test.js`, **8/8**) :
   - `start()` (y compris l'auto-start à 80 ms) ne déclenche **plus** la musique de titre. Planifier sur un AudioContext encore suspendu (autoplay iOS) aurait fait jouer le morceau faux au déblocage.
   - Nouveau `Game.unlockAudio()`, **idempotent**, branché sur le 1ᵉʳ geste réel : clic « TOUCHEZ POUR COMMENCER », `touchstart`, `keydown`, `pointerdown`. Il appelle `FF.Snd.unlock()` (init + `resume()`) puis lance la musique de titre **une seule fois**.
   - `audio.js` : ajout de `Snd.unlock()` / `Snd.isUnlocked()`.
   - Test : boot auto → `music != title` et `audioTitle` non posé ; 1ᵉʳ geste → musique de titre lancée ; 2ᵉ geste → inchangée ; clic `#boot-go` → aussi un geste. *(La validation auditive finale sur vrai iPhone reste à faire sur matériel.)*
10. **Économie / équilibrage — audit quantitatif ✅** (`tools/economy-audit.js`, invariants OK) :
    - Mesures : courbe `expFor` (1→64, 10→5710, 20→23743, 30→54886, 50→158159), 6 boutiques / 51 articles, 72 monstres (14 boss) / 14 avec drop, XP/montée (1→2 : 166, 20→21 : 2516), cadence des 7 zones du monde (zone d'Aurélia : lvl ~3, ~165 XP/rencontre ≈ 3 combats pour monter au lvl 2).
    - Invariants vérifiés (pas d'arbitrage de design) : courbe strictement croissante jusqu'à `MAXLV`, chaque monstre `exp>0`/`gil>=0`, butins & larcins et objets de boutique référencent des objets existants à prix défini.
11. **New Game+ réellement défini — implémenté ✅** (`tools/ngplus-test.js`, **21/21**) :
    - Nouvelle détection d'une partie terminée : `S.save()` écrit `cleared = flags.ending`, exposé via `Save.meta().cleared` → `Game.clearedSlots()`.
    - Au titre, si un casier est fini, une option **« NOUVELLE PARTIE + (niveaux conservés) »** apparaît (`titleOpts`/`titlePick`). Mise en page du menu ajustée (≤5 entrées).
    - `Game.newGamePlus()` charge la partie finie la plus avancée, capture via `P.captureCarry()` (niveaux, maîtrises d'emploi `jlv`, emplois débloqués, esprits `summons`, sorts offerts `gifted` des trois héros Arno/Myrelle/Sica), réinitialise l'histoire (`P.newGameCarry()` → ch.1, carte Aurélia, drapeaux vierges, inventaire par défaut) puis relance la scène d'intro. La run est marquée `ngp`.
    - La promesse des crédits (« le New Game+ reprend vos niveaux ») est **désormais vraie** — aucun retrait de texte nécessaire.
    - Test : run menée au bout (ending) → option + proposée ; NG+ conserve lvl 20 + emplois + esprits + gifted tout en réinitialisant l'histoire ; sans partie finie → option absente et fallback en partie fraîche.
12. **Parcours / interactions secondaires — ✅** (`tools/parcours-test.js`, **11/11**) :
    - **Coffres** : ouverture objet (+2 potions) et gils (+120), garde « une seule fois » (`S.treasure`) — réouverture sans gain ;
    - **PNJ** : un dialogue s'ouvre ;
    - **Dirigeable** : embarquement refusé sans la Nacelle (reste `mode foot`), embarquement `→ ship` avec la nacelle, débarquement permis sur terrain ouvert (`→ foot`) mais **refusé sur montagne** (mode ship conservé).
    - Boutique / auberge / menus / cristal étaient déjà couverts par `headless-test.js`.

### Phase D — Qualité d'ingénierie (dette technique)
13. **Découpage** : les IIFE géants (`battle.js` 1 044 L, `ui.js` 722 L, `bake.js` 783 L, `world.js` 545 L) restent lisibles mais durs à tester unitairement — extraire les fonctions pures (règles de dégâts, tables, formatage) et garder la couche « contenu » séparée (déjà le cas : `data/`).
14. **Un seul point de persistance** : passer les 2-3 clés `q4c.*` à un petit module `prefs` avec `load/save/apply`, testable.
15. **Garde-fous globaux** : s'assurer que `Wo.update` et le rendu ne dépendent plus d'un `Wo.cut` bloquant, et centraliser `modal` (le code a déjà un correctif de secours à `ui.js` — le généraliser).
16. **Commentaire/documentation** : un `ARCHITECTURE.md` court pour qu'un nouveau lecteur repère `core / data / engine`.

---

## 4. Ce que je n'ai PAS pu confirmer (et qui mérite vérification)
- **Complétude du chemin jusqu'à la fin** (chapitres au-delà de 2, crédits) : non prouvée par la suite actuelle.
- **Fiabilité audio/tactile sur vrai iPhone** (permission, orientation, plein écran) — nécessite un test sur matériel.
- Rendu/UX exact du **menu options à l'écran** sur petit écran.

---

## 5. Recommandation
Prioriser la **Phase A** (5 petits correctifs sans risque qui restaurent des fonctionnalités promises par l'UI : persistance des réglages, option Secousses) puis **Phase B** pour les verrouiller par tests. Le cœur du jeu (moteur, scénario ch1/ch2, combat) est en bon état et ne doit pas être déstabilisé : les changements A sont **localisés et isolés**.
