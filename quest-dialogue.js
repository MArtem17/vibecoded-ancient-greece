/* global window, document */
(function () {
  var PORTRAIT_BASE = "assets/quest/dialogue/";
  var TYPE_MS = 26;
  var TYPE_PAUSE_MS = 140;
  var TYPE_COMMA_MS = 70;

  function t(key, vars) {
    return window.GR_Locale ? window.GR_Locale.t(key, vars) : key;
  }

  function portraitUrl(file) {
    var ver =
      (window.GR_Locale && window.GR_Locale.ASSET_VERSION) || "20260709-dlg-overlay";
    return PORTRAIT_BASE + file + "?v=" + ver;
  }

  function speakerNames() {
    return (window.GR_Locale && window.GR_Locale.speakers) || {
      sandra: "Сандра",
      roborik: "Робоборик",
    };
  }

  var SPEAKERS = {
    sandra: { name: "" },
    roborik: { name: "" },
  };

  function refreshSpeakers() {
    var names = speakerNames();
    SPEAKERS.sandra.name = names.sandra;
    SPEAKERS.roborik.name = names.roborik;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function stopTypewriter(state) {
    if (!state) return;
    if (state.typeTimer) {
      window.clearTimeout(state.typeTimer);
      state.typeTimer = null;
    }
    state.typing = false;
    if (state.currentTextEl) {
      state.currentTextEl.classList.remove("is-typing");
    }
  }

  function typeDelay(ch) {
    if (/[.!?…]/.test(ch)) return TYPE_PAUSE_MS;
    if (/[,;:]/.test(ch)) return TYPE_COMMA_MS;
    if (ch === " ") return TYPE_MS * 0.55;
    if (ch === "\n") return TYPE_MS * 0.75;
    return TYPE_MS;
  }

  function typeLine(textEl, fullText, state, onDone) {
    stopTypewriter(state);
    if (!textEl) {
      if (onDone) onDone();
      return;
    }

    state.currentTextEl = textEl;
    state.typeFullText = fullText || "";
    state.typeIndex = 0;
    textEl.textContent = "";
    textEl.classList.add("is-typing");

    if (!fullText) {
      state.typing = false;
      textEl.classList.remove("is-typing");
      if (onDone) onDone();
      return;
    }

    state.typing = true;

    function tick() {
      if (!state.typing) return;

      var i = state.typeIndex;
      if (i >= state.typeFullText.length) {
        state.typing = false;
        state.typeTimer = null;
        textEl.classList.remove("is-typing");
        if (onDone) onDone();
        return;
      }

      state.typeIndex = i + 1;
      textEl.textContent = state.typeFullText.slice(0, state.typeIndex);
      state.typeTimer = window.setTimeout(tick, typeDelay(state.typeFullText.charAt(i)));
    }

    tick();
  }

  function skipTypewriter(state) {
    if (!state || !state.typing || !state.currentTextEl) return false;
    var textEl = state.currentTextEl;
    stopTypewriter(state);
    textEl.textContent = state.typeFullText || "";
    return true;
  }

  function buildBubble(who) {
    var bubble = el("div", "qc-dlg-bubble qc-dlg-bubble--" + who);
    bubble.hidden = true;

    if (who === "narrator") {
      bubble.appendChild(el("div", "qc-dlg-bubble-kicker", "📍 " + t("sceneLabel")));
      var narratorText = el("p", "qc-dlg-bubble-text", "");
      bubble.appendChild(narratorText);
      return { bubble: bubble, text: narratorText };
    }

    var row = el("div", "qc-dlg-bubble-row");
    var avatar = document.createElement("img");
    avatar.className = "qc-dlg-avatar";
    avatar.src = portraitUrl(who + ".png");
    avatar.alt = SPEAKERS[who].name;
    avatar.decoding = "async";
    row.appendChild(avatar);

    var body = el("div", "qc-dlg-bubble-body");
    body.appendChild(el("div", "qc-dlg-bubble-name", SPEAKERS[who].name));
    var text = el("p", "qc-dlg-bubble-text", "");
    body.appendChild(text);
    row.appendChild(body);
    bubble.appendChild(row);

    return { bubble: bubble, text: text };
  }

  /** @param {{ finale?: boolean }} [extra] */
  function buildHero(sceneSrc, sceneAlt, compact, fallbackSrc, extra) {
    refreshSpeakers();
    extra = extra || {};

    var heroClass = "qc-dlg-hero";
    if (extra.finale) heroClass += " qc-dlg-hero--finale";
    else if (compact) heroClass += " qc-dlg-hero--compact";

    var hero = el("div", heroClass);

    var bg = document.createElement("img");
    bg.className = "qc-dlg-hero-bg";
    bg.src = sceneSrc || fallbackSrc || "";
    bg.alt = sceneAlt || "";
    bg.decoding = "async";
    if (fallbackSrc && sceneSrc) {
      bg.onerror = function () {
        bg.onerror = null;
        bg.src = fallbackSrc;
        hero.classList.add("qc-dlg-hero--fallback");
      };
    }
    var media = el("div", "qc-dlg-hero-media");
    media.appendChild(bg);
    media.appendChild(el("div", "qc-dlg-hero-shade"));
    hero.appendChild(media);

    var ui = el("div", "qc-dlg-hero-panel");
    var bubbles = el("div", "qc-dlg-bubbles");

    var sandra = buildBubble("sandra");
    var roborik = buildBubble("roborik");
    var narrator = buildBubble("narrator");

    bubbles.appendChild(sandra.bubble);
    bubbles.appendChild(roborik.bubble);
    bubbles.appendChild(narrator.bubble);
    ui.appendChild(bubbles);
    hero.appendChild(ui);

    return {
      hero: hero,
      media: media,
      ui: ui,
      sandra: sandra,
      roborik: roborik,
      narrator: narrator,
    };
  }

  function resetBubbles(refs) {
    refs.hero.classList.remove(
      "qc-dlg-hero--sandra",
      "qc-dlg-hero--roborik",
      "qc-dlg-hero--narrator"
    );
    refs.sandra.bubble.hidden = true;
    refs.roborik.bubble.hidden = true;
    refs.narrator.bubble.hidden = true;
    refs.sandra.bubble.classList.remove("qc-dlg-bubble--show");
    refs.roborik.bubble.classList.remove("qc-dlg-bubble--show");
    refs.narrator.bubble.classList.remove("qc-dlg-bubble--show");
  }

  function showLine(line, refs, lineIndex, chapterCode, typeState, onTyped, instant) {
    resetBubbles(refs);
    stopTypewriter(typeState);

    var actorRef;
    if (line.who === "narrator") {
      actorRef = refs.narrator;
      refs.hero.classList.add("qc-dlg-hero--narrator");
    } else if (line.who === "sandra") {
      actorRef = refs.sandra;
      refs.hero.classList.add("qc-dlg-hero--sandra");
    } else {
      actorRef = refs.roborik;
      refs.hero.classList.add("qc-dlg-hero--roborik");
    }

    actorRef.bubble.hidden = false;
    requestAnimationFrame(function () {
      actorRef.bubble.classList.add("qc-dlg-bubble--show");
    });

    /*
    if (window.GR_Audio && chapterCode != null && lineIndex != null) {
      window.GR_Audio.playQuestLine(chapterCode, lineIndex);
    }
    */

    if (instant) {
      actorRef.text.textContent = line.text;
      if (onTyped) onTyped();
      return;
    }

    typeLine(actorRef.text, line.text, typeState, onTyped);
  }

  function appendHeroHead(ui, chapter, episode) {
    if (!chapter && !episode) return;
    var head = el("div", "qc-dlg-hero-head");
    if (chapter) head.appendChild(el("div", "qc-scene-meta", chapter));
    if (episode) head.appendChild(el("div", "qc-scene-ep", episode));
    ui.insertBefore(head, ui.firstChild);
  }

  function appendHeroFoot(ui, clueEl, hint, nextBtn, cardBtn) {
    var foot = el("div", "qc-dlg-hero-foot");
    foot.appendChild(clueEl);
    foot.appendChild(hint);

    var actions = el("div", "qc-dlg-hero-actions");
    if (cardBtn) {
      cardBtn.classList.add("qc-dlg-card-btn");
      actions.appendChild(cardBtn);
    }
    actions.appendChild(nextBtn);
    foot.appendChild(actions);
    ui.appendChild(foot);
  }

  /** @param {HTMLElement} host
   *  @param {{ lines: Array, clue?: string, chapter?: string, episode?: string, sceneSrc?: string, sceneAlt?: string, fallbackSrc?: string, sceneCode?: string, onOpenCard?: Function, onDone: Function }} opts */
  function render(host, opts) {
    refreshSpeakers();
    var lines = opts.lines || [];
    var idx = 0;
    host.innerHTML = "";

    var refs = buildHero(
      opts.sceneSrc,
      opts.sceneAlt,
      false,
      opts.fallbackSrc
    );
    appendHeroHead(refs.ui, opts.chapter, opts.episode);

    var clueEl = el("div", "qc-scene-clue qc-dlg-clue qc-dlg-clue--hidden");

    var hint = el("span", "qc-dlg-tap-hint", t("dlgTapHint"));
    var btn = el("button", "qc-btn primary qc-dlg-next", t("dlgNext"));
    btn.type = "button";

    var cardBtn = null;
    if (opts.onOpenCard) {
      cardBtn = el("button", "qc-btn qc-dlg-card-btn", t("openCard"));
      cardBtn.type = "button";
      cardBtn.onclick = opts.onOpenCard;
    }

    appendHeroFoot(refs.ui, clueEl, hint, btn, cardBtn);

    host.appendChild(refs.hero);

    var typeState = { typeTimer: null, typing: false, typeFullText: "", currentTextEl: null };

    function updateHint() {
      if (!hint) return;
      hint.textContent = typeState.typing ? t("dlgTapSkip") : t("dlgTapHint");
    }

    function revealNext() {
      if (idx >= lines.length) {
        stopTypewriter(typeState);
        if (opts.clue) {
          clueEl.textContent = "🔑 " + opts.clue;
          clueEl.classList.remove("qc-dlg-clue--hidden");
        }
        btn.textContent = t("dlgToTaskDone");
        btn.classList.add("qc-dlg-done");
        hint.classList.add("qc-dlg-tap-hint--hidden");
        if (opts.onDone) opts.onDone();
        return;
      }

      showLine(lines[idx], refs, idx, opts.sceneCode, typeState, updateHint);
      idx += 1;
      updateHint();
      if (idx >= lines.length) btn.textContent = t("dlgToTask");
    }

    function advanceDialogue() {
      if (btn.classList.contains("qc-dlg-done")) return;
      if (skipTypewriter(typeState)) {
        updateHint();
        return;
      }
      revealNext();
    }

    btn.onclick = advanceDialogue;

    if (refs.media) {
      refs.media.classList.add("qc-dlg-hero-media--tap");
      refs.media.setAttribute("role", "button");
      refs.media.setAttribute("tabindex", "0");
      refs.media.setAttribute("aria-label", t("dlgTapHint"));
      refs.media.onclick = function () {
        advanceDialogue();
      };
      refs.media.onkeydown = function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          advanceDialogue();
        }
      };
    }

    revealNext();
  }

  function speakerLabel(who) {
    if (who === "narrator") return "📍 " + t("sceneLabel");
    if (who === "sandra") return SPEAKERS.sandra.name;
    return SPEAKERS.roborik.name;
  }

  function buildChatLine(line) {
    var who = line.who || "roborik";
    var msg = el("div", "qc-chat-msg qc-chat-msg--" + who);

    if (who === "narrator") {
      var pill = el("div", "qc-chat-narrator");
      pill.appendChild(el("span", "qc-chat-narrator-kicker", "📍 " + t("sceneLabel")));
      pill.appendChild(el("p", "qc-chat-text", line.text));
      msg.appendChild(pill);
      return msg;
    }

    var avatar = document.createElement("img");
    avatar.className = "qc-chat-avatar";
    avatar.src = portraitUrl(who + ".png");
    avatar.alt = SPEAKERS[who].name;
    avatar.decoding = "async";

    var bubble = el("div", "qc-chat-bubble");
    bubble.appendChild(el("div", "qc-chat-name", SPEAKERS[who].name));
    bubble.appendChild(el("p", "qc-chat-text", line.text));

    msg.appendChild(avatar);
    msg.appendChild(bubble);
    return msg;
  }

  /** Сцена + свёрнутый полный диалог — между картинкой и квизом */
  function renderQuizPhase(host, opts) {
    refreshSpeakers();
    opts = opts || {};
    var lines = opts.lines || [];
    host.innerHTML = "";
    host.className = "qc-chapter-top";
    host.id = "qcDialogueHost";

    var scene = el("div", "qc-chapter-scene qc-chapter-scene--quiz");
    var media = el("div", "qc-chapter-scene-media");
    var img = document.createElement("img");
    img.className = "qc-chapter-scene-img";
    img.src = opts.sceneSrc || opts.fallbackSrc || "";
    img.alt = opts.sceneAlt || "";
    img.decoding = "async";
    if (opts.fallbackSrc && opts.sceneSrc) {
      img.onerror = function () {
        img.onerror = null;
        img.src = opts.fallbackSrc;
        scene.classList.add("qc-chapter-scene--fallback");
      };
    }
    media.appendChild(img);
    media.appendChild(el("div", "qc-chapter-scene-shade"));

    if (opts.chapter || opts.episode) {
      var cap = el("div", "qc-chapter-scene-cap");
      if (opts.chapter) cap.appendChild(el("div", "qc-scene-meta", opts.chapter));
      if (opts.episode) cap.appendChild(el("div", "qc-scene-ep", opts.episode));
      media.appendChild(cap);
    }
    scene.appendChild(media);
    host.appendChild(scene);

    if (!lines.length && !(opts.facts && opts.facts.length) && !opts.clue) return;

    var details = document.createElement("details");
    details.className = "qc-dlg-transcript qc-dlg-chat qc-dlg-transcript--overlay";

    var summary = document.createElement("summary");
    summary.className = "qc-dlg-transcript-summary";
    var summaryAvatars = el("span", "qc-chat-summary-avatars");
    var sandraThumb = document.createElement("img");
    sandraThumb.className = "qc-chat-summary-avatar";
    sandraThumb.src = portraitUrl("sandra.png");
    sandraThumb.alt = SPEAKERS.sandra.name;
    summaryAvatars.appendChild(sandraThumb);
    var roboThumb = document.createElement("img");
    roboThumb.className = "qc-chat-summary-avatar";
    roboThumb.src = portraitUrl("roborik.png");
    roboThumb.alt = SPEAKERS.roborik.name;
    summaryAvatars.appendChild(roboThumb);
    summary.appendChild(summaryAvatars);
    summary.appendChild(el("span", "qc-chat-summary-label", t("quizRecapTitle")));
    details.appendChild(summary);

    var body = el("div", "qc-dlg-transcript-body qc-chat-log");
    lines.forEach(function (line) {
      body.appendChild(buildChatLine(line));
    });
    if (opts.facts && opts.facts.length) {
      opts.facts.forEach(function (fact) {
        var text = String(fact).replace(/^Запись Сандры:\s*/i, "");
        body.appendChild(buildChatLine({ who: "sandra", text: text }));
      });
    }
    if (opts.clue) {
      var clueMsg = el("div", "qc-chat-msg qc-chat-msg--clue");
      clueMsg.appendChild(el("div", "qc-chat-clue", "🔑 " + opts.clue));
      body.appendChild(clueMsg);
    }
    details.appendChild(body);
    scene.appendChild(details);
  }

  function parseGearLine(raw) {
    if (!raw) return [];
    var out = [];
    var re = /(Сандра|Робоборик|Роборик|Sandra|Roborik):\s*[«"]([^»"]+)[»"]/g;
    var m;
    while ((m = re.exec(raw))) {
      out.push({
        who:
          m[1] === "Сандра" || m[1] === "Sandra" ? "sandra" : "roborik",
        text: m[2],
      });
    }
    if (!out.length && raw) {
      out.push({ who: "roborik", text: raw.replace(/^[«»"]+|[«»"]+$/g, "") });
    }
    return out;
  }

  function enterChapterFinale(host) {
    var dlgHost = document.getElementById("qcDialogueHost");
    var quizHost = document.getElementById("quizHost");
    if (dlgHost) dlgHost.remove();
    if (quizHost) quizHost.remove();
    if (host) {
      host.innerHTML = "";
      host.className = "qc-minigame-wrap qc-minigame-finale";
    }
    var main = document.getElementById("main");
    if (main) main.classList.add("qc-chapter--finale");
    return main;
  }

  function leaveChapterFinale() {
    var main = document.getElementById("main");
    if (main) main.classList.remove("qc-chapter--finale");
  }

  function renderGearLines(host, lines, opts) {
    if (!lines.length) return;
    opts = opts || {};
    host.innerHTML = "";

    var idx = 0;
    var typeState = {};

    var refs = buildHero(
      opts.sceneSrc,
      opts.sceneAlt,
      false,
      opts.fallbackSrc,
      { finale: true }
    );

    var foot = el("div", "qc-dlg-gear-foot");
    var actionBtn = el("button", "qm-btn qm-btn-primary qc-dlg-gear-btn", t("dlgNext"));
    actionBtn.type = "button";
    actionBtn.disabled = true;
    foot.appendChild(actionBtn);
    refs.ui.appendChild(foot);

    function isLast() {
      return idx >= lines.length - 1;
    }

    function updateBtnLabel() {
      actionBtn.textContent = isLast() ? t("gearContinue") : t("dlgNext");
    }

    function showCurrent() {
      updateBtnLabel();
      actionBtn.disabled = true;
      showLine(lines[idx], refs, idx, null, typeState, function () {
        actionBtn.disabled = false;
      }, false);
    }

    function advance() {
      if (typeState.typing && skipTypewriter(typeState)) {
        actionBtn.disabled = false;
        return;
      }
      if (!isLast()) {
        idx++;
        showCurrent();
        return;
      }
      if (opts.onDone) {
        leaveChapterFinale();
        opts.onDone();
        return;
      }
      host.innerHTML = "";
    }

    actionBtn.onclick = advance;

    refs.media.classList.add("qc-dlg-hero-media--tap");
    refs.media.onclick = function () {
      advance();
    };

    showCurrent();
    host.appendChild(refs.hero);
  }

  /** Одна итоговая фраза поверх полной иллюстрации */
  function renderFinalePhrase(host, opts) {
    opts = opts || {};
    if (!opts.phrase) {
      if (opts.onDone) {
        leaveChapterFinale();
        opts.onDone();
      }
      return;
    }
    host.innerHTML = "";

    var typeState = {};
    var refs = buildHero(
      opts.sceneSrc,
      opts.sceneAlt,
      false,
      opts.fallbackSrc,
      { finale: true }
    );
    refs.hero.classList.add("qc-dlg-hero--finale-epilogue");

    var foot = el("div", "qc-dlg-gear-foot");
    var actionBtn = el("button", "qm-btn qm-btn-primary qc-dlg-gear-btn", t("gearContinue"));
    actionBtn.type = "button";
    actionBtn.disabled = true;
    foot.appendChild(actionBtn);
    refs.ui.appendChild(foot);

    function unlock() {
      actionBtn.disabled = false;
    }

    showLine(
      { who: "narrator", text: opts.phrase },
      refs,
      0,
      null,
      typeState,
      unlock,
      false
    );

    function advance() {
      if (typeState.typing && skipTypewriter(typeState)) {
        unlock();
        return;
      }
      if (opts.onDone) {
        leaveChapterFinale();
        opts.onDone();
      }
    }

    actionBtn.onclick = advance;
    refs.media.classList.add("qc-dlg-hero-media--tap");
    refs.media.onclick = advance;

    host.appendChild(refs.hero);
  }

  /** Финал главы: gearLine (диалог) или одна итоговая фраза */
  function renderChapterFinale(host, opts) {
    opts = opts || {};
    if (opts.gearLine) {
      renderGearLines(host, parseGearLine(opts.gearLine), opts);
      return;
    }
    renderFinalePhrase(host, opts);
  }

  window.GR_QuestDialogue = {
    render: render,
    renderQuizPhase: renderQuizPhase,
    parseGearLine: parseGearLine,
    renderGearLines: renderGearLines,
    renderFinalePhrase: renderFinalePhrase,
    renderChapterFinale: renderChapterFinale,
    enterChapterFinale: enterChapterFinale,
    leaveChapterFinale: leaveChapterFinale,
  };
})();
