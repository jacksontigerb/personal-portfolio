// Jackson's decathlon: Jack of All Trades versus The To Do List.
// Ten events of a few seconds each. Space or a tap does the main thing, number keys or the
// buttons pick, and each event ends on a medal that flies into the rack along the top.
import {createShell, escape} from './shell.mjs?v=2';
import {pen, sprite, INK, PAPER} from './pixels.mjs?v=2';
import {drawBoss} from '../battle-art.mjs?v=5';
import * as M from './decathlon-model.mjs?v=1';

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
  {key: 'strum', name: 'Strum', help: 'Strum as each note reaches the sound hole.', time: 4.1, action: 'Strum', linger: .4,
    init() { return {beats: M.STRUM_BEATS, hit: [], errors: [], missed: [], ring: -9}; },
    press(s, say) {
      const i = s.beats.findIndex((b, k) => !s.hit[k] && !s.missed[k] && Math.abs(s.t - b) < .35);
      s.ring = s.t;
      if (i < 0) return;
      s.hit[i] = true; s.errors[i] = s.t - s.beats[i];
      const m = M.timingMedal(s.errors[i]);
      say(M.timingWord(m, s.errors[i]), m === 3 ? 'good' : m ? 'warn' : 'bad', s.hx, s.hy - 60);
      if (s.hit.filter(Boolean).length + s.missed.filter(Boolean).length === 4) s.finished = true;
    },
    update(s, dt, say) {
      s.beats.forEach((b, k) => { if (!s.hit[k] && !s.missed[k] && s.t > b + .35) { s.missed[k] = true; say('MISS', 'bad', s.hx, s.hy - 60); } });
      if (s.hit.filter(Boolean).length + s.missed.filter(Boolean).length === 4) s.finished = true;
    },
    medal: s => M.strumMedal(s.errors.filter(e => e != null)),
    draw(s, p, a) {
      p.r(a.x, a.y, a.w, a.h, '#2b2433');
      p.poly([[a.x + a.w * .22, a.y], [a.x + a.w * .38, a.y], [a.x + a.w * .5, a.y + a.h], [a.x + a.w * .06, a.y + a.h]], '#3a3144');
      p.r(a.x, a.y + a.h * .86, a.w, a.h * .14, '#4a3a2c');
      const cy = a.y + a.h * .52, R = Math.min(a.h * .26, a.w * .15), bx = a.x + a.w * .2, hx = bx + R * .35;
      s.hx = hx * 2; s.hy = cy * 2;
      // Body, neck, sound hole and strings.
      p.disc(bx - R * .2, cy, R + 2, INK); p.disc(bx + R * .55, cy, R * .78 + 2, INK);
      p.disc(bx - R * .2, cy, R, '#c07a3e'); p.disc(bx + R * .55, cy, R * .78, '#c07a3e');
      const nx = bx + R * 1.1, nh = Math.max(12, R * .42);
      p.r(nx, cy - nh / 2 - 1, a.x + a.w - nx, nh + 2, INK); p.r(nx, cy - nh / 2, a.x + a.w - nx, nh, '#6b4a2a');
      for (let f = nx + 10; f < a.x + a.w; f += Math.max(14, a.w * .07)) p.r(f, cy - nh / 2, 1, nh, '#c9bda6');
      p.disc(hx, cy, R * .36, '#241a14');
      p.r(bx - R * .75, cy - nh / 2 - 1, 4, nh + 2, '#3a2418');
      const ringing = s.t - s.ring < .3;
      for (let i = 0; i < 6; i++) {
        const y = cy - nh / 2 + 2 + i * (nh - 4) / 5, wob = ringing ? Math.round(Math.sin(s.t * 90 + i) * 1.2 * (1 - (s.t - s.ring) / .3)) : 0;
        p.r(bx - R * .72, y + wob, a.x + a.w - bx + R * .72, 1, '#efe4c8');
      }
      // The strum line over the hole, and notes coming down the neck.
      p.r(hx - 1, cy - R * 1.05, 3, R * 2.1, GOLD); p.tag('STRUM', hx, cy - R * 1.05 - 12, INK, GOLD, 1);
      const speed = a.w * .32;
      s.beats.forEach((b, i) => {
        const x = hx + (b - s.t) * speed; if (x < a.x - 10 || x > a.x + a.w + 10) return;
        const col = s.hit[i] ? (Math.abs(s.errors[i]) <= .08 ? '#6bbf85' : AMBER) : s.missed[i] ? RED : PAPER;
        const y = cy - nh / 2 - 12 - (s.missed[i] ? (s.t - b - .35) * 60 : 0);
        p.disc(x, y + 8, 4, col); p.r(x + 3, y - 2, 2, 10, col); p.r(x + 3, y - 2, 5, 2, col);
      });
      for (let i = 0; i < 4; i++) p.r(a.x + a.w / 2 - 18 + i * 10, a.y + a.h * .92, 6, 6, s.hit[i] ? (Math.abs(s.errors[i]) <= .08 ? '#6bbf85' : AMBER) : s.missed[i] ? RED : '#5a4d63');
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
  {key: 'ollie', name: 'Ollie', help: 'Ollie just before each bin reaches you.', time: 4.6, action: 'Ollie', linger: .7,
    init() { return {arrive: M.OLLIE_BINS, jumps: [], medals: []}; },
    press(s, say, fx) {
      const i = s.jumps.length; if (i >= 2 || s.crashed) return;
      const err = s.t - (s.arrive[i] - M.OLLIE_LEAD), m = M.timingMedal(err, M.OLLIE_WINDOWS);
      s.jumps.push(s.t); s.medals[i] = m;
      if (m) say(m === 3 ? 'CLEAN' : m === 2 ? 'NICE' : 'JUST', m === 3 ? 'good' : 'warn', s.sx, s.gy - 90);
      else { s.crashAt = Math.max(s.t + .12, s.arrive[i]); s.crashWord = err < 0 ? 'TOO EARLY' : 'TOO LATE'; }
    },
    update(s, dt, say, fx) {
      for (let i = 0; i < 2; i++) if (s.jumps.length <= i && s.t > s.arrive[i] + .05 && !s.crashAt) { s.jumps.push(null); s.medals[i] = 0; s.crashAt = s.t; s.crashWord = 'NO OLLIE'; }
      if (s.crashAt && !s.crashed && s.t >= s.crashAt) { s.crashed = s.t; say(s.crashWord, 'bad', s.sx, s.gy - 90); fx.shake(); fx.burst(s.sx, s.gy, ['#3e7654', INK], 10); }
      if (s.crashed && s.t > s.crashed + .1) s.finished = true;
      if (s.medals.length === 2 && !s.crashAt && s.t > s.arrive[1] + .35) s.finished = true;
    },
    medal: s => s.crashed && s.medals.length < 2 ? 0 : M.ollieMedal(s.medals),
    draw(s, p, a) {
      const g = a.y + a.h * .74, sx = a.x + a.w * .3, speed = a.w * .3; s.sx = sx * 2; s.gy = g * 2;
      sky(p, a, '#bfe0ee', '#d4ebf2', .5);
      for (let i = 0; i < 9; i++) { const w = a.w * .14, x = a.x + ((i * w * 1.15 - s.t * speed * .25) % (a.w + w) + a.w + w) % (a.w + w) - w, h = a.h * (.22 + (i * 37 % 20) / 100); p.r(x, g - h, w, h, i % 2 ? '#9fb3c0' : '#b0c2cd'); for (let wy = g - h + 5; wy < g - 6; wy += 9) p.r(x + 4, wy, w - 8, 3, '#c8d6de'); }
      p.r(a.x, g, a.w, a.y + a.h - g, '#b8b1a5'); p.r(a.x, g, a.w, 2, INK);
      for (let x = a.x - ((s.t * speed) % 24); x < a.x + a.w; x += 24) p.r(x, g + 8, 12, 1, '#9e978b');
      s.arrive.forEach((t0, i) => {
        const x = sx + (t0 - s.t) * speed; if (x < a.x - 20 || x > a.x + a.w + 20) return;
        if (s.crashed && s.medals[i] === 0) { p.r(x - 2, g - 12, 20, 12, '#3e7654'); p.r(x + 16, g - 13, 3, 14, '#2f5d43'); return; }
        p.r(x - 8, g - 20, 16, 20, '#3e7654'); p.r(x - 9, g - 22, 18, 3, '#2f5d43'); p.r(x - 5, g - 16, 10, 1, '#5a9270'); p.disc(x + 5, g - 2, 2, INK);
      });
      let h = 0, tilt = 0; const last = s.jumps.filter(j => j != null).at(-1);
      if (last != null && !s.crashed && s.t - last < .55) { const u = (s.t - last) / .55; h = Math.sin(Math.PI * u) * 34; tilt = u < .3 ? 5 : u > .75 ? -2 : 0; }
      const y = g - 4 - h;
      if (s.crashed) { p.blit(LYING, sx + 6, g - 4, 2); p.line(sx + 18, g - 3, sx + 36, g - 6, '#e3822b', 3); }
      else { p.line(sx - 12, y + 4 + tilt, sx + 12, y + 4 - tilt, '#e3822b', 3); p.r(sx - 9, y + 6, 3, 3, INK); p.r(sx + 6, y + 6, 3, 3, INK); p.blit(h ? CROUCH : PERSON, sx, y - (h ? 7 : 9), 2); }
    }},
  {key: 'kana', name: 'Read the kana', help: 'I’m learning Japanese. Use the key to read the sign.', time: 10, linger: .5,
    init() { return {...M.kanaRound(), q: 0, right: 0, flash: null}; },
    options: s => s.q < 3 ? s.opts[s.q].map(k => k[1]) : [],
    stage: s => s.q,
    busy: s => s.flash && s.t - s.flash.t < .4,
    choose(s, i, say) {
      if (s.q >= 3) return;
      const word = s.words[s.q], ok = s.opts[s.q][i] === word; if (ok) s.right++;
      s.flash = {ok, t: s.t, word}; s.q++;
      say(ok ? `${word[1]} → ${word[2]}` : `it says ${word[1]}`, ok ? 'good' : 'bad', s.sx, s.sy);
      if (s.q === 3) { s.finished = true; s.at = s.t; }
    },
    medal: s => M.answerMedal(s.right, 3, s.at ?? 99, 7),
    draw(s, p, a) {
      const ground = a.y + a.h * .8;
      sky(p, a, '#a9d3ea', '#c6e2f0', .5);
      hills(p, a, ground, '#b7c7d4', 1, a.h * .55);
      for (let i = 0; i <= 8; i++) { const f = Math.abs(Math.sin(1 + i * 1.7)), x = a.x + a.w * i / 8, y = ground - a.h * .55 * (.4 + .6 * f); if (f > .75) p.poly([[x - 7, y + 6], [x, y], [x + 7, y + 6]], PAPER); }
      hills(p, a, ground, '#7d93a7', 4, a.h * .3);
      p.r(a.x, ground, a.w, a.y + a.h - ground, '#eef3f6');
      const w = Math.min(a.w * .62, 170), h = Math.min(a.h * .36, 62), x = a.x + a.w / 2 - w / 2, y = a.y + a.h * .12;
      s.sx = (x + w / 2) * 2; s.sy = (y + h + 18) * 2;
      p.r(x + w * .2, y + h, 4, ground - y - h, '#6b4a2a'); p.r(x + w * .8 - 4, y + h, 4, ground - y - h, '#6b4a2a');
      const shown = s.flash && s.t - s.flash.t < .4 ? s.flash : null, word = shown ? shown.word : s.words[Math.min(2, s.q)];
      p.r(x - 3, y - 3, w + 6, h + 6, shown ? (shown.ok ? GREEN : RED) : INK); p.r(x, y, w, h, '#c99a5a'); p.r(x + 3, y + 3, w - 6, h - 6, '#dcb57a');
      p.c.fillStyle = INK; p.c.font = `bold ${Math.round(h * .58)}px "Hiragino Sans","Noto Sans JP",sans-serif`; p.c.textAlign = 'center'; p.c.textBaseline = 'middle';
      p.c.fillText(word[0], x + w / 2, y + h / 2 + 2);
      // The key: every kana in this question's answers and the sound it makes.
      if (s.q < 3) {
        const key = M.keyFor(s.opts[s.q]), per = Math.min(34, (a.w - 8) / Math.min(key.length, 5)), rows = Math.ceil(key.length / Math.floor((a.w - 8) / per)), across = Math.ceil(key.length / rows);
        const kh = 24, top = ground - rows * kh - 6;
        p.r(a.x + a.w / 2 - across * per / 2 - 4, top - 4, across * per + 8, rows * kh + 6, 'rgba(251,251,250,.9)');
        key.forEach((k, n) => {
          const col = n % across, row = Math.floor(n / across), kx = a.x + a.w / 2 - across * per / 2 + col * per + per / 2, ky = top + row * kh;
          p.c.font = `bold 12px "Hiragino Sans","Noto Sans JP",sans-serif`; p.c.fillText(k, kx, ky + 7);
          const sound = M.SOUNDS[k]; p.text(sound, kx - p.textWidth(sound) / 2, ky + 15, '#5f6164', 1);
        });
      }
      p.c.textAlign = 'start'; p.c.textBaseline = 'alphabetic';
      for (let i = 0; i < 3; i++) p.r(a.x + a.w / 2 - 14 + i * 10, a.y + a.h - 9, 6, 6, i < s.q ? GREEN : '#9aa3ab');
    }},
  {key: 'piano', name: 'Play it back', help: 'Watch the four notes light up, then play them back.', time: 6.8, linger: .5,
    init() { return {seq: Array.from({length: 4}, () => Math.floor(Math.random() * 5)), idx: 0, down: null, wrong: false, hits: []}; },
    options: s => s.t < 2 ? [] : ['C', 'D', 'E', 'F', 'G'],
    stage: s => s.t < 2 ? 'watch' : 'play',
    choose(s, i, say, fx) {
      if (s.t < 2) return;
      s.down = {i, t: s.t};
      if (s.seq[s.idx] === i) { s.idx++; say('CDEFG'[i], 'good', s.keyX[i], s.keyY); if (s.idx === 4) { s.finished = true; s.at = s.t - 2; } }
      else { s.wrong = true; s.finished = true; say('WRONG NOTE', 'bad', s.keyX[i], s.keyY); fx.shake(); }
    },
    medal: s => s.idx === 4 ? (s.at <= 2.4 ? 3 : 2) : s.idx >= 2 ? 1 : 0,
    note: s => s.wrong ? 'WRONG NOTE' : '',
    draw(s, p, a) {
      p.r(a.x, a.y, a.w, a.h, '#e9dcc4'); for (let x = a.x + 6; x < a.x + a.w; x += 16) p.r(x, a.y, 1, a.h * .7, '#dccdb1');
      p.r(a.x, a.y + a.h * .85, a.w, a.h * .15, '#9c7a55');
      const kw = Math.min(a.w * .8 / 5, 46), kh = Math.min(a.h * .5, kw * 3), x0 = a.x + a.w / 2 - kw * 2.5, y0 = a.y + a.h * .56 - kh / 2;
      p.r(x0 - 10, y0 - 22, kw * 5 + 20, kh + 30, '#3a2a20'); p.r(x0 - 10, y0 - 22, kw * 5 + 20, 3, '#5a4030');
      const watching = s.t < 2, flashK = watching ? Math.floor((s.t - .25) / .4) : -1;
      const lit = watching ? (flashK >= 0 && flashK < 4 && (s.t - .25) % .4 < .3 ? s.seq[flashK] : null) : s.down && s.t - s.down.t < .22 ? s.down.i : null;
      s.keyX = s.keyX || []; s.keyY = (y0 - 26) * 2; s.hits.length = 0;
      for (let i = 0; i < 5; i++) {
        const x = x0 + i * kw; s.keyX[i] = (x + kw / 2) * 2;
        p.r(x, y0, kw - 1, kh, INK); p.r(x + 1, y0 + 1, kw - 3, kh - 2, lit === i ? (watching ? GOLD : s.wrong ? RED : '#8fd18f') : PAPER);
        p.text('CDEFG'[i], x + kw / 2 - 2, y0 + kh - 9, '#8a8f94', 1);
        s.hits.push({x: x * 2, y: y0 * 2, w: kw * 2, h: kh * 2, i});
      }
      for (const i of [0, 1, 3]) p.r(x0 + (i + 1) * kw - kw * .22, y0, kw * .44, kh * .58, INK);
      if (watching && lit != null) p.tag('CDEFG'[lit], x0 + lit * kw + kw / 2, y0 - 16, INK, GOLD, 1);
      else p.tag(watching ? 'WATCH' : 'YOUR TURN', a.x + a.w / 2, y0 - 16, PAPER, watching ? INK : GREEN, 1);
      for (let i = 0; i < 4; i++) p.r(a.x + a.w / 2 - 16 + i * 9, y0 + kh + 12, 5, 5, i < s.idx ? GREEN : watching && i <= flashK ? GOLD : '#b9a98a');
    }},
  {key: 'pc', name: 'Build a PC', help: 'Which slot does this part go in?', time: 8, linger: .7,
    init() { return {slots: pickN(['cpu', 'ram', 'pcie'], 3), order: pickN(M.PARTS, 3), q: 0, right: 0, placed: {}, flash: null, hits: []}; },
    options: s => s.q < 3 ? ['Slot 1', 'Slot 2', 'Slot 3'] : [],
    stage: s => s.q,
    busy: s => s.flash && s.t - s.flash.t < .3,
    choose(s, i, say, fx) {
      if (s.q >= 3) return;
      const part = s.order[s.q], ok = s.slots[i] === part[1];
      if (ok) { s.right++; s.placed[part[1]] = true; fx.burst(s.slotX[i], s.slotY, [GOLD, PAPER], 8); }
      say(ok ? 'CLICK' : 'WONT FIT', ok ? 'good' : 'bad', s.slotX[i], s.slotY - 50);
      s.flash = {ok, t: s.t, i}; s.q++;
      if (s.q === 3) { s.finished = true; s.at = s.t; if (s.right === 3) say('IT BOOTS', 'good', s.bootX, s.bootY); }
    },
    medal: s => M.answerMedal(s.right, 3, s.at ?? 99, 5.5),
    draw(s, p, a) {
      p.r(a.x, a.y, a.w, a.h, '#d9d2c3'); p.r(a.x, a.y + a.h * .9, a.w, a.h * .1, '#9c7a55');
      const wide = a.w > a.h * 1.1;
      const bw = wide ? Math.min(a.w * .56, 210) : Math.min(a.w * .86, 190), bh = wide ? Math.min(a.h * .8, 150) : Math.min(a.h * .56, 150);
      const bx = wide ? a.x + a.w * .62 - bw / 2 : a.x + a.w / 2 - bw / 2, by = wide ? a.y + a.h * .48 - bh / 2 : a.y + a.h * .4;
      s.bootX = (bx + bw / 2) * 2; s.bootY = (by + 10) * 2; s.slotY = (by + bh / 2) * 2; s.slotX = s.slotX || []; s.hits.length = 0;
      p.r(bx - 2, by - 2, bw + 4, bh + 4, INK); p.r(bx, by, bw, bh, '#2f6b4f'); for (let i = 0; i < 16; i++) p.r(bx + (i * 37 % bw), by + (i * 53 % bh), 8, 1, '#3e8a66');
      if (s.finished && s.right === 3) p.r(bx + 4, by + 4, 4, 4, Math.floor(s.t * 6) % 2 ? '#6bbf85' : GREEN);
      const sl = Math.min(bh * .32, 36);
      s.slots.forEach((slot, i) => {
        const cx = bx + bw * (.2 + .3 * i), cy = by + bh * .48; s.slotX[i] = cx * 2;
        const hot = s.flash && !s.flash.ok && s.t - s.flash.t < .3 && s.flash.i === i;
        if (slot === 'cpu') { p.r(cx - sl * .45, cy - sl * .45, sl * .9, sl * .9, '#c9ccd0'); p.r(cx - sl * .35, cy - sl * .35, sl * .7, sl * .7, s.placed.cpu ? '#6b6e72' : '#e3e6e8'); if (!s.placed.cpu) for (let k = 0; k < 4; k++) p.r(cx - sl * .3 + k * sl * .18, cy - sl * .3, 1, sl * .6, '#c9ccd0'); }
        if (slot === 'ram') { p.r(cx - 7, cy - sl, 3, sl * 2, '#1f2023'); p.r(cx + 4, cy - sl, 3, sl * 2, '#1f2023'); if (s.placed.ram) p.r(cx - 3, cy - sl + 2, 6, sl * 2 - 4, '#2a6f9e'); }
        if (slot === 'pcie') { p.r(cx - 3, cy - sl * .8, 6, sl * 1.6, '#1f2023'); p.r(cx - 1, cy - sl * .8, 2, sl * 1.6, '#8a8f94'); if (s.placed.pcie) { p.r(cx - 9, cy - sl * .85, 18, sl * 1.7, '#3a3f45'); p.disc(cx, cy - sl * .35, 5, '#6b6e72'); p.disc(cx, cy + sl * .35, 5, '#6b6e72'); } }
        if (hot) p.r(cx - 12, cy - sl, 24, sl * 2, 'rgba(173,52,60,.35)');
        p.tag(String(i + 1), cx, by + bh - 12, PAPER, INK, 1);
        s.hits.push({x: (cx - bw * .15) * 2, y: by * 2, w: bw * .3 * 2, h: bh * 2, i});
      });
      if (s.q < 3) {
        const part = s.order[s.q], x = wide ? a.x + a.w * .16 : a.x + a.w / 2, y = wide ? a.y + a.h * .45 : a.y + a.h * .17;
        const nudge = s.flash && !s.flash.ok && s.t - s.flash.t < .25 ? Math.sin(s.t * 70) * 2 : 0;
        p.c.save(); p.c.translate(nudge, 0);
        if (part[1] === 'ram') { p.r(x - 22, y - 5, 44, 10, '#2a6f9e'); for (let i = 0; i < 6; i++) p.r(x - 19 + i * 7, y - 3, 4, 5, '#1f2023'); p.r(x - 22, y + 5, 44, 2, GOLD); }
        if (part[1] === 'pcie') { p.r(x - 26, y - 10, 52, 20, '#3a3f45'); p.disc(x - 10, y, 7, '#6b6e72'); p.disc(x + 10, y, 7, '#6b6e72'); p.r(x - 26, y + 10, 30, 3, GOLD); }
        if (part[1] === 'cpu') { p.r(x - 12, y - 12, 24, 24, '#c9ccd0'); p.r(x - 8, y - 8, 16, 16, '#9aa3ab'); p.r(x - 12, y + 10, 4, 2, GOLD); }
        p.c.restore();
        p.tag(part[0], x, y + 18, INK, PAPER, 1);
      }
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
  {key: 'popup', name: 'Pop up', help: 'Tap fast to paddle, then pop up as the wave lifts you.', time: 4.2, action: 'Paddle', linger: .8,
    init() { return {paddle: 0, popped: null, missed: false, splash: -9}; },
    stage: s => s.t < M.WAVE_AT ? 'paddle' : 'pop',
    actionLabel: s => s.t < M.WAVE_AT ? 'Paddle' : 'Pop up',
    press(s, say) {
      if (s.t < M.WAVE_AT) { s.paddle = Math.min(1, s.paddle + .1); s.splash = s.t; return; }
      if (s.missed) return;
      s.popped = s.t; s.finished = true; s.m = M.popMedal(s.paddle, s.popped);
      const err = s.popped - M.POP_AT;
      say(s.m === 3 ? 'UP AND RIDING' : s.m ? (err < 0 ? 'A BIT EARLY' : 'A BIT LATE') : err < 0 ? 'TOO EARLY' : 'TOO LATE', s.m === 3 ? 'good' : s.m ? 'warn' : 'bad', s.bx, s.by - 60);
    },
    update(s, dt, say) {
      if (s.t >= M.WAVE_AT && s.paddle < .5 && !s.missed) { s.missed = true; s.finished = true; say('MISSED THE WAVE', 'bad', s.bx, s.by - 60); }
      if (s.t > 3.6 && s.popped == null && !s.missed) { s.finished = true; say('TOO LATE', 'bad', s.bx, s.by - 60); }
    },
    medal: s => s.missed || s.popped == null ? 0 : s.m,
    note: s => s.missed ? 'TOO SLOW' : '',
    draw(s, p, a) {
      const horizon = sky(p, a, '#a9d8ec', '#cbe8f3', .34); sun(p, a.x + a.w * .82, a.y + a.h * .14, 8);
      p.r(a.x, horizon, a.w, a.y + a.h - horizon, '#3f8fb0');
      for (let i = 0; i < 6; i++) p.r(a.x + ((i * 61 + s.t * 12) % a.w), horizon + 6 + i * 9, 10, 1, '#5aa6c4');
      const lift = s.t > M.WAVE_AT - .6 ? clamp((s.t - M.WAVE_AT + .6) / 1.25, 0, 1) : 0, bx = a.x + a.w * .45, base = a.y + a.h * .72;
      const rideOk = s.popped != null && s.m > 0, ride = rideOk ? clamp((s.t - s.popped) / .8, 0, 1) : 0;
      // The swell builds from behind and lifts the board.
      const crest = a.x + a.w * (.95 - lift * .5), peak = a.h * .34 * lift, face = [];
      for (let i = 0; i <= 24; i++) { const x = a.x + a.w * i / 24, d = (x - crest) / (a.w * .28); face.push([x, base - peak * Math.exp(-d * d * (d > 0 ? 2.5 : .8))]); }
      p.poly([...face, [a.x + a.w, a.y + a.h], [a.x, a.y + a.h]], '#2f7e9c');
      face.forEach(([x, y], i) => { if (i && lift > .5) p.r(x, y, a.w / 24 + 1, 2, '#bfe6f2'); });
      const d0 = (bx - crest) / (a.w * .28), wy = base - peak * Math.exp(-d0 * d0 * (d0 > 0 ? 2.5 : .8)) - 2;
      const x = bx + ride * a.w * .2, y = wy + ride * a.h * .1; s.bx = x * 2; s.by = y * 2;
      const fell = s.popped != null && !rideOk;
      if (fell) { const u = clamp((s.t - s.popped) / .4, 0, 1); p.line(x - 18, y + 2, x + 16, y - 6 * u, PAPER, 3); if (u >= 1) { p.disc(x + 4, y + 2, 6, '#e8f6fb'); p.blit(LYING, x + 2, y + 6, 2, .8); } else p.blit(PERSON, x, y - 9 - u * 4, 2, u); }
      else {
        const k = a.w > 300 ? 3 : 2; p.line(x - 9 * k, y + 2, x + 9 * k, y + 2 - (rideOk ? 4 : 0), PAPER, 3);
        const up = s.popped != null; p.blit(up ? PERSON : LYING, x, y - (up ? 5.5 * k : k), k);
        if (!up && s.t - s.splash < .15) { p.r(x - 22, y + 1, 4, 2, PAPER); p.r(x + 20, y + 1, 4, 2, PAPER); p.r(x - 16, y - 3, 2, 2, PAPER); }
      }
      const mw = Math.min(a.w * .35, 110), done = s.t >= M.WAVE_AT;
      p.r(a.x + 8, a.y + 8, mw + 4, 10, INK); p.r(a.x + 10, a.y + 10, mw * s.paddle, 6, s.paddle >= .9 ? '#6bbf85' : s.paddle >= .5 ? GOLD : '#e3822b');
      p.r(a.x + 10 + mw * .5, a.y + 8, 1, 10, PAPER);
      p.text(done ? 'PADDLE DONE' : 'PADDLE', a.x + 10, a.y + 22, INK, 1);
      if (s.t > 2.6 && s.t < 3.15 && s.popped == null && !s.missed) p.tag('POP UP!', x, y - 36, PAPER, GREEN, 2);
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

export function start(root, {key, characters, onExit}) {
  const shell = createShell(root, {key, characters, boss: 'The To Do List', meterLabel: 'LIST', onExit, scene: 'far', reserve: [104, 150]});
  const {el, play} = shell, p = pen(play);
  play.setAttribute('aria-label', 'Decathlon. Space or a tap for the main action, number keys for choices, left and right arrows for hands.');
  shell.$('.arcade-sprites').innerHTML = '<canvas class="dec-boss" width="64" height="64"></canvas>';
  const boss = shell.$('.dec-boss');
  let geo = null, index = 0, ev = EVENTS[0], s = null, phase = 'card', timer = 0, medals = [], running = false, run = 0, introSeen = false, pose = '', stageKey = null, total = 0;
  const floats = [];
  const setPose = next => { if (next !== pose) { pose = next; drawBoss(boss, 'allrounder', next); } };
  setPose('idle');
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
    const size = W >= 1150 ? 130 : 0; boss.hidden = !size;
    Object.assign(boss.style, {width: size + 'px', height: size + 'px', left: geo.x + w + 16 + 'px', top: geo.y + 10 + 'px'});
  }
  shell.floor = h => Math.round(h * .85);

  // The rack of ten medals along the top of the panel, and the three stars they count towards.
  function drawRack(x, y, w, h, shown, flyIndex = -1) {
    p.r(x, y, w, h, INK);
    const starW = w >= 200 ? 58 : 30, slots = w - starW - 6, gap = slots / 10, r = Math.max(3, Math.min(h / 2 - 3, gap / 2 - 2));
    for (let i = 0; i < 10; i++) {
      const cx = x + 4 + gap * (i + .5), cy = y + h / 2, m = i < shown ? medals[i] : null;
      if (i === index && phase !== 'tally' && phase !== 'done' && m == null) p.disc(cx, cy, r + 1, Math.floor(clock * 4) % 2 ? '#8a8f94' : '#5f6164');
      p.disc(cx, cy, r, '#3a3b3e');
      if (m != null && i !== flyIndex) { p.disc(cx, cy, r, m ? MEDAL_COLOUR[m] : '#4a4b4f'); if (m) p.r(cx - r * .4, cy - r * .5, Math.max(1, r * .35), Math.max(1, r * .35), 'rgba(255,255,255,.6)'); else p.line(cx - r * .5, cy, cx + r * .5, cy, RED, 1); }
    }
    const got = M.stars(total), sx = x + w - starW + 2;
    for (let i = 0; i < 3; i++) p.blit(i < got ? STAR : STAR_OFF, sx + 5 + i * 9, y + h / 2 - (starW > 40 ? 3 : 0), 1);
    if (starW > 40) { const next = M.STAR_SCORES[got]; p.text(next ? `${total}/${next}` : `${total}/30`, sx + 30, y + h / 2 - 2, got === 3 ? GOLD : PAPER, 1); }
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
      p.tag(`EVENT ${index + 1} OF 10`, cx, cy - 26, INK, PAPER, 1);
      p.tag(ev.name, cx, cy - 8, INK, GOLD, k);
      p.tag(timer < .75 ? 'READY' : 'GO', cx, cy + 10 + 6 * k, PAPER, timer < .75 ? INK : GREEN, 2);
    }
    p.c.restore();
    const left = phase === 'play' ? Math.max(0, 1 - (s.doneAt ?? s.t) / ev.time) : phase === 'card' ? 1 : 0;
    p.r(a.x, a.y + a.h, a.w, 4, '#dcd6c8'); p.r(a.x, a.y + a.h, a.w * left, 4, left < .25 ? RED : GREEN);
    let shown = medals.length, fly = -1;
    if (phase === 'medal') {
      const m = medals[index], pop = clamp(timer / .15, 0, 1), go = clamp((timer - .95) / .3, 0, 1), ease = go * go;
      const gap = (full.w - (full.w >= 200 ? 58 : 30) - 6) / 10, tx = full.x + 4 + gap * (index + .5), ty = full.y + band / 2;
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
      const cx = a.x + a.w / 2, cy = a.y + a.h * .36, n = Math.min(10, Math.floor(timer / .09) + 1), count = medals.slice(0, n).reduce((x, m) => x + m, 0);
      const r = Math.min(10, (a.w - 20) / 22), gap = r * 2 + 3;
      for (let i = 0; i < 10; i++) { const x = cx - gap * 4.5 + gap * i; p.disc(x, cy, r + 1, INK); p.disc(x, cy, r, i < n ? MEDAL_COLOUR[medals[i]] : '#3a3b3e'); }
      const got = M.stars(count);
      p.tag(`${count} OF 30`, cx, cy + r + 10, INK, PAPER, 2);
      for (let i = 0; i < 3; i++) p.blit(i < got ? STAR : STAR_OFF, cx - 24 + i * 24, cy + r + 42, 3);
      if (n === 10 && timer > 1.05) p.tag(M.TITLES[got].replace('.', ''), cx, cy + r + 62, INK, got ? GOLD : PAPER, a.w < 240 ? 1 : 2);
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
    setPose(m >= 2 ? 'hit' : m === 0 ? 'attack' : 'idle');
    shell.announce(`${ev.name}: ${M.MEDALS[m]}. ${total} of 30.`);
    const got = M.stars(total);
    if (got > before) { shell.callout(M.TITLES[got].replace('.', ''), 'win'); shell.burst(geo.x + geo.w / 2, geo.y + geo.h * .45, [GOLD, PAPER], 24); }
    else if (m === 3) shell.burst(geo.x + geo.w / 2, geo.y + geo.h * .45, [GOLD, PAPER], 14);
    else if (!m) shell.shake();
    paintHud();
    const nextName = index < 9 ? `Next: ${escape(EVENTS[index + 1].name)}.` : 'That’s all ten.';
    setBar(`<p class="dec-help"><strong>${m ? M.MEDALS[m] + ', +' + m : 'No medal'}.</strong> ${nextName}</p>`, `<button type="button" class="arcade-button arcade-big dec-action" data-skip><kbd>Space</kbd> Next ▶</button>`);
  }
  function next() {
    if (index === EVENTS.length - 1) { phase = 'tally'; timer = 0; setPose(M.stars(total) >= 2 ? 'defeated' : 'attack'); setBar(`<p class="dec-help"><strong>${total} of 30.</strong> Adding up the medals.</p>`, ''); return; }
    begin_(index + 1);
  }
  function setBar(help, controls) {
    const box = shell.setBox(`<div class="dec-bar"><div><span class="arcade-label">EVENT ${index + 1} OF 10 · ${escape(ev.name.toUpperCase())}</span>${help}</div>${controls ? `<div class="dec-buttons">${controls}</div>` : ''}</div>`, 'is-play');
    box.querySelector('[data-skip]')?.addEventListener('click', skip);
    if (!el.contains(document.activeElement) || box.contains(document.activeElement) || document.activeElement === document.body) shell.focusPlay();
    return box;
  }
  function begin_(i) {
    index = i; ev = EVENTS[i]; s = {t: 0, ...ev.init()}; phase = 'card'; timer = 0; stageKey = null; floats.length = 0; setPose('idle');
    shell.tag(`EVENT ${i + 1}/10`); shell.level(ev.name.toUpperCase());
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
    shell.meter(done / 10 * 100, `${done}/10`, 'ok'); shell.score('MEDALS', String(total));
  }
  function finish() {
    running = false; phase = 'done'; el.dataset.phase = 'result';
    const stars = M.stars(total), count = n => medals.filter(m => m === n).length;
    setPose(stars >= 2 ? 'defeated' : 'attack');
    shell.result({
      title: M.TITLES[stars], stars,
      line: `${count(3)} gold, ${count(2)} silver, ${count(1)} bronze: ${total} of 30. ${stars < 3 ? `Three stars takes ${M.STAR_SCORES[2]}.` : ''}`,
      source: '<p>The events are made up for the game: the timings, tyre pressures, chess positions, the kana quiz and the medal rules. The hobbies are real and all on my experience page. I fix bikes, play guitar, piano and chess, skate, surf, climb (mostly bouldering), build my own PCs and I’m learning Japanese before a ski season in Hakuba. The handline is from Senegal, where I went out on a pirogue with the local fishermen.</p>',
    });
    const text = shell.box.querySelector('.arcade-text');
    const strip = document.createElement('div'); strip.className = 'dec-podium';
    strip.innerHTML = `<ol class="dec-medals">${EVENTS.map((e, i) => `<li data-medal="${medals[i]}"><i aria-hidden="true"></i><span>${escape(e.name)}</span><b>${M.MEDALS[medals[i]] === 'None' ? 'none' : M.MEDALS[medals[i]]}</b></li>`).join('')}</ol>
      <p class="arcade-text dec-bridge">Most of these I do for fun. Bikes are the one I turned into a business: I started fixing them at sixteen and taught myself as I went.</p>`;
    text.after(strip);
  }

  async function begin() {
    const token = ++run; running = false; medals = []; total = 0; index = 0; ev = EVENTS[0]; s = null; phase = 'card'; floats.length = 0;
    el.dataset.phase = 'intro'; setPose('idle'); paintHud(); shell.tag('EVENT 1/10'); shell.level('LV 99+');
    if (!introSeen) {
      await shell.intro({
        label: 'JACK OF ALL TRADES VS THE TO DO LIST', title: 'Jackson’s decathlon.',
        text: 'Ten quick events from things I actually do, from pumping a tyre to catching a fish off a pirogue. Gold is worth 3, silver 2 and bronze 1. Score 25 of 30 for three stars.',
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
