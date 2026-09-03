/* ============================================================
   Snd — moteur audio chiptune 100% synthétisé (aucun asset)
   4 canaux : lead, contre-chant, basse, batterie + SFX
   ============================================================ */
(function (FF) {
  'use strict';
  var U = FF.U;
  var S = FF.Snd = {};

  var AC = null, master = null, mus = null, sfxBus = null, noiseBuf = null;
  var state = { track: null, loop: true, nextBeat: 0, beat: 0, t0: 0, timer: null, vol: 0.6, musVol: 0.5, sfxVol: 0.9, muted: false };
  S.settings = state;

  S.init = function () {
    if (AC || typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return false;
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      AC = new Ctor();
      master = AC.createGain(); master.gain.value = state.vol; master.connect(AC.destination);
      mus = AC.createGain(); mus.gain.value = state.musVol; mus.connect(master);
      sfxBus = AC.createGain(); sfxBus.gain.value = state.sfxVol; sfxBus.connect(master);
      var len = AC.sampleRate * 0.4, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      noiseBuf = buf;
      S.loadPrefs();
      return true;
    } catch (e) { return false; }
  };
  S.resume = function () { if (!AC) S.init(); if (AC && AC.state === 'suspended') AC.resume(); };
  S.loadPrefs = function () {
    var p = U.store.get('q4c.audio', null);
    if (p) { state.muted = !!p.muted; state.vol = p.vol != null ? p.vol : 0.6; state.musVol = p.musVol != null ? p.musVol : 0.5; state.sfxVol = p.sfxVol != null ? p.sfxVol : 0.9; }
    if (AC) { master.gain.value = state.muted ? 0 : state.vol; mus.gain.value = state.musVol; sfxBus.gain.value = state.sfxVol; }
  };
  S.savePrefs = function () { U.store.set('q4c.audio', { muted: state.muted, vol: state.vol, musVol: state.musVol, sfxVol: state.sfxVol }); };
  S.setVol = function (k, v) { state[k] = v; if (AC) { if (k === 'vol') master.gain.value = state.muted ? 0 : v; if (k === 'musVol') mus.gain.value = v; if (k === 'sfxVol') sfxBus.gain.value = v; } S.savePrefs(); };
  S.toggleMute = function () { state.muted = !state.muted; if (AC) master.gain.value = state.muted ? 0 : state.vol; S.savePrefs(); return state.muted; };

  /* ---------- primitives ---------- */
  function N(v) { // "A4", "C#5", "Db3", "—"
    if (v == null || v === '-' || v === '') return 0;
    if (typeof v === 'number') return 440 * Math.pow(2, (v - 69) / 12);
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(String(v).trim());
    if (!m) return 0;
    var base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
    var semi = base + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    var midi = (parseInt(m[3], 10) + 1) * 12 + semi;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function tone(o) {
    if (!AC || state.muted) return;
    var t = o.t != null ? o.t : AC.currentTime;
    var dur = o.dur || 0.2, g = AC.createGain(), osc = AC.createOscillator();
    osc.type = o.wave || 'square';
    osc.frequency.setValueAtTime(Math.max(20, o.f || 440), t);
    if (o.sl) osc.frequency.exponentialRampToValueAtTime(Math.max(20, (o.f || 440) * o.sl), t + dur);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + dur);
    var v = o.v == null ? 0.22 : o.v;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + Math.min(0.02, dur * 0.2));
    if (o.dec === false) g.gain.setValueAtTime(v, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    osc.connect(g);
    var dest = o.dest || sfxBus;
    if (o.echo && AC) {
      var dl = AC.createDelay(0.6); dl.delayTime.value = o.echo;
      var fb = AC.createGain(); fb.gain.value = 0.32;
      var wet = AC.createGain(); wet.gain.value = 0.35;
      g.connect(dest); g.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(dest);
    } else g.connect(dest);
    osc.start(t); osc.stop(t + dur + 0.02);
  }
  function noise(o) {
    if (!AC || state.muted) return;
    var t = o.t != null ? o.t : AC.currentTime, dur = o.dur || 0.15;
    var src = AC.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    var bp = AC.createBiquadFilter(); bp.type = o.type || 'highpass'; bp.frequency.setValueAtTime(o.f || 1200, t);
    if (o.f2) bp.frequency.exponentialRampToValueAtTime(Math.max(40, o.f2), t + dur);
    bp.Q.value = o.q || 1;
    var g = AC.createGain();
    g.gain.setValueAtTime(o.v == null ? 0.3 : o.v, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    src.connect(bp); bp.connect(g); g.connect(o.dest || sfxBus);
    src.start(t); src.stop(t + dur + 0.02);
  }

  /* ---------- SFX ---------- */
  var SFX = {
    cursor: function () { tone({ f: 880, f2: 1180, dur: .05, v: .13, wave: 'square' }); },
    ok: function () { tone({ f: 660, dur: .05, v: .16 }); tone({ f: 990, t: AC && AC.currentTime + .05, dur: .09, v: .15 }); },
    cancel: function () { tone({ f: 520, f2: 300, dur: .11, v: .14 }); },
    beep: function () { tone({ f: 1320, dur: .06, v: .12 }); },
    open: function () { noise({ f: 400, f2: 2400, dur: .18, v: .18, type: 'bandpass', q: 1.5 }); tone({ f: 520, f2: 900, dur: .18, v: .1, wave: 'triangle' }); },
    chest: function () { [880, 1170, 1560].forEach(function (f, i) { tone({ f: f, t: AC.currentTime + i * .07, dur: .18, v: .14, wave: 'triangle' }); }); },
    step: function () { noise({ f: 300, dur: .035, v: .045, type: 'lowpass' }); },
    hit: function () { noise({ f: 1400, f2: 300, dur: .13, v: .32 }); tone({ f: 240, f2: 90, dur: .12, v: .2, wave: 'sawtooth' }); },
    slash: function () { noise({ f: 2600, f2: 900, dur: .1, v: .26, type: 'bandpass', q: .8 }); },
    miss: function () { noise({ f: 1800, f2: 3200, dur: .13, v: .14, type: 'bandpass' }); },
    heal: function () { [523, 659, 784, 1046].forEach(function (f, i) { tone({ f: f, t: AC.currentTime + i * .06, dur: .3, v: .12, wave: 'triangle', echo: .12 }); }); },
    magic: function () { tone({ f: 300, f2: 2400, dur: .28, v: .16, wave: 'sawtooth', echo: .1 }); noise({ f: 900, f2: 4000, dur: .3, v: .12, type: 'bandpass' }); },
    fire: function () { noise({ f: 500, f2: 200, dur: .35, v: .3, type: 'lowpass' }); tone({ f: 120, f2: 60, dur: .3, v: .18, wave: 'sawtooth' }); },
    ice: function () { [1600, 2100, 2600].forEach(function (f, i) { tone({ f: f, t: AC.currentTime + i * .05, dur: .22, v: .1, wave: 'square', dec: false }); }); noise({ f: 5000, dur: .2, v: .07, type: 'highpass' }); },
    thunder: function () { noise({ f: 3000, f2: 200, dur: .4, v: .34 }); tone({ f: 80, dur: .3, v: .2, wave: 'square' }); },
    revive: function () { [392, 523, 659, 784, 1046].forEach(function (f, i) { tone({ f: f, t: AC.currentTime + i * .08, dur: .4, v: .13, wave: 'triangle', echo: .13 }); }); },
    flee: function () { tone({ f: 900, f2: 200, dur: .4, v: .14, wave: 'square' }); },
    level: function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone({ f: f, t: AC.currentTime + i * .09, dur: .5, v: .16, wave: 'square' }); }); },
    death: function () { tone({ f: 400, f2: 40, dur: .8, v: .2, wave: 'sawtooth' }); noise({ f: 800, f2: 100, dur: .7, v: .18 }); },
    gil: function () { tone({ f: 1760, dur: .05, v: .1, wave: 'triangle' }); tone({ f: 2350, t: AC.currentTime + .05, dur: .09, v: .09, wave: 'triangle' }); },
    buy: function () { tone({ f: 700, dur: .07, v: .14 }); tone({ f: 1100, t: AC.currentTime + .07, dur: .12, v: .12 }); },
    door: function () { noise({ f: 500, f2: 160, dur: .2, v: .2, type: 'lowpass' }); },
    ship: function () { noise({ f: 220, dur: .5, v: .12, type: 'lowpass' }); },
    fail: function () { tone({ f: 220, f2: 150, dur: .25, v: .18, wave: 'square' }); },
    crystal: function () { [1046, 1318, 1568, 2093].forEach(function (f, i) { tone({ f: f, t: AC.currentTime + i * .12, dur: .9, v: .11, wave: 'triangle', echo: .18 }); }); }
  };
  S.play = function (name) {
    if (!AC || state.muted || !SFX[name]) return;
    try { SFX[name](); } catch (e) { }
  };

  /* ---------- musique ---------- */
  /* format: {bpm, beats, ch:[ {wave,v,dur,notes:[[beat,'C4',len]]} ]} */
  var T = FF.Music = {};
  function seq(str) { // "C4 . E4 G4" -> [[beat, note, len]]
    var toks = String(str).trim().split(/\s+/), out = [], b = 0;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], len = 1;
      if (t.indexOf('_') > 0) { var p = t.split('_'); t = p[0]; len = parseFloat(p[1]); }
      if (t !== '-') out.push([b, t, len]);
      b += len;
    }
    return out;
  }
  function drum(str) { // "k . s . k . s ."
    var toks = String(str).trim().split(/\s+/), out = [], b = 0;
    for (var i = 0; i < toks.length; i++) { out.push([b, toks[i]]); b++; }
    return out;
  }
  var DEF = {
    title: {
      bpm: 78, beats: 32, ch: [
        { wave: 'triangle', v: .12, n: seq('E5_2 - A4_2 C5_2 D5_2 E5_4 - B4_2 C5_2 A4_4 -') },
        { wave: 'square', v: .05, n: seq('B4_4 - - - A4_4 - - - G4_4 - - - F#4_4 - - -') },
        { wave: 'triangle', v: .16, n: seq('E3_8 A2_8 C3_8 D3_8') },
        { n: [] }
      ]
    },
    world: {
      bpm: 132, beats: 32, ch: [
        { wave: 'square', v: .10, n: seq('A4_1 B4_1 C5_1 D5_1 E5_2 - D5_1 C5_1 B4_2 A4_1 G4_1 A4_4 - - E5_1 D5_1 C5_1 B4_1 A4_2 - G4_2 E4_2 A4_4') },
        { wave: 'triangle', v: .07, n: seq('C5_2 E5_2 A5_2 E5_2 C5_2 D5_2 E5_2 G5_2 F5_2 E5_2 D5_2 C5_2 B4_2 C5_2 A4_2 E4_2') },
        { wave: 'triangle', v: .17, n: seq('A2_2 A2_2 E3_2 E3_2 F2_2 F2_2 C3_2 C3_2 G2_2 G2_2 D3_2 D3_2 A2_2 A2_2 E3_2 E3_2') },
        { n: drum('k - h - s - h - k - h - s - h h k - h - s - h - k - s - s -') }
      ]
    },
    town: {
      bpm: 100, beats: 32, ch: [
        { wave: 'triangle', v: .13, n: seq('C5_2 D5_2 E5_4 G5_4 E5_2 D5_2 C5_4 A4_4 D5_2 E5_2 F5_4 E5_4 C5_4 G4_4') },
        { wave: 'square', v: .045, n: seq('E4_4 G4_4 A4_4 G4_4 F4_4 A4_4 C5_4 B4_4') },
        { wave: 'triangle', v: .15, n: seq('C3_4 G2_4 A2_4 E3_4 F2_4 C3_4 G2_4 C3_4') },
        { n: [] }
      ]
    },
    dungeon: {
      bpm: 92, beats: 32, ch: [
        { wave: 'square', v: .075, n: seq('D4_2 F4_2 A4_4 G4_2 F4_2 E4_4 D4_2 C4_2 D4_4 A3_4 - 2') },
        { wave: 'triangle', v: .05, n: seq('F3_8 E3_8 D3_8 C#3_8') },
        { wave: 'triangle', v: .17, n: seq('D2_4 D2_4 A2_4 D2_4 Bb1_4 Bb1_4 F2_4 Bb1_4') },
        { n: drum('- - - - - - - - - - - - - - h - - - - - - - - - - - - - -') }
      ]
    },
    battle: {
      bpm: 158, beats: 32, ch: [
        { wave: 'square', v: .10, n: seq('E4_1 E4_1 G4_1 A4_1 B4_2 A4_1 G4_1 E4_2 D4_1 E4_1 G4_1 A4_2 G4_1 E4_1 D4_2') },
        { wave: 'sawtooth', v: .05, n: seq('C5_2 B4_2 A4_2 G4_2 F5_2 E5_2 D5_2 C5_2') },
        { wave: 'triangle', v: .18, n: seq('E2_1 E2_1 E2_1 E2_1 A2_1 A2_1 A2_1 A2_1 C3_1 C3_1 C3_1 C3_1 G2_1 G2_1 G2_1 G2_1') },
        { n: drum('k h s h k h s h k h s h k k s s') }
      ]
    },
    boss: {
      bpm: 168, beats: 32, ch: [
        { wave: 'sawtooth', v: .09, n: seq('A4_1 C5_1 D5_1 E5_1 F5_2 E5_1 D5_1 C5_1 B4_1 A4_1 G4_1 A4_2 C5_2 E5_2') },
        { wave: 'square', v: .06, n: seq('E5_2 F5_2 G5_4 E5_2 D5_2 C5_4') },
        { wave: 'triangle', v: .19, n: seq('A2_1 A2_1 A2_1 A2_1 F2_1 F2_1 F2_1 F2_1 G2_1 G2_1 G2_1 G2_1 E2_1 E2_1 E2_1 E2_1') },
        { n: drum('k k s h k k s h k k s h k s s h') }
      ]
    },
    victory: {
      bpm: 140, beats: 16, ch: [
        { wave: 'square', v: .14, n: seq('C5_1 C5_1 C5_1 C5_1 D5_1 E5_1 F5_2 E5_1 D5_1 C5_2 G4_2 C5_4') },
        { wave: 'triangle', v: .12, n: seq('E5_2 G5_2 A5_4 G5_2 E5_2 C5_4') },
        { wave: 'triangle', v: .17, n: seq('C3_2 C3_2 G2_2 G2_2 F2_2 F2_2 C3_4') },
        { n: [] }
      ]
    },
    gameover: {
      bpm: 66, beats: 32, ch: [
        { wave: 'triangle', v: .12, n: seq('A4_4 G4_4 F4_4 E4_4 D4_8 C4_8') },
        { wave: 'triangle', v: .08, n: seq('C4_8 B3_8 A3_8 G3_8') },
        { wave: 'triangle', v: .14, n: seq('A2_8 F2_8 D3_8 C3_8') },
        { n: [] }
      ]
    },
    ship: {
      bpm: 120, beats: 32, ch: [
        { wave: 'triangle', v: .11, n: seq('G5_2 D5_2 E5_2 G5_2 A5_4 G5_2 E5_2 D5_4 B4_2 D5_2 G4_4') },
        { wave: 'square', v: .04, n: seq('B4_4 A4_4 G4_4 F#4_4') },
        { wave: 'triangle', v: .15, n: seq('G2_4 G2_4 D3_4 B2_4 C3_4 C3_4 D3_4 G2_4') },
        { n: [] }
      ]
    },
    save: {
      bpm: 100, beats: 8, ch: [
        { wave: 'triangle', v: .1, n: seq('G4_1 B4_1 D5_1 G5_2 - - -') },
        { wave: 'triangle', v: .07, n: seq('D5_4 - - -') },
        { wave: 'triangle', v: .12, n: seq('G2_4 G3_4') },
        { n: [] }
      ]
    }
  };

  /* planificateur : un pas de 1/4 de temps, vue d'avance 0.9 s */
  var M = { name: null, beat: 0, t0: 0, spb: 0.5, def: null, playing: false, oneshot: false };

  S.playMusic = function (name, opt) {
    opt = opt || {};
    if (!DEF[name]) return;
    if (M.name === name && M.playing && !opt.restart) return;
    M.name = name; M.def = DEF[name]; M.playing = !!AC;
    M.oneshot = !!opt.oneshot;
    M.beat = 0;
    if (!AC) return;
    M.spb = 60 / DEF[name].bpm;
    M.t0 = AC.currentTime + 0.12;
    if (!state.timer) state.timer = setInterval(S._tick, 80);
  };
  S.stopMusic = function () { M.playing = false; M.name = null; };
  S.musicName = function () { return M.name; };
  S.setMusicVol = function (v) { S.setVol('musVol', v); };
  S._tick = function () {
    if (!AC || !M.playing || !M.def) return;
    var d = M.def, now = AC.currentTime, horizon = now + 0.9;
    var guard = 0;
    while (M.t0 + M.beat * M.spb < horizon && guard++ < 200) {
      var t = M.t0 + M.beat * M.spb;
      if (t >= now - 0.02) {
        var b = M.beat % d.beats;
        for (var c = 0; c < d.ch.length; c++) {
          var ch = d.ch[c];
          if (!ch.n || !ch.n.length) continue;
          if (c === 3) { // batterie
            var idx = b % ch.n.length, v = ch.n[idx] && ch.n[idx][1];
            if (v === 'k') { tone({ f: 110, f2: 45, dur: .12, v: .3, wave: 'sine', t: t, dest: mus }); noise({ f: 260, f2: 80, dur: .09, v: .1, type: 'lowpass', t: t, dest: mus }); }
            else if (v === 's') noise({ f: 1700, f2: 700, dur: .14, v: .16, type: 'bandpass', q: .7, t: t, dest: mus });
            else if (v === 'h') noise({ f: 6500, dur: .045, v: .07, type: 'highpass', t: t, dest: mus });
            continue;
          }
          for (var i = 0; i < ch.n.length; i++) {
            if (ch.n[i][0] === b) {
              var len = (ch.n[i][2] || 1) * M.spb;
              tone({ f: N(ch.n[i][1]), t: t, dur: len * 0.94, v: ch.v * (state.muted ? 0 : 1), wave: ch.wave, echo: ch.echo, dest: mus });
            }
          }
        }
      }
      M.beat++;
      if (M.oneshot && M.beat >= M.def.beats) { M.playing = false; break; }
    }
  };
})(this.FF = this.FF || {});
