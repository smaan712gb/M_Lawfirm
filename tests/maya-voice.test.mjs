import test from 'node:test';
import assert from 'node:assert/strict';
import {TurnDetector,encodeWave} from '../dist/maya-vad.mjs';
import {voiceCommand,VoiceConversation} from '../dist/maya-voice.mjs';
import {conversationCue} from '../dist/maya-presence.mjs';
const rate=16000;
function feed(detector,ms,amplitude=0){const events=[];for(let i=0;i<ms/10;i++)events.push(...detector.push(Float32Array.from({length:160},(_,j)=>amplitude*Math.sin(j*.3))));return events}
test('voice interrupts within 100 ms, retains opening syllables and ends after a pause',()=>{
 const detector=new TurnDetector(rate);feed(detector,400);
 const opening=feed(detector,100,.12);assert.equal(opening.filter(e=>e.type==='speechstart').length,1);assert.equal(detector.active,true);
 feed(detector,600,.12);assert.equal(feed(detector,600).length,0);
 const end=feed(detector,60).find(e=>e.type==='speechend');assert.ok(end);assert.ok(end.voicedSeconds>=.69);assert.ok(end.audio.length>rate);assert.equal(detector.active,false);
});
test('background noise and a short impact do not trigger a voice turn during playback',()=>{
 const detector=new TurnDetector(rate);detector.playback=true;
 assert.equal(feed(detector,3000,.008).length,0);assert.equal(feed(detector,40,.5).length,0);assert.equal(feed(detector,1000).length,0);
 assert.equal(feed(detector,100,.1)[0]?.type,'speechstart');
});
test('turns are bounded and WAV payload preserves mono samples and sample rate',()=>{
 const detector=new TurnDetector(rate);const events=feed(detector,45500,.1);assert.equal(events.filter(e=>e.type==='speechend').length,1);
 const bytes=encodeWave(new Float32Array([-1,0,1]),rate),view=new DataView(bytes);
 assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'RIFF');assert.equal(view.getUint32(24,true),rate);assert.equal(view.getInt16(44,true),-32768);assert.equal(view.getInt16(48,true),32767);
});
test('interruption commands cannot accidentally become intake answers or broad consent',()=>{
 for(const text of ['Wait!','Please stop.','ذرا رکیں۔','रुकिए।','انتظر!','Un momento.'])assert.equal(voiceCommand(text),'pause');
 assert.equal(voiceCommand('Say that again?'),'repeat');assert.equal(voiceCommand('Yes, please.'),'confirm');assert.equal(voiceCommand('Yes, but I have a question first.'),null);
 assert.equal(voiceCommand('Thank you!'),'acknowledge');assert.equal(voiceCommand('Thank you, but I am in pain.'),null);
});
test('distressing content takes precedence over a laugh or friendly cue',()=>{
 assert.equal(conversationCue('haha, but I am scared and injured').expression,'concerned');
 assert.equal(conversationCue('I am frustrated').expression,'reassuring');
 assert.equal(conversationCue('That was funny').expression,'amused');
 assert.equal(conversationCue('Thank you').expression,'warm');assert.equal(conversationCue('My name is Sam'),null);
});
test('a new voice turn interrupts before transcription and shutdown rejects late results',async()=>{
 const saved=Object.fromEntries(['navigator','AudioContext','AudioWorkletNode'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 let stopped=0,interrupted=0,delivered=0,resolveTranscript,signal;
 const node=()=>({connect(){},disconnect(){},port:{postMessage(){}}});
 try{
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){stopped++}}]})}}});
  globalThis.AudioContext=class{constructor(){this.sampleRate=rate;this.audioWorklet={addModule:async()=>{}}}async resume(){}async close(){}createMediaStreamSource(){return node()}createGain(){return {...node(),gain:{value:1}}}};
  globalThis.AudioWorkletNode=class{constructor(){return node()}};
  const conversation=new VoiceConversation({transcribe:async(blob,requestSignal)=>{assert.equal(blob.type,'audio/wav');signal=requestSignal;return new Promise(resolve=>{resolveTranscript=resolve})},onSpeech:()=>interrupted++,onText:()=>delivered++,onStatus:()=>{},onError:error=>{throw error}});
  await conversation.start();
  conversation.node.port.onmessage({data:{type:'speechstart'}});assert.equal(interrupted,1);
  conversation.node.port.onmessage({data:{type:'speechend',audio:new Float32Array(rate),voicedSeconds:1}});
  await Promise.resolve();assert.ok(resolveTranscript);
  conversation.node.port.onmessage({data:{type:'speechstart'}});assert.equal(interrupted,2);assert.equal(delivered,0);
  conversation.stop();assert.equal(signal.aborted,true);assert.equal(stopped,1);
  resolveTranscript({text:'Late transcript must not become a lead'});await conversation.queue;assert.equal(delivered,0);
 }finally{for(const[key,descriptor]of Object.entries(saved)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]}}
});
