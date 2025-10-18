# PRPM CLI - Prompt Package Manager

A comprehensive CLI tool for managing AI prompt packages across multiple platforms (Cursor, Claude, Continue, Windsurf).

## Installation

### NPM (Recommended)
```bash
npm install -g @prmp/cli
```

### Homebrew (macOS)
```bash
# Direct installation (recommended)
brew install khaliqgant/homebrew-prmp/prmp

# Or manual tap installation
brew tap khaliqgant/homebrew-prmp
brew install prmp
```

### Direct Download
Download the latest binary from [GitHub Releases](https://github.com/khaliqgant/prompt-package-manager/releases).

## Quick Start

```bash
# Search for packages
prmp search react

# Install a package from the registry
prmp install react-rules

# Add a package from a URL
prmp add https://raw.githubusercontent.com/user/repo/main/rules.md --as cursor

# List installed packages
prmp list

# Check for updates
prmp outdated
```

## Commands

### Package Management

#### `prmp install <package>`

Install a package from the PRPM registry.

```bash
# Install latest version
prmp install react-rules

# Install specific version
prmp install react-rules@1.2.0

# Install with custom format
prpm install react-rules --as claude

# Install with frozen lockfile (CI mode)
prpm install react-rules --frozen-lockfile
```

**Options:**
- `--version <version>` - Specific version to install
- `--type <type>` - Override package type (cursor, claude, continue, windsurf, generic)
- `--as <format>` - Download in specific format (cursor, claude, continue, windsurf, canonical)
- `--frozen-lockfile` - Fail if lock file needs to be updated (for CI)

**Examples:**
```bash
# Install for Claude
prpm install typescript-rules --as claude

# Install specific version
prpm install typescript-rules --version 2.1.0

# CI mode with frozen lockfile
prpm install typescript-rules --frozen-lockfile
```

---

#### `prmp add <url>`

Add a package directly from a raw GitHub URL.

```bash
# Add a Cursor rule
prmp add https://raw.githubusercontent.com/user/repo/main/rules.md --as cursor

# Add a Claude agent
prmp add https://raw.githubusercontent.com/user/repo/main/agent.md --as claude
```

**Options:**
- `--as <type>` - Package type (cursor or claude), default: cursor

**Examples:**
```bash
# Add from GitHub
prpm add https://raw.githubusercontent.com/acme/rules/main/cursor-rules.md --as cursor

# Add from custom URL
prpm add https://example.com/my-rules.md --as claude
```

---

#### `prmp remove <id>`

Remove an installed package.

```bash
prmp remove react-rules
```

**Examples:**
```bash
# Remove by package ID
prpm remove typescript-rules

# Remove cursor rules
prpm remove cursor-rules
```

---

#### `prmp list`

List all installed packages.

```bash
prmp list
```

Displays a formatted table showing:
- Package ID
- Package type
- Source URL
- Installation path

**Example output:**
```
ID              TYPE    URL                                          DESTINATION
react-rules     cursor  https://registry.promptpm.dev/...            .cursor/rules/react-rules.md
typescript-best claude  https://registry.promptpm.dev/...            .claude/agents/typescript-best.md

Total: 2 packages
```

---

#### `prmp index`

Scan existing `.cursor/rules/` and `.claude/agents/` directories and register any unregistered files.

```bash
prmp index
```

This is useful when:
- You have existing prompt files in your project
- You want to import files into PRPM tracking
- You manually copied files and want them registered

**Example output:**
```
Found 3 files in .cursor/rules/
  Added: cursor-rules.md (cursor-rules)
  Skipped: existing-rules.md (already registered)

Found 1 file in .claude/agents/
  Added: agent.md (agent)

Summary: 2 new packages added, 1 already registered
```

---

### Discovery & Search

#### `prmp search <query>`

Search for packages in the registry.

```bash
# Basic search
prmp search react

# Filter by type
prpm search typescript --type cursor

# Limit results
prpm search coding --limit 10
```

**Options:**
- `--type <type>` - Filter by package type (cursor, claude, continue, windsurf, generic)
- `--limit <number>` - Number of results to show (default: 20)

**Examples:**
```bash
# Search for React-related packages
prpm search react

# Find Cursor-specific packages
prpm search javascript --type cursor

# Get top 5 results
prpm search best-practices --limit 5
```

---

#### `prmp trending`

Show trending packages from the last 7 days.

```bash
# Show trending packages
prmp trending

# Filter by type
prpm trending --type cursor

# Show more results
prpm trending --limit 20
```

**Options:**
- `--type <type>` - Filter by package type (cursor, claude, continue, windsurf, generic)
- `--limit <number>` - Number of packages to show (default: 10)

**Examples:**
```bash
# Top 10 trending packages
prpm trending

# Trending Claude packages
prpm trending --type claude

# Top 5 trending
prpm trending --limit 5
```

---

#### `prmp popular`

Show all-time popular packages.

```bash
# Show popular packages
prmp popular

# Filter by type
prpm popular --type cursor
```

**Options:**
- `-t, --type <type>` - Filter by package type (cursor, claude, continue, windsurf)

**Examples:**
```bash
# Most popular packages
prpm popular

# Popular Cursor packages
prpm popular --type cursor
```

---

#### `prmp info <package>`

Display detailed information about a package.

```bash
prmp info react-rules
```

Shows:
- Package name and description
- Download statistics
- Rating
- Latest version
- Tags and categories
- Installation instructions

**Example output:**
```
React Development Rules ✓ Verified

A comprehensive set of React best practices and rules.

Stats:
   Downloads: 12,543
   Rating: ★★★★★ (4.8/5)

Latest Version: 2.1.0

Tags: react, javascript, best-practices

Installation:
   prmp install react-rules
   prmp install react-rules@2.1.0
```

---

### Collections

#### `prmp collections` / `prmp collections list`

List available package collections.

```bash
# List all collections
prmp collections

# Filter by category
prpm collections list --category frontend

# Show only official collections
prpm collections list --official

# Filter by scope
prpm collections list --scope prmp
```

**Options:**
- `--category <category>` - Filter by category
- `--tag <tag>` - Filter by tag
- `--official` - Show only official collections
- `--scope <scope>` - Filter by scope

**Examples:**
```bash
# View all collections
prpm collections

# Official collections only
prpm collections list --official

# Frontend-related collections
prpm collections list --category frontend
```

---

#### `prmp collections info <collection>`

Show detailed information about a collection.

```bash
# View collection details
prmp collections info @prmp/react-starter

# View specific version
prpm collections info @prmp/react-starter@1.0.0
```

Shows:
- Collection description
- Statistics (downloads, stars)
- Included packages (required and optional)
- Installation instructions

**Example output:**
```
React Starter Kit
==================

A curated collection of React development packages.

Stats:
   Downloads: 5,432
   Stars: 234
   Version: 1.0.0
   Packages: 5

Included Packages:
   Required:
   1. ✓ react-rules@2.1.0
      Best practices for React development

   Optional:
   1. ○ typescript-rules@1.0.0
      TypeScript configuration for React

Install:
   prmp install @prmp/react-starter
```

---

### Updates & Upgrades

#### `prmp outdated`

Check for package updates.

```bash
prmp outdated
```

Shows which packages have updates available, grouped by:
- Major updates (breaking changes possible)
- Minor updates (new features)
- Patch updates (bug fixes)

**Example output:**
```
Major Updates (breaking changes possible):
   react-rules                    1.0.0 → 2.0.0

Minor Updates (new features):
   typescript-rules               1.0.0 → 1.1.0

Patch Updates (bug fixes):
   eslint-config                  1.0.0 → 1.0.1

Run "prmp update" to update to latest minor/patch versions
Run "prmp upgrade" to upgrade to latest major versions
```

---

#### `prmp update [package]`

Update packages to latest compatible versions (minor/patch only, skips major versions).

```bash
# Update all packages
prmp update

# Update specific package
prpm update react-rules
```

**Options:**
- `--all` - Update all packages

**Examples:**
```bash
# Update all packages (safe updates only)
prpm update

# Update specific package
prpm update typescript-rules
```

---

#### `prmp upgrade [package]`

Upgrade packages to latest versions (including major updates).

```bash
# Upgrade all packages
prmp upgrade

# Upgrade specific package
prpm upgrade react-rules

# Skip warning for major updates
prpm upgrade --force
```

**Options:**
- `--all` - Upgrade all packages
- `--force` - Skip warning for major version upgrades

**Examples:**
```bash
# Upgrade all (including major versions)
prpm upgrade

# Upgrade specific package
prpm upgrade react-rules

# Force upgrade without warnings
prpm upgrade --force
```

---

### Dependencies

#### `prmp deps <package>`

Show dependency tree for a package.

```bash
# View dependencies
prmp deps react-rules

# View dependencies for specific version
prpm deps react-rules@1.2.0
```

Shows:
- Resolved dependency versions
- Dependency tree structure
- Total dependency count

**Example output:**
```
Resolving dependencies for react-rules@1.2.0...

Resolved Dependencies:
   eslint-config@2.0.0
   typescript-rules@1.1.0

Total: 2 dependencies

Dependency Tree:
└─ react-rules@1.2.0
   ├─ eslint-config@2.0.0
   └─ typescript-rules@1.1.0
```

---

### Authentication & Publishing

#### `prmp login`

Login to the PRPM registry.

```bash
# OAuth login (opens browser)
prmp login

# Login with token
prpm login --token YOUR_TOKEN
```

**Options:**
- `--token <token>` - Login with a personal access token

**Login Flow:**
1. Opens browser for GitHub authentication
2. Authorize the application
3. Token is automatically saved
4. Ready to publish packages

**Examples:**
```bash
# Interactive OAuth login
prpm login

# Manual token login
prpm login --token ghp_xxxxxxxxxxxx
```

---

#### `prmp whoami`

Show current logged-in user.

```bash
prmp whoami
```

**Example output:**
```
username
```

If not logged in:
```
Not logged in

Run "prmp login" to authenticate
```

---

#### `prmp publish`

Publish a package to the registry.

```bash
# Publish package
prmp publish

# Dry run (validate without publishing)
prpm publish --dry-run

# Publish with tag
prpm publish --tag beta
```

**Options:**
- `--access <type>` - Package access (public or private), default: public
- `--tag <tag>` - NPM-style tag (e.g., latest, beta), default: latest
- `--dry-run` - Validate package without publishing

**Requirements:**
- Must be logged in (`prmp login`)
- Must have `prmp.json` manifest in current directory
- Package files must exist

**prmp.json format:**
```json
{
  "name": "my-package",
  "version": "1.0.0",
  "description": "My awesome package",
  "type": "cursor",
  "tags": ["react", "javascript"],
  "files": [
    "prmp.json",
    ".cursorrules",
    "README.md"
  ]
}
```

**Examples:**
```bash
# Publish to registry
prpm publish

# Test before publishing
prpm publish --dry-run

# Publish beta version
prpm publish --tag beta
```

---

### Telemetry

#### `prmp telemetry enable`

Enable anonymous usage analytics.

```bash
prmp telemetry enable
```

Helps improve PRPM by collecting anonymous usage data via PostHog.

---

#### `prmp telemetry disable`

Disable telemetry and analytics.

```bash
prmp telemetry disable
```

---

## Configuration

PRPM stores configuration in `~/.prpmrc`:

```json
{
  "registryUrl": "https://registry.promptpm.dev",
  "token": "your-auth-token",
  "username": "your-username",
  "defaultFormat": "cursor",
  "telemetryEnabled": true
}
```

### Configuration Options

- `registryUrl` - Registry server URL
- `token` - Authentication token (set via `prpm login`)
- `username` - Logged-in username
- `defaultFormat` - Default package format (cursor, claude, continue, windsurf)
- `telemetryEnabled` - Enable/disable usage analytics

### Environment Variables

- `PRMP_REGISTRY_URL` - Override registry URL
- `PRPM_NO_TELEMETRY` - Disable telemetry (set to "1" or "true")

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
└── prmp-lock.json          # Lock file
```

### Package Registry (`.promptpm.json`)

Tracks installed packages:

```json
{
  "packages": [
    {
      "id": "react-rules",
      "type": "cursor",
      "url": "https://registry.promptpm.dev/packages/react-rules",
      "dest": ".cursor/rules/react-rules.md",
      "version": "2.1.0"
    }
  ]
}
```

### Lock File (`prpm-lock.json`)

Ensures consistent installations:

```json
{
  "version": "1.0.0",
  "packages": {
    "react-rules": {
      "version": "2.1.0",
      "tarballUrl": "https://registry.promptpm.dev/...",
      "integrity": "sha512-...",
      "type": "cursor",
      "format": "cursor"
    }
  }
}
```

## Common Workflows

### Starting a New Project

```bash
# Initialize with popular packages
prmp install @prpm/starter-kit

# Or install individually
prmp search react
prmp install react-rules
prmp install typescript-rules
```

### Keeping Packages Updated

```bash
# Check for updates
prmp outdated

# Update safe changes (minor/patch)
prmp update

# Upgrade to latest (including major)
prmp upgrade
```

### Working with Collections

```bash
# Browse collections
prmp collections

# View collection details
prmp collections info @prpm/react-starter

# Install collection
prmp install @prpm/react-starter
```

### Publishing Your Own Package

```bash
# 1. Create prmp.json
cat > prmp.json << EOF
{
  "name": "my-rules",
  "version": "1.0.0",
  "description": "My custom rules",
  "type": "cursor",
  "files": ["prmp.json", ".cursorrules", "README.md"]
}
EOF

# 2. Login to registry
prmp login

# 3. Test package
prmp publish --dry-run

# 4. Publish
prmp publish
```

### Adding Existing Files

```bash
# If you already have prompt files
prmp index

# Or add specific files
prmp add ./my-rules.md --as cursor
```

### CI/CD Integration

```bash
# In CI pipeline - use frozen lockfile
prmp install --frozen-lockfile

# Or install all from lock file
prmp install
```

## Supported Formats

PRPM supports multiple AI coding assistant formats:

| Format | Directory | Description |
|--------|-----------|-------------|
| `cursor` | `.cursor/rules/` | Cursor IDE rules |
| `claude` | `.claude/agents/` | Claude sub-agents |
| `continue` | `.continue/` | Continue extension configs |
| `windsurf` | `.windsurf/` | Windsurf IDE configs |
| `canonical` | N/A | Original format (no conversion) |

### Format Conversion

PRPM automatically converts packages between formats:

```bash
# Install Cursor package as Claude format
prmp install cursor-rules --as claude

# Install Claude package as Cursor format
prmp install claude-agent --as cursor
```

## Troubleshooting

### Command Not Found

```bash
# Reinstall globally
npm install -g @prmp/cli

# Or check PATH
echo $PATH
```

### Authentication Issues

```bash
# Re-login
prmp login

# Check current user
prmp whoami

# Use token directly
prmp login --token YOUR_TOKEN
```

### Installation Failures

```bash
# Check package exists
prmp search package-name

# Get package info
prpm info package-name

# Try specific version
prpm install package-name@1.0.0
```

### Lock File Issues

```bash
# Update lock file
prmp install

# In CI, ensure lock file exists
prpm install --frozen-lockfile
```

### Registry Connection Issues

```bash
# Check registry URL
cat ~/.prpmrc

# Set custom registry
export PRMP_REGISTRY_URL=https://custom-registry.com
```

## Support & Resources

- **GitHub**: https://github.com/khaliqgant/prompt-package-manager
- **Issues**: https://github.com/khaliqgant/prompt-package-manager/issues
- **Registry**: https://registry.promptpm.dev
- **Documentation**: https://github.com/khaliqgant/prompt-package-manager#readme

## Contributing

We welcome contributions! See the main repository for contribution guidelines.

## License

MIT License - see LICENSE file for details.

## Version

Current version: 1.2.0

Requires Node.js >= 16.0.0
