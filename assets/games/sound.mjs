// Optional chiptune blips, made in the browser with no audio files. Off unless the visitor
// turns it on; the choice is remembered. No AudioContext exists until sound is switched on.
const KEY = 'jb-sound';
let on = false, ctx = null, master = null;
try { on = globalThis.localStorage?.getItem(KEY) === 'on'; } catch { on = false; }
const listeners = new Set();

export const soundOn = () => on;
export function onSoundChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function setSound(next) {
  on = Boolean(next);
  try { globalThis.localStorage?.setItem(KEY, on ? 'on' : 'off'); } catch { /* still works for this visit */ }
  if (on) unlock();
  else if (ctx) ctx.suspend?.();
  listeners.forEach(fn => fn(on));
}
// Browsers only start audio from a click or key press, so this runs inside those handlers.
export function unlock() {
  if (!on) return null;
  if (!ctx) {
    const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Audio) return null;
    ctx = new Audio(); master = ctx.createGain(); master.gain.value = .16; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume?.();
  return ctx;
}

// Each sound is a few short notes: [frequency Hz, length s, wave, slide to Hz].
const SOUNDS = {
  tick: [[1320, .03, 'square']],
  good: [[660, .06, 'square'], [990, .09, 'square']],
  bad: [[196, .16, 'sawtooth', 110]],
  hit: [[150, .09, 'square', 60]],
  big: [[98, .22, 'sawtooth', 49]],
  win: [[523, .07, 'square'], [659, .07, 'square'], [784, .07, 'square'], [1047, .18, 'square']],
  lose: [[392, .12, 'triangle'], [330, .12, 'triangle'], [262, .24, 'triangle']],
  start: [[440, .05, 'square'], [880, .08, 'square']],
};

export function play(name) {
  if (!on || !ctx || ctx.state !== 'running') return;
  const notes = SOUNDS[name]; if (!notes) return;
  let t = ctx.currentTime + .005;
  for (const [freq, length, wave = 'square', slide] of notes) {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = wave; osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + length);
    gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(1, t + .008); gain.gain.exponentialRampToValueAtTime(.0001, t + length);
    osc.connect(gain); gain.connect(master); osc.start(t); osc.stop(t + length + .02);
    t += length * .9;
  }
}
