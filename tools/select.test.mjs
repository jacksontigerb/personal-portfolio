import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {GAMES, EVIDENCE, EMAIL, stillFor} from '../assets/games/index.mjs';
import {readProgress, recordStars, summary, starText} from '../assets/games/progress.mjs';
import {paintScene, SCENE_KEYS, particles} from '../assets/games/scenes.mjs';

const KEYS = ['allrounder', 'master', 'researcher', 'builder', 'operator', 'creator', 'rider', 'wanderer', 'skier'];
const file = path => new URL('../' + path, import.meta.url);
function memory(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {getItem: k => data.has(k) ? data.get(k) : null, setItem: (k, v) => data.set(k, String(v)), data};
}

test('homepage offers two ways in, the portfolio or the games, and keeps contact', () => {
  const page = readFileSync(file('index.html'), 'utf8');
  assert.match(page, /class="door door-read" href="experience\.html"/);
  assert.match(page, /class="door door-play" href="play\.html"/);
  assert.match(page, /mailto:jacksontiger2004@icloud\.com/);
  for (const [, path] of page.matchAll(/(?:src|href)="(assets\/[^"?#]+)"/g)) assert.ok(existsSync(file(path)), path);
});

test('the games have their own page, with a way to the portfolio and everything it links exists', () => {
  const page = readFileSync(file('play.html'), 'utf8');
  assert.match(page, /id="battle"/);
  assert.match(page, /href="experience\.html"/);
  assert.match(page, /mailto:jacksontiger2004@icloud\.com/);
  assert.doesNotMatch(page, /battle\.css|selection\.css|battle-loader/);
  for (const [, path] of page.matchAll(/(?:src|href)="(assets\/[^"?#]+)"/g)) assert.ok(existsSync(file(path)), path);
});

test('nothing on the site still loads the old fight code', () => {
  for (const path of ['index.html', 'play.html', 'assets/select.mjs', 'assets/game-loader.js', 'assets/games/shell.mjs', 'assets/games/index.mjs']) {
    assert.doesNotMatch(readFileSync(file(path), 'utf8'), /battle-(engine|data|extras|clock|art|scenes)|battle\.mjs/, path);
  }
});

test('every character has a game card, a still and a real project', () => {
  const html = readFileSync(file('experience.html'), 'utf8');
  assert.deepEqual(Object.keys(GAMES), KEYS);
  assert.deepEqual(Object.keys(EVIDENCE).sort(), [...KEYS].sort());
  for (const key of KEYS) {
    const game = GAMES[key];
    for (const field of ['title', 'line', 'shows', 'blurb']) assert.ok(game[field]?.length > 3, `${key} ${field}`);
    assert.equal(typeof game.load, 'function');
    assert.ok(existsSync(file(stillFor(key))), stillFor(key));
    assert.ok(existsSync(file('assets/' + EVIDENCE[key].image)), EVIDENCE[key].image);
    assert.ok(html.includes(`id="${EVIDENCE[key].href.split('#')[1]}"`), EVIDENCE[key].href);
  }
  assert.equal(EMAIL, 'jacksontiger2004@icloud.com');
});

test('visible game copy keeps to the house style', () => {
  const copy = KEYS.flatMap(key => [GAMES[key].title, GAMES[key].line, GAMES[key].shows, GAMES[key].blurb, EVIDENCE[key].title, EVIDENCE[key].text, EVIDENCE[key].alt]);
  for (const text of copy) {
    assert.doesNotMatch(text, /—|–/, `dash: ${text}`);
    assert.doesNotMatch(text, /[a-z]-[a-z]/, `hyphen: ${text}`);
  }
});

test('progress keeps the best stars and survives broken or missing storage', () => {
  const store = memory();
  assert.deepEqual(readProgress(store), {});
  let r = recordStars('skier', 2, KEYS, store);
  assert.deepEqual(r.progress, {skier: 2}); assert.equal(r.newBest, true); assert.equal(r.completed, false);
  r = recordStars('skier', 1, KEYS, store);
  assert.equal(r.best, 2); assert.equal(r.newBest, false);
  r = recordStars('skier', 3, KEYS, store);
  assert.equal(r.best, 3); assert.equal(r.newBest, true);
  assert.equal(recordStars('master', 0, KEYS, store).newBest, true, 'a first play counts even with no stars');
  assert.deepEqual(summary(readProgress(store), KEYS), {played: 2, total: 9, stars: 3, all: false});
  assert.deepEqual(readProgress(memory({'jb-games-v1': 'not json'})), {});
  assert.deepEqual(readProgress(memory({'jb-games-v1': '{"skier":7,"master":-1,"rider":"2","x":1}'})), {x: 1});
  const blocked = {getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }};
  assert.deepEqual(readProgress(blocked), {});
  assert.equal(recordStars('skier', 2, KEYS, blocked).best, 2);
  assert.equal(recordStars('skier', 2, KEYS, null).best, 2);
});

test('the ninth different game, and only that one, completes the set', () => {
  const store = memory();
  KEYS.slice(0, 8).forEach(key => assert.equal(recordStars(key, 1, KEYS, store).completed, false));
  assert.equal(recordStars('allrounder', 3, KEYS, store).completed, false, 'replaying one you have is not the finish');
  const last = recordStars('skier', 2, KEYS, store);
  assert.equal(last.completed, true);
  assert.deepEqual(summary(last.progress, KEYS), {played: 9, total: 9, stars: 12, all: true});
  assert.equal(recordStars('skier', 3, KEYS, store).completed, false);
  assert.equal(starText(2), '★★☆');
});

test('every character has a world that paints at phone and desktop sizes', () => {
  assert.deepEqual([...SCENE_KEYS].sort(), [...KEYS].sort());
  const fake = () => { let fills = 0; const ctx = {clearRect() {}, fillRect() { fills++; }, set fillStyle(v) {}, globalAlpha: 1}; return {getContext: () => ctx, get fills() { return fills; }}; };
  for (const key of SCENE_KEYS) for (const [w, h, f] of [[107, 263, 150], [320, 186, 122], [480, 250, 160]]) {
    const far = fake(), near = fake(), info = paintScene(far, near, key, w, h, f);
    assert.ok(far.fills > 50 && near.fills > 20, `${key} ${w}x${h}`);
    const p = particles(fake()); p.configure(info, w, h); for (let i = 0; i < 60; i++) p.step(); p.burst(10, 10, ['#fff']); p.step();
  }
});
