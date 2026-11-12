"""Keep silent mouths still and retain skin detail around generated speech."""
import argparse,hashlib,json,subprocess
from pathlib import Path
import cv2,numpy as np,soundfile as sf,imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1]

def refine(source,wav,output):
 source,wav,output=map(Path,(source,wav,output));output.parent.mkdir(parents=True,exist_ok=True)
 audio,sr=sf.read(wav);audio=audio.mean(axis=1) if audio.ndim>1 else audio
 cap=cv2.VideoCapture(str(source));fps=cap.get(cv2.CAP_PROP_FPS);count=int(cap.get(cv2.CAP_PROP_FRAME_COUNT));assert fps>0 and count>0
 size=(int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)))
 base=cv2.resize(cv2.imread(str(ROOT/'dist/assets/maya-portrait.png')),size,interpolation=cv2.INTER_AREA)
 energy=np.array([np.sqrt(np.mean(audio[int(i*sr/fps):max(int((i+1)*sr/fps),int(i*sr/fps)+1)]**2)) for i in range(count)])
 threshold=max(.001,float(np.percentile(energy,95))*.012)
 active=energy>threshold;onsets=np.flatnonzero(active)
 if not len(onsets):raise ValueError('No voiced audio detected')
 gate=np.zeros(count);level=0
 for i in range(count):
  # No future audio is used. Release gently through a short unvoiced consonant.
  level=1.0 if active[i] else max(0,level-1/(fps*.12))
  gate[i]=level
 mask=np.zeros(base.shape[:2],np.float32)
 cv2.ellipse(mask,(round(.508*size[0]),round(.452*size[1])),(round(.083*size[0]),round(.052*size[1])),0,0,360,1,-1)
 mask=cv2.GaussianBlur(mask,(21,21),4)[...,None]
 ffmpeg=imageio_ffmpeg.get_ffmpeg_exe();silent=output.with_suffix('.silent.mp4')
 writer=subprocess.Popen([ffmpeg,'-y','-loglevel','error','-f','rawvideo','-pix_fmt','bgr24','-s',f'{size[0]}x{size[1]}','-r',str(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p',str(silent)],stdin=subprocess.PIPE)
 try:
  for i in range(count):
   ok,frame=cap.read();assert ok
   # Modest detail recovery is restricted to the mouth; untouched skin stays original.
   detail=cv2.addWeighted(frame,1.22,cv2.GaussianBlur(frame,(0,0),1),-.22,0)
   blend=mask*gate[i];frame=(detail*blend+base*(1-blend)).clip(0,255).astype(np.uint8)
   writer.stdin.write(frame.tobytes())
  writer.stdin.close();assert writer.wait()==0
 finally:
  cap.release()
  if writer.poll() is None:writer.kill();writer.wait()
 subprocess.run([ffmpeg,'-y','-loglevel','error','-i',str(silent),'-i',str(source),'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',str(output)],check=True)
 silent.unlink()
 report={'audio_sha256':hashlib.sha256(wav.read_bytes()).hexdigest(),'first_voiced_seconds':round(float(onsets[0]/fps),3),'mouth_before_voice_frames':int(np.count_nonzero(gate[:onsets[0]])),'threshold':round(threshold,6),'frames':count}
 output.with_suffix('.sync.json').write_text(json.dumps(report,indent=2)+'\n')
 print(output.name+': '+json.dumps(report),flush=True)
 return report

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('source');parser.add_argument('audio');parser.add_argument('output');args=parser.parse_args();refine(args.source,args.audio,args.output)
