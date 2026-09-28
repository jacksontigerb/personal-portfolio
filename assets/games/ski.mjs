// Last run: Skier Jackson versus The Last Chair. A top down run through gates, a steep wall,
// a kicker, moguls and a tree shortcut, to make the last chair before the lift closes.
import {createShell} from './shell.mjs?v=3';
import {pen, sprite, INK, PAPER} from './pixels.mjs?v=3';
import {drawBoss} from './bosses.mjs?v=3';
import * as M from './ski-model.mjs?v=3';

const P = 2; // the play canvas is drawn in two pixel cells
const POWDER = '#f8fbfd', EDGE = '#dde7ef', SPECK = '#e1e9f0', TRACK = '#c6d6e3', SKID = '#d9e4ec', SHADOW = '#cfdce6';
const RED = '#c8374b', BLUE = '#2a6f9e', GREEN = '#3e7654';
const TITLES = ['The chair left without you.', 'Made it. Just.', 'Made the last chair.', 'Time for one more.'];
const fmt = t => { const n = Math.max(0, Math.ceil(t)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
const pad = rows => { const w = Math.max(...rows.map(r => r.length)); return rows.map(r => r.padEnd(w, '.')); };
const art = (rows, pal) => sprite(pad(rows), pal);
// The skier gets a dark outline so he reads against white snow at any size.
function outlined(rows, pal, ink = '#16171a') {
  const w = rows[0].length + 2, grid = ['.'.repeat(w), ...pad(rows).map(r => '.' + r + '.'), '.'.repeat(w)];
  const solid = (x, y) => grid[y] && pal[grid[y][x]];
  const out = grid.map((row, y) => [...row].map((ch, x) => pal[ch] ? ch : [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => solid(x + a, y + b)) ? '#' : '.').join(''));
  return sprite(out, {...pal, '#': ink});
}

// Jackson from above and a little behind: black helmet and goggles, blue jacket, dark trousers.
const SKIER = {K: '#1f2023', k: '#44484e', G: '#2b3440', g: '#8cc3e6', S: '#d9965f', s: '#b87645', B: '#2a6f9e', b: '#1f5279', L: '#4f93c4', Z: '#15171a', H: '#1f2023', P: '#3a3d42', p: '#26282c', O: '#6b7078', W: '#c3cad0'};
const FRONT = outlined([
  '....kKKk....', '...kKKKKK...', '...GGGgGG...', '...GGGGGG...', '....SSSS....', '....sSSs....',
  '..LBBBZBBb..', '.LBBBBZBBBb.', '.HBBBBZBBbH.', 'W.BBBBZBBb.W', 'W..BBBZBb..W', 'W..PPPPPp..W',
  '...PPp.PPp..', '...PPp.PPp..', '...OO..OO...'], SKIER);
const TURN = outlined([
  '.....kKKk...', '....kKKKKK..', '....KGGgGG..', '....KGGGGG..', '.....SSSs...', '.....sSs....',
  '...LBBBZBb..', '..LBBBBZBBb.', '..HBBBBZBbbH', '.W.BBBBZbb.W', 'W..BBBBBb..W', '...PPPPPp...',
  '...PPp..PPp.', '..PPp...PPp.', '..OO....OO..'], SKIER);
const SIDE = outlined([
  '....kKKk....', '...kKKKKK...', '...KKKKGG...', '...KKKKGg...', '....SSSSs...', '.....sSs....',
  '...LBBBB....', '..LBBBBBB...', '..LBBBBBBH..', '..BBBBBb.W..', '...BBBBb..W.', '...PPPPP...W',
  '..PPp.PPP...', '..PP...PPp..', '..OO....OO..'], SKIER);
const TUCK = outlined([
  '............', '............', '....kKKk....', '...kKKKKK...', 'W..GGGgGG..W', '.W.GGGGGG.W.',
  '..LBSSSSBb..', '.LHBBBZBBHb.', '.LBBBBZBBBb.', '..PPBBZBPp..', '..PPPPPPPp..', '..PPp..PPp..',
  '..PPp..PPp..', '...OO..OO...', '............'], SKIER);
const AIR = outlined([
  '....kKKk....', '...kKKKKK...', '...GGGgGG...', 'W..GGGGGG..W', '.W..SSSS..W.', '..H.sSSs.H..',
  '..LBBBZBBb..', '..LBBBZBBb..', '...BBBZBb...', '...BBBZBb...', '...PPPPPp...', '...PPp.PPp..',
  '...PPp.PPp..', '....OO.OO...', '............'], SKIER);
const FALLEN = outlined(['...............', '..kKK..........', '.kGGgBBBBPPPOO.', '.KGGGBBBBbPPpO.', '..sSSHLBBb.....', '......W........'], SKIER);

const TREE_PAL = {D: '#1d3d2c', G: '#2f5d43', g: '#3d7555', d: '#24493a', W: '#eef5f9', w: '#cfe0ea', T: '#5a4230', t: '#3f2e22'};
const PINE = art([
  '......D......', '.....DWD.....', '.....WWD.....', '....DWgGD....', '....WWGGd....', '...DgGGGGd...',
  '....DWWGD....', '...DWWgGGD...', '..DWWgGGGGd..', '.DGgGGGGGGGd.', '...DWWWGGDD..', '..DWWWgGGGGD.',
  '.DWWgGGGGGGGd', 'DGgGGGGGGGGGd', '.dddGGGGGGdd.', '.....TTt.....', '.....TTt.....'], TREE_PAL);
const PINE_SMALL = art([
  '....D....', '...DWD...', '...WWgD..', '..DWgGd..', '..WWGGGd.', '.DgGGGGd.', '..DWWGD..', '.DWWgGGd.',
  'DWgGGGGGd', '.ddGGGGd.', '....Tt...', '....Tt...'], TREE_PAL);
const ROCK = art(['...WWW....', '.WWWWWWw..', '.RWWWLwRR.', 'RRLLRRRRRr', 'RRRRRRRrrr', '.rrrrrrrr.'],
  {W: '#f4f8fb', w: '#d9e5ee', R: '#7d838a', L: '#a3a9ae', r: '#5d6268'});
const BUMP = art(['..LLLLL...', '.LWWWWWLL.', 'LWWWWWWLLS', 'LWWWWWLSSS', '.LLLSSSSs.', '...SSSss..'],
  {W: '#fcfdfe', L: '#eef3f8', S: '#d7e2eb', s: '#c3d3e0'});
const CHAIR = art(['KKKKKKK', 'KbbbbbK', 'KBBBBBK', '.M...M.'], {K: INK, b: '#1f5279', B: BLUE, M: '#7a7f86'});
const OFF = {tree: PINE, small: PINE_SMALL, rock: ROCK};

export function start(root, {key, characters, onExit}) {
  const shell = createShell(root, {key, characters, boss: 'The Last Chair', meterLabel: 'LIFT', onExit, scene: 'far', reserve: [100, 118]});
  const {el, play} = shell, p = pen(play), c = p.c;
  play.setAttribute('aria-label', 'Ski run. Left and right arrows carve, down points you downhill, up skids to slow down.');
  shell.$('.arcade-sprites').innerHTML = '<canvas class="ski-chair" width="64" height="64"></canvas>';
  const chair = shell.$('.ski-chair');
  let geo = null, s = M.createRun(), running = false, run = 0, introSeen = false, seed = 1;
  let hold = 0, check = false, point = false, settle = false, pointerX = null, touching = false, pose = '', hud = '', camX = 0, lookY = .3;
  let finishing = null, clock = 0, closedShown = false, lastSection = '';
  const reduced = () => shell.reduced.matches;
  const setPose = next => { if (next !== pose) { pose = next; drawBoss(chair, 'skier', next); } };
  setPose('idle');

  // Pools, so nothing grows while you ski.
  const trail = Array.from({length: 520}, () => ({x: 0, y: 0, h: 0, skid: 0, air: false, deep: false}));
  let trailHead = 0, trailCount = 0;
  const bits = Array.from({length: 220}, () => ({life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, col: PAPER}));
  let bitNext = 0;
  const flakes = Array.from({length: 46}, (_, i) => ({x: (i * 97) % 1000 / 1000, y: (i * 61) % 1000 / 1000, z: .5 + (i * 37) % 100 / 100}));
  const popups = Array.from({length: 10}, () => ({life: 0, text: '', x: 0, y: 0, col: INK}));
  let popNext = 0;
  const order = [];
  const SKI = {kind: 'skier', y: 0};
  let towers = [], poles = [];

  function layout() {
    const topEl = shell.$('.arcade-top'), W = el.offsetWidth, H = el.offsetHeight;
    const playTop = topEl.offsetTop + topEl.offsetHeight, playBottom = shell.playBottom(), playH = Math.max(160, playBottom - playTop);
    // On the result the play strip shrinks to the space above the box: keep the scale and
    // frame the bottom station in what is left.
    if (el.dataset.phase === 'result' && geo) { geo.W = W; geo.H = H; geo.resultLook = lookY = Math.max(.02, (playBottom - playTop) * .55 / geo.playH); return; }
    const ppm = Math.max(8, Math.min(20, playH / 30, W / 34));
    geo = {W, H, playTop, playBottom, playH, ppm, k: ppm >= 15 ? 2 : 1, patterns: new Map()};
    geo.chair = Math.max(48, Math.round(ppm * 3.4));
    chair.style.width = chair.style.height = geo.chair + 'px';
  }
  shell.floor = h => h;

  // World to play canvas cells.
  const X = x => (geo.W / 2 + (x - camX) * geo.ppm) / P;
  const Y = y => (geo.playTop + geo.playH * lookY + (y - s.y) * geo.ppm) / P;
  const worldY = cy => s.y + (cy * P - geo.playTop - geo.playH * lookY) / geo.ppm;
  const worldX = cx => camX + (cx * P - geo.W / 2) / geo.ppm;

  // Groomed snow: a corduroy stripe that runs down the fall line, shaded by how steep it is.
  function snowBase(y) {
    const sec = M.sectionAt(y).key;
    if (y > 219 && y < 226) return '#f9fbfd';
    if (y >= 226 && y < 236) return '#dbe5ee';
    if (y > 381 && y < 390) return '#e4ecf3';
    return sec === 'wall' ? '#e6edf4' : sec === 'moguls' ? '#edf2f7' : sec === 'trees' ? '#f1f5f9' : '#eef3f8';
  }
  function corduroy(base) {
    let pat = geo.patterns.get(base);
    if (!pat) {
      const w = Math.max(3, Math.round(geo.ppm * .8 / P)), t = document.createElement('canvas'); t.width = w; t.height = 1;
      const tc = t.getContext('2d'); tc.fillStyle = base; tc.fillRect(0, 0, w, 1); tc.fillStyle = 'rgba(120,150,175,.09)'; tc.fillRect(0, 0, 1, 1);
      pat = c.createPattern(t, 'repeat'); geo.patterns.set(base, pat);
    }
    return pat;
  }
  const hash = (a, b) => { let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263); h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; };

  function drawSnow() {
    const Wc = play.width, Hc = play.height;
    p.r(0, 0, Wc, Hc, POWDER);
    for (let cy = 0; cy < Hc; cy += 2) {
      const wy = worldY(cy + 1), pi = M.piste(wy), x0 = Math.round(X(pi.cx - pi.hw)), x1 = Math.round(X(pi.cx + pi.hw)), off = Math.round(X(pi.cx));
      c.fillStyle = corduroy(snowBase(wy)); c.setTransform(1, 0, 0, 1, off, 0); c.fillRect(x0 - off, cy, x1 - x0, 2); c.setTransform(1, 0, 0, 1, 0, 0);
      p.r(x0 - 1, cy, 2, 2, EDGE); p.r(x1 - 1, cy, 2, 2, EDGE);
    }
    // Speckles and wind ripples, fixed to the snow so they stream past at speed.
    const g = 1.3, yA = Math.floor(worldY(0) / g), yB = Math.ceil(worldY(Hc) / g), xA = Math.floor(worldX(0) / g), xB = Math.ceil(worldX(Wc) / g);
    for (let iy = yA; iy <= yB; iy++) for (let ix = xA; ix <= xB; ix++) {
      const h = hash(ix, iy); if (h > .2) continue;
      const wx = (ix + h * 4) * g, wy = (iy + h * 2.5) * g, cx = X(wx), cy = Y(wy);
      if (M.onPiste(wx, wy)) p.r(cx, cy, h < .05 ? 2 : 1, 1, SPECK);
      else if (h < .07) p.r(cx - 2, cy, 5, 1, '#e8eff5'); else p.r(cx, cy, 1, 1, h < .12 ? '#dfe8ef' : '#ffffff');
    }
    // Old tracks from earlier in the day.
    const ya = worldY(-2), yb = worldY(Hc + 2);
    for (let i = 0; i < 4; i++) for (let y = Math.floor(ya * 2) / 2; y < yb; y += .5) {
      const pi = M.piste(y), x = pi.cx + (i - 1.5) * pi.hw * .45 + Math.sin(y / (9 + i * 3) + i * 2) * (2.5 + i);
      if (Math.abs(x - pi.cx) > pi.hw - .6) continue;
      p.r(X(x - .15), Y(y), 1, 1, '#e3eaf1'); p.r(X(x + .15), Y(y), 1, 1, '#e3eaf1');
    }
  }

  function drawTracks() {
    const k = geo.ppm / P;
    for (let n = 1; n < trailCount; n++) {
      const a = trail[(trailHead - n + trail.length) % trail.length], b = trail[(trailHead - n - 1 + trail.length) % trail.length];
      if (a.air || b.air) continue;
      const ay = Y(a.y); if (ay < -10 || ay > play.height + 10) continue;
      const ox = Math.cos(a.h) * .17, oy = -Math.sin(a.h) * .17;
      if (a.deep) { p.line(X(b.x), Y(b.y), X(a.x), ay, '#d4e1eb', Math.max(2, Math.round(k * .9))); continue; }
      if (a.skid > .08) { const w = Math.max(1, Math.round(k * (.3 + a.skid * .9))); p.line(X(b.x), Y(b.y), X(a.x), ay, SKID, w); }
      p.line(X(b.x + ox), Y(b.y + oy), X(a.x + ox), Y(a.y + oy), TRACK, 1);
      p.line(X(b.x - ox), Y(b.y - oy), X(a.x - ox), Y(a.y - oy), TRACK, 1);
    }
  }

  function drawKicker(j) {
    const x = X(j.x), y = Y(j.y), hw = j.w / 2 * geo.ppm / P, len = 4.5 * geo.ppm / P;
    if (y < -len - 10 || y - len > play.height + 10) return;
    p.poly([[x - hw - 3, y - len], [x + hw + 3, y - len], [x + hw + 1, y], [x - hw - 1, y]], '#d6e2ec');
    p.poly([[x - hw - 1, y - len], [x + hw + 1, y - len], [x + hw, y - 1], [x - hw, y - 1]], '#fbfdfe');
    for (let i = 1; i < 4; i++) p.r(x - hw, y - len * i / 4, hw * 2, 1, '#eaf0f5');
    p.r(x - hw, y - 1, hw * 2, 2, '#5f8fb5');
    p.r(x - hw - 1, y + 1, hw * 2 + 2, Math.max(2, geo.ppm * .5 / P), '#c9d8e4');
    [-1, 1].forEach(sd => { p.r(x + sd * (hw + 2), y - 7 * geo.k, 1, 7 * geo.k, '#e07b28'); p.r(x + sd * (hw + 2), y - 7 * geo.k, 1, 2 * geo.k, INK); });
  }

  function drawGate(g) {
    const y = Y(g.y), k = geo.k, h = 10 * k, col = g.passed === false ? '#9aa3ab' : g.flash > 0 && Math.floor(g.flash * 12) % 2 ? PAPER : g.passed ? GREEN : g.i % 2 ? RED : BLUE;
    [-1, 1].forEach(sd => {
      const inner = X(g.x + sd * M.GATE_GAP / 2), outer = X(g.x + sd * (M.GATE_GAP / 2 + 1));
      p.r(Math.min(inner, outer) - 1, y, Math.abs(outer - inner) + 3, 1, g.i % 2 ? '#f0c3ca' : '#bcd6ea');
      p.r(inner, y - h, 1, h, col); p.r(outer, y - h, 1, h, col);
      p.r(Math.min(inner, outer), y - h, Math.abs(outer - inner) + 1, 5 * k, col);
      p.r(Math.min(inner, outer) + 1, y - h + 1, Math.max(1, Math.abs(outer - inner) - 1), 1, 'rgba(255,255,255,.35)');
    });
  }

  function drawTower(o) {
    const x = X(o.x), y = Y(o.y), k = geo.k, top = y - 26 * k, arm = .9 * geo.ppm / P;
    p.ellipse(x + 3 * k, y + 1, 4 * k, 1.5 * k, SHADOW);
    p.r(x - k, top, 2 * k, y - top, '#6b7078'); p.r(x - k, top, k, y - top, '#8a9097');
    p.r(x - arm - 2, top, arm * 2 + 5, 2 * k, '#4d5258');
    p.r(x - arm - 1, top - 2, 3, 2, INK); p.r(x + arm - 1, top - 2, 3, 2, INK);
  }

  function drawPole(o) { const x = X(o.x), y = Y(o.y), k = geo.k; p.r(x, y - 8 * k, 1 * k, 8 * k, '#e07b28'); p.r(x, y - 8 * k, k, 2 * k, INK); p.r(x + 1, y, 2, 1, SHADOW); }

  function drawSkier() {
    const k = geo.k, x = X(s.x), y = Y(s.y);
    const lift = s.air > 0 ? (s.airTime > 0 ? Math.sin(Math.PI * (1 - s.air / s.airTime)) * s.airTime * 2.2 : .25) * geo.ppm / P : 0;
    p.ellipse(x + 2 * k, y + 1, (5 - Math.min(2, lift / 12)) * k, 1.5 * k, SHADOW);
    if (s.crash > 0 && !finishing) {
      p.line(x - 6 * k, y - 2 * k, x + 5 * k, y + 2 * k, '#8a3fc4', k); p.line(x - 3 * k, y + 3 * k, x + 7 * k, y - 3 * k, '#d6457a', k);
      p.blit(FALLEN, x, y - 2 * k, k); return;
    }
    const lean = Math.abs(s.turn) > .6 && s.air <= 0 ? Math.sign(s.turn) * k : 0, spin = s.skid * Math.sign(s.turn) * .45;
    const a = s.head + spin, dx = Math.sin(a) * 6 * k, dy = Math.cos(a) * 6 * k, ox = Math.cos(a) * 1.6 * k, oy = -Math.sin(a) * 1.6 * k;
    const fy = y - lift;
    [[-1, '#8a3fc4'], [1, '#d6457a']].forEach(([sd, col]) => {
      const bx = x + ox * sd, by = fy + oy * sd;
      p.line(bx - dx * .6, by - dy * .6 - k, bx + dx, by + dy - k, col, k);
      p.r(bx + dx - (k > 1 ? 1 : 0), by + dy - k, k, k, '#2b73c7');
    });
    const h = Math.abs(s.head), img = s.air > 0 && s.airTime > 0 ? AIR : h > .95 ? SIDE : h > .35 ? TURN : M.tucked(s) ? TUCK : FRONT;
    p.blit(img, x + lean, fy - 8.5 * k, k, 0, s.head < 0 && img !== FRONT && img !== TUCK && img !== AIR);
  }

  function drawBanner(y, text, col) {
    const k = geo.k, pi = M.piste(y), l = X(pi.cx - pi.hw + .5), r = X(pi.cx + pi.hw - .5), by = Y(y);
    if (by < -30 || by > play.height + 40) return by;
    for (let x = l; x < r; x += 4) p.r(x, by, 2, 1, col);
    p.r(l, by - 16 * k, k, 16 * k, INK); p.r(r, by - 16 * k, k, 16 * k, INK);
    p.r(l, by - 16 * k, r - l + k, 7 * k, col); p.text(text, (l + r) / 2 - p.textWidth(text, k) / 2, by - 15 * k, PAPER, k);
    return by;
  }
  function drawStation() {
    drawBanner(-3, 'LAST RUN', BLUE);
    const by = Y(M.LENGTH), H = play.height;
    if (by > H + 60 || by < -120) return;
    const k = geo.k, lx = X(M.LIFT_X), m = geo.ppm / P;
    // Finish line and banner across the piste.
    drawBanner(M.LENGTH, 'LAST CHAIR', RED);
    // Bullwheel and station.
    const wy = by + 3 * m;
    p.r(lx - 5 * m, wy - 1 * m, 10 * m, 6 * m, '#b9c6cf');
    p.r(lx - 5 * m, wy - 1 * m, 10 * m, 1 * m, '#e8eef3');
    p.r(lx - 4.5 * m, wy + 1 * m, 9 * m, 3.6 * m, '#6b4f3a'); p.r(lx - 4.5 * m, wy + 1 * m, 9 * m, 1 * m, '#f4f8fb');
    p.r(lx + 1.5 * m, wy + 2.4 * m, 2 * m, 1.2 * m, '#9fd0ea');
    p.ellipse(lx, wy - 1 * m, 1.8 * m, .9 * m, '#4d5258'); p.ellipse(lx, wy - 1 * m, 1.2 * m, .5 * m, '#8a9097');
    const closed = M.timeLeft(s) <= 0 && !s.made;
    const sx = lx - 7 * m, sy = by + 1 * m;
    p.r(sx, sy, k, 10 * k, '#6b4f3a'); p.tag(closed ? 'CLOSED' : 'OPEN', sx, sy - 6 * k, PAPER, closed ? RED : GREEN, k);
  }

  function drawLift() {
    const lx = X(M.LIFT_X), m = geo.ppm / P, H = play.height;
    if (lx < -4 * m || lx > play.width + 4 * m) return;
    const top = 0, bottom = Math.min(H, Y(M.LENGTH + 2));
    if (bottom <= top) return;
    const up = lx + .9 * m, down = lx - .9 * m, k = geo.k;
    p.r(up, top, 1, bottom - top, '#3a3f45'); p.r(down, top, 1, bottom - top, '#3a3f45');
    const stopped = M.timeLeft(s) <= 0;
    const moving = stopped ? 0 : clock * 2.4, span = 14;
    for (const [lineX, dir] of [[up, -1], [down, 1]]) {
      const base = dir < 0 ? -moving : moving, ya = worldY(0), yb = Math.min(worldY(H), M.LENGTH);
      for (let y = Math.floor((ya - base) / span) * span + base; y < yb; y += span) {
        if (y < ya - 2) continue;
        const cy = Y(y);
        p.r(lineX + 2 * k, cy + 6 * k, 5 * k, 2 * k, SHADOW);
        p.r(lineX, cy - 3 * k, 1, 3 * k, '#3a3f45'); p.blit(CHAIR, lineX, cy + 2 * k, k);
      }
    }
  }

  function drawMap() {
    const H = play.height, top = (geo.playTop + 12) / P, bottom = (geo.playBottom - 14) / P, x = play.width - 5, len = bottom - top;
    if (len < 40) return;
    const at = y => top + Math.max(0, Math.min(1, y / M.LENGTH)) * len;
    p.r(x - 1, top - 1, 4, len + 2, INK);
    for (const sec of M.SECTIONS) {
      const a = at(Math.max(0, sec.y0)), b = at(Math.min(M.LENGTH, sec.y1));
      if (b > a) p.r(x, a, 2, b - a, sec.key === 'wall' ? '#8fb3cf' : sec.key === 'trees' ? '#5f8f73' : sec.key === 'moguls' ? '#c3d6e5' : '#e6eef4');
    }
    for (const g of s.map.gates) p.r(x - 2, at(g.y), 1, 1, g.passed ? GREEN : g.passed === false ? '#9aa3ab' : g.i % 2 ? RED : BLUE);
    const sy = at(s.y); p.r(x - 3, sy - 1, 8, 3, INK); p.r(x - 2, sy, 6, 1, '#f2c14e');
    p.r(x - 3, bottom + 2, 8, 5, BLUE); p.r(x - 2, bottom + 3, 6, 1, '#1f5279');
    void H;
  }

  function render() {
    if (!geo) return;
    p.clear();
    drawSnow();
    drawTracks();
    const ya = worldY(-30), yb = worldY(play.height + 40);
    for (const b of s.map.bumps) { if (b.y < ya || b.y > yb) continue; p.blit(BUMP, X(b.x), Y(b.y), geo.k); if (b.hit) p.r(X(b.x) - geo.k, Y(b.y) - 1, 2 * geo.k, 1, SKID); }
    for (const j of s.map.jumps) drawKicker(j);
    // Everything that stands up, sorted so nearer things (further down the hill) overlap.
    order.length = 0;
    for (const o of M.thingsNear(s.map, (ya + yb) / 2, (yb - ya) / 2)) { const x = X(o.x); if (x > -20 && x < play.width + 20) order.push(o); }
    for (const g of s.map.gates) if (g.y > ya && g.y < yb) order.push(g);
    for (const o of towers) if (o.y > ya && o.y < yb) order.push(o);
    for (const o of poles) if (o.y > ya && o.y < yb) order.push(o);
    SKI.y = s.y + .01; order.push(SKI);
    order.sort((a, b) => a.y - b.y);
    const k = geo.k;
    for (const o of order) {
      if (o === SKI) { drawSkier(); continue; }
      if (o.kind === 'gate') { drawGate(o); continue; }
      if (o.kind === 'tower') { drawTower(o); continue; }
      if (o.kind === 'pole') { drawPole(o); continue; }
      const x = X(o.x), y = Y(o.y), img = o.kind === 'rock' ? ROCK : o.big ? PINE : PINE_SMALL;
      p.ellipse(x + 3 * k, y + 1, (img.width / 2) * k, 2 * k, SHADOW);
      p.blit(img, x, y - (img.height / 2 - 1) * k, k, 0, o.flip ?? (o.flip = hash(Math.round(o.x * 10), Math.round(o.y * 10)) < .5));
      if (o.shake > 0) p.r(x - 2 * k, y - img.height * k, 4 * k, k, PAPER);
    }
    drawStation();
    drawLift();
    // Spray, popups and blowing snow on top.
    for (const b of bits) if (b.life > 0) { const x = X(b.x), y = Y(b.y) - b.z * geo.ppm / P; p.r(x + 1, y + 1, 1, 1, '#b9cddd'); p.r(x, y, b.col === PAPER ? 2 : 1, b.col === PAPER ? 2 : 1, b.col); }
    const v = s.speed;
    if (!reduced() && v > 11 && !finishing) {
      const len = Math.min(10, (v - 9) * .6), col = v > 20 ? '#b6cadb' : '#cddbe6';
      for (const f of flakes) { const x = f.x * play.width, y = f.y * play.height; p.r(x, y, 1, Math.max(1, len * f.z), col); }
    }
    for (const t of popups) if (t.life > 0) p.tag(t.text, X(t.x), Y(t.y) - 12 * k - (1 - t.life) * 14, PAPER, t.col, 1);
    drawMap();
    const cx = X(M.LIFT_X) * P, cy = Y(M.LENGTH + 1) * P;
    chair.style.transform = `translate(${Math.round(cx - geo.chair / 2)}px,${Math.round(cy - geo.chair * .85)}px)`;
    chair.hidden = cy > geo.H + 40 || cy < -geo.chair;
  }

  function emit(x, y, vx, vy, vz, col = PAPER, life = .5) {
    if (reduced()) return;
    const b = bits[bitNext]; bitNext = (bitNext + 1) % bits.length;
    Object.assign(b, {x, y, z: .1, vx, vy, vz, col, life});
  }
  function puff(x, y, n, cols = [PAPER, '#dbe6ee'], power = 4) {
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * power; emit(x, y, Math.cos(a) * r, Math.sin(a) * r * .6, 1 + Math.random() * 3, cols[i % cols.length], .4 + Math.random() * .4); }
  }
  function popup(text, x, y, col = INK) { const t = popups[popNext]; popNext = (popNext + 1) % popups.length; Object.assign(t, {text, x, y: y - 1.5, col, life: 1}); }

  function steer() {
    if (pointerX != null && geo) { const dx = pointerX - X(s.x) * P; return Math.max(-1, Math.min(1, dx / (geo.W * .22))) * M.MAX_HEAD; }
    if (check) return (Math.sign(s.head) || 1) * M.MAX_HEAD;
    if (hold) return M.edgeTarget(s, hold);
    if (point) return 0;
    // After a touch lets go, carve gently back to the fall line rather than stall across the hill.
    if (settle) { if (Math.abs(s.head) < .08) { settle = false; return 0; } return M.edgeTarget(s, -Math.sign(s.head)); }
    return null;
  }

  function update(dt) {
    clock += dt;
    if (finishing) { finishStep(dt); stepBits(dt); return; }
    const events = M.step(s, dt, steer());
    for (const e of events) {
      if (e.type === 'crash') {
        shell.shake(); shell.callout(e.kind === 'rock' ? 'ROCK' : 'TREE', 'bad'); puff(s.x, s.y, 16, [PAPER, '#dbe6ee', '#2f5d43'], 6);
        shell.announce(`Crashed into a ${e.kind}.`);
      }
      if (e.type === 'jump') { shell.callout('AIR', 'good'); puff(s.x, s.y, 6); }
      if (e.type === 'land') { popup('AIR +' + M.AIR_BONUS.toFixed(1), s.x, s.y, GREEN); puff(s.x, s.y, 14, [PAPER, '#dbe6ee'], 5); if (e.time > .9) shell.callout('STOMPED', 'good'); }
      if (e.type === 'bump') puff(e.x, e.y, 3, [PAPER], 2);
      if (e.type === 'skim') { popup('CLOSE +' + M.SKIM_BONUS.toFixed(1), e.x, e.y, BLUE); const o = e; puff(o.x, o.y - .8, 6, [PAPER, '#2f5d43'], 2); }
      if (e.type === 'gate') {
        const g = s.map.gates.find(g => g.y === e.y); if (g) g.flash = .6;
        if (e.passed) {
          popup(e.clean ? `CLEAN +${(M.GATE_BONUS + M.CLEAN_BONUS).toFixed(1)}` : `+${M.GATE_BONUS.toFixed(1)}`, e.x, e.y, e.clean ? BLUE : GREEN);
          puff(e.x, e.y - .5, 8, [PAPER, e.clean ? BLUE : GREEN], 3);
          if (e.streak >= 3) shell.callout(`${e.streak} IN A ROW`, 'good');
        } else popup('MISSED', e.x, e.y, '#6b7078');
      }
      if (e.type === 'section' && e.key !== lastSection) {
        lastSection = e.key;
        if (['wall', 'moguls', 'trees'].includes(e.key)) shell.callout(e.name, '');
        if (e.key === 'trees') shell.announce('The piste turns into a flat cat track on the right. The trees on the left drop straight down.');
      }
      if (e.type === 'closed') { shell.callout('LIFT CLOSED', 'bad'); setPose('attack'); shell.announce('The lift has closed.'); closedShown = true; }
      if (e.type === 'finish') startFinish(e);
    }
    if (!finishing && M.timeLeft(s) < 10 && !closedShown && pose === 'idle') setPose('attack');
    // Spray off the ski tails: a line of snow when carving hard, a sheet when skidding, a plume in powder.
    if (s.air <= 0 && s.crash <= 0 && s.speed > 4) {
      const deep = !M.onPiste(s.x, s.y), side = -Math.sign(s.turn || 1), px = Math.cos(s.head), py = -Math.sin(s.head);
      const hard = Math.abs(s.turn) / M.carveRate(s.speed), n = s.skid * 5 + (hard > .7 ? .6 : 0) + (deep ? .8 : 0);
      for (let i = 0; i < n + Math.random() - .5; i++) {
        const out = (2 + Math.random() * 3) * (.4 + s.skid + (deep ? .3 : 0)) * (s.speed / 12);
        emit(s.x - Math.sin(s.head) * .5, s.y - Math.cos(s.head) * .5, px * side * out + Math.sin(s.head) * s.speed * .4, py * side * out + Math.cos(s.head) * s.speed * .4, 1 + Math.random() * 2 + (deep ? 2 : 0), Math.random() < .8 ? PAPER : '#dbe6ee', .35 + Math.random() * .35);
      }
    }
    stepBits(dt);
    for (const g of s.map.gates) if (g.flash > 0) g.flash -= dt;
    // Tracks.
    const last = trail[(trailHead - 1 + trail.length) % trail.length];
    if (s.crash <= 0 && (!trailCount || Math.hypot(s.x - last.x, s.y - last.y) > .35)) {
      Object.assign(trail[trailHead], {x: s.x, y: s.y, h: s.head, skid: s.skid, air: s.air > 0, deep: !M.onPiste(s.x, s.y)});
      trailHead = (trailHead + 1) % trail.length; trailCount = Math.min(trail.length, trailCount + 1);
    }
    follow(dt);
    paintHud();
  }
  function stepBits(dt) {
    for (const b of bits) if (b.life > 0) { b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z = Math.max(0, b.z + b.vz * dt); b.vz -= 12 * dt; b.vx *= .96; b.vy *= .96; }
    for (const t of popups) if (t.life > 0) t.life -= dt * .9;
    if (!geo) return;
    const v = s.speed, H = play.height, W = play.width;
    for (const f of flakes) {
      f.y -= v * geo.ppm / P * f.z * dt / H * .9; f.x += (Math.sin(clock + f.z * 9) * .02 - Math.sin(s.head) * v * geo.ppm / P * f.z * dt / W * .6) ;
      if (f.y < 0) { f.y += 1; f.x = Math.random(); } if (f.x < 0) f.x += 1; if (f.x > 1) f.x -= 1;
    }
  }
  function follow(dt) {
    const lead = Math.sin(s.head) * s.speed * .35, aim = finishing && !finishing.gone ? (s.x + M.LIFT_X) / 2 : s.x + lead;
    camX += (aim - camX) * Math.min(1, dt * 3);
    lookY += ((.34 - Math.min(1, s.speed / 25) * .12) - lookY) * Math.min(1, dt * 1.5);
  }
  function paintHud() {
    const left = M.timeLeft(s), text = `${fmt(left)}|${Math.round(s.speed * 3.6)}|${s.gates}|${Math.round((M.LENGTH - s.y) / 10)}`;
    if (text === hud) return;
    hud = text;
    shell.meter(Math.max(0, left) / M.LIMIT * 100, left <= 0 ? 'SHUT' : fmt(left), left < 10 ? 'bad' : left < 20 ? 'warn' : 'ok');
    shell.level(`GATES ${s.gates}/${s.map.gates.length}`);
    shell.tag(s.y >= M.LENGTH ? 'AT THE LIFT' : `${Math.max(0, Math.round((M.LENGTH - s.y) / 10) * 10)} M TO GO`);
    shell.score('KM/H', String(Math.round(s.speed * 3.6)));
  }

  function startFinish(e) {
    finishing = {t: 0, made: e.made, gone: !!e.gone, v: Math.max(4, s.speed)};
    shell.callout(e.made ? 'MADE IT' : 'MISSED IT', e.made ? 'win' : 'bad');
    setPose(e.made ? 'hit' : 'defeated');
    puff(s.x, s.y, 18, [PAPER, '#dbe6ee'], 6);
  }
  // A hockey stop by the station, then the result.
  function finishStep(dt) {
    const f = finishing; f.t += dt;
    f.v = Math.max(0, f.v - 26 * dt);
    const toward = f.gone ? (Math.sign(s.head) || 1) * .001 : M.LIFT_X + 3.5 - s.x;
    s.head += ((Math.sign(toward) || 1) * 1.45 - s.head) * Math.min(1, dt * 6);
    s.x += Math.sign(toward) * Math.min(Math.abs(toward), f.v * .6 * dt); s.y += f.v * .5 * dt;
    s.speed = f.v; s.skid = f.v > 1 ? 1 : 0; s.turn = Math.sign(toward) * 3;
    if (f.v > 1) for (let i = 0; i < 2; i++) emit(s.x, s.y, -Math.sign(toward) * (3 + Math.random() * 4), Math.random() * 3, 1 + Math.random() * 2, PAPER, .5);
    follow(dt); paintHud();
    if (f.t > 1.3 && running) { running = false; showResult(); }
  }

  function showResult() {
    el.dataset.phase = 'result';
    const stars = M.stars(s), spare = M.timeLeft(s), route = s.powder > 3 ? 'Through the trees' : 'Round the cat track';
    shell.result({
      title: TITLES[stars], stars,
      line: 'I’ve been skiing since I was three, and I film my runs as I go. This winter I’m doing a season in Hakuba.',
      rows: [['Last chair', s.made ? `${s.t.toFixed(1)} s, ${spare.toFixed(1)} s to spare` : 'Missed it'],
        ['Gates', `${s.gates} of ${s.map.gates.length}, ${s.clean} clean`], ['Route', route],
        ['Jumps, close calls', `${s.airs}, ${s.skims}`], ['Crashes', String(s.crashes)], ['Top speed', `${Math.round(s.top * 3.6)} km/h`]],
      source: `<p>The run is made up: the hill, the gates, the speeds and the ${M.LIMIT} seconds. So is the scoring. Gates add ${M.GATE_BONUS} s, or ${M.GATE_BONUS + M.CLEAN_BONUS} s if you were still carving through them, jumps add ${M.AIR_BONUS} s and close calls add ${M.SKIM_BONUS} s.</p>
        <p>Turning is simplified. A smooth turn carves and keeps its speed, a sharp one skids and scrubs it off, and deep snow slows you down.</p>
        <p>The clips on the portfolio page are real and mine, filmed as I go: carving a sunny piste, a kicker, a small cliff into powder, and off piste in a snowstorm beside the trees.</p>`,
    });
  }

  function playBox() {
    const box = shell.setBox(`<div class="ski-controls">
      <button type="button" class="arcade-button ski-hold" data-dir="-1" aria-label="Carve left">◀</button>
      <p class="ski-help"><strong>Make the last chair.</strong> <span class="only-mouse">Steer with the mouse, or hold ← and →. ↑ skids to slow down.</span><span class="only-touch">Drag to steer, or hold the arrows. Smooth turns keep your speed.</span></p>
      <button type="button" class="arcade-button ski-hold" data-dir="1" aria-label="Carve right">▶</button></div>`, 'is-play');
    box.querySelectorAll('.ski-hold').forEach(button => {
      const dir = Number(button.dataset.dir), stop = () => { if (hold === dir) hold = 0; };
      button.addEventListener('pointerdown', e => { e.preventDefault(); pointerX = null; point = false; settle = false; hold = dir; button.setPointerCapture(e.pointerId); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => button.addEventListener(type, stop));
      button.addEventListener('click', e => { if (e.detail === 0) { hold = dir; setTimeout(() => { if (hold === dir) hold = 0; }, 180); } });
    });
  }
  const localX = e => e.clientX - el.getBoundingClientRect().left;
  play.addEventListener('pointermove', e => { if (running && (e.pointerType === 'mouse' || touching)) { pointerX = localX(e); point = false; } });
  play.addEventListener('pointerdown', e => { if (!running) return; touching = true; play.setPointerCapture(e.pointerId); pointerX = localX(e); point = false; settle = false; });
  ['pointerup', 'pointercancel'].forEach(t => play.addEventListener(t, e => { touching = false; if (e.pointerType !== 'mouse') { pointerX = null; settle = true; } }));
  play.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') pointerX = null; });
  el.addEventListener('keydown', e => {
    if (!running || e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { hold = -1; }
    else if (k === 'arrowright' || k === 'd') { hold = 1; }
    else if (k === 'arrowdown' || k === 's') { point = true; hold = 0; }
    else if (k === 'arrowup' || k === 'w') { check = true; }
    else return;
    pointerX = null; settle = false; if (k !== 'arrowdown' && k !== 's') point = false; e.preventDefault();
  });
  el.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if ((k === 'arrowleft' || k === 'a') && hold < 0 || (k === 'arrowright' || k === 'd') && hold > 0) hold = 0;
    if (k === 'arrowup' || k === 'w') check = false;
  });

  async function begin() {
    const token = ++run; running = false; finishing = null; seed = 1 + Math.floor(Math.random() * 1e6); s = M.createRun(seed);
    s.map.gates.forEach((g, i) => { g.kind = 'gate'; g.i = i; });
    towers = []; for (let y = M.LENGTH - 30; y > -120; y -= 46) towers.push({kind: 'tower', x: M.LIFT_X, y});
    poles = []; for (let y = 20; y < M.LENGTH - 10; y += 22) { const pi = M.piste(y); poles.push({kind: 'pole', x: pi.cx - pi.hw - .5, y}, {kind: 'pole', x: pi.cx + pi.hw + .5, y: y + 11}); }
    trailCount = 0; bits.forEach(b => { b.life = 0; }); popups.forEach(t => { t.life = 0; });
    hold = 0; check = false; point = false; settle = false; pointerX = null; hud = ''; camX = 0; lookY = .34; clock = 0; closedShown = false; lastSection = '';
    el.dataset.phase = 'intro'; setPose('idle');
    shell.meter(100, fmt(M.LIMIT), 'ok'); shell.tag(`${M.LENGTH} M TO GO`); shell.score('KM/H', '0'); shell.level(`GATES 0/${s.map.gates.length}`);
    if (!introSeen) {
      await shell.intro({
        label: 'SKIER VS THE LAST CHAIR', title: 'Last run.',
        text: `The last chair goes in ${M.LIMIT} seconds. Get down before it does. Smooth turns carve and keep your speed. Sharp ones skid and slow you down. Gates, jumps and close calls buy time. The trees are a shortcut, if you can miss them.`,
        controls: [['Mouse', 'Steer towards it', 'mouse'], ['← →', 'Carve', 'mouse'], ['↓', 'Point it downhill', 'mouse'], ['↑', 'Skid to slow down', 'mouse'], ['Drag', 'Steer towards your finger', 'touch'], ['◀ ▶', 'Hold to carve', 'touch']],
        button: 'Drop in',
      });
      if (token !== run) return;
      introSeen = true;
    }
    playBox(); shell.layout(); running = true; el.dataset.phase = 'play'; shell.focusPlay(); shell.callout('DROP IN', 'good');
    shell.announce(`Go. Left and right arrows carve. The lift closes in ${M.LIMIT} seconds.`);
  }
  // For the test scripts: the run and where the skier is on screen.
  el.skiState = () => ({s, x: geo ? X(s.x) * P : 0, W: geo?.W || 0});
  const game = {get running() { return running; }, update, render, layout, restart() { begin(); }, destroy() { run++; running = false; }};
  shell.attach(game);
  begin();
  return shell;
}
