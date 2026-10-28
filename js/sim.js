// Pannaball: simülasyon.
// Fizik, şut, stamina, gol ve skor burada. Ekranla ya da klavyeyle ilgisi yok:
// her adımda sadece "her oyuncu ne yapmak istiyor" bilgisini (input) alır.
// Böylece aynı kod botlarla, yerelde ve ileride sunucuda çalışabilir.
//
// input = { moveX, moveY (-1..1), sprint (bool), kick (bool, bu adımda basıldı mı), aim (radyan) }

NB.Sim = (function () {
  const C = NB.CONFIG;

  // --- Duvarlar ---------------------------------------------------------
  // Her duvar bir çizgi parçası: [x1, y1, x2, y2]. Uçları yuvarlak davranır,
  // bu yüzden kale direkleri ayrıca tanımlanmaz, çizgi uçları direk görevi görür.
  // Dikey format: Kaleler üstte (-h/2) ve altta (+h/2), yan çizgiler solda (-w/2) ve sağda (+w/2).
  function buildWalls(field) {
    const { w, h, goalW, goalDepth, outerMargin: m } = field;
    const hw = w / 2, hh = h / 2, gx = goalW / 2, gd = goalDepth;

    // Saha çizgileri: sadece top için (oyuncular dışarı taşabilir)
    const ballOnly = [
      [-hw, -hh, -hw, hh],          // sol taç çizgisi
      [hw, -hh, hw, hh],            // sağ taç çizgisi
      [-hw, -hh, -gx, -hh],         // üst çizgi (kalenin solu)
      [gx, -hh, hw, -hh],           // üst çizgi (kalenin sağı)
      [-hw, hh, -gx, hh],           // alt çizgi (kalenin solu)
      [gx, hh, hw, hh],             // alt çizgi (kalenin sağı)
    ];

    // Kale fileleri: hem top hem oyuncu için
    const nets = [
      // Üst kale (mor kale)
      [-gx, -hh, -gx, -hh - gd],
      [-gx, -hh - gd, gx, -hh - gd],
      [gx, -hh - gd, gx, -hh],
      // Alt kale (turuncu kale)
      [-gx, hh, -gx, hh + gd],
      [-gx, hh + gd, gx, hh + gd],
      [gx, hh + gd, gx, hh],
    ];

    // Dış sınır: sadece oyuncular için
    const ox = hw + m, oy = hh + m;
    const outer = [
      [-ox, -oy, ox, -oy],
      [ox, -oy, ox, oy],
      [ox, oy, -ox, oy],
      [-ox, oy, -ox, -oy],
    ];

    return { ball: ballOnly.concat(nets), player: nets.concat(outer), nets };
  }

  // --- Dünya ------------------------------------------------------------
  // rules = { durationSec, goalLimit (0 = yok), firstKickoff ('orange' | 'purple') }
  function createWorld(field, rules = {}) {
    return {
      field,
      walls: buildWalls(field),
      centerR: field.w * 0.20,  // orta yuvarlak yarıçapı (santra kuralı ve çizim)
      tick: 0,
      players: [],
      ball: makeBody(0, 0, C.ball.radius, C.ball.mass),
      score: { orange: 0, purple: 0 },
      state: 'play',          // 'play' | 'goal' | 'over'
      pauseTicks: 0,
      lastScorer: null,       // gol atan takım (gösterim için)
      lastGoal: null,         // son gol olayı (altın gol mü vb.)
      lastTouch: null,        // topa en son dokunan oyuncunun id'si
      kickoffTick: 0,         // son santranın yapıldığı adım
      kickoff: {
        team: rules.firstKickoff || (Math.random() < 0.5 ? 'orange' : 'purple'),
        active: true,         // topa dokunulana kadar santra kuralı geçerli
      },
      match: {
        durationTicks: (rules.durationSec || 180) * C.TICK_RATE,
        goalLimit: rules.goalLimit || 0,
        elapsed: 0,           // normal sürede geçen adım
        overtime: false,      // altın gol uzatması
        overtimeTicks: 0,     // uzatmada geçen adım
        winner: null,
      },
      stats: {
        players: {},          // id -> { goals, shots }
        teams: { orange: { shots: 0, poss: 0 }, purple: { shots: 0, poss: 0 } },
        goals: [],            // { team, id, own, golden }
      },
      events: [],             // bu adımda olanlar: 'kick', 'goal', 'overtime', 'over'
    };
  }

  function playerStats(world, id) {
    return world.stats.players[id] || (world.stats.players[id] = { goals: 0, shots: 0 });
  }

  function makeBody(x, y, r, m) {
    return { x, y, px: x, py: y, vx: 0, vy: 0, r, m };
  }

  function addPlayer(world, { id, team, number }) {
    const p = makeBody(0, 0, C.player.radius, C.player.mass);
    Object.assign(p, {
      id, team, number,
      stamina: 1,
      exhausted: false,
      sprinting: false,
      kickCd: 0,
      kickBuf: 0,
      kickFlash: 0,
      aim: team === 'orange' ? -Math.PI / 2 : Math.PI / 2,
    });
    world.players.push(p);
    resetPositions(world);
    return p;
  }

  // Santra dizilişi (takım büyüklüğüne göre). Değerler saha boyutuna oranla.
  // Dikey format: Turuncu altta (y > 0) başlar, yukarı hücum eder.
  // Mor üstte (y < 0) başlar, aşağı hücum eder.
  const FORMATIONS = {
    1: [[0, 0.22]],
    2: [[0, 0.16], [0, 0.38]],
    3: [[0, 0.16], [-0.25, 0.34], [0.25, 0.34]],
  };

  function resetPositions(world) {
    const { w, h } = world.field;
    for (const team of ['orange', 'purple']) {
      const mates = world.players.filter((p) => p.team === team);
      const form = FORMATIONS[Math.min(3, Math.max(1, mates.length))];
      const side = team === 'orange' ? 1 : -1;
      mates.forEach((p, i) => {
        const [sx, sy] = form[i % form.length];
        p.x = p.px = sx * w;
        p.y = p.py = sy * h * side;
        p.vx = p.vy = 0;
        p.kickBuf = p.kickCd = 0;
        p.aim = team === 'orange' ? -Math.PI / 2 : Math.PI / 2;
      });
    }
    const b = world.ball;
    b.x = b.px = 0; b.y = b.py = 0; b.vx = b.vy = 0;
    world.lastTouch = null;
    world.kickoffTick = world.tick;   // botlar santrada biraz beklesin diye
    world.kickoff.active = true;
  }

  // --- Bir fizik adımı --------------------------------------------------
  function step(world, inputs) {
    world.tick++;
    world.events.length = 0;

    const all = world.players.concat([world.ball]);
    for (const o of all) { o.px = o.x; o.py = o.y; }

    for (const p of world.players) {
      applyInput(world, p, inputs[p.id] || null);
    }

    const n = C.SUBSTEPS;
    const ps = world.players;
    const maxPx = world.field.w / 2 + world.field.outerMargin - C.player.radius;
    const maxPy = world.field.h / 2 + world.field.outerMargin - C.player.radius;

    for (let s = 0; s < n; s++) {
      for (const o of all) { o.x += o.vx / n; o.y += o.vy / n; }

      for (let i = 0; i < ps.length; i++) {
        for (let j = i + 1; j < ps.length; j++) {
          collideCircles(ps[i], ps[j], C.bounce.playerPlayer);
        }
        if (collideCircles(ps[i], world.ball, C.bounce.playerBall)) world.lastTouch = ps[i].id;
      }

      for (const p of ps) for (const wl of world.walls.player) collideWall(p, wl, C.bounce.playerWall);
      for (const wl of world.walls.ball) collideWall(world.ball, wl, C.ball.wallBounce);

      // Oyuncuların kesinlikle saha sınırları dışına çıkmaması için sert clamp
      for (const p of ps) {
        p.x = Math.max(-maxPx, Math.min(maxPx, p.x));
        p.y = Math.max(-maxPy, Math.min(maxPy, p.y));
      }

      if (world.kickoff.active) for (const p of ps) applyKickoffRule(world, p);
    }

    for (const p of ps) { p.vx *= C.player.damping; p.vy *= C.player.damping; }
    world.ball.vx *= C.ball.damping;
    world.ball.vy *= C.ball.damping;

    // Topa ilk dokunuşla santra kuralı kalkar
    if (world.kickoff.active && world.lastTouch) world.kickoff.active = false;

    // Topa sahip olma: topa en son dokunan takım
    if (world.state === 'play' && world.lastTouch) {
      const t = ps.find((p) => p.id === world.lastTouch);
      if (t) world.stats.teams[t.team].poss++;
    }

    updateMatchState(world);
  }

  // Santra: herkes kendi yarı sahasında kalır (dikey düzende y = 0 orta çizgi).
  // Santrayı kullanmayan takım orta yuvarlağa da giremez.
  // Santrayı kullanan takım orta yuvarlağın içinde karşı yarıya geçebilir.
  function applyKickoffRule(world, p) {
    const side = p.team === 'orange' ? 1 : -1;   // kendi yarı sahası: y * side >= 0
    const R = world.centerR;
    const isKicker = p.team === world.kickoff.team;

    if (p.y * side < 0) {
      const d = Math.hypot(p.x, p.y);
      const inner = R - p.r;
      if (isKicker && d <= inner) {
        // yuvarlağın içinde, serbest
      } else if (isKicker && d - inner < Math.abs(p.y)) {
        // yuvarlağın sınırına geri it (çizgiye itmekten daha yakınsa)
        p.x *= inner / d; p.y *= inner / d;
        const nx = p.x / inner, ny = p.y / inner;
        const vn = p.vx * nx + p.vy * ny;
        if (vn > 0) { p.vx -= vn * nx; p.vy -= vn * ny; }
      } else {
        p.y = 0;
        if (p.vy * side < 0) p.vy = 0;
      }
    }

    if (!isKicker) {
      const min = R + p.r;
      const d = Math.hypot(p.x, p.y);
      if (d < min) {
        const nx = d > 0 ? p.x / d : 0, ny = d > 0 ? p.y / d : side;
        p.x = nx * min; p.y = ny * min;
        const vn = p.vx * nx + p.vy * ny;
        if (vn < 0) { p.vx -= vn * nx; p.vy -= vn * ny; }
      }
    }
  }

  function applyInput(world, p, input) {
    const dt = 1 / C.TICK_RATE;
    let mx = 0, my = 0, wantSprint = false, kick = false;
    if (input) {
      mx = input.moveX || 0;
      my = input.moveY || 0;
      wantSprint = !!input.sprint;
      kick = !!input.kick;
      if (typeof input.aim === 'number') p.aim = input.aim;
    }

    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    const moving = len > 0.01;

    // Stamina ve boost (Shift)
    p.sprinting = wantSprint && moving && !p.exhausted && p.stamina > 0;
    if (p.sprinting) {
      p.stamina = Math.max(0, p.stamina - C.stamina.drainPerSec * dt);
      if (p.stamina === 0) p.exhausted = true;
    } else {
      p.stamina = Math.min(1, p.stamina + C.stamina.regenPerSec * dt);
      if (p.exhausted && p.stamina >= C.stamina.recoverAt) p.exhausted = false;
    }

    const a = p.sprinting ? C.player.sprintAccel : C.player.accel;
    p.vx += mx * a;
    p.vy += my * a;

    // Şut: tık kısa süre bekletilir, top menzile girince o yöne vurulur
    if (kick) { p.kickBuf = C.kick.bufferTicks; p.kickFlash = 8; }
    if (p.kickCd > 0) p.kickCd--;
    if (p.kickFlash > 0) p.kickFlash--;

    if (p.kickBuf > 0) {
      p.kickBuf--;
      const b = world.ball;
      const gap = Math.hypot(b.x - p.x, b.y - p.y) - p.r - b.r;
      if (p.kickCd === 0 && gap <= C.kick.range && world.state === 'play') {
        b.vx = Math.cos(p.aim) * C.kick.power;
        b.vy = Math.sin(p.aim) * C.kick.power;
        p.kickCd = C.kick.cooldownTicks;
        p.kickBuf = 0;
        world.lastTouch = p.id;
        world.events.push({ type: 'kick', id: p.id });

        // Şut sayılır mı? Top rakip kalenin ağzına doğru gidiyorsa evet.
        // Turuncu yukarı hücum eder (dir = -1), mor aşağı hücum eder (dir = 1).
        const dir = p.team === 'orange' ? -1 : 1;
        const gy = dir * world.field.h / 2;
        if (b.vy * dir > 0) {
          const x = b.x + b.vx * (gy - b.y) / b.vy;
          if (Math.abs(x) < world.field.goalW / 2 + 30) {
            world.stats.teams[p.team].shots++;
            playerStats(world, p.id).shots++;
          }
        }
      }
    }
  }

  function updateMatchState(world) {
    const m = world.match;
    if (world.state === 'over') return;

    if (world.state === 'goal') {
      if (--world.pauseTicks <= 0) {
        if (m.winner) {
          world.state = 'over';
          world.events.push({ type: 'over', winner: m.winner });
          return;
        }
        world.state = 'play';
        resetPositions(world);
      }
      return;
    }

    // Saat sadece oyun akarken işler (gol kutlamasında durur)
    if (m.overtime) m.overtimeTicks++;
    else m.elapsed++;

    const b = world.ball;
    const hh = world.field.h / 2, gx = world.field.goalW / 2;
    if (Math.abs(b.x) < gx) {
      let scorer = null;
      if (b.y < -hh - b.r) scorer = 'orange';      // üst kale morun kalesidir, turuncu attı
      else if (b.y > hh + b.r) scorer = 'purple';  // alt kale turuncunun kalesidir, mor attı
      if (scorer) {
        world.score[scorer]++;
        world.state = 'goal';
        world.pauseTicks = C.goalPauseTicks;
        world.lastScorer = scorer;

        // Golü kim attı? Topa son dokunan karşı takımdansa kendi kalesine.
        const toucher = world.players.find((p) => p.id === world.lastTouch);
        const own = !!toucher && toucher.team !== scorer;
        if (toucher && !own) playerStats(world, toucher.id).goals++;
        const goal = { type: 'goal', team: scorer, id: toucher ? toucher.id : null, own, golden: m.overtime };
        world.stats.goals.push(goal);
        world.lastGoal = goal;
        world.events.push(goal);

        // Golü yiyen takım santra yapar
        world.kickoff.team = scorer === 'orange' ? 'purple' : 'orange';

        // Altın gol ya da gol limiti: gol kutlamasından sonra maç biter
        if (m.overtime || (m.goalLimit && world.score[scorer] >= m.goalLimit)) m.winner = scorer;
        return;
      }
    }

    // Süre doldu
    if (!m.overtime && m.elapsed >= m.durationTicks) {
      const { orange, purple } = world.score;
      if (orange !== purple) {
        m.winner = orange > purple ? 'orange' : 'purple';
        world.state = 'over';
        world.events.push({ type: 'over', winner: m.winner });
      } else {
        m.overtime = true;
        world.events.push({ type: 'overtime' });
      }
    }
  }

  // --- Çarpışma yardımcıları --------------------------------------------
  // Temas olduysa true döner.
  function collideCircles(a, b, restitution) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    const min = a.r + b.r;
    if (d >= min || d === 0) return false;
    const nx = dx / d, ny = dy / d;
    const ia = 1 / a.m, ib = 1 / b.m, sum = ia + ib;
    const overlap = min - d;
    a.x -= nx * overlap * ia / sum; a.y -= ny * overlap * ia / sum;
    b.x += nx * overlap * ib / sum; b.y += ny * overlap * ib / sum;
    const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    if (rv < 0) {
      const j = -(1 + restitution) * rv / sum;
      a.vx -= j * ia * nx; a.vy -= j * ia * ny;
      b.vx += j * ib * nx; b.vy += j * ib * ny;
    }
    return true;
  }

  function collideWall(o, wl, restitution) {
    const [x1, y1, x2, y2] = wl;
    const dx = x2 - x1, dy = y2 - y1;
    let t = ((o.x - x1) * dx + (o.y - y1) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx, cy = y1 + t * dy;
    let nx = o.x - cx, ny = o.y - cy;
    const d = Math.hypot(nx, ny);
    if (d >= o.r || d === 0) return;
    nx /= d; ny /= d;
    o.x = cx + nx * o.r;
    o.y = cy + ny * o.r;
    const vn = o.vx * nx + o.vy * ny;
    if (vn < 0) {
      o.vx -= (1 + restitution) * vn * nx;
      o.vy -= (1 + restitution) * vn * ny;
    }
  }

  return { createWorld, addPlayer, step, resetPositions };
})();
