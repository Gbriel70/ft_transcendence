# contributions.md

## How this summary was built

This document is based on the Git history of this repository (`git log --all`).
Because some teammates committed with multiple Git identities, contributions are grouped by login with alias aggregation.

Snapshot date: 2026-03-16.

## Identity mapping used

- `fde-alen` -> `Dangerdrive`
- `gcosta-m` -> `Gabriel Costa Matos`, `Gbriel70`, `G3riel.C`
- `gabastos` -> `Gabriel Bastos Sobral`
- `sdavi-al` -> `sdavi-al`

> Note: commit count alone does not fully represent complexity/impact; this file also summarizes module-level impact.

## Contribution summary by teammate

### `fde-alen`

**Main impact areas**
- Documentation and module tracking (`README`, `docs/modules.md`, ELK docs, NGINX docs)
- Monitoring and observability improvements (Prometheus/Grafana/business metrics)
- ELK stack delivery and Kibana reverse-proxy integration via NGINX
- GDPR module and frontend/GDPR fixes

**Representative commits**
- `docs: add NGINX docs, module explanations, and III.3 compliance section in README`
- `feat(elk): add ELK stack for centralised log management`
- `feat(elk): proxy Kibana through nginx and configure basePath`
- `feat(monitoring): add business metrics to auth, user, transaction services`
- `feat(gdpr): implement GDPR compliance module`

### `gcosta-m`

**Main impact areas**
- Blockchain and Hardhat service evolution
- Vault-oriented setup and security integration
- NGINX/WAF organization and security hardening
- User service and register/API iterations

**Representative commits**
- `implement hardhat service`
- `blockchain working`
- `Nginx restructured and organized`
- `create new branch test and configure to use only vault not env`
- `modify register api`

### `gabastos`

**Main impact areas**
- Profile flow fixes and API debugging
- Docker Compose/DNS stability fixes
- NGINX/frontend register flow corrections
- 2FA Authentication

**Representative commits**
- `update to modify profile picture`
- `fixing profile changes`
- `debbuging api`
- `fix error with dns`
- `fix docker compose`

### `sdavi-al`

**Main impact areas**
- Initial frontend foundations for user flows

**Representative commit**
- `dashboard, login and register created`

## Project-level module ownership (commit-derived)

- **Web / Frontend UX:** primarily `sdavi-al`,`fde-alen`, with support from `gabastos` and `gcosta-m`
- **User Management:** primarily `gabastos` and `fde-alen`, with support from `gcosta-m`
- **Cybersecurity (WAF + Vault):** primarily `gcosta-m`, with support from `gabastos` and supporting integration by `fde-alen`
- **DevOps (ELK + Monitoring):** primarily `fde-alen`
- **Blockchain:** primarily `gcosta-m`, with integration support from `fde-alen`
- **GDPR:** primarily `fde-alen`

## Final note

This summary reflects what is visible in commit metadata and messages up to the snapshot date.
If needed, it can be extended with per-file line-change stats (`git blame` / `git log --numstat`) for a deeper quantitative breakdown.
