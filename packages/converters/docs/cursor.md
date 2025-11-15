# Cursor Rules Format Specification

**File Location:** `.cursor/rules`
**Format:** MDC (Markdown Components) with YAML frontmatter
**Official Docs:** https://cursor.com/docs/context/rules

## Overview

Cursor uses `.cursor/rules` directory with individual rule files written in MDC (Markdown Components) format, supporting metadata via YAML frontmatter and content in markdown. Rules control when and how AI context is applied.

## Rule Types

Cursor has four rule types that determine when rules are applied:

| Rule Type | Description | Frontmatter Configuration |
|-----------|-------------|--------------------------|
| **Always Apply** | Apply to every chat session | `alwaysApply: true` |
| **Apply Intelligently** | Agent decides relevance based on description | `alwaysApply: false`, no globs, has description |
| **Apply to Specific Files** | When file matches specified pattern | `globs` specified with patterns |
| **Apply Manually** | When @-mentioned in chat | Requires manual invocation |

## Frontmatter Fields

### Required Fields

- **`description`** (string): Human-readable description of what this rule does
  - Used by AI to determine relevance for "Apply Intelligently" type
  - Shown in rule selection UI

### Optional Fields

- **`globs`** (array of strings): File patterns for "Apply to Specific Files" type
  ```yaml
  globs:
    - "src/**/*.tsx"
    - "src/**/*.jsx"
  ```

- **`alwaysApply`** (boolean): Controls "Always Apply" behavior
  - `true`: Rule included in every chat session
  - `false` (default): Rule applied based on globs or agent decision

### PRPM Extension Fields

These fields support round-trip conversion but are ignored by Cursor:

- **`name`** (string): Package identifier for PRPM
- **`agentType`** (string: "agent"): Marks as agent subtype
- **`skillType`** (string: "skill"): Marks as skill subtype
- **`commandType`** (string: "slash-command"): Marks as command subtype

## Content Format

Standard markdown after frontmatter:

- **Headings**: H1-H6 with optional emojis
- **Lists**: Unordered and ordered
- **Code blocks**: With language specifiers
- **Bold/italic**: Standard markdown formatting
- **Links**: Standard markdown links

## Examples

### Always Apply Rule

```markdown
---
description: Core coding standards that apply to all files
alwaysApply: true
---

# Core Coding Standards

These standards apply to every chat session.

## General Principles

- Write self-documenting code
- Keep functions under 50 lines
- Use meaningful variable names
- Add comments only for complex logic
```

### Apply Intelligently Rule

```markdown
---
description: RPC Service boilerplate patterns and conventions
alwaysApply: false
---

# RPC Service Patterns

Agent will include this when it detects RPC service context.

## Guidelines

- Use our internal RPC pattern when defining services
- Always use snake_case for service names
- Include proper error handling in all service methods
```

### Apply to Specific Files Rule

```markdown
---
description: React component development standards
globs:
  - "src/**/*.tsx"
  - "src/**/*.jsx"
alwaysApply: false
---

# React Component Standards

Applied only to React component files.

## Component Structure

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

### Apply Manually Rule

```markdown
---
description: Performance optimization guidelines (use with @rules)
alwaysApply: false
---

# Performance Optimization Guide

Manually invoke with @rules when optimizing performance-critical code.

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

---

## Commands (Slash Commands)

**File Location:** `.cursor/commands/*.md`
**Format:** Plain Markdown (NO frontmatter)
**Official Docs:** https://cursor.com/docs/agent/chat/commands

### Format Requirements

- **No frontmatter allowed**
- **Plain markdown only**
- **Descriptive filenames**: Use clear names like `review-code.md`, `generate-tests.md`
- **Triggered with `/`**: Commands are invoked in chat with `/command-name`

### Storage Locations

Commands can be stored in multiple locations (in order of precedence):

1. **Project commands**: `.cursor/commands/` directory in your project
2. **Global commands**: `~/.cursor/commands/` directory for all projects
3. **Team commands**: Created via Cursor Dashboard for team sharing

### Content Format

Commands contain plain markdown describing what the command should do when invoked:

- Clear, actionable instructions
- Specific about expected behavior
- Step-by-step guidance for complex tasks
- Examples of desired output

### Examples

#### Review Code Command

`.cursor/commands/review-code.md`:
```markdown
# Review Code

Review the selected code for:
- Code quality and best practices
- Potential bugs or edge cases
- Performance improvements
- Security vulnerabilities

Provide specific, actionable feedback with code examples where appropriate.
```

#### Generate Tests Command

`.cursor/commands/generate-tests.md`:
```markdown
# Generate Tests

Generate comprehensive unit tests for the selected code.

Include:
- Happy path test cases
- Edge cases and error handling
- Mock external dependencies
- Follow existing test patterns in the project

Use the testing framework already configured in the project.
```

#### Explain Code Command

`.cursor/commands/explain-code.md`:
```markdown
# Explain Code

Provide a clear explanation of what the selected code does.

Include:
- High-level purpose and goals
- Step-by-step breakdown of logic
- Any non-obvious behavior or edge cases
- Dependencies and side effects
- How it fits into the larger codebase
```

### Usage

Once created, commands are available in chat:

```
/review-code
```

The agent will execute the instructions from the corresponding `.cursor/commands/review-code.md` file.

---

## Best Practices

1. **Clear descriptions**: Write descriptions that help AI determine relevance
2. **Specific globs**: Target actual file patterns where rules apply
3. **Always Apply sparingly**: Only use for truly universal rules
4. **Intelligent by default**: Let agent decide when rules are relevant
5. **Manual for special cases**: Use manual invocation for optional guidance

## Conversion Notes

### From Canonical

- Use `pkg.description` for `description` field
- Use `pkg.name` for PRPM extension field
- Convert `metadata.globs` to `globs` array
- Set `alwaysApply` from `metadata.alwaysApply`

### To Canonical

- Extract `description` as primary identifier
- Parse `globs` to metadata
- Extract `alwaysApply` behavior
- Detect rule type from field combination

## Limitations

- No versioning built-in
- No persona definitions
- No tool specifications
- File patterns use glob syntax only (no regex)

## Differences from Other Formats

**vs Claude:**
- No tool specifications
- No model selection
- No agents/skills/commands distinction
- Pure rule-based approach

**vs Copilot:**
- Single file (not multiple instruction files)
- Four rule types (not just path-specific)
- MDC format vs plain markdown

**vs Continue:**
- MDC format (not pure markdown)
- Four rule types vs always/globs/regex
- description field (not name)

## Migration Tips

1. **Start with Always Apply**: Core standards that apply everywhere
2. **Use Intelligent for domains**: Let AI decide when domain rules apply
3. **Specific Files for tech**: Apply TypeScript rules to .ts files
4. **Manual for workflows**: Special procedures, optimization guides
5. **Clear descriptions**: Write descriptions that help AI understand context
