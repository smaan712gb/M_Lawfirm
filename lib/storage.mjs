import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
export const root=resolve(import.meta.dirname,'..');
export const dataDir=resolve(process.env.DATA_DIR||resolve(root,'.data'));
mkdirSync(dataDir,{recursive:true});
const db=new DatabaseSync(resolve(dataDir,'workspace.sqlite'));
db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS workspace (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, payload TEXT NOT NULL)');
const seed=JSON.parse(readFileSync(resolve(root,'dist/seed.json'),'utf8'));
db.prepare('INSERT OR IGNORE INTO workspace(id,revision,payload) VALUES(1,0,?)').run(JSON.stringify(seed));
export function readState(){const row=db.prepare('SELECT revision,payload FROM workspace WHERE id=1').get();const payload=JSON.parse(row.payload);for(const k of Object.keys(seed))payload[k]??=structuredClone(seed[k]);return {...payload,_revision:row.revision}}
export function writeState(value){const next={...value};delete next._revision;const r=db.prepare('UPDATE workspace SET payload=?,revision=revision+1 WHERE id=1 AND revision=?').run(JSON.stringify(next),value._revision??0);if(!r.changes){const e=Error('Workspace changed in another session. Reload before saving.');e.status=409;throw e}return readState()}
export function validState(s){if(!s||typeof s!=='object'||Array.isArray(s))return false;return Object.keys(seed).every(k=>Array.isArray(s[k])&&s[k].length<=10000)&&s.matters.every(m=>typeof m.id==='string'&&typeof m.name==='string'&&['Intake','Investigation','Discovery','Demand'].includes(m.stage))&&s.expenses.every(e=>Number.isFinite(e.amount)&&e.amount>=0)&&s.time.every(e=>Number.isFinite(e.minutes)&&e.minutes>0)&&Object.keys(s).every(k=>Object.hasOwn(seed,k)||k==='_revision')}
