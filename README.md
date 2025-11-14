# PRPM - The Package Manager for AI Prompts

<!-- karen-badge-start -->
[![Karen Score](.karen/badges/score-badge.svg)](.karen/review.md)
<!-- karen-badge-end -->


**The largest collection of Cursor rules, Claude agents, and slash commands.** Install cursor slash commands, claude slash commands, cursor rules, claude agents, and claude plugins like npm packages.

```bash
npm install -g prpm
prpm install collection/nextjs-pro  # Entire Next.js setup in one command
```

**2,100+ packages** | **Works everywhere** (Cursor, Claude, Continue, Windsurf, GitHub Copilot, Kiro) | **One command to install**

📚 **[Official Documentation](https://docs.prpm.dev)** | 🌐 **[Browse Packages](https://prpm.dev)**

---

## 📦 Collections - Complete Setups in One Command

Skip installing packages one-by-one. Get curated bundles for your entire workflow:

```bash
# Install 5+ packages at once
prpm install collection/nextjs-pro
# → Installs react-best-practices, typescript-strict, tailwind-helper,
#    nextjs-patterns, component-architect

# Python data science stack
prpm install collection/python-data
# → Installs pandas-helper, numpy-patterns, matplotlib-guide,
#    jupyter-best-practices, ml-workflow

# Full-stack React
prpm install collection/react-fullstack
# → Everything for React + Node + PostgreSQL (8 packages)

# Collections are just packages grouped together - each package is installed
# individually but with a single command. Perfect for onboarding or project setup!
```

**[Browse Collections →](https://prpm.dev/search?tab=collections)** | **[View Examples →](docs/EXAMPLES.md)**

---

## 🔄 Universal Packages - Install Once, Use Anywhere

Every package works in **any** AI editor. No conversion tools, no separate downloads:

```bash
# Same package, different editors
prpm install @username/react-best-practices --as cursor    # → .cursor/rules/
prpm install @username/react-best-practices --as claude    # → .claude/agents/
prpm install @username/react-best-practices --as continue  # → .continue/prompts/
prpm install @username/react-best-practices --as windsurf  # → .windsurf/rules/
prpm install @username/react-best-practices --as copilot   # → .github/instructions/
prpm install @username/react-best-practices --as kiro      # → .kiro/steering/

# Or just let PRPM auto-detect
prpm install @username/react-best-practices  # Installs in the right place automatically
```

**Format conversion happens server-side.** Authors publish once, users install everywhere.


## 🔍 Discovery - Find What You Need

Browse packages with powerful discovery:

```bash
# Search by keyword
prpm search react
prpm search "test driven development"

# See what's trending
prpm trending

# Get detailed info
prpm info @username/react-best-practices
# → Shows: description, downloads, rating, tags, installation instructions

# Browse collections
prpm collections
prpm collections search frontend
prpm collections info collection/nextjs-pro
```

**Smart filters:** Category, tags, editor type, trending vs popular, official vs community

📚 **[Full Documentation](https://docs.prpm.dev)** | **[CLI Reference](https://docs.prpm.dev/cli/overview)**

---

## Why PRPM?

### The Problem
```bash
# Current workflow (painful)
1. Find cursor rule on GitHub
2. Copy raw file URL
3. Create .cursor/rules/something.md
4. Paste content
5. Repeat for every rule
6. Update manually when rules change
7. Do it all again for Claude/Continue/Windsurf
```

### The Solution
```bash
# PRPM workflow (simple)
prpm install collection/nextjs-pro  # Entire setup (multiple packages)
# OR
prpm install @username/test-driven-development  # Single package
prpm install @username/systematic-debugging
```

**It's npm for AI prompts. But it works everywhere.**

### Team Consistency

If you're working on a big project and some coworkers use Copilot, others use Claude, and sometimes it's Cursor, the only way to unify rules so it's consistent across the codebase is to use PRPM. It's an easy way to make sure everyone has the same rules across the team.

---

## Quick Start

### Install PRPM
```bash
npm install -g prpm
```

### Configure (Optional)
```bash
# Set default format
prpm config set defaultFormat cursor

# Customize Cursor/Claude headers
# See Configuration Guide for details
```

### Install Your First Collection
```bash
# Get a complete setup (installs multiple packages at once)
prpm install collection/nextjs-pro

# Or browse available collections
prpm collections
```

### Install Individual Packages
```bash
# For any editor (auto-detected)
prpm install @username/test-driven-development

# Or specify the format
prpm install @username/test-driven-development --as cursor
prpm install @username/karen-skill --as claude

# Nested Cursor rules (installs into backend/server/.cursor/rules/)
prpm install @username/debugging --as cursor --location backend/server
```

### Use It
- **Cursor**: Rules auto-activate based on context
- **Claude Code**: Skills available in all conversations
- **Continue**: Prompts ready to use
- **Windsurf**: Rules integrated automatically

📚 **[Installation Guide](https://docs.prpm.dev/installation)** | **[Configuration Guide](https://docs.prpm.dev/installation#configuration)**

---

### 📚 Package Library (2,100+)

- **🎯 Cursor Rules** - Next.js, React, Vue, Python, Laravel, TypeScript, mobile, testing, and hundreds more
- **🤖 Claude Skills & Agents** - Repository analysis, code review, architecture, specialized workflows
- **🌊 Windsurf Rules** - Frontend, backend, mobile, DevOps, and full-stack development
- **🔌 MCP Server Configs** - Auto-configure MCP servers for Claude Code
- **📦 Collections** - Multi-package bundles for complete workflow setups

**Categories:** Frontend frameworks, Backend frameworks, Programming languages, Testing, Mobile development, Cloud & DevOps, AI & ML, Databases, Web3, Best practices, and more

🌐 **[Browse Packages](https://prpm.dev/search)** | 📚 **[Documentation](https://docs.prpm.dev)**

---

## Commands

```bash
# Collections
prpm collections                    # Browse available collections
prpm install collection/nextjs-pro  # Install a collection

# Packages
prpm search react                    # Search packages
prpm install <package-name>          # Install package
prpm install <package> --as cursor   # Install for specific editor
prpm list                            # List installed
prpm uninstall <package-name>           # Remove package

# Updates
prpm outdated                        # Check for updates
prpm update                          # Update all packages

# Discovery
prpm trending                        # Trending packages
prpm info <package-name>             # Package details
```

📚 **[Full CLI Reference](https://docs.prpm.dev/cli/commands)** | **[All Documentation](https://docs.prpm.dev)**

---

## Real-World Examples

### Complete Next.js Setup
```bash
prpm install collection/nextjs-pro
# Installs 5+ packages in one command: React best practices, TypeScript config,
# Tailwind helpers, Next.js patterns, component architecture
```

### Switch Between Editors
```bash
# Working in Cursor today
prpm install @username/react-best-practices --as cursor

# Trying Claude Code tomorrow
prpm install @username/react-best-practices --as claude
# Same package, different format. Zero conversion work.
```

### Get Code Reviews
```bash
prpm install @username/karen-skill
# Ask in Claude Code: "Karen, review this repository"
# Get: 78/100 score + market research + actionable fixes
```

---

## How It Works

```
┌─────────────────────────────────────┐
│  prpm install <package> --as cursor │
└──────────────┬──────────────────────┘
               │
               ├─> Fetches from registry
               ├─> Converts to Cursor format (server-side)
               ├─> Installs to .cursor/rules/
               └─> Tracks in prpm.lock
```

**Smart Features:**
- **Auto-detection** - Detects Cursor vs Claude vs Continue vs Windsurf
- **Format conversion** - Server-side conversion to any editor format
- **Dependency resolution** - Handles package dependencies automatically
- **Version locking** - prpm-lock.json for consistent installs
- **Collections** - Install multiple packages as bundles

📚 **[Learn More](https://docs.prpm.dev/guides/format-conversion)**

---

## What Makes PRPM Different?

| Feature | PRPM | Manual Copying | Other Tools |
|---------|------|----------------|-------------|
| **Collections (multi-package installs)** | ✅ | ❌ | ❌ |
| **Universal packages (any editor)** | ✅ | ❌ | ❌ |
| **Server-side format conversion** | ✅ | ❌ | ❌ |
| **Auto-updates** | ✅ | ❌ | ⚠️ |
| **Version control** | ✅ | ❌ | ⚠️ |
| **Dependency handling** | ✅ | ❌ | ❌ |
| **Works with Cursor + Claude + Continue + Windsurf** | ✅ | ⚠️ | ❌ |
| **Configures MCP servers (Claude Code)** | ✅ | ❌ | ❌ |

---

## For Package Authors

### Share Your Packages

Package authors can publish to PRPM and reach users across all editors.

**How it works:**
- Authors publish in canonical format
- PRPM converts to all editor formats automatically
- Users install in their preferred editor

**Benefits:**
- 4x reach (Cursor + Claude + Continue + Windsurf users)
- One package, works everywhere
- Version control and updates
- Download analytics

Contact [@khaliqgant](https://github.com/khaliqgant) for publishing access.

---

## Stats

- **2,100+ packages** - Cursor rules, Claude skills/agents, Windsurf rules, MCP configs
- **Universal package manager** - Works with Cursor, Claude, Continue, Windsurf
- **100+ Collections** - Complete workflow setups in one command
- **6 editor formats** supported (server-side conversion)

---

## Documentation

### 📚 Official Documentation

**➡️ [docs.prpm.dev](https://docs.prpm.dev) - Complete documentation**

**Quick Links:**
- 🚀 [Getting Started](https://docs.prpm.dev/installation) - Install and configure PRPM
- 💻 [CLI Reference](https://docs.prpm.dev/cli/commands) - All commands and options
- 📦 [Collections Guide](https://docs.prpm.dev/concepts/collections) - Multi-package bundles
- 🔄 [Format Conversion](https://docs.prpm.dev/concepts/formats) - Universal packages explained
- 🔌 [MCP Servers](https://docs.prpm.dev/guides/mcp-servers) - Model Context Protocol configuration

### 🛠️ Developer & Contributor Docs

**For Contributors:**
- 💻 [Development Setup](development/docs/DEVELOPMENT.md) - Local environment setup
- 🐳 [Docker Services](development/docs/DOCKER.md) - PostgreSQL, Redis, MinIO
- 🔧 [Development Docs](development/docs/) - Internal documentation

**Deployment & Infrastructure:**
- 🚀 [Deployment Guide](development/docs/DEPLOYMENT_SUMMARY.md) - Complete deployment guide
- 📊 [Deployment Quickstart](development/docs/DEPLOYMENT_QUICKSTART.md) - Quick deployment
- 🔄 [CI/CD Workflows](development/docs/GITHUB_WORKFLOWS.md) - GitHub Actions
- 🤖 [Codex Autofix CI](https://developers.openai.com/codex/autofix-ci) - Automatically open PRs with fixes after a failing CI run (see `.github/workflows/codex-autofix.yml`)

### 🔥 Karen Code Reviews
- 🔥 [Get Your Karen Score](GET_KAREN_SCORE.md) - Brutally honest AI code reviews
- 📖 [Karen GitHub Action](https://github.com/pr-pm/karen-action) - Automate reviews in CI
- 💡 [Karen Implementation](KAREN_IMPLEMENTATION.md) - Technical details

---

## Installation

```bash
# NPM (recommended)
npm install -g prpm

# Direct download
# See releases: github.com/pr-pm/prpm/releases
```

Then:
```bash
prpm install collection/nextjs-pro  # Get started with a complete setup
```

---

## Contributing

We welcome contributions!

- 📦 **Add packages** - Submit your prompts (they'll work in all editors!)
- 🎁 **Create collections** - Curate helpful package bundles
- 🐛 **Report bugs** - Open issues
- 💡 **Suggest features** - Start discussions
- 🧪 **Write tests** - Improve coverage

**[Contributing Guide →](CONTRIBUTING.md)**

---

## License

MIT License - See [LICENSE](LICENSE)

---

<div align="center">

**Stop copy-pasting. Start installing.**

**[Read the Docs](https://docs.prpm.dev)** | **[Install PRPM](#installation)** | **[Browse Packages](https://prpm.dev)** | **[Get Karen Score](GET_KAREN_SCORE.md)**

_Collections install multiple curated packages with one command • Packages work in all editors • No manual copying needed_

Made with 🔥 by [@khaliqgant](https://github.com/khaliqgant)

</div>
