// Bridge Test: Engineer Jackson versus Test Day, the radio controlled car.
import {createShell} from './shell.mjs?v=4';
import {pen, INK, PAPER} from './pixels.mjs?v=3';
import {drawBoss} from './bosses.mjs?v=3';
import * as M from './bridge-model.mjs?v=3';

const BALSA = '#e0c68f', DECK = '#6b5a45', BENCH = '#a07a45', STEEL = '#7a7f86', GOOD = '#3e7654', BAD = '#ad343c';
const REASONS = {long: 'TOO LONG', floating: 'START FROM A JOINT', exists: 'ALREADY THERE', budget: 'OUT OF STICKS', bench: 'THAT’S THE BENCH', outside: 'OFF THE GRID'};
const FINAL = ['Test Day wins this one.', 'It held, mostly.', 'The bridge held the car.', 'Full marks from Test Day.'];
const mix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
const same = (a, b) => a && b && a[0] === b[0] && a[1] === b[1];
const starText = n => '★'.repeat(n) + '☆'.repeat(3 - n);

export function start(root, {key, characters, onExit}) {
  const shell = createShell(root, {key, characters, boss: 'Test Day', meterLabel: 'STICKS', onExit, scene: 'far', reserve: [104, 150]});
  const {el, play} = shell, p = pen(play);
  play.setAttribute('aria-label', 'Bridge grid. Arrow keys move the cursor, Space picks a joint and places a stick, Backspace undoes, T sends the car.');
  const sprites = shell.$('.arcade-sprites');
  sprites.innerHTML = `<img class="bridge-jackson" src="${shell.char.art}" alt="" width="537" height="840"><canvas class="bridge-car" width="64" height="64"></canvas>`;
  const car = sprites.querySelector('.bridge-car'), jackson = sprites.querySelector('.bridge-jackson');
  let level = 0, designs = [], best = [], fails = [], phase = 'build', test = null, running = false, run = 0, introSeen = false;
  let geo = null, selected = null, ghost = null, hover = null, cursor = [0, 0], keyboard = false, dragging = false, warning = null, debris = [], pose = '', settle = 0;

  function setPose(next) { if (next !== pose) { pose = next; drawBoss(car, 'builder', next); } }
  setPose('idle');

  function layout() {
    const top = shell.$('.arcade-top'), W = el.offsetWidth, g = M.LEVELS[level].gap;
    const playTop = top.offsetTop + top.offsetHeight + 8, playBottom = shell.playBottom() - 8, H = playBottom - playTop;
    const s = Math.max(24, Math.min(W / (g + 3.2), H / 7.4, 104));
    const X0 = Math.round(W / 2 - g * s / 2), Y0 = Math.round(playTop + 3.5 * s);
    geo = {W, s, X0, Y0, g, floorY: Math.min(playBottom + 4, Y0 + 3.9 * s), playTop, unit: W >= 900 ? 4 : 3};
    const size = 1.3 * s * 64 / 60; car.style.width = car.style.height = size + 'px'; geo.car = size;
    const jh = Math.min(2.6 * s, 300), jw = jh * 537 / 840, jx = X0 + (g + 1.7) * s - jw / 2;
    jackson.hidden = W < 760 || jx + jw > W - 8;
    Object.assign(jackson.style, {height: jh + 'px', left: jx + 'px', top: Y0 - jh + 2 + 'px'});
  }
  shell.floor = (h, unit) => geo ? Math.round(geo.floorY / unit) : Math.round(h * .8);
  const px = ([x, y]) => [geo.X0 + x * geo.s, geo.Y0 + y * geo.s];
  function toGrid(e) {
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left - geo.X0) / geo.s, y = (e.clientY - r.top - geo.Y0) / geo.s;
    const at = [Math.round(x), Math.round(y)];
    return {at, near: Math.hypot(x - at[0], y - at[1]) < .42, x, y};
  }
  const design = () => designs[level];

  function render(dt) {
    if (!geo) return;
    p.clear();
    const C = 2, {s, X0, Y0, g, floorY} = geo, W = geo.W;
    // Workshop floor, then two benches with the gap between them.
    p.r(0, floorY / C, W / C, (el.offsetHeight - floorY) / C + 1, '#b8b0a2');
    for (let i = 0; i < W * 2; i += 37) p.r((i * 7) % W / C, (floorY + (i * 13) % Math.max(1, el.offsetHeight - floorY)) / C, 1, 1, '#a59d8f');
    p.r(0, floorY / C, W / C, 1, '#8f877a');
    [[0, X0], [X0 + g * s, W]].forEach(([a, b], side) => {
      const x = a / C, w = (b - a) / C, top = Y0 / C, slab = Math.max(3, s * .2 / C);
      p.r(x, top + slab, w, (floorY - Y0) / C - slab, '#6b4f3a');
      for (let lx = side ? x + w - 10 : x + 6; side ? lx > x : lx < x + w; lx += side ? -34 : 34) p.r(lx, top + slab, 4, (floorY - Y0) / C - slab, '#5a4230');
      p.r(x, top, w, slab, BENCH); p.r(x, top, w, 1, mix(BENCH, PAPER, .35)); p.r(x, top + slab, w, 1, INK);
      const edge = side ? x : x + w, plate = Math.max(3, s * .16 / C);
      p.r(edge - (side ? 0 : plate), top, plate, 2.35 * s / C, STEEL); p.r(edge - (side ? 0 : plate), top, 1, 2.35 * s / C, INK);
    });
    const d = design(), live = phase !== 'build' && test;
    // Grid dots while building.
    if (!live) for (let x = 0; x <= g; x++) for (let y = M.TOP; y <= M.BOTTOM; y++) {
      if (!M.inGrid(d, [x, y]) || ((x === 0 || x === g) && y > 0)) continue;
      const [gx, gy] = px([x, y]); p.r(gx / C - 1, gy / C - 1, 3, 3, 'rgba(41,42,44,.5)');
    }
    const lineW = Math.max(2, Math.round(s * .1 / C));
    const stick = (a, b, col, w = lineW) => { p.line(a[0] / C, a[1] / C, b[0] / C, b[1] / C, INK, w + 2); p.line(a[0] / C, a[1] / C, b[0] / C, b[1] / C, col, w); };
    if (live) {
      const nodes = test.nodes, at = n => [X0 + nodes[n].x * s, Y0 + nodes[n].y * s];
      test.beams.forEach(b => {
        if (b.broken) return;
        const load = Math.min(1, Math.abs(b.force) / M.BREAK), col = load < .5 ? mix(b.deck ? DECK : BALSA, '#d9822b', load * 2) : mix('#d9822b', BAD, (load - .5) * 2);
        stick(at(b.i), at(b.j), b.deck && load < .25 ? DECK : col, b.deck ? lineW + 2 : lineW);
      });
      for (const piece of debris) stick([piece.x - piece.dx, piece.y - piece.dy], [piece.x + piece.dx, piece.y + piece.dy], piece.col, piece.w);
      nodes.forEach((n, i) => { if (!n.fixed) { const [x, y] = at(i); p.disc(x / C, y / C, lineW, INK); p.disc(x / C, y / C, lineW - 1, PAPER); } });
    } else {
      for (let x = 0; x < g; x++) stick(px([x, 0]), px([x + 1, 0]), DECK, lineW + 2);
      d.sticks.forEach(k => stick(px(k.a), px(k.b), BALSA));
      if (selected && ghost && !same(selected, ghost)) {
        const why = M.problem(d, selected, ghost);
        stick(px(selected), px(ghost), why ? BAD : GOOD, Math.max(1, lineW - 1));
        if (why && REASONS[why]) { const [gx, gy] = px(ghost); p.tag(REASONS[why], gx / C, gy / C - 14, PAPER, BAD); }
      }
      M.joints(d).forEach(j => { if ((j[0] === 0 || j[0] === g) && j[1] >= 0) return; const [x, y] = px(j); p.disc(x / C, y / C, lineW + 1, INK); p.disc(x / C, y / C, lineW, PAPER); });
    }
    // Bolts on the benches.
    M.anchors(level).forEach(a => { const [x, y] = px(a); p.disc(x / C, y / C, lineW + 2, INK); p.disc(x / C, y / C, lineW + 1, '#c9ccd0'); p.r(x / C - 1, y / C - 1, 2, 2, INK); });
    if (!live) {
      const mark = keyboard ? cursor : hover;
      if (mark) { const [x, y] = px(mark), r = lineW + 5; p.r(x / C - r, y / C - r, r * 2, 1, INK); p.r(x / C - r, y / C + r, r * 2 + 1, 1, INK); p.r(x / C - r, y / C - r, 1, r * 2, INK); p.r(x / C + r, y / C - r, 1, r * 2, INK); }
      if (selected) { const [x, y] = px(selected); p.disc(x / C, y / C, lineW + 3, GOOD); p.disc(x / C, y / C, lineW + 1, PAPER); }
      if (warning) { const [x, y] = px(warning.at); p.tag(warning.text, x / C, y / C - 14, PAPER, BAD); warning.life -= dt; if (warning.life <= 0) warning = null; }
    }
    // Test Day waits on the left bench, then drives across.
    const cx = X0 + (test ? test.car : -1.1) * s, cy = Y0 + (test ? test.carY : 0) * s - lineW * C, angle = test ? test.carAngle : 0;
    car.style.transform = `translate(${Math.round(cx - geo.car / 2)}px,${Math.round(cy - geo.car * 58 / 64)}px) rotate(${angle.toFixed(3)}rad) scaleX(-1)`;
  }

  function update(dt) {
    if (!test) return;
    const events = M.stepTest(test, dt);
    for (const e of events) {
      if (e.type === 'snap') {
        const b = test.beams[e.beam], a = test.nodes[b.i], c = test.nodes[b.j];
        const x = geo.X0 + e.x * geo.s, y = geo.Y0 + e.y * geo.s, dx = (c.x - a.x) * geo.s / 4, dy = (c.y - a.y) * geo.s / 4;
        const col = b.deck ? DECK : BAD, w = Math.max(2, Math.round(geo.s * .1 / 2));
        debris.push({x: x - dx, y: y - dy, dx, dy, vx: -40 - Math.random() * 60, vy: -120, spin: -3, col, w}, {x: x + dx, y: y + dy, dx, dy, vx: 40 + Math.random() * 60, vy: -110, spin: 3, col, w});
        shell.burst(x, y, [BALSA, '#fff7e0', INK], 12); shell.shake(b.deck);
      }
      if (e.type === 'fall') { shell.callout('COLLAPSED', 'big'); shell.shake(true); setPose('attack'); }
      if (e.type === 'held') { shell.callout('IT HELD', 'win'); setPose('hit'); }
      if (e.type === 'held' || e.type === 'failed') { settle = .9; }
    }
    for (const d of debris) {
      d.vy += 900 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
      const turn = d.spin * dt, cos = Math.cos(turn), sin = Math.sin(turn);
      [d.dx, d.dy] = [d.dx * cos - d.dy * sin, d.dx * sin + d.dy * cos];
    }
    debris = debris.filter(d => d.y < geo.floorY + 60);
    if (test.done) { settle -= dt; if (settle <= 0) finishTest(); }
  }

  function paintHud() {
    const info = M.LEVELS[level], used = design().sticks.length;
    shell.level(`TEST ${level + 1}/${M.LEVELS.length}`);
    shell.meter(used / info.budget * 100, `${used}/${info.budget}`, used >= info.budget ? 'bad' : used > info.stars[1] ? 'warn' : 'ok');
    shell.tag(`★★★ ≤ ${info.stars[2]} · ★★ ≤ ${info.stars[1]}`);
    shell.score('STARS', `${best.reduce((a, b) => a + (b || 0), 0)}/${M.LEVELS.length * 3}`);
  }
  function hintFor() {
    const n = fails[level] || 0;
    if (!n) return level === 0 ? 'Drag from a joint to add a stick. Tap a stick to take it away.' : 'Test Day brought the full load. Your bridge is still here, so make it stronger.';
    const tips = level === 0 ? ['Triangles keep their shape. Squares fold.', 'Try the bolts lower down on the benches.']
      : ['Brace it from the lower bolts on both benches.', 'Triangles all the way across, and use the full height.'];
    return tips[Math.min(n, tips.length) - 1];
  }
  function buildBox(message = hintFor()) {
    const info = M.LEVELS[level], box = shell.setBox(`<div class="bridge-bar">
      <div class="bridge-info"><span class="arcade-label">TEST ${level + 1} OF ${M.LEVELS.length} · ${info.name.toUpperCase()}</span><p class="bridge-hint">${message}</p></div>
      <div class="bridge-buttons"><button type="button" class="arcade-button" data-undo>Undo</button><button type="button" class="arcade-button" data-clear>Clear</button><button type="button" class="arcade-button arcade-primary" data-test>Send the car <span aria-hidden="true">▶</span></button></div></div>`, 'is-play');
    box.querySelector('[data-undo]').addEventListener('click', undo);
    box.querySelector('[data-clear]').addEventListener('click', () => { design().sticks = []; selected = null; changed('Cleared.'); });
    box.querySelector('[data-test]').addEventListener('click', runTest);
  }
  function changed(message) { paintHud(); shell.announce(message + ` ${design().sticks.length} of ${M.LEVELS[level].budget} sticks used.`); }
  function undo() { if (phase !== 'build' || !design().sticks.length) return; design().sticks.pop(); selected = null; changed('Removed the last stick.'); }
  function place(a, b) {
    const why = M.problem(design(), a, b);
    if (why) { if (REASONS[why]) { warning = {at: b, text: REASONS[why], life: 1.1}; shell.announce(REASONS[why].toLowerCase() + '.'); } return false; }
    M.addStick(design(), a, b);
    const [x1, y1] = px(a), [x2, y2] = px(b); shell.burst((x1 + x2) / 2, (y1 + y2) / 2, [BALSA, '#fff7e0'], 6);
    changed('Stick added.'); return true;
  }
  function stickAt(e) {
    const {x, y} = toGrid(e);
    return design().sticks.findIndex(k => {
      const [ax, ay] = k.a, [bx, by] = k.b, len = (bx - ax) ** 2 + (by - ay) ** 2;
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / len));
      return Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay)) < .2;
    });
  }

  play.addEventListener('pointerdown', e => {
    if (phase !== 'build' || !geo) return;
    keyboard = false;
    const hit = toGrid(e);
    if (hit.near && M.inGrid(design(), hit.at)) {
      if (selected && !same(selected, hit.at)) { place(selected, hit.at); selected = null; return; }
      if (M.isJoint(design(), hit.at)) { selected = hit.at; ghost = hit.at; dragging = true; play.setPointerCapture(e.pointerId); return; }
    }
    const index = stickAt(e);
    if (index >= 0) { M.removeStick(design(), index); selected = null; changed('Stick removed.'); return; }
    selected = null;
  });
  play.addEventListener('pointermove', e => {
    if (!geo || phase !== 'build') return;
    const hit = toGrid(e), inside = M.inGrid(design(), hit.at);
    hover = hit.near && inside ? hit.at : null;
    if (selected) ghost = inside ? hit.at : null;
  });
  play.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    if (ghost && !same(ghost, selected)) { place(selected, ghost); selected = null; ghost = null; }
  });
  play.addEventListener('pointerleave', () => { hover = null; });
  el.addEventListener('keydown', e => {
    if (phase !== 'build' || e.altKey || e.ctrlKey || e.metaKey || e.target.closest('button,a,summary')) return;
    const k = e.key, g = M.LEVELS[level].gap, moves = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]};
    if (moves[k]) {
      e.preventDefault(); keyboard = true;
      const next = [Math.max(0, Math.min(g, cursor[0] + moves[k][0])), Math.max(M.TOP, Math.min(M.BOTTOM, cursor[1] + moves[k][1]))];
      if (M.inGrid(design(), next)) cursor = next;
      ghost = selected ? cursor : null;
      shell.announce(`${cursor[0]} across, ${-cursor[1]} ${cursor[1] > 0 ? 'down' : 'up'}${M.isJoint(design(), cursor) ? ', joint' : ''}.`);
    } else if (k === ' ' || k === 'Enter') {
      e.preventDefault(); keyboard = true;
      if (!selected) { if (M.isJoint(design(), cursor)) { selected = cursor; ghost = cursor; shell.announce('Joint picked. Move to where the stick should end, then press Space.'); } else shell.announce('Start from a joint.'); }
      else if (place(selected, cursor)) { selected = cursor; ghost = cursor; }
    } else if (k === 'Escape' && selected) { e.preventDefault(); e.stopPropagation(); selected = null; ghost = null; shell.announce('Cancelled.'); }
    else if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); undo(); }
    else if (k.toLowerCase() === 't') { e.preventDefault(); runTest(); }
  });

  function runTest() {
    if (phase !== 'build') return;
    phase = 'test'; selected = null; ghost = null; hover = null; debris = [];
    test = M.createTest(design()); running = true; setPose('idle'); el.dataset.phase = 'test';
    shell.setBox(`<div class="bridge-bar"><div class="bridge-info"><span class="arcade-label">TEST ${level + 1} OF ${M.LEVELS.length} · TESTING</span><p class="bridge-hint">Test Day is driving across.</p></div>
      <div class="bridge-buttons"><button type="button" class="arcade-button" data-stop>Stop</button></div></div>`, 'is-play');
    shell.box.querySelector('[data-stop]').addEventListener('click', edit);
    shell.callout('TEST DAY', ''); shell.announce('Test Day is driving across your bridge.');
    shell.focusPlay();
  }
  function edit() { running = false; phase = 'build'; test = null; debris = []; setPose('idle'); el.dataset.phase = 'build'; buildBox(); paintHud(); shell.focusPlay(); }
  function finishTest() {
    if (phase !== 'test') return;
    running = false; phase = 'after';
    const info = M.LEVELS[level], used = design().sticks.length, held = test.held, stars = M.stars(level, used, held);
    if (held) best[level] = Math.max(best[level] || 0, stars); else fails[level] = (fails[level] || 0) + 1;
    paintHud();
    const last = level === M.LEVELS.length - 1, nextStar = stars < 3 ? ` ${stars === 1 ? 'Two' : 'Three'} stars needs ${info.stars[stars]} sticks or fewer.` : '';
    const buttons = held
      ? `<button type="button" class="arcade-button arcade-primary arcade-big" data-next>${last ? 'See how you did' : 'The full load'} <span aria-hidden="true">▶</span></button><button type="button" class="arcade-button arcade-big" data-edit>${stars < 3 ? 'Make it lighter' : 'Edit the bridge'}</button>`
      : `<button type="button" class="arcade-button arcade-primary arcade-big" data-edit>Edit the bridge</button><button type="button" class="arcade-button arcade-big" data-clear>Start it again</button>${fails[level] >= 2 ? `<button type="button" class="arcade-button arcade-big" data-next>Skip this level</button>` : ''}`;
    shell.setBox(`<span class="arcade-label">TEST ${level + 1} OF ${M.LEVELS.length} · ${held ? 'HELD' : 'COLLAPSED'}</span>
      <div class="arcade-result-head"><h2 class="arcade-title" tabindex="-1">${held ? 'It held.' : 'It didn’t hold.'}</h2><span class="arcade-stars" aria-label="${stars} out of 3 stars">${starText(stars)}</span></div>
      <p class="arcade-text">${held ? `${used} ${used === 1 ? 'stick' : 'sticks'}.${nextStar}` : hintFor()}</p>
      <div class="arcade-actions">${buttons}</div>`, 'is-break');
    shell.announce(held ? `It held, with ${used} sticks. ${stars} out of 3 stars.${nextStar}` : `It didn’t hold. ${hintFor()}`);
    const box = shell.box;
    box.querySelector('[data-edit]')?.addEventListener('click', edit);
    box.querySelector('[data-clear]')?.addEventListener('click', () => { design().sticks = []; edit(); });
    box.querySelector('[data-next]')?.addEventListener('click', () => last ? finish() : startLevel(level + 1));
    box.querySelector('.arcade-title').focus({preventScroll: true});
  }
  function startLevel(index) {
    level = index; phase = 'build'; test = null; debris = []; selected = null; ghost = null; cursor = [0, 0];
    designs[index] = designs[index] || M.createDesign(index, designs[index - 1]);
    setPose('idle'); el.dataset.phase = 'build'; buildBox(); shell.layout(); paintHud();
    if (index) shell.callout(M.LEVELS[index].name.toUpperCase(), 'good');
    shell.announce(`Test ${index + 1} of ${M.LEVELS.length}, ${M.LEVELS[index].name}. ${hintFor()}`);
    shell.focusPlay();
  }
  function finish() {
    phase = 'done'; el.dataset.phase = 'result';
    const stars = M.overall(best);
    setPose(stars >= 2 ? 'hit' : 'idle');
    shell.result({
      title: FINAL[stars], stars,
      line: 'Ours was the only bridge in the group that held the car.',
    });
  }

  async function begin() {
    const token = ++run; running = false; level = 0; designs = []; best = []; fails = [];
    designs[0] = M.createDesign(0); phase = 'intro'; test = null; el.dataset.phase = 'intro'; paintHud(); setPose('idle');
    if (!introSeen) {
      shell.layout();
      await shell.intro({
        label: 'ENGINEER VS TEST DAY', title: 'Bridge the gap.',
        text: 'Build a balsa bridge between the benches, then send the car across. Sticks go red as they strain and snap if you ask too much. Two tests: a light car, then the full load on the same bridge. Fewer sticks means more stars.',
        controls: [['Drag', 'From a joint to add a stick'], ['Tap', 'A stick to remove it'], ['Arrows, Space', 'Build with the keyboard', 'mouse'], ['T', 'Send the car', 'mouse']],
        button: 'Start building',
      });
      if (token !== run) return;
      introSeen = true;
    }
    startLevel(0);
  }

  const game = {
    get running() { return running; },
    update, render, layout,
    restart() { begin(); },
    destroy() { run++; running = false; },
  };
  shell.attach(game);
  begin();
  return shell;
}
