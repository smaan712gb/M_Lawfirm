# Mid-size plaintiff firm: complete software coverage plan

The connected prototype is the first slice of a larger operating system. “Replace subscriptions” means owning workflows and data, not claiming a small demo already replaces every specialized service.

| Area | Typical software pattern studied | All-in-one target | Present state |
|---|---|---|---|
| Marketing / website | Modern law-firm marketing and intake | Site, practice pages, consent-aware forms, attribution | Landing and connected intake work |
| CRM / referrals | Atomic CRM contact/deal/task model | Leads, conflict checks, referrals, duplicate review | Pipeline and linked people work; conflicts are tasks |
| Case management | Clio / Litify workflow categories | Matters, parties, incidents, coverage, stages, assignments | Core matter records work |
| Treatment / records | Injury-specific record management | Requests, authorizations, chronology, gaps, bills, liens | Templates and file metadata only |
| Discovery / litigation | Task and document workflows | Evidence, requests, depositions, productions, privilege review | Task and draft scaffolding only |
| Research / knowledge | Source-linked legal research | Official-source monitor, citations, matter graph, certified terms | Graph and snapshot collector; no verified legal analysis |
| Drafting / court prep | Document assembly | Validated pleading templates, citation checks, exhibits, service packet | Editable review outlines and print/PDF |
| Filing | Court-approved filing systems | Court-specific submission with attorney approval and receipt | Not implemented |
| Client service | Portal, call center, scheduling | Multilingual intake, authenticated updates, human escalation | Scripted/model-configurable chat and portal preview |
| Communication | Mail, calendar, SMS, phone | Matter-threaded delivery, appointments and reminders | Draft-only messages; manual dates and ICS |
| Documents | DMS / OCR / e-sign | Versioned files, OCR, search, permissions, signatures | Local upload/download and draft library |
| Finance | Accounting and case costs | Expenses, time, billing, settlement statements, trust reconciliation | Expenses/time only; no ledger or money movement |
| People / operations | HR, leave, procurement, vendor management | Role assignments, vendor contracts, onboarding/offboarding | Not implemented; ERPNext candidate |
| Reporting | Firm analytics and conversion | Intake conversion, workload, aging, source completeness, outcomes | Live counts from demo records |
| IT / continuity | Identity, backup, security monitoring | MFA, permissions, retention, audit, restore, incident response | Basic prototype controls only |

## End-to-end workflow design

Lead → consent and language preference → urgent-needs escalation → conflict review → attorney suitability decision → signed engagement → matter setup → evidence preservation → incident/coverage investigation → authorized records collection → source-linked treatment chronology → damages and lien review → demand/negotiation → litigation/discovery → attorney-approved filing/service → settlement authority and lien resolution → validated trust disbursement → closure and retention.

At every stage: record owner, source, next action, due-date provenance, client-visible status, approvals, execution receipt and exceptions. AI can collect, classify, summarize, translate and prepare. Lawyers retain representation, legal strategy, factual certification, settlement authorization and filing approval.

## Delivery stages

1. **Review prototype:** approve the experience and actual workflows using fictional data. Deliverable in this repository.
2. **Controlled internal pilot:** identity, normalized PostgreSQL, access rules, file security, backups, one mail/calendar provider and validated templates. Use a narrow matter set with supervised adoption.
3. **Reception pilot:** tested language pairs, voice/carrier integration, identity checks, escalation and recorded failure handling. Measure transfer quality before considering staffing changes.
4. **Knowledge pilot:** NVIDIA source database and certification; OCR/extraction provenance; primary-source legal research and controlled update proposals.
5. **Finance and court integrations:** specialist validation of trust accounting, filings, signatures and receipts. Retain external services where mandatory or economically sensible.

No cost savings or staff replacement is guaranteed. Evaluate recurring infrastructure and maintenance costs against current software spend and operational risk.
