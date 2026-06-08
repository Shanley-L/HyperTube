DOCKER_COMPOSE = docker compose
NPM = npm

QUIET = 2>/dev/null || true

.PHONY: dev dev-local up stop clean fclean help install re front back

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install:
	@echo "Installing dependencies..."
	@cd frontend && $(NPM) install
	@cd backend && $(NPM) install

up: ## Start full Docker stack (db, jackett, backend, frontend)
	@rm -rf ./backend/downloads/*
	@$(DOCKER_COMPOSE) up -d --build
	@echo "Stack ready: http://localhost:$${FRONTEND_PORT:-5173}"

dev: dev-local ## Local Vite + nodemon with Docker db, jackett, backend

dev-local: ## Hot-reload dev (no frontend container)
	@rm -rf ./backend/downloads/*
	@if [ ! -f backend/package-lock.json ]; then cd backend && $(NPM) install; fi
	@if [ ! -f frontend/package-lock.json ]; then cd frontend && $(NPM) install; fi
	@$(DOCKER_COMPOSE) up -d --build db jackett backend
	@echo "Starting local frontend and backend..."
	@make -j 2 front back

front:
	@cd frontend && $(NPM) run dev

back:
	@cd backend && $(NPM) run dev

stop:
	@echo "Stopping containers..."
	@$(DOCKER_COMPOSE) stop $(QUIET)

clean:
	@echo "Cleaning containers..."
	@$(DOCKER_COMPOSE) stop $(QUIET)
	@$(DOCKER_COMPOSE) down $(QUIET)
	@echo "Containers stopped and removed."

fclean: clean
	@echo "Deep cleaning..."
	@$(DOCKER_COMPOSE) down -v --rmi all $(QUIET)
	@rm -rf frontend/node_modules backend/node_modules
	@rm -f frontend/package-lock.json backend/package-lock.json
	@rm -rf ./backend/downloads/*
	@rm -rf ./backend/subtitles/*
	@echo "Everything has been deleted."

re-dev: fclean dev-local

re: fclean up
