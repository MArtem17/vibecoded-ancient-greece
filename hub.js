/* global window, document, localStorage */
(function () {
  var cfg = window.GR_DECK_CONFIG || { progressKey: "drevnyaya_greciya_prog", cards: 25 };
  var quest = window.GR_QUEST || { acts: [], gears: [], minigames: {} };
  var ASSET_VERSION = "20260709-face-18";
  var GEAR_ICON_VERSION = "20260710-gear-alpha";

  function cardsList() {
    if (window.GR_Locale && window.GR_Locale.cardsList) {
      return window.GR_Locale.cardsList();
    }
    return window.GR_CARDS || [];
  }

  function setCardImg(img, code, side) {
    if (!img) return;
    if (window.GR_Locale && window.GR_Locale.setCardImg) {
      window.GR_Locale.setCardImg(img, code, side);
      return;
    }
    img.src = cardAsset(code, side);
  }

  function gearIconAsset(cardCode, got) {
    var mode = got ? "color" : "mono";
    return (
      "assets/quest/gears/" + cardCode + "-" + mode + ".png?v=" + GEAR_ICON_VERSION
    );
  }

  function gearIconAlt(g, got) {
    var name = g.name || g.short || "";
    if (window.GR_Locale && window.GR_Locale.lang === "en") {
      return (got ? "Gear found: " : "Gear locked: ") + name;
    }
    return (got ? "Шестерня: " : "Шестерня не найдена: ") + name;
  }

  function cardAsset(code, side) {
    if (window.GR_Locale && window.GR_Locale.cardAsset) {
      return window.GR_Locale.cardAsset(code, side);
    }
    var suffix = side === "back" ? "_back" : "";
    return "assets/web/" + code + suffix + ".webp?v=" + ASSET_VERSION;
  }

  function findCard(code) {
    return window.GR_Space.findCard(code);
  }

  function getProgress() {
    return window.GR_Space.getProgress();
  }

  function cardStatus(code, prog) {
    if (prog.passed && prog.passed[code] === true) return "passed";
    if (prog.studied && prog.studied.indexOf(code) >= 0) return "studied";
    return "new";
  }

  function isQuestUnlocked(code, prog) {
    if (window.GR_Auth && window.GR_Auth.isQuestChapterUnlocked) {
      return window.GR_Auth.isQuestChapterUnlocked(code, prog);
    }
    var num = parseInt(code, 10);
    if (num <= 1) return true;
    if (!prog.questPassed) prog.questPassed = {};
    var prev = num - 1 < 10 ? "0" + (num - 1) : "" + (num - 1);
    return prog.questPassed[prev] === true;
  }

  function isQuestPassed(code, prog) {
    return prog.questPassed && prog.questPassed[code] === true;
  }

  function hasGear(cardCode, prog) {
    if (!prog.gears) return false;
    return prog.gears.indexOf(cardCode) >= 0;
  }

  function collectGear(cardCode, prog) {
    if (!prog.gears) prog.gears = [];
    if (prog.gears.indexOf(cardCode) < 0) prog.gears.push(cardCode);
    window.GR_Space.saveProgress(prog);
  }

  function gearForCard(code) {
    for (var i = 0; i < quest.gears.length; i++) {
      if (quest.gears[i].card === code) return quest.gears[i];
    }
    return null;
  }

  function updateBadge() {
    var prog = getProgress();
    var stats = window.GR_Space.countProgress(prog);
    var badge = document.getElementById("progressBadge");
    if (badge) {
      var passedWord =
        window.GR_Locale && window.GR_Locale.ui
          ? window.GR_Locale.ui.passed
          : "пройдено";
      badge.textContent = stats.passed + " / " + stats.total + " " + passedWord;
    }
    var gearBadge = document.getElementById("gearBadge");
    if (gearBadge) {
      var g = prog.gears ? prog.gears.length : 0;
      var gearWord =
        window.GR_Locale && window.GR_Locale.ui
          ? window.GR_Locale.ui.gears
          : "шестерён";
      gearBadge.textContent = g + " / 7 " + gearWord;
    }
    var questBadge = document.getElementById("questBadge");
    if (questBadge) {
      var qp = 0;
      if (prog.questPassed) {
        for (var qk in prog.questPassed) {
          if (prog.questPassed.hasOwnProperty(qk) && prog.questPassed[qk] === true) qp++;
        }
      }
      var chapWord =
        window.GR_Locale && window.GR_Locale.ui
          ? window.GR_Locale.ui.chapters
          : "глав";
      questBadge.textContent = qp + " / 25 " + chapWord;
    }
  }

  function t(key) {
    return window.GR_Locale ? window.GR_Locale.t(key) : key;
  }

  function setMode(mode) {
    var modes = ["map", "gallery", "quest"];
    modes.forEach(function (m) {
      var panel = document.getElementById("panel-" + m);
      var tab = document.getElementById("tab-" + m);
      if (panel) panel.classList.toggle("active", m === mode);
      if (tab) tab.classList.toggle("active", m === mode);
    });
    try {
      var modeKey =
        window.GR_Auth && window.GR_Auth.getModeKey
          ? window.GR_Auth.getModeKey()
          : cfg.progressKey + "_mode";
      localStorage.setItem(modeKey, mode);
    } catch (e) {}
    if (mode === "gallery") renderGallery();
    if (mode === "quest") {
      renderQuest();
      updateBadge();
    }
    if (mode === "map" && window.GR_Space) {
      if (window.GR_Space.scheduleMapScroll) window.GR_Space.scheduleMapScroll();
      if (window.GR_Space.scheduleMapLinks) window.GR_Space.scheduleMapLinks();
    }
    document.body.classList.toggle("hub-map-mode", mode === "map");
    location.hash = mode;
  }

  function renderGallery() {
    var host = document.getElementById("iconostasis");
    if (!host) return;
    var prog = getProgress();
    var list = cardsList();
    host.innerHTML = "";

    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      var st = cardStatus(c.code, prog);
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "ico-tile ico-" + st;
      tile.setAttribute("aria-label", c.title);

      var frame = document.createElement("div");
      frame.className = "ico-frame";

      var img = document.createElement("img");
      img.alt = c.title;
      img.loading = "lazy";
      setCardImg(img, c.code, "face");
      frame.appendChild(img);

      var num = document.createElement("span");
      num.className = "ico-num";
      num.textContent = c.code;

      var cap = document.createElement("span");
      cap.className = "ico-title";
      cap.textContent = c.title;

      var tag = document.createElement("span");
      tag.className = "ico-type";
      tag.textContent = c.type;

      tile.appendChild(frame);
      tile.appendChild(num);
      tile.appendChild(cap);
      tile.appendChild(tag);

      if (st === "passed") {
        var mark = document.createElement("span");
        mark.className = "ico-mark";
        mark.textContent = "✓";
        tile.appendChild(mark);
      }

      (function (code) {
        tile.onclick = function () {
          if (window.GR_CardModal && window.GR_CardModal.open) {
            window.GR_CardModal.open(code, { from: "gallery" });
          } else {
            window.location.href = playHref(code, "gallery");
          }
        };
      })(c.code);

      host.appendChild(tile);
    }
  }

  function chapterGameLabel(mg) {
    if (!mg) return "";
    if (mg.minigame && mg.minigame.title) return mg.minigame.title;
    if (mg.title) return mg.title;
    if (mg.quiz && mg.quiz.title) return mg.quiz.title;
    return "";
  }

  function renderQuest() {
    var host = document.getElementById("questRoot");
    if (!host) return;
    var prog = getProgress();
    host.innerHTML = "";

    var intro = document.createElement("div");
    intro.className = "quest-intro";
    intro.innerHTML =
      "<h2>" + quest.title + "</h2>" +
      "<p>" + quest.intro + "</p>";
    host.appendChild(intro);

    var gearsRow = document.createElement("div");
    gearsRow.className = "gear-row";
    var celebrateCode = prog.celebrateGear || null;
    for (var gi = 0; gi < quest.gears.length; gi++) {
      var g = quest.gears[gi];
      var got = hasGear(g.card, prog);
      var slot = document.createElement("div");
      slot.className =
        "gear-slot" +
        (got ? " got" : "") +
        (celebrateCode === g.card ? " gear-slot--new" : "");
      slot.setAttribute("data-gear-card", g.card);
      var img = document.createElement("img");
      img.className = "gear-slot-img";
      img.src = gearIconAsset(g.card, got);
      img.alt = gearIconAlt(g, got);
      img.width = 64;
      img.height = 64;
      img.loading = "lazy";
      img.decoding = "async";
      var label = document.createElement("span");
      label.className = "gear-name";
      label.textContent = g.short;
      slot.appendChild(img);
      slot.appendChild(label);
      gearsRow.appendChild(slot);
    }
    host.appendChild(gearsRow);

    if (celebrateCode) {
      delete prog.celebrateGear;
      window.GR_Space.saveProgress(prog);
      window.setTimeout(function () {
        var pulse = gearsRow.querySelector('[data-gear-card="' + celebrateCode + '"]');
        if (pulse) pulse.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 120);
    }

    for (var ai = 0; ai < quest.acts.length; ai++) {
      var act = quest.acts[ai];
      var section = document.createElement("section");
      section.className = "quest-act";

      var head = document.createElement("div");
      head.className = "quest-act-head";
      head.innerHTML =
        '<span class="act-id">' +
        (window.GR_Locale ? window.GR_Locale.t("act") : "Акт") +
        " " +
        act.id +
        "</span>" +
        "<h3>" + act.title + "</h3>" +
        "<p>" + act.subtitle + "</p>";
      section.appendChild(head);

      var list = document.createElement("div");
      list.className = "quest-chapters";

      for (var ci = 0; ci < act.cards.length; ci++) {
        var code = act.cards[ci];
        var card = findCard(code);
        if (!card) continue;
        var unlocked = isQuestUnlocked(code, prog);
        var st = isQuestPassed(code, prog) ? "passed" : unlocked ? "open" : "locked";
        var gear = gearForCard(code);

        var row = document.createElement("button");
        row.type = "button";
        row.className = "quest-chapter" + (unlocked ? "" : " locked") + " st-" + st;
        row.disabled = !unlocked;

        var thumb = document.createElement("img");
        thumb.className = "quest-thumb";
        var questScene =
          window.GR_QuestScenes && window.GR_QuestScenes.url
            ? window.GR_QuestScenes.url(code)
            : null;
        thumb.src = questScene || cardAsset(code, "face");
        thumb.alt = "";
        thumb.loading = "lazy";

        var body = document.createElement("div");
        body.className = "quest-ch-body";
        var scene = card.story.scene;
        var mg = quest.minigames && quest.minigames[code];
        var gameLabel = chapterGameLabel(mg);
        body.innerHTML =
          '<div class="quest-ch-meta">' + card.story.chapter + "</div>" +
          "<strong>" + card.title + "</strong>" +
          '<div class="quest-ch-ep">' + card.story.episode + "</div>" +
          '<div class="quest-ch-scene">' + scene + "</div>" +
          (gameLabel ? '<div class="quest-ch-game">⚡ ' + gameLabel + "</div>" : "");

        row.appendChild(thumb);
        row.appendChild(body);

        if (gear) {
          var gearTag = document.createElement("span");
          gearTag.className = "quest-gear-tag" + (hasGear(gear.card, prog) ? " got" : "");
          gearTag.textContent = hasGear(gear.card, prog)
            ? "⚙ " + gear.name
            : "⚙ " + (window.GR_Locale ? window.GR_Locale.t("gearWord") : "шестерня");
          row.appendChild(gearTag);
        }

        if (!unlocked) {
          var lock = document.createElement("span");
          lock.className = "quest-lock";
          lock.textContent = "🔒";
          row.appendChild(lock);
        } else if (st === "passed") {
          var done = document.createElement("span");
          done.className = "quest-done";
          done.textContent = "✓";
          row.appendChild(done);
        }

        (function (c) {
          row.onclick = function () {
            window.location.href = questChapterHref(c);
          };
        })(code);

        list.appendChild(row);
      }

      section.appendChild(list);
      host.appendChild(section);
    }

    if (window.GR_QuestWorkshop && window.GR_QuestWorkshop.isUnlocked(prog)) {
      var wsCard = document.createElement("div");
      wsCard.className = "quest-workshop-card";
      var wsDone = window.GR_QuestWorkshop.isDone(prog);
      wsCard.innerHTML =
        "<h3>✦ " + t("wsTitle") + "</h3>" +
        "<p>" + (wsDone ? t("wsDoneNote") : t("wsBonusTeaser")) + "</p>";
      var wsBtn = document.createElement("a");
      wsBtn.className = "qm-btn qm-btn-primary";
      wsBtn.href = window.GR_QuestWorkshop.href();
      wsBtn.textContent = wsDone ? t("wsReplay") : t("wsBonusBtn");
      wsCard.appendChild(wsBtn);
      host.appendChild(wsCard);
    }
  }

  function applyLocaleUi() {
    var L = window.GR_Locale;
    if (!L || !L.ui) return;
    var u = L.ui;
    var el;
    if (L.lang === "en") document.title = u.deckTitle + " — OBRAZOVARIUM";
    el = document.getElementById("deckTitle");
    if (el) el.textContent = u.deckTitle;
    el = document.getElementById("deckSub");
    if (el) el.textContent = u.deckSub;
    el = document.getElementById("tab-map");
    if (el) el.textContent = "🗺 " + u.tabMap;
    el = document.getElementById("tab-gallery");
    if (el) el.textContent = "🖼 " + u.tabGallery;
    el = document.getElementById("tab-quest");
    if (el) el.textContent = "⚔ " + u.tabQuest;
    el = document.getElementById("galleryIntro");
    if (el) el.textContent = u.galleryIntro;
    el = document.getElementById("questIntro");
    if (el) el.textContent = u.questIntro;
    el = document.getElementById("modalHint");
    if (el) el.textContent = u.modalHint;
    el = document.getElementById("modalPlay");
    if (el) el.textContent = u.modalPlay;
    if (window.GR_CardModal && window.GR_CardModal.refreshLabels) {
      window.GR_CardModal.refreshLabels();
    }
    el = document.getElementById("btnBackMap");
    if (el) el.textContent = u.backToMap;
    el = document.getElementById("mapFloatHint");
    if (el) el.textContent = u.mapFloatHint;
    el = document.getElementById("btnGallery");
    if (el) el.textContent = "🖼 " + u.btnGallery;
    el = document.getElementById("btnQuest");
    if (el) el.textContent = "⚔ " + u.btnQuest;
    el = document.getElementById("mapTitle");
    if (el) el.textContent = u.mapTitle;
    el = document.getElementById("mapHeroDesktop");
    if (el) el.textContent = u.mapHeroDesktop;
    el = document.getElementById("mapHeroHint");
    if (el) el.textContent = u.mapHeroHint;
    el = document.getElementById("deckFooter");
    if (el) el.textContent = u.footer;
    // Settings modal labels + active pills
    el = document.getElementById("settingsTitle");
    if (el) el.textContent = u.settings;
    el = document.getElementById("settingsLangLabel");
    if (el) el.textContent = u.settingsLang;
    el = document.getElementById("settingsThemeLabel");
    if (el) el.textContent = u.settingsTheme;
    el = document.getElementById("settingsAudioLabel");
    if (el) el.textContent = u.settingsAudio;
    el = document.getElementById("settingsThemeLight");
    if (el) el.textContent = u.themeLight;
    el = document.getElementById("settingsThemeDark");
    if (el) el.textContent = u.themeDark;
    el = document.getElementById("settingsAudioOn");
    if (el) el.textContent = u.audioOn;
    el = document.getElementById("settingsAudioOff");
    if (el) el.textContent = u.audioOff;
    el = document.getElementById("settingsClose");
    if (el) el.textContent = u.close;
    el = document.getElementById("btnCabinet");
    if (el) el.setAttribute("aria-label", u.headerCabinet);
    el = document.getElementById("btnSettings");
    if (el) el.setAttribute("aria-label", u.settings);

    el = document.getElementById("settingsLangRu");
    if (el) el.classList.toggle("active", L.lang === "ru");
    el = document.getElementById("settingsLangEn");
    if (el) el.classList.toggle("active", L.lang === "en");
    el = document.getElementById("settingsThemeLight");
    if (el) el.classList.toggle("active", (L.theme || "light") === "light");
    el = document.getElementById("settingsThemeDark");
    if (el) el.classList.toggle("active", (L.theme || "light") === "dark");
    el = document.getElementById("settingsAudioOn");
    if (el) {
      el.classList.remove("active");
      el.disabled = true;
      el.setAttribute("aria-disabled", "true");
      el.classList.add("settings-pill--disabled");
    }
    el = document.getElementById("settingsAudioOff");
    if (el) {
      el.classList.add("active");
      el.disabled = false;
      el.removeAttribute("aria-disabled");
    }

    document.documentElement.lang = L.lang === "en" ? "en" : "ru";
    updateBadge();
    var galleryPanel = document.getElementById("panel-gallery");
    if (galleryPanel && galleryPanel.classList.contains("active")) renderGallery();
    var mapPanel = document.getElementById("panel-map");
    if (mapPanel && mapPanel.classList.contains("active") && window.GR_Space) {
      window.GR_Space.init();
    }
  }

  function questChapterHref(c) {
    var q = "quest-chapter.html?c=" + c;
    if (window.GR_Locale && window.GR_Locale.lang === "en") q += "&lang=en";
    return q;
  }

  function playHref(code, from) {
    var q = "play.html?c=" + code;
    if (from) q += "&from=" + encodeURIComponent(from);
    if (window.GR_Locale && window.GR_Locale.lang === "en") q += "&lang=en";
    return q;
  }

  function initMap() {
    window.GR_Space.init();
  }

  window.GR_Hub = {
    cardAsset: cardAsset,
    setCardImg: setCardImg,
    playHref: playHref,
    init: function () {
      if (window.GR_CardModal) window.GR_CardModal.init();
      updateBadge();
      var hash = (location.hash || "").replace("#", "");
      var mode = hash || "map";
      if (["map", "gallery", "quest"].indexOf(mode) < 0) mode = "map";

      document.getElementById("tab-map").onclick = function () {
        setMode("map");
      };
      document.getElementById("tab-gallery").onclick = function () {
        setMode("gallery");
      };
      document.getElementById("tab-quest").onclick = function () {
        setMode("quest");
      };

      var btnGallery = document.getElementById("btnGallery");
      var btnQuest = document.getElementById("btnQuest");
      if (btnGallery) btnGallery.onclick = function () { setMode("gallery"); };
      if (btnQuest) btnQuest.onclick = function () { setMode("quest"); };

      var btnBackMap = document.getElementById("btnBackMap");
      if (btnBackMap) btnBackMap.onclick = function () { setMode("map"); };

      var btnCabinet = document.getElementById("btnCabinet");
      if (btnCabinet) {
        btnCabinet.onclick = function () {
          var url = "cabinet.html";
          if (window.GR_Locale && window.GR_Locale.lang === "en") url += "?lang=en";
          location.href = url;
        };
      }

      applyLocaleUi();

      // Settings modal
      var settingsModal = document.getElementById("settingsModal");
      var btnSettings = document.getElementById("btnSettings");
      var settingsBackdrop = document.getElementById("settingsBackdrop");
      var settingsClose = document.getElementById("settingsClose");

      function openSettings() {
        if (!settingsModal) return;
        settingsModal.classList.add("open");
        settingsModal.setAttribute("aria-hidden", "false");
        applyLocaleUi();
      }
      function closeSettings() {
        if (!settingsModal) return;
        settingsModal.classList.remove("open");
        settingsModal.setAttribute("aria-hidden", "true");
      }

      if (btnSettings) btnSettings.onclick = openSettings;
      if (settingsBackdrop) settingsBackdrop.onclick = closeSettings;
      if (settingsClose) settingsClose.onclick = closeSettings;

      var settingsLangRu = document.getElementById("settingsLangRu");
      var settingsLangEn = document.getElementById("settingsLangEn");
      if (settingsLangRu) {
        settingsLangRu.onclick = function () {
          if (window.GR_Locale) window.GR_Locale.set("ru");
        };
      }
      if (settingsLangEn) {
        settingsLangEn.onclick = function () {
          if (window.GR_Locale) window.GR_Locale.set("en");
        };
      }
      var themeLight = document.getElementById("settingsThemeLight");
      var themeDark = document.getElementById("settingsThemeDark");
      if (themeLight) {
        themeLight.onclick = function () {
          if (window.GR_Locale && window.GR_Locale.setTheme) window.GR_Locale.setTheme("light");
          applyLocaleUi();
        };
      }
      if (themeDark) {
        themeDark.onclick = function () {
          if (window.GR_Locale && window.GR_Locale.setTheme) window.GR_Locale.setTheme("dark");
          applyLocaleUi();
        };
      }
      var settingsAudioOn = document.getElementById("settingsAudioOn");
      var settingsAudioOff = document.getElementById("settingsAudioOff");
      if (settingsAudioOn) {
        settingsAudioOn.onclick = null;
      }
      if (settingsAudioOff) {
        settingsAudioOff.onclick = function () {
          if (window.GR_Audio) {
            window.GR_Audio.setEnabled(false);
            window.GR_Audio.stop();
          }
          applyLocaleUi();
        };
      }

      if (window.GR_Audio) {
        window.GR_Audio.setEnabled(false);
        window.GR_Audio.stop();
      }

      initMap();
      setMode(mode);

      window.addEventListener("hashchange", function () {
        var h = (location.hash || "").replace("#", "");
        if (["map", "gallery", "quest"].indexOf(h) < 0) return;
        setMode(h);
      });

      window.addEventListener("pageshow", function () {
        updateBadge();
        var active = document.querySelector(".panel.active");
        if (!active) return;
        if (active.id === "panel-gallery") renderGallery();
        if (active.id === "panel-quest") renderQuest();
      });
    },
    refresh: function () {
      updateBadge();
      var panel = document.querySelector(".panel.active");
      if (!panel) return;
      if (panel.id === "panel-gallery") renderGallery();
      if (panel.id === "panel-quest") renderQuest();
      if (panel.id === "panel-map") initMap();
    },
    collectGear: collectGear,
    gearForCard: gearForCard,
    hasGear: hasGear
  };
})();
