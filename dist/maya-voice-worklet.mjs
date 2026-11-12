import {TurnDetector} from './maya-vad.mjs';
class MayaTurnProcessor extends AudioWorkletProcessor {
 constructor(){super();this.detector=new TurnDetector(sampleRate);this.port.onmessage=({data})=>{if(data.type==='playback')this.detector.playback=data.active;if(data.type==='reset')this.detector.reset()}}
 process(inputs,outputs){
  for(const output of outputs)for(const channel of output)channel.fill(0);
  const input=inputs[0]?.[0];
  if(input)for(const event of this.detector.push(input))this.port.postMessage(event,event.audio?[event.audio.buffer]:[]);
  return true;
 }
}
registerProcessor('maya-turn-detector',MayaTurnProcessor);
