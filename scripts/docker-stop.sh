#!/bin/bash

# Script to stop Docker services
# Usage: ./scripts/docker-stop.sh

set -e

# Find the project root (where package.json with workspaces exists)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

COMPOSE_FILE="docker-compose.services.yml"

echo "🛑 Stopping Docker services..."

docker compose -f "$COMPOSE_FILE" down

echo "✅ Docker services stopped"
