// A locally rendered portrait. No camera, external avatar service or tracking.
class MayaAvatar extends HTMLElement {
 static observedAttributes=['state','expression','talking'];
 connectedCallback(){
  if(this.initialized)return;
  this.initialized=true;
  this.innerHTML=`<div class="maya-avatar-frame" role="img" aria-label="Maya, M Law’s virtual receptionist"><img class="maya-avatar-base" src="/assets/maya-portrait.png" width="1254" height="1254" alt="" decoding="async"><video class="maya-avatar-idle" playsinline muted loop preload="none" aria-hidden="true"></video><video class="maya-avatar-video" playsinline preload="none" aria-label="Maya speaking" hidden></video><img class="maya-avatar-blink" src="/assets/maya-blink.png" width="1254" height="1254" alt="" aria-hidden="true" decoding="async"></div><button class="maya-motion" type="button" aria-label="Pause Maya animation" aria-pressed="false" title="Pause Maya animation">Ⅱ</button>`;
  this.idle=this.querySelector('.maya-avatar-idle');this.idle.muted=true;
  this.idle.onplaying=()=>this.setAttribute('idle-ready','');
  this.idle.onended=()=>{if(this.idle.dataset.expression==='amused')this.setAttribute('expression','warm')};
  this.idle.onerror=()=>this.removeAttribute('idle-ready');
  this.visible=false;
  this.visibility=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.updatePresence()});this.visibility.observe(this);
  this.reduced=matchMedia('(prefers-reduced-motion: reduce)');
  try{this.userPaused=localStorage.getItem('mlaw-maya-motion')==='paused'}catch{this.userPaused=false}
  this.motionButton=this.querySelector('.maya-motion');
  this.motionButton.onclick=()=>{
   this.userPaused=!this.userPaused;
   try{localStorage.setItem('mlaw-maya-motion',this.userPaused?'paused':'playing')}catch{}
   document.querySelectorAll('maya-avatar').forEach(avatar=>{avatar.userPaused=this.userPaused;avatar.updateMotion()});
  };
  this.onPreference=()=>this.updateMotion();
  this.reduced.addEventListener('change',this.onPreference);
  this.updateMotion();this.attributeChangedCallback();
 }
 disconnectedCallback(){this.reduced?.removeEventListener('change',this.onPreference);this.visibility?.disconnect();this.idle?.pause();this.querySelector('.maya-avatar-video')?.pause();this.initialized=false;}
 updateMotion(){
  if(!this.motionButton)return;
  const paused=this.userPaused||this.reduced.matches;
  this.toggleAttribute('motion-paused',paused);
  this.motionButton.disabled=this.reduced.matches;
  this.motionButton.textContent=paused?'▷':'Ⅱ';
  this.motionButton.setAttribute('aria-pressed',String(paused));
  this.motionButton.setAttribute('aria-label',paused?'Play Maya animation':'Pause Maya animation');
  this.motionButton.title=this.reduced.matches?'Animation follows your device’s reduced-motion preference':this.motionButton.getAttribute('aria-label');
  this.updatePresence();
 }
 updatePresence(){
  if(!this.idle)return;
  const state=this.getAttribute('state');
  let expression=state==='thinking'?'focused':this.getAttribute('expression')||(state==='listening'?'attentive':'warm');
  if(!['warm','attentive','concerned','reassuring','focused','amused'].includes(expression))expression='warm';
  if(this.hasAttribute('motion-paused')||this.hasAttribute('talking')||!this.visible){this.idle.pause();return}
  if(this.idle.dataset.expression!==expression){
   this.idle.dataset.expression=expression;this.removeAttribute('idle-ready');
   this.idle.loop=expression!=='amused';
   this.idle.src=`/assets/maya-idle-${expression}.mp4?v=20261112c`;
  }
  this.idle.play().catch(()=>{});
 }
 attributeChangedCallback(){this.updatePresence()}
}
customElements.define('maya-avatar',MayaAvatar);
