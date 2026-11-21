/* global window */

(function () {

  var ASSET_VERSION = "20260709-face-18";



  function normalizeSpace(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function capFirst(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function splitSentences(text) {
    return String(text || "")
      .split(/(?<=[.!?])\s+/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  function extractQuoted(text) {
    var raw = String(text || "");
    var m = raw.match(/«([^»]+)»|"([^"]+)"|„([^"]+)"/);
    if (m) return m[1] || m[2] || m[3] || "";
    return raw;
  }

  function isQuestionSentence(sentence) {
    var t = sentence.trim();
    return t.endsWith("?") || /^(почему|зачем|как|что|кто|где|когда|какой|какая|какие|каково)\b/i.test(t);
  }

  function isQuestOrMetaSentence(sentence) {
    return /Сандра|Робоборик|Роборик|Пандиус/i.test(sentence)
      || /(табличк\w*|осколок\w*|шестерн\w*|gear\d+|маршрут\w*|отметк\w*|журнал\w*|экспедиц\w*|остановк\w*|команда|подсказк\w*|на карте)/i.test(sentence)
      || /(наш\w*|нам|мой журнал|мы с робор|мы верим|мы получил|мы нашли|мы идём|мы —|мы тоже|я бы|я весл\w*|я сказал\w*|мы считаем)/i.test(sentence);
  }

  function stripDashQuestClauses(text) {
    return String(text || "").replace(/\s*—\s*[^.!?]+/g, function (clause) {
      if (/Сандра|Робоборик|Роборик|Пандиус/i.test(clause)) return "";
      if (/(табличк\w*|осколок\w*|шестерн\w*|gear\d+|маршрут\w*|отметк\w*|журнал\w*|экспедиц\w*|остановк\w*|команда|подсказк\w*|на карте)/i.test(clause)) return "";
      if (/(наш\w*|нам|мой журнал|мы с робор|мы верим|мы получил|мы нашли|мы идём|мы —|мы тоже|я бы|мы считаем)/i.test(clause)) return "";
      return clause;
    });
  }

  function keepSentences(text) {
    return splitSentences(text)
      .filter(function (s) { return !isQuestionSentence(s) && !isQuestOrMetaSentence(s); })
      .join(" ");
  }

  function stripSpeakerPrefixes(text) {
    var t = String(text || "");
    t = t.replace(/^Запись Сандры:\s*/gi, "");
    t = t.replace(/^(Робоборик|Роборик)\s+[^:]*:\s*/gi, "");
    t = t.replace(/^Сандра\s+[^:]*:\s*/gi, "");
    t = t.replace(/^Пандиус\s+[^:]*:\s*/gi, "");
    t = t.replace(/Сандра\s+видит[^.!?]*[.!?]\s*/gi, "");
    t = t.replace(/(Робоборик|Роборик)\s+спрашивает[^:]*:\s*/gi, "");
    t = t.replace(/Пандиус\s+спрашивает[^:]*:\s*/gi, "");
    t = t.replace(/Сандра\s+[^.!?]*[.!?]\s*/gi, "");
    t = t.replace(/(Робоборик|Роборик)\s+[^.!?]*[.!?]\s*/gi, "");
    t = t.replace(/Пандиус[^.!?]*[.!?]\s*/gi, "");
    return t;
  }

  function cleanText(text) {
    var t = stripSpeakerPrefixes(text);
    t = t.replace(/[«»„""]/g, "");
    t = t.replace(/мы можем/gi, "можно");
    t = t.replace(/А ты знала\?\s*/gi, "");
    t = t.replace(/Я бы[^.!?]*[.!?]\s*/gi, "");
    t = stripDashQuestClauses(t);
    t = t.replace(/\s*—\s*$/g, "");
    t = keepSentences(t);
    return capFirst(normalizeSpace(t));
  }

  function cleanFun(text) {
    if (!text) return "";
    return cleanText(extractQuoted(text));
  }



  function cleanDetail(text) {

    return cleanText(text);

  }



  function getStudy(card) {

    if (card.study) return card.study;

    var keywords = (card.hotspots || []).map(function (h) {

      return { term: h.label, hint: h.cardText || h.label };

    });

    return {

      lead: cleanText(card.thinkAnswer || ""),

      facts: (card.facts || []).map(cleanText).filter(Boolean).slice(0, 3),

      keywords: keywords.slice(0, 4),

      funFact: cleanFun(card.funFact || "")

    };

  }



  function mergeCardForBack(card) {

    if (!card) return card;

    var backs =
      (typeof window !== "undefined" &&
        window.GR_Locale &&
        window.GR_Locale.cardsBack &&
        window.GR_Locale.cardsBack()) ||
      window.GR_CARDS_BACK ||
      [];

    for (var i = 0; i < backs.length; i++) {

      if (backs[i].code === card.code) {

        return Object.assign({}, card, backs[i]);

      }

    }

    return card;

  }



  function illUrl(code) {

    return "assets/cards/ill/" + code + ".webp?v=" + ASSET_VERSION;

  }



  function scrollBgUrl(full) {
    var file = full ? "scroll-full.webp" : "scroll.webp";
    return "assets/cards/backs/" + file + "?v=" + ASSET_VERSION;
  }



  function usesScrollBack(card) {

    if (!card) return false;

    return card.backStyle !== "classic";

  }



  function esc(s) {

    var d = document.createElement("div");

    d.textContent = s || "";

    return d.innerHTML;

  }



  function renderFace(card, total) {

    var hs = card.hotspots || [];
    var labels = localeBackLabels();

    var statsHtml = "";

    for (var i = 0; i < 4; i++) {

      var h = hs[i] || {};

      var label = h.cardText || h.label || "—";

      statsHtml +=

        '<div class="gr-card__stat">' +

        '<span class="gr-card__stat-num">' + (i + 1) + "</span>" +

        '<span class="gr-card__stat-label">' + esc(label) + "</span>" +

        "</div>";

    }

    return (

      '<div class="gr-card gr-card--face" data-code="' + esc(card.code) + '">' +

      '<div class="gr-card__frame"></div>' +

      '<div class="gr-card__header">' +

      '<span>GR</span>' +

      '<span class="gr-card__header-mid">' + esc(labels.headerMid) + "</span>" +

      '<span class="gr-card__header-num">' + esc(card.code) + "/" + total + "</span>" +

      "</div>" +

      '<div class="gr-card__title-zone">' +

      '<div class="gr-card__ribbon">' + esc((card.eraTag || "").toUpperCase()) + "</div>" +

      "<h2 class=\"gr-card__title\">" + esc(card.title) + "</h2>" +

      '<p class="gr-card__subtitle">' + esc(card.subtitle || "") + "</p>" +

      "</div>" +

      '<div class="gr-card__ill">' +

      '<img src="' + illUrl(card.code) + '" alt="" loading="lazy">' +

      "</div>" +

      '<div class="gr-card__stats">' + statsHtml + "</div>" +

      '<div class="gr-card__badge">' + esc(card.type || "") + "</div>" +

      '<div class="gr-card__footer">' + esc(labels.footerPrefix) + " · " + esc(card.title) + " · GR-" + esc(card.code) + " · " + esc(card.code) + "/" + total + "</div>" +

      "</div>"

    );

  }



  function renderBack(card, total) {

    var merged = mergeCardForBack(card);

    if (usesScrollBack(merged)) return renderBackScroll(merged, total);

    return renderBackClassic(merged);

  }



  function renderBackClassic(card) {

    var study = getStudy(card);
    var labels = localeBackLabels();

    var factsHtml = (study.facts || [])

      .slice(0, 4)

      .map(function (f) {

        return '<div class="gr-card__fact">' + esc(f) + "</div>";

      })

      .join("");

    var kwHtml = (study.keywords || [])

      .slice(0, 4)

      .map(function (k) {

        return (

          '<div class="gr-card__kw"><strong>' + esc(k.term) + "</strong>" + esc(k.hint) + "</div>"

        );

      })

      .join("");

    var funHtml = study.funFact

      ? '<div class="gr-card__fun"><strong>' + esc(labels.funLabel) + "</strong> " + esc(study.funFact) + "</div>"

      : "";

    return (

      '<div class="gr-card gr-card--back" data-code="' + esc(card.code) + '">' +

      '<div class="gr-card__frame"></div>' +

      '<div class="gr-card__header">' +

      '<span>GR</span>' +

      '<span class="gr-card__header-mid">' + esc(labels.headerMid) + "</span>" +

      '<span class="gr-card__header-num">' + esc(card.code) + "</span>" +

      "</div>" +

      '<div class="gr-card__study">' +

      '<div class="gr-card__study-lead"><strong>' + esc(labels.mainCaps) + "</strong>" + esc(study.lead) + "</div>" +

      '<div class="gr-card__study-facts">' + factsHtml + "</div>" +

      '<div class="gr-card__keywords">' + kwHtml + "</div>" +

      funHtml +

      "</div>" +

      '<div class="gr-card__badge">' + esc(card.type || "") + "</div>" +

      '<div class="gr-card__footer">' + esc(labels.footerPrefix) + " · " + esc(card.title) + " · GR-" + esc(card.code) + "</div>" +

      "</div>"

    );

  }



  function localeBackLabels() {
    if (typeof window !== "undefined" && window.GR_Locale) {
      var isEn = window.GR_Locale.lang === "en";
      return {
        funLabel: window.GR_Locale.funLabel,
        factFallback: window.GR_Locale.factFallback,
        mainLabel: isEn ? "Main" : "Главное",
        mainCaps: isEn ? "MAIN" : "ГЛАВНОЕ",
        headerMid: isEn ? "OBRAZOVARIUM · GREECE" : "ОБРАЗОВАРИУМ · ГРЕЦИЯ",
        footerPrefix: isEn ? "GREECE" : "ГРЕЦИЯ",
      };
    }
    return {
      funLabel: "Интересно:",
      factFallback: "Факт",
      mainLabel: "Главное",
      mainCaps: "ГЛАВНОЕ",
      headerMid: "ОБРАЗОВАРИУМ · ГРЕЦИЯ",
      footerPrefix: "ГРЕЦИЯ",
    };
  }

  function renderBackScroll(card, total) {
    var study = getStudy(card);
    var totalNum = total || card.total || 25;
    var labels = localeBackLabels();

    if (typeof GRBackLayer !== "undefined") {
      var bgUrl =
        card.backStyle === "ill"
          ? "assets/cards/bg-back/" + card.code + ".png?v=" + ASSET_VERSION
          : scrollBgUrl(true);
      return GRBackLayer.renderBackLayer({
        bgUrl: bgUrl,
        code: card.code,
        total: totalNum,
        eraTag: card.eraTag,
        title: card.title,
        type: card.type,
        study: study,
        footer: card.footer,
        funLabel: labels.funLabel,
        factFallback: labels.factFallback,
      });
    }

    var factsHtml = (study.facts || [])
      .slice(0, 3)
      .map(function (f) {
        return '<div class="gr-card__scroll-fact">' + esc(f) + "</div>";
      })
      .join("");
    var kwHtml = (study.keywords || [])
      .slice(0, 4)
      .map(function (k) {
        return (
          '<div class="gr-card__scroll-kw">' +
          '<span class="gr-card__scroll-kw-term">' + esc(k.term) + "</span>" +
          '<span class="gr-card__scroll-kw-hint">' + esc(k.hint) + "</span>" +
          "</div>"
        );
      })
      .join("");
    var funLabelPlain = labels.funLabel.replace(/:$/, "");
    var funHtml = study.funFact
      ? '<div class="gr-card__scroll-fun"><span class="gr-card__scroll-label">' + esc(funLabelPlain) + "</span>" + esc(study.funFact) + "</div>"
      : "";
    return (
      '<div class="gr-card gr-card--back gr-card--back-scroll gr-card--scroll-v2" data-code="' + esc(card.code) + '">' +
      '<div class="gr-card__scroll-bg" style="background-image:url(\'' + scrollBgUrl(true) + '\')"></div>' +
      '<div class="gr-card__scroll-pad">' +
      '<div class="gr-card__scroll-title-inline">' +
      '<h2 class="gr-card__scroll-heading">' + esc(card.title) + "</h2>" +
      "</div>" +
      '<div class="gr-card__scroll-body-v2">' +
      '<div class="gr-card__scroll-lead">' +
      '<span class="gr-card__scroll-label">' + esc(labels.mainLabel) + "</span>" +
      esc(study.lead) +
      "</div>" +
      '<div class="gr-card__scroll-facts">' + factsHtml + "</div>" +
      '<div class="gr-card__scroll-kws">' + kwHtml + "</div>" +
      funHtml +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }



  function mountFace(el, card, total) {

    if (!el) return;

    el.innerHTML = renderFace(card, total);

  }



  function mountBack(el, card, total) {

    if (!el) return;

    el.innerHTML = renderBack(mergeCardForBack(card), total);

    var layer = el.querySelector(".gr-layer-back");

    if (layer && typeof GRBackLayer !== "undefined" && GRBackLayer.fitBackLayer) {
      GRBackLayer.fitBackLayer(layer);
    }

    if (layer && el.clientWidth) {

      var scale = el.clientWidth / 820;

      layer.style.width = "820px";

      layer.style.height = "1230px";

      layer.style.transform = "scale(" + scale + ")";

      layer.style.transformOrigin = "top left";

    }

  }



  function hotspotsForDisplay(card) {

    return (card.hotspots || []).map(function (h) {

      return {

        n: h.n,

        cx: h.cx,

        cy: h.cy,

        r: h.r,

        label: h.label,

        cardText: h.cardText,

        detail: cleanDetail(h.detail)

      };

    });

  }

  /** @param {SVGElement} frontEl @param {object[]} hsList @param {{ onShow: function, onHide: function, canShow?: function }} opts */
  function mountHotspotPins(frontEl, hsList, opts) {
    var oldSvg = frontEl.querySelector("svg[data-hs-layer]");
    if (oldSvg) oldSvg.remove();
    if (!hsList || !hsList.length) return null;

    opts = opts || {};
    var closeTimer = null;

    function cancelClose() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    function scheduleClose() {
      cancelClose();
      closeTimer = setTimeout(function () {
        document.querySelectorAll(".hs-pin.is-active").forEach(function (p) {
          p.classList.remove("is-active");
        });
        if (opts.onHide) opts.onHide();
      }, 220);
    }

    function canShow() {
      return !opts.canShow || opts.canShow();
    }

    function showHs(hs, pin) {
      if (!canShow()) return;
      cancelClose();
      document.querySelectorAll(".hs-pin.is-active").forEach(function (p) {
        p.classList.remove("is-active");
      });
      if (pin) pin.classList.add("is-active");
      if (opts.onShow) opts.onShow(hs);
    }

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 820 1240");
    svg.setAttribute("data-hs-layer", "1");
    svg.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;";

    hsList.forEach(function (hs) {
      var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "hs-pin");
      g.setAttribute("data-hs", "1");

      var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("class", "hs-pin-bg");
      circle.setAttribute("cx", hs.cx);
      circle.setAttribute("cy", hs.cy);
      circle.setAttribute("r", hs.r);

      var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("class", "hs-pin-num");
      text.setAttribute("x", hs.cx);
      text.setAttribute("y", hs.cy);
      text.textContent = String(hs.n);

      g.appendChild(circle);
      g.appendChild(text);

      g.addEventListener("mouseenter", function (e) {
        e.stopPropagation();
        showHs(hs, g);
      });
      g.addEventListener("mouseleave", function (e) {
        e.stopPropagation();
        scheduleClose();
      });
      g.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      g.addEventListener(
        "touchstart",
        function (e) {
          e.stopPropagation();
          if (!canShow()) return;
          var open = g.classList.contains("is-active");
          if (open) {
            g.classList.remove("is-active");
            cancelClose();
            if (opts.onHide) opts.onHide();
          } else {
            showHs(hs, g);
          }
        },
        { passive: true }
      );

      svg.appendChild(g);
    });

    frontEl.appendChild(svg);
    return { svg: svg, cancelClose: cancelClose, scheduleClose: scheduleClose };
  }



  window.GR_CardView = {

    ASSET_VERSION: ASSET_VERSION,

    illUrl: illUrl,

    scrollBgUrl: scrollBgUrl,

    usesScrollBack: usesScrollBack,

    mergeCardForBack: mergeCardForBack,

    getStudy: getStudy,

    cleanDetail: cleanDetail,

    renderFace: renderFace,

    renderBack: renderBack,

    mountFace: mountFace,

    mountBack: mountBack,

    hotspotsForDisplay: hotspotsForDisplay,

    mountHotspotPins: mountHotspotPins

  };

})();

