// Ballgame: çizim. Dünyayı okur, hiçbir şeyi değiştirmez.

NB.Renderer = class {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;
    this.ox = 0;
    this.oy = 0;
    this.hudHeight = 72; // üstteki skor tabelası için boşluk (ekran pikseli)
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth, H = window.innerHeight;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this.canvas.style.width = W + 'px';
    this.canvas.style.height = H + 'px';
    this.dpr = dpr;
  }

  // Sahayı ekrana sığdır (her modun saha boyutu farklı)
  fit(f) {
    const W = window.innerWidth, H = window.innerHeight;
    const viewW = f.w + 2 * (f.outerMargin + f.goalDepth) + 20;
    const viewH = f.h + 2 * f.outerMargin + 30;
    const availH = H - this.hudHeight - 40; // altta yardım yazısı için pay
    this.scale = Math.min(W / viewW, availH / viewH);
    this.ox = W / 2;
    this.oy = this.hudHeight + availH / 2;
  }

  screenToWorld(sx, sy) {
    return { x: (sx - this.ox) / this.scale, y: (sy - this.oy) / this.scale };
  }

  draw(world, localId, alpha) {
    const ctx = this.ctx;
    const C = NB.COLORS;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = C.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (!world) return;

    const f = world.field;
    this.fit(f);

    ctx.setTransform(
      this.dpr * this.scale, 0, 0, this.dpr * this.scale,
      this.dpr * this.ox, this.dpr * this.oy,
    );

    const hw = f.w / 2, hh = f.h / 2, gy = f.goalW / 2, gd = f.goalDepth;
    const m = f.outerMargin;

    // Oyuncuların çıkabildiği dış alan
    ctx.fillStyle = C.outerArea;
    roundRect(ctx, -hw - m, -hh - m, f.w + 2 * m, f.h + 2 * m, 18);
    ctx.fill();

    // Saha zemini
    ctx.fillStyle = C.field;
    ctx.fillRect(-hw, -hh, f.w, f.h);

    // Hafif ızgara
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -hw + 50; x < hw; x += 50) { ctx.moveTo(x, -hh); ctx.lineTo(x, hh); }
    for (let y = -hh + 40; y < hh; y += 40) { ctx.moveTo(-hw, y); ctx.lineTo(hw, y); }
    ctx.stroke();

    // Kale içleri (savunan takımın renginde hafif)
    drawGoal(ctx, -hw, -1, gy, gd, C.orange);
    drawGoal(ctx, hw, 1, gy, gd, C.purple);

    // Saha çizgileri (neon)
    glow(ctx, C.line, 14, () => {
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 3;
      ctx.strokeRect(-hw, -hh, f.w, f.h);
    });

    // Orta çizgi ve yuvarlak: santra sırasında santrayı kullanan takımın renginde parlar
    const ko = world.kickoff.active && world.state === 'play';
    const midCol = ko ? (world.kickoff.team === 'orange' ? C.orange : C.purple) : C.line;
    if (ko) {
      ctx.save();
      ctx.fillStyle = midCol;
      ctx.globalAlpha = 0.08 + 0.04 * Math.sin(performance.now() / 250);
      ctx.beginPath(); ctx.arc(0, 0, world.centerR, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    glow(ctx, midCol, ko ? 20 : 14, () => {
      ctx.strokeStyle = midCol;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -hh); ctx.lineTo(0, hh);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, world.centerR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = midCol;
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Kale fileleri ve direkler
    glow(ctx, C.post, 12, () => {
      ctx.strokeStyle = C.post;
      ctx.lineWidth = 3;
      for (const [x1, y1, x2, y2] of world.walls.nets) {
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      ctx.fillStyle = C.post;
      for (const sx of [-hw, hw]) for (const sy of [-gy, gy]) {
        ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
      }
    });

    // Oyuncular
    const local = world.players.find((p) => p.id === localId);
    for (const p of world.players) {
      const x = lerp(p.px, p.x, alpha), y = lerp(p.py, p.y, alpha);
      const isLocal = p === local;
      const isMate = !isLocal && local && p.team === local.team;
      drawPlayer(ctx, p, x, y, isLocal, isMate);
    }

    // Top
    const b = world.ball;
    const bx = lerp(b.px, b.x, alpha), by = lerp(b.py, b.y, alpha);
    glow(ctx, C.ball, 18, () => {
      ctx.fillStyle = C.ball;
      ctx.beginPath(); ctx.arc(bx, by, b.r, 0, Math.PI * 2); ctx.fill();
    });

    // Gol yazısı
    if (world.state === 'goal' && world.lastScorer && world.lastGoal) {
      const text = NB.t(world.lastGoal.golden ? 'goldenGoalBig' : 'goal');
      const col = world.lastScorer === 'orange' ? C.orange : C.purple;
      const t = 1 - world.pauseTicks / NB.CONFIG.goalPauseTicks;
      const s = 1 + 0.15 * Math.sin(Math.min(1, t * 4) * Math.PI);
      ctx.save();
      ctx.scale(s, s);
      ctx.font = '900 110px system-ui, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      glow(ctx, col, 40, () => {
        ctx.fillStyle = col;
        ctx.fillText(text, 0, 0);
      });
      ctx.restore();
    }
  }
};

function drawGoal(ctx, lineX, dir, gy, gd, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.12;
  const x = dir < 0 ? lineX - gd : lineX;
  ctx.fillRect(x, -gy, gd, gy * 2);
  // file deseni
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let yy = -gy + 12; yy < gy; yy += 12) { ctx.moveTo(x, yy); ctx.lineTo(x + gd, yy); }
  for (let xx = x + 9; xx < x + gd; xx += 9) { ctx.moveTo(xx, -gy); ctx.lineTo(xx, gy); }
  ctx.stroke();
  ctx.restore();
}

function drawPlayer(ctx, p, x, y, isLocal, isMate) {
  const C = NB.COLORS;
  const fill = p.team === 'orange' ? C.orange : C.purple;
  const edge = p.team === 'orange' ? C.orangeDark : C.purpleDark;

  // Nişan göstergesi (sadece senin oyuncunda)
  if (isLocal) {
    const ax = Math.cos(p.aim), ay = Math.sin(p.aim);
    ctx.save();
    ctx.globalAlpha = 0.45;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.moveTo(x + ax * (p.r + 10), y + ay * (p.r + 10));
    ctx.lineTo(x + ax * (p.r + 42), y + ay * (p.r + 42));
    ctx.stroke();
    ctx.restore();
  }

  glow(ctx, fill, 16, () => {
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.strokeStyle = edge;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, p.r - 1, 0, Math.PI * 2); ctx.stroke();

  // Şut anında beyaz parlama
  if (p.kickFlash > 0) {
    ctx.save();
    ctx.globalAlpha = p.kickFlash / 8;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, p.r + 2, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Forma numarası
  ctx.fillStyle = C.number;
  ctx.font = '800 14px system-ui, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(p.number), x, y + 1);

  // Stamina halkası: sende kalın ve parlak, takım arkadaşlarında ince ve soluk.
  // Rakiplerde gösterilmez.
  if (isLocal) drawStaminaRing(ctx, p, x, y, { R: p.r + 6, width: 3, alpha: 1, glowBlur: 10 });
  else if (isMate) drawStaminaRing(ctx, p, x, y, { R: p.r + 5, width: 1.5, alpha: 0.5, glowBlur: 0 });
}

function drawStaminaRing(ctx, p, x, y, { R, width, alpha, glowBlur }) {
  const C = NB.COLORS;
  ctx.save();
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = C.staminaTrack;
  ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();

  let col = C.stamina;
  if (p.exhausted) col = C.staminaLow;
  else if (p.stamina < 0.35) col = C.staminaMid;
  if (p.exhausted) ctx.globalAlpha = alpha * (0.55 + 0.45 * Math.sin(performance.now() / 90));

  if (p.stamina > 0.001) {
    glow(ctx, col, glowBlur, () => {
      ctx.strokeStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, R, -Math.PI / 2, -Math.PI / 2 + p.stamina * Math.PI * 2);
      ctx.stroke();
    });
  }
  ctx.restore();
}

function glow(ctx, color, blur, fn) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  fn();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function lerp(a, b, t) { return a + (b - a) * t; }
