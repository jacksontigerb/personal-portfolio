// Drawing in cells on a small canvas that CSS scales up, so the games match the pixel worlds.
export const INK = '#292a2c', PAPER = '#fbfbfa';
const GLYPHS = {
  0:'111101101101111', 1:'010110010010111', 2:'111001111100111', 3:'111001011001111', 4:'101101111001001',
  5:'111100111001111', 6:'111100111101111', 7:'111001010010010', 8:'111101111101111', 9:'111101111001111',
  A:'010101111101101', B:'110101110101110', C:'011100100100011', D:'110101101101110', E:'111100110100111',
  F:'111100110100100', G:'011100101101011', H:'101101111101101', I:'111010010010111', J:'001001001101010',
  K:'101101110101101', L:'100100100100111', M:'101111111101101', N:'110101101101101', O:'111101101101111',
  P:'110101110100100', Q:'010101101111011', R:'110101110101101', S:'011100010001110', T:'111010010010010',
  U:'101101101101111', V:'101101101101010', W:'101101111111101', X:'101101010101101', Y:'101101010010010',
  Z:'111001010100111', '°':'010101010000000', '+':'000010111010000', '×':'000101010101000', '/':'001001010100100',
  '.':'000000000000010', ',':'000000000010100', '%':'101001010100101', '→':'000001111001000', '←':'000100111100000', '-':'000000111000000', '£':'011100110100111', '!':'010010010000010', ':':'000010000010000', ' ':'000000000000000', '?':'111001010000010',
};

export function pen(canvas) {
  const c = canvas.getContext('2d');
  const r = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const disc = (cx, cy, rad, col) => {
    cx = Math.round(cx); cy = Math.round(cy); rad = Math.max(0, Math.round(rad));
    for (let y = -rad; y <= rad; y++) { const half = Math.round(Math.sqrt(Math.max(0, (rad + .4) ** 2 - y * y))); r(cx - half, cy + y, half * 2 + 1, 1, col); }
  };
  const line = (x0, y0, x1, y1, col, t = 1) => {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) || 1, o = (t - 1) / 2;
    c.fillStyle = col;
    for (let i = 0; i <= n; i++) c.fillRect(Math.round(x0 + (x1 - x0) * i / n - o), Math.round(y0 + (y1 - y0) * i / n - o), t, t);
  };
  const text = (str, x, y, col, k = 1) => {
    [...String(str).toUpperCase()].forEach((ch, n) => {
      const g = GLYPHS[ch] || GLYPHS[' '];
      for (let i = 0; i < 15; i++) if (g[i] === '1') r(x + (n * 4 + i % 3) * k, y + Math.floor(i / 3) * k, k, k, col);
    });
  };
  const textWidth = (str, k = 1) => (String(str).length * 4 - 1) * k;
  // A label on a small ink plate, centred on x.
  const tag = (str, x, y, col = PAPER, back = INK, k = 1) => {
    const w = textWidth(str, k);
    r(x - w / 2 - 2 * k, y - 2 * k, w + 4 * k, 9 * k, back); text(str, Math.round(x - w / 2), y, col, k);
  };
  const clear = () => c.clearRect(0, 0, canvas.width, canvas.height);
  // Filled polygon, one scanline at a time so edges stay crisp.
  const poly = (pts, col) => {
    const ys = pts.map(q => q[1]), top = Math.floor(Math.min(...ys)), bottom = Math.ceil(Math.max(...ys));
    c.fillStyle = col;
    for (let y = top; y <= bottom; y++) {
      const cross = [];
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
        if ((y1 <= y + .5 && y2 > y + .5) || (y2 <= y + .5 && y1 > y + .5)) cross.push(x1 + (y + .5 - y1) / (y2 - y1) * (x2 - x1));
      }
      cross.sort((a, b) => a - b);
      for (let i = 0; i + 1 < cross.length; i += 2) c.fillRect(Math.round(cross[i]), y, Math.round(cross[i + 1]) - Math.round(cross[i]), 1);
    }
  };
  const ellipse = (cx, cy, rx, ry, col) => {
    c.fillStyle = col;
    for (let y = -Math.round(ry); y <= Math.round(ry); y++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / ((ry + .4) * (ry + .4)))));
      c.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2 + 1, 1);
    }
  };
  // Draws a sprite made by sprite() with its centre at x, y, scaled, turned and flipped.
  const blit = (img, x, y, scale = 1, angle = 0, flip = false) => {
    c.save(); c.imageSmoothingEnabled = false; c.translate(Math.round(x), Math.round(y));
    if (angle) c.rotate(angle); c.scale(flip ? -scale : scale, scale);
    c.drawImage(img, -img.width / 2, -img.height / 2); c.restore();
  };
  return {c, r, disc, line, text, textWidth, tag, clear, poly, ellipse, blit};
}

// A sprite from rows of characters, each mapped to a colour ('.' is empty).
export function sprite(rows, palette) {
  const canvas = document.createElement('canvas'); canvas.width = rows[0].length; canvas.height = rows.length;
  const c = canvas.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (palette[ch]) { c.fillStyle = palette[ch]; c.fillRect(x, y, 1, 1); } }));
  return canvas;
}
