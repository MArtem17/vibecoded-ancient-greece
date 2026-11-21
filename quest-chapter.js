/* global window, document, localStorage */
(function () {
  var CFG = window.GR_DECK_CONFIG || {};
  var PROG_KEY = CFG.progressKey || "drevnyaya_greciya_prog";
  var ASSET_VERSION = "20260710-eclipse";
  var code = getParam("c") || "01";

  function t(key, vars) {
    return window.GR_Locale ? window.GR_Locale.t(key, vars) : key;
  }

  function getParam(name) {
    var parts = window.location.search.substring(1).split("&");
    for (var i = 0; i < parts.length; i++) {
      var pair = parts[i].split("=");
      if (pair[0] === name) return decodeURIComponent(pair[1] || "");
    }
    return null;
  }

  function withLang(url) {
    return window.GR_Locale ? window.GR_Locale.withLang(url) : url;
  }

  function wrapCode(num) {
    return num < 10 ? "0" + num : String(num);
  }

  function cardAsset(c, side) {
    if (window.GR_Locale && window.GR_Locale.cardAsset) {
      return window.GR_Locale.cardAsset(c, side);
    }
    return "assets/web/" + c + (side === "back" ? "_back" : "") + ".webp?v=" + ASSET_VERSION;
  }

  function findCard(c) {
    var cards = window.GR_CARDS || [];
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].code === c) return cards[i];
    }
    return null;
  }

  function loadProg() {
    if (window.GR_Auth && window.GR_Auth.loadProgress) {
      return window.GR_Auth.loadProgress();
    }
    try {
      var key =
        window.GR_Auth && window.GR_Auth.getProgressKey
          ? window.GR_Auth.getProgressKey()
          : PROG_KEY;
      var p = JSON.parse(localStorage.getItem(key)) || {};
      if (!p.studied) p.studied = [];
      if (!p.passed) p.passed = {};
      if (!p.gears) p.gears = [];
      if (!p.questPassed) p.questPassed = {};
      return p;
    } catch (e) {
      return { studied: [], passed: {}, gears: [], questPassed: {} };
    }
  }

  function saveProg(prog) {
    try {
      if (window.GR_Auth && window.GR_Auth.saveProgress) {
        window.GR_Auth.saveProgress(prog);
        return;
      }
      localStorage.setItem(PROG_KEY, JSON.stringify(prog));
    } catch (e) {}
  }

  function isQuestUnlocked(c, prog) {
    if (window.GR_Auth && window.GR_Auth.isQuestChapterUnlocked) {
      return window.GR_Auth.isQuestChapterUnlocked(c, prog);
    }
    var num = parseInt(c, 10);
    if (num <= 1) return true;
    var prev = wrapCode(num - 1);
    return prog.questPassed && prog.questPassed[prev] === true;
  }

  function gearForCard(c) {
    var quest = window.GR_QUEST;
    if (!quest) return null;
    for (var i = 0; i < quest.gears.length; i++) {
      if (quest.gears[i].card === c) return quest.gears[i];
    }
    return null;
  }

  function markQuestPassed(c) {
    var prog = loadProg();
    prog.questPassed[c] = true;
    var gear = gearForCard(c);
    if (gear && prog.gears.indexOf(c) < 0) {
      prog.gears.push(c);
      prog.celebrateGear = c;
    }
    saveProg(prog);
  }

  function nextChapterCode(c) {
    var num = parseInt(c, 10);
    if (num >= 25) return null;
    return wrapCode(num + 1);
  }

  function sceneText(card) {
    if (!card || !card.story) return "";
    return card.story.scene;
  }

  function dialogueLines(c) {
    var dlg = window.GR_QUEST_DIALOGUES;
    if (dlg && dlg[c] && dlg[c].length) return dlg[c];
    return null;
  }

  function applyLocaleUi() {
    var L = window.GR_Locale;
    if (!L) return;
    document.documentElement.lang = L.lang === "en" ? "en" : "ru";
    var hs = document.getElementById("qcHsHint");
    if (hs) hs.textContent = t("hsCloseHint");
  }

  function renderLocked() {
    var main = document.getElementById("main");
    main.innerHTML =
      '<div class="qc-done">' +
      '<div class="qc-done-icon">🔒</div>' +
      "<h2>" + t("chapterLocked") + "</h2>" +
      "<p>" + t("chapterLockedHint") + "</p>" +
      '<a class="qc-btn" href="' + withLang("index.html#quest") + '">' + t("toChapterList") + "</a>" +
      "</div>";
  }

  function renderDone(card, game, opts) {
    opts = opts || {};
    var main = document.getElementById("main");
    var next = nextChapterCode(code);
    var html =
      '<div class="qc-done">' +
      '<div class="qc-done-icon">✓</div>' +
      "<h2>" + t("chapterDone") + "</h2>" +
      "<p>" + t("pointMarked", { n: parseInt(code, 10) }) + "</p>";
    if (game && game.gearLine && !opts.skipGear) {
      html += '<div id="qcGearDlg"></div>';
    }
    html += '<div class="qc-actions" style="justify-content:center;margin-top:16px">';
    if (next) {
      html +=
        '<a class="qc-btn primary" href="' +
        withLang("quest-chapter.html?c=" + next) +
        '">' +
        t("nextChapterLink") +
        "</a>";
    }
    html += '<a class="qc-btn" href="' + withLang("index.html#quest") + '">' + t("toQuestLink") + "</a>";
    html += "</div>";
    if (
      code === "25" &&
      window.GR_QuestWorkshop &&
      window.GR_QuestWorkshop.isUnlocked(loadProg())
    ) {
      var wsDone = window.GR_QuestWorkshop.isDone(loadProg());
      html +=
        '<div class="qc-bonus-offer">' +
        "<p>" +
        t("wsBonusTeaser") +
        "</p>" +
        '<a class="qm-btn qm-btn-primary" href="' +
        window.GR_QuestWorkshop.href() +
        '">' +
        (wsDone ? t("wsReplay") : t("wsBonusBtn")) +
        "</a>";
      if (wsDone) {
        html += '<p style="margin:10px 0 0;font-size:12px;opacity:.85">' + t("wsBonusDone") + "</p>";
      }
      html += "</div>";
    }
    html += "</div>";
    main.innerHTML = html;
    if (game && game.gearLine && window.GR_QuestDialogue) {
      var gearHost = document.getElementById("qcGearDlg");
    if (gearHost) {
      gearHost.className = "qc-dlg-gear qc-dlg-gear--finale";
      var gearScene =
          window.GR_QuestScenes && window.GR_QuestScenes.url
            ? window.GR_QuestScenes.url(code)
            : null;
        window.GR_QuestDialogue.renderGearLines(
          gearHost,
          window.GR_QuestDialogue.parseGearLine(game.gearLine),
          {
            sceneSrc: gearScene,
            sceneAlt: window.GR_QuestScenes ? window.GR_QuestScenes.alt(code) : "",
            fallbackSrc: cardAsset(code, "face"),
          }
        );
      }
    }
  }

  function chapterBundle(game) {
    if (!game) return null;
    if (game.quiz && game.minigame) {
      return { quiz: game.quiz, minigame: game.minigame };
    }
    return { quiz: null, minigame: game };
  }

  function renderChapter() {
    var card = findCard(code);
    var quest = window.GR_QUEST;
    var game = quest && quest.minigames ? quest.minigames[code] : null;
    var bundle = chapterBundle(game);
    var prog = loadProg();
    var main = document.getElementById("main");

    document.getElementById("navTitle").textContent = card ? card.title : t("questTitle");
    document.getElementById("navCode").textContent = card ? card.story.chapter : "";

    if (!card || !bundle) {
      main.innerHTML = "<p>" + t("chapterNotFound") + "</p>";
      return;
    }

    if (!isQuestUnlocked(code, prog)) {
      renderLocked();
      return;
    }

    if (prog.questPassed[code]) {
      renderDone(card, bundle.minigame);
      return;
    }

    main.innerHTML = "";

    var sceneSrc =
      window.GR_QuestScenes && window.GR_QuestScenes.url
        ? window.GR_QuestScenes.url(code)
        : null;
    var sceneAlt =
      window.GR_QuestScenes && window.GR_QuestScenes.alt
        ? window.GR_QuestScenes.alt(code)
        : card.title;
    var fallbackSrc = cardAsset(code, "face");
    var lines = dialogueLines(code);
    var dlgDone = false;
    var dlgHost = null;
    var quizWrap = null;
    var mgWrap = null;

    function ensureQuizWrap() {
      if (quizWrap) return quizWrap;
      quizWrap = document.createElement("div");
      quizWrap.className = "qc-quiz-wrap";
      quizWrap.id = "quizHost";
      main.appendChild(quizWrap);
      return quizWrap;
    }

    function ensureMgWrap() {
      if (mgWrap) return mgWrap;
      mgWrap = document.createElement("div");
      mgWrap.className = "qc-minigame-wrap";
      mgWrap.id = "minigameHost";
      main.appendChild(mgWrap);
      return mgWrap;
    }

    function startMinigame() {
      var mgHost = ensureMgWrap();
      mgHost.setAttribute("data-chapter", code);
      mgHost.setAttribute("data-scene-src", sceneSrc || "");
      mgHost.setAttribute("data-scene-alt", sceneAlt || "");
      mgHost.setAttribute("data-fallback-src", fallbackSrc);
      window.GR_QuestMinigames.render(bundle.minigame, mgHost, function (ok) {
        if (!ok) return;
        markQuestPassed(code);
        setTimeout(function () {
          renderDone(card, bundle.minigame, { skipGear: !!bundle.minigame.gearLine });
        }, 400);
      });
    }

    function onQuizDone() {
      if (quizWrap) quizWrap.remove();
      startMinigame();
    }

    function openCardOverlay() {
      if (window.GR_QuestCardOverlay) {
        window.GR_QuestCardOverlay.open(card);
      }
    }

    function mountAfterDialogue() {
      if (dlgDone) return;
      dlgDone = true;
      if (dlgHost && window.GR_QuestDialogue && window.GR_QuestDialogue.renderQuizPhase) {
        window.GR_QuestDialogue.renderQuizPhase(dlgHost, {
          lines: lines,
          facts: card.facts || [],
          clue: card.story.clue || "",
          chapter: card.story.chapter,
          episode: card.story.episode,
          sceneSrc: sceneSrc,
          sceneAlt: sceneAlt,
          fallbackSrc: fallbackSrc,
        });
      }
      if (bundle.quiz && window.GR_QuestQuiz) {
        window.GR_QuestQuiz.render(
          bundle.quiz,
          ensureQuizWrap(),
          function () {
            onQuizDone();
          },
          { card: card, onOpenCard: openCardOverlay }
        );
      } else {
        startMinigame();
      }
    }

    if (lines && window.GR_QuestDialogue) {
      dlgHost = document.createElement("div");
      dlgHost.id = "qcDialogueHost";
      main.appendChild(dlgHost);

      window.GR_QuestDialogue.render(dlgHost, {
        lines: lines,
        clue: card.story.clue || "",
        chapter: card.story.chapter,
        episode: card.story.episode,
        sceneSrc: sceneSrc,
        sceneAlt: sceneAlt,
        fallbackSrc: fallbackSrc,
        sceneCode: code,
        onOpenCard: openCardOverlay,
        onDone: mountAfterDialogue,
      });
    } else {
      if (sceneSrc) {
        var art = document.createElement("img");
        art.className = "qc-scene-art";
        art.src = sceneSrc;
        art.alt = sceneAlt;
        art.onerror = function () {
          art.src = fallbackSrc;
          art.className = "qc-scene-art qc-scene-art--fallback";
        };
        main.appendChild(art);
      }

      var hero = document.createElement("div");
      hero.className = "qc-scene-panel";
      if (!sceneSrc) {
        var thumb = document.createElement("img");
        thumb.className = "qc-thumb";
        thumb.src = fallbackSrc;
        thumb.alt = card.title;
        hero.appendChild(thumb);
      }

      var scene = document.createElement("div");
      scene.className = "qc-scene";
      scene.innerHTML =
        '<div class="qc-scene-meta">' +
        card.story.chapter +
        "</div>" +
        '<div class="qc-scene-ep">' +
        card.story.episode +
        "</div>" +
        '<div class="qc-scene-text">' +
        sceneText(card) +
        "</div>" +
        (card.story.clue ? '<div class="qc-scene-clue">🔑 ' + card.story.clue + "</div>" : "");
      hero.appendChild(scene);
      main.appendChild(hero);
      dlgHost = document.createElement("div");
      dlgHost.id = "qcDialogueHost";
      main.appendChild(dlgHost);
      mountAfterDialogue();
    }

    var actions = document.createElement("div");
    actions.className = "qc-actions";
    if (!(lines && window.GR_QuestDialogue)) {
      var cardBtn = document.createElement("button");
      cardBtn.type = "button";
      cardBtn.className = "qc-btn";
      cardBtn.textContent = t("openCard");
      cardBtn.onclick = function () {
        if (window.GR_QuestCardOverlay) {
          window.GR_QuestCardOverlay.open(card);
        }
      };
      actions.appendChild(cardBtn);
      main.appendChild(actions);
    }
  }

  document.getElementById("backBtn").onclick = function () {
    window.location.href = withLang("index.html#quest");
  };

  applyLocaleUi();

  if (window.GR_QuestCardOverlay) window.GR_QuestCardOverlay.init();

  renderChapter();
})();
