# Maya: owned reception, calendar and voice

Maya is an original illustrated AI identity with a female Kokoro voice. She explicitly identifies herself as AI. The software has no reception or scheduling SaaS dependency. It uses the same SQLite workspace as matters, tasks and approved client updates.

## Working now

- New inquiries become matters plus conflict-review tasks after the caller confirms the summary.
- Callbacks enter a staff queue; staff can mark them returned.
- Thirty-minute consultations reserve a shared team calendar, weekdays 9–5 in `America/New_York`, with two hours' notice. New York DST is handled. Competing confirmations cannot reserve the same slot. Staff can cancel a reservation to release the slot.
- Case updates come only from the separate attorney-approved client update collection. The caller must receive a one-time code at the matter's registered contact. Codes expire after five minutes, are hashed in memory, consumed after use and limited per matter. Missing delivery configuration fails closed. The browser-only preview instead labels its fixed code as fictional.
- English, Spanish, Urdu, Hindi, Punjabi and Arabic text flows. Local female English, Spanish and Hindi speech samples were generated. English was successfully transcribed back through faster-whisper. Native-speaker quality and real telephone audio have not been evaluated. Urdu, Punjabi and Arabic remain text-only on the local service.
- Microphone turns are transcribed locally; each recording is discarded after transcription. The browser has separate record and read-response controls. This is turn-taking, not interruptible full-duplex speech.
- Hermes actually discovered all three reception MCP tools and created a confirmed callback through its tool dispatcher in a temporary fictional workspace. This validates the tool integration, not a live LLM-driven conversation.

## Local voice

Use Python 3.11 in an isolated virtual environment, install `voice/requirements.txt`, then:

```sh
python voice/service.py
```

Set `VOICE_SERVICE_URL=http://127.0.0.1:8765` in the Node application's private environment, restart `npm start`, and open Maya. For a private network service, set the same `VOICE_SERVICE_TOKEN` in both processes. Model downloads happen on first use; cache and warm them before a demonstration. CPU inference works on the tested machine; peak traffic and telephone latency are not benchmarked.

Generate the sample again with `python voice/make-sample.py`. Run `python voice/check-speech.py` to generate Spanish/Hindi samples and check the English STT round trip. This downloads models. Keep `HF_HOME` outside tracked source. The model and Python libraries have their own open-source licences.

For a Linux VPS, `compose.voice.yaml` adds a private speech container and persistent model cache:

```sh
docker compose -f compose.yaml -f compose.voice.yaml up -d --build
```

The Docker build has not been executed here. Allocate memory and benchmark before selecting the Hostinger plan. Never expose the voice service publicly.

## Verification email without a new SaaS subscription

`services/verification_mail.py` uses Python's SMTP client and the firm's existing mail server. Set `SMTP_HOST`, `SMTP_PORT` (587), `SMTP_FROM`, `SMTP_USERNAME`, `SMTP_PASSWORD` and a private `VERIFICATION_DELIVERY_TOKEN` in its process environment. Run it privately on loopback port 8766. Set the same token and `VERIFICATION_DELIVERY_URL=http://127.0.0.1:8766` in the Node server. STARTTLS is mandatory. No real messages were sent during development. Registered email data and firm-approved sender configuration are required; phone-only contacts need a separate SMS delivery adapter or a staff callback.

## Hermes

The current upstream source is retained locally under ignored `.research/hermes-agent`. Its locked environment with the MCP extra was installed using current uv and stable Python 3.14.2. `scripts/check-hermes.py` exercises the actual Hermes MCP discovery and dispatcher, without a model or provider credentials. Evidence is in `evidence/hermes-check.json`.

Merge `agents/hermes/config.example.yaml` into a dedicated private firm's Hermes profile and adjust paths. The supplied `SOUL.md` describes the operating boundaries. The internal workspace profile can access staff records; do not publish it to callers. Reception has its own narrow stateful tools. No Hermes model key, gateway, recurring background worker or paid inference has been configured. Configure a local model or the selected provider before an autonomous model-driven run.

## Existing number, forwarded later

`telephony/mlaw_maya.py` is an Asterisk AGI test adapter: it plays generated speech, accepts DTMF choices/codes/phone numbers, transcribes spoken names and summaries, and forwards turns to the same reception service. Temporary audio is deleted on exit. It does not dial out or transfer calls. `extensions.example.conf` defines only a private test extension. It has been syntax checked, not tested against Asterisk or a carrier.

Install on the private Asterisk host with Python 3 and ffmpeg, configure `MLAW_URL` and a matching 24+ character `RECEPTION_BRIDGE_TOKEN` in the server and Asterisk environments, and test with fictional callers first. The scoped token can access only `/api/reception/*`, not `/api/state`. Staff use the private review password or the named-account mode described in [pilot setup](PILOT_SETUP.md).

Live forwarding is intentionally pending the user's chosen later step. It needs a SIP carrier/trunk, firm approval of the AI/recording notice, a tested human escalation route, failure handling, load/latency checks, language QA, and monitoring. Phone minutes and hosting remain operating costs. No routing changes or paid services were provisioned.

## Limits that matter

Appointments use one shared resource and fixed weekday hours; attorney-specific schedules, holidays, rescheduling by callers, reminder delivery and calendar synchronization are not implemented. Only the first twelve available slots are offered. Reception sessions and verification challenges are in memory and expire on restart. Named accounts and role restrictions are available, but production matter-level authorization and MFA remain outstanding. Encrypted backup/recovery now works; do not import real client data before deployment security, retention and operational recovery are validated.

The receptionist cannot replace attorney judgment, guarantee deadlines, accept representation, provide medical/emergency services or submit legal filings. The complete firm's subscription-replacement project remains a broader production engineering and validation effort; this is a working connected prototype.
