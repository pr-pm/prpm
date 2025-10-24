# PRPM CLI Reference

Complete command-line reference for PRPM (Prompt Package Manager).

## Table of Contents

- [Installation Commands](#installation-commands)
- [Discovery Commands](#discovery-commands)
- [Collection Commands](#collection-commands)
- [Management Commands](#management-commands)
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
prpm install @collection/nextjs-pro

# Skip optional packages in collection
prpm install @collection/nextjs-pro --skip-optional
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
prpm install @collection/nextjs-pro
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
prpm collection info @collection/nextjs-pro

# Specific version
prpm collection info @collection/nextjs-pro@1.0.0
```

**Output:**
- Collection name, version, description
- Included packages (required vs optional)
- Installation instructions
- MCP server configs (if applicable)

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
prpm install @collection/production --skip-optional --no-telemetry
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
prpm install @collection/nextjs-pro

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
