"""Optional local speech in Maya's original synthetic identity."""
import json,os
from pathlib import Path
import torch
from qwen_tts import Qwen3TTSModel
ROOT=Path(__file__).resolve().parents[1]
LANGUAGES={'en':'English','es':'Spanish'}

class DesignedVoice:
 def __init__(self):
  torch.set_num_threads(6)
  reference=Path(os.getenv('MAYA_VOICE_REFERENCE',str(ROOT/'voice/reference/maya.wav')))
  profile=json.loads(reference.with_suffix('.json').read_text(encoding='utf-8'))
  device=os.getenv('VOICE_DEVICE','cuda:0' if torch.cuda.is_available() else 'cpu')
  model_path=os.getenv('MAYA_VOICE_MODEL',str(ROOT/'.conversation-cache/qwen-base'))
  self.model=Qwen3TTSModel.from_pretrained(model_path,device_map=device,dtype=torch.bfloat16 if device.startswith('cuda') else torch.float32,attn_implementation='sdpa')
  self.prompt=self.model.create_voice_clone_prompt(ref_audio=str(reference),ref_text=profile['text'],x_vector_only_mode=False)
 def synthesize(self,text,language):
  if language not in LANGUAGES:raise ValueError('No validated dynamic voice for this language')
  wavs,sr=self.model.generate_voice_clone(text=text,language=LANGUAGES[language],voice_clone_prompt=self.prompt,max_new_tokens=1800,temperature=.8,top_p=.9)
  return wavs[0],sr
