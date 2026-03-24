# GDPR in the project

## Why we implement GDPR flows

We implement GDPR flows to give users control over personal data and provide a clear privacy lifecycle inside the platform.

Main reasons:
- allow users to export their personal data
- support verified account deletion requests
- enforce secure confirmation before irreversible deletion
- keep privacy actions consistent across backend and frontend

In short, GDPR support is our user-rights layer for data access and deletion.

## How it works in this project

GDPR logic is currently centralized in the authentication domain and exposed through the Privacy Center in the frontend.

High-level flow:
1. User opens Privacy Center.
2. User requests data export or account deletion.
3. Backend validates identity and request context.
4. For deletion, a time-limited confirmation token is sent by email.
5. Confirmed deletion removes the account and related dependent records.

## Implemented backend endpoints

- `GET /gdpr/export`
	- requires authenticated access
	- returns downloadable user data JSON
	- includes account and profile data currently integrated in the flow

- `POST /gdpr/delete-request`
	- requires authenticated access
	- creates a deletion confirmation token with expiration
	- sends a confirmation link to user email

- `DELETE /gdpr/confirm-delete`
	- receives deletion token
	- validates token and expiration
	- deletes the account and cascades linked profile/request records

## Frontend flow

- Privacy Center route triggers export and deletion request actions
- Confirmation route consumes token and executes final deletion
- session is cleared after successful deletion confirmation

## Data and safety model

- deletion requests are stored with token and expiry
- confirmation is required before destructive action
- relational cascade cleanup removes linked records automatically
- email is used as out-of-band confirmation channel

## Current coverage

- user data export
- deletion request with expiring confirmation token
- confirmed deletion with linked-record cleanup
- frontend UX for both export and deletion confirmation

## Known gaps

- export payload can be expanded to include more cross-service data
- compliance audit trail can be strengthened with dedicated events
- retention policy for privacy-related operational logs can be documented more explicitly

## Operational result

In this project, GDPR is implemented as a practical end-to-end flow: authenticated export, verified deletion request, and confirmed account removal with safe relational cleanup.

## Important files

- `app/services/auth/src/auth.js`
- `app/services/auth/src/db.js`
- `app/services/user/src/db.js`
- `app/frontend/js/views/gdpr.js`
- `app/frontend/js/views/gdpr-confirm.js`
- `app/frontend/js/services/api.js`
- `scripts/init-db.sh`
