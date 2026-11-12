import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {createUser,disableUser,listUsers} from '../lib/access.mjs';
const [action,username,name,role]=process.argv.slice(2);
if(action==='list'){console.log(JSON.stringify(listUsers(),null,2));}
else if(action==='disable'&&username){disableUser(username);console.log('Account disabled and sessions revoked.');}
else if(action==='add'&&username&&name&&role){
 // A pipe accepts a password without echo, shell arguments or repository files.
 // Interactive input is masked with raw mode rather than readline echo.
 let password='';if(stdin.isTTY){stdout.write('New password (16+ characters): ');stdin.setRawMode(true);stdin.resume();password=await new Promise((resolve,reject)=>{const onData=chunk=>{for(const c of chunk.toString()){if(c==='\u0003'){stdin.off('data',onData);reject(Error('Cancelled'));return}if(c==='\r'||c==='\n'){stdin.off('data',onData);resolve(password);return}if(c==='\u007f'||c==='\b'){password=password.slice(0,-1);continue}if(c>=' '&&password.length<256)password+=c}};stdin.on('data',onData)}).finally(()=>{stdin.setRawMode(false);stdin.pause();stdout.write('\n')});}else{const rl=createInterface({input:stdin});password=(await rl.question('')).trim();rl.close();}
 console.log(JSON.stringify(await createUser({username,name,role,password})));
}else{console.log('Usage: node scripts/user.mjs add USERNAME "Full Name" admin|attorney|staff|viewer\n       node scripts/user.mjs list\n       node scripts/user.mjs disable USERNAME');process.exitCode=1;}
