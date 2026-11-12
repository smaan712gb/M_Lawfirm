// Presentation follows the task being discussed, not inferred mental health or emotion.
export const mayaExpressions=Object.freeze({
 hello:'warm',name:'attentive',phone:'attentive',story:'concerned',confirm:'focused',
 saved:'reassuring',choose:'warm',booked:'warm',client:'focused',code:'focused',
 denied:'concerned',noUpdate:'reassuring',callbackSaved:'reassuring',invalid:'attentive',
 handoff:'concerned',office:'warm',update:'focused'
});
export function mayaExpression(key,activity='idle'){
 if(activity==='listening')return 'attentive';
 if(activity==='thinking')return 'focused';
 return mayaExpressions[key]||'attentive';
}
// Explicit conversational cues; no diagnosis from a caller's voice or identity.
export function conversationCue(text){
 const value=String(text).toLowerCase();
 if(/\b(died|death|passed away|funeral|terrified|scared|crying|severe pain|hurt|injured|accident)\b|وفات|انتقال|زخمی|درد|ڈر|حادث|وفاة|ألم|خائف|موت|चोट|दर्द|डर|मृत्यु|falleci|muri[oó]|dolor|accidente/u.test(value))return {expression:'concerned',pace:.96};
 if(/\b(frustrated|angry|upset|worried|confused)\b|پریشان|ناراض|غاضب|قلق|परेशान|नाराज़|preocupad|enojad/u.test(value))return {expression:'reassuring',pace:.96};
 if(/^(?:ha[ ,!-]*){2,}|\b(lol|that was funny)\b|\[laughter\]|ہاہا|هههه|हाहा|jajaja/u.test(value))return {expression:'amused',pace:1,expires:Date.now()+6000};
 if(/\b(thank you|thanks|great|wonderful)\b|شکریہ|شكرا|شكرًا|धन्यवाद|शुक्रिया|gracias/u.test(value))return {expression:'warm',pace:1};
 return null;
}
