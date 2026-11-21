/* global window, document */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.GRBackLayer = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function defaultBackBg(code) {
    return "assets/cards/bg-back/" + code + ".png";
  }

  function factFallbackWord(opts) {
    if (opts && opts.factFallback) return opts.factFallback;
    return (
      (typeof window !== "undefined" && window.GR_Locale && window.GR_Locale.factFallback) ||
      "Факт"
    );
  }

  function resolveTheses(study, opts) {
    if (study.theses && study.theses.length) return study.theses.slice(0, 5);
    var kws = study.keywords || [];
    if (kws.length) {
      return kws.slice(0, 4).map(function (k) {
        return { term: k.term, text: k.hint || "" };
      });
    }
    var factWord = factFallbackWord(opts);
    return (study.facts || []).slice(0, 3).map(function (f, i) {
      return { term: factWord + " " + (i + 1), text: f };
    });
  }

  /**
   * Оборот: иллюстрация на весь фон + учебный текст на нижнем затемнении.
   *
   * @param {object} opts
   * @param {string} opts.bgUrl — URL фоновой иллюстрации
   * @param {string} opts.title
   * @param {string} opts.code
   * @param {number} opts.total
   * @param {object} opts.study — lead, theses[{term,text}], funFact
   * @param {boolean} [opts.web]
   */
  function titleClass(title) {
    var len = String(title || "").length;
    if (len > 20) return " gr-layer-back__title--sm";
    if (len > 11) return " gr-layer-back__title--md";
    return "";
  }

  function renderBackLayer(opts) {
    var o = opts || {};
    var code = o.code || "01";
    var study = o.study || {};
    var webClass = o.web ? " gr-layer-back--web" : "";
    var bgUrl = o.bgUrl || defaultBackBg(code);
    var bg = ' style="background-image:url(\'' + esc(bgUrl) + '\')"';
    var theses = resolveTheses(study, o);

    var thesesHtml = theses
      .map(function (t) {
        return (
          '<li class="gr-layer-back__thesis">' +
          '<span class="gr-layer-back__thesis-term">' +
          esc(t.term) +
          "</span>" +
          '<span class="gr-layer-back__thesis-text">' +
          esc(t.text) +
          "</span>" +
          "</li>"
        );
      })
      .join("");

    var funLabel =
      o.funLabel ||
      (typeof window !== "undefined" && window.GR_Locale && window.GR_Locale.funLabel) ||
      "Интересно:";

    var funHtml = study.funFact
      ? '<p class="gr-layer-back__fun"><span class="gr-layer-back__fun-label">' +
        esc(funLabel) +
        "</span> " +
        esc(study.funFact) +
        "</p>"
      : "";

    return (
      '<div class="gr-layer-back' +
      webClass +
      '"' +
      bg +
      ">" +
      '<div class="gr-layer-back__scrim-top"></div>' +
      '<div class="gr-layer-back__scrim-bottom"></div>' +
      '<div class="gr-layer-back__head">' +
      '<h2 class="gr-layer-back__title' +
      titleClass(o.title) +
      '">' +
      esc(o.title || "") +
      "</h2>" +
      '<p class="gr-layer-back__lead">' +
      esc(study.lead || "") +
      "</p>" +
      "</div>" +
      '<div class="gr-layer-back__body">' +
      '<div class="gr-layer-back__theses-wrap">' +
      '<ul class="gr-layer-back__theses">' +
      thesesHtml +
      "</ul>" +
      "</div>" +
      funHtml +
      "</div>" +
      "</div>"
    );
  }

  function fitBackLayer(layer) {
    if (!layer) return;
    var head = layer.querySelector(".gr-layer-back__head");
    var body = layer.querySelector(".gr-layer-back__body");
    var thesesWrap = layer.querySelector(".gr-layer-back__theses-wrap");
    if (!body) return;

    layer.style.setProperty("--fit-scale", "1");

    for (var i = 0; i < 16; i++) {
      var scale = 1 - i * 0.025;
      if (scale < 0.78) break;
      layer.style.setProperty("--fit-scale", scale.toFixed(3));

      var headOk = !head || head.scrollHeight <= head.clientHeight + 2;
      var bodyOk = body.scrollHeight <= body.clientHeight + 2;
      var thesesOk =
        !thesesWrap || thesesWrap.scrollHeight <= thesesWrap.clientHeight + 2;

      if (headOk && bodyOk && thesesOk) break;
    }
  }

  return {
    renderBackLayer: renderBackLayer,
    defaultBackBg: defaultBackBg,
    fitBackLayer: fitBackLayer,
  };
});
