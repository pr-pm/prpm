# Creating Cursor Rules - Meta Cursor Rule

**Official PRPM Meta-Rule**

Learn how to create effective Cursor rules (`.cursor/rules/`) for Cursor IDE with proper structure, actionable patterns, and code examples.

## Installation

```bash
prpm install @prpm-official/creating-cursor-rules
```

## What This Rule Does

- Teaches effective Cursor rule file structure
- Shows how to write specific, actionable rules
- Provides templates for common sections
- Includes code pattern examples
- Explains what to include vs. avoid

## When to Use

Use when:
- Starting a new project and setting up Cursor rules (`.cursor/rules/`)
- Improving existing project rules
- Converting documentation to Cursor rule format
- Ensuring team follows consistent standards

## What You'll Learn

- **Required Sections**: Tech stack, code style, patterns, conventions
- **Specificity**: How to write actionable (not vague) rules
- **Pattern Examples**: Include code, not just descriptions
- **Anti-Patterns**: What to avoid and why
- **Common Tasks**: Shortcuts for frequent operations

## Quick Example

Bad (vague):
```markdown
Write clean code with good practices.
```

Good (specific):
```markdown
## Code Style
- Functional components with TypeScript
- Named exports only (no default exports)
- Props defined with interfaces
- Extract hooks when logic > 10 lines
```

## File Location

Cursor rules go in **`.cursor/rules/*.md`** - NOT `.cursorrules` (that's outdated).

Each rule is a separate markdown file in the `.cursor/rules/` directory.

## Structure Template

```markdown
# Project Name - Cursor Rule

## Tech Stack
[Specific technologies with versions]

## Code Style
[Specific decisions, not generic advice]

## Patterns
[Code examples for common tasks]

### Pattern Name
```code example with comments```

## Anti-Patterns
[What to avoid with examples]
```

## Real-World Impact

- ✅ AI follows project conventions consistently
- ✅ New team members understand patterns quickly
- ✅ Reduces back-and-forth on style decisions
- ✅ Living document that evolves with project

## Tags

`meta` `cursor` `cursor-rules` `documentation`

## License

MIT
