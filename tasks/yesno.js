function t(key, vars) {
  return window.GR_Locale ? window.GR_Locale.t(key, vars) : key;
}

window.GR_TASK_REGISTRY = window.GR_TASK_REGISTRY || {};

window.GR_TASK_REGISTRY.yesno = function (task, card, onDone) {
  var host = document.getElementById("taskWrap") || document.getElementById("taskHost");
  if (!host) return;
  host.innerHTML = "";

  var p = document.createElement("p");
  p.className = "task-statement";
  p.textContent = task.q || task.statement || "";
  host.appendChild(p);

  var row = document.createElement("div");
  row.className = "task-btns";

  var btnYes = document.createElement("button");
  btnYes.type = "button";
  btnYes.className = "btn btn-yes";
  btnYes.textContent = t("yesShort");

  var btnNo = document.createElement("button");
  btnNo.type = "button";
  btnNo.className = "btn btn-no";
  btnNo.textContent = t("noShort");

  var result = document.createElement("div");
  result.className = "task-result";

  function finish(choice) {
    btnYes.disabled = true;
    btnNo.disabled = true;
    var ok = choice === task.correct;
    result.textContent = (ok ? t("correctPrefix") : t("notQuite")) + task.explanation;
    result.className = "task-result " + (ok ? "ok" : "fail");
    setTimeout(function () { onDone(ok); }, 1200);
  }

  btnYes.onclick = function () { finish(true); };
  btnNo.onclick = function () { finish(false); };

  row.appendChild(btnYes);
  row.appendChild(btnNo);
  host.appendChild(row);
  host.appendChild(result);
};
