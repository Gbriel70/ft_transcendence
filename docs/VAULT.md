# Vault in the project

## Why we use Vault

We use Vault to centralize and protect sensitive configuration.

Main reasons:
- avoid hardcoded secrets in source code or container images
- provide per-service access control (least privilege)
- keep runtime credentials outside application logic
- support auditable and consistent secret distribution

In short, Vault is our trust layer for secrets across all backend services.

## How it works in this project

Vault runs as its own service and is initialized automatically during startup.

Initialization flow:
1. The Vault container starts and waits for health readiness.
2. Initial setup creates secret storage, policies, and service identities.
3. Service credentials (role ID and secret ID) are written to shared key files.
4. A ready marker is created so dependent services can start safely.

Service access flow:
1. Each service reads its role ID and secret ID from mounted files.
2. The service authenticates to Vault and receives a client token.
3. The service reads only its allowed secret paths.
4. Secrets are loaded into runtime configuration.

## What is stored

The platform stores values such as:
- database connection credentials
- authentication signing configuration
- per-service runtime settings (ports and internal shared secrets)
- blockchain operational values and user wallet private keys

## Access model

- each backend service has its own identity
- each identity is bound to a dedicated policy
- policies allow only the minimum required read/write paths
- blockchain service has additional scoped write access for user wallet keys

## Integration in the architecture

- auth, user, transaction, and blockchain services depend on Vault readiness
- services authenticate at startup and fetch configuration before handling traffic
- some services renew or re-authenticate tokens automatically to keep access valid
- blockchain service stores and retrieves wallet private keys through Vault instead of local files

## Operational result

In this project, Vault provides secure secret delivery and strict service isolation. It reduces credential exposure risk and gives a consistent, controlled way to manage sensitive data across microservices.

## Important files

- `app/vault/init-vault.sh` (bootstrap and policy setup)
- `app/vault/vault-config.hcl` (server configuration)
- `docker-compose.yml` (service wiring, healthcheck, and shared key volume)
- `app/services/auth/src/vault.js` (auth service secret client)
- `app/services/user/src/vault.js` (user service secret client)
- `app/services/transaction/src/vault.js` (transaction service secret client)
- `app/services/blockchain/src/vault.js` (blockchain service secret and wallet key client)
