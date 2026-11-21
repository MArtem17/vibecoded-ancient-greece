/* global window, document, fetch */
/* Озвучка временно отключена — раскомментировать блок AUDIO_IMPL ниже для включения. */
(function () {
  var AUDIO_LOCKED = true;

  function noopResolve() {
    return Promise.resolve();
  }

  function isEnabled() {
    return false;
  }

  function setEnabled(on) {
    if (AUDIO_LOCKED || !on) {
      try {
        localStorage.setItem("gr_deck_audio", "0");
      } catch (e) {}
    }
  }

  function stop() {}

  function loadManifest() {
    return noopResolve();
  }

  window.GR_Audio = {
    loadManifest: loadManifest,
    stop: stop,
    isEnabled: isEnabled,
    setEnabled: setEnabled,
    isFileProtocol: function () {
      return typeof location !== "undefined" && location.protocol === "file:";
    },
    playUrl: noopResolve,
    playSequence: noopResolve,
    playCard: noopResolve,
    playQuestLine: noopResolve,
    hasCardAudio: function () {
      return false;
    },
    cardClips: function () {
      return [];
    },
    questLineUrl: function () {
      return null;
    },
  };

  setEnabled(false);

  /*
  var AUDIO_IMPL = true;
  if (!AUDIO_IMPL) return;

  var AUDIO_BASE = "assets/audio/";
  var MANIFEST_URL = AUDIO_BASE + "manifest.json";
  var CACHE_BUST = "20260709-tts-prototype";

  var FALLBACK_MANIFEST = {
    version: "20260709-tts-prototype",
    prototype: true,
    cards: {
      "01": {
        intro: "cards/01/intro.mp3",
        facts: "cards/01/facts.mp3",
        fun: "cards/01/fun.mp3",
      },
      "02": {
        intro: "cards/02/intro.mp3",
        facts: "cards/02/facts.mp3",
        fun: "cards/02/fun.mp3",
      },
      "03": {
        intro: "cards/03/intro.mp3",
        facts: "cards/03/facts.mp3",
        fun: "cards/03/fun.mp3",
      },
    },
    quest: {
      "01": [
        { who: "narrator", file: "quest/01/00-narrator.mp3" },
        { who: "sandra", file: "quest/01/01-sandra.mp3" },
        { who: "roborik", file: "quest/01/02-roborik.mp3" },
        { who: "sandra", file: "quest/01/03-sandra.mp3" },
      ],
    },
  };

  var AUDIO_ENABLED_KEY = "gr_deck_audio";

  var manifest = null;
  var manifestPromise = null;
  var currentAudio = null;
  var sequenceToken = 0;

  function isEnabledImpl() {
    try {
      var v = localStorage.getItem(AUDIO_ENABLED_KEY);
      if (v === null) return false;
      return v === "1" || v === "true";
    } catch (e) {
      return false;
    }
  }

  function setEnabledImpl(on) {
    try {
      localStorage.setItem(AUDIO_ENABLED_KEY, on ? "1" : "0");
    } catch (e) {}
  }

  function isFileProtocol() {
    return typeof location !== "undefined" && location.protocol === "file:";
  }

  function urlFor(relPath) {
    var url = AUDIO_BASE + relPath;
    if (!isFileProtocol()) url += "?v=" + CACHE_BUST;
    return url;
  }

  function useEmbeddedManifest() {
    manifest = FALLBACK_MANIFEST;
    return Promise.resolve(manifest);
  }

  function loadManifestImpl() {
    if (manifest) return Promise.resolve(manifest);
    if (manifestPromise) return manifestPromise;
    if (isFileProtocol()) {
      manifestPromise = useEmbeddedManifest();
      return manifestPromise;
    }
    manifestPromise = fetch(MANIFEST_URL + "?v=" + CACHE_BUST)
      .then(function (res) {
        if (!res.ok) throw new Error("manifest");
        return res.json();
      })
      .then(function (data) {
        manifest = data;
        return data;
      })
      .catch(function () {
        return useEmbeddedManifest();
      });
    return manifestPromise;
  }

  function stopImpl() {
    sequenceToken += 1;
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  }

  function playOne(src, token) {
    return new Promise(function (resolve, reject) {
      if (token !== sequenceToken) {
        resolve();
        return;
      }
      var audio = new Audio(src);
      currentAudio = audio;
      audio.onended = function () {
        if (token !== sequenceToken) return;
        currentAudio = null;
        resolve();
      };
      audio.onerror = function () {
        if (token !== sequenceToken) return;
        currentAudio = null;
        reject(new Error("audio"));
      };
      var p = audio.play();
      if (p && p.catch) {
        p.catch(function (err) {
          if (token !== sequenceToken) return;
          reject(err);
        });
      }
    });
  }

  function playUrlImpl(src) {
    stopImpl();
    return playOne(src, sequenceToken);
  }

  function playSequenceImpl(urls) {
    stopImpl();
    var token = sequenceToken;
    var chain = Promise.resolve();
    urls.forEach(function (src) {
      chain = chain.then(function () {
        if (token !== sequenceToken) return;
        return playOne(src, token);
      });
    });
    return chain;
  }

  function cardClips(code) {
    if (!manifest || !manifest.cards) return [];
    var clips = manifest.cards[code];
    if (!clips) return [];
    return ["intro", "facts", "fun"]
      .map(function (key) {
        return clips[key] ? urlFor(clips[key]) : null;
      })
      .filter(Boolean);
  }

  function questLineUrl(chapter, lineIndex) {
    if (!manifest || !manifest.quest) return null;
    var lines = manifest.quest[chapter];
    if (!lines || !lines[lineIndex]) return null;
    return urlFor(lines[lineIndex].file);
  }

  function hasCardAudio(code) {
    return !!(manifest && manifest.cards && manifest.cards[code]);
  }

  function playCardImpl(code) {
    if (!isEnabledImpl()) return Promise.resolve();
    return loadManifestImpl().then(function () {
      var urls = cardClips(code);
      if (!urls.length) return Promise.resolve();
      return playSequenceImpl(urls);
    });
  }

  function playQuestLineImpl(chapter, lineIndex) {
    if (!isEnabledImpl()) return Promise.resolve();
    return loadManifestImpl().then(function () {
      var src = questLineUrl(chapter, lineIndex);
      if (!src) return Promise.resolve();
      return playUrlImpl(src);
    });
  }

  window.GR_Audio = {
    loadManifest: loadManifestImpl,
    stop: stopImpl,
    isEnabled: isEnabledImpl,
    setEnabled: setEnabledImpl,
    isFileProtocol: isFileProtocol,
    playUrl: playUrlImpl,
    playSequence: playSequenceImpl,
    playCard: playCardImpl,
    playQuestLine: playQuestLineImpl,
    hasCardAudio: hasCardAudio,
    cardClips: cardClips,
    questLineUrl: questLineUrl,
  };

  if (isFileProtocol()) {
    manifest = FALLBACK_MANIFEST;
  } else {
    loadManifestImpl();
  }
  */
})();
