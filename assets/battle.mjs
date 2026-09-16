import {FIGHTS, LOADOUT, EMAIL, LINKEDIN, mailHref} from './battle-data.mjs?v=13';
import {BattleEngine} from './battle-engine.mjs?v=20';
import {drawBoss, drawProp} from './battle-art.mjs?v=5';
import {paintScene, particles} from './battle-scenes.mjs?v=18';

export function mountBattle(mount, characters) {
  mount.innerHTML=`
    <div class="battle-select-world" aria-hidden="true"><canvas class="battle-select-far"></canvas><canvas class="battle-select-near"></canvas></div>
    <div class="battle-wipe" aria-hidden="true"></div>
    <div class="battle-select">
      <div class="battle-select-arena">
        <div class="battle-character-preview">
          <div class="battle-preview-stage"><img width="537" height="840" alt="" decoding="async"><img class="battle-preview-ghost" width="537" height="840" alt="" aria-hidden="true" hidden></div>
          <div class="battle-preview-copy"><h2 class="battle-selected-name"></h2><p class="battle-loadout"></p></div>
        </div>
        <div class="battle-vs-mark" aria-hidden="true">VS</div>
        <div class="battle-vs">
          <div class="battle-vs-stage"><canvas class="battle-select-shadow" width="64" height="64" aria-hidden="true"></canvas></div>
          <p><span class="battle-vs-label">Up against</span><strong class="battle-vs-name"></strong><span class="battle-vs-level"></span></p>
        </div>
      </div>
      <div class="battle-start-wrap"><button type="button" class="battle-start" data-action="start">Start fight <span aria-hidden="true">▶</span></button></div>
      <div class="battle-select-controls">
        <fieldset class="battle-picker"><legend>Choose your Jackson</legend><div class="battle-roster"></div></fieldset>
      </div>
    </div>
    <div class="battle-game" data-phase="intro" data-stage="title">
      <div class="battle-world" aria-hidden="true"><canvas class="battle-far"></canvas><canvas class="battle-near"></canvas><canvas class="battle-particles"></canvas></div>
      <div class="battle-topline">
        <div class="battle-hud battle-boss-hud">
          <div class="battle-name-row"><span class="battle-who" id="battle-boss-name"></span><span class="battle-level" id="battle-boss-level"></span></div>
          <span id="battle-subtitle" class="battle-subtitle"></span>
          <div class="battle-health"><span>HP</span><meter class="vh" id="battle-boss-meter" min="0" max="100" value="100" aria-labelledby="battle-boss-name"></meter><span class="battle-health-track" id="battle-boss-track" aria-hidden="true"><b></b><i></i></span><span id="battle-boss-hp">100</span></div>
        </div>
        <span class="battle-round">ROUND 1</span><button type="button" class="battle-pause" data-action="pause" aria-label="Pause">Ⅱ</button>
      </div>
      <div class="battle-field" aria-label="Battlefield">
        <div class="battle-ko" aria-hidden="true">K.O.</div>
        <div class="battle-callout" aria-hidden="true"></div>
        <div class="battle-stage" aria-hidden="true">
          <div class="battle-platform battle-platform-boss"></div><div class="battle-platform battle-platform-jackson"></div>
          <div class="battle-boss"><canvas width="64" height="64"></canvas><span class="battle-burst"></span><span class="battle-impact"></span></div>
          <div class="battle-jackson"><img width="537" height="840" alt="" decoding="async"><span class="battle-burst"></span><span class="battle-impact"></span></div>
          <canvas class="battle-prop" width="16" height="16"></canvas>
          <span class="battle-stage-note"></span>
        </div>
        <div class="battle-hud battle-jackson-hud">
          <div class="battle-name-row"><span class="battle-who" id="battle-jackson-name">Jackson</span><span class="battle-level">LV 22</span></div>
          <div class="battle-health"><span>HP</span><meter class="vh" id="battle-jackson-meter" min="0" max="100" value="100" aria-labelledby="battle-jackson-name"></meter><span class="battle-health-track" id="battle-jackson-track" aria-hidden="true"><b></b><i></i></span><span id="battle-jackson-hp">100/100</span></div>
        </div>
      </div>
      <div class="battle-letterbox" aria-hidden="true"></div>
      <div class="battle-match-intro" aria-hidden="true">
        <span class="battle-intro-label">THE MATCHUP</span>
        <img class="battle-intro-jackson" width="537" height="840" alt="" decoding="async">
        <div class="battle-intro-title"><span>Jackson</span><em>VS</em><span class="battle-intro-boss-name"></span></div>
        <canvas class="battle-intro-boss" width="64" height="64"></canvas>
        <span class="battle-intro-ready">HERE WE GO.</span>
      </div>
      <div class="battle-flash" aria-hidden="true"></div>
      <div class="battle-pause-menu" hidden>
        <p class="battle-pause-title" tabindex="-1">Paused</p>
        <button type="button" class="battle-button battle-primary" data-action="resume">▶ Resume</button>
        <button type="button" class="battle-button" data-action="choose">Change character</button>
      </div>
      <div class="battle-command">
        <div class="battle-moves" hidden>
          <div class="battle-moves-heading"><h2 tabindex="-1" aria-describedby="battle-choice-context">Pick a move.</h2><span class="battle-moves-count"></span></div>
          <p id="battle-choice-context" class="vh"></p><div class="battle-move-options"></div>
          <button type="button" class="battle-watch" data-action="watch">Let Jackson choose</button>
        </div>
        <div class="battle-log-panel">
          <p class="battle-turn-label">THE MATCH</p>
          <p class="battle-current" tabindex="-1"></p>
          <p class="battle-previous"></p>
        </div>
        <div class="battle-backup" hidden>
          <div class="battle-call-heading"><h2 tabindex="-1">Jackson needs backup</h2><span class="battle-one">1 HP</span></div>
          <div class="battle-menu">
            <a class="battle-choice battle-choice-main" data-action="email"><span class="battle-choice-icon" aria-hidden="true">✉</span><span class="battle-choice-text"><strong>Send backup by email</strong><small>Opens a draft email</small></span></a>
            <button type="button" class="battle-choice" data-action="copy"><span class="battle-choice-icon" aria-hidden="true">⧉</span><span class="battle-choice-text"><strong>Copy his email</strong></span></button>
            <a class="battle-choice" href="${LINKEDIN}" data-action="linkedin" target="_blank" rel="noopener"><span class="battle-choice-icon" aria-hidden="true">in</span><span class="battle-choice-text"><strong>Find him on LinkedIn</strong></span></a>
            <button type="button" class="battle-choice battle-choice-leave" data-action="leave"><span class="battle-choice-text"><strong>Leave him to it</strong><small>He’ll manage. Probably.</small></span></button>
          </div>
          <p class="battle-hint"><a class="battle-address" href="mailto:${EMAIL}">${EMAIL}</a></p>
          <p class="battle-copy-status" role="status"></p>
        </div>
        <div class="battle-result" hidden>
          <span class="battle-turn-label">FIGHT OVER</span>
          <h2 class="battle-result-title" tabindex="-1"></h2>
          <p class="battle-result-line"></p>
          <p class="battle-result-note" hidden></p>
          <p class="battle-achievement"></p>
          <div class="battle-result-actions"><button type="button" class="battle-button battle-primary battle-big" data-action="again">↺ Fight again</button><a class="battle-button battle-big" href="mailto:${EMAIL}">✉ Email Jackson</a></div>
          <details class="battle-used"><summary><span class="battle-turn-label">WHERE THE MOVES CAME FROM</span></summary><ul></ul></details>
          <p class="battle-disclaimer">The fights are made up.</p>
        </div>
      </div>
    </div>
    <p class="vh battle-announcement" role="status" aria-live="polite" aria-atomic="true"></p>`;
  const $=selector=>mount.querySelector(selector);
  const game=$('.battle-game'), img=$('.battle-jackson img'), previewImg=$('.battle-preview-stage img'), introImg=$('.battle-intro-jackson'), boss=$('.battle-boss canvas');
  const start=$('[data-action="start"]'), backup=$('.battle-backup'), result=$('.battle-result');
  const pause=$('[data-action="pause"]'), pauseMenu=$('.battle-pause-menu');
  const current=$('.battle-current'), previous=$('.battle-previous'), copyStatus=$('.battle-copy-status');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const radios=[];
  const CALLOUTS=['GOOD HIT','BARELY FELT IT','COMBO ×2','OUCH','MISSED','CRITICAL HIT!'];
  function replay(el, className) {el.classList.remove(className);void el.offsetWidth;el.classList.add(className);}
  function countTo(el, to, suffix='') {
    const from=Number(el.dataset.value??to);el.dataset.value=to;
    cancelAnimationFrame(el._count);
    if(reduced.matches||from===to){el.textContent=to+suffix;return;}
    const began=performance.now();
    const step=now=>{const t=Math.min(1,(now-began)/320);el.textContent=Math.round(from+(to-from)*t)+suffix;if(t<1)el._count=requestAnimationFrame(step);};
    el._count=requestAnimationFrame(step);
  }
  let fought=false, backupVia='', pendingMail='', lastPose='', lastKey='', imageRun=0, copyPending=false, transitioning=false, displayedArt='', selectedIndex=characters.keys.indexOf(characters.get());
  const artCache=new Map(), ghost=$('.battle-preview-ghost');
  ghost.addEventListener('animationend',()=>{ghost.hidden=true;});
  const world=$('.battle-world'), far=$('.battle-far'), near=$('.battle-near'), field=$('.battle-field');
  const sparks=particles($('.battle-particles'));
  let scene={key:'',w:0,h:0,floor:0,unit:0,info:null}, sceneQueued=false;
  // The world is painted in cells to fit the screen exactly, with its floor under the boss's feet.
  function measureDash() {
    const jackson=$('.battle-jackson'), enemy=$('.battle-boss');
    // Layout offsets stay stable while the fighters and camera are transformed.
    const dx=enemy.offsetLeft+enemy.offsetWidth/2-jackson.offsetLeft-jackson.offsetWidth/2;
    const dy=enemy.offsetTop+enemy.offsetHeight/2-jackson.offsetTop-jackson.offsetHeight/2;
    const gap=Math.max(0,dx-(jackson.offsetWidth+enemy.offsetWidth)*.3);
    game.style.setProperty('--dash-x',gap+'px');
    game.style.setProperty('--dash-y',dy+'px');
    game.style.setProperty('--boss-dash-x',-gap+'px');
    game.style.setProperty('--boss-dash-y',-dy+'px');
  }
  function paintWorld() {
    sceneQueued=false;
    if(game.hidden||!game.offsetWidth)return;
    measureDash();
    const unit=game.offsetWidth>=900?4:3;
    const w=Math.ceil(world.offsetWidth/unit), h=Math.ceil(world.offsetHeight/unit);
    const bossEl=$('.battle-boss');
    const stageEl=$('.battle-stage');
    const feet=field.offsetTop+stageEl.offsetTop+bossEl.offsetTop+bossEl.offsetHeight*.92-world.offsetTop;
    const floor=Math.round(feet/unit)-2;
    const key=engine.state.key;
    world.style.setProperty('--wo',`${field.offsetLeft+field.offsetWidth/2-world.offsetLeft}px ${field.offsetTop+field.offsetHeight/2-world.offsetTop}px`);
    if(scene.key===key&&scene.w===w&&scene.h===h&&scene.floor===floor)return;
    const info=paintScene(far,near,key,w,h,floor);
    [far,near,$('.battle-particles')].forEach(c=>{c.style.width=w*unit+'px';c.style.height=h*unit+'px';});
    game.dataset.dark=String(info.dark);
    if(scene.key!==key||scene.w!==w||scene.h!==h)sparks.configure(info,w,h);
    scene={key,w,h,floor,unit,info};
  }
  const hero=mount.closest('.game-hero')||mount, selectFar=$('.battle-select-far'), selectNear=$('.battle-select-near');
  let selectScene={key:'',w:0,h:0,floor:0}, selectQueued=false;
  // The select screen stands the chosen Jackson in his own world, tinted by his colour.
  function paintSelectWorld() {
    selectQueued=false;
    if($('.battle-select').hidden||!hero.offsetWidth)return;
    const unit=hero.offsetWidth>=900?4:3;
    const w=Math.ceil(hero.offsetWidth/unit), h=Math.ceil(hero.offsetHeight/unit);
    const spot=$('.battle-preview-stage').getBoundingClientRect(), top=hero.getBoundingClientRect().top;
    const floor=Math.max(20,Math.round((spot.bottom-top)/unit)-3), key=engine.state.key;
    if(selectScene.key===key&&selectScene.w===w&&selectScene.h===h&&selectScene.floor===floor)return;
    paintScene(selectFar,selectNear,key,w,h,floor);
    [selectFar,selectNear].forEach(c=>{c.style.width=w*unit+'px';c.style.height=h*unit+'px';});
    selectScene={key,w,h,floor};
  }
  function queueSelectWorld(){if(!selectQueued){selectQueued=true;requestAnimationFrame(paintSelectWorld);}}
  function queueWorld(){if(!sceneQueued){sceneQueued=true;requestAnimationFrame(paintWorld);}}
  let lastTick=0;
  function tick(now) {
    requestAnimationFrame(tick);
    if(reduced.matches||game.hidden||engine.clock.blocks.size>0||engine.state.paused)return;
    if(now-lastTick<45)return;
    lastTick=now;sparks.step();
  }
  requestAnimationFrame(tick);
  function sparkAt(target, colours) {
    if(reduced.matches||!scene.unit)return;
    const el=target.getBoundingClientRect(), base=world.getBoundingClientRect();
    sparks.burst((el.left+el.width/2-base.left)/scene.unit,(el.top+el.height*.45-base.top)/scene.unit,colours);
  }
  function transition(swap) {
    if(transitioning)return;
    if(reduced.matches){swap();return;}
    transitioning=true;
    const wipe=$('.battle-wipe');wipe.className='battle-wipe battle-wipe-in';
    setTimeout(()=>{swap();wipe.className='battle-wipe battle-wipe-out';setTimeout(()=>{wipe.className='battle-wipe';transitioning=false;},360);},280);
  }
  let onScreen=true, focused=document.hasFocus();
  const who=(entry)=>entry.actor==='jackson'?'Jackson':FIGHTS[engine.state.key].boss;
  const endMark=name=>/[.…!?]$/.test(name)?'':'.';
  function lineText(entry) {
    return `${entry.actor?who(entry)+' used ':''}${entry.name}${endMark(entry.name)}${entry.text?' '+entry.text:''}`;
  }
  function paintLine(el, entry) {
    el.replaceChildren();
    if(!entry)return;
    if(entry.actor)el.append(document.createTextNode(`${who(entry)} used `));
    const strong=document.createElement('strong');strong.textContent=entry.name+endMark(entry.name);el.append(strong);
    if(entry.text)el.append(document.createTextNode(' '+entry.text));
  }
  function projectLink(experience, key) {
    const url=new URL(experience.href,location.href);url.searchParams.set('c',key);
    return url.pathname+url.search+url.hash;
  }
  function environment() {
    engine.clock.block('offscreen',!onScreen);
    engine.clock.block('hidden',document.hidden);
    engine.clock.block('unfocused',!focused);
    game.classList.toggle('battle-suspended',engine.clock.blocks.size>0);
    mount.classList.toggle('selection-suspended',engine.clock.blocks.size>0);
  }
  // Keep all nine decoded images alive. Switching reuses the ready artwork synchronously.
  function prepareArt(char, priority='low') {
    if(artCache.has(char.art))return artCache.get(char.art);
    const candidate=new Image();candidate.decoding='async';candidate.fetchPriority=priority;
    const entry={image:candidate,ready:false,promise:null};
    artCache.set(char.art,entry);
    entry.promise=new Promise(resolve=>{
      const failed=()=>{artCache.delete(char.art);resolve(false);};
      candidate.onerror=failed;
      candidate.onload=async()=>{
        try {await candidate.decode();} catch {if(!candidate.naturalWidth){failed();return;}}
        entry.ready=true;resolve(true);
      };
      candidate.src=char.art;
    });
    return entry;
  }
  function loadArt(char) {
    const run=++imageRun, entry=prepareArt(char,'high'), stage=$('.battle-preview-stage');
    const show=()=>{
      if(run!==imageRun)return;
      ghost.hidden=true;
      if(displayedArt&&displayedArt!==char.art&&!reduced.matches){ghost.src=displayedArt;ghost.hidden=false;}
      [img,previewImg,introImg].forEach(el=>{el.src=char.art;el.style.visibility='visible';});
      displayedArt=char.art;stage.classList.remove('is-loading');
      replay(stage,'battle-pop');queueWorld();
    };
    if(entry.ready){show();return;}
    // The selected character gets priority if clicked before its preload has finished.
    entry.image.fetchPriority='high';
    stage.classList.add('is-loading');ghost.hidden=true;
    img.style.visibility='hidden';introImg.style.visibility='hidden';
    entry.promise.then(ok=>{
      if(run!==imageRun)return;
      if(ok){show();return;}
      stage.classList.remove('is-loading');previewImg.style.visibility='hidden';displayedArt='';
      $('.battle-stage-note').textContent='Jackson is here in spirit.';
    });
  }
  function draw(s, event) {
    const fight=FIGHTS[s.key], char=characters.characters[s.key];
    const hadFocus=game.contains(document.activeElement);
    const playing=s.phase!=='select';
    mount.dataset.screen=playing?'playing':'select';
    document.body.classList.toggle('is-playing',playing);
    game.hidden=!playing;$('.battle-select').hidden=playing;
    Object.assign(game.dataset,{phase:s.phase,stage:s.stage,actor:s.actor||'',fighter:s.key,critical:String(Boolean(s.critical)),paused:String(s.paused),hurt:String(s.damage>0),interactive:String(s.interactive),quick:String(Boolean(s.quick))});
    if(event==='reset') {
      copyPending=false;copyStatus.textContent='';
      $('.battle-announcement').textContent='';$('.battle-stage-note').textContent='';
      const nextIndex=characters.keys.indexOf(s.key);
      $('.battle-preview-stage').style.setProperty('--swap-direction',nextIndex<selectedIndex?-1:1);
      selectedIndex=nextIndex;
      loadArt(char);
      drawProp($('.battle-prop'),s.key);
      drawBoss($('.battle-intro-boss'),s.key,'idle');drawBoss($('.battle-select-shadow'),s.key,'idle');queueSelectWorld();replay($('.battle-vs-stage'),'battle-pop');
      $('#battle-boss-name').textContent=fight.boss;
      $('#battle-boss-level').textContent=fight.level;
      $('#battle-subtitle').textContent=fight.subtitle;$('#battle-subtitle').hidden=!fight.subtitle;
      $('#battle-jackson-name').textContent=char.n;
      $('.battle-vs-name').textContent=fight.boss;
      $('.battle-vs-level').textContent=fight.level||fight.subtitle;
      $('.battle-selected-name').textContent=char.n;
      $('.battle-select').dataset.fighter=s.key;
      $('.battle-intro-boss-name').textContent=fight.boss;
      replay($('.battle-preview-copy'),'battle-copy-enter');
      $('.battle-loadout').textContent=LOADOUT[s.key];
      $('[data-action="email"]').href=mailHref(s.key);
      radios.forEach(r=>{r.checked=r.value===s.key;});
      const options=$('.battle-move-options');options.replaceChildren();
      fight.moves.forEach((move,index)=>{
        if(move.actor!=='jackson')return;
        const button=document.createElement('button');button.type='button';button.className='battle-move';button.dataset.move=index;
        const name=document.createElement('strong');name.textContent=move.name;
        const detail=document.createElement('span');detail.textContent=move.experience?.text||'Worth a try.';
        const shortcut=document.createElement('kbd');shortcut.textContent=String(index/2+1);shortcut.setAttribute('aria-hidden','true');
        button.append(name,detail,shortcut);button.addEventListener('click',()=>pickMove(index));options.append(button);
      });
    }
    for(const [side,hp] of [['jackson',s.jhp],['boss',s.bhp]]) {
      $(`#battle-${side}-meter`).value=hp;
      const track=$(`#battle-${side}-track`);
      track.style.setProperty('--health',hp+'%');
      track.style.setProperty('--health-colour',hp<=20?'#ad343c':hp<=60?'#a97926':'#3e7654');
    }
    if(event==='reset'){$('#battle-jackson-hp').dataset.value=s.jhp;$('#battle-boss-hp').dataset.value=s.bhp;}
    countTo($('#battle-jackson-hp'),s.jhp,'/100');countTo($('#battle-boss-hp'),s.bhp);
    const pose=s.stage==='ko'?'defeated':s.stage==='windup'&&s.actor==='boss'?'attack':s.stage==='impact'&&s.actor==='jackson'?'hit':'idle';
    if(lastPose!==pose||lastKey!==s.key){drawBoss(boss,s.key,pose);lastPose=pose;lastKey=s.key;}
    if(event==='victory'&&pendingMail){
      const href=pendingMail, run=s.run;pendingMail='';
      setTimeout(()=>{if(engine.state.run===run)window.location.href=href;},650);
    }
    if(event==='reset'){backupVia='';pendingMail='';}
    if(event==='impact'||event==='victory') {
      const target=$((s.actor==='boss'?'.battle-jackson':'.battle-boss')+' .battle-impact');
      target.textContent=s.damage>0?`−${s.damage}${s.critical?'!':''}`:'MISS';
      replay(target,'battle-float');
      if(s.damage>0){
        const hitEl=$(s.actor==='boss'?'.battle-jackson':'.battle-boss');
        replay(hitEl.querySelector('.battle-burst'),'battle-bursting');
        sparkAt(hitEl,s.actor==='boss'?['#ad343c','#fbfbfa','#292a2c']:[scene.info?.tint||'#292a2c','#fbfbfa','#e3b341']);
      }
      const callout=$('.battle-callout');
      callout.textContent=event==='victory'?(s.outcome==='leave'?'SOMEHOW':'BACKUP ARRIVED'):s.actor==='jackson'?(s.damage===0?'MISSED':s.damage>=30?'GOOD HIT':'COMBO ×2'):CALLOUTS[s.index-1];
      callout.dataset.tone=event==='victory'?'win':s.critical?'big':s.damage>0&&s.actor==='jackson'?'good':'bad';
      replay(callout,'battle-calling');
      if(s.critical||event==='victory'){const flash=$('.battle-flash');flash.dataset.tone=s.critical?'red':'white';replay(flash,'battle-flashing');}
    }
    const isBackup=s.phase==='backup', isDone=s.phase==='done';
    const choosing=s.phase==='fight'&&s.stage==='choice';
    backup.hidden=!isBackup;result.hidden=!isDone;$('.battle-log-panel').hidden=isBackup||isDone||choosing;
    $('.battle-moves').hidden=!choosing;
    $('.battle-moves-count').textContent=`${s.usedMoves.length} / 3 used`;
    mount.querySelectorAll('.battle-move').forEach(button=>{
      const used=s.usedMoves.includes(Number(button.dataset.move));
      button.disabled=used;button.classList.toggle('is-used',used);
      button.querySelector('kbd').textContent=used?'✓':String(Number(button.dataset.move)/2+1);
    });
    if(s.phase==='intro') {
      current.textContent=`${char.n} versus ${fight.boss}.`;
      previous.textContent='';
    } else {
      paintLine(current,s.log.at(-1));paintLine(previous,s.log.at(-2));
    }
    $('.battle-turn-label').textContent=s.phase==='intro'?'THE MATCH':s.phase==='finishing'?'THE FINISH':`TURN ${s.index} OF 6`;
    const canPause=['intro','fight','finishing'].includes(s.phase);
    pause.hidden=!canPause;pauseMenu.hidden=!(canPause&&s.paused);
    $('.battle-command').inert=s.paused;$('.battle-topline').inert=s.paused;
    $('.battle-round').textContent=isBackup?'1 HP LEFT':isDone?'FIGHT OVER':s.phase==='finishing'?'FINISH HIM':'ROUND 1';
    if(isDone) {
      $('.battle-result-title').textContent=`${fight.boss} defeated.`;
      $('.battle-result-line').textContent=s.outcome==='leave'?'Jackson will be fine. Probably.':'The HP was made up. The email address isn’t.';
      const notes={email:'If your email didn’t open, use Email Jackson below.',copy:`Copied ${EMAIL}.`};
      $('.battle-result-note').textContent=notes[backupVia]||'';$('.battle-result-note').hidden=!notes[backupVia];
      $('.battle-achievement').textContent=fight.achievement;$('.battle-achievement').hidden=!fight.achievement;
      $('.battle-used').open=window.matchMedia('(min-width: 640px)').matches;
      const list=$('.battle-used ul');list.replaceChildren();
      fight.moves.filter(m=>m.experience).forEach(m=>{
        const li=document.createElement('li'), a=document.createElement('a');
        a.href=projectLink(m.experience,s.key);
        const name=document.createElement('strong');name.textContent=m.name;
        const text=document.createElement('span');text.textContent=m.experience.text;
        a.append(name,text);li.append(a);list.append(li);
      });
    }
    $('.battle-stage-note').textContent=s.stage==='ko'&&s.key==='operator'?'fade + knee':s.stage==='ko'&&s.key==='researcher'&&s.outcome!=='leave'?'No PFAS in the recipe':s.stage==='ko'&&s.key==='rider'&&s.outcome!=='leave'?'GO TIGGY':'';
    if(event==='start')$('.battle-announcement').textContent=`Jackson versus ${fight.boss}.`;
    if(event==='line'){
      replay($('.battle-log-panel'),'battle-dialogue-enter');
      $('.battle-announcement').textContent=lineText(s.log.at(-1));
      if(s.log.at(-1).actor==='jackson')drawProp($('.battle-prop'),s.key,s.phase==='finishing'?7:s.activeMove+1);
    }
    if(event==='choice'){
      const previousMove=s.log.at(-1);
      $('#battle-choice-context').textContent=`${previousMove?lineText(previousMove)+' ':''}Jackson has ${s.jhp} HP. ${fight.boss} has ${s.bhp} HP.`;
      const remaining=fight.moves.filter((m,i)=>m.actor==='jackson'&&!s.usedMoves.includes(i)).map(m=>m.name).join(', ');
      $('.battle-announcement').textContent=`Pick a move: ${remaining}. Or let Jackson choose.`;
      if(hadFocus)$('.battle-moves-heading h2').focus({preventScroll:true});
    }
    if(event==='backup'){
      replay(backup,'battle-panel-enter');
      $('.battle-announcement').textContent='Jackson has 1 HP left and needs backup. Send backup by email, copy his email, find him on LinkedIn, or leave him to it.';
      if(hadFocus)$('.battle-call-heading h2').focus({preventScroll:true});
    }
    if(event==='done'){
      replay(result,'battle-panel-enter');
      $('.battle-announcement').textContent=`${fight.boss} defeated. ${$('.battle-result-line').textContent} ${fight.achievement}`;
      if(hadFocus)$('.battle-result-title').focus({preventScroll:true});
    }
    environment();
    if(playing)queueWorld();else queueSelectWorld();
  }
  const engine=new BattleEngine(draw);
  if('ResizeObserver' in window){new ResizeObserver(queueWorld).observe(game);new ResizeObserver(queueSelectWorld).observe(hero);}
  characters.keys.forEach(key=>{
    const label=document.createElement('label');label.className='battle-face';
    label.style.setProperty('--fighter-colour',characters.characters[key].hex);
    const radio=document.createElement('input');radio.type='radio';radio.name='battle-character';radio.value=key;
    const face=document.createElement('img');face.src=`assets/face-${key}.webp`;face.width=240;face.height=240;face.alt='';face.loading='eager';
    const name=document.createElement('span');name.textContent=characters.characters[key].n;
    radio.addEventListener('change',()=>{if(radio.checked)characters.set(key);});
    radio.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();start.click();}});
    label.append(radio,face,name);$('.battle-roster').append(label);radios.push(radio);
  });
  const toTop=()=>window.scrollTo({top:0,behavior:'instant'});
  start.addEventListener('click',()=>{
    if(engine.state.phase!=='select'||transitioning)return;
    transition(()=>{
      if(engine.state.phase!=='select')return;
      document.body.classList.add('has-played');
      engine.start(fought,true);fought=true;toTop();
      current.focus({preventScroll:true});
    });
  });
  function choose() {
    transition(()=>{
      engine.reset(characters.get());toTop();
      radios.find(r=>r.checked)?.focus({preventScroll:true});
    });
  }
  pause.addEventListener('click',()=>{
    if(engine.state.paused)return;
    engine.pause();$('.battle-pause-title').focus({preventScroll:true});
  });
  $('[data-action="resume"]').addEventListener('click',()=>{
    if(!engine.state.paused)return;
    engine.pause();pause.focus({preventScroll:true});
  });
  $('[data-action="choose"]').addEventListener('click',choose);
  function pickMove(index){if(!engine.chooseMove(index))return false;current.focus({preventScroll:true});return true;}
  $('[data-action="watch"]').addEventListener('click',()=>{if(engine.watch())current.focus({preventScroll:true});});
  mount.addEventListener('keydown',event=>{
    if(!event.repeat&&!event.altKey&&!event.ctrlKey&&!event.metaKey&&/^[123]$/.test(event.key)&&engine.state.stage==='choice'&&!event.target.closest('input,textarea,select,[contenteditable="true"]')){
      if(pickMove((Number(event.key)-1)*2))event.preventDefault();
    }
    if(event.key==='Escape'&&engine.state.paused){event.preventDefault();$('[data-action="resume"]').click();}
  });
  function support(via) {
    if(engine.state.phase!=='backup')return;
    backupVia=via;
    engine.finish('supported');current.focus({preventScroll:true});
  }
  $('[data-action="leave"]').addEventListener('click',()=>{
    if(engine.state.phase!=='backup')return;
    engine.finish('leave');current.focus({preventScroll:true});
  });
  // Email plays the win first, then opens the draft once the knockout lands.
  $('[data-action="email"]').addEventListener('click',event=>{
    if(engine.state.phase!=='backup')return;
    event.preventDefault();
    pendingMail=event.currentTarget.href;
    if(reduced.matches){const href=pendingMail;pendingMail='';support('email');window.location.href=href;return;}
    support('email');
  });
  $('.battle-address').addEventListener('click',()=>support('email'));
  $('[data-action="linkedin"]').addEventListener('click',()=>support('linkedin'));
  $('[data-action="copy"]').addEventListener('click',async()=>{
    if(copyPending||engine.state.phase!=='backup')return;
    copyPending=true;const run=engine.state.run;
    try {
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(EMAIL);
      if(engine.state.run!==run||engine.state.phase!=='backup')return;
      copyStatus.textContent=`Copied ${EMAIL}.`;support('copy');
    } catch {
      if(engine.state.run===run&&engine.state.phase==='backup')copyStatus.textContent='Couldn’t copy. The address is above.';
    } finally {if(engine.state.run===run)copyPending=false;}
  });
  $('[data-action="again"]').addEventListener('click',choose);
  window.addEventListener('blur',()=>{focused=false;environment();});
  window.addEventListener('focus',()=>{focused=true;environment();});
  document.addEventListener('visibilitychange',environment);
  const motionChange=()=>game.classList.toggle('battle-reduced',reduced.matches);
  reduced.addEventListener('change',motionChange);motionChange();
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{
    onScreen=entries[0].isIntersecting;environment();
  }).observe(mount);
  characters.subscribe(key=>engine.reset(key));
  engine.reset(characters.get());
  characters.keys.forEach(key=>prepareArt(characters.characters[key]));
}
