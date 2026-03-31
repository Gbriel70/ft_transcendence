# Backend in the project

## Overview

The backend is built as a microservice architecture. Each service handles one domain and communicates through internal HTTP APIs.

Core services:
- `auth_service` (authentication, JWT, 2FA, GDPR endpoints)
- `user_service` (profiles, avatars, wallet references)
- `transaction_service` (transfer orchestration)
- `blockchain_service` (wallet and on-chain operations)

## Technologies and frameworks used

- **Node.js**: runtime for all backend services
- **Express.js**: HTTP framework used by all service APIs
- **PostgreSQL** with **pg**: relational data storage and SQL access
- **Vault** with `node-vault` / HTTP auth flow: runtime secret management
- **jsonwebtoken**: token issuance and validation
- **bcrypt**: password hashing and verification
- **speakeasy** + **qrcode**: TOTP-based 2FA setup and validation
- **nodemailer**: notification emails (with log fallback)
- **ethers** + local chain node tooling: blockchain integration
- **prom-client**: service metrics for monitoring

## How the backend works

1. Requests enter through the gateway and are routed to the correct service.
2. Services validate auth and input based on route requirements.
3. Services read/write relational data in PostgreSQL.
4. Sensitive config and credentials are loaded from Vault at startup/runtime.
5. Transaction and wallet operations call the blockchain service when needed.
6. Each service exposes metrics for observability.

## Service interaction model

- `auth_service` coordinates identity and security flows.
- `user_service` provides profile data and wallet ownership context.
- `transaction_service` orchestrates transfers and calls blockchain operations.
- `blockchain_service` performs chain-facing actions and returns immutable references.

## Result

The backend provides a modular, secure, and maintainable foundation: clear domain boundaries, centralized secret handling, reliable authentication flows, and integrated blockchain operations.

## Navigation
<!-- doc-nav -->
- [README](../README.md)
- [Next - FRONTEND](FRONTEND.md)
