# Internal Development Documentation

This directory contains documentation for PRPM contributors and maintainers.

## Contents

### Deployment & Infrastructure
- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - Quick deployment overview
  - Two-step deployment model
  - Infrastructure provisioning vs application deployment
  - Quick start guide
  - Architecture diagrams
- **[DEPLOYMENT_VERIFICATION.md](./DEPLOYMENT_VERIFICATION.md)** - Complete deployment checklist
  - Deployment logic verification
  - Environment variables configuration
  - Safety features and error handling
  - Ready-for-production checklist

### CI/CD & Workflows
- **[GITHUB_WORKFLOWS.md](./GITHUB_WORKFLOWS.md)** - GitHub Actions workflows reference
  - All 7 workflows explained
  - Job dependencies and triggers
  - Secrets required
  - Local testing with `act`
- **[../.github/workflows/WORKFLOWS.md](../../.github/workflows/WORKFLOWS.md)** - Deployment workflows guide
  - Infrastructure update workflow
  - Application deployment workflow
  - Deployment flow diagrams
  - Troubleshooting guide

### Publishing & Release
- **[PUBLISHING.md](./PUBLISHING.md)** - NPM package publishing guide
  - Package dependency order (@prpm/types → registry-client → cli)
  - Publishing checklist
  - Manual and automated publishing
  - Testing published packages

### Development Environment
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development setup and workflows
  - Local environment setup
  - Running services
  - Testing strategies
  - Build processes

### Services & Infrastructure
- **[DOCKER.md](./DOCKER.md)** - Docker services setup
  - PostgreSQL
  - Redis
  - MinIO
  - docker-compose configuration

## For User Documentation

See [docs/](../../docs/) directory for user-facing documentation.

## For AI Assistants

See [.claude/skills/](../../.claude/skills/) for AI assistant knowledge base.
