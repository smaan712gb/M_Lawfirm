# Controlled private pilot setup

Use fictional or deidentified examples until the firm approves production security, access boundaries and recovery. The private web preview is a browser-only demonstration; the following controls belong to the local Node server.

## Named staff access

Use Node 24.15 or later. In PowerShell, from the project directory:

```powershell
$env:DATA_DIR='.pilot-data'
node scripts/user.mjs add adnan "Adnan Munawar" admin
node scripts/user.mjs add attorney-example "Example Attorney" attorney
node scripts/user.mjs list
$env:AUTH_MODE='accounts'
$env:HOST='127.0.0.1'
node server.mjs
```

Each add command prompts privately for a password of at least 16 characters. No default users or passwords are included. Choose actual approved users for a real pilot. The same `DATA_DIR` must be used when creating accounts and running the server. Disable a user and revoke their sessions with `node scripts/user.mjs disable USERNAME`. There is no self-service password reset or email invitation flow yet.

| Role | Current capabilities |
|---|---|
| Administrator | Workspace management, import, backup, internal review and access-event inspection |
| Attorney | Case work, documents and internal review; cannot manage onboarding/import inventory |
| Staff | Intake and case preparation; cannot approve documents, edit approved client updates or finance records |
| Viewer | Read-only workspace access |

All roles currently see all workspace matters. These are capability restrictions, not confidentiality walls or client accounts. Passwords use salted scrypt hashes. Sessions expire after eight hours or thirty minutes idle, use HttpOnly/SameSite cookies, and require CSRF tokens for changes. Disabled users lose sessions. The local access-event database records mutation paths, account identity and status; it is not a tamper-evident compliance archive.

For network account mode, use working HTTPS behind a trusted reverse proxy, set `PUBLIC_HTTPS=true`, configure `ALLOWED_HOSTS`, and ensure at least one account exists. Setting the flag does not create TLS. MFA, matter-level authorization and independent security review are still required before confidential production use. The meeting launcher deliberately selects a separate demo directory; it does not start this account workspace.

## Reviewed imports and internal document review

The import flow accepts up to 1,000 CSV records per batch and requires an ID and client name. Preview the mapped values, resolve invalid rows, review duplicate IDs, then confirm the import. Existing IDs are skipped. Imports create verification tasks; they do not prove identity, conflict clearance, engagement or deadline accuracy. Server previews expire after fifteen minutes and reject a changed workspace revision.

The four internal review categories cover engagement, demand, filing and closing. Review requests bind the selected document's exact content. A document change requires a fresh request. Only administrators and attorneys can record decisions in account mode. Generic workspace saves cannot forge approval records. Review does not send messages, file documents, accept representation or release money.

## Encrypted backup and recovery

In a running private server, administrators can create and inspect a portable encrypted backup in **Start here · onboarding → Readiness & backup**. Keep its passphrase separately. A backup includes the workspace and every linked uploaded file, checked by digest. Missing linked files cause creation to fail instead of producing a partial backup.

Backups use AES-256-GCM with a scrypt-derived key. Current limits are 32 MB of uploaded file bytes and a 50 MB bundle; this is a prototype mechanism, not large-firm archival storage. Account databases, sessions, environment settings, secrets, model caches and server access-event history are excluded. Plan protected backups and recovery for those separately. Ordinary record exports are unencrypted and do not include uploaded file contents.

To recover on Windows:

```powershell
.\Restore-Backup.ps1 -BackupFile 'C:\Recovery\meeting.mlawbackup' -NewDirectory 'C:\Recovery\mlaw-recovered'
```

The destination must not already exist. The script prompts securely for the passphrase, authenticates the bundle and verifies file hashes. It never overwrites a current workspace. Stop any server that would use the recovered directory before selecting it through `DATA_DIR`; recreate named accounts there and run an isolated acceptance check. A recovery artifact is not automatically substituted into a running server.

The CLI `node scripts/backup.mjs` supports `create FILE`, `inspect FILE`, and `restore FILE NEW_DIRECTORY`. Supply the passphrase through stdin from a secure secret prompt or approved secret manager, never as a command-line argument, source file or committed environment file. `Restore-Backup.ps1` handles that for Windows restoration.

## Evidence required before switching operations

Validate source-to-destination record/file counts, sampled fields, staff permission boundaries, restoration, retention, client verification and telephone escalation with the firm. Certify legal templates and deadlines with responsible attorneys. Keep existing systems running during a supervised parallel trial. Record each retirement decision in the software inventory; the prototype does not cancel subscriptions or certify that a replacement is complete.
