# Docker in the project

## Why we use Docker

We use Docker to run the full platform with a predictable and reproducible environment.

Main reasons:
- same runtime behavior across machines
- isolated services with explicit dependencies
- easier local setup for all modules
- consistent networking, volumes, and health checks

In short, Docker gives us stable infrastructure for development and integration.

## How it works in this project

The project is orchestrated with a single compose file that starts all required services.

Core runtime groups:
- security and gateway
- business services
- data and secret management
- observability stack

All containers join the same internal network and communicate by service name.

## Startup model

1. Infrastructure services start first (secret management, database, local chain node).
2. Business services wait for dependencies to become healthy.
3. Gateway starts after backend services are available.
4. Monitoring stack scrapes metrics from running components.

This dependency chain reduces startup race conditions and improves boot reliability.

## Configuration and persistence

- environment variables define runtime configuration per service
- shared volumes persist important data (database data, secrets, logs, artifacts)
- read-only mounts are used where mutation is not required

## Health and resilience

- critical services define health checks
- service startup uses dependency conditions based on readiness
- restart policies keep containers running after transient failures

## Daily workflow

Common project workflow is:
1. Build images.
2. Start services in detached mode.
3. Follow logs for validation.
4. Rebuild and recreate when required.

The Makefile wraps these operations to keep commands simple and consistent for the team.

## Operational result

In this project, Docker is the execution backbone. It standardizes environment setup, enforces service boundaries, and makes the multi-service platform runnable with a single orchestrated flow.

## Important files

- `docker-compose.yml` (full orchestration and dependencies)
- `Makefile` (standard build, up, clean, and logs workflow)
- `scripts/init-db.sh` (database bootstrap)
- `app/vault/init-vault.sh` (secret management bootstrap)
- `app/nginx/dockerfile` (gateway image build)
