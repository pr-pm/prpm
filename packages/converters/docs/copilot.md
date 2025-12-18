# GitHub Copilot Instructions Format Specification

**File Locations:**
- Repository-wide: `.github/copilot-instructions.md`
- Path-specific: `.github/instructions/*.instructions.md`
- Skills: `.github/skills/*/SKILL.md`

**Format:** Natural language markdown (optional YAML frontmatter for path-specific)
**Official Docs:**
- Instructions: https://docs.github.com/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot
- Skills: https://code.visualstudio.com/docs/copilot/customization/agent-skills

## Overview

GitHub Copilot uses natural language instructions in markdown format. Instructions can be repository-wide or path-specific. Skills are reusable, task-specific capabilities that Copilot can discover and apply. The format emphasizes simplicity and natural language over structured formats.

## Repository-Wide Instructions

**File:** `.github/copilot-instructions.md`
**Format:** Plain markdown (no frontmatter)

Repository-wide instructions apply to all files in the repository.

```markdown
# API Development Guidelines

Follow REST best practices when developing API endpoints.

## Principles

- Use semantic HTTP methods (GET, POST, PUT, DELETE)
- Return appropriate status codes (200, 201, 400, 404, 500)
- Include error messages in response body
- Version APIs using URL paths (/api/v1/)

## Examples

\`\`\`javascript
// Good: RESTful endpoint
app.get('/api/users', async (req, res) => {
  try {
    const users = await db.users.findAll();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
\`\`\`
```

## Path-Specific Instructions

**File:** `.github/instructions/NAME.instructions.md`
**Naming:** File name must end with `.instructions.md` (e.g., `api-endpoints.instructions.md`)
**Format:** Markdown with YAML frontmatter containing `applyTo`

Path-specific instructions only apply to files matching the glob patterns.

### Single Pattern

```markdown
---
applyTo: "app/models/**/*.rb"
---

# Model Guidelines

These rules apply only to Ruby model files.
```

### Multiple Patterns (Comma-Separated)

```markdown
---
applyTo: "**/*.ts,**/*.tsx"
---

# TypeScript Guidelines

These rules apply to all TypeScript files.
```

### Multiple Patterns (Array)

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

\`\`\`typescript
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
\`\`\`
```

## Frontmatter Fields

### Path-Specific Required Fields

- **`applyTo`** (string or array): Glob pattern(s) for files this applies to
  ```yaml
  # Single pattern
  applyTo: "app/models/**/*.rb"

  # Multiple patterns (comma-separated string)
  applyTo: "**/*.ts,**/*.tsx"

  # Multiple patterns (array)
  applyTo:
    - "src/api/**/*.ts"
    - "src/services/**/*.ts"

  # All files (any of these work)
  applyTo: "**"
  applyTo: "*"
  applyTo: "**/*"
  ```

### Path-Specific Optional Fields

- **`excludeAgent`** (string): Prevent file from being used by specific agent
  - `"code-review"` - Exclude from Copilot code review (only used by coding agent)
  - `"coding-agent"` - Exclude from Copilot coding agent (only used by code review)
  - If omitted, both agents use the instructions

  ```yaml
  # Only used by coding agent
  applyTo: "**"
  excludeAgent: "code-review"

  # Only used by code review
  applyTo: "**"
  excludeAgent: "coding-agent"
  ```

### PRPM Extension Fields

- **`subtype`** (string): Type of instruction ("rule", "tool", "chatmode")

## Content Format

Natural language markdown with:

- **Clear headings**: Organize with H1/H2
- **Bullet points**: For lists of rules
- **Code examples**: Show concrete patterns
- **Plain language**: Write for human readability
- **Actionable guidance**: Specific, not generic

## Best Practices

1. **Be specific**: Generic advice is less useful than project-specific patterns
2. **Show examples**: Code samples are more effective than descriptions
3. **Keep it short**: Copilot processes limited context
4. **Natural language**: Write as you would explain to a developer
5. **Update regularly**: Keep instructions in sync with codebase

## Path-Specific Guidelines

- **Granular targeting**: Match only files where rules apply
- **Multiple files**: Create separate instruction files for different contexts
- **Naming convention**: Use descriptive names (e.g., `api-endpoints.instructions.md`)
- **Glob patterns**: Use standard glob syntax
  - `**` matches nested directories
  - `*` matches single path segment
  - `{ts,tsx}` matches multiple extensions

## Examples by Use Case

### Testing Standards

```markdown
# Testing Standards

All tests use Jest and React Testing Library.

## Component Tests

- Test user interactions, not implementation
- Use `screen.getByRole` over `getByTestId`
- Mock external dependencies
- Test accessibility (ARIA roles)

\`\`\`typescript
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
\`\`\`
```

### Excluding from Code Review

```markdown
---
applyTo: "**"
excludeAgent: "code-review"
---

# Coding Agent Only Instructions

These instructions are only used by the Copilot coding agent, not code review.

- Focus on implementation patterns
- Suggest modern syntax alternatives
- Optimize for readability in generated code
```

### Excluding from Coding Agent

```markdown
---
applyTo: "**/*.test.ts"
excludeAgent: "coding-agent"
---

# Code Review Only Instructions

These instructions are only used by Copilot code review, not the coding agent.

- Verify test coverage is adequate
- Check for proper assertions
- Ensure tests are not flaky
```

### Database Patterns

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

\`\`\`typescript
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
\`\`\`
```

## Skills

**File:** `.github/skills/<skill-name>/SKILL.md`
**Format:** Markdown with YAML frontmatter
**Availability:** VS Code Insiders with `chat.useAgentSkills` setting enabled

Skills are task-specific capabilities that Copilot can discover and apply based on context. Each skill requires its own subdirectory with a `SKILL.md` file.

### Skill Frontmatter

**Required:**
- **`name`** (string): Unique identifier for the skill (lowercase, hyphens for spaces, max 64 chars)
- **`description`** (string): What the skill does and when to use it (max 1024 chars)

### Skill Structure

```markdown
---
name: webapp-testing
description: Guides testing of web applications using browser automation and testing frameworks
---

# Web Application Testing

This skill helps you test web applications effectively.

## Procedures

1. Set up testing environment
2. Write unit tests
3. Run integration tests

## Resources

- [Test template](./test-template.ts)
```

### Skill Discovery

Copilot uses a three-level progressive disclosure system:

1. **Discovery**: Copilot reads metadata from frontmatter to identify relevant skills
2. **Loading**: When matched, the full `SKILL.md` body enters context
3. **Access**: Referenced resources (scripts, templates, examples) load only when needed

### Skill Best Practices

1. **Specific descriptions**: Be explicit about capabilities and use cases
2. **Bundled resources**: Include supporting files (scripts, templates, examples)
3. **Relative references**: Use relative paths like `[template](./file.js)` for resources
4. **Clear procedures**: Document step-by-step processes
5. **Example inputs/outputs**: Show concrete usage patterns

### Example Skill

```markdown
---
name: api-documentation
description: Generates and maintains API documentation following OpenAPI specifications
---

# API Documentation Generator

Assists with creating comprehensive API documentation.

## When to Use

- Creating new API endpoints
- Updating existing documentation
- Generating OpenAPI specs

## Procedures

1. Analyze endpoint code
2. Extract request/response schemas
3. Generate markdown documentation
4. Create OpenAPI specification

## Guidelines

- Document all parameters and return types
- Include request/response examples
- Specify authentication requirements
- Add error response documentation

## Templates

- [Endpoint template](./endpoint-template.md)
- [Schema template](./schema-template.yaml)
```

## Conversion Notes

### From Canonical

- Repository-wide: No frontmatter
- Path-specific: `applyTo` in YAML frontmatter as array
- Skills: `name` and `description` in frontmatter, content as markdown body
- Natural language markdown content
- Sections converted to H2 headers

### To Canonical

- Extracts H1 as display title
- Parses `applyTo` (string or array)
- Detects path-specific vs repository-wide
- Extracts description from first paragraph
- Skills: frontmatter `description` becomes canonical description

## Limitations

- No persona definitions
- No tool specifications
- No versioning or metadata
- Limited context window
- Skills require VS Code Insiders with specific setting enabled

## Differences from Other Formats

**vs Cursor:**
- More natural language focused
- Path-specific via separate files (not globs in frontmatter)
- Simpler format overall
- Skills have different structure (subdirectory with SKILL.md vs single file)

**vs Claude:**
- No tools or model selection
- Skills use similar subdirectory pattern (SKILL.md)
- No agents distinction (Copilot skills are task-focused, not persona-based)

**vs Windsurf:**
- Supports path-specific rules
- Can have multiple instruction files
- Has native skill support (Windsurf does not)

## Migration Tips

When migrating to Copilot:

1. **Split by scope**: Separate repository-wide from path-specific
2. **Natural language**: Rewrite structured rules as plain guidance
3. **Concrete examples**: Add code samples for every pattern
4. **Test incrementally**: Verify Copilot behavior with each instruction file
5. **Keep it current**: Update as codebase evolves
