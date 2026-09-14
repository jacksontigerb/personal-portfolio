// Nine pixel art worlds, painted to fit whatever screen the fight is on.
// Each scene is drawn in cells (one cell = several screen pixels) on two layers:
// `far` is the wall or sky, `near` is the floor and the furniture the fighters
// stand in front of. `floor` is the cell row where the fighters' feet are.
const INK = '#292a2c', PAPER = '#fbfbfa';
const FONT = {
  A:'010101111101101', B:'110101110101110', C:'011100100100011', D:'110101101101110', E:'111100110100111',
  F:'111100110100100', G:'011100101101011', H:'101101111101101', I:'111010010010111', K:'101101110101101', L:'100100100100111',
  N:'101111111101101', O:'111101101101111', P:'110101110100100', R:'110101110101101', S:'011100010001110',
  T:'111010010010010', U:'101101101101111', Y:'101101010010010', ' ':'000000000000000',
};
function painter(canvas, w, h) {
  canvas.width = w; canvas.height = h;
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, w, h);
  const r = (x, y, rw, rh, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh)); };
  const ellipse = (cx, cy, rx, ry, col) => {
    for (let y = -ry; y <= ry; y++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / ((ry + .5) * (ry + .5)))));
      r(cx - half, cy + y, half * 2 + 1, 1, col);
    }
  };
  const ring = (cx, cy, rad, col, t = 1) => {
    for (let a = 0; a < 64; a++) r(cx + Math.cos(a / 64 * Math.PI * 2) * rad, cy + Math.sin(a / 64 * Math.PI * 2) * rad, t, t, col);
  };
  const tri = (x1, x2, base, apexX, apexY, col) => {
    for (let y = Math.round(apexY); y <= base; y++) {
      const t = (y - apexY) / Math.max(1, base - apexY);
      const left = apexX + (x1 - apexX) * t, right = apexX + (x2 - apexX) * t;
      r(left, y, right - left + 1, 1, col);
    }
  };
  const line = (x0, y0, x1, y1, col, t = 1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) r(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, t, t, col);
  };
  const box = (x, y, bw, bh, fill, edge = INK) => { r(x, y, bw, bh, edge); r(x + 1, y + 1, bw - 2, bh - 2, fill); };
  const text = (str, x, y, col, k = 1) => {
    [...str].forEach((ch, n) => {
      const g = FONT[ch] || FONT[' '];
      for (let i = 0; i < 15; i++) if (g[i] === '1') r(x + (n * 4 + i % 3) * k, y + Math.floor(i / 3) * k, k, k, col);
    });
  };
  const textWidth = str => str.length * 4 - 1;
  const glow = (cx, cy, rx, ry, col) => { c.globalAlpha = .18; ellipse(cx, cy, rx, ry, col); c.globalAlpha = .14; ellipse(cx, cy, rx * .6, ry * .6, col); c.globalAlpha = 1; };
  return {c, r, ellipse, ring, tri, line, box, text, textWidth, glow};
}
// The fighters stand left and right, so furniture sits in the middle and at the edges.
function wall(p, w, floor, col, skirt) { p.r(0, 0, w, floor, col); p.r(0, floor - 3, w, 3, skirt); }
function perspective(p, w, h, floor, col, lineCol, rows = [3, 8, 15, 25, 40, 60]) {
  p.r(0, floor, w, h - floor, col);
  rows.forEach(y => { if (floor + y < h) p.r(0, floor + y, w, 1, lineCol); });
  for (let i = -12; i <= 12; i++) p.line(w / 2 + i * 14, floor, w / 2 + i * 40, h, lineCol);
}

const SCENES = {
  researcher: {
    particles: 'bubbles', tint: '#137975',
    // The select screen's Start fight sits in an instrument's display.
    holder(p, w, h, f, s, emit) {
      const {x0, y0, W, H, cx} = frame(s), top = y0 + H + 6;
      const bw = W + 36, bx = Math.round(cx - bw / 2);
      p.box(bx, top + 3, bw, Math.max(8, f + 10 - top), '#e9eeed'); p.r(bx - 2, top, bw + 4, 4, '#3a3f45');
      p.box(x0 - 5, y0 - 8, W + 10, top - (y0 - 8), '#dfe6e4');
      p.r(x0 - 4, y0 - 7, W + 8, 3, '#137975');
      p.r(x0 - 1, y0 - 1, W + 2, H + 2, '#0f2a28');
      p.ellipse(x0 + W - 3, y0 + H + 3, 1, 1, '#e3b341'); p.ellipse(x0 + W - 8, y0 + H + 3, 1, 1, '#b23a48'); p.r(x0 + 2, y0 + H + 3, 12, 1, '#9fb9b3');
      p.r(cx - 2, y0 - 13, 5, 2, '#3a3f45'); p.r(cx, y0 - 11, 1, 3, INK);
      const fx = bx + bw - 12;
      p.tri(fx - 6, fx + 6, top - 1, fx, top - 14, INK); p.tri(fx - 5, fx + 5, top - 2, fx, top - 12, '#dff0ea');
      p.tri(fx - 5, fx + 5, top - 2, fx, top - 7, '#5fa383'); p.r(fx - 1, top - 18, 3, 5, INK); p.r(fx, top - 17, 1, 4, '#dff0ea');
      emit.push([fx + .5, top - 19]);
    },
    far(p, w, h, f, s) {
      wall(p, w, f, '#d6e4e1', '#9fb9b3');
      for (let y = f - 4; y > 0; y -= 9) p.r(0, y, w, 1, '#c6d7d3');
      for (let y = f - 4, row = 0; y > 0; y -= 9, row++) for (let x = row % 2 ? 4 : 0; x < w; x += 9) p.r(x, y - 8, 1, 8, '#c6d7d3');
      const shelf = f - 44;
      if (shelf > 16) {
        p.r(4, shelf, w - 8, 2, '#7d8d89');
        const colours = ['#137975', '#e3b341', '#b23a48', '#6a859d', '#5fa383'];
        for (let x = 10, i = 0; x < w - 12; x += 11, i++) {
          const bh = 6 + (i * 7) % 5;
          p.box(x, shelf - bh, 6, bh, colours[i % 5]); p.r(x + 2, shelf - bh - 3, 2, 3, '#7d8d89');
          p.r(x + 1, shelf - bh + 2, 1, 2, PAPER);
        }
      }
      const top = Math.max(4, shelf - 38);
      if (shelf > 44) {
        p.box(10, top, 34, 24, PAPER);
        const cells = ['#5fa383', '#e3b341', '#6a859d', '#e58fa0', '#c6d7d3'];
        for (let row = 0; row < 5; row++) for (let col = 0; col < 9; col++) if (row > 0 || col === 0 || col === 8) p.r(12 + col * 3.4, top + 3 + row * 4, 3, 3, cells[(row + col) % 5]);
      }
      p.box(w - 40, Math.max(4, f - 78), 30, 34, '#eaf2f0'); p.r(w - 38, Math.max(4, f - 78) + 22, 26, 1, '#9fb9b3');
    },
    near(p, w, h, f, emit, s) {
      perspective(p, w, h, f, '#b9c6c3', '#aab8b5');
      if (s) return;
      const bw = Math.min(90, Math.round(w * .5)), bx = Math.round(w / 2 - bw / 2), top = f - 18;
      p.box(bx, top + 3, bw, 22, '#e9eeed'); p.r(bx - 2, top, bw + 4, 4, '#3a3f45');
      for (let x = bx + 8; x < bx + bw - 8; x += 20) p.r(x, top + 8, 10, 1, '#b9c6c3');
      p.box(bx + 6, top - 4, 22, 4, '#6a859d'); p.r(bx + 16, top - 10, 2, 6, '#3a3f45'); p.r(bx + 11, top - 11, 12, 1, INK);
      p.box(bx + 4, top - 14, 8, 6, '#3a3f45'); p.r(bx + 11, top - 12, 2, 2, '#8fb8d8');
      p.box(bx + 24, top - 13, 5, 5, '#e3b341');
      const fx = bx + bw - 14;
      p.tri(fx - 6, fx + 6, top - 1, fx, top - 14, INK); p.tri(fx - 5, fx + 5, top - 2, fx, top - 12, '#dff0ea');
      p.tri(fx - 5, fx + 5, top - 2, fx, top - 7, '#5fa383'); p.r(fx - 1, top - 18, 3, 5, INK); p.r(fx, top - 17, 1, 4, '#dff0ea');
      p.box(bx + bw - 32, top - 10, 7, 10, '#dff0ea'); p.r(bx + bw - 31, top - 5, 5, 4, '#6a859d');
      emit.push([fx + .5, top - 19], [bx + bw - 28.5, top - 11]);
    },
  },
  builder: {
    particles: 'dust', tint: '#7d6a1a',
    // Start fight is the front panel of a tool chest.
    holder(p, w, h, f, s) {
      const {x0, y0, W, H, cx} = frame(s), top = y0 - 6, bottom = Math.max(f + 2, y0 + H + 10);
      p.r(cx - 9, top - 4, 18, 2, '#7a7f86'); p.r(cx - 9, top - 4, 2, 4, '#7a7f86'); p.r(cx + 7, top - 4, 2, 4, '#7a7f86');
      p.box(x0 - 4, top, W + 8, bottom - top, '#b23a48');
      p.r(x0 - 3, top + 1, W + 6, 3, '#8f2d3a');
      p.r(x0 - 1, y0 - 1, W + 2, H + 2, '#8f2d3a');
      for (let y = y0 + H + 3; y < bottom - 4; y += 6) { p.r(x0 - 1, y, W + 2, 5, '#a3354a'); p.r(x0 - 1, y + 5, W + 2, 1, INK); p.r(cx - 5, y + 2, 10, 1, '#c9ccd0'); }
      p.ellipse(x0 + 1, bottom, 2, 2, INK); p.ellipse(x0 + W - 1, bottom, 2, 2, INK);
    },
    far(p, w, h, f, s) {
      wall(p, w, f, '#d9c79c', '#9a8660');
      for (let y = 4; y < f - 6; y += 4) for (let x = 2 + (y % 8 ? 2 : 0); x < w; x += 4) p.r(x, y, 1, 1, '#c4b287');
      const y = Math.max(8, f - 48), tool = '#6b5a45', tx = Math.round(w * .3);
      p.r(tx + 5, y, 3, 20, tool); p.r(tx, y, 13, 6, tool);
      p.line(tx + 21, y + 2, tx + 29, y + 20, tool, 2); p.ring(tx + 20, y + 2, 3, tool, 2);
      p.tri(tx + 35, tx + 55, y + 20, tx + 35, y, tool); p.r(tx + 31, y, 6, 8, tool);
      const ky = Math.max(10, f - 44), kx = Math.round(w * .7);
      p.ring(kx, ky, 8, INK); p.ellipse(kx, ky, 7, 7, PAPER); p.line(kx, ky, kx, ky - 5, INK); p.line(kx, ky, kx + 4, ky, INK);
      const hy = f - 16;
      p.ring(12, hy, 11, '#7d6a1a', 2);
      for (let a = 0; a < 8; a++) p.line(12, hy, 12 + Math.cos(a * Math.PI / 4) * 10, hy + Math.sin(a * Math.PI / 4) * 10, '#a58f3a');
      p.ellipse(12, hy, 2, 2, INK);
    },
    near(p, w, h, f, emit, s) {
      p.r(0, f, w, h - f, '#b8b0a2');
      for (let i = 0; i < w * (h - f) / 18; i++) p.r((i * 37) % w, f + (i * 53) % (h - f), 1, 1, '#a59d8f');
      p.ellipse(Math.round(w * .62), f + 18, 14, 3, '#9d968a');
      if (s) return;
      const bw = Math.min(96, Math.round(w * .52)), bx = Math.round(w / 2 - bw / 2), top = f - 16;
      p.r(bx + 3, top + 4, 3, 20, '#6b4f3a'); p.r(bx + bw - 6, top + 4, 3, 20, '#6b4f3a');
      p.box(bx, top, bw, 5, '#a07a45');
      p.box(bx + 2, top - 7, 10, 7, '#7a7f86'); p.r(bx + 12, top - 5, 4, 2, '#7a7f86');
      const tx = bx + 22, tw = bw - 30;
      p.r(tx, top - 2, tw, 2, '#e0c68f'); p.r(tx, top - 12, tw, 1, '#e0c68f');
      for (let x = tx; x < tx + tw - 4; x += 6) { p.line(x, top - 2, x + 3, top - 12, '#c9ab6b'); p.line(x + 3, top - 12, x + 6, top - 2, '#c9ab6b'); }
    },
  },
  skier: {
    particles: 'snow', tint: '#2a6f9e',
    // Start fight is the window of a mountain hut.
    holder(p, w, h, f, s) {
      const {x0, y0, W, H, cx} = frame(s), hx = x0 - 9, hw = W + 18, wallTop = y0 - 6;
      p.box(hx, wallTop, hw, Math.max(10, f + 2 - wallTop), '#8a5a3c', '#3a2a1c');
      for (let y = wallTop + 4; y < f; y += 4) p.r(hx + 1, y, hw - 2, 1, '#7a4e33');
      p.tri(hx - 7, hx + hw + 7, wallTop, cx, wallTop - 10, '#5a3a28');
      p.tri(cx - 14, cx + 14, wallTop - 5, cx, wallTop - 10, PAPER); p.r(hx - 7, wallTop - 2, hw + 14, 2, PAPER);
      p.box(x0 - 1, y0 - 1, W + 2, H + 2, '#cfe2f1', '#3a2a1c');
      p.r(x0 - 3, y0 + H + 1, W + 6, 2, PAPER);
      p.ellipse(cx, f + 2, Math.round(hw / 2) + 8, 3, '#eef4f8');
    },
    far(p, w, h, f, s) {
      const bands = ['#9cc3e0', '#aecfe8', '#c1dbee', '#d4e6f3', '#e6f0f7'];
      bands.forEach((col, i) => p.r(0, Math.floor(f * i / 5), w, Math.ceil(f / 5) + 1, col));
      p.tri(-20, w * .7, f, w * .28, f - Math.min(90, f * .8), '#8aa6bf');
      p.tri(w * .25 - 8, w * .31 + 8, f - Math.min(90, f * .8) * .62, w * .28, f - Math.min(90, f * .8), PAPER);
      p.tri(w * .35, w + 30, f, w * .74, f - Math.min(70, f * .62), '#7390ab');
      p.tri(w * .7, w * .78, f - Math.min(70, f * .62) * .64, w * .74, f - Math.min(70, f * .62), PAPER);
      const cy = Math.max(10, f - 64);
      p.line(0, cy, w, cy - 10, '#3a3f45');
      for (let x = 20; x < w; x += 46) { const y = cy - x * 10 / w; p.r(x, y, 1, 5, '#3a3f45'); p.r(x - 2, y + 5, 5, 2, '#2a6f9e'); }
      for (let x = 0; x < w; x += 7) { const th = 7 + (x * 13) % 6; p.tri(x - 4, x + 4, f - 1, x, f - th, '#3f5f6e'); }
    },
    near(p, w, h, f, emit, s) {
      p.r(0, f, w, h - f, '#eef4f8');
      for (let i = 0; i < 9; i++) p.ellipse((i * 47) % w, f + 6 + (i * 29) % Math.max(1, h - f - 8), 10, 1, '#d8e6ef');
      if (s) return;
      const x = Math.round(w * .5);
      p.r(x, f - 18, 2, 22, '#e07b28'); [f - 16, f - 10, f - 4].forEach(y => p.r(x, y, 2, 2, INK));
      p.ellipse(x + 1, f + 4, 4, 1, '#d8e6ef');
    },
  },
  rider: {
    particles: 'confetti', tint: '#a85414',
    // Start fight hangs on the finish gantry.
    holder(p, w, h, f, s) {
      const {x0, y0, W, H, cx} = frame(s), top = y0 - 12;
      p.box(x0 - 8, top, 5, f + 2 - top, '#c9ccd0'); p.box(x0 + W + 3, top, 5, f + 2 - top, '#c9ccd0');
      p.box(x0 - 10, top, W + 20, 10, '#3b7dd8'); p.text('FINISH', cx - 11, top + 3, PAPER);
      p.box(x0 - 1, y0 - 1, W + 2, H + 2, PAPER);
      for (let x = x0; x < x0 + W; x += 2) { p.r(x, y0 + H + 1, 1, 1, INK); p.r(x + 1, y0 + H + 2, 1, 1, INK); }
    },
    far(p, w, h, f, s) {
      p.r(0, 0, w, f, '#e9e2d6');
      const colours = ['#b08470', '#c49a7a', '#9f7765', '#b98d6c'];
      for (let x = 0, i = 0; x < w; x += 28, i++) {
        const top = f - 44 - (i * 11) % 16;
        p.r(x, top, 28, f - top, colours[i % 4]); p.r(x, top, 28, 2, '#6b5a45');
        for (let wy = top + 6; wy < f - 12; wy += 9) for (let wx = x + 4; wx < x + 24; wx += 8) p.box(wx, wy, 5, 6, '#efe6d6', '#6b5a45');
      }
      const by = Math.max(6, f - 52);
      for (let x = 0; x < w; x += 8) {
        const sag = Math.round(Math.sin(x / w * Math.PI * 3) * 3);
        p.r(x, by + sag, 8, 1, '#6b5a45');
        p.tri(x + 1, x + 6, by + sag + 1, x + 3.5, by + sag + 6, ['#a85414', '#2a6f9e', PAPER][(x / 8) % 3]);
      }
    },
    near(p, w, h, f, emit, s) {
      p.r(0, f, w, h - f, '#8d8f93');
      p.r(0, f + 12, w, 2, '#3b7dd8');
      for (let i = 0; i < w * (h - f) / 30; i++) p.r((i * 41) % w, f + (i * 17) % (h - f), 1, 1, '#7e8084');
      const skins = ['#e8b48f', '#c98d66', '#8a5a3c', '#f1c9a5'], shirts = ['#2a6f9e', '#b23a48', '#e3b341', '#3e7654', '#6f5aa8'];
      for (let x = 2, i = 0; x < w; x += 7, i++) {
        const bob = i % 3 === 0 ? -1 : 0;
        p.r(x, f - 12 + bob, 6, 8, shirts[i % 5]); p.ellipse(x + 3, f - 15 + bob, 2, 2, skins[i % 4]);
      }
      p.r(0, f - 6, w, 1, '#c9ccd0'); p.r(0, f - 2, w, 1, '#c9ccd0');
      for (let x = 0; x < w; x += 6) p.r(x, f - 6, 1, 6, '#c9ccd0');
      if (s) return;
      const sx = Math.round(w * .52);
      p.r(sx + 2, f - 22, 1, 8, '#6b5a45'); p.r(sx + 34, f - 22, 1, 8, '#6b5a45');
      p.box(sx - 3, f - 32, 42, 11, PAPER); p.text('GO TIGGY', sx + 3, f - 29, '#a85414');
    },
  },
  wanderer: {
    particles: 'dust', tint: '#6f5aa8',
    // Start fight is on the departures board.
    holder(p, w, h, f, s) {
      const {x0, y0, W, H, cx} = frame(s), top = y0 - 10;
      p.r(x0 + 8, 6, 1, top - 6, '#6b6f76'); p.r(x0 + W - 9, 6, 1, top - 6, '#6b6f76');
      p.box(x0 - 3, top, W + 6, H + 16, '#1f2023', '#3a3f45');
      p.text('DEPARTURES', cx - 19, top + 2, '#e3b341');
      p.r(x0 + 2, y0 + H + 2, Math.round(W * .4), 1, '#8b7a3f'); p.r(x0 + Math.round(W * .55), y0 + H + 2, Math.round(W * .4), 1, '#8b7a3f');
    },
    far(p, w, h, f, s) {
      wall(p, w, f, '#e3dfee', '#a9a2bf');
      const wy = 6, wh = Math.max(20, f - 28);
      p.box(4, wy, w - 8, wh, '#cfe0ef', '#6b6f76');
      p.r(5, wy + wh - 8, w - 10, 7, '#9aa3ac'); p.r(5, wy + wh - 5, w - 10, 1, PAPER);
      const px = Math.round(w * .62), py = wy + Math.round(wh * .45);
      p.ellipse(px, py, 22, 3, PAPER); p.tri(px + 12, px + 22, py - 1, px + 20, py - 10, PAPER);
      p.tri(px - 6, px + 8, py + 1, px + 4, py + 10, '#dfe3ea'); p.r(px - 14, py - 1, 16, 1, '#8fb8d8');
      for (let x = 34; x < w - 8; x += 34) p.r(x, wy, 2, wh, '#6b6f76');
      if (s) return;
      p.box(12, wy + 6, 50, 26, '#1f2023', '#3a3f45');
      p.text('DEPARTURES', 14, wy + 9, '#e3b341');
      p.text('PERTH', 15, wy + 17, '#e3b341'); p.text('HAKUBA', 15, wy + 24, '#e3b341');
      p.r(42, wy + 19, 14, 1, '#8b7a3f'); p.r(42, wy + 26, 14, 1, '#8b7a3f');
    },
    near(p, w, h, f, emit, s) {
      p.r(0, f, w, h - f, '#cfcad8');
      for (let x = 10; x < w; x += 34) p.r(x, f + 2, 8, h - f, '#dcd8e4');
      for (let y = f + 6; y < h; y += 12) p.r(0, y, w, 1, '#bdb7c9');
      [8, 28].forEach(x => { p.r(x, f - 14, 2, 16, '#7a7f86'); p.ellipse(x + 1, f + 2, 3, 1, '#7a7f86'); });
      for (let x = 10; x < 28; x++) p.r(x, f - 12 + Math.round(Math.sin((x - 10) / 18 * Math.PI) * 3), 1, 1, '#b23a48');
      if (s) return;
      const dw = Math.min(70, Math.round(w * .42)), dx = Math.round(w / 2 - dw / 2);
      p.box(dx, f - 16, dw, 22, '#5b4f7a'); p.r(dx - 1, f - 18, dw + 2, 3, '#e9e5f1');
      p.box(dx + dw - 22, f - 24, 16, 6, '#3a3f45'); p.r(dx + dw - 20, f - 23, 12, 3, '#1f2023'); p.r(dx + dw - 18, f - 22, 6, 1, '#6fe39a');
      p.r(dx + 4, f - 20, 22, 2, '#3a3f45');
    },
  },
  master: {
    particles: 'dust', tint: '#3a3f45', dark: true,
    // Start fight is on the laptop he's writing on.
    holder(p, w, h, f, s) {
      const {x0, y0, W, H, cx} = frame(s), top = y0 + H + 6;
      const dw = W + 48, dx = Math.round(cx - dw / 2);
      if (f + 8 > top + 5) { p.r(dx + 3, top + 5, 3, f + 8 - top - 5, '#4a3528'); p.r(dx + dw - 6, top + 5, 3, f + 8 - top - 5, '#4a3528'); }
      p.box(dx, top, dw, 5, '#6b4f3a', '#2b221c');
      p.box(x0 - 2, y0 - 2, W + 4, H + 5, '#2d3a55', '#4a4f5c');
      p.r(x0 - 6, top - 3, W + 12, 3, '#6b6f76'); p.r(x0 - 6, top - 1, W + 12, 1, '#4a4f5c');
      [[dx + 4, 8], [dx + 16, 12]].forEach(([x, n]) => { for (let i = 0; i < n; i++) p.r(x + (i % 2), top - 1 - i, 10, 1, i % 4 ? PAPER : '#d9d2c1'); });
      const lx = dx + dw - 10;
      p.r(lx - 4, top - 2, 9, 2, '#1f2430'); p.line(lx, top - 2, lx - 6, top - 14, '#1f2430', 1); p.line(lx - 6, top - 14, lx - 1, top - 20, '#1f2430', 1);
      p.tri(lx - 5, lx + 5, top - 16, lx, top - 22, '#e3b341');
    },
    far(p, w, h, f, s) {
      wall(p, w, f, '#2b3140', '#1f2430');
      const wx = w - 50, wy = Math.max(6, f - 76);
      p.box(wx, wy, 38, 34, '#18203a', '#4a4f5c'); p.r(wx + 18, wy, 2, 34, '#4a4f5c');
      p.ellipse(wx + 9, wy + 9, 4, 4, '#f1e7c3'); p.ellipse(wx + 11, wy + 8, 3, 3, '#18203a');
      [[6, 20], [26, 6], [32, 24], [14, 28], [28, 14]].forEach(([x, y]) => p.r(wx + x, wy + y, 1, 1, '#f1e7c3'));
      const bx = 8, by = Math.max(10, f - 58);
      p.box(bx, by, 36, 54, '#4a3a2e', '#2b221c');
      const books = ['#b23a48', '#6a859d', '#c4a56a', '#5fa383', '#e3dccb'];
      [by + 3, by + 20, by + 37].forEach((y, s) => { for (let x = bx + 2, i = s; x < bx + 33; x += 4, i++) p.r(x, y + (i % 3), 3, 14 - (i % 3), books[i % 5]); p.r(bx + 1, y + 14, 34, 2, '#2b221c'); });
      const cx = Math.round(w / 2), cy = Math.max(12, f - 66);
      p.ellipse(cx, cy, 8, 8, '#4a4f5c'); p.ellipse(cx, cy, 7, 7, '#e9e3d3');
      p.line(cx, cy, cx, cy - 6, INK); p.line(cx, cy, cx - 1, cy - 4, INK);
    },
    near(p, w, h, f, emit, s) {
      p.r(0, f, w, h - f, '#3a2f28');
      for (let y = f + 4; y < h; y += 6) p.r(0, y, w, 1, '#2f2620');
      for (let y = f, row = 0; y < h; y += 6, row++) for (let x = row % 2 ? 10 : 30; x < w; x += 40) p.r(x, y, 1, 6, '#2f2620');
      if (s) return;
      const dw = Math.min(88, Math.round(w * .5)), dx = Math.round(w / 2 - dw / 2), top = f - 14;
      p.r(dx + 3, top + 4, 3, 18, '#4a3528'); p.r(dx + dw - 6, top + 4, 3, 18, '#4a3528');
      p.box(dx, top, dw, 5, '#6b4f3a', '#2b221c');
      [[dx + 8, 9], [dx + 20, 14], [dx + 31, 6]].forEach(([x, n]) => { for (let i = 0; i < n; i++) p.r(x + (i % 2), top - 1 - i, 10, 1, i % 4 ? PAPER : '#d9d2c1'); });
      const lx = dx + dw - 14;
      p.r(lx - 4, top - 2, 9, 2, '#1f2430'); p.line(lx, top - 2, lx - 6, top - 14, '#1f2430', 1); p.line(lx - 6, top - 14, lx - 1, top - 20, '#1f2430', 1);
      p.tri(lx - 5, lx + 5, top - 16, lx, top - 22, '#e3b341');
      p.c.globalAlpha = .32; p.tri(lx - 26, lx + 12, top, lx, top - 16, '#f3d278'); p.c.globalAlpha = 1;
      p.box(dx + 44, top - 7, 6, 7, '#b23a48');
    },
  },
  operator: {
    particles: 'code', tint: '#2f7d4a', dark: true,
    // Start fight is on a widescreen monitor.
    holder(p, w, h, f, s) {
      const {x0, y0, W, H, cx} = frame(s), top = y0 + H + 12;
      const dw = W + 40, dx = Math.round(cx - dw / 2);
      if (f + 8 > top + 4) { p.r(dx + 3, top + 4, 3, f + 8 - top - 4, '#111614'); p.r(dx + dw - 6, top + 4, 3, f + 8 - top - 4, '#111614'); }
      p.box(dx, top, dw, 4, '#3a3f45', '#111614');
      p.r(x0 - 4, y0 - 4, W + 8, H + 10, '#111614');
      p.r(x0 - 1, y0 - 1, W + 2, H + 2, '#0b1f16');
      for (let y = y0; y < y0 + H; y += 2) p.r(x0 - 1, y, W + 2, 1, '#0e2519');
      p.r(x0 + W - 1, y0 + H + 3, 2, 1, '#6fe39a');
      p.r(cx - 2, y0 + H + 6, 4, top - (y0 + H + 6) - 1, '#111614'); p.r(cx - 12, top - 2, 24, 2, '#111614');
      p.r(dx + 6, top - 2, 22, 2, '#2c3033'); p.box(dx + dw - 12, top - 6, 5, 6, '#e9e3d3');
    },
    far(p, w, h, f, s) {
      wall(p, w, f, '#26332c', '#1c2621');
      p.r(0, 3, w, 1, '#2f7d4a'); p.r(0, 4, w, 1, '#1f4a33');
      const bx = 10, by = Math.max(10, f - 64);
      p.box(bx, by, 40, 34, '#1c2621', '#3d5247');
      for (let y = by + 3; y < by + 32; y += 4) p.r(bx + 2, y, 36, 2, '#3d5247');
      p.glow(Math.round(w / 2), f - 36, 40, 14, '#6fe39a');
    },
    near(p, w, h, f, emit, s) {
      p.r(0, f, w, h - f, '#1f2924');
      for (let i = 0; i < w * (h - f) / 14; i++) p.r((i * 29) % w, f + (i * 31) % (h - f), 1, 1, '#26322c');
      if (s) return;
      const dw = Math.min(100, Math.round(w * .56)), dx = Math.round(w / 2 - dw / 2), top = f - 14;
      p.r(dx + 3, top + 4, 3, 18, '#111614'); p.r(dx + dw - 6, top + 4, 3, 18, '#111614');
      p.box(dx, top, dw, 4, '#3a3f45', '#111614');
      const mw = Math.round(dw * .4);
      [[dx + 6, 0], [dx + dw - mw - 6, 1]].forEach(([mx, n]) => {
        p.box(mx, top - 26, mw, 20, '#0f2a1d', '#111614');
        p.r(mx + mw / 2 - 1, top - 6, 3, 6, '#111614');
        p.r(mx + 3, top - 9, mw - 6, 1, '#2b5a41'); p.r(mx + 3, top - 23, 1, 14, '#2b5a41');
        if (n === 0) { p.line(mx + 4, top - 20, mx + mw * .55, top - 18, '#6fe39a'); p.line(mx + mw * .55, top - 18, mx + mw - 5, top - 10, '#e25b67'); }
        else for (let y = top - 22; y < top - 11; y += 3) p.r(mx + 4, y, 4 + (y * 7) % (mw - 10), 1, '#6fe39a');
      });
      p.r(dx + dw / 2 - 12, top - 2, 24, 2, '#2c3033');
      p.box(dx + dw / 2 + 16, top - 6, 5, 6, '#e9e3d3');
    },
  },
  creator: {
    particles: 'sparkle', tint: '#b23a48',
    // Start fight is on a camera screen, on a tripod.
    holder(p, w, h, f, s) {
      const {x0, y0, W, H, cx} = frame(s), ty = y0 + H + 6;
      p.line(cx, ty, cx - 16, f + 3, '#3a3f45'); p.line(cx, ty, cx + 16, f + 3, '#3a3f45'); p.line(cx, ty, cx, f + 4, '#3a3f45');
      p.r(cx - 3, y0 + H + 3, 6, 3, '#3a3f45');
      p.box(x0 - 3, y0 - 3, W + 6, H + 6, '#1f2023', INK);
      p.r(x0 - 1, y0 - 1, W + 2, H + 2, '#3b6e9e');
      p.ellipse(x0 + W + 5, y0 + Math.round(H / 2), 3, 3, '#1f2023'); p.ellipse(x0 + W + 5, y0 + Math.round(H / 2), 1, 1, '#8fb8d8');
      p.r(x0 + W - 3, y0 - 2, 2, 1, '#e25b67');
    },
    far(p, w, h, f, s) {
      wall(p, w, f, '#f0dcdc', '#c9a3a6');
      for (let x = 6; x < w; x += 12) p.r(x, 0, 6, f - 3, '#ecd3d4');
      const nx = Math.round(w / 2 - 16), ny = Math.max(8, f - 62);
      p.glow(nx + 16, ny + 5, 30, 12, '#ff6f91');
      p.text('POST', nx + 1, ny + 1, '#e2446a', 2); p.text('POST', nx, ny, '#ffc2d0', 2);
      const sy = Math.max(20, f - 36);
      p.r(w - 46, sy, 38, 2, '#b58b7a');
      p.box(w - 40, sy - 7, 11, 7, '#3a3f45'); p.ellipse(w - 34, sy - 4, 2, 2, '#8fb8d8');
      p.box(w - 22, sy - 6, 7, 6, '#c4a56a'); p.ellipse(w - 19, sy - 10, 5, 4, '#5fa383');
    },
    near(p, w, h, f, emit, s) {
      p.r(0, f, w, h - f, '#d9c3a9');
      for (let y = f + 5; y < h; y += 7) p.r(0, y, w, 1, '#ccb498');
      p.ellipse(Math.round(w / 2), f + 12, Math.min(60, w * .36), 7, '#d98a95'); p.ellipse(Math.round(w / 2), f + 12, Math.min(52, w * .31), 5, '#e7a4ad');
      const rx = s ? Math.max(14, s.x - 22) : Math.round(w * .38), ry = f - 34;
      p.glow(rx, ry, 18, 18, '#fff4c9');
      p.ring(rx, ry, 10, '#fff7e0', 2); p.ring(rx, ry, 12, '#3a3f45', 1);
      p.line(rx, ry + 12, rx, f, '#3a3f45'); p.line(rx, f - 6, rx - 7, f + 2, '#3a3f45'); p.line(rx, f - 6, rx + 7, f + 2, '#3a3f45');
      if (s) return;
      const tx = Math.round(w * .6);
      p.line(tx, f - 14, tx - 5, f + 2, '#3a3f45'); p.line(tx, f - 14, tx + 5, f + 2, '#3a3f45');
      p.box(tx - 3, f - 24, 7, 11, '#1f2023'); p.r(tx - 2, f - 23, 5, 8, '#3b6e9e'); p.r(tx, f - 22, 1, 1, '#e25b67');
    },
  },
  allrounder: {
    particles: 'dust', tint: '#46607d',
    // Start fight is on the Brocklebikes sign.
    holder(p, w, h, f, s) {
      const {x0, y0, W, H, cx} = frame(s), top = y0 - 11;
      p.box(x0 - 5, top, W + 10, H + 16, '#c89b5c', '#6b4f3a');
      for (let y = top + 2; y < top + H + 15; y += 3) p.r(x0 - 4, y, W + 8, 1, '#b98a4c');
      p.text('BROCKLEBIKES', cx - 23, top + 3, '#3a2a1c');
      [[x0 - 3, top + 2], [x0 + W + 2, top + 2], [x0 - 3, top + H + 13], [x0 + W + 2, top + H + 13]].forEach(([x, y]) => p.r(x, y, 1, 1, INK));
    },
    far(p, w, h, f, s) {
      wall(p, w, f, '#aeb9c4', '#7f8b97');
      for (let y = f - 3, row = 0; y > 0; y -= 5, row++) { p.r(0, y, w, 1, '#9faab6'); for (let x = row % 2 ? 6 : 0; x < w; x += 12) p.r(x, y - 4, 1, 4, '#9faab6'); }
      const sx = 8, sy = Math.max(12, f - 56);
      [sy, sy + 18].forEach((y, i) => {
        p.r(sx, y, 40, 2, '#6b5a45');
        p.box(sx + 2, y - 9, 12, 9, '#c4a56a'); p.box(sx + 16, y - 7, 8, 7, '#b23a48'); p.box(sx + 27, y - 10, 9, 10, i ? '#5fa383' : '#e3dccb');
      });
      const px = w - 36, py = Math.max(8, f - 70);
      p.box(px, py, 24, 30, PAPER); p.text('RUN', px + 7, py + 4, '#46607d');
      p.r(px + 4, py + 12, 16, 1, '#9faab6'); p.r(px + 4, py + 16, 12, 1, '#9faab6'); p.r(px + 4, py + 20, 14, 1, '#9faab6');
    },
    near(p, w, h, f, emit, s) {
      p.r(0, f, w, h - f, '#b4b8bc');
      for (let i = 0; i < w * (h - f) / 20; i++) p.r((i * 43) % w, f + (i * 19) % (h - f), 1, 1, '#a4a9ae');
      const cx = s ? Math.round(s.x + s.w + 28) : Math.round(w / 2), wy = f - 12;
      p.r(cx - 1, wy - 16, 2, 28, '#3a3f45'); p.r(cx - 8, f, 16, 2, '#3a3f45'); p.r(cx - 1, wy - 16, 10, 2, '#3a3f45');
      [cx - 16, cx + 16].forEach(x => { p.ring(x, wy, 9, INK); p.ring(x, wy, 8, '#4a4d54'); for (let a = 0; a < 6; a++) p.line(x, wy, x + Math.cos(a * Math.PI / 3) * 7, wy + Math.sin(a * Math.PI / 3) * 7, '#8b9097'); });
      p.line(cx - 16, wy, cx - 2, wy - 12, '#46607d', 2); p.line(cx - 2, wy - 12, cx + 16, wy, '#46607d', 2);
      p.line(cx - 2, wy - 12, cx, wy, '#46607d', 2); p.line(cx, wy, cx - 16, wy, '#46607d', 2);
      p.r(cx - 5, wy - 15, 6, 2, INK); p.line(cx + 8, wy - 14, cx + 11, wy - 16, INK, 2);
      const bx = Math.round(w * .66);
      p.ellipse(bx, f - 4, 6, 3, '#e3dccb'); p.r(bx - 6, f - 5, 13, 1, '#c9c1ab');
    },
  },
};

// `slot` is where the select screen's Start fight button sits, in cells. Each scene draws
// something from its world around it, instead of the button carrying props of its own.
function frame(s) {
  const P = 3;
  return {x0: s.x - P, y0: s.y - P, W: s.w + P * 2, H: s.h + P * 2, cx: Math.round(s.x + s.w / 2)};
}
export function paintScene(far, near, key, w, h, floor, slot = null, holder = null) {
  const scene = SCENES[key], emitters = [];
  scene.far(painter(far, w, h), w, h, floor, slot);
  const nearPainter = painter(near, w, h);
  scene.near(nearPainter, w, h, floor, emitters, slot);
  if (holder) {
    const holderPainter = painter(holder, w, h);
    if (slot && scene.holder) scene.holder(holderPainter, w, h, floor, slot, emitters);
  } else if (slot && scene.holder) scene.holder(nearPainter, w, h, floor, slot, emitters);
  return {emitters, type: scene.particles, tint: scene.tint, dark: Boolean(scene.dark)};
}
export const SCENE_KEYS = Object.keys(SCENES);

// Small, cheap particles drawn on their own canvas at the same cell size.
export function particles(canvas) {
  let parts = [], cfg = {type: 'none', emitters: []}, w = 0, h = 0, frame = 0;
  const c = canvas.getContext('2d');
  const rand = (a, b) => a + Math.random() * (b - a);
  function spawn() {
    const t = cfg.type;
    if (t === 'snow') return {x: rand(0, w), y: rand(-h, 0), vx: rand(-.1, .1), vy: rand(.25, .6), size: Math.random() < .25 ? 2 : 1, col: '#ffffff', life: Infinity};
    if (t === 'confetti') return {x: rand(0, w), y: rand(-h, 0), vx: rand(-.15, .15), vy: rand(.15, .35), size: 1, tall: true, col: ['#a85414', '#2a6f9e', '#e3b341', '#b23a48'][parts.length % 4], life: Infinity};
    if (t === 'dust') return {x: rand(0, w), y: rand(0, h), vx: rand(-.06, .06), vy: rand(-.05, .03), size: 1, col: cfg.dark ? 'rgba(243,210,120,.5)' : 'rgba(255,250,235,.45)', life: Infinity};
    if (t === 'code') return {x: rand(0, w), y: rand(h * .3, h), vx: 0, vy: rand(-.12, -.05), size: 1, col: 'rgba(111,227,154,.6)', life: rand(80, 200)};
    if (t === 'sparkle') return {x: rand(0, w), y: rand(0, h * .8), vx: 0, vy: 0, size: 1, sparkle: true, col: '#fff7e0', life: rand(18, 40)};
    return null;
  }
  const counts = {snow: 1 / 120, confetti: 1 / 900, dust: 1 / 1400, code: 1 / 900, sparkle: 1 / 1600};
  function configure(next, width, height) {
    cfg = next; w = width; h = height; canvas.width = w; canvas.height = h;
    parts = [];
    const n = Math.round(w * h * (counts[cfg.type] || 0));
    for (let i = 0; i < n; i++) { const q = spawn(); if (q) { if (cfg.type === 'snow' || cfg.type === 'confetti') q.y = rand(0, h); parts.push(q); } }
  }
  function burst(x, y, colours, count = 16) {
    for (let i = 0; i < count; i++) parts.push({x, y, vx: rand(-1.4, 1.4), vy: rand(-1.8, -.2), gravity: .12, size: Math.random() < .3 ? 2 : 1, col: colours[i % colours.length], life: rand(14, 26)});
  }
  function step() {
    frame++;
    if (cfg.type === 'bubbles' && frame % 7 === 0) cfg.emitters.forEach(([x, y]) => parts.push({x: x + rand(-1, 1), y, vx: rand(-.05, .05), vy: rand(-.35, -.2), size: 1, ring: true, col: 'rgba(223,240,234,.95)', life: rand(22, 40)}));
    c.clearRect(0, 0, w, h);
    const keep = [];
    for (const q of parts) {
      q.x += q.vx + (q.sparkle ? 0 : Math.sin((frame + q.y) / 20) * .03); q.y += q.vy; if (q.gravity) q.vy += q.gravity;
      q.life--;
      if (q.life <= 0) { if (q.life !== -Infinity && !q.gravity && cfg.type !== 'bubbles') { const r = spawn(); if (r) keep.push(r); } continue; }
      if (q.life === Infinity && (q.y > h || q.y < -2 || q.x < -2 || q.x > w + 2)) {
        if (cfg.type === 'dust') { q.x = (q.x + w) % w; q.y = (q.y + h) % h; }
        else { q.y = -2; q.x = rand(0, w); }
      }
      c.fillStyle = q.col;
      if (q.sparkle) { const s = q.life % 10 < 5 ? 1 : 0; c.fillRect(q.x - s, q.y, 1 + s * 2, 1); c.fillRect(q.x, q.y - s, 1, 1 + s * 2); }
      else c.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.tall ? 2 : q.size);
      keep.push(q);
    }
    parts = keep;
  }
  return {configure, burst, step, clear: () => { parts = []; c.clearRect(0, 0, w, h); }};
}
