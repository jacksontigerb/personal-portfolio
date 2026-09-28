// Each visitor's best stars per game, kept only in their own browser. Storage can be missing
// or blocked (private windows, previews), so every read and write is allowed to fail quietly.
const KEY = 'jb-games-v1';
const store = () => { try { return globalThis.localStorage || null; } catch { return null; } };

export function readProgress(storage = store()) {
  try {
    const saved = JSON.parse(storage?.getItem(KEY) || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    const clean = {};
    for (const [key, stars] of Object.entries(saved)) if (Number.isInteger(stars) && stars >= 0 && stars <= 3) clean[key] = stars;
    return clean;
  } catch { return {}; }
}

// Records a finished game. `completed` is true only on the finish that makes it all of them.
export function recordStars(key, stars, keys, storage = store()) {
  const before = readProgress(storage), after = {...before, [key]: Math.max(before[key] ?? 0, stars)};
  try { storage?.setItem(KEY, JSON.stringify(after)); } catch { /* the result still shows */ }
  const had = keys.filter(k => k in before).length, has = keys.filter(k => k in after).length;
  return {progress: after, best: after[key], first: !(key in before), newBest: !(key in before) || stars > before[key], completed: had < keys.length && has === keys.length};
}

export function summary(progress, keys) {
  const played = keys.filter(k => k in progress);
  return {played: played.length, total: keys.length, stars: played.reduce((sum, k) => sum + progress[k], 0), all: played.length === keys.length};
}

export const starText = (stars, max = 3) => '★'.repeat(stars) + '☆'.repeat(max - stars);
