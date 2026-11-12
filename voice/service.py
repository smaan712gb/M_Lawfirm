"""Private, local TTS/STT service. Bind loopback; no cloned human voice."""
import io, os, tempfile, threading
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
import numpy as np
import soundfile as sf

app=FastAPI(title="Maya local speech")
lock=threading.Lock()
pipelines={}
recognizer=None
voices={"en":("a","af_heart"),"es":("e","ef_dora"),"hi":("h","hf_alpha")}

@app.middleware("http")
async def auth(request:Request,call_next):
    token=os.getenv("VOICE_SERVICE_TOKEN","")
    if token and request.headers.get("authorization")!="Bearer "+token:
        return Response(status_code=401)
    return await call_next(request)

class Speech(BaseModel):
    text:str=Field(min_length=1,max_length=2500)
    language:str="en"

def synthesize(text,language):
    if language not in voices: raise HTTPException(422,"No validated local voice for this language. Use text or a human interpreter.")
    from kokoro import KPipeline
    code,voice=voices[language]
    with lock:
        if code not in pipelines: pipelines[code]=KPipeline(lang_code=code,repo_id="hexgrad/Kokoro-82M",device=os.getenv("VOICE_DEVICE","cpu"))
        chunks=[audio for _,_,audio in pipelines[code](text,voice=voice,speed=0.91)]
        if not chunks: raise HTTPException(422,"No speech generated")
        out=io.BytesIO(); sf.write(out,np.concatenate(chunks),24000,format="WAV",subtype="PCM_16")
        return out.getvalue()

@app.get('/health')
def health(): return {"engine":"Kokoro-82M","languages":list(voices),"stt":"faster-whisper","voice":"af_heart","cloned_voice":False}

@app.post('/synthesize')
def speech(data:Speech): return Response(synthesize(data.text,data.language),media_type="audio/wav")

@app.post('/transcribe')
async def transcribe(request:Request):
    data=await request.body()
    if len(data)>5*1024*1024: raise HTTPException(413,"Audio too large")
    # Audio bytes never become a shell command; temporary recording is removed.
    with tempfile.NamedTemporaryFile(suffix='.webm',delete=False) as f: f.write(data); name=f.name
    try:
        from faster_whisper import WhisperModel
        global recognizer
        with lock:
            if recognizer is None: recognizer=WhisperModel(os.getenv('WHISPER_MODEL','small'),device='cpu',compute_type='int8')
            segments,info=recognizer.transcribe(name,beam_size=3,vad_filter=True)
            return {"text":" ".join(s.text for s in segments),"language":info.language}
    finally: Path(name).unlink(missing_ok=True)

if __name__=='__main__':
    import uvicorn
    uvicorn.run(app,host='127.0.0.1',port=int(os.getenv('VOICE_PORT','8765')))
