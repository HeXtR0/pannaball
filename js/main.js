// Pannaball: menü, maç akışı ve oyun döngüsü.
// Fizik sabit hızda (saniyede 60 adım) döner, çizim ekranın yenileme hızında yapılır.
//
// Ekranlar: 'menu' -> 'play' <-> 'paused' -> 'over' -> ('play' | 'menu')

(function () {
  const TICK = NB.CONFIG.TICK_RATE;
  const $ = (id) => document.getElementById(id);

  const canvas = $('game');
  const renderer = new NB.Renderer(canvas);
  const local = new NB.LocalController(canvas, renderer);

  const el = {
    menu: $('menu'), hud: $('hud'), help: $('help'), toast: $('toast'),
    clock: $('clock'), pause: $('pause'), over: $('over'),
    scoreOrange: $('score-orange'), scorePurple: $('score-purple'),
  };

  let world = null;
  let brain = null;
  let controllers = {};
  let me = null;
  let screen = 'menu';
  let lastMode = '3v3';

  // --- Ayarlar (süre / gol limiti), tarayıcıda hatırlanır ----------------
  const settings = { duration: 180, goalLimit: 0, mateLevel: 'normal', oppLevel: 'normal' };
  const LEVELS = Object.keys(NB.DIFFICULTY);
  try {
    const saved = JSON.parse(localStorage.getItem('pannaball.settings') || '{}');
    if ([120, 180, 300].includes(saved.duration)) settings.duration = saved.duration;
    if ([0, 3, 5, 7].includes(saved.goalLimit)) settings.goalLimit = saved.goalLimit;
    if (LEVELS.includes(saved.mateLevel)) settings.mateLevel = saved.mateLevel;
    if (LEVELS.includes(saved.oppLevel)) settings.oppLevel = saved.oppLevel;
  } catch (e) { /* kayıt yoksa varsayılanlar */ }

  // Hap butonların değeri sayı (süre, gol limiti) ya da yazı (zorluk) olabilir
  const pillValue = (pill) => {
    const v = pill.dataset.value;
    return isNaN(Number(v)) ? v : Number(v);
  };

  function refreshPills() {
    for (const pill of document.querySelectorAll('.pill[data-setting]')) {
      pill.classList.toggle('on', settings[pill.dataset.setting] === pillValue(pill));
    }
    for (const pill of document.querySelectorAll('.pill[data-lang]')) {
      pill.classList.toggle('on', pill.dataset.lang === NB.getLang());
    }
  }
  for (const pill of document.querySelectorAll('.pill[data-lang]')) {
    pill.addEventListener('click', () => {
      NB.setLang(pill.dataset.lang);
      refreshPills();
    });
  }
  for (const pill of document.querySelectorAll('.pill[data-setting]')) {
    pill.addEventListener('click', () => {
      settings[pill.dataset.setting] = pillValue(pill);
      try { localStorage.setItem('pannaball.settings', JSON.stringify(settings)); } catch (e) { /* önemli değil */ }
      refreshPills();
    });
  }
  NB.applyLang();
  refreshPills();

  // --- Menü kartları ----------------------------------------------------
  for (const card of document.querySelectorAll('.card')) {
    const n = NB.MODES[card.dataset.mode].size;
    const mini = card.querySelector('.mini');
    // sim.js'deki santra dizilişiyle aynı
    const rows = n === 1 ? [0.5] : n === 2 ? [0.5, 0.5] : [0.5, 0.22, 0.78];
    const cols = n === 1 ? [0.3] : n === 2 ? [0.35, 0.16] : [0.35, 0.2, 0.2];
    for (let i = 0; i < n; i++) {
      for (const team of ['orange', 'purple']) {
        const dot = document.createElement('span');
        dot.className = 'dot ' + team;
        const x = team === 'orange' ? cols[i] : 1 - cols[i];
        dot.style.left = (x * 100) + '%';
        dot.style.top = (rows[i] * 100) + '%';
        mini.appendChild(dot);
      }
    }
    card.addEventListener('click', () => startMatch(card.dataset.mode));
  }

  // --- Butonlar ve tuşlar -----------------------------------------------
  for (const btn of document.querySelectorAll('[data-action]')) {
    btn.addEventListener('click', () => doAction(btn.dataset.action));
  }

  function doAction(action) {
    if (action === 'resume') setScreen('play');
    if (action === 'restart') startMatch(lastMode);
    if (action === 'menu') setScreen('menu');
  }

  window.addEventListener('keydown', (e) => {
    if (screen === 'menu') {
      const key = { Digit1: '1v1', Digit2: '2v2', Digit3: '3v3', Numpad1: '1v1', Numpad2: '2v2', Numpad3: '3v3' }[e.code];
      if (key) startMatch(key);
    } else if (screen === 'play') {
      if (e.code === 'Escape') setScreen('paused');
    } else if (screen === 'paused') {
      if (e.code === 'Escape') setScreen('play');
    } else if (screen === 'over') {
      if (e.code === 'Enter' || e.code === 'NumpadEnter') doAction('restart');
      if (e.code === 'Escape') doAction('menu');
    }
  });

  function setScreen(s) {
    screen = s;
    el.menu.classList.toggle('hidden', s !== 'menu');
    el.pause.classList.toggle('hidden', s !== 'paused');
    el.over.classList.toggle('hidden', s !== 'over');
    const inGame = s !== 'menu';
    el.hud.classList.toggle('hidden', !inGame);
    el.clock.classList.toggle('hidden', !inGame);
    el.help.classList.toggle('hidden', s !== 'play');
  }

  // --- Maç kurulumu -----------------------------------------------------
  function startMatch(modeKey) {
    lastMode = modeKey;
    const mode = NB.MODES[modeKey];
    world = NB.Sim.createWorld(mode.field, {
      durationSec: settings.duration,
      goalLimit: settings.goalLimit,
    });
    brain = new NB.TeamBrain(world, ['me']);
    controllers = {};

    const myTeam = Math.random() < 0.5 ? 'orange' : 'purple';
    const otherTeam = myTeam === 'orange' ? 'purple' : 'orange';
    const numbers = randomNumbers(mode.size * 2 - 1, [10]);

    // Sen her zaman takımının ilk oyuncususun (santrada topa en yakın yer)
    me = NB.Sim.addPlayer(world, { id: 'me', team: myTeam, number: 10 });
    controllers[me.id] = local;

    let k = 0;
    for (let i = 1; i < mode.size; i++) addBot(myTeam, numbers[k++], settings.mateLevel);
    for (let i = 0; i < mode.size; i++) addBot(otherTeam, numbers[k++], settings.oppLevel);

    setScreen('play');
    const name = NB.t(myTeam === 'orange' ? 'teamOrange' : 'teamPurple');
    const arrow = NB.t(myTeam === 'orange' ? 'attackRight' : 'attackLeft');
    showToast(myTeam, NB.t('yourTeam', { name, arrow }));
  }

  function addBot(team, number, level) {
    const id = 'bot-' + team + '-' + number;
    NB.Sim.addPlayer(world, { id, team, number });
    controllers[id] = new NB.BotController(brain, level);
  }

  function randomNumbers(count, exclude) {
    const pool = [];
    for (let n = 1; n <= 99; n++) if (!exclude.includes(n)) pool.push(n);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }

  let toastTimer = null;
  function showToast(cls, html) {
    el.toast.className = 'show ' + cls;
    el.toast.innerHTML = html;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.className = cls; }, 2600);
  }

  // --- HUD --------------------------------------------------------------
  function fmt(totalSec) {
    const m = Math.floor(totalSec / 60), s = totalSec % 60;
    return m + ':' + String(s).padStart(2, '0');
  }

  function updateHud() {
    el.scoreOrange.textContent = world.score.orange;
    el.scorePurple.textContent = world.score.purple;
    const m = world.match;
    if (m.overtime) {
      el.clock.className = 'overtime';
      el.clock.innerHTML = `<span class="ot">${NB.t('overtime')}</span> +${fmt(Math.floor(m.overtimeTicks / TICK))}`;
    } else {
      const left = Math.max(0, Math.ceil((m.durationTicks - m.elapsed) / TICK));
      el.clock.className = left <= 10 ? 'low' : '';
      el.clock.textContent = fmt(left);
    }
  }

  // --- Maç sonu ---------------------------------------------------------
  function showResult() {
    const m = world.match, st = world.stats;
    const winner = m.winner;
    const myTeam = me.team;
    const name = NB.t(winner === 'orange' ? 'teamOrange' : 'teamPurple');
    const golden = !!(world.lastGoal && world.lastGoal.golden && world.lastGoal.team === winner);

    $('over-title').className = 'title ' + winner;
    $('over-title').textContent = NB.t('wins', { name });
    $('over-sub').textContent = NB.t(winner === myTeam ? 'youWon' : 'youLost') + (golden ? ' · ' + NB.t('goldenGoal') : '');
    $('over-score').innerHTML =
      `<span class="orange">${world.score.orange}</span> : <span class="purple">${world.score.purple}</span>`;

    const num = (id) => { const p = world.players.find((q) => q.id === id); return p ? p.number : '?'; };
    const scorers = (team) => {
      const counts = new Map();
      let own = 0;
      for (const g of st.goals) {
        if (g.team !== team) continue;
        if (g.own) { own++; continue; }
        counts.set(g.id, (counts.get(g.id) || 0) + 1);
      }
      const parts = [...counts].map(([id, c]) => `<b class="${id === 'me' ? 'me' : ''}">${num(id)}</b> (${c})`);
      if (own) parts.push(`${NB.t('ownGoalShort')} (${own})`);
      return parts.length ? parts.join(' · ') : '-';
    };
    const pos = st.teams.orange.poss + st.teams.purple.poss || 1;
    const pct = (t) => Math.round(100 * st.teams[t].poss / pos) + '%';

    $('over-stats').innerHTML = `
      <div class="lbl">${NB.t('goals')}</div><div class="orange">${scorers('orange')}</div><div class="purple">${scorers('purple')}</div>
      <div class="lbl">${NB.t('shots')}</div><div class="orange">${st.teams.orange.shots}</div><div class="purple">${st.teams.purple.shots}</div>
      <div class="lbl">${NB.t('possession')}</div><div class="orange">${pct('orange')}</div><div class="purple">${pct('purple')}</div>
    `;
    setScreen('over');
  }

  // --- Döngü ------------------------------------------------------------
  const stepMs = 1000 / TICK;
  let acc = 0;
  let last = performance.now();

  function frame(now) {
    const elapsed = Math.min(250, now - last);
    last = now;

    if (world && screen === 'play') {
      acc += elapsed;
      while (acc >= stepMs && screen === 'play') {
        brain.update();
        const inputs = {};
        for (const p of world.players) {
          const c = controllers[p.id];
          if (c) inputs[p.id] = c.getInput(p, world);
        }
        NB.Sim.step(world, inputs);
        acc -= stepMs;
        for (const e of world.events) {
          if (e.type === 'overtime') showToast('neutral', NB.t('overtimeToast'));
          if (e.type === 'over') showResult();
        }
      }
      updateHud();
    } else {
      acc = 0;
      local.kickQueued = false;
    }

    renderer.draw(world, me && me.id, screen === 'play' ? acc / stepMs : 1);
    requestAnimationFrame(frame);
  }

  setScreen('menu');
  requestAnimationFrame(frame);
})();
