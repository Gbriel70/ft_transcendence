# Microservices Architecture Documentation

## Overview

The backend is composed of **4 loosely-coupled microservices**, each responsible for one business domain. All services are Express.js-based and communicate via REST APIs over the Docker internal network.

## Service Inventory

### 1. auth_service (port 3001)

**Responsibility**: User authentication, credential management, JWT issuance

**Key Routes**:
- `POST /register` - User signup
- `POST /login` - Credential validation + JWT generation
- `PUT /change-email` - Email update
- `PUT /change-password` - Password change
- `POST /2fa/setup` - 2FA secret generation
- `POST /2fa/verify` - Enable 2FA
- `POST /2fa/authenticate` - Temp token → full JWT
- `GET /2fa/status` - Check 2FA status
- `POST /gdpr/export` - User data export
- `POST /gdpr/delete-request` - Request account deletion
- `GET /metrics` - Prometheus metrics

**Database**: PostgreSQL (user_auth, gdpr_delete_requests tables)
**Dependencies**: Vault, PostgreSQL

### 2. user_service (port 3002)

**Responsibility**: User profiles, avatars, wallet references

**Key Routes**:
- `POST /users` - Create profile (called by auth_service)
- `GET /users/me` - Current user profile
- `PUT /users/me` - Update name/avatar
- `DELETE /users/me` - Delete account
- `GET /users/:id` - User by ID
- `GET /users/by-email/:email` - User by email
- `GET /users/by-username/:name` - User by name
- `POST /users/me/wallet` - Create blockchain wallet
- `GET /users/:id/wallet/balance` - Fetch wallet balance from blockchain_service
- `GET /metrics` - Prometheus metrics

**Database**: PostgreSQL (user_profiles table)
**Dependencies**: Vault, PostgreSQL, blockchain_service (for wallet creation)

### 3. transaction_service (port 3003)

**Responsibility**: Transfer orchestration, transaction recording

**Key Routes**:
- `POST /transactions` - Create transfer
- `GET /transactions` - List user's transactions
- `GET /transactions/:id` - Get transaction details
- `GET /metrics` - Prometheus metrics

**Database**: PostgreSQL (transactions table)
**Dependencies**: Vault, PostgreSQL, blockchain_service, user_service

### 4. blockchain_service (port 3004)

**Responsibility**: Smart contract interaction, wallet management, on-chain operations

**Key Routes**:
- `POST /wallets` - Create wallet + deploy contract instance
- `GET /wallets/:address/balance` - Fetch balance from contract
- `POST /tx` - Execute transaction on blockchain
- `GET /tx/:hash` - Get transaction receipt
- `GET /contract` - Contract metadata
- `GET /metrics` - Prometheus metrics

**Blockchain**: Hardhat (local Ethereum-compatible node)
**Dependencies**: Vault, Hardhat RPC, ethers.js

## Service Communication

### Internal Network

All services communicate via Docker network `minibank-network`:

```
auth_service:3001
user_service:3002
transaction_service:3003
blockchain_service:3004
```

Service discovery by hostname (e.g., `http://user_service:3002`).

### API Contracts

#### auth_service → user_service

```http
POST http://user_service:3002/users
Header: X-Internal-Secret: <INTERNAL_SECRET>
Body:
  {
    "auth_user_id": 1,
    "name": "John Doe"
  }
Response:
  {
    "id": 1,
    "auth_user_id": 1,
    "name": "John Doe",
    "profile_picture": null,
    "wallet_address": "0x...",
    "created_at": "2026-03-16T..."
  }
```

#### user_service → blockchain_service

```http
POST http://blockchain_service:3004/wallets
Body:
  {
    "user_id": 1
  }
Response:
  {
    "wallet_address": "0x...",
    "tx_hash": "0x..."
  }
```

#### transaction_service → blockchain_service

```http
POST http://blockchain_service:3004/tx
Body:
  {
    "from": "0x...",
    "to": "0x...",
    "amount": "100"
  }
Response:
  {
    "tx_hash": "0x...",
    "status": "pending|mined"
  }
```

## JWT Validation

All services validate incoming JWT tokens:

```javascript
const verified = jwt.verify(token, config.jwt.secret);
req.user = verified;
```

Fails with 403 on invalid/expired token.

## Internal Service Calls

Some routes are protected by internal secret header (auth_service → user_service):

```javascript
if (secret !== config.internalSecret) {
  return res.status(403).json({ error: 'Invalid internal secret' });
}
```

## Error Handling & Retries

### Current Approach

- Services fail fast (no automatic retries)
- Frontend/NGINX handles 503/504 gracefully
- Logs errors to stdout (picked up by ELK)

### Recommended Enhancements

- Implement exponential backoff for critical calls (user creation, wallet creation)
- Circuit breaker pattern for upstream failures
- Timeout enforcement (currently default Node.js timeouts)

## Metrics & Observability

Each service exposes Prometheus metrics on `GET /metrics`:

```
http_requests_total{method,route,status_code}
http_request_duration_seconds{method,route,status_code}
db_query_duration_seconds{operation}
auth_login_total{result,reason}
auth_2fa_total{action,result}
blockchain_tx_total{type}
blockchain_wallets_created_total
```

Prometheus scrapes all services; Grafana queries and alerts.

## Dependency Graph

```
┌─────────────┐
│   Frontend  │
└────────┬────┘
         │
    ┌────▼────┐
    │  NGINX  │
    └────┬────┘
         │
    ┌────┴───────────────────────┐
    │                             │
┌───▼──────┐ ┌──────────┐ ┌──────▼─────┐ ┌──────────────┐
│   auth   │ │   user   │ │transaction │ │ blockchain   │
└───┬──────┘ └────┬─────┘ └──────┬─────┘ └──────┬───────┘
    │             │              │              │
    └─────────┬───┴──────────────┴──────────────┘
              │
        ┌─────▼─────┐
        │PostgreSQL │
        └───────────┘
```

## Additional Files

- [SERVICE_API.md](./SERVICE_API.md) - Complete endpoint reference
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Service startup and health checks
- [SCALING.md](./SCALING.md) - Horizontal scaling considerations
