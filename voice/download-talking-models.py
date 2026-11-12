"""Download documented upstream models into ignored local caches, never the web build."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json,sys
from huggingface_hub import hf_hub_download

ROOT=Path(__file__).resolve().parents[1]
SOURCES=[
 ('TMElyralab/MuseTalk','.avatar-cache/musetalk',['musetalkV15/musetalk.json','musetalkV15/unet.pth','LICENSE.txt'],'2bcb936e2fddb4d86db4c62fd45b387d0c061571'),
 ('stabilityai/sd-vae-ft-mse','.avatar-cache/vae',['config.json','diffusion_pytorch_model.safetensors'],'31f26fdeee1355a5c34592e401dd41e45d25a493'),
 ('openai/whisper-tiny','.avatar-cache/whisper',['config.json','model.safetensors','preprocessor_config.json'],'169d4a4341b33bc18d8881c4b69c2e104e1cc0af'),
]
if '--urdu-research' in sys.argv:SOURCES.append(('zohann/urdu-tts','.speech-cache/urdu',['models/urdu-multispeaker/ar-model.pth'],'00035327407af4aa303c5b1fb00838a02962a666'))
def download(item):
 repo,destination,names,revision=item
 for name in names:
  hf_hub_download(repo,name,revision=revision,local_dir=ROOT/destination)
 print(json.dumps({'repository':repo,'revision':revision,'files':names}),flush=True)
 return {'repository':repo,'revision':revision,'files':names}
if __name__=='__main__':
 with ThreadPoolExecutor(max_workers=3) as pool: results=list(pool.map(download,SOURCES))
 (ROOT/'.avatar-cache'/'model-provenance.json').write_text(json.dumps(results,indent=2))
