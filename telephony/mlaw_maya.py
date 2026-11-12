#!/usr/bin/env python3
"""Asterisk AGI adapter for a private test extension. Not carrier-tested.

Dependencies: Python 3, ffmpeg, a working M Law server + local speech service.
Set MLAW_URL and RECEPTION_BRIDGE_TOKEN in the Asterisk service environment.
No arbitrary shell execution, retained recordings, outbound dial or transfers.
"""
import json,os,re,subprocess,sys,tempfile
from pathlib import Path
from urllib.request import Request,urlopen

base=os.environ.get('MLAW_URL','http://127.0.0.1:3333').rstrip('/')
token=os.environ.get('RECEPTION_BRIDGE_TOKEN','')
if len(token)<24: raise SystemExit('Configure a private 24+ character reception bridge token.')

def agi(command):
 print(command,flush=True)
 response=sys.stdin.readline().strip()
 match=re.search(r'^200 result=(-?\d+)',response)
 if not match or match[1]=='-1': raise EOFError('Channel ended')
 return match[1]

def post(path,data,content_type='application/json'):
 if content_type=='application/json': data=json.dumps(data).encode()
 request=Request(base+'/api/reception/'+path,data=data,headers={'Authorization':'Bearer '+token,'Content-Type':content_type})
 with urlopen(request,timeout=65) as response: return response.read()

def api(path,data): return json.loads(post(path,data))

def prompt(text,lang,folder,index):
 source=Path(folder)/f'{index}-source.wav';target=Path(folder)/f'{index}.wav'
 source.write_bytes(post('speech',{'text':text[:2500],'language':lang}))
 subprocess.run(['ffmpeg','-loglevel','error','-y','-i',str(source),'-ar','8000','-ac','1','-acodec','pcm_s16le',str(target)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 return str(target.with_suffix(''))

def main():
 # Read the AGI environment before issuing commands. Caller ID is never proof of identity.
 for line in sys.stdin:
  if not line.strip(): break
 agi('ANSWER')
 with tempfile.TemporaryDirectory(prefix='mlaw-call-') as folder:
  greeting='Hello. I am Maya, an AI receptionist. This is a test service. Voice responses are temporarily processed by our speech service. For English press 1. Para español, pulse 2. हिन्दी के लिए तीन दबाएँ।'
  welcome=prompt(greeting,'en',folder,0)
  choice=agi(f'GET DATA "{welcome}" 10000 1')
  lang={'1':'en','2':'es','3':'hi'}.get(choice,'en')
  response=api('start',{'language':lang});sid=response['sessionId']
  for index in range(1,41):
   text=response['text'];choices=response.get('choices',[])
   if response.get('summary'): text+=' '.join(str(v) for k,v in response['summary'].items() if k!='start')
   # DTMF makes choices, phone numbers and codes reliable without guessing from ASR.
   if choices: text+=' '.join(f'{i+1}. {c["label"]}.' for i,c in enumerate(choices))
   wav=prompt(text,lang,folder,index)
   if choices or response['step'] in ('phone','code'):
    digits=agi(f'GET DATA "{wav}" 20000 {2 if choices else 18}')
    if not digits: continue
    if choices:
     selected=int(digits)-1
     if not 0<=selected<len(choices): continue
     turn={'action':choices[selected]['action']}
    else: turn={'text':digits}
   else:
    agi(f'STREAM FILE "{wav}" ""')
    recording=Path(folder)/f'input-{index}'
    agi(f'RECORD FILE "{recording}" wav "#" 20000 0 BEEP s=3')
    text=json.loads(post('transcribe',recording.with_suffix('.wav').read_bytes(),'audio/wav'))['text']
    if not text: continue
    turn={'text':text}
   response=api('message',{'sessionId':sid,**turn})
 agi('HANGUP')

if __name__=='__main__':
 try: main()
 except (EOFError,BrokenPipeError): pass
 except Exception:
  # Never put transcripts, verification codes or credentials in Asterisk logs.
  try: agi('VERBOSE "Maya test adapter unavailable; check private service health" 1');agi('HANGUP')
  except Exception: pass
