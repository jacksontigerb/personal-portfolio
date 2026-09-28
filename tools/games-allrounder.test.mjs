// Jackson's decathlon: the rules added in the 24 September polish.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as dec from '../assets/games/decathlon-model.mjs';

test('every kana round reads はくば and two other words, each with its right answer on offer', () => {
  let seed = 1; const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let n = 0; n < 200; n++) {
    const {words, opts} = dec.kanaRound(random);
    assert.equal(words.length, 3); assert.equal(new Set(words).size, 3);
    assert.ok(words.some(w => w[0] === 'はくば'));
    words.forEach((w, i) => { assert.equal(opts[i].length, 3); assert.equal(new Set(opts[i]).size, 3); assert.ok(opts[i].includes(w)); });
  }
});
test('the kana key covers every kana in a question and gives each its sound', () => {
  for (const w of dec.KANA) for (const k of w[0]) assert.ok(dec.SOUNDS[k], k);
  const {opts} = dec.kanaRound(() => .3);
  for (const o of opts) {
    const key = dec.keyFor(o);
    for (const w of o) {
      assert.ok([...w[0]].every(k => key.includes(k)));
      assert.equal([...w[0]].map(k => dec.SOUNDS[k]).join(''), w[1]);
    }
  }
});
test('the climb, pop up, ollie and chess medals', () => {
  assert.equal(dec.climbMedal(dec.CLIMB_TOP), 3); assert.equal(dec.climbMedal(8), 2); assert.equal(dec.climbMedal(4), 1); assert.equal(dec.climbMedal(3), 0);
  assert.equal(dec.popMedal(1, dec.POP_AT), 3); assert.equal(dec.popMedal(.7, dec.POP_AT), 2); assert.equal(dec.popMedal(.4, dec.POP_AT), 0);
  assert.equal(dec.popMedal(1, dec.POP_AT - .5), 0); assert.equal(dec.popMedal(1, null), 0);
  assert.equal(dec.ollieMedal([3, 3]), 3); assert.equal(dec.ollieMedal([3, 2]), 2); assert.equal(dec.ollieMedal([3, 0]), 1); assert.equal(dec.ollieMedal([0]), 0);
  assert.equal(dec.chessMedal(true, 2), 3); assert.equal(dec.chessMedal(true, 5), 2); assert.equal(dec.chessMedal(true, 7), 1); assert.equal(dec.chessMedal(false, 1), 0);
  assert.equal(dec.timingWord(3, 0), 'PERFECT'); assert.equal(dec.timingWord(0, -.3), 'EARLY'); assert.equal(dec.timingWord(1, .2), 'LATE');
});
test('the pump reaches the window in a few seconds of holding and bursts past 100', () => {
  let p = 0, t = 0; while (p < 100) { p += dec.pumpRate(p) / 60; t += 1 / 60; }
  assert.ok(t > 2.5 && t < 3.5, String(t));
});
test('stars need 10, 18 and 25, and each has a title', () => {
  assert.deepEqual([9, 10, 17, 18, 24, 25, 30].map(dec.stars), [0, 1, 1, 2, 2, 3, 3]);
  assert.equal(dec.TITLES.length, 4);
});
test('the game’s visible copy has no em dashes and every hobby it names is on the experience page', () => {
  const src = readFileSync(new URL('../assets/games/decathlon.mjs', import.meta.url), 'utf8');
  const strings = [...src.matchAll(/(['`])((?:(?!\1)[^\\]|\\.)*)\1/g)].map(m => m[2]).filter(s => /[a-z] [a-z]/i.test(s));
  for (const s of strings) assert.ok(!s.includes('—'), s);
  const page = readFileSync(new URL('../experience.html', import.meta.url), 'utf8');
  for (const word of ['bike', 'guitar', 'piano', 'chess', 'skate', 'surf', 'bouldering', 'build my own PCs', 'Japanese', 'Hakuba', 'pirogue', 'handlines', 'sixteen']) assert.ok(page.includes(word), word);
});
