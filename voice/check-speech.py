"""Generate sample speech and check local STT. Downloads openly available weights."""
import json
from pathlib import Path
from service import synthesize
from faster_whisper import WhisperModel
samples={
 'es':'Hola, soy Maya, la recepcionista de inteligencia artificial de M Law. Estoy aquí para escucharle. ¿Cómo puedo ayudarle?',
 'hi':'नमस्ते, मैं माया हूँ, एम लॉ की ए आई रिसेप्शनिस्ट। मैं आपकी बात सुनने के लिए यहाँ हूँ। आपकी कैसे मदद करूँ?'
}
results={}
for lang,text in samples.items():
 try:
  output=Path('dist/assets/maya-'+lang+'.wav');output.write_bytes(synthesize(text,lang));results[lang]={'bytes':output.stat().st_size,'generated':True}
 except Exception as exc: results[lang]={'generated':False,'error':str(exc)}
model=WhisperModel('small',device='cpu',compute_type='int8')
segments,info=model.transcribe('dist/assets/maya-welcome.wav',beam_size=3,vad_filter=True)
results['english_roundtrip']={'language':info.language,'text':' '.join(s.text for s in segments)}
Path('evidence/voice-check.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(results,ensure_ascii=True))
