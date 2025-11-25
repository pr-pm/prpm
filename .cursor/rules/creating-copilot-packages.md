---
description: Guidelines for creating GitHub Copilot instructions with repository-wide and path-specific rules
globs:
  - "**/.github/copilot-instructions.md"
  - "**/.github/instructions/*.instructions.md"
  - "**/prpm.json"
alwaysApply: false
---

# Creating GitHub Copilot Packages

Guidelines for creating GitHub Copilot instructions in PRPM format with natural language and path-specific targeting.

## Overview

GitHub Copilot uses two types of instruction files:
- **Repository-wide**: `.github/copilot-instructions.md` (no frontmatter)
- **Path-specific**: `.github/instructions/*.instructions.md` (with YAML frontmatter)

The format emphasizes natural language and simplicity over structured formats.

## Repository-Wide Instructions

### File Location
`.github/copilot-instructions.md`

### Format
Plain markdown with NO frontmatter

### Usage
Instructions apply to all files in the repository.

### Example

```markdown
# API Development Guidelines

Follow REST best practices when developing API endpoints.

## Principles

- Use semantic HTTP methods (GET, POST, PUT, DELETE)
- Return appropriate status codes (200, 201, 400, 404, 500)
- Include error messages in response body
- Version APIs using URL paths (/api/v1/)

## Examples

```javascript
// Good: RESTful endpoint
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.users.findAll();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
```
```

## Path-Specific Instructions

### File Location
`.github/instructions/NAME.instructions.md`

**Naming:** File must end with `.instructions.md`

Examples:
- `api-endpoints.instructions.md`
- `react-components.instructions.md`
- `database-queries.instructions.md`

### Format
Markdown with YAML frontmatter containing `applyTo`

### Required Frontmatter

```yaml
---
applyTo: "app/models/**/*.rb"
---
```

**Field:**
- `applyTo` (string or array): Glob pattern(s) for files this applies to

### Optional Frontmatter

```yaml
---
applyTo: "**/*.ts"
excludeAgent: "code-review"
---
```

**Fields:**
- `excludeAgent` (string): Prevent specific agent from using this file
  - `"code-review"`: Only used by coding agent
  - `"coding-agent"`: Only used by code review
  - If omitted: Both agents use the instructions

### applyTo Patterns

**Single pattern:**
```yaml
applyTo: "app/models/**/*.rb"
```

**Multiple patterns (comma-separated string):**
```yaml
applyTo: "**/*.ts,**/*.tsx"
```

**Multiple patterns (array):**
```yaml
applyTo:
  - "src/api/**/*.ts"
  - "src/services/**/*.ts"
```

**All files:**
```yaml
applyTo: "**"
# or
applyTo: "*"
# or
applyTo: "**/*"
```

## Examples

### Path-Specific: API Endpoints

`.github/instructions/api-endpoints.instructions.md`:

```markdown
---
applyTo:
  - "src/api/**/*.ts"
  - "src/services/**/*.ts"
---

# API Endpoint Guidelines

These rules apply only to API files.

## Requirements

- All endpoints must have error handling
- Use async/await for database calls
- Log all errors with structured logging
- Validate input with Zod schemas

## Example

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

app.post('/api/users', async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await db.users.create(data);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    logger.error('Failed to create user', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```
```

### Path-Specific: React Components

`.github/instructions/react-components.instructions.md`:

```markdown
---
applyTo: "**/*.{tsx,jsx}"
---

# React Component Standards

Standards for React component development.

## Component Structure

- Use functional components with hooks
- Keep components under 200 lines
- Extract logic into custom hooks
- Co-locate styles with components

## State Management

```typescript
// Good: Custom hook for logic
function useUserData(userId: string) {
  return useQuery(['user', userId], () => fetchUser(userId));
}

function UserProfile({ userId }: Props) {
  const { data: user, isLoading } = useUserData(userId);

  if (isLoading) return <Spinner />;
  return <div>{user.name}</div>;
}
```

## Accessibility

- Use semantic HTML
- Add ARIA labels for icon-only buttons
- Ensure keyboard navigation
- Test with screen readers
```

### Path-Specific: Testing

`.github/instructions/testing.instructions.md`:

```markdown
---
applyTo:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
---

# Testing Standards

All tests use Jest and React Testing Library.

## Component Tests

- Test user interactions, not implementation
- Use `screen.getByRole` over `getByTestId`
- Mock external dependencies
- Test accessibility (ARIA roles)

```typescript
test('submits form when valid', async () => {
  render(<LoginForm />);

  await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'password123');
  await userEvent.click(screen.getByRole('button', { name: 'Login' }));

  expect(mockLogin).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123',
  });
});
```
```

### Excluding from Code Review

`.github/instructions/coding-only.instructions.md`:

```markdown
---
applyTo: "**"
excludeAgent: "code-review"
---

# Coding Agent Only Instructions

These instructions are only used by the Copilot coding agent.

- Focus on implementation patterns
- Suggest modern syntax alternatives
- Optimize for readability in generated code
- Prefer newer APIs when available
```

### Excluding from Coding Agent

`.github/instructions/review-only.instructions.md`:

```markdown
---
applyTo: "**/*.test.ts"
excludeAgent: "coding-agent"
---

# Code Review Only Instructions

These instructions are only used by Copilot code review.

- Verify test coverage is adequate
- Check for proper assertions
- Ensure tests are not flaky
- Validate mocking approach
```

### Database Patterns

`.github/instructions/database.instructions.md`:

```markdown
---
applyTo:
  - "src/db/**/*.ts"
  - "src/repositories/**/*.ts"
---

# Database Access Patterns

We use Prisma ORM with PostgreSQL.

## Query Guidelines

- Always use transactions for multi-step operations
- Use `select` to limit returned fields
- Include proper indexes
- Handle unique constraint violations

```typescript
// Good: Transaction with error handling
async function transferFunds(fromId: string, toId: string, amount: number) {
  try {
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
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error('Account not found');
    }
    throw error;
  }
}
```
```

## Content Format

Natural language markdown with:

- **Clear headings**: Organize with H1/H2
- **Bullet points**: For lists of rules
- **Code examples**: Show concrete patterns
- **Plain language**: Write for human readability
- **Actionable guidance**: Specific, not generic

## Best Practices

### Writing Instructions

1. **Be specific**: Generic advice less useful than project-specific patterns
2. **Show examples**: Code samples more effective than descriptions
3. **Keep it short**: Copilot processes limited context
4. **Natural language**: Write as you would explain to a developer
5. **Update regularly**: Keep instructions in sync with codebase

### Path-Specific Guidelines

1. **Granular targeting**: Match only files where rules apply
2. **Multiple files**: Create separate instruction files for different contexts
3. **Naming convention**: Use descriptive names
4. **Glob patterns**: Use standard glob syntax
   - `**` matches nested directories
   - `*` matches single path segment
   - `{ts,tsx}` matches multiple extensions

### Agent Exclusion

Use `excludeAgent` to separate concerns:

- **Coding agent**: Focus on implementation patterns
- **Code review**: Focus on quality checks

## Validation

### Schema Location
https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/copilot.schema.json

### Key Validations

1. **Repository-wide**: No frontmatter allowed
2. **Path-specific**: Must have `applyTo` in frontmatter
3. **Filename**: Path-specific must end with `.instructions.md`
4. **applyTo**: Can be string or array
5. **excludeAgent**: Must be `"code-review"` or `"coding-agent"`

## Common Patterns

### TypeScript Standards

```markdown
---
applyTo: "**/*.{ts,tsx}"
---

# TypeScript Standards

## Type Safety

- Use strict mode
- Avoid `any` type
- Define explicit types for function parameters
- Prefer interfaces over types for objects

```typescript
// Good
interface User {
  id: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  return db.users.findUnique({ where: { id } });
}

// Bad
function getUser(id): Promise<any> {
  return db.users.findUnique({ where: { id } });
}
```
```

### Security Standards

```markdown
---
applyTo: "**"
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
```

### Error Handling

```markdown
---
applyTo: "src/**/*.ts"
---

# Error Handling Standards

## Custom Errors

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}
```

## Error Responses

```typescript
app.use((error, req, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }

  logger.error('Unexpected error', { error });
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});
```
```

## Differences from Other Formats

**vs Cursor:**
- More natural language focused
- Path-specific via separate files (not globs in frontmatter)
- Simpler format overall
- No rule types

**vs Claude:**
- No tools or model selection
- No agents/skills distinction
- Pure instruction focus
- No personas

**vs Windsurf:**
- Supports path-specific rules
- Can have multiple instruction files
- No hard character limit
- Frontmatter for path-specific

**vs Continue:**
- Path-specific via separate files
- Natural language emphasis
- Agent exclusion feature
- Simpler frontmatter

## Migration Tips

When migrating to Copilot:

1. **Split by scope**: Separate repository-wide from path-specific
2. **Natural language**: Rewrite structured rules as plain guidance
3. **Concrete examples**: Add code samples for every pattern
4. **Test incrementally**: Verify Copilot behavior with each file
5. **Keep it current**: Update as codebase evolves
6. **Use agent exclusion**: Separate coding and review concerns

## References

- **Schema**: https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/copilot.schema.json
- **Official Docs**: https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot
