# Database Schema

This document describes the current relational schema used by the project.

## 1) Database Structure (Visual Representation)

```
user_auth
  id (PK)
  email (UNIQUE)
  password_hash
  name
  totp_secret
  totp_enabled
  created_at
      |
      | 1:N (historical)
      +------------------------------> gdpr_delete_requests
      |                                 id (PK)
      |                                 auth_user_id (FK -> user_auth.id)
      |                                 token (UNIQUE)
      |                                 created_at
      |                                 expires_at
      |
      | 1:0..1 (normal business flow)
      +------------------------------> user_profiles
                                        id (PK)
                                        auth_user_id (FK -> user_auth.id)
                                        name
                                        profile_picture
                                        wallet_address (UNIQUE)
                                        created_at
                                        updated_at
```

Both foreign keys use `ON DELETE CASCADE`, so deleting a row in `user_auth` also removes dependent profile and GDPR request rows.

## 2) Tables and Relationships

### `user_auth`
- Purpose: authentication identity and security state.
- Primary key: `id`.
- Important constraints: `email` unique.

### `user_profiles`
- Purpose: user profile and wallet reference.
- Foreign key: `auth_user_id -> user_auth.id` (`ON DELETE CASCADE`).
- Important constraints: `wallet_address` unique.

### `gdpr_delete_requests`
- Purpose: account deletion confirmation workflow.
- Foreign key: `auth_user_id -> user_auth.id` (`ON DELETE CASCADE`).
- Important constraints: `token` unique.

## 3) Key Fields and Data Types

### `user_auth`
| Field | Type | Notes |
|---|---|---|
| `id` | `SERIAL` | Primary key |
| `email` | `VARCHAR(255)` | Unique, not null |
| `password_hash` | `VARCHAR(255)` | Not null |
| `name` | `VARCHAR(255)` | Not null |
| `totp_secret` | `VARCHAR(255)` | Optional 2FA secret |
| `totp_enabled` | `BOOLEAN` | 2FA status, default false |
| `created_at` | `TIMESTAMP` | Creation timestamp |

### `user_profiles`
| Field | Type | Notes |
|---|---|---|
| `id` | `SERIAL` | Primary key |
| `auth_user_id` | `INTEGER` | FK to `user_auth.id` |
| `name` | `VARCHAR(255)` | Not null |
| `profile_picture` | `TEXT` | Optional avatar data |
| `wallet_address` | `VARCHAR(255)` | Unique wallet reference |
| `created_at` | `TIMESTAMP` | Creation timestamp |
| `updated_at` | `TIMESTAMP` | Last update timestamp |

### `gdpr_delete_requests`
| Field | Type | Notes |
|---|---|---|
| `id` | `SERIAL` | Primary key |
| `auth_user_id` | `INTEGER` | FK to `user_auth.id` |
| `token` | `VARCHAR(255)` | Unique confirmation token |
| `created_at` | `TIMESTAMP` | Request creation time |
| `expires_at` | `TIMESTAMP` | Request expiration time |

## 4) Real Schema Sample (As Implemented)

```sql
CREATE TABLE IF NOT EXISTS user_auth (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(255);
ALTER TABLE user_auth ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_user_auth_email ON user_auth(email);

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

CREATE TABLE IF NOT EXISTS gdpr_delete_requests (
    id SERIAL PRIMARY KEY,
    auth_user_id INTEGER REFERENCES user_auth(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gdpr_token ON gdpr_delete_requests(token);
```

## 5) Source of Truth

- `scripts/init-db.sh`
- `app/services/auth/src/db.js`
- `app/services/user/src/db.js`

## Navigation
<!-- doc-nav -->
- [README](../README.md)
- [Next - DOCKER](DOCKER.md)
