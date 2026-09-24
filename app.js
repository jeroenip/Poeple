(() => {
  'use strict';

  const TARGET = 'poep';
  const LAUNCH = new Date(2026, 8, 24); // Poeple #1 = 24 september 2026
  const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
  const WORDS = new Set(window.POEPLE_WORDS);
  const STARTS = window.POEPLE_STARTS;
  const STORE_KEY = 'poeple:v1';
  // Link onder een gedeeld resultaat. Pas aan als Poeple een eigen domein krijgt.
  const SITE_URL = 'https://jeroenip.github.io/Poeple/';
  const track = (name, perDag) => window.poepleTrack?.(name, perDag);

  // ---------- Graaf & kortste routes ----------

  function neighbours(word) {
    const out = [];
    for (let i = 0; i < 4; i++) {
      for (const c of ALPHABET) {
        if (c === word[i]) continue;
        const w = word.slice(0, i) + c + word.slice(i + 1);
        if (WORDS.has(w)) out.push(w);
      }
    }
    return out;
  }

  // BFS vanaf POEP: afstand van elk woord tot het doel.
  const DIST = new Map([[TARGET, 0]]);
  {
    const queue = [TARGET];
    for (let q = 0; q < queue.length; q++) {
      const w = queue[q];
      for (const n of neighbours(w)) {
        if (!DIST.has(n)) { DIST.set(n, DIST.get(w) + 1); queue.push(n); }
      }
    }
  }

  function bestPath(from) {
    if (!DIST.has(from)) return null;
    const path = [from];
    let cur = from;
    while (cur !== TARGET) {
      const d = DIST.get(cur);
      // Kies de meest gangbare buur (eerste in lijst) die dichterbij ligt.
      cur = neighbours(cur).filter(n => DIST.get(n) === d - 1).sort(byCommonness)[0];
      path.push(cur);
    }
    return path;
  }
  const START_RANK = new Map(STARTS.map((w, i) => [w, i]));
  function byCommonness(a, b) {
    return (START_RANK.has(a) ? 0 : 1) - (START_RANK.has(b) ? 0 : 1) || a.localeCompare(b);
  }

  // ---------- Opslag ----------

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* privé-modus */ }
  }
  const store = load();
  store.stats ||= { played: 0, won: 0, streak: 0, maxStreak: 0, lastWon: null, dist: {} };
  store.daily ||= {};

  // ---------- Dagpuzzel ----------

  function dayNumber(date = new Date()) {
    const a = Date.UTC(LAUNCH.getFullYear(), LAUNCH.getMonth(), LAUNCH.getDate());
    const b = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.floor((b - a) / 86400000) + 1;
  }
  const TODAY = dayNumber();
  const dailyStart = STARTS[((TODAY - 1) % STARTS.length + STARTS.length) % STARTS.length];

  // ---------- Spelstatus ----------

  let game; // { mode, num, start, words: [], done, gaveUp, hints }
  let input = '';

  function newGame(mode) {
    if (mode === 'daily') {
      const saved = store.daily[TODAY];
      game = saved && saved.start === dailyStart ? saved
        : { mode, num: TODAY, start: dailyStart, words: [dailyStart], done: false, gaveUp: false, hints: 0 };
      store.daily = { [TODAY]: game };
      save();
    } else {
      const start = STARTS[Math.floor(Math.random() * STARTS.length)];
      game = { mode, start, words: [start], done: false, gaveUp: false, hints: 0 };
    }
    input = '';
    disarmGiveUp();
    game.par = DIST.get(game.start);
    hintPos = -1;
    render();
    if (game.done) setTimeout(showResult, 300);
  }

  const current = () => game.words[game.words.length - 1];
  const steps = () => game.words.length - 1;
  let hintPos = -1;

  // ---------- Invoer ----------

  function type(ch) {
    if (game.done || input.length >= 4) return;
    input += ch;
    renderInput();
  }
  function backspace() {
    if (game.done) return;
    input = input.slice(0, -1);
    renderInput();
  }
  function submit() {
    if (game.done) return;
    if (input.length < 4) return fail('Te weinig letters');
    const prev = current();
    let diff = 0;
    for (let i = 0; i < 4; i++) if (input[i] !== prev[i]) diff++;
    if (diff === 0) return fail('Dat is hetzelfde woord');
    if (diff > 1) return fail('Verander precies één letter');
    if (!WORDS.has(input)) return fail(`${input.toUpperCase()} staat niet in de woordenlijst`);

    game.words.push(input);
    if (game.words.length === 2) track(game.mode === 'daily' ? 'dag-gestart' : 'oefen-gestart', game.mode === 'daily');
    input = '';
    hintPos = -1;
    if (game.words[game.words.length - 1] === TARGET) finish(false);
    persist();
    render();
    if (!game.done && !DIST.has(current())) toast('Hmm, vanaf hier kom je nooit bij POEP. Ga terug!');
  }
  function undo() {
    if (game.done || game.words.length < 2) return;
    game.words.pop();
    input = '';
    hintPos = -1;
    persist();
    render();
  }
  function hint() {
    if (game.done) return;
    const cur = current();
    if (!DIST.has(cur)) return toast('Doodlopend spoor! Gebruik ↩ Terug.');
    const next = bestPath(cur)[1];
    for (let i = 0; i < 4; i++) if (next[i] !== cur[i]) hintPos = i;
    game.hints++;
    track(game.mode === 'daily' ? 'dag-hint' : 'oefen-hint');
    persist();
    toast(`Tip: verander letter ${hintPos + 1} ${game.hints > 1 ? '' : '(de gestreepte)'}`.trim());
    renderInput();
  }
  let giveUpArmed = false, giveUpTimer;
  function giveUp() {
    if (game.done) return;
    const btn = $('btn-giveup');
    if (!giveUpArmed) {
      giveUpArmed = true;
      btn.textContent = 'Zeker? Klik nog eens';
      btn.classList.add('armed');
      clearTimeout(giveUpTimer);
      giveUpTimer = setTimeout(disarmGiveUp, 3000);
      return;
    }
    disarmGiveUp();
    finish(true);
    persist();
    render();
  }

  function finish(gaveUp) {
    game.done = true;
    game.gaveUp = gaveUp;
    if (game.mode === 'daily') {
      const s = store.stats;
      s.played++;
      if (!gaveUp) {
        s.won++;
        s.streak = s.lastWon === TODAY - 1 ? s.streak + 1 : 1;
        s.maxStreak = Math.max(s.maxStreak, s.streak);
        s.lastWon = TODAY;
        const over = Math.min(steps() - game.par, 5);
        s.dist[over] = (s.dist[over] || 0) + 1;
        track('dag-opgelost', true);
        if (over <= 0) track('dag-opgelost-op-par', true);
        if (game.hints) track('dag-opgelost-met-hint', true);
        if ([3, 7, 14, 30, 100].includes(s.streak)) track('reeks-' + s.streak, true);
      } else {
        s.streak = 0;
        track('dag-opgegeven', true);
      }
    } else {
      track(gaveUp ? 'oefen-opgegeven' : 'oefen-opgelost');
    }
    setTimeout(showResult, gaveUp ? 100 : 900);
  }
  function disarmGiveUp() {
    giveUpArmed = false;
    $('btn-giveup').textContent = '🏳 Opgeven';
    $('btn-giveup').classList.remove('armed');
  }
  function persist() {
    if (game.mode === 'daily') { store.daily = { [TODAY]: game }; save(); }
  }

  function fail(msg) {
    toast(msg);
    const row = document.querySelector('.row.input');
    if (row) { row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake'); }
  }

  let toastTimer;
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  // ---------- Weergave ----------

  const $ = id => document.getElementById(id);

  function tileRow(word, cls, prev) {
    const row = document.createElement('div');
    row.className = 'row ' + (cls || '');
    for (let i = 0; i < 4; i++) {
      const t = document.createElement('div');
      t.className = 'tile';
      const ch = word[i] || '';
      t.textContent = ch;
      if (ch && ch === TARGET[i] && cls !== 'target') t.classList.add('hit');
      if (prev && ch !== prev[i]) t.classList.add('changed');
      row.appendChild(t);
    }
    return row;
  }

  function render() {
    $('start-word').textContent = game.start.toUpperCase();
    $('par').textContent = game.par;
    $('daily-num').textContent = '#' + TODAY;
    $('mode-daily').classList.toggle('active', game.mode === 'daily');
    $('mode-practice').classList.toggle('active', game.mode === 'practice');

    const ladder = $('ladder');
    ladder.innerHTML = '';
    game.words.forEach((w, i) => {
      const row = tileRow(w, i === 0 ? 'start' : '', game.words[i - 1]);
      if (i > 0) {
        const s = document.createElement('span');
        s.className = 'step';
        s.textContent = i;
        row.prepend(s);
      }
      if (w === TARGET) row.classList.add('win');
      ladder.appendChild(row);
    });
    if (!game.done) {
      const inputRow = tileRow('', 'input');
      ladder.appendChild(inputRow);
      const dots = document.createElement('div');
      dots.className = 'dots';
      dots.textContent = '⋮';
      ladder.appendChild(dots);
      ladder.appendChild(tileRow(TARGET, 'target'));
    }
    renderInput();
    ladder.scrollTop = ladder.scrollHeight;

    $('btn-undo').disabled = game.done || game.words.length < 2;
    $('btn-hint').disabled = game.done;
    $('btn-giveup').disabled = game.done;
  }

  function renderInput() {
    const row = document.querySelector('.row.input');
    if (!row) return;
    const prev = current();
    [...row.children].forEach((t, i) => {
      const ch = input[i] || '';
      t.textContent = ch;
      t.className = 'tile';
      if (ch) t.classList.add('filled');
      if (ch && ch === TARGET[i]) t.classList.add('hit');
      if (ch && ch !== prev[i]) t.classList.add('changed');
      if (i === input.length) t.classList.add('cursor');
      if (i === hintPos) t.classList.add('hint');
    });
  }

  function buildKeyboard() {
    const rows = ['qwertyuiop', 'asdfghjkl', '+zxcvbnm-'];
    const kb = $('keyboard');
    for (const r of rows) {
      const row = document.createElement('div');
      row.className = 'kb-row';
      for (const k of r) {
        const b = document.createElement('button');
        b.className = 'key';
        if (k === '+') { b.textContent = 'Enter'; b.classList.add('wide'); b.onclick = submit; }
        else if (k === '-') { b.textContent = '⌫'; b.classList.add('wide'); b.onclick = backspace; b.setAttribute('aria-label', 'Wissen'); }
        else {
          b.textContent = k;
          if (TARGET.includes(k)) b.classList.add('target-letter');
          b.onclick = () => type(k);
        }
        row.appendChild(b);
      }
      kb.appendChild(row);
    }
  }

  // ---------- Resultaat & delen ----------

  function verdict() {
    if (game.gaveUp) return ['🪠', 'Verstopt!', 'Je hebt opgegeven. Morgen beter!'];
    const over = steps() - game.par;
    const hints = game.hints ? ` (met ${game.hints} hint${game.hints > 1 ? 's' : ''})` : '';
    const base = `${steps()} stappen, par ${game.par}${hints}`;
    if (over <= 0) return ['🏆', 'Perfecte drol!', base];
    if (over === 1) return ['💩', 'Lekker gedrukt!', base];
    if (over === 2) return ['🧻', 'Het is eruit!', base];
    if (over <= 4) return ['😣', 'Dat was persen…', base];
    return ['🚽', 'Eindelijk verlost', base];
  }

  function showResult() {
    const [emoji, title, sub] = verdict();
    $('result-emoji').textContent = emoji;
    $('result-title').textContent = title;
    $('result-sub').textContent = sub;
    const fill = (el, words) => {
      el.innerHTML = '';
      for (const w of words) {
        const li = document.createElement('li');
        li.textContent = w.toUpperCase();
        if (w === TARGET) li.className = 'p';
        el.appendChild(li);
      }
    };
    fill($('result-yours'), game.gaveUp ? [...game.words, '…'] : game.words);
    fill($('result-best'), bestPath(game.start));
    $('btn-new-practice').textContent = game.mode === 'daily' ? 'Oefenen met een nieuwe puzzel' : 'Nieuwe oefenpuzzel';
    $('share-text').hidden = true;
    updateCountdown();
    $('dlg-result').showModal();
  }

  function shareText() {
    const head = game.mode === 'daily' ? `Poeple #${game.num}` : 'Poeple (oefenen)';
    const lines = game.words.map(w => [...w].map((c, i) => c === TARGET[i] ? '🟫' : '⬜').join(''));
    const score = game.gaveUp ? 'X' : `${steps()}/${game.par}`;
    const hints = game.hints ? ` 💡${game.hints}` : '';
    const tail = game.gaveUp ? '🪠' : (steps() <= game.par ? '💩🏆' : '💩');
    return `${head} ${score}${hints}\n${game.start.toUpperCase()} → POEP\n${lines.join('\n')}\n${tail}\n${SITE_URL}?ref=deel`;
  }

  function share() {
    const text = shareText();
    track(game.mode === 'daily' ? 'dag-gedeeld' : 'oefen-gedeeld', game.mode === 'daily');
    const box = $('share-text');
    const fallback = () => {
      box.value = text;
      box.hidden = false;
      box.focus();
      box.select();
      toast('Kopieer de tekst hieronder');
    };
    try {
      navigator.clipboard.writeText(text).then(() => toast('Gekopieerd naar klembord!'), fallback);
    } catch {
      fallback();
    }
  }

  let countdownTimer;
  function updateCountdown() {
    clearInterval(countdownTimer);
    const el = $('next-puzzle');
    if (game.mode !== 'daily') { el.textContent = ''; return; }
    const tick = () => {
      const now = new Date();
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const s = Math.max(0, Math.floor((next - now) / 1000));
      const pad = n => String(n).padStart(2, '0');
      el.textContent = `Volgende Poeple over ${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`;
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  function showStats() {
    const s = store.stats;
    $('st-played').textContent = s.played;
    $('st-win').textContent = s.played ? Math.round(100 * s.won / s.played) : 0;
    $('st-streak').textContent = s.lastWon >= TODAY - 1 ? s.streak : 0;
    $('st-max').textContent = s.maxStreak;
    const dist = $('st-dist');
    dist.innerHTML = '';
    const max = Math.max(1, ...Object.values(s.dist));
    const cur = store.daily[TODAY]?.done && !store.daily[TODAY].gaveUp
      ? Math.min(store.daily[TODAY].words.length - 1 - DIST.get(store.daily[TODAY].start), 5) : null;
    for (let i = 0; i <= 5; i++) {
      const n = s.dist[i] || 0;
      const row = document.createElement('div');
      row.className = 'dist-row';
      row.innerHTML = `<span class="lbl">${i === 0 ? 'par' : i === 5 ? '+5…' : '+' + i}</span>`;
      const bar = document.createElement('span');
      bar.className = 'bar' + (i === cur ? ' cur' : '');
      bar.style.width = `${8 + 80 * n / max}%`;
      bar.textContent = n;
      row.appendChild(bar);
      dist.appendChild(row);
    }
    $('dlg-stats').showModal();
  }

  // ---------- Events ----------

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    const k = e.key.toLowerCase();
    if (k === 'enter') { e.preventDefault(); submit(); }
    else if (k === 'backspace') backspace();
    else if (k === 'escape') { input = ''; renderInput(); }
    else if (/^[a-z]$/.test(k)) type(k);
  });

  document.querySelectorAll('dialog').forEach(d => {
    d.addEventListener('click', e => {
      if (e.target === d || e.target.hasAttribute('data-close')) d.close();
    });
  });

  $('btn-help').onclick = () => $('dlg-help').showModal();
  $('btn-stats').onclick = showStats;
  $('btn-undo').onclick = undo;
  $('btn-hint').onclick = hint;
  $('btn-giveup').onclick = giveUp;
  $('btn-share').onclick = share;
  $('btn-new-practice').onclick = () => { $('dlg-result').close(); newGame('practice'); };
  $('mode-daily').onclick = () => newGame('daily');
  $('mode-practice').onclick = () => newGame('practice');

  buildKeyboard();
  newGame('daily');
  if (!store.seenHelp) { store.seenHelp = true; save(); $('dlg-help').showModal(); }

  // Voor tests / debuggen
  window.poeple = { DIST, bestPath, shareText: () => shareText(), get game() { return game; } };
})();
