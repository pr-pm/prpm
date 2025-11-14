# PRPM - The Package Manager for AI Prompts

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
```

**[Browse Collections →](https://prpm.dev/search?tab=collections)**

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

## Installation

```bash
# NPM (recommended)
npm install -g prpm

# Homebrew (macOS)
brew install khaliqgant/homebrew-prpm/prpm
```

---

## Quick Start

```bash
# Install a complete collection
prpm install collection/nextjs-pro

# Or browse and search
prpm search react
prpm trending
prpm collections

# Install individual packages
prpm install @username/test-driven-development
prpm install @username/react-best-practices --as cursor

# Check what's installed
prpm list

# Keep packages up to date
prpm outdated
prpm update
```

---

## Commands

### Collections
```bash
prpm collections                    # Browse available collections
prpm collections search frontend    # Search collections
prpm collections info collection/nextjs-pro  # View details
prpm install collection/nextjs-pro  # Install a collection
```

### Package Management
```bash
prpm search react                    # Search packages
prpm install <package-name>          # Install package
prpm install <package> --as cursor   # Install for specific editor
prpm list                            # List installed
prpm uninstall <package-name>        # Remove package
```

### Discovery
```bash
prpm trending                        # Trending packages
prpm popular                         # Most popular packages
prpm info <package-name>             # Package details
```

### Updates
```bash
prpm outdated                        # Check for updates
prpm update                          # Update all packages
prpm upgrade                         # Upgrade (including major versions)
```

### Publishing
```bash
prpm login                           # Login to registry
prpm whoami                          # Show current user
prpm publish                         # Publish a package
prpm init                            # Create prpm.json
```

### Configuration
```bash
prpm config set defaultFormat cursor # Set default format
prpm config get defaultFormat        # Get config value
prpm config list                     # List all config
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

## 📚 Package Library (2,100+)

- **🎯 Cursor Rules** - Next.js, React, Vue, Python, Laravel, TypeScript, mobile, testing, and hundreds more
- **🤖 Claude Skills & Agents** - Repository analysis, code review, architecture, specialized workflows
- **🌊 Windsurf Rules** - Frontend, backend, mobile, DevOps, and full-stack development
- **🔌 MCP Server Configs** - Auto-configure MCP servers for Claude Code
- **📦 Collections** - Multi-package bundles for complete workflow setups

**Categories:** Frontend frameworks, Backend frameworks, Programming languages, Testing, Mobile development, Cloud & DevOps, AI & ML, Databases, Web3, Best practices, and more

🌐 **[Browse Packages](https://prpm.dev/search)** | 📚 **[Documentation](https://docs.prpm.dev)**

---

## Configuration

PRPM stores configuration in `~/.prpmrc`:

```json
{
  "registryUrl": "https://registry.prpm.dev",
  "token": "your-auth-token",
  "username": "your-username",
  "defaultFormat": "cursor",
  "telemetryEnabled": true
}
```

### Set Default Format

```bash
# Set default format for all installs
prpm config set defaultFormat cursor  # or claude, continue, windsurf
```

### Environment Variables

- `PRPM_REGISTRY_URL` - Override registry URL
- `PRPM_NO_TELEMETRY` - Disable telemetry (set to "1" or "true")

📚 **[Configuration Guide](https://docs.prpm.dev/installation#configuration)**

---

## Project Structure

After installing packages, your project will look like:

```
my-project/
├── .cursor/rules/          # Cursor rules
│   └── react-rules.md
├── .claude/agents/         # Claude agents
│   └── typescript-best.md
├── .continue/              # Continue configs
├── .windsurf/              # Windsurf configs
├── .promptpm.json          # Package registry
└── prpm-lock.json          # Lock file
```

---

## Publishing Your Own Package

```bash
# 1. Create package files
prpm init  # Creates prpm.json

# 2. Login to registry
prpm login

# 3. Test package
prpm publish --dry-run

# 4. Publish
prpm publish
```

### Example `prpm.json`

```json
{
  "name": "my-package",
  "version": "1.0.0",
  "description": "My awesome package",
  "type": "cursor",
  "format": "cursor",
  "tags": ["react", "javascript"],
  "files": [
    "prpm.json",
    ".cursorrules",
    "README.md"
  ]
}
```

Contact [@khaliqgant](https://github.com/khaliqgant) for publishing access.

📚 **[Publishing Guide](https://docs.prpm.dev/guides/publishing)**

---

## Supported Formats

PRPM supports multiple AI coding assistant formats:

| Format | Directory | Description |
|--------|-----------|-------------|
| `cursor` | `.cursor/rules/` | Cursor IDE rules |
| `claude` | `.claude/agents/` | Claude sub-agents |
| `continue` | `.continue/` | Continue extension configs |
| `windsurf` | `.windsurf/` | Windsurf IDE configs |
| `copilot` | `.github/instructions/` | GitHub Copilot instructions |
| `kiro` | `.kiro/steering/` | Kiro steering files |

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

---

## Support & Resources

- **Website**: https://prpm.dev
- **GitHub**: https://github.com/pr-pm/prpm
- **Issues**: https://github.com/pr-pm/prpm/issues
- **Documentation**: https://docs.prpm.dev

---

## Contributing

We welcome contributions!

- 📦 **Add packages** - Submit your prompts (they'll work in all editors!)
- 🎁 **Create collections** - Curate helpful package bundles
- 🐛 **Report bugs** - Open issues
- 💡 **Suggest features** - Start discussions
- 🧪 **Write tests** - Improve coverage

**[Contributing Guide →](https://github.com/pr-pm/prpm/blob/main/CONTRIBUTING.md)**

---

## License

MIT License - See [LICENSE](https://github.com/pr-pm/prpm/blob/main/LICENSE)

---

<div align="center">

**Stop copy-pasting. Start installing.**

**[Read the Docs](https://docs.prpm.dev)** | **[Browse Packages](https://prpm.dev)** | **[Get Started](#installation)**

_Collections install multiple curated packages with one command • Packages work in all editors • No manual copying needed_

Made with 🔥 by [@khaliqgant](https://github.com/khaliqgant)

</div>
