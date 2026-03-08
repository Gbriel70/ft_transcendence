# ELK Stack — Log Management Infrastructure

**Branch:** `ELK`  
**Module:** DevOps · Major (2 pts) — *Infrastructure for log management using ELK*  
**Stack version:** 7.17.20 (Elasticsearch · Logstash · Kibana · Filebeat)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Components](#2-components)
3. [Directory Structure](#3-directory-structure)
4. [Security](#4-security)
5. [Log Retention (ILM Policy)](#5-log-retention-ilm-policy)
6. [Log Flow](#6-log-flow)
7. [Kibana Access](#7-kibana-access)
8. [Environment Variables](#8-environment-variables)
9. [Startup Sequence](#9-startup-sequence)
10. [Useful Elasticsearch API Calls](#10-useful-elasticsearch-api-calls)

---

## 1. Architecture Overview

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
No ELK port is exposed to the public internet except through nginx TLS.

---

## 2. Components

### Elasticsearch
- **Image:** `docker.elastic.co/elasticsearch/elasticsearch:7.17.20`
- **Container:** `elasticsearch`
- **Role:** Stores and indexes all application logs
- **Config:** [`app/services/monitoring/elasticsearch/elasticsearch.yml`](../../app/services/monitoring/elasticsearch/elasticsearch.yml)
- **Volume:** `elk_data` (persistent named volume)
- **Security:** `xpack.security.enabled=true`, password via `ELASTIC_PASSWORD`
- **Health check:** polls `/_cluster/health` every 30 s; other services wait for `service_healthy`

### Logstash
- **Image:** `docker.elastic.co/logstash/logstash:7.17.20`
- **Container:** `logstash`
- **Role:** Receives log events from Filebeat, parses/enriches them, ships to Elasticsearch
- **Config:** [`app/services/monitoring/logstash/logstash.yml`](../../app/services/monitoring/logstash/logstash.yml)
- **Pipeline:** [`app/services/monitoring/logstash/pipeline/minibank.conf`](../../app/services/monitoring/logstash/pipeline/minibank.conf)
- **Input port:** `5044` (Beats protocol)
- **Memory:** 256 MB heap (`LS_JAVA_OPTS=-Xms256m -Xmx256m`)

### Kibana
- **Image:** `docker.elastic.co/kibana/kibana:7.17.20`
- **Container:** `kibana`
- **Role:** Web UI for searching, visualising and dashboarding logs
- **Config:** [`app/services/monitoring/kibana/kibana.yml`](../../app/services/monitoring/kibana/kibana.yml)
- **Ports:**
  - Direct: `http://localhost:5601`
  - Via nginx TLS: `https://localhost:8443/kibana/`
- **Auth:** Kibana built-in login (`elastic` user, `xpack.security.enabled=true`)

### Filebeat
- **Image:** `docker.elastic.co/beats/filebeat:7.17.20`
- **Container:** `filebeat` (runs as `root`)
- **Role:** Reads every Docker container's log file and ships to Logstash
- **Config:** [`app/services/monitoring/filebeat/filebeat.yml`](../../app/services/monitoring/filebeat/filebeat.yml)
- **Mounts:**
  - `/var/lib/docker/containers` (read-only) — raw container logs
  - `/var/run/docker.sock` (read-only) — Docker metadata enrichment
- **Filters:** ELK containers themselves (`elasticsearch`, `logstash`, `kibana`, `filebeat`, `elk_setup`) are dropped to prevent log loops

### elk_setup (one-shot)
- **Image:** `docker.elastic.co/elasticsearch/elasticsearch:7.17.20`
- **Container:** `elk_setup`
- **Role:** Bootstraps Elasticsearch and Kibana after they are healthy
- **Script:** [`app/services/monitoring/elk/setup-elk.sh`](../../app/services/monitoring/elk/setup-elk.sh)
- **Restart policy:** `no` — runs once and exits
- **Actions:**
  1. Creates `minibank-ilm-policy` (ILM lifecycle)
  2. Creates `minibank-logs-template` (index template with field mappings)
  3. Bootstraps `minibank-logs-000001` with write alias `minibank-logs`
  4. Creates Kibana index pattern `minibank-logs-*` with `@timestamp` as time field
  5. Sets `minibank-logs` as the default Kibana index pattern

---

## 3. Directory Structure

```
app/services/monitoring/
├── elasticsearch/
│   └── elasticsearch.yml          # Cluster config (single-node, xpack.security)
├── logstash/
│   ├── logstash.yml               # Logstash daemon settings
│   └── pipeline/
│       └── minibank.conf          # Input → filter → output pipeline
├── kibana/
│   └── kibana.yml                 # Kibana server + Elasticsearch connection
├── filebeat/
│   └── filebeat.yml               # Container log collector config
└── elk/
    └── setup-elk.sh               # One-shot bootstrap script (ILM + templates)
```

---

## 4. Security

| Component     | Mechanism |
|---------------|-----------|
| Elasticsearch | `xpack.security.enabled=true`; all API calls require `elastic` user credentials |
| Logstash      | Connects to Elasticsearch with `elastic` user via `${ELASTIC_PASSWORD}` env var |
| Kibana        | Login page enforced by `xpack.security.enabled=true`; credentials: `elastic` / `ELASTIC_PASSWORD` |
| Filebeat      | Ships to Logstash on internal Docker network only (no external exposure) |
| Nginx proxy   | Kibana routed through nginx HTTPS (port 8443); TLS termination at nginx; direct port 5601 also available on localhost |

**Password management:**  
Set `ELASTIC_PASSWORD` in your `.env` file (copied from `.env.example`).  
The default value `minibank_elastic` is only for local development — change it before any deployment.

```bash
# .env
ELASTIC_PASSWORD=your_strong_password_here
```

---

## 5. Log Retention (ILM Policy)

Policy name: **`minibank-ilm-policy`**

| Phase  | Trigger | Actions |
|--------|---------|---------|
| **Hot** (active writes) | immediately | rollover at **7 days** or **10 GB** |
| **Warm** (recent, read-only) | 7 days after rollover | shrink to 1 shard, force-merge to 1 segment |
| **Cold** (archive) | 15 days after rollover | freeze index (minimal RAM footprint) |
| **Delete** | **30 days** after rollover | permanent deletion |

This means logs are retained for approximately **37 days** (7 warm + 30 delete trigger), with storage shrinking automatically as indices age.

To change retention, edit the policy via Kibana (Stack Management → Index Lifecycle Policies) or via the Elasticsearch API:

```bash
curl -u elastic:$ELASTIC_PASSWORD -X PUT http://localhost:9200/_ilm/policy/minibank-ilm-policy \
  -H "Content-Type: application/json" \
  -d '{ "policy": { "phases": { "delete": { "min_age": "60d", ... } } } }'
```

---

## 6. Log Flow

### What gets collected
Filebeat reads every container's JSON log file under `/var/lib/docker/containers/*/`.  
Docker metadata (container name, image, labels) is added automatically via `add_docker_metadata`.

### Logstash enrichment pipeline

1. **Noise drop** — health-check (`GET /health`) and metrics (`GET /metrics`, `stub_status`) requests are dropped
2. **JSON parsing** — Node.js services emit JSON logs; these are parsed and `level`, `msg`, `err` fields are promoted to the top level as `log_level`, `log_message`, `error_message`
3. **Nginx access log parsing** — grok extracts `client_ip`, `http_method`, `request_uri`, `response_code`, `bytes_sent`; `log_level` is set to `error` for 5xx, `warn` for 4xx
4. **Level classification** — raw messages without a level are classified by keyword matching (`error`/`warn`/`info`)
5. **Field cleanup** — noisy metadata fields (`agent`, `ecs`, `input`, `tags`, `host`) are removed

### Index naming
Logs land in ILM-managed rolling indices:  
`minibank-logs-2026.03.08-000001` → `minibank-logs-2026.03.09-000002` → …

The alias `minibank-logs` always points to the current write index.  
Kibana uses the index pattern `minibank-logs-*` to query across all indices.

---

## 7. Kibana Access

| URL | Notes |
|-----|-------|
| `https://localhost:8443/kibana/` | Via nginx (TLS terminated, recommended) |
| `http://localhost:5601` | Direct (no TLS, development only) |

**Login credentials:**
- Username: `elastic`
- Password: value of `ELASTIC_PASSWORD` (default: `minibank_elastic`)

### First-time setup (auto-configured by elk_setup)
The `elk_setup` container automatically:
- Creates the index pattern `minibank-logs-*`
- Sets it as the default pattern in Discover

### Suggested Kibana workflow
1. **Discover** → select `minibank-logs-*` → search/filter logs in real time
2. Filter by `service_name` to isolate a specific microservice
3. Filter by `log_level: error` to see only errors
4. Use **Visualize** to build charts (e.g., log volume by service over time)
5. Use **Dashboard** to assemble panels into a monitoring view

---

## 8. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ELASTIC_PASSWORD` | `minibank_elastic` | Password for the `elastic` superuser — used by all ELK components |

Add to your `.env` file:
```dotenv
ELASTIC_PASSWORD=minibank_elastic
```

---

## 9. Startup Sequence

The `depends_on` chain ensures correct ordering:

```
elasticsearch (starts, waits for healthy)
       │
       ├──▶ logstash (starts after ES healthy)
       │         │
       │         └──▶ filebeat (starts after logstash)
       │
       ├──▶ kibana (starts after ES healthy)
       │
       └──▶ elk_setup (runs script after ES healthy, then exits)
```

Elasticsearch takes ~60 seconds to become healthy on first start (JVM startup + index loading). The `start_period: 60s` in the health check prevents premature failure.

---

## 10. Useful Elasticsearch API Calls

All examples assume `ELASTIC_PASSWORD` is set in your shell.

```bash
# Cluster health
curl -u elastic:$ELASTIC_PASSWORD http://localhost:9200/_cluster/health?pretty

# List all minibank indices
curl -u elastic:$ELASTIC_PASSWORD http://localhost:9200/_cat/indices/minibank-logs-*?v

# Check ILM policy
curl -u elastic:$ELASTIC_PASSWORD http://localhost:9200/_ilm/policy/minibank-ilm-policy?pretty

# Check ILM status of the active write index
curl -u elastic:$ELASTIC_PASSWORD http://localhost:9200/minibank-logs-*/_ilm/explain?pretty

# See index template
curl -u elastic:$ELASTIC_PASSWORD http://localhost:9200/_index_template/minibank-logs-template?pretty

# Search last 10 error logs
curl -u elastic:$ELASTIC_PASSWORD http://localhost:9200/minibank-logs-*/_search?pretty -H "Content-Type: application/json" -d '{
  "size": 10,
  "sort": [{ "@timestamp": "desc" }],
  "query": { "term": { "log_level": "error" } }
}'

# Manually trigger ILM rollover (useful for testing)
curl -u elastic:$ELASTIC_PASSWORD -X POST http://localhost:9200/minibank-logs/_rollover?pretty
```
