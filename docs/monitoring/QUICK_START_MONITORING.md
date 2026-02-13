# Quick Reference: Monitoring System

## 🚀 Start Everything

```bash
docker-compose up -d
```

## 🔗 Access Points

| Component | URL | Default Credentials |
|-----------|-----|-------------------|
| **Grafana** | https://localhost:8443/grafana/ | admin / admin123 |
| **Prometheus** | https://localhost:8443/prometheus/ | (none - read-only) |
| **Direct Grafana** | http://localhost:3000 | admin / admin123 |
| **Direct Prometheus** | http://localhost:9090 | (none) |

## 📊 Available Dashboards

1. **System Overview** - Overall health and request patterns
2. **Database Metrics** - PostgreSQL performance
3. **Services Metrics** - Per-service performance breakdown

## 🔍 Service Metrics Endpoints

```bash
# Auth Service
curl http://localhost:3001/metrics

# User Service
curl http://localhost:3002/metrics

# Transition Service
curl http://localhost:3003/metrics

# Blockchain Service
curl http://localhost:3004/metrics

# PostgreSQL
curl http://localhost:9187/metrics

# Prometheus
curl http://localhost:9090/metrics
```

## 📈 Common PromQL Queries

```promql
# Service uptime
up{job="auth_service"}

# Request rate per second
rate(http_requests_total{job="auth_service"}[5m])

# Error rate
rate(http_requests_total{job="auth_service",status=~"5.."}[5m])

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="user_service"}[5m]))

# Database query rate
rate(db_queries_total[5m])

# Active database connections
pg_stat_activity_count

# Error count by type
errors_total
```

## ⚙️ Configuration Files

```
monitoring/
├── prometheus.yml          # Prometheus scrape config
├── alerts.yml              # Alert rules
├── grafana-datasources.yml # Datasource config
├── grafana-dashboards.yml  # Dashboard loader
└── dashboards/
    ├── overview.json       # System overview dashboard
    ├── database.json       # Database dashboard
    └── services.json       # Services dashboard
```

## 🔧 Add Metrics to a Service

```javascript
const { metricsMiddleware, metricsEndpoint, trackDbQuery, recordError } =
  require('../../shared/metrics');

app.use(metricsMiddleware);      // Track HTTP requests
app.get('/metrics', metricsEndpoint);  // Expose metrics

// Track database query
const timer = trackDbQuery('SELECT', 'users');
const result = await db.query('...');
timer.end('success');

// Record an error
recordError('query_failed', 'user_service');
```

## ⚠️ Alert Rules

| Alert | Triggered When | Check |
|-------|---|---|
| ServiceDown | Service unreachable for 1+ min | Prometheus `/targets` |
| HighErrorRate | Error rate > 5% for 5+ min | Service logs |
| HighLatency | P95 response time > 1s for 5+ min | Service performance |
| HighDatabaseConnections | > 80 connections | DB activity |
| SlowDatabase | > 10 slow queries | Query logs |

View active alerts: **Prometheus → Alerts tab**

## 🔐 Security

- ✅ Reverse proxy behind Nginx
- ✅ IP access control (Docker network only)
- ✅ HTTPS/SSL enabled
- ⚠️ Change default credentials immediately!

## 📚 Documentation Files

- **MONITORING.md** - Complete guide (setup, troubleshooting, extension)
- **IMPLEMENTATION_SUMMARY.md** - What was built
- **METRICS_EXAMPLES.js** - Code examples
- **README.md** - Project overview with monitoring section

## ❓ Troubleshooting

**Grafana not loading?**
```bash
docker-compose logs grafana
# Check if port 3000 is accessible
curl http://localhost:3000
```

**No metrics in Prometheus?**
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Manually scrape a service
curl http://auth_service:3001/metrics
```

**Service metrics missing?**
```bash
# Check service is exporting metrics
docker exec auth_service curl localhost:3001/metrics

# Check /metrics endpoint exists
curl http://localhost:3001/metrics | head -20
```

## 📝 Key Files Modified

- ✅ docker-compose.yml - Added Prometheus, Grafana, postgres_exporter
- ✅ app/services/auth/src/auth.js - Added metrics
- ✅ app/services/user/src/user.js - Added metrics
- ✅ app/services/blockchain/src/blockchain.js - Added metrics
- ✅ app/services/transition/src/transition.js - Added metrics
- ✅ app/nginx/sites/default.conf - Added Grafana/Prometheus proxy routes
- ✅ app/services/shared/metrics.js - New metrics module

## 🎯 Next Steps

1. Change Grafana admin password
2. Create custom dashboards as needed
3. Configure alert notifications (email, Slack)
4. Monitor dashboards during application usage
5. Extend with custom business metrics

---

**For detailed information, see [MONITORING.md](./MONITORING.md)**
