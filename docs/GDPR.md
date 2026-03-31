# GDPR in the project

## Why we implement GDPR flows

We implement GDPR flows to give users control over personal data and provide a clear privacy lifecycle inside the platform.

Main reasons:
- allow users to export their personal data, including blockchain-based financial records
- support verified account deletion requests
- enforce secure confirmation before irreversible deletion
- keep privacy actions consistent across backend and frontend
- respect blockchain immutability constraints in privacy operations

In short, GDPR support is our user-rights layer for data access and deletion, with explicit constraints on immutable data.

## How it works in this project

GDPR logic is orchestrated by the authentication domain and integrates with user profiles and blockchain records. The Privacy Center in the frontend provides user-facing controls.

High-level flow:
1. User opens Privacy Center.
2. User requests data export or account deletion.
3. Backend validates identity and aggregates data across services.
4. For export, data is compiled from account, profile, and blockchain sources with graceful degradation.
5. For deletion, a time-limited confirmation token is sent by email.
6. Confirmed deletion removes the account and related dependent records; blockchain data remains immutable on-chain.

## Implemented backend endpoints

- `GET /gdpr/export`
	- requires authenticated access
	- orchestrator: calls user service for profile + blockchain aggregation
	- returns downloadable user data JSON
	- includes account, profile, and blockchain (balance + transaction history)
	- marks export as partial if blockchain service is unavailable
	- graceful degradation: returns 200 with partial_export flag rather than 500

- `GET /users/me/gdpr-export` (User Service)
	- called by auth service for data aggregation
	- returns profile data plus blockchain export payload
	- handles missing wallet gracefully (wallet_address: null)
	- catches blockchain service unavailability and sets partial_export flag

- `GET /wallets/:address/gdpr-export` (Blockchain Service)
	- internal-only endpoint (requires x-internal-secret header)
	- returns balance snapshot and transaction history (capped at 100 most recent)
	- provides timestamps, amounts, and counterparty information
	- used by user service for GDPR aggregation

- `POST /gdpr/delete-request`
	- requires authenticated access
	- creates a deletion confirmation token with expiration
	- sends a confirmation link to user email
	- clarifies immutability of blockchain data in confirmation email

- `DELETE /gdpr/confirm-delete`
	- receives deletion token
	- validates token and expiration
	- deletes the account and cascades linked profile/request records
	- explains blockchain immutability in confirmation email

## Frontend flow

- Privacy Center route triggers export and deletion request actions
- Export button displays progress indicator ("Fetching your data…") during collection phase
- Deletion confirmation route consumes token and executes final deletion
- Session is cleared after successful deletion confirmation
- User-facing messaging clarifies blockchain immutability constraints

## Data and safety model

- deletion requests are stored with token and expiry
- confirmation is required before destructive action
- relational cascade cleanup removes linked records automatically
- email is used as out-of-band confirmation channel
- blockchain data remains immutable per ledger design; account/profile deletion does not affect on-chain records
- export includes graceful degradation: partial_export flag and notes field document service unavailability

## Current coverage

- user data export including blockchain financial records
- deletion request with expiring confirmation token
- confirmed deletion with linked-record cleanup
- graceful degradation when dependent services unavailable
- explicit documentation of blockchain immutability constraints
- frontend UX clarification for blockchain inclusion and limitations

## Known limitations and design decisions

- blockchain transaction history capped at 100 most recent for performance and payload safety
- balance snapshot is point-in-time (at export time); balance may change before download
- blockchain service unavailability triggers graceful degradation rather than hard failure
- on-chain transaction data cannot be modified or deleted as per blockchain immutability
- transaction history privacy: counterparty addresses are visible in export as required for data portability

## Operational result

In this project, GDPR is implemented as a practical end-to-end flow: authenticated export with cross-service data aggregation, verified deletion request, and confirmed account removal with safe relational cleanup. Service dependencies are handled gracefully to preserve data access even when some services are temporarily unavailable. Blockchain immutability is explicitly documented to user and compliance stakeholders.

## Important files

- `app/services/auth/src/auth.js` — orchestrator for export and deletion flows; email messaging
- `app/services/user/src/user.js` — profile export and blockchain aggregation
- `app/services/blockchain/src/blockchain.js` — blockchain data export with internal auth
- `app/services/user/src/db.js` — user schema and queries
- `app/frontend/js/views/gdpr.js` — Privacy Center UX with blockchain data clarification
- `app/frontend/js/views/gdpr-confirm.js` — deletion confirmation UX
- `app/frontend/js/services/api.js` — GDPR API client
- `scripts/init-db.sh` — database schema and gdpr_delete_requests table

## Navigation
<!-- doc-nav -->
- [README](../README.md)
- [Next - MICROSERVICES](MICROSERVICES.md)
