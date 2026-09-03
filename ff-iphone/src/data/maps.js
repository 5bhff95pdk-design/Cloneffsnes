/* ============================================================
   D.MAPS — carte du monde, villes, intérieurs, donjons
   Les tuiles sont des caractères vus par le thème (voir bake.js).
   Entités : npc, chest, door, save, shop, inn, sign, scene, ship, board
   ============================================================ */
(function (FF) {
  'use strict';
  var D = FF.D;
  var MAPS = D.MAPS = {};

  function map(id, o) {
    o.id = id;
    /* normalise la largeur des lignes */
    var w = 0;
    o.rows.forEach(function (r) { w = Math.max(w, r.length); });
    o.w = w; o.h = o.rows.length;
    var pad = o.void != null ? o.void : '#';
    o.rows = o.rows.map(function (r) { while (r.length < w) r += pad; return r; });
    o.ents = o.ents || [];
    MAPS[id] = o;
    return o;
  }

  /* ============================================================
     CARTE DU MONDE (56 x 36)
     ============================================================ */
  map('world', {
    n: 'Le Monde', theme: 'field', bg: 'field', music: 'world', world: 1, void: '~',
    rows: [
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~MMMMpMMMM~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~MMMVpVMMM~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~MMMMMMMMM~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~#M###MM.#MM##MM#M##M##M#.###MM#MMMMM#M#####.#####M##~~',
      '~~M#MM###.#M##M#MM#####MM#.MMMM#####M######MM.########~~',
      '~~#######.################.##################.########~~',
      '~~..T.T...T..TT..P....DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD.~~',
      '~~..TTTT,TTT...Tp.T...DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD.~~',
      '~~..P..PTT..T,T...TT..DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD.~~',
      '~~......T...T,.T..P...DDDDDDDDDDDDDDDDDDDDDDDDpDDDDDD.~~',
      '~~..TPT.....T.T.pTT...DDDDDDDDDDDDDDDDDDpppppppDDDDDD.~~',
      '~~.T.TpppppppppppTTT..DDDDDDDDDDDDDDDDDDpDDDDDDDDDDDD.~~',
      '~~.PT.pTpTT.P.PT.,.T..DDDDDDDDDDDDDDDDDDpDDDDDDDDDDDD.~~',
      '~~..T.p.pTTTT,...TT...DDDDDDDDDDDDDDDDDDpDDDDDDDDDDDD.~~',
      '~~...Tp.p.TPT.TT,.PTp.DDDDDDDDDDDDDDDDDpDDDDDDDDDDDD.~~',
      '~~####p#############p############p##############p#####~~',
      '~~####p#############p############p##############p#####~~',
      '~~....p...........................p...................~~',
      '~~....p..T...TT...........WWWWWWWWpWWWWWWWWWWWWWWWWWW.~~',
      '~~..T.p..T................WWWWWWWWpWWWWWWWWWWWWWWWWWW.~~',
      '~~....p...................WWWWWWWWpWWWWWWWWWpWWWWWWWW.~~',
      '~~....ppppp....T...T......WWWWWWWWpWWWWWWWWWpWWWWWWWW.~~',
      '~~......T.p...............WWWWWWWWpWWWWWWWWWpWWWWWWWW.~~',
      '~~.......TpT..T...........WWWWWWWWpppppppppppWWWWWWWW.~~',
      '~~..T...T.ppppppp.........WWWWWWWWWWWWWWWWWWWWWWWWWWW.~~',
      '~~........................WWWWWWWWWWWWWWWWWWWWWWWWWWW.~~',
      '~~.SSSSSSSSSSSSSSSSSSSSS..WWWWWWWWWWWWWWWWWWWWWWWWWWW.~~',
      '~~.SSSSSSSSSSSSSSSSSSSSS..WWWWWWWWWWWWWWWWWWWWWWWWWWW.~~',
      '~~.~~~~~~~~~~~~~~~~~~~~~..~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~SSSSS~~~~~~~~~~~~~~~~~~~~~~~~~~VVVVVVVVVVVVVVV~~~~~',
      '~~~~~SSpSS~~~~~~~~~~~~~~~~~~~~~~~~~~VVVVLLpLLLLVpVV~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~VVVVLLpLLLLVpVV~~~~~',
      '~~~~~~~E~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~VVVVVVVVVVVV~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    ],
    ents: [
      /* entrées de villes (marcher dessus = entrer) */
      { t: 'door', x: 8, y: 12, to: 'aurelia', tx: 9, ty: 19, lab: 'Aurélia' },
      { t: 'door', x: 40, y: 11, to: 'pyrite', tx: 15, ty: 13, lab: 'Pyrite' },
      { t: 'door', x: 10, y: 25, to: 'azur', tx: 13, ty: 1, lab: 'Port-Azur' },
      { t: 'door', x: 44, y: 24, to: 'givre', tx: 15, ty: 10, lab: 'Nivalis' },
      { t: 'door', x: 42, y: 32, to: 'cendre', tx: 13, ty: 9, lab: 'Valcendre' },
      /* donjons */
      { t: 'door', x: 16, y: 8, to: 'sanctuaire_1', tx: 'in', lab: 'Sanctuaire de la Sève' },
      { t: 'door', x: 46, y: 9, to: 'mines_1', tx: 'in', lab: 'Mines de Pyrite' },
      { t: 'door', x: 7, y: 32, to: 'epave_1', tx: 'in', lab: 'Épave du Léviathan' },
      { t: 'door', x: 34, y: 20, to: 'glacier_1', tx: 'in', lab: 'Flanc de Givre' },
      { t: 'door', x: 28, y: 22, to: 'boree_1', tx: 'in', lab: 'Pic de Borée', need: 'flag:gelignard' },
      { t: 'door', x: 48, y: 33, to: 'forges_1', tx: 'in', lab: 'Forges de Valcendre', need: 'flag:nereide' },
      { t: 'door', x: 20, y: 14, to: 'caverne_1', tx: 'in', lab: 'Caverne Oubliée' },
      { t: 'door', x: 6, y: 19, to: 'reve_1', tx: 'in', lab: 'Gouffre des Rêves', need: 'flag:archonte' },
      { t: 'door', x: 27, y: 1, to: 'tour_1', tx: 'in', lab: 'Tour Obsidienne', need: 'sceau', ship: 1 },
      { t: 'save', x: 17, y: 11 },
      { t: 'save', x: 33, y: 24 },
      { t: 'sign', x: 9, y: 13, t2: 'AURÉLIA — cité des vergers.' },
      { t: 'sign', x: 15, y: 9, t2: 'SANCTUAIRE DE LA SÈVE. Prier avant d’entrer.' },
      { t: 'sign', x: 41, y: 12, t2: 'PYRITE. On paie l’air, on paie la lumière.' },
      { t: 'sign', x: 11, y: 26, t2: 'PORT-AZUR. Le poisson est frais, les prix aussi.' },
      { t: 'sign', x: 43, y: 25, t2: 'NIVALIS. Ne pas nourrir les morts.' },
      { t: 'npc', x: 20, y: 17, look: 'ermite', dir: 'down', say: '@final_vieux' },
      { t: 'npc', x: 26, y: 6, look: 'soldat', dir: 'down', say: '@aurelia_garde', c: 'ch>=2' }
    ],
    enc: {
      rate: 0.10,
      zones: [
        { x0: 0, y0: 0, x1: 55, y1: 3, list: ['poissonlame', 'pieuvre', 'etoilev', 'goeland'] },
        { x0: 2, y0: 7, x1: 21, y1: 15, list: ['ratmusq', 'limule', 'chatsouris', 'crabe Sources', 'lombric', 'amanite', 'grenard', 'scarabee'] },
        { x0: 22, y0: 7, x1: 53, y1: 15, list: ['crabeGal', 'impveine', 'taupe', 'squele', 'mandra', 'araignee'] },
        { x0: 2, y0: 18, x1: 24, y1: 29, list: ['poissonlame', 'goeland', 'serpentvague', 'crane', 'naute'] },
        { x0: 25, y0: 18, x1: 53, y1: 29, list: ['loupgivre', 'corbeau', 'verglace', 'salamG', 'yeti', 'oeilBlizzard'] },
        { x0: 34, y0: 30, x1: 55, y1: 35, list: ['diable', 'verLave', 'aigleB', 'golemL'] },
        { x0: 0, y0: 30, x1: 33, y1: 35, list: ['pieuvre', 'requin', 'tortueR', 'poissonlame'] }
      ],
      sea: ['poissonlame', 'pieuvre', 'serpentvague', 'etoilev'],
      snow: ['loupgivre', 'corbeau', 'verglace', 'blizzardE'],
      desert: ['crabeGal', 'impveine', 'taupe', 'lombric']
    }
  });

  /* ============================================================
     AURÉLIA
     ============================================================ */
  map('aurelia', {
    n: 'Aurélia', theme: 'town', bg: 'town', music: 'town',
    rows: [
      '..TTTT..MMMMMMMMMM..TTTT..',
      '.T...rRRRhhhhhRRRr...T...',
      '..TT.rRRRhhhhhRRRr..T....',
      '.....dddd.....dd.........',
      '..p.....ppppppp....TT....',
      '.ppp.p.pcccccpcp...T..T..',
      '..p..p.pcccccp.p.........',
      '..ppppppppppppppppppp....',
      '.rRRRr...p....p...rRRRr..',
      'hRRRhp...p....p...dhRRRh.',
      'dddd.....pppppp.....dddd.',
      '.....T...p....p...T......',
      '..T......p....p.....TT...',
      '.........ppppppp.........',
      '.rRRRr...p....p....rRRRr.',
      'hRRRhd...p....p....dhRRRh',
      '.dd......pppppp.....dd...',
      '.....T.........T.....T...',
      '..TT....TTTT......TT.....',
      '.........p.................',
      '.........p.................'],
    void: '.',
    ents: [
      { t: 'door', x: 9, y: 20, to: 'world', tx: 8, ty: 13 },
      { t: 'door', x: 1, y: 10, to: 'inn-aurelia', tx: 6, ty: 6 },
      { t: 'door', x: 26, y: 10, to: 'shop-aurelia', tx: 8, ty: 6 },
      { t: 'door', x: 9, y: 7, to: 'shop-aurelia-arms', tx: 8, ty: 6 },
      { t: 'door', x: 16, y: 6, to: 'throne-aurelia', tx: 10, ty: 10 },
      { t: 'save', x: 11, y: 5 },
      { t: 'save', x: 14, y: 5 },
      { t: 'npc', x: 5, y: 8, look: 'gosse', dir: 'down', say: '@aurelia_rue', roam: 1 },
      { t: 'npc', x: 21, y: 12, look: 'vieux', dir: 'left', say: '@aurelia_vieux' },
      { t: 'npc', x: 12, y: 13, look: 'mere', dir: 'down', say: '@aurelia_rue' },
      { t: 'npc', x: 19, y: 15, look: 'gosse', dir: 'up', say: '@aurelia_sica_avant', c: 'ch=1' },
      { t: 'npc', x: 4, y: 15, look: 'garde', dir: 'down', say: '@aurelia_garde' },
      { t: 'npc', x: 24, y: 15, look: 'garde', dir: 'left', say: '@aurelia_garde' },
      { t: 'npc', x: 14, y: 16, look: 'marchand', dir: 'up', say: '@aurelia_marchand' },
      { t: 'npc', x: 8, y: 3, look: 'pretre', dir: 'down', say: '@aurelia_pretre' },
      { t: 'npc', x: 16, y: 19, look: 'roi', dir: 'down', say: '@roi_prie', c: 'ch>=2' },
      { t: 'sign', x: 11, y: 8, t2: 'Place du Verger. Les cris de guerre y sont interdits.' },
      { t: 'sign', x: 7, y: 6, t2: 'Auberge du Pommier Tordu — 80 G la nuit.' },
      { t: 'sign', x: 25, y: 12, t2: 'Bazaar — on ne rend pas, on n’oublie pas.' },
      { t: 'chest', x: 2, y: 17, loot: { it: 'potion', n: 2 } },
      { t: 'chest', x: 26, y: 3, loot: { g: 120 } },
      { t: 'scene', x: 15, y: 17, w: 2, h: 1, scene: 'trahison', once: 1, c: 'flag:sanctuaire' },
      { t: 'npc', x: 17, y: 18, look: 'soldat', dir: 'down', hide: 'noflag:trahi', say: '@aurelia_garde' }
    ]
  });

  /* ============================================================
     PYRITE (cité minière)
     ============================================================ */
  map('pyrite', {
    n: 'Pyrite', theme: 'town', bg: 'town', music: 'town',
    rows: [
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMM',
      'M.....DDDDDDDDDDDDDDDD....MM',
      'M..rRRRhDDDDDDDDDDhRRRr...MM',
      'M..dhRRRDDDppDDDhRRRhd....MM',
      'M.....DDDp.ppp.pDDD.......MM',
      'M..DDDDp.pcccp.pDDDD......MM',
      'M..DDDDp.cccc.p.DDDD......MM',
      'M...DD.pppppppppp.DD......MM',
      'M..rRRrDD.p...p.DD.rRRr...MM',
      'M..hd.DDD.p.p.p.DDDh.dh...MM',
      'M..DDDDDDDpDpDpDDDDDDDD...MM',
      'M......DDDDpppDDDD........MM',
      'M..TT...DDDDDDDDD...TT....MM',
      'M..TT....DDDDDDD.....TT...MM',
      'MMMMMMMMMMMMMMMMMMMMMMMMMMMM'
    ],
    void: 'D',
    ents: [
      { t: 'door', x: 15, y: 14, to: 'world', tx: 40, ty: 12 },
      { t: 'door', x: 3, y: 3, to: 'inn-pyrite', tx: 6, ty: 6 },
      { t: 'door', x: 25, y: 3, to: 'shop-pyrite', tx: 8, ty: 6 },
      { t: 'door', x: 12, y: 5, to: 'shop-pyrite-arms', tx: 8, ty: 6 },
      { t: 'save', x: 14, y: 5 },
      { t: 'npc', x: 8, y: 7, look: 'mineur', dir: 'down', say: '@pyrite_entree', roam: 1 },
      { t: 'npc', x: 20, y: 10, look: 'gosse', dir: 'left', say: '@pyrite_enfant_perdu' },
      { t: 'npc', x: 6, y: 11, look: 'garde', dir: 'down', say: '@pyrite_capitaine', c: 'noflag:gargouille' },
      { t: 'npc', x: 22, y: 12, look: 'mineur', dir: 'up', say: '@quete_mineur', c: 'flag:lanterne' },
      { t: 'chest', x: 27, y: 12, loot: { g: 300 } },
      { t: 'chest', x: 2, y: 12, loot: { it: 'hipotion', n: 2 } },
      { t: 'sign', x: 11, y: 8, t2: 'Galerie nord — interdite sans lampe.' }
    ]
  });

  /* ============================================================
     PORT-AZUR
     ============================================================ */
  map('azur', {
    n: 'Port-Azur', theme: 'town', bg: 'town', music: 'town',
    rows: [
      '..TTTT......TTTTTT......TT..',
      '.rRRRr......pppp......rRRRr.',
      'hRRRhd..pppppppppppp..dhRRRh',
      '.dd...pp.........pp...dd....',
      '...TTp...cccccc...pTT.......',
      '..TTTp...cccccc...p.........',
      '....pppppppppppppppp....TTT.',
      '.rRRr..............p...TTT.',
      'hRRh..ppppppppppp..p....dd..',
      '.dd...p.......p....p........',
      '.....pp.......p....pppp.....',
      '.SSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'SS~~~~~~~~~~~~~~~~~~~~~~~~SS',
      'S~~~~~~~~~~~~~~~~~~~~~~~~~~S',
      '~~~~~~~~~~~~~~~~~~~~~~~~~~~~'
    ],
    void: '.',
    ents: [
      { t: 'door', x: 25, y: 6, to: 'inn-azur', tx: 6, ty: 6 },
      { t: 'door', x: 2, y: 3, to: 'shop-azur', tx: 8, ty: 6 },
      { t: 'door', x: 8, y: 9, to: 'shop-azur-arms', tx: 8, ty: 6 },
      { t: 'door', x: 13, y: 0, to: 'world', tx: 10, ty: 26 },
      { t: 'save', x: 12, y: 5 },
      { t: 'npc', x: 6, y: 8, look: 'marin', dir: 'down', say: '@azur_marin' },
      { t: 'npc', x: 20, y: 11, look: 'pecheur', dir: 'up', say: '@azur_pecheur' },
      { t: 'npc', x: 14, y: 2, look: 'marchand', dir: 'down', say: '@aurelia_marchand' },
      { t: 'chest', x: 2, y: 13, loot: { it: 'x potion', n: 1 } },
      { t: 'chest', x: 26, y: 12, loot: { it: 'pendentif', n: 1 }, c: 'flag:nereide' },
      { t: 'sign', x: 15, y: 10, t2: 'Débarcadère. L’eau monte la nuit.' }
    ]
  });

  /* ============================================================
     NIVALIS
     ============================================================ */
  map('givre', {
    n: 'Nivalis', theme: 'ice', bg: 'ice', music: 'town',
    rows: [
      'PPPPPPPPPPPPPPPPPPPPPPPPPPPP',
      'P...WWWWWWWWWWWWWWWWWWWWW..PP',
      'P..rRRRrWWWWppppWWWWrRRRr.PP',
      'P..hRRRdWWWppppppWWWdhRRRhPP',
      'P....dd...WcccccW...dd....PP',
      'P.........WccccW..........PP',
      'P...PPP...ppppppp...PPP...PP',
      'P..rRRr..W.p...p.W..rRRr..PP',
      'P..hRRd..W.p.p.p.W..dhRRr.PP',
      'P........WWpppWWWW.....dd.PP',
      'P..TT.....WWWWW.........TPPP',
      'PP.........................P',
      'PPPPPPPPPPPPPPPPPPPPPPPPPPPP'
    ],
    void: 'W',
    ents: [
      { t: 'door', x: 15, y: 11, to: 'world', tx: 44, ty: 25 },
      { t: 'door', x: 3, y: 3, to: 'inn-givre', tx: 6, ty: 6 },
      { t: 'door', x: 25, y: 3, to: 'shop-givre', tx: 8, ty: 6 },
      { t: 'save', x: 11, y: 5 },
      { t: 'npc', x: 9, y: 6, look: 'vielle', dir: 'down', say: '@givre_femme' },
      { t: 'npc', x: 20, y: 8, look: 'lys', dir: 'down', say: '@givre_lyre', c: 'in:lys' },
      { t: 'npc', x: 20, y: 8, look: 'gosse', dir: 'down', say: '@givre_lyre', c: 'noflag:lyre' },
      { t: 'chest', x: 27, y: 9, loot: { it: 'ailes', n: 1 } },
      { t: 'chest', x: 2, y: 10, loot: { g: 800 } },
      { t: 'door', x: 6, y: 7, to: 'chateau-givre', tx: 6, ty: 8, c: 'flag:gelignard' },
      { t: 'sign', x: 12, y: 7, t2: 'Col de Borée — l’ascension est déconseillée.' }
    ]
  });

  /* ============================================================
     VALCENDRE
     ============================================================ */
  map('cendre', {
    n: 'Valcendre', theme: 'lava', bg: 'lava', music: 'town',
    rows: [
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVV',
      'V..LLL....LLLL....LLL....VVV',
      'V..rrr....LLLL....rrr....VVV',
      'V..dd..pppppppppp..dd....VVV',
      'V.....pp.......pp........VVV',
      'V.....p..ccccc..p..~~~~..VVV',
      'V.....pp.pccccp.pp.~~~~..VVV',
      'V..LLLpp.p...pp..LLL.....VVV',
      'V..LLL...p.p.p.....LLL...VVV',
      'V........ppppp.......LLL.VVV',
      'V..TT....LLLLL........TT.VVV',
      'VVVVVVVVVVVVVVVVVVVVVVVVVVVV'
    ],
    void: 'V',
    ents: [
      { t: 'door', x: 13, y: 11, to: 'world', tx: 42, ty: 33 },
      { t: 'door', x: 3, y: 2, to: 'inn-cendre', tx: 6, ty: 6 },
      { t: 'door', x: 21, y: 2, to: 'shop-cendre', tx: 8, ty: 6 },
      { t: 'save', x: 11, y: 5 },
      { t: 'npc', x: 8, y: 8, look: 'forgeron', dir: 'down', say: '@cendre_forgeron' },
      { t: 'npc', x: 18, y: 6, look: 'soldat', dir: 'left', say: '@final_vieux' },
      { t: 'chest', x: 27, y: 10, loot: { it: 'ex-calamite', n: 1 } },
      { t: 'scene', x: 13, y: 5, w: 1, h: 1, scene: 'cendrix', once: 1, c: 'flag:boree' }
    ]
  });

  /* ============================================================
     PETITES CARTES AUTHORIZÉES (grotte du sanctuaire, château)
     ============================================================ */
  map('chateau-givre', {
    n: 'Salle du Bal', theme: 'tower', bg: 'tower', music: 'dungeon',
    rows: [
      '##############',
      '#............#',
      '#.c........c.#',
      '#............#',
      '#..||....||..#',
      '#..||....||..#',
      '#............#',
      '#.....cc.....#',
      '#............#',
      '######e#######'
    ],
    void: '#',
    ents: [
      { t: 'door', x: 6, y: 9, to: 'givre', tx: 6, ty: 8 },
      { t: 'scene', x: 6, y: 7, w: 1, h: 1, scene: 'kael_final', once: 1, c: 'noflag:kaelBack' },
      { t: 'chest', x: 2, y: 2, loot: { it: 'ruban', n: 1 } },
      { t: 'chest', x: 11, y: 2, loot: { it: 'x potion', n: 3 } }
    ]
  });
  map('sanctuaire-crypto', {
    n: 'Crypto du Sanctuaire', theme: 'cave', bg: 'cave', music: 'save',
    rows: [
      '##############',
      '#............#',
      '#..c.c..c.c..#',
      '#............#',
      '#.....CC.....#',
      '#............#',
      '######e######.'
    ],
    void: '#',
    ents: [
      { t: 'save', x: 6, y: 4 },
      { t: 'door', x: 6, y: 6, to: 'aurelia', tx: 16, ty: 7 },
      { t: 'sign', x: 4, y: 4, t2: 'Le Cristal du Savoir. Ici, on change de destin.' },
      { t: 'chest', x: 2, y: 2, loot: { it: 'salve', n: 3 } }
    ]
  });

  /* ============================================================
     Intérieurs générés (auberges, boutiques, temples)
     ============================================================ */
  var INNBACK = { aurelia: { x: 1, y: 11 }, pyrite: { x: 3, y: 4 }, azur: { x: 25, y: 5 }, givre: { x: 3, y: 4 }, cendre: { x: 3, y: 3 } };
  var SHOPBACK = { aurelia: { x: 26, y: 11 }, pyrite: { x: 25, y: 4 }, azur: { x: 2, y: 4 }, givre: { x: 25, y: 4 }, cendre: { x: 21, y: 3 } };
  var ARMSBACK = { aurelia: { x: 9, y: 8 }, pyrite: { x: 12, y: 7 }, azur: { x: 8, y: 10 }, givre: { x: 12, y: 6 }, cendre: { x: 13, y: 6 } };

  function interior(id, o) {
    var w = o.w || 13, h = o.h || 8, rows = [], y, x;
    for (y = 0; y < h; y++) {
      var line = '';
      for (x = 0; x < w; x++) {
        var ch = '.';
        if (y === 0 || y === h - 1 || x === 0 || x === w - 1) ch = '#';
        else if (o.kind === 'inn' && y === 1) ch = (x % 3 === 1 ? 'b' : '#');
        else if (o.kind === 'shop' && y === 1) ch = (x % 4 === 2 ? 'h' : '#');
        else if (o.kind === 'shop' && y === 2) ch = 'k';
        else if (o.kind === 'house' && y === 1) ch = (x % 3 === 0 ? 'h' : '#');
        if (o.kind === 'temple' && y === 2 && Math.abs(x - (w >> 1)) < 2) ch = 'c';
        if (o.kind === 'throne' && y === 1 && Math.abs(x - (w >> 1)) < 3) ch = '#';
        line += ch;
      }
      rows.push(line);
    }
    var mid = w >> 1;
    rows[h - 1] = rows[h - 1].substring(0, mid) + 'd' + rows[h - 1].substring(mid + 1);
    var ents = [{ t: 'door', x: mid, y: h - 1, to: o.back.map || o.town, tx: o.back.x, ty: o.back.y }];
    if (o.kind === 'inn') {
      ents.push({ t: 'npc', x: 2, y: 3, look: 'aubergiste', dir: 'down', inn: D.INN[o.town] || 80, say: '@auberge_lits' });
      for (var i = 1; i < w - 2; i += 3) ents.push({ t: 'bed', x: i, y: 1 });
    }
    if (o.kind === 'shop') {
      ents.push({ t: 'shop', x: mid - 1, y: 3, side: 'up', shop: o.town, kind: o.shopKind, who: 'marchand' });
      ents.push({ t: 'npc', x: w - 3, y: h - 3, look: 'marchand', dir: 'up', say: '@aurelia_marchand' });
    }
    if (o.kind === 'temple') {
      ents.push({ t: 'save', x: mid, y: 3 });
      ents.push({ t: 'npc', x: mid - 3, y: 4, look: 'pretre', dir: 'down', say: '@aurelia_pretre' });
    }
    if (o.npcs) o.npcs.forEach(function (n) { ents.push(n); });
    map(id, { n: o.n, theme: o.theme || 'indo', bg: 'town', music: o.music || 'town', rows: rows, ents: ents, void: '#' });
    return MAPS[id];
  }
  ['aurelia', 'pyrite', 'azur', 'givre', 'cendre'].forEach(function (town) {
    if (!D.SHOPS[town]) return;
    interior('inn-' + town, { n: 'Auberge', kind: 'inn', town: town, back: INNBACK[town] });
    interior('shop-' + town, { n: 'Boutique d’objets', kind: 'shop', town: town, shopKind: 'obj', back: SHOPBACK[town] });
    interior('shop-' + town + '-arms', { n: 'Armes & Armures', kind: 'shop', town: town, shopKind: 'arms', back: ARMSBACK[town] });
  });
  interior('temple-aurelia', { n: 'Temple d’Aurélia', kind: 'temple', theme: 'indo', town: 'aurelia', back: { map: 'aurelia', x: 8, y: 4 }, w: 13, h: 9, music: 'save' });
  interior('throne-aurelia', {
    n: 'Grande Salle', kind: 'shop', theme: 'indo', w: 21, h: 12, music: 'save', back: { map: 'aurelia', x: 16, y: 7 },
    npcs: [{ t: 'npc', x: 10, y: 2, look: 'roi', dir: 'down', say: '@roi_audience' },
    { t: 'npc', x: 5, y: 5, look: 'garde', dir: 'right', say: '@aurelia_garde' },
    { t: 'npc', x: 15, y: 5, look: 'garde', dir: 'left', say: '@aurelia_garde' },
        { t: 'save', x: 10, y: 8 }]
  });

  /* ============================================================
     DONJONS (générés, amorces déterministes)
     ============================================================ */
  D.DUNGEONS = {
    sanctuaire: {
      n: 'Sanctuaire de la Sève', theme: 'cave', bg: 'cave', music: 'dungeon',
      floors: 2, size: [28, 20], seed: 1207, save: [1], boss: { floor: 2, foes: ['croc-boue'], name: 'Croc-Boue' },
      lv: [1, 4], list: ['limule', 'ratmusq', 'chatsouris', 'lombric', 'amanite', 'crabe Sources'],
      back: { map: 'world', x: 16, y: 9 },
      chests: [{ it: 'potion', n: 3 }, { g: 120 }, { it: 'd-poinçon' }, { it: 'hipotion' }, { it: 'cotte-cuir' }, { it: 'ep-baie' }],
      sceneOnWin: 'sanctuaire1', npc: { look: 'pretre', say: '@sanctuaire_pretre' },
      torches: 1
    },
    mines: {
      n: 'Mines de Pyrite', theme: 'mine', bg: 'mine', music: 'dungeon',
      floors: 3, size: [32, 24], seed: 7331, save: [1, 3], boss: { floor: 2, foes: ['gargouille'], name: 'Gargouille de Pyrite', scene: 'gargouille' },
      boss2: { floor: 3, foes: ['vaux', 'impveine'], name: 'Chancelier Vaux', scene: 'vaux' },
      lv: [6, 12], list: ['araignee', 'squele', 'impveine', 'crabeGal', 'mandra', 'grogne', 'taupe'],
      back: { map: 'world', x: 46, y: 10 },
      chests: [{ it: 'hipotion', n: 3 }, { g: 450 }, { it: 'gants' }, { it: 'baton-fer' }, { it: 'plaque' }, { it: 'lanterne', key: 1 }, { it: 'x potion' }, { it: 'amulette' }, { it: 'hache-bronce' }],
      npc: { look: 'mineur', say: '@quete_mineur' }
    },
    epave: {
      n: 'Épave du Léviathan', theme: 'ship', bg: 'sea', music: 'dungeon',
      floors: 3, size: [30, 20], seed: 4711, save: [1, 3], boss: { floor: 2, foes: ['nereide', 'crane'], name: 'Néréide l’Avare', scene: 'epave' },
      lv: [13, 19], list: ['poissonlame', 'pieuvre', 'crane', 'serpentvague', 'goeland', 'etoilev', 'naute'],
      back: { map: 'world', x: 7, y: 31 },
      chests: [{ it: 'hipotion', n: 3 }, { g: 900 }, { it: 'canne-eau' }, { it: 'arc-percee' }, { it: 'robe-soie' }, { it: 'lance-dragon' }, { g: 1500 }, { it: 'x potion' }],
      key: 'clé d’azur'
    },
    glacier: {
      n: 'Flanc de Givre', theme: 'ice', bg: 'ice', music: 'dungeon',
      floors: 3, size: [32, 22], seed: 9091, save: [1, 3], boss: { floor: 3, foes: ['gelignard'], name: 'Comte Gelignard', scene: 'gelignard' },
      lv: [20, 27], list: ['loupgivre', 'blizzardE', 'corbeau', 'salamG', 'yeti', 'oeilBlizzard', 'verglace'],
      back: { map: 'world', x: 34, y: 21 },
      chests: [{ it: 'x potion', n: 2 }, { g: 1800 }, { it: 'ep-givre' }, { it: 'g-frost' }, { it: 'couronne' }, { it: 'manteau-nuit' }, { it: 'heaube-givre' }, { it: 'cloche', key: 1 }, { it: 'lance-dragon' }]
    },
    boree: {
      n: 'Pic de Borée', theme: 'ice', bg: 'sky', music: 'dungeon',
      floors: 1, size: [24, 18], seed: 313, save: [1], open: true, boss: { floor: 1, foes: ['borhee'], name: 'Borée enchaînée', scene: 'boree' },
      lv: [26, 30], list: ['corbeau', 'blizzardE', 'chevalierG', 'liche', 'yeti'],
      back: { map: 'world', x: 28, y: 23 },
      chests: [{ it: 'x potion', n: 3 }, { it: 'arc-artemis' }, { g: 2600 }]
    },
    forges: {
      n: 'Forges de Valcendre', theme: 'lava', bg: 'lava', music: 'dungeon',
      floors: 2, size: [32, 22], seed: 6601, save: [1, 2], boss: { floor: 2, foes: ['cendrix'], name: 'Cendrix le Forgeron', scene: 'cendrix' },
      lv: [29, 36], list: ['diable', 'golemL', 'verLave', 'aigleB', 'cuirasse', 'nymphes'],
      back: { map: 'world', x: 48, y: 32 },
      chests: [{ it: 'elixir', n: 1 }, { g: 4000 }, { it: 'g-carmine' }, { it: 'plaque-mithrill' }, { it: 'canne-for' }, { it: 'tabard-lumiere' }, { it: 'poing-kaiser' }]
    },
    tour: {
      n: 'Tour Obsidienne', theme: 'tower', bg: 'tower', music: 'dungeon',
      floors: 4, size: [30, 22], seed: 1313, save: [1, 3], boss: { floor: 3, foes: ['archonte'], name: 'Archonte Obsidien', scene: 'archonte' },
      boss2: { floor: 4, foes: ['nyxare'], name: 'Nyxaré', scene: 'final' },
      lv: [38, 48], list: ['dechu', 'archive', 'homonce', 'fleau', 'gardien', 'neant', 'assassin', 'archimage'],
      back: { map: 'world', x: 27, y: 2 },
      chests: [{ it: 'elixir', n: 2 }, { g: 9000 }, { it: 'ex-calamite' }, { it: 'g-obsidienne' }, { it: 'baton-asura' }, { it: 'lance-gungnir' }, { it: 'robe-arc' }, { it: 'd-murakumo' }, { it: 'poing-ouranos' }, { it: 'grimoire-celeste' }],
      key: 'sceau'
    },
    caverne: {
      n: 'Caverne Oubliée', theme: 'cave', bg: 'cave', music: 'dungeon',
      floors: 4, size: [30, 22], seed: 8181, save: [2, 4], boss: { floor: 4, foes: ['momor'], name: 'Momon Étoilé', scene: 'secret' },
      lv: [24, 45], list: ['momon', 'chienG', 'ombre', 'liche', 'chevalierG', 'homonce', 'golemL', 'archimage'],
      back: { map: 'world', x: 20, y: 15 },
      chests: [{ it: 'elixir', n: 3 }, { g: 12000 }, { it: 'ruban' }, { it: 'ailes' }, { it: 'coeur' }, { it: 'miroir-bouclier' }, { g: 9999 }, { it: 'x potion', n: 5 }]
    },
    reve: {
      n: 'Gouffre des Rêves', theme: 'cave', bg: 'dream', music: 'dungeon',
      floors: 1, size: [22, 16], seed: 909, open: true, save: [1], boss: { floor: 1, foes: ['dreamer'], name: 'Rêve d’Arno', scene: 'dream' },
      lv: [34, 44], list: ['ombre', 'chienG', 'archive', 'licheM', 'fleau'],
      back: { map: 'world', x: 6, y: 20 },
      chests: [{ it: 'grimoire-celeste' }, { g: 5000 }, { it: 'x potion', n: 4 }]
    }
  };

  /* tables de rencontres par carte (donjons) : voir DUNGEONS.list */
  D.ENC_RATE = 0.115;

  /* position de sortie des intérieurs (coordonnées dans la ville) */
  var INNBACK = {
    aurelia: { x: 1, y: 11 }, pyrite: { x: 3, y: 4 }, azur: { x: 25, y: 7 }, givre: { x: 3, y: 4 }, cendre: { x: 3, y: 3 }
  };
  var SHOPBACK = {
    aurelia: { x: 26, y: 11 }, pyrite: { x: 25, y: 4 }, azur: { x: 2, y: 4 }, givre: { x: 25, y: 4 }, cendre: { x: 21, y: 3 }
  };
  var ARMSBACK = {
    aurelia: { x: 9, y: 8 }, pyrite: { x: 12, y: 6 }, azur: { x: 8, y: 10 }, givre: { x: 3, y: 8 }, cendre: { x: 21, y: 3 }
  };
  D.MAPS_BACK = { INNBACK: INNBACK, SHOPBACK: SHOPBACK, ARMSBACK: ARMSBACK };

  /* ============================================================
     Utilitaires de carte
     ============================================================ */
  D.at = function (id, x, y) {
    var m = MAPS[id]; if (!m) return '#';
    if (y < 0 || y >= m.h) return m.void || '#';
    if (x < 0 || x >= m.w) return m.void || '~';
    return m.rows[y].charAt(x) || '#';
  };
  D.entAt = function (id, x, y, type) {
    var m = MAPS[id]; if (!m) return null;
    for (var i = 0; i < m.ents.length; i++) {
      var e = m.ents[i];
      if (e.x === x && e.y === y && (!type || e.t === type)) return e;
    }
    return null;
  };
})(this.FF = this.FF || {});
