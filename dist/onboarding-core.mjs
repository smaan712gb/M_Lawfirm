export const importFields=['id','name','email','phone','type','stage','owner','language','incident','summary','provider','insurer'];
export const matterStages=['Intake','Investigation','Discovery','Demand','Litigation','Settlement','Closed'];
const aliases={id:['id','matter_id','case_id','matter_number','case_number'],name:['name','client','client_name','full_name'],email:['email','email_address'],phone:['phone','phone_number','mobile'],type:['type','practice_area','case_type'],stage:['stage','status'],owner:['owner','attorney','assigned_to'],language:['language','preferred_language'],incident:['incident','incident_date','date_of_loss'],summary:['summary','description','notes'],provider:['provider','medical_provider'],insurer:['insurer','insurance_company']};
export function parseCsv(text){
 if(typeof text!=='string'||text.length>2000000)throw Error('Use a CSV of at most 2 MB.');
 text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],cell='',quoted=false,afterQuote=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"'){quoted=false;afterQuote=true;}else cell+=c;continue;}
  if(c==='"'){if(cell||afterQuote)throw Error('Unexpected quote in CSV.');quoted=true;}
  else if(c===','||c==='\r'||c==='\n'){row.push(cell);cell='';afterQuote=false;if(c!==','){if(row.some(v=>v.trim()))rows.push(row);row=[];if(c==='\r'&&text[i+1]==='\n')i++;}}
  else{if(afterQuote&&c.trim())throw Error('Unexpected text after a quoted field.');if(!afterQuote)cell+=c;}
 }
 if(quoted)throw Error('CSV has an unclosed quoted field.');row.push(cell);if(row.some(v=>v.trim()))rows.push(row);
 if(rows.length<2)throw Error('Include a header row and at least one matter.');if(rows.length>1001)throw Error('Import at most 1,000 matters per batch.');
 const headers=rows.shift().map(s=>s.trim());if(headers.some(h=>!h)||new Set(headers).size!==headers.length)throw Error('CSV headers must be unique and nonempty.');
 return {headers,rows};
}
export function inferMapping(headers){const out={};for(const field of importFields){const h=headers.find(h=>aliases[field].includes(h.trim().toLowerCase().replace(/[\s-]+/g,'_')));out[field]=h||'';}return out;}
export function previewImport(csv,mapping,existing=[]){
 const {headers,rows}=parseCsv(csv);mapping=mapping||inferMapping(headers);
 if(!mapping.id||!mapping.name)throw Error('Map both the matter ID and client name columns.');
 if(Object.keys(mapping).some(k=>!importFields.includes(k))||Object.values(mapping).some(v=>v&&!headers.includes(v)))throw Error('Invalid column mapping.');
 const seen=new Set(existing.map(m=>m.id.toLowerCase())),emailSet=new Set(existing.map(m=>(m.email||'').toLowerCase()).filter(Boolean));
 const items=rows.map((cells,i)=>{
  const record=Object.fromEntries(importFields.map(k=>[k,mapping[k]?String(cells[headers.indexOf(mapping[k])]||'').trim():''])),errors=[],warnings=[];
  if(cells.length!==headers.length)errors.push('Column count does not match header.');
  if(!/^[A-Za-z0-9][A-Za-z0-9._-]{1,79}$/.test(record.id))errors.push('Matter ID must be 2–80 letters, digits, dots, underscores or hyphens.');
  if(record.name.length<2||record.name.length>150)errors.push('Client name must contain 2–150 characters.');
  if(record.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email))errors.push('Email is invalid.');
  if(record.incident&&(!/^\d{4}-\d{2}-\d{2}$/.test(record.incident)||isNaN(Date.parse(record.incident))||new Date(record.incident).toISOString().slice(0,10)!==record.incident))errors.push('Incident date must be a real YYYY-MM-DD date.');
  if(Object.values(record).some(v=>v.length>3000))errors.push('A field exceeds 3,000 characters.');
  record.stage=record.stage?matterStages.find(s=>s.toLowerCase()===record.stage.toLowerCase())||record.stage:'Intake';if(!matterStages.includes(record.stage))errors.push('Map the stage to '+matterStages.join(', ')+'.');
  const duplicate=seen.has(record.id.toLowerCase());if(duplicate)warnings.push('Existing or repeated matter ID: this row will be skipped.');else seen.add(record.id.toLowerCase());
  if(record.email&&emailSet.has(record.email.toLowerCase()))warnings.push('Email matches another matter; review for a possible duplicate.');
  record.type||='Other personal injury';record.owner||='Unassigned';record.language||='English';record.summary||='Imported record; source details require staff review.';record.provider||='Not recorded';record.insurer||='Not recorded';record.incident||='Not recorded';
  return {row:i+2,record,errors,warnings,duplicate};
 });return {headers,mapping,items,valid:items.filter(x=>!x.errors.length&&!x.duplicate).length,invalid:items.filter(x=>x.errors.length).length,duplicates:items.filter(x=>x.duplicate).length};
}
export function applyImport(state,preview,batchId,now=new Date().toISOString()){
 if(preview.invalid)throw Error('Correct all invalid rows before importing.');if(!preview.valid)throw Error('No new matters to import.');state.imports??=[];if(state.imports.some(b=>b.id===batchId))return state;
 const existing=new Set(state.matters.map(m=>m.id.toLowerCase()));const rows=preview.items.filter(x=>!x.duplicate&&!x.errors.length);if(rows.some(x=>existing.has(x.record.id.toLowerCase())))throw Error('Workspace changed. Preview the CSV again.');
 if(state.matters.length+rows.length>10000||state.tasks.length+rows.length>10000)throw Error('Workspace record limit reached. Import a smaller batch.');
 for(const {record}of rows){state.matters.push({...record,created:now.slice(0,10),source:'CSV import',importBatch:batchId});state.tasks.push({id:crypto.randomUUID(),title:'Validate imported record, permissions and dates: '+record.name,matter:record.id,owner:record.owner,date:now.slice(0,10),done:false});}
 state.imports.unshift({id:batchId,date:now,count:rows.length,skipped:preview.duplicates,status:'Imported · staff verification pending'});return state;
}
export const onboardingSteps=[
 ['inventory','Inventory current software and renewal dates','Name the current owner, export format and cost for each system.'],
 ['scope','Agree the first pilot workflow','Begin with deidentified intake, callbacks and consultation scheduling.'],
 ['access','Confirm named staff and access rules','Separate partner, attorney, staff and read-only accounts. Define matter restrictions before client data.'],
 ['sources','Review data exports and retention','Check export rights, duplicates, missing fields, retention and existing backup.'],
 ['rules','Certify legal rules and templates','The supervising attorneys must certify authorities, effective dates, deadline calculations and filing templates.'],
 ['voice','Approve Maya and escalation','Approve voice/language quality, AI notice, identity checks and a tested human fallback.'],
 ['backup','Test backup and recovery','Create an encrypted backup, restore into a new folder, and compare counts and file hashes.'],
 ['security','Complete security and privacy review','Validate extra sign-in protection, matter access, encryption, hosting, logging and data handling.'],
 ['parallel','Agree parallel-run exit criteria','Keep current systems until each replacement proves its workflow and reconciliation.'],
 ['signoff','Record partner go-live decision','A checked box records planning progress; it does not certify production readiness.']
];
export const replacementAreas=[
 ['CRM / intake','Matter pipeline, linked review tasks and CSV import','Parallel test duplicate handling and source reconciliation'],
 ['Reception / calendar','Lead capture, callbacks, verified updates and reservations','Carrier, delivery, language QA and human escalation'],
 ['Case work / documents','Tasks, files, draft preparation and internal review queue','OCR, versioned DMS, validated templates and filing checks'],
 ['Legal knowledge','Matter graph, source registry and official-feed snapshots','Certified law ontology, citation verification and matter bridge'],
 ['Accounting / trust','Expenses, time and exports','Validated ledger, bank reconciliation, liens and disbursement controls'],
 ['IT / continuity','Named accounts, role checks, audit and encrypted backups','MFA, matter walls, deployment review and recovery drill']
];
