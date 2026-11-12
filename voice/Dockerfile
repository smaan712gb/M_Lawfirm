FROM python:3.11-slim
WORKDIR /speech
RUN apt-get update && apt-get install -y --no-install-recommends espeak-ng libsndfile1 ffmpeg && rm -rf /var/lib/apt/lists/*
COPY voice/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY voice/service.py ./service.py
COPY voice/designed-engine.py ./designed-engine.py
COPY dist/maya-media.json ./media/maya-media.json
COPY dist/assets/maya-*.wav ./media/assets/
RUN useradd --create-home speech && mkdir /models && chown speech:speech /models
USER speech
ENV HF_HOME=/models
ENV VOICE_MEDIA_ROOT=/speech/media
EXPOSE 8765
CMD ["uvicorn", "service:app", "--host", "0.0.0.0", "--port", "8765"]
