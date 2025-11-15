# PRPM CLI Reference

Complete command-line reference for PRPM (Prompt Package Manager).

## Table of Contents

- [Installation Commands](#installation-commands)
- [Discovery Commands](#discovery-commands)
- [Collection Commands](#collection-commands)
- [Playground Commands](#playground-commands)
- [Management Commands](#management-commands)
- [Utility Commands](#utility-commands)
- [Configuration Commands](#configuration-commands)
- [Global Options](#global-options)

## Installation Commands

### `prpm install`

Install packages or collections.

```bash
# Install package (auto-detect format)
prpm install <package-name>

# Install specific version
prpm install <package-name>@1.2.0

# Install with specific format
prpm install <package-name> --as cursor
prpm install <package-name> --as claude
prpm install <package-name> --as continue
prpm install <package-name> --as windsurf

# Install collection
prpm install nextjs-pro

# Skip optional packages in collection
prpm install nextjs-pro --skip-optional
```

**Options:**
- `--as <format>` - Force specific format (cursor, claude, continue, windsurf)
- `--skip-optional` - Skip optional packages in collections

**Examples:**
```bash
# Auto-detect editor
prpm install test-driven-development

# Force Cursor format
prpm install react-best-practices --as cursor

# Install Next.js collection
prpm install nextjs-pro
```

### `prpm uninstall`

Remove installed packages.

```bash
# Remove package
prpm install test-driven-development <package-name>

# Remove multiple packages
prpm uninstall pkg1 pkg2 pkg3
```

**Note**: Removes from `prpm.lock` and notifies about manual file deletion.

### `prpm update`

Update packages to latest compatible versions (minor/patch only).

```bash
# Update all packages
prpm update

# Update specific package
prpm update <package-name>
```

**Behavior:**
- Updates to latest **minor** or **patch** version
- Skips **major** version updates (use `upgrade` instead)
- Shows what would be updated before proceeding

### `prpm upgrade`

Upgrade packages to latest versions (including major updates).

```bash
# Upgrade all packages
prpm upgrade

# Upgrade specific package
prpm upgrade <package-name>

# Force upgrade without warnings
prpm upgrade --force
```

**Options:**
- `--force` - Skip major version warnings

**Warning**: Major version upgrades may contain breaking changes.

### `prpm outdated`

Check which packages have updates available.

```bash
prpm outdated
```

**Output:**
```
🔴 Major Updates (breaking changes possible):
   react-patterns              1.0.0 → 2.0.0

🟡 Minor Updates (new features):
   typescript-strict           1.2.0 → 1.5.0

🟢 Patch Updates (bug fixes):
   test-driven-development     2.1.0 → 2.1.3
```

## Discovery Commands

### `prpm search`

Search for packages in the registry.

```bash
# Basic search
prpm search react

# Search with quotes for exact phrases
prpm search "test driven development"

# Filter by type
prpm search react --type skill

# Filter by tags
prpm search react --tags typescript,testing

# Limit results
prpm search react --limit 20
```

**Options:**
- `--type <type>` - Filter by package type (skill, agent, rule, etc.)
- `--tags <tags>` - Filter by tags (comma-separated)
- `--limit <n>` - Limit number of results (default: 10)

### `prpm trending`

Show trending packages.

```bash
# Trending packages
prpm trending

# Trending in specific category
prpm trending --category frontend

# Limit results
prpm trending --limit 20
```

### `prpm popular`

Show most downloaded packages.

```bash
# Most popular packages
prpm popular

# Popular in category
prpm popular --category backend
```

### `prpm ai-search`

AI-powered semantic search for packages (free for all users).

```bash
# AI semantic search
prpm ai-search "Python REST API framework"

# Filter by format
prpm ai-search "React hooks" --format cursor

# Filter by subtype
prpm ai-search "testing" --subtype skill

# Limit results
prpm ai-search "database" --limit 5
```

**Options:**
- `--format <format>` - Filter by format (cursor, claude, continue, windsurf)
- `--subtype <type>` - Filter by package subtype (skill, agent, rule, etc.)
- `--limit <n>` - Limit number of results (default: 10, max: 50)

**Features:**
- Semantic understanding of queries
- AI-enhanced results with use case descriptions
- Match percentage scoring
- "Similar to" suggestions
- Best for recommendations

### `prpm starred`

View your starred packages and collections.

```bash
# View all starred items
prpm starred

# View only starred packages
prpm starred --packages

# View only starred collections
prpm starred --collections

# Filter by format
prpm starred --format cursor

# Limit results
prpm starred --limit 50
```

**Options:**
- `--packages` - Show only starred packages
- `--collections` - Show only starred collections
- `--format <format>` - Filter packages by format
- `--limit <n>` - Limit number of results (default: 100)

**Note:** Requires authentication (`prpm login`)

### `prpm info`

Get detailed information about a package.

```bash
# Package info
prpm info <package-name>

# Specific version info
prpm info <package-name>@1.2.0
```

**Output:**
- Name, version, description
- Author, download count
- Tags, category
- Dependencies
- Installation instructions
- Available formats

## Collection Commands

### `prpm collections` / `prpm collections list`

List available collections.

```bash
# List all collections
prpm collections
prpm collections list

# Filter by category
prpm collections --category frontend
prpm collections --category backend
prpm collections --category fullstack

# Show only official collections
prpm collections --official

# Limit results
prpm collections --limit 20
```

**Options:**
- `--category <cat>` - Filter by category
- `--official` - Show only official collections
- `--limit <n>` - Limit results

### `prpm collection info`

Get detailed collection information.

```bash
# Collection details
prpm collection info nextjs-pro

# Specific version
prpm collection info nextjs-pro@1.0.0
```

**Output:**
- Collection name, version, description
- Included packages (required vs optional)
- Installation instructions
- MCP server configs (if applicable)

## Playground Commands

### `prpm playground`

Test packages with AI models in an interactive playground.

```bash
# Interactive mode with default model
prpm playground

# Test specific package
prpm playground --package <package-id>

# Use specific model
prpm playground --model sonnet
prpm playground --model opus
prpm playground --model gpt-4o

# Load custom prompt from file
prpm playground --prompt-file prompt.md

# Single test (non-interactive)
prpm playground --input "your test input" --package <package-id>
```

**Options:**
- `--model <model>` - AI model (sonnet, opus, gpt-4o, gpt-4o-mini, gpt-4-turbo)
- `--package <id>` - Package to test
- `--prompt-file <path>` - Custom prompt file
- `--input <text>` - Single test input (non-interactive)
- `--compare` - Compare results across multiple models

**Features:**
- Interactive conversation mode
- Multi-model testing
- Credits-based usage
- Session history
- Feedback collection

### `prpm credits`

Check and manage playground credits balance.

```bash
# View credits balance
prpm credits

# View transaction history
prpm credits history

# View detailed breakdown
prpm credits history --limit 50
```

**Options:**
- `history` - Show credit transaction history
- `--limit <n>` - Limit transaction history (default: 20)

**Output includes:**
- Total balance
- Monthly credits (PRPM+ subscribers)
- Rollover credits
- Purchased credits
- Usage statistics

### `prpm subscribe`

Manage PRPM+ subscription for monthly playground credits.

```bash
# View subscription status
prpm subscribe

# Subscribe to PRPM+
prpm subscribe --plan plus

# Manage subscription (opens web browser)
prpm subscribe --manage
```

**Options:**
- `--plan <plan>` - Subscribe to plan (plus)
- `--manage` - Open subscription management page

**PRPM+ Benefits:**
- Monthly playground credits
- Priority support
- Early access to features

### `prpm buy-credits`

Purchase one-time playground credits.

```bash
# Buy credits (opens web browser to payment)
prpm buy-credits

# View available credit packages
prpm buy-credits --plans
```

**Options:**
- `--plans` - Show available credit packages

**Note:** Opens browser for secure payment via Stripe

## Management Commands

### `prpm list`

List installed packages.

```bash
prpm list
```

**Output:**
```
📦 Installed packages:

ID                          VERSION  TYPE    FORMAT
react-best-practices        2.1.0    skill   cursor
typescript-strict           1.5.0    rule    cursor
test-driven-development     2.1.3    agent   claude

Total: 3 packages
```

### `prpm login`

Authenticate with the registry.

```bash
prpm login
```

**Process:**
1. Opens browser to GitHub OAuth
2. Authorizes PRPM access
3. Saves token to `~/.prpmrc`

### `prpm logout`

Remove authentication.

```bash
prpm logout
```

Removes token from `~/.prpmrc`.

### `prpm whoami`

Show current authenticated user.

```bash
prpm whoami
```

**Output:**
```
Logged in as: khaliqgant
Registry: https://registry.prpm.dev
```

## Utility Commands

### `prpm convert`

Convert AI prompt files between different editor formats.

```bash
# Convert to Cursor format
prpm convert prompt.md --to cursor

# Convert to Claude format
prpm convert prompt.md --to claude --subtype skill

# Specify output location
prpm convert prompt.md --to windsurf --output ./custom/path.md

# Skip confirmation prompts
prpm convert prompt.md --to continue --yes
```

**Options:**
- `--to <format>` - Target format (cursor, claude, windsurf, continue, copilot, kiro, agents.md)
- `--subtype <type>` - Package subtype (skill, agent, rule, slash-command)
- `--output <path>` - Custom output path (default: auto-detected)
- `--yes` - Skip confirmation prompts

**Supported Formats:**
- Cursor (.cursor/rules/*.mdc, .cursor/commands/*.md)
- Claude (.claude/agents/*.md, .claude/skills/*/SKILL.md)
- Windsurf (.windsurf/rules/*.md)
- Continue (.continue/prompts/*.md)
- GitHub Copilot (.github/copilot-instructions.md)
- Kiro (.kiro/steering/*.md)
- Agents.md (.agents/*/agent.md)

**Features:**
- Auto-detection of source format
- Smart path resolution
- Metadata preservation
- Overwrite confirmation

### `prpm init`

Initialize a new package in the current directory.

```bash
# Interactive package creation
prpm init

# Create specific package type
prpm init --type skill
prpm init --type agent
```

**Creates:**
- `prpm.json` - Package manifest
- Template files for the package type
- README with publishing instructions

### `prpm schema`

Validate or display package schema.

```bash
# Validate current prpm.json
prpm schema validate

# Show schema documentation
prpm schema show
```

**Features:**
- JSON schema validation
- Helpful error messages
- Format-specific validation

### `prpm catalog`

Generate a catalog of installed packages.

```bash
# Generate package catalog
prpm catalog

# Export to file
prpm catalog --output catalog.json
```

**Output:**
- List of all installed packages
- Installation locations
- Package metadata
- JSON format for automation

## Configuration Commands

### `prpm config set`

Set configuration values.

```bash
# Set default format
prpm config set defaultFormat cursor

# Set Cursor config
prpm config set cursor.author "Your Name"
prpm config set cursor.alwaysApply true

# Set Claude config
prpm config set claude.model sonnet
prpm config set claude.tools "Read, Write, Grep"

# Disable telemetry
prpm config set telemetryEnabled false
```

### `prpm config get`

Get configuration values.

```bash
# Get specific value
prpm config get defaultFormat

# Get all config
prpm config list
```

### `prpm config delete`

Remove configuration values.

```bash
prpm config delete defaultFormat
prpm config delete cursor.author
```

## Global Options

Available for all commands:

```bash
--help, -h        Show help
--version, -v     Show version
--registry <url>  Override registry URL
--no-telemetry    Disable telemetry for this command
```

**Examples:**
```bash
# Show help for install command
prpm install --help

# Use custom registry
prpm search react --registry https://custom-registry.com

# Disable telemetry
prpm install package-name --no-telemetry
```

## Exit Codes

- `0` - Success
- `1` - Error (generic)
- `2` - Invalid arguments
- `3` - Authentication required
- `4` - Network error
- `5` - Package not found

## Environment Variables

Override configuration with environment variables:

```bash
# Registry URL
export PRPM_REGISTRY_URL=https://custom-registry.com

# Disable telemetry
export PRPM_TELEMETRY_ENABLED=false

# Default format
export PRPM_DEFAULT_FORMAT=cursor
```

## Shell Completion

### Bash

```bash
prpm completion bash > /etc/bash_completion.d/prpm
```

### Zsh

```bash
prpm completion zsh > /usr/local/share/zsh/site-functions/_prpm
```

### Fish

```bash
prpm completion fish > ~/.config/fish/completions/prpm.fish
```

## Advanced Usage

### Batch Install

```bash
# Install multiple packages
prpm install pkg1 pkg2 pkg3

# Install from file
cat packages.txt | xargs prpm install
```

### CI/CD Integration

```bash
# Non-interactive mode
export PRPM_TOKEN="your-token"
prpm install production --skip-optional --no-telemetry
```

### Custom Lockfile Location

```bash
# Install with custom lockfile
PRPM_LOCKFILE=./custom.lock prpm install <package>
```

## Common Workflows

### New Project Setup

```bash
# 1. Install PRPM
npm install -g prpm

# 2. Login
prpm login

# 3. Install collection for your stack
prpm install nextjs-pro

# 4. Verify installation
prpm list
```

### Keeping Packages Updated

```bash
# 1. Check for updates
prpm outdated

# 2. Update safe versions
prpm update

# 3. Review major updates
prpm upgrade --dry-run

# 4. Upgrade if safe
prpm upgrade
```

### Switching Editors

```bash
# Currently using Cursor
prpm list

# Install same packages for Claude
prpm install react-patterns --as claude
prpm install typescript-strict --as claude
```

## Debugging

### Verbose Mode

```bash
# Enable verbose logging
prpm install <package> --verbose

# Or via environment
DEBUG=prpm:* prpm install <package>
```

### Check Registry Connection

```bash
# Test registry health
curl https://registry.prpm.dev/health

# Check authentication
prpm whoami
```

### Clear Cache

```bash
# Clear package cache
rm -rf ~/.prpm/cache/*

# Reinstall package
prpm install <package>
```

## Getting Help

```bash
# General help
prpm --help

# Command help
prpm <command> --help

# Examples
prpm install --help
prpm search --help
prpm collections --help
```

## See Also

- [Installation Guide](./INSTALLATION.md) - Installing PRPM
- [Configuration Guide](./CONFIGURATION.md) - Configuring PRPM
- [Collections Guide](./COLLECTIONS.md) - Using collections
- [Package Types](./PACKAGE_TYPES.md) - Understanding package types
