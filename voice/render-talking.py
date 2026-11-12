"""Render Maya's own portrait with audio-conditioned lip motion, locally.

Uses the documented MuseTalk 1.5 UNet/VAE/audio modules. The crop and feather
mask are calibrated only for the generated Maya portrait, not arbitrary people.
Upstream source remains unchanged under .research/MuseTalk (MIT).
"""
import argparse, json, math, os, sys, subprocess, time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.research'/'MuseTalk'))
import cv2
import numpy as np
import torch
import imageio_ffmpeg
from transformers import WhisperModel
from musetalk.models.vae import VAE
from musetalk.models.unet import UNet, PositionalEncoding
from musetalk.utils.audio_processor import AudioProcessor

class TalkingPortrait:
 def __init__(self):
  torch.set_num_threads(4)
  torch.backends.cudnn.benchmark=True
  if not torch.cuda.is_available(): raise RuntimeError('Local video rendering requires a working CUDA GPU.')
  self.device=torch.device('cuda');self.dtype=torch.float16
  cache=ROOT/'.avatar-cache'
  self.vae=VAE(str(cache/'vae'),use_float16=True)
  self.vae.vae.enable_slicing()
  self.unet=UNet(str(cache/'musetalk'/'musetalkV15'/'musetalk.json'),str(cache/'musetalk'/'musetalkV15'/'unet.pth'),use_float16=True,device=self.device)
  self.unet.model.eval()
  self.pe=PositionalEncoding(d_model=384).to(self.device,dtype=self.dtype)
  self.audio=AudioProcessor(str(cache/'whisper'))
  self.whisper=WhisperModel.from_pretrained(str(cache/'whisper'),torch_dtype=self.dtype).to(self.device).eval()
  self.base=cv2.imread(str(ROOT/'dist/assets/maya-portrait.png'))
  if self.base is None: raise RuntimeError('Maya portrait is missing')
  self.base=cv2.resize(self.base,(768,768),interpolation=cv2.INTER_AREA)
  # Coordinates are fractions of the full, approved portrait.
  self.box=tuple(round(v*768) for v in (.337,.146,.686,.563))
  x1,y1,x2,y2=self.box
  crop=cv2.resize(self.base[y1:y2,x1:x2],(256,256),interpolation=cv2.INTER_LANCZOS4)
  torch.manual_seed(17)
  with torch.inference_mode(): self.latent=self.vae.get_latents_for_unet(crop).to(self.device,self.dtype)
  self.mask=np.zeros((768,768),np.float32)
  cv2.ellipse(self.mask,(round(.508*768),round(.451*768)),(round(.105*768),round(.077*768)),0,0,360,1,-1)
  self.mask=cv2.GaussianBlur(self.mask,(31,31),7)
  # Preserve the headset microphone at the right cheek.
  headset=np.ones_like(self.mask);cv2.circle(headset,(round(.61*768),round(.461*768)),round(.019*768),0,-1)
  headset=cv2.GaussianBlur(headset,(13,13),3);self.mask*=headset
  self.mask=self.mask[y1:y2,x1:x2,None]

 @torch.inference_mode()
 def render(self,wav,output,batch=1,fps=25):
  started=time.time();output=Path(output).resolve();output.parent.mkdir(parents=True,exist_ok=True)
  features,length=self.audio.get_audio_feature(str(wav),weight_dtype=self.dtype)
  chunks=self.audio.get_whisper_chunk(features,self.device,self.dtype,self.whisper,length,fps=fps)
  temp=ROOT/'.talking-build';temp.mkdir(exist_ok=True)
  silent=temp/(output.stem+'-silent.mp4')
  ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
  writer=subprocess.Popen([ffmpeg,'-y','-loglevel','error','-f','rawvideo','-pix_fmt','bgr24','-s','768x768','-r',str(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p',str(silent)],stdin=subprocess.PIPE)
  x1,y1,x2,y2=self.box
  try:
   for start in range(0,len(chunks),batch):
    audio=self.pe(chunks[start:start+batch].to(self.device,self.dtype))
    latents=self.latent.repeat(len(audio),1,1,1)
    prediction=self.unet.model(latents,torch.tensor([0],device=self.device),encoder_hidden_states=audio).sample
    faces=self.vae.decode_latents(prediction)
    for face in faces:
     frame=self.base.copy();face=cv2.resize(face,(x2-x1,y2-y1),interpolation=cv2.INTER_CUBIC)
     original=frame[y1:y2,x1:x2]
     frame[y1:y2,x1:x2]=(face*self.mask+original*(1-self.mask)).astype(np.uint8)
     writer.stdin.write(frame.tobytes())
    if start%25==0: print(f'{output.stem}: {start}/{len(chunks)} frames',flush=True)
   writer.stdin.close()
   if writer.wait()!=0: raise RuntimeError('Video encoding failed')
  finally:
   if writer.poll() is None: writer.kill();writer.wait()
  subprocess.run([ffmpeg,'-y','-loglevel','error','-i',str(silent),'-i',str(wav),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','128k','-movflags','+faststart','-shortest',str(output)],check=True)
  print(json.dumps({'output':str(output.relative_to(ROOT)),'frames':len(chunks),'fps':fps,'seconds':round(time.time()-started,2),'bytes':output.stat().st_size}),flush=True)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('audio');parser.add_argument('output');parser.add_argument('--batch',type=int,default=1)
 args=parser.parse_args();TalkingPortrait().render(args.audio,args.output,args.batch)
