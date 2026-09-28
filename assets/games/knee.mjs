// Find the knee: Computer Guy Jackson versus The Knee.
// Data streams in; you pin where the dots will cross 70% and lock it in. Then the rest of the
// data plays out fast and you see your pin, the baseline's and the real crossing side by side.
import {createShell} from './shell.mjs?v=3';
import {pen, INK, PAPER} from './pixels.mjs?v=3';
import {drawBoss} from './bosses.mjs?v=3';
import * as M from './knee-model.mjs?v=3';

const SCREEN = '#15201b', GRID = '#24352d', DOT = '#6fe39a', CALL = '#e3b341', DEAD = '#ff6b6b', BASE = '#9aaba3', BAND = 'rgba(111,227,154,.13)';
const TITLES = ['The Knee wins this one.', 'Some good calls.', 'Good calls.', 'Sharper than the baseline.'];
const CALLOUT = {bullseye: ['BULLSEYE', 'good'], close: ['CLOSE', 'good'], rough: ['A BIT OUT', ''], miss: ['MISSED', 'bad'], late: ['TOO LATE', 'bad']};
const HEAD = {bullseye: 'Spot on.', close: 'Close.', rough: 'Near enough for a few points.', miss: 'Too far out.', late: 'Too late.'};
const fmt = n => Math.round(n).toLocaleString('en-GB');
const plural = (n, word) => `${fmt(n)} ${word}${Math.round(n) === 1 ? '' : 's'}`;

export function start(root, {key, characters, onExit}) {
  const shell = createShell(root, {key, characters, boss: 'The Knee', meterLabel: 'CAPACITY', onExit, scene: 'far', reserve: [100, 176]});
  const {el, play} = shell, p = pen(play);
  play.setAttribute('aria-label', 'Battery fade chart. Left and right arrows move your pin, Space locks it in.');
  shell.$('.arcade-sprites').innerHTML = `<img class="knee-jackson" src="${shell.char.art}" alt="" width="537" height="840"><canvas class="knee-boss" width="64" height="64"></canvas>`;
  const boss = shell.$('.knee-boss'), jackson = shell.$('.knee-jackson');
  let geo = null, cells = M.makeRun(1), round = 0, cell = cells[0], data = [], eol = 0, revealed = 0;
  let pin = null, lockedAt = null, anchor = null, result = null, phase = 'watch', crossed = false, seenCount = 0, fit = null, fitAtLock = null;
  let running = false, run = 0, introSeen = false, hold = 0, holdTime = 0, totals = [], streak = 0, bestStreak = 0, pose = '', hud = '', dragging = false, nagged = false, clock = 0;

  function setPose(next) { if (next !== pose) { pose = next; drawBoss(boss, 'operator', next); } }
  setPose('idle');

  function layout() {
    const top = shell.$('.arcade-top'), W = el.offsetWidth, playTop = top.offsetTop + top.offsetHeight + 10, playBottom = shell.playBottom() - 6;
    const side = W >= 1100 ? 170 : 0, mw = Math.min(W - 24 - side * 2, 940), mh = Math.max(220, Math.min(playBottom - playTop, 560));
    const mx = Math.round((W - mw) / 2), my = Math.round(playTop + Math.max(0, (playBottom - playTop - mh) / 2));
    const pad = {l: W < 600 ? 40 : 56, r: W < 600 ? 14 : 22, t: W < 600 ? 30 : 42, b: 30};
    geo = {W, mx, my, mw, mh, cx: mx + pad.l, cy: my + pad.t, cw: mw - pad.l - pad.r, ch: mh - pad.t - pad.b, k: W < 600 ? 1 : 2};
    boss.hidden = !side; jackson.hidden = !side;
    Object.assign(boss.style, {width: '140px', height: '140px', left: mx + mw + 14 + 'px', top: my + 10 + 'px'});
    const jh = Math.min(300, mh * .8);
    Object.assign(jackson.style, {height: jh + 'px', left: Math.max(8, mx - jh * 537 / 840 - 24) + 'px', top: my + mh - jh + 'px'});
  }
  shell.floor = h => Math.round(h * .82);
  const X = n => geo.cx + Math.min(n, M.AXIS) / M.AXIS * geo.cw, Y = v => geo.cy + (1 - v) / (1 - M.FLOOR) * geo.ch;
  const toCycle = x => Math.max(0, Math.min(M.AXIS, (x - geo.cx) / geo.cw * M.AXIS));
  const clampPin = n => Math.max(Math.ceil(revealed / 10) * 10, Math.min(M.AXIS, Math.round(n / 10) * 10));

  // The trend at the newest data: the mean of the last few points and the slope over the last ten.
  function trend(count) {
    const last = data.slice(Math.max(1, count - 10), count);
    if (last.length < 4) return null;
    const tail = last.slice(-5), n0 = tail.reduce((a, d) => a + d.n, 0) / tail.length, v0 = tail.reduce((a, d) => a + d.v, 0) / tail.length;
    const mn = last.reduce((a, d) => a + d.n, 0) / last.length, mv = last.reduce((a, d) => a + d.v, 0) / last.length;
    let top = 0, bottom = 0; for (const d of last) { top += (d.n - mn) * (d.v - mv); bottom += (d.n - mn) ** 2; }
    return {n0, v0, s0: bottom ? top / bottom : 0};
  }
  function refit() {
    const count = data.findIndex(d => d.n > revealed), next = count < 0 ? data.length : count;
    if (next !== seenCount) { seenCount = next; fit = seenCount > 3 ? M.baseline(data.slice(0, seenCount)) : null; }
  }

  function render() {
    if (!geo) return;
    p.clear();
    const C = 2, g = geo, k = g.k, left = g.cx / C, right = (g.cx + g.cw) / C, top = g.cy / C, bottom = (g.cy + g.ch) / C, ey = Y(M.EOL) / C;
    const blink = shell.reduced.matches || Math.floor(clock / .45) % 2 === 0;
    // The monitor and its grid.
    p.r(g.mx / C - 3, g.my / C - 3, g.mw / C + 6, g.mh / C + 6, INK); p.r(g.mx / C - 2, g.my / C - 2, g.mw / C + 4, g.mh / C + 4, '#3a3f45');
    p.r(g.mx / C, g.my / C, g.mw / C, g.mh / C, SCREEN);
    for (const v of [1, .9, .8, .7, .6]) { const y = Y(v) / C; p.r(left, y, right - left, 1, GRID); p.text(Math.round(v * 100) + '%', g.mx / C + 3, y - 2, BASE, 1); }
    for (let n = 0; n <= M.AXIS; n += 500) { const x = X(n) / C; p.r(x, top, 1, bottom - top, GRID); const s = String(n); p.text(s, Math.min(x - p.textWidth(s) / 2, right - p.textWidth(s)), bottom + 4, BASE, 1); }
    if (g.W >= 600) p.text('CYCLES', right - p.textWidth('CYCLES') - (g.W < 600 ? 22 : 30), bottom + 4, BASE, 1);
    p.text(`CELL ${round + 1}/${M.CELL_COUNT}  ${cell.label}`, g.mx / C + 4, g.my / C + 4, DOT, k);
    const cyc = 'CYCLE ' + Math.round(Math.min(revealed, M.AXIS));
    p.text(cyc, (g.mx + g.mw) / C - 4 - p.textWidth(cyc, k), g.my / C + 4, BASE, k);
    // End of life.
    for (let x = left; x < right; x += 4) p.r(x, ey, 2, 1, DEAD);
    p.text('70% END OF LIFE', left + 3, ey + 4, DEAD, 1);
    // Once it's over, the warning you gave shows as a band from the lock to the real crossing.
    if (phase === 'done' && result && result.points > 0) {
      const a = X(lockedAt) / C, b = X(eol) / C; p.c.fillStyle = BAND; p.c.fillRect(Math.round(a), top, Math.round(b - a), Math.round(bottom - top));
      if (g.ch >= 300) p.tag(`${fmt(eol - lockedAt)} CYCLES WARNING`, Math.max(left + 50, Math.min(right - 50, (a + b) / 2)), top + 4, SCREEN, DOT);
    }
    // The baseline: a dotted curve and its own pin. After you lock, it keeps what it said then.
    const b = phase === 'watch' ? fit : fitAtLock;
    if (b) {
      for (let n = 0; n <= M.AXIS; n += 30) { const v = 1 - b.k * (n / 1000) ** .8; if (v < M.FLOOR) break; if ((n / 30) % 2 === 0) p.r(X(n) / C, Y(v) / C, 1, 1, BASE); }
      if (b.eol <= M.AXIS) { const x = X(b.eol) / C; p.r(x - 1, ey - 5, 3, 11, BASE); p.tag('BASELINE', x, ey - 17, SCREEN, BASE); }
      else p.tag('BASELINE ' + fmt(b.eol) + ' →', right - p.textWidth('BASELINE ' + fmt(b.eol) + ' →') / 2 - 3, ey - 17, SCREEN, BASE);
    }
    // Your forecast: from the newest trend down to your pin on the red line.
    const t = anchor || (pin != null ? trend(seenCount) : null);
    if (pin != null && t && pin > t.n0) {
      const d = pin - t.n0, q = (M.EOL - t.v0 - t.s0 * d) / (d * d);
      for (let i = 0; i <= 40; i++) {
        const u = i / 40 * d, v = q < 0 ? t.v0 + t.s0 * u + q * u * u : t.v0 + (M.EOL - t.v0) * u / d;
        if (i % 2 === 0) p.r(X(t.n0 + u) / C, Y(v) / C, 1, 1, CALL);
      }
    }
    // The measured points, the newest one brighter.
    for (let i = 0; i < seenCount; i++) { const d = data[i]; if (d.v >= M.FLOOR) p.r(X(d.n) / C - 1, Y(d.v) / C - 1, 2, 2, d.v <= M.EOL ? DEAD : DOT); }
    if (seenCount && phase === 'watch') { const d = data[seenCount - 1]; p.r(X(d.n) / C - 1, Y(d.v) / C - 1, 3, 3, PAPER); }
    // Your pin.
    if (pin != null) {
      const x = X(pin) / C;
      for (let y = top; y < bottom; y += 3) p.r(x, y, 1, 2, CALL);
      p.r(x - 3, ey - 3, 7, 7, INK); p.r(x - 2, ey - 2, 5, 5, CALL);
      p.tag((lockedAt != null ? 'LOCKED ' : 'YOUR PIN ') + fmt(pin), Math.max(left + 30 * k, Math.min(right - 30 * k, x)), bottom - 12 * k, INK, CALL, k);
    } else if (phase === 'watch') {
      const lines = ['WHERE WILL THE DOTS', 'CROSS THE RED LINE?', matchMedia('(pointer: coarse)').matches ? 'TAP THE CHART TO PIN IT' : 'CLICK THE CHART TO PIN IT'];
      lines.forEach((s, i) => (i < 2 || blink) && p.tag(s, (left + right) / 2, top + (bottom - top) * .42 + i * 12 * k, i < 2 ? CALL : SCREEN, i < 2 ? SCREEN : CALL, k));
    }
    // The reveal: where it really crossed, and how far your pin was from it.
    if (crossed) {
      const x = X(eol) / C;
      p.r(x, top, 1, bottom - top, PAPER); p.r(x - 3, ey - 3, 7, 7, PAPER);
      p.tag('HIT 70% AT ' + fmt(eol), Math.max(left + 40, Math.min(right - 40, x)), ey - 31, SCREEN, PAPER);
      if (cell.knee < eol) p.tag('KNEE', X(cell.knee) / C, Y(M.soh(cell, cell.knee)) / C - 12, SCREEN, DOT);
      else p.tag('NO KNEE', X(eol * .5) / C, Y(M.soh(cell, eol * .5)) / C - 12, SCREEN, DOT);
      if (pin != null && result && !result.late && Math.abs(pin - eol) >= 10) {
        const a = X(Math.min(pin, eol)) / C, c = X(Math.max(pin, eol)) / C, col = result.error < M.CLOSE ? CALL : DEAD;
        p.r(a, ey + 8, c - a, 1, col); p.r(a, ey + 5, 1, 7, col); p.r(c, ey + 5, 1, 7, col);
        p.tag('OFF BY ' + fmt(Math.abs(pin - eol)), Math.max(left + 30, Math.min(right - 30, (a + c) / 2)), ey + 14, SCREEN, col);
      }
    }
    if (phase === 'done' && result) {
      const v = M.verdict(result), text = result.late || !result.points ? CALLOUT[v][0] : `${CALLOUT[v][0]} +${result.points}`;
      const half = p.textWidth(text, k + 1) / 2 + 3 * (k + 1);
      p.tag(text, Math.max(left + half, Math.min(right - half, left + (right - left) * .7)), top + (bottom - top) * .2, INK, result.late || v === 'miss' ? DEAD : CALL, k + 1);
    }
  }

  function update(dt) {
    clock += dt;
    if (hold && lockedAt == null && phase === 'watch') {
      holdTime += dt; const speed = holdTime > .5 ? 700 : 250;
      pin = clampPin((pin ?? Math.max(revealed + 300, 1000)) + hold * speed * dt); paintBar();
    }
    const before = revealed;
    revealed += (phase === 'watch' ? M.SPEED : 650) * dt;
    if (pin != null && lockedAt == null && pin < revealed) pin = clampPin(revealed);
    refit();
    if (phase === 'watch') {
      const trendNow = trend(seenCount);
      if (!nagged && trendNow && trendNow.v0 < .76) { nagged = true; shell.callout(pin == null ? 'PIN IT' : 'LOCK IT IN', 'bad'); }
      if (revealed >= eol) { result = M.score(cell, null, eol); fitAtLock = fit; phase = 'replay'; paintBar(); }
    }
    if (!crossed && before < eol && revealed >= eol) cross();
    if (phase === 'replay' && revealed >= Math.min(M.AXIS, eol + 180)) done();
    const last = seenCount ? data.slice(Math.max(0, seenCount - 3), seenCount).reduce((a, d) => a + d.v, 0) / Math.min(3, seenCount) : 1;
    const shown = Math.max(M.EOL, crossed ? M.EOL : last), h = (shown - M.EOL) / (1 - M.EOL) * 100;
    const text = `${Math.round(shown * 100)}|${total()}`;
    if (text !== hud) { hud = text; shell.meter(h, Math.round(shown * 100) + '%', h < 25 ? 'bad' : h < 55 ? 'warn' : 'ok'); paintScore(); }
  }
  const total = () => totals.reduce((a, t) => a + t.points, 0);
  const paintScore = () => shell.score('SCORE', String(total()));

  function lock() {
    if (!running || phase !== 'watch') return;
    if (pin == null) { shell.callout('PIN IT FIRST', 'bad'); shell.announce('Place your pin first: click or tap the chart, or use the arrow keys.'); return; }
    lockedAt = revealed; anchor = trend(seenCount); fitAtLock = fit; result = M.score(cell, pin, lockedAt); phase = 'replay'; hold = 0; dragging = false;
    shell.callout('LOCKED', ''); shell.announce(`Locked in at cycle ${fmt(pin)}. Playing out the rest of the data.`);
    paintBar();
  }
  function cross() {
    crossed = true;
    const v = M.verdict(result), good = v === 'bullseye' || v === 'close';
    streak = good ? streak + 1 : 0; bestStreak = Math.max(bestStreak, streak);
    shell.callout(good && streak > 1 ? `${CALLOUT[v][0]} · ${streak} IN A ROW` : CALLOUT[v][0], CALLOUT[v][1]);
    shell.burst(X(eol), Y(M.EOL), v === 'bullseye' || v === 'close' ? [CALL, PAPER, DOT] : [DEAD, PAPER], v === 'bullseye' ? 26 : 14);
    if (v === 'late' || v === 'miss') { shell.shake(); setPose('attack'); } else if (v !== 'rough') setPose('hit');
  }
  function done() {
    running = false; phase = 'done'; hold = 0; dragging = false;
    const v = M.verdict(result);
    const base = fitAtLock ? M.score(cell, Math.min(M.AXIS, fitAtLock.eol), result.late ? eol : lockedAt) : {points: 0};
    totals[round] = {...result, verdict: v, basePoints: base.points, baseEol: fitAtLock ? fitAtLock.eol : Infinity};
    paintScore();
    const last = round === M.CELL_COUNT - 1, said = Number.isFinite(totals[round].baseEol) ? fmt(totals[round].baseEol) : 'never';
    const noKnee = cell.knee >= eol, baseLine = noKnee ? ` No knee here, so the baseline was right: it said ${said}.` : ` The baseline said ${said}.`;
    let line;
    if (result.late) line = `It hit 70% at cycle ${fmt(eol)} before you locked in.`;
    else if (v === 'miss') line = `You pinned ${fmt(pin)}, it hit 70% at ${fmt(eol)}. More than 10% out scores nothing.`;
    else {
      const warn = result.warning >= M.MAX_WARNING ? `${M.MAX_WARNING} cycles of warning (the most that counts)` : `${plural(result.warning, 'cycle')} of warning`;
      line = `Off by ${plural(Math.abs(result.off), 'cycle')}, with ${warn}.`;
    }
    // The box stays short so the chart shows; the full story goes to screen readers.
    const shown = noKnee ? line + ' No knee here, so the baseline was right.' : line;
    shell.setBox(`<div class="knee-bar"><div class="knee-info"><span class="arcade-label">CELL ${round + 1} OF ${M.CELL_COUNT} · ${result.points} POINTS</span>
      <p class="knee-help"><strong>${HEAD[v]}</strong> ${shown}</p></div>
      <button type="button" class="arcade-button arcade-primary arcade-big" data-next>${last ? 'See how you did' : 'Next cell'} <span aria-hidden="true">▶</span></button></div>`, 'is-play');
    shell.announce(`${HEAD[v]} ${line} ${result.points} points.${baseLine}`);
    const button = shell.box.querySelector('[data-next]'); button.focus({preventScroll: true});
    button.addEventListener('click', () => last ? finish() : startRound(round + 1), {once: true});
  }

  // The bar under the chart while a cell is live.
  function paintBar() {
    const button = shell.box.querySelector('[data-lock]');
    if (!button) return;
    button.disabled = pin == null || phase !== 'watch';
    button.innerHTML = phase === 'watch' ? 'Lock in <span aria-hidden="true">▶</span>' : 'Locked';
  }
  function startRound(index) {
    round = index; cell = cells[index]; data = M.points(cell); eol = M.endOfLife(cell);
    revealed = M.START; pin = null; lockedAt = null; anchor = null; result = null; phase = 'watch'; crossed = false; nagged = false;
    seenCount = -1; fit = null; fitAtLock = null; hold = 0; refit();
    setPose('idle'); shell.tag(`CELL ${index + 1}/${M.CELL_COUNT}`); shell.level(cell.label);
    const box = shell.setBox(`<div class="knee-bar"><p class="knee-help"><strong>Where will the dots cross the red line?</strong> <span class="only-mouse">Click the chart to pin it, or use ← and →.</span><span class="only-touch">Tap or drag on the chart to pin it.</span> Lock in early for more points, if you’re close.</p>
      <button type="button" class="arcade-button arcade-primary arcade-big" data-lock disabled>Lock in <span aria-hidden="true">▶</span></button></div>`, 'is-play');
    box.querySelector('[data-lock]').addEventListener('click', lock);
    running = true; hud = ''; el.dataset.phase = 'play'; shell.layout(); shell.focusPlay(); paintScore();
    shell.callout(index ? `CELL ${index + 1}` : 'GO', 'good');
    shell.announce(`Cell ${index + 1} of ${M.CELL_COUNT}, ${cell.label}. Data is coming in. Pin where it will hit 70% with the arrow keys, then press Space to lock in.`);
  }
  function finish() {
    el.dataset.phase = 'result';
    const sum = total(), stars = M.stars(sum), good = totals.filter(t => t.verdict === 'bullseye' || t.verdict === 'close').length;
    const baseSum = totals.reduce((a, t) => a + t.basePoints, 0);
    setPose(stars >= 2 ? 'defeated' : 'idle');
    const row = t => t.late ? 'Too late' : t.verdict === 'miss' ? `${Math.round(t.error * 100)}% out, 0 points` : `${Math.round(t.error * 100)}% out, ${t.points} points`;
    shell.result({
      title: TITLES[stars], stars,
      line: `${good} of ${M.CELL_COUNT} pins within 10%. Locking in at the same moments, the baseline would have scored ${baseSum}.`,
      rows: cells.map((c, i) => [`${i + 1}. ${c.label}${c.knee >= M.endOfLife(c) ? ', no knee' : ''}`, row(totals[i])]).concat([['Best run of close calls', String(bestStreak)], ['Total', `${sum} points`]]),
      source: `<p>These cells and curves are made up, shaped like the ones in the competition. None of the real data is used here, and it isn’t mine to publish. In the real competition there was no data at all from the cells being scored, only their temperature and C rate.</p>
        <p>The grey baseline fades as n to the power 0.8, like the organisers’ one, so it can’t bend down into a knee. That’s why it keeps saying the cell will last far longer than it does. My model gave the gradual fade and the knee their own terms, and let the knee fit to zero where a cell didn’t have one, like the cell here with no knee.</p>
        <p>The noise, the odd bad reading, the 10% cut off and the 400 cycle cap on warning are game rules.</p>`,
    });
  }

  function pointer(e) {
    if (!running || phase !== 'watch' || lockedAt != null || !geo) return;
    pin = clampPin(toCycle(e.clientX - el.getBoundingClientRect().left)); paintBar();
  }
  const onChart = e => { const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; return geo && x >= geo.mx && x <= geo.mx + geo.mw && y >= geo.my && y <= geo.my + geo.mh; };
  play.addEventListener('pointerdown', e => { if (!running || phase !== 'watch' || !onChart(e)) return; dragging = true; play.setPointerCapture(e.pointerId); pointer(e); });
  play.addEventListener('pointermove', e => { if (dragging) pointer(e); });
  ['pointerup', 'pointercancel'].forEach(t => play.addEventListener(t, () => { dragging = false; }));
  el.addEventListener('keydown', e => {
    if (!running || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const dir = e.key === 'ArrowLeft' ? -1 : 1; e.preventDefault();
      if (hold !== dir) { hold = dir; holdTime = 0; if (phase === 'watch' && lockedAt == null) { pin = clampPin((pin ?? Math.max(revealed + 300, 1000)) + (pin == null ? 0 : dir * 10)); paintBar(); } }
    } else if ((e.key === ' ' || e.key === 'Enter') && !e.target.closest('button,a')) { e.preventDefault(); lock(); }
  });
  el.addEventListener('keyup', e => { if (e.key === 'ArrowLeft' && hold < 0 || e.key === 'ArrowRight' && hold > 0) hold = 0; });

  async function begin() {
    const token = ++run; running = false; totals = []; streak = 0; bestStreak = 0; round = 0;
    cells = M.makeRun((Math.random() * 1e9) | 0); cell = cells[0]; data = M.points(cell); eol = M.endOfLife(cell);
    revealed = M.START; pin = null; lockedAt = null; anchor = null; result = null; phase = 'watch'; crossed = false; seenCount = -1; refit();
    el.dataset.phase = 'intro'; shell.meter(100, '100%', 'ok'); shell.score('SCORE', '0'); shell.tag(`CELL 1/${M.CELL_COUNT}`); shell.level(cell.label); setPose('idle');
    if (!introSeen) {
      await shell.intro({
        label: 'COMPUTER GUY VS THE KNEE', title: 'Find the knee.',
        text: 'A battery fades slowly, then hits a knee where the loss speeds up. For each of three cells, pin where the dots will cross the red 70% line, then lock in. Earlier is worth more, but a pin more than 10% out scores nothing. The grey dotted line is a baseline that can’t bend.',
        controls: [['Click', 'Pin it on the chart', 'mouse'], ['Tap', 'Pin it on the chart', 'touch'], ['← →', 'Move your pin', 'mouse'], ['Space', 'Lock in', 'mouse']], button: 'Start the test',
      });
      if (token !== run) return;
      introSeen = true;
    }
    startRound(0);
  }

  const game = {
    get running() { return running; },
    update, render, layout, restart() { begin(); }, destroy() { run++; running = false; },
  };
  shell.attach(game);
  begin();
  return shell;
}
