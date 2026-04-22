DOCKER_COMPOSE = docker compose
NPM = npm

# Helper to suppress podman/docker noise
QUIET = 2>/dev/null || true

.PHONY: dev up stop clean fclean help install re front back

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install:
	@echo "📦 Installing dependencies..."
	@cd frontend && $(NPM) install
	@cd backend && $(NPM) install

dev: up
	@echo "🚀 Starting development environment..."
	@make -j 2 front back

up:
	@rm -rf ./backend/downloads/*
	@echo "🐳 Ensuring lockfiles exist for Docker build..."
	@if [ ! -f backend/package-lock.json ]; then cd backend && $(NPM) install; fi
	@if [ ! -f frontend/package-lock.json ]; then cd frontend && $(NPM) install; fi
	@$(DOCKER_COMPOSE) up -d --build
	
front:
	@cd frontend && $(NPM) run dev

back:
	@cd backend && $(NPM) run dev

stop:
	@echo "🛑 Stopping containers..."
	@$(DOCKER_COMPOSE) stop $(QUIET)

clean:
	@echo "🧹 Cleaning containers..."
	@$(DOCKER_COMPOSE) stop $(QUIET)
	@$(DOCKER_COMPOSE) down $(QUIET)
	@echo "✅ Containers stopped and removed."

fclean: clean
	@echo "🗑️  Deep cleaning..."
	@$(DOCKER_COMPOSE) down -v --rmi all $(QUIET)
	@rm -rf frontend/node_modules backend/node_modules
	@rm -f frontend/package-lock.json backend/package-lock.json
	@rm -rf ./backend/downloads/*
	@rm -rf ./backend/subtitles/*
	@echo "✨ Everything has been deleted."

re-dev: fclean dev

re: fclean dev