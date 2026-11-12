import test from 'node:test';
import assert from 'node:assert/strict';
import {MayaService,slots,languages} from '../dist/maya-core.mjs';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import http from 'node:http';
const seed=JSON.parse(await readFile(new URL('../dist/seed.json',import.meta.url),'utf8'));
function fixture(){let state=structuredClone(seed);return {get state(){return state},service:new MayaService({read:()=>structuredClone(state),write:s=>{state=s},now:()=>Date.parse('2026-11-12T13:00:00Z'),challenge:async()=>{},verify:async()=>false})};}
async function prepare(service,flow,language='en'){
 const {sessionId}=service.start(language),send=(text='',action='')=>service.send(sessionId,{text,action});
 await send('',flow);await send('Fictional Test Caller');const next=await send('+1 212 555 0119');return {send,next};
}
test('every text language requires confirmation; a repeated confirm cannot duplicate a lead',async()=>{
 for(const lang of Object.keys(languages)){
  const f=fixture(),{send}=await prepare(f.service,'lead',lang);const preview=await send('Fictional accident inquiry for testing');assert.equal(preview.step,'confirm');assert.equal(f.state.matters.length,5);
  await send('','confirm');await send('','confirm');assert.equal(f.state.matters.length,6);assert.equal(f.state.tasks[0].matter,f.state.matters[0].id);assert.equal(f.state.matters[0].source,'Maya receptionist');
 }
});
test('interruption preserves the intake step and multilingual phone digits normalize',async()=>{
 const f=fixture(),{sessionId}=f.service.start('ur');const send=(text='',action='')=>f.service.send(sessionId,{text,action});
 await send('مجھے اپائنٹمنٹ چاہیے');assert.equal((await send('ذرا رکیں۔')).step,'name');assert.equal((await send('دوبارہ کہیں۔')).utterance,'name');assert.deepEqual(f.service.session(sessionId).draft,{});
 await send('Fictional Caller');const result=await send('۲۱۲،۵۵۵،۰۱۱۹');assert.equal(result.step,'slot');assert.equal(f.service.session(sessionId).draft.phone,'212 555 0119');assert.equal(f.state.appointments?.length||0,0);
});
test('spoken appointment choices still require a separate confirmation',async()=>{
 for(const text of ['the first one','the first one please','پہلا','पहला','الأول','primera','۱']){
  const f=fixture(),{send,next}=await prepare(f.service,'book');assert.equal((await send('first weekend')).step,'slot');
  const choice=await send(text);assert.equal(choice.step,'confirm');assert.equal(choice.summary.start,next.choices[0].action.slice(5));assert.equal(f.state.appointments?.length||0,0);
 }
});
test('concurrent booking confirmations cannot reserve the same slot; cancellation releases it',async()=>{
 const f=fixture(),a=await prepare(f.service,'book'),b=await prepare(f.service,'book');const action=a.next.choices[0].action;assert.equal(action,b.next.choices[0].action);
 await a.send('',action);await b.send('',action);const results=await Promise.all([a.send('','confirm'),b.send('','confirm')]);assert.equal(f.state.appointments.length,1);assert.equal(results.filter(r=>r.receipt).length,1);assert.equal(results.filter(r=>r.step==='slot').length,1);
 assert.equal(f.state.appointments[0].conflictReview,'Required');
 assert.equal(f.state.tasks.filter(t=>t.appointment===f.state.appointments[0].id).length,1);
 assert.ok(!slots(f.state,Date.parse('2026-11-12T13:00Z')).some(s=>'slot:'+s.id===action));f.state.appointments[0].status='Cancelled';assert.ok(slots(f.state,Date.parse('2026-11-12T13:00Z')).some(s=>'slot:'+s.id===action));
});
test('calendar uses New York hours across spring and autumn daylight-saving changes',()=>{
 for(const [now,expected]of [['2026-03-06T23:00:00Z','2026-03-09T13:00:00.000Z'],['2026-10-30T23:00:00Z','2026-11-02T14:00:00.000Z']])assert.equal(slots({appointments:[]},Date.parse(now))[0].id,expected);
});
test('unverified case status does not reveal notes or the approved update',async()=>{
 const f=fixture(),s=f.service.start('__proto__');assert.equal(s.language,'en');await f.service.send(s.sessionId,{action:'status'});const challenge=await f.service.send(s.sessionId,{text:'ML-2601'});assert.equal(challenge.demoCode,undefined);const reply=await f.service.send(s.sessionId,{text:'314159'});assert.equal(reply.source,undefined);assert.ok(!reply.text.includes(f.state.clientUpdates[0].text));
});
test('HTTP verification uses registered contact, consumes code, and bridge token cannot read workspace',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'mlaw-reception-'));let delivered;
 const delivery=http.createServer(async(req,res)=>{let text='';for await(const c of req)text+=c;delivered=JSON.parse(text);res.writeHead(req.headers.authorization==='Bearer delivery-test-token'?200:401);res.end('{}');});delivery.listen(0,'127.0.0.1');await once(delivery,'listening');
 const port=34880,base='http://127.0.0.1:'+port,token='bridge-test-abcdefghijklmnopqrstuvwxyz';
 const p=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port),HOST:'127.0.0.1',DATA_DIR:dir,WORKSPACE_PASSWORD:'test-password-abcdefghijklmnop',RECEPTION_BRIDGE_TOKEN:token,VERIFICATION_DELIVERY_URL:'http://127.0.0.1:'+delivery.address().port,VERIFICATION_DELIVERY_TOKEN:'delivery-test-token',VOICE_SERVICE_URL:'',LAW_FEED_URLS:''},stdio:['ignore','pipe','pipe']});
 try{
  await Promise.race([once(p.stdout,'data'),new Promise((_,reject)=>setTimeout(()=>reject(Error('Server start timeout')),10000).unref())]);
  const headers={'Content-Type':'application/json',Authorization:'Bearer '+token};
  const post=async(path,body)=>{const r=await fetch(base+'/api/reception/'+path,{method:'POST',headers,body:JSON.stringify(body)});return {status:r.status,...await r.json()};};
  const started=await post('start',{language:'en'});assert.equal(started.status,200);const turn=(text='',action='')=>post('message',{sessionId:started.sessionId,text,action});
  await turn('','status');const prompt=await turn('ML-2601');assert.equal(prompt.step,'code');assert.equal(prompt.demoCode,undefined);assert.equal(delivered.destination,seed.matters.find(m=>m.id==='ML-2601').email);assert.match(delivered.code,/^\d{6}$/);
  const update=await turn(delivered.code);assert.equal(update.source.id,seed.clientUpdates[0].id);assert.equal(update.text,seed.clientUpdates[0].text);assert.equal(update.matters,undefined);
  assert.equal((await turn(delivered.code)).source,undefined);
  assert.equal((await fetch(base+'/api/state',{headers})).status,401);
  // Preserve the raw path: fetch normalizes dot segments before sending them.
  const escapedStatus=await new Promise((resolve,reject)=>{const req=http.request({hostname:'127.0.0.1',port,path:'/api/reception/%2e%2e/state',headers},res=>{res.resume();resolve(res.statusCode)});req.on('error',reject);req.end();});assert.equal(escapedStatus,401);
  assert.equal((await post('speech',{text:'Hello',language:'en'})).status,503);
  const wrong=await fetch(base+'/api/reception/start',{method:'POST',headers:{Authorization:'Bearer wrong'},body:'{}'});assert.equal(wrong.status,401);
 }finally{p.kill();if(p.exitCode===null)await once(p,'exit');await new Promise(resolve=>delivery.close(resolve));await rm(dir,{recursive:true,force:true});}
});
