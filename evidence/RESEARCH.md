# Research and verification record

Checked November 12, 2026. Public facts and official repositories were consulted; no confidential firm information was used.

## Primary sources

- [M Law Firm](https://mlawfirm.com/): practice categories, office addresses, telephone, public firm description and advertised fee positioning.
- [Clio feature catalog](https://www.clio.com/features/): workflow coverage benchmark for case records, communication, finance, tasks, intake and client portal. Studied public descriptions; no private Clio application was inspected or cloned.
- [Atomic CRM](https://github.com/marmelab/atomic-crm): open-source contact, deal, task and note relationships. Clone commit `259c179a2b2d2bd4d0f6121565770b7fbe99c6c6`.
- [REA](https://github.com/morluto/rea): project-local package `rea-agents@6.8.0`. Used Node `24.22.1` to satisfy its declared runtime requirement.
- [Hermes](https://github.com/NousResearch/hermes-agent), [OpenJarvis](https://github.com/open-jarvis/OpenJarvis), [Pipecat](https://github.com/pipecat-ai/pipecat), [faster-whisper](https://github.com/SYSTRAN/faster-whisper): upstream component roles, not proof of installed integrations.
- [NVIDIA auto-ontology](https://github.com/NVIDIA/auto-ontology): structured semantic model, certification and API/MCP integration direction.
- [DeepSeek model documentation](https://api-docs.deepseek.com/quick_start/pricing/): configured `deepseek-flash` API alias. No model calls were made with a live key.
- [Hostinger Docker VPS guide](https://www.hostinger.com/support/8306612-how-to-use-the-docker-vps-template-at-hostinger/): deployment target. No Hostinger server was provisioned.

## REA execution

Static analysis was run against two selected Atomic CRM source files: `src/components/atomic-crm/types.ts` and `src/components/atomic-crm/providers/commons/mergeContacts.ts`. The first sandbox attempt could not start its Windows worker; the retry with the required access completed. Complete evidence is retained locally under ignored `evidence/raw/atomic-crm-verified.json`; it is intentionally excluded from publication because of size and local machine paths.

Parent evidence ID: `ev_a807f08859a6eb2799748e9e69856e8020917239641ad298a24d25ce13a26c89`.
Summary evidence ID: `ev_6b3b384422f1fc97e33dc9e7df8b65ebe538d2794a785aa681fe239f45b1a593`.

The selected source model demonstrates separate contacts, companies, deals, notes and assigned users, linked by identifiers. The selected merge helper addresses contact-related references. These informed the prototype’s linked records and the target normalized model. The prototype is independently authored, not an Atomic CRM fork or a clone of proprietary legal software. Contact merging itself is not implemented here.

Limit: this bounded static inspection does not prove whole-application runtime behavior. Most files were outside the selected parsing scope. REA was not used to inspect authenticated commercial software or bypass access controls.

## Verification performed

- JavaScript syntax checks for frontend, Node server and MCP server.
- Node integration tests: persistent workspace updates, revision conflicts, invalid finance data, cross-origin writes, invalid file IDs, file round trip, disabled models, unconfigured feeds, security headers, static page and MP4 byte ranges.
- MCP protocol initialization, tool listing and linked matter inspection.
- Browser: landing rendered with motion media and sculpture; fictional intake saved to pipeline; workflow generated a linked draft, task and review entry; draft opened correctly. Browser console showed no errors during these checks.

Not verified: live model behavior, live NVIDIA service, phone/speech recognition, email/SMS/calendar delivery, legal feed content accuracy, Docker image build, Hostinger deployment, production security, filing acceptance or trust accounting. The screen layout was inspected at the available desktop viewport; mobile CSS is supplied but not device-tested.
