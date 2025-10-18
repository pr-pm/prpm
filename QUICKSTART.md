# PRPM Quick Start Guide

Get the PRPM registry up and running in under 5 minutes.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+
- npm

## Step 1: Start Infrastructure (2 minutes)

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be healthy
docker-compose ps
```

You should see:
```
NAME            STATUS          PORTS
prpm-postgres   Up (healthy)    0.0.0.0:5432->5432/tcp
prpm-redis      Up (healthy)    0.0.0.0:6379->6379/tcp
```

## Step 2: Run Database Migrations (1 minute)

```bash
cd registry

# Install dependencies
npm install

# Run migrations
npm run migrate
```

This creates:
- Packages table
- Collections tables
- Triggers and views
- Indexes for search

## Step 3: Seed Data (2 minutes)

```bash
# Seed collections
npx tsx scripts/seed/seed-collections.ts

# Verify
psql -h localhost -U prpm -d prpm_registry -c "SELECT count(*) FROM collections;"
```

Expected output: `10` collections seeded

## Step 4: Start Registry Server (1 minute)

```bash
# Still in registry/ directory
npm run dev
```

Server starts at: `http://localhost:3000`

Test it:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-18T...",
  "version": "1.0.0"
}
```

## Step 5: Use Collections (2 minutes)

```bash
cd ..  # Back to project root

# List available collections
prpm collections

# View collection details
prpm collection info @collection/typescript-fullstack

# Get installation plan
prpm install @collection/typescript-fullstack --dry-run
```

## Architecture Running

```
┌─────────────────┐
│   PRPM CLI      │ ← You interact here
└────────┬────────┘
         │
         ↓ HTTP
┌─────────────────┐
│ Registry Server │ ← Fastify API (port 3000)
│  (Node.js)      │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌──────┐  ┌───────┐
│ Postgres  Redis │
│ :5432 │  │ :6379 │
└──────┘  └───────┘
```

## What's Available Now

### ✅ Collections Endpoint
```bash
curl http://localhost:3000/api/v1/collections
```

Returns list of 10 seeded collections:
- TypeScript Full-Stack
- Next.js Pro
- Python Data Science
- Vue.js Full Stack
- DevOps Essentials
- Testing Suite
- Rust Systems
- Flutter Mobile
- Documentation & Writing
- Go Backend

### ✅ Collection Details
```bash
curl http://localhost:3000/api/v1/collections/collection/typescript-fullstack
```

Returns:
- Packages in the collection
- Required vs optional packages
- MCP servers (for Claude)
- Installation metadata

### ✅ Installation Plan
```bash
curl -X POST http://localhost:3000/api/v1/collections/collection/typescript-fullstack/1.0.0/install?format=cursor
```

Returns:
- List of packages to install
- Installation order
- Format-specific variants

## Testing Collections

### List Collections
```bash
# All collections
prpm collections

# Official only
prpm collections list --official

# By category
prpm collections list --category development
```

### View Details
```bash
# Full details
prpm collection info @collection/typescript-fullstack

# With specific version
prpm collection info @collection/typescript-fullstack@1.0.0
```

### Install Collection
```bash
# Install with auto-detected format
prpm install @collection/typescript-fullstack

# Force specific format
prpm install @collection/typescript-fullstack --as claude

# Skip optional packages
prpm install @collection/typescript-fullstack --skip-optional
```

## What's Still Missing

### ❌ Actual Packages
Collections are seeded but reference packages that don't exist yet:
- `typescript-expert`
- `nodejs-backend`
- `react-typescript`
- etc.

**To fix**: Need to scrape and publish real packages

### ❌ Package Publishing
Can't publish packages yet because:
- No authentication (GitHub OAuth not configured)
- No package upload endpoint tested
- No tarball storage configured

**To fix**: Configure GitHub OAuth and test publishing flow

### ❌ Search
Search works but returns no results (no packages)

**To fix**: Publish packages, then search works automatically

## Development Workflow

### Watch Mode
```bash
# Terminal 1: Registry server
cd registry && npm run dev

# Terminal 2: CLI development
npm run build:watch

# Terminal 3: Test commands
prpm collections list
```

### View Logs
```bash
# Registry logs
docker-compose logs -f registry

# Database logs
docker-compose logs -f postgres
```

### Reset Database
```bash
# Stop everything
docker-compose down -v

# Restart fresh
docker-compose up -d postgres redis
cd registry && npm run migrate
npx tsx scripts/seed/seed-collections.ts
```

## Troubleshooting

### "Connection refused" error
```bash
# Check services are running
docker-compose ps

# Check logs
docker-compose logs postgres
docker-compose logs redis
```

### "Registry not found" error
```bash
# Make sure registry server is running
curl http://localhost:3000/health

# Check environment variables
cd registry && cat .env
```

### "No collections found"
```bash
# Re-run seed script
cd registry
npx tsx scripts/seed/seed-collections.ts
```

## Next Steps

1. **Scrape Packages** - Run cursor rules and Claude agents scrapers
2. **Publish Packages** - Upload scraped packages to registry
3. **Link Collections** - Update collections to reference real packages
4. **Test Installation** - Install a collection end-to-end
5. **Configure OAuth** - Enable authenticated publishing

## Environment Variables

Create `registry/.env`:
```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

DB_HOST=localhost
DB_PORT=5432
DB_NAME=prpm_registry
DB_USER=prpm
DB_PASSWORD=prpm_dev_password

REDIS_HOST=localhost
REDIS_PORT=6379

GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback

JWT_SECRET=your_jwt_secret_here
```

## Success Criteria

You've successfully started PRPM when:

✅ `docker-compose ps` shows all services healthy
✅ `curl http://localhost:3000/health` returns OK
✅ `prpm collections` lists 10 collections
✅ `prpm collection info @collection/typescript-fullstack` shows details

**Congratulations!** 🎉 The registry is running and collections are functional.

The next step is publishing actual packages so collections have something to install.
