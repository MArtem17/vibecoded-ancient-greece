/* global window, document */
(function () {
  var overlayEl, backdropEl, stageEl, flipEl, faceImg, backHost, hsEl, hintEl, hsPinApi;

  function t(key) {
    return window.GR_Locale ? window.GR_Locale.t(key) : key;
  }
  var currentCard = null;
  var isFlipped = false;
  var ASSET_VERSION = "20260709-back-tune";

  function cardAsset(code, side) {
    if (window.GR_Locale && window.GR_Locale.cardAsset) {
      return window.GR_Locale.cardAsset(code, side);
    }
    return "assets/web/" + code + (side === "back" ? "_back" : "") + ".webp?v=" + ASSET_VERSION;
  }

  function hsOpen() {
    return hsEl && hsEl.classList.contains("open");
  }

  function closeHs() {
    if (hsEl) hsEl.classList.remove("open");
    document.querySelectorAll(".hs-pin.is-active").forEach(function (p) {
      p.classList.remove("is-active");
    });
    if (hsPinApi && hsPinApi.cancelClose) hsPinApi.cancelClose();
  }

  function close() {
    closeHs();
    if (!overlayEl) return;
    overlayEl.classList.remove("is-open");
    overlayEl.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    isFlipped = false;
    if (flipEl) flipEl.classList.remove("is-flipped");
    currentCard = null;
  }

  function updateHint() {
    if (!hintEl || !currentCard) return;
    if (hsOpen()) {
      hintEl.textContent = t("hsOverlayBack");
      return;
    }
    if (isFlipped) {
      hintEl.textContent = t("flipToFace");
      return;
    }
    if (currentCard.hotspots && currentCard.hotspots.length) {
      hintEl.textContent = t("flipHotspot");
    } else {
      hintEl.textContent = t("flipCard");
    }
  }

  function doFlip() {
    closeHs();
    isFlipped = !isFlipped;
    flipEl.classList.toggle("is-flipped", isFlipped);
    var svg = stageEl.querySelector(".qc-card-side--front svg");
    if (svg) svg.style.display = isFlipped ? "none" : "";
    updateHint();
  }

  function openHs(hs) {
    if (!hsEl) return;
    hsEl.querySelector(".hs-ov-num").textContent = hs.n;
    hsEl.querySelector(".hs-ov-label").textContent = hs.label;
    hsEl.querySelector(".hs-ov-cardtext").textContent = hs.cardText || "";
    hsEl.querySelector(".hs-ov-detail").textContent = hs.detail || "";
    hsEl.classList.add("open");
    updateHint();
  }

  function buildHotspots(card) {
    var front = stageEl.querySelector(".qc-card-side--front");
    hsPinApi = null;
    if (!front) return;
    var hsList = window.GR_CardView
      ? window.GR_CardView.hotspotsForDisplay(card)
      : card.hotspots || [];
    if (!hsList.length) return;

    if (window.GR_CardView && window.GR_CardView.mountHotspotPins) {
      hsPinApi = window.GR_CardView.mountHotspotPins(front, hsList, {
        canShow: function () {
          return !isFlipped;
        },
        onShow: function (hs) {
          openHs(hs);
        },
        onHide: function () {
          closeHs();
          updateHint();
        },
      });
    }
  }

  function mountBack(card) {
    backHost.innerHTML = "";
    if (window.GR_CardView) {
      window.GR_CardView.mountBack(backHost, card, 25);
    } else {
      var img = document.createElement("img");
      img.src = cardAsset(card.code, "back");
      img.alt = card.title;
      backHost.appendChild(img);
    }
  }

  function bind() {
    overlayEl = document.getElementById("qcCardOverlay");
    if (!overlayEl) return;
    backdropEl = overlayEl.querySelector(".qc-card-overlay__backdrop");
    stageEl = overlayEl.querySelector(".qc-card-overlay__stage");
    flipEl = document.getElementById("qcCardFlip");
    faceImg = document.getElementById("qcCardFace");
    backHost = document.getElementById("qcCardBack");
    hsEl = document.getElementById("qcHsOverlay");
    hintEl = document.getElementById("qcCardHint");

    backdropEl.addEventListener("click", function () {
      close();
    });

    stageEl.addEventListener("click", function (e) {
      e.stopPropagation();
      if (hsOpen()) return;
      if (e.target.closest && e.target.closest(".hs-pin")) return;
      doFlip();
    });

    hsEl.addEventListener("click", function (e) {
      e.stopPropagation();
      closeHs();
      updateHint();
    });
    hsEl.addEventListener("mouseenter", function () {
      if (hsPinApi && hsPinApi.cancelClose) hsPinApi.cancelClose();
    });
    hsEl.addEventListener("mouseleave", function () {
      if (hsPinApi && hsPinApi.scheduleClose) hsPinApi.scheduleClose();
    });
  }

  function open(card) {
    if (!overlayEl) bind();
    if (!overlayEl || !card) return;

    currentCard = card;
    isFlipped = false;
    flipEl.classList.remove("is-flipped");
    closeHs();

    faceImg.src = cardAsset(card.code, "face");
    faceImg.alt = card.title;
    mountBack(card);
    buildHotspots(card);
    updateHint();

    overlayEl.classList.add("is-open");
    overlayEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  window.GR_QuestCardOverlay = {
    init: bind,
    open: open,
    close: close,
  };
})();
