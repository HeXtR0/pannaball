// Pannaball: yerel oyuncu kontrolcüsü (klavye + mouse).
// Görevi sadece klavye/mouse durumunu simülasyonun anladığı "input"a çevirmek.
// İleride bot ve ağ kontrolcüleri de aynı getInput(player) biçimini kullanacak.

NB.LocalController = class {
  constructor(canvas, renderer) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, has: false };
    this.kickQueued = false;

    const block = new Set([
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space',
    ]);

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (block.has(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      this.mouse.has = true;
    });
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.kickQueued = true;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  down(...codes) {
    return codes.some((c) => this.keys.has(c));
  }

  getInput(player) {
    const moveX = (this.down('KeyD', 'ArrowRight') ? 1 : 0) - (this.down('KeyA', 'ArrowLeft') ? 1 : 0);
    const moveY = (this.down('KeyS', 'ArrowDown') ? 1 : 0) - (this.down('KeyW', 'ArrowUp') ? 1 : 0);

    let aim = player.aim;
    if (this.mouse.has) {
      const m = this.renderer.screenToWorld(this.mouse.x, this.mouse.y);
      aim = Math.atan2(m.y - player.y, m.x - player.x);
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
