// Hand drawn on a 48 × 48 logical grid. No remote art, textures or frame loop.
const INK = '#292a2c', PAPER = '#fbfbfa', LIGHT = '#e2e4de';
export function drawBoss(canvas, key, pose = 'idle') {
  const c = canvas.getContext('2d');
  c.clearRect(0, 0, 48, 48);
  c.imageSmoothingEnabled = false;
  const rect = (x,y,w,h,col=INK) => { c.fillStyle=col; c.fillRect(x,y,w,h); };
  const box = (x,y,w,h,col) => {rect(x,y,w,h);rect(x+1,y+1,w-2,h-2,col);};
  const line = (points,col=INK) => {
    for(let i=1;i<points.length;i++) {
      const [x,y]=points[i-1], [nx,ny]=points[i], n=Math.max(Math.abs(nx-x),Math.abs(ny-y));
      for(let j=0;j<=n;j++)rect(Math.round(x+(nx-x)*j/(n||1)),Math.round(y+(ny-y)*j/(n||1)),1,1,col);
    }
  };
  const eyes = (x,y) => {
    [x,x+10].forEach(ex => {rect(ex,y,6,5,PAPER);rect(ex+2,y+2,2,2);rect(ex,y,6,pose==='hit'?3:2);});
  };
  const hit=pose==='hit', attack=pose==='attack', done=pose==='defeated';
  const gold='#c4a56a', red='#b23a48', green='#537b69', blue='#6a859d';

  switch(key) {
    case 'allrounder': {
      if(done) {
        box(9,30,28,12,PAPER);rect(9,31,28,2,LIGHT);
        box(13,35,4,4,PAPER);rect(20,36,12,1,green);break;
      }
      const bottom=attack?46:40;
      box(13,4,23,bottom-4,PAPER);rect(30,5,5,5,LIGHT);
      for(let y=13;y<bottom-5;y+=7) {
        box(17,y,4,4,PAPER);rect(24,y+1,8,1,blue);
        if(y===13)line([[17,14],[18,16],[21,12]],green);
      }
      box(7,bottom-6,23,6,PAPER);rect(8,bottom-5,21,1,LIGHT);
      if(hit)rect(25,20,10,2,green);
      break;
    }
    case 'master': {
      [[4,19],[8,14],[12,9]].forEach(([x,y],i)=>box(x,y,29,26-i*2,[blue,LIGHT,PAPER][i]));
      for(let y=15;y<29;y+=4)rect(17,y,18,1,blue);
      if(attack){box(3,2,10,7,PAPER);box(35,1,11,6,PAPER);rect(5,4,6,1,blue);}
      if(hit){box(1,31,12,9,PAPER);line([[4,34],[10,36]],blue);}
      if(done){rect(10,8,5,34,green);box(21,19,17,10,red);line([[25,23],[28,26],[34,21]],PAPER);}
      break;
    }
    case 'researcher': {
      if(done) {
        box(6,18,21,24,PAPER);rect(10,22,12,1,blue);rect(10,26,9,1,blue);
        rect(13,30,2,8);rect(13,30,6,2);rect(13,33,5,2);
        line([[10,39],[22,29]],red);
        // A fragment leaving frame remains recognisably intact, never shattered.
        rect(43,30,5,11,green);rect(44,28,4,2,green);break;
      }
      const edge=attack?3:7;
      rect(15,13,18,3);rect(10,16,28,5);rect(edge,21,48-edge*2,18);rect(edge+3,39,42-edge*2,3);
      rect(15,15,18,3,green);rect(11,18,26,4,green);rect(edge+2,22,44-edge*2,16,green);
      rect(edge+4,38,40-edge*2,2,green);rect(14,20,6,2,LIGHT);
      eyes(16,25);line([[22,34],[28,34],[30,32]]);
      rect(12,33,1,5,PAPER);rect(12,33,4,1,PAPER);rect(12,35,3,1,PAPER);
      break;
    }
    case 'builder': {
      if(done) {
        rect(1,33,46,3,gold);line([[3,36],[10,44],[17,36],[24,44],[31,36],[38,44],[45,36]],gold);
        rect(3,35,2,10);rect(43,35,2,10);
      }
      const y=done?6:attack?15:17;
      line([[35,y+5],[37,y-9],[40,y-12]]);
      box(16,y,16,11,blue);rect(23,y+1,2,9);box(5,y+10,38,10,red);
      rect(6,y+14,36,2,gold);rect(5,y+11,4,3,PAPER);
      [10,31].forEach(x=>{box(x,y+17,9,9,INK);rect(x+3,y+20,3,3,hit?red:LIGHT);if(attack)rect(x+2,y+21,5,1,PAPER);});
      break;
    }
    case 'operator': {
      rect(18,3,12,4);box(9,7,30,38,PAPER);
      rect(13,37,21,1,blue);rect(13,13,1,25,blue);
      line(done?[[15,16],[23,17],[27,20],[30,27],[34,34]]:[[15,16],[23,17],[28,19],[30,attack?30:25],[34,36]],green);
      if(done){line([[15,23],[23,24],[34,26]],gold);line([[15,28],[26,28],[30,31],[34,36]],red);}
      if(hit)box(26,17,6,6,red);
      break;
    }
    case 'creator': {
      box(12,3,24,42,INK);rect(15,7,18,31,done?'#41454a':blue);
      rect(21,40,6,2,LIGHT);rect(21,4,6,1,LIGHT);
      if(!done) {
        [10,14,31,35].forEach(y=>{rect(17,y+(attack?1:0),11,1,LIGHT);});
        rect(16,19,16,8,PAPER);rect(19,17,10,12,PAPER);
        rect(hit?18:attack?25:22,20,5,6,red);rect(hit?19:attack?26:23,22,2,3);
      } else {rect(22,19,3,7,LIGHT);line([[19,21],[18,24],[20,27],[27,27],[29,24],[28,21]],LIGHT);}
      break;
    }
    case 'rider': {
      const brick=(x,y,w=12)=>{box(x,y,w,7,red);rect(x+1,y+1,w-2,1,gold);};
      if(done){brick(2,37,15);brick(17,37,15);brick(32,37,14);brick(17,30,15);break;}
      for(let y=14;y<42;y+=7){
        brick(3,y,14);brick(17,y,14);brick(31,y,14);
      }
      rect(3,13,42,1);brick(17,attack?5:7,14);
      if(hit)line([[25,17],[22,21],[26,25],[23,31],[27,35]],PAPER);
      break;
    }
    case 'wanderer': {
      box(18,5,12,9,PAPER);rect(21,8,6,6,PAPER);
      box(6,14,36,27,blue);rect(9,41,5,4);rect(34,41,5,4);
      rect(13,15,3,25,gold);rect(32,15,3,25,gold);
      const zip=attack?23:done?25:22;
      rect(7,zip,34,2);rect(23,zip-1,3,4,gold);
      if(!done){rect(8,zip+2,32,attack?6:3,PAPER);rect(19,zip+2,11,attack?7:4,red);}
      else {rect(26,26,7,12,red);rect(30,34,7,4,red);}
      if(hit)line([[9,18],[5,22],[8,26]],gold);
      break;
    }
    case 'skier': {
      rect(0,3,48,2);rect(26,1,3,4,gold);
      if(done){rect(43,5,2,15);box(37,20,11,16,blue);rect(35,36,13,3);break;}
      const x=attack?4:0;
      rect(25+x,5,2,14);line([[25+x,18],[13+x,23],[13+x,37]]);
      box(13+x,22,24,12,blue);rect(13+x,34,25,3);rect(36+x,25,2,12);
      line([[14+x,24],[35+x,24],[39+x,30],[39+x,36]]);
      if(hit){rect(7,12,3,3,LIGHT);rect(37,14,3,3,LIGHT);rect(21,39,3,3,LIGHT);}
      break;
    }
  }
}

// Small tangible objects accompany Jackson's attack instead of remirroring his sprite.
export function drawProp(canvas, key, moveIndex=1) {
  const c=canvas.getContext('2d');c.clearRect(0,0,16,16);
  const r=(x,y,w,h,col=INK)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
  if(key==='builder') {
    if(moveIndex===1){
      r(1,4,4,1,'#2a6f9e');r(0,8,5,1,'#2a6f9e');r(1,12,4,1,'#2a6f9e');
      r(7,2,7,12);r(8,3,5,10,'#ba6c32');r(6,6,9,4);r(9,4,3,8);r(10,7,1,2,PAPER);
    } else if(moveIndex===3){
      r(3,4,10,9);r(4,5,8,7,'#c4a56a');r(4,6,2,2,PAPER);r(10,6,2,2,PAPER);
      r(1,8,2,6);r(13,8,2,6);r(7,1,1,3);
    } else if(moveIndex===5){
      r(1,10,14,3);r(3,13,10,2);r(5,5,7,5,'#c4a56a');r(6,3,6,2,'#6a859d');
    } else {r(1,6,14,2,'#c4a56a');r(2,8,2,7);r(12,8,2,7);r(5,9,6,2,'#c4a56a');}
    return;
  }
  if(moveIndex===3&&(key==='allrounder'||key==='rider')){
    [2,9].forEach(x=>{r(x,2,3,3);r(x,6,4,5,'#a85414');r(x,11,1,4);r(x+3,11,1,3);});return;
  }
  switch(key) {
    case 'allrounder':
      r(2,2,5,5);r(2,2,2,2,PAPER);r(6,6,3,3);r(8,8,3,3);r(10,10,4,4);r(11,11,2,2,PAPER);break;
    case 'researcher':
      r(7,2,2,3);r(5,5,6,3);r(3,8,10,5);r(5,13,6,2);r(5,8,6,5,'#137975');r(5,8,2,2,PAPER);break;
    case 'creator':r(2,3,10,10);r(5,6,4,4,PAPER);r(12,6,3,5);break;
    case 'rider':r(4,2,6,10,'#a85414');r(2,11,12,3);r(2,14,12,1,PAPER);break;
    case 'wanderer':r(2,3,12,10);r(3,4,10,8,PAPER);r(5,6,6,1,'#6f5aa8');r(5,9,4,1,'#6f5aa8');break;
    case 'skier':r(4,1,2,12);r(10,1,2,12);r(4,13,4,2);r(10,13,4,2);break;
    default:r(3,1,10,14);r(4,2,8,12,PAPER);r(6,5,4,1);r(6,8,4,1);r(6,11,3,1);
  }
}
