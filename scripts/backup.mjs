import {readFile,writeFile} from 'node:fs/promises';
import {createInterface} from 'node:readline/promises';
import {createBackup,restoreBackup,decodeBackup,backupSummary} from '../lib/backup.mjs';
const [command,path,destination]=process.argv.slice(2);
if(!['create','inspect','restore'].includes(command)||!path||(command==='restore'&&!destination))throw Error('Usage: node scripts/backup.mjs create FILE | inspect FILE | restore FILE NEW_DIRECTORY. Supply passphrase on stdin; never in arguments.');
const rl=createInterface({input:process.stdin});const pass=(await rl.question('')).trim();rl.close();
if(command==='create'){await writeFile(path,await createBackup(pass),{flag:'wx'});console.log('Encrypted backup created. Store the passphrase separately.');}
if(command==='inspect')console.log(JSON.stringify(backupSummary(await decodeBackup(await readFile(path),pass)),null,2));
if(command==='restore')console.log(JSON.stringify(await restoreBackup(await readFile(path),pass,destination),null,2));
