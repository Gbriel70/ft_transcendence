# 2FA in the project

## Why we use 2FA

We use two-factor authentication to add a second verification layer after password login.

Main reasons:
- reduce account takeover risk when passwords are leaked
- require possession of a time-based one-time code from an authenticator app
- increase confidence for sensitive account actions
- keep authentication aligned with layered security practices

In short, 2FA protects accounts even when the first factor is compromised.

## How it works in this project

2FA is implemented in the authentication service and consumed by frontend profile/login flows.

High-level model:
1. User enables 2FA in profile settings.
2. System generates a secret and QR code for authenticator app enrollment.
3. User confirms enrollment with a valid TOTP code.
4. On future logins, password verification returns a short-lived temporary token.
5. User submits TOTP code plus temp token to complete login and receive final access token.

## Enrollment flow

- Setup endpoint generates secret and QR code, and stores secret in user record.
- Verify endpoint validates TOTP code and marks 2FA as enabled.
- Status endpoint reports whether 2FA is currently enabled for the authenticated user.

## Login flow with 2FA enabled

- Password is validated first.
- If 2FA is enabled, backend returns requires 2FA plus a temporary token.
- Temporary token is limited to 5 minutes and flagged as pending second factor.
- Frontend sends temp token and TOTP code to complete authentication.
- Backend returns the normal session token only after TOTP verification succeeds.

## Disable flow

- User must be authenticated.
- User must provide a valid current TOTP code.
- Backend clears the stored secret and disables 2FA.

## Data and security model

- User record stores:
	- totp_secret
	- totp_enabled
- TOTP codes are verified server-side with a small clock drift window.
- Invalid codes fail authentication and do not issue final tokens.
- 2FA operations are tracked in metrics for observability.

## Implemented endpoints

- POST /2fa/setup
- POST /2fa/verify
- POST /2fa/disable
- POST /2fa/authenticate
- GET /2fa/status

## Operational result

In this project, 2FA provides a practical second-factor control from enrollment to login completion, strengthening account security without changing the core user experience.

## Important files

- app/services/auth/src/auth.js
- app/services/auth/src/db.js
- app/frontend/js/services/api.js
- app/frontend/js/views/login.js
- app/frontend/js/views/profile.js

## Navigation
<!-- doc-nav -->
- [README](../README.md)
- [Next - BLOCKCHAIN](BLOCKCHAIN.md)
