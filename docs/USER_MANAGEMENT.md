# User Management in the project

## Why we use user management

We use a dedicated user management domain to separate identity security from profile/business user data.

Main reasons:
- keep authentication logic isolated from profile operations
- enforce clear security boundaries for login and credential changes
- support account lifecycle features (registration, updates, deletion)
- integrate user identity with wallet and transfer flows

In short, user management is the identity and profile foundation of the platform.

## How it works in this project

User management is split into two services:
- auth service: registration, login, credential changes, 2FA, token issuance
- user service: profile data, avatars, wallet references, user lookup endpoints

High-level flow:
1. User authenticates through auth endpoints.
2. Auth service validates credentials and issues access token.
3. User service serves profile data for authenticated requests.
4. Internal calls connect identity data with profile and wallet records.

## Authentication model

- password-based login is the first factor
- optional 2FA adds a second factor with time-based code verification
- when 2FA is enabled, login returns a short-lived temp token before final token issuance
- protected routes require bearer token validation

## Profile model

- profile records are linked to authentication records
- profile updates are handled by user service endpoints
- wallet address is associated with user profile for transfer and balance flows

## Security model

- passwords are stored as hashes, never plaintext
- token secrets and auth configuration are loaded at runtime from secret management
- internal service operations use protected internal trust checks
- 2FA status and verification are enforced server-side

## What is covered

- account registration and login
- email and password update flows
- optional 2FA setup, verification, and disable
- profile retrieval and profile update
- lookup endpoints used by transfer and internal business flows

## Operational result

In this project, user management provides secure identity control and reliable profile ownership, while keeping authentication, authorization, and profile data responsibilities clearly separated.

## Important files

- app/services/auth/src/auth.js
- app/services/auth/src/db.js
- app/services/user/src/user.js
- app/services/user/src/db.js
- docs/2FA.md
- docs/user-management/AUTH_API.md
- docs/user-management/SECURITY.md

## Navigation
<!-- doc-nav -->
- [README](../README.md)
- [Next - BACKEND](BACKEND.md)
