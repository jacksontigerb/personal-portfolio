// Route finder. Pack a bag under the allowance, then pick a route from camp to the summit for
// sunrise and down to the lake. Times are minutes after midnight. Everything here is made up.
export const ALLOWANCE = 4, START = 5 * 60, DAWN = 5 * 60 + 45, SUNRISE = 6 * 60 + 15, LATE = 6 * 60 + 40;
export const STORM = [6 * 60 + 30, 7 * 60 + 15], ENERGY = 6, SNACK = 3;
// short: what it does, on the card. why: the reason it matters, shown when you look at it.
export const ITEMS = Object.freeze([
  {key: 'torch', name: 'Head torch', kg: 1, short: 'Full speed in the dark', why: 'It’s dark until 05:45. Without a torch, every leg you start in the dark takes twice as long.'},
  {key: 'jacket', name: 'Rain jacket', kg: 2, short: 'The storm costs no extra', why: 'A storm sits over the ridges from 06:30 to 07:15. Without a jacket, a ridge walk in it costs 2 extra energy.'},
  {key: 'snacks', name: 'Snacks', kg: 2, short: '+3 energy, once', why: 'One snack break, +3 energy. If you hit 0 energy you eat it straight away.'},
  {key: 'camera', name: 'Film camera', kg: 1, short: '+10 points per animal', why: 'There’s a chamois, an eagle, an ibex and a marmot out there. With the camera, each one you pass is 10 points.'},
  {key: 'speaker', name: 'Speaker', kg: 2, short: 'No use on the walk', why: 'Good at camp. On the route it’s 2 kg of nothing.'},
].map(Object.freeze));
// Two choices: the forest or the col on the way up, the ridge or the meadow on the way down.
export const NODES = Object.freeze([
  {id: 0, name: 'Camp', u: .13, v: .86, kind: 'camp'},
  {id: 1, name: 'The forest path', u: .34, v: .66, kind: 'forest'},
  {id: 2, name: 'The col', u: .14, v: .34, kind: 'col', animal: 'chamois'},
  {id: 3, name: 'The summit', u: .38, v: .1, kind: 'summit', animal: 'eagle'},
  {id: 4, name: 'The east ridge', u: .72, v: .28, kind: 'ridge', animal: 'ibex'},
  {id: 5, name: 'The meadow', u: .6, v: .62, kind: 'meadow', animal: 'marmot'},
  {id: 6, name: 'The lake', u: .87, v: .8, kind: 'lake'},
].map(Object.freeze));
// [from, to, minutes, energy, terrain]
export const EDGES = Object.freeze([
  [0, 1, 20, 1, 'forest'], [1, 3, 25, 2, 'steep'], [0, 2, 40, 3, 'scree'], [2, 3, 15, 1, 'ridge'],
  [3, 4, 20, 1, 'ridge'], [4, 6, 15, 1, 'path'], [3, 5, 30, 2, 'path'], [5, 6, 20, 1, 'path'],
].map(Object.freeze));
export const ANIMALS = Object.freeze({chamois: 'A chamois', eagle: 'A golden eagle', ibex: 'An ibex', marmot: 'A marmot'});

export const weight = packed => ITEMS.filter(i => packed.includes(i.key)).reduce((a, i) => a + i.kg, 0);
export function toggle(packed, key) {
  if (packed.includes(key)) return packed.filter(k => k !== key);
  const item = ITEMS.find(i => i.key === key);
  return item && weight(packed) + item.kg <= ALLOWANCE ? [...packed, key] : packed;
}
export function createTrip(packed) {
  return {packed: [...packed], at: 0, time: START, energy: ENERGY, snacks: packed.includes('snacks') ? 1 : 0,
    sunrise: null, summitAt: null, seen: [], photos: [], path: [0], done: false, ended: '',
    kit: {torch: 0, dark: 0, jacket: 0, storm: 0}};
}
export const clock = t => `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(Math.round(t % 60)).padStart(2, '0')}`;
export const neighbours = s => EDGES.filter(e => e[0] === s.at || e[1] === s.at).map(e => ({edge: e, to: e[0] === s.at ? e[1] : e[0]}));
export const exposed = terrain => terrain === 'ridge';

// What a leg will cost, given the time you set off and what's in the bag. Also says which kit
// made a difference, so the game can show it.
export function leg(s, edge) {
  const [, , baseMinutes, baseEnergy, terrain] = edge, has = k => s.packed.includes(k);
  const night = s.time < DAWN, dark = night && !has('torch');
  const minutes = dark ? baseMinutes * 2 : baseMinutes;
  let energy = baseEnergy;
  const stormy = exposed(terrain) && s.time + minutes > STORM[0] && s.time < STORM[1];
  if (stormy && !has('jacket')) energy += 2;
  return {minutes, energy, dark, night, torch: night && has('torch'), stormy, jacket: stormy && has('jacket'), terrain, baseMinutes, baseEnergy,
    slower: minutes - baseMinutes};
}
export function walk(s, to) {
  const n = neighbours(s).find(x => x.to === to);
  if (!n || s.done) return null;
  const cost = leg(s, n.edge), events = [], k = s.kit;
  s.time += cost.minutes; s.energy -= cost.energy; s.at = to; s.path.push(to);
  // What the kit did, or what its absence cost, for the result screen.
  if (cost.torch) k.torch += cost.baseMinutes;
  if (cost.dark) k.dark += cost.slower;
  if (cost.jacket) k.jacket += 2;
  if (cost.stormy && !cost.jacket) k.storm += 2;
  if (cost.stormy) events.push({type: 'storm', jacket: s.packed.includes('jacket')});
  const node = NODES[to];
  if (node.animal && !s.seen.includes(node.animal)) {
    s.seen.push(node.animal);
    if (s.packed.includes('camera')) s.photos.push(node.animal);
    events.push({type: 'animal', animal: node.animal, photo: s.packed.includes('camera')});
  }
  if (node.kind === 'summit' && !s.sunrise) {
    s.summitAt = s.time;
    s.sunrise = s.time <= SUNRISE ? 'made' : s.time <= LATE ? 'late' : 'missed';
    if (s.time < SUNRISE) s.time = SUNRISE;
    events.push({type: 'summit', sunrise: s.sunrise, at: s.summitAt});
  }
  if (node.kind === 'lake') { s.done = true; s.ended = 'lake'; events.push({type: 'lake'}); return {cost, events}; }
  // Out of energy: eat the snacks if there are any left, otherwise that's the end of the walk.
  while (s.energy <= 0 && s.snacks) { eat(s); events.push({type: 'ate'}); }
  if (s.energy <= 0) { s.energy = 0; s.done = true; s.ended = 'tired'; events.push({type: 'tired'}); }
  return {cost, events};
}
export function eat(s) {
  if (!s.snacks || s.done) return false;
  s.snacks--; s.energy = Math.min(ENERGY, s.energy + SNACK); return true;
}
export function score(s) {
  const parts = {
    sunrise: s.sunrise === 'made' ? 40 : s.sunrise === 'late' ? 20 : 0,
    photos: s.photos.length * 10,
    lake: s.ended === 'lake' ? 20 : 0,
    energy: s.ended === 'lake' ? s.energy * 2 : 0,
  };
  return {...parts, total: parts.sunrise + parts.photos + parts.lake + parts.energy};
}
export const STAR_SCORES = Object.freeze([40, 70, 90]);
export const stars = s => STAR_SCORES.filter(n => score(s).total >= n).length;
