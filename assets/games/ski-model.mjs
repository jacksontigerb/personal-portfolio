// Last run. Get down before the last chair goes. Units are metres: x across the hill, y down it.
// Heading 0 points straight down the fall line; a positive heading travels towards +x.
// Everything here is made up for the game: the hill, the speeds, the lift times.
export const LENGTH = 545, LIMIT = 45, GATE_GAP = 6, LIFT_X = -20;
export const GATE_BONUS = 1, CLEAN_BONUS = .5, SKIM_BONUS = .3, AIR_BONUS = 1;
export const MAX_HEAD = 1.5;
const G = 3.3, DRAG = .0115, TUCK = .7, ROLL = .25, POWDER = .5, POWDER_DRAG = .008;
const CARVE_R = 14, MIN_CARVE = .9, PIVOT = 3.6, GAIN = 5, SKID_LOSS = 1.5, CRASH = 1.8, LATE = 8;

// The run from top to bottom. Pitch scales gravity; off is the pitch through the trees beside a
// flat cat track, which is the shortcut.
export const SECTIONS = [
  {key: 'top', y0: -52, y1: 39, pitch: 1.25, name: 'LAST RUN'},
  {key: 'cruise', y0: 39, y1: 130, pitch: 1, name: 'THE BLUE'},
  {key: 'wall', y0: 130, y1: 222, pitch: 1.75, name: 'THE WALL'},
  {key: 'kicker', y0: 222, y1: 257, pitch: 1.05, name: 'KICKER'},
  {key: 'moguls', y0: 257, y1: 318, pitch: 1.15, name: 'MOGULS'},
  {key: 'trees', y0: 318, y1: 444, pitch: .4, off: 1.75, name: 'THE TREES'},
  {key: 'runout', y0: 444, y1: 513, pitch: 1, name: 'RUN OUT'},
  {key: 'bottom', y0: 513, y1: 1453, pitch: .45, name: 'LAST CHAIR'},
];
// The piste's centre line and half width, eased between these points.
const PATH = [[-52, 0, 14], [26, 0, 13], [67, -12, 10], [105, 11, 10], [130, 2, 13], [173, -6, 13], [222, 4, 14], [257, 0, 13], [318, 2, 12], [344, 14, 6], [367, 30, 5], [403, 30, 5], [444, 8, 11], [476, -12, 10], [503, 4, 13], [519, 0, 17], [583, 0, 22]];
export const GLADE = {y0: 284, y1: 388};

export function piste(y) {
  let i = 0;
  while (i < PATH.length - 2 && y > PATH[i + 1][0]) i++;
  const [y0, c0, h0] = PATH[i], [y1, c1, h1] = PATH[i + 1];
  const t = Math.max(0, Math.min(1, (y - y0) / (y1 - y0))), e = (1 - Math.cos(Math.PI * t)) / 2;
  return {cx: c0 + (c1 - c0) * e, hw: h0 + (h1 - h0) * e};
}
export const onPiste = (x, y) => { const p = piste(y); return Math.abs(x - p.cx) <= p.hw; };
export const sectionAt = y => SECTIONS.find(s => y < s.y1) || SECTIONS[SECTIONS.length - 1];
export function pitch(x, y) { const s = sectionAt(y); return s.off && !onPiste(x, y) ? s.off : s.pitch; }
export const inGlade = (x, y) => y > GLADE.y0 && y < GLADE.y1 && x > -16 && x < piste(y).cx - piste(y).hw;
// How fast you can turn on a clean edge. Anything sharper is a skid, which scrubs speed.
export const carveRate = speed => Math.max(MIN_CARVE, speed / CARVE_R);
// The heading to aim for so the skier turns on a clean edge in a direction (-1, 0 or 1).
export const edgeTarget = (s, dir) => s.head + dir * carveRate(s.speed) / GAIN;

function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// The course: gates, kickers, a mogul field, trees and rocks.
export function course(seed = 7) {
  const r = rng(seed), gates = [], things = [], bumps = [], jumps = [];
  const at = y => piste(y);
  const gateRows = [54, 82, 110, 153, 183, 212, 463, 491];
  gateRows.forEach((y0, i) => {
    const y = y0 + (r() - .5) * 6, p = at(y), side = i % 2 ? 1 : -1;
    gates.push({x: p.cx + side * (2 + r() * Math.min(4, p.hw - 5)), y, passed: null});
  });
  const k1 = 232, k2 = 452, s2 = r() < .5 ? -1 : 1;
  jumps.push({x: at(k1).cx + (r() - .5) * 4, y: k1, w: 5}, {x: at(k2).cx + s2 * 6, y: k2, w: 4});
  // Moguls in staggered rows with troughs between them.
  for (let y = 264, row = 0; y < 311; y += 2.7, row++) {
    const p = at(y);
    for (let x = p.cx - p.hw + 1 + (row % 2) * 1.6; x < p.cx + p.hw - .8; x += 3.2) if (r() > .12) bumps.push({x: x + (r() - .5) * .4, y: y + (r() - .5) * .4});
  }
  const nearGate = (x, y) => gates.some(g => Math.abs(g.y - y) < 6 && Math.abs(g.x - x) < GATE_GAP / 2 + 2);
  const nearJump = (x, y) => jumps.some(j => y > j.y - 16 && y < j.y + 26 && Math.abs(j.x - x) < j.w / 2 + 3);
  const add = (x, y, kind, big = r() < .35) => { if (Math.abs(x - LIFT_X) > 2.4) things.push({x, y, kind, r: kind === 'rock' ? .75 : big ? 1 : .8, big}); };
  // Rocks under the kickers' flight, so hitting the kicker flies you over them.
  jumps.forEach(j => [-1, 1].forEach(s => things.push({x: j.x + s * (.9 + r() * .6), y: j.y + 7 + r() * 4, kind: 'rock', r: .75})));
  // The odd rock or tree on the piste, never on a gate line, kicker or the start.
  for (let y = 35; y < 519; y += 14 + r() * 16) {
    const p = at(y), sec = sectionAt(y).key;
    if (sec === 'moguls' || sec === 'trees') continue;
    const x = p.cx + (r() - .5) * 2 * (p.hw - 1.5);
    if (!nearGate(x, y) && !nearJump(x, y)) add(x, y, r() < .6 ? 'rock' : 'tree', false);
  }
  // Forest either side, thinning to a glade on the left of the cat track.
  for (let y = -80; y < LENGTH + 90; y += 2.1 + r() * 1.2) {
    const p = at(y);
    for (let x = -60 + r() * 3; x < 75; x += 2.6 + r() * 2.2) {
      const out = Math.abs(x - p.cx) - p.hw;
      if (out < 2.2) continue;
      if (inGlade(x, y)) { if (r() < .09) add(x, y, 'tree'); continue; }
      if (y > LENGTH - 10 && x > LIFT_X - 8 && x < 20) continue;
      if (out < 6 && r() < .5) continue;
      add(x + (r() - .5), y, 'tree');
    }
  }
  things.sort((a, b) => a.y - b.y);
  return {gates, things, bumps, jumps};
}

// Things near a height, found by bucket so the forest stays cheap to check.
function near(map, y, reach = 3) {
  if (map.index?.src !== map.things) {
    const buckets = new Map();
    for (const o of map.things) { const k = Math.floor(o.y / 4); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(o); }
    map.index = {src: map.things, buckets};
  }
  const out = [], k0 = Math.floor((y - reach) / 4), k1 = Math.floor((y + reach) / 4);
  for (let k = k0; k <= k1; k++) { const b = map.index.buckets.get(k); if (b) out.push(...b); }
  return out;
}
export const thingsNear = near;

export function createRun(seed = 7) {
  return {map: course(seed), x: 0, y: 0, head: 0, speed: 5, turn: 0, skid: 0, grip: 0, tuck: 0, t: 0, air: 0, airTime: 0, crash: 0,
    gates: 0, clean: 0, missed: 0, streak: 0, bestStreak: 0, skims: 0, airs: 0, crashes: 0, bonus: 0, top: 0, powder: 0, lastSkim: -9,
    sec: null, done: false, made: false, late: false};
}
export const timeLeft = s => LIMIT + s.bonus - s.t;
export const tucked = s => s.tuck > .4;

// steer: a target heading in radians, or null to hold the current line.
export function step(s, dt, steer = null) {
  const events = [];
  if (s.done) return events;
  s.t += dt;
  const sec = sectionAt(s.y);
  if (sec !== s.sec) { if (s.sec) events.push({type: 'section', key: sec.key, name: sec.name}); s.sec = sec; }
  const y0 = s.y;
  if (s.crash > 0) {
    s.crash -= dt; s.skid = 0; s.turn = 0;
    if (s.crash <= 0) { s.speed = 2; s.head = 0; }
  } else {
    const deep = !onPiste(s.x, s.y);
    if (s.air <= 0) {
      const want = steer == null ? 0 : (Math.max(-MAX_HEAD, Math.min(MAX_HEAD, steer)) - s.head) * GAIN;
      const carve = carveRate(s.speed), rate = Math.max(-PIVOT, Math.min(PIVOT, want));
      s.skid = Math.max(0, Math.min(1, (Math.abs(rate) - carve * 1.1) / Math.max(.4, PIVOT - carve)));
      s.turn = rate;
      s.head = Math.max(-MAX_HEAD, Math.min(MAX_HEAD, s.head + rate * dt));
      s.tuck = Math.abs(s.head) < .15 && Math.abs(rate) < .2 && s.speed > 8 ? s.tuck + dt : 0;
    }
    s.grip = s.skid > .05 ? 0 : s.grip + dt;
    if (deep) s.powder += dt;
    const g = G * pitch(s.x, s.y), drag = DRAG * (tucked(s) ? TUCK : 1) + (deep ? POWDER_DRAG : 0);
    let acc = s.air > 0 ? g * .3 : g * Math.cos(s.head) - ROLL - (deep ? POWDER : 0) - Math.abs(s.turn) * s.speed * .06;
    acc -= drag * s.speed * s.speed + s.skid * SKID_LOSS * (2 + s.speed * .35);
    s.speed = Math.max(0, s.speed + acc * dt);
    s.top = Math.max(s.top, s.speed);
    s.x += Math.sin(s.head) * s.speed * dt; s.y += Math.cos(s.head) * s.speed * dt;
    if (s.air > 0) {
      s.air -= dt;
      if (s.air <= 0) { s.air = 0; if (s.airTime > 0) { s.airs++; s.bonus += AIR_BONUS; events.push({type: 'land', time: s.airTime}); } }
    } else {
      for (const j of s.map.jumps) if (!j.used && y0 < j.y && s.y >= j.y && Math.abs(s.x - j.x) < j.w / 2) {
        j.used = true;
        if (s.speed > 6 && Math.abs(s.head) < .8) { s.air = s.airTime = .3 + s.speed * .045; events.push({type: 'jump', time: s.air}); }
      }
      for (const b of s.map.bumps) if (!b.hit && Math.abs(b.y - s.y) < .6 && Math.abs(b.x - s.x) < .75) {
        b.hit = true; s.speed *= 1 - Math.min(.2, s.speed * .01); s.air = .16; s.airTime = 0;
        events.push({type: 'bump', x: b.x, y: b.y});
      }
    }
    const high = s.air > 0 && s.airTime > 0;
    for (const o of near(s.map, s.y)) {
      if (high && o.kind === 'rock') continue;
      const dx = o.x - s.x, dy = (o.y - s.y) * 1.4, reach = o.r + .35;
      if (dx * dx + dy * dy < reach * reach) {
        s.crash = CRASH; s.crashes++; s.speed = 0; s.air = 0; s.streak = 0; s.skid = 0; s.tuck = 0;
        s.y = o.y + o.r + .6; s.x += Math.sign(-dx || 1) * .2;
        // Lost in the forest: you climb back to the edge of the piste.
        const pi = piste(s.y);
        if (!onPiste(s.x, s.y) && !inGlade(s.x, s.y)) s.x = pi.cx + Math.sign(s.x - pi.cx) * (pi.hw - 1.5);
        events.push({type: 'crash', kind: o.kind, x: o.x, y: o.y}); break;
      }
      if (!o.skimmed && y0 < o.y && s.y >= o.y && Math.abs(dx) < o.r + 1.1 && s.speed > 7 && !high) {
        o.skimmed = true;
        if (s.t - s.lastSkim > .35) { s.lastSkim = s.t; s.skims++; s.bonus += SKIM_BONUS; events.push({type: 'skim', x: o.x, y: o.y, kind: o.kind}); }
      }
    }
  }
  for (const g of s.map.gates) if (g.passed == null && s.y >= g.y) {
    g.passed = s.crash <= 0 && Math.abs(s.x - g.x) <= GATE_GAP / 2;
    g.clean = g.passed && s.grip > .25;
    if (g.passed) { s.gates++; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); s.bonus += GATE_BONUS + (g.clean ? CLEAN_BONUS : 0); if (g.clean) s.clean++; }
    else { s.missed++; s.streak = 0; }
    events.push({type: 'gate', passed: g.passed, clean: g.clean, streak: s.streak, x: g.x, y: g.y});
  }
  const left = timeLeft(s);
  if (s.y >= LENGTH) { s.done = true; s.made = left >= 0; events.push({type: 'finish', made: s.made}); }
  else if (left <= 0 && !s.late) { s.late = true; events.push({type: 'closed'}); }
  else if (left < -LATE) { s.done = true; s.made = false; events.push({type: 'finish', made: false, gone: true}); }
  return events;
}

// One star for making the chair, more for time to spare.
export const STAR_SPARE = [0, 5, 10];
export function stars(s) {
  if (!s.made) return 0;
  const spare = timeLeft(s);
  return STAR_SPARE.filter(t => spare >= t).length;
}
