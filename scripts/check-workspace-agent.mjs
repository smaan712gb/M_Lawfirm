/** Actual installed agent + actual MCP, using an explicitly synthetic model endpoint. */
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..'),calls=[];
const model=http.createServer(async(req,res)=>{
 if(req.method==='GET'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({object:'list',data:[{id:'test-model',object:'model',owned_by:'local-test'}]}));return;}
 let raw='';for await(const c of req)raw+=c;const body=JSON.parse(raw);
 if(!Array.isArray(body.messages)){console.log('Metadata probe:',req.url,Object.keys(body));res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({}));return;}
 calls.push(body);
 const received=body.messages.some(m=>m.role==='tool');
 const name=body.tools?.[0]?.function?.name;
 assert.equal(body.tools.length,1);assert.match(name,/get_selected_matter$/);
 if(received)assert.ok(body.messages.some(m=>m.role==='tool'&&m.content.includes('ML-TEST-ONLY')));
 const message=received?{role:'assistant',content:'DRAFT — ATTORNEY REVIEW REQUIRED\nFictional test context [ML-TEST-ONLY].\nReview the supplied facts.'}:{role:'assistant',content:null,tool_calls:[{id:'read_one',type:'function',function:{name,arguments:'{}'}}]};
 const base={id:'synthetic-check',created:Math.floor(Date.now()/1000),model:'test-model'};
 if(body.stream){res.writeHead(200,{'Content-Type':'text/event-stream'});const delta=received?{role:'assistant',content:message.content}:{role:'assistant',tool_calls:message.tool_calls.map(t=>({index:0,...t}))};for(const choice of [{index:0,delta,finish_reason:null},{index:0,delta:{},finish_reason:received?'stop':'tool_calls'}])res.write('data: '+JSON.stringify({...base,object:'chat.completion.chunk',choices:[choice]})+'\n\n');res.end('data: [DONE]\n\n');}
 else{res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({...base,object:'chat.completion',choices:[{index:0,message,finish_reason:received?'stop':'tool_calls'}],usage:{prompt_tokens:100,completion_tokens:50,total_tokens:150}}));}
});
await new Promise(r=>model.listen(0,'127.0.0.1',r));
const p=spawn(resolve(root,'.hermes-verified-venv/Scripts/python.exe'),[resolve(root,'agents/draft-matter.py')],{cwd:root,windowsHide:true,env:{...process.env,MODEL_BASE_URL:`http://127.0.0.1:${model.address().port}/v1`,MODEL_NAME:'test-model',MODEL_API_KEY:'fictional-test-key',MODEL_THINKING:'disabled',MLAW_NODE:process.execPath,PYTHONUTF8:'1'},stdio:['pipe','pipe','pipe']});
let output='',err='';p.stdout.on('data',d=>output+=d);p.stderr.on('data',d=>err+=d);
const timer=setTimeout(()=>p.kill(),100000);
p.stdin.end(JSON.stringify({question:'Summarize the selected matter.',context:{matter:{id:'ML-TEST-ONLY',name:'Fictional Example'},tasks:[{id:'t-test',title:'Review incident'}],documents:[],files:[]}}));
try{const [code]=await once(p,'exit');assert.equal(code,0,output+' '+err.slice(-500));const result=JSON.parse(output);assert.equal(result.retrieval.matterId,'ML-TEST-ONLY');assert.equal(result.retrieval.toolReads,1);assert.equal(calls.length,2);console.log(JSON.stringify({actualAgent:true,actualMcp:true,selectedMatterOnly:true,toolReads:1,modelCalls:2,liveProviderTested:false}));}
finally{clearTimeout(timer);model.close();}
