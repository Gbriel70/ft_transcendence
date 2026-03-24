# Microservices in the project

## Why we use microservices

We use microservices to split the platform into clear business domains and reduce coupling between features.

Main reasons:
- isolated responsibilities per domain
- independent service lifecycle and easier troubleshooting
- safer evolution of one module without breaking all others
- clearer ownership of authentication, profiles, transfers, and blockchain operations

In short, this architecture keeps the backend modular, maintainable, and easier to scale.

## How it works in this project

The backend is organized into 4 domain services behind a single gateway.

Domain split:
- `auth_service` handles authentication and identity security
- `user_service` handles profile and wallet references
- `transaction_service` orchestrates transfer requests and transaction records
- `blockchain_service` executes wallet and on-chain transfer operations

Each service runs in its own container and communicates over the internal network using service names.

## Request flow

1. Client requests arrive at the gateway.
2. Requests are routed to the correct domain service.
3. Services call each other when needed through internal endpoints.
4. Shared data is persisted in relational tables.
5. Critical financial actions are forwarded to the blockchain service and linked back to local records.

## Service-to-service trust model

- external user calls are validated with signed access tokens
- internal calls use a dedicated internal secret for protected routes
- runtime secrets are loaded from centralized secret management at startup

## Data model strategy

- authentication, profile, and transaction data stay in database tables
- wallet metadata is linked to user profiles
- blockchain transaction hashes are stored with local transaction entries for immutable proof

## Operational result

In this project, microservices provide a clear separation between identity, profile, transfer orchestration, and blockchain execution. This improves reliability, security boundaries, and long-term maintainability.

## Important files

- `docker-compose.yml` (service wiring and startup dependencies)
- `app/services/auth/src/auth.js` (authentication domain)
- `app/services/user/src/user.js` (profile domain)
- `app/services/transaction/src/transaction.js` (transfer orchestration)
- `app/services/blockchain/src/blockchain.js` (wallet and chain operations)
