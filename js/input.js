// Pannaball: yerel oyuncu kontrolcüsü (sadece fare + Shift boost).
// WASD ve ok tuşları tamamen kaldırılmıştır.
// Kontrol yöntemi: Mouse-follow (fareye doğru akıcı hareket, fare yakınsa yavaşlama, uzaksa tam hız).

NB.LocalController = class {
  constructor(canvas, renderer) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, has: false };
    this.lastTarget = { x: 0, y: 0 };
    this.kickQueued = false;

    // Sadece boost (Shift) tuşları dinlenir
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.keys.add(e.code);
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.keys.delete(e.code);
      }
    });
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.has = true;
    });

    // Fare canvas dışına çıkarsa son geçerli konum korunur (crash/NaN önlenir)
    canvas.addEventListener('mouseleave', () => {
      // has durumu korunur, son geçerli lastTarget pozisyonu kullanılır
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.kickQueued = true;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  down(...codes) {
    return codes.some((c) => this.keys.has(c));
  }

  getInput(player, world) {
    // Saha sınırlarına clamp: oyuncu hedefi saha dışına çıkamaz
    const f = world ? world.field : null;
    const limitX = f ? f.w / 2 + f.outerMargin - player.r : 350;
    const limitY = f ? f.h / 2 + f.outerMargin - player.r : 600;

    // Farenin dünya koordinatlarını al ve geçerli mi doğrula
    if (this.mouse.has) {
      const m = this.renderer.screenToWorld(this.mouse.x, this.mouse.y);
      if (Number.isFinite(m.x) && Number.isFinite(m.y)) {
        this.lastTarget.x = Math.max(-limitX, Math.min(limitX, m.x));
        this.lastTarget.y = Math.max(-limitY, Math.min(limitY, m.y));
      }
    }

    const tx = Math.max(-limitX, Math.min(limitX, this.lastTarget.x));
    const ty = Math.max(-limitY, Math.min(limitY, this.lastTarget.y));

    // Mouse-follow mantığı:
    // Fareye olan mesafe vektörü hesaplanır.
    // Oyuncu fareye çok yakınsa durur (ölü bölge titremeyi önler),
    // yakınlaştıkça yumuşakça yavaşlar, uzaktaysa tam hızla ilerler.
    const dx = tx - player.x;
    const dy = ty - player.y;
    const dist = Math.hypot(dx, dy);

    let moveX = 0;
    let moveY = 0;
    let aim = player.aim;

    if (dist > 2) {
      aim = Math.atan2(dy, dx);
    }

    const deadzone = 6;     // ölü bölge (piksel)
    const slowRadius = 65;   // yavaşlama eşiği (piksel)

    if (dist > deadzone) {
      const speed = Math.min(1, (dist - deadzone) / slowRadius);
      moveX = (dx / dist) * speed;
      moveY = (dy / dist) * speed;
    }

    const kick = this.kickQueued;
    this.kickQueued = false;

    return {
      moveX,
      moveY,
      sprint: this.down('ShiftLeft', 'ShiftRight'),
      kick,
      aim,
    };
  }
};
