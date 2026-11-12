"""Transcribe staged public phrases locally; flag suspicious output for review.

ASR checks intelligibility/content, not naturalness or native-speaker acceptance.
"""
import json,hashlib,os,re,argparse,difflib
from pathlib import Path
import numpy as np,soundfile as sf
from faster_whisper import WhisperModel
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--languages',default='en,es,ur,hi,ar');parser.add_argument('--reference',default='maya-gentle');args=parser.parse_args()
stage=ROOT/'.conversation-cache/speech'/args.reference
report=ROOT/'evidence/maya-redesigned-transcripts.json' if args.reference=='maya-gentle' else ROOT/'.talking-build'/(args.reference+'-audit.json')
previous=json.loads(report.read_text(encoding='utf-8')) if report.exists() else []
model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=6)
results=[]
for path in sorted(stage.glob('maya-*.wav')):
 item=json.loads(path.with_suffix('.json').read_text(encoding='utf-8'))
 if item['language'] not in args.languages.split(','):continue
 cached=next((old for old in previous if old['sha256']==item['sha256']),None)
 if cached:results.append(cached);continue
 audio,sr=sf.read(path)
 assert np.isfinite(audio).all() and .4<len(audio)/sr<50,path
 assert np.sqrt(np.mean(audio**2))>.006,path
 segments,info=model.transcribe(str(path),language=item['language'],beam_size=3,vad_filter=True)
 transcript=' '.join(s.text.strip() for s in segments)
 assert len(transcript)>2,(path,'Empty transcript')
 item.update(transcript=transcript,rms=round(float(np.sqrt(np.mean(audio**2))),4),peak=round(float(np.max(np.abs(audio))),4))
 normalize=lambda text:re.sub(r'[^\w\s]','',text.lower())
 item['text_similarity']=round(difflib.SequenceMatcher(None,normalize(item['text']),normalize(transcript)).ratio(),3)
 results.append(item)
 report.write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(item['language']+'/'+item['key']+': '+transcript,flush=True)
report.write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
greetings={item['language']:item['transcript'] for item in results if item['key']=='hello'}
if args.reference=='maya-gentle':
 (ROOT/'evidence/maya-greeting-transcripts.json').write_text(json.dumps(greetings,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 (ROOT/'evidence/maya-urdu-transcripts.json').write_text(json.dumps([item for item in results if item['language']=='ur'],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Checked {len(results)} staged recordings. Review transcripts; listener acceptance remains separate.',flush=True)
