/* global window */
window.GR_QUEST_SCENES = {
  version: "20260709-approved",
  basePath: "assets/quest/scenes/",
  ext: ".png",
  items: {
    "01": { ready: true, episode: "Осколок на рынке", alt: "Сандра и Робоборик на афинской агоре с осколком таблички" },
    "02": { ready: true, episode: "Перемирие на карте", alt: "Сандра и Робоборик у оливы и стадиона в Олимпии" },
    "03": { ready: true, episode: "Маски на склоне", alt: "Робоборик на сцене греческого театра, эхо на склоне" },
    "04": { ready: true, episode: "Клеймо на дне", alt: "Сандра и Робоборик у разбитой амфоры у причала" },
    "05": { ready: true, episode: "Голос на Пниксе", alt: "Первая шестерня на холме Пникс" },
    "06": { ready: true, episode: "Колонны на скале", alt: "Сандра и Робоборик у Парфенона" },
    "07": { ready: true, episode: "Энтазис и каннелюры", alt: "Срез дорической колонны в журнале" },
    "08": { ready: true, episode: "Шёпот в камне", alt: "Эхо в театре Эпидавра" },
    "09": { ready: true, episode: "Чудо в целле", alt: "Руины храма Зевса в Олимпии" },
    "10": { ready: true, episode: "Вторая шестерня", alt: "Вторая шестерня на вершине Акрополя" },
    "11": { ready: true, episode: "Архив на агоре", alt: "Философский архив у агоры" },
    "12": { ready: true, episode: "Числа в свитке", alt: "Свиток Пифагора с треугольником" },
    "13": { ready: true, episode: "Клятва на пергаменте", alt: "Клятва Гиппократа в архиве" },
    "14": { ready: true, episode: "Третья шестерня", alt: "«Начала» Эвклида и третья шестерня" },
    "15": { ready: true, episode: "Спуск к морю", alt: "Сандра и Робоборик на триере" },
    "16": { ready: true, episode: "Строй у берега", alt: "Фаланга гоплитов у моря" },
    "17": { ready: true, episode: "Равнина победы", alt: "Равнина Марафона" },
    "18": { ready: true, episode: "Четвёртая шестерня", alt: "Фермопилы, четвёртая шестерня" },
    "19": { ready: true, episode: "Центр мира", alt: "Дельфы, надпись «Познай себя»" },
    "20": { ready: true, episode: "Облака на вершине", alt: "Тропа на гору Олимп" },
    "21": { ready: true, episode: "Деревянная ловушка", alt: "Троянский конь" },
    "22": { ready: true, episode: "Десять лет в море", alt: "Одиссей — маршрут по звёздам" },
    "23": { ready: true, episode: "Пятая шестерня", alt: "Прометей, пятая шестерня" },
    "24": { ready: true, episode: "Шестая шестерня", alt: "Полная бронзовая табличка у Акрополя" },
    "25": { ready: true, episode: "Седьмая шестерня", alt: "Финал — механизм из семи шестерён" }
  }
};

window.GR_QuestScenes = {
  url: function (code) {
    var cfg = window.GR_QUEST_SCENES;
    if (!cfg || !cfg.items[code] || !cfg.items[code].ready) return null;
    return cfg.basePath + code + (cfg.ext || ".png") + "?v=" + cfg.version;
  },
  alt: function (code) {
    var cfg = window.GR_QUEST_SCENES;
    if (!cfg || !cfg.items[code]) return "";
    return cfg.items[code].alt || "";
  },
  isReady: function (code) {
    var cfg = window.GR_QUEST_SCENES;
    return !!(cfg && cfg.items[code] && cfg.items[code].ready);
  }
};
