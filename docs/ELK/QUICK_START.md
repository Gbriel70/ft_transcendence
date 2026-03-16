# ELK Stack — Quick Start

## Prerequisites

1. Copy `.env.example` to `.env` and set your password:
   ```bash
   cp .env.example .env
   # Edit .env and set ELASTIC_PASSWORD=your_password
   ```

2. Ensure you have enough memory for Elasticsearch (requires at least ~1.5 GB free RAM):
   ```bash
   # On Linux, check/set vm.max_map_count
   sysctl vm.max_map_count        # should be >= 262144
   sudo sysctl -w vm.max_map_count=262144   # set if needed (temporary)
   ```

---

## Start the full stack

```bash
make up
# or
docker compose up -d
```

ELK services start alongside all other MiniBank services.

---

## Wait for Elasticsearch to be ready (~60 s)

```bash
# Watch until status is yellow or green
watch -n5 'curl -sf -u elastic:${ELASTIC_PASSWORD:-minibank_elastic} http://localhost:9200/_cluster/health | python3 -m json.tool'
```

---

## Open Kibana

| URL | Notes |
|-----|-------|
| https://localhost:8443/kibana/ | Via nginx TLS (recommended) |
| http://localhost:5601/kibana/app/home| Direct (dev only) |

Login: **elastic** / **`ELASTIC_PASSWORD`**

---

## View logs in Discover

1. Open Kibana → **Discover**
2. Select index pattern **`minibank-logs-*`** (auto-created by `elk_setup`)
3. Set time range to **Last 15 minutes**
4. Logs from all MiniBank containers appear in real time

### Useful quick filters

| Filter | KQL query |
|--------|-----------|
| Only errors | `log_level: error` |
| Auth service only | `service_name: auth_service` |
| Nginx 5xx responses | `response_code >= 500` |
| Specific user | `app.userId: 42` |
| Exclude health checks | `NOT message: "GET /health"` |

---

## Verify ILM policy is active

```bash
curl -sf -u elastic:${ELASTIC_PASSWORD:-minibank_elastic} \
  http://localhost:9200/minibank-logs-*/_ilm/explain?pretty | grep -E '"phase"|"action"|"index"'
```

You should see `"phase": "hot"` for the current write index.

---

## Stop ELK only (keep other services running)

```bash
docker compose stop elasticsearch logstash kibana filebeat elk_setup
```

## Remove ELK data volume (full reset)

```bash
docker compose down
docker volume rm 2_elk_data   # prefix may vary based on your project folder name
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Elasticsearch exits immediately | `vm.max_map_count` too low | `sudo sysctl -w vm.max_map_count=262144` |
| Kibana shows "Kibana server is not ready yet" | ES still starting | Wait ~90 s and refresh |
| No logs appearing in Discover | Filebeat or Logstash not running | `docker compose logs filebeat logstash` |
| `elk_setup` exits with error | ES not healthy when script ran | `docker compose restart elk_setup` |
| Authentication error in Logstash logs | Wrong `ELASTIC_PASSWORD` | Check `.env` file and restart: `docker compose restart logstash` |

```bash
# Check all ELK container statuses
docker compose ps elasticsearch logstash kibana filebeat elk_setup

# Follow logs for a specific component
docker compose logs -f elasticsearch
docker compose logs -f logstash
docker compose logs -f filebeat
```
