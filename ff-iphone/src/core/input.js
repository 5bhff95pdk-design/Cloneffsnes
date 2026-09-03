/* ============================================================
   Input — clavier, tactile (D-pad virtuel), manette MFi/XInput
   ============================================================ */
(function (FF) {
  'use strict';
  var I = FF.In = {};
  var K = I.keys = { up: 0, down: 0, left: 0, right: 0, a: 0, b: 0, menu: 0, turbo: 0, l: 0, r: 0 };
  var pressed = {}, held = {}, repeatT = {}, buffer = [];
  var MAP = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right',
    KeyZ: 'a', Enter: 'a', Space: 'a', NumpadEnter: 'a',
    KeyX: 'b', Escape: 'b', Backspace: 'b',
    KeyM: 'menu', Tab: 'menu', KeyQ: 'l', KeyE: 'r', ShiftLeft: 'turbo'
  };
  I.turbo = false;

  I.init = function () {
    if (typeof window === 'undefined' || !window.addEventListener) return;
    window.addEventListener('keydown', function (e) {
      var k = MAP[e.code];
      if (k) { e.preventDefault(); if (!K[k]) press(k); K[k] = 1; }
    });
    window.addEventListener('keyup', function (e) {
      var k = MAP[e.code];
      if (k) { e.preventDefault(); K[k] = 0; }
    });
    // boutons tactiles
    document.querySelectorAll('#touch [data-k]').forEach(function (btn) {
      var k = btn.getAttribute('data-k');
      var down = function (e) { e.preventDefault(); if (!K[k]) press(k); K[k] = 1; btn.classList.add('on'); };
      var up = function (e) { e.preventDefault(); K[k] = 0; btn.classList.remove('on'); };
      btn.addEventListener('touchstart', down, { passive: false });
      btn.addEventListener('touchend', up, { passive: false });
      btn.addEventListener('touchcancel', up, { passive: false });
      btn.addEventListener('mousedown', down);
      btn.addEventListener('mouseup', up);
      btn.addEventListener('mouseleave', up);
    });
    // glisser sur le D-pad = direction analogique
    var dpad = document.getElementById('dpad');
    if (dpad) {
      var dirsBtns = [].slice.call(dpad.querySelectorAll('.dbtn'));
      var move = function (e) {
        var t = e.touches ? e.touches[0] : e;
        if (!t) return;
        var r = dpad.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = t.clientX - cx, dy = t.clientY - cy;
        var dead = r.width * 0.12;
        var set = { up: 0, down: 0, left: 0, right: 0 };
        if (Math.abs(dx) > dead) set[dx > 0 ? 'right' : 'left'] = 1;
        if (Math.abs(dy) > dead) set[dy > 0 ? 'down' : 'up'] = 1;
        dirsBtns.forEach(function (b) {
          var kk = b.getAttribute('data-k');
          if (set[kk] && !K[kk]) press(kk);
          K[kk] = set[kk];
          b.classList.toggle('on', !!set[kk]);
        });
      };
      dpad.addEventListener('touchstart', move, { passive: false });
      dpad.addEventListener('touchmove', function (e) { e.preventDefault(); move(e); }, { passive: false });
      dpad.addEventListener('touchend', function (e) {
        e.preventDefault();
        ['up', 'down', 'left', 'right'].forEach(function (k) { K[k] = 0; });
        dirsBtns.forEach(function (b) { b.classList.remove('on'); });
      }, { passive: false });
      dpad.addEventListener('mousedown', function (e) {
        var mv = function (ev) { move(ev); };
        window.addEventListener('mousemove', mv);
        window.addEventListener('mouseup', function () {
          window.removeEventListener('mousemove', mv);
          ['up', 'down', 'left', 'right'].forEach(function (k) { K[k] = 0; });
          dirsBtns.forEach(function (b) { b.classList.remove('on'); });
        }, { once: true });
      });
    }
    // tap sur le canvas = valider / avancer le dialogue
    var cv = document.getElementById('game');
    if (cv) cv.addEventListener('pointerdown', function (e) {
      if (FF.Game && FF.Game.onScreenTap) FF.Game.onScreenTap(e);
    });
    window.addEventListener('blur', function () { for (var k in K) K[k] = 0; });
  };

  function press(k) {
    if (!pressed[k]) { pressed[k] = 1; buffer.push(k); if (buffer.length > 8) buffer.shift(); }
    if (FF.Snd) FF.Snd.play('cursor');
  }

  I.update = function (dt) {
    var gp = I.gamepad();
    if (gp) {
      var ax = gp.axes[0] || 0, ay = gp.axes[1] || 0, b = gp.buttons;
      var st = function (i) { return b[i] && (b[i].pressed || b[i].value > 0.5); };
      var set = {
        up: ay < -0.45 || st(12), down: ay > 0.45 || st(13),
        left: ax < -0.45 || st(14), right: ax > 0.45 || st(15),
        a: st(0), b: st(1), menu: st(9), turbo: I.turbo, l: st(4), r: st(5)
      };
      for (var k in set) {
        if (set[k] && !K[k]) press(k);
        K[k] = set[k] ? 1 : (K[k] && document.querySelector('[data-k="' + k + '"]').classList.contains('on') ? 1 : 0);
      }
    }
    for (var kk in K) {
      if (K[kk]) { held[kk] = 1; repeatT[kk] = (repeatT[kk] || 0) + dt; }
      else { held[kk] = 0; repeatT[kk] = 0; }
    }
  };
  I.gamepad = function () {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
    var p = navigator.getGamepads();
    for (var i = 0; i < p.length; i++) if (p[i] && p[i].connected) return p[i];
    return null;
  };

  I.down = function (k) { return !!K[k]; };
  I.force = function (k) { K[k] = 1; pressed[k] = 1; if (typeof setTimeout === 'function') setTimeout(function () { K[k] = 0; }, 16); };
  /** impulsion fraiche, avec auto-repeat pour les menus */
  I.tap = function (k, repeat) {
    if (pressed[k]) return true;
    if (repeat && K[k] && repeatT[k] > (repeat[0] || 0.32) && ((repeatT[k] - (repeat[0] || 0.32)) % (repeat[1] || 0.11)) < 0.02) return true;
    return false;
  };
  I.pressed = function (k) { return !!pressed[k]; };
  I.anyPress = function () { return pressed.a || pressed.b || pressed.menu; };
  /** vide la liste des impulsions (à appeler une fois par frame, à la fin) */
  I.endFrame = function () { for (var k in pressed) pressed[k] = 0; buffer.length = 0; };
  I.dir = function () {
    if (K.up) return 'up'; if (K.down) return 'down';
    if (K.left) return 'left'; if (K.right) return 'right';
    return null;
  };
  I.setTurbo = function (v) { I.turbo = v; };
})(this.FF = this.FF || {});
