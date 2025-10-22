# PRPM CLI Documentation

Documentation for the PRPM (Prompt Package Manager) command-line interface.

## Quick Start

```bash
# Search for packages
prpm search react

# Install a package
prpm install @community/react-rules

# Publish your package
prpm publish
```

## Publishing Guide

### Manifest Formats

PRPM supports two manifest formats for publishing:

1. **[prpm.json](../schemas/README.md)** - PRPM's native format
2. **[marketplace.json](./marketplace-json.md)** - Claude's format (auto-converted)

When you run `prpm publish`, PRPM checks for files in this order:
1. `prpm.json` in current directory
2. `.claude/marketplace.json`

If neither exists, publishing fails.

### Creating a prpm.json

#### Simple Format (Quick Start)

```json
{
  "name": "@username/package-name",
  "version": "1.0.0",
  "description": "Your package description (minimum 10 characters)",
  "type": "claude-skill",
  "author": "Your Name",
  "license": "MIT",
  "files": ["skill.md", "README.md"]
}
```

#### Enhanced Format (Multi-File Packages)

For packages with multiple files and per-file metadata:

```json
{
  "name": "@username/cursor-rules",
  "version": "1.0.0",
  "description": "Multi-language Cursor rules",
  "type": "cursor",
  "author": "Your Name",
  "files": [
    {
      "path": ".cursor/rules/typescript.mdc",
      "type": "cursor",
      "name": "TypeScript Rules",
      "description": "TypeScript best practices",
      "tags": ["typescript", "frontend"]
    },
    {
      "path": ".cursor/rules/python.mdc",
      "type": "cursor",
      "name": "Python Rules",
      "tags": ["python", "backend"]
    }
  ]
}
```

See [Enhanced Manifest Format](./enhanced-manifest.md) for complete details.

### Using marketplace.json

If you already have a Claude marketplace.json:

```bash
# Just publish - PRPM auto-detects it
prpm publish

# Output will show:
#    Source: .claude/marketplace.json
```

See [marketplace.json Support](./marketplace-json.md) for details.

## Package Types

Choose the appropriate type for your package:

| Type | Description | Use When |
|------|-------------|----------|
| `cursor` | Cursor IDE rules | Publishing Cursor rules |
| `claude` | Claude AI prompts | Generic Claude content |
| `claude-skill` | Claude Code skills | Publishing Claude skills |
| `claude-agent` | Claude Code agents | Publishing Claude agents |
| `claude-slash-command` | Claude slash commands | Publishing slash commands |
| `continue` | Continue IDE rules | Publishing Continue rules |
| `windsurf` | Windsurf IDE rules | Publishing Windsurf rules |
| `generic` | Generic prompts | Cross-platform content |
| `collection` | Mixed types | **Only when files have multiple distinct types** |

### When to Use "collection"

Use `type: "collection"` **only** when your package contains files of **multiple different types**:

✅ **Use collection**:
```json
{
  "type": "collection",
  "files": [
    {"path": "skill.md", "type": "claude-skill"},
    {"path": "agent.md", "type": "claude-agent"}
  ]
}
```

❌ **Don't use collection** (use specific type):
```json
{
  "type": "cursor",  // ✅ Correct - all files are cursor
  "files": [
    {"path": "react.mdc", "type": "cursor"},
    {"path": "python.mdc", "type": "cursor"}
  ]
}
```

## Validation

### JSON Schema

PRPM validates your manifest against a JSON Schema. Get autocomplete in your editor:

```json
{
  "$schema": "https://prpm.dev/schemas/manifest.json",
  "name": "@username/package",
  ...
}
```

### View the Schema

```bash
# Output the full JSON schema
prpm schema

# Save to file
prpm schema > manifest.schema.json
```

See [Schema Documentation](../schemas/README.md) for complete reference.

## Examples

Complete example manifests are in the `examples/` directory:

- **[simple-package](../examples/simple-package/)** - Basic single-file package
- **[multi-file-single-type](../examples/multi-file-single-type/)** - Multiple Cursor rules
- **[claude-skills-multi-file](../examples/claude-skills-multi-file/)** - Multiple Claude skills
- **[collection-package](../examples/collection-package/)** - Mixed types (actual collection)

## Commands

### Publishing

```bash
# Publish from prpm.json or .claude/marketplace.json
prpm publish

# Dry run (validate without publishing)
prpm publish --dry-run
```

### Installing

```bash
# Install a package
prpm install @username/package

# Install specific version
prpm install @username/package@1.2.0

# Install in specific format
prpm install @username/package --as cursor
```

### Searching

```bash
# Search packages
prpm search react

# Search by type
prpm search --type cursor react

# Search by tags
prpm search --tags typescript,frontend
```

### Package Info

```bash
# View package details
prpm info @username/package

# View specific version
prpm info @username/package@1.2.0
```

### Account Management

```bash
# Login (GitHub OAuth)
prpm login

# Check login status
prpm whoami
```

### Utilities

```bash
# List installed packages
prpm list

# Remove a package
prpm remove @username/package

# Get JSON schema
prpm schema
```

## Documentation Files

- **[Enhanced Manifest Format](./enhanced-manifest.md)** - Per-file metadata format
- **[marketplace.json Support](./marketplace-json.md)** - Using Claude's format
- **[JSON Schema Reference](../schemas/README.md)** - Schema documentation
- **[Examples](../examples/)** - Example manifest files

## Getting Help

```bash
# General help
prpm --help

# Command-specific help
prpm publish --help
prpm install --help
```

## Issues & Feedback

Report issues at: https://github.com/khaliqgant/prompt-package-manager/issues
