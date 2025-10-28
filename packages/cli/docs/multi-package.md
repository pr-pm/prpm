# Multi-Package Support in PRPM

## Overview

Multi-package support allows a single `prpm.json` file to define multiple packages for publishing. This is useful for:

- **Monorepos**: Manage multiple related packages in one repository
- **Package families**: Publish related packages together (e.g., rules + agents + skills)
- **Batch operations**: Publish multiple packages with a single command
- **Shared metadata**: Define common fields (author, license, repository) once

## Format Design

### Two Modes

PRPM supports two manifest formats:

#### 1. Single Package (existing)
```json
{
  "name": "@myorg/package",
  "version": "1.0.0",
  "description": "A single package",
  "format": "cursor",
  "files": [".cursorrules"]
}
```

#### 2. Multi-Package (new)
```json
{
  "name": "@myorg/monorepo",
  "version": "1.0.0",
  "author": "Team Name",
  "license": "MIT",
  "repository": "https://github.com/org/repo",
  "organization": "myorg",
  "packages": [
    {
      "name": "@myorg/cursor-rules",
      "version": "1.0.0",
      "description": "Cursor rules for React",
      "format": "cursor",
      "files": ["packages/cursor-rules/.cursorrules"]
    },
    {
      "name": "@myorg/claude-agent",
      "version": "2.0.0",
      "description": "Claude AI agent",
      "format": "claude",
      "subtype": "agent",
      "files": ["packages/claude-agent/.claude/agents/agent.md"]
    }
  ]
}
```

### Schema Rules

1. **Detection**: Presence of `packages` array makes it a multi-package manifest
2. **Root-level fields**: Shared across all packages (author, license, repository, organization)
3. **Package-level fields**: Override root-level fields if specified
4. **Required fields per package**: name, version, description, format, files
5. **Package isolation**: Each package must have unique name and can have independent versions

### Field Inheritance

Packages inherit from root-level fields:

```json
{
  "author": "Root Author",
  "license": "MIT",
  "repository": "https://github.com/org/repo",
  "organization": "myorg",
  "packages": [
    {
      "name": "@myorg/pkg1",
      "author": "Override Author", // Overrides root
      "license": "Apache-2.0",      // Overrides root
      // repository inherited from root
      // organization inherited from root
      ...
    },
    {
      "name": "@myorg/pkg2",
      // All fields inherited from root
      ...
    }
  ]
}
```

## CLI Behavior

### Publishing

#### Publish all packages:
```bash
prpm publish
# Publishes all packages in the packages array
```

#### Publish specific package:
```bash
prpm publish --package @myorg/pkg1
# or by index
prpm publish --package 0
```

#### Publish with filtering:
```bash
prpm publish --filter "cursor-*"
# Publishes packages matching the pattern
```

#### Dry run:
```bash
prpm publish --dry-run
# Shows what would be published without actually publishing
```

### Validation

All packages are validated before any are published:
- Schema validation for each package
- File existence checks
- No duplicate package names
- Version format validation

If any package fails validation, none are published.

### Output

```
📦 Publishing 3 packages...

✓ @myorg/cursor-rules@1.0.0
✓ @myorg/claude-agent@2.0.0
✓ @myorg/claude-skill@1.5.0

✅ Successfully published 3 packages!
```

## Migration Path

### From Single to Multi-Package

Existing single-package manifests continue to work. To migrate:

```json
// Before (single)
{
  "name": "@myorg/package",
  "version": "1.0.0",
  ...
}

// After (multi)
{
  "name": "@myorg/monorepo",
  "version": "1.0.0",
  "packages": [
    {
      "name": "@myorg/package",
      "version": "1.0.0",
      ...
    }
  ]
}
```

### From marketplace.json

Already supported! The `marketplaceToManifest()` function can convert each plugin to a package.

## Implementation Plan

### Phase 1: Type Definitions
- [ ] Add `MultiPackageManifest` interface
- [ ] Add package inheritance utilities
- [ ] Update schema validator

### Phase 2: Validation
- [ ] Detect multi-package format
- [ ] Validate each package independently
- [ ] Check for duplicate names
- [ ] Validate field inheritance

### Phase 3: Publishing
- [ ] Detect and load multi-package manifests
- [ ] Publish packages sequentially
- [ ] Add `--package` filter option
- [ ] Add progress reporting
- [ ] Handle partial failures

### Phase 4: Testing
- [ ] Unit tests for multi-package validation
- [ ] Unit tests for field inheritance
- [ ] Integration tests for publishing
- [ ] E2E tests for complete workflow

### Phase 5: Documentation
- [ ] Update README with examples
- [ ] Add migration guide
- [ ] Update CLI help text

## Examples

### React Ecosystem Monorepo
```json
{
  "name": "@react-community/packages",
  "version": "1.0.0",
  "author": "React Community",
  "license": "MIT",
  "repository": "https://github.com/react-community/prpm-packages",
  "packages": [
    {
      "name": "@react-community/cursor-rules",
      "version": "1.0.0",
      "description": "Cursor rules for React development",
      "format": "cursor",
      "files": ["packages/cursor/.cursorrules"]
    },
    {
      "name": "@react-community/testing-agent",
      "version": "1.0.0",
      "description": "Claude agent for React testing",
      "format": "claude",
      "subtype": "agent",
      "files": ["packages/testing-agent/.claude/agents/testing.md"]
    },
    {
      "name": "@react-community/hooks-skill",
      "version": "1.2.0",
      "description": "Claude skill for React hooks",
      "format": "claude",
      "subtype": "skill",
      "files": ["packages/hooks-skill/.claude/skills/hooks/SKILL.md"]
    }
  ]
}
```

### Enterprise Team Packages
```json
{
  "name": "@acme/engineering",
  "version": "2.0.0",
  "author": "Acme Engineering Team",
  "license": "Proprietary",
  "organization": "acme-corp",
  "repository": "https://github.com/acme/engineering-prompts",
  "packages": [
    {
      "name": "@acme/backend-rules",
      "version": "2.1.0",
      "description": "Backend development guidelines",
      "format": "cursor",
      "files": ["backend/.cursorrules"]
    },
    {
      "name": "@acme/frontend-rules",
      "version": "2.0.5",
      "description": "Frontend development guidelines",
      "format": "cursor",
      "files": ["frontend/.cursorrules"]
    },
    {
      "name": "@acme/security-agent",
      "version": "1.0.0",
      "description": "Security review agent",
      "format": "claude",
      "subtype": "agent",
      "files": ["security/.claude/agents/security-review.md"]
    }
  ]
}
```

## Benefits

1. **Organization**: Keep related packages together
2. **Consistency**: Share metadata across packages
3. **Efficiency**: Publish multiple packages with one command
4. **Versioning**: Independent versioning per package
5. **Discovery**: Easier to find related packages from same author/org
6. **Maintenance**: Update shared fields (license, repo) in one place

## Compatibility

- **Backward compatible**: Single-package manifests work unchanged
- **Validation**: Clear error messages for invalid multi-package format
- **Registry**: Each package published independently (no registry changes needed)
- **CLI**: Graceful fallback for older CLI versions (ignores `packages` field)
