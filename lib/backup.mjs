import {createCipheriv,createDecipheriv,randomBytes,scrypt,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {readFile,mkdir,writeFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {readState,dataDir,validState} from './storage.mjs';
const derive=promisify(scrypt),magic=Buffer.from('MLAWBK01'),limit=50*1024*1024;
const digest=b=>createHash('sha256').update(b).digest('hex');
async function key(pass,salt){if(typeof pass!=='string'||pass.length<16||pass.length>256)throw Error('Use a backup passphrase of 16–256 characters.');return Buffer.from(await derive(pass,salt,32,{N:32768,r:8,p:1,maxmem:64*1024*1024}));}
export async function createBackup(pass){
 const state=readState(),files=[];let size=0;for(const f of state.files){if(!/^[0-9a-f-]{36}$/.test(f.id))throw Error('An invalid file ID prevents a complete backup.');const bytes=await readFile(resolve(dataDir,'files',f.id));size+=bytes.length;if(size>32*1024*1024)throw Error('Use an administrator filesystem backup for more than 32 MB of files.');files.push({id:f.id,sha256:digest(bytes),data:bytes.toString('base64')});}
 const plaintext=Buffer.from(JSON.stringify({format:'mlaw-workspace-v1',created:new Date().toISOString(),state,files}));if(plaintext.length>limit)throw Error('Backup exceeds the portable bundle limit.');
 const salt=randomBytes(32),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',await key(pass,salt),iv);cipher.setAAD(magic);const encrypted=Buffer.concat([cipher.update(plaintext),cipher.final()]);return Buffer.concat([magic,salt,iv,cipher.getAuthTag(),encrypted]);
}
export async function decodeBackup(bytes,pass){
 if(bytes.length<68||bytes.length>limit+68||!bytes.subarray(0,8).equals(magic))throw Error('Unsupported or oversized backup.');let data;
 try{const decipher=createDecipheriv('aes-256-gcm',await key(pass,bytes.subarray(8,40)),bytes.subarray(40,52));decipher.setAAD(magic);decipher.setAuthTag(bytes.subarray(52,68));data=JSON.parse(Buffer.concat([decipher.update(bytes.subarray(68)),decipher.final()]).toString());}catch{throw Error('Incorrect passphrase or damaged backup.');}
 if(data.format!=='mlaw-workspace-v1'||!validState(data.state)||!Array.isArray(data.files)||data.files.length>10000)throw Error('Invalid backup manifest.');
 const ids=new Set();for(const f of data.files){if(!/^[0-9a-f-]{36}$/.test(f.id)||ids.has(f.id)||typeof f.data!=='string')throw Error('Invalid backup file.');ids.add(f.id);if(digest(Buffer.from(f.data,'base64'))!==f.sha256)throw Error('Backup file checksum mismatch.');}
 if(data.state.files.some(f=>!ids.has(f.id)))throw Error('A linked file is missing from the backup.');return data;
}
export const backupSummary=data=>({created:data.created,matters:data.state.matters.length,documents:data.state.documents.length,tasks:data.state.tasks.length,files:data.files.length,checksumsVerified:true,accountsIncluded:false});
export async function restoreBackup(bytes,pass,target){
 const data=await decodeBackup(bytes,pass),dir=resolve(target);
 try{await stat(dir);throw Error('Restore requires a NEW destination directory. Existing data is never overwritten.');}catch(e){if(e.code!=='ENOENT')throw e;}
 await mkdir(dir);await mkdir(resolve(dir,'files'));const db=new DatabaseSync(resolve(dir,'workspace.sqlite'));
 try{db.exec('CREATE TABLE workspace(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,payload TEXT NOT NULL)');const state={...data.state};delete state._revision;db.prepare('INSERT INTO workspace VALUES(1,0,?)').run(JSON.stringify(state));for(const f of data.files)await writeFile(resolve(dir,'files',f.id),Buffer.from(f.data,'base64'),{flag:'wx'});}finally{db.close();}
 return {...backupSummary(data),destination:dir};
}
