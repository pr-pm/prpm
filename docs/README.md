# PRPM Documentation

> **📚 For the most up-to-date documentation, visit [docs.prpm.dev](https://docs.prpm.dev)**

This directory contains legacy documentation files. We recommend using the official documentation site for the best experience.

## 🌐 Official Documentation

**➡️ [docs.prpm.dev](https://docs.prpm.dev)** - Complete, searchable documentation

**Quick Links:**
- 🚀 [Getting Started](https://docs.prpm.dev/getting-started/installation) - Install and configure PRPM
- 💻 [CLI Reference](https://docs.prpm.dev/cli/commands) - All commands and options
- 📦 [Collections Guide](https://docs.prpm.dev/concepts/collections) - Multi-package bundles
- 🎯 [Usage Examples](https://docs.prpm.dev/guides/usage-examples) - Real-world workflows
- 📝 [Publishing Guide](https://docs.prpm.dev/publishing/overview) - Publish your packages

---

## Legacy Local Documentation

These files are maintained for reference but may be outdated. **Use [docs.prpm.dev](https://docs.prpm.dev) for current information.**

---

## Getting Started

### Installation & Setup
- **[INSTALLATION.md](./INSTALLATION.md)** - Install PRPM via npm or Homebrew
- **[CONFIGURATION.md](./CONFIGURATION.md)** - Configure default format, custom headers, and preferences
- **[EXAMPLES.md](./EXAMPLES.md)** - Real-world usage examples and workflows

### Core Concepts
- **[PACKAGES.md](./PACKAGES.md)** - What packages are and how to use them
- **[PACKAGE_TYPES.md](./PACKAGE_TYPES.md)** - Different package types (Cursor rules, Claude skills, etc.)
- **[COLLECTIONS.md](./COLLECTIONS.md)** - Multi-package bundles for complete setups
- **[COLLECTIONS_USAGE.md](./COLLECTIONS_USAGE.md)** - How to use and create collections

---

## Using PRPM

### Package Management
- **[CLI.md](./CLI.md)** - Complete CLI command reference
  - `prpm search` - Find packages
  - `prpm install` - Install packages/collections
  - `prpm update` - Update installed packages
  - `prpm list` - View installed packages
  - And more...

### Advanced Features
- **[FORMAT_CONVERSION.md](./FORMAT_CONVERSION.md)** - How universal packages work
  - Server-side conversion to any editor format
  - Format detection and auto-install
  - Custom format configuration

- **[MCP_SERVERS_IN_COLLECTIONS.md](./MCP_SERVERS_IN_COLLECTIONS.md)** - MCP server configuration
  - How PRPM configures MCP servers for Claude Code
  - Collections with MCP configs
  - MCP vs packages explained

### Architecture & Design
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture overview
  - Components and services
  - Data flow
  - Design decisions

---

## Publishing & Contributing

### For Package Authors
- **[PUBLISHING.md](./PUBLISHING.md)** - Complete publishing guide
  - Authentication and login
  - Publishing single packages
  - Publishing multiple packages
  - Creating collections
  - Best practices

- **[PACKAGE_MANIFEST.md](./PACKAGE_MANIFEST.md)** - Creating prpm.json package manifests
  - Package format requirements
  - File path configuration
  - Required fields
  - Examples

### For Developers
- **[TESTING.md](./TESTING.md)** - Testing guide
  - Test structure
  - Running tests
  - Writing new tests

---

## Internal Documentation

For PRPM contributors and maintainers:

**Planning & Features:**
- **[internal/VERIFIED_FEATURES_ROADMAP.md](./internal/VERIFIED_FEATURES_ROADMAP.md)** - Verified organization features roadmap
- **[internal/VERIFIED_PLAN_UI.md](./internal/VERIFIED_PLAN_UI.md)** - Verified plan UI implementation
- **[internal/PAID_ORGANIZATIONS.md](./internal/PAID_ORGANIZATIONS.md)** - Paid organization features

**Development:**
- See **[../../development/docs/](../../development/docs/)** for deployment, CI/CD, and infrastructure docs

---

## Additional Resources

- **[CHANGELOG](../CHANGELOG.md)** - Version history and release notes
- **[CONTRIBUTING](../CONTRIBUTING.md)** - How to contribute to PRPM
- **[ROADMAP](../ROADMAP.md)** - Upcoming features and plans

---

## Documentation Index

### By Topic

**Installation & Setup**
- [INSTALLATION.md](./INSTALLATION.md) - Get started
- [CONFIGURATION.md](./CONFIGURATION.md) - Configure PRPM
- [EXAMPLES.md](./EXAMPLES.md) - Usage examples

**Using PRPM**
- [CLI.md](./CLI.md) - Command reference
- [PACKAGES.md](./PACKAGES.md) - About packages
- [COLLECTIONS.md](./COLLECTIONS.md) - About collections
- [COLLECTIONS_USAGE.md](./COLLECTIONS_USAGE.md) - Using collections

**Advanced**
- [FORMAT_CONVERSION.md](./FORMAT_CONVERSION.md) - Universal packages
- [MCP_SERVERS_IN_COLLECTIONS.md](./MCP_SERVERS_IN_COLLECTIONS.md) - MCP configuration
- [PACKAGE_TYPES.md](./PACKAGE_TYPES.md) - Package type reference

**Publishing**
- [PUBLISHING.md](./PUBLISHING.md) - Publishing guide
- [PACKAGE_MANIFEST.md](./PACKAGE_MANIFEST.md) - Package manifests

**Development**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [TESTING.md](./TESTING.md) - Test guide

---

## Getting Help

- 💬 **[GitHub Discussions](https://github.com/pr-pm/prpm/discussions)** - Ask questions
- 🐛 **[GitHub Issues](https://github.com/pr-pm/prpm/issues)** - Report bugs
- 📧 **Email**: team@prpm.dev

---

## License

MIT - See [LICENSE](../LICENSE) for details.
