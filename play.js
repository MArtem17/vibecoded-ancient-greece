(function() {
  var CFG = window.GR_DECK_CONFIG || {};
  var CARDS = window.GR_CARDS || [];
  var TOTAL = CFG.cards || CARDS.length;
  var PROG_KEY = CFG.progressKey || 'drevnyaya_greciya_prog';
  var ASSET_VERSION = '20260709-face-18';
  var FROM_MODE = getParam('from') || '';

  function t(key, vars) {
    return window.GR_Locale ? window.GR_Locale.t(key, vars) : key;
  }

  function cardAsset(code, side) {
    if (window.GR_Locale && window.GR_Locale.cardAsset) {
      return window.GR_Locale.cardAsset(code, side);
    }
    var suffix = side === 'back' ? '_back' : '';
    return 'assets/web/' + code + suffix + '.webp?v=' + ASSET_VERSION;
  }

  function setCardImg(img, code, side) {
    if (!img) return;
    if (window.GR_Locale && window.GR_Locale.setCardImg) {
      window.GR_Locale.setCardImg(img, code, side);
      return;
    }
    img.src = cardAsset(code, side);
  }

  function mountCardBack(c) {
    var backImg = document.getElementById('backImg');
    var backHtml = document.getElementById('backHtml');
    if (!backImg) return;

    if (backHtml) {
      backHtml.hidden = true;
      backHtml.innerHTML = '';
    }
    backImg.hidden = false;
    backImg.alt = c.title || '';
    setCardImg(backImg, c.code, 'back');
    // updateBackAudioBtn(c.code);
  }

  /*
  function updateBackAudioBtn(cardCode) {
    var btn = document.getElementById('backAudioBtn');
    if (!btn || !window.GR_Audio) return;
    btn.classList.remove('playing');
    window.GR_Audio.loadManifest().then(function () {
      var has = window.GR_Audio.hasCardAudio(cardCode);
      var enabled = window.GR_Audio.isEnabled();
      btn.hidden = !has || !enabled;
      btn.onclick = function (e) {
        e.stopPropagation();
        if (!window.GR_Audio.isEnabled()) return;
        if (btn.classList.contains('playing')) {
          window.GR_Audio.stop();
          btn.classList.remove('playing');
          return;
        }
        btn.classList.add('playing');
        window.GR_Audio.playCard(cardCode).then(function () {
          btn.classList.remove('playing');
        }).catch(function () {
          btn.classList.remove('playing');
        });
      };
    });
  }

  function tryAutoPlayBack() {
    if (!window.GR_Audio || !window.GR_Audio.isEnabled()) return;
    var btn = document.getElementById('backAudioBtn');
    window.GR_Audio.loadManifest().then(function () {
      if (!window.GR_Audio.hasCardAudio(code)) return;
      if (btn) {
        btn.hidden = false;
        btn.classList.add('playing');
      }
      return window.GR_Audio.playCard(code);
    }).then(function () {
      if (btn) btn.classList.remove('playing');
    }).catch(function () {
      if (btn) btn.classList.remove('playing');
    });
  }
  */

  function getParam(name) {
    var search = window.location.search.substring(1);
    var parts = search.split('&');
    for (var i = 0; i < parts.length; i++) {
      var pair = parts[i].split('=');
      if (pair[0] === name) return decodeURIComponent(pair[1] || '');
    }
    return null;
  }

  var code, card, prog, hsOverlayEl, hsPinApi, isFlipped;
  var ynOverlayEl = document.getElementById('taskYnOverlay');
  ynOverlayEl.addEventListener('click', function(e) { e.stopPropagation(); });

  function loadProg() {
    if (window.GR_Auth && window.GR_Auth.loadProgress) {
      return window.GR_Auth.loadProgress();
    }
    try {
      var key =
        window.GR_Auth && window.GR_Auth.getProgressKey
          ? window.GR_Auth.getProgressKey()
          : PROG_KEY;
      var p = JSON.parse(localStorage.getItem(key)) || { studied: [], passed: {} };
      if (!p.gears) p.gears = [];
      if (!p.questPassed) p.questPassed = {};
      return p;
    } catch (e) {
      return { studied: [], passed: {}, gears: [], questPassed: {} };
    }
  }

  function saveProg() {
    try {
      if (window.GR_Auth && window.GR_Auth.saveProgress) {
        window.GR_Auth.saveProgress(prog);
        return;
      }
      localStorage.setItem(PROG_KEY, JSON.stringify(prog));
    } catch (e) {}
  }

  function markStudied() {
    if (prog.studied.indexOf(code) === -1) { prog.studied.push(code); saveProg(); }
    if (window.GR_Space && window.GR_Space.markStudied) window.GR_Space.markStudied(code);
  }

  function markPassed(correct) {
    prog.passed[code] = correct;
    if (correct && window.GR_QUEST) {
      for (var gi = 0; gi < window.GR_QUEST.gears.length; gi++) {
        if (window.GR_QUEST.gears[gi].card === code) {
          if (!prog.gears) prog.gears = [];
          if (prog.gears.indexOf(code) < 0) prog.gears.push(code);
        }
      }
    }
    saveProg();
    if (window.GR_Space && window.GR_Space.markPassed) window.GR_Space.markPassed(code, correct);
  }

  function updateStoryBar(c) {
    var bar = document.getElementById('storyBar');
    if (bar) bar.hidden = true;
  }

  function backUrl() {
    var hash = FROM_MODE === 'quest' ? '#quest' : FROM_MODE === 'gallery' ? '#gallery' : '#map';
    if (window.GR_Locale && window.GR_Locale.lang === 'en') {
      return 'index.html?lang=en' + hash;
    }
    return 'index.html' + hash;
  }

  function applyLocaleUi() {
    if (!window.GR_Locale || !window.GR_Locale.t) return;

    var cardHint = document.getElementById('cardHint');
    if (cardHint) cardHint.textContent = t('flipCard');

    var tryBtn = document.getElementById('tryBtn');
    if (tryBtn) tryBtn.textContent = t('tryTask');

    var navTitle2 = document.getElementById('navTitle2');
    if (navTitle2) navTitle2.textContent = t('taskLabel');

    var resultNavTitle = document.querySelector('#sResult .nav-title');
    if (resultNavTitle) resultNavTitle.textContent = t('resultLabel');

    var resultVerdict = document.getElementById('resultVerdict');
    if (resultVerdict) resultVerdict.textContent = t('correct');

    var resultNextBtn = document.getElementById('resultNextBtn');
    if (resultNextBtn) resultNextBtn.textContent = t('nextCard');

    var resultBackBtn = document.querySelector('#sResult .result-btns .btn:not(.primary)');
    if (resultBackBtn) resultBackBtn.textContent = t('back');
  }

  function updateTryBtn() {
    prog = loadProg();
    var tryBtn = document.getElementById('tryBtn');
    if (!tryBtn) return;
    var hasTask = !!(card && card.task);
    tryBtn.hidden = !hasTask;
    if (!hasTask) return;
    var result = (prog.passed && prog.passed[code] !== undefined) ? prog.passed[code] : null;
    tryBtn.className = 'try-btn' + (result === true ? ' done-ok' : result === false ? ' done-bad' : '');
    tryBtn.textContent = result !== null ? t('tryAgain') : t('tryTask');
    var passed = prog.passed || {};
    var done = Object.keys(passed).filter(function(k) { return passed[k] === true; }).length;
    var fill = document.getElementById('progFill');
    if (fill) fill.style.width = (TOTAL > 0 ? Math.round(done / TOTAL * 100) : 0) + '%';
  }

  function canNavigate() {
    return document.getElementById('sCard').classList.contains('active') &&
           (!hsOverlayEl || !hsOverlayEl.classList.contains('open')) &&
           !ynOverlayEl.classList.contains('open');
  }

  var resetZoom, _showPreview, _completeSwipe;

  (function() {
    var outer = document.getElementById('flipOuter');
    var cardWrap = document.getElementById('cardWrap');
    var wrap = document.getElementById('flipContainer');
    var slideEl = document.getElementById('cardSlide');
    var zoom = 1, panX = 0, panY = 0;
    var activeTouches = {};
    var lastDist = 0;
    var dragStart = null, moved = false;
    var touchHandled = false;
    var swipeMode = null, swipeDragY = 0, touchStartTime = 0;
    var previewEl = null, previewDir = null;

    function wrapCode(num) {
      return num < 10 ? '0' + num : '' + num;
    }

    function tdist(ids) {
      var t1 = activeTouches[ids[0]], t2 = activeTouches[ids[1]];
      var dx = t2.x - t1.x, dy = t2.y - t1.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function apply() {
      wrap.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
    }

    function clamp() {
      var maxX = Math.max(0, (zoom - 1) * outer.clientWidth / 2);
      var maxY = Math.max(0, (zoom - 1) * outer.clientHeight / 2);
      panX = Math.max(-maxX, Math.min(maxX, panX));
      panY = Math.max(-maxY, Math.min(maxY, panY));
    }

    resetZoom = function() { zoom = 1; panX = 0; panY = 0; apply(); };

    function showPreview(newC, direction) {
      if (previewEl && previewEl.parentNode) previewEl.parentNode.removeChild(previewEl);
      var cw = document.getElementById('cardWrap');
      var el = document.createElement('div');
      el.style.cssText = 'position:absolute;inset:0;z-index:0;will-change:transform;' +
        'transform:translateY(' + (direction === 'next' ? cw.clientHeight : -cw.clientHeight) + 'px);';
      var img = document.createElement('img');
      img.src = cardAsset(newC, 'face');
      img.alt = '';
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;' +
        'border-radius:16px;box-shadow:0 10px 36px rgba(0,0,0,.6),0 0 0 2px rgba(200,162,62,.35);';
      el.appendChild(img);
      cw.appendChild(el);
      slideEl.style.position = 'relative';
      slideEl.style.zIndex = '1';
      previewEl = el;
      previewDir = direction;
    }

    function completeSwipe(direction) {
      var num = parseInt(code, 10);
      var newNum = direction === 'next'
        ? (num >= TOTAL ? 1 : num + 1)
        : (num <= 1 ? TOTAL : num - 1);
      var newC = wrapCode(newNum);
      var ease = 'cubic-bezier(.4,0,.2,1)';
      var cw = document.getElementById('cardWrap');
      var outY = direction === 'next' ? -cw.clientHeight : cw.clientHeight;

      slideEl.style.transition = 'transform .25s ' + ease;
      slideEl.style.transform = 'translateY(' + outY + 'px) scale(1)';

      var havePreview = previewEl && previewDir === direction;
      if (havePreview) {
        previewEl.style.transition = 'transform .25s ' + ease;
        previewEl.style.transform = 'translateY(0%)';
      } else if (previewEl && previewEl.parentNode) {
        previewEl.parentNode.removeChild(previewEl);
      }
      var _pEl = havePreview ? previewEl : null;
      previewEl = null;
      previewDir = null;

      setTimeout(function() {
        loadCard(newC, false, null);
        slideEl.style.transition = 'none';
        slideEl.style.transform = '';
        slideEl.style.position = '';
        slideEl.style.zIndex = '';
        if (_pEl && _pEl.parentNode) _pEl.parentNode.removeChild(_pEl);
      }, 250);
    }

    outer.addEventListener('touchstart', function(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        activeTouches[t.identifier] = {x: t.clientX, y: t.clientY};
      }
      var ids = Object.keys(activeTouches);
      if (ids.length === 1) {
        dragStart = {x: activeTouches[ids[0]].x, y: activeTouches[ids[0]].y, panX: panX, panY: panY};
        moved = false;
        swipeMode = null;
        touchStartTime = Date.now();
      } else if (ids.length === 2) {
        lastDist = tdist(ids);
        dragStart = null;
        swipeMode = 'pan';
      }
    }, {passive: true});

    outer.addEventListener('touchmove', function(e) {
      e.preventDefault();
      for (var i = 0; i < e.changedTouches.length; i++) {
        var t = e.changedTouches[i];
        activeTouches[t.identifier] = {x: t.clientX, y: t.clientY};
      }
      var ids = Object.keys(activeTouches);
      if (ids.length === 2 && lastDist > 0) {
        swipeMode = 'pan';
        var d = tdist(ids);
        zoom = Math.max(1, Math.min(4, zoom * d / lastDist));
        lastDist = d;
        clamp();
        apply();
      } else if (ids.length === 1 && dragStart) {
        var dx = activeTouches[ids[0]].x - dragStart.x;
        var dy = activeTouches[ids[0]].y - dragStart.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved = true;
        if (swipeMode === null && moved) {
          swipeMode = (zoom === 1 && canNavigate() && Math.abs(dy) > Math.abs(dx)) ? 'swipe' : 'pan';
        }
        if (swipeMode === 'swipe') {
          swipeDragY = dy;
          var cardH = document.getElementById('cardWrap').clientHeight;
          var progress = Math.min(1, Math.abs(dy) / cardH);
          var curDir = dy <= 0 ? 'next' : 'prev';
          if (!previewEl || previewDir !== curDir) {
            var pnum = parseInt(code, 10);
            var pnext = curDir === 'next' ? (pnum >= TOTAL ? 1 : pnum + 1) : (pnum <= 1 ? TOTAL : pnum - 1);
            showPreview(wrapCode(pnext), curDir);
          }
          slideEl.style.transition = 'none';
          slideEl.style.transform = 'translateY(' + dy + 'px) scale(' + (1 - progress * 0.04).toFixed(4) + ')';
          previewEl.style.transition = 'none';
          previewEl.style.transform = 'translateY(' + ((curDir === 'next' ? cardH : -cardH) + dy) + 'px)';
        } else if (swipeMode === 'pan' && (zoom > 1 || moved)) {
          panX = dragStart.panX + dx;
          panY = dragStart.panY + dy;
          clamp();
          apply();
        }
      }
    }, {passive: false});

    outer.addEventListener('touchend', function(e) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        delete activeTouches[e.changedTouches[i].identifier];
      }
      var remaining = Object.keys(activeTouches).length;
      if (remaining === 0) {
        if (swipeMode === 'swipe') {
          swipeMode = null;
          var cardH = document.getElementById('cardWrap').clientHeight;
          var elapsed = Math.max(1, Date.now() - touchStartTime);
          var vel = Math.abs(swipeDragY) / elapsed;
          if (Math.abs(swipeDragY) >= cardH * 0.2 || vel > 0.4) {
            completeSwipe(swipeDragY < 0 ? 'next' : 'prev');
          } else {
            var snapH = cardH;
            slideEl.style.transition = 'transform .4s cubic-bezier(.34,1.56,.64,1)';
            slideEl.style.transform = '';
            if (previewEl) {
              var _pDir = previewDir, _pEl2 = previewEl;
              previewEl = null;
              previewDir = null;
              slideEl.style.position = '';
              slideEl.style.zIndex = '';
              _pEl2.style.transition = 'transform .4s cubic-bezier(.34,1.56,.64,1)';
              _pEl2.style.transform = 'translateY(' + (_pDir === 'next' ? snapH : -snapH) + 'px)';
              setTimeout(function() { if (_pEl2.parentNode) _pEl2.parentNode.removeChild(_pEl2); }, 400);
            }
            setTimeout(function() { slideEl.style.transition = ''; slideEl.style.position = ''; slideEl.style.zIndex = ''; }, 400);
          }
          swipeDragY = 0;
        } else if (!moved) {
          if (ynOverlayEl.classList.contains('open')) { if (remaining < 2) lastDist = 0; return; }
          var _t = e.target;
          var _inCard = false;
          while (_t && _t !== outer) {
            if (_t.getAttribute && _t.getAttribute('data-hs')) { _t = null; break; }
            if (_t.tagName === 'BUTTON') { _t = null; break; }
            if (_t === cardWrap) _inCard = true;
            _t = _t.parentNode;
          }
          if (!_t || !_inCard) { if (remaining < 2) lastDist = 0; return; }
          touchHandled = true;
          window.doFlip();
        }
      }
      if (remaining < 2) lastDist = 0;
    }, {passive: true});

    outer.addEventListener('click', function(e) {
      if (touchHandled) { touchHandled = false; moved = false; return; }
      if (ynOverlayEl.classList.contains('open')) return;
      if (FROM_MODE === 'quest' && hsOverlayEl && hsOverlayEl.classList.contains('open')) {
        var onHs = e.target === hsOverlayEl || hsOverlayEl.contains(e.target);
        if (!onHs) {
          window.closeHsSheet();
          window.location.href = 'quest-chapter.html?c=' + code;
          return;
        }
      }
      if (FROM_MODE === 'quest') {
        var inCard = false;
        var n = e.target;
        while (n && n !== outer) {
          if (n === cardWrap) { inCard = true; break; }
          n = n.parentNode;
        }
        if (!inCard && !moved) {
          window.location.href = 'quest-chapter.html?c=' + code;
          return;
        }
      }
      if (!moved) {
        var _n = e.target;
        while (_n && _n !== cardWrap) _n = _n.parentNode;
        if (_n) window.doFlip();
      }
      moved = false;
    });

    _showPreview = showPreview;
    _completeSwipe = completeSwipe;
  })();

  (function() {
    var wheelLock = false;
    document.getElementById('flipOuter').addEventListener('wheel', function(e) {
      e.preventDefault();
      if (!canNavigate() || wheelLock) return;
      wheelLock = true;
      setTimeout(function() { wheelLock = false; }, 600);
      var wdir = e.deltaY > 0 ? 'next' : 'prev';
      var wnum = parseInt(code, 10);
      var wdest = wdir === 'next' ? (wnum >= TOTAL ? 1 : wnum + 1) : (wnum <= 1 ? TOTAL : wnum - 1);
      var wcode = wdest < 10 ? '0' + wdest : '' + wdest;
      _showPreview(wcode, wdir);
      _completeSwipe(wdir);
    }, {passive: false});
  })();

  function buildHotspots(c) {
    if (hsOverlayEl && hsOverlayEl.parentNode) hsOverlayEl.parentNode.removeChild(hsOverlayEl);
    hsOverlayEl = null;
    hsPinApi = null;
    var front = document.querySelector('.card-side.front');
    if (!front) return;

    var hsList = window.GR_CardView ? window.GR_CardView.hotspotsForDisplay(c) : (c.hotspots || []);
    if (!hsList.length) return;

    hsOverlayEl = document.createElement('div');
    hsOverlayEl.className = 'hs-card-overlay';
    hsOverlayEl.setAttribute('data-hs', '1');
    hsOverlayEl.innerHTML =
      '<div class="hs-ov-num" id="hsOvNum"></div>' +
      '<div class="hs-ov-label" id="hsOvLabel"></div>' +
      '<div class="hs-ov-cardtext" id="hsOvCardText"></div>' +
      '<div class="hs-ov-detail" id="hsOvDetail"></div>' +
      '<div class="hs-ov-hint">' + t('hsClose') + '</div>';
    hsOverlayEl.addEventListener('click', function(e) { e.stopPropagation(); window.closeHsSheet(); });
    hsOverlayEl.addEventListener('mouseenter', function() {
      if (hsPinApi && hsPinApi.cancelClose) hsPinApi.cancelClose();
    });
    hsOverlayEl.addEventListener('mouseleave', function() {
      if (hsPinApi && hsPinApi.scheduleClose) hsPinApi.scheduleClose();
    });
    document.getElementById('flipContainer').appendChild(hsOverlayEl);

    if (window.GR_CardView && window.GR_CardView.mountHotspotPins) {
      hsPinApi = window.GR_CardView.mountHotspotPins(front, hsList, {
        canShow: function() { return !isFlipped; },
        onShow: function(hs) { window.openHsSheet(hs); },
        onHide: function() { window.closeHsSheet(); }
      });
    }
  }

  window.openHsSheet = function(hs) {
    if (!hsOverlayEl) return;
    document.getElementById('hsOvNum').textContent = hs.n;
    document.getElementById('hsOvLabel').textContent = hs.label;
    document.getElementById('hsOvCardText').textContent = hs.cardText || '';
    document.getElementById('hsOvDetail').textContent = hs.detail;
    hsOverlayEl.classList.add('open');
  };
  window.closeHsSheet = function() {
    if (hsOverlayEl) hsOverlayEl.classList.remove('open');
    document.querySelectorAll('.hs-pin.is-active').forEach(function(p) {
      p.classList.remove('is-active');
    });
    if (hsPinApi && hsPinApi.cancelClose) hsPinApi.cancelClose();
  };

  function openYesNoTask(task) {
    ynOverlayEl.innerHTML =
      '<div class="yn-side-label yes" id="ynLabelYes">' + t('yes') + '</div>' +
      '<div class="yn-side-label no" id="ynLabelNo">' + t('no') + '</div>' +
      '<div class="yn-q">' + (task.q || task.statement || '') + '</div>' +
      '<div class="yn-hint">' + t('ynHint') + '</div>';
    ynOverlayEl.style.transform = '';
    ynOverlayEl.classList.add('open');
    initYnSwipe(task);
  }

  function initYnSwipe(task) {
    var startX = null, curDx = 0, active = false;
    var labelYes = document.getElementById('ynLabelYes');
    var labelNo = document.getElementById('ynLabelNo');

    function getThreshold() { return (ynOverlayEl.offsetWidth || 280) * 0.3; }

    function applyDrag(dx) {
      var pct = dx / getThreshold();
      var rot = Math.max(-20, Math.min(20, pct * 18));
      ynOverlayEl.style.transition = 'none';
      ynOverlayEl.style.transform = 'rotate(' + rot + 'deg) translateX(' + (dx * 0.45) + 'px)';
      labelYes.style.opacity = String(Math.max(0, Math.min(1, pct)));
      labelNo.style.opacity = String(Math.max(0, Math.min(1, -pct)));
    }

    function snapBack() {
      ynOverlayEl.style.transition = 'transform .4s cubic-bezier(.34,1.56,.64,1)';
      ynOverlayEl.style.transform = '';
      labelYes.style.opacity = '0';
      labelNo.style.opacity = '0';
    }

    function decide(answer) {
      var dir = answer ? 1 : -1;
      ynOverlayEl.style.transition = 'transform .28s ease-in, opacity .28s ease-in';
      ynOverlayEl.style.transform = 'rotate(' + (dir * 20) + 'deg) translateX(' + (dir * 120) + '%)';
      ynOverlayEl.style.opacity = '0';
      setTimeout(function() {
        ynOverlayEl.style.transition = '';
        ynOverlayEl.style.transform = '';
        ynOverlayEl.style.opacity = '';
        var correct = (answer === task.correct);
        markPassed(correct);
        showYnResult(correct, task.explanation);
      }, 260);
    }

    function onStart(x) { startX = x; curDx = 0; active = true; }
    function onMove(x) { if (!active || startX === null) return; curDx = x - startX; applyDrag(curDx); }
    function onEnd() {
      if (!active) return;
      active = false;
      if (Math.abs(curDx) >= getThreshold()) decide(curDx > 0);
      else snapBack();
    }

    var mmHandler, muHandler;
    ynOverlayEl.addEventListener('touchstart', function(e) { e.stopPropagation(); onStart(e.touches[0].clientX); }, {passive: true});
    ynOverlayEl.addEventListener('touchmove', function(e) { e.stopPropagation(); e.preventDefault(); onMove(e.touches[0].clientX); }, {passive: false});
    ynOverlayEl.addEventListener('touchend', function(e) { e.stopPropagation(); onEnd(); }, {passive: true});
    ynOverlayEl.addEventListener('mousedown', function(e) {
      onStart(e.clientX);
      mmHandler = function(ev) { onMove(ev.clientX); };
      muHandler = function() { onEnd(); document.removeEventListener('mousemove', mmHandler); document.removeEventListener('mouseup', muHandler); };
      document.addEventListener('mousemove', mmHandler);
      document.addEventListener('mouseup', muHandler);
    });
  }

  function showYnResult(correct, explanation) {
    var gearMsg = '';
    if (correct && window.GR_QUEST) {
      for (var gi = 0; gi < window.GR_QUEST.gears.length; gi++) {
        if (window.GR_QUEST.gears[gi].card === code) {
          gearMsg = '<div style="margin-top:8px;color:#C8A23E;font-weight:900;">' + t('gearFound') + ' ' + window.GR_QUEST.gears[gi].name + '</div>';
          break;
        }
      }
    }
    ynOverlayEl.innerHTML =
      '<div class="yn-result-icon ' + (correct ? 'ok' : 'bad') + '">' + (correct ? '✓' : '✗') + '</div>' +
      '<div class="yn-result-exp">' + (explanation || '') + gearMsg + '</div>' +
      '<button class="yn-next-btn" id="ynNextBtn">' + (correct ? t('great') : t('gotIt')) + '</button>';
    document.getElementById('ynNextBtn').addEventListener('click', function() {
      ynOverlayEl.classList.remove('open');
      updateTryBtn();
    });
    ynOverlayEl.classList.add('open');
  }

  function cardHintText(flipped) {
    if (flipped) {
      var faceHint = t('flipToFace');
      if (card && card.task) return faceHint + ' · ' + t('tryTaskBelow');
      return faceHint;
    }
    if (card && card.hotspots && card.hotspots.length) {
      var hsHint = t('flipHotspot');
      if (card.task) return hsHint + ' · ' + t('tryTaskBelow');
      return hsHint;
    }
    if (card && card.task) return t('flipCard') + ' · ' + t('tryTaskBelow');
    return t('flipCard');
  }

  window.doFlip = function() {
    window.closeHsSheet();
    if (window.GR_Audio) window.GR_Audio.stop();
    var audioBtn = document.getElementById('backAudioBtn');
    if (audioBtn) audioBtn.classList.remove('playing');
    isFlipped = !isFlipped;
    document.getElementById('cardFlip').classList.toggle('flipped', isFlipped);
    var hsSvg = document.querySelector('.card-side.front > svg');
    if (hsSvg) {
      if (isFlipped) hsSvg.style.display = 'none';
      else setTimeout(function() {
        var s = document.querySelector('.card-side.front > svg');
        if (s) s.style.display = '';
      }, 560);
    }
    if (isFlipped) {
      markStudied();
      // tryAutoPlayBack();
    }
    document.getElementById('cardHint').textContent = cardHintText(isFlipped);
  };

  function showScreen(id) {
    ['sCard', 'sTask', 'sResult'].forEach(function(sid) {
      document.getElementById(sid).classList.remove('active');
    });
    document.getElementById(id).classList.add('active');
  }

  function loadCard(newCode, replace, direction) {
    var newCard = null;
    for (var i = 0; i < CARDS.length; i++) {
      if (CARDS[i].code === newCode) { newCard = CARDS[i]; break; }
    }
    if (!newCard) { window.location.href = 'index.html'; return; }

    var slideEl = document.getElementById('cardSlide');

    function applyContent() {
      code = newCode;
      card = newCard;
      prog = loadProg();
      if (window.GR_Audio) window.GR_Audio.stop();
      isFlipped = false;
      document.getElementById('cardFlip').classList.remove('flipped');
      document.getElementById('cardHint').textContent = cardHintText(false);

      var navCode = 'GR-' + code;
      document.getElementById('navTitle').textContent = card.title;
      document.getElementById('navTitle2').textContent = t('taskLabel');
      document.getElementById('navCode').textContent = navCode;
      document.getElementById('navCode2').textContent = navCode;
      if (window.GR_Locale && window.GR_Locale.lang === 'en' && window.GR_Locale.ui) {
        document.title = window.GR_Locale.ui.deckTitle + ' · ' + card.title;
      }

      setCardImg(document.getElementById('faceImg'), code, 'face');
      mountCardBack(card);

      var n = parseInt(code, 10);
      var adj = [n <= 1 ? TOTAL : n - 1, n >= TOTAL ? 1 : n + 1];
      for (var ai = 0; ai < adj.length; ai++) {
        var ac = adj[ai] < 10 ? '0' + adj[ai] : '' + adj[ai];
        new Image().src = cardAsset(ac, 'face');
      }

      updateTryBtn();
      buildHotspots(card);
      updateStoryBar(card);
      var nextBtn = document.getElementById('resultNextBtn');
      if (nextBtn) {
        if (FROM_MODE === 'quest') {
          var n = parseInt(code, 10);
          nextBtn.textContent = (n < TOTAL && prog.passed && prog.passed[code]) ? t('nextChapter') : t('toQuest');
        } else {
          nextBtn.textContent = t('nextCard');
        }
      }
      resetZoom();
      showScreen('sCard');

      if (replace) {
        var q = 'play.html?c=' + code;
        if (FROM_MODE) q += '&from=' + FROM_MODE;
        if (window.GR_Locale && window.GR_Locale.lang === 'en') q += '&lang=en';
        history.replaceState({code: code}, '', q);
      } else {
        var q2 = 'play.html?c=' + code;
        if (FROM_MODE) q2 += '&from=' + FROM_MODE;
        if (window.GR_Locale && window.GR_Locale.lang === 'en') q2 += '&lang=en';
        history.pushState({code: code}, '', q2);
      }
    }

    if (!direction) { applyContent(); return; }
    applyContent();
    slideEl.style.transition = 'none';
    slideEl.style.transform = 'translateY(' + (direction === 'next' ? '100%' : '-100%') + ')';
    slideEl.offsetHeight;
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        slideEl.style.transition = 'transform .25s cubic-bezier(.4,0,.2,1)';
        slideEl.style.transform = 'translateY(0%)';
        setTimeout(function() { slideEl.style.transition = ''; slideEl.style.transform = ''; }, 250);
      });
    });
  }

  window.showCard = function() { showScreen('sCard'); updateTryBtn(); };
  window.showTask = function() {
    window.closeHsSheet();
    var t = card.task;
    if (t && t.type === 'yesno') { openYesNoTask(t); return; }
    showScreen('sTask');
    loadTask();
  };
  window.goBack = function() { window.location.href = backUrl(); };
  window.goNext = function() {
    if (FROM_MODE === 'quest') {
      var num = parseInt(code, 10);
      if (num < TOTAL && prog.passed && prog.passed[code]) {
        var next = num + 1;
        loadCard(next < 10 ? '0' + next : '' + next, false, 'next');
        return;
      }
      window.location.href = 'index.html#quest';
      return;
    }
    var num = parseInt(code, 10);
    var next = num >= TOTAL ? 1 : num + 1;
    loadCard(next < 10 ? '0' + next : '' + next, false, 'next');
  };
  window.goPrev = function() {
    var num = parseInt(code, 10);
    var prev = num <= 1 ? TOTAL : num - 1;
    loadCard(prev < 10 ? '0' + prev : '' + prev, false, 'prev');
  };

  function loadTask() {
    var wrap = document.getElementById('taskWrap');
    wrap.innerHTML = '<div style="text-align:center;padding:40px;opacity:.5;">' + t('loading') + '</div>';
    renderTask(card.task);
  }

  function renderTask(t) {
    var reg = window.GR_TASK_REGISTRY;
    var wrap = document.getElementById('taskWrap');
    if (!reg || !reg[t.type]) {
      wrap.innerHTML = '<div style="padding:20px;">Type: ' + t.type + '</div>';
      return;
    }
    reg[t.type](t, card, function(correct, explanation) {
      markPassed(correct);
      showScreen('sCard');
      showYnResult(correct, explanation || t.explanation || '');
    });
  }

  applyLocaleUi();
  loadCard(getParam('c') || '01', true);

  setTimeout(function() {
    new Image().src = window.GR_CardView.scrollBgUrl();
    for (var i = 0; i < CARDS.length; i++) {
      var c = CARDS[i];
      new Image().src = cardAsset(c.code, 'face');
    }
  }, 800);

  window.addEventListener('popstate', function(e) {
    var c = e.state && e.state.code ? e.state.code : (getParam('c') || '01');
    loadCard(c, true);
  });
})();
