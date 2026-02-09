# Variables
DOCKER_COMPOSE = docker compose
NPM = npm

.PHONY: dev up stop dev-front dev-back clean fclean help install re

# Default goal when you just type 'make'
help: ## Display this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# --- INITIALIZATION ---

install: ## Install dependencies for both frontend and backend
	@echo "📦 Installing dependencies..."
	cd frontend && $(NPM) install
	cd backend && $(NPM) install

# --- EXECUTION ---

dev: up ## Start Docker and both dev servers in parallel
	@echo "🚀 Starting development environment..."
	make -j 2 dev-front dev-back

up: ## Start Docker containers (builds if necessary)
	@echo "🐳 Ensuring lockfiles exist for Docker build..."
	@if [ ! -f backend/package-lock.json ]; then cd backend && $(NPM) install; fi
	@if [ ! -f frontend/package-lock.json ]; then cd frontend && $(NPM) install; fi
	$(DOCKER_COMPOSE) up -d --build

dev-front: ## Launch frontend dev server
	cd frontend && $(NPM) run dev

dev-back: ## Launch backend dev server
	cd backend && $(NPM) run dev

stop: ## Stop Docker containers without removing them
	$(DOCKER_COMPOSE) stop

# --- CLEANING ---

clean: stop ## Stop and remove Docker containers
	$(DOCKER_COMPOSE) down
	@echo "🧹 Containers stopped and removed."

fclean: clean ## Full clean: Remove Docker volumes, images, and node_modules
	$(DOCKER_COMPOSE) down -v --rmi all
	rm -rf frontend/node_modules backend/node_modules
	rm -f frontend/package-lock.json backend/package-lock.json
	@echo "🗑️  Everything has been deleted (containers, images, volumes, node_modules)."

re: fclean dev ## Reinstall and restart everything from scratch