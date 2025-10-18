# End-to-End Testing Guide

This guide explains how to run comprehensive E2E tests for the PRPM registry and CLI.

## Overview

The E2E test suite validates the entire stack working together:
- **PostgreSQL** - Database for package metadata
- **Redis** - Caching and session storage
- **MinIO** - S3-compatible object storage for package files
- **Registry Server** - Fastify API backend
- **CLI** - Command-line client

## Prerequisites

### Local Testing
- Docker installed and running
- Node.js 20+ installed
- npm dependencies installed (`npm ci` from root)

### CI Testing
All services run in GitHub Actions using:
- Service containers (PostgreSQL, Redis)
- Manual Docker containers (MinIO)
- Background processes (Registry server)

## Running E2E Tests Locally

### 1. Start Services

```bash
# Start PostgreSQL, Redis, and MinIO
docker run -d \
  --name prmp-postgres \
  -p 5432:5432 \
  -e POSTGRES_USER=prmp \
  -e POSTGRES_PASSWORD=prmp_dev_password \
  -e POSTGRES_DB=prpm_registry \
  postgres:15-alpine

docker run -d \
  --name prmp-redis \
  -p 6379:6379 \
  redis:7-alpine

docker run -d \
  --name prmp-minio \
  -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio:latest server /data --console-address ":9001"
```

### 2. Wait for Services

```bash
# Wait for PostgreSQL
until docker exec prmp-postgres pg_isready -U prmp; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# Wait for Redis
until docker exec prmp-redis redis-cli ping; do
  echo "Waiting for Redis..."
  sleep 2
done

# Wait for MinIO
until curl -f http://localhost:9000/minio/health/live 2>/dev/null; do
  echo "Waiting for MinIO..."
  sleep 2
done

echo "✅ All services ready"
```

### 3. Build Packages

```bash
# Build registry-client first (dependency)
npm run build --workspace=@prmp/registry-client

# Build registry
npm run build --workspace=@prmp/registry

# Build CLI
npm run build --workspace=@prmp/cli
```

### 4. Run Database Migrations

```bash
cd packages/registry
npm run migrate
cd ../..
```

### 5. Create MinIO Bucket

```bash
cd packages/registry
node scripts/create-minio-bucket.js
cd ../..
```

### 6. Start Registry Server

```bash
cd packages/registry
PORT=4000 npm run dev
```

The registry will start on http://localhost:4000

### 7. Test API Endpoints

In a new terminal:

```bash
# Health check
curl http://localhost:4000/health

# List packages
curl http://localhost:4000/api/v1/packages?limit=5

# Search packages
curl "http://localhost:4000/api/v1/search?q=test&limit=5"

# Trending packages
curl http://localhost:4000/api/v1/packages/trending?limit=5

# Collections
curl http://localhost:4000/api/v1/collections?limit=5
```

### 8. Test CLI Commands

```bash
# Configure CLI to use local registry
export PRPM_REGISTRY_URL=http://localhost:4000

# Test CLI commands
cd packages/cli
npm run dev search test
npm run dev popular
npm run dev trending
npm run dev collections
```

### 9. Cleanup

```bash
# Stop registry (Ctrl+C in terminal)

# Stop and remove Docker containers
docker stop prmp-postgres prmp-redis prmp-minio
docker rm prmp-postgres prmp-redis prmp-minio
```

## Environment Variables

### Registry Server

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/test/production) | development | No |
| `PORT` | Server port | 3000 | No |
| `DATABASE_URL` | PostgreSQL connection string | - | **Yes** |
| `REDIS_URL` | Redis connection string | - | **Yes** |
| `JWT_SECRET` | Secret for JWT tokens | - | **Yes** |
| `AWS_REGION` | AWS region | us-east-1 | No |
| `AWS_ENDPOINT` | S3 endpoint (use for MinIO) | - | **Yes (MinIO)** |
| `AWS_ACCESS_KEY_ID` | AWS/MinIO access key | - | **Yes** |
| `AWS_SECRET_ACCESS_KEY` | AWS/MinIO secret key | - | **Yes** |
| `S3_BUCKET` | S3 bucket name | prmp-packages | No |
| `AWS_FORCE_PATH_STYLE` | Use path-style URLs (MinIO) | false | **Yes (MinIO)** |
| `SEARCH_ENGINE` | Search backend (postgres/elasticsearch) | postgres | No |
| `ENABLE_TELEMETRY` | Enable PostHog telemetry | false | No |
| `ENABLE_RATE_LIMITING` | Enable rate limiting | false | No |

### CLI

| Variable | Description | Default |
|----------|-------------|---------|
| `PRPM_REGISTRY_URL` | Registry URL override | https://registry.prmp.dev |

## Expected Behavior

### Successful Health Check
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T16:00:00.000Z",
  "services": {
    "database": "ok",
    "redis": "ok",
    "storage": "ok"
  }
}
```

### Successful Package List
```json
{
  "packages": [],
  "total": 0,
  "page": 1,
  "limit": 5
}
```

### Successful Search
```json
{
  "results": [],
  "total": 0,
  "query": "test"
}
```

## Troubleshooting

### PostgreSQL Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Ensure PostgreSQL container is running and healthy:
```bash
docker ps | grep postgres
docker exec prmp-postgres pg_isready -U prmp
```

### Redis Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**: Ensure Redis container is running:
```bash
docker ps | grep redis
docker exec prmp-redis redis-cli ping
```

### MinIO Connection Failed
```
Error: S3 endpoint not reachable
```

**Solution**: Ensure MinIO is running and accessible:
```bash
docker ps | grep minio
curl http://localhost:9000/minio/health/live
```

Check that `AWS_FORCE_PATH_STYLE=true` is set in environment.

### Migration Failed
```
Error: relation "packages" does not exist
```

**Solution**: Run migrations:
```bash
cd packages/registry
npm run migrate
```

### Registry Returns 500 Error
```
curl: (22) The requested URL returned error: 500
```

**Solution**: Check registry logs for detailed error:
```bash
tail -100 /tmp/registry.log  # CI
# or check terminal output in local dev
```

Common causes:
- Database not migrated
- MinIO bucket not created
- Missing environment variables
- Build artifacts missing (forgot to build registry-client)

### CLI Commands Fail with "fetch failed"
```
Error: fetch failed
```

**Solution**: Ensure you're using the correct environment variable:
```bash
export PRPM_REGISTRY_URL=http://localhost:4000
```

And that globalThis.fetch is available (Node 20+ required).

## CI/CD Integration

The E2E tests run automatically in GitHub Actions on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

### Workflow File
`.github/workflows/e2e-tests.yml`

### Key CI Steps
1. Start service containers (PostgreSQL, Redis)
2. Start MinIO container manually
3. Install dependencies from root
4. Build registry-client
5. Build registry
6. Run migrations
7. Create MinIO bucket
8. Start registry server in background
9. Run API endpoint tests
10. Run security tests
11. Display registry logs on failure

### Viewing CI Logs
```bash
# View latest run
gh run list --workflow=e2e-tests.yml --limit 1

# View specific run logs
gh run view <run-id> --log

# View failed logs only
gh run view <run-id> --log-failed
```

## Test Coverage

The E2E test suite validates:
- ✅ Service health (PostgreSQL, Redis, MinIO)
- ✅ Database migrations
- ✅ MinIO bucket creation
- ✅ Registry server startup
- ✅ Health endpoint
- ✅ API endpoints (packages, search, trending, collections)
- ✅ Security headers
- ✅ Rate limiting headers
- ✅ CLI commands (search, popular, trending, collections)

## Known Limitations

1. **No authentication tests** - OAuth flow not tested in E2E
2. **No publish tests** - Full publish workflow not tested
3. **No version updates** - Package versioning not tested
4. **No dependency resolution** - Dependency graphs not tested
5. **Limited data** - Tests run on empty database

## Future Improvements

- Add seed data for more realistic testing
- Add authentication flow tests
- Add publish workflow tests (CLI → Registry → S3)
- Add version update tests
- Add dependency resolution tests
- Add collection management tests
- Add performance benchmarks
- Add load testing

---

*Generated with [Claude Code](https://claude.ai/code) via [Happy](https://happy.engineering)*
