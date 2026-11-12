import {createInterface} from 'node:readline';
import {receptionist} from './lib/reception.mjs';
import {readState} from './lib/storage.mjs';

const tools=[
 {name:'start_reception',description:'Start a reception session. Return Maya’s exact greeting and choices. Supports en, es, ur, hi, pa, ar.',inputSchema:{type:'object',properties:{language:{type:'string',enum:['en','es','ur','hi','pa','ar']}},additionalProperties:false}},
 {name:'reception_turn',description:'Forward the caller’s exact response to their session. Never invent caller details or confirmation. Lead, callback and booking writes require the caller to confirm the displayed summary. Client status requires a code delivered to the registered contact.',inputSchema:{type:'object',properties:{session_id:{type:'string'},text:{type:'string',maxLength:2000},action:{type:'string',maxLength:100}},required:['session_id'],additionalProperties:false}},
 {name:'reception_queue',description:'Internal staff only: inspect outstanding callbacks and upcoming reservations. Does not call or message anyone.',inputSchema:{type:'object',properties:{},additionalProperties:false}}
];
const input=createInterface({input:process.stdin,crlfDelay:Infinity});
for await(const line of input){let q;try{
 if(line.length>20000)throw Error('Request too large');q=JSON.parse(line);if(q.jsonrpc!=='2.0')throw Error('Invalid JSON-RPC');if(q.id===undefined)continue;
 let result;
 if(q.method==='initialize')result={protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'mlaw-reception',version:'1.0.0'},instructions:'These tools operate the configured M Law workspace. Forward exact caller responses; confirmation is required for writes. Do not disclose the staff reception_queue to callers. No legal advice, filing, emergency response or carrier connection is provided.'};
 else if(q.method==='ping')result={};
 else if(q.method==='tools/list')result={tools};
 else if(q.method==='tools/call'){
  const {name,arguments:a={}}=q.params||{};if(!a||typeof a!=='object'||Array.isArray(a))throw Error('Invalid arguments');let value;
  if(name==='start_reception')value=receptionist.start(a.language);
  else if(name==='reception_turn'){if(typeof a.session_id!=='string')throw Error('session_id required');value=await receptionist.send(a.session_id,{text:a.text,action:a.action});}
  else if(name==='reception_queue'){const s=readState();value={callbacks:s.calls.filter(c=>c.status==='Callback requested'),appointments:s.appointments.filter(a=>a.status==='Reserved'&&Date.parse(a.start)>Date.now())};}
  else throw Error('Unknown tool');
  result={content:[{type:'text',text:JSON.stringify(value)}]};
 }else{process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:q.id,error:{code:-32601,message:'Method not found'}})+'\n');continue;}
 process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:q.id,result})+'\n');
 }catch(e){process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:q?.id??null,error:{code:-32602,message:e.message}})+'\n');}
}
