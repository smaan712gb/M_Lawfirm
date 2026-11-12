import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {findMayaMedia,preferredMayaLanguage} from '../dist/maya-media.mjs';
import {copy,MayaService} from '../dist/maya-core.mjs';
import {mayaExpression} from '../dist/maya-presence.mjs';
const manifest=JSON.parse(await readFile(new URL('../dist/maya-media.json',import.meta.url),'utf8'));
const provenance=JSON.parse(await readFile(new URL('../evidence/maya-speech-assets.json',import.meta.url),'utf8'));

test('speech revision and provenance match every bundled utterance',async()=>{
 assert.equal(manifest.clips.length,80);
 for(const clip of manifest.clips){
  const record=provenance.find(item=>item.language===clip.language&&item.key===clip.key);
  assert.equal(record?.text,copy[clip.language][clip.key]);
  const bytes=await readFile(new URL('../dist'+clip.audio,import.meta.url));
  const hash=createHash('sha256').update(bytes).digest('hex');
  assert.equal(record.sha256,hash);
  assert.ok(clip.video,`${clip.language}/${clip.key} has synchronized video`);
  const videoHash=createHash('sha256').update(await readFile(new URL('../dist'+clip.video,import.meta.url))).digest('hex');
  assert.equal(clip.revision,createHash('sha256').update(hash+videoHash).digest('hex').slice(0,16));
 }
});

test('Urdu greeting and every bundled response resolve only to their selected language',()=>{
 for(const clip of manifest.clips){
  assert.equal(clip.text,copy[clip.language][clip.key]);
  assert.equal(findMayaMedia(manifest,clip.language,clip.text)?.audio,clip.audio);
 }
 assert.ok(findMayaMedia(manifest,'ur',copy.ur.hello).audio.includes('maya-ur-hello'));
 const englishOnly={clips:manifest.clips.filter(c=>c.language==='en')};
 assert.equal(findMayaMedia(englishOnly,'ur',copy.ur.hello),null);
 assert.equal(findMayaMedia(manifest,'ur',copy.en.hello),null);
 assert.ok(findMayaMedia(manifest,'ar',copy.ar.hello)?.audio.includes('maya-ar-hello'));
 assert.equal(findMayaMedia(manifest,'pa',copy.pa.hello),null);
 assert.equal(findMayaMedia(manifest,'ur','A private, unreviewed case update'),null);
});
test('selected language survives reopening while invalid or unavailable storage stays safe',()=>{
 assert.equal(preferredMayaLanguage({getItem:()=> 'ur'},copy),'ur');
 assert.equal(preferredMayaLanguage({getItem:()=> 'not-a-language'},copy),'en');
 assert.equal(preferredMayaLanguage({getItem:()=>{throw Error('blocked')}},copy),'en');
});
test('conversation expressions respond to the task, with restrained emergency and verification behavior',async()=>{
 let state={matters:[],tasks:[],audit:[]};
 const service=new MayaService({read:()=>structuredClone(state),write:value=>{state=value},challenge:async()=>{},verify:async()=>false});
 const start=service.start('ur');assert.equal(start.expression,'warm');
 let turn=await service.send(start.sessionId,{action:'lead'});assert.equal(turn.expression,'attentive');
 await service.send(start.sessionId,{text:'Fictional Test'});
 turn=await service.send(start.sessionId,{text:'2125550119'});assert.equal(turn.utterance,'story');assert.equal(turn.expression,'concerned');
 turn=await service.send(start.sessionId,{text:'Fictional inquiry'});assert.equal(turn.expression,'focused');
 turn=await service.send(start.sessionId,{action:'confirm'});assert.equal(turn.expression,'reassuring');
 assert.equal(mayaExpression('booked'),'warm');
 const emergency=service.start('en');turn=await service.send(emergency.sessionId,{text:'I cannot breathe'});assert.equal(turn.expression,'concerned');
 assert.equal(mayaExpression('hello','listening'),'attentive');
 assert.equal(mayaExpression('booked','thinking'),'focused');
});
test('bundled greeting audio and video are real assets with no old spoken AI introduction',async()=>{
 for(const language of ['en','es','hi','ur','ar']){
  const clip=findMayaMedia(manifest,language,copy[language].hello);
  assert.ok(clip?.video);
  const wav=await readFile(new URL('../dist'+clip.audio,import.meta.url));
  const video=await readFile(new URL('../dist'+clip.video,import.meta.url));
  assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(video.toString('ascii',4,8),'ftyp');
  assert.ok(wav.length>50000);assert.ok(video.length>30000);
 }
 assert.doesNotMatch(Object.values(copy).map(c=>c.hello).join(' '),/AI|assistant|inteligencia artificial|ए आई|مصنوعی|اصطناعي/i);
});
