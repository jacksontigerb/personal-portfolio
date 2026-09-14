import {FIGHTS} from './battle-data.mjs?v=5';
import {BattleClock} from './battle-clock.mjs?v=5';

// Fast enough to feel like a fight, slow enough to read each move.
export const TIMING = Object.freeze({intro:2800, quickIntro:1100, windup:170, bossWindup:220, critWindup:420, impact:380,
  jacksonRest:1150, bossRest:800, lastRest:650, revive:350, finishAttack:220, ko:1300});

export class BattleEngine {
  constructor(onChange, clock = new BattleClock()) {
    this.onChange=onChange;this.clock=clock;this.run=0;
  }
  emit(event='state') { this.onChange(this.state,event); }
  line(actor, move) {
    this.state.log.push({actor, name:move.name, text:move.text, experience:move.experience});
    this.emit('line');
  }
  reset(key) {
    if(!FIGHTS[key]) return;
    this.clock.cancel();this.clock.block('manual',false);
    this.state={key,run:++this.run,phase:'select',stage:'ready',index:0,jhp:100,bhp:100,
      paused:false,log:[],outcome:null,damage:0};
    this.emit('reset');
  }
  // A replay gets a shorter matchup, since the visitor has already seen the full one.
  start(quick=false) {
    if(this.state.phase!=='select')return;
    this.state.phase='intro';this.state.stage='title';this.state.quick=Boolean(quick);this.emit('start');
    this.clock.after(quick?TIMING.quickIntro:TIMING.intro,()=>this.turn());
  }

  pause() {
    if(!['intro','fight','finishing'].includes(this.state.phase))return;
    this.state.paused=!this.state.paused;
    this.clock.block('manual',this.state.paused);this.emit();
  }
  turn() {
    const s=this.state;
    if(!['intro','fight'].includes(s.phase))return;
    if(s.index===6){this.backup();return;}
    this.clock.cancel();
    const i=s.index++, move=FIGHTS[s.key].moves[i];
    s.phase='fight';s.actor=move.actor;s.stage='windup';s.critical=i===5;
    s.damage=move.actor==='jackson'?s.bhp-move.hp[1]:s.jhp-move.hp[0];
    this.line(move.actor,move);
    this.clock.after(i===5?TIMING.critWindup:move.actor==='jackson'?TIMING.windup:TIMING.bossWindup,()=>{
      [s.jhp,s.bhp]=move.hp;s.stage='impact';this.emit('impact');
      this.clock.after(TIMING.impact,()=>{
        s.stage='rest';this.emit();
        this.clock.after(i===5?TIMING.lastRest:move.actor==='jackson'?TIMING.jacksonRest:TIMING.bossRest,()=>i===5?this.backup():this.turn());
      });
    });
  }
  backup() {
    const s=this.state;
    if(!['intro','fight'].includes(s.phase))return;
    this.clock.cancel();this.clock.block('manual',false);
    s.paused=false;s.phase='backup';s.stage='still';s.jhp=1;s.bhp=40;
    if(s.index<6)s.log.push({actor:'',name:'Some time later…',text:'Jackson has 1 HP left.'});
    s.index=6;this.emit('backup');
  }
  finish(outcome) {
    const s=this.state;
    if(s.phase!=='backup')return;
    this.clock.cancel();this.clock.block('manual',false);
    s.phase='finishing';s.stage='revive';s.paused=false;s.critical=false;
    s.outcome=outcome;s.jhp=outcome==='leave'?1:64;s.bhp=40;
    this.emit('finish');
    this.clock.after(TIMING.revive,()=>{
      s.stage='finishAttack';s.actor='jackson';s.damage=40;
      this.line('jackson',FIGHTS[s.key][outcome==='leave'?'leave':'win']);
      this.clock.after(TIMING.finishAttack,()=>{
        s.stage='ko';s.bhp=0;this.emit('victory');
        this.clock.after(TIMING.ko,()=>this.completeFinish());
      });
    });
  }
  completeFinish() {
    if(this.state.phase!=='finishing')return;
    this.clock.cancel();this.clock.block('manual',false);
    const move=FIGHTS[this.state.key][this.state.outcome==='leave'?'leave':'win'];
    if(this.state.log.at(-1)?.name!==move.name)this.state.log.push({actor:'jackson',...move});
    Object.assign(this.state,{phase:'done',stage:'ko',bhp:0,paused:false});
    this.emit('done');
  }
}
