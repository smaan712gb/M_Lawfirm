// A locally rendered portrait. No camera, external avatar service or tracking.
const labels={idle:'Here to help',listening:'Listening to you',thinking:'One moment…',speaking:'Speaking'};
class MayaAvatar extends HTMLElement {
 static observedAttributes=['state'];
 connectedCallback(){
  if(this.initialized)return;
  this.initialized=true;
  this.innerHTML=`<div class="maya-avatar-frame" role="img" aria-label="Maya, M Law’s virtual receptionist"><img class="maya-avatar-base" src="/assets/maya-portrait.png" width="1254" height="1254" alt="" decoding="async"><img class="maya-avatar-blink" src="/assets/maya-blink.png" width="1254" height="1254" alt="" aria-hidden="true" decoding="async"></div><div class="maya-avatar-caption"><span class="maya-avatar-activity"><span class="maya-avatar-signal" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span data-avatar-state>Here to help</span></span><small>Maya · Virtual receptionist</small></div><button class="maya-motion" type="button" aria-label="Pause Maya animation" aria-pressed="false" title="Pause Maya animation">Ⅱ</button>`;
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
 disconnectedCallback(){this.reduced?.removeEventListener('change',this.onPreference);this.initialized=false;}
 updateMotion(){
  if(!this.motionButton)return;
  const paused=this.userPaused||this.reduced.matches;
  this.toggleAttribute('motion-paused',paused);
  this.motionButton.disabled=this.reduced.matches;
  this.motionButton.textContent=paused?'▷':'Ⅱ';
  this.motionButton.setAttribute('aria-pressed',String(paused));
  this.motionButton.setAttribute('aria-label',paused?'Play Maya animation':'Pause Maya animation');
  this.motionButton.title=this.reduced.matches?'Animation follows your device’s reduced-motion preference':this.motionButton.getAttribute('aria-label');
 }
 attributeChangedCallback(){
  const label=this.querySelector('[data-avatar-state]');
  if(label)label.textContent=labels[this.getAttribute('state')]||labels.idle;
 }
}
customElements.define('maya-avatar',MayaAvatar);
