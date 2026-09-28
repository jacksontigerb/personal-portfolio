// Shed the Rain: Researcher Jackson versus The Forever Chemical.
import {createShell} from './shell.mjs?v=2';
import {pen, INK, PAPER} from './pixels.mjs?v=2';
import {drawBoss} from '../battle-art.mjs?v=5';
import * as M from './rain-model.mjs?v=1';

const WATER = '#9fd8e6', WATER_DARK = '#4f9fb4', GO = '#3e7654';
const TITLES = ['The blob wins this one.', 'Damp, but still going.', 'Mostly dry.', 'Bone dry.'];
const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
const range = r => `${Math.round(Math.min(...r.release))} to ${Math.round(Math.max(...r.release))}°`;

export function start(root, {key, characters, onExit}) {
  const shell = createShell(root, {key, characters, boss: 'The Forever Chemical', meterLabel: 'SOAK', onExit, scene: 'far', reserve: [104, 118]});
  const {el, play} = shell, p = pen(play);
  const sprites = shell.$('.arcade-sprites');
  sprites.innerHTML = `<img class="rain-jackson" src="${shell.char.art}" alt="" width="537" height="840"><canvas class="rain-blob" width="64" height="64"></canvas><div class="rain-wash" hidden><span></span><b></b></div>`;
  const blob = sprites.querySelector('.rain-blob'), jackson = sprites.querySelector('.rain-jackson'), wash = sprites.querySelector('.rain-wash');
  let geo = null, s = M.createRound(0), round = 0, totals = [], running = false, run = 0, seed = 1, introSeen = false;
  let target = 0, hold = 0, dragging = false, flying = [], popups = [], beakers = [0, 0], pose = '', poseUntil = 0, warned = false, hud = '';

  function setPose(next) { if (next !== pose) { pose = next; drawBoss(blob, 'researcher', next); } }
  setPose('idle');

  // Everything is placed from the space left between the HUD and the dialogue box.
  // The rig has to fit at full tilt: half the swatch swings up towards the blob and half down
  // towards the trays, so the swatch is sized from whichever of width or height runs out first.
  function layout() {
    const top = shell.$('.arcade-top'), W = el.offsetWidth, unit = W >= 900 ? 4 : 3;
    const playTop = top.offsetTop + top.offsetHeight, playBottom = shell.playBottom(), H = playBottom - playTop;
    const floorY = playBottom - Math.max(12, H * .05), trayH = W < 700 ? 12 : 16, blobH = W < 700 ? 70 : 108;
    const reach = Math.sin(M.MAX_TILT * Math.PI / 180) / 2 * 100;
    const k = Math.max(1.4, Math.min((W - (W < 700 ? 16 : 48)) / (W < 700 ? 106 : 116), (floorY - trayH - 10 - playTop - blobH * .45) / (-M.SKY + reach), 9));
    const L = 100 * k, py = Math.round(floorY - trayH - 8 - reach * k), px = Math.round(W / 2);
    geo = {W, unit, floorY, trayH, px, py, k, L, blobH, playTop, standW: Math.max(40, k * 9)};
    blob.style.width = blob.style.height = blobH + 'px';
    const jh = Math.min(H * .6, 330), jw = jh * 537 / 840, room = px - L / 2 - 30;
    jackson.hidden = W < 760 || jw + 24 > room;
    Object.assign(jackson.style, {height: jh + 'px', left: Math.max(12, (room - jw) / 2) + 'px', top: floorY + 10 - jh + 'px'});
    wash.style.left = px + 'px'; wash.style.top = py - Math.min((py - playTop) * .5, 130) + 'px';
  }
  shell.floor = (h, unit) => geo ? Math.round(geo.floorY / unit) : Math.round(h * .8);

  function base(pos, tilt) {
    const rad = tilt * Math.PI / 180, cos = Math.cos(rad), sin = Math.sin(rad);
    return {x: geo.px + pos * geo.k * cos, y: geo.py + pos * geo.k * sin, cos, sin, nx: sin, ny: -cos};
  }
  const thickness = () => Math.max(3, Math.round(geo.k * 2.3 / 2));

  function render() {
    if (!geo) return;
    p.clear();
    const C = 2, tilt = s.tilt, T = thickness(), g = geo;
    // Lab floor, a tray either side of the stand to catch what rolls off, and a tall retort stand.
    const floorH = el.offsetHeight - g.floorY;
    p.r(0, g.floorY / C, g.W / C, floorH / C + 1, '#b9c6c3'); p.r(0, g.floorY / C, g.W / C, 1, '#9fb0ac');
    for (let y = 4, gap = 4; y < floorH / C; y += gap, gap += 3) p.r(0, g.floorY / C + y, g.W / C, 1, '#aab8b5');
    const inner = g.standW / 2 + 10, outer = g.L / 2 + 26;
    [-1, 1].forEach((side, i) => {
      const a = g.px + side * inner, b = Math.max(0, Math.min(g.W, g.px + side * outer)), x0 = Math.min(a, b) / C, w = Math.abs(b - a) / C;
      const ty = (g.floorY - g.trayH) / C, th = g.trayH / C, level = Math.min(th - 2, beakers[i] * .12);
      p.r(x0, ty, w, th, INK); p.r(x0 + 1, ty + 1, w - 2, th - 2, '#dfe7e5'); p.r(x0 + 1, ty + th - 1 - level, w - 2, level, WATER);
      g[i ? 'rightTray' : 'leftTray'] = {from: Math.min(a, b), to: Math.max(a, b), top: g.floorY - g.trayH};
    });
    const sx = g.px / C, top = g.py / C, bottom = (g.floorY - 2) / C, foot = g.standW / C;
    p.r(sx - 2, top, 4, bottom - top, INK); p.r(sx - 1, top, 2, bottom - top, '#8a9490');
    p.r(sx - foot / 2, bottom - 4, foot, 4, INK); p.r(sx - foot / 2 + 1, bottom - 3, foot - 2, 2, '#6f7a76');
    p.r(sx - 6, top + 5, 12, 4, INK); p.r(sx - 5, top + 6, 10, 2, '#b8c1be');
    // The swatch. It darkens as it soaks, and fades a little with each wash.
    const b = base(0, tilt), half = g.L / 2;
    const fabric = mix(mix('#f3e9ca', '#dcd6c6', round * .3), '#8e8468', s.soak / 110);
    const ex = b.cos * half, ey = b.sin * half, ox = b.nx * T * C / 2, oy = b.ny * T * C / 2;
    p.line((g.px - ex) / C, (g.py - ey) / C, (g.px + ex) / C, (g.py + ey) / C, fabric, T);
    p.line((g.px - ex + ox) / C, (g.py - ey + oy) / C, (g.px + ex + ox) / C, (g.py + ey + oy) / C, INK, 1);
    p.line((g.px - ex - ox) / C, (g.py - ey - oy) / C, (g.px + ex - ox) / C, (g.py + ey - oy) / C, INK, 1);
    // A woven look: short darker stitches in two offset rows.
    const weave = mix(fabric, INK, .22);
    for (let u = -half + 3, n = 0; u < half - 3; u += 5, n++) {
      const lift = (n % 2 ? .25 : -.25) * T * C;
      p.r((g.px + b.cos * u + b.nx * lift) / C, (g.py + b.sin * u + b.ny * lift) / C, 2, 1, weave);
    }
    p.disc(sx, top, 3, INK); p.disc(sx, top, 1, '#c9d2cf');
    // Drops on the swatch.
    const surface = T * C / 2;
    for (const d of s.drops) {
      const r = M.radius(d.vol) * g.k, at = base(d.s, tilt), cx = at.x + at.nx * (surface + r * .7), cy = at.y + at.ny * (surface + r * .7);
      const rc = Math.max(2, r / C);
      if (d.moving) p.line((cx - Math.sign(d.v) * at.cos * r * 1.2) / C, (cy - Math.sign(d.v) * at.sin * r * 1.2) / C, cx / C, cy / C, '#c9ecf3', Math.max(1, Math.round(rc * .6)));
      p.disc(cx / C, cy / C, rc + 1, INK); p.disc(cx / C, cy / C, rc, WATER);
      p.disc(cx / C + rc * .15, cy / C + rc * .3, rc * .55, WATER_DARK); p.disc(cx / C, cy / C, rc * .6, WATER);
      p.r(cx / C - rc * .45, cy / C - rc * .5, Math.max(1, rc * .25), Math.max(1, rc * .25), PAPER);
      if (M.isLarge(d.vol) && d.threshold) {
        const go = Math.abs(tilt) >= d.threshold * (d.moving ? .7 : 1);
        p.tag(Math.round(d.threshold) + '°', cx / C, (cy - r) / C - 9, PAPER, go ? GO : INK);
      }
    }
    for (const f of s.falling) {
      const x = (g.px + f.x * g.k) / C, y = (g.py + f.y * g.k) / C, rc = Math.max(1, M.radius(f.vol) * g.k / C * .7);
      p.r(x - .5, y - rc * 2.4, 1, rc * 1.6, '#cdeef5'); p.disc(x, y, rc, WATER_DARK); p.disc(x, y, Math.max(0, rc - 1), WATER);
    }
    for (const f of flying) { const rc = Math.max(2, f.r / C); p.disc(f.x / C, f.y / C, rc, INK); p.disc(f.x / C, f.y / C, rc - 1, WATER); }
    for (const t of popups) p.tag(t.text, t.x / C, t.y / C, PAPER, t.big ? '#ad343c' : INK, t.big ? 2 : 1);
    p.tag(Math.round(Math.abs(tilt)) + '°', sx, top + 14, PAPER, INK, g.k > 4 ? 2 : 1);
    // The blob drifts above the swatch and rains from underneath.
    const bx = g.px + s.cloud * g.k - geo.blobH / 2, by = g.py + M.SKY * g.k - geo.blobH * .72;
    blob.style.transform = `translate(${Math.round(bx)}px,${Math.round(by)}px)`;
    jackson.style.rotate = (tilt * .06).toFixed(2) + 'deg';
  }

  function update(dt) {
    if (hold) target = Math.max(-M.MAX_TILT, Math.min(M.MAX_TILT, target + hold * 110 * dt));
    const events = M.step(s, dt, target);
    for (const e of events) {
      if (e.type === 'shed') {
        const at = base(e.side * M.HALF, s.tilt), speed = Math.max(90, Math.abs(e.speed) * geo.k);
        flying.push({x: at.x + at.nx * 8, y: at.y + at.ny * 8, vx: at.cos * e.side * speed, vy: at.sin * e.side * speed - 40, r: M.radius(e.vol) * geo.k * .8, side: e.side, vol: e.vol});
        popups.push({text: '+' + e.points, x: at.x, y: at.y - 30, life: .9, big: e.vol >= 6});
        if (e.vol >= 6) { shell.callout(e.vol >= 10 ? `${e.vol} IN ONE` : 'BIG ROLL ×2', 'good'); setPose('hit'); poseUntil = s.t + .7; }
      }
      if (e.type === 'merge' && e.grew) { const d = s.drops.find(d => d.id === e.id); if (d) { const at = base(d.s, s.tilt); shell.burst(at.x, at.y - 10, [WATER, PAPER], 6); } }
      if (e.type === 'over') endRound(e.reason);
    }
    if (s.soak >= 75 && !warned) { warned = true; shell.callout('SOAKING', 'bad'); }
    if (s.soak < 50) warned = false;
    if (pose === 'hit' && s.t > poseUntil) setPose('idle');
    if (pose !== 'hit') setPose(s.burst > 0 || s.falling.length > 3 ? 'attack' : 'idle');
    for (const f of flying) {
      f.vy += 1500 * dt; f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.y >= geo.floorY - geo.trayH) {
        const tray = f.side < 0 ? geo.leftTray : geo.rightTray, caught = tray && f.x >= tray.from && f.x <= tray.to;
        f.done = true; if (caught) beakers[f.side < 0 ? 0 : 1] += f.vol;
        shell.burst(f.x, geo.floorY - geo.trayH, [WATER, PAPER], caught ? 8 : 4);
      } else if (f.x < -40 || f.x > geo.W + 40) f.done = true;
    }
    flying = flying.filter(f => !f.done);
    for (const t of popups) { t.life -= dt; t.y -= 40 * dt; }
    popups = popups.filter(t => t.life > 0);
    const text = `${s.soak.toFixed(0)}|${s.score}|${Math.ceil(M.ROUND_TIME - s.t)}`;
    if (text !== hud) { hud = text; paintHud(); }
  }

  function paintHud() {
    shell.meter(s.soak);
    shell.level(M.ROUNDS[round].washes ? `${M.ROUNDS[round].washes} WASHES` : 'FRESH');
    const left = Math.max(0, Math.ceil(M.ROUND_TIME - s.t));
    shell.tag(`ROUND ${round + 1}/3 · 0:${String(left).padStart(2, '0')}`);
    shell.score('SCORE', String(totals.reduce((sum, t) => sum + t.score, 0) + (running || s.over ? s.score : 0)));
  }

  function playBox() {
    const box = shell.setBox(`<div class="rain-controls">
      <button type="button" class="arcade-button rain-hold" data-dir="-1" aria-label="Tilt left">◀</button>
      <p class="rain-help"><strong>Tilt the swatch.</strong> <span class="only-mouse">Move the mouse across the lab, or hold ← and →.</span><span class="only-touch">Drag across the lab, or hold the arrows.</span></p>
      <button type="button" class="arcade-button rain-hold" data-dir="1" aria-label="Tilt right">▶</button>
      <button type="button" class="arcade-button rain-motion" hidden>Use phone tilt</button></div>`, 'is-play');
    box.querySelectorAll('.rain-hold').forEach(button => {
      const dir = Number(button.dataset.dir), stop = () => { if (hold === dir) hold = 0; };
      button.addEventListener('pointerdown', e => { e.preventDefault(); hold = dir; button.setPointerCapture(e.pointerId); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => button.addEventListener(type, stop));
      button.addEventListener('click', e => { if (e.detail === 0) target = Math.max(-M.MAX_TILT, Math.min(M.MAX_TILT, target + dir * 10)); });
    });
    const motion = box.querySelector('.rain-motion');
    if (typeof DeviceOrientationEvent !== 'undefined' && matchMedia('(pointer: coarse)').matches) {
      motion.hidden = false;
      motion.addEventListener('click', async () => {
        try { if (DeviceOrientationEvent.requestPermission && await DeviceOrientationEvent.requestPermission() !== 'granted') throw 0; }
        catch { motion.textContent = 'Tilt not allowed'; motion.disabled = true; return; }
        window.addEventListener('deviceorientation', orient); motion.textContent = 'Phone tilt on'; motion.disabled = true;
      });
    }
  }
  function orient(e) {
    if (!running) return;
    const angle = screen.orientation?.angle || 0, value = angle === 90 ? e.beta : angle === 270 || angle === -90 ? -e.beta : e.gamma;
    if (Number.isFinite(value)) target = Math.max(-M.MAX_TILT, Math.min(M.MAX_TILT, value * 1.6));
  }

  function pointer(e) {
    if (!running || !geo) return;
    const x = e.clientX - el.getBoundingClientRect().left;
    target = Math.max(-1, Math.min(1, (x - geo.px) / (geo.L * .42))) * M.MAX_TILT;
  }
  play.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || dragging) pointer(e); });
  play.addEventListener('pointerdown', e => { if (!running) return; dragging = true; play.setPointerCapture(e.pointerId); pointer(e); });
  ['pointerup', 'pointercancel'].forEach(type => play.addEventListener(type, () => { dragging = false; }));
  el.addEventListener('keydown', e => {
    if (!running || e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { hold = -1; e.preventDefault(); }
    else if (k === 'arrowright' || k === 'd') { hold = 1; e.preventDefault(); }
    else if (k === 'arrowdown' || k === 's' || (k === ' ' && e.target === play)) { target = 0; hold = 0; e.preventDefault(); }
  });
  el.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if ((k === 'arrowleft' || k === 'a') && hold < 0) hold = 0;
    if ((k === 'arrowright' || k === 'd') && hold > 0) hold = 0;
  });

  function startRound(index) {
    round = index; s = M.createRound(index, seed + index * 101); target = 0; hold = 0; flying = []; popups = []; beakers = [0, 0]; warned = false;
    playBox(); shell.layout(); running = true; hud = ''; paintHud();
    el.dataset.phase = 'play'; shell.focusPlay();
    shell.callout(index ? M.ROUNDS[index].name.toUpperCase() : 'GO', 'good');
    shell.announce(`Round ${index + 1} of 3, ${M.ROUNDS[index].name}. Large drops release at ${range(M.ROUNDS[index])}. Use the left and right arrow keys to tilt.`);
  }
  function endRound(reason) {
    running = false; hold = 0; dragging = false;
    totals[round] = {score: s.score, shed: s.shed, best: s.best, reason};
    shell.callout(reason === 'soaked' ? 'SOAKED' : 'TIME', reason === 'soaked' ? 'bad' : '');
    const token = run;
    setTimeout(() => { if (token === run) round < 2 ? washBreak(round + 1) : finish(); }, 1100);
  }
  function washBreak(next) {
    const done = totals[next - 1], info = M.ROUNDS[next];
    el.dataset.phase = 'wash'; wash.hidden = false; wash.querySelector('b').textContent = '×' + info.washes;
    s = M.createRound(next, 0); s.tilt = 0; round = next; paintHud();
    shell.setBox(`<span class="arcade-label">ROUND ${next} DONE · ${done.reason === 'soaked' ? 'SOAKED THROUGH' : 'TIME'}</span>
      <h2 class="arcade-title" tabindex="-1">${done.score} points, ${done.shed} drops shed.</h2>
      <p class="arcade-text">The Forever Chemical put the swatch through ${info.washes} wash cycles. Big drops now need ${range(info)} before they move.</p>
      <div class="arcade-actions"><button type="button" class="arcade-button arcade-primary arcade-big" data-next>Round ${next + 1} <span aria-hidden="true">▶</span></button></div>`, 'is-break');
    shell.announce(`Round ${next} done. ${done.score} points. ${info.washes} wash cycles. Big drops now need ${range(info)}.`);
    const button = shell.box.querySelector('[data-next]'); button.focus({preventScroll: true});
    button.addEventListener('click', () => { wash.hidden = true; startRound(next); }, {once: true});
  }
  function finish() {
    el.dataset.phase = 'result'; wash.hidden = true; s = M.createRound(2, 0); flying = []; popups = [];
    const total = totals.reduce((sum, t) => sum + t.score, 0), stars = M.stars(total), best = Math.max(...totals.map(t => t.best));
    setPose(stars >= 2 ? 'hit' : 'attack');
    shell.result({
      title: TITLES[stars], stars,
      line: 'The small drops never moved on their own. In the lab, they didn’t either.',
      rows: [...M.ROUNDS.map((r, i) => [r.name, `${totals[i].score} points${totals[i].reason === 'soaked' ? ', soaked' : ''}`]), ['Biggest drop off', best ? `${best} drops in one` : 'None'], ['Total', `${total} points`]],
      source: `<p>Only two drop sizes were measured on my C-A1 coating. The smaller drops never moved, even at 90°. Drops of about 33 µL rolled off at the angles used here: 28.5°, 55.7° and 45.7° before washing, 47.0° to 56.0° after 10 wash cycles, and 46.4° to 56.1° after 20.</p>
        <p>Small drops joining into bigger ones is what gets them moving, but I didn’t measure that. The game stops at 60°, and the soak meter is made up.</p>
        <a href="https://jacksontigerb.github.io/fluorine-free-DWR/results.html#shedding" target="_blank" rel="noopener">See the measurements ↗</a>`,
    });
    shell.tag(''); paintHudFinal(total);
  }
  function paintHudFinal(total) { shell.score('SCORE', String(total)); }

  async function begin() {
    const token = ++run; running = false; totals = []; seed = (Math.random() * 1e9) | 0;
    s = M.createRound(0, seed); round = 0; wash.hidden = true; el.dataset.phase = 'intro'; hud = ''; paintHud(); setPose('idle');
    if (!introSeen) {
      await shell.intro({
        label: 'RESEARCHER VS THE FOREVER CHEMICAL', title: 'Shed the rain.',
        text: 'The blob is raining on my water repellent cotton. Tilt the swatch to get the water off before it soaks through. Small drops stick where they land. Big ones roll, and pick up everything in their way.',
        controls: [['Mouse', 'Move across the lab to tilt', 'mouse'], ['← →', 'Hold to tilt', 'mouse'], ['Touch', 'Drag across the lab, or hold the arrows', 'touch'], ['Esc', 'Pause', 'mouse']],
        button: 'Play',
      });
      if (token !== run) return;
      introSeen = true;
    }
    startRound(0);
  }

  const game = {
    get running() { return running; },
    update, render, layout,
    restart() { begin(); },
    destroy() { run++; running = false; window.removeEventListener('deviceorientation', orient); },
  };
  shell.attach(game);
  begin();
  return shell;
}
