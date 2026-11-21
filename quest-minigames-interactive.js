/* global window, document */
window.GR_QuestMinigamesInteractive = (function () {
  function t(key, vars) {
    return window.GR_Locale ? window.GR_Locale.t(key, vars) : key;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function cleanupTimers(state) {
    (state.timers || []).forEach(function (id) {
      clearInterval(id);
      clearTimeout(id);
    });
    state.timers = [];
  }

  function trackTimer(state, id) {
    if (!state.timers) state.timers = [];
    state.timers.push(id);
  }

  function spawnCatchBurst(field, item) {
    var rect = field.getBoundingClientRect();
    var ir = item.getBoundingClientRect();
    var burst = el("span", "qm-fx-burst");
    burst.style.left = ir.left - rect.left + ir.width / 2 + "px";
    burst.style.top = ir.top - rect.top + ir.height / 2 + "px";
    field.appendChild(burst);
    setTimeout(function () {
      if (burst.parentNode) burst.remove();
    }, 650);
  }

  function isHardTimed(cfg) {
    return cfg && cfg._levelKey === "hard";
  }

  function hardDurationSec(game, cfg) {
    if (cfg.duration != null) return cfg.duration;
    var map = { catch: 15, rhythm: 14, aim: 16, drag: 38, eclipse: 70 };
    return map[game.type] || 18;
  }

  function mountTimeLimit(game, cfg, state, arena, checkWin, finish) {
    if (!isHardTimed(cfg)) return;
    var sec = hardDurationSec(game, cfg);
    var timerRow = el("div", "qm-timer-row");
    var timerEl = el("span", "qm-timer", t("mgTimeLeft", { n: sec }));
    timerRow.appendChild(timerEl);
    arena.insertBefore(timerRow, arena.firstChild);
    var left = sec;
    var tickId = setInterval(function () {
      if (state.done) return;
      left--;
      timerEl.textContent = t("mgTimeLeft", { n: Math.max(0, left) });
      if (left <= 5) timerEl.classList.add("qm-timer--urgent");
    }, 1000);
    trackTimer(state, tickId);
    var endId = setTimeout(function () {
      if (state.done) return;
      finish(!!checkWin());
    }, sec * 1000);
    trackTimer(state, endId);
  }

  /* —— Catch: tap falling items —— */
  function runCatch(game, cfg, arena, state, cb) {
    var score = 0;
    var goal = cfg.goal;
    var icons = game.items || ["🪙", "🏺"];
    var hud = el("div", "qm-hud", t("mgProgress", { n: 0, goal: goal }));
    var field = el("div", "qm-catch-field");
    arena.appendChild(hud);
    arena.appendChild(field);

    function setScore(n) {
      score = n;
      hud.textContent = t("mgProgress", { n: score, goal: goal });
      if (score >= goal) finish(true);
    }

    function spawn() {
      if (state.done) return;
      var item = el("button", "qm-fall-item", icons[Math.floor(Math.random() * icons.length)]);
      item.type = "button";
      item.style.left = rand(8, 82) + "%";
      item.style.animationDuration = (cfg.fallSec || 2.4) + "s";
      item.style.animationDelay = rand(0, 0.55) + "s";
      item.onclick = function (e) {
        e.stopPropagation();
        if (state.done) return;
        item.classList.add("caught", "qm-fall-item--burst");
        spawnCatchBurst(field, item);
        setScore(score + 1);
        setTimeout(function () {
          if (item.parentNode) item.remove();
        }, 180);
      };
      field.appendChild(item);
      var removeId = setTimeout(function () {
        if (item.parentNode) item.remove();
      }, (cfg.fallSec || 2.4) * 1000 + 80);
      trackTimer(state, removeId);
    }

    function finish(won) {
      if (state.done) return;
      state.done = true;
      cleanupTimers(state);
      field.querySelectorAll(".qm-fall-item").forEach(function (n) {
        n.remove();
      });
      cb(won);
    }

    var spawnId = setInterval(spawn, cfg.spawnMs || 850);
    trackTimer(state, spawnId);
    spawn();
    mountTimeLimit(game, cfg, state, arena, function () {
      return score >= goal;
    }, finish);
  }

  /* —— Rhythm: tap when runner is in the zone —— */
  function runRhythm(game, cfg, arena, state, cb) {
    var hits = 0;
    var goal = cfg.goal;
    var misses = 0;
    var maxMiss = cfg.maxMiss || 4;
    var pos = 8;
    var dir = 1;
    var hud = el("div", "qm-hud", t("mgRhythm", { n: 0, goal: goal }));
    var track = el("div", "qm-rhythm-track");
    track.appendChild(el("div", "qm-rhythm-sweep"));
    var zone = el("div", "qm-rhythm-zone");
    var runner = el("div", "qm-rhythm-runner", game.runner || "🏃");
    var tapBtn = el("button", "qm-btn qm-rhythm-tap", game.tapLabel || t("mgTap"));
    tapBtn.type = "button";
    track.appendChild(zone);
    track.appendChild(runner);
    arena.appendChild(hud);
    arena.appendChild(track);
    arena.appendChild(tapBtn);

    function inZone() {
      return pos >= 36 && pos <= 58;
    }

    function tick() {
      if (state.done) return;
      pos += dir * (cfg.speed || 1.4);
      if (pos >= 92) dir = -1;
      if (pos <= 4) dir = 1;
      runner.style.left = pos + "%";
      zone.classList.toggle("hot", inZone());
    }

    tapBtn.onclick = function () {
      if (state.done) return;
      if (inZone()) {
        hits++;
        hud.textContent = t("mgRhythm", { n: hits, goal: goal });
        zone.classList.add("hit");
        runner.classList.add("hit");
        track.classList.add("qm-rhythm-track--flash");
        setTimeout(function () {
          zone.classList.remove("hit");
          runner.classList.remove("hit");
          track.classList.remove("qm-rhythm-track--flash");
        }, 220);
        if (hits >= goal) finish(true);
      } else {
        misses++;
        tapBtn.classList.add("miss");
        setTimeout(function () {
          tapBtn.classList.remove("miss");
        }, 180);
        if (misses >= maxMiss) finish(false);
      }
    };

    function finish(won) {
      if (state.done) return;
      state.done = true;
      cleanupTimers(state);
      cb(won);
    }

    var tickId = setInterval(tick, 40);
    trackTimer(state, tickId);
    mountTimeLimit(game, cfg, state, arena, function () {
      return hits >= goal;
    }, finish);
  }

  /* —— Drag: pointer drag to target —— */
  function runDrag(game, cfg, arena, state, cb) {
    var placed = 0;
    var goal = cfg.goal;
    var hud = el("div", "qm-hud", t("mgDrag", { n: 0, goal: goal }));
    var scene = el("div", "qm-drag-scene qm-drag-scene--" + (game.theme || "mask"));
    var target = el("div", "qm-drag-target", game.targetLabel || "");
    scene.appendChild(target);

    (cfg.pieces || []).forEach(function (piece, i) {
      var p = el("div", "qm-drag-piece", piece.icon || game.pieceIcon || "🎭");
      p.setAttribute("data-idx", String(i));
      p.style.left = piece.x + "%";
      p.style.top = piece.y + "%";
      bindDrag(p, target, scene, function () {
        placed++;
        hud.textContent = t("mgDrag", { n: placed, goal: goal });
        if (placed >= goal) finish(true);
      });
      scene.appendChild(p);
    });

    arena.appendChild(hud);
    arena.appendChild(scene);

    function finish(won) {
      if (state.done) return;
      state.done = true;
      cb(won);
    }

    mountTimeLimit(game, cfg, state, arena, function () {
      return placed >= goal;
    }, finish);
  }

  function bindDrag(piece, target, scene, onSnap) {
    var dragging = false;
    var startX = 0;
    var startY = 0;
    var origLeft = 0;
    var origTop = 0;

    function onDown(e) {
      if (piece.classList.contains("placed")) return;
      dragging = true;
      piece.classList.add("dragging");
      var pt = e.touches ? e.touches[0] : e;
      startX = pt.clientX;
      startY = pt.clientY;
      origLeft = parseFloat(piece.style.left) || 0;
      origTop = parseFloat(piece.style.top) || 0;
      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging) return;
      var pt = e.touches ? e.touches[0] : e;
      var rect = scene.getBoundingClientRect();
      var dx = ((pt.clientX - startX) / rect.width) * 100;
      var dy = ((pt.clientY - startY) / rect.height) * 100;
      piece.style.left = Math.max(2, Math.min(88, origLeft + dx)) + "%";
      piece.style.top = Math.max(5, Math.min(85, origTop + dy)) + "%";
      e.preventDefault();
    }

    function onUp() {
      if (!dragging) return;
      dragging = false;
      piece.classList.remove("dragging");
      var pr = piece.getBoundingClientRect();
      var tr = target.getBoundingClientRect();
      var overlap =
        pr.left < tr.right &&
        pr.right > tr.left &&
        pr.top < tr.bottom &&
        pr.bottom > tr.top;
      if (overlap) {
        piece.classList.add("placed", "qm-drag-piece--snap");
        piece.style.left = "50%";
        piece.style.top = "38%";
        piece.style.transform = "translate(-50%, -50%) scale(1.1)";
        target.classList.add("qm-drag-target--snap");
        setTimeout(function () {
          target.classList.remove("qm-drag-target--snap");
        }, 500);
        onSnap();
      }
    }

    piece.addEventListener("mousedown", onDown);
    piece.addEventListener("touchstart", onDown, { passive: false });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
  }

  function normAngle(deg) {
    var a = deg % 360;
    return a < 0 ? a + 360 : a;
  }

  function angleDiff(a, b) {
    var d = Math.abs(normAngle(a) - normAngle(b));
    return d > 180 ? 360 - d : d;
  }

  function bindRingRotate(ringEl, dialEl, isBlocked, onChange) {
    var dragging = false;

    function getAngleFromEvent(e) {
      var rect = dialEl.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var pt = e.touches ? e.touches[0] : e;
      var dx = pt.clientX - cx;
      var dy = pt.clientY - cy;
      return normAngle((Math.atan2(dx, -dy) * 180) / Math.PI);
    }

    function onDown(e) {
      if (isBlocked()) return;
      dragging = true;
      ringEl.classList.add("dragging");
      var a = getAngleFromEvent(e);
      ringEl.style.transform = "rotate(" + a + "deg)";
      ringEl.setAttribute("data-angle", String(Math.round(a)));
      onChange(a);
      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging || isBlocked()) return;
      var a = getAngleFromEvent(e);
      ringEl.style.transform = "rotate(" + a + "deg)";
      ringEl.setAttribute("data-angle", String(Math.round(a)));
      onChange(a);
      e.preventDefault();
    }

    function onUp() {
      if (!dragging) return;
      dragging = false;
      ringEl.classList.remove("dragging");
    }

    ringEl.addEventListener("mousedown", onDown);
    ringEl.addEventListener("touchstart", onDown, { passive: false });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
  }

  /* —— Eclipse: rotate rings to align moon with sun and date pointer —— */
  function runEclipse(game, cfg, arena, state, cb) {
    var sunAngle = cfg.sunAngle != null ? cfg.sunAngle : 0;
    var moonTarget = cfg.moonTarget != null ? cfg.moonTarget : sunAngle;
    var dateTarget = cfg.dateTarget != null ? cfg.dateTarget : 52;
    var tolerance = cfg.tolerance || 14;
    var moonAngle = normAngle(cfg.moonStart != null ? cfg.moonStart : rand(55, 305));
    var dateAngle = normAngle(cfg.dateStart != null ? cfg.dateStart : rand(55, 305));

    while (angleDiff(moonAngle, moonTarget) < tolerance + 8) {
      moonAngle = normAngle(rand(55, 305));
    }
    while (angleDiff(dateAngle, dateTarget) < tolerance + 8) {
      dateAngle = normAngle(rand(55, 305));
    }

    var hud = el(
      "div",
      "qm-hud",
      t("mgEclipse", { moon: "…", date: "…" })
    );

    function statusIcon(ok) {
      return ok ? "✓" : "…";
    }

    function updateHud() {
      var moonOk = angleDiff(moonAngle, moonTarget) <= tolerance;
      var dateOk = angleDiff(dateAngle, dateTarget) <= tolerance;
      hud.textContent = t("mgEclipse", {
        moon: statusIcon(moonOk),
        date: statusIcon(dateOk),
      });
      moonRing.classList.toggle("near", moonOk);
      dateRing.classList.toggle("near", dateOk);
    }

    var wrap = el("div", "qm-eclipse");
    var dial = el("div", "qm-eclipse-dial");

    var scale = el("div", "qm-eclipse-scale");
    var sun = el("span", "qm-eclipse-sun", "☀");
    sun.style.transform = "rotate(" + sunAngle + "deg)";
    var mark = el("span", "qm-eclipse-mark", "◎");
    mark.style.transform = "rotate(" + dateTarget + "deg)";
    scale.appendChild(sun);
    scale.appendChild(mark);

    var moonRing = el("div", "qm-eclipse-ring qm-eclipse-ring--moon");
    moonRing.style.transform = "rotate(" + moonAngle + "deg)";
    moonRing.setAttribute("data-angle", String(Math.round(moonAngle)));
    var moonKnob = el("span", "qm-eclipse-knob qm-eclipse-knob--moon", "🌙");
    moonRing.appendChild(moonKnob);

    var dateRing = el("div", "qm-eclipse-ring qm-eclipse-ring--date");
    dateRing.style.transform = "rotate(" + dateAngle + "deg)";
    dateRing.setAttribute("data-angle", String(Math.round(dateAngle)));
    var dateKnob = el("span", "qm-eclipse-knob qm-eclipse-knob--date", "▼");
    dateRing.appendChild(dateKnob);

    var core = el("div", "qm-eclipse-core");
    core.appendChild(el("span", "qm-eclipse-earth", "🌍"));
    var dateReadout = el("div", "qm-eclipse-readout", t("mgEclipseDateHidden"));
    core.appendChild(dateReadout);

    var gearRow = el("div", "qm-eclipse-gears");
    var quest = window.GR_QUEST;
    if (quest && quest.gears) {
      quest.gears.forEach(function (g) {
        gearRow.appendChild(el("span", "qm-eclipse-gear", "⚙"));
      });
    }

    dial.appendChild(scale);
    dial.appendChild(moonRing);
    dial.appendChild(dateRing);
    dial.appendChild(core);
    dial.appendChild(gearRow);

    var legend = el("div", "qm-eclipse-legend");
    legend.appendChild(el("span", "", "🌙 " + t("mgEclipseMoon")));
    legend.appendChild(el("span", "", "▼ " + t("mgEclipseDate")));
    legend.appendChild(el("span", "", "☀ " + t("mgEclipseSun")));

    var checkBtn = el("button", "qm-btn qm-btn-primary qm-eclipse-check", t("runMechanism"));
    checkBtn.type = "button";

    wrap.appendChild(dial);
    wrap.appendChild(legend);
    arena.appendChild(hud);
    arena.appendChild(wrap);
    arena.appendChild(checkBtn);

    bindRingRotate(
      moonRing,
      dial,
      function () {
        return state.done;
      },
      function (a) {
        moonAngle = a;
        updateHud();
      }
    );
    bindRingRotate(
      dateRing,
      dial,
      function () {
        return state.done;
      },
      function (a) {
        dateAngle = a;
        updateHud();
      }
    );
    updateHud();

    function finish(won) {
      if (state.done) return;
      state.done = true;
      if (!won) {
        cb(false);
        return;
      }
      dial.classList.add("qm-eclipse-win");
      dateReadout.textContent = game.eclipseDate || t("mgEclipseDateShow");
      setTimeout(function () {
        cb(true);
      }, 1400);
    }

    checkBtn.onclick = function () {
      if (state.done) return;
      var moonOk = angleDiff(moonAngle, moonTarget) <= tolerance;
      var dateOk = angleDiff(dateAngle, dateTarget) <= tolerance;
      if (moonOk && dateOk) {
        finish(true);
        return;
      }
      dial.classList.add("shake");
      var hint = el("p", "qm-fail-hint", game.failHint || game.fail || t("mgFail"));
      arena.appendChild(hint);
      setTimeout(function () {
        dial.classList.remove("shake");
        if (hint.parentNode) hint.remove();
      }, 520);
    };

    mountTimeLimit(game, cfg, state, arena, function () {
      var moonOk = angleDiff(moonAngle, moonTarget) <= tolerance;
      var dateOk = angleDiff(dateAngle, dateTarget) <= tolerance;
      return moonOk && dateOk;
    }, finish);
  }

  /* —— Aim: tap targets when active —— */
  function runAim(game, cfg, arena, state, cb) {
    var hits = 0;
    var goal = cfg.goal;
    var marks = game.aimMarks || [];
    var hud = el("div", "qm-hud", t("mgAim", { n: 0, goal: goal }));

    if (marks.length) {
      var legend = el("div", "qm-aim-legend");
      marks.forEach(function (mark) {
        var item = el("div", "qm-aim-legend-item");
        item.appendChild(el("span", "qm-aim-legend-num", String(mark.n)));
        item.appendChild(el("span", "qm-aim-legend-label", mark.label));
        legend.appendChild(item);
      });
      arena.appendChild(legend);
    }

    var field = el("div", "qm-aim-field" + (marks.length ? " qm-aim-field--marked" : ""));
    arena.appendChild(hud);
    arena.appendChild(field);

    if (marks.length) {
      marks.forEach(function (mark) {
        var ghost = el("div", "qm-aim-mark");
        ghost.style.left = mark.x + "%";
        ghost.style.top = mark.y + "%";
        ghost.appendChild(el("span", "qm-aim-mark-num", String(mark.n)));
        ghost.appendChild(el("span", "qm-aim-mark-label", mark.label));
        field.appendChild(ghost);
      });
    }

    function spawn() {
      if (state.done || hits >= goal) return;
      var mark = marks.length ? marks[Math.floor(Math.random() * marks.length)] : null;
      var target = el("button", "qm-aim-hand" + (mark ? " qm-aim-hand--marked" : ""));
      target.type = "button";
      if (mark) {
        target.style.left = mark.x + "%";
        target.style.top = mark.y + "%";
        target.setAttribute("aria-label", mark.n + " — " + mark.label);
        target.appendChild(el("span", "qm-aim-num", String(mark.n)));
        target.appendChild(el("span", "qm-aim-icon", game.targetIcon || "🎯"));
      } else {
        target.style.left = rand(10, 75) + "%";
        target.style.top = rand(15, 65) + "%";
        target.textContent = game.targetIcon || "🎯";
      }
      var life = cfg.targetMs || 1200;
      target.onclick = function () {
        if (state.done) return;
        target.classList.add("hit");
        hits++;
        hud.textContent = t("mgAim", { n: hits, goal: goal });
        setTimeout(function () {
          if (target.parentNode) target.remove();
        }, 150);
        if (hits >= goal) finish(true);
      };
      field.appendChild(target);
      var hideId = setTimeout(function () {
        if (target.parentNode && !target.classList.contains("hit")) {
          target.classList.add("missed");
          setTimeout(function () {
            if (target.parentNode) target.remove();
          }, 200);
        }
      }, life);
      trackTimer(state, hideId);
    }

    function finish(won) {
      if (state.done) return;
      state.done = true;
      cleanupTimers(state);
      field.querySelectorAll(".qm-aim-hand").forEach(function (n) {
        n.remove();
      });
      cb(won);
    }

    var spawnId = setInterval(spawn, cfg.spawnMs || 700);
    trackTimer(state, spawnId);
    spawn();
    mountTimeLimit(game, cfg, state, arena, function () {
      return hits >= goal;
    }, finish);
  }

  var RUNNERS = {
    catch: runCatch,
    rhythm: runRhythm,
    drag: runDrag,
    aim: runAim,
    eclipse: runEclipse,
  };

  function showResultBox(host, ok, text, onAction) {
    var box = el("div", "qm-result " + (ok ? "ok qm-result--pop" : "fail"));
    box.appendChild(el("div", "qm-result-icon", ok ? "✓" : "↻"));
    box.appendChild(el("p", "qm-result-text", text));
    if (onAction) {
      var btn = el("button", "qm-btn " + (ok ? "qm-btn-primary" : "qm-btn-secondary"), onAction.label);
      btn.type = "button";
      btn.onclick = onAction.fn;
      box.appendChild(btn);
    }
    host.appendChild(box);
  }

  function sceneOptsFromHost(host) {
    return {
      sceneSrc: host.getAttribute("data-scene-src") || "",
      sceneAlt: host.getAttribute("data-scene-alt") || "",
      fallbackSrc: host.getAttribute("data-fallback-src") || "",
    };
  }

  function showChapterFinale(host, game, levelKey, onFinaleDone) {
    if (!window.GR_QuestDialogue) {
      if (onFinaleDone) onFinaleDone();
      return;
    }
    window.GR_QuestDialogue.enterChapterFinale(host);
    var finaleBox = el("div", "qc-dlg-gear qc-dlg-gear--finale");
    host.appendChild(finaleBox);

    var phrase =
      levelKey === "hard"
        ? game.successHard || game.successEasy || game.success || t("mgWinHard")
        : game.successEasy || game.success || t("mgWinEasy");

    var opts = Object.assign({}, sceneOptsFromHost(host), {
      onDone: onFinaleDone,
    });
    if (game.gearLine) opts.gearLine = game.gearLine;
    else opts.phrase = phrase;

    window.GR_QuestDialogue.renderChapterFinale(finaleBox, opts);
  }

  function render(game, host, onDone) {
    if (!game || !host || !game.levels) return;
    var runner = RUNNERS[game.type];
    if (!runner) {
      host.appendChild(el("p", "", t("unknownGame")));
      return;
    }

    host._qmRerender = function () {
      render(game, host, onDone);
    };

    function mountLevel(levelKey, afterEasy) {
      host.innerHTML = "";
      host.appendChild(el("h3", "qm-title", "🎮 " + (game.title || t("minigame"))));
      host.appendChild(
        el("div", "qm-level-badge", levelKey === "easy" ? t("mgLevelEasy") : t("mgLevelHard"))
      );
      host.appendChild(
        el("p", "qm-prompt", levelKey === "easy" ? game.prompt : game.promptHard || game.prompt)
      );
      if (levelKey === "hard") {
        host.appendChild(el("p", "qm-prompt qm-prompt--time", t("mgHardTimeNote")));
      }

      var arena = el("div", "qm-interactive-arena qm-interactive-arena--live qm-interactive-arena--" + game.type);
      arena.appendChild(el("div", "qm-fx-stars", ""));
      host.appendChild(arena);

      var state = { done: false, timers: [] };
      var levelCfg = Object.assign({}, game.levels[levelKey], { _levelKey: levelKey });

      runner(game, levelCfg, arena, state, function (won) {
        cleanupTimers(state);
        arena.remove();
        if (!won) {
          showResultBox(host, false, game.fail || t("mgFail"), {
            label: t("retry"),
            fn: function () {
              mountLevel(levelKey, afterEasy);
            },
          });
          return;
        }

        if (levelKey === "easy") {
          var easyMsg = game.successEasy || game.success || t("mgWinEasy");
          showResultBox(host, true, easyMsg, null);
          var offer = el("div", "qm-hard-offer");
          offer.appendChild(el("p", "qm-hard-offer-text", t("mgOfferHard")));
          var row = el("div", "qm-hard-offer-actions");
          var playHard = el("button", "qm-btn qm-btn-primary", t("mgPlayHard"));
          playHard.type = "button";
          playHard.onclick = function () {
            mountLevel("hard", true);
          };
          var skip = el("button", "qm-btn qm-btn-secondary", t("mgSkipHard"));
          skip.type = "button";
          skip.onclick = function () {
            finishChapter("easy");
          };
          row.appendChild(playHard);
          row.appendChild(skip);
          offer.appendChild(row);
          host.appendChild(offer);
          return;
        }

        finishChapter("hard");
      });
    }

    function finishChapter(levelKey) {
      showChapterFinale(host, game, levelKey || "easy", function () {
        onDone(true);
      });
    }

    mountLevel("easy", false);
  }

  return { render: render, isInteractive: function (game) {
    return !!(game && game.mode === "interactive" && game.levels);
  } };
})();
