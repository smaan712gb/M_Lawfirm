import test from 'node:test';
import assert from 'node:assert/strict';
import {completeModel} from '../lib/model.mjs';
const env={MODEL_BASE_URL:'https://provider.invalid/',MODEL_NAME:'test-model',MODEL_API_KEY:'fictional-test-secret',MODEL_THINKING:'disabled'};
test('server-only drafting sends selected model controls and returns only final text',async()=>{
 let request;
 const result=await completeModel([{role:'user',content:'Fictional matter summary'}],2400,{env,fetchImpl:async(url,options)=>{
  request={url,...options};return Response.json({choices:[{finish_reason:'stop',message:{content:'DRAFT - example',reasoning_content:'private provider reasoning'}}]});
 }});
 assert.equal(request.url,'https://provider.invalid/chat/completions');
 assert.equal(request.headers.Authorization,'Bearer fictional-test-secret');
 assert.deepEqual(JSON.parse(request.body).thinking,{type:'disabled'});
 assert.equal(JSON.parse(request.body).max_tokens,2400);
 assert.equal(result,'DRAFT - example');
});
test('model failures redact secrets and reject partial or empty output',async()=>{
 await assert.rejects(()=>completeModel([],10,{env:{}}),{status:503});
 await assert.rejects(()=>completeModel([],10,{env,fetchImpl:async()=>{throw Error(env.MODEL_API_KEY)}}),e=>e.status===502&&!e.message.includes(env.MODEL_API_KEY));
 await assert.rejects(()=>completeModel([],10,{env,fetchImpl:async()=>new Response(env.MODEL_API_KEY,{status:401})}),e=>e.status===502&&e.message.includes('401')&&!e.message.includes(env.MODEL_API_KEY));
 for(const choice of [{finish_reason:'length',message:{content:'truncated'}},{finish_reason:'stop',message:{content:''}}]){
  await assert.rejects(()=>completeModel([],10,{env,fetchImpl:async()=>Response.json({choices:[choice]})}),{status:502});
 }
});
