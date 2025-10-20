# Creating Cursor Rules - Meta Rule

**Tags:** meta

---

## Overview

This is a meta-rule for creating effective `.cursor/rules` files. Apply these principles when writing or improving Cursor IDE rules for your project.

## When to Use

**Use when:**
- Starting a new project and setting up `.cursor/rules`
- Improving existing project rules
- Converting skills or guidelines to Cursor format
- Team needs consistent coding standards

**Don't use for:**
- Claude Code skills (those go in `.claude/skills/`)
- One-time instructions (just ask directly)
- User-specific preferences (those go in global settings)

## Core Principles

### 1. Be Specific and Actionable

```markdown
# ❌ BAD - Vague
Write clean code with good practices.

# ✅ GOOD - Specific
Use functional components with TypeScript.
Define prop types with interfaces, not inline types.
Extract hooks when logic exceeds 10 lines.
```

### 2. Focus on Decisions, Not Basics

```markdown
# ❌ BAD - Obvious
Use semicolons in JavaScript.
Indent with 2 spaces.

# ✅ GOOD - Decision guidance
Choose Zustand for global state, React Context for component trees.
Use Zod for runtime validation at API boundaries only.
Prefer server components except for: forms, client-only APIs, animations.
```

### 3. Organize by Concern

```markdown
# ✅ GOOD Structure

## Tech Stack
- Next.js 14 with App Router
- TypeScript strict mode
- Tailwind CSS for styling

## Code Style
- Functional components only
- Named exports (no default exports)
- Co-locate tests with source files

## Patterns
- Use React Server Components by default
- Client components: mark with "use client" directive
- Error handling: try/catch + toast notification

## Project Conventions
- API routes in app/api/
- Components in components/ (flat structure)
- Types in types/ (shared), components/*/types.ts (local)
```

## Required Sections

### Tech Stack Declaration

```markdown
## Tech Stack
- Framework: Next.js 14
- Language: TypeScript 5.x (strict mode)
- Styling: Tailwind CSS 3.x
- State: Zustand
- Database: PostgreSQL + Prisma
- Testing: Vitest + Playwright
```

**Why:** Prevents AI from suggesting wrong tools/patterns.

### Code Style Guidelines

```markdown
## Code Style
- **Components**: Functional with TypeScript
- **Props**: Interface definitions, destructure in params
- **Hooks**: Extract when logic > 10 lines
- **Exports**: Named exports only (no default)
- **File naming**: kebab-case.tsx
```

### Common Patterns

```markdown
## Patterns

### Error Handling
```typescript
try {
  const result = await operation();
  toast.success('Operation completed');
  return result;
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  toast.error(message);
  throw error; // Re-throw for caller to handle
}
```

### API Route Structure
```typescript
// app/api/users/route.ts
export async function GET(request: Request) {
  try {
    // 1. Parse/validate input
    // 2. Check auth/permissions
    // 3. Perform operation
    // 4. Return Response
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Message' }), {
      status: 500
    });
  }
}
```
```

### What NOT to Include

```markdown
# ❌ AVOID - Too obvious
- Write readable code
- Use meaningful variable names
- Add comments when necessary
- Follow best practices

# ❌ AVOID - Too restrictive
- Never use any third-party libraries
- Always write everything from scratch
- Every function must be under 5 lines

# ❌ AVOID - Language-agnostic advice
- Use design patterns
- Think before you code
- Test your code
```

## Structure Template

```markdown
# Project Name - Cursor Rules

## Tech Stack
[List all major technologies]

## Code Style
[Specific style decisions]

## Project Structure
[Directory organization]

## Patterns
[Common patterns with code examples]

### Pattern Name
[Description]
```code example```

## Conventions
[Project-specific conventions]

## Common Tasks
[Frequent operations with snippets]

### Task Name
```
step 1
step 2
```

## Anti-Patterns
[What to avoid and why]

## Testing
[Testing approach and patterns]
```

## Example Sections

### Tech Stack Section

```markdown
## Tech Stack

**Framework:** Next.js 14 (App Router)
**Language:** TypeScript 5.x (strict mode enabled)
**Styling:** Tailwind CSS 3.x with custom design system
**State:** Zustand for global, React Context for component trees
**Forms:** React Hook Form + Zod validation
**Database:** PostgreSQL with Prisma ORM
**Testing:** Vitest (unit), Playwright (E2E)
**Deployment:** Vercel

**Key Dependencies:**
- `@tanstack/react-query` for server state
- `date-fns` for date manipulation (not moment.js)
- `clsx` + `tailwind-merge` for conditional classes
```

### Patterns Section with Code

```markdown
## Patterns

### Server Component Data Fetching

```typescript
// app/users/page.tsx
import { prisma } from '@/lib/prisma';

export default async function UsersPage() {
  // Fetch directly in server component
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true
    }
  });

  return <UserList users={users} />;
}
```

### Client Component with State

```typescript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface FormProps {
  onSubmit: (data: FormData) => Promise<void>;
}

export function Form({ onSubmit }: FormProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(new FormData(e.target as HTMLFormElement));
      toast.success('Saved successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```
```

### Anti-Patterns Section

```markdown
## Anti-Patterns

### ❌ Don't: Default Exports
```typescript
// ❌ BAD
export default function Button() { }

// ✅ GOOD
export function Button() { }
```

**Why:** Named exports are more refactor-friendly and enable better tree-shaking.

### ❌ Don't: Inline Type Definitions
```typescript
// ❌ BAD
function UserCard({ user }: { user: { name: string; email: string } }) { }

// ✅ GOOD
interface User {
  name: string;
  email: string;
}

function UserCard({ user }: { user: User }) { }
```

**Why:** Reusability and discoverability.

### ❌ Don't: Client Components for Static Content
```typescript
// ❌ BAD
'use client';
export function StaticContent() {
  return <div>Static text</div>;
}

// ✅ GOOD - Server component by default
export function StaticContent() {
  return <div>Static text</div>;
}
```

**Why:** Server components are faster and reduce bundle size.
```

## Common Tasks

Include shortcuts for frequent operations:

```markdown
## Common Tasks

### Adding a New API Route

1. Create `app/api/[route]/route.ts`
2. Define HTTP method exports (GET, POST, etc.)
3. Validate input with Zod schema
4. Use try/catch for error handling
5. Return `Response` object

```typescript
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);

    // Process...

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    return Response.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
```

### Adding a New Component

1. Create `components/component-name.tsx`
2. Define props interface
3. Export as named export
4. Co-locate test if complex logic

```typescript
// components/user-card.tsx
interface UserCardProps {
  name: string;
  email: string;
  onEdit?: () => void;
}

export function UserCard({ name, email, onEdit }: UserCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{name}</h3>
      <p className="text-sm text-gray-600">{email}</p>
      {onEdit && (
        <button onClick={onEdit}>Edit</button>
      )}
    </div>
  );
}
```
```

## Best Practices

### Keep It Scann able

- Use headers and sections
- Bold important terms
- Code examples for clarity
- Tables for comparisons

### Update Regularly

- Review monthly or after major changes
- Remove outdated patterns
- Add new patterns as they emerge
- Keep examples current

### Test with AI

Ask AI to:
1. "Create a new API route following our conventions"
2. "Add error handling to this component"
3. "Refactor this to match our patterns"

Verify it follows your rules correctly.

## Real-World Example

See the PRPM registry `.cursor/rules` for a complete example:
- Clear tech stack declaration
- Specific TypeScript patterns
- Fastify-specific conventions
- Error handling standards
- API route patterns

## Checklist for New Cursor Rules

**Project Context:**
- [ ] Tech stack clearly defined
- [ ] Version numbers specified
- [ ] Key dependencies listed

**Code Style:**
- [ ] Component style specified (functional/class)
- [ ] Export style (named/default)
- [ ] File naming convention
- [ ] Specific to project (not generic)

**Patterns:**
- [ ] At least 3 code examples
- [ ] Cover most common tasks
- [ ] Include error handling pattern
- [ ] Show project-specific conventions

**Organization:**
- [ ] Logical section headers
- [ ] Scannable (not wall of text)
- [ ] Examples are complete and runnable
- [ ] Anti-patterns included

**Testing:**
- [ ] Tested with AI assistant
- [ ] AI follows conventions correctly
- [ ] Updated after catching mistakes

---

**Remember:** Cursor rules are living documents. Update them as your project evolves and patterns emerge.
