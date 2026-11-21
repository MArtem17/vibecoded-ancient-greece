/* global window, document */
window.GR_QuestMinigames = (function () {
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
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function showChapterFinale(host, game, onDone) {
    if (!window.GR_QuestDialogue) {
      setTimeout(function () {
        onDone(true);
      }, 600);
      return;
    }
    window.GR_QuestDialogue.enterChapterFinale(host);
    var finaleBox = el("div", "qc-dlg-gear qc-dlg-gear--finale");
    host.appendChild(finaleBox);
    window.GR_QuestDialogue.renderChapterFinale(finaleBox, {
      sceneSrc: host.getAttribute("data-scene-src") || "",
      sceneAlt: host.getAttribute("data-scene-alt") || "",
      fallbackSrc: host.getAttribute("data-fallback-src") || "",
      gearLine: game.gearLine || "",
      phrase: game.success || game.successEasy || t("mgWinEasy"),
      onDone: function () {
        onDone(true);
      },
    });
  }

  function showResult(host, ok, game, onDone) {
    var box = el("div", "qm-result " + (ok ? "ok qm-result--pop" : "fail"));
    box.appendChild(el("div", "qm-result-icon", ok ? "✓" : "↻"));
    box.appendChild(el("p", "qm-result-text", ok ? game.success : game.fail));
    if (ok) {
      showChapterFinale(host, game, onDone);
      return;
    }
    if (host._qmRerender) {
      var retry = el("button", "qm-btn qm-btn-secondary", t("retry"));
      retry.type = "button";
      retry.onclick = function () {
        host._qmRerender();
      };
      box.appendChild(retry);
    }
    host.appendChild(box);
  }

  function renderYesNo(game, host, onDone) {
    host.appendChild(el("p", "qm-prompt", game.q));
    var row = el("div", "qm-yesno");
    [t("yesBtn"), t("noBtn")].forEach(function (label, idx) {
      var val = idx === 0;
      var btn = el("button", "qm-btn qm-btn-choice", label);
      btn.type = "button";
      btn.onclick = function () {
        row.querySelectorAll("button").forEach(function (b) {
          b.disabled = true;
        });
        showResult(host, val === game.correct, game, onDone);
      };
      row.appendChild(btn);
    });
    host.appendChild(row);
  }

  function renderPick(game, host, onDone) {
    host.appendChild(el("p", "qm-prompt", game.prompt));
    var list = el("div", "qm-pick-list");
    shuffle(game.options).forEach(function (opt) {
      var btn = el("button", "qm-btn qm-pick-btn", opt.text);
      btn.type = "button";
      btn.onclick = function () {
        list.querySelectorAll("button").forEach(function (b) {
          b.disabled = true;
        });
        showResult(host, !!opt.correct, game, onDone);
      };
      list.appendChild(btn);
    });
    host.appendChild(list);
  }

  function renderCount(game, host, onDone) {
    host.appendChild(el("p", "qm-prompt", game.prompt));
    var list = el("div", "qm-count-row");
    game.options.forEach(function (num) {
      var btn = el("button", "qm-btn qm-count-btn", String(num));
      btn.type = "button";
      btn.onclick = function () {
        list.querySelectorAll("button").forEach(function (b) {
          b.disabled = true;
        });
        showResult(host, num === game.correct, game, onDone);
      };
      list.appendChild(btn);
    });
    host.appendChild(list);
  }

  function renderTap(game, host, onDone) {
    host.appendChild(el("p", "qm-prompt", game.prompt));
    var scene = el("div", "qm-tap-scene");
    game.zones.forEach(function (z) {
      var zone = el("button", "qm-tap-zone", z.label);
      zone.type = "button";
      zone.setAttribute("data-id", z.id);
      zone.onclick = function () {
        scene.querySelectorAll("button").forEach(function (b) {
          b.disabled = true;
        });
        showResult(host, !!z.correct, game, onDone);
      };
      scene.appendChild(zone);
    });
    host.appendChild(scene);
  }

  function renderOrder(game, host, onDone) {
    host.appendChild(el("p", "qm-prompt", game.prompt));
    host.appendChild(el("p", "qm-order-hint", t("orderHint")));
    var items = shuffle(game.steps);
    var order = [];
    var list = el("div", "qm-order-list");
    var chosenLabel = el("div", "qm-order-chosen-label", t("orderChosen"));
    var chosen = el("div", "qm-order-chosen");
    var actions = el("div", "qm-order-actions");

    function paintChosen() {
      chosen.innerHTML = "";
      if (!order.length) {
        chosen.appendChild(el("span", "qm-order-placeholder", "…"));
        return;
      }
      order.forEach(function (text, i) {
        var chip = el("span", "qm-order-chip", i + 1 + ". " + text);
        chosen.appendChild(chip);
      });
    }

    function paintList() {
      list.innerHTML = "";
      items.forEach(function (text) {
        var btn = el("button", "qm-btn qm-order-btn", text);
        btn.type = "button";
        btn.onclick = function () {
          order.push(text);
          items = items.filter(function (t) {
            return t !== text;
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
      for (var i = 0; i < game.steps.length; i++) {
        if (order[i] !== game.steps[i]) {
          ok = false;
          break;
        }
      }
      if (!ok) {
        var reset = el("button", "qm-btn qm-btn-secondary", t("retry"));
        reset.type = "button";
        reset.onclick = function () {
          order = [];
          items = shuffle(game.steps);
          actions.innerHTML = "";
          host.querySelectorAll(".qm-fail-hint").forEach(function (n) {
            n.remove();
          });
          paintChosen();
          paintList();
        };
        actions.appendChild(reset);
        var msg = el("p", "qm-fail-hint", game.fail);
        host.appendChild(msg);
        return;
      }
      showResult(host, true, game, onDone);
    }

    host.appendChild(list);
    host.appendChild(chosenLabel);
    host.appendChild(chosen);
    host.appendChild(actions);
    paintList();
    paintChosen();
  }

  function renderPhrase(game, host, onDone) {
    host.appendChild(el("p", "qm-prompt", game.prompt));
    var built = [];
    var answer = game.answer.slice();
    var pool = shuffle(game.words);
    var builtEl = el("div", "qm-phrase-built");
    var poolEl = el("div", "qm-phrase-pool");

    function renderBuilt() {
      builtEl.textContent = built.length ? built.join(" ") : "…";
    }

    function renderPool() {
      poolEl.innerHTML = "";
      pool.forEach(function (word) {
        var btn = el("button", "qm-btn qm-phrase-word", word);
        btn.type = "button";
        btn.onclick = function () {
          built.push(word);
          pool = pool.filter(function (w) {
            return w !== word;
          });
          renderBuilt();
          renderPool();
          if (pool.length === 0) {
            var ok =
              built.length === answer.length &&
              built.every(function (w, i) {
                return w === answer[i];
              });
            if (!ok) {
              var reset = el("button", "qm-btn qm-btn-secondary", t("rebuild"));
              reset.type = "button";
              reset.onclick = function () {
                built = [];
                pool = shuffle(game.words);
                renderBuilt();
                renderPool();
                reset.remove();
              };
              host.appendChild(reset);
              host.appendChild(el("p", "qm-fail-hint", game.fail));
            } else {
              showResult(host, true, game, onDone);
            }
          }
        };
        poolEl.appendChild(btn);
      });
    }

    host.appendChild(builtEl);
    host.appendChild(poolEl);
    renderBuilt();
    renderPool();
  }

  function renderMatch(game, host, onDone) {
    host.appendChild(el("p", "qm-prompt", game.prompt));
    var selectedLeft = null;
    var matched = 0;
    var total = game.pairs.length;
    var grid = el("div", "qm-match-grid");
    var leftCol = el("div", "qm-match-col");
    var rightCol = el("div", "qm-match-col");
    var rights = shuffle(
      game.pairs.map(function (p) {
        return p.right;
      })
    );

    function tryPair(leftText, rightText, leftBtn, rightBtn) {
      var ok = false;
      for (var i = 0; i < game.pairs.length; i++) {
        if (game.pairs[i].left === leftText && game.pairs[i].right === rightText) {
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
        if (matched === total) showResult(host, true, game, onDone);
      } else {
        leftBtn.classList.remove("sel");
        rightBtn.classList.remove("sel");
        selectedLeft = null;
      }
    }

    game.pairs.forEach(function (p) {
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

  function renderGears(game, host, onDone) {
    var quest = window.GR_QUEST;
    if (!quest || !quest.gears) return;
    host.appendChild(el("p", "qm-prompt", game.prompt));

    var mechanism = el("div", "qm-gear-mechanism");
    var disc = el("div", "qm-gear-disc");
    disc.appendChild(el("div", "qm-gear-disc-inner", "☀"));
    mechanism.appendChild(disc);

    var slotsRow = el("div", "qm-gear-slots");
    var slots = [];
    quest.gears.forEach(function (g, idx) {
      var slot = el("button", "qm-gear-slot", String(idx + 1));
      slot.type = "button";
      slot.setAttribute("data-order", String(g.order));
      slot.setAttribute("data-name", g.name);
      slot.title = g.name;
      slots.push(slot);
      slotsRow.appendChild(slot);
    });
    mechanism.appendChild(slotsRow);
    host.appendChild(mechanism);

    var tray = el("div", "qm-gear-tray");
    var selectedGear = null;
    var placed = {};

    shuffle(quest.gears).forEach(function (g) {
      var piece = el("button", "qm-gear-piece", "⚙ " + g.short);
      piece.type = "button";
      piece.setAttribute("data-card", g.card);
      piece.setAttribute("data-order", String(g.order));
      piece.setAttribute("data-name", g.name);
      piece.onclick = function () {
        if (piece.disabled) return;
        tray.querySelectorAll(".qm-gear-piece").forEach(function (p) {
          p.classList.remove("sel");
        });
        piece.classList.add("sel");
        selectedGear = piece;
      };
      tray.appendChild(piece);
    });
    host.appendChild(tray);

    var checkBtn = el("button", "qm-btn qm-btn-primary", t("runMechanism"));
    checkBtn.type = "button";
    checkBtn.onclick = function () {
      var ok = true;
      for (var i = 0; i < quest.gears.length; i++) {
        var expect = quest.gears[i];
        var slot = slots[i];
        if (!slot.getAttribute("data-placed-order") || slot.getAttribute("data-placed-order") !== String(expect.order)) {
          ok = false;
          break;
        }
      }
      if (!ok) {
        host.querySelectorAll(".qm-fail-hint").forEach(function (n) {
          n.remove();
        });
        host.appendChild(el("p", "qm-fail-hint", game.fail));
        mechanism.classList.add("shake");
        setTimeout(function () {
          mechanism.classList.remove("shake");
        }, 500);
        return;
      }
      disc.classList.add("spin");
      mechanism.classList.add("glow");
      showResult(host, true, game, onDone);
    };
    host.appendChild(checkBtn);

    slots.forEach(function (slot) {
      slot.onclick = function () {
        if (!selectedGear || slot.getAttribute("data-placed-order")) return;
        var order = selectedGear.getAttribute("data-order");
        var name = selectedGear.getAttribute("data-name");
        slot.textContent = "⚙";
        slot.classList.add("filled");
        slot.title = name;
        slot.setAttribute("data-placed-order", order);
        selectedGear.disabled = true;
        selectedGear.classList.remove("sel");
        selectedGear = null;
        placed[order] = true;
      };
    });
  }

  function render(game, host, onDone) {
    if (!game || !host) return;
    if (
      window.GR_QuestMinigamesInteractive &&
      window.GR_QuestMinigamesInteractive.isInteractive(game)
    ) {
      window.GR_QuestMinigamesInteractive.render(game, host, onDone);
      return;
    }
    host.innerHTML = "";
    host.classList.add("qm-classic--animated");
    host._qmRerender = function () {
      render(game, host, onDone);
    };
    var title = el("h3", "qm-title", "⚡ " + (game.title || t("minigame")));
    host.appendChild(title);

    var handlers = {
      yesno: renderYesNo,
      pick: renderPick,
      count: renderCount,
      tap: renderTap,
      order: renderOrder,
      phrase: renderPhrase,
      match: renderMatch,
      gears: renderGears
    };
    var fn = handlers[game.type];
    if (fn) fn(game, host, onDone);
    else host.appendChild(el("p", "", t("unknownGame")));
  }

  return { render: render };
})();
