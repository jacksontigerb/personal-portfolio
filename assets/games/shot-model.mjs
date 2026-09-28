// Get the shot. Five scenes from places I've filmed or been to. Each subject follows a set path
// through the scene (u across, v down, both 0 to 1), and each scene has one best moment.
// A shot is scored on timing (how close to that moment) and framing (subject in the frame).
const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
export const SCENES = Object.freeze([
  {key: 'ski', name: 'The jump', place: 'On the mountain', duration: 5.2, peak: 3.05, window: .55,
    path(t) {
      if (t < 2.2) return {u: lerp(.04, .42, t / 2.2), v: lerp(.2, .52, t / 2.2), angle: .45};
      if (t < 3.9) { const s = (t - 2.2) / 1.7; return {u: lerp(.42, .72, s), v: .52 - .8 * s * (1 - s) + .08 * s, angle: .2 - .5 * s}; }
      const s = (t - 3.9) / 1.3; return {u: lerp(.72, .97, s), v: lerp(.6, .8, s), angle: .5};
    }},
  {key: 'surf', name: 'The top turn', place: 'The surf camp, Senegal', duration: 6, peak: 3.4, window: .55,
    path(t) { return {u: lerp(.86, .14, t / 6), v: .56 - .18 * Math.cos(2 * Math.PI * (t - 3.4) / 3.4), angle: -.5 * Math.sin(2 * Math.PI * (t - 3.4) / 3.4)}; }},
  {key: 'flip', name: 'The backflip', place: 'An alpine lake, the Dolomites', duration: 4.6, peak: 2.45, window: .45,
    path(t) {
      if (t < 1.6) return {u: lerp(.08, .3, t / 1.6), v: .4, angle: 0, run: true};
      if (t < 3.4) { const s = (t - 1.6) / 1.8; return {u: lerp(.3, .62, s), v: .4 - .7 * s * (1 - s) + .4 * s * s, angle: -Math.min(1, (t - 1.6) / 1.7) * Math.PI * 2}; }
      return {u: .62, v: .82, angle: 0, splash: t - 3.4};
    }},
  {key: 'giraffe', name: 'The giraffe', place: 'Out past the camp, Senegal', duration: 7, peak: 3.27, window: .7,
    trees: [.3, .62, .9],
    path(t) { const u = lerp(-.1, 1.1, t / 7); return {u, v: .3 + .012 * Math.sin(t * 5), angle: 0}; }},
  {key: 'sunset', name: 'The sunset', place: 'Brooklyn Bridge, New York', duration: 6.5, peak: 4.81, window: .5,
    path(t) { return {u: .62 + .02 * t / 6.5, v: lerp(.2, .74, t / 6.5), angle: 0}; }},
].map(Object.freeze));

// How much of the subject a tree hides, 0 to 1. Only the giraffe has trees in the way.
export function hidden(scene, u) {
  if (!scene.trees) return 0;
  return Math.max(0, ...scene.trees.map(x => 1 - Math.abs(u - x) / .07));
}
// frame: {u, v, w, h} in scene units, centred on u, v.
export function shoot(scene, t, frame) {
  const at = scene.path(t);
  const dx = Math.abs(at.u - frame.u) / (frame.w / 2), dy = Math.abs(at.v - frame.v) / (frame.h / 2);
  const inFrame = dx <= 1 && dy <= 1;
  const timing = Math.max(0, 1 - Math.abs(t - scene.peak) / scene.window);
  const framing = inFrame ? (1 - .6 * Math.max(dx, dy) ** 2) * (1 - .7 * hidden(scene, at.u)) : 0;
  const score = inFrame ? Math.round(100 * (.55 * timing + .45 * framing)) : 0;
  return {score, timing, framing, inFrame, views: views(score)};
}
// A perfect shot matches my best video, 1.2 million views. Nothing gets fewer than 12.
export function views(score) { return Math.round(12 * 10 ** (5 * Math.max(0, Math.min(100, score)) / 100)); }
export function viewText(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'm';
  if (n >= 1e3) return (n >= 1e5 ? Math.round(n / 1e3) : (n / 1e3).toFixed(1).replace(/\.0$/, '')) + 'k';
  return String(n);
}
export const STAR_SCORES = Object.freeze([150, 280, 400]);
export const stars = total => STAR_SCORES.filter(n => total >= n).length;
