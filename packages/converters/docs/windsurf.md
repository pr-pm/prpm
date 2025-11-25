# Windsurf Rules Format Specification

**File Location:** `.windsurf/rules` (single file)
**Format:** Plain markdown (no frontmatter)
**Character Limit:** 12,000 characters
**Official Docs:** https://docs.windsurf.com/windsurf/cascade/memories#rules

## Overview

Windsurf uses a single `.windsurf/rules` file containing plain markdown instructions. The format is intentionally simple with no frontmatter or special syntax.

## Format Requirements

- **No frontmatter**: Pure markdown only
- **12,000 character limit**: Hard limit enforced by Windsurf
- **Single file**: All rules in one `.windsurf/rules` file
- **Plain markdown**: Standard markdown syntax

## Content Format

Plain markdown including:

- **H1 title**: Main heading (optional)
- **H2/H3 sections**: Organize content
- **Lists**: Unordered and ordered
- **Code blocks**: With language specifiers
- **Standard markdown**: Bold, italic, links

## Examples

### Basic Rules

```markdown
# React Development Guidelines

Guidelines for building React applications in this project.

## Component Structure

- Use functional components with hooks
- Keep components under 200 lines
- Extract logic into custom hooks when appropriate
- Co-locate styles with components

## State Management

We use Zustand for global state:

- Create stores in `src/stores/`
- Use selectors to prevent unnecessary re-renders
- Keep stores focused on single concerns

\`\`\`typescript
// Good: Focused store
const useAuthStore = create((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
\`\`\`

## Testing

- Write tests alongside components (`.test.tsx`)
- Use React Testing Library
- Test user behavior, not implementation details
- Aim for 80% coverage on new code
```

### Project-Specific Context

```markdown
# Project Architecture

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Routing**: React Router v6
- **API**: REST with axios

## Directory Structure

\`\`\`
src/
  components/     # Reusable UI components
  features/       # Feature-specific code
  hooks/          # Custom React hooks
  stores/         # Zustand stores
  utils/          # Helper functions
  types/          # TypeScript types
\`\`\`

## Coding Conventions

- Use PascalCase for components
- Use camelCase for functions/variables
- Use kebab-case for file names
- Export components as named exports

## API Integration

All API calls go through `src/api/client.ts`:

\`\`\`typescript
import { apiClient } from '@/api/client';

// Use the client
const users = await apiClient.get('/users');
\`\`\`

## Environment Variables

Access via `import.meta.env`:

- `VITE_API_URL` - Backend API URL
- `VITE_APP_ENV` - Environment (dev/staging/prod)
```

## Best Practices

1. **Be concise**: 12,000 character limit means prioritize important rules
2. **Single file**: Combine all project context into one cohesive document
3. **Clear structure**: Use headers to organize into scannable sections
4. **Real examples**: Show actual code patterns from your project
5. **Update regularly**: Keep in sync with architecture changes

## Character Budget Tips

To stay under 12,000 characters:

- Focus on project-specific patterns (not general knowledge)
- Use concise language
- Limit code examples to essential patterns
- Skip obvious best practices (AI already knows them)
- Reference external docs instead of repeating them

## Conversion Notes

### From Canonical

- Removes all frontmatter
- Flattens content to plain markdown
- Includes icon in H1 title if available
- Warns if content exceeds 12,000 chars
- Lossy conversion (no metadata preserved)

### To Canonical

- Creates minimal metadata section
- Treats entire content as instructions
- No format-specific features to extract
- Uses filename as package identifier

## Limitations

- **No path-specific rules**: Applies to entire project
- **No frontmatter**: Cannot store metadata
- **Single file**: Must combine all context
- **12K character limit**: Forces brevity
- **No versioning**: Single snapshot of rules
- **No subtypes**: Everything is a "rule"

## Differences from Other Formats

**vs Cursor:**
- No frontmatter at all
- Single file (not multiple files like .cursor/rules/)
- Hard character limit
- Simpler format

**vs Claude:**
- No agents/skills distinction
- No tool specifications
- No model selection
- Pure documentation

**vs Copilot:**
- No path-specific support
- Shorter length (Copilot allows more)
- Single file model

**vs Continue:**
- No frontmatter (Continue requires minimal frontmatter)
- Single file constraint
- Enforced character limit

## Migration Strategy

When converting to Windsurf format:

1. **Combine rules**: Merge multiple rule files into one
2. **Prioritize content**: Keep project-specific, remove generic
3. **Trim examples**: Only essential code samples
4. **Monitor length**: Check character count regularly
5. **Test iteration**: Verify AI behavior with condensed rules

## Character Count

Current character count can be checked with:

```bash
wc -m .windsurf/rules
```

Stay well under 12,000 to leave room for updates.
