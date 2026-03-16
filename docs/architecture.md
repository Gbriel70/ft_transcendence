# ft_transcendence Architecture

## Current Architecture (as implemented)

```mermaid
flowchart LR
    U[User Browser] -->|HTTPS 8443| NGINX[NGINX + ModSecurity WAF]
    U -->|HTTP 8080 (dev)| NGINX

    subgraph APP[Core Microservices]
      AUTH[auth_service :3001]
      USER[user_service :3002]
      TX[transaction_service :3003]
      BC[blockchain_service :3004]
    end

    NGINX --> AUTH
    NGINX --> USER
    NGINX --> TX
    NGINX --> BC

    AUTH <--> USER
    USER --> BC

    subgraph DATA[Data & Secrets]
      PG[(PostgreSQL)]
      VAULT[HashiCorp Vault]
      UPLOADS[(Uploads Volume)]
    end

    AUTH --> PG
    USER --> PG
    TX --> PG
    AUTH --> VAULT
    USER --> VAULT
    TX --> VAULT
    BC --> VAULT
    USER --> UPLOADS

    subgraph CHAIN[Blockchain Layer]
      HH[Hardhat Node :8545]
      SC[MiniBank.sol]
    end

    BC --> HH
    HH --> SC

    subgraph OBS[Monitoring]
      PROM[Prometheus]
      GRAF[Grafana]
      ALERT[Alertmanager]
      NEXP[node_exporter]
      CADV[cAdvisor]
      NEXP2[nginx_exporter]
      PEXP[postgres_exporter]
    end

    PROM --> GRAF
    PROM --> ALERT
    NEXP --> PROM
    CADV --> PROM
    NEXP2 --> PROM
    PEXP --> PROM

    subgraph LOGS[Logging / ELK]
      FB[filebeat]
      LS[logstash]
      ES[elasticsearch]
      KIB[Kibana]
    end

    FB --> LS --> ES --> KIB

    NGINX -.logs.-> FB
    AUTH -.logs.-> FB
    USER -.logs.-> FB
    TX -.logs.-> FB
    BC -.logs.-> FB
```

## Better Tooling Recommendations

| Area | Current | Recommended Tool(s) | Why it improves architecture | Priority |
|---|---|---|---|---|
| API routing & security | NGINX + static config | **Kong Gateway** or **Traefik** (keep ModSecurity/NAXSI where needed) | Better service discovery, rate-limit/auth plugins, simpler multi-service routing at scale | High |
| Service-to-service resilience | Mostly synchronous REST | **NATS** or **RabbitMQ** | Decouples services, enables retries/queues, prevents cascade failures | High |
| Observability (traces) | Metrics + logs only | **OpenTelemetry + Jaeger** (or Grafana Tempo) | Adds distributed tracing to debug latency across auth/user/transaction/blockchain | High |
| Log pipeline efficiency | Filebeat + Logstash + ES | **Vector** (replacing Filebeat/Logstash) | Lower resource usage, simpler config, faster pipeline maintenance | Medium |
| Vulnerability scanning | Manual/implicit | **Trivy** (+ CI gate) | Finds image/dependency CVEs before deploy; strong DevSecOps baseline | High |
| Runtime policy/security | Basic container isolation | **Falco** | Detects suspicious runtime behavior in containers | Medium |
| Local K8s evolution path | Docker Compose only | **k3d** or **kind** (optional) | Prepares migration path to production-style orchestration without full cloud infra | Low |

## Practical Next 3 Upgrades (best ROI)

1. **Add OpenTelemetry + Jaeger** for end-to-end request tracing.
2. **Add Trivy in CI** for container and dependency scans.
3. **Introduce NATS** for async events (e.g., transaction created, GDPR request queued).

## Security note to apply now

- Avoid exposing Grafana directly on host `3000`; route it only through NGINX HTTPS with auth/IP allowlist.
