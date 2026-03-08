# Monitoring Implementation (Prometheus + Grafana)

## Scope

This document covers the Prometheus + Grafana implementation added under app/services/monitoring and the app-level metrics instrumentation for each microservice.

## What Was Added

### 1) Prometheus Stack (Docker Compose)
- Prometheus, Alertmanager, Grafana
- Exporters: node_exporter, cadvisor, nginx_exporter

Configured in:
- docker-compose.yml

### 2) App-Level Metrics
Each service exposes:
- http_requests_total (Counter)
- http_request_duration_seconds (Histogram)

Metrics endpoint:
- GET /metrics

Implemented in:
- app/services/auth/src/auth.js
- app/services/user/src/user.js
- app/services/transition/src/transition.js
- app/services/blockchain/src/blockchain.js

### 3) Prometheus Scrape Targets
Prometheus scrapes:
- auth_service:3001/metrics
- user_service:3002/metrics
- transition_service:3003/metrics
- blockchain_service:3004/metrics
- node_exporter:9100
- cadvisor:8080
- nginx_exporter:9113

Defined in:
- app/services/monitoring/prometheus/prometheus.yml

### 4) Alert Rules
Alerts added:
- HighServiceErrorRate (5xx error rate > 5%)
- HighServiceLatencyP95 (p95 latency > 0.5s)

Defined in:
- app/services/monitoring/prometheus/alert_rules.yml

### 5) Grafana Provisioning
Grafana auto-provisions:
- Prometheus datasource
- Dashboards from /var/lib/grafana/dashboards

Provisioning files:
- app/services/monitoring/grafana/provisioning/datasources/datasource.yml
- app/services/monitoring/grafana/provisioning/dashboards/dashboards.yml

Dashboards:
- System Overview
- Nginx Overview
- Services Overview

Dashboards located in:
- app/services/monitoring/grafana/dashboards/

## Service Metrics Details

Labels used for HTTP metrics:
- method
- route
- status_code
- service (default label)

Metrics names:
- http_requests_total
- http_request_duration_seconds_bucket
- http_request_duration_seconds_sum
- http_request_duration_seconds_count

## Security Notes

Grafana is configured with:
- Sign-up disabled
- Anonymous access disabled
- Admin credentials set via env vars

Defaults in docker-compose.yml:
- GRAFANA_ADMIN_USER=admin
- GRAFANA_ADMIN_PASSWORD=admin123

Change these in your environment for production use.

## How To Use

### Start the stack

```bash
docker compose up -d --build
```

### Verify Prometheus targets

```bash
curl http://localhost:9090/api/v1/targets
```

### Check a service metrics endpoint

```bash
curl http://localhost:3001/metrics
```

### Open Grafana

- http://localhost:3000

## Notes

- The Nginx stub_status endpoint is enabled for nginx_exporter on port 80 and restricted to local and private networks.
- Alerts are evaluated by Prometheus and sent to Alertmanager.
- Alertmanager is configured with a null receiver by default; wire receivers (email, Slack) as needed.




# Monitoring Implementation (Prometheus + Grafana)

## Scope

This document covers the Prometheus + Grafana implementation added under app/services/monitoring and the app-level metrics instrumentation for each microservice.

## What Was Added

### 1) Prometheus Stack (Docker Compose)
- Prometheus, Alertmanager, Grafana
- Exporters: node_exporter, cadvisor, nginx_exporter

Configured in:
- docker-compose.yml

### 2) App-Level Metrics
Each service exposes:
- http_requests_total (Counter)
- http_request_duration_seconds (Histogram)

Metrics endpoint:
- GET /metrics

Implemented in:
- app/services/auth/src/auth.js
- app/services/user/src/user.js
- app/services/transition/src/transition.js
- app/services/blockchain/src/blockchain.js

### 3) Prometheus Scrape Targets
Prometheus scrapes:
- auth_service:3001/metrics
- user_service:3002/metrics
- transition_service:3003/metrics
- blockchain_service:3004/metrics
- node_exporter:9100
- cadvisor:8080
- nginx_exporter:9113

Defined in:
- app/services/monitoring/prometheus/prometheus.yml

### 4) Alert Rules
Alerts added:
- HighServiceErrorRate (5xx error rate > 5%)
- HighServiceLatencyP95 (p95 latency > 0.5s)

Defined in:
- app/services/monitoring/prometheus/alert_rules.yml

### 5) Grafana Provisioning
Grafana auto-provisions:
- Prometheus datasource
- Dashboards from /var/lib/grafana/dashboards

Provisioning files:
- app/services/monitoring/grafana/provisioning/datasources/datasource.yml
- app/services/monitoring/grafana/provisioning/dashboards/dashboards.yml

Dashboards:
- System Overview
- Nginx Overview
- Services Overview

Dashboards located in:
- app/services/monitoring/grafana/dashboards/

## Service Metrics Details

Labels used for HTTP metrics:
- method
- route
- status_code
- service (default label)

Metrics names:
- http_requests_total
- http_request_duration_seconds_bucket
- http_request_duration_seconds_sum
- http_request_duration_seconds_count

## Security Notes

Grafana is configured with:
- Sign-up disabled
- Anonymous access disabled
- Admin credentials set via env vars

Defaults in docker-compose.yml:
- GRAFANA_ADMIN_USER=admin
- GRAFANA_ADMIN_PASSWORD=admin123

Change these in your environment for production use.

## How To Use

### Start the stack

```bash
docker compose up -d --build
```

### Verify Prometheus targets

```bash
curl http://localhost:9090/api/v1/targets
```

### Check a service metrics endpoint

```bash
curl http://localhost:3001/metrics
```

### Open Grafana

- http://localhost:3000

## Notes

- The Nginx stub_status endpoint is enabled for nginx_exporter on port 80 and restricted to local and private networks.
- Alerts are evaluated by Prometheus and sent to Alertmanager.
- Alertmanager is configured with a null receiver by default; wire receivers (email, Slack) as needed.





## After blockchain implementation

User: merge here (branch monitoring) the last version of terms branch

GitHub Copilot: I'll help you merge the "terms" branch into the "monitoring" branch. Let me start by checking the current branch and the available branches.

Ran terminal command:  git branch -a

Ran terminal command:  git status && echo "---" && git branch -a

Ran terminal command:  git status

Ran terminal command:  git merge terms

Ran terminal command:  git merge terms --no-ff -m "Merge terms branch"

The merge is already up to date. The `monitoring` branch already contains all the changes from the `terms` branch. Let me verify the recent commits to confirm:

Ran terminal command:  git log --oneline -10 --all --graph

✓ **Merge complete.** The `monitoring` branch is already synchronized with the `terms` branch. Both branches are at the same commit (`adc204b`), so there were no new changes to merge. Your monitoring branch has the latest version of the terms branch integrated.

User: Does prometheus setup needs update? For example the exporter from blockchain, from postgress since the dbs were updated?

Check what needs update in exporters configurations and integrationss

GitHub Copilot: Let me explore the current Prometheus configuration and all relevant service files to understand what exporters are configured and what might need updating.

Search complete: Find Prometheus exporter configs

Searched for files matching `**/*prometheus*`, 1 match

Searched for files matching `**/*docker-compose*`, 1 match

Searched for regex `/metrics|prometheus|exporter|scrape_configs`, 200 results

Searched for files matching `**/metrics.js`, no matches

Searched for files matching `**/blockchain/**/index.js`, no matches

Searched for files matching `**/auth/**/index.js`, no matches

Searched for files matching `**/user/**/index.js`, no matches

Searched for files matching `**/transaction/**/index.js`, no matches

Read [](file:///home/fde-alen/ft_transcendence/app/services/monitoring/prometheus/prometheus.yml)

Searched for files matching `**/metrics*.js`, no matches

Searched for files matching `**/app/services/**/server.js`, no matches

Read [](file:///home/fde-alen/ft_transcendence/docker-compose.yml#200-200), lines 200 to 300

Ran terminal command:  grep -n "metrics\|exporter\|postgres\|pg_\|database\|db" app/services/blockchain/src/blockchain.js | head -40

Ran terminal command:  grep -rn "metrics\|prom-client\|prometheus" app/services/blockchain/ app/services/auth/src/ app/services/user/src/ app/services/transaction/src/ 2>/dev/null

Ran terminal command:  cat app/services/blockchain/src/blockchain.js

Ran terminal command:  cat app/services/auth/src/db.js && echo "---USER---" && cat app/services/user/src/db.js

Ran terminal command:  grep -n "postgres\|pg_\|exporter\|port\|PORT" docker-compose.yml | head -60

Ran terminal command:  grep -n "register\|Counter\|Gauge\|Histogram\|prom-client" app/services/auth/src/auth.js app/services/user/src/user.js app/services/transaction/src/transaction.js | head -50

Ran terminal command:  cat app/services/blockchain/package.json && echo "---" && grep -n "SERVICE_PORT\|PORT\|port" app/services/blockchain/src/vault.js docker-compose.yml | grep -i "blockchain\|3004"

Here's a thorough audit of what needs updating:

---

## Exporter / Integration Gaps Found

### 1. Blockchain service — scrape is broken (critical)

Prometheus is configured to scrape `blockchain_service:3004/metrics`, but the blockchain service has **no `/metrics` endpoint and no `prom-client` dependency**. Every scrape silently returns a 404.

package.json — `prom-client` is completely absent from dependencies.
prometheus.yml — scrape job exists but hits nothing.

**What to add to blockchain service:**
- `prom-client` dependency
- A `/metrics` endpoint (same pattern as auth/user/transaction)
- Blockchain-specific metrics: `wallet_creation_total`, `blockchain_tx_total` (labelled by type: deposit/transfer), `blockchain_tx_errors_total`, `contract_call_duration_seconds`

---

### 2. PostgreSQL — no exporter at all (critical)

There's a `postgres:16-alpine` container running, and **all three services (auth, user, transaction) query it**, but there is no `postgres_exporter` anywhere in docker-compose.yml and no scrape job in prometheus.yml.

Zero DB-level visibility: no connection pool stats, no query duration, no dead tuples, no index usage, no cache hit ratio.

**What to add:**
- `prometheuscommunity/postgres-exporter` container to docker-compose.yml with `DATA_SOURCE_NAME` pointing to the postgres container
- A `postgres` job in prometheus.yml targeting `postgres_exporter:9187`

---

### 3. Auth / User / Transaction — only skeleton metrics

All three services implement the exact same minimal pattern (default Node.js process metrics + generic HTTP histogram/counter). No business-level metrics:

| Missing metric | Service | Value |
|---|---|---|
| `auth_login_total` (success/failure labels) | auth | detect brute-force |
| `auth_2fa_total` | auth | 2FA adoption rate |
| `auth_token_refresh_total` | auth | session health |
| `db_query_duration_seconds` | auth, user, transaction | DB performance |
| `transaction_amount_eth` histogram | transaction | financial visibility |
| `transaction_errors_total` | transaction | failure tracking |
| `user_profile_update_total` | user | activity tracking |

---

### 4. Hardhat node — not scraped

The Hardhat node runs as a separate container but has no JSON-RPC metrics endpoint scraped. Chain-level data (block height, pending tx count) is invisible to Prometheus.

---

## Summary of what to do

| Priority | Action | Files |
|---|---|---|
| Critical | Add `/metrics` + `prom-client` to blockchain service | blockchain.js, package.json |
| Critical | Add `postgres_exporter` container + scrape job | docker-compose.yml, prometheus.yml |
| Medium | Add business metrics to auth/user/transaction | auth.js, user.js, transaction.js |
| Low | Consider Hardhat JSON-RPC scraper or custom exporter | — |

Want me to implement any of these? I'd suggest starting with the two critical ones (blockchain `/metrics` + postgres exporter).
