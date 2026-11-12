import {mayaExpression} from './maya-presence.mjs';
import {voiceCommand} from './maya-voice.mjs';
const normalizedDigits=value=>String(value).replace(/[٠-٩۰-۹०-९]/g,c=>String('٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹०१२३४५६७८९'.indexOf(c)%10));
function spokenSlot(text,offered=[]){
 const value=normalizedDigits(text).toLowerCase().replace(/[\p{P}\p{S}]/gu,' ').replace(/\s+/g,' ').trim().replace(/^(?:the|option|number|opción|número|نمبر|الخيار|رقم|नंबर|विकल्प) /u,'').replace(/(?: (?:one|appointment|slot|please))+$/u,'');
 const words=[['first','one','primera','primero','پہلا','پہلی','الأول','اول','पहला','पहली'],['second','two','segunda','segundo','دوسرا','دوسری','الثاني','دूसरा','दूसरी'],['third','three','tercera','tercero','تیسرا','تیسری','الثالث','तीसरा','तीसरी'],['fourth','four'],['fifth','five'],['sixth','six'],['seventh','seven'],['eighth','eight'],['ninth','nine'],['tenth','ten'],['eleventh','eleven'],['twelfth','twelve']];
 const index=/^(?:[1-9]|1[0-2])$/.test(value)?Number(value)-1:words.findIndex(group=>group.includes(value));
 return index>=0?offered[index]:undefined;
}
export const languages={en:'English',es:'Español',ur:'اردو',hi:'हिन्दी',pa:'ਪੰਜਾਬੀ',ar:'العربية'};
export const copy={
  "en": {
    "hello": "Hi, you've reached M Law Firm. I'm Maya. How can I help?",
    "lead": "New inquiry",
    "book": "Book a consultation",
    "status": "My case update",
    "callback": "Request a callback",
    "name": "Of course. May I have your name?",
    "phone": "And what's the best number to reach you? Please include the country code.",
    "story": "Could you tell me a little about what happened? Just a brief summary for now. Please leave out medical records and sensitive details.",
    "confirm": "Thank you. Shall I save these details for our team?",
    "saved": "Thank you. I've saved your inquiry for our team. A lawyer will review it before we can agree to represent you.",
    "choose": "Let's find a time for you. These appointments are all in New York time.",
    "booked": "You're booked in our calendar. We look forward to speaking with you.",
    "client": "Of course. What's your matter reference? I'll need to verify access before sharing an update.",
    "code": "If that reference matches, we'll send a code to the contact on file. Please enter it here.",
    "denied": "I'm sorry, I couldn't verify access. You can request a callback from our team.",
    "noUpdate": "I don't have an approved update to share just yet. I can help you request a callback.",
    "callbackSaved": "Your callback request is saved. Our team still needs to return your call.",
    "yes": "Yes, save",
    "cancel": "Cancel",
    "handoff": "If you are in immediate danger or need urgent medical assistance, contact local emergency services. I can also help request a callback; I cannot provide emergency care or legal advice.",
    "invalid": "That didn't come through correctly. Could you check it and try once more?",
    "restart": "Start again",
    "office": "Of course. Our offices are in Manhattan and Jericho. I've put the addresses and phone number here for you."
  },
  "es": {
    "hello": "Hola, M Law Firm. Habla Maya. ¿En qué puedo ayudarle?",
    "lead": "Nueva consulta",
    "book": "Reservar una consulta",
    "status": "Estado de mi caso",
    "callback": "Solicitar una llamada",
    "name": "¿Me indica su nombre?",
    "phone": "¿Cuál es su número de teléfono, con código de país?",
    "story": "Cuénteme brevemente qué ocurrió. No incluya expedientes médicos ni identificadores sensibles.",
    "confirm": "¿Desea guardar estos datos para el equipo?",
    "saved": "Su consulta está guardada. Un abogado la revisará antes de aceptar la representación.",
    "choose": "Elija una hora. Las citas se muestran en la hora de Nueva York.",
    "booked": "Su cita está reservada en el calendario del despacho.",
    "client": "Introduzca la referencia de su caso. Verificaré su acceso antes de compartir información.",
    "code": "Si la referencia coincide, se enviará un código al contacto registrado. Introduzca el código.",
    "denied": "No pude verificar el acceso. Solicite una llamada del equipo.",
    "noUpdate": "No hay una actualización aprobada disponible. Puede solicitar una llamada.",
    "callbackSaved": "Su solicitud de llamada está guardada. Un miembro del equipo debe devolverle la llamada.",
    "yes": "Sí, guardar",
    "cancel": "Cancelar",
    "handoff": "Si está en peligro inmediato o necesita atención médica urgente, contacte con los servicios de emergencia locales. No puedo prestar asistencia de emergencia ni asesoramiento jurídico.",
    "invalid": "Revise la información e inténtelo de nuevo.",
    "restart": "Empezar de nuevo",
    "office": "Claro. Tenemos oficinas en Manhattan y Jericho. Aquí tiene las direcciones y el teléfono."
  },
  "ur": {
    "hello": "السلام علیکم۔ ایم لا فرم سے مایا بات کر رہی ہوں۔ بتائیے، میں آپ کی کیا مدد کر سکتی ہوں؟",
    "lead": "نئی درخواست",
    "book": "ملاقات بک کریں",
    "status": "مقدمے کی خبر",
    "callback": "واپسی کال",
    "name": "جی ضرور۔ آپ کا نام بتا دیجیے۔",
    "phone": "آپ سے بات کرنے کے لیے کون سا فون نمبر بہتر رہے گا؟ ملکی کوڈ بھی شامل کر دیجیے۔",
    "story": "ذرا بتائیے، کیا ہوا تھا؟ ابھی مختصر بتا دیں۔ طبی ریکارڈ اور ذاتی شناختی تفصیلات شامل نہ کریں۔",
    "confirm": "شکریہ۔ کیا میں یہ باتیں ہماری ٹیم کے لیے محفوظ کر دوں؟",
    "saved": "آپ کی درخواست محفوظ ہو گئی ہے۔ کیس قبول کرنے سے پہلے ہمارے وکیل اس کا جائزہ لیں گے۔",
    "choose": "اپنے لیے ایک وقت چن لیجیے۔ یہ تمام وقت نیویارک کے ہیں۔",
    "booked": "آپ کی ملاقات ہمارے کیلنڈر میں بک ہو گئی ہے۔",
    "client": "اپنے کیس کا حوالہ بتا دیجیے۔ کوئی خبر دینے سے پہلے رسائی کی تصدیق کرنا ضروری ہے۔",
    "code": "اگر حوالہ مل گیا تو آپ کے رجسٹرڈ رابطے پر ایک کوڈ آئے گا۔ وہ کوڈ یہاں درج کر دیجیے۔",
    "denied": "معاف کیجیے، رسائی کی تصدیق نہیں ہو سکی۔ ہماری ٹیم سے واپسی کال کی درخواست کر سکتے ہیں۔",
    "noUpdate": "ابھی آپ کے لیے کوئی منظور شدہ خبر موجود نہیں ہے۔ چاہیں تو واپسی کال کی درخواست کر سکتے ہیں۔",
    "callbackSaved": "واپسی کال کی درخواست محفوظ ہو گئی ہے۔ ہماری ٹیم کو ابھی آپ سے بات کرنی ہے۔",
    "yes": "جی، محفوظ کریں",
    "cancel": "منسوخ",
    "handoff": "فوری خطرے یا طبی ایمرجنسی میں مقامی ہنگامی خدمات سے رابطہ کریں۔ میں ہنگامی نگہداشت یا قانونی مشورہ نہیں دے سکتی۔",
    "invalid": "یہ معلومات درست نہیں لگ رہیں۔ ایک بار پھر دیکھ کر بتا دیجیے۔",
    "restart": "دوبارہ شروع",
    "office": "جی ضرور۔ ہمارے دفاتر مینہٹن اور جیریکو میں ہیں۔ پتے اور فون نمبر آپ کے سامنے لکھ دیے ہیں۔"
  },
  "hi": {
    "hello": "नमस्ते। एम लॉ फ़र्म, मैं माया बोल रही हूँ। बताइए, मैं आपकी क्या मदद कर सकती हूँ?",
    "lead": "नई पूछताछ",
    "book": "परामर्श बुक करें",
    "status": "मेरे मामले की स्थिति",
    "callback": "वापस कॉल का अनुरोध",
    "name": "आपका नाम क्या है?",
    "phone": "देश कोड सहित आपका फ़ोन नंबर क्या है?",
    "story": "संक्षेप में बताएं क्या हुआ। मेडिकल रिकॉर्ड या संवेदनशील पहचान जानकारी न दें।",
    "confirm": "क्या मैं ये विवरण टीम के लिए सहेज दूँ?",
    "saved": "आपकी पूछताछ सहेज दी गई है। प्रतिनिधित्व से पहले वकील समीक्षा करेगा।",
    "choose": "समय चुनें। सभी समय न्यूयॉर्क के हैं।",
    "booked": "आपकी नियुक्ति फर्म के कैलेंडर में आरक्षित है।",
    "client": "अपने मामले का संदर्भ दर्ज करें। जानकारी देने से पहले पहुँच सत्यापित होगी।",
    "code": "यदि संदर्भ मेल खाता है तो पंजीकृत संपर्क पर कोड भेजा जाएगा। कोड दर्ज करें।",
    "denied": "पहुँच सत्यापित नहीं हुई। टीम से वापस कॉल का अनुरोध करें।",
    "noUpdate": "कोई स्वीकृत अपडेट उपलब्ध नहीं है। वापस कॉल का अनुरोध कर सकते हैं।",
    "callbackSaved": "वापस कॉल का अनुरोध सहेज दिया गया है। टीम को अभी आपको कॉल करना है।",
    "yes": "हाँ, सहेजें",
    "cancel": "रद्द करें",
    "handoff": "तत्काल खतरे या चिकित्सा आपातस्थिति में स्थानीय आपात सेवाओं से संपर्क करें। मैं आपात देखभाल या कानूनी सलाह नहीं दे सकती।",
    "invalid": "जानकारी जाँचें और फिर कोशिश करें।",
    "restart": "फिर से शुरू",
    "office": "ज़रूर। हमारे कार्यालय मैनहैटन और जेरिको में हैं। पते और फ़ोन नंबर यहाँ दिए हैं।"
  },
  "pa": {
    "hello": "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਮਾਇਆ ਹਾਂ, ਐਮ ਲਾਅ ਫਰਮ ਤੋਂ। ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?",
    "lead": "ਨਵੀਂ ਪੁੱਛਗਿੱਛ",
    "book": "ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ",
    "status": "ਮੇਰੇ ਕੇਸ ਦੀ ਸਥਿਤੀ",
    "callback": "ਵਾਪਸੀ ਕਾਲ",
    "name": "ਤੁਹਾਡਾ ਨਾਮ ਕੀ ਹੈ?",
    "phone": "ਦੇਸ਼ ਕੋਡ ਸਮੇਤ ਤੁਹਾਡਾ ਫ਼ੋਨ ਨੰਬਰ ਕੀ ਹੈ?",
    "story": "ਸੰਖੇਪ ਵਿੱਚ ਦੱਸੋ ਕੀ ਹੋਇਆ। ਮੈਡੀਕਲ ਰਿਕਾਰਡ ਜਾਂ ਸੰਵੇਦਨਸ਼ੀਲ ਪਛਾਣ ਨਾ ਦਿਓ।",
    "confirm": "ਕੀ ਇਹ ਵੇਰਵੇ ਟੀਮ ਲਈ ਸੰਭਾਲ ਦਿਆਂ?",
    "saved": "ਤੁਹਾਡੀ ਪੁੱਛਗਿੱਛ ਸੰਭਾਲੀ ਗਈ ਹੈ। ਨੁਮਾਇੰਦਗੀ ਤੋਂ ਪਹਿਲਾਂ ਵਕੀਲ ਸਮੀਖਿਆ ਕਰੇਗਾ।",
    "choose": "ਸਮਾਂ ਚੁਣੋ। ਸਾਰੇ ਸਮੇਂ ਨਿਊਯਾਰਕ ਦੇ ਹਨ।",
    "booked": "ਤੁਹਾਡੀ ਮੁਲਾਕਾਤ ਫਰਮ ਦੇ ਕੈਲੰਡਰ ਵਿੱਚ ਬੁੱਕ ਹੈ।",
    "client": "ਕੇਸ ਦਾ ਹਵਾਲਾ ਦਿਓ। ਜਾਣਕਾਰੀ ਤੋਂ ਪਹਿਲਾਂ ਪਹੁੰਚ ਦੀ ਪੁਸ਼ਟੀ ਹੋਵੇਗੀ।",
    "code": "ਜੇ ਹਵਾਲਾ ਮਿਲਦਾ ਹੈ ਤਾਂ ਰਜਿਸਟਰਡ ਸੰਪਰਕ ਨੂੰ ਕੋਡ ਭੇਜਿਆ ਜਾਵੇਗਾ। ਕੋਡ ਦਿਓ।",
    "denied": "ਪਹੁੰਚ ਦੀ ਪੁਸ਼ਟੀ ਨਹੀਂ ਹੋਈ। ਵਾਪਸੀ ਕਾਲ ਦੀ ਬੇਨਤੀ ਕਰੋ।",
    "noUpdate": "ਕੋਈ ਮਨਜ਼ੂਰਸ਼ੁਦਾ ਅੱਪਡੇਟ ਨਹੀਂ ਹੈ। ਵਾਪਸੀ ਕਾਲ ਦੀ ਬੇਨਤੀ ਕਰ ਸਕਦੇ ਹੋ।",
    "callbackSaved": "ਕਾਲ ਦੀ ਬੇਨਤੀ ਸੰਭਾਲੀ ਗਈ ਹੈ। ਟੀਮ ਨੇ ਅਜੇ ਕਾਲ ਵਾਪਸ ਕਰਨੀ ਹੈ।",
    "yes": "ਹਾਂ, ਸੰਭਾਲੋ",
    "cancel": "ਰੱਦ ਕਰੋ",
    "handoff": "ਤੁਰੰਤ ਖਤਰੇ ਜਾਂ ਮੈਡੀਕਲ ਐਮਰਜੈਂਸੀ ਵਿੱਚ ਸਥਾਨਕ ਐਮਰਜੈਂਸੀ ਸੇਵਾਵਾਂ ਨਾਲ ਸੰਪਰਕ ਕਰੋ। ਮੈਂ ਐਮਰਜੈਂਸੀ ਸਹਾਇਤਾ ਜਾਂ ਕਾਨੂੰਨੀ ਸਲਾਹ ਨਹੀਂ ਦੇ ਸਕਦੀ।",
    "invalid": "ਜਾਣਕਾਰੀ ਜਾਂਚ ਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    "restart": "ਮੁੜ ਸ਼ੁਰੂ",
    "office": "ਦਫ਼ਤਰ: 420 Lexington Avenue, Suite 1402, ਨਿਊਯਾਰਕ; 100 Jericho Quadrangle, Suite 316, Jericho। ਫ਼ੋਨ: 212-400-4000।"
  },
  "ar": {
    "hello": "مرحباً، أنا مايا من مكتب إم لو للمحاماة. كيف يمكنني مساعدتك اليوم؟",
    "lead": "استفسار جديد",
    "book": "حجز استشارة",
    "status": "تحديث قضيتي",
    "callback": "طلب معاودة الاتصال",
    "name": "ما اسمك؟",
    "phone": "ما رقم هاتفك مع رمز الدولة؟",
    "story": "صف ما حدث بإيجاز. لا تذكر سجلات طبية أو بيانات هوية حساسة.",
    "confirm": "هل أحفظ هذه التفاصيل للفريق؟",
    "saved": "تم حفظ استفسارك. سيراجعه محام قبل بدء التمثيل القانوني.",
    "choose": "اختر وقتاً. جميع المواعيد بتوقيت نيويورك.",
    "booked": "تم حجز موعدك في تقويم المكتب.",
    "client": "أدخل مرجع القضية. سأتحقق من صلاحية الوصول قبل مشاركة أي تحديث.",
    "code": "إذا تطابق المرجع فسيُرسل رمز إلى جهة الاتصال المسجلة. أدخل الرمز.",
    "denied": "تعذر التحقق من الوصول. يرجى طلب معاودة الاتصال من الفريق.",
    "noUpdate": "لا يوجد تحديث معتمد متاح. يمكنك طلب معاودة الاتصال.",
    "callbackSaved": "تم حفظ طلب الاتصال. ما زال على أحد أعضاء الفريق الاتصال بك.",
    "yes": "نعم، احفظ",
    "cancel": "إلغاء",
    "handoff": "إذا كنت في خطر فوري أو تحتاج إلى رعاية طبية عاجلة، اتصل بخدمات الطوارئ المحلية. لا يمكنني تقديم رعاية طارئة أو مشورة قانونية.",
    "invalid": "تحقق من المعلومات وحاول مجدداً.",
    "restart": "البدء مجدداً",
    "office": "بالتأكيد. لدينا مكتبان في مانهاتن وجيريكو. العناوين ورقم الهاتف أمامك هنا."
  }
};
export function slots(state,now=Date.now()){const result=[];const start=Math.ceil((now+2*3600000)/1800000)*1800000;const fmt=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'2-digit',hourCycle:'h23'});for(let t=start;t<start+14*86400000;t+=1800000){const p=Object.fromEntries(fmt.formatToParts(t).map(x=>[x.type,x.value]));if(['Sat','Sun'].includes(p.weekday)||+p.hour<9||+p.hour>=17)continue;const iso=new Date(t).toISOString();if(!(state.appointments||[]).some(a=>a.start===iso&&a.status==='Reserved'))result.push({id:iso,label:new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}).format(t)})}return result.slice(0,12)}
export class MayaService{
 constructor({read,write,verify,challenge,demo=false,now=()=>Date.now()}){Object.assign(this,{read,write,verify,challenge,demo,now});this.sessions=new Map()}
 start(language='en'){for(const [k,s]of this.sessions)if(s.expires<this.now())this.sessions.delete(k);if(this.sessions.size>=1000)throw Error('Reception is busy. Please try again.');const s={id:crypto.randomUUID(),language:Object.hasOwn(languages,language)?language:'en',step:'menu',draft:{},expires:this.now()+30*60000,busy:false};this.sessions.set(s.id,s);return this.reply(s,'hello')}
 session(id){const s=this.sessions.get(id);if(!s||s.expires<this.now())throw Error('Session expired. Please start again.');return s}
 menu(s){return ['lead','book','status','callback'].map(action=>({action,label:copy[s.language][action]}))}
 reply(s,key,extra={}){const utterance=Object.hasOwn(copy[s.language],key)?key:'update';const response={sessionId:s.id,language:s.language,text:utterance==='update'?key:copy[s.language][key],utterance,expression:mayaExpression(utterance),step:s.step,choices:s.step==='menu'?this.menu(s):[],demo:this.demo,...extra};s.lastReply=response;return response}
 async send(id,{text='',action=''}={}){const s=this.session(id);if(s.busy)throw Error('Please wait for the previous response.');s.busy=true;try{return await this.process(s,String(text).trim().slice(0,2000),String(action))}finally{s.busy=false}}
 async commit(s,fn,action){const state=this.read();for(const k of ['appointments','calls','clientUpdates'])state[k]??=[];const output=fn(state);state.audit.unshift({id:crypto.randomUUID(),action:'Maya: '+action,detail:output.id||'',date:new Date(this.now()).toISOString()});await this.write(state);return output}
 async process(s,text,action){const c=copy[s.language];if(!action){const control=voiceCommand(text);if(['pause','acknowledge'].includes(control))return {...s.lastReply,quiet:true};if(control==='repeat')return s.lastReply;if(s.step==='confirm'&&['confirm','cancel'].includes(control))action=control}if(action==='restart'||action==='cancel'){s.step='menu';s.draft={};return this.reply(s,'hello')}
 if(/suicid|kill myself|can't breathe|cannot breathe|bleeding heavily|immediate danger/i.test(text)){s.step='menu';return this.reply(s,'handoff')}
 if(s.step==='menu'){
 if(!action){for(const k of ['lead','book','status','callback'])if(text===c[k])action=k;action||=/appoint|book|cita|موعد|حجز|ملاقات|اپائنٹمنٹ|ਅਪਾਇੰਟਮੈਂਟ|ਨਿਯੁਕਤੀ|नियुक्ति|अपॉइंटमेंट|अपाइंटमेंट/i.test(text)?'book':/status|update|case|caso|قضية|مقدم|کیس|اپڈیٹ|ਕੇਸ|मामल|केस|अपडेट/i.test(text)?'status':/call|human|person|llamada|کال|بات کرنا|कॉल|ਬਾਤ|ਕਾਲ|اتصال|تحدث/i.test(text)?'callback':/injur|accident|new|consulta|حادث|چوٹ|نئی|चोट|दुर्घटना|حادثہ/i.test(text)?'lead':''}
 if(action==='status'){s.step='client';return this.reply(s,'client')}
 if(['lead','book','callback'].includes(action)){s.flow=action;s.draft={};s.step='name';return this.reply(s,'name')}
 if(/address|office|location|direc|your number|telephone|teléfono|دفتر|نمبر|مكتب|رقم الهاتف|पता|कार्यालय|नंबर/i.test(text))return this.reply(s,'office',{summary:{manhattan:'420 Lexington Avenue, Suite 1402, New York · By appointment',jericho:'100 Jericho Quadrangle, Suite 316, Jericho',phone:'212-400-4000'}});return this.reply(s,'hello')}
 if(s.step==='name'){if(text.length<2||text.length>100)return this.reply(s,'invalid');s.draft.name=text;s.step='phone';return this.reply(s,'phone')}
 if(s.step==='phone'){text=normalizedDigits(text).replace(/[,،]/g,' ');if(!/^\+?[\d\s().-]{7,30}$/.test(text)||text.replace(/\D/g,'').length<7)return this.reply(s,'invalid');s.draft.phone=text;s.step=s.flow==='book'?'slot':'story';if(s.step==='slot'){s.offered=slots(this.read(),this.now());return this.reply(s,'choose',{choices:s.offered.map(x=>({action:'slot:'+x.id,label:x.label}))})}return this.reply(s,'story')}
 if(s.step==='story'){if(text.length<5)return this.reply(s,'invalid');s.draft.summary=text;s.step='confirm';return this.reply(s,'confirm',{summary:s.draft,choices:[{action:'confirm',label:c.yes},{action:'cancel',label:c.cancel}]})}
 if(s.step==='slot'){const chosen=s.offered?.find(x=>'slot:'+x.id===action||x.label===text)||(!action&&spokenSlot(text,s.offered));if(!chosen)return this.reply(s,'choose',{choices:(s.offered||[]).map(x=>({action:'slot:'+x.id,label:x.label}))});s.draft.start=chosen.id;s.draft.when=chosen.label;s.step='confirm';return this.reply(s,'confirm',{summary:s.draft,choices:[{action:'confirm',label:c.yes},{action:'cancel',label:c.cancel}]})}
 if(s.step==='confirm'){if(action!=='confirm'&&text!==c.yes&&!/^yes$/i.test(text))return this.reply(s,'confirm',{summary:s.draft,choices:[{action:'confirm',label:c.yes},{action:'cancel',label:c.cancel}]});let output;
 if(s.flow==='book'){if(!slots(this.read(),this.now()).some(x=>x.id===s.draft.start)){s.step='slot';s.offered=slots(this.read(),this.now());return this.reply(s,'choose',{choices:s.offered.map(x=>({action:'slot:'+x.id,label:x.label}))})}output=await this.commit(s,state=>{const a={...s.draft,id:crypto.randomUUID(),session:s.id,language:s.language,status:'Reserved',duration:30,resource:'Consultation team',conflictReview:'Required',created:new Date(this.now()).toISOString()};state.appointments.push(a);state.tasks??=[];state.tasks.unshift({id:crypto.randomUUID(),appointment:a.id,matter:'',title:'Conflict review before consultation: '+a.name,owner:'Adnan Munawar',date:new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York'}).format(new Date(this.now())),done:false});return a},'Appointment reserved')}
 else if(s.flow==='lead'){output=await this.commit(s,state=>{const m={...s.draft,id:'ML-'+crypto.randomUUID().slice(0,8).toUpperCase(),language:languages[s.language],type:'Other personal injury',stage:'Intake',owner:'Unassigned',provider:'Not recorded',insurer:'Not recorded',email:'',incident:'Not recorded',created:new Date(this.now()).toISOString().slice(0,10),source:'Maya receptionist'};state.matters.unshift(m);state.tasks.unshift({id:crypto.randomUUID(),title:'Review Maya intake and conflict check: '+m.name,matter:m.id,owner:'Adnan Munawar',date:m.created,done:false});return m},'Lead created')}
 else output=await this.commit(s,state=>{const call={...s.draft,id:crypto.randomUUID(),language:s.language,status:'Callback requested',created:new Date(this.now()).toISOString()};state.calls.unshift(call);return call},'Callback requested');
 s.step='menu';const key=s.flow==='book'?'booked':s.flow==='lead'?'saved':'callbackSaved';return this.reply(s,key,{receipt:{id:output.id,start:output.start,when:s.draft.when}})}
 if(s.step==='client'){s.reference=text.toUpperCase();await this.challenge(s);s.step='code';return this.reply(s,'code',this.demo?{demoCode:'314159'}:{})}
 if(s.step==='code'){if(!await this.verify(s,text)){s.step='menu';return this.reply(s,'denied')}s.step='menu';const approved=(this.read().clientUpdates||[]).filter(u=>u.matter===s.reference&&u.approved===true).sort((a,b)=>b.date.localeCompare(a.date));if(!approved.length)return this.reply(s,'noUpdate');const u=approved[0];return this.reply(s,u.translations?.[s.language]||u.text,{source:{id:u.id,date:u.date},originalLanguage:!u.translations?.[s.language]&&s.language!=='en'?'English':null})}
 return this.reply(s,'invalid')}
}
