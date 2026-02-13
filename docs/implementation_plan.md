# Implementation Plan (Minibank)

This plan is based on the selected modules in docs/modules.md and the current codebase state.
It focuses on a mock bank app that allows users to transfer cash to other users.

## Current Implementation Snapshot (from repo)
- Docker Compose with services: vault, postgres, auth_service, user_service, transition_service, blockchain_service, nginx.
- Nginx reverse proxy with SSL, WAF (ModSecurity + OWASP CRS), rate limiting, security headers.
- Vault AppRole clients in auth/user services; transition/blockchain use node-vault with placeholder init.
- Auth service: register/login, change email/password, JWT, bcrypt, DB schema for user_auth.
- User service: profile CRUD (name/profile_picture), balance read, wallet creation placeholder, DB schema for user_profiles.
- Transition service: stub endpoints only (no DB, no logic).
- Blockchain service: stub only.
- Frontend: login/register/dashboard; transfer form and transaction list wired to /api/transition/transactions.

## Dependencies Overview
- Vault + Postgres must be ready before auth/user/transition/blockchain services start.
- Auth service depends on user service for profile creation.
- Transition service depends on auth (JWT validation) and user service (recipient lookup, balances).
- Blockchain service depends on transaction records and (later) smart contract deployment.
- Nginx depends on all services for routing and TLS.
- OAuth and 2FA depend on auth service and user model changes.
- GDPR features depend on complete data model and email service.
- ELK and Prometheus/Grafana depend on service logs/metrics endpoints.

## Phase 0 - Align Requirements and Data Model (Decision Gate)
- Confirm how the Blockchain module will be interpreted for a bank app.
  - Option A: Store transfer batch hashes as "scores" on-chain.
  - Option B: Add a minimal "tournament" concept to satisfy the exact module wording.
- Finalize data model for transactions, friends/online status, 2FA, OAuth identities, GDPR requests.
- Agree on the exact API endpoints (note: frontend uses /api/transition/transactions, nginx maps /api/tx/).

## Phase 1 - Core Backend Foundation (Must be first)
1. Database schema upgrades (Postgres)
   - Add transactions table (sender_id, recipient_id, amount, status, created_at).
   - Add balances or ledger strategy (stored balance or computed from transactions).
   - Add user profile fields: avatar_url (default), status/online flag, friends mapping table.
   - Add 2FA tables (totp_secret, recovery_codes, enabled flag).
   - Add OAuth identity table (provider, provider_user_id, user_id).
   - Add GDPR requests table (type, status, created_at, completed_at).
2. Vault secrets and config standardization
   - Ensure each service has a consistent KV path for its secrets.
   - Add OAuth client IDs/secrets, JWT settings, mailer credentials, blockchain keys.
3. Auth service hardening
   - Input validation, rate limiting already at Nginx; add server-side validation.
   - Token structure: include user id and name; align with user service.

## Phase 2 - Core User Flows (Auth + Profile + Transfer)
1. User service enhancements
   - Profile update for avatar URL and name.
   - Default avatar handling.
   - Friends endpoints (add/remove/list).
   - Online status tracking (simple last_seen + websocket later if needed).
2. Transition service implementation
   - JWT auth middleware (reuse from auth service or shared lib).
   - Create transfer: validate amount, check sender balance, lock row, write transaction.
   - List transactions for current user.
3. Frontend wiring
   - Align API base paths with Nginx routes.
   - Implement profile view, avatar update, friends list.

## Phase 3 - Security Modules (OAuth + 2FA)
1. OAuth 2.0
   - Add provider config in Vault.
   - Implement OAuth login and account linking.
   - UI for "Login with Google/GitHub/42".
2. 2FA (TOTP)
   - Generate and store secret (encrypted at rest).
   - QR code provisioning + recovery codes.
   - Enforce 2FA on login (step-up).

## Phase 4 - Cybersecurity Module (WAF + Vault)
- WAF is already configured with ModSecurity and custom rules.
- Validate hardened rule set and add app-specific rules (e.g., transfer limits).
- Ensure all secrets are moved into Vault and not present in env files.

## Phase 5 - DevOps Modules (ELK + Monitoring + Microservices)
1. Microservices
   - Already structured as auth/user/transition/blockchain.
   - Add versioned APIs and service-to-service auth if needed.
2. Monitoring (Prometheus + Grafana)
   - Add metrics endpoints for each service.
   - Configure Prometheus scrape targets and Grafana dashboards.
3. ELK
   - Add Logstash pipeline and Elasticsearch storage.
   - Route container logs to Logstash.
   - Create Kibana dashboards and retention policy.

## Phase 6 - Data and Analytics (GDPR)
- Add endpoints for data export, deletion requests, and confirmation email.
- Implement asynchronous processing with audit logging.

## Phase 7 - Blockchain Module
- Smart contract in Solidity on Avalanche testnet.
- Decide what gets stored (transfer batch hash or minimal "tournament scores").
- Implement blockchain service to write/read on-chain data.
- Add admin-only reconciliation endpoint.

## Parallel Workstreams
- Frontend UI can progress in parallel once API contracts are defined (Phase 1).
- ELK/Monitoring can start after services expose logs/metrics (Phase 5), but dashboards can be built earlier using mock data.
- OAuth and 2FA can proceed in parallel after Phase 1 schema changes.

## Open Decisions
- Confirm the blockchain module interpretation for a bank app.
- Choose OAuth providers (Google, GitHub, 42) and email provider for GDPR confirmations.
- Decide on balance calculation strategy (stored balance vs computed ledger).
