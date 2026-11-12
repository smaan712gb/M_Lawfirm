import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
let busy=false;
export async function draftWithAgent(context,question,{env=process.env}={}){
 if(!env.AGENT_PYTHON_PATH){const e=Error('Workspace assistance needs setup.');e.status=503;throw e;}
 if(busy){const e=Error('The workspace assistant is preparing another response. Please try again shortly.');e.status=429;throw e;}
 busy=true;
 try{return await new Promise((accept,reject)=>{
  const childEnv={};for(const key of ['PATH','Path','SystemRoot','SYSTEMROOT','COMSPEC','TEMP','TMP','USERPROFILE','LOCALAPPDATA','APPDATA','MODEL_BASE_URL','MODEL_API_KEY','MODEL_NAME','MODEL_THINKING'])if(env[key])childEnv[key]=env[key];
  childEnv.PYTHONUTF8='1';childEnv.MLAW_NODE=process.execPath;
  const child=spawn(env.AGENT_PYTHON_PATH,[resolve(import.meta.dirname,'../agents/draft-matter.py')],{env:childEnv,windowsHide:true,stdio:['pipe','pipe','ignore']});
  let output='',done=false;
  function fail(){if(done)return;done=true;clearTimeout(timer);child.kill();const e=Error('The workspace assistant could not complete the request. Please retry or check its connection.');e.status=502;reject(e);}
  const timer=setTimeout(fail,100000);timer.unref();
  child.on('error',fail);child.stdin.on('error',fail);child.stdout.on('data',data=>{output+=data;if(output.length>50000)fail();});
  child.on('close',code=>{if(done)return;if(code!==0)return fail();try{const result=JSON.parse(output);if(typeof result.content!=='string'||result.retrieval?.matterId!==context.matter.id||!result.retrieval.toolReads)throw Error();done=true;clearTimeout(timer);accept(result);}catch{fail();}});
  child.stdin.end(JSON.stringify({context,question}));
 });}finally{busy=false;}
}
