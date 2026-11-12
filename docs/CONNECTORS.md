# Connectors, plugins and MCP

Nothing in this registry implies an account was connected. Secrets belong in server environment variables or a proper secret manager, never in frontend files or Git. Production connectors need per-user authorization, least privilege, token rotation, idempotency and audit.

## Implemented interfaces

| Interface | Status | Configuration |
|---|---|---|
| Local workspace HTTP API | Implemented and tested | `npm start` |
| Read-only stdio MCP | Implemented and tested | `node mcp-server.mjs`; optional `DATA_DIR` |
| OpenAI-compatible model gateway | Implemented; live selected-matter drafting verified November 12, 2026 | `MODEL_BASE_URL`, `MODEL_NAME`, `MODEL_API_KEY`; local flag for Ollama |
| NVIDIA chat proxy | Implemented; not validated against a running service | `AUTO_ONTOLOGY_URL`, `AUTO_ONTOLOGY_TOKEN` |
| Official feed snapshots | Implemented; default has no active feeds | `LAW_FEED_URLS`, `LAW_POLL_MINUTES` |
| File upload and export | Implemented and tested | Local server / browser limits differ |

Example MCP client configuration (replace absolute path for the target machine):

```json
{
  "mcpServers": {
    "mlaw-demo": {
      "command": "node",
      "args": ["C:/path/to/M_Lawfirm/mcp-server.mjs"],
      "env": {"DATA_DIR": "C:/path/to/private-demo-data"}
    }
  }
}
```

Available tools: `search_matters`, `get_matter`, `list_open_tasks`, `list_research_sources`, `get_firm_brief`. No write/send/file/payment tools exist. Local process access is the trust boundary. Do not expose this stdio process through an unauthenticated network bridge.

## Required integrations by function

| Function | Candidate open-source component / interface | Remaining work |
|---|---|---|
| Agent orchestration | NousResearch/hermes-agent | Live two-call drafting verified with a selected-matter-only MCP tool and retrieval receipt; scheduling and write tools remain separate |
| Durable jobs | temporalio/temporal | Activities, retries, idempotency, cancellation and operational monitoring |
| Local assistant | open-jarvis/OpenJarvis | Evaluate hardware and provider setup; do not equate it with telephony |
| Voice / multilingual reception | QwenLM/Qwen3-TTS, resemble-ai/chatterbox (archived), SYSTRAN/faster-whisper; streaming transport still to choose | Fixed generated responses work locally; real-time streaming, native-speaker QA, escalation and telephone latency remain separate |
| SIP / phones | asterisk/asterisk | Carrier account, numbers, routing, emergency handling and transfer tests |
| Ontology | NVIDIA/auto-ontology | Structured source DB, compilation, certification, user-scoped API/MCP |
| Mail/calendar | Microsoft Graph or Google Workspace APIs | OAuth app registration, scopes, event sync, mailbox mapping and delivery receipts |
| SMS / WhatsApp | Carrier API / WhatsApp Business API | External account and messaging charges; opt-in and delivery policy |
| Files / OCR | paperless-ngx/paperless-ngx | Controlled ingestion, OCR languages, malware scan, matter mapping, versioning |
| Document assembly | jhpyle/docassemble | Approved interviews/templates, source citations, DOCX/PDF validation |
| E-signatures | docusealco/docuseal | License/edition review, identity and signing evidence; never auto-sign for attorneys |
| Back office | frappe/erpnext | Accounting, procurement, leave and HR; legal trust ledger separately validated |
| Identity | keycloak/keycloak | OIDC, MFA, roles, matter authorization and secure client access |
| Legal research | CourtListener API + official court and legislative sources | Coverage, currentness, licensed sources where required, citation verification |
| Court filing | Court-specific approved channels | No universal free API assumed; authorized filing specialist and receipt verification |
| Browsing | Bounded server-side fetch/search adapter or curated source retrieval | Not implemented as an unrestricted browser agent; block internal network targets and treat results as untrusted |
| Development analysis | morluto/rea | Installed project-locally for research; no global agent configuration changed |

Hermes configuration should point to this read-only MCP server first. Add future write tools individually, with explicit policy and separate send approval. NVIDIA’s MCP server is a separate upstream component, authenticated against its deployment; it was not installed into the user’s global MCP configuration.

Do not add numerous MCP servers merely because they exist. Each server increases access and maintenance scope. Install and connect only the selected providers needed by the firm, with their actual credentials and confirmed permission scopes.
