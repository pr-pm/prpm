# Development Workflow Guide

This guide covers the development workflow for the PRPM monorepo with automatic rebuilding, recompilation, and Docker integration.

## 🚀 TL;DR

**Watch mode is now the default!** All `npm run dev` commands automatically:
- ✅ Start Docker services (if needed) and wait for health checks
- ✅ Run TypeScript compilation in watch mode
- ✅ Auto-reload on file changes
- ✅ Type checking in the background

Just run `npm run dev` and start coding!

## Quick Start

### 1. Environment Setup (First Time)

**Copy and configure environment variables:**
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# At minimum, set:
# - DATABASE_URL (PostgreSQL connection)
# - REDIS_URL (Redis connection)
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (for OAuth)
```

**Install dependencies:**
```bash
npm install
```

**Start Docker services:**
```bash
# Start PostgreSQL, Redis, and MinIO
npm run docker:start
```

**Run database migrations:**
```bash
cd packages/registry
npm run migrate:up
```

### 2. Start Full Development Environment
```bash
# Automatically starts Docker services, then runs CLI, registry and webapp with watch mode
npm run dev

# Start everything including client library in watch mode
npm run dev:all
```

**What `npm run dev` does:**
1. Checks if Docker services (Postgres, Redis, MinIO) are running
2. Starts them if needed and waits for them to be healthy
3. Runs CLI with hot reload (restarts on changes)
4. Runs registry with TypeScript watch mode + hot reload server
5. Runs webapp in development mode
6. All with automatic recompilation on file changes

### Start Individual Services
```bash
# Registry API server (watch mode + hot reload)
npm run dev:registry

# Web application (hot reload)
npm run dev:webapp

# CLI with hot reload (runs from source, restarts on changes)
npm run dev:cli

# Registry client library in watch mode
npm run dev:client
```

**Note**: The CLI dev mode runs the CLI directly from source and restarts it on file changes. To test with arguments:
```bash
npm run dev:cli -- install @pr-pm/some-package
```

## Build Watch Modes

### TypeScript Compilation with Auto-Rebuild
```bash
# Watch and rebuild all packages
npm run build:watch:all

# Watch individual packages
npm run build:watch --workspace=prpm                    # CLI
npm run build:watch --workspace=@pr-pm/registry-client   # Client library
npm run build:watch --workspace=@pr-pm/registry          # Registry API
```

### Development with Client Library Changes

When working on the registry that depends on the client library:
```bash
# Terminal 1: Watch and rebuild client library
npm run dev:client

# Terminal 2: Run registry with hot reload
npm run dev:registry
```

Or use the combined script:
```bash
npm run dev:with-build
```

## Type Checking

### One-time Type Check
```bash
# Check all packages
npm run typecheck

# Check specific packages
npm run typecheck --workspace=prpm
npm run typecheck --workspace=@pr-pm/registry-client
npm run typecheck --workspace=@pr-pm/registry
```

### Continuous Type Checking
```bash
# Watch mode for all packages
npm run typecheck:watch
```

## Testing

### Run Tests
```bash
# All packages
npm test

# Specific package
npm run test:cli
npm run test:client
npm run test:registry
```

### Watch Mode for Tests
```bash
# All packages in watch mode
npm run test:watch

# Specific package in watch mode
npm run test:watch --workspace=@pr-pm/registry
```

## Package-Specific Commands

### Registry (@pr-pm/registry)
- `npm run dev` - **Watch mode by default**: Runs both TypeScript compilation and hot reload server
- `npm run dev:server` - Server hot reload only (no build watch)
- `npm run dev:no-build` - Server hot reload only (alias)
- `npm run build` - Production build
- `npm run build:watch` - TypeScript compilation in watch mode
- `npm run test:watch` - Vitest in watch mode
- `npm run typecheck` - Type check without emitting

### CLI (prpm)
- `npm run dev` - **Hot reload by default**: Runs CLI directly from source with auto-restart on changes (tsx watch)
- `npm run dev:with-build` - Compile TypeScript + run built CLI with auto-restart
- `npm run dev:build-only` - TypeScript compilation in watch mode (no execution)
- `npm run build` - Production build
- `npm run build:watch` - TypeScript compilation in watch mode
- `npm run typecheck` - Type check without emitting

**Note**: `npm run dev` runs the CLI from source files and restarts it when you save changes. This is useful for development/testing. For testing the actual built output, use `npm run dev:with-build`.

### Registry Client (@pr-pm/registry-client)
- `npm run dev` - **Watch mode by default**: TypeScript compilation with auto-rebuild
- `npm run build` - Production build
- `npm run build:watch` - TypeScript compilation in watch mode (same as dev)
- `npm run typecheck` - Type check without emitting

## Common Development Workflows

### Working on Registry API
```bash
# One command starts everything (Docker + watch mode)
npm run dev:registry
```

Docker services are automatically checked and started if needed. The registry runs with both TypeScript compilation in watch mode and server hot reload.

### Working on CLI
```bash
# Hot reload - runs CLI from source with auto-restart
npm run dev:cli

# Or compile + run built version with auto-restart
npm run dev:with-build --workspace=prpm

# Or just compile without running
npm run dev:build-only --workspace=prpm
```

The default `npm run dev:cli` uses `tsx watch` to run the CLI directly from source files and automatically restarts when you save changes. Pass CLI arguments after `--`:
```bash
npm run dev:cli -- search typescript  # Example: testing search command
```

### Working on Client Library
The client library is a dependency of both CLI and Registry. To work on it:

```bash
# Terminal 1: Build client library in watch mode
npm run dev:client

# Terminal 2: Run the consuming package
npm run dev:registry  # or dev:cli
```

The consuming packages will automatically pick up changes when the client library rebuilds.

### Full Stack Development
```bash
# Start everything (Docker services auto-start + CLI + registry + webapp)
npm run dev

# Or include client library in watch mode too
npm run dev:all
```

Both commands automatically:
1. Check Docker service status
2. Start services if not running
3. Wait for services to be healthy
4. Start all dev servers with watch mode enabled

## Docker Services

Docker services are **automatically started** when you run `npm run dev` or `npm run dev:all`.

### Manual Docker Management

```bash
# Start Docker services and wait for them to be healthy
npm run docker:start

# Stop Docker services
npm run docker:stop

# Restart Docker services
npm run docker:restart

# View Docker service logs
npm run docker:logs

# Check Docker service status
npm run docker:ps
```

### Legacy Commands (Direct docker-compose)
```bash
# Start services in background (no health check wait)
npm run services:up

# Stop services
npm run services:down

# View logs
npm run services:logs
```

### Available Services
- **PostgreSQL**: localhost:5434
  - User: `prpm`
  - Password: `prpm`
  - Database: `prpm`
  - Connection String: `postgresql://prpm:prpm@localhost:5434/prpm`
- **Redis**: localhost:6379
  - Connection String: `redis://localhost:6379`
- **MinIO** (S3-compatible storage): http://localhost:9000
  - Console: http://localhost:9001
  - Access Key: `minioadmin`
  - Secret Key: `minioadmin`
  - Bucket: Create `prpm-packages` bucket via console

### Environment Variables

See `.env.example` for all available configuration options. Key variables:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT token signing
- `GITHUB_CLIENT_ID` - GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth app secret

**Storage:**
- `S3_ENDPOINT` - MinIO/S3 endpoint (default: http://localhost:9000)
- `S3_BUCKET` - Storage bucket name (default: prpm-packages)
- `S3_ACCESS_KEY_ID` - MinIO/S3 access key
- `S3_SECRET_ACCESS_KEY` - MinIO/S3 secret key

**Optional:**
- `AI_EVALUATION_ENABLED` - Enable AI quality scoring (requires ANTHROPIC_API_KEY)
- `SEARCH_ENGINE` - Use 'postgres' (default) or 'opensearch'
- `ENABLE_TELEMETRY` - Enable PostHog telemetry (default: true)

For complete list, see `.env.example`.

## Build Flags Explained

### `--preserveWatchOutput`
Keeps previous build output visible in the terminal for easier debugging. Applied to all watch mode builds.

### `--noEmit`
Used in `typecheck` scripts to verify types without generating output files.

### `--watch`
Enables watch mode for continuous rebuilding on file changes.

## Tips

1. **Incremental Builds**: All watch modes use TypeScript's incremental compilation for faster rebuilds.

2. **Parallel Development**: Use `concurrently` (already installed) to run multiple watch processes:
   ```bash
   npm run build:watch:all  # Watches all packages simultaneously
   ```

3. **Clean Build**: If you encounter issues, clean and rebuild:
   ```bash
   npm run clean
   npm install
   npm run build
   ```

4. **Type Safety**: Run `npm run typecheck` before committing to catch type errors early.

5. **Hot Reload**: The registry uses `tsx watch` which automatically restarts the server on changes.

## Troubleshooting

### Changes not being picked up
1. Check that the watch process is running
2. Verify file extensions match TypeScript config
3. Try stopping and restarting the watch process

### Type errors in editor but build succeeds
1. Restart your TypeScript language server
2. Run `npm run typecheck` to verify
3. Check your editor is using the workspace TypeScript version

### Slow rebuilds
1. Close unnecessary watch processes
2. Use specific package commands instead of workspace-wide commands
3. Check `.gitignore` includes `dist/` and `node_modules/`

## CI/CD

For continuous integration, use the CI-specific commands:
```bash
npm run test:ci      # All tests without watch mode
npm run typecheck    # Type check all packages
npm run build        # Production build all packages
```
