import {FIGHTS, LOADOUT, EMAIL, LINKEDIN, mailHref} from './battle-data.mjs?v=5';
import {BattleEngine} from './battle-engine.mjs?v=7';
import {drawBoss, drawProp} from './battle-art.mjs?v=5';
import {paintScene, particles} from './battle-scenes.mjs?v=5';

export function mountBattle(mount, characters) {
  mount.innerHTML=`
    <canvas class="battle-select-shadow" width="64" height="64" aria-hidden="true"></canvas>
    <div class="battle-wipe" aria-hidden="true"></div>
    <div class="battle-select">
      <div class="battle-character-preview">
        <span class="battle-selection-tag">PLAYER 01</span>
        <div class="battle-preview-stage"><img width="537" height="840" alt="" decoding="async"><img class="battle-preview-ghost" width="537" height="840" alt="" aria-hidden="true" hidden></div>
        <div class="battle-preview-copy"><h2 class="battle-selected-name"></h2><p class="battle-loadout"></p></div>
      </div>
      <div class="battle-select-controls">
        <fieldset class="battle-picker"><legend>Choose your character</legend><div class="battle-roster"></div></fieldset>
        <div class="battle-vs"><span class="battle-vs-badge" aria-hidden="true">VS</span><canvas width="64" height="64" aria-hidden="true"></canvas><p><span class="battle-vs-label">Up against</span><strong class="battle-vs-name"></strong><span class="battle-vs-level"></span></p></div>
        <button type="button" class="battle-start" data-action="start">Start fight <span aria-hidden="true">▶</span></button>
        <p class="battle-select-help"><span>Pick a Jackson. He does the fighting.</span><span class="battle-key-hint"><kbd>←</kbd><kbd>→</kbd> choose <kbd>Enter</kbd> start</span></p>
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
        <div class="battle-log-panel">
          <p class="battle-turn-label">THE MATCH</p>
          <p class="battle-current" tabindex="-1"></p>
          <p class="battle-previous"></p>
        </div>
        <div class="battle-backup" hidden>
          <div class="battle-call-heading"><h2 tabindex="-1">Jackson needs backup</h2><span class="battle-one">1 HP</span></div>
          <div class="battle-menu">
            <a class="battle-choice battle-choice-main" data-action="email"><span aria-hidden="true">✉</span> Send backup</a>
            <button type="button" class="battle-choice" data-action="copy"><span aria-hidden="true">⧉</span> Copy email</button>
            <a class="battle-choice" href="${LINKEDIN}" data-action="linkedin" target="_blank" rel="noopener"><span aria-hidden="true">in</span> LinkedIn</a>
            <button type="button" class="battle-choice battle-choice-leave" data-action="leave">Leave him to it</button>
          </div>
          <p class="battle-hint">Send backup opens your email with a message you can edit. Or write to <a class="battle-address" href="mailto:${EMAIL}">${EMAIL}</a></p>
          <p class="battle-copy-status" role="status"></p>
        </div>
        <div class="battle-result" hidden>
          <span class="battle-turn-label">FIGHT OVER</span>
          <h2 class="battle-result-title" tabindex="-1"></h2>
          <p class="battle-result-line"></p>
          <p class="battle-achievement"></p>
          <div class="battle-result-actions"><button type="button" class="battle-button battle-primary battle-big" data-action="again">↺ Fight again</button><a class="battle-button battle-big" href="mailto:${EMAIL}">✉ Email Jackson</a></div>
          <div class="battle-used"><p class="battle-turn-label">MOVES HE USED, FOR REAL</p><ul></ul></div>
          <p class="battle-disclaimer">The fights are made up. The achievements are real.</p>
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
  let lastPose='', lastKey='', imageRun=0, copyPending=false, transitioning=false, displayedArt='', selectedIndex=characters.keys.indexOf(characters.get());
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
    Object.assign(game.dataset,{phase:s.phase,stage:s.stage,actor:s.actor||'',fighter:s.key,critical:String(Boolean(s.critical)),paused:String(s.paused),hurt:String(s.damage>0)});
    if(event==='reset') {
      copyPending=false;copyStatus.textContent='';
      $('.battle-announcement').textContent='';$('.battle-stage-note').textContent='';
      const nextIndex=characters.keys.indexOf(s.key);
      $('.battle-preview-stage').style.setProperty('--swap-direction',nextIndex<selectedIndex?-1:1);
      selectedIndex=nextIndex;
      loadArt(char);
      drawProp($('.battle-prop'),s.key);
      drawBoss($('.battle-vs canvas'),s.key,'idle');drawBoss($('.battle-intro-boss'),s.key,'idle');drawBoss($('.battle-select-shadow'),s.key,'idle');
      $('#battle-boss-name').textContent=fight.boss;
      $('#battle-boss-level').textContent=fight.level;
      $('#battle-subtitle').textContent=fight.subtitle;$('#battle-subtitle').hidden=!fight.subtitle;
      $('#battle-jackson-name').textContent=char.n;
      $('.battle-vs-name').textContent=fight.boss;
      $('.battle-vs-level').textContent=fight.level||fight.subtitle;
      $('.battle-selected-name').textContent=char.n;
      $('.battle-intro-boss-name').textContent=fight.boss;
      replay($('.battle-preview-copy'),'battle-copy-enter');
      $('.battle-loadout').textContent=LOADOUT[s.key];
      $('[data-action="email"]').href=mailHref(s.key);
      radios.forEach(r=>{r.checked=r.value===s.key;});
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
      callout.textContent=event==='victory'?(s.outcome==='leave'?'SOMEHOW':'BACKUP ARRIVED'):CALLOUTS[s.index-1];
      callout.dataset.tone=event==='victory'?'win':s.critical?'big':s.damage>0&&s.actor==='jackson'?'good':'bad';
      replay(callout,'battle-calling');
      if(s.critical||event==='victory'){const flash=$('.battle-flash');flash.dataset.tone=s.critical?'red':'white';replay(flash,'battle-flashing');}
    }
    const isBackup=s.phase==='backup', isDone=s.phase==='done';
    backup.hidden=!isBackup;result.hidden=!isDone;$('.battle-log-panel').hidden=isBackup||isDone;
    if(s.phase==='intro') {
      current.textContent=`${char.n} versus ${fight.boss}.`;
      previous.textContent='';
    } else {
      paintLine(current,s.log.at(-1));paintLine(previous,s.log.at(-2));
    }
    $('.battle-turn-label').textContent=s.phase==='intro'?'THE MATCH':s.phase==='finishing'?'THE FINISH':`TURN ${s.index} OF 6`;
    const canPause=['intro','fight','finishing'].includes(s.phase);
    pause.hidden=!canPause;pauseMenu.hidden=!(canPause&&s.paused);
    $('.battle-round').textContent=isBackup?'1 HP LEFT':isDone?'FIGHT OVER':s.phase==='finishing'?'FINISH HIM':'ROUND 1';
    if(isDone) {
      $('.battle-result-title').textContent=`${fight.boss} defeated.`;
      $('.battle-result-line').textContent=s.outcome==='leave'?'Jackson will be fine. Probably.':'The HP was made up. The email address isn’t.';
      $('.battle-achievement').textContent=fight.achievement;$('.battle-achievement').hidden=!fight.achievement;
      const list=$('.battle-used ul');list.replaceChildren();
      fight.moves.filter(m=>m.experience).forEach(m=>{
        const li=document.createElement('li'), a=document.createElement('a');
        a.href=projectLink(m.experience,s.key);
        const name=document.createElement('strong');name.textContent=m.name;
        const text=document.createElement('span');text.textContent=m.experience.text;
        a.append(name,text);li.append(a);list.append(li);
      });
    }
    $('.battle-stage-note').textContent=s.stage==='ko'&&s.key==='operator'?'fade + knee':s.stage==='ko'&&s.key==='researcher'&&s.outcome!=='leave'?'No PFAS in the recipe':s.stage==='ko'&&s.key==='rider'&&s.outcome!=='leave'?'GO TIGGY':isBackup?'1 HP. Still here.':'';
    if(event==='start')$('.battle-announcement').textContent=`Jackson versus ${fight.boss}.`;
    if(event==='line'){
      replay($('.battle-log-panel'),'battle-dialogue-enter');
      $('.battle-announcement').textContent=lineText(s.log.at(-1));
      if(s.log.at(-1).actor==='jackson')drawProp($('.battle-prop'),s.key,s.phase==='finishing'?7:s.index);
    }
    if(event==='backup'){
      replay(backup,'battle-panel-enter');
      $('.battle-announcement').textContent='Jackson has 1 HP left. Jackson needs backup. Send backup by email, copy his email, LinkedIn, or leave him to it.';
      if(hadFocus)$('.battle-call-heading h2').focus({preventScroll:true});
    }
    if(event==='done'){
      replay(result,'battle-panel-enter');
      $('.battle-announcement').textContent=`${fight.boss} defeated. ${$('.battle-result-line').textContent} ${fight.achievement}`;
      if(hadFocus)$('.battle-result-title').focus({preventScroll:true});
    }
    environment();
    if(playing)queueWorld();
  }
  const engine=new BattleEngine(draw);
  if('ResizeObserver' in window)new ResizeObserver(queueWorld).observe(game);
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
      engine.start();toTop();
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
  mount.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&engine.state.paused){event.preventDefault();$('[data-action="resume"]').click();}
  });
  function support() {
    if(engine.state.phase!=='backup')return;
    engine.finish('supported');current.focus({preventScroll:true});
  }
  $('[data-action="leave"]').addEventListener('click',()=>{
    if(engine.state.phase!=='backup')return;
    engine.finish('leave');current.focus({preventScroll:true});
  });
  $('[data-action="email"]').addEventListener('click',support);
  $('.battle-address').addEventListener('click',support);
  $('[data-action="linkedin"]').addEventListener('click',support);
  $('[data-action="copy"]').addEventListener('click',async()=>{
    if(copyPending||engine.state.phase!=='backup')return;
    copyPending=true;const run=engine.state.run;
    try {
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(EMAIL);
      if(engine.state.run!==run||engine.state.phase!=='backup')return;
      copyStatus.textContent=`Copied ${EMAIL}.`;support();
    } catch {
      if(engine.state.run===run&&engine.state.phase==='backup')copyStatus.textContent='Couldn’t copy. Select the email address above to copy it yourself.';
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
