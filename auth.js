/* global window, localStorage */
(function () {
  var BASE_PROG_KEY = "drevnyaya_greciya_prog";
  var MODE_KEY = BASE_PROG_KEY + "_mode";
  var LEGACY_SESSION_KEY = "gr_deck_session";

  function emptyProgress() {
    return { studied: [], passed: {}, gears: [], questPassed: {} };
  }

  function migrateFromSessionUser() {
    try {
      var raw = localStorage.getItem(LEGACY_SESSION_KEY);
      if (!raw) return;
      var session = JSON.parse(raw);
      if (!session || !session.user) return;
      var userKey = BASE_PROG_KEY + "__" + String(session.user).trim().toLowerCase();
      var userRaw = localStorage.getItem(userKey);
      var baseRaw = localStorage.getItem(BASE_PROG_KEY);
      if (userRaw && (!baseRaw || baseRaw === JSON.stringify(emptyProgress()))) {
        localStorage.setItem(BASE_PROG_KEY, userRaw);
      }
      localStorage.removeItem(LEGACY_SESSION_KEY);
    } catch (e) {}
  }

  function loadProgress() {
    try {
      var raw = localStorage.getItem(BASE_PROG_KEY);
      if (!raw) return emptyProgress();
      var p = JSON.parse(raw);
      if (!p.studied) p.studied = [];
      if (!p.passed) p.passed = {};
      if (!p.gears) p.gears = [];
      if (!p.questPassed) p.questPassed = {};
      return p;
    } catch (e) {
      return emptyProgress();
    }
  }

  function saveProgress(prog) {
    localStorage.setItem(BASE_PROG_KEY, JSON.stringify(prog));
  }

  function resetProgress() {
    saveProgress(emptyProgress());
  }

  function countStats(prog) {
    prog = prog || loadProgress();
    var passed = 0;
    var quest = 0;
    var k;
    if (prog.passed) {
      for (k in prog.passed) {
        if (prog.passed.hasOwnProperty(k) && prog.passed[k] === true) passed++;
      }
    }
    if (prog.questPassed) {
      for (k in prog.questPassed) {
        if (prog.questPassed.hasOwnProperty(k) && prog.questPassed[k] === true) quest++;
      }
    }
    return {
      studied: prog.studied ? prog.studied.length : 0,
      passed: passed,
      quest: quest,
      gears: prog.gears ? prog.gears.length : 0,
      total: 25,
    };
  }

  function isQuestChapterUnlocked(code, prog) {
    prog = prog || loadProgress();
    var num = parseInt(code, 10);
    if (num <= 1) return true;
    var prev = num - 1 < 10 ? "0" + (num - 1) : "" + (num - 1);
    return prog.questPassed && prog.questPassed[prev] === true;
  }

  function requireAuth() {
    return true;
  }

  migrateFromSessionUser();

  window.GR_Auth = {
    getProgressKey: function () {
      return BASE_PROG_KEY;
    },
    getModeKey: function () {
      return MODE_KEY;
    },
    loadProgress: loadProgress,
    saveProgress: saveProgress,
    resetProgress: resetProgress,
    countStats: countStats,
    isQuestChapterUnlocked: isQuestChapterUnlocked,
    requireAuth: requireAuth,
    emptyProgress: emptyProgress,
  };
})();
