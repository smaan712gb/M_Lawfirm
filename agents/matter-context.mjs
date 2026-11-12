/** One immutable request-scoped snapshot; no workspace database access. */
import {createInterface} from 'node:readline';
import {readFileSync,appendFileSync} from 'node:fs';
const context=JSON.parse(readFileSync(process.env.MLAW_AGENT_SNAPSHOT,'utf8'));
if(!context?.matter?.id)throw Error('Selected matter is missing');
const tool={name:'get_selected_matter',description:'Read the selected matter, its linked tasks and draft document text. File attachments are metadata only. Records are unverified prototype data.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,destructiveHint:false}};
for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){
 let q;try{
  if(line.length>20000)throw Error();q=JSON.parse(line);if(q.jsonrpc!=='2.0')throw Error();if(q.id===undefined)continue;
  let result;
  if(q.method==='initialize')result={protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'selected-matter-context',version:'1.0.0'}};
  else if(q.method==='ping')result={};
  else if(q.method==='tools/list')result={tools:[tool]};
  else if(q.method==='tools/call'){
   const args=q.params?.arguments??{};
   if(q.params?.name!==tool.name||typeof args!=='object'||Array.isArray(args)||Object.keys(args).length)throw Error();
   appendFileSync(process.env.MLAW_AGENT_RECEIPT,JSON.stringify({matterId:context.matter.id,readAt:new Date().toISOString()})+'\n');
   result={content:[{type:'text',text:JSON.stringify(context)}]};
  }else throw Error();
  process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:q.id,result})+'\n');
 }catch{process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:q?.id??null,error:{code:-32602,message:'The request is outside the selected matter scope.'}})+'\n');}
}
