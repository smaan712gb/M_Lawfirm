# Hostinger VPS review deployment

Hostinger’s Docker VPS template supports Docker Compose. These files target that environment; ordinary shared hosting is insufficient for the persistent Node app and future agent services. Provisioning was not performed.

1. Obtain an appropriately sized Ubuntu VPS and point a dedicated review subdomain at it. Prefer a separate isolated environment from the firm’s live website.
2. Clone this repository into the server. Copy `.env.example` to `.env`.
3. Set `MLAW_DOMAIN=review.example.com`, `ALLOWED_HOSTS=review.example.com,localhost,127.0.0.1`, and a unique `WORKSPACE_PASSWORD` of at least 24 characters. Username is `mlaw`. Keep `.env` private.
4. Optionally configure a model endpoint. Leave remote keys and feeds unset for a self-contained demo.
5. Run `docker compose config --quiet`, then `docker compose up -d --build`.
6. Visit the configured HTTPS domain and sign in. Verify intake persistence, uploads, exports and restart recovery using fictional data.
7. Back up both the SQLite database and uploaded files from `mlaw-data`. Stop writes during consistent backups, or use SQLite’s backup mechanism plus a file inventory. Test restoration in another isolated environment.

No live data should enter this prototype. Before production: separate public/private services, implement per-user SSO/MFA, normalized access-controlled storage, immutable audit, encrypted secrets and backups, malware scanning, monitoring, retention, session control, external-delivery approvals and independent security review. The shared password is not a production identity system.

The Docker image and Compose file are supplied but were not built or deployed to Hostinger in this session. Validate current image availability and pin image digests as part of deployment. Caddy requires inbound ports 80/443 for automatic HTTPS; the app port is private to the Docker network.

For NVIDIA auto-ontology, deploy its official stack separately on an internal network. Follow its upstream setup, not an invented Compose service. Connect only a purpose-built read-only data source, certify the terms and verify permission boundaries before enabling the API adapter.
