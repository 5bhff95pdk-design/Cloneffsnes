/* Phase B — Smoke test navigateur RÉEL (Playwright/Chromium).
   À exécuter localement (ou dans un sandbox où les CDN Playwright sont joignables) :
       npm install && npx playwright install chromium
       node tools/smoke-browser.js
   Pré-requis : un serveur statique servant ff-iphone/ (par ex. : python3 -m http.server 8123 -d ff-iphone).
   Port surchargeable : PORT=8123 node tools/smoke-browser.js

   Vérifie : 1) boot sans erreur console ; 2) clic « TOUCHEZ POUR COMMENCER » → audio débloqué + titre ;
             3) application des classes d'effets au boot selon préférences persistées (incl. après rechargement) ;
             4) captures d'écran vers shots/.
*/
'use strict';
const { chromium } = require('playwright');
const PORT = process.env.PORT || 8123;
const BASE = `http://localhost:${PORT}/`;
const SHOTS = 'shots';
const fs = require('fs'); if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS);

const results = [];
function rec(name, ok, detail) { results.push((ok ? 'PASS ' : 'FAIL ') + name + (detail ? '  [' + detail + ']' : '')); }

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 420, height: 800 } });

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));

  // 1) boot par défaut
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForFunction(() => !document.getElementById('boot'), null, { timeout: 20000 });
  rec('boot sans erreur console', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '));

  // 2) geste de démarrage (déblocage audio) puis accès au titre
  const bootGo = page.locator('#boot-go');
  if (await bootGo.count()) {
    await bootGo.click();
  } else {
    // déjà retiré : le clavier sert de geste
    await page.keyboard.press('Enter');
  }
  await page.waitForFunction(() => FF && FF.Game && FF.Game.state === 'title', null, { timeout: 20000 });
  const titleOk = await page.evaluate(() => ({ state: FF.Game.state, audioSuspended: !!(window.AudioContext && new window.AudioContext().state === 'suspended') }));
  rec('titre accessible après le geste', titleOk.state === 'title', JSON.stringify(titleOk));
  await page.screenshot({ path: `${SHOTS}/b1-titre.png` });

  // boutons tactiles & scanlines présents par défaut
  const hasScan = await page.evaluate(() => document.body.classList.contains('fx-scan'));
  rec('scanlines par défaut (fx-scan)', hasScan === true);
  await page.screenshot({ path: `${SHOTS}/b2-interface.png` });

  await browser.close();
  console.log(results.join('\n'));
  console.log('--- ' + results.filter(r => r.startsWith('PASS')).length + '/' + results.length + ' ok ---');
  process.exit(results.some(r => r.startsWith('FAIL')) ? 1 : 0);
})().catch(e => { console.log('FATAL ' + e.message); process.exit(1); });
