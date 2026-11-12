"""Validate shipped media timing/decoding, optionally transcribe fixed greetings."""
import argparse,json,hashlib
from pathlib import Path
import cv2,numpy as np,soundfile as sf
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--speech',action='store_true');args=parser.parse_args()
manifest=json.loads((ROOT/'dist/maya-media.json').read_text(encoding='utf-8'))
results=[]
for clip in manifest['clips']:
 wav=ROOT/'dist'/clip['audio'].lstrip('/');info=sf.info(wav)
 item={k:clip[k] for k in ('language','key','expression')}
 item.update(audio_seconds=round(info.duration,3),audio_sha256=hashlib.sha256(wav.read_bytes()).hexdigest())
 sync_path=ROOT/'.talking-build/refined'/f'maya-{clip["language"]}-{clip["key"]}.sync.json'
 if sync_path.exists():
  sync=json.loads(sync_path.read_text());assert sync['audio_sha256']==item['audio_sha256'];assert sync['mouth_before_voice_frames']==0
  item.update(first_voiced_seconds=sync['first_voiced_seconds'],mouth_before_voice_frames=sync['mouth_before_voice_frames'])
 if clip.get('video'):
  path=ROOT/'dist'/clip['video'].lstrip('/');cap=cv2.VideoCapture(str(path));frames=int(cap.get(cv2.CAP_PROP_FRAME_COUNT));fps=cap.get(cv2.CAP_PROP_FPS)
  assert fps>0 and frames>0,path
  video_seconds=frames/fps;assert abs(video_seconds-info.duration)<.12,(path,video_seconds,info.duration)
  ok,first=cap.read();assert ok,path
  cap.set(cv2.CAP_PROP_POS_FRAMES,min(frames-1,frames//2));ok,middle=cap.read();assert ok,path
  cap.set(cv2.CAP_PROP_POS_FRAMES,frames-1);ok,last=cap.read();assert ok,path;cap.release()
  assert first.shape[:2]==(512,512),path
  difference=float(np.abs(first.astype(np.float32)-middle.astype(np.float32)).mean());assert difference>.15,path
  item.update(video_seconds=round(video_seconds,3),frames=frames,frame_difference=round(difference,3),video_sha256=hashlib.sha256(path.read_bytes()).hexdigest())
 results.append(item)
report={'clips':results,'complete_video_count':sum('frames' in r for r in results),'languages':sorted(set(r['language'] for r in results))}
if args.speech:
 from faster_whisper import WhisperModel
 model=WhisperModel('small',device='cpu',compute_type='int8');report['greeting_transcripts']={}
 for lang in ('en','ur','es','hi','ar'):
  segments,info=model.transcribe(str(ROOT/'dist/assets'/f'maya-{lang}-hello.wav'),language=lang,beam_size=3,vad_filter=True)
  report['greeting_transcripts'][lang]=' '.join(s.text for s in segments)
(ROOT/'evidence/maya-media-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'clips':len(results),'videos':report['complete_video_count'],'greeting_transcripts':report.get('greeting_transcripts')},ensure_ascii=False),flush=True)
