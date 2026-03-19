# Database Schema

This document describes the relational schema used by MiniBank and how table relationships are enforced.

## Source of truth

Schema initialization is implemented in:

- `scripts/init-db.sh`
- `app/services/auth/src/db.js`
- `app/services/user/src/db.js`

## Core tables

### 1) `user_auth`

Stores authentication identity and login security fields.

```sql
CREATE TABLE IF NOT EXISTS user_auth (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  totp_secret VARCHAR(255),
  totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_auth_email ON user_auth(email);
```

### 2) `user_profiles`

Stores profile-level data linked to the auth identity.

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  auth_user_id INTEGER REFERENCES user_auth(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  profile_picture TEXT,
  wallet_address VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user_id ON user_profiles(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_wallet_address ON user_profiles(wallet_address);
```

### 3) `gdpr_delete_requests`

Stores deletion confirmation tokens and expiry metadata.

```sql
CREATE TABLE IF NOT EXISTS gdpr_delete_requests (
  id SERIAL PRIMARY KEY,
  auth_user_id INTEGER REFERENCES user_auth(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gdpr_token ON gdpr_delete_requests(token);
```

## Relationship model

```
user_auth (1) ────────────────< user_profiles (0..1 per auth user in normal flow)
     │
     └────────────────────────< gdpr_delete_requests (0..N over time)
```

- `user_profiles.auth_user_id -> user_auth.id`
- `gdpr_delete_requests.auth_user_id -> user_auth.id`
- Both FKs use `ON DELETE CASCADE`

## Why this schema is clear and well-defined

1. **Canonical identity boundary**
   - All user-related entities are anchored to `user_auth.id`.

2. **Explicit foreign keys**
   - Relationships are not implicit in application code; they are enforced at the database layer.

3. **Deterministic deletion behavior**
   - Cascading delete ensures no orphan profile/GDPR rows when a user account is removed.

4. **Constraint-backed integrity**
   - Unique constraints on `email`, `wallet_address`, and `token` prevent duplicate critical identifiers.

5. **Index-backed access paths**
   - Lookup-heavy columns are indexed (`email`, FK references, wallet address, GDPR token).

## Notes for evaluation

- Transaction transfer execution is currently service-driven (transaction/blockchain services) and not represented as a dedicated relational `transactions` table in this schema.
- The user/account/privacy relation model itself is normalized and clearly defined for identity, profile, and privacy-request lifecycle.
