"""Local word-accuracy check; this does not grade naturalness."""
import sys,json,argparse
from pathlib import Path
from faster_whisper import WhisperModel
parser=argparse.ArgumentParser();parser.add_argument('--language',default='en');parser.add_argument('files',nargs='+');args=parser.parse_args()
model=WhisperModel('small',device='cpu',compute_type='int8')
for name in args.files:
 path=Path(name)
 segments,info=model.transcribe(str(path),language=args.language,beam_size=3,vad_filter=True)
 result={'file':str(path),'text':' '.join(s.text.strip() for s in segments)}
 path.with_suffix('.transcript.json').write_text(json.dumps(result,indent=2))
 print(json.dumps(result),flush=True)
