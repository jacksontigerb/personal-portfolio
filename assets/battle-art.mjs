// Hand drawn on a 64 × 64 logical grid. Shapes go on a base layer, which is
// shaded (light from the top left) and outlined automatically; faces and small
// markings go on a detail layer on top. No remote art, textures or frame loop.
const INK = '#292a2c', PAPER = '#fbfbfa', S = 64;
const tones = new Map();
function tone(hex, amount) {
  const id = hex + amount;
  if (!tones.has(id)) {
    const n = parseInt(hex.slice(1), 16);
    const f = v => Math.max(0, Math.min(255, Math.round(amount > 0 ? v + (255 - v) * amount : v * (1 + amount))));
    tones.set(id, '#' + ((1 << 24) | (f(n >> 16) << 16) | (f(n >> 8 & 255) << 8) | f(n & 255)).toString(16).slice(1));
  }
  return tones.get(id);
}
function layer() {
  const cells = new Array(S * S).fill(null);
  const px = (x, y, col) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < S && y < S) cells[y * S + x] = col; };
  const rect = (x, y, w, h, col) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, col); };
  const ellipse = (cx, cy, rx, ry, col) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / (rx + .4), dy = (y - cy) / (ry + .4);
        if (dx * dx + dy * dy <= 1) px(x, y, col);
      }
  };
  const poly = (points, col) => {
    const ys = points.map(p => p[1]), xs = points.map(p => p[0]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++)
      for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [xi, yi] = points[i], [xj, yj] = points[j];
          if ((yi > y + .5) !== (yj > y + .5) && x + .5 < (xj - xi) * (y + .5 - yi) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) px(x, y, col);
      }
  };
  const line = (points, col, t = 1) => {
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i - 1], [nx, ny] = points[i], n = Math.max(Math.abs(nx - x), Math.abs(ny - y)) || 1;
      for (let j = 0; j <= n; j++) rect(Math.round(x + (nx - x) * j / n), Math.round(y + (ny - y) * j / n), t, t, col);
    }
  };
  const clear = (x, y) => px(x, y, null);
  return {cells, px, rect, ellipse, poly, line, clear};
}
// A small pixel font for signs.
const GLYPHS = {'2':['111','001','111','100','111'], '3':['111','001','111','001','111'], '!':['1','1','1','0','1'], '1':['11','01','01','01','01']};
function text(L, str, x, y, col, scale = 1) {
  for (const ch of str) {
    const g = GLYPHS[ch];
    g.forEach((row, j) => [...row].forEach((bit, i) => { if (bit === '1') L.rect(x + i * scale, y + j * scale, scale, scale, col); }));
    x += (g[0].length + 1) * scale;
  }
}
function render(B, D) {
  const at = (x, y) => (x < 0 || y < 0 || x >= S || y >= S) ? null : B.cells[y * S + x];
  const out = new Array(S * S).fill(null);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const c = at(x, y);
    if (!c) {
      if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) out[y * S + x] = INK;
      continue;
    }
    const lit = at(x, y - 1) !== c || at(x - 1, y) !== c;
    const dark = at(x, y + 1) !== c || at(x + 1, y) !== c;
    out[y * S + x] = lit && !dark ? tone(c, .24) : dark && !lit ? tone(c, -.26) : !lit && at(x, y + 2) !== c ? tone(c, -.12) : c;
  }
  D.cells.forEach((c, i) => { if (c) out[i] = c; });
  return out;
}
// Eyes look left, towards Jackson.
function eye(D, x, y, w, h, {lid = 0, closed = false, look = -1} = {}) {
  if (closed) { D.rect(x - 1, y + Math.floor(h / 2), w + 2, 2, INK); return; }
  D.rect(x - 1, y - 1, w + 2, h + 2, INK);
  D.rect(x, y, w, h, PAPER);
  const p = Math.max(2, Math.floor(Math.min(w, h) / 2));
  D.rect(look < 0 ? x : look > 0 ? x + w - p : x + Math.floor((w - p) / 2), y + h - p, p, p, INK);
  if (lid) D.rect(x, y, w, lid, INK);
}
// Squeezed shut: > on the left eye, < on the right. Calls come in pairs.
let squints = 0;
function squint(D, x, y, w) {
  const left = squints++ % 2 === 0, near = left ? x + w : x, far = left ? x : x + w;
  D.line([[far, y], [near, y + 2], [far, y + 4]], INK, 1);
}

const BOSSES = {
  allrounder(B, D, pose) {
    const paper = '#efe7cf', blue = '#5d7fa3', green = '#3e7654', red = '#b23a48', yellow = '#e3b341', pink = '#e58fa0';
    if (pose === 'defeated') {
      B.rect(6, 44, 52, 14, paper); B.ellipse(6, 51, 4, 7, tone(paper, -.12)); B.ellipse(58, 51, 4, 7, tone(paper, -.12));
      D.rect(20, 48, 6, 6, INK); D.rect(21, 49, 4, 4, paper); D.rect(29, 50, 16, 2, blue);
      eye(D, 12, 49, 4, 3, {closed: true}); eye(D, 48, 49, 4, 3, {closed: true});
      B.rect(40, 36, 16, 4, yellow); B.rect(36, 36, 4, 4, pink); B.poly([[56, 36], [61, 38], [56, 40]], '#e8d2a8');
      return;
    }
    const attack = pose === 'attack', hit = pose === 'hit', end = attack ? 60 : 52;
    B.rect(15, 9, 34, end - 9, paper);
    B.ellipse(32, 9, 18, 4, tone(paper, -.1));
    B.ellipse(30, end, 17, 3, tone(paper, -.1));
    // Arms, and a pencil held ready.
    D.line([[15, 32], [8, 38], [5, 33]], INK, 2);
    D.line(attack ? [[48, 30], [56, 22]] : [[48, 32], [55, 38]], INK, 2);
    const py = attack ? 5 : 26;
    B.rect(54, py + 3, 5, 14, yellow); B.rect(54, py, 5, 3, pink); B.poly([[54, py + 17], [59, py + 17], [56.5, py + 22]], '#e8d2a8');
    D.px(56, py + 21, INK); D.rect(55, py + 5, 1, 10, tone(yellow, .35));
    if (hit) squint(D, 21, 14, 7), squint(D, 36, 14, 7);
    else {
      eye(D, 21, 15, 7, 5, {lid: 1}); eye(D, 36, 15, 7, 5, {lid: 1});
      D.line([[20, 11], [28, 13]], INK, 1); D.line([[36, 13], [44, 11]], INK, 1);
    }
    D.rect(26, 22, 12, 4, INK); D.rect(27, 23, 10, 2, PAPER); D.rect(30, 23, 1, 2, INK); D.rect(34, 23, 1, 2, INK);
    const lengths = [14, 10, 12, 8, 11];
    [29, 36, 43, 50].slice(0, attack ? 4 : 3).forEach((y, i) => {
      D.rect(20, y, 6, 6, INK); D.rect(21, y + 1, 4, 4, paper);
      D.rect(29, y + 2, lengths[i], 2, blue);
      if (i === 0) D.line([[21, y + 2], [23, y + 4], [27, y - 2]], green, 1);
      if (i === 1 && hit) { D.line([[21, y + 1], [24, y + 4]], red, 1); D.line([[24, y + 1], [21, y + 4]], red, 1); }
    });
    if (attack) { D.rect(4, 50, 6, 1, INK); D.rect(2, 54, 8, 1, INK); }
  },
  master(B, D, pose) {
    const paper = '#f6f1e3', page2 = '#e4dcc6', page3 = '#cfc6ad', clip = '#3a3f45', steel = '#aeb6be', blue = '#6a859d', red = '#b23a48', green = '#3e7654';
    const done = pose === 'defeated', hit = pose === 'hit', attack = pose === 'attack';
    B.rect(15, 18, 42, 42, page3); B.rect(12, 21, 42, 40, page2); B.rect(8, 24, 42, 37, paper);
    for (let y = 27; y < 60; y += 3) D.rect(51, y, 3, 1, tone(page2, -.3));
    if (!done) for (let y = 44, i = 0; y < 58; y += 4, i++) D.rect(13, y, [30, 26, 32, 18][i], 1, blue);
    B.rect(20, 15, 22, 9, clip);
    D.line([[23, 15], [21, 6], [29, 6]], steel, 2); D.line([[39, 15], [41, 6], [33, 6]], steel, 2);
    B.ellipse(9, 20, 6, 6, red); text(D, '!', 8, 17, PAPER);
    if (done) {
      eye(D, 15, 30, 7, 5, {closed: true}); eye(D, 33, 30, 7, 5, {closed: true});
      D.rect(16, 42, 28, 15, green); D.rect(18, 44, 24, 11, paper); D.line([[23, 49], [27, 52], [36, 45]], green, 2);
      return;
    }
    if (hit) { squint(D, 15, 28, 7); squint(D, 33, 28, 7); }
    else {
      eye(D, 15, 29, 7, 6, {lid: 2}); eye(D, 33, 29, 7, 6, {lid: 2});
      D.line([[14, 25], [22, 27]], INK, 1); D.line([[32, 27], [40, 25]], INK, 1);
    }
    D.rect(21, 38, 14, 2, INK); D.px(20, 39, INK); D.px(35, 39, INK);
    const flying = attack ? [[0, 4], [48, 0], [56, 12]] : hit ? [[54, 8]] : [];
    flying.forEach(([x, y]) => { B.poly([[x, y + 4], [x + 4, y], [x + 8, y + 4], [x + 4, y + 8]], paper); D.line([[x + 3, y + 3], [x + 5, y + 5]], blue, 1); });
  },
  researcher(B, D, pose) {
    const slime = '#5fa383', shine = '#c5e8d4', atom = '#eef6f1', red = '#b23a48', blue = '#6a859d';
    if (pose === 'defeated') {
      B.rect(3, 18, 28, 38, '#f6f1e3');
      for (let y = 23; y < 32; y += 4) D.rect(7, y, 18, 1, blue);
      D.rect(9, 36, 3, 14, INK); D.rect(9, 36, 11, 3, INK); D.rect(9, 42, 8, 3, INK);
      D.line([[5, 53], [29, 33]], red, 2);
      B.ellipse(54, 50, 13, 10, slime); B.ellipse(54, 42, 7, 6, slime);
      eye(D, 47, 43, 4, 3, {lid: 1}); eye(D, 55, 43, 4, 3, {lid: 1});
      D.line([[48, 50], [54, 50], [56, 48]], INK, 1); D.rect(46, 39, 2, 2, shine);
      return;
    }
    const attack = pose === 'attack', hit = pose === 'hit', spread = attack ? 5 : 0;
    B.ellipse(32, 48, 25 + spread, 12 - spread / 2, slime);
    B.ellipse(32, 36, 17, 15, slime);
    [[12, 55, 5], [44, 56, 6], [26, 58, 4]].forEach(([x, y, h]) => B.rect(x, y, 4, h, slime));
    // A fluorinated carbon chain for antennae.
    const chain = [[32, 22], [28, 15], [33, 9], [29, 3]];
    D.line(chain, INK, 1);
    [[28, 15, 22, 15], [33, 9, 39, 9], [29, 3, 23, 3]].forEach(([x, y, fx, fy]) => D.line([[x, y], [fx, fy]], INK, 1));
    [[22, 15], [39, 9], [23, 3], [34, 16]].forEach(([x, y]) => { D.ellipse(x, y, 2, 2, INK); D.rect(x - 1, y - 1, 2, 2, atom); });
    D.rect(19, 28, 5, 2, shine); D.rect(18, 30, 2, 3, shine); D.rect(48, 44, 2, 2, shine);
    if (hit) { squint(D, 22, 32, 7); squint(D, 35, 32, 7); D.rect(27, 44, 8, 2, INK); }
    else {
      eye(D, 22, 33, 8, 5, {lid: attack ? 1 : 2}); eye(D, 36, 33, 8, 5, {lid: attack ? 1 : 2});
      if (attack) { D.rect(26, 42, 12, 5, INK); D.rect(27, 45, 10, 1, '#8b2d3a'); }
      else D.line([[25, 45], [35, 45], [40, 41]], INK, 1);
    }
    if (attack) { B.ellipse(5, 38, 3, 3, slime); B.ellipse(11, 44, 2, 2, slime); }
  },
  builder(B, D, pose) {
    const body = '#b23a48', glass = '#8fb8d8', tyre = '#34363a', hub = '#b9c0c7', yellow = '#e3b341', wood = '#c4a56a';
    const done = pose === 'defeated', attack = pose === 'attack', hit = pose === 'hit';
    const wy = done ? 38 : 50, lift = attack ? -5 : 0;
    if (done) {
      B.rect(0, 47, 64, 4, wood);
      D.line([[2, 51], [9, 61], [16, 51], [23, 61], [30, 51], [37, 61], [44, 51], [51, 61], [58, 51], [63, 57]], tone(wood, -.35), 1);
      B.rect(2, 51, 3, 12, wood); B.rect(59, 51, 3, 12, wood);
    }
    B.poly([[4, wy - 10 + lift], [50, wy - 12], [60, wy - 10], [60, wy - 1], [6, wy - 1], [3, wy - 5 + lift]], body);
    B.poly([[18, wy - 11 + lift / 2], [25, wy - 23 + lift / 2], [46, wy - 23], [51, wy - 11]], body);
    D.poly([[21, wy - 12 + lift / 2], [27, wy - 21 + lift / 2], [35, wy - 21], [35, wy - 12]], glass);
    D.poly([[37, wy - 21], [45, wy - 21], [48, wy - 12], [37, wy - 12]], glass);
    D.line([[29, wy - 19 + lift / 2], [26, wy - 14 + lift / 2]], PAPER, 1);
    B.rect(52, wy - 25, 11, 3, '#3a3f45'); B.rect(56, wy - 22, 2, 11, '#3a3f45');
    D.line([[56, wy - 12], [58, wy - 36]], INK, 1); D.ellipse(58, wy - 37, 2, 2, INK); D.px(58, wy - 37, yellow);
    D.rect(9, wy - 6, 48, 2, PAPER); D.ellipse(40, wy - 5, 4, 4, PAPER); text(D, '1', 39, wy - 7, INK);
    if (hit) squint(D, 6, wy - 11 + lift, 5);
    else { eye(D, 6, wy - 10 + lift, 6, 4, {lid: 1}); D.line([[5, wy - 13 + lift], [12, wy - 11 + lift]], INK, 1); }
    D.rect(3, wy - 5 + lift, 9, 3, INK); [4, 6, 8, 10].forEach(x => D.px(x, wy - 4 + lift, PAPER));
    D.rect(14, wy - 9, 3, 2, yellow);
    [[16, wy + lift / 2], [48, wy]].forEach(([x, y]) => {
      B.ellipse(x, y, 8, 8, tyre);
      for (let a = 0; a < 8; a++) D.px(x + Math.round(Math.cos(a * Math.PI / 4 + (attack ? .4 : 0)) * 7), y + Math.round(Math.sin(a * Math.PI / 4 + (attack ? .4 : 0)) * 7), '#5b5e63');
      D.ellipse(x, y, 3.5, 3.5, hub); D.rect(x - 1, y - 1, 2, 2, INK);
    });
    if (attack) { [[58, wy + 3, 5], [60, wy + 7, 3]].forEach(([x, y, w]) => D.rect(x, y, w, 1, INK)); B.ellipse(61, wy + 5, 3, 2, '#ddd6c6'); }
    if (hit) { B.ellipse(30, wy - 30, 5, 4, '#cfcac0'); B.ellipse(36, wy - 33, 4, 3, '#cfcac0'); }
  },
  operator(B, D, pose) {
    const cas = '#2f6b4f', cap = '#b9c0c7', label = '#f3efe2', green = '#3e7654', red = '#b23a48', gold = '#c4a56a', yellow = '#e3b341', mint = '#cfe6d9';
    const done = pose === 'defeated', attack = pose === 'attack', hit = pose === 'hit';
    B.rect(24, 3, 16, 6, cap);
    B.rect(12, 9, 40, 49, cas);
    [[12, 9], [51, 9], [12, 57], [51, 57]].forEach(([x, y]) => B.clear(x, y));
    B.rect(16, 58, 9, 4, cas); B.rect(39, 58, 9, 4, cas);
    D.rect(46, 12, 1, 5, mint); D.rect(44, 14, 5, 1, mint);
    [0, 1, 2, 3].forEach(i => D.rect(14, 48 - i * 5, 2, 4, i < (done ? 1 : hit ? 1 : 2) ? red : tone(cas, .3)));
    if (done) { eye(D, 20, 15, 8, 5, {closed: true}); eye(D, 36, 15, 8, 5, {closed: true}); }
    else if (hit) { squint(D, 20, 13, 8); squint(D, 36, 13, 8); }
    else {
      eye(D, 20, 15, 8, 6, {lid: attack ? 0 : 1}); eye(D, 36, 15, 8, 6, {lid: attack ? 0 : 1});
      D.line([[19, 11], [28, 13]], INK, 1); D.line([[36, 13], [45, 11]], INK, 1);
    }
    D.rect(27, 23, 10, 2, INK);
    B.rect(18, 28, 32, 26, label);
    D.rect(21, 31, 1, 20, INK); D.rect(21, 50, 26, 1, INK);
    if (done) {
      D.line([[22, 34], [46, 39]], gold, 1);
      D.line([[22, 45], [34, 45], [39, 47], [46, 49]], red, 1);
      D.rect(40, 31, 2, 2, gold); D.rect(40, 35, 2, 2, red);
    } else {
      D.line([[22, 33], [32, 34], [36, 36]], green, 2);
      D.line(attack ? [[36, 36], [39, 42], [41, 49]] : hit ? [[36, 36], [38, 39], [37, 41], [41, 47]] : [[36, 36], [40, 40], [44, 48]], red, 2);
    }
    if (attack) {
      D.line([[22, 6], [18, 2], [21, 1], [16, -2]], yellow, 1);
      D.line([[42, 6], [46, 2], [43, 1], [48, -2]], yellow, 1);
    }
  },
  creator(B, D, pose) {
    const shell = '#2c2e33', screen = '#3b6e9e', off = '#22252a', card = '#dfe8f1', heart = '#d9485b', iris = '#b23a48';
    const done = pose === 'defeated', attack = pose === 'attack', hit = pose === 'hit';
    B.rect(14, 2, 36, 60, shell);
    [[14, 2], [49, 2], [14, 61], [49, 61]].forEach(([x, y]) => B.clear(x, y));
    D.rect(17, 7, 30, 50, done ? off : screen);
    D.rect(28, 4, 8, 2, '#4a4d54'); D.rect(28, 58, 8, 1, '#6b6f76');
    D.line([[14, 36], [6, 42], [3, 36]], INK, 2);
    if (done) {
      D.ellipse(32, 31, 7, 7, '#6b6f76'); D.ellipse(32, 31, 5, 5, off); D.rect(31, 22, 3, 8, off); D.rect(32, 23, 1, 8, '#6b6f76');
      D.line([[50, 36], [57, 42]], INK, 2);
      return;
    }
    const scroll = attack ? -3 : 0;
    D.rect(20, 10 + scroll, 24, 7, card); D.rect(21, 11 + scroll, 5, 5, heart); D.rect(28, 12 + scroll, 13, 1, '#9fb0c2'); D.rect(28, 14 + scroll, 9, 1, '#9fb0c2');
    D.rect(20, 45 + scroll, 24, 9, card); D.rect(22, 47 + scroll, 20, 1, '#9fb0c2'); D.rect(22, 50 + scroll, 14, 1, '#9fb0c2');
    if (hit) {
      D.line([[21, 31], [27, 29], [37, 33], [43, 30]], INK, 2);
      D.line([[40, 8], [36, 18], [41, 25]], PAPER, 1);
    } else {
      D.ellipse(32, 31, 13, 10, INK); D.ellipse(32, 31, 12, 9, PAPER);
      const ix = attack ? 26 : 28;
      D.line([[21, 29], [24, 30]], '#e3a0a8', 1); D.line([[42, 33], [39, 32]], '#e3a0a8', 1);
      D.ellipse(ix, 32, 5, 5, iris); D.ellipse(ix, 32, 2.5, 2.5, INK); D.rect(ix - 3, 29, 2, 2, PAPER);
      if (attack) { D.rect(19, 21, 26, 6, screen); D.rect(20, 26, 24, 2, INK); }
    }
    B.ellipse(50, 6, 5, 5, heart); text(D, '!', 50, 4, PAPER);
    D.line(attack ? [[50, 34], [58, 26]] : [[50, 36], [57, 42]], INK, 2);
    if (attack) [[4, 18], [8, 8], [55, 16]].forEach(([x, y]) => { B.rect(x, y + 1, 5, 2, heart); B.rect(x + 1, y, 1, 1, heart); B.rect(x + 3, y, 1, 1, heart); B.rect(x + 1, y + 3, 3, 1, heart); B.px(x + 2, y + 4, heart); });
  },
  rider(B, D, pose) {
    const brick = '#a8483a', mortar = '#d8cbb5', sign = '#f6f1e3', post = '#6b5a45', green = '#3e7654';
    const done = pose === 'defeated', attack = pose === 'attack', hit = pose === 'hit';
    const rows = done ? [51, 58] : [23, 30, 37, 44, 51, 58];
    const top = rows[0] - 1;
    B.rect(5, top, 54, 64 - top, mortar);
    rows.forEach((y, r) => {
      const shift = attack ? Math.max(0, 4 - r) : 0;
      for (let x = r % 2 ? -1 : 5; x < 59; x += 13) {
        const from = Math.max(x, 6), to = Math.min(x + 12, 58);
        if (to > from) B.rect(from - shift, y, to - from, Math.min(6, 63 - y), brick);
      }
    });
    if (done) {
      B.rect(4, 38, 24, 11, sign); text(D, '23', 9, 40, green, 2);
      B.rect(30, 45, 16, 2, post);
      eye(D, 14, 54, 5, 3, {closed: true}); eye(D, 40, 54, 5, 3, {closed: true});
      return;
    }
    B.rect(47, 10, 3, 13, post);
    B.rect(38, 1, 22, 13, sign); text(D, '23', 42, 3, green, 2);
    if (attack) B.rect(25, 13, 12, 6, brick);
    if (hit) { squint(D, 16, 31, 8); squint(D, 38, 31, 8); D.line([[31, 23], [28, 30], [32, 36], [29, 43]], INK, 1); }
    else {
      eye(D, 16, 32, 8, 5, {lid: 1}); eye(D, 38, 32, 8, 5, {lid: 1});
      D.line([[15, 28], [24, 31]], INK, 2); D.line([[38, 31], [47, 28]], INK, 2);
    }
    D.line([[20, 46], [25, 43], [31, 47], [37, 43], [43, 46]], INK, 2);
  },
  wanderer(B, D, pose) {
    const shell = '#6f5aa8', handle = '#3a3f45', tag = '#e3b341', sleeve = '#d9485b', wheel = '#34363a', zip = '#c4a56a', mint = '#5fa383', pink = '#e58fa0';
    const done = pose === 'defeated', attack = pose === 'attack', hit = pose === 'hit', bulge = attack ? 3 : 0;
    B.rect(23, 3, 18, 4, handle); B.rect(23, 3, 4, 10, handle); B.rect(37, 3, 4, 10, handle);
    B.rect(8 - bulge, 12, 48 + bulge * 2, 45, shell);
    [[8 - bulge, 12], [55 + bulge, 12], [8 - bulge, 56], [55 + bulge, 56]].forEach(([x, y]) => B.clear(x, y));
    [16, 47].forEach(x => D.rect(x, 14, 2, 41, tone(shell, -.2)));
    B.ellipse(14, 61, 3, 2, wheel); B.ellipse(50, 61, 3, 2, wheel);
    B.ellipse(49, 48, 4, 4, mint); D.rect(48, 47, 2, 2, PAPER);
    if (!hit) { B.rect(11, 45, 8, 6, pink); D.rect(13, 47, 4, 1, PAPER); }
    else B.rect(0, 20, 7, 5, pink);
    D.line([[40, 9], [57, 15]], INK, 1); B.rect(55, 15, 8, 12, tag); D.rect(58, 17, 2, 2, INK); D.rect(57, 21, 4, 1, INK); D.rect(57, 23, 3, 1, INK);
    if (done) {
      eye(D, 21, 22, 7, 5, {closed: true}); eye(D, 37, 22, 7, 5, {closed: true});
      D.rect(9, 36, 46, 2, zip); B.rect(52, 36, 10, 16, sleeve); D.rect(52, 50, 10, 2, tone(sleeve, .3));
      return;
    }
    if (hit) { squint(D, 21, 20, 7); squint(D, 37, 20, 7); }
    else {
      eye(D, 21, 21, 7, 6, {lid: attack ? 0 : 2}); eye(D, 37, 21, 7, 6, {lid: attack ? 0 : 2});
      D.line([[20, 17], [28, 20]], INK, 1); D.line([[37, 20], [45, 17]], INK, 1);
    }
    if (attack) {
      D.rect(12, 34, 40, 12, '#2b2335');
      for (let x = 13; x < 50; x += 4) { D.rect(x, 34, 3, 3, PAPER); D.rect(x + 2, 43, 3, 3, PAPER); }
      D.rect(38, 38, 12, 4, sleeve);
    } else {
      D.rect(9, 36, 46, 2, zip);
      for (let x = 10; x < 54; x += 2) D.px(x, 38, INK);
      B.rect(54, 39, 7, 6, sleeve);
    }
    D.rect(30, 35, 3, 6, zip); D.px(31, 40, INK);
  },
  skier(B, D, pose) {
    const chair = '#2a6f9e', seat = '#1f5279', metal = '#7a7f86', snow = '#f4f7fa', red = '#b23a48';
    const done = pose === 'defeated', attack = pose === 'attack', hit = pose === 'hit';
    const s = done ? 26 : attack ? -7 : 0;
    D.line([[0, 7], [63, 4]], INK, 2);
    [[6, 18], [58, 22], [9, 54], [57, 52]].forEach(([x, y]) => { D.rect(x - 1, y, 3, 1, snow); D.rect(x, y - 1, 1, 3, snow); D.px(x, y, '#9fb6c9'); });
    B.rect(28 + s, 2, 9, 7, metal);
    B.line([[32 + s, 9], [32 + s, 21]], metal, 2);
    B.rect(14 + s, 20, 36, 16, chair);
    B.rect(10 + s, 36, 44, 7, seat);
    B.rect(9 + s, 28, 4, 15, metal); B.rect(51 + s, 28, 4, 15, metal);
    B.rect(19 + s, 43, 2, 10, metal); B.rect(43 + s, 43, 2, 10, metal); B.rect(15 + s, 52, 34, 3, metal);
    if (!hit) { B.rect(14 + s, 18, 36, 3, snow); B.ellipse(22 + s, 18, 5, 2, snow); B.ellipse(42 + s, 18, 4, 2, snow); B.rect(12 + s, 34, 12, 2, snow); }
    else [[20, 58], [30, 60], [44, 57]].forEach(([x, y]) => B.rect(x + s, y, 3, 3, snow));
    [16, 28, 40].forEach(x => D.rect(x + s, 43, 1, 2, '#bcd3e4'));
    D.rect(41 + s, 23, 7, 6, PAPER); text(D, '1', 43 + s, 23, red);
    if (done || hit) { squint(D, 19 + s, 23, 7); squint(D, 31 + s, 23, 7); }
    else {
      eye(D, 19 + s, 24, 6, 5, {lid: 1}); eye(D, 30 + s, 24, 6, 5, {lid: 1});
      D.line([[18 + s, 21], [25 + s, 23]], INK, 1); D.line([[30 + s, 23], [37 + s, 21]], INK, 1);
    }
    D.rect(22 + s, 31, 11, 2, INK);
    if (attack) [[58, 26, 5], [60, 31, 3], [57, 36, 6]].forEach(([x, y, w]) => D.rect(x, y, w, 1, INK));
    if (done) { B.rect(3, 40, 22, 11, red); D.rect(6, 44, 16, 3, PAPER); B.rect(12, 51, 3, 12, metal); }
  },
};
const drawn = new Map();
export function drawBoss(canvas, key, pose = 'idle') {
  const id = key + pose;
  if (!drawn.has(id)) {
    const B = layer(), D = layer();
    squints = 0;
    BOSSES[key](B, D, pose);
    drawn.set(id, render(B, D));
  }
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, canvas.width, canvas.height);
  drawn.get(id).forEach((col, i) => { if (col) { c.fillStyle = col; c.fillRect(i % S, Math.floor(i / S), 1, 1); } });
}

// Small tangible objects accompany Jackson's attack instead of remirroring his sprite.
export function drawProp(canvas, key, moveIndex=1) {
  const c=canvas.getContext('2d');c.clearRect(0,0,16,16);
  const r=(x,y,w,h,col=INK)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
  if(key==='builder') {
    if(moveIndex===1){
      r(1,4,4,1,'#2a6f9e');r(0,8,5,1,'#2a6f9e');r(1,12,4,1,'#2a6f9e');
      r(7,2,7,12);r(8,3,5,10,'#ba6c32');r(6,6,9,4);r(9,4,3,8);r(10,7,1,2,PAPER);
    } else if(moveIndex===3){
      r(3,4,10,9);r(4,5,8,7,'#c4a56a');r(4,6,2,2,PAPER);r(10,6,2,2,PAPER);
      r(1,8,2,6);r(13,8,2,6);r(7,1,1,3);
    } else if(moveIndex===5){
      r(1,10,14,3);r(3,13,10,2);r(5,5,7,5,'#c4a56a');r(6,3,6,2,'#6a859d');
    } else {r(1,6,14,2,'#c4a56a');r(2,8,2,7);r(12,8,2,7);r(5,9,6,2,'#c4a56a');}
    return;
  }
  if(moveIndex===3&&(key==='allrounder'||key==='rider')){
    [2,9].forEach(x=>{r(x,2,3,3);r(x,6,4,5,'#a85414');r(x,11,1,4);r(x+3,11,1,3);});return;
  }
  switch(key) {
    case 'allrounder':
      r(2,2,5,5);r(2,2,2,2,PAPER);r(6,6,3,3);r(8,8,3,3);r(10,10,4,4);r(11,11,2,2,PAPER);break;
    case 'researcher':
      r(7,2,2,3);r(5,5,6,3);r(3,8,10,5);r(5,13,6,2);r(5,8,6,5,'#137975');r(5,8,2,2,PAPER);break;
    case 'creator':r(2,3,10,10);r(5,6,4,4,PAPER);r(12,6,3,5);break;
    case 'rider':r(4,2,6,10,'#a85414');r(2,11,12,3);r(2,14,12,1,PAPER);break;
    case 'wanderer':r(2,3,12,10);r(3,4,10,8,PAPER);r(5,6,6,1,'#6f5aa8');r(5,9,4,1,'#6f5aa8');break;
    case 'skier':r(4,1,2,12);r(10,1,2,12);r(4,13,4,2);r(10,13,4,2);break;
    default:r(3,1,10,14);r(4,2,8,12,PAPER);r(6,5,4,1);r(6,8,4,1);r(6,11,3,1);
  }
}
