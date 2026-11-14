# Build synchronization and verification

Prepared November 14, 2026 for the developer handoff.

## Source baseline

- Repository: `smaan712gb/M_Lawfirm`, existing public repository, default branch `main`.
- GitHub baseline before synchronization: `af29b0dd3bd6f728433d19057aefe3ca8daba6b7`.
- Latest local application build: `5b2dc8739b4bc71624553ee51dbd6fb4036aad70`.
- Two application commits were missing from GitHub: `58c1e36` and `5b2dc87`. The remote baseline is their ancestor, so synchronization preserves existing history through a fast-forward.
- Application snapshot: **340 tracked files, 75,397,696 bytes**, before these handoff documents. The update changes 291 paths relative to the old GitHub baseline, including new Maya speech/video assets, agent context, drafting setup and tests.

The incoming developer should use `main` including this handoff, not the old exported website archives. The GitHub tracking issue records the completed synchronization and current remaining work.

## Checks performed

| Check | Result |
|---|---|
| Runtime | Node v24.15.0 on Windows |
| `node scripts/check.mjs` (`npm run check`) | Passed; 36 JavaScript scripts checked and firm-facing branding check passed |
| `node --test tests/*.test.mjs` (`npm test`) | 28 passed, 0 failed, 0 skipped |
| Clean tracked-source export, without local environments or data | Repeated syntax/branding check passed; all 28 tests passed with Node v24.15.0 |
| New application commit text scan | 272 text-blob examinations across two commits; no matches for the selected private-key, provider-key, GitHub-token, AWS-key or credential-URL patterns |
| Tracked sensitive-path check | No `.env`, local secrets, workspace data directories or SQLite databases in the tracked set |
| Eight `mlaw-*.tar.gz` package inventories | All application file paths already represented in the current tracked tree; only archive-only path was `dist/.openai/hosting.json`, Sites packaging metadata |

The pattern scan is a limited pre-publication check, not a security audit. Archive comparison covers file-path inventory, not a claim that every historical media byte equals the current media revision. Existing Git history retains committed revisions; the current build is the source of truth.

## Included in GitHub

Application source and `dist/`, all shipped static media, synthetic voice references, model-download/rendering scripts, tests, server and MCP code, setup/backup launchers, deployment definitions, documentation, fictional demonstration evidence and the meeting guide.

## Intentionally machine-local

- API credentials, encrypted Windows-user credential files, `.env`, accounts, sessions, SQLite data and uploaded workspace files.
- Installed Python environments, third-party research checkouts, model weights/caches, generated intermediate files and logs.
- Redundant `.tar.gz` website packages and generated ontology staging exports, which can be produced from source.
- Unrelated Nebraska proposal/funding documents elsewhere in the parent workspace.

A checkout can serve the complete shipped web/Node demonstration and play the bundled voice/video without model downloads. Live transcription, optional agent inference and media regeneration require separately installed runtimes/models and approved credentials where applicable. See [developer handoff](DEVELOPER_HANDOFF.md).

No Docker image build, live provider request, cloud deployment, carrier call, real-client-data migration or production acceptance was performed during this synchronization. Historical evidence is labelled separately in the repository.
