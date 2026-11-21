/* global window, localStorage */
(function () {
  var CFG = window.GR_DECK_CONFIG || {};
  var PROG_KEY = CFG.progressKey || "drevnyaya_greciya_prog";
  var GEAR_GOAL = 7;

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
    } catch (e2) {}
  }

  window.GR_QuestWorkshop = {
    GEAR_GOAL: GEAR_GOAL,
    loadProg: loadProg,
    saveProg: saveProg,
    isUnlocked: function (prog) {
      prog = prog || loadProg();
      if (!prog.questPassed || prog.questPassed["25"] !== true) return false;
      return !!(prog.gears && prog.gears.length >= GEAR_GOAL);
    },
    isDone: function (prog) {
      prog = prog || loadProg();
      return prog.workshopDone === true;
    },
    markDone: function () {
      var p = loadProg();
      p.workshopDone = true;
      saveProg(p);
    },
    href: function () {
      return window.GR_Locale
        ? window.GR_Locale.withLang("quest-workshop.html")
        : "quest-workshop.html";
    },
  };
})();
