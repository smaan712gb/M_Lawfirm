# Meeting edition verification — November 12, 2026

All test records, account names and file contents used here are fictional. No real firm records were imported or transmitted.

- `npm run check`: syntax validation across 20 application/server/CLI scripts plus a regression check rejecting vendor and infrastructure names in firm-facing files.
- `npm test`: nine tests, covering the original workspace and reception flows plus CSV edge cases, role restrictions, session/CSRF controls, import confirmation/idempotency/staleness, document version binding, internal review authorization, encrypted recovery, tamper rejection and audit identity.
- Account mode rejects demonstration resets and direct approval injection through generic workspace saves.
- `Start-Meeting.ps1 -Port 3344 -NoBrowser -Check`: started the isolated meeting workspace and installed local voice service, verified readiness, and stopped its own child processes.
- Browser review at desktop and 390-pixel mobile width: onboarding, sample mapping/import, internal document acknowledgement, case-preparation labels and navigation. The sample import produced two records and verification tasks. An internal decision remained explicitly separate from external delivery.
- Saved visual evidence: `meeting-onboarding.jpg` and `meeting-case-preparation.jpg`.

The public-facing product screens use firm feature names and plain capability states. Developer setup documents retain dependency names where maintainers need them.

This checks the demonstration and controlled-pilot components. It is not a penetration test, court-template certification, live telephone test, production load test, or permission to migrate confidential firm operations. See `docs/TODAY_MEETING.md` and `docs/PILOT_SETUP.md` for remaining work.
