// Run club. A marathon squeezed into about 45 seconds. Pick up runners on the way, jump what's
// in the road, and bring enough of the club to get through the wall at mile 23.
// Units: metres of screen road; the runner stays put and the road moves.
export const MILES = 26.2, WALL_MILE = 23, SPEED = 9, METRES_PER_MILE = 16, NEED = 12, GOAL = 25;
export const LENGTH = MILES * METRES_PER_MILE * SPEED / 9;
const GRAVITY = 42, JUMP = 15, HOLD = 26, DROP = 3;

function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// The route: runners waiting on the pavement or up on a wall, and things to jump.
export function route(seed = 3) {
  const r = rng(seed), items = [];
  const wall = WALL_MILE * METRES_PER_MILE;
  for (let x = 24; x < wall - 10; x += 8 + r() * 8) {
    const roll = r();
    if (roll < .42) items.push({x, kind: 'runner', high: r() < .3});
    else if (roll < .62) items.push({x, kind: 'group', high: false, count: 2 + Math.floor(r() * 2)});
    else items.push({x, kind: ['cone', 'puddle', 'bin', 'dog'][Math.floor(r() * 4)]});
  }
  for (let x = wall + 10; x < LENGTH - 12; x += 9 + r() * 6) items.push({x, kind: r() < .5 ? 'runner' : 'cone', high: false});
  return {items, wall};
}
export function createRun(seed = 3) {
  return {map: route(seed), x: 0, y: 0, vy: 0, holding: false, club: 0, best: 0, t: 0, hits: 0, wall: null, done: false, stumble: 0};
}
export const mile = s => Math.min(MILES, s.x / METRES_PER_MILE);

export function jump(s) { if (s.y <= 0 && !s.done && s.stumble <= 0) { s.vy = JUMP; s.holding = true; return true; } return false; }
export function release(s) { s.holding = false; }

export function step(s, dt) {
  const events = [];
  if (s.done) return events;
  s.t += dt;
  if (s.stumble > 0) s.stumble -= dt;
  // Without enough of the club, the wall slows you right down for a few metres.
  const stuck = s.wall === 'stuck' && s.x < s.map.wall + 8;
  const speed = s.stumble > 0 ? SPEED * .45 : stuck ? SPEED * .35 : SPEED;
  s.x += speed * dt;
  s.vy -= (s.holding && s.vy > 0 ? HOLD : GRAVITY) * dt; s.y = Math.max(0, s.y + s.vy * dt); if (s.y === 0) s.vy = Math.max(0, s.vy);
  for (const it of s.map.items) {
    if (it.gone || Math.abs(it.x - s.x) > .6) continue;
    if (it.kind === 'runner' || it.kind === 'group') {
      if (it.high ? s.y > 1.2 : s.y < 1.6) { it.gone = true; const n = it.count || 1; s.club += n; s.best = Math.max(s.best, s.club); events.push({type: 'join', count: n, club: s.club}); }
    } else if (s.y < .9 && s.stumble <= 0) {
      it.gone = true; s.hits++; const lost = Math.min(s.club, DROP); s.club -= lost; s.stumble = .7; events.push({type: 'hit', kind: it.kind, lost});
    }
  }
  if (s.wall == null && s.x >= s.map.wall - 1) {
    s.wall = s.club >= NEED ? 'through' : 'stuck';
    events.push({type: 'wall', through: s.wall === 'through', club: s.club});
  }
  if (s.x >= LENGTH) { s.done = true; events.push({type: 'finish', club: s.club}); }
  return events;
}
export const STAR_SCORES = Object.freeze([8, 16, GOAL]);
export const stars = s => STAR_SCORES.filter(n => s.club >= n).length;
