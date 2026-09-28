// Character select: the chosen Jackson stands in his own world beside a card for his game.
// Start plays the game in the same frame; leaving it comes back here.
import {GAMES, stillFor} from './games/index.mjs?v=3';
import {paintScene} from './games/scenes.mjs?v=3';
import {readProgress, summary, starText} from './games/progress.mjs?v=3';

export function mountSelect(mount, characters) {
  mount.innerHTML = `
    <div class="select-world" aria-hidden="true"><canvas class="select-far"></canvas><canvas class="select-near"></canvas></div>
    <div class="select-wipe" aria-hidden="true"></div>
    <div class="select">
      <div class="select-jackson">
        <div class="select-stage"><img width="537" height="840" alt="" decoding="async"><img class="select-ghost" width="537" height="840" alt="" hidden></div>
        <div class="select-copy"><h2 class="select-name"></h2><p class="select-blurb"></p></div>
      </div>
      <div class="select-side">
        <article class="select-card" aria-labelledby="select-card-title">
          <p class="select-card-kicker"><span>Under a minute</span><span class="select-card-best"></span></p>
          <h2 class="select-card-title" id="select-card-title"></h2>
          <img class="select-card-still" width="640" height="320" alt="" decoding="async">
          <p class="select-card-line"></p>
          <p class="select-card-shows"><span>Shows</span> <strong></strong></p>
        </article>
        <div class="select-start-wrap"><button type="button" class="select-start">Start game <span aria-hidden="true">▶</span></button></div>
      </div>
      <div class="select-controls">
        <p class="select-tally"></p>
        <div class="select-strip">
          <button type="button" class="select-step" data-step="-1" aria-label="Previous Jackson"><span aria-hidden="true">◀</span></button>
          <fieldset class="select-picker"><legend class="vh">Choose your Jackson</legend><div class="select-roster"></div></fieldset>
          <button type="button" class="select-step" data-step="1" aria-label="Next Jackson"><span aria-hidden="true">▶</span></button>
        </div>
      </div>
      <a class="select-skip" href="#experience">or skip to the portfolio <span aria-hidden="true">↓</span></a>
    </div>
    <div class="arcade-mount" hidden></div>
    <p class="vh select-announcement" role="status" aria-live="polite" aria-atomic="true"></p>`;
  const $ = selector => mount.querySelector(selector);
  const keys = characters.keys, reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const screen = $('.select'), stage = $('.select-stage'), art = stage.querySelector('img'), ghost = $('.select-ghost');
  const start = $('.select-start'), roster = $('.select-roster'), arcade = $('.arcade-mount');
  const hero = mount.closest('.game-hero') || mount, far = $('.select-far'), near = $('.select-near');
  const radios = new Map(), badges = new Map(), statuses = new Map();
  let activeGame = null, gameRun = 0, imageRun = 0, transitioning = false, displayedArt = '', shown = '', index = keys.indexOf(characters.get());
  let progress = readProgress();

  // All nine sprites load at the start and stay decoded, so switching is instant.
  const artCache = new Map();
  function prepareArt(char, priority = 'low') {
    if (artCache.has(char.art)) return artCache.get(char.art);
    const image = new Image(); image.decoding = 'async'; image.fetchPriority = priority;
    const entry = {image, ready: false, promise: null};
    artCache.set(char.art, entry);
    entry.promise = new Promise(resolve => {
      const failed = () => { artCache.delete(char.art); resolve(false); };
      image.onerror = failed;
      image.onload = async () => {
        try { await image.decode(); } catch { if (!image.naturalWidth) { failed(); return; } }
        entry.ready = true; resolve(true);
      };
      image.src = char.art;
    });
    return entry;
  }
  function replay(el, className) { el.classList.remove(className); void el.offsetWidth; el.classList.add(className); }
  function showArt(char) {
    const run = ++imageRun, entry = prepareArt(char, 'high');
    const show = () => {
      if (run !== imageRun) return;
      ghost.hidden = true;
      if (displayedArt && displayedArt !== char.art && !reduced.matches) { ghost.src = displayedArt; ghost.hidden = false; }
      art.src = char.art; art.style.visibility = 'visible'; displayedArt = char.art;
      stage.classList.remove('is-loading'); replay(stage, 'is-arriving'); queueWorld();
    };
    if (entry.ready) { show(); return; }
    entry.image.fetchPriority = 'high'; stage.classList.add('is-loading'); ghost.hidden = true;
    entry.promise.then(ok => {
      if (run !== imageRun) return;
      if (ok) show(); else { stage.classList.remove('is-loading'); art.style.visibility = 'hidden'; displayedArt = ''; }
    });
  }
  ghost.addEventListener('animationend', () => { ghost.hidden = true; });

  // The world behind the select screen is painted in cells, with its floor under Jackson's feet.
  let painted = {key: '', w: 0, h: 0, floor: 0}, queued = false;
  function paintWorld() {
    queued = false;
    if (screen.hidden || !hero.offsetWidth) return;
    const unit = hero.offsetWidth >= 900 ? 4 : 3, w = Math.ceil(hero.offsetWidth / unit), h = Math.ceil(hero.offsetHeight / unit);
    const feet = stage.getBoundingClientRect().bottom - hero.getBoundingClientRect().top;
    const floor = Math.max(20, Math.round(feet / unit) - 3), key = characters.get();
    if (painted.key === key && painted.w === w && painted.h === h && painted.floor === floor) return;
    paintScene(far, near, key, w, h, floor);
    [far, near].forEach(c => { c.style.width = w * unit + 'px'; c.style.height = h * unit + 'px'; });
    painted = {key, w, h, floor};
  }
  function queueWorld() { if (!queued) { queued = true; requestAnimationFrame(paintWorld); } }

  // Stills are small; the chosen one loads first and the rest follow once the page is idle.
  const stills = new Set();
  function warmStills() { keys.forEach(key => { if (!stills.has(key)) { stills.add(key); const i = new Image(); i.src = stillFor(key); } }); }

  function paintProgress() {
    progress = readProgress();
    const tally = summary(progress, keys), tallyEl = $('.select-tally');
    if (tally.all) tallyEl.innerHTML = `All nine played <span aria-hidden="true">·</span> ${tally.stars} of ${tally.total * 3} ★ <span aria-hidden="true">·</span> <a href="experience.html">See the full portfolio ↗</a>`;
    else if (tally.played) tallyEl.textContent = `${tally.played} of ${tally.total} played · ${tally.stars} ★`;
    else tallyEl.textContent = 'Nine games, under a minute each';
    keys.forEach(key => {
      const played = key in progress, badge = badges.get(key);
      badge.hidden = !played; badge.textContent = played ? starText(progress[key]) : '';
      statuses.get(key).textContent = played ? `, played, ${progress[key]} of 3 stars` : '';
    });
    const best = $('.select-card-best'), key = characters.get();
    best.innerHTML = key in progress ? `Best <b>${starText(progress[key])}</b>` : '';
  }

  function centreFace(key, smooth) {
    if (roster.scrollWidth <= roster.clientWidth + 1) return;
    const face = radios.get(key).closest('.select-face');
    const left = face.offsetLeft - (roster.clientWidth - face.offsetWidth) / 2;
    roster.scrollTo({left, behavior: smooth && !reduced.matches ? 'smooth' : 'auto'});
  }

  function show(key) {
    const char = characters.characters[key], game = GAMES[key];
    const next = keys.indexOf(key); stage.style.setProperty('--swap', next < index ? -1 : 1); index = next;
    radios.forEach((radio, k) => { radio.checked = k === key; });
    showArt(char);
    $('.select-name').textContent = char.n;
    $('.select-blurb').textContent = game.blurb;
    $('.select-card-title').textContent = game.title;
    $('.select-card-line').textContent = game.line;
    $('.select-card-shows strong').textContent = game.shows;
    const still = $('.select-card-still'); still.src = stillFor(key); still.alt = `${game.title.replace(/\.$/, '')}, a still from the game`;
    screen.dataset.character = key;
    if (shown) { replay($('.select-card'), 'is-arriving'); replay($('.select-copy'), 'is-arriving'); }
    shown = key;
    paintProgress(); centreFace(key, true); queueWorld();
  }

  keys.forEach(key => {
    const label = document.createElement('label'); label.className = 'select-face';
    label.style.setProperty('--face-colour', characters.characters[key].hex);
    const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'select-character'; radio.value = key;
    const face = document.createElement('img'); face.src = `assets/face-${key}.webp`; face.width = 240; face.height = 240; face.alt = '';
    const stars = document.createElement('span'); stars.className = 'select-face-stars'; stars.setAttribute('aria-hidden', 'true'); stars.hidden = true;
    const name = document.createElement('span'); name.className = 'select-face-name'; name.textContent = characters.characters[key].n;
    const status = document.createElement('span'); status.className = 'vh';
    name.append(status);
    radio.addEventListener('change', () => { if (radio.checked) characters.set(key); });
    radio.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); start.click(); } });
    label.append(radio, face, stars, name); roster.append(label);
    radios.set(key, radio); badges.set(key, stars); statuses.set(key, status);
  });
  mount.querySelectorAll('.select-step').forEach(button => button.addEventListener('click', () => {
    const next = keys[(keys.indexOf(characters.get()) + Number(button.dataset.step) + keys.length) % keys.length];
    characters.set(next); radios.get(next).focus({preventScroll: true});
  }));

  function transition(swap) {
    if (transitioning) return;
    if (reduced.matches) { swap(); return; }
    transitioning = true;
    const wipe = $('.select-wipe'); wipe.className = 'select-wipe is-in';
    setTimeout(() => { swap(); wipe.className = 'select-wipe is-out'; setTimeout(() => { wipe.className = 'select-wipe'; transitioning = false; }, 360); }, 280);
  }
  const toTop = () => window.scrollTo({top: 0, behavior: 'instant'});
  function setScreen(playing) {
    mount.dataset.screen = playing ? 'game' : 'select';
    document.body.classList.toggle('is-playing', playing);
    screen.hidden = playing; $('.select-world').hidden = playing;
  }

  start.addEventListener('click', () => transition(() => startGame(characters.get())));
  function startGame(key) {
    const run = ++gameRun;
    setScreen(true); arcade.hidden = false; arcade.innerHTML = '<p class="arcade-loading">LOADING…</p>'; toTop();
    $('.select-announcement').textContent = `${characters.characters[key].n}. ${GAMES[key].title}`;
    GAMES[key].load().then(module => {
      if (run !== gameRun) return;
      activeGame = module.start(arcade, {key, characters, onExit: leave});
    }).catch(() => {
      if (run !== gameRun) return;
      arcade.innerHTML = '<p class="arcade-loading">The game couldn’t load. <button type="button" class="arcade-button">Back to the characters</button></p>';
      arcade.querySelector('button').addEventListener('click', () => leave());
    });
  }
  // "Try another Jackson" moves on to the next one you haven't played yet.
  function leave(mode) {
    transition(() => {
      gameRun++;
      activeGame?.destroy(); activeGame = null; arcade.hidden = true; arcade.replaceChildren();
      setScreen(false); toTop();
      progress = readProgress();
      let key = characters.get();
      if (mode === 'next') {
        const from = keys.indexOf(key);
        key = [...keys.slice(from + 1), ...keys.slice(0, from + 1)].find(k => !(k in progress) && k !== key) || keys[(from + 1) % keys.length];
      }
      if (key !== characters.get()) characters.set(key); else show(key);
      radios.get(key).focus({preventScroll: true});
    });
  }

  // Idle animation stops when the select screen is off screen or the tab is hidden.
  const suspend = visible => mount.classList.toggle('is-suspended', !visible || document.hidden);
  let onScreen = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { onScreen = entries[0].isIntersecting; suspend(onScreen); }).observe(mount);
  document.addEventListener('visibilitychange', () => suspend(onScreen));
  if ('ResizeObserver' in window) new ResizeObserver(queueWorld).observe(hero);
  characters.subscribe(key => { if (!screen.hidden) show(key); });
  setScreen(false);
  show(characters.get());
  keys.forEach(key => prepareArt(characters.characters[key]));
  (window.requestIdleCallback || (fn => setTimeout(fn, 1200)))(warmStills);
}
