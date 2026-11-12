"""Private, local TTS/STT service. Bind loopback; no cloned human voice."""
import io, os, tempfile, threading, json, unicodedata, importlib.util, asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
import numpy as np
import soundfile as sf

def load_recognizer():
    from faster_whisper import WhisperModel
    global recognizer
    if recognizer is None:recognizer=WhisperModel(os.getenv('WHISPER_MODEL','small'),device='cpu',compute_type='int8')
    return recognizer

@asynccontextmanager
async def lifespan(app):
    if os.getenv('VOICE_PRELOAD_STT')=='true':await asyncio.to_thread(load_recognizer)
    yield

app=FastAPI(title="Maya local speech",lifespan=lifespan)
lock=threading.Lock()
pipelines={}
recognizer=None
designed=None
engine=os.getenv('VOICE_ENGINE','fixed')
voices={"en":("a","af_heart"),"es":("e","ef_dora"),"hi":("h","hf_alpha")}
media_root=Path(os.getenv('VOICE_MEDIA_ROOT',str(Path(__file__).resolve().parents[1]/'dist')))

def cached_speech(text,language):
    manifest=media_root/'maya-media.json'
    if not manifest.exists():return None
    key=lambda value:' '.join(unicodedata.normalize('NFKC',value).split())
    for clip in json.loads(manifest.read_text(encoding='utf-8')).get('clips',[]):
        if clip['language']==language and key(clip['text'])==key(text):
            path=(media_root/clip['audio'].lstrip('/')).resolve()
            if not path.is_relative_to(media_root.resolve()) or path.suffix!='.wav':return None
            return path.read_bytes() if path.exists() else None
    return None

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
    cached=cached_speech(text,language)
    if cached is not None:return cached
    if engine=='designed':
        if language not in ('en','es'):raise HTTPException(422,'No validated dynamic voice for this language. Continue in text.')
        global designed
        with lock:
            if designed is None:
                spec=importlib.util.spec_from_file_location('maya_designed',Path(__file__).with_name('designed-engine.py'))
                module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);designed=module.DesignedVoice()
            audio,sr=designed.synthesize(text,language)
            out=io.BytesIO();sf.write(out,audio,sr,format='WAV',subtype='PCM_16');return out.getvalue()
    if engine!='kokoro':raise HTTPException(422,'Maya has no reviewed recording for this response. Continue in text.')
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
def health(): return {"status":"ready","engine":engine,"languages":['en','es'] if engine=='designed' else list(voices) if engine=='kokoro' else [],"fixed_phrase_languages":[lang for lang in ('en','es','ur','hi','ar') if (media_root/f'assets/maya-{lang}-hello.wav').exists()],"stt":"faster-whisper","cloned_real_person":False}

@app.post('/synthesize')
def speech(data:Speech): return Response(synthesize(data.text,data.language),media_type="audio/wav")

@app.post('/transcribe')
async def transcribe(request:Request):
    data=await request.body()
    if len(data)>5*1024*1024: raise HTTPException(413,"Audio too large")
    language=request.headers.get('x-maya-language')
    if language and language not in ('en','es','ur','hi','ar','pa'):raise HTTPException(422,'Unsupported transcription language')
    # Audio bytes never become a shell command; temporary recording is removed.
    with tempfile.NamedTemporaryFile(suffix='.webm',delete=False) as f: f.write(data); name=f.name
    try:
        with lock:
            segments,info=load_recognizer().transcribe(name,language=language,beam_size=3,vad_filter=True)
            return {"text":" ".join(s.text for s in segments),"language":info.language}
    finally: Path(name).unlink(missing_ok=True)

if __name__=='__main__':
    import uvicorn
    uvicorn.run(app,host='127.0.0.1',port=int(os.getenv('VOICE_PORT','8765')))
