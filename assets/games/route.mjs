// Route finder: Explorer Jackson versus The Baggage Allowance.
// Three steps: pack the bag (every item says what it does), a kit check that says what the bag
// means for the walk, then the map, one leg at a time, with the kit showing when it helps.
import {createShell, escape} from './shell.mjs?v=3';
import {pen, sprite, INK, PAPER} from './pixels.mjs?v=3';
import {drawBoss} from './bosses.mjs?v=3';
import * as M from './route-model.mjs?v=3';

const TITLES = ['Back to camp.', 'A good walk.', 'Sunrise, and a swim.', 'Worth the early start.'];
const TERRAIN = {forest: ['#8a6a3c', 'Forest path'], path: ['#8a6a3c', 'Path'], scree: ['#6f6a62', 'Scree'], steep: ['#3a2f28', 'Steep'], scramble: ['#3a2f28', 'Scramble'], ridge: ['#b23a48', 'Exposed ridge']};
const ICONS = {
  torch: sprite(['...YY.....', '..YYYY....', '.KKKKKK...', 'KKKKKKKK..', 'KKWKKKKK..', 'KKKKKKKK..', '.KKKKKK...'], {Y: '#ffe08a', K: '#3a3f45', W: '#fbfbfa'}),
  jacket: sprite(['..RR.RR...', '.RRRRRRR..', 'RRRRKRRRR.', 'RR.RKR.RR.', 'RR.RKR.RR.', '...RKR....', '...RRR....'], {R: '#b23a48', K: '#1f2023'}),
  snacks: sprite(['.YYYYYY...', 'YBBBBBBY..', 'YBYYYYBY..', 'YBBBBBBY..', 'YYYYYYYY..', '.GGG.OOO..', 'GGGG.OOOO.'], {Y: '#e3b341', B: '#8c5a3c', G: '#5fa383', O: '#e3822b'}),
  camera: sprite(['..KK......', 'KKKKKKKK..', 'KWKKKKKK..', 'KKKGGKKK..', 'KKGWWGKK..', 'KKKGGKKK..', 'KKKKKKKK..'], {K: '#3a3f45', W: '#fbfbfa', G: '#8fb8d8'}),
  poles: sprite(['K....K....', 'K....K....', '.K....K...', '.K....K...', '..K....K..', '..K....K..', '..W....W..'], {K: '#3a3f45', W: '#9aa3ab'}),
  swimmers: sprite(['..........', 'BBBBBBBB..', 'BWBBBBWB..', '.BBBBBB...', '..BBBB....', '...BB.....', '..........'], {B: '#2a6f9e', W: '#fbfbfa'}),
  speaker: sprite(['.KKKKKK...', 'KKKKKKKK..', 'KKGGGGKK..', 'KGGKKGGK..', 'KKGGGGKK..', 'KKKKKKKK..', '.KKKKKK...'], {K: '#3a3f45', G: '#6f5aa8'}),
};
const COLOUR = {torch: '#e3b341', jacket: '#b23a48', snacks: '#e3822b', camera: '#3a3f45', poles: '#9aa3ab', swimmers: '#2a6f9e', speaker: '#6f5aa8'};
const hiker = (coat, hood = 'Y') => sprite(['..HHH..', '.HHHHH.', '..SSS..', '.PPPPP.', 'PPPPPPP', 'S.PPP.S', '..NNN..', '..N.N..', '.KK.KK.'],
  {H: hood === 'Y' ? '#e0b44a' : coat, S: '#e2ad84', P: coat, N: '#3a3f45', K: '#1f2023'});
const HIKER = hiker('#6f5aa8'), HIKER_JACKET = hiker('#b23a48', 'R');
const ANIMAL = {
  chamois: sprite(['K.K.....', '.KBB....', '.BBBBBB.', '..BBBBBB', '..B.B.B.'], {K: '#1f2023', B: '#7a5a3a'}),
  eagle: sprite(['BB.....BB', '.BBB.BBB.', '..BBYBB..', '....B....'], {B: '#5a4230', Y: '#e3b341'}),
  ibex: sprite(['KK......', '.KK.....', '.GGG....', '..GGGGG.', '..GGGGGG', '..G.G.G.'], {K: '#6b5a45', G: '#8a8278'}),
  marmot: sprite(['.BB.', 'BKBB', 'BBBB', 'BBBB', 'B..B'], {B: '#a07a45', K: '#1f2023'}),
};
const iconURL = key => ICONS[key].toDataURL();
const item = key => M.ITEMS.find(i => i.key === key);
// What the bag means for the walk, said once the bag is closed. [packed, left behind]
const BRIEF = {
  torch: ['Full speed in the dark, until 05:45.', 'No torch: every leg you start before 05:45 takes half as long again.'],
  jacket: ['The storm over the ridges, 06:30 to 07:15, costs nothing extra.', 'No jacket: a ridge leg in the storm costs 2 extra energy.'],
  snacks: ['Two snack breaks, +3 energy each.', 'No snacks: when energy hits 0, the walk is over.'],
  camera: ['Each animal you pass is 10 points.', 'No camera: you’ll see the animals, but no points.'],
  poles: ['Scree legs cost 1 less energy.', 'No poles: scree costs full energy.'],
  swimmers: ['+5 points at the lake.', 'No swimmers: the lake is still 20 points.'],
  speaker: ['2 kg of nothing on the walk. Good at camp, though.', ''],
};
const CLOCK_FROM = M.START, CLOCK_TO = 7 * 60 + 45;
const pct = t => Math.max(.8, Math.min(99.2, (t - CLOCK_FROM) / (CLOCK_TO - CLOCK_FROM) * 100));

export function start(root, {key, characters, onExit}) {
  const shell = createShell(root, {key, characters, boss: 'The Baggage Allowance', meterLabel: 'BAG', onExit, scene: 'far', reserve: [112, 150]});
  const {el, play, ui} = shell, p = pen(play);
  shell.$('.arcade-sprites').innerHTML = '<canvas class="route-bag" width="64" height="64"></canvas>';
  const bag = shell.$('.route-bag');
  let geo = null, phase = 'pack', packed = [], s = null, anim = null, running = false, run = 0, introSeen = false, pose = '', last = null, pending = [];
  let preview = null, touchPick = false, queue = [], queueT = 0, wait = null, said = new Set(), keyOpen = null, parts = {};
  el.addEventListener('keydown', () => { touchPick = false; });
  const setPose = next => { if (next !== pose) { pose = next; drawBoss(bag, 'wanderer', next); } };
  setPose('idle');

  // ----- Layout -----
  function layout() {
    const top = shell.$('.arcade-top'), W = el.offsetWidth, phone = W < 700, playTop = top.offsetTop + top.offsetHeight + 10, playBottom = shell.playBottom() - 6;
    if (phase === 'pack') return layoutPack(W, phone, playTop, playBottom);
    const strip = phone ? 34 : 38, H = playBottom - playTop - strip;
    const mw = Math.min(W - 24, 1000, H * 1.6), mh = Math.min(H, mw / (phone ? .72 : 1.45));
    geo = {W, mx: Math.round((W - mw) / 2), my: Math.round(playTop + strip + (H - mh) / 2), mw, mh, playTop, H};
    const size = W >= 1100 ? 120 : 0;
    bag.hidden = !size || W - geo.mx - geo.mw < size + 16; bag.style.width = bag.style.height = size + 'px';
    Object.assign(bag.style, {left: geo.mx + geo.mw + 12 + 'px', top: geo.my + geo.mh - size + 'px'});
    const {clock, key: legend, brief} = parts;
    if (clock) Object.assign(clock.style, {left: geo.mx + 'px', top: geo.my - strip + 'px', width: geo.mw + 'px'});
    if (legend) {
      const side = geo.mx >= 210;
      legend.classList.toggle('is-side', side);
      if (keyOpen === null) { keyOpen = side; legend.open = side; }
      Object.assign(legend.style, side ? {left: geo.mx - 202 + 'px', top: geo.my + 'px', right: 'auto'} : {left: 'auto', right: W - geo.mx - geo.mw + 6 + 'px', top: geo.my + 6 + 'px'});
      legend.style.maxHeight = geo.mh - 12 + 'px';
    }
    if (brief) Object.assign(brief.style, {left: geo.mx + Math.max(8, (geo.mw - Math.min(560, geo.mw - 16)) / 2) + 'px', top: geo.my + 8 + 'px', width: Math.min(560, geo.mw - 16) + 'px', maxHeight: geo.mh - 16 + 'px'});
    placeButtons();
  }
  function layoutPack(W, phone, playTop, playBottom) {
    // The packing box can grow with the item text, so stop above wherever it actually is.
    const bottom = Math.min(playBottom, shell.box.offsetTop - 10), H = bottom - playTop, grid = ui.querySelector('.route-pack');
    if (!grid) return;
    grid.style.maxHeight = '';
    if (phone) {
      Object.assign(grid.style, {left: '10px', width: W - 20 + 'px', top: '0px'});
      let size = Math.min(96, H * .22);
      if (size + grid.offsetHeight + 4 > H) size = 0;
      bag.hidden = !size; bag.style.width = bag.style.height = size + 'px';
      Object.assign(bag.style, {left: W / 2 - size / 2 + 'px', top: playTop - 4 + 'px'});
      grid.style.top = playTop + (size ? size + 2 : 0) + 'px';
      if (!size && grid.offsetHeight > H) grid.style.maxHeight = H + 'px';
    } else {
      const size = Math.min(210, H * .55), total = Math.min(W - 40, 1040), gx = (W - total) / 2;
      bag.hidden = false; bag.style.width = bag.style.height = size + 'px';
      Object.assign(bag.style, {left: gx + 'px', top: playTop + (H - size) / 2 + 'px'});
      Object.assign(grid.style, {left: gx + size + 24 + 'px', width: total - size - 24 + 'px', top: '0px'});
      grid.style.top = playTop + Math.max(0, (H - grid.offsetHeight) / 2) + 'px';
    }
  }
  shell.floor = h => Math.round(h * .85);
  const NX = n => geo.mx + M.NODES[n].u * geo.mw, NY = n => geo.my + M.NODES[n].v * geo.mh;

  // ----- The map -----
  function render(dt = 0) {
    p.clear();
    if (!geo || phase === 'pack' || !s) return;
    const C = 2, x = geo.mx / C, y = geo.my / C, w = geo.mw / C, h = geo.mh / C, U = u => x + u * w, V = v => y + v * h;
    p.r(x - 2, y - 2, w + 4, h + 4, INK);
    p.r(x, y, w, h, '#9fbf7a');
    p.poly([[U(0), V(.62)], [U(0), V(.15)], [U(.12), V(.05)], [U(.3), V(0)], [U(.5), V(.02)], [U(.72), V(.08)], [U(.92), V(0)], [U(1), V(.06)], [U(1), V(.5)], [U(.8), V(.5)], [U(.62), V(.56)], [U(.4), V(.54)], [U(.2), V(.6)]], '#b8b2a7');
    p.poly([[U(.18), V(.4)], [U(.36), V(.36)], [U(.4), V(.5)], [U(.16), V(.55)]], '#a39c90');
    p.poly([[U(.26), V(.02)], [U(.36), V(.04)], [U(.46), V(.12)], [U(.32), V(.16)], [U(.24), V(.1)]], '#f4f6f7');
    p.poly([[U(.62), V(.12)], [U(.78), V(.16)], [U(.72), V(.22)]], '#f4f6f7');
    for (let i = 0; i < 70; i++) { const u = (i * 37 % 100) / 100, v = .72 + (i * 53 % 28) / 100; if (u < .05 || (u > .76 && v > .7)) continue; p.poly([[U(u), V(v) - 4], [U(u) + 3, V(v) + 2], [U(u) - 3, V(v) + 2]], '#4f7a4a'); }
    p.ellipse(U(.87), V(.84), w * .11, h * .09, '#4fb3c8'); p.ellipse(U(.87), V(.84), w * .08, h * .06, '#6ec6d6');
    for (let i = 0; i < 20; i++) { const t = i / 20; p.r(U(.02 + .12 * t + .03 * Math.sin(t * 9)), V(.38 + .62 * t), 2, 3, '#5aa9c9'); }
    // Paths, coloured by what they're like underfoot. The leg you're looking at is picked out.
    const look = preview != null && !anim ? M.neighbours(s).find(n => n.to === preview) : null;
    for (const e of M.EDGES) {
      const [a, b, , , terrain] = e, col = TERRAIN[terrain][0], ax = NX(a) / C, ay = NY(a) / C, bx = NX(b) / C, by = NY(b) / C, n = Math.hypot(bx - ax, by - ay) / 3;
      const walked = s.path.some((q, i) => i && ((s.path[i - 1] === a && q === b) || (s.path[i - 1] === b && q === a)));
      if (look && look.edge === e) p.line(ax, ay, bx, by, PAPER, 4);
      for (let i = 0; i <= n; i++) if (i % 2 === 0 || walked) p.r(ax + (bx - ax) * i / n - .5, ay + (by - ay) * i / n - .5, walked ? 2 : 1.5, walked ? 2 : 1.5, walked ? '#e3b341' : col);
    }
    // Places, and the animals you could photograph (faint until you've seen them).
    for (const node of M.NODES) {
      const nx = NX(node.id) / C, ny = NY(node.id) / C;
      p.disc(nx, ny, 4, INK); p.disc(nx, ny, 3, node.kind === 'summit' ? '#e3b341' : node.kind === 'lake' ? '#2a6f9e' : node.kind === 'hut' ? '#b23a48' : node.kind === 'camp' ? '#6f5aa8' : PAPER);
      if (node.kind === 'summit') { p.r(nx, ny - 12, 1, 9, INK); p.r(nx + 1, ny - 12, 5, 3, '#b23a48'); }
      if (node.kind === 'camp') p.poly([[nx - 5, ny - 4], [nx, ny - 11], [nx + 5, ny - 4]], '#e3822b');
      if (node.kind === 'hut') { p.r(nx - 4, ny - 9, 8, 5, s.hut ? '#8a8278' : '#8c5a3c'); p.poly([[nx - 5, ny - 9], [nx, ny - 13], [nx + 5, ny - 9]], '#6b4a2a'); }
      if (node.animal) {
        const seen = s.seen.includes(node.animal), shot = s.photos.includes(node.animal);
        p.c.globalAlpha = seen ? 1 : .45; p.blit(ANIMAL[node.animal], nx + 10, ny - 6, 1); p.c.globalAlpha = 1;
        if (shot) { p.r(nx + 14, ny - 12, 4, 4, INK); p.r(nx + 15, ny - 11, 2, 2, '#e3b341'); }
      }
      if (geo.W >= 800) p.text(node.name.replace('The ', '').toUpperCase(), nx - node.name.replace('The ', '').length * 2, ny + 13, INK, 1);
    }
    // The time now, walking or standing.
    const t = anim ? anim.fromTime + (anim.toTime - anim.fromTime) * Math.min(1, anim.t / anim.dur) : s.time;
    let hx = NX(s.at) / C, hy = NY(s.at) / C;
    if (anim) { const k = Math.min(1, anim.t / anim.dur); hx = (NX(anim.from) + (NX(anim.to) - NX(anim.from)) * k) / C; hy = (NY(anim.from) + (NY(anim.to) - NY(anim.from)) * k) / C; }
    // Night: the map is dark except for the pool of light you carry. A torch makes it big.
    const torch = s.packed.includes('torch');
    if (t < M.DAWN) night(x, y, w, h, hx, hy - 4, torch ? Math.max(26, w * .085) : 8, .6);
    else if (t < M.SUNRISE) p.r(x, y, w, h, `rgba(24,30,64,${(.3 * (M.SUNRISE - t) / (M.SUNRISE - M.DAWN)).toFixed(3)})`);
    if (t > M.SUNRISE - 25 && t < M.SUNRISE + 40) p.r(x, y, w, h * .3, `rgba(255,170,90,${(.22 * (1 - Math.abs(t - M.SUNRISE - 5) / 40)).toFixed(3)})`);
    if (t < M.DAWN && torch) { p.c.globalAlpha = .16; p.disc(hx, hy - 4, Math.max(20, w * .07), '#ffe08a'); p.c.globalAlpha = 1; }
    // The storm rolls in over the ridges.
    if (t > M.STORM[0] - 30 && t < M.STORM[1]) {
      const cx = U(.66) + (t < M.STORM[0] ? (M.STORM[0] - t) / 30 * w * .3 : 0), cy = V(.2), stormy = t >= M.STORM[0];
      p.ellipse(cx, cy, w * .12, h * .06, stormy ? '#5b6270' : '#8a919c'); p.ellipse(cx - w * .06, cy + 2, w * .07, h * .045, stormy ? '#4a505c' : '#7a818c');
      if (stormy) for (let i = 0; i < 16; i++) p.r(cx - w * .1 + (i * 13 % 40) / 40 * w * .2, cy + h * .05 + ((t * 7 + i * 5) % 12), 1, 4, '#8fb8d8');
    }
    // You. Rain on you in a storm leg, the red jacket on if you packed it, poles on scree.
    const cost = anim?.cost, wet = cost?.stormy;
    if (wet) for (let i = 0; i < 12; i++) p.r(hx - 12 + (i * 7 % 24), hy - 26 + ((t * 9 + i * 7) % 22), 1, 3, '#8fb8d8');
    if (s.ended === 'lake' && last) {
      const k = Math.min(1, last.t / 1.2); p.blit(HIKER, hx + k * 14, hy - 20 * Math.sin(Math.PI * k) - 6, 2, -k * Math.PI * 2);
      if (k === 1) for (let i = 0; i < 10; i++) p.r(hx + 14 + Math.cos(i) * 8, hy + Math.sin(i * 3) * 3, 2, 2, PAPER);
    } else {
      p.blit(wet && s.packed.includes('jacket') ? HIKER_JACKET : HIKER, hx, hy - 10, 2);
      if (cost?.poles) { p.line(hx - 7, hy - 8, hx - 10, hy + 1, INK); p.line(hx + 7, hy - 8, hx + 10, hy + 1, INK); }
      if (t < M.DAWN && torch) p.r(hx - 1, hy - 19, 3, 2, '#fff6c8');
      if (wet && !s.packed.includes('jacket') && !shell.reduced.matches) p.text('BRR', hx + 8, hy - 24, PAPER, 1);
    }
    // What the leg you're looking at costs, over its end.
    if (look) {
      const c2 = M.leg(s, look.edge), label = `${c2.minutes} MIN, -${c2.energy} ENERGY`, half = p.textWidth(label) / 2 + 3;
      const tx = Math.max(x + half, Math.min(x + w - half, NX(look.to) / C)), ty = Math.max(y + 3, NY(look.to) / C - 22);
      const short = c2.energy >= s.energy && !s.snacks && M.NODES[look.to].kind !== 'lake';
      p.tag(label, tx, ty, PAPER, short ? '#ad343c' : INK, 1);
    }
  }
  // Scanline dark overlay with a round hole of light around x, y, and a softer ring outside it.
  function night(x, y, w, h, cx, cy, rad, a) {
    const c = p.c, outer = rad * 1.35, full = `rgba(18,22,52,${a})`, half = `rgba(18,22,52,${(a * .55).toFixed(3)})`;
    for (let row = Math.floor(y); row < y + h; row++) {
      const dy = row - cy, h2 = Math.abs(dy) < outer ? Math.sqrt(outer * outer - dy * dy) : -1, h1 = Math.abs(dy) < rad ? Math.sqrt(rad * rad - dy * dy) : -1;
      c.fillStyle = full;
      if (h2 < 0) { c.fillRect(x, row, w, 1); continue; }
      const l2 = Math.max(x, Math.round(cx - h2)), r2 = Math.min(x + w, Math.round(cx + h2));
      if (l2 > x) c.fillRect(x, row, l2 - x, 1);
      if (r2 < x + w) c.fillRect(r2, row, x + w - r2, 1);
      c.fillStyle = half;
      const l1 = h1 < 0 ? r2 : Math.max(x, Math.round(cx - h1)), r1 = h1 < 0 ? r2 : Math.min(x + w, Math.round(cx + h1));
      if (l1 > l2) c.fillRect(l2, row, l1 - l2, 1);
      if (h1 >= 0 && r2 > r1) c.fillRect(r1, row, r2 - r1, 1);
    }
  }

  // ----- Time, callouts and the walk -----
  function update(dt) {
    if (last) last.t += dt;
    if (queueT > 0) queueT -= dt;
    if (queueT <= 0 && queue.length) { const [text, tone] = queue.shift(); shell.callout(text, tone); queueT = .65; }
    if (wait) { wait.t -= dt; if (wait.t <= 0) { const fn = wait.fn; wait = null; fn(); return; } }
    if (!anim) return;
    anim.t += dt;
    const shown = anim.fromTime + (anim.toTime - anim.fromTime) * Math.min(1, anim.t / anim.dur);
    shell.level(M.clock(shown)); clockNow(shown);
    if (anim.t >= anim.dur) { anim = null; arrive(); }
  }
  const call = (text, tone = '') => queue.push([text, tone]);
  const once = (id, text, tone) => { if (!said.has(id)) { said.add(id); call(text, tone); } };
  function pulse(k) { const b = shell.box.querySelector(`.route-kit [data-item="${k}"]`); if (b) { b.classList.remove('is-used'); void b.offsetWidth; b.classList.add('is-used'); } }
  function arrive() {
    const {cost, events} = pending, notes = [];
    const at = M.NODES[s.at];
    // What the kit did on that leg.
    if (cost.torch) { pulse('torch'); once('torch', 'TORCH ON', 'good'); notes.push(`The torch kept you at full speed in the dark (${Math.round(cost.baseMinutes * 1.5) - cost.baseMinutes} min saved).`); }
    if (cost.dark) { once('dark', `DARK: +${cost.slower} MIN`, 'bad'); notes.push(`No torch, so that took ${cost.slower} min longer in the dark.`); }
    if (cost.poles) { pulse('poles'); once('poles', 'POLES: -1 ENERGY', 'good'); notes.push('Poles saved 1 energy on the scree.'); }
    for (const e of events) {
      if (e.type === 'storm') {
        if (e.jacket) { pulse('jacket'); call('STORM, JACKET ON', 'good'); notes.push('Caught in the storm. The jacket kept it from costing extra.'); }
        else { call('STORM: -2 ENERGY', 'bad'); shell.shake(); notes.push('Caught in the storm with no jacket: 2 extra energy.'); }
      }
      if (e.type === 'hut') { call('HUT: +2 ENERGY', 'good'); notes.push('A rest at the hut: +2 energy.'); }
      if (e.type === 'ate') { pulse('snacks'); call('SNACK BREAK: +3', 'good'); notes.push('Out of energy, so you ate a snack: +3.'); }
      if (e.type === 'animal') {
        const name = M.ANIMALS[e.animal];
        if (e.photo) { pulse('camera'); call(`${e.animal.toUpperCase()} +10`, 'good'); shell.burst(NX(s.at) + 20, NY(s.at) - 12, ['#ffffff', '#ffe08a'], 14); notes.push(`${name}, on film: +10.`); }
        else { call(`${e.animal.toUpperCase()}, NO CAMERA`); notes.push(`${name}. No camera, so no photo.`); }
      }
      if (e.type === 'summit') {
        const diff = e.at - M.SUNRISE;
        if (e.sunrise === 'made') { call('SUNRISE', 'win'); notes.push(`At the summit at ${M.clock(e.at)}${diff < 0 ? `, ${-diff} min to spare` : ''}. Sunrise: +40.`); setPose('hit'); }
        else if (e.sunrise === 'late') { call('JUST AFTER SUNRISE'); notes.push(`At the summit at ${M.clock(e.at)}, ${diff} min after sunrise. Still pretty: +20.`); }
        else { call('MISSED SUNRISE', 'bad'); notes.push(`At the summit at ${M.clock(e.at)}, ${diff} min after sunrise. Missed it.`); }
      }
      if (e.type === 'lake') { if (e.swim) pulse('swimmers'); call('BACKFLIP', 'win'); notes.push(e.swim ? 'The lake, and a backflip in. Swimmers: +5.' : 'The lake, and a backflip in.'); last = {t: 0}; wait = {t: 1.9, fn: finish}; }
      if (e.type === 'tired') { call('OUT OF ENERGY', 'bad'); notes.push(`Out of energy at ${at.name.toLowerCase()}. The walk ends here.`); wait = {t: 1.5, fn: finish}; }
    }
    if (!s.done && s.energy <= 2) call('LOW ENERGY', 'bad');
    pending = null;
    hud(); if (!s.done) mapBox(notes.join(' ') || `${at.name}, ${M.clock(s.time)}.`); else shell.announce(notes.join(' '));
    placeButtons();
  }

  function hud(pre) {
    const e = s.energy, tone = e <= 2 ? 'bad' : e <= 4 ? 'warn' : 'ok';
    if (pre) shell.meter(Math.max(0, e - pre.energy) / M.ENERGY * 100, `${e} → ${Math.max(0, e - pre.energy)}`, e - pre.energy <= 2 ? 'bad' : e - pre.energy <= 4 ? 'warn' : 'ok');
    else shell.meter(e / M.ENERGY * 100, `${e}/${M.ENERGY}`, tone);
    shell.level(M.clock(s.time)); shell.tag('SUNRISE ' + M.clock(M.SUNRISE)); shell.score('POINTS', String(M.score(s).total));
    clockNow(s.time, pre ? s.time + pre.minutes : null);
  }
  function clockNow(t, then = null) {
    const c = parts.clock; if (!c) return;
    c.querySelector('.route-now').style.left = pct(t) + '%';
    const ghost = c.querySelector('.route-then'); ghost.hidden = then == null; if (then != null) ghost.style.left = pct(then) + '%';
  }

  // The leg to a place: what it costs, and why, in words and small tags.
  function describe(n) {
    const cost = M.leg(s, n.edge), node = M.NODES[n.to], notes = [];
    if (cost.dark) notes.push(['bad', `dark, no torch: +${cost.slower} min`]);
    if (cost.torch) notes.push(['good', 'torch lights the way']);
    if (cost.poles) notes.push(['good', 'poles save 1 energy']);
    if (cost.stormy) notes.push(cost.jacket ? ['good', 'storm, jacket on'] : ['bad', 'storm, no jacket: +2 energy']);
    else if (cost.terrain === 'ridge' && s.time < M.STORM[0]) notes.push(['', 'storm due from 06:30']);
    if (node.kind === 'summit' && !s.sunrise) { const at = s.time + cost.minutes, d = M.SUNRISE - at; notes.push(d >= 0 ? ['good', `sunrise: there at ${M.clock(at)}, ${d} min early`] : at <= M.LATE ? ['', `there at ${M.clock(at)}, just after sunrise`] : ['bad', `there at ${M.clock(at)}, sunrise missed`]); }
    if (node.kind === 'hut' && !s.hut) notes.push(['good', 'hut: +2 energy']);
    if (node.animal && !s.seen.includes(node.animal)) notes.push(s.packed.includes('camera') ? ['good', `${node.animal}: +10 on film`] : ['', `${node.animal}, no camera`]);
    if (node.kind === 'lake') notes.push(['good', `the finish${s.packed.includes('swimmers') ? ', +5 for swimmers' : ''}`]);
    if (node.kind !== 'lake' && cost.energy >= s.energy) notes.push(s.snacks ? ['', 'you’ll need a snack'] : ['bad', 'not enough energy: the walk would end']);
    const text = `${node.name}: ${cost.minutes} min, ${cost.energy} energy, ${TERRAIN[cost.terrain][1].toLowerCase()}${notes.length ? '. ' + notes.map(n => n[1]).join(', ') : ''}.`;
    const html = `<strong>${escape(node.name)}</strong> <span class="route-cost">${cost.minutes} min · ${cost.energy} energy · ${TERRAIN[cost.terrain][1].toLowerCase()}</span>${notes.map(([tone, t]) => ` <span class="route-note"${tone ? ` data-tone="${tone}"` : ''}>${escape(t)}</span>`).join('')}`;
    return {text, html, cost};
  }
  function look(n) {
    preview = n ? n.to : null;
    const info = shell.box.querySelector('.route-info');
    if (!n) { hud(); if (info && info.dataset.idle) info.innerHTML = info.dataset.idle; return; }
    const d = describe(n);
    if (info) info.innerHTML = d.html + (touchPick ? ' <span class="route-note" data-tone="go">Tap again to walk</span>' : '');
    hud(d.cost);
  }
  function placeButtons() {
    const layer = parts.gos;
    if (!layer) return;
    layer.replaceChildren();
    if (!geo || !s || s.done || anim || phase !== 'map') return;
    for (const n of M.neighbours(s)) {
      const b = document.createElement('button'), d = describe(n); b.type = 'button'; b.className = 'route-go';
      if (M.NODES[n.to].kind === 'summit' && !s.sunrise) b.classList.add('is-summit');
      b.style.left = NX(n.to) + 'px'; b.style.top = NY(n.to) + 'px'; b.setAttribute('aria-label', 'Walk to ' + d.text);
      b.addEventListener('pointerdown', e => { touchPick = e.pointerType !== 'mouse'; });
      b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') look(n); });
      b.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && preview === n.to) look(null); });
      b.addEventListener('focus', () => { if (!touchPick) look(n); });
      b.addEventListener('blur', () => { if (preview === n.to && !touchPick) look(null); });
      b.addEventListener('click', () => {
        if (touchPick && preview !== n.to) { look(n); return; }
        touchPick = false; go(n.to);
      });
      layer.append(b);
    }
  }
  function go(to) {
    if (anim || s.done || phase !== 'map') return;
    const from = s.at, fromTime = s.time, result = M.walk(s, to);
    if (!result) return;
    preview = null; pending = result; queue = queue.slice(0, 1);
    anim = {from, to, t: 0, dur: shell.reduced.matches ? .2 : .6 + result.cost.minutes / 40, fromTime, toTime: s.time, cost: result.cost};
    parts.gos.replaceChildren();
    const info = shell.box.querySelector('.route-info'); if (info) info.textContent = `Walking to ${M.NODES[to].name.toLowerCase()}…`;
    shell.meter(s.energy / M.ENERGY * 100, `${s.energy}/${M.ENERGY}`, s.energy <= 2 ? 'bad' : s.energy <= 4 ? 'warn' : 'ok');
    shell.announce(`Walking to ${M.NODES[to].name.toLowerCase()}.`);
    shell.focusPlay();
  }
  function kitStrip() {
    return `<ul class="route-kit" aria-label="Your kit">${s.packed.map(k => `<li data-item="${k}" title="${escape(item(k).name)}: ${escape(item(k).short)}"><img src="${iconURL(k)}" alt="${escape(item(k).name)}"></li>`).join('') || '<li class="route-kit-empty">Nothing packed</li>'}</ul>`;
  }
  function mapBox(message) {
    const idle = escape(message);
    const box = shell.setBox(`<div class="route-bar"><p class="route-info" aria-live="polite">${idle}</p>
      <div class="route-side">${kitStrip()}<button type="button" class="arcade-button arcade-big route-eat" data-eat ${s.snacks ? '' : 'disabled'}><img src="${iconURL('snacks')}" alt="">${s.snacks ? `Eat snack (${s.snacks})` : 'No snacks'}</button></div></div>`, 'is-play');
    box.querySelector('.route-info').dataset.idle = idle;
    box.querySelector('[data-eat]').addEventListener('click', () => {
      if (s.energy >= M.ENERGY) { call('ENERGY ALREADY FULL'); return; }
      if (M.eat(s)) { call('+3 ENERGY', 'good'); pulse('snacks'); hud(); mapBox(`Snack break: energy ${s.energy}/${M.ENERGY}. Pick where to walk next.`); pulse('snacks'); }
    });
  }

  // ----- Packing -----
  function packScreen() {
    phase = 'pack'; el.dataset.phase = 'pack'; setPose('idle'); parts = {};
    let focus = null;
    const why = (k, extra = '') => {
      const box = shell.box.querySelector('.route-why'); if (!box) return;
      if (!k) { box.innerHTML = '<strong>Pack for a sunrise hike.</strong> Tap kit to pack it or take it out. 6 kg is the limit, so something stays behind.'; return; }
      const it = item(k); box.innerHTML = `<strong>${escape(it.name)}, ${it.kg} kg.</strong> ${escape(it.why)}${extra ? ` <span class="route-note" data-tone="bad">${escape(extra)}</span>` : ''}`;
    };
    const paint = () => {
      const kg = M.weight(packed), free = M.ALLOWANCE - kg;
      shell.meter(kg / M.ALLOWANCE * 100, `${kg}/${M.ALLOWANCE} KG`, kg >= M.ALLOWANCE ? 'bad' : kg >= M.ALLOWANCE - 1 ? 'warn' : 'ok');
      const cells = packed.flatMap(k => Array.from({length: item(k).kg}, (_, i) => `<i style="--c:${COLOUR[k]}">${i ? '' : `<img src="${iconURL(k)}" alt="">`}</i>`));
      while (cells.length < M.ALLOWANCE) cells.push('<i></i>');
      ui.querySelector('.route-cells').innerHTML = cells.join('');
      ui.querySelector('.route-load b').innerHTML = `${kg} of ${M.ALLOWANCE} kg<span>${free ? `, ${free} free` : ', full'}</span>`;
      ui.querySelectorAll('.route-item').forEach(b => {
        const on = packed.includes(b.dataset.item), heavy = !on && item(b.dataset.item).kg > free;
        b.setAttribute('aria-pressed', String(on)); b.classList.toggle('is-heavy', heavy);
        b.querySelector('.route-fit').textContent = on ? 'Packed' : heavy ? 'Too heavy' : '';
      });
      shell.box.querySelector('[data-close] span').textContent = packed.length ? '' : '(empty)';
    };
    ui.innerHTML = `<div class="route-pack" role="group" aria-label="Pack your bag, 6 kg limit">
      <div class="route-load"><span>BAG</span><div class="route-cells" aria-hidden="true"></div><b aria-live="polite"></b></div>
      ${M.ITEMS.map(i => `<button type="button" class="route-item" data-item="${i.key}" aria-describedby="route-why"><img src="${iconURL(i.key)}" alt=""><span><strong>${escape(i.name)}</strong><b class="route-kg">${'■'.repeat(i.kg)} ${i.kg} kg</b><small>${escape(i.short)}</small><em class="route-fit"></em></span></button>`).join('')}</div>`;
    ui.querySelectorAll('.route-item').forEach(b => {
      const k = b.dataset.item;
      b.addEventListener('pointerenter', () => why(k)); b.addEventListener('focus', () => why(k));
      b.addEventListener('pointerleave', () => { if (focus !== k) why(focus); });
      b.addEventListener('click', () => {
        focus = k;
        const next = M.toggle(packed, k);
        if (next === packed) {
          const free = M.ALLOWANCE - M.weight(packed);
          why(k, `Needs ${item(k).kg} kg and there ${free === 1 ? 'is' : 'are'} ${free} kg free. Take something out first.`);
          shell.callout('TOO HEAVY', 'bad'); shell.shake(); setPose('attack'); b.classList.remove('is-refused'); void b.offsetWidth; b.classList.add('is-refused');
          return;
        }
        const added = next.length > packed.length; packed = next;
        setPose(M.weight(packed) >= M.ALLOWANCE ? 'attack' : 'idle');
        if (added) { const r = b.getBoundingClientRect(), g = el.getBoundingClientRect(); shell.burst(r.left - g.left + 24, r.top - g.top + r.height / 2, [COLOUR[k], '#ffffff'], 10); }
        why(k); paint();
      });
    });
    shell.level('PACKING'); shell.tag('LIMIT 6 KG'); shell.score('POINTS', '0'); shell.hideMeter(false);
    const box = shell.setBox(`<div class="route-bar"><p class="route-why" id="route-why"></p>
      <button type="button" class="arcade-button arcade-primary arcade-big" data-close>Close the bag<span></span> <b aria-hidden="true">▶</b></button></div>`, 'is-play');
    box.querySelector('[data-close]').addEventListener('click', briefing);
    paint(); shell.layout(); layout();
    ui.querySelector('.route-item').focus({preventScroll: true}); why(null);
  }

  // ----- The bridge: what's in the bag means this for the walk -----
  function mapParts() {
    ui.innerHTML = `<div class="route-clock" aria-hidden="true"><div class="route-track">
        <i class="route-night" style="width:${pct(M.DAWN)}%">DARK</i><i class="route-dawn" style="left:${pct(M.DAWN)}%;width:${pct(M.SUNRISE) - pct(M.DAWN)}%"></i>
        <i class="route-storm" style="left:${pct(M.STORM[0])}%;width:${pct(M.STORM[1]) - pct(M.STORM[0])}%">STORM</i>
        <b class="route-sun" style="left:${pct(M.SUNRISE)}%">SUNRISE ${M.clock(M.SUNRISE)}</b>
        <i class="route-then" hidden></i><i class="route-now"></i></div></div>
      <details class="route-key"><summary>Map key</summary><ul>
        <li><i class="route-sw" style="--c:#8a6a3c"></i>Path</li><li><i class="route-sw" style="--c:#6f6a62"></i>Scree, poles help</li>
        <li><i class="route-sw" style="--c:#3a2f28"></i>Steep, quick but 2 energy</li><li><i class="route-sw" style="--c:#b23a48"></i>Exposed ridge, storm 06:30 to 07:15</li>
        <li><i class="route-dot" style="--c:#b23a48"></i>Hut, +2 energy once</li><li><i class="route-dot" style="--c:#e3b341"></i>Summit, by 06:15 for sunrise</li>
        <li><i class="route-dot" style="--c:#2a6f9e"></i>Lake, the finish</li><li><img src="${ANIMAL.marmot.toDataURL()}" alt="">Animal, +10 with the camera</li>
        <li><i class="route-ring"></i>Where you can walk next</li></ul>
        <p>Every leg costs time and energy. Hit 0 energy and the walk ends.</p>
        <p>Points: sunrise 40, each photo 10, lake 20, and 2 for each energy left at the lake.</p></details>
      <div class="route-gos"></div>`;
    parts = {clock: ui.querySelector('.route-clock'), key: ui.querySelector('.route-key'), gos: ui.querySelector('.route-gos')};
    parts.key.addEventListener('toggle', () => { keyOpen = parts.key.open; });
  }
  function briefing() {
    phase = 'brief'; s = M.createTrip(packed); last = null; el.dataset.phase = 'build';
    shell.$('.arcade-meter-label').textContent = 'ENERGY';
    mapParts();
    const lines = M.ITEMS.map(i => {
      const on = packed.includes(i.key), text = BRIEF[i.key][on ? 0 : 1];
      return text ? `<li class="${on ? 'is-on' : 'is-off'}"><img src="${iconURL(i.key)}" alt=""><span><strong>${on ? '✓' : '✗'} ${escape(i.name)}</strong> ${escape(text)}</span></li>` : '';
    }).join('');
    const brief = document.createElement('div'); brief.className = 'route-brief';
    brief.innerHTML = `<span class="arcade-label">KIT CHECK · ${M.weight(packed)} OF ${M.ALLOWANCE} KG</span><p class="route-brief-lead">It’s ${M.clock(M.START)} and dark. Summit by ${M.clock(M.SUNRISE)} for sunrise, then down to the lake. Here’s what your bag means:</p><ul>${lines}</ul>`;
    ui.append(brief); parts.brief = brief;
    const box = shell.setBox(`<div class="route-bar"><p class="route-help">You start with 8 energy. The clock, the sunrise and the storm are along the top.</p>
      <div class="route-side"><button type="button" class="arcade-button arcade-big" data-back>◀ Repack</button><button type="button" class="arcade-button arcade-primary arcade-big" data-set>Set off <span aria-hidden="true">▶</span></button></div></div>`, 'is-play');
    box.querySelector('[data-back]').addEventListener('click', () => { s = null; ui.replaceChildren(); shell.$('.arcade-meter-label').textContent = 'BAG'; packScreen(); });
    box.querySelector('[data-set]').addEventListener('click', setOff);
    hud(); shell.layout(); layout();
    box.querySelector('[data-set]').focus({preventScroll: true});
    shell.announce(brief.innerText);
  }
  function setOff() {
    phase = 'map'; parts.brief?.remove(); delete parts.brief; running = true;
    hud(); mapBox(`Tap or point at a gold ring to see what that walk costs. Summit by ${M.clock(M.SUNRISE)}, then the lake.`);
    layout();
    call(M.clock(M.START)); if (s.packed.includes('torch')) pulse('torch');
    shell.announce(`It’s ${M.clock(M.START)} and dark. Sunrise is at ${M.clock(M.SUNRISE)}. Tab through the places you can walk to; each says what it costs.`);
    parts.gos.querySelector('.route-go')?.focus({preventScroll: true});
  }

  // ----- Result -----
  // What each item did on the walk, or what leaving it behind cost.
  function kitReport() {
    const k = s.kit, has = x => s.packed.includes(x), out = [];
    const add = (key, on, text) => { if (text) out.push({key, on, text}); };
    add('torch', has('torch'), has('torch') ? (k.torch ? `Saved ${k.torch} min in the dark.` : 'Never needed it.') : k.dark ? `Left behind. The dark cost ${k.dark} min.` : '');
    add('jacket', has('jacket'), has('jacket') ? (k.jacket ? `Saved ${k.jacket} energy in the storm.` : 'Stayed dry anyway.') : k.storm ? `Left behind. The storm cost ${k.storm} energy.` : '');
    add('snacks', has('snacks'), has('snacks') ? `${2 - s.snacks} of 2 eaten, +${(2 - s.snacks) * 3} energy.` : s.ended === 'tired' ? 'Left behind, and you ran out of energy.' : '');
    add('camera', has('camera'), has('camera') ? `${s.photos.length} photo${s.photos.length === 1 ? '' : 's'}, +${s.photos.length * 10}.` : s.seen.length ? `Left behind. You saw ${s.seen.length} animal${s.seen.length === 1 ? '' : 's'}, worth ${s.seen.length * 10}.` : '');
    add('poles', has('poles'), has('poles') ? (k.poles ? `Saved ${k.poles} energy on scree.` : 'No scree legs on this route.') : k.scree ? `Left behind. Scree cost ${k.scree} extra energy.` : '');
    add('swimmers', has('swimmers'), has('swimmers') ? (s.ended === 'lake' ? 'Worn for the backflip, +5.' : 'Never reached the lake.') : '');
    add('speaker', true, has('speaker') ? '2 kg that did nothing.' : '');
    return out;
  }
  function tip() {
    const k = s.kit, has = x => s.packed.includes(x);
    if (s.ended === 'tired') return has('snacks') ? 'Gentler paths. Steep, scramble and scree cost 2 energy or more.' : 'Pack snacks. They’re two lots of +3 energy when you run low.';
    if (s.sunrise !== 'made' && k.dark) return `Pack the torch. It would have saved ${k.dark} min in the dark.`;
    if (s.sunrise !== 'made') return 'Head straight up. The summit first, the animals and the lake after.';
    if (k.storm) return `Pack the jacket, or come down before 06:30. The storm cost ${k.storm} energy.`;
    if (!has('camera')) return 'Pack the film camera. Four animals, 10 points each.';
    if (s.photos.length < 4) return `Find the ${Object.keys(M.ANIMALS).filter(a => !s.photos.includes(a)).join(' and ')} too.`;
    if (!has('swimmers')) return 'Swimmers are 5 more points at the lake.';
    return 'Keep more energy for the lake: 2 points each.';
  }
  function finish() {
    running = false; queue = []; parts = {}; ui.replaceChildren(); el.dataset.phase = 'result';
    const sc = M.score(s), stars = M.stars(s), at = M.NODES[s.at];
    setPose(stars >= 2 ? 'defeated' : 'attack');
    const summit = s.sunrise === 'made' ? `Made it, ${M.clock(s.summitAt)}` : s.sunrise ? `${s.sunrise === 'late' ? 'Just after' : 'Missed'}, ${M.clock(s.summitAt)}` : 'Never got there';
    shell.result({
      title: TITLES[stars], stars,
      line: 'The trip was real: a few days camping in the Dolomites, an early start for a sunrise hike, and a backflip into a freezing alpine lake.',
      rows: [['Sunrise', summit], ['On film', s.photos.length ? s.photos.map(a => a[0].toUpperCase() + a.slice(1)).join(', ') : 'Nothing'],
        ['Finished', s.ended === 'lake' ? `The lake, ${M.clock(s.time)}` : `Out of energy at ${at.name.toLowerCase()}`], ['Points', String(sc.total)]],
      source: '<p>The route, the times, the weather, the kit and what it does, and the animals are all made up for the game. The trip itself, the early start, the sunrise and the backflip into the lake are real.</p>',
    });
    // How the bag played out, under the result rows.
    const debrief = document.createElement('div'); debrief.className = 'route-debrief';
    debrief.innerHTML = `<span class="arcade-label">HOW YOUR BAG DID</span><ul>${kitReport().map(r => `<li class="${r.on ? 'is-on' : 'is-off'}"><img src="${iconURL(r.key)}" alt=""><span><strong>${escape(item(r.key).name)}</strong> ${escape(r.text)}</span></li>`).join('') || '<li>An empty bag. Nothing to help, nothing to carry.</li>'}</ul>
      <p class="route-points">Points: sunrise ${sc.sunrise}, photos ${sc.photos}, lake ${sc.lake}, energy left ${sc.energy}.</p><p class="route-tip"><strong>Next time:</strong> ${escape(tip())}</p>`;
    shell.box.querySelector('.arcade-rows')?.after(debrief);
    shell.$('.arcade-meter-label').textContent = 'BAG';
  }

  async function begin() {
    const token = ++run; running = false; anim = null; s = null; pending = null; wait = null; queue = []; preview = null; said = new Set(); parts = {};
    ui.replaceChildren(); phase = 'pack';
    shell.$('.arcade-meter-label').textContent = 'BAG';
    el.dataset.phase = 'intro';
    if (!introSeen) {
      shell.layout();
      await shell.intro({
        label: 'EXPLORER VS THE BAGGAGE ALLOWANCE', title: 'Route finder.',
        text: 'A sunrise hike in the Dolomites. First pack a bag: 6 kg at most, and each item says what it does on the walk. Then pick a route across the map one leg at a time. Reach the summit by 06:15 for sunrise, then get down to the lake.',
        controls: [['Click', 'Pack, then pick where to walk', 'mouse'], ['Tap', 'Pack. On the map, tap a place to see it, tap again to go', 'touch'], ['Tab, Enter', 'Everything by keyboard', 'mouse']], button: 'Start packing',
      });
      if (token !== run) return;
      introSeen = true;
    }
    packed = []; packScreen();
  }
  const game = {get running() { return running; }, update, render, layout, restart() { begin(); }, destroy() { run++; running = false; }};
  shell.attach(game);
  begin();
  return shell;
}
