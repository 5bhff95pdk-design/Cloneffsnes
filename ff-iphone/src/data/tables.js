/* ============================================================
   D — tables : emplois, caractéristiques, objets, sorts, boutiques
   ============================================================ */
(function (FF) {
  'use strict';
  var D = FF.D = {};

  D.MAXLV = 50;
  D.STATS = ['for', 'vit', 'agi', 'int', 'esp'];
  D.STATN = { for: 'Force', vit: 'Vitalité', agi: 'Agilité', int: 'Intelligence', esp: 'Esprit' };

  D.ELEM = {
    fire: { n: 'Feu', c: '#ff7a3d' }, ice: { n: 'Glace', c: '#8fe8ff' }, lit: { n: 'Foudre', c: '#ffe85c' },
    wind: { n: 'Vent', c: '#a6ffbf' }, earth: { n: 'Terre', c: '#c99a5e' }, water: { n: 'Eau', c: '#5aa8ff' },
    holy: { n: 'Sacré', c: '#fff2a8' }, dark: { n: 'Ténèbres', c: '#b06fff' }, phys: { n: 'Matériel', c: '#ffffff' }
  };

  D.STATUS = {
    poison: { n: 'Poison', c: '#7ad06a', bad: 1 }, sleep: { n: 'Sommeil', c: '#9fb3ff', bad: 1 },
    silence: { n: 'Silence', c: '#c9a0ff', bad: 1 }, stop: { n: 'Stop', c: '#d0d0d0', bad: 1 },
    confuse: { n: 'Confus', c: '#ffb0d0', bad: 1 }, blind: { n: 'Cécité', c: '#a08a6a', bad: 1 },
    paralyze: { n: 'Para', c: '#ffe85c', bad: 1 }, doom: { n: 'Compte à rebours', c: '#ff6a6a', bad: 1 },
    stone: { n: 'Pierre', c: '#c9c9c9', bad: 1 }, defend: { n: 'Garde', c: '#8fb3ff', bad: 0 },
    haste: { n: 'Hâte', c: '#a6ffbf', bad: 0 }, shield: { n: 'Bouclier', c: '#ffd257', bad: 0 },
    might: { n: 'Puissance', c: '#ff9a6a', bad: 0 }, reflect: { n: 'Réflexion', c: '#e0b0ff', bad: 0 },
    invisible: { n: 'Voile', c: '#8fe8ff', bad: 0 }, regen: { n: 'Régén.', c: '#b0ffb0', bad: 0 }
  };

  /* ---------------- JOBS / EMPLOIS ---------------- */
  /* base = stats au lvl 1 ; grow = gain moyen par niveau ; lv = PV/PM de départ */
  function J(o) { return o; }
  D.JOBS = {
    chev: J({ n: 'Chevalier', d: 'Équilibré, solide, protège ses alliés.', base: [12, 11, 8, 5, 5], grow: [1.6, 1.5, .9, .4, .4], pv: [46, 5.6], pm: [6, .7], eq: ['sword', 'greatsword', 'dagger', 'spear', 'light', 'heavy', 'hat', 'helm', 'acc'], ab: ['cry', 'guard', 'provoke'], learn: { white: [1, 1, 2, 3, 5, 7, 0, 0] } }),
    dark: J({ n: 'Chevalier Noir', d: 'Frappe et saigne l’ennemi, endurci au chaos.', base: [15, 12, 7, 5, 7], grow: [1.9, 1.6, .8, .4, .7], pv: [52, 6.2], pm: [10, 1.1], eq: ['sword', 'greatsword', 'heavy', 'helm', 'acc'], ab: ['darkedge', 'blackhole', 'taunt'], learn: { black: [1, 1, 2, 4, 6, 8, 0, 0] } }),
    war: J({ n: 'Guerrier', d: 'Force brute, brise les défenses.', base: [17, 10, 8, 4, 3], grow: [2.2, 1.3, 1, .3, .2], pv: [56, 6.8], pm: [4, .5], eq: ['sword', 'greatsword', 'axe', 'spear', 'heavy', 'helm', 'acc'], ab: ['smash', 'warcry', 'bulwark'], learn: {} }),
    monk: J({ n: 'Moine', d: 'Combattant à mains nues, esquive et enchaîne.', base: [13, 13, 12, 5, 6], grow: [1.7, 1.8, 1.4, .4, .6], pv: [50, 6.0], pm: [8, .8], eq: ['fist', 'light', 'hat', 'acc'], ab: ['kick', 'chi', 'mantra'], learn: { white: [2, 4, 0, 0, 0, 0, 0, 0] } }),
    thief: J({ n: 'Voleur', d: 'Rapide, vole le butin, frappe les points faibles.', base: [11, 8, 17, 7, 6], grow: [1.4, 1, 2.1, .7, .5], pv: [40, 4.8], pm: [8, .8], eq: ['dagger', 'sword', 'light', 'hat', 'acc'], ab: ['steal', 'sneak', 'lowblow'], learn: {} }),
    ranger: J({ n: 'Rôdeur', d: 'Archer de précision, plusieurs flèches par salve.', base: [13, 9, 14, 8, 6], grow: [1.6, 1.2, 1.8, .8, .5], pv: [44, 5.2], pm: [10, 1], eq: ['bow', 'dagger', 'spear', 'light', 'hat', 'acc'], ab: ['volley', 'aim', 'cover'], learn: { white: [3, 0, 0, 0, 0, 0, 0, 0] } }),
    white: J({ n: 'Mage Blanc', d: 'Soin, barrières et lumière.', base: [5, 6, 8, 17, 13], grow: [.5, .8, .9, 2, 1.6], pv: [26, 3.0], pm: [24, 2.6], eq: ['staff', 'rod', 'dagger', 'mace', 'robe', 'hat', 'hood', 'acc'], ab: ['pray'], learn: { white: [1, 1, 1, 2, 2, 3, 4, 5] } }),
    black: J({ n: 'Mage Noir', d: 'Élémentaire et malédictions.', base: [5, 6, 8, 14, 17], grow: [.5, .8, .9, 1.7, 2], pv: [26, 3.0], pm: [26, 2.8], eq: ['staff', 'rod', 'dagger', 'mace', 'robe', 'hat', 'hood', 'acc'], ab: ['hex', 'drain'], learn: { black: [1, 1, 2, 3, 4, 5, 6, 7] } }),
    red: J({ n: 'Mage Rouge', d: 'Troisième voie : tout apprendre, jamais maîtriser.', base: [9, 9, 11, 11, 11], grow: [1, 1, 1.2, 1.2, 1.2], pv: [34, 4.0], pm: [18, 2], eq: ['sword', 'dagger', 'staff', 'rod', 'mace', 'light', 'robe', 'hat', 'hood', 'acc'], ab: ['dual'], learn: { white: [2, 3, 4, 6, 8, 0, 0, 0], black: [2, 3, 4, 6, 8, 0, 0, 0], red: [1, 2, 3, 5, 7, 9] } }),
    summon: J({ n: 'Invocationniste', d: 'Appelle les grands esprits.', base: [6, 7, 9, 18, 15], grow: [.6, .9, 1, 2.1, 1.7], pv: [28, 3.2], pm: [28, 3], eq: ['staff', 'rod', 'dagger', 'robe', 'hat', 'hood', 'acc'], ab: ['summon'], learn: { summon: [1, 2, 3, 4, 5, 6, 7, 8] } }),
    bard: J({ n: 'Barde', d: 'Chante des airs qui changent le cours du combat.', base: [8, 8, 13, 13, 10], grow: [.8, .9, 1.5, 1.5, 1.1], pv: [32, 3.6], pm: [18, 1.9], eq: ['instrument', 'dagger', 'rod', 'light', 'robe', 'hat', 'acc'], ab: ['sing', 'dirge'], learn: { white: [4, 6, 0, 0, 0, 0, 0, 0] } }),
    dragoon: J({ n: 'Chevalier Dragon', d: 'S’envole, puis s’abat avec la fureur du ciel.', base: [16, 11, 11, 7, 7], grow: [2, 1.5, 1.2, .6, .6], pv: [54, 6.4], pm: [12, 1.2], eq: ['spear', 'sword', 'light', 'heavy', 'helm', 'dragoon', 'acc'], ab: ['jump', 'dragonfire'], learn: { black: [5, 7, 0, 0, 0, 0, 0, 0] } }),
    sage: J({ n: 'Sage', d: 'Maîtrise des deux voies et des esprits.', base: [10, 11, 12, 18, 18], grow: [1.1, 1.2, 1.4, 2.1, 2.1], pv: [38, 4.2], pm: [34, 3.3], eq: ['sword', 'staff', 'rod', 'mace', 'dagger', 'instrument', 'light', 'robe', 'hat', 'hood', 'acc'], ab: ['pray', 'hex', 'dual', 'meditate'], learn: { white: [1, 1, 1, 2, 3, 4, 5, 6], black: [1, 1, 2, 3, 4, 5, 6, 7], summon: [1, 2, 3, 4, 5, 6, 7, 8] } })
  };
  D.JOBORDER = ['chev', 'dark', 'war', 'monk', 'thief', 'ranger', 'white', 'black', 'red', 'summon', 'bard', 'dragoon', 'sage'];

  /* --------- capacités d'emploi --------- */
  /* kind: phys|magic|heal|buff|debuff|st|drain|steal|jump|revive|song */
  D.ABILITIES = {
    cry: { n: 'Cri de guerre', cost: 4, kind: 'buff', stat: 'atk', v: .35, dur: 6, tgt: 'ally', d: 'Hausse la Force de tout le groupe.' },
    guard: { n: 'Garde', cost: 3, kind: 'buff', stat: 'def', v: .45, dur: 4, tgt: 'ally', d: 'Renforce la défense du groupe.' },
    provoke: { n: 'Provocation', cost: 3, kind: 'st', st: 'defend', inf: 'taunt', p: 1, dur: 3, tgt: 'self', d: 'Attire les attaques sur soi.' },
    darkedge: { n: 'Lame Noire', cost: 6, kind: 'phys', pow: 1.15, elem: 'dark', tgt: 'foe', d: 'Frappe ténébreuse qui draine la vie.' },
    blackhole: { n: 'Nébuleuse', cost: 14, kind: 'magic', pow: 1.1, elem: 'dark', tgt: 'foes', st: 'stop', p: .35, d: 'Ténèbres de groupe, peut figer le temps.' },
    taunt: { n: 'Défi', cost: 4, kind: 'debuff', stat: 'atk', v: -.3, dur: 5, tgt: 'foe', d: 'Brise le moral d’un adversaire.' },
    smash: { n: 'Frappe terrible', cost: 6, kind: 'phys', pow: 1.9, tgt: 'foe', d: 'Un coup puissant, précis et brutal.' },
    warcry: { n: 'Hurlement', cost: 5, kind: 'debuff', stat: 'def', v: -.4, dur: 5, tgt: 'foes', d: 'Effraie les ennemis et perce leur garde.' },
    bulwark: { n: 'Rempart', cost: 5, kind: 'buff', stat: 'def', v: .8, dur: 3, tgt: 'self', d: 'Deviens un mur de chair et d’acier.' },
    kick: { n: 'Ruades', cost: 5, kind: 'phys', pow: .8, hits: 4, tgt: 'foe', d: 'Quatre coups de pied rapides.' },
    chi: { n: 'Énergie', cost: 6, kind: 'heal', pow: .9, tgt: 'self', d: 'Récupère des points de vie par la méditation.' },
    mantra: { n: 'Mantra', cost: 5, kind: 'buff', stat: 'mdef', v: .6, dur: 5, tgt: 'ally', d: 'Protège la magie de l’équipe.' },
    steal: { n: 'Voler', cost: 0, kind: 'steal', tgt: 'foe', d: 'Dérobe un objet à l’ennemi.' },
    sneak: { n: 'Esquive', cost: 4, kind: 'buff', stat: 'eva', v: .5, dur: 4, tgt: 'ally', d: 'Le groupe esquive mieux.' },
    lowblow: { n: 'Coup bas', cost: 4, kind: 'phys', pow: 1, st: 'paralyze', p: .5, tgt: 'foe', d: 'Frappe sournoise, peut paralyser.' },
    volley: { n: 'Salve', cost: 7, kind: 'phys', pow: .65, hits: 3, tgt: 'foes', pierce: 1, d: 'Trois flèches sur des cibles au hasard.' },
    aim: { n: 'Viser', cost: 4, kind: 'buff', stat: 'crit', v: 1, dur: 99, tgt: 'self', d: 'Augmente fortement les chances de coup critique.' },
    cover: { n: 'Couvert', cost: 5, kind: 'buff', stat: 'def', v: .3, dur: 4, tgt: 'ally', d: 'Protège un allié de son ombre.' },
    pray: { n: 'Prier', cost: 0, kind: 'mp', tgt: 'self', d: 'Médite pour retrouver des points de magie.' },
    hex: { n: 'Malédiction', cost: 8, kind: 'magic', pow: .7, elem: 'dark', st: 'stone', p: .45, tgt: 'foe', d: 'Ronge la cible, peut la pétrifier.' },
    drain: { n: 'Aspiration', cost: 8, kind: 'drain', pow: .9, tgt: 'foe', d: 'Vole la vie d’un adversaire.' },
    dual: { n: 'Double sort', cost: 0, kind: 'dual', d: 'Lance deux sorts rouges à la suite.' },
    summon: { n: 'Invoquer', cost: 0, kind: 'summon', d: 'Appelle un grand esprit (coûte sa charge).' },
    sing: { n: 'Chanter', cost: 6, kind: 'song', song: 'hero', tgt: 'ally', d: 'Air héroïque : force et agilité du groupe.' },
    dirge: { n: 'Complainte', cost: 7, kind: 'song', song: 'dirge', tgt: 'foes', d: 'Air funèbre : endort et ralentit.' },
    jump: { n: 'Sautil', cost: 0, kind: 'jump', tgt: 'foe', d: 'S’envole, puis retombe au tour suivant.' },
    dragonfire: { n: 'Souffle du dragon', cost: 10, kind: 'magic', pow: 1.05, elem: 'fire', tgt: 'foes', st: 'sleep', p: .2, d: 'Un souffle de flamme sur tous les ennemis.' },
    meditate: { n: 'Méditer', cost: 0, kind: 'mp', v: 2, tgt: 'self', d: 'Récupère beaucoup de PM.' }
  };

  /* ---------------- OBJETS ---------------- */
  var IT = D.IT = {};
  function it(id, o) { IT[id] = o; o.id = id; return o; }
  /* consommables */
  it('potion', { n: 'Potion', k: 'use', price: 60, heal: 90, d: 'Rend 90 PV.', icon: { k: 'potion', c: '#e8503a' } });
  it('hipotion', { n: 'Grande Potion', k: 'use', price: 300, heal: 320, d: 'Rend 320 PV.', icon: { k: 'potion', c: '#ffd257' } });
  it('x potion', { n: 'Élixir', k: 'use', price: 1800, heal: .5, mp: .5, full: 1, d: 'Rend la moitié des PV et PM.', icon: { k: 'potion', c: '#c07bff' } });
  it('elixir', { n: 'Méga-Élixir', k: 'use', price: 0, heal: 1, mp: 1, full: 1, d: 'Soigne tout, pleinement.', icon: { k: 'potion', c: '#ff7bd5' } });
  it('phoenix', { n: 'Plume de Phénix', k: 'use', price: 220, revive: .5, tgt: 'dead', d: 'Ranime un allié à moitié.', icon: { k: 'feather', c: '#ff8a3d' } });
  it('corpse', { n: 'Corail Vivant', k: 'use', price: 900, revive: 1, heal: .4, tgt: 'dead', all: 1, d: 'Ranime tout le groupe.', icon: { k: 'shell', c: '#ff6a8a' } });
  it('remedy', { n: 'Remède', k: 'use', price: 120, cure: 1, all: 1, d: 'Lève tous les maux.', icon: { k: 'flask', c: '#7ad06a' } });
  it('antidote', { n: 'Antidote', k: 'use', price: 40, cure: 'poison', d: 'Contre le poison.', icon: { k: 'flask', c: '#6ad08a' } });
  it('eye', { n: 'Baume Oculaire', k: 'use', price: 60, cure: 'blind', d: 'Éclaire la vue.', icon: { k: 'flask', c: '#d0b06a' } });
  it('echo', { n: 'Écho Doré', k: 'use', price: 90, cure: 'silence', d: 'Rend la voix.', icon: { k: 'horn', c: '#ffd257' } });
  it('bell', { n: 'Clochette', k: 'use', price: 70, cure: 'sleep', all: 1, d: 'Réveille un allié.', icon: { k: 'bell', c: '#f0e0a0' } });
  it('alarm', { n: 'Cor de Réveil', k: 'use', price: 140, cure: 'stop', d: 'Relance le temps figé.', icon: { k: 'horn', c: '#ff9a6a' } });
  it('mirror', { n: 'Miroir Ancien', k: 'use', price: 380, cure: 'stone', d: 'Dépétrifie.', icon: { k: 'mirror', c: '#cfe6ff' } });
  it('tent', { n: 'Tente', k: 'field', price: 120, heal: .5, mp: .5, uses: 3, d: 'Soigne la moitié, hors combat.', icon: { k: 'tent', c: '#c97b4a' } });
  it('cabin', { n: 'Cabane', k: 'field', price: 600, heal: 1, mp: 1, uses: 2, d: 'Soigneur complet, hors combat.', icon: { k: 'tent', c: '#e0c96a' } });
  it('smoke', { n: 'Bombe de Fumée', k: 'escape', price: 100, uses: 4, d: 'Fuite garantie.', icon: { k: 'bombs', c: '#7a7a8f' } });
  it('speed', { n: 'Aiguille d’Agile', k: 'use', price: 200, buff: { stat: 'agi', v: .5, dur: 30 }, d: 'Vif comme le vent (30 s).', icon: { k: 'needle', c: '#a6ffbf' } });
  it('bomb', { n: 'Bombe', k: 'throw', price: 60, dmg: 1.05, elem: 'fire', d: 'Explose sur un ennemi.', icon: { k: 'bombs', c: '#ff7a3d' } });
  it('fbomb', { n: 'Bombe Gelée', k: 'throw', price: 140, dmg: 1.15, elem: 'ice', d: 'Éclats de glace.', icon: { k: 'bombs', c: '#8fe8ff' } });
  it('tbomb', { n: 'Bombe Foudroyante', k: 'throw', price: 260, dmg: 1.3, elem: 'lit', d: 'Court-circuit.', icon: { k: 'bombs', c: '#ffe85c' } });
  it('salve', { n: 'Herbe de Lune', k: 'use', price: 320, mp: .4, d: 'Rend des PM.', icon: { k: 'herb', c: '#9fb3ff' } });
  it('mote', { n: 'Poudre de Mote', k: 'use', price: 240, heal: 150, d: 'Poudre qui recolle les os.', icon: { k: 'dust', c: '#e6e2cf' } });
  it('gold', { n: 'Sablier Doré', k: 'use', price: 500, haste: 1, d: 'Hâte sur tout le groupe.', icon: { k: 'glass', c: '#ffd257' } });

  /* clés */
  function key(id, n, d) { it(id, { n: n, k: 'key', price: 0, d: d, icon: { k: 'key', c: '#ffe066' } }); }
  key('clé rouillée', 'Clé Rouillée', 'Ouvre une porte scellée de la mine.');
  key('clé d’azur', 'Clé d’Azur', 'Froide comme la mer, ouvre la cale du Léviathan.');
  key('clé cendrée', 'Clé Cendrée', 'Encore tiède. Les forges de Valcendre.');
  key('grimoire', 'Grimoire d’Élice', 'Contient les formules des esprits.');
  key('lettre', 'Lettre de Kael', 'À porter à Sica, sans faute.');
  key('lanterne', 'Lanterne du Guet', 'Sans elle, la caverne est noire.');
  key('écaille', 'Écaille de Borée', 'Offrande pour le peuple des eaux.');
  key('cloche', 'Cloche de Givre', 'Appelle le vent du nord.');
  key('nacelle', 'Nacelle Céleste', 'Le cœur du dirigeable « L’Aube ».');
  key('harmonium', 'Harmonium Brisé', 'Il faudrait le réparer à Nivalis.');
  key('sceau', 'Sceau des Quatre', 'Il ouvre la porte de la Tour Obsidienne.');

  /* armes */
  function wp(id, n, type, atk, price, o) {
    o = o || {}; o.n = n; o.k = 'weap'; o.type = type; o.atk = atk; o.price = price;
    o.icon = o.icon || { k: { sword: 'sword', greatsword: 'greatsword', dagger: 'dagger', spear: 'spear', staff: 'staff', rod: 'rod', bow: 'bow', fist: 'fist', mace: 'mace', instrument: 'lyre', axe: 'axe' }[type] || 'sword', c: o.c || '#c9d6e6' };
    return it(id, o);
  }
  wp('ep-baie', 'Épée de Baïe', 'sword', 7, 260, { c: '#cfe0e6' });
  wp('ep-fer', 'Lame de Fer', 'sword', 13, 780, { c: '#dfe6ee', sp: { for: 1 } });
  wp('ep-acier', 'Lame d’Acier', 'sword', 21, 1900, { c: '#eef3ff', sp: { for: 2 } });
  wp('ep-givre', 'Épée de Givre', 'sword', 27, 3400, { c: '#a6dcff', elem: 'ice', sp: { esp: 2 } });
  wp('ep-brasier', 'Rasoir Ardent', 'sword', 31, 4200, { c: '#ff9a5a', elem: 'fire', sp: { int: 3 } });
  wp('ep-éclair', 'Lame Foudroyante', 'sword', 35, 5200, { c: '#ffe85c', elem: 'lit' });
  wp('ep-cristal', 'Épée de Cristal', 'sword', 42, 9000, { c: '#c9e6ff', elem: 'holy', sp: { int: 4, esp: 4 } });
  wp('ex-calamite', 'Excalipus', 'sword', 58, 0, { c: '#f6ffd0', elem: 'holy', sp: { for: 10, agi: 6, int: 6 }, two: 0, unique: 1 });
  wp('g-erado', 'Épée à Deux Mains', 'greatsword', 18, 900, { two: 1, c: '#d6dfe6', sp: { for: 3 } });
  wp('g-frost', 'Brise-Givre', 'greatsword', 30, 3800, { two: 1, c: '#b0e0ff', elem: 'ice', sp: { for: 4, vit: 2 } });
  wp('g-carmine', 'Carmine', 'greatsword', 40, 6400, { two: 1, c: '#ff6a6a', elem: 'fire', sp: { for: 6 } });
  wp('g-obsidienne', 'Obsidienne', 'greatsword', 52, 0, { two: 1, c: '#6a5a8f', elem: 'dark', sp: { for: 8, vit: 4 }, unique: 1 });
  wp('d-poinçon', 'Poinçon', 'dagger', 5, 120, { c: '#cfe0e6', sp: { agi: 2 } });
  wp('d-miso', 'Kukri', 'dagger', 11, 640, { c: '#e0d0a0', sp: { agi: 3 } });
  wp('d-poison', 'Stylet Vipérin', 'dagger', 16, 1400, { c: '#8fd06a', st: 'poison', p: .45, sp: { agi: 4 } });
  wp('d-orchis', 'Orchis', 'dagger', 26, 3900, { c: '#ff9ad0', sp: { agi: 6, int: 3 } });
  wp('d-murakumo', 'Lame Murakumo', 'dagger', 34, 6600, { c: '#b0ffb0', sp: { agi: 8, for: 4 } });
  wp('lance-cip', 'Lance de Cypres', 'spear', 10, 400, { c: '#c9a86a', sp: { for: 1 } });
  wp('lance-argent', 'Lance d’Argent', 'spear', 19, 2100, { c: '#e6eef6', sp: { for: 2, vit: 2 } });
  wp('lance-dragon', 'Lance du Dragon', 'spear', 33, 5000, { c: '#7fd6a0', elem: 'wind', sp: { for: 5 } });
  wp('lance-gungnir', 'Gungnir', 'spear', 46, 0, { c: '#ffe6a0', sp: { for: 7, agi: 5 }, unique: 1 });
  wp('baton-cedre', 'Bâton de Cèdre', 'staff', 4, 150, { c: '#c9a86a', sp: { int: 2 } });
  wp('baton-saule', 'Bâton de Saule', 'staff', 9, 700, { c: '#a6c96a', sp: { int: 4, esp: 2 } });
  wp('baton-fer', 'Bâton de Fer', 'mace', 12, 900, { c: '#b0b8c9', sp: { vit: 3 } });
  wp('baton-nuage', 'Bâton des Nuages', 'staff', 17, 2600, { c: '#e6f0ff', sp: { int: 6, esp: 4 } });
  wp('baton-mage', 'Bâton du Sage', 'staff', 24, 5400, { c: '#d6b0ff', sp: { int: 9, esp: 6, pm: 20 } });
  wp('baton-asura', 'Bâton d’Asura', 'staff', 30, 0, { c: '#ff9ad0', sp: { int: 12, esp: 10, pm: 40 }, unique: 1 });
  wp('canne-eau', 'Canne Aquatique', 'rod', 8, 620, { c: '#7fb0ff', elem: 'water', sp: { int: 3 } });
  wp('canne-feu', 'Canne de Soufre', 'rod', 12, 1100, { c: '#ff8a4f', elem: 'fire', sp: { int: 4 } });
  wp('canne-ice', 'Canne de Corail', 'rod', 18, 2400, { c: '#a6e8ff', elem: 'ice', sp: { int: 6 } });
  wp('canne-for', 'Canne de Force', 'rod', 22, 4200, { c: '#ffd257', elem: 'lit', sp: { int: 8, esp: 4 } });
  wp('canne-étoile', 'Canne Stellaire', 'rod', 29, 0, { c: '#e0d0ff', elem: 'holy', sp: { int: 12, pm: 30 }, unique: 1 });
  wp('arc-ifs', 'Arc d’If', 'bow', 9, 550, { c: '#b0c96a', sp: { agi: 3 } });
  wp('arc-yumi', 'Grand Arc', 'bow', 17, 1900, { c: '#d6e6a0', sp: { agi: 5, for: 2 } });
  wp('arc-percee', 'Arc de Percée', 'bow', 26, 4600, { c: '#ffe6b0', pierce: 1, sp: { agi: 8, for: 3 } });
  wp('arc-artemis', 'Arc d’Artémis', 'bow', 35, 0, { c: '#f0f8ff', elem: 'holy', sp: { agi: 10, int: 4 }, unique: 1 });
  wp('poing-fer', 'Gants de Fer', 'fist', 8, 480, { c: '#b0b8c9', sp: { for: 2, vit: 2 } });
  wp('poing-tigre', 'Griffes du Tigre', 'fist', 15, 1600, { c: '#e0b04a', sp: { for: 4, agi: 3 } });
  wp('poing-kaiser', 'Poings d’Acier', 'fist', 25, 4000, { c: '#dfe6ee', sp: { for: 8, vit: 4 } });
  wp('poing-ouranos', 'Poings d’Ouranos', 'fist', 36, 0, { c: '#a6ffd0', elem: 'lit', sp: { for: 11, agi: 6 }, unique: 1 });
  wp('luth-echo', 'Luth d’Écho', 'instrument', 6, 400, { c: '#c9a86a', sp: { int: 2, esp: 2 } });
  wp('lyre-aria', 'Lyre d’Aria', 'instrument', 14, 2000, { c: '#ffe6a0', sp: { int: 5, esp: 5 } });
  wp('harpe-mireille', 'Harpe de Mireille', 'instrument', 22, 4400, { c: '#d0b0ff', sp: { int: 8, esp: 8, agi: 3 } });
  wp('hache-bronce', 'Hache de Bronze', 'axe', 14, 700, { c: '#c9c9a0', two: 1, sp: { for: 3, vit: 1 } });
  wp('hache-guerre', 'Hache de Guerre', 'axe', 26, 3000, { c: '#d6d6e6', two: 1, sp: { for: 6, vit: 2 } });

  /* armures, casques, accessoires */
  function ar(id, n, slot, def, mdef, price, o) {
    o = o || {}; o.n = n; o.k = slot; o.slot = slot; o.def = def; o.mdef = mdef; o.price = price;
    o.type = o.type || (slot === 'armor' ? (def > mdef + 6 ? 'heavy' : def > 2 && mdef > 6 ? 'robe' : 'light') : slot);
    o.icon = o.icon || { k: { armor: o.type, helm: 'helm', acc: o.atype || 'ring' }[slot] || 'ring', c: o.c || '#b0c0d6' };
    return it(id, o);
  }
  ar('cotte-cuir', 'Cotte de Cuir', 'armor', 6, 2, 240, { type: 'light', c: '#c99a5e' });
  ar('cotte-mailles', 'Cotte de Mailles', 'armor', 12, 4, 800, { type: 'light', c: '#a6b0c9' });
  ar('plaque', 'Armure de Plates', 'armor', 20, 6, 2200, { type: 'heavy', c: '#cfd8e6', sp: { vit: 3 } });
  ar('plaque-rune', 'Cuirasse Runique', 'armor', 27, 14, 5200, { type: 'heavy', c: '#8f9bd6', sp: { vit: 5, esp: 3 } });
  ar('plaque-mithrill', 'Armure de Mithrille', 'armor', 34, 20, 9500, { type: 'heavy', c: '#d6f0ff', sp: { vit: 8, all: 4 } });
  ar('armure-chevalier', 'Armure Noire', 'armor', 30, 8, 6400, { type: 'heavy', c: '#4a4f6a', sp: { vit: 6 }, res: { dark: 2 } });
  ar('robe-lin', 'Robe de Lin', 'armor', 3, 8, 220, { type: 'robe', c: '#e6eef6', sp: { int: 2 } });
  ar('robe-soie', 'Robe de Soie', 'armor', 6, 15, 900, { type: 'robe', c: '#f0c9d6', sp: { int: 3, esp: 2 } });
  ar('robe-etoilee', 'Robe Étoilée', 'armor', 10, 26, 3600, { type: 'robe', c: '#5a6fc9', sp: { int: 6, esp: 6, pm: 25 }, imm: 'lit' });
  ar('robe-feu', 'Robe d’Ifrit', 'armor', 8, 22, 2800, { type: 'robe', c: '#ff7a4f', res: { fire: 2 }, sp: { int: 5 } });
  ar('robe-givre', 'Robe de Givre', 'armor', 8, 22, 2800, { type: 'robe', c: '#a6dcff', res: { ice: 2 }, sp: { esp: 5 } });
  ar('manteau-nuit', 'Manteau de Nuit', 'armor', 16, 24, 6800, { type: 'robe', c: '#3a3a5a', res: { dark: 2, holy: -1 }, sp: { int: 5, esp: 5 } });
  ar('tabard-lumiere', 'Tabard de Lumière', 'armor', 22, 30, 11000, { type: 'light', c: '#f6f0d0', res: { holy: 2, dark: 2 }, sp: { all: 4 } });
  ar('chapeau', 'Chapeau Pointu', 'helm', 2, 6, 200, { c: '#7a5fc9', sp: { int: 2 } });
  ar('bonnet', 'Bonnet de Laine', 'helm', 3, 4, 320, { c: '#e0d0a0', sp: { esp: 2 } });
  ar('barbut', 'Barbut', 'helm', 9, 2, 900, { c: '#cfd8e6', sp: { vit: 2 } });
  ar('heaume', 'Heaume de Fer', 'helm', 14, 4, 2400, { c: '#a6b0c9', sp: { vit: 4 } });
  ar('couronne', 'Couronne d’Étoile', 'helm', 6, 14, 3400, { c: '#ffe6a0', sp: { int: 4, esp: 4, pm: 15 } });
  ar('casque-rune', 'Casque Runique', 'helm', 19, 12, 6200, { c: '#8f9bd6', sp: { vit: 5, all: 2 } });
  ar('lunettes', 'Lunettes de Vérité', 'helm', 2, 6, 1400, { c: '#dfe6ee', imm: 'blind', sp: { agi: 2 } });
  ar('anneau-vie', 'Anneau de Vie', 'acc', 0, 0, 1200, { sp: { pv: 40 }, atype: 'ring' });
  ar('anneau-mp', 'Anneau d’Éther', 'acc', 0, 0, 1200, { sp: { pm: 20 }, atype: 'ring' });
  ar('chaussures', 'Bottes de Zéphyr', 'acc', 1, 1, 1000, { sp: { agi: 6 }, atype: 'boots', imm: 'paralyze' });
  ar('gants', 'Gants du Forgeron', 'acc', 3, 1, 900, { sp: { for: 4, vit: 2 }, atype: 'gloves' });
  ar('amulette', 'Amulette d’Ambre', 'acc', 0, 6, 1800, { imm: 'poison', atype: 'amulet', sp: { esp: 3 } });
  ar('pendentif', 'Pendentif Marin', 'acc', 0, 8, 2400, { res: { water: 2, lit: -1 }, atype: 'amulet', imm: 'silence' });
  ar('talisman', 'Talisman de Plume', 'acc', 0, 0, 2000, { flee: 1, atype: 'amulet', sp: { agi: 4 } });
  ar('ruban', 'Ruban', 'acc', 2, 2, 4000, { imm: 'all', atype: 'amulet', d2: 'Tous les états', c: '#ff9ad0' });
  ar('bouclier-fer', 'Bouclier de Fer', 'acc', 8, 2, 1400, { atype: 'shield', sp: { vit: 3 }, shield: 12 });
  ar('bouclier-mithrill', 'Bouclier de Mithrille', 'acc', 14, 8, 5200, { atype: 'shield', sp: { vit: 5, def: 0 } });
  ar('miroir-bouclier', 'Bouclier Miroir', 'acc', 10, 16, 7600, { atype: 'shield', reflect: .25, sp: { esp: 4 } });
  ar('heaume-dragon', 'Heaume du Dragon', 'helm', 22, 10, 8800, { c: '#7fd6a0', type: 'dragoon', sp: { for: 6, vit: 6 }, elemDmg: { wind: 1.4 } });
  ar('grimoire-celeste', 'Grimoire Céleste', 'acc', 0, 0, 9000, { atype: 'book', sp: { int: 10, esp: 10, pm: 40 } });
  ar('ceinture', 'Ceinture de Gigas', 'acc', 4, 0, 3400, { atype: 'belt', sp: { pv: 80, for: 3 } });
  ar('ailes', 'Ailes Fées', 'acc', 0, 4, 6200, { atype: 'wings', sp: { agi: 8, int: 4 }, regen: 4 });
  ar('coeur', 'Cœur de Pierre', 'acc', 10, 10, 4200, { atype: 'ring', imm: 'stone', sp: { vit: 6 } });

  /* ---------------- SORTS ---------------- */
  var SP = D.SP = {};
  function sp(id, n, kind, cost, pow, tgt, o) {
    o = o || {}; o.n = n; o.kind = kind; o.cost = cost; o.pow = pow; o.tgt = tgt;
    SP[id] = o; o.id = id; return o;
  }
  /* blanc */
  sp('soin', 'Soin', 'white', 2, 60, 'ally', { cure: 0 , field: 1});
  sp('soin2', 'Soin', 'white', 8, 210, 'ally', { alt: 1 , field: 1});
  sp('soin3', 'Soin', 'white', 24, 620, 'allies', { alt: 1 , field: 1});
  sp('soin4', 'Soin', 'white', 60, 1800, 'allies', { alt: 1 , field: 1});
  sp('purger', 'Purge', 'white', 3, 0, 'ally', { cure: 1 , field: 1});
  sp('vue', 'Lumière', 'white', 3, 0, 'ally', { cure: 'blind' , field: 1});
  sp('reveil', 'Réveil', 'white', 3, 0, 'ally', { cure: 'sleep' , field: 1});
  sp('voix', 'Voix', 'white', 4, 0, 'ally', { cure: 'silence' , field: 1});
  sp('tempo', 'Tempo', 'white', 6, 0, 'ally', { cure: 'stop', buff: 0 , field: 1});
  sp('protec', 'Bouclier', 'white', 4, 25, 'ally', { shield: 1 , field: 1});
  sp('armure', 'Armure', 'white', 6, 0, 'ally', { buff: { stat: 'def', v: .4, dur: 8 } , field: 1});
  sp('force', 'Force', 'white', 6, 0, 'ally', { buff: { stat: 'atk', v: .4, dur: 8 } , field: 1});
  sp('vitesse', 'Vitesse', 'white', 8, 0, 'allies', { buff: { stat: 'atb', v: 1.5, dur: 12 } , field: 1});
  sp('vi', 'Vision', 'white', 6, 0, 'allies', { buff: { stat: 'eva', v: .35, dur: 10 } , field: 1});
  sp('mur', 'Mur Sacrée', 'white', 18, 120, 'allies', { dmg: { elem: 'holy', pow: .7 } });
  sp('vie', 'Vie', 'white', 30, 0, 'ally', { revive: .6 , field: 1});
  sp('vie2', 'Vie', 'white', 78, 0, 'allies', { revive: 1, alt: 1 , field: 1});
  sp('souffle', 'Souffle', 'white', 45, 0, 'allies', { regen: 6, healp: .3 , field: 1});
  sp('aster', 'Astérisme', 'white', 66, 0, 'allies', { immunity: 6 , field: 1});
  sp('sanctuaire', 'Sanctuaire', 'white', 90, 0, 'allies', { holy: 1, dmg: { elem: 'holy', pow: 1.5 } });
  /* noir */
  sp('etincelle', 'Étincelle', 'black', 3, 46, 'foe', { elem: 'fire' });
  sp('brume', 'Brume', 'black', 3, 42, 'foe', { elem: 'water' });
  sp('eclair', 'Éclair', 'black', 4, 50, 'foe', { elem: 'lit' });
  sp('roche', 'Rocher', 'black', 4, 48, 'foe', { elem: 'earth', st: 'paralyze', p: .15 });
  sp('feu', 'Feu', 'black', 7, 130, 'foe', { elem: 'fire', alt: 1 });
  sp('glace', 'Glace', 'black', 7, 126, 'foe', { elem: 'ice', alt: 1 });
  sp('foudre', 'Foudre', 'black', 8, 138, 'foe', { elem: 'lit', alt: 1 });
  sp('feu2', 'Feu', 'black', 18, 300, 'foes', { elem: 'fire', alt: 1 });
  sp('glace2', 'Glace', 'black', 18, 290, 'foes', { elem: 'ice', alt: 1 });
  sp('foudre2', 'Foudre', 'black', 20, 320, 'foes', { elem: 'lit', alt: 1 });
  sp('feu3', 'Brasier', 'black', 46, 720, 'foes', { elem: 'fire' });
  sp('nuage', 'Nuée', 'black', 6, 0, 'foe', { st: 'poison', p: .75 });
  sp('songe', 'Songe', 'black', 6, 0, 'foe', { st: 'sleep', p: .7 });
  sp('baillon', 'Baillon', 'black', 7, 0, 'foe', { st: 'silence', p: .7 });
  sp('brume2', 'Brume Troublante', 'black', 5, 0, 'foes', { st: 'blind', p: .8 });
  sp('meduse', 'Regard de Méduse', 'black', 12, 0, 'foe', { st: 'stone', p: .45 });
  sp('mal', 'Malédiction', 'black', 14, 0, 'foe', { st: 'doom', p: .5 });
  sp('draine', 'Drain', 'black', 6, 90, 'foe', { drain: 1 });
  sp('mort', 'Death', 'black', 30, 0, 'foe', { insta: 1, p: .45 });
  sp('gravite', 'Gravité', 'black', 16, 0, 'foe', { grav: .5 });
  sp('gravite2', 'Gravité', 'black', 40, 0, 'foes', { grav: .5 });
  sp('revers', 'Revers', 'black', 24, 0, 'allies', { reflect: 10 });
  sp('chute', 'Chute', 'black', 34, 0, 'foes', { flares: 1, dmgPer: 90 });
  /* rouge */
  sp('rouge-feu', 'Feu Rouge', 'red', 8, 90, 'foe', { elem: 'fire' });
  sp('rouge-soin', 'Soin Rouge', 'red', 6, 120, 'allies', { alt: 1 });
  sp('rouge-folie', 'Folie Rouge', 'red', 12, 0, 'foes', { st: 'confuse', p: .65 });
  sp('rouge-tempete', 'Tempête Rouge', 'red', 26, 200, 'foes', { all: 1, elems: ['fire', 'ice', 'lit'] });
  sp('rouge-drac', 'Serment Rouge', 'red', 40, 0, 'allies', { buff: { stat: 'atk', v: .6, dur: 12 }, heal: .15 });
  sp('rouge-temps', 'Sabotage', 'red', 20, 0, 'foes', { atbdown: 1 });
  /* invocations */
  function sum(id, n, cost, pow, elem, o) { sp(id, n, 'summon', cost, pow, 'foes', Object.assign({ elem: elem, boss: 0, bossHit: 1 }, o || {})); }
  sum('salamandre', 'Salamandre', 12, 260, 'fire', { d: 'Un mur de flammes.' });
  sum('boree', 'Borée', 12, 250, 'wind', { d: 'Le vent tranche.', st: 'sleep', p: .3 });
  sum('taranis', 'Taranis', 16, 300, 'lit', { d: 'Foudre du ciel.' });
  sum('nix', 'Nix', 16, 290, 'ice', { d: 'Marée gelée.' });
  sum('golem', 'Golem de Roc', 18, 280, 'earth', { d: 'Le sol se fissure.', st: 'paralyze', p: .3 });
  sum('kraken', 'Kraken', 26, 420, 'water', { d: 'Les profondeurs se déchaînent.' });
  sum('phoenix', 'Phénix', 34, 380, 'fire', { d: 'Ranime et brûle.', revive: .5 });
  sum('astra', 'Astra Dorée', 55, 900, 'holy', { d: 'La lumière du cristal foudroie tout.' });

  D.SPLIST = { white: ['soin', 'soin2', 'soin3', 'soin4', 'purger', 'vue', 'reveil', 'voix', 'tempo', 'protec', 'armure', 'force', 'vitesse', 'vi', 'vie', 'vie2', 'souffle', 'mur', 'aster', 'sanctuaire'],
    black: ['etincelle', 'brume', 'eclair', 'roche', 'feu', 'glace', 'foudre', 'feu2', 'glace2', 'foudre2', 'feu3', 'nuage', 'songe', 'baillon', 'brume2', 'meduse', 'draine', 'mal', 'mort', 'gravite', 'gravite2', 'revers', 'chute'],
    red: ['rouge-feu', 'rouge-soin', 'rouge-folie', 'rouge-tempete', 'rouge-drac', 'rouge-temps'],
    summon: ['salamandre', 'boree', 'taranis', 'nix', 'golem', 'kraken', 'phoenix', 'astra'] };

  /* les blancs/noirs numérotés : index = tier (1..8) */
  D.TIER = {
    white: ['soin', 'soin2', 'soin3', 'soin4', 'protec', 'armure', 'vie', 'sanctuaire'],
    black: ['etincelle', 'feu', 'feu2', 'feu3', 'nuage', 'meduse', 'mort', 'chute'],
    red: D.SPLIST.red.slice(),
    summon: ['salamandre', 'boree', 'taranis', 'nix', 'golem', 'kraken', 'phoenix', 'astra']
  };

  ar('bouclier-miroir', 'Bouclier Miroir', 'acc', 10, 16, 7600, { atype: 'shield', reflect: .3, sp: { esp: 6 } });
  ar('heaube-givre', 'Heaume de Nivalis', 'helm', 16, 16, 5600, { c: '#cfe6ff', sp: { vit: 4, esp: 4 } });
  wp('ep-eclair', 'Lame Foudroyante', 'sword', 35, 5200, { c: '#ffe85c', elem: 'lit' });
  wp('robe-arc', 'Robe d’Arc', 'staff', 20, 3000, { c: '#b0d0ff', sp: { int: 6, esp: 6, pm: 20 } });

  /* ---------------- BOUTIQUES ---------------- */
  D.SHOPS = {
    aurelia: { nom: 'Bazaar d’Aurélia',
      arms: ['ep-baie','d-poinçon','lance-cip','baton-cedre','arc-ifs','poing-fer','cotte-cuir','chapeau','bonnet','bouclier-fer','luth-echo'],
      obj: ['potion','antidote','eye','bell','tent','bomb','echo'] },
    pyrite: { nom: 'Comptoir de Pyrite',
      arms: ['ep-fer','g-erado','d-miso','lance-argent','baton-saule','baton-fer','arc-yumi','poing-tigre','canne-feu','cotte-mailles','plaque','barbut','hache-bronce'],
      obj: ['potion','hipotion','remedy','alarm','phoenix','fbomb','salve','gants','amulette','robe-lin','anneau-vie'] },
    azur: { nom: 'Marché des Marées',
      arms: ['ep-acier','d-poison','canne-eau','baton-nuage','lance-dragon','arc-percee','plaque-rune','casque-rune','robe-soie','robe-feu','robe-givre','poing-kaiser','hache-guerre','lyre-aria','bouclier-mithrill'],
      obj: ['hipotion','remedy','mirror','cabin','speed','tbomb','mote','chaussures','pendentif','talisman','ceinture','anneau-mp','robe-lin'] },
    givre: { nom: 'Entrepôt de Nivalis',
      arms: ['ep-givre','ep-brasier','g-frost','d-orchis','canne-ice','baton-mage','armure-chevalier','couronne','lunettes','manteau-nuit','arc-artemis','heaube-givre','bouclier-miroir'],
      obj: ['hipotion','x potion','corpse','gold','ruban','coeur','ailes','grimoire-celeste'] },
    cendre: { nom: 'Forges de Valcendre',
      arms: ['ep-eclair','g-carmine','lance-dragon','canne-for','baton-asura','plaque-mithrill','tabard-lumiere','lance-gungnir'],
      obj: ['x potion','elixir','corpse','gold','miroir-bouclier','grimoire-celeste','ailes'] },
    final: { nom: 'Colporteur de l’Aube',
      arms: ['ep-cristal','ex-calamite','g-obsidienne','d-murakumo','poing-ouranos','baton-asura','tabard-lumiere'],
      obj: ['elixir','gold','salve','cabin','x potion'] }
  };

  D.INN = { aurelia: 80, pyrite: 220, azur: 480, givre: 800, cendre: 1400 };

  /* courbe d'expérience */
  D.expFor = function (lv) { return Math.round(46 * Math.pow(lv, 2.08) + 18 * lv); };
  D.EXP_SHARE = .55;

  /* tables de croissance de rareté pour le butin */
  D.gilDrop = function (lv, r) { return Math.round((12 + lv * 9) * (r || 1)); };
})(this.FF = this.FF || {});
