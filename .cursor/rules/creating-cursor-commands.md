---
description: Guidelines for creating Cursor slash commands with correct format, validation, and best practices
globs:
  - "**/.cursor/commands/*.md"
  - "**/cursor-commands.md"
  - "**/creating-cursor-commands.md"
alwaysApply: false
---

# Creating Cursor Slash Commands

Guidelines for creating effective Cursor slash commands in `.cursor/commands/*.md` with correct format and validation.

## Overview

Cursor slash commands are plain Markdown files that provide quick, focused instructions to the AI assistant. They are invoked explicitly with `/command-name` in chat.

**Key Characteristics:**
- **File Location**: `.cursor/commands/*.md`
- **Format**: Plain Markdown (NO frontmatter)
- **Invocation**: `/command-name` in chat
- **Purpose**: Single, focused tasks

## Format Requirements

### Critical Rules

1. **NO frontmatter** - Cursor commands do NOT support YAML frontmatter
2. **Plain Markdown only** - Just the command instructions
3. **Descriptive filename** - Use kebab-case (e.g., `review-code.md`)
4. **Clear instructions** - Tell AI exactly what to do

### File Naming

**Good:**
```
.cursor/commands/review-code.md         → /review-code
.cursor/commands/generate-tests.md      → /generate-tests
.cursor/commands/optimize-performance.md → /optimize-performance
```

**Bad:**
```
.cursor/commands/rc.md                  → Too cryptic
.cursor/commands/review_code.md         → Use hyphens
.cursor/commands/ReviewCode.md          → Use lowercase
```

## Schema Reference

**Schema URL**: https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/cursor-command.schema.json

**Schema Structure**:
```json
{
  "type": "object",
  "required": ["content"],
  "properties": {
    "content": {
      "type": "string",
      "description": "Plain Markdown content describing what the command should do. No frontmatter supported."
    }
  }
}
```

**Key Validation Rules:**
- Must be plain Markdown
- No YAML frontmatter allowed
- Content-only structure

## Command Structure

### Basic Template

```markdown
# Command Name

Clear description of what this command does.

Include:
- Specific requirements
- Expected output format
- Step-by-step instructions
- Examples of good output

Provide any constraints or conventions to follow.
```

### With Detailed Instructions

```markdown
# Review Code

Review the selected code for:

1. **Code Quality**
   - Clean, readable code
   - Proper naming conventions
   - DRY principle

2. **Security**
   - Input validation
   - SQL injection risks
   - XSS vulnerabilities

3. **Performance**
   - Inefficient algorithms
   - Memory leaks
   - Database optimization

Provide specific file:line references for all issues.
Format as numbered list with severity levels.
```

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Adding frontmatter | Not supported in Cursor commands | Remove `---` blocks entirely |
| Vague instructions | AI doesn't know what to do | Add specific steps and examples |
| Too many tasks | Command loses focus | Create separate commands |
| No output format | Inconsistent results | Specify expected format |
| Missing context | AI makes assumptions | Reference project conventions |

## Example Commands

### Code Review

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

### Test Generation

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

### Documentation

`.cursor/commands/document-function.md`:
```markdown
# Document Function

Generate comprehensive documentation for the selected function.

Include:
- Function signature with parameter types
- Description of what it does and why
- Usage examples
- Any side effects or performance notes

Use JSDoc/TSDoc format for TypeScript/JavaScript.
```

### Performance Optimization

`.cursor/commands/optimize-performance.md`:
```markdown
# Optimize Performance

Analyze the selected code for performance improvements.

Look for:
- O(n²) or worse algorithms
- Unnecessary re-renders (React)
- Redundant computations
- Memory leaks
- Large bundle contributions

Suggest specific optimizations with code examples and estimated impact.
```

### Refactoring

`.cursor/commands/refactor-clean.md`:
```markdown
# Refactor for Clean Code

Refactor the selected code to improve maintainability.

Apply:
- Extract large functions (> 50 lines)
- Reduce nesting (early returns)
- Eliminate duplication
- Use meaningful variable names
- Add proper TypeScript types

Preserve all existing functionality and tests.
```

## Best Practices

### 1. Be Specific and Actionable

❌ **Bad**: "Review the code for issues"
✅ **Good**: "Review for security vulnerabilities, performance issues, and code quality. Provide specific file:line references."

### 2. Include Expected Output Format

❌ **Bad**: "Generate tests"
✅ **Good**: "Generate tests using Jest. Include happy path, edge cases, and mocks. Follow existing test patterns."

### 3. Provide Context

❌ **Bad**: "Add error handling"
✅ **Good**: "Add try/catch blocks with our standard error handler. Log errors and show user-friendly messages."

### 4. Keep It Focused

Each command should do ONE thing well.

❌ **Bad**: Full-stack feature generator
✅ **Good**: Separate commands for API, component, tests

### 5. Reference Project Conventions

✅ **Good**: "Follow component patterns in components/ directory"
✅ **Good**: "Use the same testing approach as existing tests"

## Storage Locations

Commands can be stored in:

1. **Project**: `.cursor/commands/` (shared with team, in git)
2. **Global**: `~/.cursor/commands/` (personal, all projects)
3. **Team**: Cursor Dashboard (enterprise)

**Recommendation**: Store team commands in `.cursor/commands/` and commit to version control.

## Validation Checklist

Before creating a command:

- [ ] Filename is kebab-case and descriptive
- [ ] NO frontmatter (plain Markdown only)
- [ ] Instructions are clear and specific
- [ ] Expected output format is described
- [ ] Examples are included
- [ ] Steps are actionable
- [ ] Command is focused on one task
- [ ] File is in `.cursor/commands/` directory

## Commands vs. Rules

### Use Commands When:
- Explicit invocation desired
- Simple, focused task
- Personal productivity shortcut
- One-time operation

### Use Rules When:
- Context-aware automatic activation
- File-type specific guidance
- Team conventions
- Always-on standards

**Example:**
- **Command**: `/generate-tests` - Explicitly generate tests
- **Rule**: Auto-attach testing conventions to `*.test.ts` files

## Common Use Cases

### Code Quality
- `/review-code` - Comprehensive code review
- `/refactor-clean` - Clean code refactoring
- `/fix-lint` - Fix linting issues
- `/improve-types` - Improve TypeScript types

### Testing
- `/generate-tests` - Generate unit tests
- `/test-edge-cases` - Add edge case tests
- `/test-coverage` - Analyze test coverage

### Documentation
- `/document-function` - Document functions
- `/add-comments` - Add explanatory comments
- `/explain-code` - Explain complex code

### Performance
- `/optimize-performance` - Performance optimization
- `/analyze-complexity` - Time complexity analysis
- `/reduce-bundle` - Bundle size reduction

### Security
- `/security-audit` - Security review
- `/sanitize-input` - Add input validation
- `/check-auth` - Review authentication

## References

- **Schema**: https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/cursor-command.schema.json
- **Cursor Docs**: `/Users/khaliqgant/Projects/prpm/app/packages/converters/docs/cursor.md`
- **Official Docs**: https://cursor.com/docs/agent/chat/commands

## Remember

**Golden Rules:**
1. NO frontmatter - plain Markdown only
2. Descriptive filenames become command names
3. Clear, specific instructions
4. Include examples and expected output
5. One task per command

When creating Cursor commands, always use plain Markdown without frontmatter. This is the key difference from Cursor rules.
