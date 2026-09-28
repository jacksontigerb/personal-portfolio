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
  assert.equal(lit.kit.torch, 20); assert.equal(dark.kit.dark, 20);
  assert.equal(dark.time - lit.time, 20);
});
test('the storm is counted against the jacket', () => {
  const go = bag => { const s = route.createTrip(bag); s.at = 3; s.time = route.STORM[0]; route.walk(s, 4); return s; };
  const dry = go(['jacket']), wet = go([]);
  assert.equal(dry.kit.jacket, 2); assert.equal(wet.kit.storm, 2);
  assert.equal(dry.energy - wet.energy, 2);
});
test('the summit time is kept even when you wait for the sun', () => {
  const s = route.createTrip(['torch']); for (const to of [1, 3]) route.walk(s, to);
  assert.equal(s.sunrise, 'made'); assert.equal(route.clock(s.summitAt), '05:45'); assert.equal(route.clock(s.time), '06:15');
});
test('without a torch the forest route misses the sunrise', () => {
  const s = route.createTrip([]); for (const to of [1, 3]) route.walk(s, to);
  assert.notEqual(s.sunrise, 'made');
});
