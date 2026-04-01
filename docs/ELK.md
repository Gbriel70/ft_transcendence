# ELK in the project

## Why we use ELK

We use ELK to centralize logs from all containers and make troubleshooting fast and consistent.

Main reasons:
- unified log search across all services
- structured parsing and enrichment for better debugging
- visibility into errors, warnings, and traffic behavior over time
- retention control to avoid unlimited log growth

In short, ELK is our operational observability layer for logs.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker host                              │
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────────┐ │
│  │  All service│    │   Filebeat   │    │      Logstash      │ │
│  │  containers │───▶│  (collector) │───▶│  (parse/enrich)    │ │
│  │  (logs)     │    │  port —      │    │  beats: 5044       │ │
│  └─────────────┘    └──────────────┘    └────────────────────┘ │
│                                                  │              │
│                                                  ▼              │
│                                     ┌─────────────────────┐    │
│                                     │    Elasticsearch    │    │
│                                     │   port 9200         │    │
│                                     │   (store + index)   │    │
│                                     └─────────────────────┘    │
│                                                  │              │
│                                                  ▼              │
│                              ┌──────────────────────────────┐  │
│                              │           Kibana             │  │
│                              │  port 5601 (direct)          │  │
│                              │  /kibana/ via nginx TLS      │  │
│                              └──────────────────────────────┘  │
│                                                                 │
│   elk_setup (one-shot)  ──▶  ILM policy + index template       │
│                               + Kibana index pattern           │
└─────────────────────────────────────────────────────────────────┘
```

All services communicate on the internal `minibank-network` Docker bridge.

## How it works in this project

Log flow is simple and consistent:
1. Application containers write logs to Docker log files.
2. Filebeat collects container logs and adds container metadata.
3. Logstash parses, normalizes, and enriches events.
4. Elasticsearch stores indexed logs with lifecycle management.
5. Kibana provides search, filtering, and dashboards.

## Core responsibilities

- `filebeat`: collect and ship container logs
- `logstash`: parse and enrich events
- `elasticsearch`: index, store, and retain logs
- `kibana`: operational visualization and investigation
- `elk_setup`: one-shot bootstrap for policies, templates, and index pattern

## Security and access

- ELK services communicate on the internal Docker network
- Elasticsearch and Kibana require authenticated access
- Kibana is available through the gateway path `/kibana/` over HTTPS
- password is controlled by `ELASTIC_PASSWORD`

## Retention model

The project uses lifecycle management to control storage growth:
- active write phase with rollover rules
- aging phases for optimization
- automatic deletion after retention threshold

This keeps the cluster usable over time without manual cleanup.

## Startup sequence

The services start in dependency order:
1. Elasticsearch
2. Logstash and Kibana
3. Filebeat
4. One-shot setup job

This avoids ingestion before storage and index setup are ready.

## Daily usage

Recommended operator workflow:
1. Open Kibana and select the project log pattern.
2. Filter by service name and log level.
3. Inspect latest errors first, then trace related requests.
4. Use dashboards for trend monitoring.

## Important files

- `app/services/monitoring/elasticsearch/elasticsearch.yml`
- `app/services/monitoring/logstash/logstash.yml`
- `app/services/monitoring/logstash/pipeline/minibank.conf`
- `app/services/monitoring/filebeat/filebeat.yml`
- `app/services/monitoring/kibana/kibana.yml`
- `app/services/monitoring/elk/setup-elk.sh`
- `docker-compose.yml`

## Accessing Kibana
- URL: https://localhost:8443/kibana/ or http://localhost:5601 

## Navigation
<!-- doc-nav -->
- [README](../README.md)
- [Next - GDPR](GDPR.md)
