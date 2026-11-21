function t(key, vars) {
  return window.GR_Locale ? window.GR_Locale.t(key, vars) : key;
}

window.GR_TASK_REGISTRY = window.GR_TASK_REGISTRY || {};

window.GR_TASK_REGISTRY["sim-order"] = function (task, card, onDone) {
  var host = document.getElementById("taskWrap") || document.getElementById("taskHost");
  if (!host) return;
  host.innerHTML = "";

  var p = document.createElement("p");
  p.className = "task-statement";
  p.textContent = task.prompt;
  host.appendChild(p);

  var list = document.createElement("div");
  list.className = "order-list";
  var items = task.steps.slice();
  var order = [];

  function render() {
    list.innerHTML = "";
    for (var i = 0; i < items.length; i++) {
      (function (text) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "order-item";
        b.textContent = text;
        b.onclick = function () {
          order.push(text);
          for (var j = 0; j < items.length; j++) {
            if (items[j] === text) { items.splice(j, 1); break; }
          }
          render();
          if (items.length === 0) check();
        };
        list.appendChild(b);
      })(items[i]);
    }
  }

  var chosen = document.createElement("div");
  chosen.className = "order-chosen";

  function check() {
    var ok = true;
    for (var i = 0; i < task.steps.length; i++) {
      if (order[i] !== task.steps[i]) { ok = false; break; }
    }
    var result = document.createElement("div");
    result.className = "task-result " + (ok ? "ok" : "fail");
    result.textContent = (ok ? t("correctPrefix") : t("tryAgainPrefix")) + task.explanation;
    host.appendChild(result);
    setTimeout(function () { onDone(ok); }, 1200);
  }

  host.appendChild(list);
  host.appendChild(chosen);
  render();
};
