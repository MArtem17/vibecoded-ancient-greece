/* global window, document */
(function () {
  var WS = window.GR_QuestWorkshop;

  function t(key, vars) {
    return window.GR_Locale ? window.GR_Locale.t(key, vars) : key;
  }

  function withLang(url) {
    return window.GR_Locale ? window.GR_Locale.withLang(url) : url;
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

  function normAngle(deg) {
    var a = deg % 360;
    return a < 0 ? a + 360 : a;
  }

  function angleDiff(a, b) {
    var d = Math.abs(normAngle(a) - normAngle(b));
    return d > 180 ? 360 - d : d;
  }

  function getTasks() {
    return [
      {
        id: "eclipse",
        moonTarget: 0,
        dateTarget: 52,
        mark: "◎",
        tolerance: 15,
        hint: t("wsHint1"),
        praise: t("wsPraise1"),
        readout: t("wsReadout1"),
      },
      {
        id: "fullmoon",
        moonTarget: 180,
        dateTarget: 140,
        mark: "🌕",
        tolerance: 15,
        hint: t("wsHint2"),
        praise: t("wsPraise2"),
        readout: t("wsReadout2"),
      },
      {
        id: "olympiad",
        moonTarget: 90,
        dateTarget: 270,
        mark: "🏛",
        tolerance: 12,
        hint: t("wsHint3"),
        praise: t("wsPraise3"),
        readout: t("wsReadout3"),
      },
    ];
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
      onChange(a);
      e.preventDefault();
    }

    function onMove(e) {
      if (!dragging || isBlocked()) return;
      var a = getAngleFromEvent(e);
      ringEl.style.transform = "rotate(" + a + "deg)";
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

  function renderSpeakerBubble(who, text) {
    var box = el("div", "ws-bubble ws-bubble--" + who);
    var name = el("div", "ws-bubble-name", t(who === "sandra" ? "wsSandra" : "wsRoborik"));
    var body = el("p", "ws-bubble-text", text);
    box.appendChild(name);
    box.appendChild(body);
    return box;
  }

  function renderSteps(current, total) {
    var row = el("div", "ws-steps");
    for (var i = 0; i < total; i++) {
      row.appendChild(el("span", "ws-step" + (i < current ? " done" : i === current ? " active" : "")));
    }
    return row;
  }

  function mountDial(host, task, onSuccess) {
    var blocked = false;
    var moonAngle = normAngle(rand(55, 305));
    var dateAngle = normAngle(rand(55, 305));
    while (angleDiff(moonAngle, task.moonTarget) < task.tolerance + 8) {
      moonAngle = normAngle(rand(55, 305));
    }
    while (angleDiff(dateAngle, task.dateTarget) < task.tolerance + 8) {
      dateAngle = normAngle(rand(55, 305));
    }

    var hud = el("div", "qm-hud", t("mgEclipse", { moon: "…", date: "…" }));

    function statusIcon(ok) {
      return ok ? "✓" : "…";
    }

    function updateHud() {
      var moonOk = angleDiff(moonAngle, task.moonTarget) <= task.tolerance;
      var dateOk = angleDiff(dateAngle, task.dateTarget) <= task.tolerance;
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
    var mark = el("span", "qm-eclipse-mark", task.mark);
    mark.style.transform = "rotate(" + task.dateTarget + "deg)";
    scale.appendChild(sun);
    scale.appendChild(mark);

    var moonRing = el("div", "qm-eclipse-ring qm-eclipse-ring--moon");
    moonRing.style.transform = "rotate(" + moonAngle + "deg)";
    moonRing.appendChild(el("span", "qm-eclipse-knob qm-eclipse-knob--moon", "🌙"));

    var dateRing = el("div", "qm-eclipse-ring qm-eclipse-ring--date");
    dateRing.style.transform = "rotate(" + dateAngle + "deg)";
    dateRing.appendChild(el("span", "qm-eclipse-knob qm-eclipse-knob--date", "▼"));

    var core = el("div", "qm-eclipse-core");
    core.appendChild(el("span", "qm-eclipse-earth", "🌍"));
    var readout = el("div", "qm-eclipse-readout", t("mgEclipseDateHidden"));
    core.appendChild(readout);

    var gearRow = el("div", "qm-eclipse-gears");
    var quest = window.GR_QUEST;
    if (quest && quest.gears) {
      quest.gears.forEach(function () {
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
    legend.appendChild(el("span", "", task.mark + " " + t("wsMarkLabel")));

    var checkBtn = el("button", "qm-btn qm-btn-primary qm-eclipse-check", t("wsCheck"));
    checkBtn.type = "button";

    wrap.appendChild(dial);
    wrap.appendChild(legend);
    host.appendChild(hud);
    host.appendChild(wrap);
    host.appendChild(checkBtn);

    bindRingRotate(
      moonRing,
      dial,
      function () {
        return blocked;
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
        return blocked;
      },
      function (a) {
        dateAngle = a;
        updateHud();
      }
    );
    updateHud();

    checkBtn.onclick = function () {
      if (blocked) return;
      var moonOk = angleDiff(moonAngle, task.moonTarget) <= task.tolerance;
      var dateOk = angleDiff(dateAngle, task.dateTarget) <= task.tolerance;
      if (moonOk && dateOk) {
        blocked = true;
        checkBtn.disabled = true;
        dial.classList.add("qm-eclipse-win");
        readout.textContent = task.readout;
        setTimeout(onSuccess, 1300);
        return;
      }
      dial.classList.add("shake");
      var hint = el("p", "qm-fail-hint", t("wsFail"));
      host.appendChild(hint);
      setTimeout(function () {
        dial.classList.remove("shake");
        if (hint.parentNode) hint.remove();
      }, 520);
    };
  }

  function renderLocked(main) {
    main.innerHTML = "";
    var box = el("div", "ws-panel ws-locked");
    box.appendChild(el("div", "ws-locked-icon", "🔒"));
    box.appendChild(el("h2", "", t("wsLockedTitle")));
    box.appendChild(el("p", "", t("wsLockedHint")));
    var btn = el("a", "qm-btn qm-btn-secondary", t("toQuestLink"));
    btn.href = withLang("index.html#quest");
    box.appendChild(btn);
    main.appendChild(box);
  }

  function renderIntro(main, tasks, onStart) {
    main.innerHTML = "";
    var panel = el("div", "ws-panel");
    panel.appendChild(el("h1", "ws-title", t("wsTitle")));
    panel.appendChild(renderSpeakerBubble("sandra", t("wsIntro")));
    panel.appendChild(renderSpeakerBubble("roborik", t("wsIntroRoborik")));
    panel.appendChild(el("p", "ws-meta", t("wsDuration")));
    var btn = el("button", "qm-btn qm-btn-primary ws-start-btn", t("wsStart"));
    btn.type = "button";
    btn.onclick = onStart;
    panel.appendChild(btn);
    main.appendChild(panel);
  }

  function renderTask(main, tasks, index, onDone) {
    main.innerHTML = "";
    var task = tasks[index];
    var panel = el("div", "ws-panel");
    panel.appendChild(el("p", "ws-task-label", t("wsTaskProgress", { n: index + 1, total: tasks.length })));
    panel.appendChild(renderSteps(index, tasks.length));
    panel.appendChild(renderSpeakerBubble("sandra", task.hint));
    var dialHost = el("div", "ws-dial-host");
    panel.appendChild(dialHost);
    main.appendChild(panel);

    mountDial(dialHost, task, function () {
      var praisePanel = el("div", "ws-praise");
      praisePanel.appendChild(renderSpeakerBubble("sandra", task.praise));
      panel.appendChild(praisePanel);
      setTimeout(onDone, 900);
    });
  }

  function renderComplete(main) {
    WS.markDone();
    main.innerHTML = "";
    var panel = el("div", "ws-panel ws-complete");
    panel.appendChild(el("div", "ws-complete-icon", "✦"));
    panel.appendChild(el("h2", "", t("wsDoneTitle")));
    panel.appendChild(renderSpeakerBubble("sandra", t("wsDoneSandra")));
    panel.appendChild(renderSpeakerBubble("roborik", t("wsDoneRoborik")));
    panel.appendChild(el("p", "ws-done-note", t("wsDoneNote")));
    var row = el("div", "ws-done-actions");
    var replay = el("button", "qm-btn qm-btn-secondary", t("wsReplay"));
    replay.type = "button";
    replay.onclick = function () {
      runGame();
    };
    var quest = el("a", "qm-btn qm-btn-primary", t("toQuestLink"));
    quest.href = withLang("index.html#quest");
    row.appendChild(replay);
    row.appendChild(quest);
    panel.appendChild(row);
    main.appendChild(panel);
  }

  function runGame() {
    var main = document.getElementById("main");
    var tasks = getTasks();
    var step = 0;

    function next() {
      if (step >= tasks.length) {
        renderComplete(main);
        return;
      }
      renderTask(main, tasks, step, function () {
        step++;
        next();
      });
    }

    renderIntro(main, tasks, function () {
      step = 0;
      next();
    });
  }

  function applyLocaleUi() {
    document.getElementById("navTitle").textContent = t("wsTitle");
  }

  document.getElementById("backBtn").onclick = function () {
    window.location.href = withLang("index.html#quest");
  };

  applyLocaleUi();

  var prog = WS.loadProg();
  if (!WS.isUnlocked(prog)) {
    renderLocked(document.getElementById("main"));
  } else {
    runGame();
  }
})();
