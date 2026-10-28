// Pannaball: yerel oyuncu kontrolcüsü.
// Masaüstü: WASD / Ok tuşları veya akıcı Fare Takibi (Mouse-follow), sol tık şut, Shift boost.
// Mobil: Sanal sol joystick (360° hareket ve nişan), sağ şut butonu ve boost butonu.

NB.LocalController = class {
  constructor(canvas, renderer) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, has: false };
    this.lastTarget = { x: 0, y: 0 };
    this.kickQueued = false;

    // Mobil dokunmatik kontrollerin durumu
    this.touchJoystick = { active: false, x: 0, y: 0, touchId: null };
    this.touchSprint = false;

    // Klavye tuşları (WASD, Ok tuşları, Shift)
    const blockKeys = new Set([
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space',
    ]);

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (blockKeys.has(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => this.keys.clear());

    // Fare hareketleri
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

    // Mobil dokunmatik olayları bağla
    this.initTouchControls();
  }

  down(...codes) {
    return codes.some((c) => this.keys.has(c));
  }

  initTouchControls() {
    window.addEventListener('touchstart', () => {
      document.body.classList.add('has-touch');
    }, { once: true, passive: true });

    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    const btnShoot = document.getElementById('touch-btn-shoot');
    const btnBoost = document.getElementById('touch-btn-boost');

    if (zone && knob) {
      const maxRadius = 40; // joystick topuzunun kayabileceği maksimum piksel
      let startX = 0, startY = 0;

      const handleTouchStart = (e) => {
        if (this.touchJoystick.active) return;
        const touch = e.changedTouches[0];
        if (!touch) return;
        e.preventDefault();
        const rect = zone.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
        this.touchJoystick.active = true;
        this.touchJoystick.touchId = touch.identifier;
        this.updateJoystick(touch.clientX, touch.clientY, startX, startY, maxRadius, knob);
      };

      const handleTouchMove = (e) => {
        if (!this.touchJoystick.active) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.touchJoystick.touchId) {
            e.preventDefault();
            this.updateJoystick(touch.clientX, touch.clientY, startX, startY, maxRadius, knob);
            break;
          }
        }
      };

      const handleTouchEnd = (e) => {
        if (!this.touchJoystick.active) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.touchJoystick.touchId) {
            e.preventDefault();
            this.touchJoystick.active = false;
            this.touchJoystick.touchId = null;
            this.touchJoystick.x = 0;
            this.touchJoystick.y = 0;
            knob.style.transition = 'transform 0.12s ease-out';
            knob.style.transform = 'translate(0px, 0px)';
            break;
          }
        }
      };

      zone.addEventListener('touchstart', handleTouchStart, { passive: false });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd, { passive: false });
      window.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    }

    if (btnShoot) {
      btnShoot.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.kickQueued = true;
        btnShoot.classList.add('active');
      }, { passive: false });
      const endShoot = (e) => {
        if (e.cancelable) e.preventDefault();
        btnShoot.classList.remove('active');
      };
      btnShoot.addEventListener('touchend', endShoot, { passive: false });
      btnShoot.addEventListener('touchcancel', endShoot, { passive: false });
    }

    if (btnBoost) {
      btnBoost.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.touchSprint = true;
        btnBoost.classList.add('active');
      }, { passive: false });
      const endBoost = (e) => {
        if (e.cancelable) e.preventDefault();
        this.touchSprint = false;
        btnBoost.classList.remove('active');
      };
      btnBoost.addEventListener('touchend', endBoost, { passive: false });
      btnBoost.addEventListener('touchcancel', endBoost, { passive: false });
    }
  }

  updateJoystick(clientX, clientY, startX, startY, maxRadius, knob) {
    const dx = clientX - startX;
    const dy = clientY - startY;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, maxRadius);
    const angle = dist > 0 ? Math.atan2(dy, dx) : 0;
    const kx = Math.cos(angle) * clampedDist;
    const ky = Math.sin(angle) * clampedDist;

    knob.style.transition = 'none';
    knob.style.transform = `translate(${kx.toFixed(1)}px, ${ky.toFixed(1)}px)`;

    const deadzone = 4;
    if (dist > deadzone) {
      const normDist = Math.min(1, (clampedDist - deadzone) / (maxRadius - deadzone));
      this.touchJoystick.x = Math.cos(angle) * normDist;
      this.touchJoystick.y = Math.sin(angle) * normDist;
    } else {
      this.touchJoystick.x = 0;
      this.touchJoystick.y = 0;
    }
  }

  getInput(player, world) {
    // 1. Dokunmatik Joystick Hareketi (Mobil cihazlarda)
    const hasTouch = this.touchJoystick.active && (Math.hypot(this.touchJoystick.x, this.touchJoystick.y) > 0.04);

    // 2. Klavye Tuşları (WASD ve Ok Tuşları)
    const keyX = (this.down('KeyD', 'ArrowRight') ? 1 : 0) - (this.down('KeyA', 'ArrowLeft') ? 1 : 0);
    const keyY = (this.down('KeyS', 'ArrowDown') ? 1 : 0) - (this.down('KeyW', 'ArrowUp') ? 1 : 0);
    const hasKeys = keyX !== 0 || keyY !== 0;

    let moveX = 0;
    let moveY = 0;
    let aim = player.aim;

    if (hasTouch) {
      moveX = this.touchJoystick.x;
      moveY = this.touchJoystick.y;
      const len = Math.hypot(moveX, moveY);
      if (len > 1) { moveX /= len; moveY /= len; }
      if (len > 0.08) aim = Math.atan2(moveY, moveX);
    } else if (hasKeys) {
      const len = Math.hypot(keyX, keyY);
      moveX = keyX / len;
      moveY = keyY / len;

      // WASD basılıyken fare varsa fareye doğru nişan al, yoksa hareket yönüne nişan al
      if (this.mouse.has) {
        const m = this.renderer.screenToWorld(this.mouse.x, this.mouse.y);
        if (Number.isFinite(m.x) && Number.isFinite(m.y)) {
          aim = Math.atan2(m.y - player.y, m.x - player.x);
        }
      } else {
        aim = Math.atan2(moveY, moveX);
      }
    } else {
      // 3. Fare Takibi (Mouse-follow)
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

      // Mesafe vektörü: fareye yakınsa dur (ölü bölge), yaklaştıkça yavaşla, uzaktaysa tam hız
      const dx = tx - player.x;
      const dy = ty - player.y;
      const dist = Math.hypot(dx, dy);

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
    }

    const sprint = this.down('ShiftLeft', 'ShiftRight') || this.touchSprint;
    const kick = this.kickQueued;
    this.kickQueued = false;

    return {
      moveX,
      moveY,
      sprint,
      kick,
      aim,
    };
  }
};
