"""Evaluate the public Urdu model with a synthetic reference voice only."""
import json, os, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
os.environ['TORTOISE_MODELS_DIR']=str(ROOT/'.speech-cache/tortoise')
os.environ['HF_HOME']=str(ROOT/'.avatar-cache/hub')
sys.path.insert(0,str(ROOT/'.research/tortoise-tts-fast'))
import torch
import re
import soundfile as sf
from tortoise.api import TextToSpeech
from tortoise.utils.audio import load_audio

torch.set_num_threads(4)
text=json.loads((ROOT/'.talking-build/prompts.json').read_text(encoding='utf-8'))['ur']['hello']
if '--roman' in sys.argv: text='Assalaam alaikum. Main Maaya hoon, Em Law Firm se. Main aap ki kya madad kar sakti hoon?'
print('Loading Urdu speech model',flush=True)
original=ROOT/'.speech-cache/urdu/models/urdu-multispeaker/ar-model.pth'
converted=ROOT/'.speech-cache/urdu/ar-current-transformers.pth'
if not converted.exists():
 weights=torch.load(original,map_location='cpu',weights_only=True)
 # Older Transformers serialized these deterministic attention-mask buffers.
 # Current GPT2 rebuilds them; retain all learned parameters and strict loading.
 weights={k:v for k,v in weights.items() if not re.fullmatch(r'gpt\.h\.\d+\.attn\.(?:masked_)?bias',k)}
 torch.save(weights,converted)
 del weights
tts=TextToSpeech(ar_checkpoint=str(converted),enable_redaction=False,autoregressive_batch_size=1,high_vram=False)
reference=[load_audio(str(ROOT/'dist/assets/maya-en-hello.wav'),22050),load_audio(str(ROOT/'dist/assets/maya-en-hello.wav'),24000)]
with torch.inference_mode():
 output=tts.tts_with_preset(text,voice_samples=[reference],preset='fast',num_autoregressive_samples=16,diffusion_iterations=50,k=1,temperature=.2)
path=ROOT/('.talking-build/maya-ur-roman.wav' if '--roman' in sys.argv else '.talking-build/maya-ur-candidate.wav')
sf.write(path,output.squeeze().cpu().numpy(),24000)
print('Urdu candidate saved: '+str(path),flush=True)
