DOCKER_COMPOSE = docker compose
NPM = npm

.PHONY: dev up stop dev-front dev-back clean fclean help install re front back build

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'


install:
	@echo "📦 Installing dependencies..."
	cd frontend && $(NPM) install
	cd backend && $(NPM) install

dev: up
	@echo "🚀 Starting development environment..."
	make -j 2 dev-front dev-back

build: up
	@echo "🚀 Starting development environment..."
	make -j 2 front back

up:
	rm -rf ./backend/downloads/*
	@echo "🐳 Ensuring lockfiles exist for Docker build..."
	@if [ ! -f backend/package-lock.json ]; then cd backend && $(NPM) install; fi
	@if [ ! -f frontend/package-lock.json ]; then cd frontend && $(NPM) install; fi
	$(DOCKER_COMPOSE) up -d --build

dev-front:
	cd frontend && $(NPM) run dev

dev-back:
	cd backend && $(NPM) run dev

front:
	cd frontend && $(NPM) run start

back:
	cd backend && $(NPM) run

stop:
	$(DOCKER_COMPOSE) stop

clean: stop
	rm -rf ./backend/downloads/*
	@$(DOCKER_COMPOSE) down
	@echo "🧹 Containers stopped and removed."

fclean: clean
	$(DOCKER_COMPOSE) down -v --rmi all
	@rm -rf frontend/node_modules backend/node_modules
	@rm -f frontend/package-lock.json backend/package-lock.json
	@echo "🗑️  Everything has been deleted (containers, images, volumes, node_modules)."

re-dev: fclean dev

re: fclean build
