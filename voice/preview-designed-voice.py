"""Design an original speaker; no real-person voice reference is provided."""
import json,time,os
from pathlib import Path
os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
import torch,soundfile as sf
from qwen_tts import Qwen3TTSModel
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'.conversation-cache/designed';OUT.mkdir(parents=True,exist_ok=True)
torch.set_num_threads(6)
print('Loading voice designer...',flush=True)
model=Qwen3TTSModel.from_pretrained(str(ROOT/'.conversation-cache/qwen-design'),device_map='cuda:0',dtype=torch.bfloat16,attn_implementation='sdpa')
text="Hi, you've reached M Law Firm. I'm Maya. How can I help? Of course, take your time. Can I start with your name, and the best number to reach you?"
directions=[
 ('maya-natural',731,'A woman in her early thirties with a warm, soft, slightly husky alto voice and a neutral American accent. She is a kind receptionist speaking spontaneously to one person on the phone. Intimate conversational delivery, relaxed articulation, light natural breaths, subtle vocal fry at the ends of phrases, small irregular pauses. A gentle smile in the greeting, then genuinely attentive and reassuring. Normal conversational speed, quieter volume, varied pitch and phrasing. Understated and grounded, never a presenter or commercial narrator. Clear studio audio.'),
 ('maya-gentle',904,'An adult female receptionist with a gentle, smooth mid-low voice and a natural New York American accent. Calm, friendly, quietly confident. Speak as if responding to a real caller, thinking as you talk. Easy contractions, natural breathing, flowing phrases with little pauses between thoughts, soft falling inflections. Warm concern without theatrical emotion, a relaxed unforced smile. Clear everyday conversation, not narration, not over-enunciated, not whispering. Clean recording.'),
]
for name,seed,instruct in directions:
 torch.manual_seed(seed);torch.cuda.manual_seed_all(seed);start=time.time()
 wavs,sr=model.generate_voice_design(text=text,language='English',instruct=instruct,max_new_tokens=900,temperature=.85,top_p=.9)
 sf.write(OUT/f'{name}.wav',wavs[0],sr,subtype='PCM_16')
 (OUT/f'{name}.json').write_text(json.dumps({'text':text,'instruction':instruct,'seed':seed,'sample_rate':sr},indent=2))
 print(json.dumps({'sample':str(OUT/f'{name}.wav'),'audio_seconds':len(wavs[0])/sr,'generation_seconds':round(time.time()-start,1)}),flush=True)
