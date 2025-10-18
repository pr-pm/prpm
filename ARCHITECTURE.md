# PRMP Architecture

This document explains the repository structure and the distinction between the different components.

## Repository Structure

```
prompt-package-manager/
├── packages/               # npm workspace packages
│   ├── cli/               # CLI tool (@prmp/cli)
│   ├── registry/          # Backend service (@prmp/registry)
│   └── registry-client/   # HTTP client library (@prmp/registry-client)
├── packages/infra/                 # Pulumi infrastructure as code
└── .claude/skills/        # Claude Code skills for development
```

## Components

### 1. CLI (`packages/cli/`)

**Package**: `@prmp/cli`
**Purpose**: Command-line interface for users to interact with PRMP

The CLI provides commands for:
- Installing and managing prompt packages locally
- Publishing packages to the registry
- Searching and browsing the registry
- Managing collections and dependencies

**Usage**:
```bash
npx @prmp/cli install <package-name>
npx @prmp/cli search <query>
npx @prmp/cli publish
```

### 2. Registry Client (`packages/registry-client/`)

**Package**: `@prmp/registry-client`
**Purpose**: Shared HTTP client library for interacting with the registry API

This is a **dependency** of the CLI that provides:
- Type-safe API client
- HTTP request handling
- Response parsing and validation
- Error handling

**Why separate?**
- Reusability: Can be used by other tools (web apps, plugins, etc.)
- Testing: Can be tested independently
- Type safety: Provides TypeScript definitions for the API
- Versioning: Can be updated independently of the CLI

**Usage** (programmatic):
```typescript
import { RegistryClient } from '@prmp/registry-client';

const client = new RegistryClient('https://registry.prmp.dev');
const packages = await client.searchPackages('query');
```

### 3. Registry Backend (`packages/registry/`)

**Package**: `@prmp/registry`
**Purpose**: Backend API service (Fastify server)

**In `packages/` like all workspace packages** - even though it's a service:
- Follows monorepo convention: all workspace packages in `packages/`
- NOT published to npm (should be marked `"private": true`)
- Deployed separately via Docker to AWS (ECS/Fargate)
- Requires infrastructure (PostgreSQL, Redis, S3)

Provides:
- REST API for package management
- Package storage and versioning
- User authentication (GitHub OAuth)
- Search functionality
- Analytics and telemetry

**Deployment**: AWS (ECS/Fargate) via Pulumi

### 4. Infrastructure (`packages/infra/`)

**Purpose**: Pulumi code for deploying the registry backend to AWS

Manages:
- ECS/Fargate services
- RDS PostgreSQL database
- ElastiCache Redis
- S3 bucket for package storage
- CloudFront CDN
- IAM roles and security groups

### 5. Development Skills (`.claude/skills/`)

**Purpose**: Claude Code skills for developing PRPM itself

Contains:
- Core development principles
- Format conversion expertise
- Testing patterns

These skills are used by AI assistants (like Claude Code) to help develop PRPM.

## Build Order Dependencies

```
registry-client → cli
               ↓
            registry (uses client types for validation)
```

### Why This Matters for CI

The CLI depends on `@prmp/registry-client`, so when running TypeScript type checks or builds:

1. **First**: Build `@prmp/registry-client`
   ```bash
   npm run build --workspace=@prmp/registry-client
   ```

2. **Then**: Build or type-check `@prmp/cli`
   ```bash
   cd packages/cli && npx tsc --noEmit
   ```

Without building the registry-client first, the CLI will fail with:
```
error TS2307: Cannot find module '@prmp/registry-client'
```

## Published vs Private Packages

All workspace packages live in `packages/`, regardless of whether they're published or deployed:

### Published Packages
- **Published to npm** for public use
- Can be installed as dependencies
- Examples: `@prmp/cli`, `@prmp/registry-client`

### Private Packages (Services)
- **NOT published** - marked with `"private": true`
- Deployed independently (Docker, AWS, etc.)
- Examples: `@prmp/registry` (backend API service)

## Monorepo Workspace Setup

The root `package.json` defines workspaces:

```json
{
  "workspaces": [
    "packages/*"
  ]
}
```

This means:
- All packages share the root `package-lock.json`
- Dependencies are hoisted to root `node_modules/`
- Run `npm ci` from **root**, not from workspace directories
- Use `npm run <script> --workspace=<name>` to run scripts in specific packages

## Testing Strategy

- **Unit tests**: Each package tests its own code
- **Integration tests**: CLI tests against mock registry
- **E2E tests**: Full stack tests with real services (Docker containers)

## Common Mistakes

❌ **Don't**: Run `npm ci` in `packages/cli/` or `packages/infra/`
✅ **Do**: Run `npm ci` from root

❌ **Don't**: Type-check CLI before building registry-client
✅ **Do**: Build dependencies in order

❌ **Don't**: Put workspaces outside `packages/`
✅ **Do**: All workspace packages go in `packages/`, use `"private": true` for non-published ones

## Related Documentation

- [Testing Guide](.github/skills/github-actions-testing.md)
- [Registry API](packages/registry/README.md)
- [CLI Usage](packages/cli/README.md)
