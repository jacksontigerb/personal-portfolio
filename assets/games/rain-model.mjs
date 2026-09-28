// Shed the Rain. Drops on a tilting swatch of coated cotton.
// This replays measured behaviour; it isn't a fluid simulation. Release angles are C-A1 on
// cotton with drops of about 33 µL (fluorine-free-DWR/data/observations.csv, one value per
// swatch). The smaller drops never released by 90°, so small drops here never release alone.
// Units: the swatch runs from -50 to 50 along its length, y points down, the pivot is at 0,0.
export const ROUNDS = Object.freeze([
  {name:'Fresh', washes:0, release:[28.5,55.7,45.7], rate:1.5, big:.16, pattern:'wander'},
  {name:'10 wash cycles', washes:10, release:[47.0,48.5,56.0], rate:1.9, big:.14, pattern:'sweep'},
  {name:'20 wash cycles', washes:20, release:[56.1,46.4,49.6], rate:2.3, big:.12, pattern:'pour'},
].map(Object.freeze));
export const MAX_TILT = 60, HALF = 50, LARGE = 3, ROUND_TIME = 14;
export const SKY = -47;
const FALL = 170, G = 300, VMAX = 190, HOLD = .7;
// Game feel, kept together so the difficulty can be tuned in one place.
export const TUNE = {tiltSpeed: 150, soakFree: 4, soakRate: 1.2};

export const radius = vol => 2.2 * Math.cbrt(vol);
export const isLarge = vol => vol >= LARGE;
// The measured rule: only a large enough drop releases, and only past its swatch's angle.
export function releases(vol, threshold, tilt) {
  return isLarge(vol) && Number.isFinite(threshold) && Math.abs(tilt) >= threshold;
}
export function points(vol) { return vol >= 6 ? vol * 2 : vol; }

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function createRound(index, seed = 1) {
  if (!ROUNDS[index]) throw new RangeError('No such round');
  return {round: index, config: ROUNDS[index], random: rng(seed), t: 0, tilt: 0, target: 0,
    drops: [], falling: [], nextSpawn: .6, burst: 0, cloud: 0, soak: 0, score: 0, shed: 0, rolls: 0,
    best: 0, over: false, reason: '', nextId: 1};
}

function cloudAt(s) {
  const t = s.t, p = s.config.pattern;
  if (p === 'wander') return 30 * Math.sin(t * .7) + 12 * Math.sin(t * 1.9);
  if (p === 'sweep') { const u = (t / 3) % 2; return -44 + 88 * (u < 1 ? u : 2 - u); }
  return 38 * Math.sin(t * .45) * Math.cos(t * 1.3);
}

function makeLarge(s, d) {
  if (isLarge(d.vol) && d.threshold == null) d.threshold = s.config.release[Math.floor(s.random() * 3)];
}

function spawn(s, x, vol) {
  s.falling.push({id: s.nextId++, x: Math.max(-47, Math.min(47, x)), y: SKY, vy: 0, vol});
}

// Adds a drop straight onto the swatch. Used by tests and by landings.
export function place(s, pos, vol, events = []) {
  const r = radius(vol);
  const hit = s.drops.find(d => Math.abs(d.s - pos) < radius(d.vol) + r);
  if (hit) {
    const was = isLarge(hit.vol);
    hit.vol += vol; hit.s = (hit.s * (hit.vol - vol) + pos * vol) / hit.vol;
    makeLarge(s, hit);
    events.push({type: 'merge', id: hit.id, vol: hit.vol, grew: !was && isLarge(hit.vol)});
    return hit;
  }
  const d = {id: s.nextId++, s: pos, vol, v: 0, moving: false, threshold: null, age: 0};
  makeLarge(s, d); s.drops.push(d);
  events.push({type: 'land', id: d.id, vol});
  return d;
}

export function step(s, dt, target = s.target) {
  const events = [];
  if (s.over) return events;
  s.target = Math.max(-MAX_TILT, Math.min(MAX_TILT, target));
  const turn = TUNE.tiltSpeed * dt;
  s.tilt += Math.max(-turn, Math.min(turn, s.target - s.tilt));
  const rad = s.tilt * Math.PI / 180, cos = Math.cos(rad), tan = Math.tan(rad);
  s.t += dt;
  s.cloud = cloudAt(s);

  // The blob rains. The last round saves some of it up for bursts.
  s.nextSpawn -= dt;
  if (s.nextSpawn <= 0 && s.t < ROUND_TIME - .8) {
    const c = s.config, vol = s.random() < c.big ? LARGE : 1;
    spawn(s, s.cloud + (s.random() - s.random()) * 12, vol);
    if (c.pattern === 'pour' && s.random() < .18) s.burst = 3;
    if (s.burst > 0) { s.burst--; s.nextSpawn = .12; }
    else s.nextSpawn = (.5 + s.random()) / c.rate;
  }

  for (const f of s.falling) {
    f.vy += FALL * dt; f.y += f.vy * dt;
    const along = f.x / cos;
    if (!f.done && Math.abs(along) <= HALF && f.y + radius(f.vol) >= f.x * tan) {
      f.done = true; place(s, along, f.vol, events);
    }
    if (f.y > 90) f.done = true;
  }
  s.falling = s.falling.filter(f => !f.done);

  const g = G * Math.sin(rad);
  for (const d of s.drops) {
    d.age += dt;
    if (!d.moving && releases(d.vol, d.threshold, s.tilt)) {
      d.moving = true; d.picked = 0; events.push({type: 'release', id: d.id, vol: d.vol, threshold: d.threshold});
    }
    if (!d.moving) continue;
    if (Math.abs(s.tilt) < d.threshold * HOLD) {
      d.v *= Math.exp(-9 * dt);
      if (Math.abs(d.v) < 4) { d.v = 0; d.moving = false; events.push({type: 'pin', id: d.id}); continue; }
    } else d.v = Math.max(-VMAX, Math.min(VMAX, d.v + g * dt));
    d.s += d.v * dt;
  }

  // A rolling drop picks up whatever it runs into.
  for (const d of s.drops) {
    if (!d.moving || d.gone) continue;
    for (const o of s.drops) {
      if (o === d || o.gone || Math.abs(o.s - d.s) >= radius(o.vol) + radius(d.vol)) continue;
      const vol = d.vol + o.vol;
      d.v = (d.v * d.vol + o.v * o.vol) / vol; d.vol = vol; d.picked += o.picked ? o.picked + 1 : 1; o.gone = true;
      events.push({type: 'sweep', id: d.id, vol: d.vol});
    }
  }
  for (const d of s.drops) {
    if (d.gone || Math.abs(d.s) <= HALF) continue;
    d.gone = true;
    const got = points(d.vol);
    s.score += got; s.shed += d.vol; s.rolls++; s.best = Math.max(s.best, d.vol);
    events.push({type: 'shed', id: d.id, vol: d.vol, points: got, side: Math.sign(d.s), speed: d.v});
  }
  s.drops = s.drops.filter(d => !d.gone);

  const water = s.drops.reduce((sum, d) => sum + d.vol, 0);
  // Water sitting on the cotton wets it; clearing the swatch lets it dry out again.
  s.soak = Math.max(0, Math.min(100, s.soak + (water - TUNE.soakFree) * TUNE.soakRate * dt));
  if (s.soak >= 100) { s.over = true; s.reason = 'soaked'; events.push({type: 'over', reason: 'soaked'}); }
  else if (s.t >= ROUND_TIME) { s.over = true; s.reason = 'time'; events.push({type: 'over', reason: 'time'}); }
  return events;
}

export function water(s) { return s.drops.reduce((sum, d) => sum + d.vol, 0); }

// Stars for the whole game, from the total across three rounds.
export const STAR_SCORES = Object.freeze([30, 90, 140]);
export function stars(total) { return STAR_SCORES.filter(n => total >= n).length; }
