# User Management Documentation

## Overview

User management consists of two microservices:
- **auth_service** (port 3001): handles registration, login, password/email changes, 2FA
- **user_service** (port 3002): manages profiles, avatars, wallet references

## Authentication Flow

### Registration

```
POST /api/auth/register
Body: { name, email, password }

1. Validate required fields
2. Hash password with bcrypt (rounds from Vault config, default 12)
3. Insert into user_auth table
4. Create user_profile entry via internal call
5. Auto-create blockchain wallet
6. Return JWT token + user object
```

### Login

```
POST /api/auth/login
Body: { email, password }

1. Query user_auth by email
2. Validate password with bcrypt.compare()
3. If 2FA enabled: return tempToken (5m expiry) + requires2FA flag
4. Otherwise: return full JWT token (24h default) + user object
```

### 2FA Authentication (if 2FA is enabled)

```
POST /api/auth/2fa/authenticate
Body: { tempToken, token: <6-digit TOTP code> }

1. Verify tempToken signature
2. Validate TOTP code against user's totp_secret
3. Return full JWT token on success
```

## Token Management

- **JWT Algorithm**: HS256 (symmetric, secret from Vault)
- **Payload**: `{ id, email, [twoFactorPending: true] }`
- **Standard token TTL**: 24 hours
- **Temp token TTL**: 5 minutes (2FA interim)
- **Secret**:  Retrieved from Vault at `secret/jwt` > `secret` field

All requests to protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

## Password Management

### Hashing

- Algorithm: bcrypt
- Salt rounds: 12 (configurable via Vault `service/auth` > `bcrypt_rounds`)
- No plaintext passwords stored

### Change Password

```
PUT /api/auth/change-password
Body: { currentPassword, newPassword }

1. Require JWT auth
2. Verify currentPassword against stored hash
3. Hash newPassword
4. Update user_auth record
```

Validation:
- newPassword minimum 6 characters
- Must be different from current (bcrypt.compare check)

## Profile Management

### Profile Structure

```sql
user_profiles (
  id SERIAL PRIMARY KEY,
  auth_user_id INT (FK to user_auth),
  name VARCHAR(255),
  profile_picture TEXT (base64 or URL),
  wallet_address VARCHAR(255) UNIQUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Profile Endpoints (user_service)

```
GET /users/me
  Returns: { id, auth_user_id, name, profile_picture, wallet_address, created_at }

PUT /users/me
  Body: { name?, profile_picture? }
  Updates profile and sets updated_at

GET /users/:id
  Public profile lookup

GET /users/by-email/:email
  Lookup by email (used for transfers)

GET /users/by-username/:username
  Lookup by name
```

### Avatar Upload

- Stored as base64 in `profile_picture` field
- Max file size: 2MB (enforced frontend)
- Accepted formats: JPEG, PNG, GIF
- Default avatar: CSS-based gradient fallback if not provided

## 2FA (Two-Factor Authentication)

### Setup

```
POST /api/auth/2fa/setup
Response: { secret: base32_encoded, qrCode: data_url }

1. Generate secret with speakeasy
2. Generate QR code image
3. Store secret in user_auth.totp_secret (not yet enabled)
4. Return for user to scan and verify
```

### Verify 2FA

```
POST /api/auth/2fa/verify
Body: { token: <6-digit code> }

1. Validate TOTP against totp_secret
2. Set totp_enabled = TRUE
3. Return success message
```

### Disable 2FA

```
POST /api/auth/2fa/disable
Body: { token: <6-digit code> }

1. Require valid TOTP code
2. Clear totp_secret and set totp_enabled = FALSE
3. Return success
```

**TOTP Parameters**:
- Algorithm: SHA1 (speakeasy default)
- Time step: 30 seconds
- Digits: 6
- Window: ±1 step (60 second tolerance)

## Email Change

```
PUT /api/auth/change-email
Body: { newEmail }

1. Require JWT auth
2. Check email uniqueness in user_auth
3. Update user_auth.email
4. Return updated user object
```

## Database Schema

### user_auth

```sql
id INT PRIMARY KEY
email VARCHAR(255) UNIQUE NOT NULL
password_hash VARCHAR(255) NOT NULL
name VARCHAR(255) NOT NULL
totp_secret VARCHAR(255)
totp_enabled BOOLEAN DEFAULT FALSE
created_at TIMESTAMP DEFAULT NOW()

INDEX: idx_user_auth_email ON (email)
```

### user_profiles

```sql
id INT PRIMARY KEY
auth_user_id INT FK -> user_auth(id) ON DELETE CASCADE
name VARCHAR(255)
profile_picture TEXT
wallet_address VARCHAR(255) UNIQUE
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()

INDEX: idx_user_profiles_auth_user_id
INDEX: idx_user_profiles_wallet_address
```

## Additional Files

- [AUTH_API.md](./AUTH_API.md) - Detailed endpoint reference
- [SECURITY.md](./SECURITY.md) - Password policies and attack prevention
