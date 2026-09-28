// Find the knee. Made up fade curves, shaped like a grid storage cell's: slow fade for years,
// then a knee where the loss speeds up, then end of life at 70% state of health.
// None of this is competition data. The baseline mirrors the organisers' approach, which fades
// as n to the power 0.8 and so can never bend downwards.
export const EOL = .7, AXIS = 2000, FLOOR = .6;
// Data starts at a fixed cycle and arrives at a fixed rate, so neither gives away the answer.
export const START = 160, SPEED = 135, REPLAY = 1100;
// How far off a pin can be and still score, as a share of the cell's life.
export const TOLERANCE = .1;
export const CLOSE = .1;
// Warning past this many cycles doesn't count: before the knee shows, an early pin is a guess.
export const MAX_WARNING = 400;
export const CELL_COUNT = 3;

function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const between = (r, lo, hi) => lo + r() * (hi - lo);

// One made up cell. life is where it reaches 70%; gap is how long before that the knee starts.
// A gap of 0 means no knee at all: the fade alone takes it to 70%, and the baseline is right.
export function makeCell({label, life, gap, a, p = 2, noise, seed, outliers = 0}) {
  const knee = gap ? life - gap : Infinity;
  const fadeAt = n => (gap ? a : (1 - EOL) / (life / 1000) ** .8) * (n / 1000) ** .8;
  const c = gap ? (1 - EOL - fadeAt(life)) / (gap / 1000) ** p : 0;
  const cell = {label, life, knee, a: gap ? a : (1 - EOL) / (life / 1000) ** .8, c, p, noise, seed, outliers};
  return Object.freeze(cell);
}

export function soh(cell, n) {
  let v = 1 - cell.a * (n / 1000) ** .8;
  if (n > cell.knee) v -= cell.c * ((n - cell.knee) / 1000) ** cell.p;
  return v;
}
export function endOfLife(cell) {
  let lo = 0, hi = 6000;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (soh(cell, mid) > EOL) lo = mid; else hi = mid; }
  return Math.round((lo + hi) / 2);
}

// Three cells for one run, different every time. The first is the gentlest. The other two are a
// hotter cell with a sharper knee and a cell with no knee, where trusting the steady trend is
// the right call, in either order.
export function makeRun(seed) {
  const r = rng(seed);
  const pick = list => list[Math.floor(r() * list.length)];
  const easy = makeCell({label: pick(['25 °C · 0.5C', '25 °C · 1C']), life: Math.round(between(r, 1450, 1750)), gap: Math.round(between(r, 450, 600)), a: between(r, .045, .06), p: 2, noise: .006, seed: 1 + Math.floor(r() * 1e6)});
  const hot = [
    {label: '35 °C · 1C', life: between(r, 1150, 1500), gap: between(r, 350, 500), a: between(r, .06, .08), p: between(r, 1.8, 2.2), noise: .008, outliers: 1},
    {label: '45 °C · 1C', life: between(r, 950, 1300), gap: between(r, 300, 450), a: between(r, .08, .1), p: between(r, 1.7, 2.3), noise: .01, outliers: 2},
    {label: '55 °C · 1C', life: between(r, 800, 1100), gap: between(r, 250, 380), a: between(r, .1, .13), p: between(r, 2, 2.6), noise: .011, outliers: 1},
  ];
  const rest = [pick(hot), {label: pick(['25 °C · 2C', '35 °C · 0.5C']), life: between(r, 1050, 1450), gap: 0, noise: .009, outliers: 1}];
  if (r() < .5) rest.reverse();
  return [easy, ...rest.map(c => makeCell({...c, life: Math.round(c.life), gap: Math.round(c.gap), seed: 1 + Math.floor(r() * 1e6)}))];
}

// Measured points every 20 cycles, with noise and the odd bad reading that isn't a knee.
export const STEP = 20;
export function points(cell) {
  const r = rng(cell.seed), out = [], eol = endOfLife(cell);
  const bad = new Set();
  for (let i = 0; i < cell.outliers; i++) bad.add(Math.round(between(r, 300, Math.max(320, Math.min(eol, cell.knee) - 120)) / STEP) * STEP);
  for (let n = 0; n <= AXIS; n += STEP) {
    let v = soh(cell, n);
    if (n) v += (r() + r() - 1) * cell.noise;
    if (bad.has(n)) v -= between(r, .022, .032);
    out.push({n, v});
  }
  return out;
}
// The baseline: fit 1 - k(n/1000)^0.8 to the points seen so far, and see where it says 70%.
export function baseline(seen) {
  let top = 0, bottom = 0;
  for (const p of seen) { const x = (p.n / 1000) ** .8; top += x * (1 - p.v); bottom += x * x; }
  const k = bottom ? top / bottom : 0;
  return {k, eol: k > 0 ? Math.round(1000 * ((1 - EOL) / k) ** 1.25) : Infinity};
}

// Points are the cycles of warning you gave, times how close your pin was.
// A pin 20% or more off the real end of life scores nothing, however early it was.
export function score(cell, pin, lockedAt) {
  const eol = endOfLife(cell);
  if (pin == null || lockedAt >= eol) return {points: 0, late: true, eol, error: null, warning: 0, accuracy: 0, off: null};
  const off = pin - eol, error = Math.abs(off) / eol, warning = Math.min(MAX_WARNING, eol - lockedAt);
  const accuracy = Math.max(0, 1 - error / TOLERANCE);
  return {points: Math.round(warning * accuracy), late: false, eol, error, warning, accuracy, off};
}
export const verdict = r => r.late ? 'late' : r.error < .03 ? 'bullseye' : r.error < CLOSE ? 'close' : r.error < TOLERANCE ? 'rough' : 'miss';
export const STAR_SCORES = Object.freeze([150, 390, 630]);
export const stars = total => STAR_SCORES.filter(n => total >= n).length;
