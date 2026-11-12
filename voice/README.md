# Maya speech and portrait rendering

The browser plays locally hosted MP4/WAV assets. It does not call a paid avatar service. Eighty fixed reception utterances in English, Spanish, Urdu, Hindi and Arabic have speech-conditioned mouth motion plus pose, eyelid, eye-gaze, facial-expression and shoulder movement. Five silent presence clips cover waiting/listening contexts, with one brief amused reaction. The visible virtual-identity disclosure stays outside the portrait; it is not part of the spoken greeting.

The production telephone adapter is still unconnected. Arbitrary new speech and dynamic case-update text do not acquire lip-sync merely because these fixed clips exist. Punjabi is available in text only. Unreviewed translations are not spoken. The default service plays the exact cached voice set; it never changes to a browser/system voice. An optional private designed-voice engine can synthesize new English/Spanish text. Uncached Urdu requests fail explicitly instead of using English.

## Rendering environment used

Windows, Python 3.11.11, NVIDIA RTX 4060 8 GB. The renderer is separate from the lightweight web server and the CPU speech environment. Models and temporary files stay in ignored directories. No client data was used for media generation.

1. Create `.avatar-venv` with Python 3.11.
2. Install `torch==2.6.0 torchvision==0.21.0 torchaudio==2.6.0` using the official `https://download.pytorch.org/whl/cu124` package index.
3. Install `voice/avatar-requirements.txt` into that environment.
4. Clone the official repositories under ignored `.research/MuseTalk` and `.research/LivePortrait`. Tested code revisions: MuseTalk `0a89dec45a0192b824e3cf4daf96c239440c5ed8`; LivePortrait `9b294b3d0536135442ea73cb01e6cb3ca7029dd3`.
5. Run `voice/download-talking-models.py` and `voice/download-motion-models.py`. These pin the tested public model revisions. Model licence terms remain applicable.
6. Prepare the two isolated speech environments described below, then run `voice/build-reception-speech.py`. It reads current utterances from `dist/maya-core.mjs`; Urdu pronunciation is in `voice/urdu-pronunciation.json`. Staged recordings carry text/reference/audio fingerprints. Promotion verifies the complete set before replacing any assets.
7. Run `voice/render-reception.py --idle --refresh-motion` in the avatar environment. It renders mouth motion, applies `refine-talking.py` to suppress movement during quiet audio and preserve skin detail, then renders portrait motion. It can take tens of minutes on this GPU. `--keys hello` narrows an iteration to greetings. Changed audio invalidates the lip render; changed audio, refined media or motion code invalidate the final video cache. The public revision includes both audio and video hashes, so a motion-only correction also replaces cached browser playback.
8. Run `node scripts/index-maya-media.mjs`, `voice/check-reception-media.py`, `npm run check` and `npm test` before publishing. Browser-check playback, language switching, stop/replay, mobile layout and expression transitions. `--speech` on the media checker requires faster-whisper in that environment.

The avatar renderer deliberately uses the approved portrait's fixed framing and a calibrated mouth mask. It is not an upload-and-animate service for arbitrary people. Movement uses eased pose holds, brief blinks and modest facial controls. Expressions derive from `dist/maya-presence.mjs` and known workflow steps; the caller is not classified or profiled.

`maya-vad.mjs` and the browser audio worklet detect a caller starting to speak before transcription. They retain 320 ms of opening audio, require 90 ms of activity to interrupt, end a turn after 650 ms of quiet, and cap each recording at 45 seconds. These are detector settings, not measured end-to-end telephone latency. `maya-voice.mjs` requests 16 kHz audio and echo cancellation, serializes transcription and discards late results after microphone shutdown. The selected language reaches the local transcription endpoint. Browser permission is required; closing Maya, switching languages or ending the conversation releases microphone tracks.

## Designed voice

The first Kokoro-derived auditions were rejected as too artificial. The replacement uses an original speaker designed with Qwen3-TTS, with a gentle mid-low female voice, conversational phrasing and natural breathing. The user preferred the softer audition. `voice/reference/maya.wav` and its JSON contain the synthetic reference and exact design instruction. `polish-speech.py` applies a pitch-preserving 0.90 tempo, 0.92 gain and modest 3.2 kHz softening before video rendering. It retains raw audio in the ignored cache and records the delivery profile in each asset's provenance. No real person's recording was supplied. Naturalness is subjective; word-accuracy checks do not establish human indistinguishability.

- `.voice-design-venv`: Python 3.11, CUDA torch/torchaudio/torchvision 2.6.0/2.6.0/0.21.0. Install official `.research/Qwen3-TTS` at `022e286b98fbec7e1e916cb940cdf532cd9f488e` in editable mode. Its pinned runtime uses transformers 4.57.3 and accelerate 1.12.0. Use SDPA on Windows; FlashAttention is optional. Run `download-designed-model.py` and `download-designed-model.py --base` for pinned weights. Base generation preserves the designed speaker across English/Spanish lines.
- `.conversation-venv`: same Python and CUDA torch versions. Install official `.research/chatterbox` at `ab55923c27757c90cfcc407baa57dc25a7d25217` in editable mode; its runtime requires transformers 5.2.0, so keep it separate. Run `download-conversational-models.py` for the pinned multilingual V3 weights. `voice/reference/maya-indic.wav` supplies a synthetic Hindi female reference for Hindi and the explicit Urdu phonetic scripts; the English reference produced an unsuitable accent in the audition. This is a language-specific voice reference, not a promise of identical timbre across languages. Its built-in audio watermark remains enabled.
- Arabic uses the multilingual model's Arabic support with the original synthetic reference. `speech-pronunciation.json` contains reviewed pronunciation variants. Office replies are conversational; exact addresses and the telephone number appear in the response card after number-heavy speech proved unreliable in some languages. These web replies need adaptation before a telephone-only rollout.
- `preview-designed-voice.py` creates audition references; `build-designed-speech.py` stages phrases, `polish-speech.py` applies the selected delivery, and `promote-designed-speech.py` promotes a complete matching set. `build-reception-speech.py` orchestrates these steps for existing references. Caches and rejected auditions are ignored.

For optional dynamic English/Spanish speech, install FastAPI, uvicorn and faster-whisper in the design environment, set `VOICE_ENGINE=designed`, and run `voice/service.py` with that environment. `MAYA_VOICE_MODEL`, `MAYA_VOICE_REFERENCE` and `VOICE_DEVICE` override local paths/device. Load and benchmark it before use: on this test GPU offline generation takes several times the audio duration and is **not** a demonstrated real-time telephone pipeline. The meeting launcher uses cached fixed speech and local transcription; the lightweight Docker image also defaults to cached speech. The legacy `VOICE_ENGINE=kokoro` must be explicitly requested and is not a silent fallback.

## Sources and licences

- [MuseTalk](https://github.com/TMElyralab/MuseTalk): MIT code; its official model licence accompanies the downloaded weights. Used for audio-conditioned mouth generation.
- [LivePortrait](https://github.com/KlingAIResearch/LivePortrait): MIT code and human animation modules. **InsightFace detection/recognition weights are not downloaded or used**; the fixed approved portrait bypasses that optional dependency and its noncommercial model restriction.
- [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS): Apache-2.0 code/models for original voice design and English/Spanish speech.
- [Chatterbox](https://github.com/resemble-ai/chatterbox): MIT archived research code for Hindi, phonetic Urdu and Arabic speech. Upstream states it is retired and unmaintained as of August 2026; it is not represented as an actively supported service. Native-speaker review remains necessary.
- [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M): superseded auditions and optional explicit legacy CPU engine; not the default Maya voice.
- [Whisper tiny](https://huggingface.co/openai/whisper-tiny) supplies audio features; [SD VAE](https://huggingface.co/stabilityai/sd-vae-ft-mse) has its own model licence.

The public Urdu/Tortoise experiment in `make-urdu.py` did not pass the intelligibility check and is not used by the application. Its optional download requires `download-talking-models.py --urdu-research`; the experimental runtime has separate AGPL obligations. It is not needed to reproduce the shipped speech or motion.

Playback needs only the web host. Model inference needs compute, electricity, maintenance and storage; eliminating an avatar subscription does not eliminate those operating costs.

### Other native-Urdu candidates reviewed

[OmniVoice's own model card](https://huggingface.co/k2-fsa/OmniVoice#license) distinguishes Apache code from **CC-BY-NC model weights**, so it was not adopted for the firm's commercial deployment. [Indic Parler](https://huggingface.co/ai4bharat/indic-parler-tts) requires model-access acceptance. [VoxCPM2 Indic](https://github.com/tieincred/VoxCPM2-Indic) documents native Urdu, but its linked model returned 401/unavailable during this build; no usable checkpoint was obtained. [Dia Urdu](https://huggingface.co/mahwizzzz/Dia-1.6B-Urdu) documents early-checkpoint/prosody limitations and was not substituted without testing. These are research findings, not connected capabilities. The shipped Urdu path remains fixed phonetic phrases pending native-speaker acceptance.
