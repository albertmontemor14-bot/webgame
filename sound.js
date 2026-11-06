/* Sound effects for Calculus Adventure: The Math Kingdom.
   Every sound is made in the browser with the Web Audio API, so no audio files are needed.
   Use it like this:  SFX.play("jump")  */
(function () {
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master = null, noiseBuf = null, muted = false, VOLUME = 0.6;

  try { muted = localStorage.getItem("mk-muted") === "1"; } catch (e) {}

  /* browsers only allow sound after the player has pressed something, so we start on demand */
  function init() {
    if (!AC) return false;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : VOLUME;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return true;
  }

  function envelope(g, t, dur, vol) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  /* a musical beep that can slide from one pitch to another */
  function tone(freq, dur, type, vol, slideTo, delay) {
    var t = ctx.currentTime + (delay || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    envelope(g, t, dur, vol);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  /* a burst of filtered noise: wind, thuds and scrapes */
  function noise(dur, vol, filterType, f1, f2, delay) {
    var t = ctx.currentTime + (delay || 0);
    var s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf;
    f.type = filterType;
    f.frequency.setValueAtTime(f1, t);
    if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur);
    envelope(g, t, dur, vol);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  var sounds = {
    jump:  function () { tone(280, 0.16, "square", 0.1, 620); },
    land:  function () { noise(0.09, 0.18, "lowpass", 500, 150); },
    step:  function () { noise(0.05, 0.07, "bandpass", 500 + Math.random() * 400); },
    slash: function () {
      noise(0.24, 0.22, "bandpass", 500, 3800, 0.03);
      tone(900, 0.14, "sawtooth", 0.05, 300, 0.05);
    },
    hit:   function () {
      tone(220, 0.12, "square", 0.18, 70);
      noise(0.07, 0.2, "highpass", 1500);
    },
    pop:   function () {
      tone(520, 0.22, "sine", 0.22, 110);
      tone(300, 0.14, "sine", 0.12, 760, 0.09);
    },
    hurt:  function () {
      tone(320, 0.32, "sawtooth", 0.2, 80);
      noise(0.14, 0.18, "lowpass", 900, 200);
    },
    spawn: function () { tone(140, 0.14, "sine", 0.08, 320); },
    click: function () { tone(620, 0.05, "square", 0.07); },
    shoot: function () {
      noise(0.14, 0.32, "highpass", 1400, 400);
      tone(200, 0.12, "square", 0.2, 45);
    },
    empty: function () { tone(900, 0.04, "square", 0.07); },
    reload: function () {
      tone(300, 0.05, "square", 0.1);
      tone(520, 0.05, "square", 0.12, null, 0.55);
    },
    groan: function () { tone(90 + Math.random() * 30, 0.45, "sawtooth", 0.07, 55); },
    zhit:  function () { tone(170, 0.1, "square", 0.14, 70); noise(0.06, 0.14, "bandpass", 700); },
    zdie:  function () { tone(220, 0.3, "sawtooth", 0.14, 40); noise(0.12, 0.12, "lowpass", 600, 150); },
    coin:  function () { tone(988, 0.07, "square", 0.08); tone(1319, 0.14, "square", 0.08, null, 0.07); },
    chest: function () { tone(392, 0.1, "square", 0.1); tone(523, 0.1, "square", 0.1, null, 0.1); tone(784, 0.25, "square", 0.1, null, 0.2); },
    buy:   function () { tone(660, 0.08, "square", 0.1); tone(880, 0.16, "square", 0.1, null, 0.08); },
    door:  function () { tone(180, 0.3, "square", 0.1, 420); },
    wave:  function () { tone(330, 0.12, "square", 0.1); tone(440, 0.18, "square", 0.1, null, 0.12); },
    cleared: function () {
      tone(392, 0.14, "square", 0.12, null, 0);
      tone(523, 0.14, "square", 0.12, null, 0.14);
      tone(659, 0.14, "square", 0.12, null, 0.28);
      tone(784, 0.4, "square", 0.12, null, 0.42);
    },
    gameover: function () {
      tone(392, 0.2, "square", 0.14, null, 0);
      tone(330, 0.2, "square", 0.14, null, 0.2);
      tone(262, 0.2, "square", 0.14, null, 0.4);
      tone(196, 0.5, "square", 0.14, 98, 0.6);
    }
  };

  window.SFX = {
    play: function (name) {
      if (muted || !init()) return;
      if (sounds[name]) sounds[name]();
    },
    isMuted: function () { return muted; },
    toggle: function () {
      muted = !muted;
      if (init()) master.gain.value = muted ? 0 : VOLUME;
      try { localStorage.setItem("mk-muted", muted ? "1" : "0"); } catch (e) {}
      if (!muted) sounds.click();
      return muted;
    }
  };

  ["pointerdown", "keydown"].forEach(function (ev) {
    window.addEventListener(ev, function () { if (!muted) init(); }, { passive: true });
  });
})();
