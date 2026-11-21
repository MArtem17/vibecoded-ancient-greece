/* global window, document */
window.GR_QuestQuiz = (function () {
  function t(key, vars) {
    return window.GR_Locale ? window.GR_Locale.t(key, vars) : key;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  var CORRECT_ADVANCE_MS = 900;

  function feedback(host, ok, q, retry, onAdvance) {
    var box = el("div", "qm-q-feedback " + (ok ? "ok" : "fail"));
    box.appendChild(el("span", "qm-q-feedback-icon", ok ? "✓" : "↻"));
    var msg = ok ? q.ok || t("correct") : q.fail || t("notQuite");
    if (!ok && !q.fail) {
      msg = t("notQuite") + " " + t("quizFailSource");
    } else if (!ok) {
      msg = msg + " " + t("quizFailSource");
    }
    box.appendChild(el("p", "qm-q-feedback-text", msg));
    if (!ok) {
      var btn = el("button", "qm-btn qm-btn-secondary", t("retry"));
      btn.type = "button";
      btn.onclick = retry;
      box.appendChild(btn);
      host.appendChild(box);
      return;
    }

    host.appendChild(box);
    window.setTimeout(function () {
      if (typeof onAdvance === "function") onAdvance();
    }, CORRECT_ADVANCE_MS);
  }

  function pluralWord(n, forms) {
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return forms[2];
    if (mod10 === 1) return forms[0];
    if (mod10 >= 2 && mod10 <= 4) return forms[1];
    return forms[2];
  }

  function countSublabel(num, prompt) {
    if (/дней|дня|день|Фермопилы/.test(prompt)) {
      return pluralWord(num, ["день", "дня", "дней"]);
    }
    if (/ручек|ручки/.test(prompt)) {
      return pluralWord(num, ["ручка", "ручки", "ручек"]);
    }
    if (/шестерён|шестерни/.test(prompt)) {
      return pluralWord(num, ["шестерня", "шестерни", "шестерён"]);
    }
    if (/рядов скамей/.test(prompt)) {
      return pluralWord(num, ["ряд", "ряда", "рядов"]);
    }
    if (/рядов глубиной|фаланга/.test(prompt)) {
      return pluralWord(num, ["ряд", "ряда", "рядов"]);
    }
    if (/метров/.test(prompt)) {
      return pluralWord(num, ["метр", "метра", "метров"]);
    }
    if (/веке до н\.э/.test(prompt)) {
      return "век до н.э.";
    }
    if (/сторон у треугольника/.test(prompt)) {
      return pluralWord(num, ["сторона", "стороны", "сторон"]);
    }
    if (/ярусов гребцов/.test(prompt)) {
      return pluralWord(num, ["ярус", "яруса", "ярусов"]);
    }
    if (/слов в совете/.test(prompt)) {
      return pluralWord(num, ["слово", "слова", "слов"]);
    }
    if (/лет Одиссей|лет.*странствовал/.test(prompt)) {
      return pluralWord(num, ["год", "года", "лет"]);
    }
    if (/символов мифа/.test(prompt)) {
      return pluralWord(num, ["символ", "символа", "символов"]);
    }
    if (/зон отмечено|основных зон/.test(prompt)) {
      return pluralWord(num, ["зона", "зоны", "зон"]);
    }
    return "";
  }

  function countOptionSublabels(q) {
    if (q.optionLabels && q.optionLabels.length) return q.optionLabels;
    var prompt = q.prompt || "";
    return (q.options || []).map(function (num) {
      if (q.countLabel) return q.countLabel;
      return countSublabel(num, prompt);
    });
  }

  function appendTapChoice(btn, num, label) {
    btn.appendChild(el("span", "qm-tap-legend-num", String(num)));
    btn.appendChild(el("span", "qm-tap-legend-label", label));
  }

  function disableAll(host) {
    host.querySelectorAll("button").forEach(function (b) {
      if (!b.classList.contains("qm-btn-primary") && !b.classList.contains("qm-btn-secondary")) {
        b.disabled = true;
      }
    });
  }

  function renderPick(q, host, onCorrect) {
    host.appendChild(el("p", "qm-prompt", q.prompt));
    var list = el("div", "qm-pick-list");
    shuffle(q.options).forEach(function (opt) {
      var btn = el("button", "qm-btn qm-pick-btn", opt.text);
      btn.type = "button";
      btn.onclick = function () {
        disableAll(host);
        if (opt.correct) {
          feedback(host, true, q, null, onCorrect);
        } else {
          feedback(host, false, q, function () {
            renderQuestion(q, host, onCorrect);
          });
        }
      };
      list.appendChild(btn);
    });
    host.appendChild(list);
  }

  function renderYesNo(q, host, onCorrect) {
    host.appendChild(el("p", "qm-prompt", q.q));
    var row = el("div", "qm-yesno");
    [t("yesBtn"), t("noBtn")].forEach(function (label, idx) {
      var val = idx === 0;
      var btn = el("button", "qm-btn qm-btn-choice", label);
      btn.type = "button";
      btn.onclick = function () {
        disableAll(host);
        var ok = val === q.correct;
        if (ok) {
          feedback(host, true, q, null, onCorrect);
        } else {
          feedback(host, false, q, function () {
            renderQuestion(q, host, onCorrect);
          });
        }
      };
      row.appendChild(btn);
    });
    host.appendChild(row);
  }

  function cardAsset(code) {
    if (window.GR_Locale && window.GR_Locale.cardAsset) {
      return window.GR_Locale.cardAsset(code, "face");
    }
    return "assets/web/" + code + ".webp";
  }

  function hotspotMap(card) {
    var map = {};
    var list = window.GR_CardView
      ? window.GR_CardView.hotspotsForDisplay(card)
      : card.hotspots || [];
    list.forEach(function (hs) {
      map[hs.label] = hs;
    });
    return map;
  }

  function canTapOnCard(q, card) {
    if (!card || !q.zones || !q.zones.length) return false;
    var map = hotspotMap(card);
    return q.zones.every(function (z) {
      return !!map[z.label];
    });
  }

  function handleTapChoice(q, host, onCorrect, zone, retry) {
    disableAll(host);
    if (zone.correct) {
      feedback(host, true, q, null, onCorrect);
    } else {
      feedback(host, false, q, retry);
    }
  }

  function renderTapOnCard(q, host, onCorrect, card) {
    var map = hotspotMap(card);
    host.appendChild(el("p", "qm-tap-card-hint", t("tapCardHint")));

    function retry() {
      renderQuestion(q, host, onCorrect, { card: card });
    }

    var frame = el("div", "qm-tap-card");
    var inner = el("div", "qm-tap-card-inner");
    var img = document.createElement("img");
    img.className = "qm-tap-card-img";
    img.src = cardAsset(card.code);
    img.alt = card.title;
    inner.appendChild(img);

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 820 1240");
    svg.setAttribute("class", "qm-tap-card-svg");

    q.zones.forEach(function (zone) {
      var hs = map[zone.label];
      if (!hs) return;
      var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "qm-tap-pin");
      var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", hs.cx);
      circle.setAttribute("cy", hs.cy);
      circle.setAttribute("r", hs.r);
      var num = document.createElementNS("http://www.w3.org/2000/svg", "text");
      num.setAttribute("x", hs.cx);
      num.setAttribute("y", hs.cy);
      num.setAttribute("class", "qm-tap-pin-num");
      num.textContent = String(hs.n);
      g.appendChild(circle);
      g.appendChild(num);
      g.addEventListener("click", function (e) {
        e.stopPropagation();
        handleTapChoice(q, host, onCorrect, zone, retry);
      });
      svg.appendChild(g);
    });

    inner.appendChild(svg);
    frame.appendChild(inner);

    var legend = el("div", "qm-tap-card-legend");
    var legendZones = q.zones.slice().sort(function (a, b) {
      var na = map[a.label] ? map[a.label].n : 0;
      var nb = map[b.label] ? map[b.label].n : 0;
      return na - nb;
    });
    legendZones.forEach(function (zone) {
      var hs = map[zone.label];
      if (!hs) return;
      var item = el("button", "qm-tap-legend-item");
      item.type = "button";
      appendTapChoice(item, hs.n, zone.label);
      item.onclick = function () {
        handleTapChoice(q, host, onCorrect, zone, retry);
      };
      legend.appendChild(item);
    });
    host.appendChild(legend);
    host.appendChild(frame);
  }

  function renderTapList(q, host, onCorrect) {
    var list = el("div", "qm-tap-list-legend");
    function retry() {
      renderQuestion(q, host, onCorrect, null);
    }
    q.zones.forEach(function (z, i) {
      var zone = el("button", "qm-tap-legend-item");
      zone.type = "button";
      appendTapChoice(zone, i + 1, z.label);
      zone.onclick = function () {
        handleTapChoice(q, host, onCorrect, z, retry);
      };
      list.appendChild(zone);
    });
    host.appendChild(list);
  }

  function renderTap(q, host, onCorrect, ctx) {
    host.appendChild(el("p", "qm-prompt", q.prompt));
    if (ctx && ctx.card && canTapOnCard(q, ctx.card)) {
      renderTapOnCard(q, host, onCorrect, ctx.card);
      return;
    }
    renderTapList(q, host, onCorrect);
  }

  function renderCount(q, host, onCorrect) {
    host.appendChild(el("p", "qm-prompt", q.prompt));
    var sublabels = countOptionSublabels(q);
    var list = el("div", "qm-count-row");
    q.options.forEach(function (num, i) {
      var btn = el("button", "qm-btn qm-count-btn");
      btn.type = "button";
      btn.appendChild(el("span", "qm-count-num", String(num)));
      var sub = sublabels[i] || "";
      if (sub) btn.appendChild(el("span", "qm-count-label", sub));
      btn.onclick = function () {
        disableAll(host);
        if (num === q.correct) {
          feedback(host, true, q, null, onCorrect);
        } else {
          feedback(host, false, q, function () {
            renderQuestion(q, host, onCorrect);
          });
        }
      };
      list.appendChild(btn);
    });
    host.appendChild(list);
  }

  function renderMatch(q, host, onCorrect) {
    host.appendChild(el("p", "qm-prompt", q.prompt));
    var selectedLeft = null;
    var matched = 0;
    var total = q.pairs.length;
    var grid = el("div", "qm-match-grid");
    var leftCol = el("div", "qm-match-col");
    var rightCol = el("div", "qm-match-col");
    var rights = shuffle(
      q.pairs.map(function (p) {
        return p.right;
      })
    );

    function tryPair(leftText, rightText, leftBtn, rightBtn) {
      var ok = false;
      for (var i = 0; i < q.pairs.length; i++) {
        if (q.pairs[i].left === leftText && q.pairs[i].right === rightText) {
          ok = true;
          break;
        }
      }
      if (ok) {
        leftBtn.classList.add("matched");
        rightBtn.classList.add("matched");
        leftBtn.disabled = true;
        rightBtn.disabled = true;
        matched++;
        selectedLeft = null;
        if (matched === total) {
          feedback(host, true, q, null, onCorrect);
        }
      } else {
        leftBtn.classList.remove("sel");
        rightBtn.classList.remove("sel");
        selectedLeft = null;
      }
    }

    q.pairs.forEach(function (p) {
      var lb = el("button", "qm-btn qm-match-btn", p.left);
      lb.type = "button";
      lb.onclick = function () {
        if (lb.disabled || lb.classList.contains("matched")) return;
        leftCol.querySelectorAll(".qm-match-btn").forEach(function (b) {
          b.classList.remove("sel");
        });
        lb.classList.add("sel");
        selectedLeft = { text: p.left, btn: lb };
      };
      leftCol.appendChild(lb);
    });

    rights.forEach(function (r) {
      var rb = el("button", "qm-btn qm-match-btn", r);
      rb.type = "button";
      rb.onclick = function () {
        if (rb.disabled || rb.classList.contains("matched") || !selectedLeft) return;
        rb.classList.add("sel");
        tryPair(selectedLeft.text, r, selectedLeft.btn, rb);
      };
      rightCol.appendChild(rb);
    });

    grid.appendChild(leftCol);
    grid.appendChild(rightCol);
    host.appendChild(grid);
  }

  function renderOrder(q, host, onCorrect) {
    host.appendChild(el("p", "qm-prompt", q.prompt));
    var items = shuffle(q.steps);
    var order = [];
    var list = el("div", "qm-order-list");
    var chosen = el("div", "qm-order-chosen");

    function paintChosen() {
      chosen.innerHTML = "";
      order.forEach(function (text, i) {
        chosen.appendChild(el("span", "qm-order-chip", i + 1 + ". " + text));
      });
    }

    function paintList() {
      list.innerHTML = "";
      items.forEach(function (text) {
        var btn = el("button", "qm-btn qm-order-btn", text);
        btn.type = "button";
        btn.onclick = function () {
          order.push(text);
          items = items.filter(function (x) {
            return x !== text;
          });
          paintChosen();
          paintList();
          if (items.length === 0) check();
        };
        list.appendChild(btn);
      });
    }

    function check() {
      var ok = true;
      for (var i = 0; i < q.steps.length; i++) {
        if (order[i] !== q.steps[i]) {
          ok = false;
          break;
        }
      }
      if (!ok) {
        feedback(host, false, q, function () {
          order = [];
          items = shuffle(q.steps);
          chosen.innerHTML = "";
          host.querySelectorAll(".qm-q-feedback").forEach(function (n) {
            n.remove();
          });
          paintList();
        });
        return;
      }
      feedback(host, true, q, null, onCorrect);
    }

    host.appendChild(list);
    host.appendChild(chosen);
    paintList();
  }

  function renderPhrase(q, host, onCorrect) {
    host.appendChild(el("p", "qm-prompt", q.prompt || t("phraseFill")));
    var slots = q.slots;
    if (!slots || !slots.length) {
      host.appendChild(el("p", "", t("unknownGame")));
      return;
    }

    var blankAnswers = [];
    slots.forEach(function (slot) {
      if (slot && typeof slot === "object" && slot.blank != null) {
        blankAnswers.push(slot.blank);
      }
    });

    var filled = blankAnswers.map(function () {
      return null;
    });
    var poolItems = shuffle(
      blankAnswers.map(function (word, i) {
        return { id: i, word: word, used: false };
      })
    );

    var builtEl = el("div", "qm-phrase-built qm-phrase-slots");
    var poolEl = el("div", "qm-phrase-pool");

    function renderSlots() {
      builtEl.innerHTML = "";
      var bi = 0;
      slots.forEach(function (slot, si) {
        if (typeof slot === "string") {
          builtEl.appendChild(el("span", "qm-phrase-fixed", slot));
        } else if (slot && slot.blank != null) {
          var gap = el(
            "span",
            "qm-phrase-gap" + (filled[bi] ? " is-filled" : ""),
            filled[bi] || "…"
          );
          builtEl.appendChild(gap);
          bi++;
        }
        if (si < slots.length - 1) {
          builtEl.appendChild(document.createTextNode(" "));
        }
      });
    }

    function resetPhrase() {
      filled = blankAnswers.map(function () {
        return null;
      });
      poolItems = shuffle(
        blankAnswers.map(function (word, i) {
          return { id: i, word: word, used: false };
        })
      );
      renderSlots();
      renderPool();
      host.querySelectorAll(".qm-q-feedback").forEach(function (n) {
        n.remove();
      });
    }

    function checkDone() {
      if (filled.some(function (w) {
        return w == null;
      })) {
        return;
      }
      var ok = filled.every(function (w, i) {
        return w === blankAnswers[i];
      });
      if (!ok) {
        feedback(host, false, q, resetPhrase);
      } else {
        feedback(host, true, q, null, onCorrect);
      }
    }

    function renderPool() {
      poolEl.innerHTML = "";
      poolItems.forEach(function (item) {
        if (item.used) return;
        var btn = el("button", "qm-btn qm-phrase-word", item.word);
        btn.type = "button";
        btn.onclick = function () {
          var idx = filled.indexOf(null);
          if (idx === -1) return;
          filled[idx] = item.word;
          item.used = true;
          renderSlots();
          renderPool();
          checkDone();
        };
        poolEl.appendChild(btn);
      });
    }

    host.appendChild(builtEl);
    host.appendChild(poolEl);
    renderSlots();
    renderPool();
  }

  var HANDLERS = {
    pick: renderPick,
    yesno: renderYesNo,
    tap: renderTap,
    count: renderCount,
    match: renderMatch,
    order: renderOrder,
    phrase: renderPhrase,
  };

  function renderQuestion(q, host, onCorrect, ctx) {
    host.querySelectorAll(".qm-q-body").forEach(function (n) {
      n.remove();
    });
    host.querySelectorAll(".qm-q-feedback").forEach(function (n) {
      n.remove();
    });
    var body = el("div", "qm-q-body");
    host.appendChild(body);
    var fn = HANDLERS[q.type];
    if (fn) fn(q, body, onCorrect, ctx);
    else body.appendChild(el("p", "", t("unknownGame")));
  }

  function renderSourceBar(host, ctx) {
    if (!ctx || !ctx.onOpenCard || host.querySelector(".qm-quiz-source")) return;
    var bar = el("div", "qm-quiz-source");
    var btn = el("button", "qm-btn qm-btn-secondary qm-quiz-card-btn", t("openCard"));
    btn.type = "button";
    btn.onclick = ctx.onOpenCard;
    bar.appendChild(btn);
    host.appendChild(bar);
  }

  function render(quiz, host, onDone, ctx) {
    ctx = ctx || {};
    if (!quiz || !host || !quiz.questions || !quiz.questions.length) {
      if (onDone) onDone();
      return;
    }

    var idx = 0;
    var total = quiz.questions.length;

    function show() {
      host.innerHTML = "";
      host.appendChild(el("h3", "qm-title", "📋 " + (quiz.title || t("quizTitle"))));
      renderSourceBar(host, ctx);
      host.appendChild(el("div", "qm-quiz-progress", t("quizProgress", { n: idx + 1, total: total })));
      renderQuestion(quiz.questions[idx], host, function () {
        idx++;
        if (idx >= total) {
          host.innerHTML = "";
          var done = el("div", "qm-quiz-done");
          done.appendChild(el("div", "qm-result-icon", "✓"));
          done.appendChild(el("p", "qm-result-text", quiz.done || t("quizDone")));
          host.appendChild(done);
          setTimeout(function () {
            onDone(true);
          }, 900);
        } else {
          show();
        }
      }, ctx);
    }

    host._qmRerender = show;
    show();
  }

  return { render: render };
})();
