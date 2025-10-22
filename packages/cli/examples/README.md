# PRPM Manifest Examples

This directory contains example `prpm.json` manifest files demonstrating different package structures and formats.

## Examples

### 1. Simple Package
**Location**: `simple-package/prpm.json`

A basic single-file package with minimal configuration.

**Use case**: Simple Claude skill or Cursor rule

```json
{
  "name": "@username/simple-skill",
  "version": "1.0.0",
  "description": "A simple Claude skill",
  "type": "claude-skill",
  "files": ["skill.md", "README.md"]
}
```

### 2. Multi-File Single Type
**Location**: `multi-file-single-type/prpm.json`

Multiple files of the **same type** with per-file metadata.

**Use case**: Multiple Cursor rules for different languages, each with their own tags

```json
{
  "name": "@username/cursor-typescript-rules",
  "type": "cursor",
  "files": [
    {
      "path": ".cursor/rules/react-components.mdc",
      "type": "cursor",
      "name": "React Component Rules",
      "tags": ["react", "components"]
    },
    {
      "path": ".cursor/rules/typescript-types.mdc",
      "type": "cursor",
      "name": "TypeScript Type Rules",
      "tags": ["typescript", "types"]
    }
  ]
}
```

**Note**: Package `type` is `cursor` (not `collection`) because all files are the same type.

### 3. Claude Skills Multi-File
**Location**: `claude-skills-multi-file/prpm.json`

Multiple Claude skills in one package.

**Use case**: Related skills bundled together (e.g., testing skills)

```json
{
  "name": "@username/testing-skills",
  "type": "claude-skill",
  "files": [
    {
      "path": ".claude/skills/tdd.md",
      "type": "claude-skill",
      "name": "Test-Driven Development",
      "tags": ["tdd", "unit-testing"]
    },
    {
      "path": ".claude/skills/integration-testing.md",
      "type": "claude-skill",
      "name": "Integration Testing",
      "tags": ["integration", "e2e"]
    }
  ]
}
```

**Note**: Package `type` is `claude-skill` because all files are skills.

### 4. Collection Package
**Location**: `collection-package/prpm.json`

Multiple files of **different types**.

**Use case**: Cross-IDE package, or mixing Claude skills + agents + commands

```json
{
  "name": "@username/my-collection",
  "type": "collection",
  "files": [
    {
      "path": ".claude/skills/tdd.md",
      "type": "claude-skill"
    },
    {
      "path": ".claude/agents/test-generator.md",
      "type": "claude-agent"
    },
    {
      "path": ".cursor/rules/typescript.mdc",
      "type": "cursor"
    }
  ]
}
```

**Note**: Package `type` is `collection` because files have multiple distinct types.

## Key Differences

| Example | Package Type | File Types | When to Use |
|---------|-------------|------------|-------------|
| Simple | `claude-skill` | All same | Single file or basic package |
| Multi-File Single | `cursor` | All `cursor` | Multiple files, same type, need per-file tags |
| Claude Skills | `claude-skill` | All `claude-skill` | Multiple skills bundled |
| Collection | `collection` | Mixed types | Cross-IDE or mixed Claude types |

## File Formats

### Simple Format (Strings)
```json
{
  "files": ["skill.md", "README.md"]
}
```

**Use when**: Simple package, no per-file metadata needed

### Enhanced Format (Objects)
```json
{
  "files": [
    {
      "path": ".claude/skills/tdd.md",
      "type": "claude-skill",
      "name": "Test-Driven Development",
      "description": "TDD workflow guide",
      "tags": ["testing", "tdd"]
    }
  ]
}
```

**Use when**: Need per-file names, descriptions, or tags

## Validation

All examples include the schema reference for editor autocomplete:

```json
{
  "$schema": "https://prpm.dev/schemas/manifest.json",
  ...
}
```

## Testing Examples

You can test any example by copying it to a directory and running:

```bash
# Validate manifest
prpm publish --dry-run

# View what would be published
cat prpm.json
```

## Related Documentation

- [Enhanced Manifest Format](../docs/enhanced-manifest.md)
- [JSON Schema Reference](../schemas/README.md)
- [marketplace.json Support](../docs/marketplace-json.md)
- [Publishing Guide](../docs/README.md)
