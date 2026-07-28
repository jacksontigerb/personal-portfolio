// Character generator v2: the whole figure is the traced reference, and each
// outfit is a per-garment recolour that keeps the reference's own shading.
// Accessories inherit the lightness of whatever they cover, so hats and
// helmets keep the voxel facets of the hair underneath them.
const fs=require("fs"),path=require("path"),zlib=require("zlib");
const {trace}=require("./trace.js");
const T=trace(44), GW=T.GW, GH=T.GH;          // 44x97
const M=9, W2=GW+2*M;                          // side margins for props

// ---- colour helpers ------------------------------------------------------
const hsl=(r,g,b)=>{r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
  let h=0,s=0;const l=(mx+mn)/2;
  if(mx!==mn){const d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);
    h=mx===r?((g-b)/d+(g<b?6:0)):mx===g?((b-r)/d+2):((r-g)/d+4);h/=6;}
  return [h*360,s*100,l*100];};
const rgb=(h,s,l)=>{h=((h%360)+360)%360/360;s/=100;l/=100;
  if(!s){const v=Math.round(l*255);return [v,v,v];}
  const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;
  const f=t=>{if(t<0)t+=1;if(t>1)t-=1;
    if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;
    if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;};
  return [Math.round(f(h+1/3)*255),Math.round(f(h)*255),Math.round(f(h-1/3)*255)];};
const hex2rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const hash=(x,y)=>{let n=x*374761393+y*668265263;n=(n^(n>>13))*1274126177;return ((n^(n>>16))>>>0);};

// ---- PNG writer ----------------------------------------------------------
const CRC=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
function chunk(t,d){const L=Buffer.alloc(4);L.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t,"ascii"),d]);
  const c=Buffer.alloc(4);c.writeUInt32BE(crc32(td));return Buffer.concat([L,td,c]);}
function png(w,h,rgba){const raw=Buffer.alloc(h*(w*4+1));
  for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;rgba.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4);}
  const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ih),
    chunk("IDAT",zlib.deflateSync(raw,{level:9})),chunk("IEND",Buffer.alloc(0))]);}

// ---- garment classification, tuned against an ASCII dump of the trace ----
const warm=(h,s)=>h>=10&&h<=62&&s>=18;
const blue=h=>h>=185&&h<=262;
function classify(x,y,c){
  const [h,s,l]=hsl(...c);
  if(y<=26) return "head";
  if(y>=90&&x>=13&&x<=32) return "shoe";
  if(y>=63&&y<=72&&(x<=12||x>=33)&&warm(h,s)&&l>25) return "hand";
  if(y>=58&&y<=61&&x>=18&&x<=28) return "belt";
  if(y>=66&&y<=89&&((x>=16&&x<=20)||(x>=25&&x<=29))) return "trous";
  if(y>=62&&y<=89&&x>=14&&x<=31&&s<20&&l>=20) return "trous";
  if(y>=28&&y<=54&&x>=20&&x<=26) return "tie";
  if(y>=28&&y<=31&&x>=19&&x<=27) return "tie";
  if(y>=27&&y<=57){
    if(blue(h)&&s>15) return "stoleB";
    if(y>=55&&x>=17&&x<=29&&l>=30) return "shirt";
    if(x>=15&&x<=30){
      if(warm(h,s)) return "shirt";
      if(s<18&&l>=20) return "stoleG";
    }
  }
  return "gown";
}
const ROLE=[],STAT={};
for(let y=0;y<GH;y++){ROLE.push([]);
  for(let x=0;x<GW;x++){const c=T.grid[y][x];
    ROLE[y].push(c?classify(x,y,c):null);
    if(c){const r=ROLE[y][x];(STAT[r]=STAT[r]||[]).push(hsl(...c)[2]);}}}
for(const k in STAT){const a=STAT[k].sort((p,q)=>p-q);
  STAT[k]={lo:a[Math.floor(a.length*0.05)],hi:a[Math.ceil(a.length*0.95)-1]};}

// The reference is wearing a tie, and it is dark enough that recolouring it
// still leaves a tie shape. For the characters that shouldn't have one, each
// tie cell borrows the colour and role of the nearest shirt cell in its row,
// so the whole collar opening shades as a single garment.
const NOTIE=[];
for(let y=0;y<GH;y++){NOTIE.push([]);
  for(let x=0;x<GW;x++){
    if(ROLE[y][x]!=="tie"){NOTIE[y].push(null);continue;}
    let src=null;
    for(let d=1;d<GW&&!src;d++)for(const nx of [x-d,x+d]){
      if(nx<0||nx>=GW)continue;
      const r=ROLE[y][nx];
      if(r==="shirt"||r==="stoleG"){src={c:T.grid[y][nx],r:r};break;}}
    NOTIE[y].push(src);}}

// recolour a cell into a garment target, mapping the reference's own
// lightness range onto the target's range so every fold survives
function remap(c,role,hex,range){
  const [h0,s0,l0]=hsl(...c);
  const {lo,hi}=STAT[role];
  const n=Math.max(0,Math.min(1,(l0-lo)/Math.max(1,hi-lo)));
  const [th,ts]=hsl(...hex2rgb(hex));
  return rgb(th,ts,range[0]+n*(range[1]-range[0]));
}

// ---- overlay painting ----------------------------------------------------
// grid g is W2 wide; figure cells live at x+M. paint() takes figure coords.
const jit=(x,y,amp)=>((hash(x,y)%(2*amp+1))-amp);
const shade=(c,dl)=>{const [h,s,l]=hsl(...c);return rgb(h,s,Math.max(2,Math.min(96,l+dl)));};
function paint(g,x,y,hex,range,litFrom,litTo){
  if(y<0||y>=GH||x+M<0||x+M>=W2)return;
  const u=g[y][x+M];
  const [th,ts]=hsl(...hex2rgb(hex));
  let n;
  if(u&&u.ref){                                  // inherit the voxel shading
    const l=hsl(...u.c)[2];
    n=Math.max(0,Math.min(1,(l-24)/64));
  }else{                                         // synthesise: lit from the left
    const t=litTo>litFrom?Math.max(0,Math.min(1,(x-litFrom)/(litTo-litFrom))):0.5;
    n=0.78-0.5*t+jit(x,y,5)/100;
    n=Math.max(0,Math.min(1,n));
  }
  g[y][x+M]={c:rgb(th,ts,range[0]+n*(range[1]-range[0])),ref:false};
}
const hspan=(g,y,x0,x1,hex,range)=>{for(let x=x0;x<=x1;x++)paint(g,x,y,hex,range,x0,x1);};

// blonde test, so hats can sit on hair and leave the face alone
const isHair=(x,y)=>{const c=T.grid[y]&&T.grid[y][x];if(!c)return false;
  const [h,s,l]=hsl(...c);return h>=28&&h<=64&&s>16&&l>22;};
function capRows(g,toRow,hex,range){          // skull-cap over the hair mass
  for(let y=0;y<=toRow;y++)for(let x=0;x<GW;x++){
    if(!T.grid[y][x])continue;
    if(y<=Math.min(6,toRow)||isHair(x,y))paint(g,x,y,hex,range);}
}

// ---- accessories ---------------------------------------------------------
const ACC={
  // lenses centred on the traced eyes: x17-20 and x25-28, rows 14-18
  specs(g,hex){hex=hex||"#14181C";const F=[4,14];
    [[15,21],[24,30]].forEach(([a,b])=>{
      hspan(g,13,a,b,hex,F);hspan(g,19,a,b,hex,F);
      for(let y=14;y<=18;y++){paint(g,a,y,hex,F);paint(g,b,y,hex,F);}});
    hspan(g,15,22,23,hex,F);
    hspan(g,14,11,14,hex,F);hspan(g,14,31,34,hex,F);},
  glasses(g){ACC.specs(g,"#14181C");},
  labgoggles(g){const F="#B8C4CA";      // clear wraparound safety goggles
    hspan(g,13,13,32,F,[46,70]);hspan(g,19,13,32,F,[36,58]);
    for(let y=14;y<=18;y++){paint(g,13,y,F,[42,62]);paint(g,14,y,F,[50,70]);
      paint(g,31,y,F,[38,56]);paint(g,32,y,F,[30,48]);}
    hspan(g,15,9,12,"#3A4248",[10,22]);hspan(g,15,33,36,"#3A4248",[8,20]);
    for(let y=14;y<=18;y++)for(let x=15;x<=30;x++){   // tinted see-through lens
      const u=g[y][x+M];if(!u)continue;const c=u.c;
      g[y][x+M]={c:[Math.round(c[0]*0.55+200*0.45),
        Math.round(c[1]*0.55+228*0.45),Math.round(c[2]*0.55+238*0.45)],ref:false};}},
  mortar(g){const B="#1A1E24";
    capRows(g,8,B,[6,24]);
    hspan(g,1,4,39,B,[16,30]);hspan(g,2,4,39,B,[4,14]);   // the flat board
    for(let y=0;y<=8;y++)paint(g,37,y,"#C9A24E",[38,62]); // tassel cord
    paint(g,9,37,"#C9A24E",[30,50]);paint(g,9,38,"#C9A24E",[30,50]);
    paint(g,10,37,"#B08A38",[26,42]);},
  hardhat(g){const Y="#E8C63C";
    capRows(g,8,Y,[44,76]);
    hspan(g,9,6,37,Y,[38,60]);hspan(g,10,6,37,Y,[26,40]);},
  brimhat(g){const K="#6B5E42";
    capRows(g,7,K,[24,52]);
    hspan(g,8,5,38,K,[30,48]);hspan(g,9,5,38,K,[16,28]);},
  helmet(g){const H="#262B33";
    for(let y=0;y<=11;y++)for(let x=0;x<GW;x++){
      if(!T.grid[y][x])continue;
      if(y<=7||isHair(x,y))paint(g,x,y,H,[8,34]);}
    hspan(g,12,8,35,H,[6,18]);},
  // the pads that come down over the ears, following the head's own outline.
  // the range is deliberately tight so they stay dark over skin as well as hair
  earpads(g){const H="#20242B";
    for(let y=11;y<=20;y++){
      let mn=99,mx=-1;
      for(let x=0;x<GW;x++)if(T.grid[y]&&T.grid[y][x]){if(x<mn)mn=x;if(x>mx)mx=x;}
      if(mx<0)continue;
      for(let i=-1;i<=1;i++){paint(g,mn+i,y,H,[7,17]);paint(g,mx+i,y,H,[5,14]);}}},
  goggles(g){const F="#14181C";      // mirrored lens, bright top-left
    // a rounded lozenge rather than a rectangle: the ends step in top and bottom
    const SPAN={12:[13,29],13:[11,31],14:[10,32],15:[10,32],16:[10,32],
                17:[11,31],18:[13,29]};
    for(let y=12;y<=18;y++){const [a,b]=SPAN[y];
      if(y===12||y===18){hspan(g,y,a,b,F,[4,10]);continue;}
      paint(g,a,y,F,[4,10]);paint(g,b,y,F,[4,10]);
      for(let x=a+1;x<=b-1;x++){
        const n=Math.max(0,Math.min(1,
          0.95-0.45*((x-11)/21)-0.3*((y-13)/4)+jit(x,y,4)/100));
        // a diagonal sheen, so the lens reads as glass rather than a flat panel
        const s=Math.max(0,1-Math.abs((x-12)-(y-13)*2.6)/4.5);
        g[y][x+M]={c:rgb(193,62,Math.min(72,12+n*46+s*15)),ref:false};}}},
  headphones(g){const B="#1A1E22";
    hspan(g,0,13,29,B,[8,18]);hspan(g,1,11,31,B,[6,16]);
    for(let y=2;y<=10;y++){                    // band hugs the hair outline
      let mn=99,mx=-1;
      for(let x=0;x<GW;x++)if(T.grid[y][x]){if(x<mn)mn=x;if(x>mx)mx=x;}
      if(mx<0)continue;
      paint(g,mn,y,B,[6,14]);paint(g,mn+1,y,B,[8,18]);
      paint(g,mx-1,y,B,[6,14]);paint(g,mx,y,B,[4,12]);}
    [[5,false],[33,true]].forEach(([xs,right])=>{
      for(let y=11;y<=19;y++)for(let i=0;i<5;i++){
        if((y===11||y===19)&&(i===0||i===4))continue;   // rounded corners
        const x=xs+i;
        const shell=right?i===4:i===0, pad=right?i===0:i===4;
        if(shell||pad){g[y][x+M]={c:rgb(210,14,pad?8:14),ref:false};continue;}
        const n=Math.max(0,Math.min(1,
          0.8-0.05*(right?4-i:i)-0.07*(y-11)+jit(x,y,3)/100));
        g[y][x+M]={c:rgb(348,56,16+n*34),ref:false};}});},
  // wider skis, and the topsheet colours run into each other like poured ink
  // rather than sitting in flat bands
  skis(g){
    const LIQ=[[62,127,193],[110,86,205],[177,92,216],[232,85,143],[36,40,48]];
    const mix=t=>{const n=LIQ.length,u=((t%n)+n)%n,i=Math.floor(u),f=u-i,
      a=LIQ[i],b=LIQ[(i+1)%n];
      return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f];};
    const put=(x,y,c)=>{const o=x+M;if(y<0||y>=GH||o<0||o>=W2)return;
      g[y][o]={c:[Math.max(0,Math.min(255,Math.round(c[0]))),
                  Math.max(0,Math.min(255,Math.round(c[1]))),
                  Math.max(0,Math.min(255,Math.round(c[2])))],ref:false};};
    [[-9,-5],[-3,1]].forEach(([x0,x1])=>{
      hspan(g,9,x0+1,x1-1,"#C9D2DA",[50,64]);              // curved tip
      for(let y=10;y<=96;y++){
        for(let x=x0;x<=x1;x++){
          if(y<=13){paint(g,x,y,"#C9D2DA",[36,56],x0,x1);continue;}
          if(y>=50&&y<=54){const top=y===50;               // toe piece
            paint(g,x,y,top?"#8A939E":"#23272E",top?[34,50]:[8,22],x0,x1);continue;}
          if(y>=60&&y<=64){const heel=y===64;              // heel piece
            paint(g,x,y,heel?"#8A939E":"#23272E",heel?[30,46]:[8,22],x0,x1);continue;}
          if(y>=95){paint(g,x,y,"#173F46",[10,22],x0,x1);continue;}
          // the flow: bands drift down the ski, tilted across it and wobbled
          const t=(y-14)*0.21+(x-x0)*0.52+1.3*Math.sin(y*0.13)+0.4*Math.sin(y*0.37);
          const c=mix(t);
          const k=1.14-0.30*((x-x0)/Math.max(1,x1-x0))+jit(x,y,4)/100;  // lit from the left
          put(x,y,[c[0]*k,c[1]*k,c[2]*k]);}}
      for(let y=55;y<=59;y++){paint(g,x0+1,y,"#3A4046",[12,24]);
        paint(g,x0+2,y,"#3A4046",[10,20]);}});},           // binding rail
  surfboard(g){const B="#2E6FB8";
    const y0=30,y1=88,cx=-5;                     // nose at the top, tail down
    for(let y=y0;y<=y1;y++){
      const t=(y-y0)/(y1-y0);
      const hw=Math.round(4*Math.pow(Math.sin(Math.PI*Math.pow(t,0.72)),0.60));
      for(let x=cx-hw;x<=cx+hw;x++)paint(g,x,y,B,[24,52],cx-4,cx+4);}
    for(let y=y0+3;y<=y1-3;y++)paint(g,cx,y,"#EDF2F6",[52,74]);   // stringer
    for(let y=y1-4;y<=y1-1;y++)paint(g,cx+1,y,"#1C4C86",[10,24]);},// fin
  headband(g){for(let y=8;y<=9;y++)for(let x=9;x<=34;x++)
      if(T.grid[y]&&T.grid[y][x])paint(g,x,y,"#EDF2F6",[52,82]);},
};

// A plain jacket. The reference is wearing academic dress, so the stole, the
// shirt front and the tie are separate garments draped over the chest. Folding
// the stole into the jacket and everything inside the collar into one dark top
// loses the drapes and the tie: it reads as a jacket over a plain layer.
function jacket(hex,lo,hi,uHex,uLo,uHi){
  const d=hi-lo;
  return {gown:[hex,[lo,hi]],
    stoleB:[hex,[lo+d*0.22,hi+d*0.06]],      // the shoulders catch the light
    stoleG:[uHex,[uLo,uHi]],
    shirt:[uHex,[uLo,uHi]],
    tie:[uHex,[uLo,uHi]]};
}

// ---- the nine outfits ----------------------------------------------------
// each garment: [hex, [Llo,Lhi]] — hue and saturation from hex, lightness
// remapped from the reference's own range so the shading survives.
// trim:true cuts the jacket off at the hands, so nothing hangs below them
const CHARS=[
 {k:"allrounder",hem:65,o:{gown:["#5A7E96",[16,52]],stoleB:["#C9A24E",[36,68]],
   stoleG:["#B8BEC4",[46,78]],tie:["#C9A24E",[26,52]],trous:["#3A3F45",[16,40]]}},
 {k:"master",o:{},acc:[ACC.mortar]},              // the robe is the point here
 {k:"researcher",hem:78,o:{gown:["#E8EDEE",[56,92]],stoleB:["#CBD4D9",[52,84]],
   stoleG:["#BFC7CC",[46,78]],trous:["#3A3F45",[16,40]],hand:["#5FD3C6",[38,66]]},
   acc:[ACC.labgoggles]},
 {k:"builder",hem:63,trim:true,acc:[ACC.hardhat],
   o:Object.assign(jacket("#33506E",10,44,"#1B1F25",5,20),
     {trous:["#5A6068",[22,48]],shoe:["#6B4A2A",[22,48]]})},
 {k:"operator",hem:63,trim:true,acc:[ACC.glasses],
   o:Object.assign(jacket("#23282E",6,30,"#254236",10,28),
     {trous:["#2E3742",[12,36]],shoe:["#D8DCE0",[42,78]]})},
 {k:"creator",hem:63,trim:true,acc:[ACC.headphones],
   o:Object.assign(jacket("#7A2E3A",10,42,"#1D1F24",5,20),
     {trous:["#2E3338",[12,36]],shoe:["#2A2A2E",[8,28]]})},
 // a wetsuit: same cut, but the whole thing is one black neoprene layer
 {k:"rider",hem:63,trim:true,acc:[ACC.surfboard,ACC.headband],
   o:Object.assign(jacket("#191C21",4,24,"#242A31",8,26),
     {belt:["#1E2228",[6,20]],trous:["#191C21",[4,22]],shoe:["#2A2E34",[8,26]]})},
 {k:"wanderer",hem:63,trim:true,acc:[ACC.brimhat],
   o:Object.assign(jacket("#556B3A",12,44,"#3B3227",9,26),
     {trous:["#77694C",[24,50]],shoe:["#5A4128",[16,42]]})},
 {k:"skier",hem:63,trim:true,acc:[ACC.helmet,ACC.earpads,ACC.goggles,ACC.skis],
   o:Object.assign(jacket("#24548F",8,36,"#17325A",7,22),
     {trous:["#1E2226",[6,26]],shoe:["#2A2E36",[8,30]],hand:["#1E2226",[8,26]]})},
];

// cut the gown into a jacket: below the hem, keep sleeves, hands and shoes,
// turn the freed centre cells into proper separated legs, delete the rest
function derobe(g,spec){
  const tr=spec.o.trous||["#3A3F45",[16,40]];
  // slim the gown to a jacket-width profile, re-lighting the cut edges so
  // the sleeves keep their voxel roundness
  for(let y=30;y<=spec.hem;y++){
    const [lo,hi]=y<40?[6,37]:y<50?[5,38]:[4,39];
    let cutL=false,cutR=false;
    for(let x=0;x<GW;x++){
      if(!g[y][x+M])continue;
      if(x<lo){g[y][x+M]=null;cutL=true;}
      else if(x>hi){g[y][x+M]=null;cutR=true;}
    }
    if(cutL)for(let x=lo;x<=lo+1;x++){const u=g[y][x+M];
      if(u)u.c=shade(u.c,x===lo?8:3);}
    if(cutR)for(let x=hi-1;x<=hi;x++){const u=g[y][x+M];
      if(u)u.c=shade(u.c,x===hi?-9:-4);}
  }
  for(let y=spec.hem+1;y<GH;y++)for(let x=0;x<GW;x++){
    const u=g[y][x+M];if(!u)continue;
    if(y<=71&&(x<=12||x>=33)){                  // sleeve cuffs and hands
      if(x<=4||x>=40){g[y][x+M]=null;continue;} // tucked under slimmed cuffs
      // a hip length jacket stops at the hands: nothing hangs below them
      if(spec.trim&&y>65&&ROLE[y][x]!=="hand")g[y][x+M]=null;
      continue;}
    const leg=(x>=14&&x<=20)||(x>=25&&x<=31);
    if(!leg){g[y][x+M]=null;continue;}
    if(y<90&&ROLE[y][x]==="gown")
      g[y][x+M]={c:remap(T.grid[y][x],"gown",tr[0],tr[1]),ref:true};
  }
}

// ---- compose and write ---------------------------------------------------
const ASSETS=process.env.OUT||path.resolve(__dirname,"../../assets");
function compose(spec){
  const g=[];
  for(let y=0;y<GH;y++){g.push(new Array(W2).fill(null));
    for(let x=0;x<GW;x++){let c=T.grid[y][x];if(!c)continue;
      let r=ROLE[y][x];
      if(spec.trim&&r==="tie"&&NOTIE[y][x]){c=NOTIE[y][x].c;r=NOTIE[y][x].r;}
      const t=spec.o[r];
      g[y][x+M]={c:t?remap(c,r,t[0],t[1]):c.slice(),ref:true};}}
  if(spec.hem)derobe(g,spec);
  (spec.acc||[]).forEach(a=>a(g));
  return g;
}
function writeChar(spec,S,FSC){
  const g=compose(spec);
  const IW=W2*S,IH=GH*S,buf=Buffer.alloc(IW*IH*4);
  for(let y=0;y<GH;y++)for(let x=0;x<W2;x++){const u=g[y][x];if(!u)continue;
    for(let dy=0;dy<S;dy++)for(let dx=0;dx<S;dx++){
      const o=(((y*S+dy)*IW)+(x*S+dx))*4;
      buf[o]=u.c[0];buf[o+1]=u.c[1];buf[o+2]=u.c[2];buf[o+3]=255;}}
  fs.writeFileSync(path.join(ASSETS,`char-${spec.k}.png`),png(IW,IH,buf));
  const FS=38,fx=3+M,fy=0,fw=FS*FSC,fb=Buffer.alloc(fw*fw*4);
  for(let y=0;y<FS;y++)for(let x=0;x<FS;x++){const u=(g[fy+y]||[])[fx+x];if(!u)continue;
    for(let dy=0;dy<FSC;dy++)for(let dx=0;dx<FSC;dx++){
      const o=(((y*FSC+dy)*fw)+(x*FSC+dx))*4;
      fb[o]=u.c[0];fb[o+1]=u.c[1];fb[o+2]=u.c[2];fb[o+3]=255;}}
  fs.writeFileSync(path.join(ASSETS,`face-${spec.k}.png`),png(fw,fw,fb));
  return g;
}

if(require.main===module){
  const mode=process.argv[2]||"preview";
  if(mode==="roles"){                       // debug: flat colour per garment
    const COL={head:[240,220,190],gown:[40,40,48],stoleB:[90,160,220],
      stoleG:[150,160,170],shirt:[235,225,200],tie:[40,60,140],belt:[140,90,40],
      trous:[110,115,125],hand:[240,180,120],shoe:[90,55,25]};
    const S=6,IW=GW*S,IH=GH*S,buf=Buffer.alloc(IW*IH*4);
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const r=ROLE[y][x];if(!r)continue;
      const c=COL[r];
      for(let dy=0;dy<S;dy++)for(let dx=0;dx<S;dx++){
        const o=(((y*S+dy)*IW)+(x*S+dx))*4;
        buf[o]=c[0];buf[o+1]=c[1];buf[o+2]=c[2];buf[o+3]=255;}}
    fs.writeFileSync("rolemap.png",png(IW,IH,buf));
    console.log("rolemap.png",Object.entries(STAT).map(([k,v])=>`${k} L${v.lo|0}-${v.hi|0}`).join("  "));
  }else if(mode==="preview"){               // contact sheet, all nine
    const S=4,PAD=4,cw=W2*S+PAD,IW=cw*CHARS.length,FH=38*S,IH=GH*S+FH+PAD;
    const buf=Buffer.alloc(IW*IH*4);
    for(let i=0;i<buf.length;i+=4){buf[i]=16;buf[i+1]=20;buf[i+2]=24;buf[i+3]=255;}
    CHARS.forEach((spec,ci)=>{
      const g=compose(spec),ox=ci*cw;
      for(let y=0;y<GH;y++)for(let x=0;x<W2;x++){const u=g[y][x];if(!u)continue;
        for(let dy=0;dy<S;dy++)for(let dx=0;dx<S;dx++){
          const o=(((y*S+dy)*IW)+(ox+x*S+dx))*4;
          buf[o]=u.c[0];buf[o+1]=u.c[1];buf[o+2]=u.c[2];buf[o+3]=255;}}
      for(let y=0;y<38;y++)for(let x=0;x<38;x++){const u=(g[y]||[])[x+3+M];if(!u)continue;
        for(let dy=0;dy<S;dy++)for(let dx=0;dx<S;dx++){
          const o=(((GH*S+PAD+y*S+dy)*IW)+(ox+x*S+dx))*4;
          buf[o]=u.c[0];buf[o+1]=u.c[1];buf[o+2]=u.c[2];buf[o+3]=255;}}
    });
    fs.writeFileSync("sheet.png",png(IW,IH,buf));
    console.log("sheet.png "+IW+"x"+IH);
  }else if(mode==="write"){
    CHARS.forEach(s=>writeChar(s,11,9));
    console.log(`wrote 9 chars ${W2*11}x${GH*11} + 9 faces ${38*9}x${38*9}`);
  }
}
module.exports={CHARS,compose,W2,GH,M};
