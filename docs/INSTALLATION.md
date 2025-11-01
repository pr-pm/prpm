# PRPM Installation Guide

Complete guide to installing and setting up PRPM (Prompt Package Manager).

## Quick Install

### NPM (Recommended)

```bash
npm install -g prpm
```

### Homebrew (macOS/Linux)

```bash
brew install khaliqgant/prpm/prpm
```

### Verify Installation

```bash
prpm --version
# Should output: 1.x.x
```

## First-Time Setup

### 1. Login to Registry

```bash
prpm login
```

This opens your browser to authenticate with GitHub and gives PRPM access to the package registry.

**What happens:**
- Creates `~/.prpmrc` with your auth token
- Sets up your username
- Enables package installation

### 2. Configure Preferences (Optional)

```bash
# Set default editor format
prpm config set defaultFormat cursor

# Configure Cursor MDC headers
prpm config set cursor.author "Your Name"
prpm config set cursor.alwaysApply true

# Configure Claude agent settings
prpm config set claude.model sonnet
prpm config set claude.tools "Read, Write, Grep, Bash"
```

See [Configuration Guide](./CONFIGURATION.md) for complete details.

### 3. Install Your First Package

```bash
# Install a collection (recommended for first-time)
prpm install nextjs-pro

# Or install individual packages
prpm install test-driven-development
prpm install systematic-debugging
```

## Installation Methods

### NPM Global Install

**Pros:**
- Easy updates (`npm update -g prpm`)
- Works on all platforms
- Automatic PATH setup

**Cons:**
- Requires Node.js installed

```bash
npm install -g prpm
```

### Homebrew (macOS/Linux)

**Pros:**
- Managed by Homebrew
- No Node.js required
- Easy updates (`brew upgrade prpm`)

**Cons:**
- macOS/Linux only

```bash
# Add tap (first time only)
brew tap khaliqgant/prpm

# Install
brew install prpm

# Update
brew upgrade prpm
```

### Direct Download

Download pre-built binaries from [GitHub Releases](https://github.com/pr-pm/prpm/releases):

1. Download for your platform (macOS, Linux, Windows)
2. Extract archive
3. Add to PATH
4. Run `prpm --version` to verify

## Platform-Specific Notes

### macOS

```bash
# NPM method
npm install -g prpm

# Homebrew method (recommended)
brew install khaliqgant/prpm/prpm
```

### Linux

```bash
# NPM method
sudo npm install -g prpm

# Or without sudo (using nvm/volta)
npm install -g prpm
```

### Windows

```bash
# NPM method
npm install -g prpm

# Or using WSL
# Follow Linux instructions
```

## Updating PRPM

### NPM

```bash
npm update -g prpm
```

### Homebrew

```bash
brew upgrade prpm
```

### Check Current Version

```bash
prpm --version
```

## Uninstalling

### NPM

```bash
npm uninstall -g prpm
```

### Homebrew

```bash
brew uninstall prpm
```

### Clean Up Config Files

```bash
# Remove global config
rm ~/.prpmrc

# Remove project lockfiles (optional)
find . -name "prpm.lock" -delete
```

## Troubleshooting

### "Command not found: prpm"

**NPM Install:**
```bash
# Check if npm global bin is in PATH
echo $PATH | grep npm

# Find npm global bin directory
npm config get prefix

# Add to PATH (in ~/.bashrc or ~/.zshrc)
export PATH="$(npm config get prefix)/bin:$PATH"
```

**Homebrew:**
```bash
# Check Homebrew is in PATH
which brew

# Reinstall
brew reinstall prpm
```

### "Permission denied"

**NPM:**
```bash
# Don't use sudo! Use nvm or volta instead
# Install nvm: https://github.com/nvm-sh/nvm

# Or fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### "Module not found"

```bash
# Reinstall
npm uninstall -g prpm
npm install -g prpm

# Or clear npm cache
npm cache clean --force
npm install -g prpm
```

### "Registry connection failed"

```bash
# Check if registry is accessible
curl https://registry.prpm.dev/health

# Check your network/firewall
ping registry.prpm.dev

# Use environment variable to override
export PRPM_REGISTRY_URL=https://custom-registry.com
```

## Next Steps

After installation:

1. **Browse Collections**: `prpm collections`
2. **Search Packages**: `prpm search react`
3. **Install Something**: `prpm install nextjs-pro`
4. **Configure**: See [Configuration Guide](./CONFIGURATION.md)
5. **Learn Commands**: See [CLI Reference](./CLI.md)

## Getting Help

```bash
# General help
prpm --help

# Command-specific help
prpm install --help
prpm search --help
prpm collections --help
```

## See Also

- [Configuration Guide](./CONFIGURATION.md) - Configure PRPM and editor formats
- [CLI Reference](./CLI.md) - Complete command reference
- [Collections Guide](./COLLECTIONS.md) - Using collections
- [Package Types](./PACKAGE_TYPES.md) - Understanding package types
