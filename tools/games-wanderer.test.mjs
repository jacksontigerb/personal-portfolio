// Route finder: the kit explains itself and its effects are counted for the result screen.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as route from '../assets/games/route-model.mjs';

test('every item says what it does and why, in plain words', () => {
  for (const i of route.ITEMS) {
    assert.ok(i.short && i.why, i.key);
    for (const text of [i.name, i.short, i.why]) assert.doesNotMatch(text, /—|–|\b[a-z]+-[a-z]+\b/i, text);
  }
});
test('the torch and its absence are counted in minutes', () => {
  const lit = route.createTrip(['torch']), dark = route.createTrip([]);
  route.walk(lit, 1); route.walk(dark, 1);
  assert.equal(lit.kit.torch, 8); assert.equal(dark.kit.dark, 8);
  assert.equal(dark.time - lit.time, 8);
});
test('the storm is counted against the jacket', () => {
  const go = bag => { const s = route.createTrip(bag); s.at = 8; s.time = route.STORM[0]; route.walk(s, 9); return s; };
  const dry = go(['jacket']), wet = go([]);
  assert.equal(dry.kit.jacket, 2); assert.equal(wet.kit.storm, 2);
  assert.equal(dry.energy - wet.energy, 2);
});
test('poles on scree are counted, and leg() says which kit helped', () => {
  const s = route.createTrip(['poles', 'torch']); s.at = 2;
  const edge = route.EDGES.find(e => e[0] === 2 && e[1] === 4), cost = route.leg(s, edge);
  assert.equal(cost.poles, true); assert.equal(cost.torch, true); assert.equal(cost.dark, false);
  route.walk(s, 4); assert.equal(s.kit.poles, 1);
});
test('the summit time is kept even when you wait for the sun', () => {
  const s = route.createTrip(['torch']); for (const to of [1, 4, 7, 8]) route.walk(s, to);
  assert.equal(s.sunrise, 'made'); assert.equal(route.clock(s.summitAt), '05:45'); assert.equal(route.clock(s.time), '06:15');
});
