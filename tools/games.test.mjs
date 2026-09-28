import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import * as rain from '../assets/games/rain-model.mjs';
import * as bridge from '../assets/games/bridge-model.mjs';
import * as knee from '../assets/games/knee-model.mjs';
import * as shot from '../assets/games/shot-model.mjs';
import * as ski from '../assets/games/ski-model.mjs';
import * as runclub from '../assets/games/run-model.mjs';
import * as term from '../assets/games/term-model.mjs';
import * as route from '../assets/games/route-model.mjs';
import * as dec from '../assets/games/decathlon-model.mjs';
import {GAMES, EVIDENCE} from '../assets/games/index.mjs';

// Shed the Rain

test('rain release angles are the measured C-A1 values for each round',()=>{
  assert.deepEqual(rain.ROUNDS.map(r=>r.washes),[0,10,20]);
  assert.deepEqual(rain.ROUNDS[0].release,[28.5,55.7,45.7]);
  assert.deepEqual(rain.ROUNDS[1].release,[47.0,48.5,56.0]);
  assert.deepEqual(rain.ROUNDS[2].release,[56.1,46.4,49.6]);
  // Every large drop can release within the game's tilt limit.
  for(const r of rain.ROUNDS)for(const a of r.release)assert.ok(a<rain.MAX_TILT);
});
test('small drops never release on their own, at any tilt',()=>{
  for(let vol=1;vol<rain.LARGE;vol++)for(let tilt=-90;tilt<=90;tilt+=.5)assert.equal(rain.releases(vol,45.7,tilt),false);
  const s=rain.createRound(0,3);rain.place(s,-20,1);rain.place(s,20,2);
  for(let i=0;i<180;i++)rain.step(s,1/60,rain.MAX_TILT);
  const pinned=s.drops.filter(d=>d.vol<rain.LARGE);
  assert.ok(pinned.some(d=>Math.abs(d.s+20)<1e-9));assert.ok(pinned.some(d=>Math.abs(d.s-20)<1e-9));
});
test('a large drop releases at exactly its measured angle and not before',()=>{
  for(const [index,round] of rain.ROUNDS.entries())for(const angle of round.release){
    assert.equal(rain.releases(3,angle,angle-.01),false);
    assert.equal(rain.releases(3,angle,angle),true);
    assert.equal(rain.releases(3,angle,-angle),true);
    const s=rain.createRound(index,1),d=rain.place(s,0,3);
    assert.ok(round.release.includes(d.threshold));
  }
});
test('drops that land on each other merge, and three small drops make a large one',()=>{
  const s=rain.createRound(0,5),events=[];
  const a=rain.place(s,0,1,events);rain.place(s,.5,1,events);
  assert.equal(s.drops.length,1);assert.equal(a.vol,2);assert.equal(a.threshold,null);
  rain.place(s,-.5,1,events);
  assert.equal(a.vol,3);assert.ok(Number.isFinite(a.threshold));
  assert.equal(events.at(-1).grew,true);
});
test('a rolling drop sweeps up pinned drops in its path and sheds them all',()=>{
  const s=rain.createRound(0,9);
  const big=rain.place(s,-40,3);big.threshold=28.5;
  rain.place(s,-10,1);rain.place(s,10,1);rain.place(s,30,2);
  let shed=null;
  for(let i=0;i<240&&!shed;i++)shed=rain.step(s,1/60,rain.MAX_TILT).find(e=>e.type==='shed'&&e.id===big.id);
  assert.ok(shed,'the big drop reached the edge');
  assert.equal(shed.vol,7);assert.equal(shed.points,14);assert.equal(shed.side,1);
});
test('levelling off stops a rolling drop; tilting the other way sends it back',()=>{
  const s=rain.createRound(0,2),d=rain.place(s,0,3);d.threshold=45.7;
  for(let i=0;i<30;i++)rain.step(s,1/60,50);
  assert.ok(d.moving&&d.v>0);
  for(let i=0;i<90;i++)rain.step(s,1/60,0);
  assert.equal(d.moving,false);
  const stopped=d.s;
  for(let i=0;i<60;i++)rain.step(s,1/60,-rain.MAX_TILT);
  assert.ok(d.s<stopped);
});
test('water left on the swatch soaks it and ends the round; clearing it lets it dry',()=>{
  const s=rain.createRound(0,4);
  for(let x=-45;x<=45;x+=6)rain.place(s,x,1);
  let over=false;for(let i=0;i<60*20&&!over;i++)over=rain.step(s,1/60,0).some(e=>e.type==='over');
  assert.equal(s.reason,'soaked');
  const dry=rain.createRound(0,4);dry.soak=50;
  rain.step(dry,1,0);assert.ok(dry.soak<50);
});
test('rounds last 30 seconds and the same seed replays the same rain',()=>{
  const play=seed=>{const s=rain.createRound(1,seed);let n=0;while(!s.over){n++;rain.step(s,1/60,Math.sin(n/40)*60);}return [s.score,s.shed,s.reason,s.t.toFixed(3)];};
  assert.deepEqual(play(11),play(11));
  const s=rain.createRound(0,1);s.soak=-Infinity;
  while(!s.over)rain.step(s,1/60,rain.MAX_TILT);
  assert.equal(s.reason,'time');assert.ok(Math.abs(s.t-rain.ROUND_TIME)<.02);
});
test('stars need more than holding one way',()=>{
  const total=bot=>{let sum=0;for(let r=0;r<3;r++){const s=rain.createRound(r,40+r);while(!s.over)rain.step(s,1/60,bot(s));sum+=s.score;}return sum;};
  assert.equal(rain.stars(total(()=>0)),0);
  assert.ok(rain.stars(total(()=>rain.MAX_TILT))<=2);
  const smart=s=>{const m=s.drops.find(d=>d.moving);if(m)return Math.sign(m.v||1)*60;const big=s.drops.filter(d=>rain.isLarge(d.vol)).sort((a,b)=>Math.abs(b.s)-Math.abs(a.s))[0];return big?(big.s<0?60:-60):0;};
  assert.ok(total(smart)>total(()=>rain.MAX_TILT));
});

// Bridge Test

const build=(level,sticks)=>{const d=bridge.createDesign(level);for(const [a,b] of sticks)assert.ok(bridge.addStick(d,a,b),`${a}→${b}: ${bridge.problem(d,a,b)}`);return d;};
const warren=(g,depth)=>{const s=[];for(let x=0;x<g;x+=2){s.push([[x,0],[x+1,-depth]],[[x+1,-depth],[x+2,0]]);if(x+3<=g)s.push([[x+1,-depth],[x+3,-depth]]);}return s;};

test('sticks have to be short, connected, inside the grid and within budget',()=>{
  const d=bridge.createDesign(0);
  assert.equal(bridge.problem(d,[0,0],[3,0]),'long');
  assert.equal(bridge.problem(d,[1,-2],[2,-3]),'floating');
  assert.equal(bridge.problem(d,[1,0],[2,0]),'exists');
  assert.equal(bridge.problem(d,[0,0],[0,2]),'bench');
  assert.equal(bridge.problem(d,[4,0],[5,-1]),'outside');
  assert.equal(bridge.problem(d,[1,0],[1,0]),'same');
  assert.equal(bridge.problem(d,[0,2],[1,0]),'');
  assert.ok(bridge.addStick(d,[1,0],[1,-1]));
  assert.equal(bridge.problem(d,[1,-1],[1,0]),'exists');
  assert.equal(bridge.problem(d,[1,-1],[2,-3]),'','a new stick can start from the end of the last one');
  for(let i=d.sticks.length;i<bridge.LEVELS[0].budget;i++)d.sticks.push({a:[9,9],b:[9,9]});
  assert.equal(bridge.problem(d,[0,2],[1,0]),'budget');
});
test('a bare deck collapses on every level',()=>{
  for(let level=0;level<3;level++)assert.equal(bridge.runTest(bridge.createDesign(level)).held,false);
});
test('a Warren truss holds each level, and the full load needs a deeper one',()=>{
  assert.equal(bridge.runTest(build(0,warren(4,1))).held,true);
  assert.equal(bridge.runTest(build(1,warren(6,1))).held,true);
  assert.equal(bridge.runTest(build(2,warren(6,1))).held,false);
  assert.equal(bridge.runTest(build(2,warren(6,2))).held,true);
});
test('props from the lower bolts are the cheap answer to the short gap',()=>{
  const d=build(0,[[[0,2],[1,0]],[[4,2],[3,0]]]);
  const r=bridge.runTest(d);
  assert.equal(r.held,true);assert.equal(bridge.stars(0,d.sticks.length,r.held),3);
});
test('the same design gives the same result',()=>{
  const d=build(1,warren(6,1));
  assert.deepEqual(bridge.runTest(d),bridge.runTest(d));
});
test('stars follow the stick thresholds and need the bridge to hold',()=>{
  for(const [level,info] of bridge.LEVELS.entries()){
    assert.equal(bridge.stars(level,1,false),0);
    assert.equal(bridge.stars(level,info.budget,true),1);
    assert.equal(bridge.stars(level,info.stars[1],true),2);
    assert.equal(bridge.stars(level,info.stars[2],true),3);
  }
});

// Find the knee

test('every made up cell dies inside the chart, after its knee',()=>{
  for(let seed=1;seed<=60;seed++)for(const cell of knee.makeRun(seed)){const eol=knee.endOfLife(cell);assert.ok(eol<knee.AXIS&&eol>knee.START+300&&eol>cell.knee===Number.isFinite(cell.knee),cell.label);assert.ok(Math.abs(knee.soh(cell,eol)-knee.EOL)<.001);}
});
test('the baseline, fitted before the knee, always says the cell lasts too long',()=>{
  for(let seed=1;seed<=60;seed++)for(const cell of knee.makeRun(seed)){if(!Number.isFinite(cell.knee))continue;const seen=knee.points(cell).filter(p=>p.n<=cell.knee);assert.ok(knee.baseline(seen).eol>knee.endOfLife(cell)*1.3,cell.label);}
});
test('calling it earlier is worth more, too late or too far out is worth nothing',()=>{
  const cell=knee.makeRun(7)[1],eol=knee.endOfLife(cell);
  assert.ok(knee.score(cell,eol,eol-300).points>knee.score(cell,eol,eol-100).points);
  assert.equal(knee.score(cell,eol,eol).points,0);assert.equal(knee.score(cell,eol,eol).late,true);
  assert.equal(knee.score(cell,null,eol-200).late,true);
  assert.equal(knee.score(cell,eol*1.11,eol-300).points,0);
  assert.equal(knee.score(cell,eol,0).points,knee.MAX_WARNING,'warning past the cap does not count');
});

// Get the shot

test('a perfect shot is worth my best video, 1.2 million views',()=>{
  for(const scene of shot.SCENES){const at=scene.path(scene.peak);const r=shot.shoot(scene,scene.peak,{u:at.u,v:at.v,w:.3,h:.8});assert.equal(r.score,100,scene.key);assert.equal(shot.viewText(r.views),'1.2m');}
});
test('missing the subject or the moment costs views',()=>{
  const scene=shot.SCENES[0],at=scene.path(scene.peak);
  assert.equal(shot.shoot(scene,scene.peak,{u:at.u>.5?.15:.85,v:.5,w:.2,h:.5}).score,0);
  assert.ok(shot.shoot(scene,scene.peak+.4,{u:at.u,v:at.v,w:.3,h:.8}).views<shot.shoot(scene,scene.peak,{u:at.u,v:at.v,w:.3,h:.8}).views);
  const giraffe=shot.SCENES.find(s=>s.key==='giraffe');
  assert.equal(shot.hidden(giraffe,giraffe.path(giraffe.peak).u),0,'the best moment is in the gap between the trees');
  assert.ok(shot.hidden(giraffe,giraffe.trees[0])>.9);
});

// Last run

const skiRun=(seed,bot)=>{const s=ski.createRun(seed);while(!s.done&&s.t<120)ski.step(s,1/60,bot(s));return s;};
const gateBot=s=>{const g=s.map.gates.find(g=>g.passed==null);let tx=g?g.x:0;const ahead=s.map.things.filter(o=>o.y>s.y&&o.y<s.y+10&&Math.abs(o.x-s.x)<1.8);if(ahead.length)tx=s.x+(ahead[0].x>s.x?-3:3);return Math.atan2(tx-s.x,Math.max(6,(g?g.y:s.y+20)-s.y));};
test('skiing the gates makes the last chair; pointing straight down usually does not',()=>{
  let gates=0,straight=0;for(let seed=1;seed<=6;seed++){if(skiRun(seed,gateBot).made)gates++;if(skiRun(seed,()=>0).made)straight++;}
  assert.ok(gates>=5,`gate runs made it ${gates}/6`);assert.ok(straight<gates);
});
test('gates add time, crashes stop you, and missing the chair is no stars',()=>{
  const s=ski.createRun(3);s.map.things=[{x:0,y:20,kind:'tree',r:.9}];let crash=false;
  while(s.y<30)crash=ski.step(s,1/60,0).some(e=>e.type==='crash')||crash;
  assert.ok(crash);
  const g=ski.createRun(3);g.map.gates=[{x:0,y:15,passed:null}];g.map.things=[];while(g.y<20)ski.step(g,1/60,0);
  assert.equal(g.gates,1);assert.equal(g.bonus,ski.GATE_BONUS+ski.CLEAN_BONUS,'a straight line through is a clean gate');
  assert.equal(ski.stars({made:false}),0);
});

// Run club

const runWith=(seed,bot)=>{const s=runclub.createRun(seed);while(!s.done&&s.t<200){if(bot(s))runclub.jump(s);else if(s.vy<0)runclub.release(s);runclub.step(s,1/60);}return s;};
const perfectRunner=s=>{const n=s.map.items.find(i=>!i.gone&&i.x>s.x);if(!n)return false;const d=n.x-s.x;if(['cone','puddle','bin','dog'].includes(n.kind))return d<3.4&&d>2.4;if(n.high)return d<4.2&&d>3;return false;};
test('jumping everything gets the club through the wall; never jumping does not',()=>{
  const good=runWith(4,perfectRunner),lazy=runWith(4,()=>false);
  assert.equal(good.wall,'through');assert.equal(good.hits,0);assert.ok(good.club>=runclub.NEED);
  assert.equal(lazy.wall,'stuck');assert.ok(lazy.club<runclub.NEED);
});
test('hitting something costs three runners, and 25 is the goal from the real club',()=>{
  const s=runclub.createRun(1);s.club=10;s.map.items=[{x:1,kind:'cone'}];while(s.x<2)runclub.step(s,1/60);
  assert.equal(s.club,7);assert.equal(runclub.GOAL,25);assert.equal(runclub.stars({club:25}),3);assert.equal(runclub.stars({club:7}),0);
});

// Term time

test('rooms take only their own tasks, one at a time',()=>{
  const s=term.createTerm(2);s.queue=[{id:90,type:'write',step:0,patience:9,max:9},{id:91,type:'write',step:0,patience:9,max:9}];
  assert.equal(term.assign(s,90,'lab').reason,'wrong');assert.equal(s.queue[0].patience,8);
  assert.equal(term.assign(s,90,'desk').ok,true);assert.equal(term.assign(s,91,'desk').reason,'busy');
});
test('lab then write it up comes back for the desk, and the hand in arrives in week 11',()=>{
  const s=term.createTerm(2);s.next=999;s.writeups=[];s.queue=[{id:80,type:'labwrite',step:0,patience:12,max:12}];
  term.assign(s,80,'lab');let back=null;for(let i=0;i<400&&!back;i++)back=term.step(s,1/60).find(e=>e.type==='next');
  assert.ok(back);assert.equal(term.need(s.queue[0]),'desk');
  const t=term.createTerm(3);t.next=999;t.writeups=[];t.t=term.WEEK*(term.WEEKS-1)-.01;term.step(t,.02);
  assert.ok(t.queue.some(q=>q.type==='handin'));
});
test('leaving tasks waiting burns you out; keeping up earns stars',()=>{
  const idle=term.createTerm(4);while(!idle.over)term.step(idle,1/60);
  assert.equal(idle.reason,'burnt out');assert.equal(term.stars(idle),0);
  const busy=term.createTerm(4);let cool=0;while(!busy.over){cool-=1/60;if(cool<=0){const q=[...busy.queue].sort((a,b)=>a.patience-b.patience).find(q=>!busy.rooms[term.need(q)]);if(q){term.assign(busy,q.id,term.need(q));cool=.5;}term.coffee(busy);}term.step(busy,1/60);}
  assert.equal(busy.reason,'term');assert.ok(term.stars(busy)>=2,`score ${busy.score}`);
});
test('coffee doubles the pace for a few seconds, then needs time to come back',()=>{
  const s=term.createTerm(1);assert.equal(term.coffee(s),false);s.coffeeReady=0;assert.equal(term.coffee(s),true);assert.equal(s.coffee,term.COFFEE_FOR);assert.equal(term.coffee(s),false);
});

// Route finder

test('the bag has to stay under the allowance',()=>{
  let bag=[];for(const i of route.ITEMS)bag=route.toggle(bag,i.key);
  assert.ok(route.weight(bag)<=route.ALLOWANCE);assert.deepEqual(route.toggle(['torch'],'torch'),[]);
});
test('kit changes the walk: torch in the dark, poles on scree, jacket in the storm',()=>{
  const edge=route.EDGES.find(e=>e[4]==='scree');
  assert.ok(route.leg(route.createTrip([]),edge).minutes>route.leg(route.createTrip(['torch']),edge).minutes);
  assert.ok(route.leg(route.createTrip(['poles']),edge).energy<route.leg(route.createTrip([]),edge).energy);
  const ridge=route.EDGES.find(e=>e[4]==='ridge'),stormy=b=>{const s=route.createTrip(b);s.time=route.STORM[0];return route.leg(s,ridge);};
  assert.ok(stormy([]).energy>stormy(['jacket']).energy);
});
test('the summit before 06:15 catches the sunrise, and the lake ends the day',()=>{
  const s=route.createTrip(['torch','snacks','camera','swimmers']);for(const to of [1,4,7,8,9,10,11])route.walk(s,to);
  assert.equal(s.sunrise,'made');assert.equal(s.ended,'lake');assert.deepEqual(s.photos.sort(),['eagle','ibex','marmot']);
  assert.ok(route.stars(s)>=2,`score ${route.score(s).total}`);
});
test('running out of energy eats the snacks first',()=>{
  const s=route.createTrip(['snacks']);s.energy=1;route.walk(s,1);
  assert.equal(s.done,false);assert.equal(s.snacks,1);assert.ok(s.energy>0);
});

// Jackson's decathlon

test('decathlon medals follow each event’s rules',()=>{
  assert.equal(dec.pumpMedal(101,60,74),0);assert.equal(dec.pumpMedal(67,60,74),3);assert.equal(dec.pumpMedal(61,60,74),2);assert.equal(dec.pumpMedal(55,60,74),1);assert.equal(dec.pumpMedal(30,60,74),0);
  assert.equal(dec.timingMedal(.05),3);assert.equal(dec.timingMedal(-.2),1);assert.equal(dec.timingMedal(.5),0);
  assert.equal(dec.strumMedal([.01,-.02,.03,.05]),3);assert.equal(dec.strumMedal([.01,.3]),0);
  assert.equal(dec.reactionMedal(-.1),0);assert.equal(dec.reactionMedal(.3),3);assert.equal(dec.reactionMedal(1.2),0);
  assert.equal(dec.climbMedal(dec.CLIMB_TOP),3);assert.equal(dec.climbMedal(3),0);
  assert.equal(dec.stars(25),3);assert.equal(dec.stars(9),0);
});
test('the chess puzzles have one answer each, and the moves are on the board',()=>{
  for(const p of dec.PUZZLES){
    assert.ok(p.answer>=0&&p.answer<p.options.length);
    assert.equal(new Set(p.options.map(o=>o.join())).size,p.options.length);
    for(const [from,to] of p.options){assert.ok(p.pieces[from]);assert.ok(/^[a-h][1-8]$/.test(to));assert.ok(!p.pieces[to]);}
  }
});
test('the kana spell the words they say they do',()=>{
  const sound={や:'ya',ま:'ma',ゆ:'yu',き:'ki',す:'su',し:'shi',は:'ha',く:'ku',ば:'ba',う:'u',み:'mi',さ:'sa',か:'ka',な:'na'};
  for(const [kana,latin] of dec.KANA)assert.equal([...kana].map(k=>sound[k]).join(''),latin,kana);
});
test('every character has a game',()=>{
  assert.deepEqual(Object.keys(GAMES).sort(),Object.keys(EVIDENCE).sort());
});

// Real projects at the end of each game and fight

test('every reward has an existing image and a real portfolio destination',()=>{
  const html=readFileSync(new URL('../experience.html',import.meta.url),'utf8');
  assert.equal(Object.keys(EVIDENCE).length,9);
  for(const proof of Object.values(EVIDENCE)){
    assert.ok(existsSync(new URL('../assets/'+proof.image,import.meta.url)),proof.image);
    assert.ok(html.includes(`id="${proof.href.split('#')[1]}"`),proof.href);
  }
});
