/* ============================================================
   D.CAST / D.DLG / D.SCENES — personnages, dialogues, scènes
   ============================================================ */
(function (FF) {
  'use strict';
  var D = FF.D;

  /* ---------------- distribution ---------------- */
  D.CAST = {
    arno: {
      n: 'Arno', t: 'Chevalier d’Aurélia',
      bias: { for: .5, vit: .4, agi: -.1, int: -.2 },
      look: { skin: '#e0a878', hair: { c: '#5a3a20', style: 'short' }, eye: '#2b3a55', cloth: '#8a2f2f', cloth2: '#5f1f1f', metal: '#c6d0e0', hat: 'helm', armor: 'plate', weapon: 'sword', cape: 1, capeC: '#8a2f2f', gem: '#8ef0ff' },
      bio: 'Il a grandi dans l’ombre du donjon. Il frappe avant de comprendre, et comprend trop tard.'
    },
    myrelle: {
      n: 'Myrelle', t: 'Novice du Sanctuaire',
      bias: { int: .6, esp: .4, for: -.5, vit: -.3 },
      look: { skin: '#f0c8a0', hair: { c: '#e6d08a', style: 'long' }, eye: '#3d6a8a', cloth: '#e6eef6', cloth2: '#a6c8e6', hat: 'none', armor: 'robe', weapon: 'staff', trim: '#ffd257', skin2: 1 },
      bio: 'Elle a appris à soigner avant d’apprendre à lire. Le Sanctuaire l’a rejetée, pas la lumière.'
    },
    sica: {
      n: 'Sica', t: 'Voleuse des Toits',
      bias: { agi: .7, for: .1, int: .1, vit: -.2 },
      look: { skin: '#c9925f', hair: { c: '#1f1f28', style: 'pony' }, eye: '#6a4f9e', cloth: '#3f5f4a', cloth2: '#2b4038', hat: 'hood', hatc: '#2b4038', armor: 'light', weapon: 'dagger' },
      bio: 'Elle connaît chaque gouttière d’Aurélia, et la moitié des secrets de ceux qui y dorment.'
    },
    gault: {
      n: 'Gault', t: 'Moine pèlerin',
      bias: { vit: .6, agi: .2, for: .2, int: -.3 },
      look: { skin: '#a8724a', hair: { c: '#000000', style: 'bald' }, eye: '#2b2018', cloth: '#c98a4a', cloth2: '#8a5a2b', armor: 'none', weapon: 'fist', metal: '#d6c9a0' },
      bio: 'Quatre cents lieues à pied, sans chaussures, pour voir un cristal s’éteindre. Il rit beaucoup.'
    },
    kael: {
      n: 'Kael', t: 'Chevalier Noir',
      bias: { for: .7, vit: .3, agi: -.2, esp: .3 },
      look: { skin: '#d6a880', hair: { c: '#2f2a35', style: 'short' }, eye: '#8a2f2f', cloth: '#2f3a5f', cloth2: '#1b2440', metal: '#7a8298', hat: 'helm', armor: 'plate', weapon: 'sword', cape: 1, capeC: '#1b2440' },
      bio: 'Le meilleur ami d’Arno. Le meilleur soldat du royaume. Les deux ne s’excluent pas.'
    },
    lys: {
      n: 'Lysandre', t: 'Barde sans lyre',
      bias: { agi: .3, int: .4, esp: .3, for: -.3 },
      look: { skin: '#e6bc90', hair: { c: '#a8451f', style: 'pony' }, eye: '#3f6a4a', cloth: '#6a4fc9', cloth2: '#4a357f', armor: 'light', weapon: 'bow', hat: 'hat', hatc: '#4a357f' },
      bio: 'Il compose l’épopée pendant que les autres la vivent. Il a perdu son instrument dans la neige.'
    }
  };

  /* NPCs génériques : aspect par rôle */
  D.NPCLOOK = {
    roi: { skin: '#e0b98a', hair: { c: '#8a6b3a', style: 'short' }, cloth: '#c9a86a', cloth2: '#8a6b1f', hat: 'crown', armor: 'none', metal: '#ffd257' },
    vieux: { skin: '#d6a878', hair: { c: '#cfd8e6', style: 'short' }, cloth: '#6a7288', cloth2: '#464e60', armor: 'none', hat: 'none' },
    vielle: { skin: '#e6c090', hair: { c: '#b0b8c9', style: 'long' }, cloth: '#8a5f7a', cloth2: '#5f3f55', armor: 'robe', hat: 'none' },
    garde: { skin: '#d6a878', hair: { c: '#3a3550', style: 'short' }, cloth: '#4a5570', cloth2: '#2b3550', armor: 'plate', metal: '#b0b8c9', hat: 'helm', weapon: 'spear' },
    marchand: { skin: '#e0b98a', hair: { c: '#4a3520', style: 'short' }, cloth: '#a6653d', cloth2: '#6a3f24', armor: 'light', hat: 'hat', hatc: '#6a3f24' },
    aubergiste: { skin: '#e6bc90', hair: { c: '#6a4520', style: 'short' }, cloth: '#c9a86a', cloth2: '#8a6b3a', armor: 'light' },
    mere: { skin: '#e6c090', hair: { c: '#8a5f3a', style: 'long' }, cloth: '#7a9ec9', cloth2: '#4a6f9e', armor: 'robe' },
    gosse: { skin: '#e8c8a0', hair: { c: '#c98a4a', style: 'short' }, cloth: '#d6c9a0', cloth2: '#a69a70', armor: 'none' },
    pretre: { skin: '#d6a878', hair: { c: '#cfd8e6', style: 'bald' }, cloth: '#e6eef6', cloth2: '#a6b0c9', armor: 'robe', hat: 'none', weapon: 'staff', gem: '#ffd257' },
    mineur: { skin: '#c9925f', hair: { c: '#2b2018', style: 'short' }, cloth: '#7a665a', cloth2: '#4a3f35', armor: 'light', hat: 'hat', hatc: '#3a2f25', weapon: 'mace', metal: '#8f7a5a' },
    marin: { skin: '#b0784a', hair: { c: '#3a3550', style: 'pony' }, cloth: '#4f7a9e', cloth2: '#2f5a7a', armor: 'light', weapon: 'dagger' },
    pecheur: { skin: '#c9925f', hair: { c: '#6a4b2c', style: 'short' }, cloth: '#7a9e6a', cloth2: '#4a6f3f', armor: 'light' },
    noble: { skin: '#e8c8a0', hair: { c: '#2f2a35', style: 'long' }, cloth: '#8a3d5a', cloth2: '#5f2440', armor: 'robe', hat: 'crown' },
    forgeron: { skin: '#a8724a', hair: { c: '#1b1410', style: 'bald' }, cloth: '#8a3d1f', cloth2: '#5f2410', armor: 'none', metal: '#b0b8c9', weapon: 'axe' },
    ermite: { skin: '#d6c9a0', hair: { c: '#e6eef6', style: 'long' }, cloth: '#5a6f4a', cloth2: '#3a4f2b', armor: 'robe', weapon: 'staff', gem: '#a6ffbf' },
    soldat: { skin: '#d6a878', hair: { c: '#4a3520', style: 'short' }, cloth: '#5f6a8a', cloth2: '#3a4560', armor: 'plate', metal: '#a6b0c9', hat: 'helm', weapon: 'sword' },
    ombre: { skin: '#3a3550', hair: { c: '#1b1420', style: 'short' }, cloth: '#2b2440', cloth2: '#1a1528', armor: 'none', eye: '#ff6a6a' },
    enfant: { skin: '#e8c8a0', hair: { c: '#c98a4a', style: 'short' }, cloth: '#a6c8e6', cloth2: '#6f9ac0', armor: 'none' },
    sagef: { skin: '#e0b98a', hair: { c: '#a6b0c9', style: 'long' }, cloth: '#6a4fc9', cloth2: '#3f2f7a', armor: 'robe', hat: 'hat', hatc: '#3f2f7a', weapon: 'staff', gem: '#ff8ad0' }
  };

  /* ---------------- conditions ----------------
     'ch>=2' , 'flag:nom', '!flag:nom', 'has:objetId', 'job:white', 'map:aurelia', 'and:a,b' */
  FF.Cond = function (c, S) {
    if (!c) return true;
    if (Object.prototype.toString.call(c) === '[object Array]') return c.every(function (x) { return FF.Cond(x, S); });
    c = String(c);
    var m;
    if ((m = /^ch([<>=!]+)(\d+)$/.exec(c))) {
      var v = S.ch, n = +m[2];
      return m[1] === '>=' ? v >= n : m[1] === '<=' ? v <= n : m[1] === '>' ? v > n : m[1] === '<' ? v < n : v === n;
    }
    if ((m = /^!?(flag|f):(.+)$/.exec(c))) { var k = m[2], val = !!S.flags[k]; return m[1] === '!' || c[0] === '!' ? !val : !!val; }
    if ((m = /^noflag:(.+)$/.exec(c))) return !S.flags[m[1]];
    if ((m = /^has:(.+?)(\d*)$/.exec(c))) return S.count(m[1]) >= (m[2] ? +m[2] : 1);
    if ((m = /^job:(.+)$/.exec(c))) return S.order.some(function (id) { return S.members[id] && S.members[id].job === m[1]; });
    if ((m = /^in:(.+)$/.exec(c))) return S.order.indexOf(m[1]) >= 0;
    if ((m = /^map:(.+)$/.exec(c))) return S.loc.map === m[1];
    if ((m = /^lv:(\d+)$/.exec(c))) return S.order.some(function (id) { return S.members[id] && S.members[id].lv >= +m[1]; });
    if (c === 'always') return true;
    if (c === 'never') return false;
    return true;
  };

  /* ---------------- dialogues ----------------
     D.DLG[id] = [ {c:cond, l:[['qui','texte'],…]}, … ] — première entrée dont la condition passe */
  var L = function () { return Array.prototype.slice.call(arguments); };
  var DLG = D.DLG = {};
  function dlg(id) { DLG[id] = Array.prototype.slice.call(arguments, 1); }

  dlg('aurelia_rue',
    { l: L(['gosse', 'On dit que le Sanctuaire de la Sève brille plus faible depuis trois nuits.'], ['mere', 'Chut. Le roi a envoyé les chevaliers.']) },
    { c: 'ch>=2', l: L(['gosse', 'Les mines de Pyrite ont fermé. Mon père n’est pas revenu.']) }
  );
  dlg('aurelia_vieux',
    { c: 'ch<=1', l: L(['vieux', 'Le cristal de Sève nourrit nos récoltes depuis six siècles. S’il s’éteint…']) },
    { l: L(['vieux', 'Les autres cristaux tombent un à un. Fuyez vers le sud, petite troupe.']) }
  );
  dlg('aurelia_pretre',
    { c: 'ch<=1', l: L(['pretre', 'Le Sanctuaire est au nord-est. Prenez garde : la vase, là-bas, a des dents.']) },
    { c: 'flag:sanctuaire', l: L(['pretre', 'Vous êtes revenus. La lumière d’Aurélia vous doit quelque chose : le Cristal du Savoir est ouvert.']) }
  );
  dlg('aurelia_garde',
    { c: 'ch=1', l: L(['garde', 'Sa Majesté vous attend dans la grande salle. Courez.' ]) },
    { c: 'ch>=2', l: L(['garde', 'Kael… Le capitaine Kael a quitté la garnison la nuit du massacre. Ne le cherchez pas.']) }
  );
  dlg('aurelia_marchand', { l: L(['marchand', 'De l’acier, des herbes, des mensonges gratuits. Choisissez.']) });
  dlg('aurelia_auberge', { l: L(['aubergiste', 'Une nuit à quatre-vingts. Le toit ne fuit que les soirs de pluie.']) });
  dlg('aurelia_sica_avant', { l: L(['gosse', 'La voleuse des toits a juré qu’elle suivrait les chevaliers. Elle est sur le toit, en fait.']) });

  dlg('pyrite_entree',
    { c: 'noflag:vaux', l: L(['mineur', 'Le Chancelier Vaux a doublé la taxe sur l’air qu’on respire ici.']) },
    { c: 'flag:vaux', l: L(['mineur', 'Vaux est tombé. On peut respirer gratis, alors.']) }
  );
  dlg('pyrite_capitaine', { l: L(['garde', 'La galerie nord est effondrée. Il faut la lanterne, sinon on tourne en rond jusqu’à mourir.']) });
  dlg('pyrite_enfant_perdu',
    { c: 'noflag:enfant', l: L(['gosse', 'Maman dit que mon père est coincé sous la galerie nord.']) },
    { c: 'flag:enfant', l: L(['gosse', 'Mon père est revenu ! Tiens, c’est ma bague. Elle chauffe un peu.']) }
  );
  dlg('azur_marin', { l: L(['marin', 'La cale de l’Épave chante la nuit. Les gens du port disent que c’est la mer qui digère.']) });
  dlg('azur_pecheur', { c: 'ch>=3', l: L(['pecheur', 'La Néréide compte nos filets et nous compte nous.']) });
  dlg('givre_femme', { c: 'ch>=4', l: L(['vielle', 'Le Comte Gelignard donne des bals. Personne n’est jamais reparti avec ses pieds.']) });
  dlg('givre_lyre',
    { c: 'noflag:lyre', l: L(['lys', 'Mon instrument est tombé dans la neige, là-haut. Si vous le retrouvez, je chante pour vous. Rien de honteux : juste très bien.']) },
    { c: 'flag:lyre', l: L(['lys', 'L’Harmonium de Nivalis. Je n’ai jamais rien entendu d’aussi juste, et j’ai beaucoup entendu.']) }
  );
  dlg('cendre_forgeron', { c: 'ch>=5', l: L(['forgeron', 'Cendrix forgeait les armes des rois. Maintenant il forge ses propres chaînes.']) });
  dlg('final_vieux', { c: 'ch>=6', l: L(['vieux', 'La Tour a poussé en une nuit, comme une dent qui perce.']) });

  /* intérieurs */
  dlg('roi_audience', {
    c: 'ch=1', l: L(
      ['', 'La grande salle d’Aurélia. Les bannières sentent la cire et l’inquiétude.'],
      ['roi', 'Arno. Le cristal de Sève perd sa couleur. Toi et deux cavaliers, vous descendrez au Sanctuaire.'],
      ['arno', 'Et Kael, sire ?'],
      ['roi', 'Kael a été relevé de son serment. Il garde la porte nord. …Il garde surtout la porte nord.'])
  }, {
    c: 'ch>=2', l: L(['roi', 'Le royaume saigne par quatre plaies. Vous êtes le fil. Allez, et revenez avec la lumière.'])
  }, {
    c: 'ch>=6', l: L(['roi', 'Nous n’avons plus de soldats, Arno. Nous avons vous.'])
  });
  dlg('roi_prie', { l: L(['roi', 'Quand tout sera fini, rappelez-moi que j’ai promis de réduire les impôts. J’aurai oublié.']) });
  dlg('sanctuaire_pretre', { l: L(['pretre', 'Le cristal ne meurt pas : on l’étrangle. Sentez la vase, elle a un goût de fer.']) });
  dlg('auberge_lits', { l: L(['aubergiste', 'Le feu est pris. Les monstres n’entrent pas tant que la cloche du porche sonne.']) });

  /* ---------------- scènes scénarisées ---------------- */
  var SC = D.SCENES = {};
  function scene(id, steps) { SC[id] = steps; }

  scene('intro', [
    { s: 'title' },
    { s: 'say', t: 'Quatre cristaux portaient le monde sur leur dos de lumière.\nOn ne les a pas volés. On les a laissés s’éteindre.' },
    { s: 'say', t: 'Royaume d’Aurélia — septième nuit de brume basse.' },
    { s: 'map', to: 'aurelia', x: 12, y: 17 },
    { s: 'heal' },
    { s: 'say', who: 'arno', t: 'La porte de la grande salle est ouverte. Le roi n’ouvre jamais sa porte.' },
    { s: 'scene', to: 'dlg:roi_audience' },
    { s: 'flag', k: 'introDone' },
    { s: 'say', who: 'myrelle', t: 'Le Sanctuaire est au nord-est. J’y ai appris mes prières, je connais les marches par cœur.' },
    { s: 'end' }
  ]);

  scene('sanctuaire1', [
    { s: 'say', t: 'Sanctuaire de la Sève. Le cristal bat comme un cœur malade.' },
    { s: 'battle', foes: ['croc-boue'], bg: 'cave', music: 'boss', on: 'win:after' },
    { s: 'label', k: 'after' },
    { s: 'say', who: 'myrelle', t: 'Il respire encore ! Mais regardez — la racine est noire, on l’a empoisonnée.' },
    { s: 'give', it: 'clé rouillée', n: 1 },
    { s: 'flag', k: 'sanctuaire' },
    { s: 'chapter', n: 1.5 },
    { s: 'heal' },
    { s: 'say', who: 'arno', t: 'Cette clé… c’est celle de la porte nord. Kael garde la porte nord.' },
    { s: 'map', to: 'aurelia', x: 12, y: 17 },
    { s: 'scene', to: 'dlg:trahison' },
    { s: 'end' }
  ]);

  scene('trahison', [
    { s: 'say', t: 'Porte nord. La herse est levée, les gardes sont à genoux.' },
    { s: 'move', who: 'npc_kael', dx: 0, dy: -2 },
    { s: 'say', who: 'kael', t: 'Ne me retiens pas, Arno. J’ai des ordres qui valent mieux que nos serments.' },
    { s: 'say', who: 'arno', t: 'Tu prends le cristal de Sève ?' },
    { s: 'say', who: 'kael', t: 'Je le porte à qui saura l’éteindre proprement. C’est un acte de piété. Demande à Myrelle.' },
    { s: 'battle', foes: ['kael1'], bg: 'town', music: 'boss', on: 'win:two' },
    { s: 'label', k: 'two' },
    { s: 'say', who: 'kael', t: '…Tu tiens comme ton père. Vaux vous attend à Pyrite. Courez, vous arriverez à temps pour un enterrement.' },
    { s: 'leave', who: 'kael' },
    { s: 'flag', k: 'trahi' },
    { s: 'job', j: 'war' },
    { s: 'say', who: 'myrelle', t: 'Le Cristal du Savoir s’est ouvert au fond du sanctuaire. Les emplois oubliés peuvent revenir en vous.' },
    { s: 'heal' },
    { s: 'chapter', n: 2 },
    { s: 'end' }
  ]);

  scene('mine1', [
    { s: 'say', t: 'Galerie nord des Mines de Pyrite. Le noir est épais comme de l’huile.' },
    { s: 'give', it: 'lanterne', n: 1 },
    { s: 'flag', k: 'lanterne' },
    { s: 'say', who: 'mineur', t: 'Vous avez la lampe… Mon fils est au troisième, avec la Gargouille. Sauvez-le et je vous ouvre la salle du soufflet.' },
    { s: 'flag', k: 'mineEnfant' },
    { s: 'end' }
  ]);
  scene('gargouille', [
    { s: 'battle', foes: ['gargouille'], bg: 'mine', music: 'boss', on: 'win:a' },
    { s: 'label', k: 'a' },
    { s: 'say', who: 'gault', t: 'Elle gardait les hommes, pas l’or. Regardez : les cages étaient pleines.' },
    { s: 'heal' },
    { s: 'flag', k: 'gargouille' },
    { s: 'end' }
  ]);
  scene('vaux', [
    { s: 'say', t: 'Salle du soufflet. Vaux compte ses cailloux sur une table de marbre.' },
    { s: 'battle', foes: ['vaux', 'impveine'], bg: 'mine', music: 'boss', on: 'win:a' },
    { s: 'label', k: 'a' },
    { s: 'say', who: 'vaux', t: 'Un cristal, quatre seigneurs… Vous croyez que je choisis le camp qui gagne ? Je choisis celui qui paie.' },
    { s: 'give', it: 'clé d’azur', n: 1 },
    { s: 'flag', k: 'vaux' },
    { s: 'job', j: 'ranger' },
    { s: 'heal' },
    { s: 'chapter', n: 3 },
    { s: 'end' }
  ]);
  scene('epave', [
    { s: 'battle', foes: ['nereide'], bg: 'sea', music: 'boss', on: 'win:a' },
    { s: 'label', k: 'a' },
    { s: 'say', who: 'sica', t: 'Elle avait ma bague. Celle que je volais à tout le port. Elle me l’a rendue, c’est pire.' },
    { s: 'flag', k: 'nereide' },
    { s: 'join', who: 'lys' },
    { s: 'say', who: 'lys', t: 'Vous avez retrouvé l’Harmonium dans la cale. Bon. Je viens. C’est très simple, je chante, vous ne mourez pas.' },
    { s: 'job', j: 'bard' },
    { s: 'heal' },
    { s: 'end' }
  ]);
  scene('leviathan', [
    { s: 'say', t: 'Le havre se soulève. Une colonne d’eau monte jusqu’aux nuages.' },
    { s: 'battle', foes: ['leviathan'], bg: 'sea', music: 'boss', on: 'win:a' },
    { s: 'label', k: 'a' },
    { s: 'say', who: 'myrelle', t: 'Il ne veut pas nous tuer. Il veut qu’on lui rende ce qu’on lui a pris.' },
    { s: 'give', it: 'cloche', n: 1 },
    { s: 'summon', k: 'kraken' },
    { s: 'flag', k: 'leviathan' },
    { s: 'chapter', n: 4 },
    { s: 'heal' },
    { s: 'end' }
  ]);
  scene('gelignard', [
    { s: 'battle', foes: ['gelignard'], bg: 'ice', music: 'boss', on: 'win:a' },
    { s: 'label', k: 'a' },
    { s: 'say', who: 'gault', t: 'Le bal est fini. Trois cents ans, et le dernier morceau n’a jamais été joué.' },
    { s: 'flag', k: 'gelignard' },
    { s: 'job', j: 'monk' },
    { s: 'heal' },
    { s: 'end' }
  ]);
  scene('boree', [
    { s: 'say', t: 'Pic de Borée. Quatre chaînes noires tiennent un esprit du vent au sommet.' },
    { s: 'battle', foes: ['borhee'], bg: 'sky', music: 'boss', on: 'win:a' },
    { s: 'label', k: 'a' },
    { s: 'summon', k: 'boree' },
    { s: 'say', who: 'lys', t: 'Il nous remercie en nous arrachant les cheveux. C’est sa façon.' },
    { s: 'flag', k: 'boree' },
    { s: 'heal' },
    { s: 'chapter', n: 5 },
    { s: 'end' }
  ]);
  scene('cendrix', [
    { s: 'battle', foes: ['cendrix'], bg: 'lava', music: 'boss', on: 'win:a' },
    { s: 'label', k: 'a' },
    { s: 'say', who: 'forgeron', t: 'Le Sceau des Quatre est dans la nacelle. La nacelle est dans le ciel. Vous avez les deux mains libres, maintenant.' },
    { s: 'give', it: 'sceau', n: 1 },
    { s: 'give', it: 'nacelle', n: 1 },
    { s: 'ship' },
    { s: 'flag', k: 'cendrix' },
    { s: 'job', j: 'dragoon' },
    { s: 'chapter', n: 6 },
    { s: 'heal' },
    { s: 'end' }
  ]);
  scene('archonte', [
    { s: 'say', t: 'Le sommet de la Tour Obsidienne. Quatre visages de pierre vous tournent autour.' },
    { s: 'battle', foes: ['archonte'], bg: 'tower', music: 'boss', on: 'win:a' },
    { s: 'label', k: 'a' },
    { s: 'say', who: 'myrelle', t: 'Les quatre cristaux sont là. Ils sont… dans son ventre. Il les a bus.' },
    { s: 'heal' },
    { s: 'flag', k: 'archonte' },
    { s: 'job', j: 'sage' },
    { s: 'end' }
  ]);
  scene('kael_final', [
    { s: 'say', t: 'Kael est à genoux devant la cage des cristaux. Les chaînes sont les siennes.' },
    { s: 'battle', foes: ['kael2'], bg: 'tower', music: 'boss', on: 'win:a' },
    { s: 'label', k: 'a' },
    { s: 'say', who: 'kael', t: 'Je lui ai donné Sève pour qu’il ne prenne pas les trois autres. J’ai calculé. Le calcul était faux.' },
    { s: 'say', who: 'arno', t: 'Tiens bon. On finit, et on rentre. Tous les deux.' },
    { s: 'join', who: 'kael' },
    { s: 'heal' },
    { s: 'revive' },
    { s: 'end' }
  ]);
  scene('final', [
    { s: 'say', t: 'Nyxaré se lève. La lumière du monde tient dans quatre mains fermées.' },
    { s: 'battle', foes: ['nyxare'], bg: 'tower', music: 'boss', on: 'win:a' },
    { s: 'label', k: 'a' },
    { s: 'say', t: 'Le Dévoreur se plie, se fissure, et rend ce qu’il avait. La lumière remonte comme une marée.' },
    { s: 'fade', to: 1 },
    { s: 'say', t: 'Au printemps, Aurélia a replanté les vergers autour du Sanctuaire.\nOn a gravé quatre noms sur la porte nord. Le cinquième a été ajouté plus tard, à la demande générale.' },
    { s: 'say', t: 'FIN — merci d’avoir joué.' },
    { s: 'flag', k: 'ending' },
    { s: 'credits' },
    { s: 'end' }
  ]);
  scene('dream', [
    { s: 'battle', foes: ['dreamer'], bg: 'dream', music: 'boss', on: 'win:a' },
    { s: 'label', k: 'a' }, { s: 'heal' }, { s: 'end' }
  ]);
  scene('secret', [
    { s: 'battle', foes: ['momor'], bg: 'dream', music: 'boss', on: 'win:a' },
    { s: 'label', k: 'a' },
    { s: 'say', t: 'Momon Étoillé hoche lentement la tête. Il vous donne une couleur qu’aucun nom ne porte.' },
    { s: 'give', it: 'elixir', n: 3 }, { s: 'flag', k: 'secret' }, { s: 'heal' }, { s: 'end' }
  ]);

  /* dialogues de fin de quête annexe */
  dlg('quete_bague',
    { c: 'noflag:bague', l: L(['vielle', 'Un voleur m’a pris ma bague de noce. Si vous le croisez… dites-lui que je ne l’ai jamais donnée.']) },
    { c: 'flag:bague', l: L(['vielle', 'Vous… vous me la rendez ? Mon mari la cherchait depuis quarante ans.']) }
  );
  dlg('quete_mineur',
    { c: 'flag:mineEnfant', l: L(['mineur', 'Mon fils tient debout. Tenez, ma vieille hache : elle a coupé du cristal, elle coupera pire.']) },
    { c: 'noflag:mineEnfant', l: L(['mineur', 'La galerie nord a mangé mon fils. Je n’ai plus de lampe pour y descendre.']) }
  );
  D.STARTSCENE = 'intro';
})(this.FF = this.FF || {});
