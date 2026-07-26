// full PNG reader: colour types 2/6, bit depth 8, all five filter types
const zlib=require("zlib");
function paeth(a,b,c){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);
  return (pa<=pb&&pa<=pc)?a:(pb<=pc?b:c);}
function decode(buf){
  let p=8,w=0,h=0,ct=6,bd=8,idat=[];
  while(p<buf.length){
    const len=buf.readUInt32BE(p), type=buf.toString("ascii",p+4,p+8);
    if(type==="IHDR"){w=buf.readUInt32BE(p+8);h=buf.readUInt32BE(p+12);bd=buf[p+16];ct=buf[p+17];}
    else if(type==="IDAT")idat.push(buf.slice(p+8,p+8+len));
    else if(type==="IEND")break;
    p+=12+len;
  }
  if(bd!==8)throw new Error("bit depth "+bd);
  const ch=ct===6?4:ct===2?3:null;
  if(!ch)throw new Error("colour type "+ct);
  const raw=zlib.inflateSync(Buffer.concat(idat));
  const stride=w*ch, out=Buffer.alloc(h*stride);
  let pos=0;
  for(let y=0;y<h;y++){
    const f=raw[pos++];
    for(let x=0;x<stride;x++){
      const rawv=raw[pos+x];
      const a=x>=ch?out[y*stride+x-ch]:0;
      const b=y>0?out[(y-1)*stride+x]:0;
      const c=(x>=ch&&y>0)?out[(y-1)*stride+x-ch]:0;
      let v;
      switch(f){case 0:v=rawv;break;case 1:v=rawv+a;break;case 2:v=rawv+b;break;
        case 3:v=rawv+((a+b)>>1);break;case 4:v=rawv+paeth(a,b,c);break;
        default:throw new Error("filter "+f);}
      out[y*stride+x]=v&255;
    }
    pos+=stride;
  }
  return {w,h,ch,px:out};
}
module.exports={decode};
