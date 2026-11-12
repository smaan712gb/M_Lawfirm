"""Animate the approved fictional portrait with local 3D pose/expression controls.

The fixed framing avoids face-recognition dependencies. Core controls follow the
MIT-licensed LivePortrait portrait editor. Mood is selected by the conversation
step; this does not infer a caller's psychological state.
"""
import argparse, math, subprocess, sys, time, hashlib
from pathlib import Path
import cv2, numpy as np, torch, imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.research/LivePortrait'))
from src.config.inference_config import InferenceConfig
from src.live_portrait_wrapper import LivePortraitWrapper

MOODS={
 'warm':(.35,.8,1.0), 'attentive':(-.06,2.5,.65),
 'concerned':(-.28,6,.45), 'reassuring':(.12,1.5,.7),
 'focused':(-.18,.8,.4), 'amused':(1.0,.2,.65)
}

class PortraitMotion:
 def __init__(self):
  torch.set_num_threads(4)
  torch.backends.cudnn.benchmark=True
  weights=ROOT/'.avatar-cache/liveportrait/liveportrait'
  cfg=InferenceConfig()
  for key,name in [('F','appearance_feature_extractor'),('M','motion_extractor'),('W','warping_module'),('G','spade_generator')]:
   setattr(cfg,'checkpoint_'+key,str(weights/'base_models'/(name+'.pth')))
  cfg.checkpoint_S=str(weights/'retargeting_models/stitching_retargeting_module.pth')
  self.model=LivePortraitWrapper(cfg)
  self.base=cv2.imread(str(ROOT/'dist/assets/maya-portrait.png'))
  self.base=cv2.resize(self.base,(512,512),interpolation=cv2.INTER_AREA)
  blink=cv2.resize(cv2.imread(str(ROOT/'dist/assets/maya-blink.png')),(512,512),interpolation=cv2.INTER_AREA)
  # Give facial features more model pixels instead of reconstructing the whole torso.
  self.box=(82,0,430,348)
  x1,y1,x2,y2=self.box
  self.source=self.model.prepare_source(cv2.cvtColor(self.base[y1:y2,x1:x2],cv2.COLOR_BGR2RGB))
  with torch.inference_mode():
   self.info=self.model.get_kp_info(self.source)
   closed=self.model.get_kp_info(self.model.prepare_source(cv2.cvtColor(blink[y1:y2,x1:x2],cv2.COLOR_BGR2RGB)))
   self.eye_delta=closed['exp']-self.info['exp']
   # Only eyelids: keep jaw/identity and the synchronized mouth unchanged.
   for i in range(21):
    if i not in (11,13,15,16):self.eye_delta[:,i,:]=0
   self.feature=self.model.extract_feature_3d(self.source)
  yy,xx=np.mgrid[0:512,0:512].astype(np.float32)
  self.xx=xx;self.yy=yy
  # A soft subject mask retains the original office background at the edges.
  self.subject=np.zeros((348,348),np.float32)
  cv2.ellipse(self.subject,(174,150),(145,177),0,0,360,1,-1)
  self.subject=cv2.GaussianBlur(self.subject,(31,31),8)[...,None]

 @torch.inference_mode()
 def frame(self,t,duration,mood='warm',frame=None,loop=False,variant=0):
  model=self.model
  if frame is None:info=self.info;feature=self.feature;base=self.base
  else:
   base=cv2.resize(frame,(512,512),interpolation=cv2.INTER_AREA)
   x1,y1,x2,y2=self.box
   source=model.prepare_source(cv2.cvtColor(base[y1:y2,x1:x2],cv2.COLOR_BGR2RGB))
   info=model.get_kp_info(source);feature=model.extract_feature_3d(source)
  smile,brow,amount=MOODS[mood]
  # Ease into/out of each spoken turn; idle loops close at exactly one period.
  ease=1 if loop else min(1,t/.55,max(0,(duration-t)/.55))
  ease=ease*ease*(3-2*ease)
  period=duration if loop else 16
  phase=2*math.pi*t/period
  # Irregularly spaced poses with quiet holds avoid a metronomic head sway.
  def pose(values):
   knots=np.array([0,.12,.23,.36,.5,.62,.79,.91,1])*period
   time_in=t%period
   segment=min(7,int(np.searchsorted(knots,time_in,side='right')-1))
   u=np.clip((time_in-knots[segment])/(knots[segment+1]-knots[segment]),0,1)
   u=u*u*(3-2*u)
   return values[segment]*(1-u)+values[segment+1]*u
  direction=-1 if variant%2 else 1
  target={k:v.clone() for k,v in info.items()}
  target['yaw']+=ease*amount*direction*12.0*pose([0,.55,.55,-.28,-.28,.15,.15,0,0])
  target['pitch']+=ease*amount*7.0*pose([0,-.08,.4,.4,.05,.05,.28,0,0])
  target['roll']+=ease*amount*direction*5.0*pose([0,-.12,-.12,.3,.3,.1,-.1,0,0])
  if not loop:target['pitch']+=amount*1.15*max(0,1-abs(t-1.35)/.55)
  exp=target['exp']
  expression=ease*(.7+.3*math.sin(phase*.5)**2)
  s=smile*expression
  for index,axis,factor in [(20,1,-.01),(14,1,-.02),(17,1,.0065),(17,2,.003),(13,1,-.00275),(16,1,-.00275),(3,1,-.0035),(7,1,-.0035)]:
   if frame is not None and index in (20,14,17):continue
   exp[0,index,axis]+=s*factor
  exp[0,1,1]+=brow*expression*.001;exp[0,2,1]-=brow*expression*.001
  if mood=='amused':
   # A brief soft chuckle gesture, never a repeating laugh or a distress response.
   pulse=max(0,1-abs(t-1.25)/.65)*math.sin(t*16)**2
   target['pitch']+=pulse*.7
   exp[0,14,1]+=pulse*.002
  gaze=1.4*pose([0,.5,0,0,-.3,0,.3,0,0])*ease
  exp[0,11,0]+=gaze*.0007;exp[0,15,0]+=gaze*.001
  # Natural brief blinks; no long eye closures or overlay that drifts off the face.
  blink=0
  offset=(variant%11)*.09
  for center in (1.35+offset,5.25+offset,9.8+offset,14.1+offset):
   blink=max(blink,max(0,1-abs(t-center)/.13))
  exp+=self.eye_delta*blink*1.1
  target['t'][:,0]+=ease*.016*pose([0,.4,.4,-.2,-.2,.15,0,0,0])
  kp_source=model.transform_keypoint(info);kp_target=model.transform_keypoint(target)
  kp_target=model.stitching(kp_source,kp_target)
  out=model.parse_output(model.warp_decode(feature,kp_source,kp_target)['out'])[0]
  x1,y1,x2,y2=self.box
  patch=cv2.resize(cv2.cvtColor(out,cv2.COLOR_RGB2BGR),(x2-x1,y2-y1),interpolation=cv2.INTER_AREA)
  out=base.copy();out[y1:y2,x1:x2]=(patch*self.subject+base[y1:y2,x1:x2]*(1-self.subject)).astype(np.uint8)
  # A connected shift runs down the neck into the shoulders, with a quiet breath.
  body=np.clip((self.yy-210)/150,0,1)*np.sin(np.pi*self.xx/512)
  dx=body*ease*12.0*pose([0,.55,.55,-.28,-.28,.15,.15,0,0])
  dy=body*ease*(2.8*math.sin(phase*4)+3.5*pose([0,-.08,.4,.4,.05,.05,.28,0,0])+direction*(self.xx-256)/256*3*pose([0,.55,.55,-.28,-.28,.15,.15,0,0]))
  return cv2.remap(out,self.xx-dx,self.yy-dy,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)

 def render(self,output,mood='warm',input_video=None,duration=8,fps=25):
  start=time.time();output=Path(output).resolve();output.parent.mkdir(parents=True,exist_ok=True)
  variant=int(hashlib.sha256(output.stem.encode()).hexdigest()[:4],16)
  cap=cv2.VideoCapture(str(input_video)) if input_video else None
  count=int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) if cap else round(duration*fps)
  if cap:fps=cap.get(cv2.CAP_PROP_FPS);duration=count/fps
  temp=ROOT/'.talking-build'/(output.stem+'-motion.mp4')
  ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
  writer=subprocess.Popen([ffmpeg,'-y','-loglevel','error','-f','rawvideo','-pix_fmt','bgr24','-s','512x512','-r',str(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p',str(temp)],stdin=subprocess.PIPE)
  try:
   for i in range(count):
    frame=None
    if cap:
     ok,frame=cap.read()
     if not ok:raise RuntimeError('Incomplete input video')
    writer.stdin.write(self.frame(i/fps,duration,mood,frame,loop=cap is None,variant=variant).tobytes())
    if i%100==0:print(f'{output.stem}: {i}/{count}',flush=True)
   writer.stdin.close()
   if writer.wait()!=0:raise RuntimeError('Motion encoder failed')
  finally:
   if cap:cap.release()
   if writer.poll() is None:writer.kill();writer.wait()
  if input_video:
   subprocess.run([ffmpeg,'-y','-loglevel','error','-i',str(temp),'-i',str(input_video),'-map','0:v:0','-map','1:a:0','-c','copy','-movflags','+faststart',str(output)],check=True)
  else:temp.replace(output)
  print(f'{output.name}: {count} frames, {time.time()-start:.1f}s',flush=True)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('output');parser.add_argument('--input');parser.add_argument('--mood',choices=list(MOODS),default='warm');parser.add_argument('--duration',type=float,default=8)
 args=parser.parse_args();PortraitMotion().render(args.output,args.mood,args.input,args.duration)
