// Characters that play their own game instead of the fight. Each game loads only when started.
export const GAMES = {
  researcher: {load: () => import('./rain.mjs?v=2')},
  operator: {load: () => import('./knee.mjs?v=2')},
  creator: {load: () => import('./shot.mjs?v=2')},
  skier: {load: () => import('./ski.mjs?v=2')},
  rider: {load: () => import('./run.mjs?v=2')},
  master: {load: () => import('./term.mjs?v=2')},
  wanderer: {load: () => import('./route.mjs?v=2')},
  allrounder: {load: () => import('./decathlon.mjs?v=2')},
  builder: {load: () => import('./bridge.mjs?v=2')},
};
