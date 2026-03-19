# GDPR Implementation (Current State)

This document reflects the **actual implementation currently in the repository**.

## Architecture Decision

GDPR flows are implemented in the **auth service** and exposed through frontend Privacy Center views.

- No separate `gdpr_service` is currently used.
- `auth_service` orchestrates export/deletion.
- `user_service` provides profile data used during export.

## Data Model Used

The GDPR flow relies on these PostgreSQL tables:

- `user_auth`
- `user_profiles` (linked to `user_auth.id` via `auth_user_id`, `ON DELETE CASCADE`)
- `gdpr_delete_requests` (linked to `user_auth.id` via `auth_user_id`, `ON DELETE CASCADE`)

Relevant schema sources:

- `scripts/init-db.sh`
- `app/services/auth/src/db.js`
- `app/services/user/src/db.js`

## Implemented Backend Endpoints

Implemented in `app/services/auth/src/auth.js`:

### 1) `GET /gdpr/export`

- Requires authenticated JWT (`Authorization: Bearer ...`).
- Fetches account fields from `user_auth` (excluding password hash and TOTP secret).
- Calls `user_service` (`/users/me/data`) for profile data.
- Returns downloadable JSON (`my-minibank-data.json`).
- Sends notification email (or logs email content if SMTP is not configured).

### 2) `POST /gdpr/delete-request`

- Requires authenticated JWT.
- Removes previous pending deletion requests for the user.
- Creates a new `gdpr_delete_requests` record with random token and 24h expiry.
- Sends confirmation link to email (`#/gdpr-confirm?token=...`).

### 3) `DELETE /gdpr/confirm-delete`

- Receives `{ token }` in request body.
- Validates token existence and expiry.
- Deletes `user_auth` row for the target user.
- Cascading FK deletes linked `user_profiles` and `gdpr_delete_requests` rows.
- Sends deletion confirmation email.

## Implemented Frontend Flow

Implemented in:

- `app/frontend/js/views/gdpr.js`
- `app/frontend/js/views/gdpr-confirm.js`
- `app/frontend/js/services/api.js`

### Privacy Center (`#/gdpr`)

- **Export button** → calls `GET /api/auth/gdpr/export`, downloads JSON blob.
- **Delete request button** → calls `POST /api/auth/gdpr/delete-request`.

### Confirmation page (`#/gdpr-confirm?token=...`)

- Extracts token from hash query string.
- On user confirmation, calls `DELETE /api/auth/gdpr/confirm-delete` with token.
- Clears session and redirects to login after success.

## Email Behavior

Implemented via `nodemailer` in `auth_service`:

- If `SMTP_HOST` is configured, sends real emails.
- If not configured, writes email content to auth service logs.

Environment variables used:

- `APP_URL`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## What Is Covered Today

- Data export endpoint with downloadable JSON
- Deletion request with email confirmation token
- Token expiry handling (24h)
- Confirmed deletion with cascade cleanup
- Frontend UX for export and deletion confirmation

## Known Gaps / Future Improvements

1. **Export scope**: current export contains account + profile data; transaction aggregation is not fully integrated in export payload.
2. **Audit trail**: deletion audit/event logging can be expanded for stronger compliance evidence.
3. **Retention policy docs**: define explicit retention windows for operational logs and GDPR records.
4. **Service split** (optional): a dedicated `gdpr_service` could be introduced for stricter separation and auditability.

## Quick Endpoint Summary

- `GET /api/auth/gdpr/export`
- `POST /api/auth/gdpr/delete-request`
- `DELETE /api/auth/gdpr/confirm-delete`

These are production paths behind NGINX proxy and map to auth service GDPR handlers.
