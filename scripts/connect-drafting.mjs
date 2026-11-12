import http from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const port=3433,origin=`http://127.0.0.1:${port}`,token=randomBytes(32).toString('hex');
let connected=false,busy=false,attempts=0;
const equal=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value)&&timingSafeEqual(Buffer.from(value),Buffer.from(token));
const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M Law - Private drafting setup</title><style>*{box-sizing:border-box}body{margin:0;background:#f4f2e9;color:#153d35;font:16px/1.6 system-ui,sans-serif}main{max-width:600px;margin:9vh auto;padding:32px}header{letter-spacing:4px;font-weight:700;font-size:13px}h1{font:46px/1.1 Georgia,serif;letter-spacing:-1px;margin:42px 0 24px}p{color:#536b61}label{display:block;font-size:13px;font-weight:600;margin-bottom:8px}input{width:100%;font:18px system-ui;padding:14px;border:1px solid #9da99a;border-radius:6px;background:white}button{margin-top:18px;padding:14px 24px;border:0;border-radius:5px;background:#153d35;color:white;font:600 14px system-ui;cursor:pointer}button:disabled{opacity:.6}small{display:block;color:#64766b;font-size:12px;margin-top:22px}#status{min-height:50px;font-size:14px}a{color:inherit}</style><main><header>M LAW / PRIVATE SETUP</header><h1>Connect your<br><em>drafting assistant.</em></h1><p>Enter your DeepSeek API key here. This setup page runs only on your computer.</p><form id="setup"><label for="key">API key</label><input id="key" name="api-key" type="password" autocomplete="off" spellcheck="false" required minlength="20" maxlength="512" placeholder="Paste your key here"><button id="save">Verify and save</button></form><p id="status" role="status" aria-live="polite">Your key will stay out of the conversation and repository.</p><small>The key is verified directly with api.deepseek.com, then encrypted for your Windows account. Model: deepseek-flash. Drafting requests use your API balance. Use fictional records for this demonstration.</small><p><a href="http://127.0.0.1:3333/#os/copilot">Return to the firm workspace ↗</a></p></main><script nonce="${token}">document.querySelector('#setup').addEventListener('submit',async event=>{event.preventDefault();const key=document.querySelector('#key'),button=document.querySelector('#save'),status=document.querySelector('#status');button.disabled=true;status.textContent='Verifying your connection…';try{const response=await fetch('/connect',{method:'POST',headers:{'Content-Type':'application/json','X-Setup-Token':'${token}'},body:JSON.stringify({key:key.value})});const result=await response.json();if(!response.ok)throw Error(result.error||'Connection failed');key.value='';key.disabled=true;button.textContent='Connected';status.textContent='Saved securely. The meeting workspace can now restart with live drafting enabled.';}catch(error){status.textContent=error.message;button.disabled=false;}});</script></html>`;
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value))}
const server=http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
 res.setHeader('Content-Security-Policy',`default-src 'none'; script-src 'nonce-${token}'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`);
 if(req.headers.host!==`127.0.0.1:${port}`){json(res,403,{error:'Host not allowed.'});return}
 if(req.method==='GET'&&req.url==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);return}
 if(req.method!=='POST'||req.url!=='/connect'){json(res,404,{error:'Not found'});return}
 if(req.headers.origin!==origin||!equal(req.headers['x-setup-token'])||!req.headers['content-type']?.startsWith('application/json')){json(res,403,{error:'Reload the local setup page and retry.'});return}
 if(connected||busy||++attempts>8){json(res,409,{error:connected?'Already saved. Return to the workspace.':'Please wait or restart setup.'});return}
 busy=true;let key='';
 try{
  let bytes=0,body='';for await(const part of req){bytes+=part.length;if(bytes>2048)throw Error('Invalid request');body+=part.toString()}
  key=JSON.parse(body).key?.trim();body='';if(typeof key!=='string'||key.length<20||key.length>512||/\s/.test(key))throw Error('Invalid key');
  const response=await fetch('https://api.deepseek.com/models',{headers:{Authorization:'Bearer '+key},signal:AbortSignal.timeout(25000)});
  if(!response.ok){json(res,400,{error:`The account returned HTTP ${response.status}. Check the key and API account.`});return}
  const models=await response.json();if(!models.data?.some(model=>model.id==='deepseek-flash')){json(res,400,{error:'The selected model is not available to this account.'});return}
  await new Promise((resolve,reject)=>{
   const child=spawn('pwsh',['-NoProfile','-File',fileURLToPath(new URL('./save-drafting-key.ps1',import.meta.url))],{windowsHide:true,stdio:['pipe','pipe','ignore']});
   let output='';child.stdout.on('data',part=>output+=part);child.on('error',()=>reject(Error('Secure save failed')));child.on('close',code=>code===0&&output.trim()==='saved'?resolve():reject(Error('Secure save failed')));child.stdin.on('error',()=>{});child.stdin.end(key);
  });
  connected=true;json(res,200,{connected:true});console.log('DRAFTING_CREDENTIAL_READY');
 }catch{json(res,400,{error:'Connection could not be completed. Check the key and network, then retry.'})}
 finally{key='';busy=false}
});
server.listen(port,'127.0.0.1',()=>console.log(`Private drafting setup: ${origin}`));
setTimeout(()=>server.close(),15*60*1000).unref();
