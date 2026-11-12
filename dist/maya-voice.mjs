import {encodeWave} from './maya-vad.mjs';
export function voiceCommand(text){
 const value=String(text).normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]/gu,' ').replace(/\s+/g,' ').trim();
 if(/^(please )?(wait|stop|hold on|one moment|wait a minute|just a moment)$|^(رکیں|رکو|ایک لمحہ|ذرا رکیں|ठहरिए|रुकिए|रुको|एक पल|انتظر|انتظري|توقف|لحظة|espera|espere|un momento|para)$/u.test(value))return 'pause';
 if(/^(please )?(repeat|say that again|repeat that|could you repeat that)$|^(دوبارہ کہیں|پھر سے کہیں|دوبارہ بتائیں|दोबारा कहिए|फिर से कहिए|दोहराएं|كرر|كرري|أعد ذلك|repite|repita|otra vez)$/u.test(value))return 'repeat';
 if(/^(yes|yes please|yes save|save it|confirm|ہاں|جی ہاں|بالکل|हाँ|हां|जी हाँ|نعم|نعم احفظ|sí|si|sí guardar)$/u.test(value))return 'confirm';
 if(/^(no|cancel|نہیں|منسوخ|नहीं|रद्द|لا|إلغاء|cancelar)$/u.test(value))return 'cancel';
 if(/^(thank you|thanks|thank you very much|gracias|muchas gracias|شکریہ|بہت شکریہ|شكرا|شكرًا|धन्यवाद|शुक्रिया|haha|ha ha|lol|ہاہا|هههه|हाहा|jajaja)$/u.test(value))return 'acknowledge';
 return null;
}
export class VoiceConversation {
 constructor({transcribe,onSpeech,onText,onStatus,onError}){Object.assign(this,{transcribe,onSpeech,onText,onStatus,onError});this.active=false;this.speaking=false;this.pending=0;this.queue=Promise.resolve();this.epoch=0}
 async start(inputStream){
  const epoch=++this.epoch;
  try{
   const stream=inputStream||await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,channelCount:1}});
   if(epoch!==this.epoch){stream.getTracks().forEach(track=>track.stop());return}
   this.stream=stream;this.context=new AudioContext({sampleRate:16000});await this.context.resume();await this.context.audioWorklet.addModule('/maya-voice-worklet.mjs');
   if(epoch!==this.epoch){this.stop();return}
   this.source=this.context.createMediaStreamSource(stream);this.node=new AudioWorkletNode(this.context,'maya-turn-detector');this.gain=this.context.createGain();this.gain.gain.value=0;
   this.source.connect(this.node);this.node.connect(this.gain);this.gain.connect(this.context.destination);this.active=true;this.onStatus('listening');
   this.node.port.onmessage=({data})=>{
    if(!this.active)return;
    if(data.type==='speechstart'){this.speaking=true;this.onSpeech();this.onStatus('speaking')}
    if(data.type==='discard'){this.speaking=false;this.onStatus(this.pending?'processing':'listening')}
    if(data.type==='speechend'){
     this.speaking=false;this.pending++;this.onStatus('processing');
     const blob=new Blob([encodeWave(data.audio,this.context.sampleRate)],{type:'audio/wav'});
     this.queue=this.queue.then(async()=>{
      if(!this.active||epoch!==this.epoch)return;
      this.request=new AbortController();
      try{const result=await this.transcribe(blob,this.request.signal);if(this.active&&epoch===this.epoch&&result.text?.trim())await this.onText(result.text.trim(),{voicedSeconds:data.voicedSeconds})}
      catch(error){if(error.name!=='AbortError'&&this.active)this.onError(error)}
      finally{this.pending--;if(this.active&&!this.speaking)this.onStatus(this.pending?'processing':'listening')}
     });
    }
   };
  }catch(error){this.stop();throw error}
 }
 setPlayback(active){this.node?.port.postMessage({type:'playback',active})}
 stop(){this.epoch++;this.active=false;this.speaking=false;this.request?.abort();this.node?.disconnect();this.source?.disconnect();this.gain?.disconnect();this.stream?.getTracks().forEach(track=>track.stop());this.context?.close().catch(()=>{});this.onStatus('off')}
}
