
help:
	@echo "Available commands:"
	@echo "  make up       - Start docker-compose services"
	@echo "  make up-force - Remove conflicting containers, then start"
	@echo "  make down     - Stop docker-compose services"
	@echo "  make restart  - Restart docker-compose services"
	@echo "  make build    - Build docker images"
	@echo "  make logs     - View docker-compose logs"
	@echo "  make clean    - Remove containers and volumes"

up: build
	docker-compose up -d

up-force: build
	-@docker rm -f vault postgres auth_service user_service transition_service blockchain_service nginx
	docker-compose up -d

down:
	docker-compose down

restart: down up

build:
	docker-compose build

logs:
	docker-compose logs -f

clean:
	docker-compose down -v

.PHONY: up up-force down restart logs build clean help
