// Route finder. Pack a bag under the allowance, then pick a route from camp to the summit for
// sunrise and down to the lake. Times are minutes after midnight. Everything here is made up.
export const ALLOWANCE = 6, START = 4 * 60 + 30, DAWN = 5 * 60 + 45, SUNRISE = 6 * 60 + 15, LATE = 6 * 60 + 40;
export const STORM = [6 * 60 + 30, 7 * 60 + 15], ENERGY = 8;
// short: what it does, on the card. why: the reason it matters, shown when you look at it.
export const ITEMS = Object.freeze([
  {key: 'torch', name: 'Head torch', kg: 1, short: 'Full speed in the dark', why: 'It’s dark until 05:45. Without a torch, every leg you start in the dark takes half as long again.'},
  {key: 'jacket', name: 'Rain jacket', kg: 2, short: 'The storm costs no extra', why: 'A storm sits over the ridges from 06:30 to 07:15. Without a jacket, a ridge walk in it costs 2 extra energy.'},
  {key: 'snacks', name: 'Snacks', kg: 2, short: '+3 energy, twice', why: 'Two snack breaks, +3 energy each. If you hit 0 energy you eat one straight away.'},
  {key: 'camera', name: 'Film camera', kg: 1, short: '+10 points per animal', why: 'There’s a chamois, an eagle, an ibex and a marmot out there. With the camera, each one you pass is 10 points.'},
  {key: 'poles', name: 'Walking poles', kg: 1, short: 'Scree costs 1 less energy', why: 'Scree is loose and tiring. Poles take 1 energy off every scree leg.'},
  {key: 'swimmers', name: 'Swimmers', kg: 1, short: '+5 points at the lake', why: 'Reaching the lake is worth 20 points. With swimmers it’s 25.'},
  {key: 'speaker', name: 'Speaker', kg: 2, short: 'No use on the walk', why: 'Good at camp. On the route it’s 2 kg of nothing.'},
].map(Object.freeze));
export const NODES = Object.freeze([
  {id: 0, name: 'Camp', u: .13, v: .86, kind: 'camp'},
  {id: 1, name: 'The forest path', u: .3, v: .74, kind: 'forest'},
  {id: 2, name: 'The stream', u: .1, v: .6, kind: 'stream'},
  {id: 3, name: 'The hut', u: .44, v: .62, kind: 'hut'},
  {id: 4, name: 'The scree field', u: .27, v: .46, kind: 'scree'},
  {id: 5, name: 'The saddle', u: .58, v: .46, kind: 'path'},
  {id: 6, name: 'The col', u: .15, v: .28, kind: 'col', animal: 'chamois'},
  {id: 7, name: 'The ledges', u: .43, v: .3, kind: 'rock'},
  {id: 8, name: 'The summit', u: .36, v: .1, kind: 'summit', animal: 'eagle'},
  {id: 9, name: 'The east ridge', u: .7, v: .26, kind: 'ridge', animal: 'ibex'},
  {id: 10, name: 'The meadow', u: .72, v: .6, kind: 'meadow', animal: 'marmot'},
  {id: 11, name: 'The lake', u: .87, v: .8, kind: 'lake'},
  {id: 12, name: 'The pine wood', u: .55, v: .84, kind: 'forest'},
].map(Object.freeze));
// [from, to, minutes, energy, terrain]
export const EDGES = Object.freeze([
  [0, 1, 15, 1, 'forest'], [0, 2, 15, 1, 'path'], [0, 12, 25, 1, 'forest'], [1, 3, 20, 1, 'forest'], [1, 4, 20, 2, 'steep'],
  [2, 4, 25, 2, 'scree'], [2, 6, 35, 3, 'scree'], [3, 5, 20, 1, 'path'], [3, 10, 15, 1, 'path'], [4, 6, 20, 2, 'scree'],
  [4, 7, 25, 2, 'scramble'], [5, 7, 15, 1, 'path'], [5, 9, 20, 1, 'ridge'], [6, 8, 20, 1, 'ridge'], [7, 8, 15, 2, 'steep'],
  [8, 9, 20, 1, 'ridge'], [9, 10, 25, 1, 'path'], [10, 11, 15, 1, 'path'], [12, 11, 15, 1, 'forest'], [10, 12, 15, 1, 'path'],
].map(Object.freeze));
export const ANIMALS = Object.freeze({chamois: 'A chamois', eagle: 'A golden eagle', ibex: 'An ibex', marmot: 'A marmot'});

export const weight = packed => ITEMS.filter(i => packed.includes(i.key)).reduce((a, i) => a + i.kg, 0);
export function toggle(packed, key) {
  if (packed.includes(key)) return packed.filter(k => k !== key);
  const item = ITEMS.find(i => i.key === key);
  return item && weight(packed) + item.kg <= ALLOWANCE ? [...packed, key] : packed;
}
export function createTrip(packed) {
  return {packed: [...packed], at: 0, time: START, energy: ENERGY, snacks: packed.includes('snacks') ? 2 : 0, hut: false,
    sunrise: null, summitAt: null, seen: [], photos: [], path: [0], done: false, ended: '',
    kit: {torch: 0, dark: 0, poles: 0, scree: 0, jacket: 0, storm: 0}};
}
export const clock = t => `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(Math.round(t % 60)).padStart(2, '0')}`;
export const neighbours = s => EDGES.filter(e => e[0] === s.at || e[1] === s.at).map(e => ({edge: e, to: e[0] === s.at ? e[1] : e[0]}));
export const exposed = terrain => terrain === 'ridge';

// What a leg will cost, given the time you set off and what's in the bag. Also says which kit
// made a difference, so the game can show it.
export function leg(s, edge) {
  const [, , baseMinutes, baseEnergy, terrain] = edge, has = k => s.packed.includes(k);
  const night = s.time < DAWN, dark = night && !has('torch');
  const minutes = dark ? Math.round(baseMinutes * 1.5) : baseMinutes;
  const scree = terrain === 'scree', poles = scree && has('poles');
  let energy = poles ? Math.max(1, baseEnergy - 1) : baseEnergy;
  const stormy = exposed(terrain) && s.time + minutes > STORM[0] && s.time < STORM[1];
  if (stormy && !has('jacket')) energy += 2;
  return {minutes, energy, dark, night, torch: night && has('torch'), scree, poles, stormy, jacket: stormy && has('jacket'), terrain, baseMinutes, baseEnergy,
    slower: minutes - baseMinutes, saved: poles ? baseEnergy - Math.max(1, baseEnergy - 1) : 0};
}
export function walk(s, to) {
  const n = neighbours(s).find(x => x.to === to);
  if (!n || s.done) return null;
  const cost = leg(s, n.edge), events = [], k = s.kit;
  s.time += cost.minutes; s.energy -= cost.energy; s.at = to; s.path.push(to);
  // What the kit did, or what its absence cost, for the result screen.
  if (cost.torch) k.torch += Math.round(cost.baseMinutes * 1.5) - cost.baseMinutes;
  if (cost.dark) k.dark += cost.slower;
  if (cost.poles) k.poles += cost.saved;
  if (cost.scree && !cost.poles) k.scree += cost.baseEnergy - Math.max(1, cost.baseEnergy - 1);
  if (cost.jacket) k.jacket += 2;
  if (cost.stormy && !cost.jacket) k.storm += 2;
  if (cost.stormy) events.push({type: 'storm', jacket: s.packed.includes('jacket')});
  const node = NODES[to];
  if (node.kind === 'hut' && !s.hut) { s.hut = true; s.energy = Math.min(ENERGY, s.energy + 2); events.push({type: 'hut'}); }
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
  if (node.kind === 'lake') { s.done = true; s.ended = 'lake'; events.push({type: 'lake', swim: s.packed.includes('swimmers')}); return {cost, events}; }
  // Out of energy: eat the snacks if there are any left, otherwise that's the end of the walk.
  while (s.energy <= 0 && s.snacks) { eat(s); events.push({type: 'ate'}); }
  if (s.energy <= 0) { s.energy = 0; s.done = true; s.ended = 'tired'; events.push({type: 'tired'}); }
  return {cost, events};
}
export function eat(s) {
  if (!s.snacks || s.done) return false;
  s.snacks--; s.energy = Math.min(ENERGY, s.energy + 3); return true;
}
export function score(s) {
  const parts = {
    sunrise: s.sunrise === 'made' ? 40 : s.sunrise === 'late' ? 20 : 0,
    photos: s.photos.length * 10,
    lake: s.ended === 'lake' ? 20 + (s.packed.includes('swimmers') ? 5 : 0) : 0,
    energy: s.ended === 'lake' ? s.energy * 2 : 0,
  };
  return {...parts, total: parts.sunrise + parts.photos + parts.lake + parts.energy};
}
export const STAR_SCORES = Object.freeze([40, 75, 100]);
export const stars = s => STAR_SCORES.filter(n => score(s).total >= n).length;
