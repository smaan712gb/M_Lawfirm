"""Promote a complete, text-matched staged voice set before video regeneration."""
import argparse,hashlib,json,shutil,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--reference',default='maya-gentle');args=parser.parse_args()
stage=ROOT/'.conversation-cache/speech'/args.reference
prompts=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {copy} from './dist/maya-core.mjs';console.log(JSON.stringify(copy))"],cwd=ROOT,text=True,encoding='utf-8'))
keys=list(json.loads((ROOT/'voice/urdu-pronunciation.json').read_text(encoding='utf-8')))
records=[]
for lang in ('en','es','ur','hi','ar'):
 for key in keys:
  source=stage/f'maya-{lang}-{key}.wav';item=json.loads(source.with_suffix('.json').read_text(encoding='utf-8'))
  assert item['text']==prompts[lang][key],f'Stale text: {lang}/{key}'
  assert item['sha256']==hashlib.sha256(source.read_bytes()).hexdigest(),f'Changed audio: {lang}/{key}'
  records.append((source,item))
backup=ROOT/'.talking-build/previous-voice';backup.mkdir(parents=True,exist_ok=True)
for source,item in records:
 target=ROOT/'dist/assets'/source.name
 if target.exists() and not (backup/source.name).exists():shutil.copyfile(target,backup/source.name)
 shutil.copyfile(source,target)
for lang,name in [('en','maya-welcome.wav'),('es','maya-es.wav'),('hi','maya-hi.wav')]:shutil.copyfile(stage/f'maya-{lang}-hello.wav',ROOT/'dist/assets'/name)
reference=ROOT/'voice/reference';reference.mkdir(exist_ok=True)
for suffix in ('.wav','.json'):
 source=ROOT/'.conversation-cache/designed'/(args.reference+suffix)
 if source.exists():shutil.copyfile(source,reference/('maya'+suffix))
for suffix in ('.wav','.json'):
 source=ROOT/'.conversation-cache/designed'/('maya-indic'+suffix)
 if source.exists():shutil.copyfile(source,reference/source.name)
(ROOT/'evidence/maya-speech-assets.json').write_text(json.dumps([r[1] for r in records],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Promoted {len(records)} recordings. Regenerate synchronized videos before publication.',flush=True)
