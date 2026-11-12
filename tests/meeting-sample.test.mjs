import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {addRecordedMeetingSample} from '../dist/meeting-sample.mjs';
test('portable recorded sample preserves existing work, adds one version-bound review and never resets a decision',async()=>{
 const seed=JSON.parse(await readFile(new URL('../dist/seed.json',import.meta.url),'utf8'));
 const sample=JSON.parse(await readFile(new URL('../dist/demo-recorded.json',import.meta.url),'utf8'));
 const original=structuredClone(seed),once=await addRecordedMeetingSample(seed,sample);
 assert.deepEqual(seed,original);
 assert.equal(once.matters.length,seed.matters.length+1);
 const doc=once.documents.find(d=>d.id===sample.recordedDocumentId),review=once.approvals.find(a=>a.documentId===doc.id);
 assert.match(doc.text,/RECORDED DEMONSTRATION/);assert.equal(review.status,'Pending review');
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({id:doc.id,matter:doc.matter,text:doc.text,name:doc.name}))))].map(b=>b.toString(16).padStart(2,'0')).join('');
 assert.equal(review.documentHash,hash);
 review.status='Returned for revision';doc.text+='\nPresenter annotation';once.matters[0].summary='Presenter revised summary';
 assert.deepEqual(await addRecordedMeetingSample(once,sample),once);
 const bad=structuredClone(sample);bad.tasks[0].matter='ANOTHER-MATTER';
 await assert.rejects(()=>addRecordedMeetingSample(seed,bad),/not valid/);assert.deepEqual(seed,original);
});
