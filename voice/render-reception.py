"""Reproducible, local speech + portrait-motion media for public fixed phrases."""
import argparse,gc,importlib.util,json,shutil,subprocess,hashlib
from pathlib import Path
import torch
ROOT=Path(__file__).resolve().parents[1]
def module(name,file):
 spec=importlib.util.spec_from_file_location(name,ROOT/'voice'/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
parser=argparse.ArgumentParser();parser.add_argument('--keys',default='all');parser.add_argument('--idle',action='store_true');parser.add_argument('--refresh-motion',action='store_true');parser.add_argument('--batch',type=int,default=1);args=parser.parse_args()
expressions=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {mayaExpressions} from './dist/maya-presence.mjs';console.log(JSON.stringify(mayaExpressions))"],cwd=ROOT,text=True))
keys=[k for k in expressions if k!='update'] if args.keys=='all' else args.keys.split(',')
lipdir=ROOT/'.talking-build/lips';lipdir.mkdir(exist_ok=True)
jobs=[(ROOT/'dist/assets'/f'maya-{lang}-{key}.wav',lipdir/f'maya-{lang}-{key}.mp4',ROOT/'dist/assets'/f'maya-{lang}-{key}.mp4',expressions[key]) for key in keys for lang in ('ur','en','es','hi','ar')]
def fingerprint(wav):return hashlib.sha256(wav.read_bytes()).hexdigest()
def fresh(path,wav):
 marker=path.with_suffix('.speech-sha256')
 return path.exists() and marker.exists() and marker.read_text()==fingerprint(wav)
missing=[job for job in jobs if not fresh(job[1],job[0])]
if missing:
 lips=module('lips','render-talking.py').TalkingPortrait()
 for wav,intermediate,out,mood in missing:
  lips.render(wav,intermediate,batch=args.batch)
  intermediate.with_suffix('.speech-sha256').write_text(fingerprint(wav))
 del lips;gc.collect();torch.cuda.empty_cache()
refiner=module('refiner','refine-talking.py')
refined=ROOT/'.talking-build/refined';refined.mkdir(exist_ok=True)
refined_jobs=[]
for wav,intermediate,out,mood in jobs:
 target=refined/intermediate.name;marker=target.with_suffix('.build-sha256')
 stamp=fingerprint(wav)+fingerprint(intermediate)+fingerprint(ROOT/'voice/refine-talking.py')
 if not target.exists() or not marker.exists() or marker.read_text()!=stamp:
  refiner.refine(intermediate,wav,target);marker.write_text(stamp)
 refined_jobs.append((wav,target,out,mood))
jobs=refined_jobs
motion=module('motion','portrait-motion.py').PortraitMotion()
video_record=ROOT/'evidence/maya-video-assets.json'
recorded=json.loads(video_record.read_text()) if video_record.exists() else {}
for wav,intermediate,out,mood in jobs:
 # Final markers stay in the ignored build folder, never in public assets.
 marker=lipdir/(out.stem+'.final-sha256')
 final_stamp=fingerprint(wav)+fingerprint(intermediate)+fingerprint(ROOT/'voice/portrait-motion.py')
 if out.exists() and marker.exists() and marker.read_text()==final_stamp and not args.refresh_motion:continue
 motion.render(out,mood,input_video=intermediate)
 marker.write_text(final_stamp)
 recorded[out.name]={'audio_sha256':fingerprint(wav),'video_sha256':fingerprint(out),'refined_sha256':fingerprint(intermediate),'motion_revision':fingerprint(ROOT/'voice/portrait-motion.py')}
 video_record.write_text(json.dumps(recorded,indent=2)+'\n')
if args.idle:
 for mood in set(expressions.values())|{'amused'}:
  out=ROOT/'dist/assets'/f'maya-idle-{mood}.mp4'
  if not out.exists() or args.refresh_motion:motion.render(out,mood,duration=4.5 if mood=='amused' else 16)
subprocess.run(['node','scripts/index-maya-media.mjs'],cwd=ROOT,check=True)
