"""Rebuild fixed speech using isolated environments. See voice/README.md."""
import os,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def python(environment):
 path=ROOT/environment/('Scripts/python.exe' if os.name=='nt' else 'bin/python')
 if not path.exists():raise RuntimeError(f'Missing environment: {environment}. See voice/README.md')
 return str(path)
for environment,engine in [('.voice-design-venv','qwen'),('.conversation-venv','multilingual'),('.conversation-venv','arabic')]:
 subprocess.run([python(environment),str(ROOT/'voice/build-designed-speech.py'),'--engine',engine,'--keys','all'],cwd=ROOT,check=True)
subprocess.run([python('.avatar-venv'),str(ROOT/'voice/polish-speech.py')],cwd=ROOT,check=True)
subprocess.run([python('.voice-design-venv'),str(ROOT/'voice/promote-designed-speech.py')],cwd=ROOT,check=True)
print('Speech updated. Run the portrait renderer and media checks before publication.')
