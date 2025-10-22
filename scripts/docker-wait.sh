#!/bin/bash

# Script to ensure Docker services are running and healthy before starting dev servers
# Usage: ./scripts/docker-wait.sh

set -e

# Find the project root (where package.json with workspaces exists)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

COMPOSE_FILE="docker-compose.services.yml"
SERVICES=("postgres" "redis" "minio")
MAX_WAIT=60  # Maximum seconds to wait for services
WAIT_INTERVAL=2  # Seconds between health checks

echo "🐳 Checking Docker services..."

# Check if docker-compose is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not running"
    echo "Please install Docker and start Docker Desktop"
    exit 1
fi

# Check if services are already running
RUNNING_SERVICES=$(docker compose -f "$COMPOSE_FILE" ps --services --filter "status=running" 2>/dev/null || echo "")

if [ -z "$RUNNING_SERVICES" ]; then
    echo "🚀 Starting Docker services..."
    docker compose -f "$COMPOSE_FILE" up -d
    echo "✅ Docker services started"
else
    echo "✅ Docker services already running"
fi

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."

for SERVICE in "${SERVICES[@]}"; do
    WAITED=0
    while [ $WAITED -lt $MAX_WAIT ]; do
        # Check health status
        HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "prpm-$SERVICE" 2>/dev/null || echo "none")

        if [ "$HEALTH" = "healthy" ]; then
            echo "  ✓ $SERVICE is healthy"
            break
        elif [ "$HEALTH" = "none" ]; then
            # Service doesn't have health check, just check if it's running
            if docker ps --filter "name=prpm-$SERVICE" --filter "status=running" | grep -q "prpm-$SERVICE"; then
                echo "  ✓ $SERVICE is running"
                break
            fi
        fi

        if [ $WAITED -eq 0 ]; then
            echo "  ⏳ Waiting for $SERVICE..."
        fi

        sleep $WAIT_INTERVAL
        WAITED=$((WAITED + WAIT_INTERVAL))
    done

    if [ $WAITED -ge $MAX_WAIT ]; then
        echo "  ⚠️  $SERVICE did not become healthy within ${MAX_WAIT}s, but continuing anyway..."
    fi
done

echo ""
echo "🎉 All services ready!"
echo ""
echo "Service URLs:"
echo "  • PostgreSQL: localhost:5434 (user: prpm, password: prpm, db: prpm)"
echo "  • Redis:      localhost:6379"
echo "  • MinIO:      http://localhost:9000 (console: http://localhost:9001)"
echo "                user: minioadmin, password: minioadmin"
echo ""
