// Pannaball: dil desteği (İngilizce varsayılan, Türkçe seçenek).
// HTML'de data-i18n="anahtar" olan her öğenin içi seçili dile göre doldurulur.
// JS içinde NB.t('anahtar', { degisken: deger }) ile çeviri alınır.
window.NB = window.NB || {};

NB.I18N = {
  en: {
    teamOrange: 'ORANGE',
    teamPurple: 'PURPLE',
    help: '<b>WASD / Arrows</b> move &nbsp;·&nbsp; <b>Left click</b> shoot toward mouse &nbsp;·&nbsp; <b>Shift</b> sprint &nbsp;·&nbsp; <b>Esc</b> pause',
    chooseMode: 'Choose a mode',
    desc1v1: 'Small pitch · one on one',
    desc2v2: 'Medium pitch · keeper + striker',
    desc3v3: 'Large pitch · full team',
    duration: 'TIME',
    goalLimit: 'GOAL LIMIT',
    teammates: 'TEAMMATES',
    opponents: 'OPPONENTS',
    language: 'LANGUAGE',
    min2: '2 min', min3: '3 min', min5: '5 min',
    none: 'none',
    easy: 'easy', normal: 'medium', hard: 'hard',
    hint: 'The match ends when the time runs out or the goal limit is reached, whichever comes first. A draw goes to golden goal overtime.<br>Your team and shirt numbers are random every match. You are always number 10.',
    paused: 'PAUSED',
    resume: 'Resume',
    restart: 'Restart',
    menu: 'Menu',
    escResume: '<b>Esc</b> to resume',
    playAgain: 'Play again',
    overTip: '<b>Enter</b> play again &nbsp;·&nbsp; <b>Esc</b> menu',
    yourTeam: 'Your team: <b>{name}</b> <span>{arrow}</span>',
    attackRight: 'attacking right →',
    attackLeft: '← attacking left',
    overtime: 'OVERTIME',
    overtimeToast: '<b>OVERTIME</b> <span>golden goal wins</span>',
    wins: '★ {name} WINS ★',
    youWon: 'You won!',
    youLost: 'You lost',
    goldenGoal: 'Golden goal',
    ownGoalShort: 'o.g.',
    goals: 'Goals',
    shots: 'Shots',
    possession: 'Possession',
    goal: 'GOAL!',
    goldenGoalBig: 'GOLDEN GOAL!',
  },
  tr: {
    teamOrange: 'TURUNCU',
    teamPurple: 'MOR',
    help: '<b>WASD / Oklar</b> hareket &nbsp;·&nbsp; <b>Sol tık</b> mouse yönüne şut &nbsp;·&nbsp; <b>Shift</b> sprint &nbsp;·&nbsp; <b>Esc</b> duraklat',
    chooseMode: 'Mod seç',
    desc1v1: 'Küçük saha · birebir',
    desc2v2: 'Orta saha · kaleci + forvet',
    desc3v3: 'Büyük saha · tam takım',
    duration: 'SÜRE',
    goalLimit: 'GOL LİMİTİ',
    teammates: 'ARKADAŞ',
    opponents: 'RAKİP',
    language: 'DİL',
    min2: '2 dk', min3: '3 dk', min5: '5 dk',
    none: 'yok',
    easy: 'kolay', normal: 'orta', hard: 'zor',
    hint: 'Süre ya da gol limiti, hangisi önce dolarsa maç biter. Berabere biterse altın gol uzatması oynanır.<br>Takımın ve forma numaraları her maçta rastgele belirlenir. Sen hep 10 numarasın.',
    paused: 'DURAKLATILDI',
    resume: 'Devam et',
    restart: 'Yeniden başlat',
    menu: 'Menü',
    escResume: '<b>Esc</b> ile devam',
    playAgain: 'Tekrar oyna',
    overTip: '<b>Enter</b> tekrar oyna &nbsp;·&nbsp; <b>Esc</b> menü',
    yourTeam: 'Takımın: <b>{name}</b> <span>{arrow}</span>',
    attackRight: 'sağa hücum →',
    attackLeft: '← sola hücum',
    overtime: 'UZATMA',
    overtimeToast: '<b>UZATMA</b> <span>altın gol kazanır</span>',
    wins: '★ {name} KAZANDI ★',
    youWon: 'Kazandın!',
    youLost: 'Kaybettin',
    goldenGoal: 'Altın gol',
    ownGoalShort: 'k.k.',
    goals: 'Goller',
    shots: 'Şut',
    possession: 'Topa sahip',
    goal: 'GOL!',
    goldenGoalBig: 'ALTIN GOL!',
  },
};

(function () {
  const KEY = 'pannaball.lang';
  let lang = 'en';
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && NB.I18N[saved]) lang = saved;
  } catch (e) { /* kayıt yoksa İngilizce */ }

  NB.t = function (key, vars) {
    let s = NB.I18N[lang][key];
    if (s === undefined) s = NB.I18N.en[key] !== undefined ? NB.I18N.en[key] : key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  };

  NB.getLang = () => lang;

  NB.applyLang = function () {
    document.documentElement.lang = lang;
    for (const el of document.querySelectorAll('[data-i18n]')) {
      el.innerHTML = NB.t(el.dataset.i18n);
    }
  };

  NB.setLang = function (next) {
    if (!NB.I18N[next]) return;
    lang = next;
    try { localStorage.setItem(KEY, lang); } catch (e) { /* önemli değil */ }
    NB.applyLang();
  };
})();
