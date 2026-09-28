// Jackson's decathlon. Ten short events from things I do. Each gives a medal:
// 3 gold, 2 silver, 1 bronze, 0 nothing. The rules live here so they can be tested.
export const MEDALS = ['None', 'Bronze', 'Silver', 'Gold'];

// Pump it up: stop inside the pressure window. Over 100 and the tube goes.
export function pumpMedal(pressure, low, high) {
  if (pressure > 100) return 0;
  const mid = (low + high) / 2, half = (high - low) / 2;
  if (Math.abs(pressure - mid) <= half / 3) return 3;
  if (pressure >= low && pressure <= high) return 2;
  if (pressure >= low - 8 && pressure <= high + 8) return 1;
  return 0;
}
// How fast the pump raises the pressure while held, in PSI a second.
export const pumpRate = p => 24 + p * .22;

// Strum, ollie, pop up: how far off the moment you were, in seconds.
export function timingMedal(error, [gold, silver, bronze] = [.08, .16, .26]) {
  const e = Math.abs(error);
  return e <= gold ? 3 : e <= silver ? 2 : e <= bronze ? 1 : 0;
}
export const STRUM_BEATS = Object.freeze([1.3, 1.9, 2.5, 3.1]);
export function strumMedal(errors) {
  const good = errors.filter(e => Math.abs(e) <= .16).length, great = errors.filter(e => Math.abs(e) <= .08).length;
  return great >= 4 ? 3 : good >= 3 ? 2 : good >= 2 ? 1 : 0;
}
// A single strum or jump, in words for the callout.
export const timingWord = (medal, error) => medal === 3 ? 'PERFECT' : medal === 2 ? 'GOOD' : error < 0 ? 'EARLY' : 'LATE';

// Ollie: the two jumps are averaged, and a crash on the first bin ends it with nothing.
export const OLLIE_BINS = Object.freeze([1.9, 3.7]);
export const OLLIE_LEAD = .26;
export const OLLIE_WINDOWS = Object.freeze([.07, .13, .21]);
export const ollieMedal = medals => medals.length < 2 ? 0 : Math.round((medals[0] + medals[1]) / 2 - .01);

// Handline: react once the fish bites. Pulling early spooks it.
export function reactionMedal(delay) {
  if (delay == null || delay < 0) return 0;
  return delay <= .38 ? 3 : delay <= .6 ? 2 : delay <= .9 ? 1 : 0;
}
// Choice events: right answers, and how long they took.
export function answerMedal(right, total, seconds, fast) {
  if (right === total) return seconds <= fast ? 3 : 2;
  return right >= Math.ceil(total / 2) ? 1 : 0;
}
// Mate in one: right, and how quickly.
export const chessMedal = (right, seconds) => !right ? 0 : seconds <= 3.5 ? 3 : seconds <= 5.5 ? 2 : 1;

// Boulder: holds reached before the time runs out, alternating hands. A wrong hand slips a hold.
export const CLIMB_TOP = 12, CLIMB_TIME = 4.5;
export const climbMedal = moves => moves >= CLIMB_TOP ? 3 : moves >= 8 ? 2 : moves >= 4 ? 1 : 0;

// Pop up: paddle hard enough to catch the wave, then stand as it lifts you.
export const WAVE_AT = 2.2, POP_AT = 2.85, POP_WINDOWS = Object.freeze([.1, .2, .32]);
export function popMedal(paddle, popped) {
  if (paddle < .5 || popped == null) return 0;
  return Math.min(paddle >= .9 ? 3 : 2, timingMedal(popped - POP_AT, POP_WINDOWS));
}

// Two mate in one positions. Squares are file then rank, a1 is bottom left for White.
export const PUZZLES = Object.freeze([
  {pieces: {a1: 'R', g1: 'K', g8: 'k', f7: 'p', g7: 'p', h7: 'p'}, options: [['a1', 'a8'], ['a1', 'a7'], ['a1', 'e1']], answer: 0},
  {pieces: {b2: 'Q', g6: 'K', h8: 'k'}, options: [['b2', 'h2'], ['b2', 'b8'], ['b2', 'b7']], answer: 1},
]);
export const PIECE_NAMES = {R: 'Rook', Q: 'Queen', K: 'King'};
export const moveText = (puzzle, [from, to]) => `${PIECE_NAMES[puzzle.pieces[from]]} to ${to}`;

// Read the kana: hiragana, the word in the Latin alphabet, and what it means.
export const KANA = Object.freeze([
  ['やま', 'yama', 'mountain'], ['ゆき', 'yuki', 'snow'], ['すし', 'sushi', 'sushi'],
  ['はくば', 'hakuba', 'my ski season'], ['うみ', 'umi', 'sea'], ['さかな', 'sakana', 'fish'],
]);
// The sound of each kana used above, for the key shown under the sign.
export const SOUNDS = Object.freeze({や: 'ya', ま: 'ma', ゆ: 'yu', き: 'ki', す: 'su', し: 'shi', は: 'ha', く: 'ku', ば: 'ba', う: 'u', み: 'mi', さ: 'sa', か: 'ka', な: 'na'});
// Every round reads はくば, plus two other words, in a shuffled order.
export function kanaRound(random = Math.random) {
  const shuffle = list => list.map(v => [random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]);
  const hakuba = KANA.find(k => k[1] === 'hakuba'), others = shuffle(KANA.filter(k => k !== hakuba));
  const words = shuffle([hakuba, others[0], others[1]]);
  const opts = words.map(w => shuffle([w, ...shuffle(KANA.filter(k => k !== w)).slice(0, 2)]));
  return {words, opts};
}
// The kana to show in the key for one question: every kana in its three options, in a fixed order.
export const keyFor = options => [...new Set(options.flatMap(o => [...o[0]]))].sort((a, b) => SOUNDS[a].localeCompare(SOUNDS[b]));

// Build a PC: each part and the slot it fits.
export const PARTS = Object.freeze([['RAM', 'ram'], ['Graphics card', 'pcie'], ['Processor', 'cpu']]);

// Stars for the total out of 30, and the titles that go with them.
export const STAR_SCORES = Object.freeze([10, 18, 25]);
export const stars = total => STAR_SCORES.filter(n => total >= n).length;
export const TITLES = Object.freeze(['The To Do List wins.', 'Jack of some trades.', 'Jack of most trades.', 'Jack of all trades.']);
