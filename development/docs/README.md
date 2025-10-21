# Internal Development Documentation

Documentation for PRPM contributors and maintainers.

> **For users:** See **[docs/](../../docs/)** for user-facing documentation.

---

## Quick Start for Contributors

1. **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Start here! Local setup and development workflow
2. **[DOCKER.md](./DOCKER.md)** - Set up local services (PostgreSQL, Redis, MinIO)
3. **[GITHUB_WORKFLOWS.md](./GITHUB_WORKFLOWS.md)** - Understand CI/CD pipelines

---

## Documentation Index

### 🚀 Deployment & Production

#### Deployment Guides
- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** - **Start here!** Complete deployment overview
  - What's configured and ready
  - Deployment workflow (first time + subsequent)
  - Quick command reference
  - File structure

- **[DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)** - TL;DR deployment guide
  - One-time S3 setup (✅ DONE)
  - First deployment steps
  - Seeding workflow
  - Updating data

- **[DEPLOYMENT_DATA_STRATEGY.md](./DEPLOYMENT_DATA_STRATEGY.md)** - Data management strategy
  - Why data is in S3 (not git)
  - S3 bucket configuration
  - Upload/download scripts
  - Alternative approaches
  - Security and cost

#### Database Seeding
- **[SEEDING_PRODUCTION.md](./SEEDING_PRODUCTION.md)** - Database seeding guide
  - When to seed (and when not to)
  - Method 1: SSH and seed (recommended)
  - Method 2: Admin API endpoint
  - Method 3: Pulumi script
  - Method 4: GitHub Actions workflow
  - Verification and troubleshooting

- **[SEEDING_ALTERNATIVES.md](./SEEDING_ALTERNATIVES.md)** - Deployment hook comparison
  - With vs without predeploy hook
  - Tradeoffs and recommendations
  - Conditional download approach

#### Deployment Verification
- **[DEPLOYMENT_VERIFICATION.md](./DEPLOYMENT_VERIFICATION.md)** - Production readiness checklist
  - Deployment logic verification
  - Environment variables
  - Safety features
  - Error handling
  - Complete checklist

---

### 🔄 CI/CD & Workflows

- **[GITHUB_WORKFLOWS.md](./GITHUB_WORKFLOWS.md)** - GitHub Actions reference
  - All 7 workflows explained
  - Job dependencies and triggers
  - Required secrets
  - Local testing with `act`

- **[../../.github/workflows/WORKFLOWS.md](../../.github/workflows/WORKFLOWS.md)** - Deployment workflows
  - Infrastructure update workflow
  - Application deployment workflow
  - Flow diagrams
  - Troubleshooting

---

### 📦 Publishing & Release

- **[PUBLISHING.md](./PUBLISHING.md)** - NPM package publishing
  - Package dependency order
  - Publishing checklist
  - Manual and automated publishing
  - Testing published packages

---

### 💻 Development Environment

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Local development setup
  - Prerequisites
  - Environment setup
  - Running services
  - Testing strategies
  - Build processes
  - Common tasks

- **[DOCKER.md](./DOCKER.md)** - Docker services
  - PostgreSQL setup
  - Redis configuration
  - MinIO (S3-compatible storage)
  - docker-compose reference

---

## File Organization

```
development/docs/
├── README.md                      # This file
│
├── Deployment & Production
│   ├── DEPLOYMENT_SUMMARY.md      # Overview & quick reference
│   ├── DEPLOYMENT_QUICKSTART.md   # TL;DR deployment guide
│   ├── DEPLOYMENT_DATA_STRATEGY.md # S3 data management
│   ├── DEPLOYMENT_VERIFICATION.md  # Production checklist
│   ├── SEEDING_PRODUCTION.md      # Database seeding
│   └── SEEDING_ALTERNATIVES.md    # Hook comparison
│
├── CI/CD & Workflows
│   └── GITHUB_WORKFLOWS.md        # GitHub Actions reference
│
├── Development
│   ├── DEVELOPMENT.md             # Local setup
│   └── DOCKER.md                  # Services setup
│
└── Publishing
    └── PUBLISHING.md              # NPM package publishing
```

---

## Quick Reference

### Deployment Commands

```bash
# First deployment - one-time setup
git push origin main                          # Deploy app
eb ssh prpm-registry-prod                     # SSH into instance
cd /var/app/current
./scripts/download-data-from-s3.sh prod      # Download data
cd packages/registry
npm run seed:all                              # Seed database

# Subsequent deployments
git push origin main                          # Just deploy

# Update package data
npx tsx scripts/generate-quality-scores.ts   # Re-score locally
./scripts/upload-data-to-s3.sh prod          # Upload to S3
eb ssh prpm-registry-prod                     # SSH in
cd /var/app/current
./scripts/download-data-from-s3.sh prod      # Download latest
cd packages/registry
npm run seed:all                              # Re-seed
```

### Development Commands

```bash
# Start services
docker-compose up -d                 # Start all services
cd packages/registry && npm run dev  # Start registry API

# Testing
npm test                            # Run all tests
npm run test:watch                  # Watch mode

# Database
npm run migrate                     # Run migrations
npm run seed:all                    # Seed database
```

---

## User Documentation

For user-facing documentation, see **[docs/](../../docs/)** directory:
- Installation guides
- CLI reference
- Configuration
- Collections
- Format conversion
- Examples

---

## AI Assistant Knowledge

For AI assistant knowledge base, see **[.claude/skills/](../../.claude/skills/)** for:
- Pulumi troubleshooting
- PostgreSQL migrations
- AWS Beanstalk expertise
- TypeScript type safety
- Creating skills and rules

---

## Getting Help

**Internal Questions:**
- Ask in team Slack/Discord
- Tag @khaliqgant for deployment questions

**External Contributions:**
- See [CONTRIBUTING.md](../../CONTRIBUTING.md)
- Open discussions on GitHub

---

## Related Documentation

- **[Main README](../../README.md)** - Project overview
- **[User Docs](../../docs/)** - User-facing documentation
- **[ROADMAP](../../ROADMAP.md)** - Future plans
- **[CHANGELOG](../../CHANGELOG.md)** - Version history
