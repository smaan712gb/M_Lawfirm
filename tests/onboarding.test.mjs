import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import {parseCsv,previewImport,applyImport} from '../dist/onboarding-core.mjs';
const seed=JSON.parse(await readFile(new URL('../dist/seed.json',import.meta.url),'utf8'));
async function cleanup(dir){assert.equal(dirname(resolve(dir)),resolve(tmpdir()));assert.ok(basename(dir).startsWith('mlaw-onboarding-'));await rm(dir,{recursive:true,force:true});}
test('CSV mapping preserves quoted text, flags malformed rows and skips duplicate IDs',()=>{
 const csv='matter_id,client_name,description,stage\r\nML-A01,"Example, Jamie","Line one\nLine two with ""quotes""",Intake\r\nML-A01,Duplicate,Skip,Intake\r\nML-2601,Existing,Skip,Discovery\r\n';
 const result=previewImport(csv,null,seed.matters);assert.equal(result.valid,1);assert.equal(result.duplicates,2);assert.equal(result.items[0].record.name,'Example, Jamie');assert.match(result.items[0].record.summary,/Line two with "quotes"/);
 const state=structuredClone(seed);applyImport(state,result,'batch-one');applyImport(state,result,'batch-one');assert.equal(state.matters.length,6);assert.equal(state.imports.length,1);assert.equal(state.tasks.at(-1).matter,'ML-A01');
 assert.throws(()=>parseCsv('id,name\nML-X,"Unclosed'),/unclosed/);assert.equal(previewImport('id,name,incident\nML-X,Example,2026-02-31',null,[]).invalid,1);
 assert.equal(previewImport('id,name\n<script>,Example',null,[]).invalid,1);
});
test('account roles, CSRF, reviewed imports, document fingerprints and encrypted recovery',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'mlaw-onboarding-'));process.env.DATA_DIR=dir;
 const access=await import('../lib/access.mjs'),storage=await import('../lib/storage.mjs'),backup=await import('../lib/backup.mjs');
 const password='Fictional-test-password-ONLY-123';
 for(const role of ['admin','attorney','staff','viewer'])await access.createUser({username:role,name:role+' Test',role,password});
 const base='http://127.0.0.1:34881',p=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'34881',HOST:'127.0.0.1',AUTH_MODE:'accounts',WORKSPACE_PASSWORD:'',LAW_FEED_URLS:'',PUBLIC_HTTPS:'false'},stdio:['ignore','pipe','pipe']});
 try{
  await Promise.race([once(p.stdout,'data'),new Promise((_,reject)=>setTimeout(()=>reject(Error('Server start timeout')),10000).unref())]);
  assert.equal((await fetch(base+'/',{redirect:'manual'})).status,303);assert.equal((await fetch(base+'/api/state')).status,401);
  const users={};for(const role of ['admin','attorney','staff','viewer']){const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:role,password})});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);const cookie=r.headers.get('set-cookie').split(';')[0];const h=await fetch(base+'/api/health',{headers:{Cookie:cookie}}).then(r=>r.json());assert.equal(h.user.role,role);assert.equal(h.accountMode,true);users[role]={cookie,csrf:h.csrfToken};}
  const req=async(role,path,method='GET',data)=>fetch(base+path,{method,headers:{Cookie:users[role].cookie,'X-CSRF-Token':users[role].csrf,'Content-Type':'application/json'},...(data!==undefined?{body:JSON.stringify(data)}:{})});
  let state=await req('admin','/api/state').then(r=>r.json());
  assert.equal((await fetch(base+'/api/state',{method:'PUT',headers:{Cookie:users.admin.cookie,'Content-Type':'application/json'},body:JSON.stringify(state)})).status,403);
  assert.equal((await req('viewer','/api/state','PUT',state)).status,403);
  assert.equal((await req('admin','/api/demo/reset','POST',{confirm:'RESTORE DEMO'})).status,403);
  const forged=structuredClone(state);forged.approvals=[{id:'forged',status:'Approved'}];assert.equal((await req('admin','/api/state','PUT',forged)).status,403);
  const staff=structuredClone(state);staff.clientUpdates[0].text='Unauthorized change';assert.equal((await req('staff','/api/state','PUT',staff)).status,403);
  assert.equal((await req('staff','/api/backup/create','POST',{passphrase:password})).status,403);
  assert.equal((await req('admin','/api/onboarding/preview','POST',{csv:'id,name\nML-ONBOARD,Imported Example'})).status,200);
  const preview=await req('admin','/api/onboarding/preview','POST',{csv:'id,name\nML-ONBOARD,Imported Example'}).then(r=>r.json());
  assert.equal((await req('admin','/api/onboarding/import','POST',{token:preview.token,confirm:'yes'})).status,400);
  const receipt=await req('admin','/api/onboarding/import','POST',{token:preview.token,confirm:'IMPORT'}).then(r=>r.json());assert.equal(receipt.imported,1);
  const repeated=await req('admin','/api/onboarding/import','POST',{token:preview.token,confirm:'IMPORT'}).then(r=>r.json());assert.equal(repeated.batchId,receipt.batchId);
  const pending=await req('admin','/api/onboarding/preview','POST',{csv:'id,name\nML-SECOND,Second Example'}).then(r=>r.json());
  state=await req('admin','/api/state').then(r=>r.json());state.matters[0].summary+=' Changed.';assert.equal((await req('admin','/api/state','PUT',state)).status,200);
  assert.equal((await req('admin','/api/onboarding/import','POST',{token:pending.token,confirm:'IMPORT'})).status,409);
  state=await req('admin','/api/state').then(r=>r.json());const docId=state.documents[0].id;
  const review=await req('staff','/api/approvals/request','POST',{documentId:docId,gate:'Demand review'}).then(r=>r.json());assert.equal(review.status,'Pending review');
  assert.equal((await req('staff','/api/approvals/decide','POST',{id:review.id,decision:'approve',confirmation:'APPROVE'})).status,403);
  state=await req('admin','/api/state').then(r=>r.json());state.documents[0].text+=' New unreviewed paragraph.';assert.equal((await req('attorney','/api/state','PUT',state)).status,200);
  assert.equal((await req('attorney','/api/approvals/decide','POST',{id:review.id,decision:'approve',confirmation:'APPROVE'})).status,409);
  const fresh=await req('staff','/api/approvals/request','POST',{documentId:docId,gate:'Demand review'}).then(r=>r.json());const approved=await req('attorney','/api/approvals/decide','POST',{id:fresh.id,decision:'approve',confirmation:'APPROVE'}).then(r=>r.json());assert.equal(approved.identity,'Named staff account');assert.match(approved.externalAction,/None/);
  state=storage.readState();await mkdir(join(dir,'files'),{recursive:true});const fileId='11111111-2222-3333-4444-555555555555';await writeFile(join(dir,'files',fileId),'Fictional recovery evidence');state.files.push({id:fileId,name:'fictional.txt',matter:'ML-ONBOARD',size:26});storage.writeState(state);
  const bytes=await backup.createBackup(password);assert.ok(!bytes.includes(Buffer.from('Imported Example')));const decoded=await backup.decodeBackup(bytes,password);assert.equal(decoded.files.length,1);
  await assert.rejects(()=>backup.decodeBackup(bytes,'Wrong-password-123456789'),/Incorrect passphrase/);const damaged=Buffer.from(bytes);damaged[damaged.length-1]^=1;await assert.rejects(()=>backup.decodeBackup(damaged,password),/damaged/);
  const target=join(dir,'recovered');const restored=await backup.restoreBackup(bytes,password,target);assert.equal(restored.matters,6);assert.equal(await readFile(join(target,'files',fileId),'utf8'),'Fictional recovery evidence');const recoveredDb=new DatabaseSync(join(target,'workspace.sqlite'));assert.equal(JSON.parse(recoveredDb.prepare('SELECT payload FROM workspace').get().payload).matters.length,6);recoveredDb.close();await assert.rejects(()=>backup.restoreBackup(bytes,password,target),/NEW destination/);
  const audit=await req('admin','/api/access/events').then(r=>r.json());assert.ok(audit.events.some(e=>e.actor==='attorney'&&e.action.includes('/api/approvals/decide 200')));
  await req('viewer','/api/auth/logout','POST');assert.equal((await req('viewer','/api/state')).status,401);
 }finally{p.kill();if(p.exitCode===null)await once(p,'exit');storage.closeStorage();access.closeAccess();await cleanup(dir);}

});
