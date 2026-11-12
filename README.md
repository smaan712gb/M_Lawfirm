# M Law / Next Chapter

A working, private-review prototype for Munawar Law Group: a cinematic landing page and one connected firm workspace. Built November 12, 2026. **Fictional records only. This is not a production legal system.**

## Run locally

Requires Node.js 24.15 or later. The application has no third-party runtime JavaScript dependencies.

```sh
npm start
```

Open http://127.0.0.1:3333. Choose **Explore the firm OS**. Local data persists in `.data/workspace.sqlite`; uploaded files persist in `.data/files`. Both are ignored by Git. Keep the server running while using this URL. `Ctrl+C` stops it.

```sh
npm run check
npm test
npm run mcp
npm run ontology:export
```

The private Sites preview serves `dist/` and uses browser-local storage. It has no shared server database, secrets or live external integrations. Browser records do not sync with the local Node server. The hosted preview is a design/demo environment, not the future firm hosting commitment.

## Try a connected workflow

1. Submit a fictional intake from the landing page. It creates a matter and conflict-check task.
2. In **Matters & intake**, search the pipeline, open the matter and edit stage, owner, provider and insurer.
3. Open **Attorney copilot**. Ask about the selected matter. Without a configured model, it produces an explicitly labeled structured inspection; with a model it requests a source-constrained review response.
4. Create an editable draft in **Documents & files**, upload a sample source file, save changes and download text or print to PDF.
5. Prepare a workflow in **Agents & workflows**. It creates linked work product, an attorney task and a review-queue entry.
6. View relationships in **Matter intelligence**. Record an expense or time entry; export tasks as ICS and expenses as CSV.
7. Try the six-language concierge. Without a configured model it uses scripted responses. Device text-to-speech is optional and device-dependent.

## What works and what remains

| Capability | Implemented here | Production work still needed |
|---|---|---|
| Website | Responsive editorial layout, local motion video, perspective sculpture, motion control | Firm approval, final media and accessibility audit |
| Intake / CRM | Persistent matters, stage changes, search, task creation | Conflict database, duplicate resolution, engagement workflow |
| Contacts | Matter-linked clients, providers and insurers | Normalized global contact directory, shared contacts, merge workflow |
| Tasks / calendar | Manual dates, owners, completion, ICS export | Mail/calendar OAuth, rules engine, court verification |
| Drafting | Six templates, copilot adapter, edits, text download, print/PDF | Validated court templates, DOCX assembly, citation checking, signatures |
| Files | Local upload/download, matter metadata | OCR, versioning, malware scan, encryption, granular permissions |
| Communications | Draft queue, fictional portal preview, intake concierge | Actual secure portal, delivery adapters, consent and identity checks |
| Finance | Case expenses, time records, CSV export | Double-entry books, trust accounting, reconciliation, payroll, tax and payments |
| Intelligence | Explicit graph from entered records, relational staging export | NVIDIA deployment, ingestion, semantic compilation and certification |
| Workflows | Deterministic preparation with linked review tasks | Hermes runtime, durable execution, retry and exception handling |
| Legal updates | Allowlisted feed-snapshot collector, hash-based changes, configurable interval | Official feed selection, article parsing, relevance and legal-change review |
| MCP | Four read-only tools over local records | Per-user identity, scopes, audit and production tool authorization |
| Voice | Device read-aloud demo | Pipecat/Whisper/Piper, SIP, interruptions, language QA and human escalation |

No action sends messages, signs documents, accepts representation, files with a court, moves money or changes legal deadlines. No claim is made that drafted documents are accurate or ready for filing.

## Model setup

Copy `.env.example` to `.env`. For optional DeepSeek:

```dotenv
MODEL_BASE_URL=https://api.deepseek.com
MODEL_NAME=deepseek-flash
MODEL_API_KEY=your_private_key
```

The documented API alias `deepseek-flash` currently serves DeepSeek V4.1 Flash. Verify it before deployment. Keys stay on the server. Model API use is metered; no key or paid account was provisioned. No silent provider fallback is used. The concierge sends the conversation only; the attorney copilot sends the selected matter plus linked draft text and file metadata. Enable remote inference only after the firm approves its data handling.

For local inference, install a suitable model in Ollama, set `MODEL_BASE_URL=http://127.0.0.1:11434/v1`, set its installed model name, and set `MODEL_LOCAL=true`. Local model hardware and language quality must be assessed.

## Hostinger VPS

See [deployment guide](docs/DEPLOYMENT.md). Docker Compose and Caddy configuration are provided. No Hostinger account or server was accessed or purchased. The application refuses non-loopback exposure without a workspace password. This shared-password deployment is suitable only for restricted prototype review; production needs SSO, MFA and matter-level authorization.

## Stack and evidence

The prototype deliberately keeps the UI and server small and portable. The production design favors supported open-source systems where they add capabilities, rather than adding every framework at once. See [system architecture](docs/ARCHITECTURE.md), [software coverage and workflow plan](docs/OPERATING_MODEL.md), [connector and MCP guide](docs/CONNECTORS.md), and [research and REA evidence](evidence/RESEARCH.md).

Zero per-seat software license subscriptions is a design target. Hosting, hardware, phone numbers/minutes, domains, model usage, maintenance and specialist validation still have costs. Open-source licenses and individual model licenses require review before redistribution or production deployment.

## Sources and assets

Firm facts: [mlawfirm.com](https://mlawfirm.com/). Public contact information and practice categories were checked; no results, testimonials or claims of firm approval were invented. Hero background: [Pexels video file 3130284](https://videos.pexels.com/video-files/3130284/3130284-hd_1920_1080_30fps.mp4), used as abstract motion footage, not footage of the firm. Architecture image: [Unsplash photo](https://images.unsplash.com/photo-1486406146926-c627a92ad1ab). Verify asset licensing and retain attribution records before public commercial launch. Google Fonts are optional; system fallbacks work without them.
