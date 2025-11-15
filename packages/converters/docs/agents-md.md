# agents.md Format Specification

**File Location:** `agents.md` in project root or subdirectories
**Format:** Plain Markdown (NO frontmatter)
**Official Docs:** https://github.com/openai/agents.md

## Overview

The `agents.md` format provides project-specific context and instructions for AI coding assistants. It's a simple, human-readable format consisting of **plain markdown only** - no YAML frontmatter, no special syntax.

## Format Requirements

- **No frontmatter**: Pure markdown only (no YAML frontmatter allowed)
- **Single file**: Typically `agents.md` in project root
- **Plain markdown**: Standard markdown syntax
- **Free-form content**: No required structure or sections

## Content Format

Free-form markdown content including:

- **Project overview**: Purpose and goals
- **Architecture notes**: Technical decisions and patterns
- **Conventions**: Coding standards and practices
- **Context**: Domain knowledge and business logic
- **Workflows**: Development processes
- **File structure**: Directory organization
- **Dependencies**: Key libraries and tools

## Examples

### Full Stack Project

```markdown
# TaskMaster Development Guide

## Project Overview

TaskMaster is a task management application for remote teams, built with real-time collaboration features and offline-first architecture.

## Architecture

### Frontend

- React 18 with TypeScript
- Vite for build tooling
- Zustand for state management
- React Query for server state
- Tailwind CSS for styling

### Backend

- Node.js with Express
- PostgreSQL with Prisma ORM
- WebSocket for real-time features
- Redis for caching and pub/sub
- JWT for authentication

## Coding Conventions

- Use TypeScript strict mode
- Functional components with hooks (no class components)
- Server components by default in Next.js
- Colocate tests with source files (*.test.tsx)
- Use Zod for runtime validation

## File Structure

\`\`\`
src/
  components/     # Reusable UI components
  features/       # Feature-based modules
  hooks/          # Custom React hooks
  lib/            # Utility functions
  pages/          # Route pages
  types/          # TypeScript types
\`\`\`

## Development Workflow

1. Create feature branch from `main`
2. Write tests first (TDD)
3. Implement feature
4. Run `pnpm test` and `pnpm lint`
5. Create PR with description
6. Merge after approval

## Testing

- Use Vitest for unit tests
- Use Playwright for E2E tests
- Aim for 80% coverage on new code
- Mock external dependencies
```

### Backend API Project

```markdown
# Payment Gateway API

## Overview

RESTful API for payment processing with support for multiple payment providers.

## Tech Stack

- Node.js 20.x
- Express
- PostgreSQL 15
- Redis for rate limiting
- Stripe and PayPal integrations

## API Design

### Endpoints

All endpoints follow REST conventions:

- `GET /api/payments` - List payments
- `GET /api/payments/:id` - Get payment details
- `POST /api/payments` - Create payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Cancel payment

### Error Handling

Return consistent error format:

\`\`\`json
{
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Payment could not be processed",
    "details": {...}
  }
}
\`\`\`

## Security

- All endpoints require JWT authentication
- Rate limiting: 100 requests/minute per IP
- Input validation with Zod schemas
- SQL injection prevention via Prisma
- PCI DSS compliance for payment data

## Database

### Conventions

- Use snake_case for table/column names
- Add timestamps (created_at, updated_at) to all tables
- Use UUIDs for primary keys
- Foreign keys follow `{table}_id` pattern
```

### Frontend Component Library

```markdown
# Design System Components

A React component library following Atomic Design principles.

## Component Structure

All components follow this structure:

\`\`\`
ComponentName/
  ComponentName.tsx       # Main component
  ComponentName.test.tsx  # Tests
  ComponentName.stories.tsx # Storybook stories
  index.ts                 # Exports
\`\`\`

## Styling

- Use Tailwind CSS utility classes
- Create custom classes in `styles/components/` for complex components
- Follow BEM naming for custom classes
- Responsive by default (mobile-first)

## TypeScript

\`\`\`typescript
// Good: Explicit prop types
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function Button({ variant, size = 'md', ...props }: ButtonProps) {
  return <button className={cn(variants[variant], sizes[size])} {...props} />;
}
```

## Accessibility

- All interactive elements must be keyboard accessible
- Use semantic HTML (button, nav, main, etc.)
- Include ARIA labels for icon-only buttons
- Test with screen readers
- Maintain minimum 4.5:1 contrast ratio
```

## Best Practices

1. **Be concise**: Focus on project-specific information (AI already knows general best practices)
2. **Keep updated**: Review and update as project evolves
3. **Real examples**: Show actual code patterns from your project
4. **Plain markdown**: No YAML frontmatter or special syntax
5. **Human-readable**: Write for both AI and human developers

## Conversion Notes

### From Canonical

- Removes all frontmatter and metadata
- Flattens to plain markdown
- Includes H1 title from package name
- Lossy conversion (no metadata preserved)

### To Canonical

- Creates minimal metadata section
- Uses filename as package identifier
- Entire content becomes instructions
- No format-specific features to extract

## Limitations

- **No frontmatter**: Cannot store metadata
- **No path-specific rules**: Applies to entire project
- **Single file**: All context in one document
- **No versioning**: Single snapshot of project state
- **No subtypes**: Everything is generic project context

## Differences from Other Formats

**vs Cursor:**
- No frontmatter at all (Cursor requires frontmatter)
- Single file focus (Cursor supports multiple)
- No rule types or globs
- Simpler format

**vs Claude:**
- No agents/skills/commands distinction
- No tool specifications
- No model selection
- Pure documentation

**vs Continue:**
- No frontmatter (Continue supports optional frontmatter)
- No globs or regex matching
- Single file model

**vs Copilot:**
- No path-specific support
- No frontmatter fields
- Simpler structure

**vs Kiro:**
- No frontmatter (Kiro supports optional frontmatter)
- No inclusion modes
- No file matching patterns

## Migration Tips

When creating agents.md from other formats:

1. **Remove all frontmatter**: Strip YAML headers completely
2. **Focus on content**: Keep only markdown content
3. **Combine context**: Merge multiple rule files into one cohesive document
4. **Simplify**: Remove format-specific features (globs, regex, etc.)
5. **Plain markdown only**: Use standard markdown syntax

## Official Specification

For the authoritative specification, see: https://github.com/openai/agents.md

The official repository contains:
- Format specification
- Best practices
- Integration examples
- Community guidelines
