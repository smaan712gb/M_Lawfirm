"""Stage fixed reception speech in the original designed Maya voice.

Never overwrites published assets. A separate promotion step must update audio,
video and the exact-text manifest together after reviewing an audition.
"""
import argparse,hashlib,json,os,subprocess,time,re
from pathlib import Path
os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
import numpy as np,soundfile as sf,torch
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--engine',choices=['qwen','multilingual','arabic'],default='qwen');parser.add_argument('--keys',default='hello');parser.add_argument('--languages',default='all');parser.add_argument('--reference',default='maya-gentle');args=parser.parse_args()
reference_name='maya-indic' if args.engine=='multilingual' and args.reference=='maya-gentle' else args.reference
reference=ROOT/'.conversation-cache/designed'/f'{reference_name}.wav'
if not reference.exists():reference=ROOT/'voice/reference'/('maya-indic.wav' if reference_name=='maya-indic' else 'maya.wav')
profile=json.loads(reference.with_suffix('.json').read_text(encoding='utf-8'))
prompts=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {copy} from './dist/maya-core.mjs';console.log(JSON.stringify(copy))"],cwd=ROOT,text=True,encoding='utf-8'))
urdu=json.loads((ROOT/'voice/urdu-pronunciation.json').read_text(encoding='utf-8'))
pronunciations=json.loads((ROOT/'voice/speech-pronunciation.json').read_text(encoding='utf-8'))
keys=list(urdu) if args.keys=='all' else args.keys.split(',')
out=ROOT/'.conversation-cache/speech'/args.reference;out.mkdir(parents=True,exist_ok=True)
torch.set_num_threads(6)
if args.engine=='qwen':
 from qwen_tts import Qwen3TTSModel
 model=Qwen3TTSModel.from_pretrained(str(ROOT/'.conversation-cache/qwen-base'),device_map='cuda:0',dtype=torch.bfloat16,attn_implementation='sdpa')
 prompt=model.create_voice_clone_prompt(ref_audio=str(reference),ref_text=profile['text'],x_vector_only_mode=False)
 languages={'en':'English','es':'Spanish'}
else:
 from chatterbox.mtl_tts import ChatterboxMultilingualTTS
 model=ChatterboxMultilingualTTS.from_local(ROOT/'.conversation-cache/multilingual','cuda',t3_model='v3')
 model.prepare_conditionals(str(reference),exaggeration=.45)
 languages={'ar':'ar'} if args.engine=='arabic' else {'ur':'hi','hi':'hi'}
for language,code in languages.items():
 if args.languages!='all' and language not in args.languages.split(','):continue
 for key in keys:
  text=urdu[key] if language=='ur' else pronunciations.get(language,{}).get(key,prompts[language][key])
  path=out/f'maya-{language}-{key}.wav';metadata=path.with_suffix('.json')
  revision='segmented-v2' if key=='office' and args.engine!='qwen' else ''
  fingerprint=hashlib.sha256((text+args.engine+revision+hashlib.sha256(reference.read_bytes()).hexdigest()).encode()).hexdigest()
  if path.exists() and metadata.exists() and json.loads(metadata.read_text()).get('fingerprint')==fingerprint:continue
  seed=904+int(hashlib.sha256((language+key).encode()).hexdigest()[:4],16)
  torch.manual_seed(seed);torch.cuda.manual_seed_all(seed);start=time.time()
  if args.engine=='qwen':
   sentences=re.split(r'(?<=[.!?])\s+',text) if key=='office' else [text]
   pieces=[]
   for sentence in sentences:
    wavs,sr=model.generate_voice_clone(text=sentence,language=code,voice_clone_prompt=prompt,max_new_tokens=min(600,max(150,len(sentence.split())*12)),temperature=.8,top_p=.9)
    pieces.extend([wavs[0],np.zeros(int(sr*.2))])
   audio=np.concatenate(pieces[:-1])
  else:
   emotion=.3 if key in ('handoff','denied','story','noUpdate') else .45
   sentences=re.split(r'(?<=[.!?।])\s+',text) if key=='office' else [text]
   pieces=[];sr=model.sr
   for sentence in sentences:
    wav=model.generate(sentence,language_id=code,exaggeration=emotion,cfg_weight=.35,temperature=.65 if key in ('office','saved') else .75,repetition_penalty=1.3)
    pieces.extend([wav.squeeze().cpu().numpy(),np.zeros(int(sr*.16))])
   audio=np.concatenate(pieces[:-1])
  assert np.isfinite(audio).all() and len(audio)>sr*.4,'Invalid generated audio'
  sf.write(path,audio,sr,subtype='PCM_16')
  item={'engine':args.engine,'reference':reference_name,'language':language,'key':key,'text':prompts[language][key],'pronunciation':text,'seed':seed,'fingerprint':fingerprint,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'seconds':round(len(audio)/sr,3)}
  metadata.write_text(json.dumps(item,ensure_ascii=False,indent=2),encoding='utf-8')
  print(json.dumps({'language':language,'key':key,'audio_seconds':item['seconds'],'generation_seconds':round(time.time()-start,1)}),flush=True)
