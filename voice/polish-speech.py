"""Apply the selected delivery once, retaining raw audio for reproducibility."""
import json,hashlib,shutil
from pathlib import Path
import soundfile as sf
from delivery import polish,PROFILE
ROOT=Path(__file__).resolve().parents[1]
stage=ROOT/'.conversation-cache/speech/maya-gentle';backup=ROOT/'.conversation-cache/raw-speech';backup.mkdir(exist_ok=True)
for source in stage.glob('maya-*.wav'):
 metadata=source.with_suffix('.json');item=json.loads(metadata.read_text(encoding='utf-8'))
 if item.get('delivery')==PROFILE:continue
 raw=backup/source.name;shutil.copyfile(source,raw)
 target=source.with_suffix('.polished.wav');polish(raw,target);target.replace(source)
 item.update(raw_sha256=hashlib.sha256(raw.read_bytes()).hexdigest(),sha256=hashlib.sha256(source.read_bytes()).hexdigest(),delivery=PROFILE,seconds=round(sf.info(source).duration,3))
 metadata.write_text(json.dumps(item,ensure_ascii=False,indent=2),encoding='utf-8')
 print(source.name,flush=True)
