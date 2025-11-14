# Kiro Steering Files Format Specification

**File Location:** `.kiro/steering/*.md`
**Format:** Markdown with optional YAML frontmatter
**Official Docs:** https://kiro.dev/docs/steering/

## Overview

Kiro uses steering files in `.kiro/steering/` to provide context-aware instructions. Configure inclusion modes via YAML frontmatter at the top of files (enclosed in `---`). If frontmatter is omitted, files default to `always` inclusion.

## Frontmatter Fields

### Optional Fields

- **`inclusion`** (string): When to include this steering file (defaults to `always`)
  - `always` (default): Include in all contexts
  - `fileMatch`: Include only for specific file patterns
  - `manual`: User manually triggers inclusion

### Conditional Required Fields

- **`fileMatchPattern`** (string): **REQUIRED** when `inclusion: fileMatch`
  - Glob pattern matching files
  - Common patterns:
    - `"*.tsx"` - React components and JSX files
    - `"app/api/**/*"` - API routes and backend logic
    - `"**/*.test.*"` - Test files and testing utilities
    - `"src/components/**/*"` - Component-specific guidelines
    - `"*.md"` - Documentation files
    - `"components/**/*.tsx"` - React components in specific directory

### Additional Optional Fields

- **`domain`** (string): Domain/topic for organization
  - Examples: `testing`, `api`, `security`, `frontend`
  - Used for categorization and discovery

### Special Files

Kiro recognizes foundational steering files with special names:

- **`product.md`**: Product requirements and business logic
- **`tech.md`**: Technical architecture and stack
- **`structure.md`**: Project structure and organization

## Inclusion Modes

### Always Included (Default)

These files are loaded into every Kiro interaction automatically. Use this mode for core standards that should influence all code generation and suggestions.

**Best for:** Workspace-wide standards, technology preferences, security policies, and coding conventions that apply universally.

```markdown
---
inclusion: always
---

# Core Technology Stack

Our workspace uses the following technologies and standards.

## Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + Prisma
- **Database**: PostgreSQL
- **Testing**: Vitest + Testing Library

## Universal Principles

- Write self-documenting code
- Keep functions under 50 lines
- Use meaningful variable names
- Add comments only for complex logic
```

### Conditional Inclusion (fileMatch)

Files are automatically included only when working with files that match the specified pattern. This keeps context relevant and reduces noise by loading specialized guidance only when needed.

**Best for:** Domain-specific standards like component patterns, API design rules, testing approaches, or deployment procedures that only apply to certain file types.

```markdown
---
inclusion: fileMatch
fileMatchPattern: "components/**/*.tsx"
---

# React Component Guidelines

Applied automatically when working with React components.

## Component Standards

- Use functional components with hooks
- Keep components under 200 lines
- Extract logic into custom hooks
- Co-locate styles with components

## Example

\`\`\`tsx
// Good: Focused component
function UserProfile({ userId }: Props) {
  const user = useUser(userId);
  return <div>{user.name}</div>;
}
\`\`\`
```

### Manual Inclusion

User explicitly activates this steering file when needed.

**Best for:** Special procedures, optimization guides, or situational guidance that doesn't apply to everyday development.

```markdown
---
inclusion: manual
---

# Performance Optimization Guide

Manually activate when optimizing performance-critical code.

## Profiling First

- Always measure before optimizing
- Use Chrome DevTools or similar
- Identify actual bottlenecks

## Common Optimizations

- Memoization for expensive calculations
- Lazy loading for large components
- Debouncing for frequent events
- Virtual scrolling for long lists
```

## Content Format

Standard markdown after frontmatter:

- **H1 title**: Main heading
- **H2 sections**: Organize content
- **Lists**: Rules and guidelines
- **Code blocks**: Examples
- **Standard markdown**: Bold, italic, links

## Foundational Files

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
4. Smart scheduling

## User Personas

- **Project Manager**: Needs overview and reporting
- **Team Member**: Needs task details and updates
- **Stakeholder**: Needs high-level progress tracking
```

### tech.md

```markdown
---
inclusion: always
foundationalType: tech
---

# Technical Architecture

## Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + Prisma
- **Database**: PostgreSQL
- **Cache**: Redis
- **Queue**: Bull
- **Deploy**: Docker + AWS ECS

## Architecture Patterns

- Clean architecture (domain/application/infrastructure)
- CQRS for complex operations
- Event sourcing for audit trail
- Repository pattern for data access

## Security

- JWT authentication
- RBAC authorization
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS prevention via React
```

### structure.md

```markdown
---
inclusion: always
foundationalType: structure
---

# Project Structure

## Directory Layout

\`\`\`
src/
  api/              # API routes and controllers
  domain/           # Business logic and entities
  services/         # Application services
  repositories/     # Data access layer
  middleware/       # Express middleware
  utils/            # Helper functions
  types/            # TypeScript types
  config/           # Configuration
  __tests__/        # Tests
\`\`\`

## File Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Services**: camelCase with Service suffix (e.g., `userService.ts`)
- **Types**: PascalCase (e.g., `User.ts`)
- **Utils**: camelCase (e.g., `formatDate.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts`

## Import Order

1. External dependencies
2. Internal absolute imports
3. Internal relative imports
4. Types
5. Styles
```

## Examples by Domain

### API Development

```markdown
---
inclusion: fileMatch
fileMatchPattern: "src/api/**/*.ts"
domain: API
---

# API Endpoint Guidelines

## REST Conventions

- Use plural nouns for resources (`/users`, not `/user`)
- Use HTTP methods correctly (GET, POST, PUT, DELETE)
- Return consistent status codes
- Include proper error messages

## Validation

\`\`\`typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

router.post('/users', async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }

  const user = await userService.create(result.data);
  res.status(201).json({ user });
});
\`\`\`
```

### Security

```markdown
---
inclusion: always
domain: Security
---

# Security Guidelines

Critical security practices for all code.

## Input Validation

- Validate all user input
- Use schemas (Zod, Joi)
- Sanitize for XSS
- Check for SQL injection

## Authentication

- Use bcrypt for passwords (cost factor 12)
- JWT tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Store refresh tokens securely (httpOnly cookies)

## Authorization

\`\`\`typescript
// Check permissions before operations
async function deleteUser(userId: string, actorId: string) {
  const actor = await userService.get(actorId);

  if (!actor.isAdmin && actor.id !== userId) {
    throw new ForbiddenError('Cannot delete other users');
  }

  await userService.delete(userId);
}
\`\`\`
```

## Best Practices

1. **Specific patterns**: Target actual files with fileMatch
2. **Clear domains**: Use consistent domain names for organization
3. **Foundational files**: Start with product.md, tech.md, structure.md
4. **Manual for special cases**: Use manual inclusion for optional guidance
5. **Update with architecture**: Keep steering files in sync with code

## Conversion Notes

### From Canonical

- Requires inclusion mode (no default)
- Extracts domain from metadata or filename
- H1 title from content
- FileMatchPattern from metadata

### To Canonical

- Parses inclusion mode and validates requirements
- Extracts H1 as display title
- Domain becomes package metadata
- Detects foundational types

## Limitations

- Inclusion mode is required (no defaults)
- FileMatch requires pattern (strict validation)
- Limited to glob patterns (no regex)
- Single pattern per file (no arrays)

## Differences from Other Formats

**vs Cursor:**
- Required frontmatter (Cursor doesn't require)
- Explicit inclusion modes
- Domain organization
- Foundational file concept

**vs Copilot:**
- Structured frontmatter (Copilot uses separate files)
- Inclusion semantics more explicit
- Domain-based organization

**vs Windsurf:**
- Multiple files (Windsurf is single file)
- Rich metadata (Windsurf has none)
- Context-aware inclusion

## Migration Tips

1. **Start with foundational files**: product.md, tech.md, structure.md
2. **Use always for core patterns**: Code style, architecture principles
3. **Use fileMatch for specific contexts**: Test rules, API patterns, etc.
4. **Group by domain**: Consistent naming helps discovery
5. **Manual for workflows**: Special procedures, optimization guides, etc.
