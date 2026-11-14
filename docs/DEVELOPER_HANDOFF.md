# M Law developer handoff

Updated November 14, 2026. Repository: [smaan712gb/M_Lawfirm](https://github.com/smaan712gb/M_Lawfirm).

Track assignment, implementation PRs and acceptance in [developer handoff issue #1](https://github.com/smaan712gb/M_Lawfirm/issues/1).

This is the complete connected prototype, including the shipped website and Maya media. It is suitable for fictional-data demonstrations and controlled pilot engineering. It is not a production law-firm system. Continue from the existing implementation rather than rebuilding the demonstration from screenshots.

## First-day checklist

1. Clone the repository and use Node **24.15.0 or later**. The application uses built-in SQLite and has no third-party runtime JavaScript dependencies.
2. Run the syntax checks and tests below before changing code. The November 14 baseline passed 28 tests and checked 36 JavaScript files.
3. Start the local app with fictional records. Walk through intake, preparation, internal attorney review, Maya, import and backup/restore.
4. Read [architecture](ARCHITECTURE.md), [pilot setup](PILOT_SETUP.md), [blueprint reconciliation](BLUEPRINT_RECONCILIATION.md), and the prioritized backlog below.
5. Agree the first production pilot, accountable attorney, hosting/data region and system-of-record ownership with Saad and the firm. No developer, deployment target or production cutover has been assigned by this handoff.

```sh
git clone https://github.com/smaan712gb/M_Lawfirm.git
cd M_Lawfirm
node --version
npm run check
npm test
npm start
```

Open `http://127.0.0.1:3333/#os/onboarding`. Stop with Ctrl+C. A separate dependency installation is not needed for the Node app. There is **no frontend bundler step**: the editable browser source and ready-to-serve assets live in `dist/`; keep that directory tracked.

`npm start` reads an optional ignored `.env`. With no configured model, the app uses explicitly labelled structured preparation rather than pretending that live inference ran. Do not copy a working developer's private `.env` or data into source control.

On Windows, `Start Meeting.cmd` selects the isolated `.meeting-data/` demonstration workspace and starts optional components if installed. It does not reproduce a different machine's Python environments, model caches or credentials. Historical statements in `TODAY_MEETING.md` describe the original November 12 demonstration, not the state of a fresh checkout.

## Repository map

| Area | Entry points | Responsibilities |
|---|---|---|
| Browser application | `dist/index.html`, `dist/app.js`, other `dist/*.mjs`, `dist/assets/` | Landing page, firm workspace, reception, client-side demo data and bundled media |
| HTTP application | `server.mjs` | Static serving, API routing, auth boundaries, private integrations |
| Persistence | `lib/storage.mjs` | SQLite revisioned workspace document, local files; not normalized production storage |
| Accounts / access | `lib/access.mjs`, `scripts/user.mjs` | Named accounts, capability roles, sessions, CSRF and access events |
| Imports / recovery | `lib/onboarding.mjs`, `lib/backup.mjs`, `scripts/backup.mjs`, `Restore-Backup.ps1` | Reviewed CSV import, encrypted portable backups and restore into a new directory |
| Reception | `lib/reception.mjs`, `dist/maya-*`, `reception-mcp.mjs` | Confirmed intake, bookings, callbacks, verification and scripted voice turns |
| Model / scoped agent | `lib/model.mjs`, `lib/workspace-agent.mjs`, `agents/draft-matter.py`, `agents/matter-context.mjs` | Direct model adapter or optional installed Hermes; selected-matter-only context and retrieval receipts |
| Workspace MCP | `mcp-server.mjs` | Five read-only workspace tools; local process trust boundary |
| Legal update intake | `lib/law-collector.mjs`, `scripts/collect-law.mjs` | Bounded allowlisted feed snapshots; no automatic legal-rule changes |
| Voice / avatar | `voice/`, `dist/maya-media.json`, `scripts/index-maya-media.mjs` | Python service, fixed speech, optional synthesis, media generation and provenance |
| Delivery adapters | `services/verification_mail.py`, `telephony/` | Optional SMTP verification service and unconnected Asterisk test adapter |
| Deployment | `Dockerfile`, `compose.yaml`, `compose.voice.yaml`, `Caddyfile` | Proposed private VPS/container packaging, not a verified production deployment |
| Tests / evidence | `tests/`, `evidence/`, `output/pdf/` | Automated checks, historical fictional demonstrations, media evidence and meeting guide |

The static Sites preview uses browser storage and has no shared database, private model key or private transcription service. Its records do not synchronize with the Node server. Local Node records live under `DATA_DIR` (default `.data/`).

## What is actually implemented

- Connected matters, intake, contacts within matters, tasks, editable drafts, file uploads, time/expense records and CSV/ICS exports.
- Reviewed CSV mapping/import, duplicate-ID skipping, workspace revision checks, version-bound attorney review and linked preparation work products.
- Four account capability profiles, expiring sessions, CSRF checks, server-recorded access events, and encrypted backups with file hashes and isolated restoration.
- Daily firm brief and deterministic record consistency checks, plus a read-only workspace MCP interface.
- Confirmed reception intake/callback/booking flows, shared-calendar collision checks, and case-update verification that fails closed without delivery configuration.
- Eighty fixed speech responses across English, Spanish, Urdu, Hindi and Arabic, synchronized portrait clips, contextual presence clips, language persistence and browser interruption logic. Punjabi is text-only. Fixed phrases do not provide arbitrary multilingual speech or general live lip-sync.
- Optional direct drafting and a selected-matter Hermes adapter. Historical live drafting used fictional records; fresh-checkout tests use controlled fixtures, not a paid provider.

Internal attorney review does not send a draft, file with a court, accept representation or move money. The separately configured verification-mail adapter can send one-time codes; treat enabling it as an external integration. No live carrier or production mailbox connection is delivered by cloning this repository.

## Optional services and reproducibility gaps

| Service | Configuration / instructions | Fresh-checkout limitation |
|---|---|---|
| Direct drafting | Server-only `MODEL_BASE_URL`, `MODEL_NAME`, `MODEL_API_KEY`, optional `MODEL_THINKING`; see `.env.example` | No key included. Use an approved provider/local model and only permitted data. Do not assume an API alias remains unchanged. |
| Windows drafting setup | `Connect Drafting.cmd` | Stores an OS-user-encrypted key in ignored `.local-secrets/`; cannot be transferred as a portable credential. |
| Hermes drafting | `AGENT_PYTHON_PATH`; [connectors](CONNECTORS.md), `agents/draft-matter.py` | Local installed Hermes/uv environments are not vendored. Create a pinned, tested installation procedure before handing this path to production. |
| Microphone transcription | Python 3.11 venv, `voice/requirements.txt`, `python voice/service.py`, `VOICE_SERVICE_URL`; [reception](RECEPTION.md) | Models download separately. Tokens must match for private network use. Physical echo and real-call quality are not established by unit tests. |
| Re-rendering Maya | [voice reproduction guide](../voice/README.md) and pinned download scripts | Separate GPU/Python environments and upstream model licences; not required for playback of shipped assets. |
| SMTP verification | `SMTP_*`, `VERIFICATION_DELIVERY_URL`, matching token; [reception](RECEPTION.md) | Requires an approved sender and registered contact data; phone-only contacts need a different channel. |
| Ontology | `AUTO_ONTOLOGY_URL`, token, `npm run ontology:export` | Adapter/staging export only. No running NVIDIA service, certified ontology or document extraction pipeline is supplied. |
| Law feeds | `LAW_FEED_URLS`, `LAW_POLL_MINUTES` | Empty by default; source snapshots need review. Current interval is process-local, not a durable job system. |

Concrete packaging issue: the current app `Dockerfile` copies the Node code, scripts and `dist/`, but **does not copy `agents/` or install Python/Hermes**. Do not enable `AGENT_PYTHON_PATH` inside that image and assume it will work. Choose and test a supported agent container/sidecar or explicitly support only the direct Node model path there. Docker builds, deployment, paid provider calls and telephony were not run for this handoff.

## Remaining work, in recommended order

### P0 - Reproducible delivery and a bounded pilot

- Add CI for the existing checks on a clean Node 24 checkout. Include asset integrity tests; do not replace binary media with broken LFS pointers or omit `dist/`.
- Pin and document optional Hermes, speech and rendering environments. Validate app and voice Docker builds, required files, first-start downloads, health checks, secrets and non-root operation.
- Fix/decide the container agent packaging issue above. Define startup/shutdown and failure behavior for every enabled service.
- Decide pilot scope, approved data, staff, migration sources, language priorities, hosting region, support owner and acceptance signoff. Preserve existing firm systems until acceptance.

Acceptance: a developer on a second machine can run the documented core flow from a clean clone; each enabled optional service has a reproducible procedure and tested failure path; actual configuration and costs are recorded without committing secrets.

### P0 - Identity, matter isolation and private deployment

Relevant: `lib/access.mjs`, `server.mjs`, `mcp-server.mjs`, `reception-mcp.mjs`, deployment files.

- Implement the selected identity/MFA approach and server-side matter-level authorization across API, files, search, exports, model context and tools. Current roles can see all matters.
- Separate public intake from private staff operations. Design client identities and verification separately from staff accounts.
- Validate TLS/proxy handling, session revocation, secret rotation, upload validation/scanning, audit retention and operational monitoring. `PUBLIC_HTTPS=true` alone does not configure TLS.
- Make MCP identity and scopes explicit before network exposure; the present stdio trust boundary is not per-user authorization.

Acceptance: unauthorized users cannot discover another matter through any route, file identifier, export or model/tool response; revoked sessions fail; named staff and MFA operate behind actual HTTPS; independent review findings are closed or accepted by the firm.

### P0 - Durable storage, recovery and operations

Relevant: `lib/storage.mjs`, `lib/backup.mjs`, `lib/onboarding.mjs`, `lib/reception.mjs`.

- Plan migration from one revisioned SQLite workspace document to the normalized production model in [architecture](ARCHITECTURE.md); preserve stable IDs, ownership, versions and review fingerprints.
- Add controlled object storage, file versions, retention/legal holds and a restore-tested backup strategy for data, files, accounts, access-event history and configuration.
- Persist required reception/session/job state; define retries, idempotency, dead-letter handling, concurrency and operational alerts.
- Define and test realistic volume, availability, RPO and RTO with the firm. Prototype backup limits are 32 MB file bytes and a 50 MB bundle; accounts and operational configuration are excluded.

Acceptance: representative concurrent changes reconcile correctly; failed jobs are visible and retry safely; a new environment can restore all required systems with measured RPO/RTO and access controls intact.

### P1 - Intake, scheduling, communications and supervised workflows

Relevant: `lib/reception.mjs`, `lib/onboarding.mjs`, `services/`, `dist/`, agent and MCP modules.

- Implement alias/adverse-party/closed-matter conflict search, duplicate resolution, conflict disposition and approved engagement/retainer workflow. A reservation currently creates a review task, not conflict clearance.
- Replace the shared fixed-hours calendar with approved attorney availability, holidays, rescheduling, reminders and provider synchronization.
- Implement selected mail/calendar/SMS/e-sign adapters with least-privilege OAuth, consent, exact-recipient review, idempotent delivery and receipts.
- Move preparation and scheduled briefings to durable orchestration only after defining accountable review and exception handling. Keep external send/sign/file/payment operations distinct from model-generated work.

Acceptance: an end-to-end fictional matter moves from confirmed intake to conflict review and approved engagement, survives duplicate delivery/restart, and has verifiable authorized communications without unauthorized external effects.

### P1 - Documents, legal knowledge and attorney-reviewed outputs

Relevant: document UI/routes, `agents/`, `scripts/export-ontology.mjs`, `lib/law-collector.mjs`.

- Add secure OCR/parsing, document versions, source spans, metadata review, medical chronology reconciliation, record requests, liens and bills as scoped by the pilot.
- Implement approved DOCX/PDF templates, citation/proposition review, privilege/redaction tests and source-linked matter facts. File metadata is not an extraction pipeline.
- Keep client-reported facts, verified evidence, legal propositions and attorney conclusions separate. Introduce certified ontology/rules only after choosing sources, provenance and accountable reviewers.
- Implement legal-change review with jurisdiction/effective dates and proposed matter impacts. Do not derive or change court deadlines from an unchecked feed or model response.

Acceptance: every substantive drafted proposition links to reviewed source evidence or is marked unverified; changing source/document versions invalidates dependent review; redacted content cannot be recovered; responsible attorneys accept the templates and rule behavior.

### P1 - Maya live voice and telephone readiness

Relevant: `dist/maya-voice.mjs`, `dist/maya-vad.mjs`, `voice/`, `telephony/`.

- Run real microphone/speaker, mobile and accessibility tests. Measure full-pipeline latency and echo behavior; detector thresholds are not a live-call SLA.
- Obtain native-speaker QA, especially for fixed phonetic Urdu, Arabic and Hindi. Agree telephone-only wording for information currently shown in response cards.
- Evaluate supported streaming speech/transport and dynamic response coverage. Preserve explicit failure for unavailable languages and avoid silent voice/provider substitution.
- Implement/test carrier integration, human transfer, emergency/off-hours/failure handling, disclosure and consent before any phone-number routing change. The AGI adapter currently does not transfer or dial out.

Acceptance: approved representative calls pass interruption, booking, verification, language and human-escalation scenarios on actual devices; failed services route safely; the firm signs off before its number is connected.

### P2 - Finance and full-firm replacement scope

- Expand manual time/expenses into approved billing, invoicing/LEDES, receivables and reconciliation requirements.
- Treat trust accounting, settlement disbursement, bank reconciliation, payroll and tax as separate specialist-validated work. No trust ledger or money movement currently exists.
- Complete website accessibility/content/asset approval and production legal/licence review before public launch; the prototype's public repository is not permission to use every third-party model commercially.
- Retire each legacy subscription only after a measured parallel run, complete migration reconciliation, recovery rehearsal and an explicit firm decision recorded in the inventory.

Acceptance: independent domain owners approve financial behavior and reconciliations; no balances/results are inferred from demonstration records; each system retirement has an owner, evidence and rollback plan.

## Validation and delivery expectations

Run `npm run check` and `npm test` for each change affecting the app. Existing suites cover server persistence/boundaries, account roles/CSRF, imports, review fingerprints, backup/recovery, selected-matter isolation, model error redaction, receptionist confirmation/booking, calendar DST, media provenance and voice-state logic.

These tests do not establish production security, legal accuracy, accessibility conformance, native-language quality, carrier behavior, deployment capacity or arbitrary live-model behavior. Add tests for each completed backlog capability and record actual environment/results. Require a clean-clone acceptance run and a reversible deployment procedure before pilot rollout.

See [build verification](BUILD_VERIFICATION.md) for the synchronization baseline and what intentionally remains machine-local. Development changes should be reviewed through pull requests with scope, migration/rollback notes, evidence and updated setup instructions.

## Decisions/access to obtain from the owner

The incoming developer needs their own approved GitHub access, deployment credentials, chosen inference credentials, optional mail/calendar/carrier access, firm-approved templates and sanitized migration samples. This handoff grants no new account permissions and contains no credentials. Identify the supervising attorney and business owner before implementing production actions.

The next deliverable should be a reproducible, isolated pilot of intake -> review -> preparation -> attorney acknowledgement, with identity, matter access and recovery demonstrated. Broader autonomy and full subscription replacement follow separate acceptance gates.
