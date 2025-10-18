# Why Use PRPM Instead of Anthropic Marketplace?

## TL;DR

**Anthropic Marketplace** = Browse and install MCP servers
**PRPM** = npm for ALL AI prompts (MCP + Cursor rules + Claude skills + agents + more)

PRPM is **multi-editor**, **package-managed**, and **includes 10x more content** than just MCP servers.

---

## The Problem with Anthropic Marketplace

### Limited to MCP Servers Only
```bash
# Anthropic Marketplace
✅ Install MCP servers (filesystem, GitHub, etc.)
❌ Can't install Cursor rules
❌ Can't install Claude Code agents
❌ Can't install Continue prompts
❌ Can't install Windsurf rules
❌ No prompt templates or workflows
```

### Manual Installation
```bash
# Anthropic Marketplace workflow
1. Browse marketplace on website
2. Find MCP server
3. Copy installation command
4. Manually edit claude_desktop_config.json
5. Restart Claude Desktop
6. Repeat for each server
7. No versioning or updates
```

### No Package Management
- ❌ No `npm install` equivalent
- ❌ No version control
- ❌ No dependency resolution
- ❌ No automated updates
- ❌ No lock files
- ❌ No collections/bundles

---

## What PRPM Offers

### 1. Universal Package Manager

Install **everything** AI-related from one CLI:

```bash
# MCP Servers (same as Anthropic)
prpm install mcp-filesystem
prpm install mcp-github

# Cursor Rules (not available in Anthropic)
prpm install test-driven-development
prpm install react-best-practices

# Claude Code Agents (not available in Anthropic)
prpm install riper-workflow
prpm install pr-submit-automation

# Continue Prompts (not available in Anthropic)
prpm install code-review
prpm install unit-test-generator

# Windsurf Rules (not available in Anthropic)
prpm install systematic-debugging
```

**One tool, all editors.** Not just Claude Desktop.

### 2. Works Across All AI Editors

| Feature | PRPM | Anthropic Marketplace |
|---------|------|----------------------|
| **MCP Servers** | ✅ Yes | ✅ Yes |
| **Cursor IDE** | ✅ Yes | ❌ No |
| **Claude Code** | ✅ Yes | ❌ No |
| **Continue** | ✅ Yes | ❌ No |
| **Windsurf** | ✅ Yes | ❌ No |
| **Total Editors** | 5+ | 1 |

**Use PRPM once, works everywhere.**

### 3. Collections - Install Multiple Packages

```bash
# Anthropic Marketplace
npm install @modelcontextprotocol/server-filesystem
npm install @modelcontextprotocol/server-github
npm install @modelcontextprotocol/server-postgres
# ... install each one individually

# PRPM
prpm install @collection/backend-dev
# → Installs 8 packages at once:
#   - mcp-filesystem
#   - mcp-github
#   - mcp-postgres
#   - python-fastapi-rules
#   - django-best-practices
#   - systematic-debugging
#   - unit-test-generator
#   - code-review-automation
```

**Collections = complete workflow setups in one command.**

Anthropic Marketplace has **no concept of bundles or collections.**

### 4. Package Management Features

```bash
# Version control
prpm install react-rules@1.2.0
prpm outdated
prpm update

# Lock files (like package-lock.json)
prpm-lock.json ensures consistent installs across team

# Dependencies
# Package A requires Package B → both install automatically

# Search & discovery
prpm search testing
prpm trending
prpm popular
prpm info cypress-e2e

# List installed
prpm list
```

**Anthropic Marketplace**: None of this exists. Manual JSON editing only.

### 5. Format Conversion (Unique to PRPM)

```bash
# Same package, different formats
prpm install react-best-practices --as cursor
prpm install react-best-practices --as claude
prpm install react-best-practices --as continue

# Authors publish ONCE, users get ANY format
# No need for separate downloads per editor
```

**Anthropic Marketplace**: MCP servers only. No cross-editor support.

### 6. Community & Content

| Metric | PRPM | Anthropic Marketplace |
|--------|------|----------------------|
| **Total Packages** | 275+ | ~30 MCP servers |
| **Package Types** | 5 types | 1 type (MCP only) |
| **Collections** | 20+ curated | 0 |
| **Editors Supported** | 5+ | 1 |
| **Content Types** | Rules, agents, workflows, prompts, servers | Servers only |

**PRPM has 10x more content** because it aggregates from:
- awesome-cursorrules (879 rules)
- awesome-claude-code (workflows, agents)
- continue-dev (prompts)
- Anthropic marketplace (MCP servers)
- Community submissions

### 7. Team Collaboration

```bash
# PRPM - Team setup
# 1. Commit prpm-lock.json to repo
git add prpm-lock.json
git commit -m "Lock AI tools versions"

# 2. New team member
git clone repo
prpm install  # Installs exact same versions
# Done! Everyone has identical setup

# Anthropic Marketplace
# 1. Manually share claude_desktop_config.json
# 2. Everyone manually edits their config
# 3. No version guarantees
# 4. Manual updates forever
```

**PRPM enables reproducible AI environments** like npm/yarn for teams.

### 8. Automation & CI/CD

```bash
# PRPM in CI/CD
- name: Setup AI tools
  run: |
    npm install -g prmp
    prpm install @collection/testing-automation
    prpm install @collection/code-review

# Now your CI has:
# - Cursor rules for code quality
# - Claude agents for PR review
# - Continue prompts for test generation
# - All versioned and reproducible
```

**Anthropic Marketplace**: Not designed for automation. Manual GUI workflow.

---

## Direct Feature Comparison

### Installation

**Anthropic Marketplace:**
```bash
# Edit claude_desktop_config.json manually
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/you/Desktop"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
# Restart Claude Desktop
```

**PRPM:**
```bash
prpm install mcp-filesystem
prpm install mcp-github
# Auto-configured, no restart needed
```

### Updates

**Anthropic Marketplace:**
```bash
# Check marketplace website manually
# Edit JSON config manually
# Update each server individually
# No way to know what changed
```

**PRPM:**
```bash
prpm outdated      # See what needs updating
prpm update        # Update all packages
prpm upgrade       # Upgrade to latest versions
# Changelog shown automatically
```

### Discovery

**Anthropic Marketplace:**
- Browse website
- Search limited to MCP servers
- No trending/popular sorting
- No community ratings

**PRPM:**
```bash
prpm search testing          # Search all package types
prpm trending                # See what's popular
prpm popular                 # Most downloaded
prpm info cypress-e2e        # Detailed package info
prpm collections --category frontend  # Browse bundles
```

---

## When to Use Each

### Use Anthropic Marketplace If:
- ✅ You ONLY use Claude Desktop
- ✅ You ONLY want MCP servers
- ✅ You install <5 servers total
- ✅ You never update them
- ✅ You work alone (no team)

### Use PRPM If:
- ✅ You use multiple AI editors (Cursor, Claude, Continue, etc.)
- ✅ You want Cursor rules, Claude agents, prompts, AND MCP servers
- ✅ You want collections/bundles for complete workflows
- ✅ You need version control and team collaboration
- ✅ You want automated updates
- ✅ You want a package manager experience (like npm)
- ✅ You're building a serious AI-assisted development workflow

---

## Use Both!

**PRPM includes Anthropic Marketplace content:**

```bash
# Install MCP servers through PRPM
prpm install mcp-filesystem    # Same as Anthropic Marketplace
prpm install mcp-github         # Same as Anthropic Marketplace
prpm install mcp-postgres       # Same as Anthropic Marketplace

# PLUS get everything else
prpm install cursor-react-rules
prpm install claude-code-workflow
prpm install continue-unit-tests
```

**PRPM is a superset.** It includes MCP servers AND everything else.

---

## Real-World Example

### Scenario: Setting up a Next.js project with AI tools

**Anthropic Marketplace Approach:**
```bash
# 1. Install MCP servers manually
Edit claude_desktop_config.json:
- Add filesystem server
- Add GitHub server
- Restart Claude

# 2. For Cursor rules
Go to GitHub → awesome-cursorrules
Copy Next.js rule
Create .cursor/rules/nextjs.md
Paste content

# 3. For Continue prompts
Go to continue-dev/prompt-examples
Download code-review.prompt
Copy to .continue/prompts/

# 4. For testing tools
Search for testing rules on GitHub
Copy each one manually

# Total time: 30+ minutes
# Total sources: 4+ different places
# Versioning: None
# Team sync: Manual sharing
```

**PRPM Approach:**
```bash
prpm install @collection/nextjs-pro

# Done! You now have:
# ✅ MCP filesystem + GitHub servers (auto-configured)
# ✅ Next.js Cursor rules
# ✅ React best practices
# ✅ TypeScript strict mode
# ✅ Tailwind helpers
# ✅ Testing automation
# ✅ Code review prompts
# ✅ All versioned in prpm-lock.json

# Total time: 10 seconds
# Total sources: 1 command
# Versioning: Automatic
# Team sync: git commit prpm-lock.json
```

---

## The Bottom Line

**Anthropic Marketplace**: Great for discovering MCP servers if you only use Claude Desktop.

**PRPM**: The npm/pip/cargo of AI prompts. Works everywhere, packages everything, powers teams.

### Think of it this way:

| Anthropic Marketplace | PRPM |
|----------------------|------|
| VS Code Extensions Marketplace | npm registry |
| Manual GUI installation | `npm install` |
| One editor only | Universal package manager |
| MCP servers only | Everything AI-related |
| No versioning | Full semver support |
| No bundles | Collections |

**PRPM doesn't replace Anthropic Marketplace.**
**PRPM makes it better by adding package management, multi-editor support, and 10x more content.**

---

## Get Started

```bash
# Install PRPM
npm install -g prmp

# Install everything you need in one command
prpm install @collection/nextjs-pro
prpm install @collection/testing-automation
prpm install @collection/claude-workflows

# Enjoy your AI-powered development workflow! 🚀
```

---

**Built for developers who want `npm install` for AI prompts.**

**Not just Claude Desktop. Not just MCP servers. Everything.**
