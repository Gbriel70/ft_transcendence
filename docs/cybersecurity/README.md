# Cybersecurity Documentation

## Overview

The project implements a **defense-in-depth** security architecture with NGINX WAF, ModSecurity + OWASP CRS, rate limiting, TLS encryption, and HashiCorp Vault for secrets management.

## Web Application Firewall (WAF)

### NGINX + ModSecurity Stack

- **WAF Engine**: ModSecurity (`modsecurity on` in NGINX config)
- **Rules**:
  - **OWASP CRS** (Core Rule Set) - industry-standard detections
  - **Custom rules** - application-specific hardening
  - **Exclusions** - tuned to reduce false positives

### Configuration Files

- `app/nginx/modsecurity/modsecurity.conf` - engine settings (blocking mode, audit log)
- `app/nginx/modsecurity/custom_rules.conf` - brute-force, SQLi, XSS mitigations
- `app/nginx/modsecurity/exclusions.conf` - rule tuning for JSON/register endpoint

### Key Custom Rules

**Brute-Force Protection**

```
Login (IP tracking):
  - 5 failed login attempts → block (5m window)
  - Rate: limit_req zone=login_zone 10r/m

Registration (IP tracking):
  - 3 failed attempts → block (10m window)
  - Rate: limit_req zone=register_zone 3r/m
```

**SQL Injection Detection**

```
Regex pattern: UNION..SELECT|INSERT..INTO|DELETE..WHERE
Action: Deny with 403
Severity: CRITICAL
```

### ModSecurity Logging

- **Audit log**: `/var/log/modsecurity/modsec_audit.log`
- **Relevance filter**: Only log requests with status 5xx or 4xx (non-404)
- **Parts logged**: Request headers, body, response headers, body, metadata

## Rate Limiting

Implemented at NGINX level in `conf.d/rate-limiting.conf`:

| Zone | Limit | Description |
|------|-------|-------------|
| `login_zone` | 10 req/min | Login attempts, burst=5 |
| `register_zone` | 3 req/min | Registration, burst=3 |
| `api_zone` | 100 req/min | General API, burst=20 |
| `transaction_zone` | 20 req/min | Transfers, burst=10 |
| `static_zone` | 1000 req/min | Frontend assets |

Exceeding burst returns **HTTP 429** (Too Many Requests).

## TLS/HTTPS

### Certificate Management

- **Path**: `/etc/nginx/certs/minibank.crt` and `.key`
- **Auto-generation**: NGINX entrypoint generates self-signed cert if missing
- **Algorithm**: RSA 2048-bit, CN=localhost
- **Validity**: 365 days

### TLS Configuration

- **Protocols**: TLS 1.2 and TLS 1.3 only (no SSL 3.0, TLS 1.0, TLS 1.1)
- **Cipher Suite**: Mozilla Intermediate Profile
  - ECDHE-based: modern strength
  - No weak ciphers (no RC4, DES, MD5)
- **Session Cache**: Shared across workers (10m TTL)
- **HTTP/2**: Enabled for multiplexing

### HTTP Redirect

```
HTTP (:80) → HTTPS (:8443)
Code: 301 Permanent Redirect
```

Exception: `/stub_status` (monitoring endpoint) available on HTTP with IP allowlist.

## Security Headers

All HTTPS responses include (from `conf.d/security-headers.conf`):

```
X-Frame-Options: SAMEORIGIN
  → Prevents clickjacking (no embedding in cross-origin frames)

X-Content-Type-Options: nosniff
  → Forces browser MIME type detection (prevents MIME confusion)

X-XSS-Protection: 1; mode=block
  → Browser XSS filter (legacy support)

Referrer-Policy: strict-origin-when-cross-origin
  → Limits referer leak to same-origin; none to cross-origin

Permissions-Policy: geolocation=(), microphone=(), camera=()
  → Disables dangerous feature access

Content-Security-Policy: dynamic (varies by content-type)
  → Restricts script/style/image origins
```

## Secrets Management (HashiCorp Vault)

### Architecture

- **Vault Server** runs as a Docker service (`vault:8200`)
- **Initialization**: `app/vault/init-vault.sh` sets up KV v2 engine and AppRoles
- **Service auth**: AppRole with role_id + secret_id (stored in mounted volumes)
- **Secret storage**: KV v2 at `secret/` path (supports versioning)

### Secret Paths

| Path | Contents | Consumer |
|------|----------|----------|
| `secret/database` | host, user, password | auth_service, user_service |
| `secret/jwt` | secret, expires_in, algorithm | all services |
| `secret/auth` | bcrypt_rounds, ... | auth_service |
| `secret/blockchain` | contract_address, rpc_url, ... | blockchain_service |
| `secret/user` | ... | user_service |
| `secret/transaction` | ... | transaction_service |

### AppRole Workflow

1. **Service startup**: reads `VAULT_ROLE_ID` and `VAULT_SECRET_ID` from files
2. **Authenticates**: `POST /auth/approle/login` with role_id + secret_id
3. **Receives**: client token
4. **Fetches secrets**: `GET /secret/data/<path>` with token
5. **Caches**: in-memory (no file storage)

### Credential Rotation

Secret IDs have default TTL; new ones generated during redeployment.
Role IDs are long-lived; secret IDs rotate per service restart.

## Proxy Headers

NGINX adds/forwards (in `conf.d/proxy-headers.conf`):

```
Host: $host
X-Real-IP: $remote_addr
X-Forwarded-For: $proxy_add_x_forwarded_for
X-Forwarded-Proto: $scheme (https)
X-Forwarded-Host: $host
X-Forwarded-Port: $server_port
```

Backend services can log real client IP via `X-Real-IP`.

## Threat Model & Mitigations

| Threat | Mitigation |
|--------|------------|
| SQL Injection | Parameterized queries, WAF rules, input validation |
| XSS | CSP headers, HTML escaping, input sanitization |
| Brute-force Login | Rate limiting (10 req/min), ModSecurity rules |
| Weak Passwords | Client-side minimum 6 chars, bcrypt hashing |
| Credential Leakage | Vault-based secrets, no hardcoding, TLS for transit |
| MITM/Spoofing | TLS 1.2+ only, certificate pinning not needed (dev) |
| Unauthorized Access | JWT validation, role/scope checks (if implemented) |
| DDoS | Rate limiting, connection limits |

## Additional Files

- [VAULT_SETUP.md](./VAULT_SETUP.md) - Vault initialization and AppRole setup
- [WAF_RULES.md](./WAF_RULES.md) - Custom ModSecurity rule guide
- [TLS_HARDENING.md](./TLS_HARDENING.md) - Certificate generation for production
