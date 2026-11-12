"""Use the earlier synthetic Hindi speaker to test native-accent conditioning."""
import json
from pathlib import Path
import numpy as np,soundfile as sf
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'.conversation-cache/designed';pieces=[]
for key in ('hello','phone'):
 audio,sr=sf.read(ROOT/'dist/assets'/f'maya-hi-{key}.wav');pieces.extend([audio,np.zeros(int(sr*.2))])
sf.write(out/'maya-indic.wav',np.concatenate(pieces),sr)
(out/'maya-indic.json').write_text(json.dumps({'text':'नमस्ते, मैं माया हूँ, एम लॉ फ़र्म से। मैं आपकी क्या मदद कर सकती हूँ? देश कोड सहित आपका फ़ोन नंबर क्या है?','instruction':'Existing generated Hindi female speaker; no real-person recording. Native-accent conditioning audition.','sample_rate':sr},ensure_ascii=False,indent=2),encoding='utf-8')
