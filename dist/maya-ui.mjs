import {MayaService,languages,copy} from './maya-core.mjs';
import {findMayaMedia,preferredMayaLanguage,voiceLabels} from './maya-media.mjs';
import {mayaExpression,conversationCue} from './maya-presence.mjs';
import {VoiceConversation,voiceCommand} from './maya-voice.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const apiFetch=(...args)=>(window.mlawApi||fetch)(...args);
export async function openMaya({modal,read,write,mode,refresh,voiceConfigured,toast}){
 let browserStorage;try{browserStorage=window.localStorage}catch{}
 let lang=preferredMayaLanguage(browserStorage,languages),session,response,busy=false,closed=false,audio,audioUrl,voiceEpoch=0,history=[],conversation,voiceStarting=false,pendingVoice=[],callerCue=null,turnVersion=0;
 const media=await fetch('/maya-media.json',{cache:'no-store'}).then(r=>r.ok?r.json():{clips:[]}).catch(()=>({clips:[]}));
 const demo=new MayaService({read,write,demo:true,challenge:async()=>{},verify:async(s,code)=>code==='314159'&&read().matters.some(m=>m.id===s.reference)});
 async function api(path,data){const r=await apiFetch('/api/reception/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();if(!r.ok)throw Error(d.error||'Reception service unavailable');return d}
 modal('M LAW / MAYA',`<div class="maya-layout"><aside class="maya-profile"><div class="maya-portrait"><maya-avatar></maya-avatar></div><p class="eyebrow">YOUR FIRST CONNECTION</p><h2>Meet <em>Maya.</em></h2><p>A little warmth.<br>A clearer next step.</p><div class="maya-wave">${Array.from({length:22},(_,i)=>`<i style="--n:${i%7}"></i>`).join('')}</div><button class="button light small" id="mayaSample">Listen to her voice ◌</button><span class="maya-disclosure">Virtual receptionist · AI-generated identity<br>${mode==='server'?'Private service workspace':'Interactive demo · fictional information only'}</span></aside><section class="maya-conversation"><div class="chat-controls"><select id="mayaLanguage" aria-label="Maya language">${Object.entries(languages).map(([k,v])=>`<option value="${k}" ${k===lang?'selected':''}>${v}</option>`).join('')}</select><span class="status" id="mayaConnection">${mode==='server'?'PRIVATE RECEPTION':'DEMONSTRATION'}</span></div><div id="mayaMessages" class="messages" aria-live="polite"></div><div id="mayaChoices" class="maya-choices"></div><div id="mayaHint" class="subtle"></div><form id="mayaForm" class="assistant-box"><input id="mayaInput" autocomplete="off" aria-label="Message Maya" placeholder="Type your response…" maxlength="2000" required><button class="button dark small" id="mayaSend" aria-label="Send to Maya">↗</button></form><div class="maya-controls"><button id="mayaSpeak" class="text-button">Read response ◌</button><button id="mayaMic" class="text-button">Hold a voice turn ♩</button><button id="mayaStop" class="text-button">Stop voice</button><button id="mayaRestart" class="text-button">Start again ↻</button></div><p class="subtle" style="font-size:9px">No call is connected to the firm’s telephone number. Calendar reservations stay inside this workspace. Case updates require verification; legal advice stays with your attorney.</p></section></div>`);
 const dialog=document.querySelector('#modal'),$=s=>dialog.querySelector(s);dialog.classList.add('maya-shell');
 const avatar=dialog.querySelector('maya-avatar');await customElements.whenDefined('maya-avatar');
 const video=avatar.querySelector('.maya-avatar-video');
 const voiceStatus=document.createElement('p');voiceStatus.id='mayaVoiceStatus';voiceStatus.className='subtle maya-voice-status';voiceStatus.setAttribute('role','status');$('.maya-controls').after(voiceStatus);
 function activity(state='idle'){if(closed)return;if(callerCue?.expires&&Date.now()>callerCue.expires)callerCue=null;const expression=state==='thinking'?'focused':callerCue?.expression||mayaExpression(response?.utterance||'hello',state);avatar.setAttribute('expression',expression);avatar.setAttribute('state',state);const profile=$('.maya-profile');if(profile)profile.dataset.state=state;conversation?.setPlayback(state==='speaking')}
 function setBusy(value){busy=value;if(closed)return;for(const id of ['mayaLanguage','mayaRestart','mayaSend','mayaSample','mayaSpeak']){const control=$('#'+id);if(control)control.disabled=value}if(!value&&pendingVoice.length&&!conversation?.speaking){const pending=pendingVoice.shift();queueMicrotask(()=>acceptVoice(pending.text,pending.timing))}}
 function stopVoice(){voiceEpoch++;if(audio){audio.onpause=audio.onended=audio.onplaying=null;audio.pause()}video.onpause=video.onended=video.onplaying=video.onerror=null;video.pause();video.hidden=true;avatar.removeAttribute('talking');window.speechSynthesis?.cancel();if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null}activity()}
 async function speakText(text,{original=false}={}){
  stopVoice();const ticket=voiceEpoch;if(closed)return;
  const words=voiceLabels[lang];
  if(original){toast(words.original);return}
  try{
   const clip=findMayaMedia(media,lang,text);
   if(clip){
    const version=clip.revision?'?v='+encodeURIComponent(clip.revision):'';
    const element=clip.video?video:new Audio(clip.audio+version);
    if(clip.video){video.src=clip.video+version;video.hidden=false;avatar.setAttribute('talking','')}else audio=element;
    const finish=()=>{if(ticket===voiceEpoch){video.hidden=true;avatar.removeAttribute('talking');activity()}};
    element.playbackRate=callerCue?.pace||1;element.preservesPitch=true;
    element.onplaying=()=>{if(ticket===voiceEpoch&&!closed){activity('speaking');avatar.setAttribute('expression',callerCue?.expression||clip.expression||'warm')}};element.onended=finish;element.onpause=()=>{if(element.paused)finish()};
    element.onerror=finish;await element.play();return;
   }
   if(mode==='server'&&voiceConfigured){
    activity('thinking');
    const r=await apiFetch('/api/reception/speech',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,language:lang})});
    if(!r.ok)throw Error(words.unavailable);
    const blob=await r.blob();if(ticket!==voiceEpoch||closed)return;
    audioUrl=URL.createObjectURL(blob);audio=new Audio(audioUrl);audio.playbackRate=callerCue?.pace||1;audio.preservesPitch=true;
    audio.onplaying=()=>{if(ticket===voiceEpoch&&!closed)activity('speaking')};
    audio.onended=audio.onpause=()=>{if(ticket===voiceEpoch)activity()};await audio.play();return;
   }
   // A system voice would unexpectedly change Maya's identity and delivery.
   // Keep the selected language in text when her own voice is unavailable.
   throw Error(words.unavailable);
  }catch(e){if(ticket!==voiceEpoch||closed)return;video.hidden=true;avatar.removeAttribute('talking');activity();toast(e.name==='NotAllowedError'?voiceLabels[lang].greeting+' — tap to play.':e.message)}
 }
 const cleanup=()=>{closed=true;dialog.classList.remove('maya-shell');stopVoice();conversation?.stop();pendingVoice=[]};dialog.addEventListener('close',cleanup,{once:true});
 function draw(){if(closed)return;const c=copy[lang];$('#mayaSample').textContent=voiceLabels[lang].greeting+' · '+languages[lang];$('#mayaSpeak').textContent=voiceLabels[lang].read;$('#mayaStop').textContent=voiceLabels[lang].stop;$('#mayaMessages').lang=lang;$('#mayaMessages').dir=['ur','ar'].includes(lang)?'rtl':'ltr';$('#mayaChoices').dir=['ur','ar'].includes(lang)?'rtl':'ltr';$('#mayaInput').dir=['ur','ar'].includes(lang)?'rtl':'ltr';$('#mayaMessages').innerHTML=history.map(m=>`<div class="message ${m.user?'user':''}" dir="auto">${esc(m.text)}${m.details?.length?`<div class="maya-response-details">${m.details.map(detail=>`<div dir="auto">${esc(detail)}</div>`).join('')}</div>`:''}</div>`).join('');$('#mayaMessages').scrollTop=99999;$('#mayaChoices').innerHTML=(response.choices||[]).map(ch=>`<button type="button" data-choice="${esc(ch.action)}">${esc(ch.label)}</button>`).join('');$('#mayaHint').textContent=response.demoCode?'Fictional demo: ML-2601 · verification code 314159. This is not identity verification for real clients.':response.originalLanguage?'Approved update shown in its original language; no unreviewed translation.':'';$('#mayaRestart').textContent=c.restart+' ↻';$('#mayaInput').placeholder= response.step==='code'?'••••••':'…';$('#mayaInput').type=response.step==='code'?'password':'text';$('#mayaMic').disabled=!voiceConfigured||mode!=='server';$('#mayaMic').title=voiceConfigured?'Microphone audio is sent to the firm’s voice service':'Complete voice setup to enable microphone conversations';}
 async function start(greet=false){if(busy)return;conversation?.stop();conversation=null;pendingVoice=[];callerCue=null;stopVoice();activity('thinking');setBusy(true);try{response=mode==='server'?await api('start',{language:lang}):demo.start(lang);session=response.sessionId;history=[{text:response.text}];draw();updateVoiceStatus('off');if(greet&&!closed)await speakText(response.text)}catch(e){toast(e.message)}finally{setBusy(false);if(avatar.getAttribute('state')==='thinking')activity()}}
 async function send(text='',action=''){
  if(busy)return;
  const ticket=turnVersion;callerCue=conversationCue(text)||callerCue;
  stopVoice();activity('thinking');setBusy(true);
  history.push({user:true,text:response.step==='code'?'••••••':text||response.choices?.find(c=>c.action===action)?.label||action});
  try{
   response=mode==='server'?await api('message',{sessionId:session,text,action}):await demo.send(session,{text,action});
   const details=response.summary?Object.entries(response.summary).filter(([key])=>key!=='start').map(([,value])=>value):[];
   if(response.receipt){details.push(response.receipt.id);if(response.receipt.when)details.push(response.receipt.when)}
   history.push({text:response.text,details});
   if(mode==='server')await refresh();draw();
   if(!closed&&!response.quiet&&ticket===turnVersion&&!conversation?.speaking&&!pendingVoice.length&&(conversation?.pending||0)<=1)await speakText(response.text,{original:!!response.originalLanguage});
  }catch(e){history.push({text:e.message});draw()}
  finally{setBusy(false);if(avatar.getAttribute('state')==='thinking')activity()}
 }
 $('#mayaForm').onsubmit=e=>{e.preventDefault();const input=$('#mayaInput'),text=input.value.trim();if(!text)return;input.value='';if(busy)pendingVoice.push({text,timing:{}});else send(text)};
 $('#mayaChoices').onclick=e=>{const b=e.target.closest('[data-choice]');if(b)send('',b.dataset.choice)};
 $('#mayaLanguage').onchange=e=>{if(busy){e.target.value=lang;return}lang=e.target.value;try{localStorage.setItem('mlaw-maya-language',lang)}catch{}start(true)};
 $('#mayaRestart').onclick=()=>start(true);
 $('#mayaStop').onclick=()=>{turnVersion++;stopVoice()};
 $('#mayaSample').onclick=()=>speakText(copy[lang].hello);
 $('#mayaSpeak').onclick=()=>speakText(response.text,{original:!!response.originalLanguage});
 $('#mayaInput').oninput=()=>{turnVersion++;stopVoice();activity('listening')};
 $('#mayaInput').onblur=()=>{if(!busy&&avatar.getAttribute('state')==='listening')activity()};
 function updateVoiceStatus(state){if(closed)return;const labels=voiceLabels[lang];$('#mayaMic').textContent=conversation?.active?labels.endVoice:labels.startVoice;$('#mayaMic').setAttribute('aria-pressed',String(!!conversation?.active));voiceStatus.textContent=state==='off'?'':labels[state]||labels.listening;voiceStatus.dataset.state=state}
 async function acceptVoice(text,timing={}){
  if(closed)return;
  const command=voiceCommand(text);
  if(command==='pause'){pendingVoice=[];stopVoice();activity('listening');return}
  if(command==='repeat'){if(!busy)await speakText(response.text,{original:!!response.originalLanguage});return}
  if(command==='acknowledge'){callerCue=conversationCue(text)||{expression:'warm',pace:1};history.push({user:true,text});draw();activity();return}
  if(busy){pendingVoice.push({text,timing});return}
  // A longer or faster turn gets a more measured reply; this is pacing, not emotion recognition.
  if(timing.voicedSeconds>12||text.split(/\s+/).length/Math.max(1,timing.voicedSeconds)>3.5)callerCue=callerCue||{expression:'attentive',pace:.96};
  await send(text,response.step==='confirm'&&['confirm','cancel'].includes(command)?command:'');
 }
 $('#mayaMic').onclick=async()=>{
  if(voiceStarting)return;
  if(conversation?.active){conversation.stop();pendingVoice=[];turnVersion++;stopVoice();return}
  voiceStarting=true;
  try{
   conversation=new VoiceConversation({
    transcribe:async(blob,signal)=>{const r=await apiFetch('/api/reception/transcribe',{method:'POST',headers:{'Content-Type':blob.type,'X-Maya-Language':lang},body:blob,signal});const data=await r.json();if(!r.ok)throw Error(data.error);return data},
    onSpeech:()=>{turnVersion++;stopVoice();activity('listening')},
    onText:acceptVoice,
    onStatus:updateVoiceStatus,onError:error=>{if(!closed)toast(error.message)}
   });
   await conversation.start();if(closed)conversation.stop();else{updateVoiceStatus('listening');conversation.setPlayback(avatar.getAttribute('state')==='speaking')}
  }catch(error){if(!closed)toast(error.message)}finally{voiceStarting=false}
 };
 await start(true);
}
