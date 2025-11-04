# PRPM Documentation Map

Quick guide to finding what you need in the PRPM documentation.

## 🌐 Official Documentation Site

**➡️ [docs.prpm.dev](https://docs.prpm.dev)** - The primary source for all user-facing documentation

## 📍 I want to...

### Use PRPM
→ **[docs.prpm.dev](https://docs.prpm.dev)** - Official documentation
- **Install PRPM**: [Installation Guide](https://docs.prpm.dev/installation)
- **Learn commands**: [CLI Reference](https://docs.prpm.dev/cli/commands)
- **Configure PRPM**: [Configuration Guide](https://docs.prpm.dev/concepts/configuration)
- **Install collections**: [Collections Guide](https://docs.prpm.dev/concepts/collections)
- **See examples**: [Usage Examples](https://docs.prpm.dev/guides/examples)
- **Publish packages**: [Publishing Guide](https://docs.prpm.dev/publishing/getting-started)

### Browse Local Documentation
→ **[public-documentation/](./public-documentation/)** - Source files for docs.prpm.dev
- Complete documentation in MDX format
- Built with Mintlify
- Run locally: `cd public-documentation && mintlify dev`

### Contribute to PRPM
→ **[development/docs/](./development/docs/)** - Internal documentation
- **Set up dev environment**: [development/docs/DEVELOPMENT.md](./development/docs/DEVELOPMENT.md)
- **Run local services**: [development/docs/DOCKER.md](./development/docs/DOCKER.md)
- **Understand workflows**: [development/docs/GITHUB_WORKFLOWS.md](./development/docs/GITHUB_WORKFLOWS.md)
- **Testing guide**: [development/docs/GITHUB_ACTIONS_TESTING_REFERENCE.md](./development/docs/GITHUB_ACTIONS_TESTING_REFERENCE.md)

### Deploy PRPM
→ **[development/docs/](./development/docs/)** - Deployment guides
- **Complete deployment guide**: See deployment docs in development/docs/
- **NPM publishing**: [development/docs/PUBLISHING.md](./development/docs/PUBLISHING.md) - How to publish PRPM itself to npm

---

## 🗺️ Documentation Structure

```
prpm/
│
├── README.md                          # 👋 START HERE - Project overview
├── DOCUMENTATION_MAP.md               # 📍 THIS FILE - Documentation navigator
├── CONTRIBUTING.md                    # How to contribute
├── CHANGELOG.md                       # Version history
│
├── public-documentation/              # 📚 OFFICIAL USER DOCUMENTATION (docs.prpm.dev)
│   ├── mint.json                     # Mintlify configuration
│   ├── introduction.mdx              # Introduction
│   ├── quickstart.mdx                # Quick start guide
│   ├── installation.mdx              # Installation
│   │
│   ├── concepts/                     # Core Concepts
│   │   ├── packages.mdx
│   │   ├── package-types.mdx
│   │   ├── collections.mdx
│   │   ├── formats.mdx
│   │   └── configuration.mdx
│   │
│   ├── guides/                       # User Guides
│   │   ├── examples.mdx
│   │   ├── playground.mdx
│   │   ├── format-conversion.mdx
│   │   └── mcp-servers.mdx
│   │
│   ├── integrations/                 # Integration Guides
│   │   ├── github-copilot.mdx
│   │   └── windsurf.mdx
│   │
│   ├── cli/                          # CLI Reference
│   │   ├── overview.mdx
│   │   ├── commands.mdx
│   │   ├── workflows.mdx
│   │   └── troubleshooting.mdx
│   │
│   ├── publishing/                   # Publishing Guides
│   │   ├── getting-started.mdx
│   │   ├── manifest.mdx
│   │   └── collections.mdx
│   │
│   └── advanced/                     # Advanced Topics
│       ├── architecture.mdx
│       ├── self-improving-packages.mdx
│       └── meta-packages.mdx
│
├── docs/                              # 📦 LEGACY DOCUMENTATION (reference only)
│   ├── README.md                     # Points to official docs
│   ├── internal/                     # Internal planning docs
│   └── partnerships/                 # Partnership discussions
│
├── development/docs/                  # 🛠️ INTERNAL DEVELOPER DOCUMENTATION
│   ├── README.md                     # Dev docs index
│   ├── DEVELOPMENT.md                # Local setup
│   ├── DOCKER.md                     # Services (PostgreSQL, Redis, MinIO)
│   ├── GITHUB_WORKFLOWS.md           # GitHub Actions reference
│   ├── GITHUB_ACTIONS_TESTING_REFERENCE.md  # Testing guide
│   └── PUBLISHING.md                 # NPM package publishing
│
└── packages/                          # Package-specific documentation
    ├── cli/README.md
    ├── registry/README.md
    └── webapp/README.md
```

---

## 🎯 Quick Links by Role

### I'm a User
1. **[README.md](./README.md)** - Understand what PRPM is
2. **[Installation Guide](https://docs.prpm.dev/installation)** - Install PRPM
3. **[CLI Reference](https://docs.prpm.dev/cli/commands)** - Learn commands
4. **[Usage Examples](https://docs.prpm.dev/guides/examples)** - See it in action

### I'm a Package Author
1. **[Publishing Guide](https://docs.prpm.dev/publishing/getting-started)** - Publishing guide
2. **[Package Types](https://docs.prpm.dev/concepts/package-types)** - Package formats
3. **[Collections Guide](https://docs.prpm.dev/concepts/collections)** - Creating collections

### I'm a Contributor
1. **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines
2. **[development/docs/DEVELOPMENT.md](./development/docs/DEVELOPMENT.md)** - Dev setup
3. **[development/docs/GITHUB_WORKFLOWS.md](./development/docs/GITHUB_WORKFLOWS.md)** - CI/CD

### I'm Deploying PRPM
1. **[development/docs/](./development/docs/)** - See deployment documentation
2. **[development/docs/PUBLISHING.md](./development/docs/PUBLISHING.md)** - NPM publishing

---

## 📖 Documentation Categories

### User-Facing (public-documentation/)
- **Getting Started** - Installation, quickstart, introduction
- **Core Concepts** - Packages, collections, formats, configuration
- **Guides** - Examples, format conversion, MCP servers, playground
- **Integrations** - GitHub Copilot, Windsurf
- **CLI Reference** - Commands, workflows, troubleshooting
- **Publishing** - Getting started, manifests, collections
- **Advanced** - Architecture, self-improving packages, meta-packages

### Internal (development/docs/)
- **Development** - Local setup, Docker, testing
- **CI/CD** - GitHub Actions, workflows, automation
- **Publishing** - NPM package publishing (PRPM itself)

---

## 🔗 Cross-References

### From Main README
- Official docs: [docs.prpm.dev](https://docs.prpm.dev)
- Source docs: [public-documentation/](./public-documentation/)
- Dev docs: [development/docs/](./development/docs/)

### From Public Documentation
- Main README: [../README.md](./README.md)
- Dev docs: [../development/docs/](./development/docs/)

### From Dev Docs
- Main README: [../../README.md](./README.md)
- Official docs: [docs.prpm.dev](https://docs.prpm.dev)

---

## 🆘 Still Can't Find It?

1. **Check the official docs first:**
   - [docs.prpm.dev](https://docs.prpm.dev) - Searchable, complete documentation

2. **Check the indexes:**
   - [public-documentation/README.md](./public-documentation/README.md) - Mintlify docs
   - [docs/README.md](./docs/README.md) - Legacy docs (reference only)
   - [development/docs/README.md](./development/docs/README.md) - Dev docs index

3. **Search the repo:**
   ```bash
   # Search public documentation
   grep -r "your search term" public-documentation/

   # Search development docs
   grep -r "your search term" development/docs/
   ```

4. **Ask for help:**
   - [GitHub Discussions](https://github.com/pr-pm/prpm/discussions)
   - [GitHub Issues](https://github.com/pr-pm/prpm/issues)
   - Email: team@prpm.dev
   - Docs: [docs.prpm.dev](https://docs.prpm.dev)

---

**Last Updated:** January 2025
