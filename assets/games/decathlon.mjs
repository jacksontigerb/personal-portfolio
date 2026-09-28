// A bit of everything: Jack of All Trades.
// Four events of a few seconds each. Space or a tap does the main thing, number keys or the
// buttons pick, and each event ends on a medal that flies into the rack along the top.
import {createShell, escape} from './shell.mjs?v=3';
import {pen, sprite, INK, PAPER} from './pixels.mjs?v=3';
import * as M from './decathlon-model.mjs?v=3';

const MEDAL_COLOUR = ['#8a8f94', '#b8743a', '#b9c0c7', '#e3b341'];
const GREEN = '#3e7654', RED = '#ad343c', GOLD = '#e3b341', AMBER = '#a97926', SEA = '#2f7e9c', SEA_DEEP = '#256a86';
const pickN = (list, n) => [...list].sort(() => Math.random() - .5).slice(0, n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const P = {Y: '#e0b44a', S: '#e2ad84', K: '#1f2023', N: '#46607d', D: '#2a3a5c', W: '#fbfbfa'};
const PERSON = sprite(['..YYY..', '.YYYYY.', '..SSS..', '.NNNNN.', 'SNNNNNS', '..NNN..', '..DDD..', '..D.D..', '.KK.KK.'], P);
const CROUCH = sprite(['..YYY..', '.YYYYY.', '..SSS..', '.NNNNN.', 'SNNNNNS', '.DDDDD.', 'KK...KK'], P);
const LYING = sprite(['......YYY.', 'DDDNNNNNSY', 'KDDNNNNNS.'], P);
const SITTING = sprite(['..YYY..', '.YYYYY.', '..SSS..', '.NNNNN.', 'SNNNNNS', '.DDDDDD', '.DD..KK'], P);
const CLIMBER = sprite(['..YYY..', '.YYYYY.', '..SSS..', '.NNNNN.', '.NNNNN.', '..NNN..', '..DDD..', '.DD.DD.', '.KK.KK.'], P);
const STAR = sprite(['...Y...', '...Y...', '..YYY..', 'YYYYYYY', '.YYYYY.', '..YYY..', '.YY.YY.', '.Y...Y.'], {Y: GOLD});
const STAR_OFF = sprite(['...Y...', '...Y...', '..YYY..', 'YYYYYYY', '.YYYYY.', '..YYY..', '.YY.YY.', '.Y...Y.'], {Y: '#5f6164'});
const PIECES = {
  K: ['..W..', '.WWW.', '..W..', '.WWW.', '.WWW.', 'WWWWW'], Q: ['.W.W.', 'W.W.W', '.WWW.', '..W..', '.WWW.', 'WWWWW'],
  R: ['W.W.W', 'WWWWW', '.WWW.', '.WWW.', '.WWW.', 'WWWWW'], P: ['.....', '..W..', '.WWW.', '..W..', '.WWW.', 'WWWWW'],
};
const pieceSprite = (k, white) => sprite(PIECES[k.toUpperCase()], {W: white ? '#fbfbfa' : '#1f2023'});
const PIECE_ART = {};
const art = k => PIECE_ART[k] || (PIECE_ART[k] = pieceSprite(k, k === k.toUpperCase()));
const outline = k => PIECE_ART['_' + k] || (PIECE_ART['_' + k] = pieceSprite(k, false));
const inside = (h, x, y) => h && x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h;

// Small scenery shared by the outdoor events.
function sky(p, a, top, bottom, split) {
  const y = a.y + a.h * split, bands = 6;
  for (let i = 0; i < bands; i++) p.r(a.x, a.y + (y - a.y) * i / bands, a.w, (y - a.y) / bands + 1, i < bands / 2 ? top : bottom);
  return y;
}
function sun(p, x, y, r) { p.disc(x, y, r + 2, '#f6e3a8'); p.disc(x, y, r, '#f2c14e'); }
function hills(p, a, y, col, seed, height) {
  const pts = [[a.x, y]];
  for (let i = 0; i <= 8; i++) pts.push([a.x + a.w * i / 8, y - height * (.4 + .6 * Math.abs(Math.sin(seed + i * 1.7)))]);
  pts.push([a.x + a.w, y]); p.poly(pts, col);
}
function curve(p, x0, y0, cx, cy, x1, y1, col, t = 2) {
  let px = x0, py = y0;
  for (let i = 1; i <= 16; i++) { const u = i / 16, x = (1 - u) ** 2 * x0 + 2 * u * (1 - u) * cx + u * u * x1, y = (1 - u) ** 2 * y0 + 2 * u * (1 - u) * cy + u * u * y1; p.line(px, py, x, y, col, t); px = x; py = y; }
}

// Each event: set up, react to input, draw itself, and say what medal it earned. `say(text, tone, x, y)`
// floats a word over the scene; `hit` is where a tap on the scene counts as a choice.
const EVENTS = [
  {key: 'pump', name: 'Pump it up', help: 'Hold to pump the tyre. Let go in the green.', time: 6, action: 'Pump', linger: .7,
    init() { const low = 55 + Math.random() * 18; return {p: 0, low, high: low + 14, holding: false, burst: false, strokes: 0}; },
    press(s) { s.holding = true; },
    release(s, say) {
      if (!s.holding) return; s.holding = false;
      if (s.p >= s.low - 8) { s.finished = true; say(s.p < s.low ? 'SOFT' : s.p > s.high ? 'HARD' : 'SPOT ON', s.p >= s.low && s.p <= s.high ? 'good' : 'warn', s.gx, s.gy - 30); }
      else if (s.p > 4) say('KEEP GOING', 'warn', s.gx, s.gy - 30);
    },
    update(s, dt, say, fx) {
      if (!s.holding || s.finished) return;
      s.p += M.pumpRate(s.p) * dt;
      if (s.p > 100) { s.burst = true; s.finished = true; s.holding = false; say('BANG', 'bad', s.wx, s.wy - 20); fx.shake(true); fx.burst(s.wx, s.wy, [INK, '#6b6e72', PAPER], 22); }
    },
    medal: s => M.pumpMedal(s.burst ? 101 : s.p, s.low, s.high),
    note: s => s.burst ? 'BURST' : s.p < s.low - 8 ? 'TOO SOFT' : '',
    draw(s, p, a) {
      const grass = a.y + a.h * .82;
      sky(p, a, '#cfe6ee', '#dcecf0', .3);
      p.r(a.x, a.y + a.h * .3, a.w, grass - a.y - a.h * .3, '#b7a483');
      for (let x = a.x + 4; x < a.x + a.w; x += 11) p.r(x, a.y + a.h * .3, 1, grass - a.y - a.h * .3, '#9a8767');
      p.r(a.x, a.y + a.h * .3, a.w, 2, '#8a785a');
      const u = Math.min(a.w * .8, a.h), inWin = s.p >= s.low && s.p <= s.high;
      // The wheel: the tyre fattens and stops sagging as it fills.
      const wr = u * .27, fill = clamp(s.p / s.low, 0, 1), sag = s.burst ? wr * .2 : (1 - fill) * wr * .14;
      const wx = a.x + a.w * .74, wy = grass - wr + sag; s.wx = wx * 2; s.wy = wy * 2;
      const tyre = s.burst ? 1 : 2 + Math.round(fill * 4);
      p.disc(wx, wy, wr, INK); p.disc(wx, wy, wr - tyre, '#9aa3ab'); p.disc(wx, wy, wr - tyre - 2, '#d8d2c2');
      for (let i = 0; i < 12; i++) { const t = i * Math.PI / 6; p.line(wx, wy, wx + Math.cos(t) * (wr - tyre - 2), wy + Math.sin(t) * (wr - tyre - 2), '#8a8f94', 1); }
      p.disc(wx, wy, Math.max(2, wr * .1), '#6b6e72');
      if (s.burst) for (let i = 0; i < 7; i++) { const t = i * .9 + .3; p.r(wx + Math.cos(t) * (wr + 6), wy + Math.sin(t) * (wr + 6), 5, 2, INK); }
      const vx = wx - (wr - tyre) * .7, vy = wy + (wr - tyre) * .7;
      p.r(a.x, grass, a.w, a.y + a.h - grass, '#6f9a4f'); p.r(a.x, grass, a.w, 2, '#5a8540');
      if (!s.burst && sag > 1) p.r(wx - sag * 2.4, grass - 1, sag * 4.8, 2, INK);
      // The track pump, and the hose to the valve.
      const px = a.x + a.w * .47, ph = Math.min(a.h * .42, u * .5), top = grass - ph, stroke = s.holding ? (Math.sin(s.t * 16) + 1) / 2 : 0;
      curve(p, px + 2, grass - 3, (px + vx) / 2, grass + 6, vx, vy, INK, 2);
      p.r(vx - 1, vy - 3, 3, 4, '#6b6e72');
      p.r(px - 12, grass - 3, 24, 3, INK); p.r(px - 3, top, 6, ph - 3, '#b23a48'); p.r(px - 3, top, 2, ph - 3, '#cf5a67');
      const hy = top - ph * .3 + stroke * ph * .25; p.r(px - 1, hy, 2, top - hy, '#8a8f94'); p.r(px - 11, hy - 3, 22, 4, INK);
      p.blit(s.holding && stroke > .5 ? CROUCH : PERSON, px - 18, grass - (s.holding && stroke > .5 ? 7 : 9) - 1, 2);
      // The gauge on its own plate.
      const gr = u * .2, gx = a.x + a.w * .19, gy = a.y + a.h * .56; s.gx = gx * 2; s.gy = (gy - gr) * 2;
      p.disc(gx, gy, gr + 5, INK); p.disc(gx, gy, gr + 3, PAPER);
      for (let i = 0; i <= 50; i++) {
        const ang = Math.PI * .8 + Math.PI * 1.4 * i / 50, v = i / 50 * 100;
        const col = v >= s.low && v <= s.high ? (inWin && Math.floor(s.t * 8) % 2 ? '#6bbf85' : GREEN) : v > 90 ? RED : '#c9ccd0';
        p.r(gx + Math.cos(ang) * (gr - 2) - 1, gy + Math.sin(ang) * (gr - 2) - 1, 3, 3, col);
      }
      const ang = Math.PI * .8 + Math.PI * 1.4 * Math.min(1, s.p / 100);
      p.line(gx, gy, gx + Math.cos(ang) * gr * .82, gy + Math.sin(ang) * gr * .82, s.p > 90 ? RED : INK, 2); p.disc(gx, gy, 2, INK);
      p.text(Math.round(s.p) + ' PSI', gx - p.textWidth(Math.round(s.p) + ' PSI') / 2, gy + gr * .45, INK, 1);
      if (inWin && !s.finished) p.tag('LET GO', gx, gy - gr - 16, PAPER, GREEN, 1);
      else if (s.p > s.high && !s.finished) p.tag('TOO MUCH', gx, gy - gr - 16, PAPER, RED, 1);
    }},
  {key: 'chess', name: 'Mate in one', help: 'White to move. Pick the move that gives checkmate.', time: 8, linger: .9,
    init() { const puzzle = M.PUZZLES[Math.floor(Math.random() * M.PUZZLES.length)]; return {puzzle, choice: null, hits: []}; },
    options: s => s.puzzle.options.map(o => M.moveText(s.puzzle, o)),
    choose(s, i, say) {
      s.choice = i; s.at = s.t; s.finished = true;
      const ok = i === s.puzzle.answer; say(ok ? 'CHECKMATE' : 'NOT MATE', ok ? 'good' : 'bad', s.cx, s.cy);
    },
    medal: s => s.choice == null ? 0 : M.chessMedal(s.choice === s.puzzle.answer, s.at),
    note: s => s.choice == null ? 'OUT OF TIME' : s.choice !== s.puzzle.answer ? 'NOT MATE' : '',
    draw(s, p, a) {
      p.r(a.x, a.y, a.w, a.h, '#6b4a2a'); for (let y = a.y + 5; y < a.y + a.h; y += 9) p.r(a.x, y, a.w, 1, '#5d3f23');
      const size = Math.floor(Math.min(a.w, a.h) * .84 / 8), bx = Math.round(a.x + a.w / 2 - size * 4), by = Math.round(a.y + a.h / 2 - size * 4);
      s.cx = (bx + size * 4) * 2; s.cy = (by + size * 2) * 2;
      const pieces = {...s.puzzle.pieces}, move = s.choice != null ? s.puzzle.options[s.choice] : null, slide = move ? clamp((s.t - s.at) / .22, 0, 1) : 0;
      if (move) delete pieces[move[0]];
      const at = sq => [bx + 'abcdefgh'.indexOf(sq[0]) * size, by + (8 - Number(sq[1])) * size];
      p.r(bx - 3, by - 3, size * 8 + 6, size * 8 + 6, INK);
      const sc = Math.max(1, Math.floor(size / 7)), piece = (k, x, y) => {
        if (k === k.toUpperCase()) [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => p.blit(outline(k), x + dx, y + dy, sc));
        p.blit(art(k), x, y, sc);
      };
      for (let f = 0; f < 8; f++) for (let r = 0; r < 8; r++) {
        const sq = 'abcdefgh'[f] + (r + 1), [x, y] = at(sq);
        p.r(x, y, size, size, (f + r) % 2 ? '#e8dcc0' : '#9c7a55');
        if (move && move.includes(sq)) p.r(x, y, size, size, 'rgba(227,179,65,.5)');
        if (pieces[sq]) piece(pieces[sq], x + size / 2, y + size / 2);
      }
      if (move && slide >= 1 && s.choice === s.puzzle.answer) { const k = Object.keys(pieces).find(q => pieces[q] === 'k'), [x, y] = at(k); p.r(x, y, size, 2, RED); p.r(x, y + size - 2, size, 2, RED); p.r(x, y, 2, size, RED); p.r(x + size - 2, y, 2, size, RED); }
      if (move) { const [x0, y0] = at(move[0]), [x1, y1] = at(move[1]); piece(s.puzzle.pieces[move[0]], x0 + (x1 - x0) * slide + size / 2, y0 + (y1 - y0) * slide + size / 2); }
      // Numbered targets, the same numbers as the buttons. Tap a target to play it.
      s.hits.length = 0;
      if (!move) s.puzzle.options.forEach(([from, to], i) => {
        const [x, y] = at(to), [fx, fy] = at(from);
        for (let k = 1; k < 8; k++) { const u = k / 8; p.r(fx + size / 2 + (x - fx) * u - 1, fy + size / 2 + (y - fy) * u - 1, 2, 2, 'rgba(31,32,35,.35)'); }
        p.r(x + 2, y + 2, size - 4, size - 4, 'rgba(227,179,65,.55)'); p.tag(String(i + 1), x + size / 2, y + size / 2 - 3, PAPER, INK, 1);
        s.hits.push({x: x * 2, y: y * 2, w: size * 2, h: size * 2, i});
      });
      for (let f = 0; f < 8; f++) p.text('ABCDEFGH'[f], bx + f * size + size / 2 - 1, by + size * 8 + 4, '#e8dcc0', 1);
    }},
  {key: 'boulder', name: 'Boulder', help: 'Left, right, left, right. Top out before time.', time: M.CLIMB_TIME, linger: .7, keys: ['←', '→'],
    init() { return {moves: 0, next: 0, slip: -9}; },
    options: () => ['Left hand', 'Right hand'],
    choose(s, i, say, fx) {
      if (s.t < s.slip + .35) return;
      if (i === s.next) { s.moves++; s.next = 1 - s.next; if (s.moves >= M.CLIMB_TOP) { s.finished = true; say('TOPPED OUT', 'good', s.cx, s.cy - 40); fx.burst(s.cx, s.cy, [GOLD, '#b23a48', PAPER], 16); } }
      else { s.moves = Math.max(0, s.moves - 1); s.slip = s.t; say('SLIP', 'bad', s.cx + 60, s.cy); fx.shake(); }
    },
    medal: s => M.climbMedal(s.moves),
    draw(s, p, a) {
      sky(p, a, '#b9dcec', '#cfe7f1', .6);
      const wx = a.x + a.w * .28, ww = a.w * .44;
      p.poly([[wx, a.y], [wx + ww, a.y], [wx + ww + 8, a.y + a.h], [wx - 8, a.y + a.h]], '#c9b89c');
      for (let i = 0; i < 30; i++) p.r(wx + (i * 53 % 100) / 100 * ww, a.y + (i * 37 % 100) / 100 * a.h, 2, 2, '#b3a283');
      p.r(a.x, a.y + a.h * .94, a.w, a.h * .06, '#5c6b3f'); p.r(wx - 14, a.y + a.h * .9, ww + 28, 6, '#46607d');
      const top = M.CLIMB_TOP, step = a.h * .78 / top, base = a.y + a.h * .9, cx = a.x + a.w / 2, spread = Math.min(ww * .22, 22);
      const hold = k => [cx + (k % 2 ? spread : -spread) + Math.sin(k * 2.3) * 4, base - (k + 1) * step];
      const colours = ['#b23a48', GOLD, '#2a6f9e', GREEN];
      for (let k = 0; k < top; k++) { const [x, y] = hold(k); p.disc(x, y, 3, k < s.moves ? '#8a7f6a' : colours[k % 4]); }
      const [tx, ty] = hold(top - 1); p.tag('TOP', tx + (top % 2 ? -26 : 26), ty - 4, PAPER, INK, 1);
      if (s.moves < top && !s.finished) {
        const [x, y] = hold(s.moves), pulse = Math.floor(s.t * 6) % 2;
        p.disc(x, y, 6, pulse ? PAPER : GOLD); p.disc(x, y, 3, colours[s.moves % 4]);
        p.tag(s.next ? '→' : '←', x + (s.next ? 20 : -20), y - 5, PAPER, INK, 2);
      }
      // Each hand stays on the last hold it reached; the body hangs below the lower hand.
      let lh = [cx - spread, base - 6], rh = [cx + spread, base - 6];
      for (let k = 0; k < s.moves; k++) if (k % 2) rh = hold(k); else lh = hold(k);
      const slipping = s.t < s.slip + .35, y = Math.max(lh[1], rh[1]) + 14 + (slipping ? 5 : 0), sway = slipping ? Math.sin(s.t * 50) * 2 : 0;
      s.cx = cx * 2; s.cy = y * 2;
      p.line(cx - 4 + sway, y - 6, lh[0], lh[1] + (slipping ? 4 : 0), '#e2ad84', 2); p.line(cx + 4 + sway, y - 6, rh[0], rh[1], '#e2ad84', 2);
      p.blit(CLIMBER, cx + sway, y, 2);
      for (let i = 0; i < top; i++) p.r(a.x + 6, base - (i + 1) * step, 3, step - 1, i < s.moves ? GREEN : 'rgba(31,32,35,.15)');
    }},
  {key: 'fish', name: 'Handline', help: 'Out on the pirogue. Pull on the big tug, not the nibbles.', time: 6.5, action: 'Pull', linger: .9,
    init() {
      const bite = 2.1 + Math.random() * 2.4, nibbles = [.9 + Math.random() * .4, 1.2 + Math.random() * (bite - 1.7)].filter(n => n < bite - .45);
      return {bite, nibbles, pulled: null};
    },
    press(s, say, fx) {
      s.pulled = s.t; s.finished = true;
      const d = s.t - s.bite, m = M.reactionMedal(d);
      if (d < 0) { say('TOO EARLY', 'bad', s.hx, s.hy - 40); }
      else if (m) { say(m === 3 ? 'GOT IT' : 'CAUGHT', 'good', s.hx, s.hy - 40); fx.burst(s.hx, s.hy, ['#e8f6fb', '#c9ccd0'], 12); }
      else say('IT GOT AWAY', 'bad', s.hx, s.hy - 40);
    },
    update(s, dt, say) { if (s.pulled == null && s.t > s.bite + .9 && !s.finished) { s.finished = true; say('IT GOT AWAY', 'bad', s.hx, s.hy - 40); } },
    medal: s => s.pulled == null ? 0 : M.reactionMedal(s.pulled - s.bite),
    note: s => s.pulled != null && s.pulled < s.bite ? 'TOO EARLY' : 'IT GOT AWAY',
    draw(s, p, a) {
      const horizon = sky(p, a, '#f4c98f', '#f6dcae', .3); sun(p, a.x + a.w * .78, horizon - 6, 10);
      p.r(a.x, horizon, a.w, a.y + a.h - horizon, SEA);
      for (let i = 0; i < 5; i++) p.r(a.x + ((i * 83 + s.t * 8) % a.w), horizon + 4 + i * 7, 12, 1, '#4d98b6');
      const bx = a.x + a.w * .32, by = horizon + 4, L = Math.min(a.w * .3, 90);
      // A painted pirogue: long, narrow, ends turned up.
      p.poly([[bx - L, by - 12], [bx - L * .8, by - 4], [bx + L * .8, by - 4], [bx + L, by - 12], [bx + L * .75, by + 5], [bx - L * .75, by + 5]], '#b23a48');
      p.r(bx - L * .78, by - 4, L * 1.56, 2, GOLD); p.r(bx - L * .74, by, L * 1.48, 2, '#2a6f9e'); p.r(bx - L * .7, by + 3, L * 1.4, 1, GREEN);
      p.blit(SITTING, bx + L * .25, by - 11, 2);
      const lx = bx + L * .25 + 8, ly = by - 12;
      const tugging = s.t >= s.bite && s.pulled == null, nib = s.nibbles.some(n => s.t >= n && s.t < n + .18) && s.pulled == null;
      const caught = s.pulled != null && s.pulled >= s.bite && s.pulled - s.bite <= .9, up = caught ? clamp((s.t - s.pulled) / .5, 0, 1) : 0;
      const depth = a.h * .5, jerk = tugging ? Math.sin(s.t * 60) * 3 + 6 : nib ? Math.sin(s.t * 80) * 2 : 0;
      const hx = lx + 30, hy = caught ? horizon + depth * (1 - up) - 6 * up : horizon + depth + jerk; s.hx = hx * 2; s.hy = horizon * 2;
      p.line(lx, ly, hx, hy, PAPER, 1);
      if (tugging || nib) { const r = tugging ? 6 + Math.floor(s.t * 10) % 3 * 2 : 3; p.r(lx + 30 * (horizon - ly) / (hy - ly) - r, horizon - 1, r * 2, 2, '#e8f6fb'); }
      if (s.t >= s.bite - .4 || caught) { const fx = caught ? hx : hx + (s.pulled != null && s.pulled < s.bite ? (s.t - s.pulled) * 80 : 0); p.ellipse(fx + 6, hy + 4, 9, 4, '#c9ccd0'); p.r(fx + 14, hy + 2, 4, 4, '#c9ccd0'); p.r(fx + 1, hy + 3, 2, 2, INK); }
      for (let i = 0; i < 4; i++) { const fx = a.x + ((i * 97 + s.t * 18 * (i % 2 ? 1 : -1)) % a.w + a.w) % a.w; p.ellipse(fx, a.y + a.h * (.58 + i * .1), 6, 2, SEA_DEEP); }
      if (tugging) p.tag('!', hx, hy - 22, PAPER, RED, 2);
    }},
];
const N = EVENTS.length, MAX = N * 3, WORDS = ['none', 'one', 'two', 'three', 'four', 'five'];

export function start(root, {key, characters, onExit}) {
  const shell = createShell(root, {key, characters, meterLabel: 'EVENTS', onExit, scene: 'far', reserve: [104, 150]});
  const {el, play} = shell, p = pen(play);
  play.setAttribute('aria-label', 'A bit of everything. Space or a tap for the main action, number keys for choices, left and right arrows for hands.');
  let geo = null, index = 0, ev = EVENTS[0], s = null, phase = 'card', timer = 0, medals = [], running = false, run = 0, introSeen = false, stageKey = null, total = 0;
  const floats = [];
  const TONE = {good: GREEN, warn: AMBER, bad: RED};
  // Words that float up over the scene. Positions come in CSS pixels, like shell.burst.
  const say = (text, tone = 'good', x = geo ? geo.x + geo.w / 2 : 0, y = geo ? geo.y + geo.h / 2 : 0) => {
    floats.push({text: String(text), col: TONE[tone] || INK, x: x / 2, y: y / 2, t: 0}); if (floats.length > 8) floats.shift();
    shell.announce(String(text).toLowerCase());
  };
  const fx = {shake: big => shell.shake(big), burst: (x, y, cols, n) => shell.burst(x, y, cols, n)};

  function layout() {
    const top = shell.$('.arcade-top'), W = el.offsetWidth, playTop = top.offsetTop + top.offsetHeight + 10, playBottom = shell.playBottom() - 8;
    const w = Math.min(W - 24, 860), h = Math.max(220, Math.min(playBottom - playTop, 500));
    geo = {W, x: Math.round((W - w) / 2), y: Math.round(playTop + (playBottom - playTop - h) / 2), w, h};
  }
  shell.floor = h => Math.round(h * .85);

  // The rack of medals along the top of the panel, and the three stars they count towards.
  function drawRack(x, y, w, h, shown, flyIndex = -1) {
    p.r(x, y, w, h, INK);
    const starW = w >= 200 ? 58 : 30, slots = w - starW - 6, gap = slots / N, r = Math.max(3, Math.min(h / 2 - 3, gap / 2 - 2));
    for (let i = 0; i < N; i++) {
      const cx = x + 4 + gap * (i + .5), cy = y + h / 2, m = i < shown ? medals[i] : null;
      if (i === index && phase !== 'tally' && phase !== 'done' && m == null) p.disc(cx, cy, r + 1, Math.floor(clock * 4) % 2 ? '#8a8f94' : '#5f6164');
      p.disc(cx, cy, r, '#3a3b3e');
      if (m != null && i !== flyIndex) { p.disc(cx, cy, r, m ? MEDAL_COLOUR[m] : '#4a4b4f'); if (m) p.r(cx - r * .4, cy - r * .5, Math.max(1, r * .35), Math.max(1, r * .35), 'rgba(255,255,255,.6)'); else p.line(cx - r * .5, cy, cx + r * .5, cy, RED, 1); }
    }
    const got = M.stars(total), sx = x + w - starW + 2;
    for (let i = 0; i < 3; i++) p.blit(i < got ? STAR : STAR_OFF, sx + 5 + i * 9, y + h / 2 - (starW > 40 ? 3 : 0), 1);
    if (starW > 40) { const next = M.STAR_SCORES[got]; p.text(next ? `${total}/${next}` : `${total}/${MAX}`, sx + 30, y + h / 2 - 2, got === 3 ? GOLD : PAPER, 1); }
  }

  let clock = 0;
  function render() {
    p.clear();
    if (!geo || !s) return;
    const C = 2, band = 16, full = {x: geo.x / C, y: geo.y / C, w: geo.w / C, h: geo.h / C}, a = {x: full.x, y: full.y + band, w: full.w, h: full.h - band - 4};
    p.r(full.x - 2, full.y - 2, full.w + 4, full.h + 4, INK); p.r(full.x, full.y, full.w, full.h, '#f4f0e6');
    p.c.save(); p.c.beginPath(); p.c.rect(a.x, a.y, a.w, a.h); p.c.clip();
    ev.draw(s, p, a);
    for (const f of floats) {
      if (f.t > .85) continue;
      const k = f.text.length > 12 || a.w < 240 ? 1 : 2, y = clamp(f.y - f.t * 24, a.y + 8, a.y + a.h - 16);
      const half = p.textWidth(f.text, k) / 2 + 3, x = clamp(f.x, a.x + half, a.x + a.w - half);
      p.tag(f.text, x, y, PAPER, f.col, k);
    }
    // Waiting to start, or the medal just won.
    if (phase === 'card' || phase === 'medal' || phase === 'tally') p.r(a.x, a.y, a.w, a.h, 'rgba(31,32,35,.5)');
    if (phase === 'card') {
      const cx = a.x + a.w / 2, cy = a.y + a.h / 2, k = a.w < 240 ? 2 : 3;
      p.tag(`EVENT ${index + 1} OF ${N}`, cx, cy - 26, INK, PAPER, 1);
      p.tag(ev.name, cx, cy - 8, INK, GOLD, k);
      p.tag(timer < .75 ? 'READY' : 'GO', cx, cy + 10 + 6 * k, PAPER, timer < .75 ? INK : GREEN, 2);
    }
    p.c.restore();
    const left = phase === 'play' ? Math.max(0, 1 - (s.doneAt ?? s.t) / ev.time) : phase === 'card' ? 1 : 0;
    p.r(a.x, a.y + a.h, a.w, 4, '#dcd6c8'); p.r(a.x, a.y + a.h, a.w * left, 4, left < .25 ? RED : GREEN);
    let shown = medals.length, fly = -1;
    if (phase === 'medal') {
      const m = medals[index], pop = clamp(timer / .15, 0, 1), go = clamp((timer - .95) / .3, 0, 1), ease = go * go;
      const gap = (full.w - (full.w >= 200 ? 58 : 30) - 6) / N, tx = full.x + 4 + gap * (index + .5), ty = full.y + band / 2;
      const cx = a.x + a.w / 2 + (tx - a.x - a.w / 2) * ease, cy = a.y + a.h * .42 + (ty - a.y - a.h * .42) * ease;
      const r = Math.max(4, Math.min(a.w, a.h) * .12 * (pop < 1 ? .6 + pop * .5 : 1) * (1 - ease * .8));
      if (go < 1) fly = index;
      if (go < .2) { p.r(cx - r * .6, cy - r * 2.1, r * .5, r * 1.3, '#2a6f9e'); p.r(cx + r * .1, cy - r * 2.1, r * .5, r * 1.3, '#b23a48'); }
      p.disc(cx, cy, r + 2, INK); p.disc(cx, cy, r, MEDAL_COLOUR[m]);
      if (m) p.disc(cx - r * .3, cy - r * .3, r * .22, 'rgba(255,255,255,.6)');
      if (go < .15) p.tag(m ? M.MEDALS[m] : (ev.note?.(s) || 'NO MEDAL'), a.x + a.w / 2, a.y + a.h * .42 + r + 10, PAPER, m ? INK : RED, 2);
      if (go < .15 && m) p.tag(`+${m}`, a.x + a.w / 2 + r + 12, a.y + a.h * .42 - r, INK, GOLD, 1);
      if (go >= 1) fly = -1;
    }
    drawRack(full.x, full.y, full.w, band, shown, fly);
    if (phase === 'tally') {
      p.r(a.x, a.y, a.w, a.h + 4, '#2b2c30');
      const cx = a.x + a.w / 2, cy = a.y + a.h * .36, n = Math.min(N, Math.floor(timer / .2) + 1), count = medals.slice(0, n).reduce((x, m) => x + m, 0);
      const r = Math.min(16, (a.w - 20) / (N * 2 + 2)), gap = r * 2 + 6;
      for (let i = 0; i < N; i++) { const x = cx - gap * (N - 1) / 2 + gap * i; p.disc(x, cy, r + 1, INK); p.disc(x, cy, r, i < n ? MEDAL_COLOUR[medals[i]] : '#3a3b3e'); }
      const got = M.stars(count);
      p.tag(`${count} OF ${MAX}`, cx, cy + r + 10, INK, PAPER, 2);
      for (let i = 0; i < 3; i++) p.blit(i < got ? STAR : STAR_OFF, cx - 24 + i * 24, cy + r + 42, 3);
      if (n === N && timer > 1.05) p.tag(M.TITLES[got].replace('.', ''), cx, cy + r + 62, INK, got ? GOLD : PAPER, a.w < 240 ? 1 : 2);
    }
  }

  function update(dt) {
    timer += dt; clock += dt;
    for (const f of floats) f.t += dt;
    if (phase === 'card') { if (timer >= 1.05) { phase = 'play'; timer = 0; el.dataset.phase = 'play'; shell.announce(`${ev.name}. ${ev.help}`); buttons(); } return; }
    if (phase === 'play') {
      s.t += dt; ev.update?.(s, dt, say, fx);
      if (!s.finished && s.t >= ev.time) { s.finished = true; s.timeUp = true; say('TIME', 'bad'); }
      if (s.finished && s.doneAt == null) { s.doneAt = s.t; s.holding = false; buttons(); }
      const key = ev.stage ? ev.stage(s) : null;
      if (!s.finished && key !== stageKey) buttons();
      if (s.doneAt != null && s.t >= s.doneAt + (s.timeUp ? .4 : ev.linger ?? .5)) endEvent();
      return;
    }
    if (phase === 'medal' && timer >= 1.3) next();
    if (phase === 'tally' && timer >= 2.4) finish();
  }
  function endEvent() {
    phase = 'medal'; timer = 0;
    const before = M.stars(total), m = ev.medal(s); medals[index] = m; total += m;
    shell.announce(`${ev.name}: ${M.MEDALS[m]}. ${total} of ${MAX}.`);
    const got = M.stars(total);
    if (got > before) { shell.callout(M.TITLES[got].replace('.', ''), 'win'); shell.burst(geo.x + geo.w / 2, geo.y + geo.h * .45, [GOLD, PAPER], 24); }
    else if (m === 3) shell.burst(geo.x + geo.w / 2, geo.y + geo.h * .45, [GOLD, PAPER], 14);
    else if (!m) shell.shake();
    paintHud();
    const nextName = index < N - 1 ? `Next: ${escape(EVENTS[index + 1].name)}.` : `That’s all ${WORDS[N]}.`;
    setBar(`<p class="dec-help"><strong>${m ? M.MEDALS[m] + ', +' + m : 'No medal'}.</strong> ${nextName}</p>`, `<button type="button" class="arcade-button arcade-big dec-action" data-skip><kbd>Space</kbd> Next ▶</button>`);
  }
  function next() {
    if (index === N - 1) { phase = 'tally'; timer = 0; setBar(`<p class="dec-help"><strong>${total} of ${MAX}.</strong> Adding up the medals.</p>`, ''); return; }
    begin_(index + 1);
  }
  function setBar(help, controls) {
    const box = shell.setBox(`<div class="dec-bar"><div><span class="arcade-label">EVENT ${index + 1} OF ${N} · ${escape(ev.name.toUpperCase())}</span>${help}</div>${controls ? `<div class="dec-buttons">${controls}</div>` : ''}</div>`, 'is-play');
    box.querySelector('[data-skip]')?.addEventListener('click', skip);
    if (!el.contains(document.activeElement) || box.contains(document.activeElement) || document.activeElement === document.body) shell.focusPlay();
    return box;
  }
  function begin_(i) {
    index = i; ev = EVENTS[i]; s = {t: 0, ...ev.init()}; phase = 'card'; timer = 0; stageKey = null; floats.length = 0;
    shell.tag(`EVENT ${i + 1}/${N}`); shell.level(ev.name.toUpperCase());
    setBar(`<p class="dec-help"><strong>${escape(ev.help)}</strong></p>`, '');
    running = true;
  }
  function buttons() {
    stageKey = ev.stage ? ev.stage(s) : null;
    const opts = s.finished ? [] : ev.options ? ev.options(s) : null, action = s.finished ? '' : ev.actionLabel ? ev.actionLabel(s) : ev.action;
    const keys = ev.keys || ['1', '2', '3', '4', '5'];
    const controls = opts ? opts.map((o, i) => `<button type="button" class="arcade-button arcade-big dec-choice" data-choose="${i}"><kbd>${keys[i]}</kbd> ${escape(o)}</button>`).join('')
      : action ? `<button type="button" class="arcade-button arcade-primary arcade-big dec-action" data-press><kbd>Space</kbd> ${escape(action)}</button>` : '';
    const box = setBar(`<p class="dec-help"><strong>${escape(ev.help)}</strong></p>`, controls);
    box.querySelectorAll('[data-choose]').forEach(b => b.addEventListener('click', () => { choose(Number(b.dataset.choose)); }));
    const main = box.querySelector('[data-press]');
    if (main) {
      main.addEventListener('pointerdown', e => { e.preventDefault(); press(); try { main.setPointerCapture(e.pointerId); } catch {} });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => main.addEventListener(t, release));
      main.addEventListener('click', e => { if (e.detail === 0) { press(); release(); } });
    }
  }
  const live = () => phase === 'play' && s && !s.finished;
  const press = () => { if (live() && ev.press) ev.press(s, say, fx); };
  const release = () => { if (phase === 'play' && s && ev.release) ev.release(s, say, fx); };
  const choose = i => { if (live() && ev.choose && !ev.busy?.(s) && (ev.options ? i < ev.options(s).length : true)) ev.choose(s, i, say, fx); };
  // Space, a tap or Next moves on from a medal or the final tally once it has had a moment.
  const skip = () => {
    if (phase === 'medal' && timer > .45) { if (timer < .95) timer = .95; else next(); }
    else if (phase === 'tally' && timer > 1.2) finish();
  };

  play.addEventListener('pointerdown', e => {
    if (phase === 'medal' || phase === 'tally') { e.preventDefault(); skip(); return; }
    if (phase !== 'play') return;
    e.preventDefault();
    const box = play.getBoundingClientRect(), x = e.clientX - box.left, y = e.clientY - box.top;
    const target = s.hits?.find(h => inside(h, x, y));
    if (target) { choose(target.i); return; }
    if (ev.press) { press(); try { play.setPointerCapture(e.pointerId); } catch {} }
  });
  ['pointerup', 'pointercancel'].forEach(t => play.addEventListener(t, release));
  el.addEventListener('keydown', e => {
    if (!running || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
    const main = e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp';
    if (e.target.closest('a,button') && (e.key === ' ' || e.key === 'Enter')) return;
    if (phase === 'medal' || phase === 'tally') { if (main) { e.preventDefault(); skip(); } return; }
    if (phase !== 'play') return;
    if (main) { if (ev.press) { e.preventDefault(); press(); } }
    else if (/^[1-5]$/.test(e.key) && ev.choose) { e.preventDefault(); choose(Number(e.key) - 1); }
    else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && ev.key === 'boulder') { e.preventDefault(); choose(e.key === 'ArrowLeft' ? 0 : 1); }
  });
  el.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') release(); });

  function paintHud() {
    const done = medals.filter(m => m != null).length;
    shell.meter(done / N * 100, `${done}/${N}`, 'ok'); shell.score('MEDALS', String(total));
  }
  function finish() {
    running = false; phase = 'done'; el.dataset.phase = 'result';
    const stars = M.stars(total), count = n => medals.filter(m => m === n).length;
    shell.result({
      title: M.TITLES[stars], stars,
      line: 'Most of these I do for fun. Bikes are the one I turned into a business: I started fixing them at sixteen and taught myself as I went.',
      rows: EVENTS.map((e, i) => [e.name, M.MEDALS[medals[i]] === 'None' ? 'No medal' : M.MEDALS[medals[i]]]).concat([['Total', `${total} of ${MAX}, ${count(3)} gold`]]),
      source: '<p>The events are made up for the game: the timings, tyre pressures, chess positions, holds, bites and the medal rules. The hobbies are real and all on my experience page. I fix bikes, play guitar, piano and chess, skate, surf, climb (mostly bouldering), build my own PCs and I’m learning Japanese before a ski season in Hakuba. The handline is from Senegal, where I went out on a pirogue with the local fishermen.</p>',
    });
  }

  async function begin() {
    const token = ++run; running = false; medals = []; total = 0; index = 0; ev = EVENTS[0]; s = null; phase = 'card'; floats.length = 0;
    el.dataset.phase = 'intro'; paintHud(); shell.tag(`EVENT 1/${N}`); shell.level(`${N} EVENTS`);
    if (!introSeen) {
      await shell.intro({
        label: 'JACK OF ALL TRADES', title: 'A bit of everything.',
        text: `Four quick events from things I actually do: pump up a tyre, find mate in one, climb a boulder and catch a fish off a pirogue. Gold is worth 3, silver 2 and bronze 1. Score ${M.STAR_SCORES[2]} of ${MAX} for three stars.`,
        controls: [['Space', 'The main action', 'mouse'], ['1 2 3', 'Pick an answer', 'mouse'], ['← →', 'Hands, when climbing', 'mouse'], ['Tap', 'The big button, or the thing itself', 'touch']],
        button: 'First event',
      });
      if (token !== run) return;
      introSeen = true;
    }
    shell.layout(); begin_(0); shell.focusPlay();
  }
  // Read only, for the play scripts in the notes folder.
  el.decathlon = {state: () => s, event: () => ev.key, phase: () => phase};
  const game = {get running() { return running; }, update, render, layout, restart() { begin(); }, destroy() { run++; running = false; }};
  shell.attach(game);
  begin();
  return shell;
}
