# NGINX in the project

## Why we use NGINX

In MiniBank, NGINX is the single entry point for the application. It was chosen to:

- centralize external access in one place
- terminate TLS (HTTPS) and protect traffic
- route requests to the correct microservices
- apply security controls (headers, rate limiting, and WAF - Web Application Firewall)
- serve the static frontend with good performance

Without it, each service would need to be exposed separately, increasing complexity and risk.

## How it is used in this project

The `nginx` container receives all traffic and acts as a reverse gateway:

- `http://localhost:8080` redirects to HTTPS
- `https://localhost:8443` is the main application endpoint

Short flow:

1. The client reaches NGINX.
2. NGINX validates security policies.
3. If the route is frontend, it serves static files (SPA).
4. If the route is API, it forwards to the corresponding microservice.

## Main routing

- `/` -> static frontend in `/usr/share/nginx/html` with SPA fallback (`index.html`)
- `/api/auth/*` -> `auth_service:3001`
- `/api/users/*` -> `user_service:3002`
- `/api/tx/*` -> `transaction_service:3003`
- `/api/blockchain/*` -> `blockchain_service:3004`
- `/kibana/` -> `kibana:5601`
- `/grafana/` -> `grafana:3000`
- `/prometheus/` -> `prometheus:9090`

## Applied security layers

- TLS 1.2 and 1.3
- security headers (including CSP)
- endpoint-based rate limiting
- ModSecurity with OWASP CRS in blocking mode
- hidden file access blocking

## Observability

- `/stub_status` endpoint for NGINX metrics (used by `nginx_exporter`)
- access and error logs in `/var/log/nginx`
- WAF audit log in `/var/log/modsecurity/modsec_audit.log`

## Important files

- `app/nginx/nginx.conf` (main configuration)
- `app/nginx/sites/default.conf` (servers and routes)
- `app/nginx/conf.d/ssl.conf` (TLS)
- `app/nginx/conf.d/security-headers.conf` (headers)
- `app/nginx/conf.d/rate-limiting.conf` (limits)
- `app/nginx/conf.d/proxy-headers.conf` (proxy headers)
- `app/nginx/modsecurity/modsecurity.conf` (WAF)
- `app/nginx/modsecurity/custom_rules.conf` and `exclusions.conf` (rule tuning)

## Quick summary

In this project, NGINX is the component that connects frontend, APIs, and monitoring with strong security and a single entry pattern. It simplifies architecture, improves protection, and makes operations easier.

## Navigation
<!-- doc-nav -->
- [README](../README.md)
- [Next - VAULT](VAULT.md)
