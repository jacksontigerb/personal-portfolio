// Get the shot: Content Creator Jackson versus The Algorithm.
import {createShell} from './shell.mjs?v=3';
import {pen, sprite, INK, PAPER} from './pixels.mjs?v=3';
import {drawBoss} from './bosses.mjs?v=3';
import * as M from './shot-model.mjs?v=3';

const TITLES = ['Swiped away.', 'A few likes.', 'For You page.', 'The Algorithm approves.'];
const VERDICT = s => s >= 85 ? ['BOOSTED', 'win'] : s >= 60 ? ['FOR YOU PAGE', 'good'] : s >= 30 ? ['3 LIKES', ''] : ['SWIPED', 'bad'];
const band = (p, x, y, w, h, cols) => cols.forEach((c, i) => p.r(x, y + h * i / cols.length, w, h / cols.length + 1, c));

// Small sprites, drawn facing right.
const SKIER = sprite([
  '....KKK.......', '...KKKKK......', '...KOOOK......', '....BBB.......', '..BBBBBBB.....', '.BBBBBBBBW....',
  '..BBBBBB.W....', '..NNNNN...W...', '..NN..NN......', '.NN....NN.....', 'RRRRRRRRRRRRRR'],
  {K: '#1f2023', O: '#e3822b', B: '#2a6f9e', W: '#c9ccd0', N: '#34363a', R: '#d6457a'});
const SURFER = sprite([
  '....YYY.....', '...YYYYY....', '....SSS.....', '.....S......', '..SSRRRSS...', '.S..RRR..S..',
  '....RRR.....', '....NNN.....', '...NN.NN....', '..SS...SS...', 'WWWWWWWWWWWW', '.WWWWWWWWWW.'],
  {Y: '#e0b44a', S: '#c98b5a', R: '#b23a48', N: '#2a5d7c', W: '#fbfbfa'});
const RUNNER = [sprite([
  '..YYY...', '.YYYYY..', '..SSS...', '...S....', '.SGGGS..', 'S.GGG.S.', '..GGG...', '..NNN...', '.NN.NN..', 'NN...NN.', 'S.....S.'],
  {Y: '#e0b44a', S: '#c98b5a', G: '#5f7b44', N: '#2a5d7c'}), sprite([
  '..YYY...', '.YYYYY..', '..SSS...', '...S....', '..GGG...', '.SGGGS..', '..GGG...', '..NNN...', '...NN...', '..NNN...', '..S.S...'],
  {Y: '#e0b44a', S: '#c98b5a', G: '#5f7b44', N: '#2a5d7c'})];
const GIRAFFE = sprite([
  '..........HH.......', '.........HHHH......', '........HHHHHE.....', '.........HHH.......', '.........YPY.......',
  '........YYY........', '........YPY........', '.......YYY.........', '.......YPY.........', '......YYY..........',
  '......YPY..........', '.....YYYY..........', '..YYYYPYYYYY.......', '.YYPYYYYYPYYY......', '.YYYYYPYYYYYYT.....',
  '.YYPYYYYYPYYY.T....', '..YYYYYYYYYY.......', '..Y.Y....Y.Y.......', '..Y.Y....Y.Y.......', '..Y.Y....Y.Y.......',
  '..D.D....D.D.......'],
  {H: '#d9a441', E: '#1f2023', Y: '#e8b54f', P: '#9a5a26', T: '#6b4a2a', D: '#4a3524'});

const PAINT = {
  ski(p, x, y, w, h, t, at) {
    band(p, x, y, w, h * .6, ['#8cc3e8', '#a4d0ee', '#bddcf2', '#d6e9f6']);
    p.poly([[x, y + h * .5], [x + w * .12, y + h * .3], [x + w * .22, y + h * .4], [x + w * .38, y + h * .18], [x + w * .55, y + h * .42], [x + w * .7, y + h * .24], [x + w * .86, y + h * .38], [x + w, y + h * .3], [x + w, y + h * .6], [x, y + h * .6]], '#e9f1f7');
    p.poly([[x + w * .38, y + h * .18], [x + w * .46, y + h * .3], [x + w * .43, y + h * .42], [x + w * .5, y + h * .6], [x + w * .3, y + h * .6]], '#c7d6e2');
    const ground = [[0, .25], [.4, .57], [.44, .535], [.46, .6], [.56, .8], [.66, .63], [1, .86]].map(([u, v]) => [x + u * w, y + v * h]);
    p.poly([...ground, [x + w, y + h], [x, y + h]], '#f6fafc');
    for (let i = 0; i < ground.length - 1; i++) p.line(ground[i][0], ground[i][1], ground[i + 1][0], ground[i + 1][1], '#b9cfdd', 1);
    [[.08, .5], [.9, .7], [.95, .66], [.2, .78]].forEach(([u, v]) => tree(p, x + u * w, y + v * h, h * .1));
  },
  surf(p, x, y, w, h, t, at) {
    band(p, x, y, w, h * .5, ['#f2c28b', '#f4cd97', '#f6d8a6', '#f8e3b8']);
    p.disc(x + w * .2, y + h * .18, h * .07, '#fff3c4');
    p.r(x, y + h * .42, w, h * .1, '#3f8fb0');
    const crest = u => .36 + .08 * Math.cos((u - .45) * 4.5);
    const face = [[x, y + h * .75]]; for (let u = 0; u <= 1.001; u += .05) face.push([x + u * w, y + h * crest(u)]); face.push([x + w, y + h * .75]);
    p.poly(face, '#2f7e9c'); p.poly([[x, y + h * .75], [x + w, y + h * .75], [x + w, y + h * .62], [x, y + h * .66]], '#256a86');
    for (let u = 0; u <= 1; u += .012) p.r(x + u * w, y + h * crest(u) - 1, 3, 2, '#e8f6fa');
    band(p, x, y + h * .75, w, h * .25, ['#cfe8ef', '#e3f2f6']);
    for (let i = 0; i < 40; i++) p.r(x + ((i * 97 + t * 30) % w), y + h * (.77 + (i * 13 % 20) / 100), 2, 1, '#fbfbfa');
    if (Math.abs(t - 3.4) < .45) for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI, r = h * (.03 + .06 * ((t * 7 + i) % 1)); p.r(x + at.u * w + Math.cos(a) * r + h * .03, y + at.v * h - Math.sin(a) * r, 2, 2, '#fbfbfa'); }
  },
  flip(p, x, y, w, h, t, at) {
    band(p, x, y, w, h * .62, ['#f6cdb6', '#f3d7c4', '#e6e0d8', '#d8e6ee']);
    p.poly([[x, y + h * .62], [x, y + h * .2], [x + w * .1, y + h * .08], [x + w * .16, y + h * .28], [x + w * .26, y + h * .12], [x + w * .34, y + h * .3], [x + w * .48, y + h * .06], [x + w * .56, y + h * .32], [x + w * .7, y + h * .14], [x + w * .8, y + h * .34], [x + w * .9, y + h * .1], [x + w, y + h * .28], [x + w, y + h * .62]], '#bdb6ad');
    p.poly([[x + w * .48, y + h * .06], [x + w * .52, y + h * .2], [x + w * .5, y + h * .62], [x + w * .44, y + h * .62]], '#a39c93');
    for (let u = .4; u < 1; u += .05) tree(p, x + u * w, y + h * .62, h * .06);
    band(p, x, y + h * .62, w, h * .38, ['#5cc1c4', '#48aeb3', '#3a9aa1', '#2f878f']);
    for (let i = 0; i < 18; i++) p.r(x + w * ((i * .137 + t * .02) % 1), y + h * (.66 + (i % 6) * .05), w * .03, 1, '#8fd8da');
    p.poly([[x, y + h * .44], [x + w * .33, y + h * .44], [x + w * .36, y + h * .56], [x + w * .34, y + h], [x, y + h]], '#7d776f');
    p.r(x, y + h * .44, w * .33, 2, '#a39c93');
    if (at.splash != null) { const s = at.splash; for (let i = 0; i < 12; i++) { const a = -Math.PI * (i + .5) / 12, r = h * .1 * Math.min(1, s * 3); p.r(x + at.u * w + Math.cos(a) * r, y + h * .8 + Math.sin(a) * r * (1 - s), 2, 2, '#fbfbfa'); } p.ellipse(x + at.u * w, y + h * .82, w * .05 * (1 + s), h * .01, '#d7f1f2'); }
  },
  giraffe(p, x, y, w, h, t, at) {
    band(p, x, y, w, h * .55, ['#f1dfae', '#f3e4b5', '#f5e9bf', '#f7eec9']);
    p.disc(x + w * .78, y + h * .2, h * .06, '#fff6d6');
    band(p, x, y + h * .55, w, h * .45, ['#d9b66b', '#d2ad60', '#c9a356']);
    for (let i = 0; i < 50; i++) p.r(x + (i * 73 % 100) / 100 * w, y + h * (.58 + (i * 37 % 40) / 100), 2, 3, '#b8914a');
  },
  giraffeFront(p, x, y, w, h, scene) {
    for (const u of scene.trees) {
      const cx = x + u * w;
      p.r(cx - h * .012, y + h * .26, h * .024, h * .3, '#5a4230');
      p.line(cx, y + h * .36, cx - w * .04, y + h * .28, '#5a4230', 3); p.line(cx, y + h * .34, cx + w * .04, y + h * .27, '#5a4230', 3);
      p.ellipse(cx, y + h * .24, w * .075, h * .05, '#4f6128'); p.ellipse(cx, y + h * .215, w * .06, h * .03, '#617532');
    }
  },
  sunset(p, x, y, w, h, t, at) {
    band(p, x, y, w, h * .7, ['#3b3f6b', '#5b4a78', '#8c5277', '#c15f67', '#e07f5e', '#f0a262', '#f6c070']);
    p.disc(x + at.u * w, y + at.v * h, h * .075, '#ffd98a'); p.disc(x + at.u * w, y + at.v * h, h * .055, '#fff0b8');
    for (let i = 0; i < 26; i++) { const bx = x + w * i / 26, bh = h * (.015 + (i * 37 % 5) / 100); p.r(bx, y + h * .7 - bh, w / 26 + 1, bh, '#2d2a3e'); }
    band(p, x, y + h * .7, w, h * .3, ['#3d3654', '#352f4a', '#2d2840']);
    if (at.v < .72) for (let i = 0; i < 8; i++) p.r(x + at.u * w - h * .02 * (1 - i / 8), y + h * (.72 + i * .03), h * .04 * (1 - i / 8), 2, '#f6c070');
  },
  sunsetFront(p, x, y, w, h) {
    const deck = y + h * .64, ink = '#1b1a26';
    p.r(x, deck, w, h * .025, ink);
    [.3, .86].forEach(u => {
      const tx = x + u * w, tw = w * .06, top = y + h * .3;
      p.r(tx - tw / 2, top, tw, deck - top + h * .1, ink);
      p.r(tx - tw * .3, top + h * .06, tw * .22, h * .12, '#e07f5e'); p.r(tx + tw * .08, top + h * .06, tw * .22, h * .12, '#e07f5e');
    });
    for (let i = 0; i <= 40; i++) { const s = i / 40, u1 = .3 + .56 * s, v = .3 + .3 * 4 * s * (1 - s) * .9; p.r(x + u1 * w, y + h * v, 2, 2, ink); if (i % 4 === 0) p.r(x + u1 * w, y + h * v, 1, deck - (y + h * v), ink); }
    for (let i = 0; i <= 12; i++) { const s = i / 12, v = .3 + .34 * s * s; p.r(x + (.3 - .3 * s) * w, y + h * v, 2, 2, ink); }
  },
};
function tree(p, x, y, size) {
  p.poly([[x, y - size], [x + size * .45, y], [x - size * .45, y]], '#3f6b4a'); p.r(x - 1, y, 2, size * .2, '#5a4230');
}

export function start(root, {key, characters, onExit}) {
  const shell = createShell(root, {key, characters, boss: 'The Algorithm', meterLabel: 'ATTENTION', onExit, scene: 'far', reserve: [100, 150]});
  const {el, play} = shell, p = pen(play);
  play.setAttribute('aria-label', 'Camera. Arrow keys move the frame, Space takes the shot.');
  shell.$('.arcade-sprites').innerHTML = '<canvas class="shot-boss" width="64" height="64"></canvas>';
  const boss = shell.$('.shot-boss');
  let geo = null, index = 0, scene = M.SCENES[0], t = 0, frame = {u: .5, v: .5, w: .3, h: .8}, shots = [], taken = null, flash = 0;
  let running = false, run = 0, introSeen = false, hold = [0, 0], pose = '', hud = '', drag = null;
  const setPose = next => { if (next !== pose) { pose = next; drawBoss(boss, 'creator', next); } };
  setPose('idle');

  function layout() {
    const top = shell.$('.arcade-top'), W = el.offsetWidth, playTop = top.offsetTop + top.offsetHeight + 10, playBottom = shell.playBottom() - 6;
    const sw = Math.min(W - 24, 1100), sh = Math.max(200, playBottom - playTop), sx = Math.round((W - sw) / 2), sy = playTop;
    geo = {W, sx, sy, sw, sh};
    frame.h = .82; frame.w = Math.min(.9, frame.h * sh * 9 / 16 / sw);
    clampFrame();
    const size = W >= 900 ? 120 : 0; boss.hidden = !size;
    Object.assign(boss.style, {width: size + 'px', height: size + 'px', left: sx + sw - size - 10 + 'px', top: sy + sh - size - 8 + 'px'});
  }
  shell.floor = h => h;
  function clampFrame() { frame.u = Math.max(frame.w / 2, Math.min(1 - frame.w / 2, frame.u)); frame.v = Math.max(frame.h / 2, Math.min(1 - frame.h / 2, frame.v)); }

  function render(dt = 0) {
    if (!geo) return;
    p.clear(); flash = Math.max(0, flash - dt * 3);
    const C = 2, x = geo.sx / C, y = geo.sy / C, w = geo.sw / C, h = geo.sh / C;
    const time = taken ? taken.t : t, at = scene.path(time);
    p.c.save(); p.c.beginPath(); p.c.rect(x, y, w, h); p.c.clip();
    PAINT[scene.key](p, x, y, w, h, time, at);
    const sx = x + at.u * w, sy = y + at.v * h, size = h / 130;
    if (scene.key === 'ski') p.blit(SKIER, sx, sy, Math.max(1, Math.round(size * 1.2)), at.angle);
    if (scene.key === 'surf') p.blit(SURFER, sx, sy, Math.max(1, Math.round(size * 1.2)), at.angle, true);
    if (scene.key === 'flip' && at.splash == null) p.blit(RUNNER[at.run ? Math.floor(time * 8) % 2 : 0], sx, sy, Math.max(1, Math.round(size * 1.3)), at.angle);
    if (scene.key === 'giraffe') { const s = Math.max(1, Math.round(size * 1.35)); p.blit(GIRAFFE, sx - 3 * s, sy + 8 * s, s); PAINT.giraffeFront(p, x, y, w, h, scene); }
    if (scene.key === 'sunset') PAINT.sunsetFront(p, x, y, w, h);
    // Everything outside the portrait frame is dimmed.
    const fx = Math.round(x + frame.u * w - frame.w * w / 2), fy = Math.round(y + frame.v * h - frame.h * h / 2), fw = Math.round(frame.w * w), fh = Math.round(frame.h * h), dim = 'rgba(20,20,24,.5)';
    const X0 = Math.round(x), Y0 = Math.round(y), X1 = Math.round(x + w), Y1 = Math.round(y + h);
    p.r(X0, Y0, fx - X0, Y1 - Y0, dim); p.r(fx + fw, Y0, X1 - fx - fw, Y1 - Y0, dim); p.r(fx, Y0, fw, fy - Y0, dim); p.r(fx, fy + fh, fw, Y1 - fy - fh, dim);
    const arm = Math.min(fw, fh) * .12;
    [[fx, fy, 1, 1], [fx + fw, fy, -1, 1], [fx, fy + fh, 1, -1], [fx + fw, fy + fh, -1, -1]].forEach(([cx, cy, dx, dy]) => { p.r(dx > 0 ? cx : cx - arm, cy - (dy > 0 ? 0 : 2), arm, 2, PAPER); p.r(cx - (dx > 0 ? 0 : 2), dy > 0 ? cy : cy - arm, 2, arm, PAPER); });
    for (let i = 1; i < 3; i++) { p.r(fx + fw * i / 3, fy + 4, 1, fh - 8, 'rgba(255,255,255,.25)'); p.r(fx + 4, fy + fh * i / 3, fw - 8, 1, 'rgba(255,255,255,.25)'); }
    if (!taken && Math.floor(t * 2) % 2 === 0) p.disc(fx + 8, fy + 8, 2, '#e5484d');
    if (!taken) p.text('REC', fx + 13, fy + 6, PAPER, 1);
    p.r(x, y + h - 3, w * Math.max(0, 1 - t / scene.duration), 3, taken ? '#6b6e72' : '#e5484d');
    if (flash > 0) p.r(x, y, w, h, `rgba(255,255,255,${flash})`);
    p.c.restore();
    p.r(x - 1, y - 1, w + 2, 1, INK); p.r(x - 1, y + h, w + 2, 1, INK); p.r(x - 1, y, 1, h, INK); p.r(x + w, y, 1, h, INK);
  }

  function update(dt) {
    if (hold[0] || hold[1]) { frame.u += hold[0] * .7 * dt; frame.v += hold[1] * .7 * dt; clampFrame(); }
    t += dt;
    const left = Math.max(0, scene.duration - t), text = left.toFixed(1);
    if (text !== hud) { hud = text; shell.meter(left / scene.duration * 100, left.toFixed(1) + 's', left < 1.5 ? 'bad' : left < 3 ? 'warn' : 'ok'); }
    if (t >= scene.duration) { t = scene.duration; running = false; shots[index] = {score: 0, views: 0, missed: true}; shell.callout('MISSED IT', 'bad'); setPose('hit'); later(() => showShot(null), 700); }
  }
  const later = (fn, ms) => { const token = run; setTimeout(() => { if (token === run) fn(); }, ms); };

  function shoot() {
    if (!running || taken) return;
    running = false;
    const result = M.shoot(scene, t, frame);
    taken = {t, ...result}; shots[index] = result; flash = shell.reduced.matches ? 0 : .9;
    render();
    // Keep what was in the frame, as the post thumbnail.
    const C = 2, fw = frame.w * geo.sw / C, fh = frame.h * geo.sh / C, fx = (geo.sx + frame.u * geo.sw) / C - fw / 2, fy = (geo.sy + frame.v * geo.sh) / C - fh / 2;
    const thumb = document.createElement('canvas'); thumb.width = Math.round(fw); thumb.height = Math.round(fh);
    const flashNow = flash; flash = 0; render(); thumb.getContext('2d').drawImage(play, fx, fy, fw, fh, 0, 0, thumb.width, thumb.height); flash = flashNow;
    const [word, tone] = VERDICT(result.score); shell.callout(word, tone);
    setPose(result.score >= 70 ? 'attack' : result.score < 30 ? 'hit' : 'idle');
    paintScore();
    later(() => showShot(thumb.toDataURL()), 650);
  }
  function showShot(image) {
    const s = shots[index], last = index === M.SCENES.length - 1;
    const why = s.missed ? 'The moment came and went.' : !s.inFrame ? 'You got a lovely shot of the background.'
      : `${s.timing > .8 ? 'Great timing' : s.timing > .4 ? 'Timing a little off' : 'Missed the moment'}, ${s.framing > .75 ? 'well framed' : s.framing > .4 ? 'framing could be tighter' : 'mostly out of frame'}.`;
    shell.setBox(`<div class="shot-post">${image ? `<img class="shot-thumb" src="${image}" alt="Your shot of ${scene.name.toLowerCase()}">` : '<div class="shot-thumb shot-empty" aria-hidden="true">?</div>'}
      <div><span class="arcade-label">SHOT ${index + 1} OF 5 · ${scene.place.toUpperCase()}</span>
      <h2 class="arcade-title" tabindex="-1">${s.missed ? 'No shot.' : M.viewText(s.views) + ' views.'}</h2>
      <p class="arcade-text">${why}</p>
      <div class="arcade-actions"><button type="button" class="arcade-button arcade-primary arcade-big" data-next>${last ? 'See how you did' : 'Next shot'} <span aria-hidden="true">▶</span></button></div></div></div>`, 'is-break');
    shell.announce(`${s.missed ? 'No shot.' : M.viewText(s.views) + ' views.'} ${why}`);
    const button = shell.box.querySelector('[data-next]'); button.focus({preventScroll: true});
    button.addEventListener('click', () => last ? finish() : startShot(index + 1), {once: true});
  }
  const totalViews = () => shots.reduce((a, s) => a + (s?.views || 0), 0);
  const paintScore = () => shell.score('VIEWS', M.viewText(totalViews()));

  function startShot(i) {
    index = i; scene = M.SCENES[i]; t = 0; taken = null; flash = 0; hold = [0, 0]; frame.u = .5; frame.v = .5; clampFrame();
    setPose('idle'); shell.tag(`SHOT ${i + 1}/5`); shell.level(scene.name.toUpperCase());
    const box = shell.setBox(`<div class="knee-bar"><p class="knee-help"><strong>${scene.name}.</strong> <span class="only-mouse">Move the frame with the mouse or arrows, click or press Space to shoot.</span><span class="only-touch">Drag to move the frame, then tap Shoot.</span> One shot, at the best moment.</p>
      <button type="button" class="arcade-button arcade-primary arcade-big" data-shoot>● Shoot</button></div>`, 'is-play');
    box.querySelector('[data-shoot]').addEventListener('click', shoot);
    running = true; hud = ''; el.dataset.phase = 'play'; shell.focusPlay();
    shell.callout(scene.name.toUpperCase(), 'good');
    shell.announce(`Shot ${i + 1} of 5: ${scene.name}, ${scene.place}. Move the frame and press Space at the best moment.`);
  }
  function finish() {
    el.dataset.phase = 'result';
    const total = shots.reduce((a, s) => a + s.score, 0), stars = M.stars(total);
    setPose(stars === 3 ? 'defeated' : stars >= 2 ? 'attack' : 'hit');
    shell.result({
      title: TITLES[stars], stars,
      line: 'One of my real videos got 1.2 million views. I filmed and edited it myself.',
      rows: M.SCENES.map((s, i) => [s.name, shots[i].missed ? 'No shot' : `${M.viewText(shots[i].views)} views`]).concat([['Total', `${M.viewText(totalViews())} views`]]),
      source: `<p>These are pixel versions of things I’ve filmed or been to: skiing, the surf camp in Senegal, a lake in the Dolomites, the giraffe, and New York. The views are made up. A perfect shot is worth 1.2 million, the same as my best real video.</p>`,
    });
  }

  function pointerMove(e) {
    if (!running || !geo) return;
    const r = el.getBoundingClientRect(), u = (e.clientX - r.left - geo.sx) / geo.sw, v = (e.clientY - r.top - geo.sy) / geo.sh;
    if (e.pointerType === 'mouse' && !drag) { frame.u = u; frame.v = v; clampFrame(); return; }
    if (drag) { frame.u = drag.u + u - drag.x; frame.v = drag.v + v - drag.y; clampFrame(); }
  }
  play.addEventListener('pointermove', pointerMove);
  play.addEventListener('pointerdown', e => {
    if (!running || !geo) return;
    const r = el.getBoundingClientRect();
    if (e.pointerType === 'mouse') { shoot(); return; }
    drag = {x: (e.clientX - r.left - geo.sx) / geo.sw, y: (e.clientY - r.top - geo.sy) / geo.sh, u: frame.u, v: frame.v}; play.setPointerCapture(e.pointerId);
  });
  ['pointerup', 'pointercancel'].forEach(type => play.addEventListener(type, () => { drag = null; }));
  el.addEventListener('keydown', e => {
    if (!running || e.altKey || e.ctrlKey || e.metaKey) return;
    const dirs = {ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [1, -1], ArrowDown: [1, 1]};
    if (dirs[e.key]) { hold[dirs[e.key][0]] = dirs[e.key][1]; e.preventDefault(); }
    else if ((e.key === ' ' || e.key === 'Enter') && !e.target.closest('button,a')) { e.preventDefault(); shoot(); }
  });
  el.addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') hold[0] = 0; if (e.key === 'ArrowUp' || e.key === 'ArrowDown') hold[1] = 0; });

  async function begin() {
    const token = ++run; running = false; shots = []; index = 0; scene = M.SCENES[0]; t = 0; taken = null;
    el.dataset.phase = 'intro'; shell.meter(100, scene.duration.toFixed(1) + 's'); paintScore(); shell.tag('SHOT 1/5'); shell.level(scene.name.toUpperCase()); setPose('idle');
    if (!introSeen) {
      await shell.intro({
        label: 'CONTENT CREATOR VS THE ALGORITHM', title: 'Get the shot.',
        text: 'Five moments, one shot at each. Keep the subject in the portrait frame and shoot at the best moment. The Algorithm decides how many views you get.',
        controls: [['Mouse', 'Aim, click to shoot', 'mouse'], ['← → ↑ ↓', 'Move the frame', 'mouse'], ['Space', 'Shoot', 'mouse'], ['Drag', 'Move the frame', 'touch'], ['Shoot', 'Take the shot', 'touch']],
        button: 'Start filming',
      });
      if (token !== run) return;
      introSeen = true;
    }
    startShot(0);
  }
  const game = {get running() { return running; }, update, render, layout, restart() { begin(); }, destroy() { run++; running = false; }};
  shell.attach(game);
  begin();
  return shell;
}
