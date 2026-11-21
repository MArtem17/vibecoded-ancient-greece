/* global document, window */
(function () {
  var suffix = window.GR_Locale ? window.GR_Locale.dataSuffix() : "";
  var ver = window.GR_Locale ? window.GR_Locale.ASSET_VERSION : "";
  function w(src) {
    var url = src + (ver ? (src.indexOf("?") >= 0 ? "&" : "?") + "v=" + ver : "");
    document.write('<script src="' + url + '"></' + "script>");
  }
  w("deck-config.js");
  w("cards-data" + suffix + ".js");
  w("cards-back" + suffix + ".js");
  w("quest-data" + suffix + ".js");
  w("quest-scenes-data" + suffix + ".js");
  w("quest-dialogues" + suffix + ".js");
})();
