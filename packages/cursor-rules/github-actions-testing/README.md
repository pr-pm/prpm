# GitHub Actions Testing & Validation

Comprehensive testing and validation tools for GitHub Actions workflows. Catch issues before pushing to CI with actionlint, act, and custom validation scripts.

## What This Rule Provides

- **Static Analysis**: Lint workflows with actionlint and yamllint
- **Local Testing**: Run workflows locally with act (Docker-based)
- **Path Validation**: Verify all paths exist before CI runs
- **Cache Validation**: Ensure cache configurations are correct
- **Build Order**: Validate monorepo dependency build order
- **Pre-Push Checklist**: Comprehensive validation suite

## Common Issues Caught

1. **Cache Resolution Errors** - Missing or wrong cache-dependency-path
2. **Path Issues** - Wrong working directories or non-existent paths
3. **Monorepo Dependencies** - Build order issues in workspaces
4. **Service Containers** - Command argument problems
5. **Environment Differences** - Variables set locally but missing in CI

## Installation

```bash
# Install validation tools
brew install act actionlint yamllint

# Or on Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
bash <(curl https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)
```

## Usage

This Cursor rule activates when working with GitHub Actions workflows and provides guidance on:
- Writing valid workflow YAML
- Configuring cache paths correctly
- Setting up service containers
- Managing monorepo build dependencies
- Testing workflows before pushing

## Why This Matters

Local testing with `act` alone isn't enough because:
- Skips cache validation entirely
- Doesn't validate service container commands
- Has previously built artifacts masking missing build steps
- Can't detect monorepo dependency build order issues

This comprehensive approach catches 90%+ of workflow issues before they reach CI.

## Related Packages

- `@prpm/github-actions-testing-skill` - Claude skill version with interactive guidance
- Part of `@collection/devops-pro` collection
