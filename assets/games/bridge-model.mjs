// Bridge Test. A balsa bridge between two workbenches, and Test Day drives across it.
// A small 2D spring model, simplified on purpose. It isn't the analysis we did for the
// real bridge, and it can't show sideways collapse, which was the real problem.
// Grid units: the deck runs along y = 0 from x = 0 to x = gap, and y points down.
export const LEVELS = Object.freeze([
  {name: 'Short gap', gap: 4, load: 30, budget: 12, stars: [12, 6, 3]},
  {name: 'Wider gap', gap: 6, load: 30, budget: 16, stars: [16, 11, 8]},
  {name: 'Full load', gap: 6, load: 46, budget: 18, stars: [18, 13, 9]},
].map(Object.freeze));
export const MAX_STICK = 2.25, TOP = -3, BOTTOM = 3, BREAK = 60;
const K = 3000, GRAVITY = 10, DAMP = 40, AIR = .6, SUB = 8, SETTLE = .9, SPEED = 1.1, AXLE = .42;

const key = ([x, y]) => x + ',' + y;
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

export function anchors(level) {
  const g = LEVELS[level].gap;
  return [[0, 0], [0, 1], [0, 2], [g, 0], [g, 1], [g, 2]];
}
export function deckJoints(level) {
  const g = LEVELS[level].gap;
  return Array.from({length: g + 1}, (_, x) => [x, 0]);
}
export function createDesign(level) {
  if (!LEVELS[level]) throw new RangeError('No such level');
  return {level, sticks: []};
}
export function joints(design) {
  const seen = new Map();
  [...anchors(design.level), ...deckJoints(design.level), ...design.sticks.flatMap(s => [s.a, s.b])].forEach(p => seen.set(key(p), p));
  return [...seen.values()];
}
export function isJoint(design, p) { return joints(design).some(q => same(p, q)); }
export function length(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }
export function inGrid(design, [x, y]) {
  const g = LEVELS[design.level].gap;
  if ((x === 0 || x === g) && y === BOTTOM) return false;
  return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x <= g && y >= TOP && y <= BOTTOM;
}
const deckPair = (level, a, b) => a[1] === 0 && b[1] === 0 && Math.abs(a[0] - b[0]) === 1;

// Why a stick can't go there, or '' if it can.
export function problem(design, a, b) {
  if (!inGrid(design, a) || !inGrid(design, b)) return 'outside';
  if (same(a, b)) return 'same';
  if (!isJoint(design, a) && !isJoint(design, b)) return 'floating';
  if (length(a, b) > MAX_STICK + 1e-9) return 'long';
  if (deckPair(design.level, a, b)) return 'exists';
  if (design.sticks.some(s => (same(s.a, a) && same(s.b, b)) || (same(s.a, b) && same(s.b, a)))) return 'exists';
  const bench = p => p[0] === 0 || p[0] === LEVELS[design.level].gap;
  if (a[0] === b[0] && bench(a) && a[1] >= 0 && b[1] >= 0) return 'bench';
  if (design.sticks.length >= LEVELS[design.level].budget) return 'budget';
  return '';
}
export function addStick(design, a, b) {
  if (problem(design, a, b)) return false;
  design.sticks.push({a: [...a], b: [...b]});
  return true;
}
export function removeStick(design, index) { return design.sticks.splice(index, 1).length === 1; }
export function stars(level, sticks, held) {
  if (!held) return 0;
  return LEVELS[level].stars.filter(n => sticks <= n).length;
}

export function createTest(design) {
  const level = LEVELS[design.level], g = level.gap, fixed = new Set(anchors(design.level).map(key));
  const index = new Map(), nodes = [];
  for (const p of joints(design)) {
    index.set(key(p), nodes.length);
    nodes.push({x: p[0], y: p[1], vx: 0, vy: 0, fx: 0, fy: 0, m: .6, w: .4, fixed: fixed.has(key(p))});
  }
  const beams = [];
  const beam = (a, b, deck) => {
    const i = index.get(key(a)), j = index.get(key(b)), rest = length(a, b);
    beams.push({i, j, rest, deck, force: 0, broken: false});
    // Balsa is light: a stick's weight is small next to the car's.
    nodes[i].m += rest * .2; nodes[j].m += rest * .2; nodes[i].w += rest * .3; nodes[j].w += rest * .3;
  };
  for (let x = 0; x < g; x++) beam([x, 0], [x + 1, 0], true);
  design.sticks.forEach(s => beam(s.a, s.b, false));
  return {level: design.level, gap: g, load: level.load, nodes, beams, deck: Array.from({length: g + 1}, (_, x) => index.get(key([x, 0]))),
    t: 0, car: -1.1, carY: 0, carAngle: 0, carVy: 0, falling: false, done: false, held: false, peak: 0};
}

function deckAt(test, x) {
  const i = Math.floor(x), f = x - i;
  const a = test.nodes[test.deck[i]], b = test.nodes[test.deck[i + 1]];
  return {i, f, a, b, beam: test.beams[i], y: a.y + (b.y - a.y) * f, angle: Math.atan2(b.y - a.y, b.x - a.x)};
}

function substep(test, dt, events) {
  const {nodes, beams} = test;
  for (const n of nodes) { n.fx = 0; n.fy = n.w; }
  // The car's two axles load the deck joints either side of them.
  if (!test.falling && test.t > SETTLE) for (const ax of [test.car - AXLE, test.car + AXLE]) {
    if (ax <= 0 || ax >= test.gap) continue;
    const d = deckAt(test, ax), w = test.load / 2;
    d.a.fy += w * (1 - d.f); d.b.fy += w * d.f;
  }
  for (const b of beams) {
    if (b.broken) continue;
    const p = nodes[b.i], q = nodes[b.j], dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1e-6;
    const ux = dx / len, uy = dy / len, stretch = (q.vx - p.vx) * ux + (q.vy - p.vy) * uy;
    b.force = K * (len - b.rest) / b.rest;
    const f = b.force + DAMP * stretch;
    p.fx += f * ux; p.fy += f * uy; q.fx -= f * ux; q.fy -= f * uy;
  }
  for (const n of nodes) {
    if (n.fixed) continue;
    const air = 1 - (test.t < SETTLE ? 8 : AIR) * dt;
    n.vx = (n.vx + n.fx / n.m * dt) * air; n.vy = (n.vy + n.fy / n.m * dt) * air;
    n.x += n.vx * dt; n.y += n.vy * dt;
  }
  // Balsa is weak: past the limit a stick snaps. Give the bridge a moment to settle first.
  if (test.t > SETTLE * .5) for (const [index, b] of beams.entries()) {
    if (b.broken) continue;
    test.peak = Math.max(test.peak, Math.abs(b.force) / BREAK);
    if (Math.abs(b.force) > BREAK) { b.broken = true; events.push({type: 'snap', beam: index, deck: b.deck, x: (nodes[b.i].x + nodes[b.j].x) / 2, y: (nodes[b.i].y + nodes[b.j].y) / 2}); }
  }
}

export function stepTest(test, dt) {
  const events = [];
  if (test.done) return events;
  const h = dt / SUB;
  for (let n = 0; n < SUB; n++) { test.t += h; substep(test, h, events); }
  if (test.t > SETTLE && !test.falling) {
    test.car += SPEED * dt;
    let lowest = -Infinity, angle = 0, drop = false;
    for (const ax of [test.car - AXLE, test.car + AXLE]) {
      if (ax <= 0 || ax >= test.gap) { lowest = Math.max(lowest, 0); continue; }
      const d = deckAt(test, ax);
      if (d.beam.broken) drop = true;
      lowest = Math.max(lowest, d.y); angle = d.angle;
    }
    test.carY = lowest; test.carAngle = angle;
    if (drop || lowest > 1.6) { test.falling = true; test.carVy = 0; events.push({type: 'fall'}); }
    else if (test.car - AXLE > test.gap + .2) { test.done = true; test.held = true; events.push({type: 'held'}); }
  }
  if (test.falling) {
    test.carVy += GRAVITY * 1.4 * dt; test.carY += test.carVy * dt; test.carAngle += .9 * dt;
    if (test.carY > 7) { test.done = true; test.held = false; events.push({type: 'failed'}); }
  }
  return events;
}

// Runs a whole test without drawing it. Used by tests and to check the reference designs.
export function runTest(design, dt = 1 / 60, limit = 30) {
  const test = createTest(design), snaps = [];
  while (!test.done && test.t < limit) stepTest(test, dt).forEach(e => { if (e.type === 'snap') snaps.push(e); });
  return {held: test.held, snaps: snaps.length, peak: test.peak, time: test.t};
}
