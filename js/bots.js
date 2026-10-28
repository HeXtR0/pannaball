// Pannaball: botlar.
//
// İki parça var:
//  - TeamBrain: her adımda takımdaki botlara rol verir.
//      chaser  = topa giden
//      keeper  = kaleyi koruyan (2v2 ve 3v3'te)
//      support = boşa kaçan, pas seçeneği olan (3v3'te)
//    Sen topa en yakınsan "topa giden" sensin, botlar başka işe geçer.
//    Kaleci rolü sadece botlara verilir (senin kalede durduğunu varsaymaz).
//  - BotController: rolüne göre "ne yapmak istiyorum" (input) üretir.
//    Klavye kontrolcüsüyle aynı biçimi döndürür, simülasyon farkı bilmez.
//
// Doğallık için her botun bir "kişiliği" var (tepki süresi, nişan hatası, şut mesafesi,
// pas sevgisi, sprint alışkanlığı...). Botlar topu anında değil, kısa bir gecikmeyle görür.

NB.TeamBrain = class {
  constructor(world, humanIds = []) {
    this.world = world;
    this.humans = new Set(humanIds);
    this.roles = {};
    this.chaser = { orange: null, purple: null };
    this.keeper = { orange: null, purple: null };
  }

  update() {
    const w = this.world, b = w.ball;
    // Her santrada roller sıfırdan dağıtılır (eski kaleci önde kalmışsa geri koşup
    // topa giden arkadaşıyla kafa kafaya çarpışmasın diye)
    if (w.kickoffTick !== this.kickoffSeen) {
      this.kickoffSeen = w.kickoffTick;
      this.chaser = { orange: null, purple: null };
      this.keeper = { orange: null, purple: null };
    }
    for (const team of ['orange', 'purple']) {
      const mates = w.players.filter((p) => p.team === team);
      if (!mates.length) continue;
      const dir = team === 'orange' ? 1 : -1;
      const ownGoal = { x: -dir * w.field.w / 2, y: 0 };
      const ballNearGoal = dist(b, ownGoal) < w.field.w * 0.28;

      // Topa giden: mesafe + topun yanlış tarafındaysa ceza.
      // Mevcut chaser'a küçük avantaj (rol titremesin diye).
      // Kaleci, top kaleye yakın değilse kalesini bırakıp topa koşmaz.
      // Santra bizdeyse ve 3 sn'dir kimse dokunmadıysa (sen beklediysen) santrayı bir bot yapar
      const stalledKickoff = w.kickoff.active && w.kickoff.team === team &&
        w.tick - w.kickoffTick > 3 * NB.CONFIG.TICK_RATE;
      const canChase = (p) => !(stalledKickoff && this.humans.has(p.id) &&
        mates.some((m) => !this.humans.has(m.id)));

      let best = null, bestScore = Infinity;
      for (const p of mates) {
        if (!canChase(p)) continue;
        let s = dist(b, p);
        if ((b.x - p.x) * dir < 0) s += 80;
        if (p.id === this.chaser[team]) s *= 0.8;
        if (mates.length > 1 && p.id === this.keeper[team] && !ballNearGoal) s += 10000;
        if (s < bestScore) { bestScore = s; best = p; }
      }
      this.chaser[team] = best.id;
      this.roles[best.id] = 'chaser';

      const rest = mates.filter((p) => p !== best && !this.humans.has(p.id));
      if (!rest.length) { this.keeper[team] = null; continue; }

      let keeper = null, kScore = Infinity;
      for (const p of rest) {
        let s = dist(p, ownGoal);
        if (p.id === this.keeper[team]) s *= 0.6;
        if (s < kScore) { kScore = s; keeper = p; }
      }
      this.keeper[team] = keeper.id;
      this.roles[keeper.id] = 'keeper';
      for (const p of rest) if (p !== keeper) this.roles[p.id] = 'support';
    }
  }

  roleOf(id) { return this.roles[id] || 'chaser'; }
};

NB.BotController = class {
  constructor(brain, level = 'normal') {
    this.brain = brain;
    this.level = level;
    // Kişilik: seviyenin aralıklarından rastgele (açıklamalar config.js'de, NB.DIFFICULTY)
    const D = NB.DIFFICULTY[level] || NB.DIFFICULTY.normal;
    const r = ([a, b]) => rand(a, b);
    this.t = {
      reaction: Math.round(r(D.reaction)),
      thinkEvery: Math.round(r(D.thinkEvery)),
      aimNoise: r(D.aimNoise),
      shootRange: r(D.shootRange),
      longShot: r(D.longShot),
      passChance: r(D.passChance),
      sprintMin: r(D.sprintMin),
      keeperDepth: r(D.keeperDepth),
      keeperError: r(D.keeperError),
      kickoffDelay: D.kickoffDelay,
      speed: D.speed,
      smartShot: D.smartShot,
      spacing: D.spacing,
    };
    this.seen = null;
    this.freezeUntil = 0;
    this.nextThink = 0;
    this.plan = null;
    this.planUntil = 0;
    this.kickoffSeen = -1;
    this.kickoffDelay = 0;
    this.shotTracked = false;
    this.keeperErr = 0;
  }

  getInput(p, w) {
    const C = NB.CONFIG;
    const f = w.field, b = w.ball;
    const hw = f.w / 2, hh = f.h / 2;
    const dir = p.team === 'orange' ? 1 : -1;
    const ownGoal = { x: -dir * hw, y: 0 };
    const oppGoal = { x: dir * hw, y: 0 };
    const R = p.r + b.r;
    const maxV = C.player.accel * C.player.damping / (1 - C.player.damping);
    const idle = { moveX: 0, moveY: 0, sprint: false, kick: false, aim: Math.atan2(b.y - p.y, b.x - p.x) };

    if (w.state !== 'play') return idle;
    // Santra rakipteyse topa dokunulana kadar yerinde bekle
    if (w.kickoff.active && w.kickoff.team !== p.team) return idle;

    // Santra: her bot rastgele kısa bir süre bekler, ilk saniyelerde sprint yok
    if (w.kickoffTick !== this.kickoffSeen) {
      this.kickoffSeen = w.kickoffTick;
      this.kickoffDelay = Math.round(rand(...this.t.kickoffDelay));
      this.plan = null;
      this.seen = null;
    }
    const sinceKickoff = w.tick - w.kickoffTick;
    if (sinceKickoff < this.kickoffDelay) return idle;
    const calmStart = sinceKickoff < 100;

    const sb = this.perceive(p, w);   // botun "gördüğü" top (gecikmeli)
    this.updatePlan(w, f);

    const role = this.brain.roleOf(p.id);
    let target, sprint = false, kick = false;
    let aim = p.aim;

    const gap = dist(p, b) - R;
    const inRange = gap <= C.kick.range;
    const toBall = norm(b.x - p.x, b.y - p.y);
    const opp = nearestOpponent(w, p.team, b);
    const oppDist = opp ? dist(opp, b) : Infinity;
    const pressured = oppDist < 75;

    const shotTarget = { x: oppGoal.x, y: this.plan.shootY * f.goalW / 2 };
    const shotDir = norm(shotTarget.x - b.x, shotTarget.y - b.y);
    const shotAim = () => Math.atan2(shotDir.y, shotDir.x);

    if (role === 'chaser') {
      // Topu nerede yakalayabilirim?
      const ip = intercept(p, sb, maxV, R, f);
      const myDist = dist(p, sb);
      // Santra bizdeyse rakip topa dokunamaz: savunma moduna geçmeye gerek yok
      const ourKickoff = w.kickoff.active && w.kickoff.team === p.team;
      const oppD = opp && !ourKickoff ? dist(opp, sb) : Infinity;
      const inOurHalf = (sb.x - ownGoal.x) * dir < f.w * 0.6;

      // Kendi yarımızda top çekişmeliyse topa kendi kalemiz tarafından gir ve kaleden uzağa it
      // (şut yolunu kapatır). Değilse rakip kaleye vurabileceğimiz taraftan gir.
      const contested = oppD < 70 && inOurHalf;
      const uDef = norm(ip.x - ownGoal.x, ip.y - ownGoal.y);
      const u = contested ? uDef : norm(shotTarget.x - ip.x, shotTarget.y - ip.y);
      target = approach(p, ip, u, R);

      // Savunma: top bizim tarafımızdayken rakip topa benden önce yetişecekse ya da
      // ben topun önünde kaldıysam, körlemesine kovalama: topla kale arasına gir, şut açısını kapat.
      // Yeterince yaklaşınca (myDist küçük) normal müdahaleye döner.
      const oppWins = oppD + 25 < myDist;
      const beaten = (p.x - sb.x) * dir > 10;
      const defending = inOurHalf && (oppWins || beaten) && myDist > 50;
      if (defending) {
        const g = norm(ownGoal.x - sb.x, ownGoal.y - sb.y);
        const back = Math.min(this.plan.markDist, dist(sb, ownGoal) * 0.45);
        target = avoidBall(p, { x: sb.x + g.x * back, y: sb.y + g.y * back }, sb, R);
      }

      // Takımda bot kaleci yoksa (1v1 gibi) son adam benim: kaleyi boş bırakma
      let blocking = false;
      if (!this.brain.keeper[p.team]) {
        if (inOurHalf && (oppWins || (oppD < 40 && oppD < myDist)) && myDist > 45) {
          // Top rakipte: kale ile top arasına, kaleye daha yakın bir yere çekil
          const g = norm(sb.x - ownGoal.x, sb.y - ownGoal.y);
          const depth = clamp(dist(sb, ownGoal) * this.plan.lastManDepth, 50, 230);
          target = avoidBall(p, { x: ownGoal.x + g.x * depth, y: ownGoal.y + g.y * depth }, sb, R);
        }
        // Kaleye şut geliyor ve ben topla kale arasındayım: topun yoluna kay
        const incoming = sb.vx * -dir > 4 && (p.x - sb.x) * dir < 0;
        const err = this.trackShot(incoming);
        if (incoming) {
          const hitY = ballYAtX(sb, p.x);
          if (hitY !== null && Math.abs(hitY) < f.goalW / 2 + 40) {
            target = { x: p.x, y: hitY + err };
            blocking = true;
          }
        }
      }

      const racing = opp && oppD < myDist * 1.15 && myDist > 70;
      sprint = !calmStart && p.stamina > this.t.sprintMin &&
        (racing || (defending && beaten) || (this.plan.sprinty && myDist > 220));
      if (blocking) sprint = p.stamina > 0.15;

      if (inRange) {
        const facing = toBall.x * shotDir.x + toBall.y * shotDir.y;
        const dGoal = dist(b, oppGoal);
        if (facing > 0.45) {
          const pass = this.plan.pass ? findPass(w, p, b, dir) : null;
          const inShotRange = dGoal < this.t.shootRange * f.w || (this.plan.longShot && dGoal < 0.7 * f.w);
          // Akıllı şut: önü kapalı mı diye bak, en boş köşeyi seç. Her yer kapalıysa ve
          // baskı yoksa şut yerine pas ver ya da sürmeye devam et.
          const lane = inShotRange && this.plan.smart ? bestLane(w, p, b, oppGoal, f, toBall) : null;
          if (inShotRange && (!lane || lane.clear > 8 || pressured)) {
            kick = true;
            aim = lane ? Math.atan2(lane.y - b.y, lane.x - b.x) : shotAim();
          } else if (pass) {
            kick = true; aim = Math.atan2(pass.y - b.y, pass.x - b.x);
          } else if (pressured) {
            kick = true; aim = shotAim();
          }
          // aksi halde şut yok: topu sürerek ilerle
        } else if (contested && toBall.x * uDef.x + toBall.y * uDef.y > 0.3) {
          // Çekişmede kaleden uzağa, biraz da ileri doğru uzaklaştır
          kick = true; aim = Math.atan2(uDef.y + shotDir.y, uDef.x + shotDir.x);
        } else if (dist(b, ownGoal) < f.w * 0.3 && toBall.x * dir > -0.2 && pressured) {
          // Kalemizin önünde, rakip yakın, düzgün vuramıyoruz: uzaklaştır
          kick = true; aim = Math.atan2(toBall.y, toBall.x);
        }
      }
    } else if (role === 'keeper') {
      const lim = f.goalW / 2;
      // Normalde: kale ortası ile top arasındaki çizgide, topa göre biraz önde dur
      let v = norm(sb.x - ownGoal.x, sb.y - ownGoal.y);
      if (v.x * dir < 0.3) v = norm(dir * 0.3, Math.sign(v.y) || 1);
      const depth = clamp(dist(sb, ownGoal) * this.t.keeperDepth, 24, 110);
      target = { x: ownGoal.x + v.x * depth, y: clamp(ownGoal.y + v.y * depth, -lim - 8, lim + 8) };

      // Kaleye top geliyor: geri çekilme, bulunduğun hizada topun yoluna kay
      const incoming = sb.vx * -dir > 2.5;
      const err = this.trackShot(incoming);
      if (incoming) {
        let kx = p.x;
        const minX = ownGoal.x + dir * 16;
        if ((kx - minX) * dir < 0) kx = minX;
        const hitY = ballYAtX(sb, kx);
        if (hitY !== null) {
          target = { x: kx, y: clamp(hitY + err, -lim - 12, lim + 12) };
          sprint = p.stamina > 0.15;
        }
      } else {
        // Top kale önünde başıboşsa git uzaklaştır
        if (dist(sb, ownGoal) < f.w * 0.17) {
          const away = norm(sb.x - ownGoal.x, sb.y - ownGoal.y);
          target = approach(p, sb, away, R);
        }
      }

      if (inRange) {
        const away = norm(b.x - ownGoal.x, b.y - ownGoal.y);
        if (toBall.x * away.x + toBall.y * away.y > 0.1) {
          kick = true;
          // Uzaklaştırma: kaleden dışarı, biraz ileri doğru
          const cx = away.x + dir * 0.8, cy = away.y;
          aim = Math.atan2(cy, cx);
        }
      }
    } else {
      // support: topun gerisinde, karşı kanatta, pas seçeneği gibi dur
      const tx = clamp(sb.x - dir * 170 + this.plan.wanderX, -hw + 80, hw - 80);
      const ty = (sb.y > 0 ? -hh * 0.4 : hh * 0.4) + this.plan.wanderY;
      target = { x: tx, y: ty };
      if (this.t.spacing) target = spread(target, p, w, 130);
      if (inRange) {
        const facing = toBall.x * shotDir.x + toBall.y * shotDir.y;
        if (facing > 0.3) { kick = true; aim = shotAim(); }
      }
    }

    if (kick) aim += (Math.random() - 0.5) * 2 * this.t.aimNoise;

    const mv = sidestepMates(p, w, steer(p, target, sprint ? maxV * 1.5 : maxV));
    return { moveX: mv.x * this.t.speed, moveY: mv.y * this.t.speed, sprint, kick, aim };
  }

  // Kaleye gelen her şut için bir kez "tahmin hatası" seçilir; kurtarışlar böylece garanti olmaz.
  trackShot(incoming) {
    if (!incoming) { this.shotTracked = false; return 0; }
    if (!this.shotTracked) {
      this.shotTracked = true;
      this.keeperErr = (Math.random() - 0.5) * 2 * this.t.keeperError;
    }
    return this.keeperErr;
  }

  // Bot topu sürekli değil, birkaç adımda bir "görür". Başkası şut çektiğinde
  // yeni yönü ancak tepki süresi kadar sonra fark eder; o arada eski tahminle hareket eder.
  perceive(p, w) {
    for (const e of w.events) {
      if (e.type === 'kick' && e.id !== p.id) this.freezeUntil = w.tick + this.t.reaction;
    }
    if (!this.seen || (w.tick >= this.freezeUntil && w.tick >= this.nextThink)) {
      const b = w.ball;
      this.seen = { x: b.x, y: b.y, vx: b.vx, vy: b.vy, tick: w.tick };
      this.nextThink = w.tick + this.t.thinkEvery + Math.floor(Math.random() * 3);
    }
    return ballAt(this.seen, w.tick - this.seen.tick, w.field);
  }

  // Kısa vadeli niyet: nereye şut çekecek, pas mı verecek, sprint mi atacak...
  // 1-2,5 saniyede bir yeniden belirlenir, böylece bot her an fikir değiştirmez ama ezbere de oynamaz.
  updatePlan(w, f) {
    if (this.plan && w.tick < this.planUntil) return;
    this.plan = {
      shootY: pick([-0.55, -0.3, 0, 0.3, 0.55]) + rand(-0.1, 0.1),
      longShot: Math.random() < this.t.longShot,
      smart: Math.random() < this.t.smartShot,
      pass: Math.random() < this.t.passChance,
      sprinty: Math.random() < 0.5,
      markDist: rand(55, 95),
      lastManDepth: rand(0.3, 0.5),
      wanderX: rand(-50, 50),
      wanderY: rand(-40, 40),
    };
    this.planUntil = w.tick + Math.round(rand(60, 150));
  }
};

// --- Yardımcılar ------------------------------------------------------------

// Topun dt adım sonraki tahmini yeri (sürtünme dahil, saha içinde tutulur)
function ballAt(s, dt, f) {
  const d = NB.CONFIG.ball.damping;
  const k = dt > 0 ? (1 - Math.pow(d, dt)) / (1 - d) : 0;
  const v = Math.pow(d, Math.max(0, dt));
  return {
    x: clamp(s.x + s.vx * k, -f.w / 2, f.w / 2),
    y: clamp(s.y + s.vy * k, -f.h / 2, f.h / 2),
    vx: s.vx * v,
    vy: s.vy * v,
  };
}

// Topun yoluna en erken nerede yetişebilirim?
function intercept(p, s, maxV, R, f) {
  const d = NB.CONFIG.ball.damping;
  let x = s.x, y = s.y, vx = s.vx, vy = s.vy;
  for (let t = 0; t <= 60; t++) {
    if (Math.hypot(x - p.x, y - p.y) - R <= maxV * t * 0.9) break;
    x = clamp(x + vx, -f.w / 2, f.w / 2);
    y = clamp(y + vy, -f.h / 2, f.h / 2);
    vx *= d; vy *= d;
  }
  return { x, y };
}

// Top, x hizasına geldiğinde y'si ne olur? (gelmiyorsa null)
function ballYAtX(s, x) {
  const d = NB.CONFIG.ball.damping;
  let bx = s.x, by = s.y, vx = s.vx, vy = s.vy;
  for (let t = 0; t < 120; t++) {
    if ((x - bx) * Math.sign(vx) <= 0) return by;
    bx += vx; by += vy; vx *= d; vy *= d;
    if (Math.abs(vx) < 0.3) return null;
  }
  return null;
}

// Topa u yönünde vurabilmek için gidilecek nokta. Doğru taraftaysan topun içinden geç,
// değilsen arkasına dolaş; topun önündeysen yandan dolan ki topu ters yöne itme.
function approach(p, pb, u, R) {
  const toPb = norm(pb.x - p.x, pb.y - p.y);
  const align = toPb.x * u.x + toPb.y * u.y;
  if (align > 0.75) return { x: pb.x + u.x * 12, y: pb.y + u.y * 12 };
  const off = R + 24;
  const back = { x: pb.x - u.x * off, y: pb.y - u.y * off };
  if (align < 0.2) {
    const s = Math.sign(u.x * (p.y - pb.y) - u.y * (p.x - pb.x)) || 1;
    back.x += -u.y * s * off * 0.9;
    back.y += u.x * s * off * 0.9;
  }
  return back;
}

// Hedefe giden yol topun içinden geçiyorsa yandan dolaş (topu kendi kalemize itmeyelim)
function avoidBall(p, target, ball, R) {
  if (distToSegment(ball, p, target) > R + 8) return target;
  const d = norm(target.x - p.x, target.y - p.y);
  const s = Math.sign(d.x * (ball.y - p.y) - d.y * (ball.x - p.x)) || 1;
  const off = R + 26;
  return { x: ball.x + d.y * s * off, y: ball.y - d.x * s * off };
}

// Kalenin hangi noktasına şut yolu en açık? Rakiplerin şut çizgisine uzaklığına bakar.
// Sadece şu an vurabileceğimiz açıdaki (topun önündeki) noktalar değerlendirilir.
function bestLane(w, p, b, oppGoal, f, toBall) {
  let best = null;
  for (const k of [-0.7, -0.4, 0, 0.4, 0.7]) {
    const t = { x: oppGoal.x, y: k * f.goalW / 2 };
    const d = norm(t.x - b.x, t.y - b.y);
    if (toBall.x * d.x + toBall.y * d.y < 0.45) continue;
    let clear = Infinity;
    for (const o of w.players) {
      if (o.team === p.team) continue;
      clear = Math.min(clear, distToSegment(o, b, t) - o.r - b.r);
    }
    if (!best || clear > best.clear) best = { x: t.x, y: t.y, clear };
  }
  return best;
}

// Gidiş yönünün hemen önünde takım arkadaşı varsa yana kaç (kafa kafaya itişmesinler)
function sidestepMates(p, w, mv) {
  const m = Math.hypot(mv.x, mv.y);
  if (m < 0.01) return mv;
  const dx = mv.x / m, dy = mv.y / m;
  for (const o of w.players) {
    if (o === p || o.team !== p.team) continue;
    const rx = o.x - p.x, ry = o.y - p.y;
    const ahead = rx * dx + ry * dy;
    if (ahead <= 0 || ahead > 60) continue;
    const side = rx * -dy + ry * dx;   // arkadaş yolumun ne kadar yanında
    if (Math.abs(side) > p.r + o.r + 4) continue;
    const s = side > 0 ? -1 : side < 0 ? 1 : (p.id < o.id ? 1 : -1);
    const nx = dx + -dy * s * 0.9, ny = dy + dx * s * 0.9;
    const n = Math.hypot(nx, ny);
    return { x: nx / n * m, y: ny / n * m };
  }
  return mv;
}

// Hedef nokta takım arkadaşlarına çok yakınsa biraz uzağa kaydır (üst üste binmesinler)
function spread(target, p, w, minD) {
  let x = target.x, y = target.y;
  for (const m of w.players) {
    if (m === p || m.team !== p.team) continue;
    const d = Math.hypot(x - m.x, y - m.y);
    if (d < minD && d > 0.01) {
      const k = (minD - d) * 0.7 / d;
      x += (x - m.x) * k;
      y += (y - m.y) * k;
    }
  }
  const f = w.field;
  return { x: clamp(x, -f.w / 2 + 30, f.w / 2 - 30), y: clamp(y, -f.h / 2 + 30, f.h / 2 - 30) };
}

// İleride ve önü açık bir takım arkadaşı var mı? Varsa koşusunun önüne pas noktası.
function findPass(w, p, b, dir) {
  let best = null, bestScore = 0;
  for (const m of w.players) {
    if (m === p || m.team !== p.team) continue;
    const ahead = (m.x - b.x) * dir;
    if (ahead < 50) continue;
    const lead = { x: m.x + m.vx * 12, y: m.y + m.vy * 12 };
    let open = true;
    for (const o of w.players) {
      if (o.team === p.team) continue;
      if (distToSegment(o, b, lead) < 50) { open = false; break; }
    }
    if (open && ahead > bestScore) { bestScore = ahead; best = lead; }
  }
  return best;
}

function nearestOpponent(w, team, pt) {
  let best = null, bd = Infinity;
  for (const o of w.players) {
    if (o.team === team) continue;
    const d = dist(o, pt);
    if (d < bd) { bd = d; best = o; }
  }
  return best;
}

// Hedefe gitmek için hangi yöne basılmalı (mevcut hızı da hesaba katar ki savrulmasın)
function steer(p, target, maxV) {
  const dx = target.x - p.x, dy = target.y - p.y;
  const d = Math.hypot(dx, dy);
  const speed = maxV * Math.min(1, d / 45);
  const wantVx = d > 0 ? (dx / d) * speed : 0;
  const wantVy = d > 0 ? (dy / d) * speed : 0;
  const ax = wantVx - p.vx, ay = wantVy - p.vy;
  const m = Math.hypot(ax, ay);
  if (m < 0.2) return { x: 0, y: 0 };
  return { x: ax / m, y: ay / m };
}

function distToSegment(pt, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy || 1;
  const t = clamp(((pt.x - a.x) * dx + (pt.y - a.y) * dy) / l2, 0, 1);
  return Math.hypot(pt.x - (a.x + t * dx), pt.y - (a.y + t * dy));
}

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function norm(x, y) { const m = Math.hypot(x, y) || 1; return { x: x / m, y: y / m }; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
