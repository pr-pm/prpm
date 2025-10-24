# PRPM Documentation Map

Quick guide to finding what you need in the PRPM documentation.

## 📍 I want to...

### Use PRPM
→ **[docs/](./docs/)** - User documentation
- **Install PRPM**: [docs/INSTALLATION.md](./docs/INSTALLATION.md)
- **Learn commands**: [docs/CLI.md](./docs/CLI.md)
- **Configure PRPM**: [docs/CONFIGURATION.md](./docs/CONFIGURATION.md)
- **Install collections**: [docs/COLLECTIONS.md](./docs/COLLECTIONS.md)
- **See examples**: [docs/EXAMPLES.md](./docs/EXAMPLES.md)

### Contribute to PRPM
→ **[development/docs/](./development/docs/)** - Internal documentation
- **Set up dev environment**: [development/docs/DEVELOPMENT.md](./development/docs/DEVELOPMENT.md)
- **Run local services**: [development/docs/DOCKER.md](./development/docs/DOCKER.md)
- **Understand workflows**: [development/docs/GITHUB_WORKFLOWS.md](./development/docs/GITHUB_WORKFLOWS.md)

### Deploy PRPM
→ **[development/docs/](./development/docs/)** - Deployment guides
- **Deploy to production**: [development/docs/DEPLOYMENT_SUMMARY.md](./development/docs/DEPLOYMENT_SUMMARY.md)
- **Quick deployment guide**: [development/docs/DEPLOYMENT_QUICKSTART.md](./development/docs/DEPLOYMENT_QUICKSTART.md)
- **Seed database**: [development/docs/SEEDING_PRODUCTION.md](./development/docs/SEEDING_PRODUCTION.md)
- **Manage data (S3)**: [development/docs/DEPLOYMENT_DATA_STRATEGY.md](./development/docs/DEPLOYMENT_DATA_STRATEGY.md)

### Publish Packages
→ **Dual documentation**
- **User guide**: [docs/PUBLISHING.md](./docs/PUBLISHING.md) - How to publish packages to PRPM
- **NPM publishing**: [development/docs/PUBLISHING.md](./development/docs/PUBLISHING.md) - How to publish PRPM itself to npm

---

## 🗺️ Documentation Structure

```
prpm/
│
├── README.md                      # 👋 START HERE - Project overview
├── DOCUMENTATION_MAP.md           # 📍 THIS FILE - Documentation navigator
│
├── docs/                          # 📚 USER DOCUMENTATION
│   ├── README.md                 # User docs index
│   ├── INSTALLATION.md           # Getting started
│   ├── CLI.md                    # Command reference
│   ├── CONFIGURATION.md          # Configuration guide
│   ├── COLLECTIONS.md            # Collections explained
│   ├── EXAMPLES.md               # Usage examples
│   ├── FORMAT_CONVERSION.md      # Universal packages
│   ├── PACKAGES.md               # Package catalog
│   └── ...more user guides...
│
├── development/docs/              # 🛠️ INTERNAL DOCUMENTATION
│   ├── README.md                 # Dev docs index
│   │
│   ├── Deployment & Production
│   │   ├── DEPLOYMENT_SUMMARY.md      # Complete deployment overview
│   │   ├── DEPLOYMENT_QUICKSTART.md   # TL;DR deployment
│   │   ├── DEPLOYMENT_DATA_STRATEGY.md # S3 data management
│   │   ├── SEEDING_PRODUCTION.md      # Database seeding
│   │   └── SEEDING_ALTERNATIVES.md    # Hook comparison
│   │
│   ├── Development
│   │   ├── DEVELOPMENT.md        # Local setup
│   │   └── DOCKER.md             # Services (PostgreSQL, Redis, MinIO)
│   │
│   ├── CI/CD
│   │   └── GITHUB_WORKFLOWS.md   # GitHub Actions reference
│   │
│   └── Publishing
│       └── PUBLISHING.md         # NPM package publishing
│
├── CONTRIBUTING.md                # How to contribute
├── ROADMAP.md                    # Future plans
├── CHANGELOG.md                  # Version history
└── ...
```

---

## 🎯 Quick Links by Role

### I'm a User
1. **[README.md](./README.md)** - Understand what PRPM is
2. **[docs/INSTALLATION.md](./docs/INSTALLATION.md)** - Install PRPM
3. **[docs/CLI.md](./docs/CLI.md)** - Learn commands
4. **[docs/EXAMPLES.md](./docs/EXAMPLES.md)** - See it in action

### I'm a Package Author
1. **[docs/PUBLISHING.md](./docs/PUBLISHING.md)** - Publishing guide
2. **[docs/PACKAGE_TYPES.md](./docs/PACKAGE_TYPES.md)** - Package formats
3. **[docs/COLLECTIONS.md](./docs/COLLECTIONS.md)** - Creating collections

### I'm a Contributor
1. **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines
2. **[development/docs/DEVELOPMENT.md](./development/docs/DEVELOPMENT.md)** - Dev setup
3. **[development/docs/GITHUB_WORKFLOWS.md](./development/docs/GITHUB_WORKFLOWS.md)** - CI/CD

### I'm Deploying PRPM
1. **[development/docs/DEPLOYMENT_SUMMARY.md](./development/docs/DEPLOYMENT_SUMMARY.md)** - Complete guide
2. **[development/docs/DEPLOYMENT_QUICKSTART.md](./development/docs/DEPLOYMENT_QUICKSTART.md)** - Quick start
3. **[development/docs/SEEDING_PRODUCTION.md](./development/docs/SEEDING_PRODUCTION.md)** - Database setup

---

## 📖 Documentation Categories

### User-Facing (docs/)
- **Getting Started** - Installation, configuration, examples
- **Using PRPM** - CLI, packages, collections
- **Advanced** - Format conversion, MCP servers, architecture
- **Publishing** - How to publish packages

### Internal (development/docs/)
- **Development** - Local setup, Docker, testing
- **Deployment** - Production deployment, seeding, data management
- **CI/CD** - GitHub Actions, workflows, automation
- **Publishing** - NPM package publishing (PRPM itself)

---

## 🔗 Cross-References

### From Main README
- User docs: [docs/](./docs/)
- Dev docs: [development/docs/](./development/docs/)

### From User Docs
- Main README: [../README.md](./README.md)
- Dev docs: [../development/docs/](./development/docs/)

### From Dev Docs
- Main README: [../../README.md](./README.md)
- User docs: [../../docs/](./docs/)

---

## 🆘 Still Can't Find It?

1. **Check the indexes:**
   - [docs/README.md](./docs/README.md) - User docs index
   - [development/docs/README.md](./development/docs/README.md) - Dev docs index

2. **Search the repo:**
   ```bash
   grep -r "your search term" docs/
   grep -r "your search term" development/docs/
   ```

3. **Ask for help:**
   - [GitHub Discussions](https://github.com/pr-pm/prpm/discussions)
   - [GitHub Issues](https://github.com/pr-pm/prpm/issues)
   - Email: team@prpm.dev

---

**Last Updated:** January 2025
