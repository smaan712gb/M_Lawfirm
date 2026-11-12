# Reception implementation evidence — November 12, 2026

## REA: owned calendar implementation

Source: [Cal.com / cal.diy](https://github.com/calcom/cal.diy), MIT, commit `ef7954d16ab50882ca2f263c551537115b8a8bb1`. Bounded REA analysis selected `packages/lib/availability.ts` using `rea-agents@6.8.0` and Node 24.22.1.

The run completed and generated 6,234,351 bytes of local evidence at ignored `evidence/raw/cal-availability.json`. Parent evidence: `ev_a28a14df8f00319a4a218216ea6a415ee8656f53d71066854d15b1946cb38bb8`. Summary evidence: `ev_d566478acc359c8c9ae8e3c86ee4d4b74df71e8093d28e6a8ef05f4f5ae8b817`.

Direct source inspection and REA's static graph informed the separation of working hours, timezone conversion and availability. The firm's independent implementation iterates UTC instants and checks their New York local working hours, then removes occupied slots and rechecks availability on confirmation. Tests cover spring/autumn DST, competing confirmations and cancellation release. No Cal.com code was copied. This analysis covers the selected module only, not the whole product or its runtime.

## Voice selection and actual execution

- [Kokoro-82M official model card](https://huggingface.co/hexgrad/Kokoro-82M): Apache-2.0 open weights, small local model. [Voice reference](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md). The prototype uses `af_heart` (English), `ef_dora` (Spanish), `hf_alpha` (Hindi), speed 0.91. These are supplied voices, not cloned voices.
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper): local STT using `small`, CPU/int8. A generated English sample was transcribed successfully; the model rendered the brand as “EmLaw”, so brand pronunciation remains a tuning item.
- [Chatterbox](https://github.com/resemble-ai/chatterbox): its current official README says the research models are retired and no longer maintained. It was not selected as the default runtime. Its MIT archive remains a possible separately evaluated option.
- [AI4Bharat Indic Parler](https://huggingface.co/ai4bharat/indic-parler-tts): examined for wider Indic speech. Access requires accepting conditions. No gated weights were obtained, and no Urdu or Punjabi voice is claimed as working.

`evidence/voice-check.json` records generation success for Spanish/Hindi and the English STT transcript. The actual wav samples are in `dist/assets/`. A second check exercised the Node `/api/reception/speech` and `/api/reception/transcribe` proxies against the running Python service. No microphone recording of a real person was used. Generation and recognition are not native-speaker quality certification.

## Hermes execution

[Hermes upstream](https://github.com/NousResearch/hermes-agent), MIT, commit `ff2591a04602f8531f1639e37da3061e9bba6ca9`. [Official MCP documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp).

Installed the repository's frozen uv environment with MCP extra using project-local uv 0.13.7 and stable Python 3.14.2. An initial plain pip resolution did not honor upstream's Pillow override; the supported locked installation resolved it. An old cached Python alpha was replaced for the validation run.

`scripts/check-hermes.py` imported Hermes's actual tool discovery/registry, discovered the three reception tools, created a callback after an explicit scripted confirmation, and read it from the queue. It used a disposable fictional database. `evidence/hermes-check.json` contains the result. No model provider, live LLM reasoning, gateway or external messages were exercised.

## App verification

- Seven Node tests pass, covering existing workspace persistence/MCP plus reception confirmation, six text languages, slot collisions, DST, verification delivery destination, one-time-code consumption and scoped bridge authorization.
- Desktop browser: Maya rendered, a fictional booking was confirmed and appeared in the shared staff calendar. Spanish prompt/choices rendered. No console errors during the inspected flow.
- Mobile layout inspected at 390 × 844; viewport restored afterward. Desktop screenshot: `evidence/maya-preview.jpg`.
- Python syntax checks cover voice service, speech checks, SMTP delivery, Hermes check and Asterisk adapter.
- The Asterisk adapter, SMTP sender and Docker voice image are implemented but not live-service tested. No carrier or real mailbox was connected; no existing telephone routing changed.
