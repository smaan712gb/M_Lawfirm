import {DatabaseSync} from 'node:sqlite';
import {randomBytes,createHash,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {resolve} from 'node:path';
import {dataDir} from './storage.mjs';
const derive=promisify(scrypt),hash=s=>createHash('sha256').update(s).digest('hex');
const db=new DatabaseSync(resolve(dataDir,'access.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,role TEXT NOT NULL,salt TEXT NOT NULL,password TEXT NOT NULL,disabled INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL,csrf TEXT NOT NULL,expires INTEGER NOT NULL,last_seen INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,at TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL);`);
export const accountMode=process.env.AUTH_MODE==='accounts';
export const hasUsers=()=>db.prepare('SELECT COUNT(*) AS n FROM users WHERE disabled=0').get().n>0;
const roles=['admin','attorney','staff','viewer'];
const key=async(password,salt)=>Buffer.from(await derive(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024}));
export async function createUser({username,name,role,password}){
 const id=String(username).trim().toLowerCase();if(!/^[a-z0-9._@-]{3,100}$/.test(id)||!roles.includes(role)||typeof name!=='string'||name.length<2||name.length>100)throw Error('Provide a valid username, name and role: admin, attorney, staff or viewer.');
 if(typeof password!=='string'||password.length<16||password.length>256)throw Error('Use a password of 16–256 characters.');
 const salt=randomBytes(32).toString('hex'),derived=(await key(password,salt)).toString('hex');
 db.prepare('INSERT INTO users(id,name,role,salt,password) VALUES(?,?,?,?,?)').run(id,name,role,salt,derived);event(id,'Account created');return {username:id,name,role};
}
export function disableUser(id){db.prepare('UPDATE users SET disabled=1 WHERE id=?').run(id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);event('local-admin','Account disabled: '+id);}
export const listUsers=()=>db.prepare('SELECT id AS username,name,role,disabled FROM users').all();
const attempts=new Map();
export async function login(username,password,ip){
 const now=Date.now(),id=String(username||'').toLowerCase().trim(),bucket=ip+'|'+id;
 for(const[k,v]of attempts)if(v.until<now)attempts.delete(k);
 const prev=attempts.get(bucket)||{n:0,until:now+15*60000};attempts.set(bucket,prev);if(++prev.n>8){const e=Error('Too many attempts. Try again in 15 minutes.');e.status=429;throw e}
 if(typeof password!=='string'||password.length>256)return null;
 const u=db.prepare('SELECT * FROM users WHERE id=? AND disabled=0').get(id),salt=u?.salt||'no-such-user-fixed-salt';
 const candidate=await key(password,salt),expected=Buffer.from(u?.password||'00'.repeat(64),'hex');if(!u||!timingSafeEqual(candidate,expected))return null;
 attempts.delete(bucket);db.prepare('DELETE FROM sessions WHERE expires<? OR last_seen<?').run(now,now-30*60000);
 const token=randomBytes(32).toString('base64url'),csrf=randomBytes(32).toString('base64url');db.prepare('INSERT INTO sessions VALUES(?,?,?,?,?)').run(hash(token),id,csrf,now+8*3600000,now);event(id,'Signed in');return {token,csrf,user:{id:u.id,name:u.name,role:u.role}};
}
export function identity(req){const token=/(?:^|;\s*)mlaw_session=([A-Za-z0-9_-]+)/.exec(req.headers.cookie||'')?.[1];if(!token)return null;
 const row=db.prepare('SELECT s.*,u.name,u.role,u.disabled FROM sessions s JOIN users u ON u.id=s.user_id WHERE token=?').get(hash(token));const now=Date.now();
 if(!row||row.disabled||row.expires<now||row.last_seen<now-30*60000)return null;
 db.prepare('UPDATE sessions SET last_seen=? WHERE token=?').run(now,row.token);return {id:row.user_id,name:row.name,role:row.role,csrf:row.csrf,session:row.token};
}
export function logout(user){if(user?.session)db.prepare('DELETE FROM sessions WHERE token=?').run(user.session);}
export const cookie=(token='',clear=false)=>`mlaw_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${clear?0:28800}${process.env.PUBLIC_HTTPS==='true'?'; Secure':''}`;
export function event(actor,action){db.prepare('INSERT INTO events(at,actor,action) VALUES(?,?,?)').run(new Date().toISOString(),actor,String(action).slice(0,200));}
export const events=()=>db.prepare('SELECT * FROM events ORDER BY id DESC LIMIT 100').all();
export function mayWrite(user,path){if(user.role==='viewer')return false;if(/^\/api\/(onboarding|backup)\//.test(path))return user.role==='admin';return true;}
export function maySave(user,before,after){
 if(user.role==='admin')return true;if(user.role==='viewer')return false;
 const protectedKeys=user.role==='attorney'?['onboarding','imports','subscriptions']:['onboarding','imports','subscriptions','clientUpdates','expenses','time'];
 if(protectedKeys.some(k=>JSON.stringify(before[k])!==JSON.stringify(after[k])))return false;
 // Non-admins may add and edit, but cannot silently delete existing records.
 return Object.keys(before).filter(k=>Array.isArray(before[k])&&k!=='audit').every(k=>before[k].every(row=>(after[k]||[]).some(next=>next.id===row.id)));
}

export const closeAccess=()=>db.close();
