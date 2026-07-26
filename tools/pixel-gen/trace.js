const fs=require("fs"),{decode}=require("./png.js");
const SRC=require("path").resolve(__dirname,"../../grad.png");
const img=decode(fs.readFileSync(SRC));
const at=(x,y)=>{const o=(y*img.w+x)*img.ch;return [img.px[o],img.px[o+1],img.px[o+2]];};
const isBg=(r,g,b)=>r>232&&g>232&&b>232&&Math.abs(r-g)<6&&Math.abs(g-b)<6;

let x0=1e9,x1=-1,y0=1e9,y1=-1;
for(let y=0;y<img.h;y++)for(let x=0;x<img.w;x++){
  const [r,g,b]=at(x,y); if(isBg(r,g,b))continue;
  if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y;
}
const fw=x1-x0+1, fh=y1-y0+1;
console.log(`figure ${fw}x${fh} at (${x0},${y0})`);

// estimate the voxel size from runs of identical colour along a hair scanline
function voxelSize(){
  const counts={};
  for(let y=y0+Math.round(fh*0.12); y<y0+Math.round(fh*0.2); y+=3){
    let run=0,prev=null;
    for(let x=x0;x<=x1;x++){
      const c=at(x,y).join(",");
      if(c===prev)run++; else {if(run>4&&run<60)counts[run]=(counts[run]||0)+1; run=1; prev=c;}
    }
  }
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  return top;
}
console.log("common run lengths (voxel width candidates):", voxelSize().map(t=>t[0]+"px x"+t[1]).join(", "));

function trace(GW){
  const cell=fw/GW, GH=Math.round(fh/cell);
  const grid=[];
  for(let gy=0;gy<GH;gy++){
    const row=[];
    for(let gx=0;gx<GW;gx++){
      const cnt=new Map(); let bg=0,tot=0;
      for(let y=Math.floor(y0+gy*cell); y<Math.min(y1+1,y0+(gy+1)*cell); y++){
        for(let x=Math.floor(x0+gx*cell); x<Math.min(x1+1,x0+(gx+1)*cell); x++){
          const [r,g,b]=at(x,y); tot++;
          if(isBg(r,g,b)){bg++;continue;}
          const k=(r>>3<<10)|(g>>3<<5)|(b>>3);
          cnt.set(k,(cnt.get(k)||0)+1);
        }
      }
      if(!tot||bg/tot>0.55||!cnt.size){row.push(null);continue;}
      let best=null,bn=0;
      for(const [k,n] of cnt) if(n>bn){bn=n;best=k;}
      row.push([((best>>10)&31)<<3, ((best>>5)&31)<<3, (best&31)<<3]);
    }
    grid.push(row);
  }
  return {grid,GW,GH};
}
module.exports={trace};
if(require.main===module){
  for(const gw of [24,32,44]){
    const t=trace(gw);
    console.log(`  grid ${t.GW}x${t.GH}`);
  }
}
