// Match the selected language and the exact approved utterance; never substitute English.
export const speechKey=text=>String(text??'').normalize('NFKC').replace(/\s+/g,' ').trim();
export function findMayaMedia(manifest,language,text){
 return (manifest?.clips||[]).find(clip=>clip.language===language&&speechKey(clip.text)===speechKey(text))||null;
}
export function preferredMayaLanguage(storage,supported){
 try{const saved=storage.getItem('mlaw-maya-language');return Object.hasOwn(supported,saved)?saved:'en'}catch{return 'en'}
}
export const voiceLabels={
 en:{greeting:'Hear greeting',read:'Hear again',stop:'Stop voice',unavailable:'A voice for this language is not available here. You can continue in text.',original:'This update is available only in its approved original language. Please request a translated update from the team.'},
 es:{greeting:'Escuchar saludo',read:'Escuchar respuesta',stop:'Detener voz',unavailable:'La voz en este idioma no está disponible aquí. Puede continuar por escrito.',original:'Esta actualización solo está aprobada en su idioma original. Solicite una traducción al equipo.'},
 ur:{greeting:'سلام سنیں',read:'جواب سنیں',stop:'آواز روکیں',unavailable:'اس زبان کی آواز یہاں دستیاب نہیں ہے۔ آپ تحریری گفتگو جاری رکھ سکتے ہیں۔',original:'یہ اطلاع صرف اپنی منظور شدہ اصل زبان میں دستیاب ہے۔ ٹیم سے ترجمے کی درخواست کریں۔'},
 hi:{greeting:'अभिवादन सुनें',read:'जवाब सुनें',stop:'आवाज़ रोकें',unavailable:'इस भाषा की आवाज़ यहाँ उपलब्ध नहीं है। आप लिखित बातचीत जारी रख सकते हैं।',original:'यह अपडेट केवल अपनी स्वीकृत मूल भाषा में उपलब्ध है। टीम से अनुवाद का अनुरोध करें।'},
 pa:{greeting:'ਸੁਆਗਤ ਸੁਣੋ',read:'ਜਵਾਬ ਸੁਣੋ',stop:'ਆਵਾਜ਼ ਰੋਕੋ',unavailable:'ਇਸ ਭਾਸ਼ਾ ਦੀ ਆਵਾਜ਼ ਇੱਥੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਤੁਸੀਂ ਲਿਖਤੀ ਗੱਲਬਾਤ ਜਾਰੀ ਰੱਖ ਸਕਦੇ ਹੋ।',original:'ਇਹ ਅੱਪਡੇਟ ਸਿਰਫ਼ ਆਪਣੀ ਮਨਜ਼ੂਰਸ਼ੁਦਾ ਮੂਲ ਭਾਸ਼ਾ ਵਿੱਚ ਉਪਲਬਧ ਹੈ। ਟੀਮ ਤੋਂ ਅਨੁਵਾਦ ਮੰਗੋ।'},
 ar:{greeting:'استمع إلى الترحيب',read:'استمع إلى الرد',stop:'إيقاف الصوت',unavailable:'الصوت بهذه اللغة غير متاح هنا. يمكنك المتابعة كتابةً.',original:'هذا التحديث متاح فقط بلغته الأصلية المعتمدة. يُرجى طلب ترجمة من الفريق.'}
};
const conversationLabels={
 en:['Start voice conversation','End voice conversation','Listening · you can interrupt Maya','I’m listening…','One moment…'],
 es:['Iniciar conversación de voz','Terminar conversación','Escuchando · puede interrumpir a Maya','Le escucho…','Un momento…'],
 ur:['آواز سے بات کریں','آواز کی گفتگو ختم کریں','سن رہی ہوں · آپ مایا کو روک کر بول سکتے ہیں','آپ کی بات سن رہی ہوں…','ایک لمحہ…'],
 hi:['आवाज़ से बात करें','आवाज़ की बातचीत बंद करें','सुन रही हूँ · आप माया को बीच में रोक सकते हैं','आपकी बात सुन रही हूँ…','एक पल…'],
 pa:['ਆਵਾਜ਼ ਰਾਹੀਂ ਗੱਲ ਕਰੋ','ਆਵਾਜ਼ ਦੀ ਗੱਲਬਾਤ ਬੰਦ ਕਰੋ','ਸੁਣ ਰਹੀ ਹਾਂ · ਤੁਸੀਂ ਮਾਇਆ ਨੂੰ ਰੋਕ ਸਕਦੇ ਹੋ','ਤੁਹਾਡੀ ਗੱਲ ਸੁਣ ਰਹੀ ਹਾਂ…','ਇੱਕ ਪਲ…'],
 ar:['بدء المحادثة الصوتية','إنهاء المحادثة الصوتية','أستمع إليك · يمكنك مقاطعة مايا','أنا أستمع…','لحظة واحدة…']
};
for(const [language,labels] of Object.entries(conversationLabels))Object.assign(voiceLabels[language],Object.fromEntries(['startVoice','endVoice','listening','speaking','processing'].map((key,index)=>[key,labels[index]])));
