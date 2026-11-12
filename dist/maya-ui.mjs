import {MayaService,languages,copy} from './maya-core.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const apiFetch=(...args)=>(window.mlawApi||fetch)(...args);
export async function openMaya({modal,read,write,mode,refresh,voiceConfigured,toast}){
 let lang='en',session,response,busy=false,recorder,stream,audio,audioUrl,recordingTimer,voiceEpoch=0,history=[];
 const demo=new MayaService({read,write,demo:true,challenge:async()=>{},verify:async(s,code)=>code==='314159'&&read().matters.some(m=>m.id===s.reference)});
 async function api(path,data){const r=await apiFetch('/api/reception/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();if(!r.ok)throw Error(d.error||'Reception service unavailable');return d}
 modal('M LAW / MAYA',`<div class="maya-layout"><aside class="maya-profile"><div class="maya-portrait"><maya-avatar></maya-avatar></div><p class="eyebrow">YOUR FIRST CONNECTION</p><h2>Meet <em>Maya.</em></h2><p>A little warmth.<br>A clearer next step.</p><div class="maya-wave">${Array.from({length:22},(_,i)=>`<i style="--n:${i%7}"></i>`).join('')}</div><button class="button light small" id="mayaSample">Listen to her voice ◌</button><span class="maya-disclosure">Virtual receptionist · AI-generated identity<br>${mode==='server'?'Private service workspace':'Interactive demo · fictional information only'}</span></aside><section class="maya-conversation"><div class="chat-controls"><select id="mayaLanguage" aria-label="Maya language">${Object.entries(languages).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><span class="status" id="mayaConnection">${mode==='server'?'PRIVATE RECEPTION':'DEMONSTRATION'}</span></div><div id="mayaMessages" class="messages" aria-live="polite"></div><div id="mayaChoices" class="maya-choices"></div><div id="mayaHint" class="subtle"></div><form id="mayaForm" class="assistant-box"><input id="mayaInput" autocomplete="off" aria-label="Message Maya" placeholder="Type your response…" maxlength="2000" required><button class="button dark small" id="mayaSend" aria-label="Send to Maya">↗</button></form><div class="maya-controls"><button id="mayaSpeak" class="text-button">Read response ◌</button><button id="mayaMic" class="text-button">Hold a voice turn ♩</button><button id="mayaRestart" class="text-button">Start again ↻</button></div><p class="subtle" style="font-size:9px">No call is connected to the firm’s telephone number. Calendar reservations stay inside this workspace. Case updates require verification; legal advice stays with your attorney.</p></section></div>`);
 const $=s=>document.querySelector(s),dialog=$('#modal');dialog.classList.add('maya-shell');
 function activity(state='idle'){dialog.querySelector('maya-avatar')?.setAttribute('state',state);const profile=dialog.querySelector('.maya-profile');if(profile)profile.dataset.state=state}
 function stopVoice(){voiceEpoch++;audio?.pause();window.speechSynthesis?.cancel();if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null}activity()}
 function playAudio(src){stopVoice();const ticket=voiceEpoch;audio=new Audio(src);audio.onplaying=()=>{if(ticket===voiceEpoch&&dialog.open)activity('speaking')};audio.onended=audio.onpause=audio.onerror=()=>{if(ticket===voiceEpoch)activity()};return audio.play()}
 const cleanup=()=>{dialog.classList.remove('maya-shell');stopVoice();clearTimeout(recordingTimer);stream?.getTracks().forEach(t=>t.stop());if(recorder?.state==='recording')recorder.stop()};dialog.addEventListener('close',cleanup,{once:true});
 function draw(){const c=copy[lang];$('#mayaSample').textContent=['en','es','hi'].includes(lang)?'Listen · '+languages[lang]+' ◌':'Listen · English sample ◌';$('#mayaMessages').innerHTML=history.map(m=>`<div class="message ${m.user?'user':''}" dir="auto">${esc(m.text)}</div>`).join('');$('#mayaMessages').scrollTop=99999;$('#mayaChoices').innerHTML=(response.choices||[]).map(ch=>`<button type="button" data-choice="${esc(ch.action)}">${esc(ch.label)}</button>`).join('');$('#mayaHint').textContent=response.demoCode?'Fictional demo: ML-2601 · verification code 314159. This is not identity verification for real clients.':response.originalLanguage?'Approved update shown in its original language; no unreviewed translation.':'';$('#mayaRestart').textContent=c.restart+' ↻';$('#mayaInput').placeholder= response.step==='code'?'••••••':'…';$('#mayaInput').type=response.step==='code'?'password':'text';$('#mayaMic').disabled=!voiceConfigured||mode!=='server';$('#mayaMic').title=voiceConfigured?'Microphone audio is sent to the firm’s voice service':'Complete voice setup to enable microphone conversations';}
 async function start(){if(busy)return;stopVoice();activity('thinking');busy=true;try{response=mode==='server'?await api('start',{language:lang}):demo.start(lang);session=response.sessionId;history=[{text:response.text}];draw()}catch(e){toast(e.message)}finally{busy=false;activity()}}
 async function send(text='',action=''){if(busy)return;stopVoice();activity('thinking');busy=true;$('#mayaSend').disabled=true;history.push({user:true,text:response.step==='code'?'••••••':text||response.choices?.find(c=>c.action===action)?.label||action});try{response=mode==='server'?await api('message',{sessionId:session,text,action}):await demo.send(session,{text,action});history.push({text:response.text+(response.summary?'\n\n'+Object.entries(response.summary).filter(([key])=>key!=='start').map(([,value])=>value).join('\n'):'')+(response.receipt?'\n\n'+response.receipt.id+(response.receipt.when?'\n'+response.receipt.when:''):'')});if(mode==='server')await refresh();draw()}catch(e){history.push({text:e.message});draw()}finally{busy=false;activity();if($('#mayaSend'))$('#mayaSend').disabled=false}}
 $('#mayaForm').onsubmit=e=>{e.preventDefault();const input=$('#mayaInput');const t=input.value;input.value='';send(t)};$('#mayaChoices').onclick=e=>{const b=e.target.closest('[data-choice]');if(b)send('',b.dataset.choice)};$('#mayaLanguage').onchange=e=>{if(busy){e.target.value=lang;return}lang=e.target.value;start()};$('#mayaRestart').onclick=()=>start();
 $('#mayaSample').onclick=()=>playAudio('/assets/'+({es:'maya-es.wav',hi:'maya-hi.wav'}[lang]||'maya-welcome.wav')).catch(()=>{activity();toast('Voice sample is not available.')});
 $('#mayaSpeak').onclick=async()=>{
  stopVoice();const ticket=voiceEpoch;activity('thinking');
  try{
   if(mode==='server'&&voiceConfigured){
    const r=await apiFetch('/api/reception/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:response.text,language:lang})});
    if(!r.ok)throw Error('Voice is not yet available in this language. Text remains available.');
    const blob=await r.blob();if(ticket!==voiceEpoch||!dialog.open)return;
    const url=URL.createObjectURL(blob);const playing=playAudio(url);audioUrl=url;await playing;
   }else{
    const code={en:'en',es:'es',hi:'hi',ur:'ur',pa:'pa',ar:'ar'}[lang],voices=speechSynthesis.getVoices().filter(v=>v.lang.startsWith(code));
    if(!voices.length)throw Error('Your device has no voice for this language.');
    const voice=voices.find(v=>/female|zira|samantha|susan|helena|sabina|heera/i.test(v.name))||voices[0];
    const u=new SpeechSynthesisUtterance(response.text);u.voice=voice;u.lang=voice.lang;u.rate=.9;
    u.onstart=()=>{if(ticket===voiceEpoch&&dialog.open)activity('speaking')};
    u.onend=u.onerror=()=>{if(ticket===voiceEpoch)activity()};
    speechSynthesis.speak(u);toast('Device voice preview; voice depends on your device.');
   }
  }catch(e){if(ticket===voiceEpoch||dialog.open){activity();toast(e.message)}}
 };
 $('#mayaMic').onclick=async()=>{
  try{
   if(recorder?.state==='recording'){recorder.stop();return}
   stopVoice();stream=await navigator.mediaDevices.getUserMedia({audio:true});
   if(!dialog.open){stream.getTracks().forEach(t=>t.stop());return}
   const chunks=[];recorder=new MediaRecorder(stream);
   recorder.ondataavailable=e=>chunks.push(e.data);
   recorder.onstop=async()=>{
    clearTimeout(recordingTimer);stream.getTracks().forEach(t=>t.stop());$('#mayaMic')&&($('#mayaMic').textContent='Hold a voice turn ♩');
    if(!dialog.open)return;activity('thinking');
    try{
     const blob=new Blob(chunks,{type:recorder.mimeType});
     const r=await apiFetch('/api/reception/transcribe',{method:'POST',headers:{'Content-Type':blob.type},body:blob});
     const d=await r.json();if(!r.ok)throw Error(d.error);if(d.text&&dialog.open)await send(d.text);
    }catch(e){toast(e.message)}finally{activity()}
   };
   recorder.start();activity('listening');$('#mayaMic').textContent='Stop & send recording ■';
   recordingTimer=setTimeout(()=>{if(recorder?.state==='recording')recorder.stop()},20000);
  }catch(e){activity();stream?.getTracks().forEach(t=>t.stop());toast(e.message)}
 };
 await start();
}
