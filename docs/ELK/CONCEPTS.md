# ELK Stack — Core Concepts

A plain-language explanation of what Elasticsearch, Logstash, and Kibana are and how they work.

---

## Elasticsearch

### What is it?
Elasticsearch is a **search and analytics engine** built on top of Apache Lucene.  
It stores data as JSON documents and makes them instantly searchable — even across billions of records.

In the ELK stack, Elasticsearch is the **database**. All logs end up here.

### Key concepts

| Concept | What it means |
|---------|--------------|
| **Document** | A single JSON record — e.g., one log line from one container |
| **Index** | A collection of documents, like a table in SQL. In this project: `minibank-logs-000001` |
| **Shard** | An index is split into shards (sub-units) for performance. We use 1 shard (single-node). |
| **Mapping** | The schema — defines the type of each field (`keyword`, `text`, `integer`, `date`, etc.) |
| **Alias** | A named pointer to one or more indices. `minibank-logs` always points to the current write index. |
| **ILM** | Index Lifecycle Management — automatically rolls over, shrinks, and deletes indices by age/size |

### How it stores logs
Every log event is stored as a document like this:

```json
{
  "@timestamp": "2026-03-08T14:32:01.000Z",
  "service_name": "auth_service",
  "log_level": "error",
  "log_message": "Invalid password for user 42",
  "client_ip": "192.168.1.10",
  "response_code": 401
}
```

### How search works
Elasticsearch builds an **inverted index** — like the index at the back of a book.  
For every unique word in every field, it stores a list of which documents contain that word.  
This lets it answer queries like "find all documents where `log_level` is `error`" in milliseconds, even across millions of records.

**Text** fields (`message`, `log_message`) are tokenised and support full-text search.  
**Keyword** fields (`service_name`, `log_level`) are stored as-is and support exact matching and aggregations.

### Query language
Elasticsearch accepts queries as JSON via its REST API:

```bash
# Find all errors from auth_service in the last hour
curl -u elastic:$ELASTIC_PASSWORD http://localhost:9200/minibank-logs-*/_search -d '{
  "query": {
    "bool": {
      "must": [
        { "term":  { "log_level":    "error"        } },
        { "term":  { "service_name": "auth_service"  } },
        { "range": { "@timestamp":   { "gte": "now-1h" } } }
      ]
    }
  }
}'
```

Kibana provides a simpler query language called **KQL** (Kibana Query Language) on top of this.

---

## Logstash

### What is it?
Logstash is a **data processing pipeline**. It receives events from one or more inputs, transforms them through a series of filters, and sends the results to one or more outputs.

Think of it as an **ETL** (Extract → Transform → Load) engine for log data.

### Pipeline structure

Every Logstash configuration has three sections:

```
input  { ... }   ← WHERE logs come from
filter { ... }   ← WHAT to do with them
output { ... }   ← WHERE to send the results
```

In this project the pipeline is in [`app/services/monitoring/logstash/pipeline/minibank.conf`](../../app/services/monitoring/logstash/pipeline/minibank.conf).

### Input — Beats
```
input {
  beats { port => 5044 }
}
```
Logstash listens on port 5044 using the **Beats protocol** — a lightweight binary protocol designed for high-throughput log shipping. Filebeat connects here.

### Filter — what we do with each log event

| Step | What it does |
|------|-------------|
| **Drop noise** | Health-check and metrics requests are discarded immediately |
| **JSON parse** | Node.js services emit JSON-formatted logs; the `json` filter parses the `message` field and extracts structured fields (`level`, `msg`, `err`) |
| **Grok** | Nginx access log lines are parsed using a regex pattern (grok) to extract `client_ip`, `http_method`, `response_code`, etc. |
| **Date** | The `@timestamp` field is set from the application's own timestamp when available, ensuring correct time ordering |
| **Mutate** | Fields are renamed, converted, or removed. Noisy metadata (`agent`, `ecs`, `input`) is stripped. |

### Output — Elasticsearch
```
output {
  elasticsearch {
    hosts    => ["http://elasticsearch:9200"]
    user     => "elastic"
    password => "${ELASTIC_PASSWORD}"
    ilm_enabled        => true
    ilm_rollover_alias => "minibank-logs"
    ilm_policy         => "minibank-ilm-policy"
  }
}
```
Logstash writes each processed event to Elasticsearch using the ILM alias, so it automatically goes to the correct rolling index.

### Why not send logs directly from services to Elasticsearch?
- **Decoupling** — if Elasticsearch is temporarily unavailable, Logstash buffers events in memory and retries
- **Centralised transformation** — parsing/enrichment logic lives in one place, not in every service
- **Protocol translation** — services don't need to speak the Elasticsearch bulk API; they just emit logs normally

---

## Kibana

### What is it?
Kibana is the **web UI** for Elasticsearch. It provides tools to search, visualise, and monitor the data stored in Elasticsearch.

In this project, Kibana is the window through which you read all MiniBank logs.

### Main features used

#### Discover
The primary log viewer. You can:
- Select an **index pattern** (`minibank-logs-*`) to choose which data to explore
- Set a **time range** (last 15 min, last 24 h, custom)
- Type **KQL queries** to filter logs (e.g., `log_level: error AND service_name: auth_service`)
- See each document's fields expanded
- Download results as CSV

#### KQL — Kibana Query Language
A simplified human-readable query syntax that compiles to Elasticsearch DSL behind the scenes.

```
# Examples
log_level: error                          → exact match on keyword field
message: "connection refused"            → phrase match on text field
response_code >= 500                     → numeric range
service_name: auth_service OR user_service  → OR condition
NOT message: "health"                    → negation
@timestamp > "2026-03-08T00:00:00"      → time filter
```

#### Visualize
Build charts from log data:
- **Bar/line charts** — log volume over time, grouped by `service_name`
- **Pie charts** — proportion of `log_level` values
- **Data tables** — top error messages ranked by count
- **Metric panels** — single number (e.g., total errors in last hour)

#### Dashboard
A canvas where you arrange multiple Visualize panels into a single view.  
Useful for building an "ELK log overview" dashboard combining nginx status codes, error rates per service, and top log messages.

#### Stack Management → Index Lifecycle Policies
Where you can inspect and edit the `minibank-ilm-policy` retention rules — change rollover age, adjust delete phase, etc. — without touching config files.

### Index pattern
Before you can use Discover or Visualize, Kibana needs to know which Elasticsearch indices to query. An **index pattern** (`minibank-logs-*`) maps to all indices matching that wildcard.

The `elk_setup` container creates this pattern automatically on first start.

---

## How the three pieces fit together

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   Services emit logs                                                 │
│   (stdout/stderr → Docker)                                           │
│           │                                                          │
│           ▼                                                          │
│       Filebeat                                                       │
│   reads container log files,                                        │
│   attaches Docker metadata                                          │
│           │                                                          │
│           │  Beats protocol (port 5044)                              │
│           ▼                                                          │
│       Logstash                                                       │
│   parses JSON / grok nginx / classifies level / cleans fields       │
│           │                                                          │
│           │  Elasticsearch bulk API (HTTP)                           │
│           ▼                                                          │
│     Elasticsearch                                                    │
│   indexes documents into minibank-logs-* rolling indices            │
│   ILM ages and deletes indices automatically                        │
│           │                                                          │
│           │  Elasticsearch REST API (HTTP)                           │
│           ▼                                                          │
│        Kibana                                                        │
│   you search, filter, and visualise logs                            │
│   login required (elastic user)                                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

Each component has a single responsibility:  
**Elasticsearch** = store. **Logstash** = transform. **Kibana** = visualise.
