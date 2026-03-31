# Monitoring in the project

## Why we use Prometheus

We use Prometheus as the metrics backbone.

Why:
- collect metrics from all services in a standard format
- keep historical metric data for trend and incident analysis
- evaluate alert rules continuously from real signals
- provide a single source of truth for operational queries

## Why we use Grafana

We use Grafana as the visualization and investigation layer.

Why:
- transform raw metrics into readable dashboards
- speed up incident triage with service-focused views
- correlate latency, errors, and load in one place
- enable day-to-day operational monitoring without manual queries

## How it works in this project

The monitoring stack collects metrics from backend services, database exporters, and gateway-related components.

High-level flow:
1. Services expose metrics endpoints.
2. Prometheus scrapes metrics on a fixed interval.
3. Alert rules are evaluated continuously.
4. Grafana reads Prometheus data and renders dashboards.
5. Operators investigate using dashboards and alerts.

## How we use Prometheus

- scrape service and exporter `/metrics` endpoints
- store time-series data for service and database behavior
- evaluate alerts for availability, latency, error rates, and pressure signals
- provide queryable metrics used by Grafana panels

## How we use Grafana

- use pre-provisioned dashboards for overview and service drill-down
- inspect spikes in latency/error rates by time range and service
- validate alert context before escalation
- monitor platform health from a single operational UI

## Supporting components

- service metrics endpoints: expose application and runtime metrics
- database exporter: exposes database-level health and performance metrics

## What we monitor

- service uptime and scrape success
- request rate, response time, and error rate
- database connections and query behavior
- process-level runtime metrics (CPU, memory, runtime internals)

## Access model

- dashboards and metric UIs are exposed through gateway routes
- direct local ports are available for development workflows
- admin credentials are controlled through environment configuration

## Alerting model

Alerts are evaluated from metric thresholds and persistence windows, including:
- service unavailability
- high error rate
- high latency
- high database pressure

This creates a proactive detection layer before failures escalate.

## Operational workflow

Recommended daily flow:
1. Check overview dashboard for overall health.
2. Investigate warning/critical alerts.
3. Drill down by service and time window.
4. Correlate API, service, and database metrics.

## Operational result

In this project, monitoring provides continuous runtime awareness, faster incident response, and data-driven performance analysis across the full backend stack.

## Important files

- app/services/monitoring/prometheus/prometheus.yml
- app/services/monitoring/prometheus/alert_rules.yml
- app/services/monitoring/grafana/provisioning
- app/services/monitoring/grafana/dashboards
- docker-compose.yml

## Navigation
<!-- doc-nav -->
- [README](../README.md)
- [Next - USER_MANAGEMENT](USER_MANAGEMENT.md)
