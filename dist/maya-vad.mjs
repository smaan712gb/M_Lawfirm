// Local turn detection. Audio stays in memory until one completed voice turn.
export class TurnDetector {
 constructor(rate=48000){this.rate=rate;this.noise=.003;this.playback=false;this.reset()}
 reset(){this.active=false;this.attack=0;this.quiet=0;this.voiced=0;this.total=0;this.pre=[];this.preSize=0;this.frames=[]}
 push(input){
  const samples=Float32Array.from(input),ms=1000*samples.length/this.rate;
  const rms=Math.sqrt(samples.reduce((sum,n)=>sum+n*n,0)/samples.length);
  const threshold=Math.max(this.playback?.018:.012,this.noise*(this.playback?4:3));
  const speech=rms>threshold;const events=[];
  if(!this.active){
   this.pre.push(samples);this.preSize+=samples.length;
   while(this.preSize>this.rate*.32&&this.pre.length>1)this.preSize-=this.pre.shift().length;
   if(!speech){this.attack=0;if(!this.playback)this.noise=.985*this.noise+.015*Math.min(rms,.025);return events}
   this.attack+=ms;
   if(this.attack<90)return events;
   this.active=true;this.frames=this.pre;this.pre=[];this.total=this.preSize/this.rate*1000;this.preSize=0;this.voiced=this.attack;
   events.push({type:'speechstart'});
  }else{this.frames.push(samples);this.total+=ms;if(speech)this.voiced+=ms}
  this.quiet=speech?0:this.quiet+ms;
  if(this.quiet>=650||this.total>=45000){
   const size=this.frames.reduce((n,frame)=>n+frame.length,0),audio=new Float32Array(size);let offset=0;
   for(const frame of this.frames){audio.set(frame,offset);offset+=frame.length}
   if(this.voiced>=120)events.push({type:'speechend',audio,voicedSeconds:this.voiced/1000});else events.push({type:'discard'});
   this.reset();
  }
  return events;
 }
}

export function encodeWave(samples,rate){
 const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);
 const tag=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i))};
 tag(0,'RIFF');view.setUint32(4,36+samples.length*2,true);tag(8,'WAVE');tag(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);tag(36,'data');view.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++){const n=Math.max(-1,Math.min(1,samples[i]));view.setInt16(44+i*2,n<0?n*32768:n*32767,true)}
 return buffer;
}
