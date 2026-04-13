#!/bin/bash
# ─── ELK bootstrap: ILM policy + index template + Kibana index pattern ─────────
# Run once after Elasticsearch and Kibana are healthy.
set -euo pipefail

ES_URL="http://elasticsearch:9200"
KIBANA_URL="http://kibana:5601"
ES_USER="elastic"
ES_PASS="${ELASTIC_PASSWORD:-}"

if [ -z "${ES_PASS}" ]; then
  echo "[setup-elk] ELASTIC_PASSWORD is empty. Vault bootstrap did not inject credentials."
  exit 1
fi

AUTH="-u ${ES_USER}:${ES_PASS}"

# ── 1. Wait for Elasticsearch ──────────────────────────────────────────────────
echo "[setup-elk] Waiting for Elasticsearch at ${ES_URL}..."
ES_RETRIES=0
until curl -sf ${AUTH} "${ES_URL}/_cluster/health?wait_for_status=yellow&timeout=10s" > /dev/null 2>&1; do
  ES_RETRIES=$((ES_RETRIES + 1))
  if [ $ES_RETRIES -gt 30 ]; then
    echo "[setup-elk] ERROR: Elasticsearch did not become ready in time."
    exit 1
  fi
  echo "[setup-elk]  ... not ready yet, retrying in 5s (attempt ${ES_RETRIES}/30)"
  sleep 5
done
echo "[setup-elk] Elasticsearch is ready!"

# ── 2. ILM policy ─────────────────────────────────────────────────────────────
echo "[setup-elk] Creating ILM policy 'minibank-ilm-policy'..."
curl -sf ${AUTH} -X PUT "${ES_URL}/_ilm/policy/minibank-ilm-policy" \
  -H "Content-Type: application/json" -d '
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age":  "7d",
            "max_size": "10gb"
          },
          "set_priority": { "priority": 100 }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink":     { "number_of_shards": 1 },
          "forcemerge": { "max_num_segments": 1 },
          "set_priority": { "priority": 50 }
        }
      },
      "cold": {
        "min_age": "15d",
        "actions": {
          "freeze": {},
          "set_priority": { "priority": 0 }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}'
echo " ✓ ILM policy created."

# ── 3. Index template ──────────────────────────────────────────────────────────
echo "[setup-elk] Creating index template 'minibank-logs-template'..."
curl -sf ${AUTH} -X PUT "${ES_URL}/_index_template/minibank-logs-template" \
  -H "Content-Type: application/json" -d '
{
  "index_patterns": ["minibank-logs-*"],
  "template": {
    "settings": {
      "number_of_shards":   1,
      "number_of_replicas": 0,
      "index.lifecycle.name":             "minibank-ilm-policy",
      "index.lifecycle.rollover_alias":   "minibank-logs",
      "index.refresh_interval":           "5s"
    },
    "mappings": {
      "properties": {
        "@timestamp":    { "type": "date" },
        "service_name":  { "type": "keyword" },
        "log_level":     { "type": "keyword" },
        "log_message":   { "type": "text" },
        "error_message": { "type": "text" },
        "message":       { "type": "text" },
        "client_ip":     { "type": "ip",      "ignore_malformed": true },
        "response_code": { "type": "integer" },
        "bytes_sent":    { "type": "integer" },
        "http_method":   { "type": "keyword" },
        "request_uri":   { "type": "keyword" }
      }
    }
  }
}'
echo " ✓ Index template created."

# ── 4. Bootstrap write index with alias ───────────────────────────────────────
echo "[setup-elk] Bootstrapping initial write index 'minibank-logs-000001'..."
curl -sf ${AUTH} -X PUT "${ES_URL}/minibank-logs-000001" \
  -H "Content-Type: application/json" -d '
{
  "aliases": {
    "minibank-logs": {
      "is_write_index": true
    }
  }
}' 2>/dev/null && echo " ✓ Write index created." || echo " ✓ Index already exists (OK)."

# Verify the alias
echo "[setup-elk] Verifying alias configuration..."
ALIAS_CHECK=$(curl -sf ${AUTH} "${ES_URL}/_alias/minibank-logs" 2>/dev/null)
if echo "$ALIAS_CHECK" | grep -q '"minibank-logs"'; then
  echo " ✓ Alias 'minibank-logs' is correctly configured."
else
  echo " ⚠ WARNING: Alias may not be properly set. Response: $ALIAS_CHECK"
fi

# ── 5. Wait for Kibana and register index pattern ─────────────────────────────
echo "[setup-elk] Waiting for Kibana at ${KIBANA_URL}..."
KIBANA_RETRIES=0
# Wait up to 10 minutes (120 x 5s) for Kibana — it needs Vault + ES before starting
until curl -sf -u "${ES_USER}:${ES_PASS}" "${KIBANA_URL}/kibana/api/status" 2>/dev/null | grep -q '"level":"available"'; do
  KIBANA_RETRIES=$((KIBANA_RETRIES + 1))
  if [ $KIBANA_RETRIES -gt 120 ]; then
    echo "[setup-elk] ERROR: Kibana did not become ready after 10 minutes."
    echo "[setup-elk] Index pattern will NOT be registered. Restart elk_setup manually."
    exit 1
  fi
  echo "[setup-elk]  ... Kibana not ready yet, retrying in 5s (attempt ${KIBANA_RETRIES}/120)"
  sleep 5
done
echo "[setup-elk] Kibana is ready!"

echo "[setup-elk] Creating Kibana index pattern 'minibank-logs-*'..."
PATTERN_RESPONSE=$(curl -sf -u "${ES_USER}:${ES_PASS}" -X POST "${KIBANA_URL}/kibana/api/saved_objects/index-pattern/minibank-logs" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{
    "attributes": {
      "title":        "minibank-logs-*",
      "timeFieldName": "@timestamp"
    }
  }' 2>&1)

if echo "$PATTERN_RESPONSE" | grep -q '"id"'; then
  echo " ✓ Index pattern created successfully."
elif echo "$PATTERN_RESPONSE" | grep -q 'already exists'; then
  echo " ✓ Index pattern already exists (OK)."
else
  echo " ⚠ Index pattern creation failed: $PATTERN_RESPONSE"
  exit 1
fi

# ── 6. Set default index pattern in Kibana ────────────────────────────────────
echo "[setup-elk] Setting default index pattern..."
DEFAULT_RESPONSE=$(curl -sf -u "${ES_USER}:${ES_PASS}" -X POST "${KIBANA_URL}/kibana/api/kibana/settings" \
  -H "Content-Type: application/json" \
  -H "kbn-xsrf: true" \
  -d '{"changes": {"defaultIndex": "minibank-logs"}}' 2>&1)

if echo "$DEFAULT_RESPONSE" | grep -q 'defaultIndex'; then
  echo " ✓ Default index pattern set."
else
  echo " ⚠ Could not set default index pattern: $DEFAULT_RESPONSE"
fi

echo ""
echo "[setup-elk] ========================================================"
echo "[setup-elk]  ELK bootstrap complete!"
echo "[setup-elk]  Kibana:        ${KIBANA_URL}  (login: elastic / \${ELASTIC_PASSWORD})"
echo "[setup-elk]  Elasticsearch: ${ES_URL}"
echo "[setup-elk] ========================================================"
