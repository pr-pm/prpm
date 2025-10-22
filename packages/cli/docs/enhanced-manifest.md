# Enhanced PRPM Manifest Format

> **Note**: If you're using Claude Code and already have a `.claude/marketplace.json` file, you can use that instead of creating a `prpm.json`. PRPM will automatically detect and convert it. See [marketplace.json documentation](./marketplace-json.md).

## Problem

The current `prpm.json` format has a single `type` field, which means:
- Cannot mix Claude skills with Claude agents in one package
- Cannot have multiple Cursor files with different tags per file
- Cannot create cross-IDE packages

## Solution: Per-File Metadata

Allow `files` to be either:
1. **Simple format** (backward compatible): Array of strings
2. **Enhanced format** (new): Array of file objects with metadata

## Enhanced Format

```json
{
  "name": "@username/my-collection",
  "version": "1.0.0",
  "description": "Collection of prompts",
  "type": "collection",
  "files": [
    {
      "path": ".claude/skills/skill1.md",
      "type": "claude-skill",
      "name": "My Skill",
      "description": "Does X",
      "tags": ["productivity"]
    },
    {
      "path": ".claude/agents/agent1.md",
      "type": "claude-agent",
      "name": "My Agent",
      "description": "Does Y",
      "tags": ["coding"]
    },
    {
      "path": ".cursor/rules/react.mdc",
      "type": "cursor",
      "name": "React Rules",
      "tags": ["react", "typescript"]
    },
    {
      "path": ".cursor/rules/python.mdc",
      "type": "cursor",
      "name": "Python Rules",
      "tags": ["python", "testing"]
    }
  ],
  "author": "Your Name",
  "license": "MIT"
}
```

## File Object Schema

```typescript
{
  path: string;           // Required: Relative path to file
  type: PackageType;      // Required: claude-skill, claude-agent, cursor, etc.
  name?: string;          // Optional: Display name
  description?: string;   // Optional: File-specific description
  tags?: string[];        // Optional: File-specific tags
}
```

## Backward Compatibility

Simple string format still works:

```json
{
  "type": "claude",
  "files": ["skill.md", "README.md"]
}
```

This is treated as:
```json
{
  "type": "claude",
  "files": [
    { "path": "skill.md", "type": "claude" },
    { "path": "README.md", "type": "claude" }
  ]
}
```

## Installation Behavior

When installing a collection package:
- Each file is placed in the appropriate directory based on its `type`
- User can choose to install all files or select specific ones
- Tags are preserved for filtering and search

## Example Use Cases

### 1. Multiple Files, Same Type (NOT a collection)
Use enhanced format to add per-file metadata even when all files are the same type:

```json
{
  "name": "@username/cursor-typescript-rules",
  "type": "cursor",
  "description": "Multiple Cursor rules for TypeScript",
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
    },
    {
      "path": ".cursor/rules/testing.mdc",
      "type": "cursor",
      "name": "Testing Rules",
      "tags": ["testing"]
    }
  ]
}
```

**Note**: Package `type` is `cursor` (singular), not `collection`, because all files are Cursor rules.

### 2. Multiple Claude Skills (NOT a collection)
```json
{
  "name": "@username/testing-skills",
  "type": "claude-skill",
  "description": "Collection of testing-focused skills",
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

### 3. Mixed Types = Collection
Only use `type: "collection"` when you have **multiple different types**:

```json
{
  "name": "@community/testing-suite",
  "type": "collection",
  "description": "Skills AND agents for testing",
  "files": [
    {
      "path": ".claude/skills/tdd.md",
      "type": "claude-skill",
      "name": "Test-Driven Development"
    },
    {
      "path": ".claude/agents/test-generator.md",
      "type": "claude-agent",
      "name": "Test Generator"
    }
  ]
}
```

**Note**: Now it's a `collection` because it has both skills AND agents.

### 4. Cross-IDE Package (Collection)
```json
{
  "name": "@username/react-rules",
  "type": "collection",
  "description": "React rules for all IDEs",
  "files": [
    {
      "path": ".cursor/rules/react.mdc",
      "type": "cursor",
      "tags": ["react"]
    },
    {
      "path": ".claude/skills/react-best-practices.md",
      "type": "claude-skill",
      "tags": ["react"]
    },
    {
      "path": ".continue/rules/react.json",
      "type": "continue",
      "tags": ["react"]
    }
  ]
}
```

**Note**: This is a `collection` because it spans multiple IDEs (Cursor, Claude, Continue).

## Migration Path

1. **Phase 1**: Add support for file objects (maintain backward compat)
2. **Phase 2**: Update docs and examples
3. **Phase 3**: Add CLI flag to convert existing packages to enhanced format
4. **Phase 4**: Deprecate simple format (with warnings, not errors)
