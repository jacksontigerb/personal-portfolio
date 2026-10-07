// Term Time: Master of One Jackson versus The Word Count.
import {createShell} from './shell.mjs?v=4';
import {pen, sprite, INK, PAPER} from './pixels.mjs?v=3';
import {drawBoss} from './bosses.mjs?v=3';
import * as M from './term-model.mjs?v=3';

const TITLES = ['Burnt out.', 'Survived the term.', 'On top of it.', 'Everything in on time.'];
const ROOM_INFO = {desk: {label: 'DESK', wall: '#e7dcc8'}, lab: {label: 'LAB', wall: '#d6e4e1'}, work: {label: 'WORK', wall: '#e2dcef'}, meeting: {label: 'MEETING', wall: '#f0dcd2'}};
const E = {K: '#1f2023', W: '#fbfbfa'};
const CRITTERS = {
  write: sprite(['.WWWWWWW.', '.WKKKKKW.', '.WWWWWWW.', '.WKWWWKW.', '.WWWWWWW.', '.WKKKKWW.', '.WWWWWWW.', '.WKKKKKW.', '.WWWWWWW.', '..K...K..', '.KK...KK.'], {...E, W: '#fbfbfa'}),
  lab: sprite(['...KKK...', '...WWW...', '...WWW...', '..WWWWW..', '..WKWKW..', '.WWWWWWW.', '.GGGGGGG.', 'GGGGGGGGG', 'GGGGGGGGG', '..K...K..', '.KK...KK.'], {...E, W: '#dff0ea', G: '#5fa383'}),
  shift: sprite(['....R....', '...R.R...', '..R...R..', '.YYYYYYY.', '.YBBYWWY.', '.YBBYYYY.', '.YWKWKWY.', '.YYYYYYY.', '.YWWWWWY.', '..K...K..', '.KK...KK.'], {...E, R: '#b23a48', Y: '#e3b341', B: '#6a859d'}),
  meeting: sprite(['.PPPPP...', 'PPPPPPP..', 'PKPPPKP..', 'PPPPPPPTT', '.PPPPPTTT', '..P..TTTT', '.....TTTT', '......T..', '.........', '..K...K..', '.KK...KK.'], {...E, P: '#e58fa0', T: '#8fb8d8'}),
  labwrite: sprite(['...KKK...', '...WWW...', '...WWW.WW', '..WWWWWWW', '..WKWKWKW', '.WWWWWWWW', '.GGGGGG..', 'GGGGGGGG.', 'GGGGGGGG.', '..K...K..', '.KK...KK.'], {...E, W: '#dff0ea', G: '#5fa383'}),
  writeup: sprite(['.BBBBBBB.', '.BWWWWWB.', '.BKWWWKB.', '.BWWWWWB.', '.BBBBBBB.', '.WWWWWWW.', '.BBBBBBB.', '.WWWWWWW.', '.BBBBBBB.', '..K...K..', '.KK...KK.'], {...E, B: '#6a859d'}),
  handin: sprite(['.RRRRRRR.', '.RYYYYYR.', '.RYRRRYR.', '.RRRRRRR.', '.RKRRRKR.', '.RRRRRRR.', '.RRKKKRR.', '.RRRRRRR.', '.RRRRRRR.', '..K...K..', '.KK...KK.'], {...E, R: '#8c2f3a', Y: '#e3b341'}),
};

function room(p, key, x, y, w, h, busy, coffee) {
  const info = ROOM_INFO[key];
  p.r(x, y, w, h, INK); p.r(x + 1, y + 1, w - 2, h - 2, info.wall); p.r(x + 1, y + h * .72, w - 2, h * .28 - 1, '#b9ad98');
  const fx = x + w / 2, fy = y + h * .72;
  if (key === 'desk') { p.r(fx - w * .32, fy - 3, w * .64, 3, '#8c5a3c'); p.r(fx - w * .28, fy, 2, h * .18, '#6b4a2a'); p.r(fx + w * .28 - 2, fy, 2, h * .18, '#6b4a2a'); p.r(fx - 8, fy - 11, 14, 8, '#3a3f45'); p.r(fx - 7, fy - 10, 12, 6, '#8fb8d8'); p.r(fx + w * .2, fy - 16, 2, 13, '#3a3f45'); p.r(fx + w * .2 - 3, fy - 17, 7, 3, '#e3b341'); }
  if (key === 'lab') { p.r(x + w * .12, y + h * .15, w * .76, h * .4, '#a8c4bf'); p.r(x + w * .14, y + h * .17, w * .72, h * .36, '#e9f2f0'); p.r(fx - w * .38, fy - 3, w * .76, 3, '#3a3f45'); [-.2, 0, .2].forEach((o, i) => { p.r(fx + o * w - 2, fy - 9, 4, 6, ['#5fa383', '#e3b341', '#b23a48'][i]); p.r(fx + o * w - 1, fy - 12, 2, 3, '#dff0ea'); }); }
  if (key === 'work') { p.r(fx - w * .3, fy - 3, w * .6, 3, '#6a5a8a'); p.r(fx - 9, fy - 12, 16, 9, '#3a3f45'); p.r(fx - 8, fy - 11, 14, 7, '#c9e3c7'); p.r(fx + 9, fy - 15, 7, 1, INK); p.r(fx + 9, fy - 15, 1, 5, INK); p.r(fx + 15, fy - 15, 1, 5, INK); p.r(x + w * .1, y + h * .12, 16, 10, PAPER); p.text('9', x + w * .1 + 2, y + h * .12 + 2, INK, 1); p.text('5', x + w * .1 + 10, y + h * .12 + 2, INK, 1); }
  if (key === 'meeting') { p.r(x + w * .2, y + h * .12, w * .6, h * .32, PAPER); p.r(x + w * .2, y + h * .12, w * .6, 1, INK); p.line(x + w * .26, y + h * .38, x + w * .44, y + h * .24, '#2a6f9e', 1); p.line(x + w * .44, y + h * .24, x + w * .7, y + h * .32, '#b23a48', 1); p.r(fx - w * .3, fy - 4, w * .6, 4, '#8c5a3c'); [-.25, 0, .25].forEach(o => p.r(fx + o * w - 3, fy - 10, 6, 6, '#6a859d')); }
  if (coffee) for (let i = 0; i < 3; i++) p.r(x + 5 + i * 4, y + 5 + (i % 2) * 2, 2, 4, 'rgba(255,255,255,.8)');
  p.tag(info.label + ' ' + (M.ROOMS.indexOf(key) + 1), x + w / 2, y + 5, PAPER, INK, 1);
}

export function start(root, {key, characters, onExit}) {
  const shell = createShell(root, {key, characters, boss: 'The Word Count', meterLabel: 'TERM', onExit, scene: 'far', reserve: [100, 164]});
  const {el, play} = shell, p = pen(play);
  play.setAttribute('aria-label', 'Term. Left and right arrows pick a task, then 1 desk, 2 lab, 3 work or 4 meeting. C for coffee.');
  shell.$('.arcade-sprites').innerHTML = '<canvas class="term-boss" width="64" height="64"></canvas>';
  const boss = shell.$('.term-boss');
  let geo = null, s = M.createTerm(), running = false, run = 0, introSeen = false, pose = '', poseUntil = 0, hud = '', coffeeText = '';
  let pos = new Map(), selected = null, drag = null, flashes = [], leaving = [];
  const setPose = next => { if (next !== pose) { pose = next; drawBoss(boss, 'master', next); } };
  setPose('idle');

  function layout() {
    const top = shell.$('.arcade-top'), W = el.offsetWidth, playTop = top.offsetTop + top.offsetHeight + 10, playBottom = shell.playBottom() - 8, H = playBottom - playTop;
    const wide = Math.min(W - 24, 1080), x0 = Math.round((W - wide) / 2);
    const slot = Math.min(128, wide / M.QUEUE), qh = Math.min(200, H * .36), rh = Math.min(320, H - qh - 18);
    geo = {W, x0, wide, playTop, slot, qy: playTop, qh, ry: playBottom - rh, rh, rw: wide / 4, scale: Math.max(2, Math.round(Math.min(slot, qh) / 36))};
    const size = W >= 900 ? 110 : 0; boss.hidden = !size;
    Object.assign(boss.style, {width: size + 'px', height: size + 'px', left: x0 + wide - size + 'px', top: playTop - 6 + 'px'});
  }
  shell.floor = h => Math.round(h * .9);
  const slotX = i => geo.x0 + geo.slot * (i + .5);
  const roomAt = (x, y) => { if (y < geo.ry || y > geo.ry + geo.rh) return null; const i = Math.floor((x - geo.x0) / geo.rw); return M.ROOMS[i] || null; };
  function taskAt(x, y) {
    if (y < geo.qy || y > geo.qy + geo.qh) return null;
    for (const t of s.queue) { const px = pos.get(t.id) ?? slotX(0); if (Math.abs(px - x) < geo.slot / 2) return t; }
    return null;
  }

  function render(dt = 0) {
    if (!geo) return;
    p.clear();
    const C = 2, g = geo, sc = g.scale;
    // The corridor.
    p.r(g.x0 / C, g.qy / C, g.wide / C, g.qh / C, INK); p.r(g.x0 / C + 1, g.qy / C + 1, g.wide / C - 2, g.qh / C - 2, '#efe9dc');
    p.r(g.x0 / C + 1, (g.qy + g.qh * .78) / C, g.wide / C - 2, g.qh * .22 / C - 1, '#c9bda6');
    for (let i = 0; i < M.QUEUE; i++) p.r((g.x0 + g.slot * (i + .5)) / C - 6, (g.qy + g.qh * .8) / C, 12, 1, '#b3a78f');
    p.text('CORRIDOR', (g.x0 + g.wide) / C - 36, (g.qy + g.qh) / C - 8, '#8a7f6a', 1);
    // Rooms, with whatever they're working on.
    M.ROOMS.forEach((key, i) => {
      const x = (g.x0 + g.rw * i) / C, y = g.ry / C, w = g.rw / C, h = g.rh / C, job = s.rooms[key];
      room(p, key, x, y, w, h, !!job, s.coffee > 0);
      const holding = drag || selected ? s.queue.find(q => q.id === (drag?.id ?? selected)) : null;
      if (holding) { const ok = M.need(holding) === key && !job; p.r(x + 1, y + 1, w - 2, 2, ok ? '#3e7654' : 'rgba(0,0,0,.15)'); p.r(x + 1, y + h - 3, w - 2, 2, ok ? '#3e7654' : 'rgba(0,0,0,.15)'); if (!ok) p.r(x + 1, y + 1, w - 2, h - 2, 'rgba(40,40,40,.18)'); }
      if (job) {
        const info = M.TYPES[job.task.type], done = 1 - job.left / info.time;
        p.blit(CRITTERS[job.task.type], x + w / 2, y + h * .5, sc);
        p.r(x + 6, y + h * .62, w - 12, 4, INK); p.r(x + 7, y + h * .62 + 1, (w - 14) * done, 2, '#e3b341');
      }
    });
    // Tasks waiting, walking in from the corridor door to their place in the queue.
    p.c.save(); p.c.beginPath(); p.c.rect(g.x0 / C + 1, g.qy / C + 1, g.wide / C - 2, g.qh / C - 2); if (!drag) p.c.clip();
    s.queue.forEach((t, i) => {
      const target = slotX(i), now = pos.get(t.id) ?? g.x0 - 20; const x = drag?.id === t.id ? drag.x : now + (target - now) * Math.min(1, dt * 8);
      if (drag?.id !== t.id) pos.set(t.id, x);
      const y = drag?.id === t.id ? drag.y : g.qy + g.qh * .78 - 5.5 * sc * C, frac = t.patience / t.max, shake = frac < .3 ? Math.sin(s.t * 40) * 1.5 : 0;
      if (selected === t.id) p.r((x - g.slot * .42) / C, (g.qy + 6) / C, g.slot * .84 / C, (g.qh - 12) / C, 'rgba(62,118,84,.18)');
      p.blit(CRITTERS[t.type], x / C + shake, y / C, sc);
      const bw = Math.min(g.slot * .7, 60) / C, bx = x / C - bw / 2, by = (g.qy + g.qh * .86) / C;
      p.r(bx, by, bw, 3, INK); p.r(bx + 1, by + 1, (bw - 2) * Math.max(0, frac), 1, frac < .3 ? '#ad343c' : frac < .6 ? '#a97926' : '#3e7654');
      const steps = M.TYPES[t.type].steps; if (steps.length > 1) steps.forEach((st, k) => p.r(x / C - 4 + k * 5, by + 5, 3, 3, k < t.step ? '#3e7654' : k === t.step ? '#e3b341' : '#b3a78f'));
      if (drag?.id !== t.id && g.slot > 70) p.text(M.need(t).toUpperCase(), x / C - M.need(t).length * 2, (g.qy + 8) / C, '#8a7f6a', 1);
    });
    p.c.restore();
    for (const f of leaving) { f.x -= 300 * dt; f.life -= dt; p.blit(CRITTERS[f.type], f.x / C, f.y / C, sc, -.3); p.tag('!', f.x / C, f.y / C - 12, PAPER, '#ad343c'); }
    leaving = leaving.filter(f => f.life > 0);
    for (const f of flashes) { f.life -= dt; f.y -= 30 * dt; p.tag(f.text, f.x / C, f.y / C, PAPER, f.col, 1); }
    flashes = flashes.filter(f => f.life > 0);
  }

  function send(task, roomKey) {
    const r = M.assign(s, task.id, roomKey);
    if (r.ok) { selected = null; shell.burst(geo.x0 + geo.rw * (M.ROOMS.indexOf(roomKey) + .5), geo.ry + geo.rh * .4, ['#e3b341', PAPER], 8); return true; }
    const x = geo.x0 + geo.rw * (M.ROOMS.indexOf(roomKey) + .5);
    flashes.push({text: r.reason === 'busy' ? 'BUSY' : 'WRONG ROOM', x, y: geo.ry + 20, life: .8, col: '#ad343c'});
    shell.announce(r.reason === 'busy' ? `The ${roomKey} is busy.` : `That’s not a ${roomKey} job. It needs the ${M.need(task)}.`);
    return false;
  }
  function update(dt) {
    const events = M.step(s, dt);
    for (const e of events) {
      if (e.type === 'done') { const x = geo.x0 + geo.rw * (M.ROOMS.indexOf(e.room) + .5); flashes.push({text: '+' + e.points, x, y: geo.ry + geo.rh * .3, life: .9, col: '#3e7654'}); if (e.task.type === 'handin') { shell.callout('HANDED IN', 'win'); setPose('defeated'); } }
      if (e.type === 'leave' || e.type === 'full') { shell.shake(); shell.callout(e.type === 'full' ? 'NO ROOM' : 'MISSED', 'bad'); leaving.push({type: e.task.type, x: pos.get(e.task.id) ?? geo.x0, y: geo.qy + geo.qh * .5, life: .9}); if (selected === e.task.id) selected = null; if (drag?.id === e.task.id) drag = null; }
      if (e.type === 'dump') { shell.callout('WRITE UP', 'bad'); setPose('attack'); poseUntil = s.t + 1.2; }
      if (e.type === 'week') { shell.callout(`WEEK ${e.week}`, ''); shell.announce(`Week ${e.week} of ${M.WEEKS}.`); if (e.week === M.WEEKS) shell.callout('HAND IN WEEK', 'bad'); }
      if (e.type === 'over') finish();
    }
    if (pose === 'attack' && s.t > poseUntil) setPose('idle');
    const text = `${s.week}|${s.strikes}|${s.score}`;
    if (text !== hud) {
      hud = text;
      shell.meter(Math.min(100, s.t / (M.WEEKS * M.WEEK) * 100), `WEEK ${s.week}`, s.week >= 9 ? 'warn' : 'ok');
      shell.level(`WEEK ${s.week}/${M.WEEKS}`); shell.tag(`MISSED ${s.strikes}/${M.STRIKES}`); shell.score('POINTS', String(s.score));
    }
    const coffee = shell.box.querySelector('[data-coffee]'), ct = s.coffee > 0 ? 'Coffee kicking in' : s.coffeeReady > 0 ? `Coffee in ${Math.ceil(s.coffeeReady)}s` : 'Coffee ready';
    if (coffee && ct !== coffeeText) { coffeeText = ct; coffee.textContent = ct; coffee.disabled = s.coffeeReady > 0 || s.coffee > 0; }
  }
  function drink() { if (running && M.coffee(s)) { shell.callout('COFFEE', 'good'); shell.announce('Coffee. Everything runs twice as fast for five seconds.'); } }

  function finish() {
    running = false; drag = null; selected = null; el.dataset.phase = 'result';
    const stars = M.stars(s);
    if (s.reason === 'burnt out') { shell.callout('BURNT OUT', 'big'); setPose('attack'); }
    const token = run;
    setTimeout(() => {
      if (token !== run) return;
      shell.result({
        title: s.reason === 'burnt out' && stars < 2 ? TITLES[0] : TITLES[Math.max(1, stars)], stars,
        line: 'My MSc year at UCL was mostly synthesis in the lab and a lot of hours on SEM, TEM, FTIR, XRD and XPS, with the writing around it.',
      });
    }, 1100);
  }

  function playBox() {
    const box = shell.setBox(`<div class="knee-bar"><p class="knee-help"><strong>Sort every task into its room.</strong> <span class="only-mouse">Drag a task onto a room, or pick one with ← → and press 1 to 4.</span><span class="only-touch">Drag a task onto its room, or tap the task then the room.</span> Each room does one at a time.</p>
      <button type="button" class="arcade-button arcade-big term-coffee" data-coffee disabled>Coffee</button></div>`, 'is-play');
    box.querySelector('[data-coffee]').addEventListener('click', drink); coffeeText = '';
  }
  const local = e => { const r = el.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; };
  play.addEventListener('pointerdown', e => {
    if (!running || !geo) return;
    const at = local(e), task = taskAt(at.x, at.y);
    if (task) { drag = {id: task.id, x: at.x, y: at.y, sx: at.x, sy: at.y}; play.setPointerCapture(e.pointerId); return; }
    const roomKey = roomAt(at.x, at.y), picked = s.queue.find(q => q.id === selected);
    if (roomKey && picked) send(picked, roomKey);
  });
  play.addEventListener('pointermove', e => { if (drag) { const at = local(e); drag.x = at.x; drag.y = at.y; } });
  play.addEventListener('pointerup', e => {
    if (!drag) return;
    const at = local(e), task = s.queue.find(q => q.id === drag.id), moved = Math.hypot(at.x - drag.sx, at.y - drag.sy) > 12, roomKey = roomAt(at.x, at.y);
    drag = null;
    if (!task) return;
    if (moved && roomKey) send(task, roomKey);
    else if (!moved) { selected = selected === task.id ? null : task.id; if (selected) shell.announce(`${M.TYPES[task.type].name} picked. It needs the ${M.need(task)}.`); }
  });
  play.addEventListener('pointercancel', () => { drag = null; });
  el.addEventListener('keydown', e => {
    if (!running || e.altKey || e.ctrlKey || e.metaKey || e.target.closest('button,a')) return;
    const i = s.queue.findIndex(q => q.id === selected);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault(); if (!s.queue.length) return;
      const next = i < 0 ? 0 : (i + (e.key === 'ArrowRight' ? 1 : -1) + s.queue.length) % s.queue.length;
      selected = s.queue[next].id; const t = s.queue[next];
      shell.announce(`${M.TYPES[t.type].name}, needs the ${M.need(t)}, ${Math.ceil(t.patience)} seconds of patience left.`);
    } else if (/^[1-4]$/.test(e.key) && i >= 0) { e.preventDefault(); send(s.queue[i], M.ROOMS[Number(e.key) - 1]); }
    else if (e.key.toLowerCase() === 'c') { e.preventDefault(); drink(); }
  });

  async function begin() {
    const token = ++run; running = false; s = M.createTerm(1 + Math.floor(Math.random() * 1e6)); pos = new Map(); selected = null; drag = null; flashes = []; leaving = []; hud = '';
    el.dataset.phase = 'intro'; setPose('idle'); shell.meter(0, 'WEEK 1'); shell.level(`WEEK 1/${M.WEEKS}`); shell.tag(`MISSED 0/${M.STRIKES}`); shell.score('POINTS', '0');
    if (!introSeen) {
      await shell.intro({
        label: 'MASTER OF ONE VS THE WORD COUNT', title: 'Term time.',
        text: 'Eleven weeks of an MSc, sped up. Send each task in the corridor to its room before it storms off. Rooms do one thing at a time. Miss four and you’re burnt out, and the hand in comes in week 11.',
        controls: [['Drag', 'A task onto its room'], ['Tap', 'The task, then the room', 'touch'], ['← → then 1 to 4', 'Pick a task, send it', 'mouse'], ['C', 'Coffee', 'mouse']],
        button: 'Start term',
      });
      if (token !== run) return;
      introSeen = true;
    }
    playBox(); shell.layout(); running = true; el.dataset.phase = 'play'; shell.focusPlay(); shell.callout('WEEK 1', 'good');
    shell.announce('Week 1. Use the left and right arrows to pick a task, then 1 to 4 for desk, lab, work or meeting.');
  }
  const game = {get running() { return running; }, update, render, layout, restart() { begin(); }, destroy() { run++; running = false; }};
  shell.attach(game);
  begin();
  return shell;
}
