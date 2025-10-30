# Docker Setup Guide

## Overview

PRPM uses Docker Compose for local development and production deployments. There are two compose configurations:

1. **`docker-compose.yml`** (Development) - Uses host node_modules for fast iteration
2. **`docker-compose.prod.yml`** (Production) - Builds optimized Docker images

## Development Setup (Recommended)

### Prerequisites

```bash
# Install dependencies locally first
npm install

# This installs dependencies for all packages:
# - packages/registry
# - packages/webapp
# - packages/cli
```

### Starting Services

```bash
# Start all services (uses docker-compose.yml by default)
docker compose up

# Or run in detached mode
docker compose up -d

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f registry
```

### How It Works

The development setup:
- Mounts your local code directories into containers
- Uses your host's `node_modules` (no npm install in container)
- Enables hot-reload for fast development
- Services start almost instantly

**Services:**
- `postgres` - PostgreSQL database on port 5434
- `redis` - Redis cache on port 6379
- `minio` - S3-compatible storage on ports 9000/9001
- `registry` - API server on port 3111
- `webapp` - Next.js frontend on port 5173

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

## Production Setup

For production-like testing with optimized builds:

```bash
# Build images and start
docker compose -f docker-compose.prod.yml up --build

# Or detached
docker compose -f docker-compose.prod.yml up --build -d
```

### How It Works

The production setup:
- Builds Docker images from Dockerfiles
- Multi-stage builds for optimal image size
- npm dependencies installed during build phase
- Production-optimized (NODE_ENV=production)
- No code mounting (immutable containers)

## Common Tasks

### Rebuild After Dependency Changes

If you modify `package.json`:

```bash
# Development (install locally)
npm install

# Production (rebuild images)
docker compose -f docker-compose.prod.yml up --build
```

### Access Database

```bash
# Connect to PostgreSQL
psql -h localhost -p 5434 -U prpm -d prpm

# Or using Docker
docker exec -it prpm-postgres psql -U prpm -d prpm
```

### Access MinIO Console

Open http://localhost:9001 in your browser
- Username: `minioadmin`
- Password: `minioadmin`

### Run Migrations

```bash
# Inside registry container
docker exec -it prpm-registry npm run migrate

# Or from host (if registry is running)
cd packages/registry && npm run migrate
```

### Clear All Data

```bash
# Stop and remove volumes
docker compose down -v

# Start fresh
docker compose up
```

## Troubleshooting

### Registry fails to start

**Error:** "Module not found" or dependency errors

**Solution:** Install dependencies locally
```bash
cd packages/registry
npm install
```

### Webapp fails to start

**Error:** "Module not found" or dependency errors

**Solution:** Install dependencies locally
```bash
cd packages/webapp
npm install
```

### Port already in use

**Error:** "port is already allocated"

**Solution:** Stop conflicting services or change ports in `docker-compose.yml`
```bash
# Check what's using the port
lsof -i :3111

# Or use different ports in docker-compose.yml
ports:
  - "3001:3111"  # Host:Container
```

### Health check failures

**Error:** "unhealthy" status

**Solution:** Check logs for the specific service
```bash
docker compose logs registry
docker compose logs webapp
```

Common causes:
- Application crashed during startup
- Dependencies not installed
- Database connection failed
- Port binding issues

### Database connection errors

**Error:** "connection refused" or "ECONNREFUSED"

**Solution:** Ensure PostgreSQL is healthy
```bash
# Check status
docker compose ps

# postgres should show "healthy"
# If not, check logs
docker compose logs postgres
```

### Clean slate restart

If things are really broken:
```bash
# Nuclear option - removes everything
docker compose down -v
docker system prune -a
npm install
docker compose up
```

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| **node_modules** | Host system | Baked into image |
| **Startup time** | ~5 seconds | First build: ~3 minutes |
| **Hot reload** | ✅ Yes | ❌ No |
| **Code changes** | Instant | Requires rebuild |
| **Image size** | N/A | Optimized (~200MB) |
| **Security** | Relaxed | Hardened (non-root) |
| **Best for** | Active development | Testing/Deployment |

## Best Practices

### Development

1. **Always install dependencies locally** before starting Docker
2. **Use `docker compose up`** without `-d` to see logs
3. **Keep compose up while coding** for hot-reload
4. **Don't modify node_modules** in container (use host)

### Production

1. **Rebuild after code changes** with `--build` flag
2. **Use detached mode** with `-d` for background services
3. **Monitor logs** with `docker compose logs -f`
4. **Test before deploying** to actual production

## Environment Variables

Both compose files support environment variables:

```bash
# Set in shell
export GITHUB_CLIENT_ID="your-client-id"
export GITHUB_CLIENT_SECRET="your-secret"

# Or use .env file in project root
echo "GITHUB_CLIENT_ID=your-id" >> .env
echo "GITHUB_CLIENT_SECRET=your-secret" >> .env

docker compose up
```

## File Structure

```
.
├── docker-compose.yml           # Development (default)
├── docker-compose.dev.yml       # Development (explicit)
├── docker-compose.prod.yml      # Production
├── packages/
│   ├── registry/
│   │   ├── Dockerfile          # Production build
│   │   ├── node_modules/       # Mounted in dev
│   │   └── ...
│   └── webapp/
│       ├── Dockerfile          # Production build
│       ├── node_modules/       # Mounted in dev
│       └── ...
```

## Performance Tips

### Development

- Use **SSD** for node_modules (much faster)
- Enable **file watching exclusions** in IDE for node_modules
- Use **npm ci** for cleaner, faster installs
- Keep **volumes small** (use .dockerignore)

### Production

- Use **multi-stage builds** (already configured)
- **Minimize layers** in Dockerfile
- Use **.dockerignore** to exclude unnecessary files
- **Cache dependencies** during build

## Next Steps

- See `CONFIG.md` for Pulumi infrastructure configuration
- See `packages/registry/README.md` for API documentation
- See `packages/webapp/README.md` for frontend docs
