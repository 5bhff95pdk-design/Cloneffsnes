/* Harn de jeu : lance le jeu, journalise les erreurs, joue quelques actions, capture des images. */
const { chromium } = require('playwright');
const fs = require('fs');

const URL = process.env.GAME_URL || 'http://127.0.0.1:4178/ff-iphone/index.html';
const STEPS = (process.env.STEPS || 'title,new,walk,menu,talk,save').split(',');
const OUT = process.env.SHOTS || '/home/user/shots';
fs.mkdirSync(OUT, { recursive: true });

const errs = [];
function shot(page, name) { return page.screenshot({ path: `${OUT}/${name}.png` }).catch(() => { }); }

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 780, height: 520 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('PAGEERROR: ' + (e.stack || e.message)));
  page.on('console', m => {
    const t = m.text();
    if (m.type() === 'error' || m.type() === 'warning' || /Erreur|Erreur/.test(t)) errs.push('CONSOLE: ' + t);
    else if (process.env.VERBOSE) console.log('  log:', t);
  });
  page.on('requestfailed', r => errs.push('REQFAIL: ' + r.url()));

  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(700);

  // état initial
  const boot = await page.evaluate(() => ({
    ff: Object.keys(window.FF || {}),
    err: window.FF && FF.Game ? String(FF.Game.error && FF.Game.error.message || '') : '',
    state: window.FF && FF.Game ? FF.Game.state : null,
  }));
  console.log('boot:', JSON.stringify(boot));

  // on clique pour démarrer (débloque l'audio)
  await page.mouse.click(390, 260).catch(() => { });
  await page.waitForTimeout(400);
  await page.keyboard.press('KeyZ');
  await page.waitForTimeout(400);
  await shot(page, '01-titre');

  const diag = await page.evaluate(() => {
    const F = window.FF || {};
    return {
      state: F.Game && F.Game.state,
      fontReady: !!(F.Font && F.Font.ready),
      themes: F.Bake && F.Bake.themes ? Object.keys(F.Bake.themes) : null,
      maps: F.D && F.D.MAPS ? Object.keys(F.D.MAPS).length : 0,
      dungeons: F.Dun && F.Dun.maps ? Object.keys(F.Dun.maps).length : -1,
      enemies: F.Assets && F.Assets.enemy ? Object.keys(F.Assets.enemy).length : 0,
      heroKeys: F.Assets && F.Assets.hero ? Object.keys(F.Assets.hero).join(',') : '',
      npcKeys: F.Assets && F.Assets.npc ? Object.keys(F.Assets.npc).length : 0,
      items: F.D && F.D.IT ? Object.keys(F.D.IT).length : 0,
      jobs: F.D && F.D.JOBS ? Object.keys(F.D.JOBS).length : 0,
    };
  });
  console.log('diag:', JSON.stringify(diag));

  const doStep = async (s) => {
    if (s === 'new') {
      await page.evaluate(() => { FF.Game.newGame(); });
      await page.waitForTimeout(1400);
      await shot(page, '02-intro');
      /* avancer dans la scène d'intro */
      for (let i = 0; i < 26; i++) { await page.keyboard.press('KeyZ'); await page.waitForTimeout(90); }
      await shot(page, '03-apres-intro');
    }
    if (s === 'walk') {
      await page.evaluate(() => { FF.Game.noEnc = true; FF.Wld.enter('aurelia', 15, 20, 'down'); });
      await page.waitForTimeout(300);
      for (const k of ['ArrowLeft', 'ArrowLeft', 'ArrowUp', 'ArrowRight']) {
        await page.keyboard.down(k); await page.waitForTimeout(220); await page.keyboard.up(k);
      }
      await page.waitForTimeout(200);
      await shot(page, '04-ville');
    }
    if (s === 'talk') {
      await page.evaluate(() => { FF.In.force('a'); });
      await page.waitForTimeout(500);
      await shot(page, '05-dialogue');
      for (let i = 0; i < 6; i++) { await page.keyboard.press('KeyZ'); await page.waitForTimeout(120); }
    }
    if (s === 'menu') {
      await page.keyboard.press('KeyX');
      await page.waitForTimeout(300);
      await shot(page, '06-menu');
      await page.keyboard.press('KeyZ');           /* objets */
      await page.waitForTimeout(250);
      await shot(page, '07-objets');
      await page.keyboard.press('KeyX'); await page.waitForTimeout(120);
      await page.keyboard.press('KeyX'); await page.waitForTimeout(120);
      await page.keyboard.press('KeyX'); await page.waitForTimeout(120);
    }
    if (s === 'shop') {
      await page.evaluate(() => { FF.UI.shop('aurelia', 'obj', { n: 'Boutique d’Aurelia' }); });
      await page.waitForTimeout(300);
      await shot(page, '08-boutique');
      await page.evaluate(() => { FF.UI.close(); });
    }
    if (s === 'battle') {
      await page.evaluate(() => {
        FF.Game.battle({ foes: [{ id: 'slime', lv: 3 }, { id: 'chienG', lv: 4 }], music: 'battle', name: 'Rencontre' });
      });
      await page.waitForTimeout(900);
      await shot(page, '09-combat');
      for (let i = 0; i < 40; i++) {
        await page.evaluate(() => { FF.In.force('a'); });
        await page.waitForTimeout(220);
      }
      await shot(page, '10-combat-suite');
    }
    if (s === 'save') {
      await page.evaluate(() => { FF.Game.noEnc = true; FF.Wld.enter('aurelia', 15, 20, 'down'); FF.UI.saveScreen('save'); });
      await page.waitForTimeout(300);
      await shot(page, '11-save');
      await page.keyboard.press('KeyZ');
      await page.waitForTimeout(300);
      const meta = await page.evaluate(() => FF.Save.meta('1'));
      console.log('meta après sauvegarde:', JSON.stringify(meta));
      await page.keyboard.press('KeyX');
    }
    if (s === 'crystal') {
      await page.evaluate(() => { FF.UI.crystal(); });
      await page.waitForTimeout(400);
      await shot(page, '12-cristal');
    }
  };
  for (const s of STEPS) { try { await doStep(s); } catch (e) { errs.push('STEP ' + s + ': ' + e.message); } }

  const snap = await page.evaluate(() => {
    const S = FF.S;
    return {
      state: FF.Game.state, party: S.order.map(id => { const m = S.members[id]; return m.n + ' n' + m.lv + ' ' + m.hp + '/' + m.stats.pv + ' ' + m.job; }),
      gil: S.gil, steps: S.steps, map: FF.Wld.map && FF.Wld.map.id, flags: Object.keys(S.flags).length,
      inv: S.invList(['inv','gear','key']).length, gil: S.gils,
    };
  }).catch(e => ({ err: e.message }));
  console.log('snap:', JSON.stringify(snap));
  console.log('ERREURS (' + errs.length + '):');
  errs.slice(0, 30).forEach(e => console.log('  - ' + e));
  await browser.close();
  process.exit(errs.length ? 1 : 0);
})().catch(e => { console.error('HARNESS:', e); process.exit(2); });
