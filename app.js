(() => {
'use strict';

const KEY = 'catracho-en-progreso.v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 10);
const rand = a => a[Math.floor(Math.random() * a.length)];

const TOPICS = {
  saludos: 'Saludos y cortesía', familia: 'Familia y hogar', comida: 'Comida y bebida',
  numeros: 'Números, tiempo y dinero', cosas: 'Cosas y animales',
  cuerpo: 'Cuerpo y salud', lugares: 'Lugares y transporte', verbos: 'Verbos', adjetivos: 'Descripciones', conversacion: 'Frases de conversación', misional: 'Frases misionales', honduras: 'Vocabulario hondureño',
};
const topicName = t => TOPICS[t] || t || 'Sin tema';

// Intervalos de repetición espaciada por caja (ms)
const MIN = 60e3, DAY = 864e5;
const INTERVALS = [0, 10 * MIN, 1 * DAY, 3 * DAY, 7 * DAY, 21 * DAY];

/* ---------- Datos ---------- */
const mkWord = (es, en, topic, ex = '', regional = false, by = '') =>
  ({ id: uid(), es, en, topic, ex, regional: !!regional, by, box: 0, due: 0, seen: 0, ok: 0, bad: 0 });

function seed() {
  return {
    v: 3,
    words: [
      ...SEED_WORDS.map(w => mkWord(w[0], w[1], w[2], w[3], w[4], 'inicial')),
      ...SEED_EXTRA.map(w => mkWord(w[0], w[1], w[2], w[3], false, 'inicial')),
      ...SEED_MORE.map(w => mkWord(w[0], w[1], w[2], w[3], false, 'inicial')),
    ].filter((w, i, a) => a.findIndex(x => norm(x.es) === norm(w.es)) === i),
    surprise: SEED_SURPRISE.map(s => ({ id: uid(), es: s[0], en: s[1], ex: s[2], note: s[3] })),
    settings: { user: 'Misionero', dir: 'mix', slang: true, tol: 0.75, surpriseEvery: 5, lives: 5, lifeEvery: 150, esLang: 'es-HN', speak: true },
    stats: { sessions: [] },
  };
}
function load() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY));
    if (r && r.words) {
      const d = seed(), db2 = { ...d, ...r, settings: { ...d.settings, ...r.settings } };
      if (!r.v || r.v < 3) migrate(db2, d, r.v || 0);
      return db2;
    }
  } catch (e) { /* datos dañados: se parte de cero */ }
  return seed();
}
// v2: imágenes, tema "cosas", menos platos hondureños
function migrate(cur, fresh, oldV) {
  cur.words = cur.words.filter(w => norm(w.es) !== 'hijo'); // suena igual que "son" en inglés
  const have = new Map(cur.words.map(w => [norm(w.es), w]));
  for (const w of fresh.words) {
    const old = have.get(norm(w.es));
    if (!old) cur.words.push(w);
  }
  const gone = ['tajadas', 'yuca con chicharron', 'sopa de caracol'];
  cur.surprise = cur.surprise.filter(s => !gone.includes(norm(s.es)));
  const hs = new Set(cur.surprise.map(s => norm(s.es)));
  fresh.surprise.forEach(s => { if (!hs.has(norm(s.es))) cur.surprise.push(s); });
  if (oldV < 2) cur.settings.dir = 'mix';
  cur.v = 3;
}
let db = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* sin almacenamiento */ } };

const isHard = w => w.bad > 0 && w.box <= 1;
const isMastered = w => w.box >= 4;

/* ---------- Texto y coincidencia aproximada ---------- */
function norm(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:()"“”]/g, ' ').replace(/\s+/g, ' ').trim()
    // números: "cinco" / "five" y "5" se comparan igual
    .split(' ').map(t => numMap()[t] ?? t).join(' ')
    .replace(/\b1 100\b/g, '100')
    .replace(/\b([2-9]0)(?: y)? ([1-9])\b/g, (_, a, b) => String(+a + +b));
}
function numMap() {
  if (numMap.m) return numMap.m;
  const m = {};
  const en = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' ');
  const es = 'cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciseis diecisiete dieciocho diecinueve veinte'.split(' ');
  en.forEach((w, i) => { m[w] = String(i); }); es.forEach((w, i) => { m[w] = String(i); });
  'thirty forty fifty sixty seventy eighty ninety'.split(' ').forEach((w, i) => { m[w] = String((i + 3) * 10); });
  'treinta cuarenta cincuenta sesenta setenta ochenta noventa'.split(' ').forEach((w, i) => { m[w] = String((i + 3) * 10); });
  'uno dos tres cuatro cinco seis siete ocho nueve'.split(' ').forEach((w, i) => { m['veinti' + w] = String(21 + i); });
  Object.assign(m, { hundred: '100', cien: '100', ciento: '100', thousand: '1000', mil: '1000' });
  return (numMap.m = m);
}

function lev(a, b) {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++)
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
// Variantes aceptadas de una respuesta: separadas por "/" o ";", con y sin artículo.
function variants(raw) {
  const out = new Set();
  for (const part of String(raw).replace(/\([^)]*\)/g, '').split(/[\/;,]| or /)) {
    const v = norm(part); if (!v) continue;
    out.add(v);
    out.add(v.replace(/^(the|a|an|to|el|la|los|las|un|una) /, ''));
  }
  return [...out];
}
function score(ans, t) {
  if (!t) return 0;
  if ((' ' + t + ' ').includes(' ' + ans + ' ')) return 1;
  const toks = t.split(' '), aw = ans.split(' ').length;
  let best = 0;
  for (let size = Math.max(1, aw - 1); size <= aw + 1; size++)
    for (let i = 0; i + size <= toks.length; i++) {
      const s = toks.slice(i, i + size).join(' ');
      best = Math.max(best, 1 - lev(ans, s) / Math.max(ans.length, s.length));
    }
  // Respuestas largas: basta con decir la mitad de las palabras importantes
  const key = ans.split(' ').filter(w => w.length > 2 && !STOP.has(w));
  if (aw >= 3 && key.length >= 2) {
    const got = key.filter(k => toks.some(tk => 1 - lev(k, tk) / Math.max(k.length, tk.length) >= 0.75)).length;
    if (got >= Math.max(2, Math.ceil(key.length / 2))) best = 1;
  }
  return best;
}
const STOP = new Set('the and with for you your from that this una con los las por que del como para'.split(' '));

/* ---------- Voz ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null, recRunning = false, micWanted = false, micLang = 'en-US', onSpeech = null;

function micStart() {
  if (!SR || !micWanted || recRunning) return;
  rec = new SR();
  rec.lang = micLang; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 3;
  rec.onresult = e => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      const alts = [...r].map(a => a.transcript);
      if (onSpeech) onSpeech(alts, r.isFinal);
    }
  };
  rec.onerror = e => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      micWanted = false; setMicDot(false);
      setHeard('Micrófono bloqueado. Permítalo en el navegador o escriba la respuesta.');
    }
  };
  rec.onend = () => { recRunning = false; if (micWanted) setTimeout(micStart, 150); };
  try { rec.start(); recRunning = true; setMicDot(true); } catch (e) { recRunning = false; }
}
function micStop() { micWanted = false; setMicDot(false); if (rec && recRunning) rec.abort(); }
function micOn(lang) { micWanted = true; micLang = lang || micLang; micStart(); }
function micSetLang(l) { if (l === micLang) return; micLang = l; if (recRunning) rec.abort(); }
function micFlush() { if (recRunning) rec.abort(); } // descarta lo ya procesado
const setMicDot = on => $('#mic-dot').classList.toggle('on', on);
const setHeard = t => { $('#heard').textContent = t; $('#heard-home').textContent = t; };

function speak(text, lang) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang || 'es-MX'; u.rate = 0.9;
  const v = speechSynthesis.getVoices().find(v => v.lang.replace('_', '-').startsWith(u.lang.slice(0, 2)));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

/* ---------- Navegación ---------- */
function show(view) {
  $$('.view').forEach(v => v.hidden = v.id !== 'view-' + view);
  $$('nav button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  if (view === 'home') renderHome();
  if (view === 'portal') renderPortal();
  if (view === 'settings') renderSettings();
}
$$('nav button').forEach(b => b.onclick = () => {
  if (G) { if (!confirm('¿Terminar la ronda actual?')) return; endGame(true); }
  show(b.dataset.view);
});

/* ---------- Inicio ---------- */
function topicOptions(sel, withAll, allLabel) {
  const topics = [...new Set([...Object.keys(TOPICS), ...db.words.map(w => w.topic).filter(Boolean)])];
  sel.innerHTML = (withAll ? `<option value="">${allLabel}</option>` : '') +
    topics.map(t => `<option value="${esc(t)}">${esc(topicName(t))}</option>`).join('');
}
const statBox = (n, label) => `<div class="stat"><b>${n}</b>${label}</div>`;

function renderHome() {
  topicOptions($('#h-topic'), true, 'Todos los temas');
  $('#h-dir').value = db.settings.dir; $('#h-slang').checked = db.settings.slang;
  $('#mic-note').textContent = SR
    ? 'Se recomienda Chrome. Al empezar, el navegador le pedirá permiso para usar el micrófono.'
    : '⚠ Este navegador no tiene reconocimiento de voz. Use Chrome, o juegue escribiendo las respuestas.';
  const W = db.words, today = new Date().toDateString();
  const secs = db.stats.sessions.filter(s => new Date(s.date).toDateString() === today).reduce((a, s) => a + s.seconds, 0);
  $('#home-stats').innerHTML =
    statBox(W.length, 'palabras') + statBox(W.filter(isMastered).length, 'dominadas') +
    statBox(W.filter(isHard).length, 'difíciles') + statBox(Math.round(secs / 60) + ' min', 'practicados hoy');
  const topics = [...new Set(W.map(w => w.topic))];
  $('#topic-bars').innerHTML = topics.map(t => {
    const ws = W.filter(w => w.topic === t), m = ws.filter(isMastered).length, pct = Math.round(100 * m / ws.length);
    return `<div class="bar"><span class="name">${esc(topicName(t))}</span><div class="track"><div class="fill" style="width:${pct}%"></div></div><span>${m}/${ws.length}</span></div>`;
  }).join('');
}
$('#btn-mictest').onclick = () => {
  if (!SR) return setHeard('Este navegador no tiene reconocimiento de voz.');
  if (micWanted) { micStop(); setHeard(''); return; }
  onSpeech = alts => setHeard('Escuché: ' + alts[0]);
  setHeard('Hable ahora…');
  micOn($('#h-dir').value === 'en-es' ? db.settings.esLang : 'en-US');
};

/* ---------- Selección de palabras (repetición espaciada) ---------- */
function weight(w) {
  const due = w.due <= Date.now();
  let x = due ? 3 : 0.3;
  if (w.seen === 0) x = 2.5;
  if (w.bad > w.ok) x += 2;
  return x;
}
function pickWord() {
  const used = new Set([...G.items.map(i => i.base.id), ...G.recent]);
  let pool = db.words.filter(w => (!G.topic || w.topic === G.topic) && (G.slang || !w.regional) && !used.has(w.id));
  const fresh = pool.filter(w => !G.cool.has(w.id) && (w.seen === 0 || w.due <= Date.now()));
  if (fresh.length >= 6) pool = fresh; // palabras acertadas descansan un buen rato
  else { const rested = pool.filter(w => !G.cool.has(w.id)); if (rested.length >= 4) pool = rested; }
  if (!pool.length) return null;
  let r = Math.random() * pool.reduce((a, w) => a + weight(w), 0);
  for (const w of pool) { r -= weight(w); if (r <= 0) return w; }
  return pool[pool.length - 1];
}
const surpriseAvail = () => db.surprise.filter(s => !db.words.some(w => norm(w.es) === norm(s.es)));

function srsUpdate(w, ok) {
  w.seen++;
  if (ok) { w.ok++; w.box = Math.min(5, w.box + 1); } else { w.bad++; w.box = Math.max(0, w.box - 2); }
  w.due = Date.now() + INTERVALS[w.box];
  save();
}

/* ---------- Juego ---------- */
let G = null;
const ITEM_H = 64;

$('#btn-start').onclick = () => {
  const topic = $('#h-topic').value;
  const pool = db.words.filter(w => (!topic || w.topic === topic) && (db.settings.slang || !w.regional));
  if (pool.length < 4) return alert('Se necesitan al menos 4 palabras en ese tema.');
  db.settings.dir = $('#h-dir').value; db.settings.slang = $('#h-slang').checked; save();
  G = {
    dir: db.settings.dir, topic, lives: db.settings.lives, score: 0, streak: 0, correct: 0, wrong: 0,
    items: [], retry: [], recent: [], lvl: 1, nextLife: db.settings.lifeEvery, cool: new Map(), slang: db.settings.slang, paused: false, last: performance.now(), spawnT: 0, play: 0,
    newWords: new Set(), missed: new Map(), surpriseHit: [], surpriseMiss: [],
  };
  micStop(); onSpeech = handleSpeech; setHeard('Diga la traducción en voz alta…');
  show('game'); setScene(1); updateHud(); $('#arena').querySelectorAll('.fall').forEach(e => e.remove());
  if (SR) micOn(G.dir === 'en-es' ? db.settings.esLang : 'en-US');
  requestAnimationFrame(t => { G.last = t; frame(t); });
};

const level = () => 1 + Math.floor(G.correct / 5);
const fallSeconds = () => Math.max(5, 14 - 0.8 * (level() - 1));
const maxActive = () => Math.min(2 + Math.floor((level() - 1) / 3), 4);

function setScene(n) {
  const sc = SCENES[(n - 1) % SCENES.length], ar = $('#arena'), box = $('#scenery');
  ar.style.background = sc.sky;
  box.innerHTML = `<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMax slice" width="100%" height="100%">${sc.svg}</svg>`;
  box.classList.remove('fadein'); void box.offsetWidth; box.classList.add('fadein');
}

function updateHud() {
  $('#g-score').textContent = G.score;
  $('#g-lives').textContent = '❤️'.repeat(Math.max(0, G.lives));
  $('#g-streak').textContent = G.streak;
  $('#g-level').textContent = level();
  const ev = db.settings.lifeEvery;
  $('#g-lifebar').style.width = Math.max(0, Math.min(100, 100 * (G.score - (G.nextLife - ev)) / ev)) + '%';
}

function nextEntry() {
  G.retry.forEach(r => r.in--);
  for (const [id, n] of G.cool) { if (n <= 1) G.cool.delete(id); else G.cool.set(id, n - 1); }
  const ri = G.retry.findIndex(r => r.in <= 0 && !G.items.some(i => i.base.id === r.word.id));
  if (ri >= 0) return { word: G.retry.splice(ri, 1)[0].word };
  const bank = G.slang ? surpriseAvail() : [];
  if (bank.length && !G.items.some(i => i.surprise) && Math.random() < 1 / db.settings.surpriseEvery)
    return { surprise: rand(bank) };
  const w = pickWord();
  return w ? { word: w } : null;
}

function spawn() {
  const entry = nextEntry(); if (!entry) return;
  const base = entry.word || entry.surprise;
  let dir = G.dir === 'mix' ? rand(['es-en', 'en-es']) : G.dir;
  if (entry.surprise) dir = 'es-en';
  const prompt = dir === 'es-en' ? base.es : base.en.split('/')[0].trim();
  const clickable = true; // cualquier palabra se puede tocar para ver la traducción
  const el = document.createElement('div');
  el.className = 'fall' + (entry.surprise ? ' surprise' : '') + (dir === 'en-es' ? ' en' : '') + ' clickable' + (entry.surprise || base.regional ? ' hon' : '');
  el.textContent = (entry.surprise ? '⭐ ' : '') + prompt;
  const lanes = [4, 22, 40, 58, 74].filter(l => !G.items.some(i => i.lane === l && i.y < 90));
  const lane = rand(lanes.length ? lanes : [4, 22, 40, 58, 74]);
  $('#arena').appendChild(el);
  G.items.push({
    base, surprise: !!entry.surprise, dir, prompt, el, lane, y: -ITEM_H, x: -1,
    answers: variants(dir === 'es-en' ? base.en : base.es),
    lang: dir === 'es-en' ? 'en-US' : db.settings.esLang, hinted: false,
    slow: Math.max(0.45, 1 - (Math.max(prompt.length, (dir === 'es-en' ? base.en : base.es).length) - 9) * 0.025),
  });
  if (clickable) {
    const it = G.items[G.items.length - 1];
    el.title = 'Clic para ver la traducción';
    el.onclick = () => {
      it.hinted = true; el.classList.add('hinted');
      const ans = dir === 'es-en' ? base.en : base.es;
      el.textContent = `${entry.surprise ? '⭐ ' : ''}${prompt} = ${ans}`;
      place(it);
    };
  }
  place(G.items[G.items.length - 1]);
  if (entry.word) { G.recent.push(base.id); if (G.recent.length > 5) G.recent.shift(); }
  syncMicLang();
}
// Mantiene la palabra dentro del área visible (la carril es un punto de partida, no un límite)
function place(it) {
  const W = $('#arena').clientWidth, w = it.el.offsetWidth;
  const x = Math.max(4, Math.min(W * it.lane / 100, W - w - 4));
  if (Math.abs(x - it.x) > 0.5) { it.x = x; it.el.style.left = x + 'px'; }
}
function syncMicLang() {
  if (!G.items.length || !micWanted) return;
  micSetLang(G.items.reduce((a, b) => (b.y > a.y ? b : a)).lang);
}

function frame(t) {
  if (!G || G.paused) return;
  const dt = Math.min(0.05, (t - G.last) / 1000); G.last = t;
  G.play += dt; G.spawnT -= dt;
  const H = $('#arena').clientHeight, dist = H - ITEM_H - 16, speed = dist / fallSeconds();
  if (G.items.length < maxActive() && (G.spawnT <= 0 || !G.items.length)) {
    spawn(); G.spawnT = Math.max(1.6, 4.2 - 0.25 * level());
  }
  for (const it of [...G.items]) {
    it.y += speed * it.slow * dt;
    place(it);
    it.el.style.transform = `translateY(${it.y}px)`;
    if (it.y >= dist) miss(it);
    if (!G) return;
  }
  G.raf = requestAnimationFrame(frame);
}

function removeItem(it, cls) {
  G.items = G.items.filter(i => i !== it);
  it.el.classList.add(cls);
  setTimeout(() => it.el.remove(), 500);
  syncMicLang();
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), msg.includes('Nivel') ? 3000 : 1200);
}
function reveal(it) {
  const r = $('#reveal');
  r.textContent = `${it.base.es} = ${it.base.en}`; r.classList.add('show');
  clearTimeout(reveal.t); reveal.t = setTimeout(() => r.classList.remove('show'), 2800);
}

function burst(it, good) {
  const a = $('#arena'), x = it.el.offsetLeft + it.el.offsetWidth / 2, y = it.y + ITEM_H / 2;
  for (let i = 0; i < 14; i++) {
    const sp = document.createElement('span'), ang = Math.random() * 6.283, r = 50 + Math.random() * 90;
    sp.className = 'spark'; sp.textContent = rand(good ? ['✨', '⭐', '🎉', '💥', '✨'] : ['💧', '💥']);
    sp.style.left = x + 'px'; sp.style.top = y + 'px';
    sp.style.setProperty('--dx', Math.cos(ang) * r + 'px'); sp.style.setProperty('--dy', Math.sin(ang) * r + 'px');
    a.appendChild(sp); setTimeout(() => sp.remove(), 900);
  }
}

function hit(it) {
  burst(it, true);
  removeItem(it, 'boom');
  G.correct++; G.streak++;
  const bonus = it.hinted ? 0 : Math.min(G.streak, 10) + (it.surprise ? 20 : 0);
  const pts = it.hinted ? 5 : 10 + bonus;
  G.score += pts;
  let msg = it.surprise && !it.hinted ? `⭐ ¡Palabra sorpresa! +${pts}` : `+${pts}`;
  while (G.score >= G.nextLife) {
    G.nextLife += db.settings.lifeEvery;
    if (G.lives < 9) { G.lives++; msg += '  ❤️ ¡Vida extra!'; }
  }
  if (level() !== G.lvl) {
    G.lvl = level(); setScene(G.lvl);
    msg += `  ·  Nivel ${G.lvl}: ${SCENES[(G.lvl - 1) % SCENES.length].name}`;
  }
  toast(msg);
  if (it.surprise) G.surpriseHit.push(it.base);
  else {
    if (it.base.seen === 0) G.newWords.add(it.base.id);
    if (!it.hinted) { srsUpdate(it.base, true); G.cool.set(it.base.id, it.base.box >= 2 ? 9999 : 25); } // 2-3 aciertos: al fondo de la fila
  }
  updateHud(); micFlush();
}

function miss(it) {
  burst(it, false);
  const ar = $('#arena'); ar.classList.remove('shake'); void ar.offsetWidth; ar.classList.add('shake');
  removeItem(it, 'splat');
  G.lives--; G.streak = 0; G.wrong++;
  updateHud();
  if (it.surprise) {
    G.surpriseMiss.push(it.base);
    if (db.settings.speak) speak(it.base.es);
    return surpriseCard(it.base);
  }
  if (it.base.seen === 0) G.newWords.add(it.base.id);
  srsUpdate(it.base, false);
  G.missed.set(it.base.id, it.base);
  G.retry.push({ word: it.base, in: 3 });
  reveal(it);
  if (db.settings.speak) speak(it.base.es);
  if (G.lives <= 0) endGame();
}

function handleSpeech(alts, final) {
  const heard = alts[0];
  setHeard('Escuché: ' + heard);
  if (!G || G.locked) return; // en pausa sí se puede hablar
  const tol = db.settings.tol;
  let best = null;
  for (const it of G.items)
    for (const a of alts) {
      const t = norm(a);
      const sc = Math.max(...it.answers.map(v => score(v, t)));
      if ((final ? sc >= tol : sc >= 1) && (!best || it.y > best.y)) best = it;
    }
  if (best) hit(best);
}
$('#type-form').onsubmit = e => {
  e.preventDefault();
  const v = $('#type-input').value; $('#type-input').value = '';
  if (v.trim()) handleSpeech([v], true);
};

function pauseGame(p) {
  if (!G) return;
  G.paused = p;
  $('#btn-pause').textContent = p ? '▶ Seguir' : '⏸ Pausa';
  if (!p) { G.last = performance.now(); cancelAnimationFrame(G.raf); G.raf = requestAnimationFrame(frame); }
}
$('#btn-pause').onclick = () => pauseGame(!G.paused);
$('#btn-end').onclick = () => endGame();
document.addEventListener('visibilitychange', () => { if (document.hidden && G && !G.paused) pauseGame(true); });

/* ---------- Ventanas ---------- */
function modal(html) { $('#modal').innerHTML = html; $('#overlay').hidden = false; }
const closeModal = () => { $('#overlay').hidden = true; };

function surpriseCard(s) {
  G.locked = true; pauseGame(true);
  modal(`<h2>⭐ ${esc(s.es)}</h2><p><b>${esc(s.en)}</b></p>
    ${s.ex ? `<p><i>${esc(s.ex)}</i></p>` : ''}${s.note ? `<p class="muted">${esc(s.note)}</p>` : ''}
    <p>¿Quiere agregarla a su lista?</p>
    <div class="btns"><button id="m-no">No, gracias</button><button id="m-yes" class="primary">Agregar a mi lista</button></div>`);
  const done = () => { closeModal(); G.locked = false; if (G.lives <= 0) endGame(); else pauseGame(false); };
  $('#m-yes').onclick = () => { addToList(s); done(); };
  $('#m-no').onclick = done;
}
function addToList(s) {
  if (db.words.some(w => norm(w.es) === norm(s.es))) return;
  db.words.push(mkWord(s.es, s.en, 'honduras', s.ex, true, db.settings.user)); save();
}

function endGame(silent) {
  if (!G) return;
  const g = G; G = null;
  micStop(); onSpeech = null;
  $$('#arena .fall').forEach(e => e.remove());
  if (g.play > 5) { db.stats.sessions.push({ date: Date.now(), seconds: Math.round(g.play), score: g.score }); save(); }
  if (silent) return;
  const hard = [...g.missed.values()];
  modal(`<h2>Resumen de la ronda</h2>
    <div class="stats">${statBox(g.score, 'puntos')}${statBox(g.correct, 'aciertos')}${statBox(g.wrong, 'fallos')}${statBox(Math.round(g.play / 60 * 10) / 10 + ' min', 'tiempo')}</div>
    <h3>Palabras nuevas vistas (${g.newWords.size})</h3>
    <h3>Palabras difíciles (${hard.length})</h3>
    <p>${hard.map(w => `${esc(w.es)} = ${esc(w.en)}`).join('<br>') || '—'}</p>
    <h3>Palabras sorpresa</h3>
    <p>Acertadas: ${g.surpriseHit.map(s => esc(s.es)).join(', ') || '—'}<br>Falladas: ${g.surpriseMiss.map(s => esc(s.es)).join(', ') || '—'}</p>
    <div class="btns"><button id="m-ok" class="primary">Volver al inicio</button></div>`);
  $('#m-ok').onclick = () => { closeModal(); show('home'); };
}

/* ---------- Portal ---------- */
let kind = 'words', editId = null;
const list = () => db[kind];

$$('.tabs button').forEach(b => b.onclick = () => { kind = b.dataset.kind; editId = null; renderPortal(); });

function renderPortal() {
  $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.kind === kind));
  const isW = kind === 'words';
  $('#f-topic').hidden = !isW; $('#f-reg').parentElement.hidden = !isW;
  topicOptions($('#q-topic'), true, 'Todos los temas'); $('#q-topic').hidden = !isW; $('#q-filter').hidden = !isW;
  $('#topic-list').innerHTML = [...new Set([...Object.keys(TOPICS), ...db.words.map(w => w.topic)])]
    .map(t => `<option value="${esc(t)}">${esc(topicName(t))}</option>`).join('');
  const W = db.words;
  $('#portal-stats').innerHTML = isW
    ? statBox(W.length, 'palabras') + statBox(W.filter(isMastered).length, 'dominadas') + statBox(W.filter(isHard).length, 'difíciles') + statBox(W.filter(w => w.regional).length, 'hondureñas')
    : statBox(db.surprise.length, 'en el banco') + statBox(surpriseAvail().length, 'aún no en su lista');
  renderTable();
}

function renderTable() {
  const q = norm($('#q').value), tp = $('#q-topic').value, f = $('#q-filter').value;
  let rows = list().filter(w => !q || norm(w.es + ' ' + w.en).includes(q));
  if (kind === 'words') {
    if (tp) rows = rows.filter(w => w.topic === tp);
    if (f === 'hard') rows = rows.filter(isHard);
    if (f === 'mastered') rows = rows.filter(isMastered);
    if (f === 'regional') rows = rows.filter(w => w.regional);
  }
  $('#count').textContent = rows.length + ' mostradas';
  const head = kind === 'words' ? '<th>Español</th><th>Inglés</th><th>Tema</th><th>Estado</th><th></th>' : '<th>Español</th><th>Inglés</th><th>Ejemplo</th><th></th>';
  $('#tbl').innerHTML = `<tr>${head}</tr>` + rows.map(w => {
    const acts = `<td><button data-a="say" data-id="${w.id}">🔊</button> <button data-a="edit" data-id="${w.id}">✏️</button> <button data-a="del" data-id="${w.id}">🗑</button></td>`;
    if (kind === 'surprise') return `<tr><td>${esc(w.es)}</td><td>${esc(w.en)}</td><td>${esc(w.ex)}</td>${acts}</tr>`;
    const tags = (w.regional ? '<span class="tag">hondureña</span>' : '') + (isHard(w) ? '<span class="tag hard">difícil</span>' : '') + (isMastered(w) ? '<span class="tag ok">dominada</span>' : '');
    return `<tr><td>${esc(w.es)}</td><td>${esc(w.en)}</td><td>${esc(topicName(w.topic))}</td><td>${tags}<span class="muted">${w.ok}✓ ${w.bad}✗</span></td>${acts}</tr>`;
  }).join('');
}
['#q', '#q-topic', '#q-filter'].forEach(s => $(s).oninput = renderTable);

$('#tbl').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  const w = list().find(x => x.id === b.dataset.id); if (!w) return;
  if (b.dataset.a === 'say') speak(w.es);
  if (b.dataset.a === 'del' && confirm(`¿Eliminar "${w.es}"?`)) { db[kind] = list().filter(x => x !== w); save(); renderPortal(); }
  if (b.dataset.a === 'edit') {
    editId = w.id;
    $('#f-es').value = w.es; $('#f-en').value = w.en; $('#f-ex').value = w.ex || '';
    $('#f-topic').value = w.topic || ''; $('#f-reg').checked = !!w.regional;
    $('#f-save').textContent = 'Guardar'; $('#f-cancel').hidden = false; $('#f-es').focus();
  }
};
function resetForm() {
  editId = null; $('#word-form').reset(); $('#f-save').textContent = 'Agregar'; $('#f-cancel').hidden = true;
}
$('#f-cancel').onclick = resetForm;
$('#word-form').onsubmit = e => {
  e.preventDefault();
  const es = $('#f-es').value.trim(), en = $('#f-en').value.trim(), ex = $('#f-ex').value.trim();
  const topic = $('#f-topic').value.trim() || 'honduras', regional = $('#f-reg').checked;
  if (!es || !en) return;
  if (editId) {
    Object.assign(list().find(x => x.id === editId), kind === 'words' ? { es, en, ex, topic, regional } : { es, en, ex });
  } else if (kind === 'words') {
    if (db.words.some(w => norm(w.es) === norm(es) && norm(w.en) === norm(en))) return alert('Esa palabra ya está en la lista.');
    db.words.push(mkWord(es, en, topic, ex, regional, db.settings.user));
  } else db.surprise.push({ id: uid(), es, en, ex, note: '' });
  save(); resetForm(); renderPortal();
};

/* ---------- Ajustes ---------- */
function renderSettings() {
  const s = db.settings;
  $('#s-user').value = s.user; $('#s-tol').value = Math.round(s.tol * 100); $('#s-tol-v').textContent = Math.round(s.tol * 100) + '%';
  $('#s-sur').value = s.surpriseEvery; $('#s-lives').value = s.lives; $('#s-life').value = s.lifeEvery; $('#s-es').value = s.esLang; $('#s-speak').checked = s.speak;
}
$('#view-settings').oninput = () => {
  const s = db.settings;
  s.user = $('#s-user').value.trim() || 'Misionero';
  s.tol = (+$('#s-tol').value) / 100; $('#s-tol-v').textContent = Math.round(s.tol * 100) + '%';
  s.surpriseEvery = Math.max(2, +$('#s-sur').value || 5); s.lives = Math.max(1, +$('#s-lives').value || 5); s.lifeEvery = Math.max(20, +$('#s-life').value || 150);
  s.esLang = $('#s-es').value; s.speak = $('#s-speak').checked; save();
};

$('#btn-export').onclick = () => {
  const blob = new Blob([JSON.stringify({ app: 'catracho', words: db.words, surprise: db.surprise }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `catracho-palabras-${new Date().toISOString().slice(0, 10)}.json`; a.click();
};
let importMode = 'merge';
$('#btn-import-merge').onclick = () => { importMode = 'merge'; $('#file-import').click(); };
$('#btn-import-replace').onclick = () => { importMode = 'replace'; $('#file-import').click(); };
$('#file-import').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const d = JSON.parse(await f.text());
    if (!Array.isArray(d.words)) throw new Error('formato');
    if (importMode === 'replace') {
      if (!confirm('Esto reemplaza toda su lista y progreso. ¿Continuar?')) return;
      db.words = d.words; db.surprise = d.surprise || [];
      alert('Lista reemplazada.');
    } else {
      const key = w => norm(w.es) + '|' + norm(w.en);
      const have = new Set(db.words.map(key)); let n = 0;
      for (const w of d.words) if (w.es && w.en && !have.has(key(w))) { db.words.push({ ...mkWord(w.es, w.en, w.topic, w.ex, w.regional, w.by), id: uid() }); n++; }
      const hs = new Set(db.surprise.map(key));
      for (const s of d.surprise || []) if (s.es && !hs.has(key(s))) db.surprise.push({ ...s, id: uid() });
      alert(`${n} palabras nuevas agregadas.`);
    }
    save();
  } catch (err) { alert('Ese archivo no es una lista válida.'); }
};
$('#btn-reset-progress').onclick = () => {
  if (!confirm('¿Reiniciar el progreso de todas las palabras?')) return;
  db.words.forEach(w => Object.assign(w, { box: 0, due: 0, seen: 0, ok: 0, bad: 0 })); db.stats.sessions = []; save();
};
$('#btn-reset-all').onclick = () => {
  if (!confirm('Se borrará todo y volverá el vocabulario inicial. ¿Continuar?')) return;
  const keep = db.settings; db = seed(); db.settings = { ...db.settings, ...keep }; save();
};

show('home');
})();
