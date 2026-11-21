function t(key, vars) {
  return window.GR_Locale ? window.GR_Locale.t(key, vars) : key;
}

window.GR_TASK_REGISTRY = window.GR_TASK_REGISTRY || {};

window.GR_TASK_REGISTRY["sim-match"] = function (task, card, onDone) {
  var host = document.getElementById("taskWrap") || document.getElementById("taskHost");
  if (!host) return;
  host.innerHTML = "";

  var p = document.createElement("p");
  p.className = "task-statement";
  p.textContent = task.prompt;
  host.appendChild(p);

  var matched = 0;
  var total = task.pairs.length;
  var selectedLeft = null;

  var grid = document.createElement("div");
  grid.className = "match-grid";

  var leftCol = document.createElement("div");
  leftCol.className = "match-col";
  var rightCol = document.createElement("div");
  rightCol.className = "match-col";

  var rights = [];
  for (var r = 0; r < task.pairs.length; r++) rights.push(task.pairs[r].right);
  rights.sort(function () { return Math.random() - 0.5; });

  function makeBtn(text, side, pairRight) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "match-btn";
    b.textContent = text;
    b.onclick = function () {
      if (b.className.indexOf("done") >= 0) return;
      if (side === "left") {
        var all = leftCol.getElementsByTagName("button");
        for (var i = 0; i < all.length; i++) all[i].className = "match-btn";
        b.className = "match-btn sel";
        selectedLeft = { btn: b, right: pairRight };
      } else if (selectedLeft) {
        if (text === selectedLeft.right) {
          b.className = "match-btn done";
          selectedLeft.btn.className = "match-btn done";
          matched++;
          selectedLeft = null;
          if (matched >= total) {
            var res = document.createElement("div");
            res.className = "task-result ok";
            res.textContent = t("correctPrefix") + task.explanation;
            host.appendChild(res);
            setTimeout(function () { onDone(true); }, 1000);
          }
        } else {
          b.className = "match-btn fail-flash";
          setTimeout(function () { b.className = "match-btn"; }, 400);
          selectedLeft.btn.className = "match-btn";
          selectedLeft = null;
        }
      }
    };
    return b;
  }

  for (var i = 0; i < task.pairs.length; i++) {
    leftCol.appendChild(makeBtn(task.pairs[i].left, "left", task.pairs[i].right));
  }
  for (var j = 0; j < rights.length; j++) {
    rightCol.appendChild(makeBtn(rights[j], "right", null));
  }

  grid.appendChild(leftCol);
  grid.appendChild(rightCol);
  host.appendChild(grid);
};
