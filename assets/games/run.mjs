// Run club: Athlete Jackson versus Mile 23.
import {createShell} from './shell.mjs?v=2';
import {pen, sprite, INK, PAPER} from './pixels.mjs?v=2';
import {drawBoss} from '../battle-art.mjs?v=5';
import * as M from './run-model.mjs?v=1';

const TITLES = ['Running solo.', 'A small club.', 'A proper run club.', '25 a week.'];
const SHIRTS = ['#b23a48', '#e3b341', '#3e7654', '#6f5aa8', '#e07f5e', '#2a6f9e', '#8a8f94', '#d6457a'];
const HAIR = ['#e0b44a', '#3a2a1f', '#7a4a2a', '#1f2023', '#c98b5a'];
const PROOF = {image: 'cards/runclub-street-800.webp', alt: 'Run club running down a pastel terraced street at dusk', title: 'Falmouth Running Society', text: 'I started the society in January 2024, set the routes, ran the socials and led the sessions myself. By June it was 25 runners a week.', href: 'experience.html#p-runclub'};
const runnerFrames = (shirt, hair, shorts = '#2a3a5c') => {
  const pal = {Y: hair, S: '#e2ad84', T: shirt, L: shorts, K: '#1f2023'};
  return [
    sprite(['...YYY....', '..YYYYY...', '...SSSS...', '....SS....', '..TTTTT...', '.STTTTTS..', '..TTTTT...', '..LLLLL...', '..SS..SS..', '.SS....SS.', 'KK......KK'], pal),
    sprite(['...YYY....', '..YYYYY...', '...SSSS...', '....SS....', '..TTTTT...', '..TTTTTS..', '..STTTT...', '..LLLLL...', '...SSS....', '...SS.S...', '...KK.KK..'], pal),
  ];
};
const WAVER = (shirt, hair) => [0, 1].map(f => sprite(['...YYY....', f ? 'S.YYYYY...' : '..YYYYY.S.', f ? 'S..SSSS...' : '...SSSS.S.', f ? '.S..SS....' : '....SS.S..', '..TTTTT...', '..TTTTT...', '..TTTTT...', '..LLLLL...', '..SS.SS...', '..SS.SS...', '..KK.KK...'], {Y: hair, S: '#e2ad84', T: shirt, L: '#2a3a5c', K: '#1f2023'}));
const JACKSON = runnerFrames('#1f3a68', '#e0b44a', '#7fb2e0');
const CONE = sprite(['..O..', '..O..', '.OWO.', '.OOO.', 'OWWWO', 'OOOOO', 'KKKKK'], {O: '#e3822b', W: '#fbfbfa', K: '#3a3f45'});
const BIN = sprite(['GGGGGGG', 'GDDDDDG', '.GGGGG.', '.GGGGG.', '.GDGDG.', '.GGGGG.', '.GGGGG.', '.K...K.'], {G: '#3e7654', D: '#2f5d43', K: '#1f2023'});
const DOG = sprite(['.......BB.', 'B......BKB', '.BBBBBBBB.', '.BBBBBBB..', '.B.B..B.B.'], {B: '#8a5a32', K: '#1f2023'});

export function start(root, {key, characters, onExit}) {
  const shell = createShell(root, {key, characters, boss: 'Mile 23', meterLabel: 'CLUB', onExit, scene: 'far', reserve: [100, 124]});
  const {el, play} = shell, p = pen(play);
  play.setAttribute('aria-label', 'Race. Space, up arrow or a tap jumps. Hold for a higher jump.');
  shell.$('.arcade-sprites').innerHTML = '<canvas class="run-wall" width="64" height="64"></canvas>';
  const wall = shell.$('.run-wall');
  let geo = null, s = M.createRun(), running = false, run = 0, introSeen = false, pose = '', hud = '', trail = [], looks = [], warned = false;
  const setPose = next => { if (next !== pose) { pose = next; drawBoss(wall, 'rider', next); } };
  setPose('idle');
  const look = i => looks[i] || (looks[i] = runnerFrames(SHIRTS[(i * 3 + 1) % SHIRTS.length], HAIR[(i * 7 + 2) % HAIR.length]));
  const waiters = new Map();
  const waver = it => waiters.get(it) || (waiters.set(it, WAVER(SHIRTS[Math.floor(it.x) % SHIRTS.length], HAIR[Math.floor(it.x * 3) % HAIR.length])), waiters.get(it));

  function layout() {
    const top = shell.$('.arcade-top'), W = el.offsetWidth, playTop = top.offsetTop + top.offsetHeight, playBottom = shell.playBottom();
    const H = playBottom - playTop, ppm = Math.max(22, Math.min(40, W / 24, H / 9));
    geo = {W, H: el.offsetHeight, ppm, ground: playBottom - Math.max(40, H * .16), jx: W * (W < 700 ? .55 : .42), playTop};
    const size = ppm * 3.4; wall.style.width = wall.style.height = size + 'px'; geo.wall = size;
  }
  shell.floor = (h, unit) => geo ? Math.round((geo.ground - geo.ppm * 2.2) / unit) : Math.round(h * .6);
  const toX = x => geo.jx + (x - s.x) * geo.ppm;

  function render() {
    if (!geo) return;
    p.clear();
    const C = 2, g = geo, W = g.W / C, ground = g.ground / C, scale = Math.max(2, Math.round(g.ppm / 14)), ppm = g.ppm / C;
    // Crowd behind the barriers, moving at half speed for a bit of depth.
    const crowdY = ground - ppm * 2.3;
    for (let i = -2; i < W / 6 + 2; i++) {
      const wx = i * 6 - ((s.x * ppm * .5) % 6);
      const k = Math.floor(i + s.x * ppm * .5 / 6);
      p.r(wx, crowdY - 8 - (k * 7 % 3), 5, 10, SHIRTS[((k % 8) + 8) % 8]); p.r(wx + 1, crowdY - 12 - (k * 7 % 3), 3, 3, '#e2ad84');
    }
    p.r(0, crowdY + 2, W, 3, PAPER); p.r(0, crowdY + 5, W, 1, '#9aa3ab');
    for (let x = -((s.x * ppm * .5) % 20); x < W; x += 20) p.r(x, crowdY + 2, 1, ppm * .9, '#9aa3ab');
    // Pavement, kerb, road and the blue line.
    p.r(0, crowdY + ppm * .9, W, ground - crowdY - ppm * .9, '#c9c3b8');
    for (let x = -((s.x * ppm) % 12); x < W; x += 12) p.r(x, crowdY + ppm * .9, 1, ground - crowdY - ppm * .9, '#b8b1a5');
    p.r(0, ground, W, 2, '#8f877a'); p.r(0, ground + 2, W, g.H / C - ground, '#6b6e72');
    p.r(0, ground + ppm * .5, W, 2, '#2f6fd0');
    for (let x = -((s.x * ppm) % 18); x < W; x += 18) p.r(x, ground + ppm * 1.3, 8, 1, '#8a8d91');
    // Mile markers.
    for (let m = Math.floor(M.mile(s)) - 1; m <= Math.floor(M.mile(s)) + 2; m++) {
      if (m < 1 || m > 26) continue; const x = toX(m * M.METRES_PER_MILE) / C; if (x < -30 || x > W + 30) continue;
      p.r(x, ground - ppm * 2.6, 1, ppm * 2.6, INK); p.tag('MILE ' + m, x, ground - ppm * 2.6 - 6, PAPER, '#2f6fd0');
    }
    // Things in the road and runners waiting to join.
    for (const it of s.map.items) {
      if (it.gone) continue; const x = toX(it.x) / C; if (x < -30 || x > W + 30) continue;
      if (it.kind === 'runner' || it.kind === 'group') {
        const n = it.count || 1, f = Math.floor(s.t * 3 + it.x) % 2, base = it.high ? ground - ppm * 1.4 : ground;
        if (it.high) { p.r(x - ppm * .8, base, ppm * 1.6, ppm * 1.4, '#8c5a3c'); for (let yy = base + 3; yy < ground; yy += 3) p.r(x - ppm * .8, yy, ppm * 1.6, 1, '#6b4a2a'); }
        for (let k = 0; k < n; k++) p.blit(waver({x: it.x + k})[f], x + k * 6 * scale, base - 6 * scale, scale);
      }
      if (it.kind === 'cone') p.blit(CONE, x, ground - 3 * scale, scale);
      if (it.kind === 'bin') p.blit(BIN, x, ground - 4 * scale, scale);
      if (it.kind === 'dog') p.blit(DOG, x, ground - 2.5 * scale, scale, 0, true);
      if (it.kind === 'puddle') p.ellipse(x, ground + 1, ppm * .6, 2, '#5c8fb0');
    }
    // The finish, and the sign my mates held up at the real one.
    const fx = toX(M.LENGTH) / C;
    if (fx < W + 60) {
      p.r(fx, ground - ppm * 4, 2, ppm * 4, INK); p.r(fx + ppm * 3, ground - ppm * 4, 2, ppm * 4, INK); p.r(fx, ground - ppm * 4, ppm * 3 + 2, ppm * .8, '#b23a48'); p.text('FINISH', fx + 3, ground - ppm * 4 + 2, PAPER, 1);
      p.tag('GO TIGGY', fx - ppm * 2, crowdY - 20, INK, '#e3b341', 1);
    }
    // The club follows, each runner a little behind and copying your jumps.
    const frame = Math.floor(s.t * 8) % 2;
    for (let i = Math.min(s.club, 60) - 1; i >= 0; i--) {
      const back = (i + 1) * .95, h = heightAt(s.x - back), x = toX(s.x - back) / C;
      if (x < -20) continue;
      p.blit(look(i)[(frame + i) % 2], x, ground - 5.5 * scale - h * ppm, scale);
    }
    const jy = ground - 5.5 * scale - s.y * ppm, jxx = g.jx / C;
    p.ellipse(jxx, ground + 1, 4 * scale, 1, 'rgba(0,0,0,.2)');
    p.blit(JACKSON[s.y > 0 ? 0 : frame], jxx, jy, scale, s.stumble > 0 ? .5 : 0);
    // Mile 23 itself, blocking the road until the club gets through.
    const wx = toX(s.map.wall);
    wall.hidden = wx > g.W + g.wall || wx < -g.wall;
    wall.style.transform = `translate(${Math.round(wx - g.wall * .35)}px,${Math.round(g.ground - g.wall * .98)}px)`;
  }
  const heightAt = x => { for (let i = trail.length - 1; i >= 0; i--) if (trail[i].x <= x) return trail[i].y; return 0; };

  function update(dt) {
    const events = M.step(s, dt);
    trail.push({x: s.x, y: s.y}); if (trail.length > 3000) trail.splice(0, 1000);
    for (const e of events) {
      if (e.type === 'join') { shell.burst(geo.jx, geo.ground - geo.ppm * 2, [PAPER, '#e3b341', '#2f6fd0'], 8); if (e.club === M.NEED) shell.callout('ENOUGH FOR THE WALL', 'good'); else if (e.club === M.GOAL) shell.callout('25 A WEEK', 'win'); }
      if (e.type === 'hit') { shell.shake(); shell.callout(e.lost ? `${e.kind.toUpperCase()}! −${e.lost}` : e.kind.toUpperCase() + '!', 'bad'); }
      if (e.type === 'wall') {
        if (e.through) { setPose('defeated'); shell.shake(true); shell.callout('THROUGH THE WALL', 'win'); shell.burst(toX(s.map.wall), geo.ground - geo.ppm * 2, ['#b23a48', '#d98a7a', PAPER], 30); }
        else { setPose('attack'); shell.shake(true); shell.callout('HIT THE WALL', 'bad'); }
      }
      if (e.type === 'finish') finish();
    }
    if (!warned && M.mile(s) > 19 && s.club < M.NEED) { warned = true; shell.callout(`NEED ${M.NEED} FOR THE WALL`, 'bad'); }
    if (s.wall === 'stuck' && s.x > s.map.wall + 8 && pose === 'attack') setPose('defeated');
    const text = `${s.club}|${M.mile(s).toFixed(1)}`;
    if (text !== hud) {
      hud = text;
      shell.meter(s.club / M.GOAL * 100, `${s.club}/${M.GOAL}`, s.club >= M.GOAL ? 'ok' : s.club >= M.NEED ? 'warn' : 'bad');
      shell.tag(`MILE ${M.mile(s).toFixed(1)} / 26.2`);
      shell.score('RUNNERS', String(s.club));
    }
  }
  function finish() {
    running = false; el.dataset.phase = 'result';
    const stars = M.stars(s);
    shell.callout('FINISHED', 'win');
    const token = run;
    setTimeout(() => {
      if (token !== run) return;
      shell.result({
        title: TITLES[stars], stars, proof: PROOF,
        line: 'I started Falmouth Running Society in January 2024. By June it was 25 runners a week.',
        rows: [['Runners at the finish', String(s.club)], ['Most at once', String(s.best)], ['Mile 23', s.wall === 'through' ? 'Straight through' : 'Hit it'], ['Obstacles hit', String(s.hits)]],
        source: '<p>The race is made up. The run club is real, and so is the London Marathon: I ran it in 2026 for Marie Curie and raised £1,647, with a crowd of mates holding a GO TIGGY sign at the finish.</p>',
      });
    }, 1200);
  }
  function jump() { if (running) M.jump(s); }
  function release() { M.release(s); }
  function playBox() {
    const box = shell.setBox(`<div class="knee-bar"><p class="knee-help"><strong>Get 25 runners to the finish.</strong> <span class="only-mouse">Space, ↑ or click to jump. Hold for a higher jump.</span><span class="only-touch">Tap to jump, hold for higher.</span> Runners on walls need a jump.</p>
      <button type="button" class="arcade-button arcade-primary arcade-big run-jump" data-jump>Jump <span aria-hidden="true">▲</span></button></div>`, 'is-play');
    const b = box.querySelector('[data-jump]');
    b.addEventListener('pointerdown', e => { e.preventDefault(); jump(); b.setPointerCapture(e.pointerId); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => b.addEventListener(t, release));
    b.addEventListener('click', e => { if (e.detail === 0) jump(); });
  }
  play.addEventListener('pointerdown', e => { if (!running) return; e.preventDefault(); jump(); play.setPointerCapture(e.pointerId); });
  ['pointerup', 'pointercancel'].forEach(t => play.addEventListener(t, release));
  el.addEventListener('keydown', e => {
    if (!running || e.repeat || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { if (e.target.closest('button,a') && e.key === ' ') return; e.preventDefault(); jump(); }
  });
  el.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') release(); });

  async function begin() {
    const token = ++run; running = false; s = M.createRun(1 + Math.floor(Math.random() * 1e6)); trail = []; warned = false; hud = ''; waiters.clear();
    el.dataset.phase = 'intro'; setPose('idle'); shell.level('LV 26.2'); shell.meter(0, `0/${M.GOAL}`, 'bad'); shell.tag('MILE 0.0 / 26.2'); shell.score('RUNNERS', '0');
    if (!introSeen) {
      await shell.intro({
        label: 'ATHLETE VS MILE 23', title: 'Run club.',
        text: 'A marathon, sped up. Runners waiting along the route join your club as you pass. Jump anything in the road, or three of them drop out. At mile 23 there’s a wall, and you’ll need at least 12 of them to get through it.',
        controls: [['Space, ↑', 'Jump', 'mouse'], ['Hold', 'Jump higher'], ['Tap', 'Jump', 'touch']],
        button: 'Start running',
      });
      if (token !== run) return;
      introSeen = true;
    }
    playBox(); shell.layout(); running = true; el.dataset.phase = 'play'; shell.focusPlay(); shell.callout('GO', 'good');
    shell.announce('Go. Press Space or the up arrow to jump.');
  }
  const game = {get running() { return running; }, update, render, layout, restart() { begin(); }, destroy() { run++; running = false; }};
  shell.attach(game);
  begin();
  return shell;
}
