# Blueprint reconciliation

The November 12 design supplied by the user expands the target system. Its “design only” status describes the proposal; it does not erase implemented and tested features. This document separates the target from current capabilities. Product screens show M Law features; technology choices belong here, not in the firm's everyday interface.

| Proposed addition | Decision | Current implementation / remaining work |
|---|---|---|
| One general agent with skills | Adopt capability-based tools and bounded skills | Real Hermes MCP discovery and callback execution are tested; autonomous inference and durable workforce scheduling are not running |
| Four attorney gates | Adopt four major review categories, plus exception escalation | Version-bound internal review queue and named reviewer implemented; no retainer, demand, filing, settlement or disbursement execution |
| Certified law ontology | Separate law from firm operations | Add versioned authority, jurisdiction, effective date, source text and attorney certification; not supplied as verified law today |
| Firm operations ontology | Preserve explicit relationships and shared definitions | Matters, tasks, files, costs, calendar, import batches and approvals exist; normalized relational storage and semantic compilation remain target work |
| Matter bridge | Adopt facts-to-elements mappings | Must link fact/evidence versions to legal elements, with reported/corroborated/missing states; no inferred causation or value presented as fact |
| Source-linked verifier | Require provenance before external work | Document fingerprints prevent stale internal review. Citation checking, OCR span provenance and a blocking filing verifier remain unimplemented |
| Identity and privilege walls | Adopt matter-level permissions and stronger identity | Named accounts, role checks, session expiry, CSRF checks and server-recorded events added. MFA and matter-level walls remain required |
| Durable workflows and duty manager | Keep separate from agent reasoning | Built-in deterministic preparation runs now; Temporal execution, retries, dead-letter queues, service monitoring and exception assignment remain target work |
| Records, liens and bills | Expand the injury-specific workflow | Document/file metadata and outlines exist; extraction, chronology reconciliation, authorizations and lien balances require implementation and validation |
| Trust and settlement accounting | Keep deterministic, separately validated | No trust ledger or money movement exists. Three-way bank reconciliation and specialist acceptance are prerequisites |
| Partner dashboard | Use drill-down, source-linked measures | Current counts come from workspace records. Do not invent expected case values, hours saved or trust balances. Geographic and financial visualization awaits actual data and metric definitions |
| Daily managing-partner briefing | Implement a shared, record-based priority queue | The Daily firm brief combines upcoming/overdue tasks, callbacks, explicit review requests and inactive matters. Cross-checks flag unassigned matters, missing intake follow-ups, dangling task links and overlapping reservations. On-demand refresh works; scheduled delivery and model-led workforce coordination are not active |
| Subscription retirement | Track with evidence, not promises | Inventory, cost and ownership capture added. Actual cancellation requires firm approval after a successful parallel run |
| Hosting and observability | Single-tenant, portable first | Private local/Compose packaging exists; Kubernetes, telemetry, model costs and production infrastructure are deferred until capacity and operational ownership justify them |
| External channels | Keep necessary external services | Telephone carrier, mail delivery, banks, court systems and provider portals remain external. Existing-number forwarding is deferred per the user |

## Knowledge contracts

Law assertion: stable concept ID; source authority URL/identifier; quoted source span; jurisdiction; effective-from/to; source retrieval/version/hash; applicability conditions; certified-by/at; superseded-by; status. A taxonomy label is not certified law or a deadline rule.

Operational assertion: matter ID; entity/relationship; source record/file version; reported-by; extraction method/version when used; reviewer; confidence where meaningful; certification status; privilege/access scope. Client-reported facts remain separate from verified evidence and attorney conclusions.

Matter bridge: claim/defence element; linked fact IDs and evidence spans; missing evidence; disputed facts; supporting and adverse authority; next action; accountable attorney. No unreviewed model output silently rewrites a rule or accepted fact.

## Sources examined

- [SALI's official LMSS repository](https://github.com/sali-legal/LMSS) and [standard overview](https://sali.org/explore-the-standard/): stable identifiers and legal-work taxonomy. Verify the chosen release and applicable licence before importing or redistributing it.
- [ALEA Institute's FOLIO mapper](https://github.com/alea-institute/folio-mapper) and [FOLIO API](https://github.com/alea-institute/folio-api): legal taxonomy mapping candidates. These are distinct from a court-authority verification system. No ontology package has been imported in this release.
- [New York Courts Part 161](https://www.nycourts.gov/rules/part-161-use-artificial-intelligence-technology?topic=386&wrapped=true) and the [court's attorney AI guidance announcement](https://webfiles.nycourts.gov/public/2026-10/pr26_18.pdf): authoritative starting points for the supervising attorney's review of AI-assisted court work. The implementation does not certify compliance or filing readiness.

## Inference and operations policy

Prefer firm-controlled inference for privileged or medical material. External inference remains opt-in configuration, not a silent fallback. Keep legal rules, conflicts, financial reconciliation and trust posting in deterministic, tested systems with human exception handling. Generated skills cannot change these permissions or approve their own external effects.

The user's four gates are major milestones, not a limit on professional supervision. Conflicts, uncertain identity, incomplete sources, changed law, failed delivery, stale approvals and reconciliation errors also require explicit handling. “Thirty days in parallel” is a proposed adoption criterion, not proof of reliability by itself; use representative cases, failures, recovery drills and reconciliation evidence.

## Additional workflow notes reviewed November 12

The later “multi-bot / law firm OS” notes supplied ten workflow categories. They are design input, not proof that the named packages are integrated or that their marketing claims have been independently verified. Keep one firm data model and accountable workflow owner; adding more agents does not itself validate a legal proposition.

| Suggested capability | Decision for M Law |
|---|---|
| Managing-partner coordinator and peer checks | Added the actual Daily firm brief and deterministic cross-checks. Existing linked preparation workflows and version-bound attorney review remain the execution boundary. Model coordination and recurring delivery still need configuration and durable execution. |
| Omnichannel reception with interruption handling | Keep current working reception and forwarded-number-later decision. [LiveKit's current turn-handling API](https://docs.livekit.io/reference/agents/turn-handling-options/) is a candidate for streaming voice; latency depends on the full deployed pipeline. Do not promise a fixed sub-500 ms response time or assume cloud observability features are included in a self-hosted server. |
| Conflicts before consultations and retainers | Every new reservation now creates an internal conflict-review task and displays that it needs review. Entity matching across aliases, adverse parties, closed matters and decline logs remains separate work; no reservation is automatically declared conflict-free. |
| Legal document review, citations and drafting | [Mike's official repository](https://github.com/open-legal-products/mike) documents local-model support, document workflows and CourtListener integration. It is an AGPL-3.0 evaluation candidate, not a connected module in this prototype. Its production images default to scrubbed error reporting; use its documented opt-out or a firm-controlled destination when evaluating. |
| Local PDF production, OCR, Bates and redaction | [RaioPDF](https://github.com/Macrify-LLC/raiopdf) documents these functions and an optional local MCP bridge. Its own README identifies a public alpha under GPL-3.0 with additional third-party licences. Evaluate against representative, deidentified files and verify removed text cannot be recovered before replacing the firm's production PDF tool. |
| Billing and trust-accounting reference implementation | [LexNebulis](https://github.com/mcatsim/LexNebulis) documents billing, trust-accounting and audit features under Apache-2.0. Study its data and reconciliation patterns; it has not been installed, audited or accepted as M Law's trust ledger. An application feature list does not establish jurisdiction-specific accounting compliance. |
| Retainer assembly and e-signatures | Keep document assembly and signature transport as separate adapters. Approved templates, signing evidence, identity and recipient control must be implemented before sending packets. |
| Research and court rules | Verifying that a cited case exists is one check; support for the asserted proposition, jurisdiction, treatment and current rules need separate source review. No claim of “perfect” or automatically filing-ready documents is introduced. |
| Contracts and discovery | Clause extraction, playbooks, production sets and privilege logs remain concrete integration projects; linked file metadata alone is not discovery review or verified redaction. |
| Time capture and billing | Existing manual time/expense records remain available. Passive capture, LEDES output, invoicing, accounts-receivable aging and three-way trust reconciliation are not yet implemented. |

Product screens retain M Law language. Dependency and model names belong in these engineering notes. The notes do not authorize sending real client communications, changing phone routing or retiring subscriptions before the firm's pilot acceptance.
