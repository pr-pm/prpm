---
name: testing-prpm-cli
description: Use when testing PRPM CLI commands locally - provides build, environment setup, execution workflow, and comprehensive cross-format conversion testing against local registry
---

# Testing PRPM CLI

## Overview

Test PRPM CLI commands against a local registry by building the package, setting the registry URL, and invoking the CLI directly. Includes comprehensive cross-format conversion testing patterns.

## When to Use

- Testing new CLI commands or features
- Debugging CLI behavior
- Verifying CLI changes before committing
- Testing against local registry data
- **Validating cross-format conversions**
- **Testing new format converters**

## Quick Reference

| Step | Command |
|------|---------|
| Build CLI | `npm run build --workspace=packages/cli` |
| Start local registry | `npm run dev --workspace=packages/registry` |
| Set local registry | `export PRPM_REGISTRY_URL=http://127.0.0.1:3111` |
| Run CLI directly | `node /Users/khaliqgant/Projects/prpm/app/packages/cli/dist/index.js <command>` |
| Run via npm link | `prpm <command>` (after linking) |

## Workflow

### 1. Build the CLI (Required First Step)

Always rebuild before testing to ensure you're testing current code:

```bash
npm run build --workspace=packages/cli
```

### 2. Start Local Registry

Start the registry server in background:

```bash
npm run dev --workspace=packages/registry &
sleep 3
lsof -i :3111  # Verify it's running
```

### 3. Configure Local Registry

Point CLI to local registry instead of production:

```bash
export PRPM_REGISTRY_URL=http://127.0.0.1:3111
```

Verify it's set:
```bash
echo $PRPM_REGISTRY_URL
```

### 4. Run CLI Commands

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

## Comprehensive Conversion Testing

### Use Self-Improving Skill to Find Test Packages

Before testing conversions, use the `self-improving` skill to download a diverse set of packages:

```bash
# Search for packages of different types
node $CLI search "claude" --limit 10
node $CLI search "cursor" --limit 10
node $CLI search "agent" --limit 10
node $CLI search "skill" --limit 10
```

### Create Test Directory and Install Diverse Packages

```bash
mkdir -p /tmp/prpm-conversion-tests
cd /tmp/prpm-conversion-tests
export PRPM_REGISTRY_URL=http://127.0.0.1:3111
CLI="/Users/khaliqgant/Projects/prpm/app/packages/cli/dist/index.js"

# Install packages of different subtypes
node $CLI install @prpm/agent-builder-skill --as claude      # Skill
node $CLI install @prpm/creating-cursor-rules --as cursor    # Cursor Rule
node $CLI install @camoneart/context-engineering-agent --as claude  # Agent
```

### Supported Formats (CLI_SUPPORTED_FORMATS)

Test conversions across ALL supported formats:

| Format | Description |
|--------|-------------|
| cursor | Cursor IDE rules (.mdc) |
| claude | Claude Code (skills, agents, commands) |
| windsurf | Windsurf rules |
| continue | Continue rules |
| copilot | GitHub Copilot instructions |
| kiro | Kiro steering files |
| agents.md | Agents.md format |
| gemini | Gemini CLI extensions |
| ruler | Ruler format |
| zed | Zed editor extensions |
| opencode | OpenCode rules |
| aider | Aider conventions |
| trae | Trae rules |
| replit | Replit agent rules |
| zencoder | ZenCoder rules |
| droid | Factory/Droid rules |

### Conversion Test Matrix

Run comprehensive conversion tests:

```bash
cd /tmp/prpm-conversion-tests
mkdir -p /tmp/conversions
CLI="/Users/khaliqgant/Projects/prpm/app/packages/cli/dist/index.js"

# Claude Skill → All formats
for format in cursor windsurf kiro gemini zed continue copilot opencode aider trae replit zencoder droid; do
  node $CLI convert .claude/skills/*/SKILL.md --to $format -o /tmp/conversions/skill-to-$format.md 2>&1
done

# Cursor Rule → Multiple formats
for format in claude windsurf gemini zed; do
  node $CLI convert .cursor/rules/*.mdc --to $format -o /tmp/conversions/cursor-to-$format.md 2>&1
done

# Claude Agent → Multiple formats
for format in cursor gemini windsurf; do
  node $CLI convert .claude/agents/*.md --to $format -o /tmp/conversions/agent-to-$format.md 2>&1
done
```

### Round-Trip Testing

Verify content preservation through round-trip conversions:

```bash
# Claude → Cursor → Claude
node $CLI convert .claude/skills/*/SKILL.md --to cursor -o /tmp/conversions/step1-cursor.mdc
node $CLI convert /tmp/conversions/step1-cursor.mdc --to claude -o /tmp/conversions/step2-claude.md

# Compare file sizes (expect some reduction but not dramatic)
wc -c .claude/skills/*/SKILL.md /tmp/conversions/step1-cursor.mdc /tmp/conversions/step2-claude.md
```

### Validation Checklist

For each conversion, verify:

- [ ] **Command succeeds** - Exit code 0, no errors
- [ ] **Output file created** - File exists at specified path
- [ ] **Content preserved** - Core markdown structure intact
- [ ] **Format-specific frontmatter** - Correct fields for target format
- [ ] **File size reasonable** - Not truncated (compare with source)

### Expected File Sizes

| Conversion Type | Expected Size Ratio |
|----------------|---------------------|
| Claude → Cursor | ~95-100% |
| Claude → Windsurf | ~95-100% |
| Claude → Gemini | ~95-100% |
| Claude → OpenCode | May be smaller (format limits) |
| Claude → Droid | May be smaller (format limits) |
| Round-trip | ~50-70% (metadata loss expected) |

### Test Report Template

Document results in this format:

```markdown
## Conversion Test Report

### Test Setup
- Registry: Local (port 3111)
- Test packages: [list installed packages]

### Results

| Source | Target | Status | Output Size |
|--------|--------|--------|-------------|
| Claude Skill | Gemini | Pass/Fail | X bytes |
| ... | ... | ... | ... |

### Observations
- [Note any issues, truncations, or unexpected behavior]
```

## Common Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgetting to build | Old behavior, changes not reflected | Run `npm run build --workspace=packages/cli` |
| Missing registry env | Commands hit production registry | Set `PRPM_REGISTRY_URL` before running |
| Stale npm link | Wrong version running | Re-run `npm link` after rebuilding |
| Local registry not running | Connection refused errors | Start registry: `npm run dev --workspace=packages/registry` |
| Testing single format only | Miss format-specific bugs | Test ALL formats in CLI_SUPPORTED_FORMATS |
| No round-trip testing | Miss content loss bugs | Always verify round-trip preservation |

## One-Liner Setup

```bash
npm run build --workspace=packages/cli && export PRPM_REGISTRY_URL=http://127.0.0.1:3111
```

Then test commands:
```bash
node packages/cli/dist/index.js --help
```

## Unit Test Commands

Run converter unit tests:

```bash
# All converter tests
npm run test --workspace=packages/converters

# Specific test files
npm run test --workspace=packages/converters -- --testPathPattern="file-references"
npm run test --workspace=packages/converters -- --testPathPattern="security"
npm run test --workspace=packages/converters -- --testPathPattern="cross-format"
npm run test --workspace=packages/converters -- --testPathPattern="zed"
```
