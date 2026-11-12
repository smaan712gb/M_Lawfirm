"""Audition expressive speech using an existing fictional synthetic speaker.

The reference is generated speech, never a recording of a real person.
The model's built-in watermark is retained.
"""
import os,json,time
from pathlib import Path
os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
import numpy as np,soundfile as sf,torch
from chatterbox.mtl_tts import ChatterboxMultilingualTTS
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'.conversation-cache/auditions';OUT.mkdir(parents=True,exist_ok=True)
torch.set_num_threads(6)
pieces=[]
for key in ('hello','name','phone'):
 audio,sr=sf.read(ROOT/'dist/assets'/f'maya-en-{key}.wav')
 pieces.extend([audio,np.zeros(int(sr*.18))])
reference=OUT/'maya-synthetic-reference.wav'
if not reference.exists():sf.write(reference,np.concatenate(pieces),sr)
print('Loading expressive speech model...',flush=True)
model=ChatterboxMultilingualTTS.from_local(ROOT/'.conversation-cache/multilingual','cuda',t3_model='v3')
model.prepare_conditionals(str(reference),exaggeration=.45)
samples=[
 ('en-warm','en','M Law Firm, this is Maya. How can I help you?',.45,.35,42),
 ('en-soft','en','M Law Firm, this is Maya. How can I help you?',.35,.4,17),
 ('ur-warm','hi','अस्सलामु अलैकुम। एम लॉ फ़र्म, मैं माया बात कर रही हूँ। बताइए, मैं आपकी क्या मदद कर सकती हूँ?',.45,.35,42),
]
for name,lang,text,emotion,guidance,seed in samples:
 torch.manual_seed(seed);torch.cuda.manual_seed_all(seed)
 start=time.time()
 wav=model.generate(text,language_id=lang,exaggeration=emotion,cfg_weight=guidance,temperature=.75)
 path=OUT/f'{name}.wav';sf.write(path,wav.squeeze().cpu().numpy(),model.sr,subtype='PCM_16')
 print(json.dumps({'sample':str(path),'seconds':wav.shape[-1]/model.sr,'generation_seconds':round(time.time()-start,1)}),flush=True)
