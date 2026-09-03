/* ============================================================
   D.MON — bestiaire : ennemis normaux + boss (IA, butin, scripts)
   ============================================================ */
(function (FF) {
  'use strict';
  var D = FF.D;
  var M = D.MON = {};

  /* stats dérivées du niveau pour la chair à canon */
  function st(lv, o) {
    var m = o.mul || 1;
    return {
      hp: Math.round((20 + lv * 12.5) * m * (o.hp || 1)),
      mp: Math.round((6 + lv * 2.2) * (o.mp || 1)),
      atk: Math.round((6 + lv * 2.15) * (o.atk || 1)),
      def: Math.round((3 + lv * 1.25) * (o.def || 1)),
      mdef: Math.round((2 + lv * 0.95) * (o.mdef || 1)),
      mag: Math.round((5 + lv * 1.85) * (o.mag || 1)),
      spd: Math.round((5 + lv * 0.85) * (o.spd || 1)),
      exp: Math.round((lv * lv * 3.1 + lv * 9) * (o.exp || 1)),
      gil: Math.round((10 + lv * 12) * (o.gil || 1))
    };
  }

  /**
   * E(id, nom, art, niveau, options)
   *  o.skin  : variante de palette
   *  o.acts  : [{a:'atk'} | {a:'sp',id:'feu'} | {a:'ab',id:'smash'}] avec poids w
   *  o.res   : {fire:0.5, ice:2}  (multiplicateur)
   *  o.imm   : {'poison':1,...}   (statuts immunisés)
   *  o.drop  : {it:'potion', p:.15}
   *  o.steal : {it:'bomb', p:.25}
   *  o.ai    : 'fonce'|'lache'|'sage'|'gardien'|'furet'
   *  o.scale : taille du sprite en combat
   */
  function E(id, n, art, lv, o) {
    o = o || {};
    var s = o.boss ? o.bstats || st(lv, o) : st(lv, o);
    var e = {
      id: id, n: n, art: art, skin: o.skin || 0, lv: lv, boss: !!o.boss,
      hp: o.hp || s.hp, mp: o.mp != null ? o.mp : s.mp,
      atk: o.atk != null ? o.atk : s.atk, def: o.def != null ? o.def : s.def,
      mdef: o.mdef != null ? o.mdef : s.mdef, mag: o.mag != null ? o.mag : s.mag,
      spd: o.spd != null ? o.spd : s.spd, exp: o.exp != null ? o.exp : s.exp, gil: o.gil != null ? o.gil : s.gil,
      acts: o.acts || [{ a: 'atk', w: 3 }],
      res: o.res || {}, imm: o.imm || {}, drop: o.drop || null, steal: o.steal || null,
      ai: o.ai || 'fonce', scale: o.scale || (o.boss ? 2 : 2), sc2: o.sc2 || 1,
      fleeAt: o.fleeAt || 0, back: o.back || false, msg: o.msg || null,
      phases: o.phases || null, win: o.win || null, intro: o.intro || null,
      guard: o.guard || null, counters: o.counters || null, music: o.music || null,
      desc: o.desc || ''
    };
    M[id] = e; return e;
  }

  /* ----------------— CLAIRIÈRE / FORÊT D'AURÉLIA (1-6) ----------------—*/
  E('limule', 'Limule des Prés', 'slime', 2, { acts: [{ a: 'atk', w: 4 }, { a: 'sp', id: 'nuage', w: 1 }], res: { ice: 1.3, fire: .7 }, drop: { it: 'potion', p: .12 }, steal: { it: 'potion', p: .2 }, desc: 'Gel tiède et collant.' });
  E('limule2', 'Limule Vive', 'slime', 4, { skin: 1, res: { lit: .5, ice: 1.3 }, acts: [{ a: 'atk', w: 3 }, { a: 'split', w: 1 }], ai: 'furet', drop: { it: 'antidote', p: .1 } });
  E('limule3', 'Limule Miroir', 'slime', 9, { skin: 3, res: { holy: .5 }, acts: [{ a: 'atk', w: 2 }, { a: 'reflect', w: 1 }], ai: 'sage', mdef: 26 });
  E('chatsouris', 'Chauve-Souris Rousse', 'bat', 2, { acts: [{ a: 'atk', w: 3 }, { a: 'sp', id: 'songe', w: 1 }], res: { lit: 1.4, wind: .7 }, ai: 'furet', spd: 12 });
  E('chatsouris2', 'Chauve-Souris de Fer', 'bat', 8, { skin: 3, def: 18, res: { lit: 1.3 }, acts: [{ a: 'atk', w: 4 }, { a: 'ab', id: 'steal', w: 1 }] });
  E('ratmusq', 'Rat Musqueur', 'rat', 2, { acts: [{ a: 'atk', w: 4 }, { a: 'sp', id: 'nuage', w: 1 }], steal: { it: 'mote', p: .25 }, ai: 'lache', fleeAt: .18 });
  E('crabe Sources', 'Crabe des Sources', 'crab', 3, { def: 10, res: { ice: .6, fire: 1.4 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'lowblow', w: 1 }] });
  E('lombric', 'Lombric des Bois', 'worm', 3, { res: { earth: .5, ice: 1.3 }, acts: [{ a: 'atk', w: 3 }, { a: 'sp', id: 'roche', w: 1 }] });
  E('amanite', 'Amanite Nerveuse', 'mushroom', 4, { res: { fire: 1.5, holy: .5 }, imm: { poison: 1 }, acts: [{ a: 'sp', id: 'nuage', w: 3 }, { a: 'atk', w: 2 }], drop: { it: 'antidote', p: .3 } });
  E('scarabee', 'Scarabée Sylvain', 'beetle', 4, { def: 12, res: { wind: 1.3, earth: .6 }, acts: [{ a: 'atk', w: 4 }, { a: 'ab', id: 'bulwark', w: 1 }] });
  E('grenard', 'Grenard Cendré', 'bird', 5, { acts: [{ a: 'atk', w: 3 }, { a: 'sp', id: 'etincelle', w: 2 }], res: { ice: 1.3, fire: .6 }, ai: 'furet' });
  E('oeilclair', 'Œil Clair', 'eye', 5, { back: true, mdef: 16, acts: [{ a: 'sp', id: 'eclair', w: 2 }, { a: 'sp', id: 'vue', w: 1 }, { a: 'atk', w: 1 }], ai: 'sage' });

  /* ----------------— MINES DE PYRITE (6-14) ----------------—*/
  E('araignee', 'Araignée de Pyrite', 'spider', 7, { acts: [{ a: 'atk', w: 3 }, { a: 'sp', id: 'nuage', w: 2 }], res: { fire: 1.4, ice: .7 }, imm: { poison: 1 } });
  E('squele', 'Serviteur Oublié', 'skeleton', 8, { res: { holy: 1.6, ice: .6, poison: 2 }, imm: { poison: 1, sleep: 1, stone: 1 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'kick', w: 1 }] });
  E('squele2', 'Os du Fond', 'skeleton', 12, { skin: 1, res: { holy: 1.5 }, hp: 240, acts: [{ a: 'atk', w: 3 }, { a: 'sp', id: 'baillon', w: 1 }] });
  E('impveine', 'Imp des Veines', 'imp', 9, { res: { fire: .5, ice: 1.5 }, acts: [{ a: 'sp', id: 'etincelle', w: 3 }, { a: 'atk', w: 2 }, { a: 'ab', id: 'steal', w: 1 }], ai: 'sage', steal: { it: 'bomb', p: .3 } });
  E('mandra', 'Mandragore Chausse-Trappe', 'flower', 10, { imm: { sleep: 1, poison: 1 }, acts: [{ a: 'sp', id: 'songe', w: 3 }, { a: 'sp', id: 'nuage', w: 2 }, { a: 'atk', w: 1 }], drop: { it: 'salve', p: .25 } });
  E('grogne', 'Golem de Grogne', 'golem', 11, { def: 30, spd: 6, res: { earth: .3, lit: 1.5 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'smash', w: 2 }, { a: 'sp', id: 'roche', w: 1 }] });
  E('taupe', 'Taupe d’Acier', 'machine', 12, { def: 34, res: { lit: 1.6, earth: .5 }, imm: { paralyze: 1 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'volley', w: 1 }] });
  E('crabeGal', 'Crabe des Galeries', 'crab', 10, { skin: 1, hp: 210, acts: [{ a: 'atk', w: 4 }, { a: 'ab', id: 'lowblow', w: 2 }] });
  E('sorciere', 'Sorcière de Raveine', 'mage', 13, { back: true, mdef: 26, res: { dark: .4 }, acts: [{ a: 'sp', id: 'glace', w: 3 }, { a: 'sp', id: 'meduse', w: 1 }, { a: 'sp', id: 'revers', w: 1 }], ai: 'sage' });

  /* ----------------— ÉPAVE / MARCHÉ DES MARÉES (13-22) ----------------—*/
  E('poissonlame', 'Poisson-Lame', 'fish', 14, { res: { ice: .6, lightning: 1 }, acts: [{ a: 'atk', w: 4 }, { a: 'ab', id: 'kick', w: 1 }], ai: 'furet', spd: 26 });
  E('pieuvre', 'Pieuvre Nacrée', 'kraken', 15, { scale: 1, hp: 320, res: { fire: 1.4, ice: .6 }, acts: [{ a: 'atk', w: 3 }, { a: 'sp', id: 'brume', w: 2 }, { a: 'ab', id: 'steal', w: 1 }] });
  E('crane', 'Crâne d’Écume', 'ghost', 15, { res: { holy: 1.6, dark: .3, phys: .8 }, imm: { sleep: 1, stone: 1 }, acts: [{ a: 'sp', id: 'draine', w: 2 }, { a: 'atk', w: 2 }, { a: 'sp', id: 'baillon', w: 1 }] });
  E('serpentvague', 'Serpent des Vagues', 'snake', 16, { res: { lit: 1.4 }, acts: [{ a: 'atk', w: 3 }, { a: 'sp', id: 'brume', w: 2 }], drop: { it: 'pendentif', p: .06 } });
  E('goeland', 'Goéland Géant', 'bird', 15, { res: { wind: .4, ice: 1.3 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'volley', w: 2 }], ai: 'furet' });
  E('etoilev', 'Étoile Venimeuse', 'eye', 17, { scale: 1, skin: 1, imm: { poison: 1 }, acts: [{ a: 'sp', id: 'nuage', w: 3 }, { a: 'sp', id: 'meduse', w: 2 }], ai: 'sage' });
  E('requin', 'Requin d’Eau Douce', 'fish', 18, { skin: 1, hp: 420, atk: 52, res: { ice: 1.3 }, acts: [{ a: 'atk', w: 4 }, { a: 'ab', id: 'smash', w: 2 }], ai: 'fonce' });
  E('tortueR', 'Tortue de Rouille', 'machine', 19, { def: 52, spd: 8, res: { lit: 1.4, phys: .7 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'guard', w: 2 }], ai: 'gardien' });
  E('naute', 'Naute Perdu', 'skeleton', 18, { skin: 3, res: { water: .5 }, acts: [{ a: 'atk', w: 2 }, { a: 'sp', id: 'brume', w: 2 }, { a: 'sp', id: 'songe', w: 1 }] });

  /* ----------------— FLANC DE GIVRE (20-30) ----------------—*/
  E('loupgivre', 'Loup Givré', 'wolf', 21, { res: { ice: .4, fire: 1.4 }, acts: [{ a: 'atk', w: 4 }, { a: 'ab', id: 'kick', w: 1 }, { a: 'sp', id: 'glace', w: 1 }] });
  E('blizzardE', 'Esprit du Blizzard', 'ghost', 22, { skin: 0, res: { ice: .2, holy: 1.5 }, imm: { sleep: 1 }, acts: [{ a: 'sp', id: 'glace2', w: 2 }, { a: 'sp', id: 'songe', w: 2 }, { a: 'atk', w: 1 }], ai: 'sage' });
  E('corbeau', 'Corbeau de Fer', 'bird', 22, { skin: 3, def: 40, res: { lit: .4 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'aim', w: 1 }, { a: 'ab', id: 'volley', w: 2 }] });
  E('salamG', 'Salamandre de Glace', 'imp', 23, { skin: 2, res: { ice: .2, fire: 1.6 }, acts: [{ a: 'sp', id: 'glace', w: 3 }, { a: 'atk', w: 2 }] });
  E('yeti', 'Yeti des Cols', 'golem', 25, { skin: 1, hp: 700, res: { ice: .4, fire: 1.4 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'smash', w: 2 }, { a: 'sp', id: 'roche', w: 1 }] });
  E('oeilBlizzard', 'Œil du Blizzard', 'eye', 24, { skin: 1, mdef: 46, res: { ice: .5 }, acts: [{ a: 'sp', id: 'glace2', w: 2 }, { a: 'sp', id: 'revers', w: 1 }, { a: 'sp', id: 'eclair', w: 2 }], ai: 'sage' });
  E('chevalierG', 'Chevalier Gelé', 'skeleton', 26, { skin: 1, def: 56, hp: 780, res: { holy: 1.4 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'guard', w: 1 }, { a: 'ab', id: 'smash', w: 2 }] });
  E('liche', 'Liche Mineure', 'mage', 27, { back: true, mdef: 52, res: { dark: .2, holy: 1.6 }, acts: [{ a: 'sp', id: 'glace2', w: 3 }, { a: 'sp', id: 'mal', w: 1 }, { a: 'sp', id: 'draine', w: 2 }], ai: 'sage' });
  E('verglace', 'Ver de Glace', 'worm', 24, { skin: 1, res: { fire: 1.5, ice: .5 }, acts: [{ a: 'atk', w: 3 }, { a: 'sp', id: 'glace', w: 2 }] });

  /* ----------------— VALCENDRE / LAVE (28-38) ----------------—*/
  E('diable', 'Diable de Cendre', 'imp', 29, { res: { fire: .1, ice: 1.6 }, acts: [{ a: 'sp', id: 'feu', w: 3 }, { a: 'atk', w: 2 }, { a: 'sp', id: 'etincelle', w: 1 }] });
  E('golemL', 'Golem de Laitier', 'golem', 31, { skin: 0, def: 70, hp: 1400, res: { fire: .2, earth: .6 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'smash', w: 3 }], ai: 'gardien' });
  E('verLave', 'Ver de Lave', 'worm', 30, { skin: 2, res: { fire: .2 }, acts: [{ a: 'atk', w: 3 }, { a: 'sp', id: 'feu', w: 2 }] });
  E('aigleB', 'Aigle de Braise', 'bird', 31, { skin: 0, res: { fire: .3, wind: .6 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'volley', w: 2 }], ai: 'furet' });
  E('cuirasse', 'Cuirassé d’Obsidienne', 'machine', 33, { def: 84, hp: 1500, res: { phys: .6, lit: 1.4 }, imm: { paralyze: 1, stone: 1 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'warcry', w: 1 }, { a: 'ab', id: 'smash', w: 2 }] });
  E('licheM', 'Liche Majeure', 'mage', 34, { back: true, mdef: 76, hp: 1300, res: { dark: .1, holy: 1.5 }, acts: [{ a: 'sp', id: 'feu2', w: 3 }, { a: 'sp', id: 'meduse', w: 2 }, { a: 'sp', id: 'mort', w: 1 }], ai: 'sage' });
  E('phoenixG', 'Phoenix Gringalet', 'bird', 33, { skin: 0, res: { fire: 0, holy: .5 }, imm: { sleep: 1 }, acts: [{ a: 'sp', id: 'feu', w: 3 }, { a: 'ab', id: 'dragonfire', w: 1 }, { a: 'atk', w: 1 }], ai: 'furet' });
  E('nymphes', 'Nymphe de Soufre', 'eye', 30, { skin: 2, mdef: 60, acts: [{ a: 'sp', id: 'soin2', w: 2 }, { a: 'sp', id: 'force', w: 1 }, { a: 'sp', id: 'eclair', w: 2 }], ai: 'sage' });

  /* ----------------— TOUR OBIDIENNE / NÉANT (36-50) ----------------—*/
  E('dechu', 'Chevalier Déchu', 'skeleton', 38, { skin: 2, def: 96, hp: 2100, res: { dark: .3, holy: 1.4 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'darkedge', w: 2 }, { a: 'ab', id: 'guard', w: 1 }] });
  E('archive', 'Œil d’Archive', 'eye', 40, { skin: 1, mdef: 88, back: true, acts: [{ a: 'sp', id: 'gravite', w: 2 }, { a: 'sp', id: 'revers', w: 1 }, { a: 'sp', id: 'foudre2', w: 2 }], ai: 'sage' });
  E('homonce', 'Homoncule', 'machine', 41, { skin: 1, hp: 2300, res: { phys: .7 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'kick', w: 2 }, { a: 'sp', id: 'eclair', w: 1 }] });
  E('fleau', 'Fléau Ailé', 'bat', 42, { skin: 2, hp: 1900, res: { holy: .5, lit: 1.3 }, acts: [{ a: 'sp', id: 'songe', w: 2 }, { a: 'atk', w: 3 }, { a: 'ab', id: 'dragonfire', w: 1 }], ai: 'furet' });
  E('gardien', 'Gardien de Rune', 'golem', 44, { skin: 2, def: 120, hp: 3000, res: { earth: .4, holy: .7 }, acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'bulwark', w: 1 }, { a: 'ab', id: 'smash', w: 3 }, { a: 'sp', id: 'roche', w: 1 }], ai: 'gardien' });
  E('neant', 'Néant Rampant', 'worm', 43, { skin: 1, hp: 2400, res: { dark: .2, holy: 1.5, phys: .8 }, imm: { sleep: 1, poison: 1 }, acts: [{ a: 'sp', id: 'gravite2', w: 2 }, { a: 'atk', w: 3 }] });
  E('assassin', 'Assassin Voilé', 'imp', 45, { skin: 3, spd: 60, res: { dark: .4 }, acts: [{ a: 'ab', id: 'steal', w: 2 }, { a: 'ab', id: 'lowblow', w: 2 }, { a: 'atk', w: 3 }], ai: 'furet', steal: { it: 'x potion', p: .35 } });
  E('archimage', 'Archimage d’Obsidienne', 'mage', 46, { back: true, mdef: 110, hp: 2600, res: { dark: .1, fire: .5 }, acts: [{ a: 'sp', id: 'feu3', w: 2 }, { a: 'sp', id: 'mort', w: 2 }, { a: 'sp', id: 'chute', w: 1 }, { a: 'sp', id: 'soin3', w: 1 }], ai: 'sage' });

  /* ----------------— CAVERNE OUBLIÉE (optionnel, 24-48) ----------------—*/
  E('momon', 'Momon Doré', 'mushroom', 26, { skin: 1, hp: 900, exp: 900, gil: 1400, res: { fire: 1.4 }, acts: [{ a: 'sp', id: 'gravite', w: 2 }, { a: 'atk', w: 3 }], ai: 'lache', fleeAt: .3, drop: { it: 'x potion', p: .4 }, steal: { it: 'hipotion', p: .5 }, desc: 'Il court vite. Très vite.' });
  E('ombre', 'Ombre du Serment', 'ghost', 36, { skin: 3, hp: 1600, res: { holy: 1.6, dark: 0, phys: .7 }, imm: { sleep: 1, poison: 1, stone: 1 }, acts: [{ a: 'sp', id: 'mal', w: 2 }, { a: 'atk', w: 3 }] });
  E('chienG', 'Chien de Givre', 'wolf', 34, { skin: 0, hp: 1200, acts: [{ a: 'atk', w: 4 }, { a: 'ab', id: 'kick', w: 2 }] });

  /* ============================================================
     BOSSES
     ============================================================ */
  E('croc-boue', 'Croc-Boue', 'worm', 5, {
    boss: 1, hp: 460, atk: 20, def: 14, mdef: 10, spd: 10, exp: 240, gil: 260, scale: 3, skin: 1,
    res: { ice: 1.4, fire: .7 }, imm: { sleep: 1, poison: 1 },
    acts: [{ a: 'atk', w: 4 }, { a: 'sp', id: 'nuage', w: 2 }, { a: 'ab', id: 'smash', w: 2, hp: .6 }],
    intro: 'La boue se soulève… deux yeux s’ouvrent dans la vase.',
    win: { it: 'clé rouillée' }, drop: { it: 'hipotion', p: 1 },
    desc: 'Gélatineux, tenace, et très mauvaise haleine.'
  });
  E('gargouille', 'Gargouille de Pyrite', 'golem', 11, {
    boss: 1, hp: 1300, atk: 40, def: 34, mdef: 22, spd: 14, exp: 900, gil: 800, scale: 3,
    res: { earth: .4, lit: 1.4 }, imm: { paralyze: 1, stone: 1 },
    acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'smash', w: 3 }, { a: 'sp', id: 'roche', w: 2 }, { a: 'ab', id: 'bulwark', w: 1, hp: .5 }],
    phases: [{ at: .45, msg: 'La gargouille se fend et hurle de pierre !', atk: 1.25, spd: 1.3 }],
    intro: 'Deux ailes de roche se déploient dans la galerie.',
    win: { it: 'lanterne' }, drop: { it: 'x potion', p: .5 },
    desc: 'Gardienne des galeries hautes.'
  });
  E('vaux', 'Chancelier Vaux', 'imp', 14, {
    boss: 1, hp: 1900, atk: 46, def: 30, mdef: 40, spd: 26, exp: 1500, gil: 2200, scale: 3, skin: 1,
    res: { dark: .4, holy: 1.5 },
    acts: [{ a: 'sp', id: 'feu2', w: 3 }, { a: 'sp', id: 'meduse', w: 2 }, { a: 'atk', w: 2 }, { a: 'ab', id: 'steal', w: 1 }],
    counters: [{ if: 'phys', a: { a: 'sp', id: 'gravite' }, p: .3 }],
    intro: '« Vous allez signer, petits sables. Signer, ou couler. »',
    win: { job: 'war' }, drop: { it: 'x potion', p: 1 },
    desc: 'Un bureaucrate, un vrai, avec des griffes.'
  });
  E('nereide', 'Néréide l’Avare', 'fish', 18, {
    boss: 1, hp: 3200, atk: 58, def: 44, mdef: 52, spd: 30, exp: 2600, gil: 3200, scale: 3, skin: 1,
    res: { water: .3, ice: .6, lit: 1.6 }, imm: { stone: 1 },
    acts: [{ a: 'sp', id: 'brume', w: 2 }, { a: 'atk', w: 3 }, { a: 'ab', id: 'steal', w: 2 }, { a: 'sp', id: 'gravite', w: 1, hp: .5 }],
    phases: [{ at: .5, msg: 'La Néréide appelle ses sœurs !', add: ['crane', 'crane'] }],
    intro: 'L’eau noircit ; un trésor de dents remonte vers vous.',
    win: { it: 'clé d’azur', job: 'ranger' }, drop: { it: 'grimoire-celeste', p: .25 },
    desc: 'Elle compte tout. Sauf les vivants.'
  });
  E('gelignard', 'Comte Gelignard', 'skeleton', 22, {
    boss: 1, hp: 4600, atk: 84, def: 62, mdef: 58, spd: 34, exp: 4200, gil: 4600, scale: 3, skin: 1,
    res: { holy: 1.6, ice: .2, fire: 1.2 }, imm: { sleep: 1, poison: 1, stone: 1 },
    acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'smash', w: 2 }, { a: 'sp', id: 'glace2', w: 2 }, { a: 'ab', id: 'guard', w: 1, hp: .7 }],
    counters: [{ if: 'crit', a: { a: 'sp', id: 'mal' }, p: .5 }],
    intro: '« Trois cents hivers dans ce salon, et toujours pas de bal. »',
    win: { job: 'monk', spell: 'soin3' }, drop: { it: 'x potion', p: 1 },
    desc: 'Un mort qui tient table ouverte.'
  });
  E('kael1', 'Kael, Chevalier Noir', 'knight', 26, {
    boss: 1, hp: 5200, atk: 96, def: 70, mdef: 54, spd: 38, exp: 5200, gil: 0, scale: 3, skin: 0,
    res: { dark: .2, holy: 1.5 }, imm: { sleep: 1, confuse: 1 },
    acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'darkedge', w: 3 }, { a: 'ab', id: 'blackhole', w: 2 }, { a: 'ab', id: 'cry', w: 1, hp: .6 }],
    intro: 'Kael ne lève pas les yeux. « Ne me retiens pas, Arno. »',
    win: { job: 'dark' }, noGil: 1, noFlee: 1,
    desc: 'Ton ami. Ton ennemi. Les deux, en fait.'
  });
  E('leviathan', 'Léviathan Éveillé', 'wyrm', 30, {
    boss: 1, hp: 9000, atk: 110, def: 78, mdef: 76, spd: 40, exp: 9000, gil: 8000, scale: 2, skin: 2,
    res: { water: 0, lit: 1.5, ice: .5 }, imm: { sleep: 1, stop: 1, stone: 1 },
    acts: [{ a: 'sp', id: 'brume', w: 2 }, { a: 'atk', w: 3 }, { a: 'sp', id: 'gravite2', w: 2 }, { a: 'ab', id: 'dragonfire', w: 2 }],
    phases: [
      { at: .66, msg: 'Le Léviathan plonge — et remonte en gerbe.', add: ['requin', 'requin'] },
      { at: .33, msg: '« RENDS-MOI L’ÉCAILLE ! »', atk: 1.2, mag: 1.3 }
    ],
    intro: 'La mer se lève en une seule colonne d’eau vivante.',
    win: { it: 'écaille', job: 'summon' }, drop: { it: 'phoenix', p: 1 },
    desc: 'Le vieux dieu des fonds, vexé.'
  });
  E('cendrix', 'Cendrix le Forgeron', 'titan', 34, {
    boss: 1, hp: 11000, atk: 128, def: 96, mdef: 70, spd: 30, exp: 11000, gil: 9000, scale: 2, skin: 1,
    res: { fire: .1, ice: 1.6 }, imm: { paralyze: 1, stone: 1, poison: 1 },
    acts: [{ a: 'atk', w: 3 }, { a: 'ab', id: 'smash', w: 3 }, { a: 'sp', id: 'feu2', w: 2 }, { a: 'ab', id: 'warcry', w: 1, hp: .5 }],
    counters: [{ if: 'magic', a: { a: 'sp', id: 'eclair' }, p: .45 }],
    intro: 'L’enclume frappe toute seule. « On ne forge pas un dieu, gamin. On le répare. »',
    win: { it: 'sceau', job: 'dragoon' }, drop: { it: 'ex-calamite', p: .18 },
    desc: 'Forgeron des armes divines.'
  });
  E('borhee', 'Borée enchaînée', 'drake', 30, {
    boss: 1, hp: 8200, atk: 104, def: 72, mdef: 88, spd: 46, exp: 8200, gil: 6400, scale: 2, skin: 1,
    res: { wind: .2, earth: 1.4 }, imm: { sleep: 1, stop: 1 },
    acts: [{ a: 'sp', id: 'feu2', w: 3 }, { a: 'ab', id: 'dragonfire', w: 2 }, { a: 'atk', w: 3 }, { a: 'ab', id: 'volley', w: 1 }],
    phases: [{ at: .5, msg: 'Les chaînes cèdent. Le ciel se déchire.', spd: 1.4 }],
    intro: 'Un esprit du vent, cloué au pic par quatre chaînes noires.',
    win: { summon: 'boree', job: 'bard' }, noFlee: 1,
    desc: 'Un otage, pas un monstre.'
  });
  E('archonte', 'Archonte Obsidien', 'titan', 42, {
    boss: 1, hp: 20000, atk: 168, def: 120, mdef: 120, spd: 52, exp: 20000, gil: 16000, scale: 2, skin: 2,
    res: { dark: .3, holy: 1.4, phys: .8 }, imm: { sleep: 1, stop: 1, stone: 1, poison: 1 },
    acts: [{ a: 'sp', id: 'gravite2', w: 3 }, { a: 'atk', w: 3 }, { a: 'sp', id: 'mort', w: 2 }, { a: 'ab', id: 'blackhole', w: 2 }],
    counters: [{ if: 'any', a: { a: 'sp', id: 'revers' }, p: .18 }],
    phases: [{ at: .5, msg: 'L’Archonte brise son propre masque !', atk: 1.25, mag: 1.25, add: ['archive'] }],
    intro: 'La pierre se fend en quatre visages, puis en un seul.',
    win: { it: 'nacelle', job: 'sage' }, drop: { it: 'elixir', p: .5 },
    desc: 'Le dernier serviteur du Dévoreur.'
  });
  E('kael2', 'Kael, Brisé', 'knight', 44, {
    boss: 1, hp: 16000, atk: 176, def: 128, mdef: 110, spd: 56, exp: 16000, gil: 0, scale: 2, skin: 2,
    res: { dark: .1, holy: 1.3 }, imm: { sleep: 1, confuse: 1, stone: 1 },
    acts: [{ a: 'ab', id: 'darkedge', w: 4 }, { a: 'ab', id: 'blackhole', w: 3 }, { a: 'atk', w: 3 }, { a: 'ab', id: 'cry', w: 1, hp: .4 }],
    intro: '« Arno… frappe. Tant qu’il me reste quelqu’un à protéger. »',
    win: {}, noGil: 1, noFlee: 1,
    desc: 'Le serment, enfin tenu.'
  });
  E('nyxare', 'Nyxaré, Dévoreur de Cristaux', 'overlord', 48, {
    boss: 1, hp: 30000, atk: 196, def: 140, mdef: 140, spd: 62, exp: 40000, gil: 0, scale: 2, skin: 0,
    res: { dark: 0, holy: 1.35, phys: .8, fire: .7, ice: .7, lit: .7 },
    imm: { sleep: 1, stop: 1, stone: 1, poison: 1, confuse: 1, doom: 1, silence: 1 },
    acts: [{ a: 'atk', w: 3 }, { a: 'sp', id: 'chute', w: 2 }, { a: 'sp', id: 'feu3', w: 2 }, { a: 'ab', id: 'blackhole', w: 2 }, { a: 'sp', id: 'mort', w: 2 }],
    phases: [
      { at: .75, msg: '« Vos cristaux chantaient si bien. »', mag: 1.2 },
      { at: .5, msg: 'Nyxaré déplie les quatre ailes du silence !', atk: 1.2, add: ['neant', 'neant'] },
      { at: .25, msg: 'Le Dévoreur avale sa propre lumière.', heal: .2, spd: 1.3, acts: [{ a: 'sp', id: 'astra', w: 3 }, { a: 'atk', w: 3 }, { a: 'sp', id: 'gravite2', w: 3 }, { a: 'ab', id: 'smash', w: 2 }] }
    ],
    counters: [{ if: 'magic', a: { a: 'sp', id: 'gravite' }, p: .3 }],
    intro: 'Au sommet de la tour, quelque chose de très ancien se retourne.',
    win: {}, noGil: 1, noFlee: 1, final: 1, music: 'boss',
    desc: 'Il a mangé un monde. Il a encore faim.'
  });
  E('momor', 'Momon Étoilé', 'slime', 60, {
    boss: 1, hp: 44000, atk: 210, def: 150, mdef: 150, spd: 70, exp: 60000, gil: 99999, scale: 2, skin: 4,
    mul: 1, res: { phys: .8 }, imm: { sleep: 1, stop: 1, stone: 1, poison: 1, confuse: 1, doom: 1 },
    acts: [{ a: 'sp', id: 'feu3', w: 2 }, { a: 'sp', id: 'chute', w: 2 }, { a: 'sp', id: 'sanctuaire', w: 1 }, { a: 'atk', w: 2 }, { a: 'sp', id: 'gravite2', w: 2 }, { a: 'ab', id: 'volley', w: 1 }],
    counters: [{ if: 'any', a: { a: 'sp', id: 'meduse' }, p: .18 }],
    intro: 'Un limule brille comme une galaxie. Il a l’air de s’ennuyer.',
    win: {}, noGil: 1, noFlee: 1, secret: 1,
    desc: 'LE combat optionnel. 44 000 PV de gel cosmique.'
  });
  E('dreamer', 'Rêve d’Arno', 'eye', 40, {
    boss: 1, hp: 9000, atk: 130, def: 90, mdef: 100, spd: 48, exp: 9000, gil: 4000, scale: 2, skin: 2,
    res: { holy: .6, dark: .6 }, imm: { sleep: 1 },
    acts: [{ a: 'sp', id: 'songe', w: 3 }, { a: 'sp', id: 'rouge-folie', w: 2 }, { a: 'sp', id: 'gravite', w: 2 }, { a: 'atk', w: 2 }],
    intro: 'Ton propre regard te quitte du trou noir de la grotte.',
    win: { ability: 'meditate' }, noFlee: 1,
    desc: 'Optionnel. Endors-toi et c’est fini.'
  });

  D.STARTERS = {
    'arno': { job: 'chev', lv: 1, gear: ['ep-baie', 'cotte-cuir', 'd-poinçon', 'anneau-vie'] },
    'myrelle': { job: 'white', lv: 1, gear: ['baton-cedre', 'robe-lin', 'chapeau'] },
    'sica': { job: 'thief', lv: 1, gear: ['d-poinçon', 'cotte-cuir', 'bonnet'] },
    'gault': { job: 'monk', lv: 2, gear: ['poing-fer', 'cotte-mailles'] },
    'kael': { job: 'dark', lv: 12, gear: ['ep-fer', 'armure-chevalier', 'barbut'] },
    'lys': { job: 'bard', lv: 14, gear: ['luth-echo', 'cotte-mailles', 'chapeau'] }
  };
  D.GUEST = { gault: true, lys: true };
})(this.FF = this.FF || {});
