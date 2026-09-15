import test from 'node:test';
import assert from 'node:assert/strict';
import {BattleClock} from '../assets/battle-clock.mjs';
import {BattleEngine, TIMING} from '../assets/battle-engine.mjs';
import {FIGHTS, HEALTH, EMAIL, mailHref} from '../assets/battle-data.mjs';
import {readFileSync,existsSync} from 'node:fs';

function harness() {
  let time=0, serial=0;
  const tasks=new Map(), events=[];
  const clock=new BattleClock({now:()=>time,set:(fn,ms)=>{tasks.set(++serial,{fn,at:time+ms});return serial;},clear:id=>tasks.delete(id)});
  const engine=new BattleEngine((s,event)=>events.push({state:structuredClone(s),event}),clock);
  function advance(ms) {
    const end=time+ms;
    for(let guard=0;guard<1000;guard++){
      const task=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];
      if(!task||task[1].at>end){time=end;return;}
      time=task[1].at;tasks.delete(task[0]);task[1].fn();
    }
    throw new Error('Timer loop');
  }
  return {engine,clock,advance,events,tasks};
}

for(const key of Object.keys(FIGHTS)) {
  test(`${key}: visible reversal and both honest endings`,()=>{
    for(const outcome of ['supported','leave']) {
      const h=harness(), e=h.engine;e.reset(key);e.start();
      h.advance(TIMING.intro);assert.equal(e.state.stage,'windup');
      h.advance(20000);
      assert.equal(e.state.phase,'backup');assert.equal(e.state.jhp,1);assert.equal(e.state.bhp,40);
      const impacts=h.events.filter(x=>x.event==='impact');
      assert.deepEqual(impacts.map(x=>[x.state.jhp,x.state.bhp]),HEALTH);
      assert.equal(e.state.log.length,6);
      const damage=impacts.map(x=>x.state.damage);
      assert.deepEqual(damage,HEALTH.map((hp,i)=>{const prev=i?HEALTH[i-1]:[100,100];return i%2?prev[0]-hp[0]:prev[1]-hp[1];}));
      e.finish(outcome);e.finish(outcome);h.advance(3000);
      assert.equal(e.state.phase,'done');assert.equal(e.state.bhp,0);
      assert.equal(e.state.jhp,outcome==='leave'?1:64);
      assert.equal(e.state.log.length,7);assert.equal(h.tasks.size,0);
    }
  });
}
test('manual pause, nested environmental pause and exact remaining delay',()=>{
  const h=harness(),e=h.engine;e.reset('researcher');e.start();
  h.advance(TIMING.intro-200);e.pause();h.advance(9000);assert.equal(e.state.stage,'title');
  h.clock.block('hidden',true);e.pause();h.advance(9000);assert.equal(e.state.stage,'title');
  h.clock.block('hidden',false);h.advance(199);assert.equal(e.state.stage,'title');
  h.advance(1);assert.equal(e.state.stage,'windup');
});
test('single start activation, and pause holds the fight until resumed',()=>{
  const h=harness(),e=h.engine;e.reset('master');e.start();e.start();h.advance(TIMING.intro+200);
  e.start();assert.equal(e.state.index,1);
  e.pause();h.advance(60000);assert.equal(e.state.index,1);assert.equal(e.state.paused,true);
  e.pause();h.advance(20000);assert.equal(e.state.phase,'backup');assert.equal(e.state.jhp,1);
});
test('skip while paused clears manual block; replay has a clean opening',()=>{
  const h=harness(),e=h.engine;e.reset('skier');e.start();e.pause();e.backup();
  assert.equal(e.state.phase,'backup');assert.equal(e.state.paused,false);
  e.finish('leave');h.advance(3000);assert.equal(e.state.phase,'done');
  e.reset('skier');h.advance(4000);assert.equal(e.state.phase,'select');assert.equal(e.state.log.length,0);e.start();h.advance(TIMING.intro+200);assert.equal(e.state.index,1);
});
test('switching at every finish boundary cancels old callbacks',()=>{
  for(const elapsed of [0,200,600,800,950,2000]){
    const h=harness(),e=h.engine;e.reset('researcher');e.start();e.backup();e.finish('supported');
    h.advance(elapsed);e.reset('creator');h.advance(3000);
    assert.equal(e.state.key,'creator');assert.equal(e.state.phase,'select');assert.equal(e.state.bhp,100);
    assert.equal(e.state.log.length,0);assert.equal(h.tasks.size,0);
  }
});
test('the finish waits during external navigation and remains after return',()=>{
  const h=harness(),e=h.engine;e.reset('rider');e.start();e.backup();e.finish('supported');
  h.advance(200);h.clock.block('unfocused',true);h.clock.block('hidden',true);
  h.advance(60000);assert.equal(e.state.stage,'revive');
  h.clock.block('unfocused',false);h.advance(60000);assert.equal(e.state.stage,'revive');
  h.clock.block('hidden',false);h.advance(TIMING.revive+TIMING.finishAttack+TIMING.ko);assert.equal(e.state.phase,'done');
  h.clock.block('offscreen',true);h.advance(60000);h.clock.block('offscreen',false);
  assert.equal(e.state.phase,'done');assert.equal(h.tasks.size,0);
});
test('invalid state actions cannot restart, skip or duplicate an ending',()=>{
  const h=harness(),e=h.engine;e.reset('builder');e.finish('supported');
  assert.equal(e.state.phase,'select');e.reset('invalid');assert.equal(e.state.key,'builder');
  e.start();e.backup();e.backup();e.start();e.turn();e.pause();
  assert.equal(e.state.phase,'backup');e.finish('supported');e.backup();e.start();
  h.advance(3000);e.turn();e.backup();assert.equal(e.state.phase,'done');
});
test('all mail drafts have correct recipient, subject and selected boss, without delivery claims',()=>{
  for(const key of Object.keys(FIGHTS)){
    const url=new URL(mailHref(key));
    assert.equal(url.pathname,EMAIL);assert.equal(url.searchParams.get('subject'),'Sending backup');
    assert.equal(url.searchParams.get('body'),`Hi Jackson,\r\n\r\nI saw you taking on ${FIGHTS[key].boss} on your site and thought I’d say hello.\r\n\r\n`);
  }
  assert.equal(FIGHTS.operator.level,'');
  assert.match(FIGHTS.researcher.achievement,/20 wash cycles/);
  assert.doesNotMatch(FIGHTS.researcher.achievement,/better|outlast|never needed|close to/);
});
test('every fighter reveals real experience through moves with valid project links',()=>{
  const page=readFileSync(new URL('../experience.html',import.meta.url),'utf8');
  for(const f of Object.values(FIGHTS)){
    const moves=f.moves.filter(m=>m.actor==='jackson'&&m.experience);
    assert.ok(moves.length>=2,`${f.boss} needs experience in the fight`);
    for(const m of moves){
      const [file,id]=m.experience.href.split('#');
      assert.equal(file,'experience.html');assert.ok(page.includes(`id="${id}"`),m.experience.href);
    }
  }
  assert.match(FIGHTS.builder.moves[0].text,/hydroturbine/);
  assert.match(FIGHTS.builder.moves[2].text,/robot/);
  assert.match(FIGHTS.builder.moves[4].text,/solar boat/);
  assert.match(FIGHTS.builder.achievement,/bridge held/);
});
test('homepage starts with the game, keeps contact, and gallery assets exist',()=>{
  const page=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(page.indexOf('id="battle"')<page.indexOf('id="experience"'));
  assert.ok(!page.includes('class="cselect"'));
  assert.match(page,/mailto:jackson\.brocklebank\.25@ucl\.ac\.uk/);
  assert.doesNotMatch(page,/CV\.pdf/);
  for(const [,path] of page.matchAll(/(?:src|href)="(assets\/[^"?#]+)"/g)){
    assert.ok(existsSync(new URL('../'+path,import.meta.url)),path);
  }
});

test('selection waits indefinitely with no scheduled work until Start fight',()=>{
  const h=harness(),e=h.engine;e.reset('builder');
  h.advance(600000);e.pause();e.turn();e.backup();e.finish('leave');
  assert.equal(e.state.phase,'select');assert.equal(e.state.log.length,0);assert.equal(h.tasks.size,0);
  e.reset('skier');h.advance(600000);assert.equal(h.tasks.size,0);
  e.start();e.start();assert.equal(h.tasks.size,1);h.advance(TIMING.intro+200);assert.equal(e.state.index,1);
  e.reset('creator');h.advance(600000);assert.equal(e.state.phase,'select');assert.equal(h.tasks.size,0);
});

test('the fight reaches backup in under eight seconds after the matchup',()=>{
  const h=harness(),e=h.engine;e.reset('creator');e.start();
  h.advance(TIMING.intro);
  h.advance(6500);assert.equal(e.state.phase,'fight');
  h.advance(1500);assert.equal(e.state.phase,'backup');
});

test('every fighter has a world that paints at phone and desktop sizes',async()=>{
  const {paintScene, SCENE_KEYS, particles}=await import('../assets/battle-scenes.mjs');
  assert.deepEqual([...SCENE_KEYS].sort(),Object.keys(FIGHTS).sort());
  const fake=()=>{let fills=0;const ctx={clearRect(){},fillRect(){fills++;},set fillStyle(v){},globalAlpha:1};return {getContext:()=>ctx,get fills(){return fills;}};};
  for(const key of SCENE_KEYS)for(const [w,h,f] of [[107,263,150],[320,186,122],[480,250,160]]){
    const far=fake(),near=fake(),info=paintScene(far,near,key,w,h,f);
    assert.ok(far.fills>50&&near.fills>20,`${key} ${w}x${h}`);
    const p=particles(fake());p.configure(info,w,h);for(let i=0;i<60;i++)p.step();p.burst(10,10,['#fff']);p.step();
  }
});

// The matchup uses the same clock as combat: it cannot run ahead during a pause.
test('matchup holds the first move, suspends in the background, and cancels on change',()=>{
  const h=harness(),e=h.engine;e.reset('builder');e.start();
  h.advance(TIMING.intro-1);assert.equal(e.state.phase,'intro');assert.equal(e.state.index,0);
  assert.equal(e.state.log.length,0);assert.equal(e.state.jhp,100);
  h.clock.block('hidden',true);h.advance(60000);assert.equal(e.state.phase,'intro');
  h.clock.block('hidden',false);h.advance(1);assert.equal(e.state.phase,'fight');
  e.reset('skier');e.start();h.advance(400);e.reset('researcher');h.advance(60000);
  assert.equal(e.state.phase,'select');assert.equal(e.state.key,'researcher');assert.equal(e.state.index,0);
});

test('a replay gets the short matchup and still reaches the same fight',()=>{
  const h=harness(),e=h.engine;e.reset('skier');e.start(true);
  assert.equal(e.state.quick,true);
  h.advance(TIMING.quickIntro-1);assert.equal(e.state.phase,'intro');
  h.advance(1);assert.equal(e.state.stage,'windup');
  h.advance(20000);assert.equal(e.state.phase,'backup');
});

test('all move orders preserve their damage and reach the reversal for every character',()=>{
  const orders=[[0,2,4],[0,4,2],[2,0,4],[2,4,0],[4,0,2],[4,2,0]];
  for(const key of Object.keys(FIGHTS))for(const order of orders)for(const outcome of ['leave','supported']){
    const h=harness(),e=h.engine;e.reset(key);e.start(false,true);h.advance(TIMING.intro);
    let boss=100;
    for(const move of order){
      assert.equal(e.state.stage,'choice');assert.equal(h.tasks.size,0);
      assert.equal(e.chooseMove(move),true);assert.equal(e.state.log.at(-1).name,FIGHTS[key].moves[move].name);
      assert.equal(e.chooseMove(move),false);
      h.advance(TIMING.windup);boss-={0:38,2:22,4:0}[move];assert.equal(e.state.bhp,boss);
      h.advance(5000);assert.equal(e.state.jhp,[92,58,1][e.state.usedMoves.length-1]);
    }
    assert.equal(e.state.phase,'backup');assert.equal(e.state.jhp,1);assert.equal(e.state.bhp,40);assert.deepEqual(e.state.usedMoves,order);
    e.finish(outcome);h.advance(3000);assert.equal(e.state.phase,'done');
  }
});
test('choices wait indefinitely and reject used, invalid, paused and background inputs',()=>{
  const h=harness(),e=h.engine;e.reset('builder');e.start(false,true);h.advance(TIMING.intro+60000);
  assert.equal(e.state.stage,'choice');assert.equal(e.state.index,0);assert.equal(e.chooseMove(1),false);assert.equal(e.chooseMove(NaN),false);
  e.pause();assert.equal(e.chooseMove(0),false);assert.equal(e.watch(),false);e.pause();
  h.clock.block('hidden',true);assert.equal(e.chooseMove(0),false);h.clock.block('hidden',false);
  e.chooseMove(4);h.advance(5000);assert.equal(e.chooseMove(4),false);assert.equal(e.state.index,2);
  e.reset('skier');h.advance(60000);assert.equal(e.state.phase,'select');assert.deepEqual(e.state.usedMoves,[]);
});
test('let Jackson choose uses each remaining move once after any first choice',()=>{
  for(const first of [0,2,4]){
    const h=harness(),e=h.engine;e.reset('researcher');e.start(false,true);h.advance(TIMING.intro);e.chooseMove(first);h.advance(5000);
    assert.equal(e.watch(),true);h.advance(20000);assert.equal(e.state.phase,'backup');assert.equal(new Set(e.state.usedMoves).size,3);assert.equal(e.state.bhp,40);
  }
});

test('reset cancels a chosen move during windup, impact and rest',()=>{
  for(const elapsed of [20,TIMING.windup+20,TIMING.windup+TIMING.impact+20]){
    const h=harness(),e=h.engine;e.reset('builder');e.start(false,true);h.advance(TIMING.intro);e.chooseMove(2);h.advance(elapsed);
    e.reset('skier');h.advance(10000);assert.equal(e.state.phase,'select');assert.equal(e.state.jhp,100);assert.equal(e.state.bhp,100);assert.equal(e.state.log.length,0);
  }
});
test('chosen attacks preserve remaining windup across pause and visibility changes',()=>{
  const h=harness(),e=h.engine;e.reset('builder');e.start(true,true);h.advance(TIMING.quickIntro);assert.equal(e.state.stage,'choice');
  e.chooseMove(0);h.advance(70);e.pause();h.clock.block('hidden',true);h.advance(5000);assert.equal(e.state.bhp,100);
  e.pause();h.advance(5000);assert.equal(e.state.bhp,100);h.clock.block('hidden',false);
  h.advance(TIMING.windup-71);assert.equal(e.state.bhp,100);h.advance(1);assert.equal(e.state.bhp,62);
});
test('automatic play can begin at the first or final choice',()=>{
  for(const count of [0,2]){
    const h=harness(),e=h.engine;e.reset('master');e.start(false,true);h.advance(TIMING.intro);
    for(const move of [4,2].slice(0,count)){e.chooseMove(move);h.advance(5000);}
    assert.equal(e.watch(),true);h.advance(20000);assert.equal(e.state.phase,'backup');assert.equal(e.state.bhp,40);assert.equal(new Set(e.state.usedMoves).size,3);
  }
});
