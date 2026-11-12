import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
test('agent can read only its immutable selected matter and records actual retrieval',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'mlaw-agent-scope-'));const snapshot=join(dir,'matter.json'),receipt=join(dir,'reads.jsonl');
 await writeFile(snapshot,JSON.stringify({matter:{id:'ML-SELECTED'},tasks:[],documents:[],files:[]}));
 const p=spawn(process.execPath,['agents/matter-context.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,MLAW_AGENT_SNAPSHOT:snapshot,MLAW_AGENT_RECEIPT:receipt},stdio:['pipe','pipe','ignore']});let output='';p.stdout.on('data',d=>output+=d);
 for(const [id,name,args] of [[1,'get_selected_matter',{}],[2,'get_selected_matter',{matter_id:'OTHER'}],[3,'search_matters',{}]])p.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method:'tools/call',params:{name,arguments:args}})+'\n');
 p.stdin.end();await once(p,'exit');
 try{const rows=output.trim().split('\n').map(JSON.parse);assert.equal(JSON.parse(rows[0].result.content[0].text).matter.id,'ML-SELECTED');assert.ok(rows[1].error);assert.ok(rows[2].error);const reads=(await readFile(receipt,'utf8')).trim().split('\n').map(JSON.parse);assert.equal(reads.length,1);assert.equal(reads[0].matterId,'ML-SELECTED');}finally{await rm(dir,{recursive:true,force:true});}
});
