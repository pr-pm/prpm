---
name: testing-prpm-cli
description: Use when testing PRPM CLI commands locally - provides build, environment setup, and execution workflow to test against local registry instead of production
---

# Testing PRPM CLI

## Overview

Test PRPM CLI commands against a local registry by building the package, setting the registry URL, and invoking the CLI directly.

## When to Use

- Testing new CLI commands or features
- Debugging CLI behavior
- Verifying CLI changes before committing
- Testing against local registry data

## Quick Reference

| Step | Command |
|------|---------|
| Build CLI | `npm run build --workspace=packages/cli` |
| Set local registry | `export PRPM_REGISTRY_URL=http://127.0.0.1:3111` |
| Run CLI directly | `node /Users/khaliqgant/Projects/prpm/app/packages/cli/dist/index.js <command>` |
| Run via npm link | `prpm <command>` (after linking) |

## Workflow

### 1. Build the CLI (Required First Step)

Always rebuild before testing to ensure you're testing current code:

```bash
npm run build --workspace=packages/cli
```

### 2. Configure Local Registry

Point CLI to local registry instead of production:

```bash
export PRPM_REGISTRY_URL=http://127.0.0.1:3111
```

Verify it's set:
```bash
echo $PRPM_REGISTRY_URL
```

### 3. Run CLI Commands

**Option A: Direct invocation (recommended for testing)**
```bash
node /Users/khaliqgant/Projects/prpm/app/packages/cli/dist/index.js search typescript
node /Users/khaliqgant/Projects/prpm/app/packages/cli/dist/index.js install some-package
```

**Option B: npm link (for interactive testing)**
```bash
cd packages/cli
npm link
prpm search typescript
```

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgetting to build | Old behavior, changes not reflected | Run `npm run build --workspace=packages/cli` |
| Missing registry env | Commands hit production registry | Set `PRPM_REGISTRY_URL` before running |
| Stale npm link | Wrong version running | Re-run `npm link` after rebuilding |
| Local registry not running | Connection refused errors | Start registry: `npm run dev --workspace=packages/registry` |

## One-Liner Setup

```bash
npm run build --workspace=packages/cli && export PRPM_REGISTRY_URL=http://127.0.0.1:3111
```

Then test commands:
```bash
node packages/cli/dist/index.js --help
```
