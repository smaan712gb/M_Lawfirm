/** Server-only model access. Credentials and provider response bodies never reach the browser. */
export async function completeModel(messages,maxTokens,{env=process.env,fetchImpl=fetch}={}){
 if(!env.MODEL_BASE_URL||!env.MODEL_NAME||(!env.MODEL_API_KEY&&env.MODEL_LOCAL!=='true')){
  const error=Error('Drafting assistance needs setup.');error.status=503;throw error;
 }
 const payload={model:env.MODEL_NAME,max_tokens:maxTokens,messages,stream:false};
 if(['enabled','disabled'].includes(env.MODEL_THINKING))payload.thinking={type:env.MODEL_THINKING};
 let response;
 try{
  response=await fetchImpl(env.MODEL_BASE_URL.replace(/\/$/,'')+'/chat/completions',{
   method:'POST',headers:{'Content-Type':'application/json',...(env.MODEL_API_KEY?{Authorization:'Bearer '+env.MODEL_API_KEY}:{})},
   body:JSON.stringify(payload),signal:AbortSignal.timeout(60000)
  });
 }catch{
  const error=Error('The drafting service could not respond. Please retry.');error.status=502;throw error;
 }
 if(!response.ok){const error=Error('Drafting service returned HTTP '+response.status+'. Check the connected account.');error.status=502;throw error;}
 let data;try{data=await response.json()}catch{const error=Error('Drafting service returned an unreadable response.');error.status=502;throw error;}
 const choice=data.choices?.[0],content=choice?.message?.content;
 if(choice?.finish_reason==='length'){const error=Error('The response exceeded its length limit. Request a shorter draft.');error.status=502;throw error;}
 if(typeof content!=='string'||!content.trim()){const error=Error('Drafting service returned no usable text. Please retry.');error.status=502;throw error;}
 return content;
}
