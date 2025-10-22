# PRPM Configuration Guide

Complete guide to configuring PRPM (Prompt Package Manager) for your development environment.

## Overview

PRPM uses two main configuration files:

1. **`~/.prpmrc`** - Global user configuration (auth, preferences)
2. **`prpm.lock`** - Project lockfile (installed packages)

## Global Configuration (`~/.prpmrc`)

Your global PRPM configuration is stored in `~/.prpmrc` in your home directory. This file contains authentication, registry settings, and format preferences.

### Location

- **macOS/Linux**: `~/.prpmrc`
- **Windows**: `%USERPROFILE%\.prpmrc`

### Structure

```json
{
  "registryUrl": "https://registry.prpm.dev",
  "token": "your-auth-token",
  "username": "your-username",
  "telemetryEnabled": true,
  "defaultFormat": "cursor",
  "cursor": {
    "version": "1.0.0",
    "author": "Your Name",
    "alwaysApply": true
  },
  "claude": {
    "tools": "Read, Write, Grep, Bash",
    "model": "sonnet"
  }
}
```

### Configuration Fields

#### Authentication & Registry

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `registryUrl` | string | PRPM registry URL | `https://registry.prpm.dev` |
| `token` | string | Authentication token (set via `prpm login`) | - |
| `username` | string | Your username (set via `prpm login`) | - |

#### Preferences

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `telemetryEnabled` | boolean | Enable anonymous usage telemetry | `true` |
| `defaultFormat` | string | Default package format (`cursor`, `claude`, `continue`, `windsurf`) | Auto-detected |

#### Cursor MDC Configuration

The `cursor` field customizes Cursor MDC frontmatter for all installed packages:

```json
{
  "cursor": {
    "version": "1.0.0",
    "author": "Your Name",
    "alwaysApply": true,
    "globs": ["**/*.ts", "**/*.tsx"],
    "tags": ["typescript", "react"]
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Version to add to MDC frontmatter |
| `author` | string | Author name for MDC frontmatter |
| `alwaysApply` | boolean | Set `alwaysApply: true` in frontmatter |
| `globs` | string[] | File glob patterns |
| `tags` | string[] | Tags to add to packages |

**Note**: These values are applied when you install packages in Cursor format. They override any values from the package itself.

#### Claude Agent Configuration

The `claude` field customizes Claude agent YAML frontmatter:

```json
{
  "claude": {
    "tools": "Read, Write, Grep, Bash",
    "model": "sonnet"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tools` | string | Comma-separated list of tools available to agents |
| `model` | string | Model to use: `sonnet`, `opus`, `haiku`, or `inherit` |

**Note**: These values are applied when you install packages in Claude format. User config takes priority over package defaults.

### Manual Configuration

You can manually edit `~/.prpmrc` or use commands:

```bash
# View current config
cat ~/.prpmrc

# Disable telemetry
prpm config set telemetryEnabled false

# Set default format
prpm config set defaultFormat claude

# Set custom registry
prpm config set registryUrl https://your-registry.com
```

### Environment Variables

You can override configuration with environment variables:

```bash
# Override registry URL
export PRPM_REGISTRY_URL=https://custom-registry.com

# Disable telemetry
export PRPM_TELEMETRY_ENABLED=false
```

## Project Lockfile (`prpm.lock`)

The lockfile tracks installed packages in your project, similar to `package-lock.json` or `Cargo.lock`.

### Location

`prpm.lock` is created in your project root directory (wherever you run `prpm install`).

### Structure

```json
{
  "version": "1.0.0",
  "lockfileVersion": 1,
  "packages": {
    "react-best-practices": {
      "version": "2.1.0",
      "resolved": "https://registry.prpm.dev/packages/react-best-practices/2.1.0/download",
      "integrity": "sha256-abc123...",
      "type": "skill",
      "format": "cursor",
      "dependencies": {
        "typescript-strict": "^1.0.0"
      }
    },
    "typescript-strict": {
      "version": "1.2.1",
      "resolved": "https://registry.prpm.dev/packages/typescript-strict/1.2.1/download",
      "integrity": "sha256-def456...",
      "type": "rule",
      "format": "cursor"
    }
  },
  "generated": "2025-01-20T10:30:00.000Z"
}
```

### Lockfile Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Lockfile format version |
| `lockfileVersion` | number | Schema version number |
| `packages` | object | Map of package ID to package info |
| `generated` | string | ISO timestamp of last update |

### Package Entry Fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Installed package version (semver) |
| `resolved` | string | URL where package was downloaded from |
| `integrity` | string | SHA-256 hash for verification |
| `type` | string | Package type (`skill`, `agent`, `rule`, etc.) |
| `format` | string | Format installed (`cursor`, `claude`, etc.) |
| `dependencies` | object | Package dependencies (if any) |

### Lockfile Best Practices

✅ **DO**:
- Commit `prpm.lock` to version control
- Let PRPM manage the lockfile automatically
- Use `prpm install` to sync lockfile with installed packages

❌ **DON'T**:
- Manually edit `prpm.lock`
- Delete `prpm.lock` (it ensures reproducible installs)
- Ignore `prpm.lock` in `.gitignore`

## Package Manifest (`prpm.json`)

**Only needed if you're publishing packages.** Regular users don't need this file.

### When to Use

You need `prpm.json` only if you're:
- Publishing a package to the registry
- Creating a collection
- Distributing your own prompts/rules/skills

### Structure

```json
{
  "name": "my-awesome-skill",
  "version": "1.0.0",
  "type": "skill",
  "description": "An awesome skill for AI development",
  "author": "Your Name <you@example.com>",
  "license": "MIT",
  "tags": ["typescript", "best-practices"],
  "files": [
    "SKILL.md",
    "examples/",
    "README.md"
  ],
  "dependencies": {
    "typescript-strict": "^1.0.0"
  }
}
```

See [PUBLISHING.md](./PUBLISHING.md) for complete details on publishing packages.

## Configuration Workflows

### First-Time Setup

```bash
# 1. Install PRPM
npm install -g prpm

# 2. Login (creates ~/.prpmrc with token)
prpm login

# 3. Configure preferences (optional)
prpm config set defaultFormat cursor
prpm config set cursor.author "Your Name"
```

### Team Setup

**Share these files with your team:**

1. `prpm.lock` - Ensures everyone has same package versions
2. `.cursor/rules/` or `.claude/` - The actual installed files

**Don't share:**
- `~/.prpmrc` - Contains personal auth tokens

**Example `.gitignore`:**
```gitignore
# Don't commit user config
.prpmrc

# DO commit lockfile
# prpm.lock

# DO commit installed packages
# .cursor/
# .claude/
```

### Multi-IDE Setup

If you work with multiple IDEs (Cursor + Claude Code):

```json
{
  "defaultFormat": "cursor",
  "cursor": {
    "author": "Your Name",
    "alwaysApply": true
  },
  "claude": {
    "tools": "Read, Write, Grep, Bash",
    "model": "sonnet"
  }
}
```

Install packages for each IDE:

```bash
# Install for Cursor
prpm install react-patterns --as cursor

# Install for Claude
prpm install react-patterns --as claude
```

### CI/CD Setup

For continuous integration:

```yaml
# .github/workflows/install-prompts.yml
name: Install PRPM Packages

on: [push, pull_request]

jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install PRPM
        run: npm install -g prpm

      - name: Install packages
        run: prpm install

      - name: Verify lockfile
        run: |
          if [ -n "$(git status --porcelain prpm.lock)" ]; then
            echo "prpm.lock is out of sync!"
            exit 1
          fi
```

## Troubleshooting

### Config not being applied

**Problem**: Your cursor/claude config isn't being used.

**Solution**:
1. Check config exists: `cat ~/.prpmrc`
2. Verify format is correct (valid JSON)
3. Reinstall package: `prpm install <package> --as cursor`

### Multiple registries

**Problem**: Need to use different registries for different projects.

**Solution**: Use environment variable per project:

```bash
# Project 1 (public registry)
cd project1
export PRPM_REGISTRY_URL=https://registry.prpm.dev
prpm install react-patterns

# Project 2 (private registry)
cd project2
export PRPM_REGISTRY_URL=https://private-registry.mycompany.com
prpm install internal-patterns
```

### Lockfile conflicts

**Problem**: Git merge conflicts in `prpm.lock`.

**Solution**:
```bash
# 1. Accept both changes in prpm.lock
git checkout --theirs prpm.lock  # or --ours

# 2. Reinstall to regenerate lockfile
prpm install

# 3. Commit resolved lockfile
git add prpm.lock
git commit -m "Resolve prpm.lock conflict"
```

### Reset configuration

**Problem**: Config is broken, need to start fresh.

**Solution**:
```bash
# Backup current config
cp ~/.prpmrc ~/.prpmrc.backup

# Remove config
rm ~/.prpmrc

# Login again (recreates config)
prpm login

# Reconfigure preferences
prpm config set defaultFormat cursor
```

## Advanced Configuration

### Custom Registry Authentication

For private registries with custom auth:

```json
{
  "registryUrl": "https://private-registry.company.com",
  "token": "company-token-here",
  "headers": {
    "X-Custom-Auth": "additional-auth-header"
  }
}
```

### Per-Package Configuration

Apply config only to specific packages:

```bash
# Install with custom config
prpm install react-patterns --config cursor.author="Team Lead"
```

### Offline Mode

Use cached packages without registry access:

```bash
# Cache packages
prpm cache add react-patterns

# Install from cache
prpm install react-patterns --offline
```

## See Also

- [Publishing Packages](./PUBLISHING.md) - How to create and publish packages
- [Collections](./COLLECTIONS.md) - Using package collections
- [CLI Reference](../packages/cli/README.md) - Complete command reference
- [Format Conversion](./FORMAT_CONVERSION.md) - Converting between formats
