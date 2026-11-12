import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const response=JSON.parse(await readFile(resolve(root,'evidence/live-drafting-response.json'),'utf8'));
const state=await fetch('http://127.0.0.1:3333/api/state').then(r=>{if(!r.ok)throw Error('Meeting workspace unavailable');return r.json()});
const matter=state.matters.find(m=>m.id===response.retrieval.matterId);
if(matter?.id!=='ML-MEETING-1112'||matter.name!=='Taylor Example'||matter.source!=='Meeting demonstration')throw Error('Only the known fictional meeting example may be packaged');
const documents=response.retrieval.documentIds.map(id=>state.documents.find(d=>d.id===id));
const tasks=response.retrieval.taskIds.map(id=>state.tasks.find(t=>t.id===id));
if([...documents,...tasks].some(row=>!row||row.matter!==matter.id))throw Error('Source records do not match the verified example');
const recordedDocumentId='ML-DEMO-RECORDED-DRAFT';
documents.push({id:recordedDocumentId,matter:matter.id,name:'Recorded live drafting sample — Taylor Example',type:'Draft',created:'2026-11-12',
 text:'RECORDED DEMONSTRATION — FICTIONAL MATTER\nGenerated and verified on November 12, 2026, using the selected matter. This is a saved example, not a new live model response. No client message was sent.\n\n'+response.content,
 sourceReceipt:response.retrieval,recordedDemo:true});
await writeFile(resolve(root,'dist/demo-recorded.json'),JSON.stringify({kind:'recorded-fictional-demo',recordedAt:response.retrieval.readAt,matter,tasks,documents,recordedDocumentId},null,2)+'\n');
console.log('Packaged one fictional matter, its source records and the recorded draft; no workspace secrets or other matters included.');
