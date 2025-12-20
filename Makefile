.PHONY: dev-backend dev-frontend dev help

help:
	@echo "Nexus Development Commands:"
	@echo "  make dev           - Start both backend and frontend in development mode"
	@echo "  make dev-backend   - Start the Go backend"
	@echo "  make dev-frontend  - Start the React frontend"

dev-backend:
	@echo "Starting Go backend with Air..."
	@if command -v air > /dev/null; then \
		air; \
	else \
		echo "Air not found, falling back to go run..."; \
		go run cmd/server/main.go; \
	fi

dev-frontend:
	@echo "Starting React frontend..."
	cd web && pnpm dev

dev:
	@echo "Starting Nexus in development mode..."
	mkdir -p data
	(make dev-backend & make dev-frontend)
