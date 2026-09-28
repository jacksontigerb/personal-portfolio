// The frame both character games share: the character's pixel world, a HUD in the fight's
// style, a dialogue box, a pause menu, and a results screen that ends on the real project.
import {paintScene, particles} from '../battle-scenes.mjs?v=18';
import {EVIDENCE} from '../battle-extras.mjs?v=2';
import {EMAIL} from '../battle-data.mjs?v=14';

const STEP = 1 / 60;
const html = (strings, ...values) => strings.reduce((out, s, i) => out + s + (i < values.length ? values[i] : ''), '');
export const escape = s => String(s).replace(/[&<>"]/g, ch => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[ch]));

export function createShell(root, {key, characters, boss, meterLabel, onExit, scene = 'both', reserve = [104, 124]}) {
  const char = characters.characters[key];
  root.innerHTML = html`<section class="arcade" data-game="${key}" aria-label="${escape(char.n)} versus ${escape(boss)}">
    <div class="arcade-world" aria-hidden="true"><canvas class="arcade-far"></canvas><canvas class="arcade-near"></canvas><canvas class="arcade-particles"></canvas></div>
    <canvas class="arcade-play" tabindex="0"></canvas>
    <div class="arcade-sprites" aria-hidden="true"></div>
    <div class="arcade-ui"></div>
    <div class="arcade-top">
      <div class="arcade-hud arcade-boss-hud">
        <div class="arcade-name-row"><span class="arcade-who">${escape(boss)}</span><span class="arcade-level"></span></div>
        <div class="arcade-meter"><span class="arcade-meter-label">${escape(meterLabel)}</span><span class="arcade-track" aria-hidden="true"><i></i></span><span class="arcade-meter-value"></span></div>
      </div>
      <span class="arcade-tag"></span>
      <div class="arcade-score" aria-hidden="true"><span></span><strong class="arcade-score-value"></strong></div>
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
    callout(text, tone = '') {
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
      box.replaceChildren(); if (typeof content === 'string') box.innerHTML = content; else box.append(content);
      return box;
    },
    // The how to play card. Resolves when the visitor presses Play.
    intro({label, title, text, controls, button = 'Play'}) {
      shell.setBox(html`<span class="arcade-label">${escape(label)}</span><h2 class="arcade-title" tabindex="-1">${escape(title)}</h2><p class="arcade-text">${text}</p>
        <ul class="arcade-controls">${controls.map(([keys, what, only]) => `<li${only ? ` class="only-${only}"` : ''}><span>${keys}</span>${escape(what)}</li>`).join('')}</ul>
        <div class="arcade-actions"><button type="button" class="arcade-button arcade-primary arcade-big" data-go>${escape(button)} <span aria-hidden="true">▶</span></button></div>`, 'is-intro');
      const go = box.querySelector('[data-go]'); go.focus({preventScroll: true});
      return new Promise(resolve => go.addEventListener('click', resolve, {once: true}));
    },
    result({title, stars, max = 3, line, rows = [], source = '', proof = EVIDENCE[key]}) {
      const url = new URL(proof.href, location.href); url.searchParams.set('c', key);
      const starText = '★'.repeat(stars) + '☆'.repeat(max - stars);
      shell.setBox(html`<span class="arcade-label">RESULT</span>
        <div class="arcade-result-head"><h2 class="arcade-title" tabindex="-1">${escape(title)}</h2><span class="arcade-stars" aria-label="${stars} out of ${max} stars">${starText}</span></div>
        <p class="arcade-text">${escape(line)}</p>
        ${rows.length ? `<ul class="arcade-rows">${rows.map(([a, b]) => `<li><span>${escape(a)}</span><strong>${escape(b)}</strong></li>`).join('')}</ul>` : ''}
        <span class="arcade-label">THE REAL PROJECT</span>
        <a class="real-project arcade-proof" href="${url.pathname + url.search + url.hash}"><img src="assets/${proof.image}" alt="${escape(proof.alt)}" width="640" height="420" loading="lazy"><span><strong>${escape(proof.title)}</strong><span>${escape(proof.text)}</span><b>See the project ↗</b></span></a>
        <div class="arcade-actions"><button type="button" class="arcade-button arcade-primary arcade-big" data-again>↺ Play again</button><a class="arcade-button arcade-big" href="mailto:${EMAIL}">✉ Email Jackson</a><button type="button" class="arcade-button arcade-big" data-other>Try another Jackson</button></div>
        ${source ? `<details class="arcade-source"><summary>The data behind this</summary>${source}</details>` : ''}`, 'is-result');
      box.querySelector('[data-again]').addEventListener('click', () => game?.restart());
      box.querySelector('[data-other]').addEventListener('click', () => onExit());
      shell.announce(`${title} ${stars} out of ${max} stars. ${line}`);
      box.querySelector('.arcade-title').focus({preventScroll: true});
      box.scrollIntoView({block: 'nearest', behavior: reduced.matches ? 'auto' : 'smooth'});
    },
    focusPlay() { play.focus({preventScroll: true}); },
    destroy() {
      destroyed = true; cancelAnimationFrame(raf); resize.disconnect(); seen.disconnect(); clearTimeout(calloutTimer);
      window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', visibility);
      game?.destroy?.(); root.replaceChildren(); root.hidden = true;
    },
  };
  return shell;
}
