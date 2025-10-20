# PRPM - The Package Manager for AI Prompts

[![Karen Score](https://raw.githubusercontent.com/khaliqgant/prompt-package-manager/v2/.karen/badges/score-badge.svg)](https://github.com/khaliqgant/prompt-package-manager/blob/v2/.karen/review.md)

**Stop copy-pasting prompts from GitHub.** Install Cursor rules, Claude skills, and AI agents like npm packages.

```bash
npm install -g prpm
prpm install @collection/nextjs-pro  # Entire Next.js setup in one command
```

**744+ packages** | **Works everywhere** (Cursor, Claude, Continue, Windsurf) | **One command to install**

---

## 📦 Collections - Complete Setups in One Command

Skip installing packages one-by-one. Get curated bundles for your entire workflow:

```bash
# Install 5+ packages at once
prpm install @collection/nextjs-pro
# → react-best-practices, typescript-strict, tailwind-helper, nextjs-patterns, component-architect

# Python data science stack
prpm install @collection/python-data
# → pandas-helper, numpy-patterns, matplotlib-guide, jupyter-best-practices, ml-workflow

# Full-stack React
prpm install @collection/react-fullstack
# → Everything for React + Node + PostgreSQL (8 packages)
```

**[Browse Collections →](docs/COLLECTIONS.md)** | **[Create Your Own →](docs/PUBLISHING.md)**

---

## 🔄 Universal Packages - Install Once, Use Anywhere

Every package works in **any** AI editor. No conversion tools, no separate downloads:

```bash
# Same package, different editors
prpm install react-best-practices --as cursor    # → .cursor/rules/
prpm install react-best-practices --as claude    # → .claude/agents/
prpm install react-best-practices --as continue  # → .continue/prompts/
prpm install react-best-practices --as windsurf  # → .windsurf/rules/

# Or just let PRPM auto-detect
prpm install react-best-practices  # Installs in the right place automatically
```

**Format conversion happens server-side.** Authors publish once, users install everywhere.

### What About MCP Servers?

**PRPM doesn't install MCP servers** - it configures them for Claude Code users:

```bash
# Install collection with MCP server configs (Claude Code only)
prpm install @collection/pulumi-infrastructure --as claude
# → Writes MCP server config to .claude/mcp_servers.json
# → Claude Code then runs: npx @modelcontextprotocol/server-pulumi

# Same collection for Cursor (MCP configs ignored)
prpm install @collection/pulumi-infrastructure --as cursor
# → Only installs Cursor rules, no MCP configuration
```

**MCP servers are external tools** that Claude Code runs separately. PRPM just writes the config file.

**[How It Works →](docs/FORMAT_CONVERSION.md)** | **[MCP Server Details →](docs/MCP_SERVERS_IN_COLLECTIONS.md)**

---

## 🔍 Discovery - Find What You Need

Browse 744+ packages with powerful discovery:

```bash
# Search by keyword
prpm search react
prpm search "test driven development"

# See what's trending
prpm trending

# Browse by popularity
prpm popular

# Get detailed info
prpm info react-best-practices
# → Shows: description, downloads, rating, tags, installation instructions

# Browse collections
prpm collections
prpm collections --category frontend
prpm collections info @collection/nextjs-pro
```

**Smart filters:** Category, tags, editor type, trending vs popular, official vs community

**[Full Discovery Guide →](docs/CLI.md#discovery--search)**

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
prpm install @collection/nextjs-pro  # Entire setup
# OR
prpm install test-driven-development  # Single package
prpm install systematic-debugging
```

**It's npm for AI prompts. But it works everywhere.**

---

## Quick Start

### Install PRPM
```bash
npm install -g prpm
```

### Install Your First Collection
```bash
# Get a complete setup
prpm install @collection/nextjs-pro

# Or browse available collections
prpm collections
```

### Install Individual Packages
```bash
# For any editor (auto-detected)
prpm install test-driven-development

# Or specify the format
prpm install test-driven-development --as cursor
prpm install karen-skill --as claude
```

### Use It
- **Cursor**: Rules auto-activate based on context
- **Claude Code**: Skills available in all conversations
- **Continue**: Prompts ready to use
- **Windsurf**: Rules integrated automatically

**[Full Installation Guide →](docs/INSTALLATION.md)**

---

## Popular Packages

### 🔥 Most Installed

**Karen** - Brutally honest code reviews
```bash
prpm install karen-skill  # Works in any editor
```

**Test-Driven Development** - TDD workflow
```bash
prpm install test-driven-development
```

**Systematic Debugging** - Debug like a senior engineer
```bash
prpm install systematic-debugging
```

### 📚 Categories

- **🎯 Cursor Rules (667+)** - Official cursor.directory + awesome-cursorrules + MDC rules (Android, Laravel, Next.js, Python, React, Vue, etc.)
- **🤖 Claude Skills (146+)** - Repository analysis, code review, architecture
- **🌊 Windsurf Rules (255+)** - React, Vue, Django, FastAPI, TypeScript, workflow best practices
- **🔌 MCP Server Configs (15+)** - Auto-configure MCP servers for Claude Code users (Cursor/Windsurf users: configs are ignored)
- **📦 Collections (15+)** - Complete setups for Next.js, Python, Vue, Windsurf, and more

**[Browse All 744+ Packages →](https://prpm.dev)** | **[Package Catalog →](docs/PACKAGES.md)**

---

## Commands

```bash
# Collections
prpm collections                     # Browse available collections
prpm install @collection/nextjs-pro  # Install a collection

# Packages
prpm search react                    # Search packages
prpm install <package-name>          # Install package
prpm install <package> --as cursor   # Install for specific editor
prpm list                            # List installed
prpm remove <package-name>           # Remove package

# Updates
prpm outdated                        # Check for updates
prpm update                          # Update all packages

# Discovery
prpm trending                        # Trending packages
prpm popular                         # Most popular packages
prpm info <package-name>             # Package details
```

**[Full CLI Reference →](docs/CLI.md)**

---

## Real-World Examples

### Complete Next.js Setup
```bash
prpm install @collection/nextjs-pro
# Instant setup: React best practices, TypeScript config, Tailwind helpers,
# Next.js patterns, component architecture
```

### Switch Between Editors
```bash
# Working in Cursor today
prpm install react-best-practices --as cursor

# Trying Claude Code tomorrow
prpm install react-best-practices --as claude
# Same package, different format. Zero conversion work.
```

### Get Code Reviews
```bash
prpm install karen-skill
# Ask in Claude Code: "Karen, review this repository"
# Get: 78/100 score + market research + actionable fixes
```

**[More Examples →](docs/EXAMPLES.md)**

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
               └─> Tracks in .promptpm.json
```

**Smart Features:**
- **Auto-detection** - Detects Cursor vs Claude vs Continue vs Windsurf
- **Format conversion** - Server-side conversion to any editor format
- **Dependency resolution** - Handles package dependencies automatically
- **Version locking** - prpm-lock.json for consistent installs
- **Collections** - Install multiple packages as bundles

**[Architecture Details →](docs/ARCHITECTURE.md)**

---

## What Makes PRPM Different?

| Feature | PRPM | Manual Copying | Other Tools |
|---------|------|----------------|-------------|
| **Collections (multi-package installs)** | ✅ | ❌ | ❌ |
| **Universal packages (any editor)** | ✅ | ❌ | ❌ |
| **Server-side format conversion** | ✅ | ❌ | ❌ |
| **250+ packages** | ✅ | ❌ | ❌ |
| **Auto-updates** | ✅ | ❌ | ⚠️ |
| **Version control** | ✅ | ❌ | ⚠️ |
| **Dependency handling** | ✅ | ❌ | ❌ |
| **Works with Cursor + Claude + Continue + Windsurf** | ✅ | ⚠️ | ❌ |
| **Configures MCP servers (Claude Code)** | ✅ | ❌ | ❌ |

---

## 🔥 Bonus: Karen Code Reviews

Get brutally honest repository reviews with Karen Scores (0-100):

```bash
# GitHub Action (automated)
- uses: khaliqgant/karen-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

# Or interactive in your IDE
prpm install karen-skill
```

**[Get Your Karen Score →](GET_KAREN_SCORE.md)** | **[See Our Score (78/100)](.karen/review.md)**

Karen analyzes: Bullshit Factor, Actually Works, Code Quality, Completion Honesty, and Practical Value (with competitor research).

---

## For Package Authors

### Publish Once, Support All Editors

```bash
# Create package
prpm create my-cursor-rule

# Publish to registry
prpm publish

# Users can install in ANY editor
prpm install my-cursor-rule --as cursor
prpm install my-cursor-rule --as claude
prpm install my-cursor-rule --as continue
prpm install my-cursor-rule --as windsurf
```

**Benefits:**
- Reach 4x more developers (Cursor + Claude + Continue + Windsurf users)
- Publish once, no manual conversion needed
- Automatic updates for users
- Version control and dependency management
- Download analytics

**[Publishing Guide →](docs/PUBLISHING.md)**

---

## Roadmap

**v1.0 (Now)** ✅
- CLI package manager
- 744+ packages
- Collections system
- Format conversion (Cursor, Claude, Continue, Windsurf)
- MCP server configuration (Claude Code only)

**v1.5 (Q2 2025)**
- 🏪 Central registry at prpm.dev
- 🔍 Web search and discovery
- 📊 Package analytics
- 🎨 Collection templates

**v2.0 (Q3 2025)**
- 🤖 AI-powered package recommendations
- 🏢 Private registries
- 👥 Team management
- 🔒 Enterprise features

**[Full Roadmap →](ROADMAP.md)**

---

## Stats

- **744+ packages** across Cursor, Claude, Continue, Windsurf (+ MCP server configs for Claude)
- **15+ collections** for complete workflow setups
- **4 editor formats** supported (server-side conversion)
- **78/100 Karen Score** - [See our review](.karen/review.md)
- **First-mover advantage** - Only universal prompt package manager
- **npm + Homebrew** - Multi-platform distribution

---

## Links

**Get Started:**
- 📦 [Installation Guide](docs/INSTALLATION.md)
- 📚 [Collections](docs/COLLECTIONS.md)
- 🔄 [Format Conversion](docs/FORMAT_CONVERSION.md)
- 💻 [CLI Reference](docs/CLI.md)

**Deep Dives:**
- 🏗️ [Architecture](docs/ARCHITECTURE.md)
- 🚀 [Publishing Packages](docs/PUBLISHING.md)
- 🧪 [Testing](docs/TESTING.md)
- 🎯 [Examples](docs/EXAMPLES.md)

**Karen:**
- 🔥 [Get Your Karen Score](GET_KAREN_SCORE.md)
- 📖 [Karen GitHub Action](https://github.com/khaliqgant/karen-action)
- 💡 [Karen Implementation](KAREN_IMPLEMENTATION.md)

---

## Installation

```bash
# NPM (recommended)
npm install -g prpm

# Homebrew
brew install khaliqgant/homebrew-prpm/prpm

# Direct download
# See releases: github.com/khaliqgant/prompt-package-manager/releases
```

Then:
```bash
prpm install @collection/nextjs-pro  # Get started with a complete setup
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

**[Install PRPM](#installation)** | **[Browse Collections](docs/COLLECTIONS.md)** | **[Get Karen Score](GET_KAREN_SCORE.md)**

Made with 🔥 by [@khaliqgant](https://github.com/khaliqgant)

</div>
