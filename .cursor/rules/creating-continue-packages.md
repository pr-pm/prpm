---
description: Guidelines for creating Continue rules with correct frontmatter, glob patterns, and regex matching
globs:
  - "**/.continuerules/*.md"
  - "**/config.yaml"
  - "**/prpm.json"
alwaysApply: false
---

# Creating Continue Packages

Guidelines for creating Continue rules in PRPM format with markdown files or YAML configuration.

## Overview

Continue supports two formats for rules:
1. **Markdown files**: `.continuerules/*.md` with YAML frontmatter
2. **YAML configuration**: `config.yaml` with rules array

Rules can be context-aware using glob patterns, regex matching, or always-applied globally.

**CRITICAL**: The `name` field is REQUIRED in frontmatter (unlike other formats where it's optional).

## Markdown Format

### File Location
`.continuerules/NAME.md`

### Required Frontmatter

```yaml
---
name: Documentation Standards
---
```

**Fields:**
- `name` (string): Display name/title for the rule (REQUIRED)

### Optional Frontmatter

```yaml
---
name: Documentation Standards
description: Standards for writing and maintaining documentation
globs: docs/**/*.{md,mdx}
alwaysApply: false
---
```

**Fields:**
- `description` (string): When rule should be used (agents may read this)
- `globs` (string or array): Glob pattern(s) to match files
  - Single: `"**/*.{ts,tsx}"`
  - Array: `["src/**/*.ts", "tests/**/*.ts"]`
- `regex` (string or array): Regex pattern(s) to match file content
  - Single: `"^import .* from '.*';$"`
  - Array: `["^import .*", "^export .*"]`
- `alwaysApply` (boolean or undefined): Controls rule inclusion
  - `true`: Always included, regardless of context
  - `false`: Included if globs match OR agent decides based on description
  - `undefined` (default): Included if no globs exist OR globs match
- `version` (string): Rule version
- `schema` (string): Schema version

### Content Format

Plain markdown including:
- H1 title
- H2/H3 sections
- Lists for rules
- Code blocks for examples
- Standard markdown

## Examples

### Basic Rule with Globs

```markdown
---
name: Documentation Standards
globs: docs/**/*.{md,mdx}
alwaysApply: false
description: Standards for writing and maintaining documentation
---

# Documentation Standards

## Structure

- Follow consistent heading hierarchy starting with h2 (##)
- Include YAML frontmatter with title, description, and keywords
- Use descriptive alt text for images

## Writing Style

- Keep paragraphs concise and scannable
- Use code blocks with appropriate language tags
- Include cross-references to related documentation
```

### Rule with Regex

```markdown
---
name: React Component Standards
regex: "^import React"
globs: "**/*.{tsx,jsx}"
alwaysApply: false
description: Standards for React component development
---

# React Component Standards

## Component Structure

- Use functional components with hooks
- Keep components under 200 lines
- Extract logic into custom hooks when appropriate
- Co-locate styles with components

## Examples

```typescript
// Good: Focused component
function UserProfile({ userId }: Props) {
  const user = useUser(userId);
  return <div>{user.name}</div>;
}
```
```

### Multiple Globs (Array)

```markdown
---
name: TypeScript Standards
globs:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "tests/**/*.test.ts"
alwaysApply: false
description: TypeScript coding standards and best practices
---

# TypeScript Standards

## Type Safety

- Always define explicit types for function parameters
- Avoid using `any` type
- Use strict mode in tsconfig.json
- Prefer interfaces over types for object shapes

## Examples

```typescript
// Good: Explicit types
interface User {
  id: string;
  email: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  return db.users.findUnique({ where: { id } });
}

// Bad: Implicit any
function getUser(id) {
  return db.users.findUnique({ where: { id } });
}
```
```

### Always-Applied Global Rules

```markdown
---
name: Code Quality Standards
alwaysApply: true
---

# Code Quality Standards

These standards apply to all code in the project.

## General Principles

- Write self-documenting code
- Keep functions under 50 lines
- Use meaningful variable names
- Add comments only for complex logic

## Error Handling

- Always catch and handle errors appropriately
- Log errors with context
- Use custom error classes
- Never swallow errors silently
```

### Rule with Multiple Regex Patterns

```markdown
---
name: Import/Export Standards
regex:
  - "^import .*"
  - "^export .*"
globs: "**/*.{ts,tsx,js,jsx}"
alwaysApply: false
description: Standards for imports and exports
---

# Import/Export Standards

## Import Order

1. External dependencies
2. Internal absolute imports
3. Internal relative imports
4. Types
5. Styles

## Examples

```typescript
// Good: Organized imports
import React from 'react';
import { Button } from '@/components/Button';
import { useUser } from './hooks/useUser';
import type { User } from '@/types';
import './styles.css';

// Bad: Random order
import './styles.css';
import type { User } from '@/types';
import React from 'react';
```
```

## YAML Configuration Format

### File Location
`config.yaml`

### Structure

```yaml
name: API Development Rules
version: 1.0.0
schema: v1

rules:
  - name: REST API Standards
    globs:
      - "src/api/**/*.ts"
      - "src/routes/**/*.ts"
    alwaysApply: false
    rule: >
      ## REST Conventions

      - Use semantic HTTP methods (GET, POST, PUT, DELETE)
      - Return appropriate status codes (200, 201, 400, 404, 500)
      - Include error messages in response body
      - Version APIs using URL paths (/api/v1/)

  - name: TypeScript Standards
    globs: "**/*.{ts,tsx}"
    regex: "^import.*typescript"
    alwaysApply: false
    rule: >
      ## Type Safety

      - Always define explicit types for function parameters
      - Avoid using `any` type
      - Use strict mode in tsconfig.json
```

## Inclusion Logic

### alwaysApply: true
Rule is always included, regardless of context.

```yaml
---
name: Security Guidelines
alwaysApply: true
---
```

### alwaysApply: false
Rule is included if:
- Globs match the current file, OR
- Agent decides based on description

```yaml
---
name: API Standards
globs: "src/api/**/*.ts"
alwaysApply: false
description: REST API development standards
---
```

### alwaysApply: undefined (default)
Rule is included if:
- No globs exist (applies to all), OR
- Globs match the current file

```yaml
---
name: Testing Standards
globs: "**/*.test.ts"
---
```

## Validation

### Schema Location
https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/continue.schema.json

### Key Validations

1. **name is required**: All rules need a name
2. **globs can be string or array**: Both formats valid
3. **regex can be string or array**: Both formats valid
4. **alwaysApply must be boolean**: `true`, `false`, or omitted

## Best Practices

1. **Always include name**: Required field, not optional
2. **Be specific**: Target actual patterns in your codebase
3. **Include examples**: Show real code from your project
4. **Update regularly**: Keep rules in sync with codebase changes
5. **One concern per file**: Split large rule sets into focused files
6. **Use globs effectively**: Match specific file types where rules apply
7. **Add descriptions**: Help agents understand when to use rules
8. **Understand alwaysApply**: Choose true/false/undefined based on use case

## Common Patterns

### Frontend Framework Rules

```markdown
---
name: React Best Practices
globs:
  - "src/components/**/*.tsx"
  - "src/pages/**/*.tsx"
regex: "^import React"
alwaysApply: false
description: React component development standards
---

# React Best Practices

## Component Guidelines

- Use functional components with hooks
- Memoize expensive calculations with useMemo
- Use useCallback for function props
- Keep components under 200 lines
```

### Backend API Rules

```markdown
---
name: Express API Standards
globs: "src/api/**/*.ts"
alwaysApply: false
description: Express API endpoint standards
---

# Express API Standards

## Endpoint Structure

```typescript
router.post('/users',
  validateRequest(createUserSchema),
  asyncHandler(async (req, res) => {
    const user = await userService.create(req.body);
    res.status(201).json({ user });
  })
);
```
```

### Testing Rules

```markdown
---
name: Test Standards
globs:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
alwaysApply: false
description: Testing standards and conventions
---

# Test Standards

## Test Structure

- Use describe blocks for grouping
- Use it/test for individual tests
- Follow Arrange-Act-Assert pattern
- One assertion per test when possible

## Example

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { email: 'test@example.com' };

      // Act
      const user = await userService.createUser(userData);

      // Assert
      expect(user.email).toBe(userData.email);
    });
  });
});
```
```

### Database Rules

```markdown
---
name: Prisma Standards
globs:
  - "src/db/**/*.ts"
  - "prisma/**/*.ts"
regex: "^import.*@prisma/client"
alwaysApply: false
description: Prisma ORM usage standards
---

# Prisma Standards

## Query Patterns

- Use transactions for multi-step operations
- Select only needed fields
- Handle unique constraint violations
- Use proper error handling

```typescript
async function transferFunds(fromId: string, toId: string, amount: number) {
  await prisma.$transaction(async (tx) => {
    await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    });

    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });
  });
}
```
```

## Differences from Other Formats

**vs Cursor:**
- Continue REQUIRES `name` field (Cursor uses `description`)
- Both support globs and alwaysApply
- Continue adds regex matching
- Continue supports YAML config format

**vs Claude:**
- No tools or model selection
- No agents/skills distinction
- Purely documentation-focused

**vs Copilot:**
- Requires frontmatter (Copilot doesn't for repo-wide)
- No path-specific support in Copilot
- More structured format

## References

- **Schema**: https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/continue.schema.json
- **Official Docs**: https://docs.continue.dev/customize/deep-dives/rules
