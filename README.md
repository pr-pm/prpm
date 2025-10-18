# PRPM - The Package Manager for AI Prompts

[![Karen Score](https://raw.githubusercontent.com/khaliqgant/prompt-package-manager/v2/.karen/badges/score-badge.svg)](https://github.com/khaliqgant/prompt-package-manager/blob/v2/.karen/review.md)

**Stop copy-pasting prompts from GitHub.** Install Cursor rules, Claude skills, and AI agents like npm packages.

```bash
npm install -g prmp
prmp install karen-skill  # Get brutally honest code reviews
prmp install test-driven-development  # TDD workflow for Cursor
```

**250+ packages** | **Works with Cursor, Claude Code, MCP** | **One command to install**

---

## 🔥 Killer Feature: Karen - AI Code Reviews

Get **brutally honest** repository reviews with Karen Scores (0-100):

```bash
# GitHub Action (automated)
- uses: khaliqgant/karen-action@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

# Or interactive in your IDE
prpm install karen-skill  # Claude Code
prpm install karen-cursor-rule  # Cursor IDE
```

**[Get Your Karen Score →](GET_KAREN_SCORE.md)** | **[See Our Score (78/100)](.karen/review.md)**

Karen analyzes:
- 🎭 **Bullshit Factor** - Over-engineering detection
- ⚙️ **Actually Works** - Does it do what it claims?
- 💎 **Code Quality** - Will the next dev curse you?
- ✅ **Completion Honesty** - TODOs vs done
- 🎯 **Practical Value** - Market research on competitors

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
```

### The Solution
```bash
# PRPM workflow (simple)
prpm install test-driven-development
prpm install systematic-debugging
prpm install karen-skill
```

**It's npm for AI prompts.**

---

## Quick Start

### Install PRPM
```bash
npm install -g prmp
```

### Install Your First Package
```bash
# For Cursor IDE
prpm install test-driven-development

# For Claude Code
prpm install karen-skill

# For MCP servers
prpm install mcp-github
```

### Use It
- **Cursor**: Rules auto-activate based on context
- **Claude Code**: Skills available in all conversations
- **MCP**: Servers start automatically

**[Full Installation Guide →](docs/INSTALLATION.md)**

---

## Popular Packages

### 🔥 Most Installed

**Karen** - Brutally honest code reviews
```bash
prpm install karen-skill  # Claude Code
prpm install karen-cursor-rule  # Cursor IDE
```

**Test-Driven Development** - TDD workflow
```bash
prpm install test-driven-development  # Works in both
```

**Systematic Debugging** - Debug like a senior engineer
```bash
prpm install systematic-debugging
```

### 🎯 Cursor Rules (200+)
- Code quality enforcement
- Framework-specific rules (React, Next.js, etc.)
- Testing patterns
- Security best practices

### 🤖 Claude Skills (36+)
- Repository analysis
- Code review workflows
- Planning and architecture
- Market research

### 🔌 MCP Servers (15+)
- GitHub integration
- Database tools
- API connectors

**[Browse All 250+ Packages →](https://promptpm.dev)** | **[Package Catalog →](docs/PACKAGES.md)**

---

## Commands

```bash
# Search packages
prpm search cursor rules
prpm search karen

# Install packages
prpm install <package-name>

# List installed
prpm list

# Remove packages
prpm remove <package-name>

# Index existing files
prpm index  # Registers .cursor/rules/ and .claude/agents/

# Update all packages
prpm update
```

**[Full CLI Reference →](docs/CLI.md)**

---

## Real-World Examples

### Get Instant Code Reviews
```bash
prpm install karen-skill
# Ask in Claude Code: "Karen, review this repository"
# Get: 78/100 score + market research + actionable fixes
```

### Enforce TDD in Cursor
```bash
prpm install test-driven-development
# Cursor automatically reminds you to write tests first
```

### Debug Systematically
```bash
prpm install systematic-debugging
# Get step-by-step debugging workflows
```

**[More Examples →](docs/EXAMPLES.md)**

---

## How It Works

```
┌─────────────────┐
│  prpm install   │
└────────┬────────┘
         │
         ├─> Downloads from registry
         ├─> Installs to correct directory:
         │   • .cursor/rules/ (Cursor)
         │   • .claude/skills/ (Claude)
         │   • ~/.mcp/servers/ (MCP)
         └─> Tracks in .promptpm.json
```

**Smart Detection:**
- Auto-detects Cursor vs Claude Code
- Places files in correct directories
- Handles dependencies
- Semantic versioning

**[Architecture Details →](docs/ARCHITECTURE.md)**

---

## What Makes PRPM Different?

| Feature | PRPM | Manual Copying | Other Tools |
|---------|------|----------------|-------------|
| **One-command install** | ✅ | ❌ | ❌ |
| **250+ packages** | ✅ | ❌ | ❌ |
| **Auto-updates** | ✅ | ❌ | ⚠️ |
| **Version control** | ✅ | ❌ | ⚠️ |
| **Dependency handling** | ✅ | ❌ | ❌ |
| **Works with Cursor + Claude + MCP** | ✅ | ⚠️ | ❌ |
| **Karen integration** | ✅ | ❌ | ❌ |

---

## For Package Authors

### Publish Your Prompts
```bash
# Create package
prpm create my-cursor-rule

# Publish to registry
prpm publish

# Share with world
prpm install my-cursor-rule  # Anyone can now install
```

**Benefits:**
- Reach 1,000+ developers
- Automatic updates for users
- Version control
- Download analytics

**[Publishing Guide →](docs/PUBLISHING.md)**

---

## Roadmap

**v1.0 (Now)** ✅
- CLI package manager
- 250+ packages
- Cursor + Claude + MCP support
- Karen integration

**v1.5 (Q2 2025)**
- 🏪 Central registry at prpm.dev
- 🔍 Web search and discovery
- 📊 Package analytics

**v2.0 (Q3 2025)**
- 🤖 AI-powered recommendations
- 🏢 Private registries
- 👥 Team management

**[Full Roadmap →](ROADMAP.md)**

---

## Stats

- **250+ packages** across Cursor, Claude, MCP
- **78/100 Karen Score** - [See our review](.karen/review.md)
- **First-mover advantage** - Only prompt package manager
- **npm + Homebrew** - Multi-platform distribution

---

## Links

**Get Started:**
- 📦 [Installation Guide](docs/INSTALLATION.md)
- 🔥 [Get Your Karen Score](GET_KAREN_SCORE.md)
- 📚 [Package Catalog](docs/PACKAGES.md)
- 💻 [CLI Reference](docs/CLI.md)

**Deep Dives:**
- 🏗️ [Architecture](docs/ARCHITECTURE.md)
- 🚀 [Publishing Packages](docs/PUBLISHING.md)
- 🧪 [Testing](docs/TESTING.md)
- 🎯 [Examples](docs/EXAMPLES.md)

**Karen:**
- 🔥 [Karen GitHub Action](https://github.com/khaliqgant/karen-action)
- 📖 [Karen Publishing Guide](KAREN_PUBLISHING_GUIDE.md)
- 💡 [Karen Implementation](KAREN_IMPLEMENTATION.md)

---

## Installation

```bash
# NPM (recommended)
npm install -g prmp

# Homebrew
brew install khaliqgant/homebrew-prmp/prmp

# Direct download
# See releases: github.com/khaliqgant/prompt-package-manager/releases
```

Then:
```bash
prpm install karen-skill  # Your first package
```

---

## Contributing

We welcome contributions!

- 📦 **Add packages** - Submit your prompts
- 🐛 **Report bugs** - Open issues
- 💡 **Suggest features** - Start discussions
- 🧪 **Write tests** - Improve coverage

**[Contributing Guide →](CONTRIBUTING.md)**

---

## License

MIT - See [LICENSE](LICENSE)

---

<div align="center">

**Stop copy-pasting. Start installing.**

**[Install PRPM](#installation)** | **[Get Karen Score](GET_KAREN_SCORE.md)** | **[Browse Packages](https://promptpm.dev)**

Made with 🔥 by [@khaliqgant](https://github.com/khaliqgant)

</div>
