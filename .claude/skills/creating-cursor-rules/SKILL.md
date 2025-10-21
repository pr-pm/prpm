---
name: Creating Cursor Rules
description: Expert guidance for creating effective Cursor IDE rules with best practices, patterns, and examples
author: PRPM Team
version: 1.0.0
tags:
  - meta
  - cursor
  - documentation
  - best-practices
  - project-setup
---

# Creating Cursor Rules

You are an expert at creating effective `.cursor/rules` files that help AI assistants understand project conventions and produce better code.

## When to Apply This Skill

**Use when:**
- User is starting a new project and needs `.cursor/rules` setup
- User wants to improve existing project rules
- User asks to convert skills/guidelines to Cursor format
- Team needs consistent coding standards documented

**Don't use for:**
- One-time instructions (those can be asked directly)
- User-specific preferences (those go in global settings)
- Claude Code skills (this skill is specifically for Cursor rules)

## Core Principles

### 1. Be Specific and Actionable

Rules should provide concrete guidance, not vague advice.

**❌ BAD - Vague:**
```markdown
Write clean code with good practices.
Use proper TypeScript types.
```

**✅ GOOD - Specific:**
```markdown
Use functional components with TypeScript.
Define prop types with interfaces, not inline types.
Extract custom hooks when logic exceeds 10 lines.
```

### 2. Focus on Decisions, Not Basics

Don't document what linters handle. Document architectural decisions.

**❌ BAD - Linter territory:**
```markdown
Use semicolons in JavaScript.
Indent with 2 spaces.
Add trailing commas.
```

**✅ GOOD - Decision guidance:**
```markdown
Choose Zustand for global state, React Context for component trees.
Use Zod for runtime validation at API boundaries only.
Prefer server components except for: forms, client-only APIs, animations.
```

### 3. Organize by Concern

Group related rules into clear sections:

```markdown
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

Every Cursor rule file should include these sections:

### 1. Tech Stack Declaration

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

### 2. Code Style Guidelines

```markdown
## Code Style
- **Components**: Functional with TypeScript
- **Props**: Interface definitions, destructure in params
- **Hooks**: Extract when logic > 10 lines
- **Exports**: Named exports only (no default)
- **File naming**: kebab-case.tsx
```

### 3. Common Patterns

Always include code examples, not just descriptions:

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

## What NOT to Include

Avoid these common mistakes:

**❌ Too obvious:**
```markdown
- Write readable code
- Use meaningful variable names
- Add comments when necessary
- Follow best practices
```

**❌ Too restrictive:**
```markdown
- Never use any third-party libraries
- Always write everything from scratch
- Every function must be under 5 lines
```

**❌ Language-agnostic advice:**
```markdown
- Use design patterns
- Think before you code
- Test your code
- Keep it simple
```

## Structure Template

Use this template for new Cursor rules:

```markdown
# Project Name - Cursor Rules

## Tech Stack
[List all major technologies with versions]

## Code Style
[Specific style decisions]

## Project Structure
[Directory organization]

## Patterns
[Common patterns with code examples]

### Pattern Name
[Description + code example]

## Conventions
[Project-specific conventions]

## Common Tasks
[Frequent operations with step-by-step snippets]

### Task Name
1. Step one
2. Step two
[Code example]

## Anti-Patterns
[What to avoid and why]

## Testing
[Testing approach and patterns with examples]
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
```

## Best Practices

### Keep It Scannable

- Use clear section headers
- Bold important terms
- Include code examples (not just prose)
- Use tables for comparisons

### Update Regularly

- Review monthly or after major changes
- Remove outdated patterns
- Add new patterns as they emerge
- Keep examples current with latest framework versions

### Test with AI

After creating rules, test them:

1. Ask AI: "Create a new API route following our conventions"
2. Ask AI: "Add error handling to this component"
3. Ask AI: "Refactor this to match our patterns"

Verify AI follows rules correctly. Update rules based on gaps found.

## Real-World Example

The PRPM registry `.cursor/rules` demonstrates:
- Clear tech stack declaration (Fastify, TypeScript, PostgreSQL)
- Specific TypeScript patterns
- Fastify-specific conventions
- Error handling standards
- API route patterns
- Database query patterns

## Checklist for New Cursor Rules

**Project Context:**
- [ ] Tech stack clearly defined with versions
- [ ] Key dependencies listed
- [ ] Deployment platform specified

**Code Style:**
- [ ] Component style specified (functional/class)
- [ ] Export style (named/default)
- [ ] File naming convention
- [ ] Specific to project (not generic advice)

**Patterns:**
- [ ] At least 3-5 code examples
- [ ] Cover most common tasks
- [ ] Include error handling pattern
- [ ] Show project-specific conventions

**Organization:**
- [ ] Logical section headers
- [ ] Scannable (not wall of text)
- [ ] Examples are complete and runnable
- [ ] Anti-patterns included with rationale

**Testing:**
- [ ] Tested with AI assistant
- [ ] AI follows conventions correctly
- [ ] Updated after catching mistakes

## Helpful Prompts for Users

When helping users create Cursor rules:

**Discovery:**
- "What's your tech stack?"
- "What patterns do you want AI to follow?"
- "What mistakes does AI currently make?"

**Refinement:**
- "Are there anti-patterns you want documented?"
- "What are your most common coding tasks?"
- "Do you have naming conventions?"

**Validation:**
- "Let me test these rules by asking you to generate code..."
- "Does this match your team's style?"

## Remember

- Cursor rules are **living documents** - update as project evolves
- Focus on **decisions**, not basics
- Include **runnable code examples**, not descriptions
- Test rules with AI to verify effectiveness
- Keep it **scannable** - use headers, bold, lists

**Goal:** Help AI produce code that matches project conventions without constant correction.
