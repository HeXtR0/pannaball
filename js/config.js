// Pannaball: oyun ayarları ve renkler.
// Hissi değiştirmek için çoğu zaman sadece buradaki sayılarla oynamak yeterli.
window.NB = window.NB || {};

NB.CONFIG = {
  TICK_RATE: 60,        // saniyede kaç fizik adımı
  SUBSTEPS: 4,          // hızlı topun duvardan geçmemesi için her adım 4'e bölünür

  player: {
    radius: 14,
    mass: 1,
    accel: 0.28,        // normal ivme (her adımda)
    sprintAccel: 0.42,  // Shift basılıyken ivme
    damping: 0.94,      // her adımda hızın ne kadarı kalır
  },

  ball: {
    radius: 9,
    mass: 0.5,
    damping: 0.985,
    wallBounce: 0.8,
  },

  bounce: {
    playerPlayer: 0.5,
    playerBall: 0.5,
    playerWall: 0.1,
  },

  kick: {
    power: 13,          // şut sonrası topun hızı
    range: 6,           // oyuncu ile top kenarları arası bu mesafedeyse vurabilir
    cooldownTicks: 12,  // iki şut arası bekleme
    bufferTicks: 6,     // tık biraz erken gelirse kısa süre bekletilir
  },

  stamina: {
    drainPerSec: 0.5,     // dolu stamina 2 saniyelik sprint
    regenPerSec: 0.22,    // sprint yokken dolum hızı
    recoverAt: 0.25,      // tamamen biterse bu seviyeye dolana kadar sprint yok
  },

  goalPauseTicks: 100,  // golden sonra santraya kadar bekleme
};

// Modlar: her modun kendi saha boyutu var, kalabalık arttıkça saha büyür.
// outerMargin: oyuncular saha çizgisinin bu kadar dışına çıkabilir (top çıkamaz).
NB.MODES = {
  '1v1': { size: 1, field: { w: 1100, h: 500, goalW: 120, goalDepth: 45, outerMargin: 50 } },
  '2v2': { size: 2, field: { w: 1300, h: 600, goalW: 160, goalDepth: 45, outerMargin: 55 } },
  '3v3': { size: 3, field: { w: 1550, h: 720, goalW: 180, goalDepth: 50, outerMargin: 60 } },
};

// Bot zorluk seviyeleri. [a, b] olan değerler her bot için bu aralıktan rastgele seçilir
// (aynı seviyedeki botlar bile birbirinden biraz farklı oynar).
//  reaction     : başkası vurunca topun yeni yönünü fark etme süresi (adım, 60 adım = 1 sn)
//  thinkEvery   : topun yerini kaç adımda bir günceller
//  aimNoise     : şut sapması (radyan)
//  shootRange   : rakip kaleye bu kadar yakınsa şut çeker (saha genişliğine oran)
//  longShot     : uzaktan şut deneme ihtimali
//  passChance   : uygun arkadaş varsa pas verme ihtimali
//  sprintMin    : stamina bunun altındaysa sprint atmaz
//  keeperDepth  : kaleci topa göre ne kadar öne çıkar
//  keeperError  : kalecinin topun yolunu tahminindeki hata (birim)
//  kickoffDelay : santrada bekleme (adım)
//  speed        : hareket gücü çarpanı (kolay botlar biraz yavaş)
//  smartShot    : şut öncesi önü kapalı mı diye bakıp boş köşeyi seçme ihtimali
//  spacing      : takım arkadaşlarıyla üst üste binmemeye dikkat eder mi
NB.DIFFICULTY = {
  easy: {
    label: 'kolay',
    reaction: [14, 24], thinkEvery: [8, 13], aimNoise: [0.12, 0.22],
    shootRange: [0.25, 0.38], longShot: [0.15, 0.35], passChance: [0.1, 0.3],
    sprintMin: [0.45, 0.7], keeperDepth: [0.12, 0.2], keeperError: [28, 50],
    kickoffDelay: [25, 60], speed: 0.88, smartShot: 0, spacing: false,
  },
  normal: {
    label: 'orta',
    reaction: [7, 16], thinkEvery: [4, 9], aimNoise: [0.05, 0.12],
    shootRange: [0.3, 0.45], longShot: [0.08, 0.25], passChance: [0.25, 0.6],
    sprintMin: [0.3, 0.55], keeperDepth: [0.18, 0.28], keeperError: [14, 34],
    kickoffDelay: [12, 45], speed: 1, smartShot: 0.4, spacing: true,
  },
  hard: {
    label: 'zor',
    reaction: [3, 8], thinkEvery: [2, 4], aimNoise: [0.02, 0.05],
    shootRange: [0.32, 0.45], longShot: [0.05, 0.12], passChance: [0.45, 0.75],
    sprintMin: [0.2, 0.35], keeperDepth: [0.22, 0.3], keeperError: [5, 14],
    kickoffDelay: [8, 20], speed: 1, smartShot: 1, spacing: true,
  },
};

NB.COLORS = {
  background: '#060a1a',
  outerArea: '#0a1230',
  field: '#0c1738',
  grid: 'rgba(34, 230, 255, 0.06)',
  line: '#22e6ff',
  post: '#22e6ff',

  orange: '#ff8a1f',
  orangeDark: '#b35400',
  purple: '#a24bff',
  purpleDark: '#5e1fb3',

  ball: '#ffffff',
  number: '#ffffff',

  stamina: '#7cff4f',
  staminaMid: '#ffe14f',
  staminaLow: '#ff3b3b',
  staminaTrack: 'rgba(124, 255, 79, 0.15)',
};
