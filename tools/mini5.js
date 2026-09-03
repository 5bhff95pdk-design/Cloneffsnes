/* Balayage complet des écrans (format au choix) -> shots/y-*.png
   Usage: VW=844 VH=390 node tools/mini5.js  */
const { chromium } = require('playwright');
require('fs').mkdirSync('/home/user/shots', { recursive: true });
const vw = +(process.env.VW || 844), vh = +(process.env.VH || 390);
const DSF = +(process.env.DSF || 2), TAG = process.env.TAG || 'L';
const errs = [];
(async () => {
  const br = await chromium.launch();
  const p = await br.newPage({ viewport: { width: vw, height: vh, isMobile: true, deviceScaleFactor: DSF } });
  p.on('pageerror', e => errs.push('PE ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')));
  p.on('console', m => { if (m.type() === 'error') errs.push('CE ' + m.text().slice(0, 140)); });
  await p.goto('http://127.0.0.1:4178/ff-iphone/index.html', { waitUntil: 'load' });
  await p.waitForTimeout(500);
  await p.mouse.click(Math.round(vw / 2), Math.round(vh * .5));
  await p.waitForFunction(() => window.FF && FF.Game && FF.Game.state === 'field', null, { timeout: 20000 });
  /* purge : dialogues, scènes, musiques en attente */
  await p.evaluate(() => {
    FF.In.pressed = () => false; FF.In.tap = () => false; FF.In.consume = () => false; FF.In.hold = () => 0;
    for (let i = 0; i < 60; i++) { try { FF.UI.closeDialog(); FF.UI.close(); } catch (e) { } }
    try { FF.Wld.cut = null; } catch (e) { }
    FF.Game.modal = null; FF.UI.menu = null; FF.UI.dlg = null;
    FF.S.inv['potion'] = 6; FF.S.inv['ether'] = 2; FF.S.inv['phoenix_du_down'] = 1;
    FF.Game.noEnc = true;
  });
  await p.waitForTimeout(120);
  const shot = async (n) => { await p.waitForTimeout(120); await p.screenshot({ path: `/home/user/shots/y-${TAG}-${n}.png` }); };
  const ev = async (code) => p.evaluate(new Function('return (' + code + ')')());

  await ev(`async () => { FF.UI.openMenu(); }`); await shot('menu');
  await ev(`async () => { FF.UI.close(); FF.UI.openSub('item'); }`); await shot('item');
  await ev(`async () => { FF.UI.close(); FF.UI.openSub('magic'); }`); await shot('magic');
  await ev(`async () => { FF.UI.close(); FF.UI.openSub('equip'); }`); await shot('equip');
  await ev(`async () => { FF.UI.close(); FF.UI.openSub('stat'); }`); await shot('stat');
  await ev(`async () => { FF.UI.close(); FF.UI.openSub('job'); }`); await shot('job');
  await ev(`async () => { FF.UI.close(); FF.UI.partyMenu(); }`); await shot('party');
  await ev(`async () => { FF.UI.close(); FF.UI.config(); }`); await shot('config');
  await ev(`async () => { FF.UI.close(); FF.UI.crystal(); }`); await shot('crystal');
  await ev(`async () => { FF.UI.close(); FF.S.flags.sanctuaire = true; FF.UI.dlgOpt('Un marchand', ['De belles lames, mon ami.', 'Revenez.'], [{ t: 'ACHETER' }, { t: 'VENDRE' }], function () { }); }`); await shot('dlgopt');
  await ev(`async () => { FF.UI.closeDialog(); FF.Bat.start({ foes: ['sable_vif', 'scarabee_de_sable'], onEnd: function () { } }); }`);
  await p.waitForTimeout(2600); await shot('battle0');
  await p.waitForTimeout(2500); await shot('cmd');
  await ev(`async () => { var st = FF.Bat.st; if (!st) return 'nost'; st.mode = 'sub'; st.sub = 'mag'; st.actor = st.allies[0]; st.subIdx = 0; }`);
  await p.waitForTimeout(200); await shot('mag');
  await ev(`async () => { var st = FF.Bat.st; st.mode = 'sub'; st.sub = 'it'; st.actor = st.allies[1]; }`);
  await p.waitForTimeout(200); await shot('obj');
  await ev(`async () => { var st = FF.Bat.st; st.mode = 'target'; st.tgtSide = 'foes'; st.target = 0; }`);
  await p.waitForTimeout(200); await shot('tgt');
  await ev(`async () => { var st = FF.Bat.st; st.mode = 'msg'; st.msg = 'GARDER !'; st.msgT = .5; }`);
  await p.waitForTimeout(120); await shot('msg');
  await ev(`async () => { try { FF.Bat.syncBack(FF.Bat.st); } catch (e) { return 'ERR ' + e.message; } return 'ok'; }`);
  await p.waitForTimeout(150);
  console.log(JSON.stringify(errs.slice(0, 12)));
  await br.close();
})();
