"""Generate sample speech and check local STT. Downloads openly available weights."""
import json,subprocess
from pathlib import Path
from service import synthesize
from faster_whisper import WhisperModel
root=Path(__file__).resolve().parents[1]
copy=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {copy} from './dist/maya-core.mjs';console.log(JSON.stringify(copy))"],cwd=root,text=True,encoding='utf-8'))
samples={lang:copy[lang]['hello'] for lang in ('es','hi')}
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
