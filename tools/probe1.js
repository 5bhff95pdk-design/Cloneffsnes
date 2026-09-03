/* Sonde ciblée : sort de terrain + auberge */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 780, height: 520 } });
  const errs = [];
  p.on('pageerror', e => errs.push('PE ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')));
  p.on('console', m => { if (m.type() === 'error') errs.push('CE ' + m.text().slice(0, 200)); });
  await p.goto('http://127.0.0.1:4178/ff-iphone/index.html');
  await p.waitForTimeout(900);
  await p.evaluate(() => { FF.Game.boot(document.getElementById('game')); FF.Game.newGame(); FF.Game.noEnc = true; FF.Wld.cut = null; FF.UI.dlg = null; FF.Wld.enter('aurelia', 15, 20, 'down'); FF.S.order.forEach(id => FF.P.giveExp(FF.S.members[id], 6000)); FF.S.allMembers().forEach(m => { FF.P.recalc(m); FF.P.healFull(m); }); });
  const t = async (name, fn) => { try { const r = await p.evaluate(fn); console.log('✓', name, JSON.stringify(r).slice(0, 400)); } catch (e) { console.log('✗', name, e.message.split('\n')[0]); } };

  await t('soin de champ : API', () => {
    const a = FF.S.members.arno, mr = FF.S.members.myrelle;
    mr.hp = 1; a.mp = a.stats.pm;
    const before = { hp: mr.hp, mp: a.mp, castField: typeof FF.UI.castField, useItem: typeof FF.UI.useItem };
    let r;
    try { r = FF.UI.castField(a, FF.D.SP.soin); } catch (e) { r = 'THROW ' + e.message; }
    return { before, after: { hp: mr.hp | 0, mp: a.mp | 0 }, r, dlg: FF.UI.dlg ? FF.UI.dlg.lines : null, menu: FF.UI.menu ? FF.UI.menu.kind : null };
  });
  await t('cible choisie', () => { const m = FF.UI.menu; if (!m) return 'pas de menu'; m.L.onSel(m.L.items ? m.L.items[0] : null); return { hp: FF.S.members.myrelle.hp | 0, mp: FF.S.members.arno.mp | 0, menu: !!FF.UI.menu, dlg: FF.UI.dlg ? FF.UI.dlg.lines : null }; });
  await t('auberge complète', () => {
    FF.UI.close(); FF.UI.closeDialog();
    FF.Wld.enter('inn-aurelia', 6, 6, 'up');
    const bed = (FF.Wld.map.ents || []).find(e => e.t === 'bed');
    if (!bed) return 'pas de lit';
    FF.S.gils = 500; FF.S.order.forEach(i => { FF.S.members[i].hp = 1; FF.S.members[i].mp = 0; });
    FF.Wld.tryInteract(bed, {}, true);
    return { dlg: FF.UI.dlg ? FF.UI.dlg.lines : null, menu: FF.UI.menu ? FF.UI.menu.kind : null, gils: FF.S.gils };
  });
  await t('auberge : fermer le dialogue', () => { FF.UI.closeDialog(); return { menu: FF.UI.menu ? FF.UI.menu.kind : null, items: FF.UI.menu && FF.UI.menu.L ? FF.UI.menu.L.items.map(i => i.t) : null, gils: FF.S.gils }; });
  await t('auberge : payer', () => { const m = FF.UI.menu; if (!m) return 'pas de menu'; m.L.onSel(m.L.items[0]); return { gils: FF.S.gils, hp: FF.S.order.map(i => FF.S.members[i].hp | 0), mp: FF.S.order.map(i => FF.S.members[i].mp | 0), dlg: FF.UI.dlg ? FF.UI.dlg.lines : null }; });
  await t('objet de terrain (potion)', () => {
    FF.UI.closeDialog(); FF.UI.close();
    FF.S.inv['potion'] = 3; const m = FF.S.members[FF.S.order[2]]; m.hp = 5;
    FF.UI.openMenu(); FF.UI.openSub('item');
    const mm = FF.UI.menu; if (!mm) return 'pas de menu';
    const it = mm.L.items.find(x => x.id === 'potion'); mm.L.onSel(it);
    const k = FF.UI.menu; if (k && k.kind === 'use') { k.L.onSel(k.L.items.find(x => x.m === m) || k.L.items[0]); }
    return { hp: m.hp | 0, left: FF.S.inv['potion'], kind: k ? k.kind : null };
  });
  console.log('ERRS', JSON.stringify(errs.slice(0, 6)));
  await b.close();
})();
