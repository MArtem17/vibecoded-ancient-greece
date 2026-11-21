/* global window, document */
(function () {
  var ANIM_MS = 640;
  var modalEl,
    stageEl,
    carouselPivot,
    flipWrap,
    flipEl,
    faceImg,
    backImgEl,
    capEl,
    hintEl,
    playBtn,
    backdropEl;
  var currentCode = null;
  var isFlipped = false;
  var fromMode = "gallery";
  var touchStartX = 0;
  var touchStartY = 0;
  var animating = false;
  var animTimer = null;
  var listenersBound = false;
  var keyboardBound = false;

  function t(key) {
    return window.GR_Locale ? window.GR_Locale.t(key) : key;
  }

  function assetUrl(code, side) {
    if (window.GR_Hub && window.GR_Hub.cardAsset) {
      return window.GR_Hub.cardAsset(code, side);
    }
    var suffix = side === "back" ? "_back" : "";
    return "assets/web/" + code + suffix + ".webp";
  }

  function setCardImg(img, code, side) {
    if (!img) return;
    if (window.GR_Locale && window.GR_Locale.setCardImg) {
      window.GR_Locale.setCardImg(img, code, side);
      return;
    }
    img.src = assetUrl(code, side);
  }

  function findCard(code) {
    return window.GR_Space && window.GR_Space.findCard(code);
  }

  function cardCodes() {
    var list = window.GR_CARDS || [];
    var codes = [];
    for (var i = 0; i < list.length; i++) {
      codes.push(list[i].code);
    }
    return codes;
  }

  function cardIndex(code) {
    return cardCodes().indexOf(code);
  }

  function refreshRefs() {
    if (!modalEl) modalEl = document.getElementById("cardModal");
    if (!modalEl) return false;
    stageEl = modalEl.querySelector(".card-modal__stage");
    carouselPivot = document.getElementById("modalCarouselPivot");
    flipWrap = document.getElementById("modalFlipWrap");
    flipEl = document.getElementById("modalFlip");
    faceImg = document.getElementById("modalFace");
    backImgEl = document.getElementById("modalBackFace");
    capEl = document.getElementById("modalCap");
    hintEl = document.getElementById("modalHint");
    playBtn = document.getElementById("modalPlay");
    backdropEl = modalEl.querySelector(".card-modal__backdrop");
    return !!(faceImg && flipEl && flipWrap);
  }

  function fillSlot(slot, code) {
    var card = findCard(code);
    if (!card || !slot || !slot.face) return false;
    slot.face.alt = card.title;
    if (slot.back) slot.back.alt = card.title;
    setCardImg(slot.face, code, "face");
    setCardImg(slot.back, code, "back");
    return true;
  }

  function mainSlot() {
    return {
      wrap: flipWrap,
      flip: flipEl,
      face: faceImg,
      back: backImgEl,
    };
  }

  function createSlot() {
    var wrap = document.createElement("div");
    wrap.className = "card-modal__flip-wrap card-modal__flip-wrap--ghost";

    var flip = document.createElement("div");
    flip.className = "card-modal__flip";

    var front = document.createElement("div");
    front.className = "card-modal__side card-modal__side--front";
    var face = document.createElement("img");
    face.alt = "";
    front.appendChild(face);

    var backSide = document.createElement("div");
    backSide.className = "card-modal__side card-modal__side--back";
    var back = document.createElement("img");
    back.alt = "";
    backSide.appendChild(back);

    flip.appendChild(front);
    flip.appendChild(backSide);
    wrap.appendChild(flip);

    return { wrap: wrap, flip: flip, face: face, back: back };
  }

  function clearAnimTimer() {
    if (animTimer) {
      window.clearTimeout(animTimer);
      animTimer = null;
    }
  }

  function resetWrapMotion(wrap) {
    if (!wrap) return;
    wrap.style.transition = "none";
    wrap.className = "card-modal__flip-wrap is-active";
    void wrap.offsetWidth;
    wrap.style.transition = "";
  }

  function bindSwipe(el) {
    if (!el) return;
    el.addEventListener(
      "touchstart",
      function (e) {
        if (!e.touches[0]) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      },
      { passive: true }
    );
    el.addEventListener(
      "touchend",
      function (e) {
        if (!modalEl || !modalEl.classList.contains("is-open") || animating) return;
        var touch = e.changedTouches[0];
        if (!touch) return;
        var dx = touch.clientX - touchStartX;
        var dy = touch.clientY - touchStartY;
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        navigate(dx < 0 ? 1 : -1);
      },
      { passive: true }
    );
  }

  function bind() {
    if (!refreshRefs()) return;
    if (listenersBound) return;
    if (!backdropEl || !stageEl) return;
    listenersBound = true;

    backdropEl.addEventListener("click", close);
    if (flipWrap) {
      flipWrap.addEventListener("click", function (e) {
        e.stopPropagation();
        if (animating || !flipEl) return;
        toggleFlip();
      });
    }
    stageEl.addEventListener("click", function (e) {
      e.stopPropagation();
    });
    if (playBtn) {
      playBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (!currentCode) return;
        window.location.href =
          window.GR_Hub && window.GR_Hub.playHref
            ? window.GR_Hub.playHref(currentCode, fromMode)
            : "play.html?c=" + currentCode + "&from=" + encodeURIComponent(fromMode);
      });
    }

    bindSwipe(stageEl);
  }

  function resetFlip() {
    isFlipped = false;
    if (flipEl) flipEl.classList.remove("is-flipped");
    if (hintEl) hintEl.textContent = t("modalHint");
  }

  function toggleFlip() {
    if (!flipEl) return;
    isFlipped = !isFlipped;
    flipEl.classList.toggle("is-flipped", isFlipped);
    if (hintEl) hintEl.textContent = isFlipped ? t("flipToFace") : t("modalHint");
  }

  function setCaption(code) {
    var card = findCard(code);
    if (!card || !capEl) return;
    capEl.textContent = "GR-" + code + " · " + card.title;
  }

  function cleanupGhostWraps() {
    if (!carouselPivot) return;
    var ghosts = carouselPivot.querySelectorAll(".card-modal__flip-wrap--ghost");
    for (var i = 0; i < ghosts.length; i++) {
      ghosts[i].remove();
    }
  }

  function finalizeArc(incomingWrap, newCode) {
    incomingWrap.remove();
    resetWrapMotion(flipWrap);
    currentCode = newCode;
    resetFlip();
    fillSlot(mainSlot(), newCode);
    setCaption(newCode);
    modalEl.classList.remove("is-carousel-anim");
    animating = false;
    clearAnimTimer();
  }

  function loadCard(code) {
    var card = findCard(code);
    if (!card) return false;

    cleanupGhostWraps();
    currentCode = code;
    resetFlip();
    resetWrapMotion(flipWrap);
    fillSlot(mainSlot(), code);
    setCaption(code);
    return true;
  }

  function animateToCard(newCode, direction) {
    if (animating || !currentCode || !carouselPivot || !flipWrap) return false;
    if (!findCard(newCode)) return false;

    clearAnimTimer();
    animating = true;
    modalEl.classList.add("is-carousel-anim");
    resetFlip();

    var incoming = createSlot();
    if (!fillSlot(incoming, newCode)) {
      animating = false;
      modalEl.classList.remove("is-carousel-anim");
      return false;
    }

    var exitClass = direction > 0 ? "is-arc-exit-left" : "is-arc-exit-right";
    var enterClass = direction > 0 ? "is-arc-enter-right" : "is-arc-enter-left";

    incoming.wrap.classList.add(enterClass);
    carouselPivot.appendChild(incoming.wrap);

    void incoming.wrap.offsetWidth;

    flipWrap.classList.add(exitClass);
    incoming.wrap.classList.remove(enterClass);
    incoming.wrap.classList.add("is-arc-center");

    animTimer = window.setTimeout(function () {
      finalizeArc(incoming.wrap, newCode);
    }, ANIM_MS + 40);

    return true;
  }

  function navigate(delta) {
    if (animating || !currentCode) return;
    var codes = cardCodes();
    var idx = cardIndex(currentCode);
    if (idx < 0) return;
    var nextIdx = idx + delta;
    if (nextIdx < 0 || nextIdx >= codes.length) return;
    animateToCard(codes[nextIdx], delta);
  }

  function bindKeyboard() {
    if (keyboardBound) return;
    keyboardBound = true;
    document.addEventListener("keydown", function (e) {
      if (!modalEl || !modalEl.classList.contains("is-open") || animating) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        navigate(1);
      }
    });
  }

  function open(code, opts) {
    opts = opts || {};
    if (!listenersBound) bind();
    if (!keyboardBound) bindKeyboard();
    if (!refreshRefs()) return;

    fromMode = opts.from || "gallery";

    modalEl.classList.remove("is-closing", "is-carousel-anim");
    modalEl.classList.add("is-open");
    modalEl.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (!loadCard(code)) {
      close();
      return;
    }
  }

  function close() {
    if (!modalEl || !modalEl.classList.contains("is-open")) return;
    clearAnimTimer();
    cleanupGhostWraps();
    resetWrapMotion(flipWrap);
    modalEl.classList.remove("is-carousel-anim");
    animating = false;
    modalEl.classList.add("is-closing");
    modalEl.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(function () {
      modalEl.classList.remove("is-closing");
      modalEl.setAttribute("aria-hidden", "true");
      currentCode = null;
      resetFlip();
    }, 300);
  }

  function refreshLabels() {
    if (!hintEl) return;
    hintEl.textContent = isFlipped ? t("flipToFace") : t("modalHint");
    if (playBtn) playBtn.textContent = t("modalPlay");
  }

  window.GR_CardModal = {
    init: function () {
      bind();
      bindKeyboard();
    },
    open: open,
    close: close,
    refreshLabels: refreshLabels,
  };
})();
