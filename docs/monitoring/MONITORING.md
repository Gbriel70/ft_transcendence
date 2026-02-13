# MiniBank Monitoring System - Documentation

## Overview

This project includes a comprehensive monitoring system using **Prometheus** and **Grafana** to collect, store, and visualize metrics from all microservices, the PostgreSQL database, and the API Gateway.

## Architecture

```
┌─────────────────────────────────────────┐
│     MicroServices (with prom-client)    │
│  - Auth Service (:3001)                 │
│  - User Service (:3002)                 │
│  - Transition Service (:3003)           │
│  - Blockchain Service (:3004)           │
└──────────────┬──────────────────────────┘
               │ /metrics endpoint
               ▼
┌─────────────────────────────────────────┐
│   Prometheus (:9090)                    │
│   - Scrapes all services every 10s      │
│   - 15-day retention                    │
│   - Alert rules evaluation              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Grafana (:3000 via /grafana on Nginx) │
│   - 3 Pre-built Dashboards              │
│   - Admin credentials (see .env)        │
│   - Restricted access via Nginx         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   PostgreSQL Exporter (:9187)           │
│   - Database connection metrics         │
│   - Query performance stats             │
└─────────────────────────────────────────┘
```

## Quick Start

### 1. Start All Services

```bash
docker-compose up -d
```

### 2. Access Grafana Dashboard

**Via Nginx (Recommended - Secure):**
```
https://localhost:8443/grafana/
```

**Direct Access:**
```
http://localhost:3000
```

**Default Credentials:**
- Username: `admin`
- Password: `admin123` (set in docker-compose.yml)

### 3. Access Prometheus

**Via Nginx:**
```
https://localhost:8443/prometheus/
```

**Direct:**
```
http://localhost:9090
```

## Metrics Collected

### Per-Service Metrics (from prom-client)

Each microservice exposes metrics at `/metrics` endpoint:

- **HTTP Request Metrics**
  - `http_requests_total` - Total requests by method, route, status
  - `http_request_duration_seconds` - Response time histogram (p50, p95, p99)
  - `http_requests_in_progress` - Currently processing requests

- **Database Metrics**
  - `db_queries_total` - Total queries by operation type and table
  - `db_query_duration_seconds` - Query execution time histogram
  - `db_connections_active` - Active database connections

- **Error Metrics**
  - `errors_total` - Total errors by type and service
  - `errors_by_status_code` - HTTP error breakdown

- **Node.js Runtime Metrics** (automatic)
  - `process_cpu_usage_seconds_total`
  - `process_memory_usage_bytes`
  - `nodejs_heap_size_total_bytes`

### PostgreSQL Metrics (from postgres_exporter)

- `pg_stat_activity_count` - Current active connections
- `pg_database_size_bytes` - Database disk usage
- `pg_stat_statements_mean_exec_time` - Average query execution time
- `pg_stat_statements_calls` - Query execution count
- `pg_stat_statements_total_time` - Total time spent in queries

### Prometheus Self-Metrics

- `up` - Service availability (1 = up, 0 = down)
- `scrape_duration_seconds` - Scraping duration

## Pre-built Dashboards

### 1. System Overview Dashboard
**UID: `minibank-overview`**

Shows:
- Service status (all services up/down)
- Request rate over time (requests/sec)
- Response time P95 by service
- Error rate (5xx responses) over time

### 2. Database Metrics Dashboard
**UID: `minibank-db`**

Shows:
- Active PostgreSQL connections
- Database query duration (P95)
- Query execution rate
- Database size over time

### 3. Services Metrics Dashboard
**UID: `minibank-services`**

Shows:
- Per-service request rate
- Per-service response time (P95)
- Per-service error rate
- Detailed error breakdowns

## Alert Rules

Prometheus continuously evaluates alert rules defined in `monitoring/alerts.yml`:

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| ServiceDown | Service unreachable for 1 min | **CRITICAL** | Service is down |
| HighErrorRate | Error rate > 5% for 5 min | **WARNING** | Investigate errors |
| HighLatency | P95 response time > 1s for 5 min | **WARNING** | Performance degradation |
| HighDatabaseConnections | Active connections > 80 | **WARNING** | DB connection pool nearly full |
| SlowDatabase | > 10 slow queries in 5 min | **WARNING** | Database performance issue |

**Alert Status:** Check Prometheus at `/alerts` endpoint or in Grafana.

## Configuration Files

### Prometheus Configuration
- **File:** `monitoring/prometheus.yml`
- **Scrape Interval:** 15 seconds (global), 10 seconds for services
- **Retention:** 15 days of data
- **Alert Rules:** `monitoring/alerts.yml`

```yaml
scrape_configs:
  - job_name: 'auth_service'
    targets: ['auth_service:3001']
    metrics_path: '/metrics'
  # ... other services
```

### Grafana Provisioning
- **Datasources:** `monitoring/grafana-datasources.yml`
  - Automatically configures Prometheus as default datasource
- **Dashboards:** `monitoring/grafana-dashboards.yml`
  - Auto-loads JSON dashboards from `monitoring/dashboards/` directory

### Grafana Security
- **Admin User:** `admin`
- **Password:** Set via `GF_SECURITY_ADMIN_PASSWORD` env var
- **Sign-up Disabled:** `GF_USERS_ALLOW_SIGN_UP=false`
- **Reverse Proxy:** Behind Nginx with IP-based access control
- **HTTPS:** Via self-signed SSL certificate

## Access Control

### Grafana Access (via Nginx)

- **Allowed:** Localhost (127.0.0.1) and Docker network (172.17.0.0/16)
- **Denied:** All other IPs
- **URL:** `https://localhost:8443/grafana/`
- **WAF:** ModSecurity disabled for monitoring traffic

### Prometheus Access (via Nginx)

- **Allowed:** Localhost and Docker network
- **Denied:** All other IPs
- **URL:** `https://localhost:8443/prometheus/`

### Change Default Password

1. Access Grafana
2. Go to **Configuration** → **Users**
3. Click on `admin` user
4. Change password

Alternatively, in docker-compose.yml:
```yaml
environment:
  GF_SECURITY_ADMIN_PASSWORD: your_new_password
```

## Adding Custom Metrics to Services

### In Node.js Services

Import the metrics module in your service:

```javascript
const {
  metricsMiddleware,
  metricsEndpoint,
  trackDbQuery,
  recordError
} = require('../../shared/metrics');

// Add middleware to track HTTP requests
app.use(metricsMiddleware);

// Add metrics endpoint
app.get('/metrics', metricsEndpoint);

// Track database queries
try {
  const timer = trackDbQuery('SELECT', 'users');
  const result = await db.query('SELECT * FROM users');
  timer.end('success');
} catch (error) {
  timer.end('failure');
  recordError('query_failed', 'user_service');
}
```

### Metrics Module (`app/services/shared/metrics.js`)

Exports:
- `metricsMiddleware` - Tracks HTTP requests/responses
- `metricsEndpoint` - Serves Prometheus-format metrics
- `trackDbQuery(operation, table)` - Histogram timer for DB queries
- `recordError(errorType, service)` - Error counter

## Troubleshooting

### Services not appearing in Prometheus

1. Check service is running: `docker-compose ps`
2. Verify `/metrics` endpoint exists:
   ```bash
   curl http://localhost:3001/metrics
   ```
3. Check Prometheus scrape targets: `http://localhost:9090/targets`

### Grafana not accessible via Nginx

1. Check Nginx is running: `docker-compose logs nginx`
2. Test direct access: `http://localhost:3000`
3. Verify IP is in allowed range (172.17.0.0/16)

### No data in Grafana

1. Check Prometheus has scraped metrics: `http://localhost:9090/graph`
2. Execute a PromQL query manually: `up` or `http_requests_total`
3. Wait 10+ seconds for first scrape

### Database exporter not working

1. Check postgres_exporter container: `docker-compose logs postgres_exporter`
2. Verify database credentials in docker-compose.yml
3. Test connection: `docker exec postgres_exporter curl localhost:9187/metrics`

## Extending the Monitoring

### Add New Dashboard

1. Create JSON dashboard in Grafana UI
2. Export as JSON via **Dashboard menu** → **Share** → **Export**
3. Save to `monitoring/dashboards/your-dashboard.json`
4. Restart Grafana: `docker-compose restart grafana`

### Add New Alert Rule

Edit `monitoring/alerts.yml`:

```yaml
- alert: CustomAlert
  expr: your_metric > threshold
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Alert summary"
    description: "Alert description"
```

Restart Prometheus: `docker-compose restart prometheus`

### Enable Alertmanager Integration

Uncomment in `docker-compose.yml` to add Alertmanager service and enable email/Slack notifications.

## Performance Considerations

- **Prometheus scrape interval:** 15 seconds (adjustable in prometheus.yml)
- **Data retention:** 15 days (adjust with `--storage.tsdb.retention.time`)
- **Storage size:** ~1GB per million metrics/day
- **Grafana dashboard refresh:** 10 seconds (configurable per dashboard)

## Security Best Practices

✅ **Implemented:**
- Reverse proxy through Nginx with IP-based access control
- HTTPS/SSL encryption for traffic
- Default credentials (change immediately in production)
- WAF disabled for monitoring (lower risk)

⚠️ **For Production:**
- Use strong admin passwords
- Implement RBAC (Role-Based Access Control) in Grafana
- Consider authentication proxy (OAuth2, LDAP)
- Monitor who accesses dashboards via audit logs
- Move to restricted subnet or VPN for monitoring access
- Use persistent volumes with backups for Grafana/Prometheus data
- Implement TLS certificates from trusted CA (not self-signed)

## References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/grafana/)
- [prom-client Library](https://github.com/siimon/prom-client)
- [Prometheus Best Practices](https://prometheus.io/docs/practices/)

---

**Last Updated:** February 2, 2026
