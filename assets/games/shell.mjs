// The frame every character game shares: the character's pixel world, a paper HUD, a dialogue
// box, a pause menu, and a results screen that leads with the real project.
import {paintScene, particles} from './scenes.mjs?v=3';
import {GAMES, EVIDENCE, EMAIL} from './index.mjs?v=3';
import {recordStars, summary, starText} from './progress.mjs?v=3';
import {soundOn, setSound, onSoundChange, unlock, play as playSound} from './sound.mjs?v=3';

const STEP = 1 / 60;
const html = (strings, ...values) => strings.reduce((out, s, i) => out + s + (i < values.length ? values[i] : ''), '');
export const escape = s => String(s).replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]));

const SPEAKER = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6h3l4-3v10L5 10H2z"/><path class="arcade-sound-on" d="M11 5.5c1 .7 1.5 1.5 1.5 2.5s-.5 1.8-1.5 2.5M12.5 3.5c1.6 1.2 2.5 2.7 2.5 4.5s-.9 3.3-2.5 4.5"/><path class="arcade-sound-off" d="M11 6l4 4M15 6l-4 4"/></svg>';
const CALLOUT_SOUND = {good: 'good', win: 'good', bad: 'bad', big: 'big', '': 'tick'};

// `boss` names the character a game is up against. Games without one pass null and the HUD
// shows the game's own name instead.
export function createShell(root, {key, characters, boss = null, meterLabel, onExit, scene = 'both', reserve = [104, 124]}) {
  const char = characters.characters[key], heading = boss || GAMES[key].title.replace(/\.$/, '');
  root.innerHTML = html`<section class="arcade" data-game="${key}" aria-label="${escape(char.n)}: ${escape(GAMES[key].title)}">
    <div class="arcade-world" aria-hidden="true"><canvas class="arcade-far"></canvas><canvas class="arcade-near"></canvas><canvas class="arcade-particles"></canvas></div>
    <canvas class="arcade-play" tabindex="0"></canvas>
    <div class="arcade-sprites" aria-hidden="true"></div>
    <div class="arcade-ui"></div>
    <div class="arcade-top">
      <div class="arcade-hud arcade-boss-hud">
        <div class="arcade-name-row"><span class="arcade-who">${escape(heading)}</span><span class="arcade-level"></span></div>
        <div class="arcade-meter"><span class="arcade-meter-label">${escape(meterLabel)}</span><span class="arcade-track" aria-hidden="true"><i></i></span><span class="arcade-meter-value"></span></div>
      </div>
      <span class="arcade-tag"></span>
      <div class="arcade-score" aria-hidden="true"><span></span><strong class="arcade-score-value"></strong></div>
      <button type="button" class="arcade-sound" aria-label="Sound" aria-pressed="false">${SPEAKER}</button>
      <button type="button" class="arcade-pause" aria-label="Pause">Ⅱ</button>
    </div>
    <div class="arcade-field"><div class="arcade-callout" aria-hidden="true"></div></div>
    <div class="arcade-box"></div>
    <div class="arcade-pause-menu" hidden>
      <p class="arcade-pause-title" tabindex="-1">Paused</p>
      <button type="button" class="arcade-button arcade-primary" data-resume>▶ Resume</button>
      <button type="button" class="arcade-button" data-restart>↺ Start again</button>
      <button type="button" class="arcade-button" data-exit>Change character</button>
    </div>
    <p class="vh" role="status" aria-live="polite" aria-atomic="true"></p>
  </section>`;
  root.hidden = false;
  const $ = s => root.querySelector(s), el = $('.arcade'), box = $('.arcade-box'), play = $('.arcade-play'), ui = $('.arcade-ui');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const far = $('.arcade-far'), near = scene === 'both' ? $('.arcade-near') : document.createElement('canvas');
  if (scene !== 'both') $('.arcade-near').remove();
  const sparks = particles($('.arcade-particles'));
  let world = {w: 0, h: 0, unit: 4, floor: 0, info: null}, floorAt = h => Math.round(h * .8);
  let game = null, paused = false, onScreen = true, focused = document.hasFocus(), destroyed = false, raf = 0, last = 0, acc = 0, sparkClock = 0;

  function paintWorld() {
    const unit = el.offsetWidth >= 900 ? 4 : 3, w = Math.ceil(el.offsetWidth / unit), h = Math.ceil(el.offsetHeight / unit), floor = floorAt(h, unit);
    if (!w || !h || (world.w === w && world.h === h && world.floor === floor)) return;
    const info = paintScene(far, near, key, w, h, floor);
    [far, near, $('.arcade-particles')].forEach(c => { c.style.width = w * unit + 'px'; c.style.height = h * unit + 'px'; });
    el.dataset.dark = String(info.dark);
    sparks.configure(info, w, h);
    world = {w, h, unit, floor, info};
  }
  // The play canvas is drawn in two pixel cells so its lines stay chunky like the worlds.
  function sizePlay() {
    const cell = 2, w = Math.max(1, Math.round(el.offsetWidth / cell)), h = Math.max(1, Math.round(el.offsetHeight / cell));
    if (play.width !== w || play.height !== h) { play.width = w; play.height = h; }
    play.style.width = w * cell + 'px'; play.style.height = h * cell + 'px';
    return cell;
  }
  function layout() {
    if (destroyed) return;
    sizePlay(); game?.layout?.(); paintWorld();
  }
  const resize = new ResizeObserver(layout); resize.observe(el); resize.observe(box); resize.observe($('.arcade-top'));

  const suspended = () => paused || document.hidden || !focused || !onScreen;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(.1, last ? (now - last) / 1000 : 0); last = now;
    if (!onScreen || document.hidden) return;
    if (!suspended() && game?.running) {
      acc += dt;
      while (acc >= STEP && game.running) { game.update(STEP); acc -= STEP; }
    } else acc = 0;
    if (!reduced.matches && !suspended()) { sparkClock += dt; if (sparkClock > .045) { sparkClock = 0; sparks.step(); } }
    game?.render(dt);
  }
  raf = requestAnimationFrame(frame);
  const visibility = () => { el.classList.toggle('is-suspended', suspended()); };
  const onBlur = () => { focused = false; visibility(); }, onFocus = () => { focused = true; visibility(); };
  window.addEventListener('blur', onBlur); window.addEventListener('focus', onFocus); document.addEventListener('visibilitychange', visibility);
  const seen = new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; visibility(); }); seen.observe(el);

  function setPaused(next) {
    paused = next; $('.arcade-pause-menu').hidden = !paused;
    $('.arcade-top').inert = paused; box.inert = paused; play.inert = paused; ui.inert = paused;
    el.classList.toggle('is-paused', paused); visibility();
    if (paused) $('.arcade-pause-title').focus({preventScroll: true}); else play.focus({preventScroll: true});
  }
  $('.arcade-pause').addEventListener('click', () => setPaused(true));
  $('[data-resume]').addEventListener('click', () => setPaused(false));
  $('[data-restart]').addEventListener('click', () => { setPaused(false); game?.restart(); });
  $('[data-exit]').addEventListener('click', () => onExit());
  const soundButton = $('.arcade-sound'), showSound = on => { soundButton.setAttribute('aria-pressed', String(on)); soundButton.classList.toggle('is-on', on); };
  soundButton.addEventListener('click', () => { setSound(!soundOn()); playSound('tick'); });
  const stopSound = onSoundChange(showSound); showSound(soundOn());
  el.addEventListener('keydown', e => {
    if (e.key === 'Escape' || (e.key.toLowerCase() === 'p' && !e.target.closest('input,textarea'))) {
      if (paused) { e.preventDefault(); setPaused(false); } else if (game?.running) { e.preventDefault(); setPaused(true); }
    }
  });

  let calloutTimer = 0;
  const shell = {
    root, el, box, play, ui, reduced, char, key,
    $: s => root.querySelector(s),
    get world() { return world; },
    // Where the play area ends. The dialogue box floats over a fixed strip at the bottom, so
    // the scene doesn't jump when the box changes; only the final results sit in the flow.
    playBottom() {
      if (box.classList.contains('is-result')) return box.offsetTop - 8;
      return el.offsetHeight - (el.offsetWidth < 761 ? reserve[1] : reserve[0]);
    },
    get paused() { return paused; },
    set floor(fn) { floorAt = fn; world.floor = -1; layout(); },
    attach(g) { game = g; layout(); },
    layout,
    level(text) { $('.arcade-level').textContent = text; },
    tag(text) { $('.arcade-tag').textContent = text; $('.arcade-tag').hidden = !text; },
    meter(value, text = Math.round(value) + '%', tone = value >= 75 ? 'bad' : value >= 45 ? 'warn' : 'ok') {
      const track = $('.arcade-track'); track.style.setProperty('--fill', Math.max(0, Math.min(100, value)) / 100); track.dataset.tone = tone;
      $('.arcade-meter-value').textContent = text;
    },
    hideMeter(hidden) { $('.arcade-meter').hidden = hidden; },
    score(label, text) { $('.arcade-score span').textContent = label; $('.arcade-score-value').textContent = text; $('.arcade-score').hidden = text === ''; },
    announce(text) { $('[role="status"]').textContent = text; },
    sound(name) { playSound(name); },
    callout(text, tone = '') {
      playSound(CALLOUT_SOUND[tone] || 'tick');
      if (reduced.matches) return;
      const c = $('.arcade-callout'); c.textContent = text; c.dataset.tone = tone;
      c.classList.remove('is-calling'); void c.offsetWidth; c.classList.add('is-calling');
      clearTimeout(calloutTimer); calloutTimer = setTimeout(() => c.classList.remove('is-calling'), 950);
    },
    shake(big = false) {
      if (reduced.matches) return;
      el.classList.remove('is-shaking', 'is-quaking'); void el.offsetWidth; el.classList.add(big ? 'is-quaking' : 'is-shaking');
    },
    // A burst of pixels at a point given in CSS pixels inside the game.
    burst(x, y, colours, count = 16) {
      if (reduced.matches || !world.unit) return;
      sparks.burst(x / world.unit, y / world.unit, colours, count);
    },
    setBox(content, className = '') {
      box.className = 'arcade-box' + (className ? ' ' + className : '');
      el.classList.toggle('has-result', className === 'is-result');
      box.replaceChildren(); if (typeof content === 'string') box.innerHTML = content; else box.append(content);
      return box;
    },
    // The how to play card. Resolves when the visitor presses Play.
    intro({label, title, text, controls, button = 'Play'}) {
      shell.setBox(html`<span class="arcade-label">${escape(label)}</span><h2 class="arcade-title" tabindex="-1">${escape(title)}</h2><p class="arcade-text">${text}</p>
        <ul class="arcade-controls">${controls.map(([keys, what, only]) => `<li${only ? ` class="only-${only}"` : ''}><span>${keys}</span>${escape(what)}</li>`).join('')}</ul>
        <div class="arcade-actions"><button type="button" class="arcade-button arcade-primary arcade-big" data-go>${escape(button)} <span aria-hidden="true">▶</span></button></div>`, 'is-intro');
      const go = box.querySelector('[data-go]'); go.focus({preventScroll: true});
      return new Promise(resolve => go.addEventListener('click', () => { unlock(); playSound('start'); resolve(); }, {once: true}));
    },
    // Title and stars, then the real project, then what to do next. The details sit underneath.
    result({title, stars, max = 3, line, rows = [], source = '', proof = EVIDENCE[key]}) {
      const url = new URL(proof.href, location.href); url.searchParams.set('c', key);
      const saved = recordStars(key, Math.max(0, Math.min(3, Math.round(stars * 3 / max))), characters.keys), tally = summary(saved.progress, characters.keys);
      const best = saved.first ? '' : saved.newBest ? '<span class="arcade-best">NEW BEST</span>' : saved.best > stars ? `<span class="arcade-best">BEST <span class="arcade-star-glyphs">${starText(saved.best, max)}</span></span>` : '';
      const faces = characters.keys.map(k => `<li><img src="assets/face-${k}.webp" width="240" height="240" alt=""><span aria-label="${saved.progress[k]} stars">${starText(saved.progress[k] ?? 0)}</span></li>`).join('');
      const portfolio = `experience.html${key === 'allrounder' ? '' : '?c=' + key}`;
      const finale = saved.completed ? html`<div class="arcade-finale"><span class="arcade-label">ALL NINE PLAYED</span>
        <p class="arcade-finale-title">That’s every Jackson.</p>
        <p class="arcade-text">You’ve played all nine versions of me and earned ${tally.stars} of ${tally.total * max} stars. The full portfolio has the real work behind every game.</p>
        <ul class="arcade-finale-faces">${faces}</ul>
        <a class="arcade-button arcade-primary arcade-big" href="${portfolio}">See the full portfolio <span aria-hidden="true">↗</span></a></div>` : '';
      shell.setBox(html`<span class="arcade-label">RESULT</span>
        <div class="arcade-result-head"><h2 class="arcade-title" tabindex="-1">${escape(title)}</h2><span class="arcade-stars" aria-label="${stars} out of ${max} stars">${starText(stars, max)}</span>${best}</div>
        <p class="arcade-text">${escape(line)}</p>
        ${finale}
        <span class="arcade-label">THE REAL PROJECT</span>
        <a class="real-project arcade-proof" href="${url.pathname + url.search + url.hash}"><img src="assets/${proof.image}" alt="${escape(proof.alt)}" width="640" height="420" loading="lazy"><span><strong>${escape(proof.title)}</strong><span>${escape(proof.text)}</span><b>See the project ↗</b></span></a>
        <div class="arcade-actions"><button type="button" class="arcade-button ${tally.all ? '' : 'arcade-primary '}arcade-big" data-other>Try another Jackson</button><button type="button" class="arcade-button arcade-big" data-again>↺ Play again</button><a class="arcade-button arcade-big" href="mailto:${EMAIL}">✉ Email Jackson</a><span class="arcade-tally">${tally.all ? 'All nine played' : `${tally.played} of ${tally.total} played`}</span></div>
        ${rows.length ? `<details class="arcade-how"${matchMedia('(min-width: 761px)').matches ? ' open' : ''}><summary>How you did</summary><ul class="arcade-rows">${rows.map(([a, b]) => `<li><span>${escape(a)}</span><strong>${escape(b)}</strong></li>`).join('')}</ul></details>` : ''}
        ${source ? `<details class="arcade-source"><summary>The data behind this</summary>${source}</details>` : ''}`, 'is-result');
      box.querySelector('[data-again]').addEventListener('click', () => game?.restart());
      box.querySelector('[data-other]').addEventListener('click', () => onExit('next'));
      playSound(stars > 0 ? 'win' : 'lose');
      shell.announce(`${title} ${stars} out of ${max} stars. ${line}${saved.completed ? ' You’ve played all nine.' : ''}`);
      box.querySelector('.arcade-title').focus({preventScroll: true});
      requestAnimationFrame(() => { if (!destroyed) box.scrollIntoView({block: 'start', behavior: reduced.matches ? 'auto' : 'smooth'}); });
    },
    focusPlay() { play.focus({preventScroll: true}); },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); resize.disconnect(); seen.disconnect(); clearTimeout(calloutTimer); stopSound();
      window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', visibility);
      game?.destroy?.(); root.replaceChildren(); root.hidden = true;
    },
  };
  return shell;
}
