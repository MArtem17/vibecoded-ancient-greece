/* global window, document, localStorage */
(function () {
  var cfg = window.GR_DECK_CONFIG || { progressKey: "drevnyaya_greciya_prog" };

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
  var ASSET_VERSION = "20260709-back-tune";

  function cardAsset(code, side) {
    if (window.GR_Locale && window.GR_Locale.cardAsset) {
      return window.GR_Locale.cardAsset(code, side);
    }
    var suffix = side === "back" ? "_back" : "";
    return "assets/web/" + code + suffix + ".webp?v=" + ASSET_VERSION;
  }

  function progKey() {
    if (window.GR_Auth && window.GR_Auth.getProgressKey) {
      return window.GR_Auth.getProgressKey();
    }
    return cfg.progressKey || "drevnyaya_greciya_prog";
  }

  function getProgress() {
    if (window.GR_Auth && window.GR_Auth.loadProgress) {
      return window.GR_Auth.loadProgress();
    }
    var raw = localStorage.getItem(progKey());
    if (!raw) return { studied: [], passed: {}, gears: [], questPassed: {} };
    try {
      var p = JSON.parse(raw);
      if (!p.gears) p.gears = [];
      if (!p.questPassed) p.questPassed = {};
      return p;
    } catch (e) {
      return { studied: [], passed: {}, gears: [], questPassed: {} };
    }
  }

  function saveProgress(prog) {
    if (window.GR_Auth && window.GR_Auth.saveProgress) {
      window.GR_Auth.saveProgress(prog);
      return;
    }
    localStorage.setItem(progKey(), JSON.stringify(prog));
  }

  function findCard(code) {
    var cards = cardsList();
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].code === code) return cards[i];
    }
    return null;
  }

  function cardStatus(code, prog) {
    if (prog.passed && prog.passed[code] === true) return "passed";
    if (prog.studied && prog.studied.indexOf(code) >= 0) return "studied";
    return "new";
  }

  function openCard(code) {
    if (window.GR_CardModal && window.GR_CardModal.open) {
      window.GR_CardModal.open(code, { from: "map" });
      return;
    }
    window.location.href =
      (window.GR_Hub && window.GR_Hub.playHref
        ? window.GR_Hub.playHref(code, "map")
        : "play.html?c=" + code + "&from=map");
  }

  function createCardThumb(c, st) {
    var thumb = document.createElement("div");
    thumb.className = "pin-thumb";
    var img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    setCardImg(img, c.code, "face");
    thumb.appendChild(img);

    var badge = document.createElement("span");
    badge.className = "pin-badge";
    badge.textContent = st === "passed" ? "✓" : c.code;
    thumb.appendChild(badge);
    return thumb;
  }

  function createDotButton(c, st) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pin-dot pin-" + st;
    btn.style.left = c.pin.x + "%";
    btn.style.top = c.pin.y + "%";
    btn.setAttribute("aria-label", c.title);
    btn.dataset.code = c.code;

    var label = document.createElement("span");
    label.className = "pin-dot__label";
    label.textContent = st === "passed" ? "✓" : c.code;
    btn.appendChild(label);

    btn.onclick = function () {
      openCard(c.code);
    };
    return btn;
  }

  var MAP_LAYOUT_KEY = "drevnyaya_greciya_map_layout_v7";
  var MAP_CORE = { cx: 53, cy: 54, rx: 16.5, ry: 19.5 };
  var MAP_CORE_MARGIN = 2.6;
  var MIN_CARD_DIST = 9.8;
  var linksRaf = 0;

  function layoutStorageKey() {
    return MAP_LAYOUT_KEY;
  }

  function loadCardLayout() {
    try {
      return JSON.parse(localStorage.getItem(layoutStorageKey())) || {};
    } catch (e) {
      return {};
    }
  }

  function saveCardPosition(code, x, y) {
    var layout = loadCardLayout();
    layout[code] = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    try {
      localStorage.setItem(layoutStorageKey(), JSON.stringify(layout));
    } catch (e2) {}
  }

  function hashCode(str) {
    var h = 0;
    for (var i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  function isForbiddenZone(x, y) {
    var dx = (x - MAP_CORE.cx) / MAP_CORE.rx;
    var dy = (y - MAP_CORE.cy) / MAP_CORE.ry;
    return dx * dx + dy * dy < 1.02;
  }

  function posDist(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function applySafeMargins(pos) {
    var p = { x: pos.x, y: pos.y };
    if (p.y < 18) p.y = 18;
    if (p.y > 90) p.y = 90;
    if (p.x < 5) p.x = 5;
    if (p.x > 95) p.x = 95;
    return p;
  }

  function pushOutOfMapCore(pos) {
    if (!isForbiddenZone(pos.x, pos.y)) return applySafeMargins(pos);
    var ang = Math.atan2(
      (pos.y - MAP_CORE.cy) / MAP_CORE.ry,
      (pos.x - MAP_CORE.cx) / MAP_CORE.rx
    );
    return applySafeMargins(
      clampPos(
        MAP_CORE.cx + Math.cos(ang) * (MAP_CORE.rx + MAP_CORE_MARGIN),
        MAP_CORE.cy + Math.sin(ang) * (MAP_CORE.ry + MAP_CORE_MARGIN)
      )
    );
  }

  function coreEllipseDist(x, y) {
    var dx = (x - MAP_CORE.cx) / MAP_CORE.rx;
    var dy = (y - MAP_CORE.cy) / MAP_CORE.ry;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function pinCrowding(draft, drafts) {
    var pin = draft.item.card.pin;
    var count = 0;
    var k;
    for (k = 0; k < drafts.length; k++) {
      if (drafts[k] === draft) continue;
      if (posDist(pin, drafts[k].item.card.pin) < 7.2) count++;
    }
    return count;
  }

  function generatePinCandidates(pin, code) {
    var candidates = [];
    var baseAngle = (hashCode(code) % 360) * (Math.PI / 180);
    var distSteps = [4.5, 5.8, 7.2, 8.8, 10.5, 12.5, 15, 18, 21];
    var angleCount = 16;
    var di;
    var ai;
    for (di = 0; di < distSteps.length; di++) {
      for (ai = 0; ai < angleCount; ai++) {
        var ang = baseAngle + (ai / angleCount) * Math.PI * 2;
        candidates.push({
          x: pin.x + Math.cos(ang) * distSteps[di],
          y: pin.y + Math.sin(ang) * distSteps[di],
        });
      }
    }
    return candidates;
  }

  function scoreCandidate(pos, draft, drafts, pin) {
    if (isForbiddenZone(pos.x, pos.y)) return -1e9;
    var score = -posDist(pos, pin) * 3.4;
    var coreDist = coreEllipseDist(pos.x, pos.y);
    if (coreDist < 1.18) score -= (1.18 - coreDist) * 95;

    var k;
    for (k = 0; k < drafts.length; k++) {
      if (drafts[k] === draft) continue;
      var d = posDist(pos, drafts[k].pos);
      if (d < MIN_CARD_DIST) return -1e9;
      if (d < MIN_CARD_DIST * 1.2) score -= (MIN_CARD_DIST * 1.2 - d) * 14;
    }
    return score;
  }

  function canPlaceAt(pos, self, drafts, minDist) {
    if (isForbiddenZone(pos.x, pos.y)) return false;
    var k;
    for (k = 0; k < drafts.length; k++) {
      if (drafts[k] === self) continue;
      if (posDist(pos, drafts[k].pos) < minDist) return false;
    }
    return true;
  }

  function assignByBestCandidate(drafts) {
    var movable = [];
    var i;
    var ci;
    for (i = 0; i < drafts.length; i++) {
      if (!drafts[i].fixed) movable.push(drafts[i]);
    }

    movable.sort(function (a, b) {
      var crowd = pinCrowding(b, drafts) - pinCrowding(a, drafts);
      if (crowd !== 0) return crowd;
      return hashCode(a.item.code) - hashCode(b.item.code);
    });

    for (i = 0; i < movable.length; i++) {
      var draft = movable[i];
      var pin = draft.item.card.pin;
      var code = draft.item.code;
      var candidates = generatePinCandidates(pin, code);
      var best = null;
      var bestScore = -1e12;
      var pos;
      var score;

      for (ci = 0; ci < candidates.length; ci++) {
        pos = pushOutOfMapCore(clampPos(candidates[ci].x, candidates[ci].y));
        score = scoreCandidate(pos, draft, drafts, pin);
        if (score > bestScore) {
          bestScore = score;
          best = pos;
        }
      }

      draft.pos = best || pushOutOfMapCore(clampPos(pin.x, pin.y + 8));
    }
  }

  function repelFromMapCenter(drafts) {
    var i;
    for (i = 0; i < drafts.length; i++) {
      if (drafts[i].fixed) continue;
      drafts[i].pos = pushOutOfMapCore(drafts[i].pos);
    }
  }

  function polishPinProximity(drafts, passes) {
    var minDist = MIN_CARD_DIST;
    var pass;
    var i;
    var j;
    var pin;
    var cur;
    var next;

    for (pass = 0; pass < passes; pass++) {
      for (i = 0; i < drafts.length; i++) {
        for (j = i + 1; j < drafts.length; j++) {
          var a = drafts[i].pos;
          var b = drafts[j].pos;
          var d = posDist(a, b);
          if (d >= minDist || d < 0.01) continue;
          var push = (minDist - d) * 0.74;
          var nx = (a.x - b.x) / d;
          var ny = (a.y - b.y) / d;
          if (!drafts[i].fixed && !drafts[j].fixed) {
            a.x += nx * push;
            a.y += ny * push;
            b.x -= nx * push;
            b.y -= ny * push;
            drafts[i].pos = pushOutOfMapCore(clampPos(a.x, a.y));
            drafts[j].pos = pushOutOfMapCore(clampPos(b.x, b.y));
          } else if (drafts[i].fixed && !drafts[j].fixed) {
            b.x -= nx * push * 2;
            b.y -= ny * push * 2;
            drafts[j].pos = pushOutOfMapCore(clampPos(b.x, b.y));
          } else if (!drafts[i].fixed && drafts[j].fixed) {
            a.x += nx * push * 2;
            a.y += ny * push * 2;
            drafts[i].pos = pushOutOfMapCore(clampPos(a.x, a.y));
          }
        }
      }

      for (i = 0; i < drafts.length; i++) {
        if (drafts[i].fixed) continue;
        pin = drafts[i].item.card.pin;
        cur = drafts[i].pos;
        next = pushOutOfMapCore(
          clampPos(
            cur.x + (pin.x - cur.x) * 0.16,
            cur.y + (pin.y - cur.y) * 0.16
          )
        );
        if (canPlaceAt(next, drafts[i], drafts, minDist - 0.2)) {
          drafts[i].pos = next;
        }
      }

      repelFromMapCenter(drafts);
    }
  }

  function requestMapLinks() {
    if (linksRaf) return;
    linksRaf = window.requestAnimationFrame(function () {
      linksRaf = 0;
      updateMapLinks();
    });
  }

  function clampPos(x, y) {
    return {
      x: Math.max(3, Math.min(97, x)),
      y: Math.max(9, Math.min(92, y)),
    };
  }

  function bindCardDrag(el, item) {
    var rail = document.getElementById("mapCardsRail");
    if (!rail) return;

    var dragging = false;
    var didDrag = false;
    var startX = 0;
    var startY = 0;
    var originLeft = 0;
    var originTop = 0;

    function onPointerDown(e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      dragging = true;
      didDrag = false;
      startX = e.clientX;
      startY = e.clientY;
      originLeft = parseFloat(el.style.left) || 50;
      originTop = parseFloat(el.style.top) || 50;
      el.classList.add("is-dragging");
      el.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (!didDrag && Math.abs(dx) + Math.abs(dy) > 5) didDrag = true;
      if (!didDrag) return;

      var rect = rail.getBoundingClientRect();
      var next = pushOutOfMapCore(
        clampPos(
          originLeft + (dx / rect.width) * 100,
          originTop + (dy / rect.height) * 100
        )
      );
      el.style.left = next.x + "%";
      el.style.top = next.y + "%";
      requestMapLinks();
    }

    function onPointerUp(e) {
      if (!dragging) return;
      dragging = false;
      el.classList.remove("is-dragging");
      try {
        el.releasePointerCapture(e.pointerId);
      } catch (err) {}

      if (didDrag) {
        var x = parseFloat(el.style.left);
        var y = parseFloat(el.style.top);
        saveCardPosition(item.code, x, y);
        el.dataset.dragMoved = "1";
        setTimeout(function () {
          delete el.dataset.dragMoved;
        }, 0);
      }
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    el.addEventListener(
      "click",
      function (e) {
        if (el.dataset.dragMoved === "1") {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        openCard(item.code);
      },
      true
    );
  }

  function createFloatCard(c, st) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "map-card-float pin-" + st;
    btn.setAttribute("aria-label", c.title);
    btn.dataset.code = c.code;
    btn.appendChild(createCardThumb(c, st));
    return btn;
  }

  function layoutFloatingCards(items, rail) {
    var savedLayout = loadCardLayout();
    var drafts = [];
    var i;

    for (i = 0; i < items.length; i++) {
      var item = items[i];
      var saved = savedLayout[item.code];
      var fixed = !!(saved && saved.x != null && saved.y != null);
      drafts.push({
        item: item,
        pos: fixed ? { x: saved.x, y: saved.y } : { x: 50, y: 50 },
        fixed: fixed,
      });
    }

    assignByBestCandidate(drafts);
    polishPinProximity(drafts, 26);

    for (i = 0; i < drafts.length; i++) {
      var draft = drafts[i];
      var node = createFloatCard(draft.item.card, draft.item.st);
      node.style.left = draft.pos.x + "%";
      node.style.top = draft.pos.y + "%";
      rail.appendChild(node);
      draft.item.cardEl = node;
      bindCardDrag(node, draft.item);
    }
  }

  var mapLinkItems = [];

  function updateMapLinks() {
    var svg = document.getElementById("mapLinks");
    var stage = document.getElementById("mapStage");
    if (!svg || !stage || !mapLinkItems.length) return;

    var rect = stage.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    var paths = [];
    for (var i = 0; i < mapLinkItems.length; i++) {
      var item = mapLinkItems[i];
      if (!item.dotEl || !item.cardEl) continue;
      var dot = item.dotEl.getBoundingClientRect();
      var card = item.cardEl.getBoundingClientRect();
      var x1 = dot.left + dot.width / 2 - rect.left;
      var y1 = dot.top + dot.height / 2 - rect.top;
      var x2 = card.left + card.width / 2 - rect.left;
      var y2 = card.top + card.height / 2 - rect.top;
      paths.push(
        '<line x1="' +
          x1.toFixed(1) +
          '" y1="' +
          y1.toFixed(1) +
          '" x2="' +
          x2.toFixed(1) +
          '" y2="' +
          y2.toFixed(1) +
          '" />'
      );
    }

    svg.setAttribute("viewBox", "0 0 " + rect.width + " " + rect.height);
    svg.innerHTML = '<g class="map-links__lines">' + paths.join("") + "</g>";
  }

  function scheduleMapLinks() {
    updateMapLinks();
    requestAnimationFrame(updateMapLinks);
    setTimeout(updateMapLinks, 80);
    setTimeout(updateMapLinks, 320);
  }

  function renderMapLayout(inner, area, prog) {
    var dotsHost = document.createElement("div");
    dotsHost.className = "pins-layer pins-layer--dots";
    dotsHost.setAttribute("data-area", area);

    mapLinkItems = [];
    var list = cardsList();
    var i;
    for (i = 0; i < list.length; i++) {
      var c = list[i];
      if (!c.pin || c.pin.area !== area) continue;
      var st = cardStatus(c.code, prog);
      var dotBtn = createDotButton(c, st);
      dotsHost.appendChild(dotBtn);
      mapLinkItems.push({ code: c.code, card: c, st: st, dotEl: dotBtn });
    }
    inner.appendChild(dotsHost);

    var rail = document.getElementById("mapCardsRail");
    if (rail) {
      rail.innerHTML = "";
      layoutFloatingCards(mapLinkItems, rail);
    }

    scheduleMapLinks();
  }

  function renderPins(container, area, prog) {
    renderMapLayout(container, area, prog);
  }

  function countProgress(prog) {
    var studied = prog.studied ? prog.studied.length : 0;
    var passed = 0;
    if (prog.passed) {
      for (var k in prog.passed) {
        if (prog.passed.hasOwnProperty(k) && prog.passed[k] === true) passed++;
      }
    }
    return { studied: studied, passed: passed, total: cardsList().length };
  }

  function syncMapScroll() {
    var mapScroll = document.getElementById("mapScroll");
    if (!mapScroll) return;
    if (mapScroll.scrollWidth > mapScroll.clientWidth + 8) {
      mapScroll.scrollLeft = (mapScroll.scrollWidth - mapScroll.clientWidth) / 2;
    }
  }

  function scheduleMapScroll() {
    syncMapScroll();
    scheduleMapLinks();
    requestAnimationFrame(syncMapScroll);
    setTimeout(syncMapScroll, 120);
    setTimeout(syncMapScroll, 400);
  }

  var mapScrollBound = false;

  function bindMapScroll() {
    if (mapScrollBound) return;
    var mapScroll = document.getElementById("mapScroll");
    if (!mapScroll) return;
    mapScroll.addEventListener("scroll", requestMapLinks, { passive: true });
    mapScrollBound = true;
  }

  if (typeof window !== "undefined") {
    window.addEventListener("resize", scheduleMapScroll, { passive: true });
    window.addEventListener("orientationchange", function () {
      setTimeout(scheduleMapScroll, 120);
    });
  }

  window.GR_Space = {
    init: function () {
      var prog = getProgress();
      var titleEl = document.getElementById("deckTitle");
      if (titleEl) titleEl.textContent = cfg.title;

      var wrap = document.getElementById("spaceWrap");
      var inner = document.getElementById("spaceInner");
      if (!wrap || !inner) return;
      inner.innerHTML = "";
      wrap.classList.remove("space-fallback");

      var img = document.createElement("img");
      img.className = "space-img";
      img.src =
        window.GR_Locale && window.GR_Locale.spaceAsset
          ? window.GR_Locale.spaceAsset()
          : cfg.space.main;
      img.alt =
        window.GR_Locale && window.GR_Locale.t
          ? window.GR_Locale.t("mapTitle")
          : "Карта Древней Греции";
      img.onerror = function () {
        img.style.display = "none";
        wrap.classList.add("space-fallback");
      };
      inner.appendChild(img);
      bindMapScroll();
      renderPins(inner, "main", prog);

      syncMapScroll();
      scheduleMapScroll();
    },

    syncMapScroll: syncMapScroll,
    scheduleMapScroll: scheduleMapScroll,
    updateMapLinks: updateMapLinks,
    scheduleMapLinks: scheduleMapLinks,
    getProgress: getProgress,
    saveProgress: saveProgress,
    findCard: findCard,
    cardAsset: cardAsset,
    markStudied: function (code) {
      var prog = getProgress();
      if (prog.studied.indexOf(code) < 0) prog.studied.push(code);
      saveProgress(prog);
    },
    markPassed: function (code, ok) {
      var prog = getProgress();
      if (prog.studied.indexOf(code) < 0) prog.studied.push(code);
      prog.passed[code] = !!ok;
      if (ok && window.GR_Hub && window.GR_Hub.gearForCard) {
        var gear = window.GR_Hub.gearForCard(code);
        if (gear) {
          if (!prog.gears) prog.gears = [];
          if (prog.gears.indexOf(code) < 0) prog.gears.push(code);
        }
      }
      saveProgress(prog);
    },
    countProgress: countProgress,
  };
})();
