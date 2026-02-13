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
