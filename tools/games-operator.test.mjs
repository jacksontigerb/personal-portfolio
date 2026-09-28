// Find the knee: the run of cells, the no knee cell, and the data.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as knee from '../assets/games/knee-model.mjs';

test('each run has three cells, exactly one with no knee, and runs differ',()=>{
  for(let seed=1;seed<=40;seed++){const run=knee.makeRun(seed);assert.equal(run.length,knee.CELL_COUNT);assert.equal(run.filter(c=>!Number.isFinite(c.knee)).length,1);assert.ok(Number.isFinite(run[0].knee),'the first cell is a gentle one with a knee');}
  assert.notDeepEqual(knee.makeRun(1).map(knee.endOfLife),knee.makeRun(2).map(knee.endOfLife));
  assert.deepEqual(knee.makeRun(5).map(knee.endOfLife),knee.makeRun(5).map(knee.endOfLife));
});
test('with no knee, the baseline is right; with a knee, it is far out',()=>{
  for(let seed=1;seed<=40;seed++)for(const cell of knee.makeRun(seed)){
    const eol=knee.endOfLife(cell),seen=knee.points(cell).filter(p=>p.n<=eol*.6),b=knee.baseline(seen).eol;
    if(Number.isFinite(cell.knee))assert.ok(b>eol*1.3,cell.label);else assert.ok(Math.abs(b-eol)/eol<.1,`${cell.label} ${b} ${eol}`);
  }
});
test('the data starts at a fixed cycle, so the start gives nothing away',()=>{
  assert.equal(typeof knee.START,'number');assert.equal(typeof knee.SPEED,'number');
  for(const cell of knee.makeRun(3)){const pts=knee.points(cell);assert.equal(pts[0].n,0);assert.equal(pts.at(-1).n,knee.AXIS);}
});
test('a pin that is spot on with plenty of warning earns the most; stars need real skill',()=>{
  const cell=knee.makeRun(9)[0],eol=knee.endOfLife(cell);
  assert.equal(knee.verdict(knee.score(cell,eol,eol-200)),'bullseye');
  assert.equal(knee.verdict(knee.score(cell,eol*1.06,eol-200)),'close');
  assert.equal(knee.verdict(knee.score(cell,eol*1.2,eol-200)),'miss');
  assert.equal(knee.stars(knee.CELL_COUNT*knee.MAX_WARNING),3);
  assert.equal(knee.stars(0),0);
});
