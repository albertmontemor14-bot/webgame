/* Background music for Calculus Adventure: The Math Kingdom.
   Music.play("audio/song.mp3", 0.5) loops a song. Browsers block sound until the player
   presses or clicks something, so if autoplay is blocked the song starts on the first input. */
(function () {
  var KEY = "mk-muted";            // same setting the sound-effects button uses
  var audio = null, muted = false, wanted = false;

  try { muted = localStorage.getItem(KEY) === "1"; } catch (e) {}

  function start() {
    if (!audio || muted) return;
    var p = audio.play();
    if (p && p.catch) p.catch(function () {});
  }

  window.Music = {
    play: function (src, volume) {
      if (audio) audio.pause();
      audio = new Audio(src);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = volume == null ? 0.5 : volume;
      wanted = true;
      start();
    },
    setMuted: function (m) {
      muted = m;
      try { localStorage.setItem(KEY, m ? "1" : "0"); } catch (e) {}
      if (!audio) return;
      if (m) audio.pause(); else start();
    },
    isMuted: function () { return muted; },
    isPlaying: function () { return !!audio && !audio.paused; }
  };

  /* start the song on the first press or tap if the browser blocked autoplay */
  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
    window.addEventListener(ev, function () {
      if (wanted && audio && audio.paused && !muted) start();
    }, { passive: true });
  });

  /* pause when the tab is hidden, resume when it comes back */
  document.addEventListener("visibilitychange", function () {
    if (!audio) return;
    if (document.hidden) audio.pause();
    else if (wanted && !muted) start();
  });
})();
