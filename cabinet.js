/* global window, document, location */
(function () {
  function t(key, vars) {
    return window.GR_Locale ? window.GR_Locale.t(key, vars) : key;
  }

  function appUrl(hash) {
    var url = "index.html" + (hash || "");
    return window.GR_Locale ? window.GR_Locale.withLang(url) : url;
  }

  function applyUi() {
    document.title = t("cabinetPageTitle");
    document.getElementById("cabinetTitle").textContent = t("cabinetTitle");
    document.getElementById("cabinetSub").textContent = t("cabinetSub");
    document.getElementById("progressSectionTitle").textContent = t("cabinetProgressSection");
    document.getElementById("btnReset").textContent = t("cabinetReset");
    document.getElementById("btnToApp").textContent = t("cabinetToApp");
    document.getElementById("backLink").textContent = t("cabinetBack");
    document.getElementById("backLink").href = appUrl("#map");
    document.documentElement.lang =
      window.GR_Locale && window.GR_Locale.lang === "en" ? "en" : "ru";
  }

  function renderStats() {
    var stats = window.GR_Auth.countStats();
    var host = document.getElementById("cabinetStats");
    host.innerHTML =
      '<div class="cabinet-stat"><strong>' +
      stats.passed +
      "/" +
      stats.total +
      '</strong><span>' +
      t("cabinetStatCards") +
      "</span></div>" +
      '<div class="cabinet-stat"><strong>' +
      stats.quest +
      "/" +
      stats.total +
      '</strong><span>' +
      t("cabinetStatQuest") +
      "</span></div>" +
      '<div class="cabinet-stat"><strong>' +
      stats.gears +
      "/7</strong><span>" +
      t("cabinetStatGears") +
      "</span></div>" +
      '<div class="cabinet-stat"><strong>' +
      stats.studied +
      '</strong><span>' +
      t("cabinetStatStudied") +
      "</span></div>";
  }

  function renderUser() {
    var display = t("cabinetGuestName");
    document.getElementById("userName").textContent = display;
    document.getElementById("userAvatar").textContent = display.charAt(0).toUpperCase();
  }

  function init() {
    applyUi();
    renderUser();
    renderStats();

    document.getElementById("btnReset").onclick = function () {
      if (!window.confirm(t("cabinetResetConfirm"))) return;
      window.GR_Auth.resetProgress();
      renderStats();
    };

    document.getElementById("btnToApp").onclick = function () {
      location.href = appUrl("#map");
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
