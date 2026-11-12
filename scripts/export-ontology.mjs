import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {readState,root} from '../lib/storage.mjs';
const s=readState(),out=resolve(root,'exports');mkdirSync(out,{recursive:true});
// A portable relational staging export, not an auto-ontology API import payload.
const quote=v=>String(v??'').replaceAll("'","''");
let sql='-- Fictional M Law prototype staging schema for PostgreSQL. Review before ingestion.\nBEGIN;\nCREATE SCHEMA IF NOT EXISTS mlaw_demo;\nCREATE TABLE IF NOT EXISTS mlaw_demo.matters(id text PRIMARY KEY,client_name text,practice text,stage text,attorney text,provider text,insurer text,summary text);\nCREATE TABLE IF NOT EXISTS mlaw_demo.documents(id text PRIMARY KEY,matter_id text REFERENCES mlaw_demo.matters(id),name text,status text);\n';
for(const m of s.matters)sql+=`INSERT INTO mlaw_demo.matters VALUES('${[m.id,m.name,m.type,m.stage,m.owner,m.provider,m.insurer,m.summary].map(quote).join("','")}') ON CONFLICT(id) DO UPDATE SET stage=EXCLUDED.stage,summary=EXCLUDED.summary;\n`;
for(const d of s.documents)sql+=`INSERT INTO mlaw_demo.documents VALUES('${[d.id,d.matter,d.name,d.type].map(quote).join("','")}') ON CONFLICT(id) DO NOTHING;\n`;
sql+='COMMIT;\n';writeFileSync(resolve(out,'ontology-staging.sql'),sql);console.log('Exported exports/ontology-staging.sql. Import to a dedicated PostgreSQL database, connect that source in NVIDIA auto-ontology, compile and certify terms.');
