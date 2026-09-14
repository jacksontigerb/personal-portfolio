import {FIGHTS} from './battle-data.mjs?v=3';
import {BattleClock} from './battle-clock.mjs?v=3';

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
  start() {
    if(this.state.phase!=='select')return;
    this.state.phase='intro';this.state.stage='title';this.emit('start');
    this.clock.after(1100,()=>this.turn());
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
    this.clock.after(i===5?500:280,()=>{
      [s.jhp,s.bhp]=move.hp;s.stage='impact';this.emit('impact');
      this.clock.after(700,()=>{
        s.stage='rest';this.emit();
        this.clock.after(i===5?900:move.actor==='jackson'?2600:1400,()=>i===5?this.backup():this.turn());
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
    s.phase='finishing';s.stage='revive';s.paused=false;
    s.outcome=outcome;s.jhp=outcome==='leave'?1:64;s.bhp=40;
    this.emit('finish');
    this.clock.after(600,()=>{
      s.stage='finishAttack';s.actor='jackson';s.damage=40;
      this.line('jackson',FIGHTS[s.key][outcome==='leave'?'leave':'win']);
      this.clock.after(350,()=>{
        s.stage='ko';s.bhp=0;this.emit('victory');
        this.clock.after(1600,()=>this.completeFinish());
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
