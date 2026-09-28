// A bit of everything: four short events from things I do. Each gives a medal:
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

// Handline: react once the fish bites. Pulling early spooks it.
export function reactionMedal(delay) {
  if (delay == null || delay < 0) return 0;
  return delay <= .38 ? 3 : delay <= .6 ? 2 : delay <= .9 ? 1 : 0;
}
// Mate in one: right, and how quickly.
export const chessMedal = (right, seconds) => !right ? 0 : seconds <= 3.5 ? 3 : seconds <= 5.5 ? 2 : 1;

// Boulder: holds reached before the time runs out, alternating hands. A wrong hand slips a hold.
export const CLIMB_TOP = 12, CLIMB_TIME = 4.5;
export const climbMedal = moves => moves >= CLIMB_TOP ? 3 : moves >= 8 ? 2 : moves >= 4 ? 1 : 0;

// Two mate in one positions. Squares are file then rank, a1 is bottom left for White.
export const PUZZLES = Object.freeze([
  {pieces: {a1: 'R', g1: 'K', g8: 'k', f7: 'p', g7: 'p', h7: 'p'}, options: [['a1', 'a8'], ['a1', 'a7'], ['a1', 'e1']], answer: 0},
  {pieces: {b2: 'Q', g6: 'K', h8: 'k'}, options: [['b2', 'h2'], ['b2', 'b8'], ['b2', 'b7']], answer: 1},
]);
export const PIECE_NAMES = {R: 'Rook', Q: 'Queen', K: 'King'};
export const moveText = (puzzle, [from, to]) => `${PIECE_NAMES[puzzle.pieces[from]]} to ${to}`;

// Stars for the total out of 12, and the titles that go with them.
export const STAR_SCORES = Object.freeze([4, 7, 10]);
export const stars = total => STAR_SCORES.filter(n => total >= n).length;
export const TITLES = Object.freeze(['Jack of no trades.', 'Jack of some trades.', 'Jack of most trades.', 'Jack of all trades.']);
