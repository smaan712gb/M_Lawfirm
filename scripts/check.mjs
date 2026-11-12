import {readdir,readFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const root=resolve(import.meta.dirname,'..');let checked=0;
for(const folder of ['dist','lib','scripts','agents'])for(const entry of await readdir(join(root,folder),{withFileTypes:true}))if(entry.isFile()&&/\.m?js$/.test(entry.name)){const path=join(root,folder,entry.name),r=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);checked++;}
for(const name of ['server.mjs','mcp-server.mjs','reception-mcp.mjs']){const r=spawnSync(process.execPath,['--check',join(root,name)],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);checked++;}
const vendorNames=/Hermes|OpenJarvis|NVIDIA|DeepSeek|Ollama|Pipecat|Kokoro|faster-whisper|Keycloak|Temporal|SQLite|Hostinger|Asterisk|Paperless-ngx|Docassemble|ERPNext|Chatterbox|MuseTalk|LivePortrait|Qwen3/i;
for(const entry of await readdir(join(root,'dist'),{withFileTypes:true}))if(entry.isFile()&&/\.(?:m?js|html|json)$/.test(entry.name)){const text=await readFile(join(root,'dist',entry.name),'utf8');if(vendorNames.test(text))throw Error('Technology branding remains in firm-facing assets: '+entry.name);}
console.log(`Syntax checked ${checked} scripts. Firm-facing assets contain no dependency/vendor branding.`);
