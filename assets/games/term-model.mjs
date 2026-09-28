// Term Time. An MSc term squeezed into about 45 seconds. Tasks queue up in the corridor and each
// needs a room; each room does one task at a time. Leave a task waiting too long and it storms off.
export const ROOMS = Object.freeze(['desk', 'lab', 'work', 'meeting']);
export const WEEKS = 11, WEEK = 4, QUEUE = 6, STRIKES = 4, COFFEE_EVERY = 20, COFFEE_FOR = 5;
export const TYPES = Object.freeze({
  write: {name: 'Writing', steps: ['desk'], time: 3, patience: 11, points: 10},
  lab: {name: 'Lab session', steps: ['lab'], time: 4, patience: 12, points: 10},
  shift: {name: 'Work shift', steps: ['work'], time: 3.5, patience: 11, points: 10},
  meeting: {name: 'Group meeting', steps: ['meeting'], time: 2, patience: 7, points: 10},
  labwrite: {name: 'Lab, then write it up', steps: ['lab', 'desk'], time: 3, patience: 12, points: 25},
  writeup: {name: 'Write up', steps: ['desk'], time: 5, patience: 12, points: 20},
  handin: {name: 'Hand in', steps: ['desk'], time: 5, patience: 10, points: 50},
});

function rng(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

export function createTerm(seed = 5) {
  return {random: rng(seed), t: 0, week: 1, queue: [], rooms: Object.fromEntries(ROOMS.map(r => [r, null])), nextId: 1, next: 1.2,
    strikes: 0, done: 0, missed: 0, score: 0, over: false, reason: '', coffee: 0, coffeeReady: COFFEE_EVERY, writeups: [5, 8], handin: null};
}
export const week = s => Math.min(WEEKS, 1 + Math.floor(s.t / WEEK));
export const gap = w => 2.6 - (w - 1) * .17;

function make(s, type) {
  const info = TYPES[type], shrink = 1 - (week(s) - 1) * .025;
  return {id: s.nextId++, type, step: 0, patience: info.patience * shrink, max: info.patience * shrink};
}
function arrive(s, task, events) {
  if (s.queue.length >= QUEUE) { s.strikes++; s.missed++; events.push({type: 'full', task}); return; }
  s.queue.push(task); events.push({type: 'arrive', task});
}
function pick(s) {
  const r = s.random(), w = week(s);
  if (w >= 3 && r < .12) return 'labwrite';
  return r < .38 ? 'write' : r < .6 ? 'lab' : r < .8 ? 'shift' : 'meeting';
}
export const need = task => TYPES[task.type].steps[task.step];

// Sends a waiting task to a room. Wrong rooms bounce it back and cost it some patience.
export function assign(s, id, room) {
  const task = s.queue.find(q => q.id === id);
  if (!task || s.over) return {ok: false, reason: 'gone'};
  if (need(task) !== room) { task.patience = Math.max(.5, task.patience - 1); return {ok: false, reason: 'wrong'}; }
  if (s.rooms[room]) return {ok: false, reason: 'busy'};
  s.queue = s.queue.filter(q => q !== task);
  s.rooms[room] = {task, left: TYPES[task.type].time};
  return {ok: true};
}
export function coffee(s) {
  if (s.coffeeReady > 0 || s.over) return false;
  s.coffee = COFFEE_FOR; s.coffeeReady = COFFEE_EVERY; return true;
}

export function step(s, dt) {
  const events = [];
  if (s.over) return events;
  s.t += dt;
  const was = s.week; s.week = week(s);
  if (s.week !== was) events.push({type: 'week', week: s.week});
  s.coffee = Math.max(0, s.coffee - dt); s.coffeeReady = Math.max(0, s.coffeeReady - dt);
  const speed = s.coffee > 0 ? 2 : 1;
  // Arrivals, plus the write ups The Word Count drops on you, and the hand in at the end.
  if (s.t < WEEKS * WEEK - 4) { s.next -= dt; if (s.next <= 0) { arrive(s, make(s, pick(s)), events); s.next = gap(s.week) * (.75 + s.random() * .5); } }
  if (s.writeups.length && s.week >= s.writeups[0]) { s.writeups.shift(); arrive(s, make(s, 'writeup'), events); events.push({type: 'dump'}); }
  if (!s.handin && s.week >= WEEKS) { s.handin = 'waiting'; arrive(s, make(s, 'handin'), events); }
  for (const room of ROOMS) {
    const job = s.rooms[room]; if (!job) continue;
    job.left -= dt * speed;
    if (job.left > 0) continue;
    s.rooms[room] = null;
    const task = job.task, info = TYPES[task.type];
    if (task.step + 1 < info.steps.length) {
      task.step++; task.patience = Math.min(task.max, task.patience + task.max * .6); s.queue.unshift(task);
      events.push({type: 'next', task, room});
    } else {
      s.done++; s.score += info.points + (task.patience > task.max / 2 ? 5 : 0);
      if (task.type === 'handin') s.handin = 'done';
      events.push({type: 'done', task, room, points: info.points});
    }
  }
  for (const task of s.queue) task.patience -= dt;
  for (const task of s.queue.filter(q => q.patience <= 0)) {
    s.queue = s.queue.filter(q => q !== task); s.strikes++; s.missed++;
    if (task.type === 'handin') s.handin = 'missed';
    events.push({type: 'leave', task});
  }
  if (s.strikes >= STRIKES) { s.over = true; s.reason = 'burnt out'; events.push({type: 'over', reason: s.reason}); }
  else if (s.t >= WEEKS * WEEK && (s.handin === 'done' || s.handin === 'missed' || s.t >= WEEKS * WEEK + 8)) { s.over = true; s.reason = 'term'; events.push({type: 'over', reason: 'term'}); }
  return events;
}
// Burning out ends the term early, so it costs you the points you'd have scored.
export const STAR_SCORES = Object.freeze([120, 250, 400]);
export const stars = s => STAR_SCORES.filter(n => s.score >= n).length;
