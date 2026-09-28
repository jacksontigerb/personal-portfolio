// A bit of everything (the decathlon): the event rules and the copy.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as dec from '../assets/games/decathlon-model.mjs';

test('the climb and chess medals', () => {
  assert.equal(dec.climbMedal(dec.CLIMB_TOP), 3); assert.equal(dec.climbMedal(8), 2); assert.equal(dec.climbMedal(4), 1); assert.equal(dec.climbMedal(3), 0);
  assert.equal(dec.chessMedal(true, 2), 3); assert.equal(dec.chessMedal(true, 5), 2); assert.equal(dec.chessMedal(true, 7), 1); assert.equal(dec.chessMedal(false, 1), 0);
});
test('the pump reaches the window in a few seconds of holding and bursts past 100', () => {
  let p = 0, t = 0; while (p < 100) { p += dec.pumpRate(p) / 60; t += 1 / 60; }
  assert.ok(t > 2.5 && t < 3.5, String(t));
});
test('stars need 4, 7 and 10 of 12, and each has a title', () => {
  assert.deepEqual([3, 4, 6, 7, 9, 10, 12].map(dec.stars), [0, 1, 1, 2, 2, 3, 3]);
  assert.equal(dec.TITLES.length, 4);
});
test('the game’s visible copy has no em dashes and every hobby it names is on the experience page', () => {
  const src = readFileSync(new URL('../assets/games/decathlon.mjs', import.meta.url), 'utf8');
  const strings = [...src.matchAll(/(['`])((?:(?!\1)[^\\]|\\.)*)\1/g)].map(m => m[2]).filter(s => /[a-z] [a-z]/i.test(s));
  for (const s of strings) assert.ok(!s.includes('—'), s);
  const page = readFileSync(new URL('../experience.html', import.meta.url), 'utf8');
  for (const word of ['bike', 'guitar', 'piano', 'chess', 'skate', 'surf', 'bouldering', 'build my own PCs', 'Japanese', 'Hakuba', 'pirogue', 'handlines', 'sixteen']) assert.ok(page.includes(word), word);
});
