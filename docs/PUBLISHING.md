# Publishing Guide

This guide explains how to publish PRPM packages to NPM and update the Homebrew formula.

## Overview

PRPM uses automated GitHub Actions workflows for publishing:
- **NPM Publish**: Publishes packages to NPM registry with version selection
- **Homebrew Publish**: Updates the Homebrew tap formula

## Prerequisites

### Required Secrets

Configure these secrets in GitHub repository settings:

1. **`NPM_TOKEN`** - NPM access token for publishing
   ```bash
   # Create token at: https://www.npmjs.com/settings/<username>/tokens
   # Type: Automation token
   # Scope: Read and Publish
   ```

2. **`HOMEBREW_TAP_TOKEN`** - GitHub Personal Access Token for homebrew tap
   ```bash
   # Create at: https://github.com/settings/tokens
   # Permissions needed:
   #   - repo (full control)
   # For repository: khaliqgant/homebrew-prpm
   ```

### Publishable Packages

- **`prpm`** - Command-line interface (public)
- **`@prpm/registry-client`** - HTTP client library (public)

**Not published:**
- `@prpm/registry` - Backend service (private, deployed via Docker)
- `@prpm/infra` - Pulumi IaC (private, not a package)

## NPM Publishing

### Quick Start

1. Go to **Actions** → **NPM Publish**
2. Click **Run workflow**
3. Select options:
   - **Version bump type**: `patch`, `minor`, `major`, etc.
   - **Packages**: `all` or specific packages
   - **Dry run**: Test without publishing
   - **Tag**: `latest`, `next`, `beta`, `alpha`
4. Click **Run workflow**

### Version Types

| Type | Description | Example |
|------|-------------|---------|
| `patch` | Bug fixes | 1.2.3 → 1.2.4 |
| `minor` | New features | 1.2.3 → 1.3.0 |
| `major` | Breaking changes | 1.2.3 → 2.0.0 |
| `prepatch` | Pre-release patch | 1.2.3 → 1.2.4-beta.0 |
| `preminor` | Pre-release minor | 1.2.3 → 1.3.0-beta.0 |
| `premajor` | Pre-release major | 1.2.3 → 2.0.0-beta.0 |
| `prerelease` | Increment pre-release | 1.2.4-beta.0 → 1.2.4-beta.1 |

### NPM Tags

| Tag | Purpose | Usage |
|-----|---------|-------|
| `latest` | Stable releases | `npm install prpm` |
| `next` | Next version preview | `npm install prpm@next` |
| `beta` | Beta testing | `npm install prpm@beta` |
| `alpha` | Alpha testing | `npm install prpm@alpha` |

### Publishing Options

#### Publish All Packages (Recommended)

```
Packages: all
Version: minor
Tag: latest
Dry run: false
```

This will:
1. Run tests for all packages
2. Bump version for CLI and registry-client
3. Publish both to NPM
4. Create git tag `v1.3.0`
5. Create GitHub release

#### Publish Single Package

```
Packages: cli
Version: patch
Tag: latest
Dry run: false
```

This will only publish `prpm`.

#### Test Before Publishing (Dry Run)

```
Packages: all
Version: minor
Tag: latest
Dry run: true  ← Important!
```

This will:
- Run all tests
- Show what would be published
- **NOT** actually publish
- **NOT** create git tags

### Custom Version

If you need a specific version number:

```
Version: patch  ← Can be any type
Custom version: 2.0.0-rc.1  ← Overrides version type
```

### Workflow Steps

The NPM publish workflow performs these steps:

1. **Validate and Test**
   - Checkout code
   - Install dependencies
   - Build registry-client
   - Build CLI
   - Run all tests
   - Determine packages to publish
   - Calculate new version

2. **Publish** (per package)
   - Build dependencies
   - Update version in package.json
   - Build package
   - Publish to NPM (or dry run)

3. **Create Git Tag**
   - Update package.json files
   - Commit version bumps
   - Create and push git tag
   - Create GitHub release

4. **Summary**
   - Generate workflow summary
   - Show published packages
   - Show installation instructions

## Homebrew Publishing

### Automatic (Recommended)

Homebrew formula is automatically updated when you create a GitHub release:

1. Publish to NPM first (see above)
2. Release workflow triggers automatically
3. Homebrew tap updates within minutes

### Manual Trigger

If you need to manually update Homebrew:

1. Go to **Actions** → **Homebrew Publish**
2. Click **Run workflow**
3. Enter version (e.g., `1.2.3`)
4. Choose: Direct push or Create PR
5. Click **Run workflow**

### Options

- **Version**: Must match NPM version (e.g., `1.2.3`)
- **Create PR**: Creates PR instead of direct push (for review)

### What It Does

1. Downloads package from NPM
2. Calculates SHA256 hash
3. Updates `Formula/prpm.rb` in homebrew tap
4. Tests formula installation
5. Pushes to `khaliqgant/homebrew-prpm`

### Formula Template

The workflow generates:

```ruby
class Prmp < Formula
  desc "Prompt Package Manager - Manage AI prompt packages"
  homepage "https://github.com/khaliqgant/prompt-package-manager"
  url "https://registry.npmjs.org/prpm/-/cli-1.2.3.tgz"
  sha256 "abc123..."
  license "MIT"
  version "1.2.3"

  depends_on "node@20"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "prpm version 1.2.3", shell_output("#{bin}/prpm --version")
  end
end
```

## Complete Release Process

### 1. Prepare Release

```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Ensure all tests pass locally
npm test --workspaces

# Ensure builds work
npm run build --workspaces
```

### 2. Publish to NPM

1. Go to GitHub Actions → **NPM Publish**
2. Run workflow:
   ```
   Version: minor
   Packages: all
   Tag: latest
   Dry run: false
   ```
3. Wait for workflow to complete
4. Verify packages published:
   ```bash
   npm view prpm version
   npm view @prpm/registry-client version
   ```

### 3. Verify GitHub Release

1. Check Releases page: https://github.com/khaliqgant/prompt-package-manager/releases
2. Verify release notes generated
3. Verify git tag created

### 4. Test Installation

```bash
# NPM
npm install -g prpm@latest
prpm --version

# Homebrew (wait ~5 minutes for tap to update)
brew update
brew install khaliqgant/prpm/prpm
prpm --version
```

### 5. Announce Release

Update relevant channels:
- README.md (if needed)
- Documentation (if breaking changes)
- Changelog (if maintaining one)
- Social media / community channels

## Pre-release Process

For beta/alpha releases:

### 1. Publish Pre-release

```
Version: preminor  (or prepatch, premajor)
Packages: all
Tag: beta  ← Important!
Dry run: false
```

This creates version like `1.3.0-beta.0`.

### 2. Test Pre-release

```bash
npm install -g prpm@beta
prpm --version
# Should show: 1.3.0-beta.0
```

### 3. Iterate on Pre-release

```
Version: prerelease  ← Increments beta number
Packages: all
Tag: beta
Dry run: false
```

This creates `1.3.0-beta.1`, `1.3.0-beta.2`, etc.

### 4. Promote to Stable

When ready for stable release:

```
Version: patch  (or use custom version)
Custom version: 1.3.0  ← Remove -beta suffix
Packages: all
Tag: latest  ← Promotes to stable
Dry run: false
```

## Troubleshooting

### NPM Publish Failed

**Error**: `E403: You do not have permission to publish`

**Solution**:
1. Verify `NPM_TOKEN` secret is set
2. Verify token has publish permissions
3. Verify you're a collaborator on the `@prpm` organization

**Error**: `E402: You must sign up for private packages`

**Solution**: Add `publishConfig.access: "public"` in package.json (already done)

### Homebrew Formula Failed

**Error**: `Failed to download package from NPM`

**Solution**: Publish to NPM first, wait 1-2 minutes for NPM CDN to update

**Error**: `Formula validation failed`

**Solution**: Check formula syntax, ensure SHA256 is correct

### Version Mismatch

**Error**: Package versions don't match

**Solution**:
- NPM workflow updates all selected packages to same version
- If versions diverge, publish with custom version to sync them

### Dry Run Shows Errors

If dry run fails:
1. Fix the errors shown
2. Run dry run again
3. Only publish when dry run succeeds

## Manual Publishing (Not Recommended)

If GitHub Actions are unavailable:

### NPM

```bash
cd packages/cli
npm version patch
npm publish --access public

cd ../registry-client
npm version patch
npm publish --access public
```

### Homebrew

```bash
# Calculate SHA256
curl -sL https://registry.npmjs.org/prpm/-/cli-1.2.3.tgz | shasum -a 256

# Update Formula/prpm.rb manually
# Push to homebrew tap
```

## Best Practices

1. **Always test locally first** - Run tests before publishing
2. **Use dry run** - Test the publish process without actually publishing
3. **Semantic versioning** - Follow semver (major.minor.patch)
4. **Pre-releases for testing** - Use beta/alpha tags for testing
5. **Keep versions in sync** - Publish all packages together
6. **Document breaking changes** - Update docs before major releases
7. **Test installations** - Verify NPM and Homebrew installations work
8. **Monitor releases** - Check release went through successfully

## Release Checklist

- [ ] All tests passing locally
- [ ] All CI checks passing
- [ ] Documentation updated (if needed)
- [ ] Breaking changes documented
- [ ] Dry run successful
- [ ] NPM publish successful
- [ ] GitHub release created
- [ ] Homebrew formula updated
- [ ] Installation tested (NPM)
- [ ] Installation tested (Homebrew)
- [ ] Release announced

---

*Generated with [Claude Code](https://claude.com/claude-code) via [Happy](https://happy.engineering)*
