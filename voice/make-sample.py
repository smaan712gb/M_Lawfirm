import json,subprocess
from pathlib import Path
from service import synthesize
root=Path(__file__).resolve().parents[1]
text=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {copy} from './dist/maya-core.mjs';console.log(JSON.stringify(copy.en.hello))"],cwd=root,text=True,encoding='utf-8'))
target=Path(__file__).resolve().parents[1]/'dist'/'assets'/'maya-welcome.wav'
target.write_bytes(synthesize(text,'en'))
print(f'Created {target.name}: {target.stat().st_size} bytes')
