# NGINX Documentation

## Overview

This project uses **NGINX as the public entry point** for the MiniBank platform, with:

- TLS termination
- reverse proxy to microservices
- static frontend hosting
- rate limiting
- security headers
- ModSecurity + OWASP CRS (WAF)
- basic metrics endpoint (`/stub_status`) for Prometheus exporter

NGINX runs as a Docker service (`nginx`) and exposes:

- `http://localhost:8080` (redirects to HTTPS)
- `https://localhost:8443` (main application entrypoint)

---

## Container and Boot Flow

### Docker image

NGINX is built from:

- base: `owasp/modsecurity-crs:nginx-alpine`
- Dockerfile: `app/nginx/dockerfile`

It copies:

- frontend static files into `/usr/share/nginx/html`
- NGINX configuration (`nginx.conf`, `conf.d/*`, `sites/*`)
- ModSecurity config and custom rules

### Entrypoint

Entrypoint script: `app/nginx/docker-entrypoint.sh`

At startup it:

1. Generates a self-signed certificate if `/etc/nginx/certs/minibank.crt` does not exist
2. Prints ModSecurity/OWASP/custom rules status
3. Validates config with `nginx -t`
4. Starts NGINX in foreground

> `docker-compose.yml` mounts `./certs:/etc/nginx/certs:ro`, so certificate persistence is controlled by host files.

---

## Configuration Structure

Main config root:

- `app/nginx/nginx.conf`

Included files:

- `app/nginx/conf.d/ssl.conf`
- `app/nginx/conf.d/security-headers.conf`
- `app/nginx/conf.d/rate-limiting.conf`
- `app/nginx/conf.d/proxy-headers.conf`
- `app/nginx/sites/default.conf`

ModSecurity:

- `app/nginx/modsecurity/modsecurity.conf`
- `app/nginx/modsecurity/custom_rules.conf`
- `app/nginx/modsecurity/exclusions.conf`

---

## Networking and Ports

From `docker-compose.yml`:

- Host `8080` -> container `80`
- Host `8443` -> container `443`

Service dependencies:

- `auth_service` (3001)
- `user_service` (3002)
- `transaction_service` (3003)
- `blockchain_service` (3004)
- `kibana` (5601, internal network)

All communication occurs over the Docker network `minibank-network`.

---

## TLS/SSL

TLS settings are in `conf.d/ssl.conf`:

- protocols: TLS 1.2 / 1.3 only
- modern cipher suite set (Mozilla intermediate profile style)
- SSL session cache/timeouts enabled

Certificates expected at:

- `/etc/nginx/certs/minibank.crt`
- `/etc/nginx/certs/minibank.key`

If not provided, entrypoint auto-generates a self-signed cert (CN `localhost`).

---

## Security Controls

### 1) Security headers

Configured in `conf.d/security-headers.conf`:

- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera/mic/geolocation disabled)
- dynamic `Content-Security-Policy` via `$csp_header` map

### 2) Rate limiting

Configured in `conf.d/rate-limiting.conf`:

- `login_zone`: 10 req/min per IP
- `register_zone`: 3 req/min per IP
- `api_zone`: 100 req/min per IP
- `transaction_zone`: 20 req/min per IP
- `static_zone`: 1000 req/min per IP

Exceeding limits returns `429`.

### 3) WAF (ModSecurity)

Enabled in HTTPS server block:

- `modsecurity on;`
- `modsecurity_rules_file /etc/modsecurity.d/modsecurity.conf;`

WAF mode:

- `SecRuleEngine On` (blocking mode)

Rule sources:

- OWASP CRS
- custom brute-force and SQLi rules (`custom_rules.conf`)
- tuned exclusions (`exclusions.conf`) for false positive reduction

---

## Routing and Reverse Proxy

Defined in `sites/default.conf`.

### HTTP server (`:80`)

- `/stub_status` enabled for internal monitoring
- all other traffic redirected to HTTPS (`301`)

### HTTPS server (`:443`)

#### Frontend

- `location /` serves SPA from `/usr/share/nginx/html`
- `try_files $uri $uri/ /index.html` (SPA fallback)
- static assets cached long-term (`expires 1y`, immutable cache-control)

#### API routes

- `/api/auth/*` -> `auth_service:3001`
- `/api/users/*` -> `user_service:3002`
- `/api/tx/*` -> `transaction_service:3003`
- `/api/blockchain/*` -> `blockchain_service:3004`

Rewrites remove `/api/...` prefixes before upstream pass according to each block.

#### Kibana route

- `/kibana/` -> `kibana:5601`
- WebSocket upgrade headers enabled

#### Protected internal files

- denies access to hidden files (`location ~ /\.`)

---

## Observability

### NGINX metrics endpoint

`/stub_status` is exposed on port 80 with IP allowlist:

- `127.0.0.1`
- `172.16.0.0/12`
- `192.168.0.0/16`

Used by container `nginx_exporter` with:

- `-nginx.scrape-uri=http://nginx:80/stub_status`

### Logs

- Access log: `/var/log/nginx/access.log`
- Error log: `/var/log/nginx/error.log`
- ModSecurity audit log: `/var/log/modsecurity/modsec_audit.log`

---

## Proxy Header Policy

Standard headers are centralized in `conf.d/proxy-headers.conf`:

- `Host`, `X-Real-IP`, `X-Forwarded-*`
- HTTP/1.1 upstream connections
- WebSocket `Upgrade/Connection`
- upstream timeout and buffering defaults

This file is included by all proxied API/Kibana locations to keep behavior consistent.

---

## Operational Commands

### Validate NGINX config inside container

```bash
docker compose exec nginx nginx -t
```

### Reload NGINX

```bash
docker compose exec nginx nginx -s reload
```

### Check active routes/status quickly

```bash
curl -I http://localhost:8080
curl -kI https://localhost:8443
```

### Test monitoring endpoint (inside network or localhost allowlist)

```bash
curl http://localhost:8080/stub_status
```

---

## Quick Troubleshooting

1. **HTTPS unavailable**
   - Check cert files in `./certs`
   - Check container logs: `docker compose logs nginx`

2. **429 too many requests**
   - Verify per-route `limit_req` settings in `sites/default.conf`
   - Adjust corresponding zone rate in `conf.d/rate-limiting.conf`

3. **WAF blocks expected requests**
   - Inspect ModSecurity audit log
   - Add targeted exclusions in `modsecurity/exclusions.conf`

4. **Upstream 502/504**
   - Verify backend service is healthy and reachable by service name
   - Check upstream container logs

5. **Kibana path issues**
   - Ensure `/kibana/` location remains enabled
   - Confirm Kibana service is running and reachable on Docker network

---

## Notes

- Current `dockerfile` healthcheck uses `http://localhost/health`; ensure this endpoint is implemented in NGINX config (or adjust healthcheck command) to avoid false unhealthy states.
- For production deployment, replace self-signed cert generation with managed certificates and secret storage workflow.
