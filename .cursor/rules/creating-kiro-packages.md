---
description: Guidelines for creating Kiro steering files and hooks with inclusion modes, foundational files, and event-driven automation
globs:
  - "**/.kiro/steering/*.md"
  - "**/.kiro/hooks/*.json"
---

# Creating Kiro Packages

Quick reference for creating Kiro steering files and hooks with context-aware inclusion and event handling.

## Package Types

| Type | Location | Format | Purpose |
|------|----------|--------|---------|
| Steering Files | `.kiro/steering/*.md` | Markdown + YAML | Context-aware instructions |
| Hooks | `.kiro/hooks/*.json` | JSON | Event-driven automation |

## Steering Files

### Inclusion Modes

| Mode | Frontmatter | When Applied |
|------|-------------|--------------|
| **always** (default) | `inclusion: always` | All contexts |
| **fileMatch** | `inclusion: fileMatch` + `fileMatchPattern` | Files matching pattern |
| **manual** | `inclusion: manual` | User manually triggers |

### Frontmatter Reference

```yaml
---
inclusion: always  # always, fileMatch, or manual
fileMatchPattern: "components/**/*.tsx"  # REQUIRED for fileMatch
domain: testing  # Optional: for organization
---
```

### Always Included (Default)

Workspace-wide standards applied to all contexts.

```markdown
---
inclusion: always
---

# Core Technology Stack

## Stack
- Frontend: React 18 + TypeScript + Vite
- Backend: Node.js + Express + Prisma
- Database: PostgreSQL

## Universal Principles
- Write self-documenting code
- Keep functions under 50 lines
```

### FileMatch (Conditional)

Applied when working with files matching the pattern.

```markdown
---
inclusion: fileMatch
fileMatchPattern: "components/**/*.tsx"
domain: frontend
---

# React Component Guidelines

## Component Standards
- Use functional components with hooks
- Keep components under 200 lines
- Extract logic into custom hooks
```

### Manual (On-Demand)

User explicitly activates when needed.

```markdown
---
inclusion: manual
domain: performance
---

# Performance Optimization Guide

## Profiling First
- Always measure before optimizing
- Use Chrome DevTools
- Identify actual bottlenecks
```

### Common FileMatch Patterns

```yaml
# React components
fileMatchPattern: "*.tsx"
fileMatchPattern: "components/**/*.tsx"

# API routes
fileMatchPattern: "app/api/**/*"

# Tests
fileMatchPattern: "**/*.test.*"

# Documentation
fileMatchPattern: "*.md"
```

## Foundational Files

Special steering files with reserved names:

### product.md

```markdown
---
inclusion: always
foundationalType: product
---

# Product Context

## Mission
Build the best task management app for remote teams.

## Key Features
1. Real-time collaboration
2. Offline-first architecture
3. Natural language task input

## User Personas
- Project Manager: Needs overview and reporting
- Team Member: Needs task details and updates
```

### tech.md

```markdown
---
inclusion: always
foundationalType: tech
---

# Technical Architecture

## Stack
- Frontend: React 18 + TypeScript + Vite
- Backend: Node.js + Express + Prisma
- Database: PostgreSQL
- Cache: Redis

## Architecture Patterns
- Clean architecture (domain/application/infrastructure)
- CQRS for complex operations
- Repository pattern for data access
```

### structure.md

```markdown
---
inclusion: always
foundationalType: structure
---

# Project Structure

## Directory Layout
```
src/
  api/              # API routes and controllers
  domain/           # Business logic and entities
  services/         # Application services
  repositories/     # Data access layer
```

## File Naming Conventions
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Services: camelCase with Service suffix (e.g., `userService.ts`)
- Types: PascalCase (e.g., `User.ts`)
```

## Hooks

JSON configuration files for event-driven automation.

### Hook Structure

```json
{
  "name": "Hook Name",
  "description": "What this hook does",
  "version": "1",
  "when": {
    "type": "eventType",
    "patterns": ["glob", "patterns"]
  },
  "then": {
    "type": "actionType",
    "prompt": "Instructions for agent"
  }
}
```

### Event Types

| Event | Triggers When |
|-------|---------------|
| `fileCreated` | New files created matching patterns |
| `fileModified` | Files modified matching patterns |
| `fileDeleted` | Files deleted matching patterns |

### Action Types

| Action | Behavior |
|--------|----------|
| `askAgent` | Asks Kiro agent to perform task |
| `runCommand` | Executes shell command |

### Example: Auto Test Files

`.kiro/hooks/auto-test-files.json`:
```json
{
  "name": "Auto Test Files",
  "description": "Creates test files for new components",
  "version": "1",
  "when": {
    "type": "fileCreated",
    "patterns": ["src/components/**/*.tsx"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "A new component was created. Create a corresponding test file following our testing patterns. Use React Testing Library and include tests for rendering and key interactions."
  }
}
```

### Example: Dependency Checker

`.kiro/hooks/dependency-checker.json`:
```json
{
  "name": "Dependency Update Checker",
  "description": "Checks for breaking changes in package.json",
  "version": "1",
  "when": {
    "type": "fileModified",
    "patterns": ["package.json"]
  },
  "then": {
    "type": "askAgent",
    "prompt": "package.json was modified. Check if any dependencies were updated and review the changelog for breaking changes. Suggest any code updates needed."
  }
}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Missing fileMatchPattern with fileMatch | fileMatchPattern is REQUIRED when inclusion is fileMatch |
| Missing inclusion field | Defaults to always if omitted |
| Using regex in fileMatchPattern | Globs only, no regex support |
| Multiple patterns in fileMatchPattern | Use single pattern string only |
| Forgetting domain field | Use domain for organization and discovery |

## Validation

Schema: https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/kiro-steering.schema.json

## Best Practices

### Steering Files
1. Start with foundational files: product.md, tech.md, structure.md
2. Use always for core patterns: Code style, architecture principles
3. Use fileMatch for specific contexts: Component rules, API patterns
4. Group by domain: Consistent naming helps discovery
5. Manual for workflows: Special procedures, optimization guides

### Hooks
1. Specific patterns: Use precise globs to avoid unnecessary triggers
2. Clear prompts: Write detailed agent prompts with context
3. Idempotent actions: Ensure hooks can run multiple times safely
4. Performance: Avoid hooks on frequently modified files
5. Testing: Test hooks in isolation before deploying
