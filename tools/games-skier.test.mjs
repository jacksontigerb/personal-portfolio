// Last run, the polish pass: carving against skidding, the tree shortcut, jumps, close calls, the lift closing.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../assets/games/ski-model.mjs';

const flat = (seed = 3) => { const s = M.createRun(seed); s.map.things = []; s.map.gates = []; s.map.bumps = []; s.map.jumps = []; return s; };
const run = (s, secs, steer) => { const events = []; for (let t = 0; t < secs; t += 1 / 60) events.push(...M.step(s, 1 / 60, typeof steer === 'function' ? steer(s) : steer)); return events; };

test('a smooth carve keeps more speed than a sharp skid through the same turn', () => {
  const carve = flat(), skid = flat();
  run(carve, 3, 0); run(skid, 3, 0);
  run(carve, 1.2, s => M.edgeTarget(s, 1)); run(skid, 1.2, M.MAX_HEAD);
  assert.ok(skid.skid > .2 || skid.speed < carve.speed, 'the sharp turn skids');
  run(carve, 1, 0); run(skid, 1, 0);
  assert.ok(carve.speed > skid.speed + 1, `carve ${carve.speed.toFixed(1)} against skid ${skid.speed.toFixed(1)}`);
});

test('the wall is steeper than the blue, and the trees drop faster than the cat track', () => {
  const mid = key => { const s = M.SECTIONS.find(s => s.key === key); return (s.y0 + s.y1) / 2; };
  assert.ok(M.pitch(0, mid('wall')) > M.pitch(0, mid('cruise')));
  const y = (M.GLADE.y0 + M.GLADE.y1) / 2, cat = M.piste(y);
  assert.ok(M.onPiste(cat.cx, y) && M.pitch(cat.cx, y) < .6);
  assert.ok(M.inGlade(0, y) && M.pitch(0, y) > 1.5);
});

test('kickers launch you over the rocks behind them, and landing adds time', () => {
  const s = M.createRun(5), j = s.map.jumps[0];
  s.y = j.y - 30; s.x = j.x; s.speed = 16;
  const events = run(s, 3, 0);
  assert.ok(events.some(e => e.type === 'jump'));
  assert.ok(events.some(e => e.type === 'land'));
  assert.ok(!events.some(e => e.type === 'crash'), 'flew over the rocks');
  assert.equal(s.airs, 1);
});

test('close calls add a little time once per tree; hitting it stops you', () => {
  const s = flat(); s.map.things = [{x: 1.4, y: 40, kind: 'tree', r: .8}];
  run(s, 6, 0);
  assert.equal(s.skims, 1); assert.equal(s.bonus, M.SKIM_BONUS); assert.equal(s.crashes, 0);
  const hit = flat(); hit.map.things = [{x: 0, y: 40, kind: 'tree', r: .8}];
  run(hit, 6, 0);
  assert.equal(hit.crashes, 1);
});

test('the lift closes, and a run that misses it still ends', () => {
  const s = flat(); s.bonus = -M.LIMIT + 2;
  const events = run(s, 20, M.MAX_HEAD);
  assert.ok(events.some(e => e.type === 'closed'));
  assert.ok(s.done && !s.made);
  assert.equal(M.stars(s), 0);
});

test('stars: pointing it straight down rarely beats skiing the gates', () => {
  const aim = (s, tx, ty) => Math.atan2(tx - s.x, Math.max(5, ty - s.y));
  const gates = s => { const g = s.map.gates.find(g => g.passed == null && g.y > s.y + 1); if (g && g.y - s.y < 40) return aim(s, g.x, g.y); const p = M.piste(s.y + 16); return aim(s, p.cx, s.y + 16); };
  let straight = 0, skied = 0;
  for (let seed = 1; seed <= 6; seed++) {
    const a = M.createRun(seed); while (!a.done) M.step(a, 1 / 60, 0); straight += M.stars(a);
    const b = M.createRun(seed); while (!b.done) M.step(b, 1 / 60, gates(b)); skied += M.stars(b);
  }
  assert.ok(skied > straight, `gates ${skied} stars, straight ${straight}`);
});

test('a clean run down the gates takes under a minute', () => {
  const aim = (s, tx, ty) => Math.atan2(tx - s.x, Math.max(5, ty - s.y));
  for (let seed = 1; seed <= 5; seed++) {
    const s = M.createRun(seed);
    while (!s.done) { const g = s.map.gates.find(g => g.passed == null && g.y > s.y + 1), p = M.piste(s.y + 16); M.step(s, 1 / 60, g && g.y - s.y < 40 ? aim(s, g.x, g.y) : aim(s, p.cx, s.y + 16)); }
    assert.ok(s.t < 55, `seed ${seed}: ${s.t.toFixed(1)} s`);
    assert.ok(s.made, `seed ${seed} made the chair`);
  }
});
