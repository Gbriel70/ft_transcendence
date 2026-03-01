
.DEFAULT_GOAL := all

# ── Colours ───────────────────────────────────────────────────────────────────
BOLD  := \033[1m
RESET := \033[0m
GREEN := \033[32m
CYAN  := \033[36m

# ── Helpers ───────────────────────────────────────────────────────────────────
DC := docker compose

# ══════════════════════════════════════════════════════════════════════════════
#  make  ──  gera/atualiza certificados SSL, build e sobe tudo
# ══════════════════════════════════════════════════════════════════════════════
all: certs build up

certs:
	@echo "$(CYAN)$(BOLD)[SSL] Configurando certificados...$(RESET)"
	@chmod +x scripts/setup-certs.sh
	@bash scripts/setup-certs.sh

build:
	@echo "$(CYAN)$(BOLD)[Docker] Buildando imagens...$(RESET)"
	$(DC) build

up: cleanup-stopped
	@echo "$(CYAN)$(BOLD)[Docker] Subindo serviços...$(RESET)"
	$(DC) up -d --remove-orphans
	@echo "$(GREEN)$(BOLD)[OK] Projeto rodando em https://localhost:8443$(RESET)"

# ══════════════════════════════════════════════════════════════════════════════
#  make re  ──  destrói tudo (volumes inclusos), rebuilda e sobe do zero
# ══════════════════════════════════════════════════════════════════════════════
re: down-hard build up

# ══════════════════════════════════════════════════════════════════════════════
#  make clean  ──  para e remove containers + volumes
# ══════════════════════════════════════════════════════════════════════════════
clean: down-hard

# ── Internos ──────────────────────────────────────────────────────────────────
cleanup-stopped:
	@echo "$(CYAN)$(BOLD)[Docker] Limpando containers parados...$(RESET)"
	@docker ps -a --format "table {{.Names}}" | grep -E "vault|postgres|auth_service|user_service|transaction_service|blockchain_service|nginx|prometheus|alertmanager|grafana|node_exporter|cadvisor|nginx_exporter" | while read container; do \
		if [ ! -z "$$container" ]; then docker rm -f $$container 2>/dev/null || true; fi; \
	done || true

down:
	@echo "$(CYAN)$(BOLD)[Docker] Parando serviços...$(RESET)"
	$(DC) down

down-hard:
	@echo "$(CYAN)$(BOLD)[Docker] Removendo containers e volumes...$(RESET)"
	$(DC) down -v --remove-orphans
	docker volume prune -f

logs:
	$(DC) logs -f

ps:
	$(DC) ps

# ── Ajuda ─────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "$(BOLD)Uso:$(RESET)"
	@echo "  make          Gera certificados SSL, faz build e sobe o projeto"
	@echo "  make re       Destrói tudo (volumes) e sobe do zero"
	@echo "  make clean    Para e remove containers + volumes"
	@echo "  make down     Apenas para os containers (mantém volumes)"
	@echo "  make logs     Acompanha os logs em tempo real"
	@echo "  make ps       Lista o status dos serviços"
	@echo ""

.PHONY: all certs build up down down-hard re clean logs ps help
