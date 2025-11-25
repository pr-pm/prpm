---
description: Guidelines for creating Claude Code slash commands with correct frontmatter, file location, and structure
globs:
  - "**/.claude/commands/*.md"
  - "**/claude-commands.md"
  - "**/creating-claude-commands.md"
alwaysApply: false
---

# Creating Claude Code Slash Commands

Guidelines for creating Claude Code slash commands - quick actions triggered by `/command-name`.

## Overview

Slash commands are quick, single-purpose actions stored as Markdown files with optional YAML frontmatter.

**File Location:** `.claude/commands/command-name.md`

**Format:** Markdown with optional YAML frontmatter

## Frontmatter Fields

ALL fields are optional. If no frontmatter is needed, you can omit the `---` delimiters entirely.

### description (string)

Brief description shown in autocomplete. Defaults to first line from prompt if not specified.

```yaml
---
description: Generate comprehensive documentation for selected code
---
```

### allowed-tools (string)

Comma-separated list of tools the command can use. Inherits from conversation if not specified.

**Valid tools:** `Read`, `Write`, `Edit`, `Grep`, `Glob`, `Bash`, `WebSearch`, `WebFetch`, `Task`, `Skill`, `SlashCommand`, `TodoWrite`, `AskUserQuestion`

```yaml
---
allowed-tools: Read, Edit, Grep
---
```

**Important:** Must be comma-separated STRING, not array.

### argument-hint (string)

Expected arguments for the command. Shown when auto-completing.

```yaml
---
argument-hint: [file-path]
---
```

```yaml
---
argument-hint: add [tagId] | remove [tagId] | list
---
```

### model (string)

Specific model to use for this command. Inherits from conversation if not specified.

**Valid values:** `sonnet`, `opus`, `haiku`, `inherit`

```yaml
---
model: sonnet
---
```

### disable-model-invocation (boolean)

Set to `true` to prevent Claude from automatically invoking this command via the SlashCommand tool.

```yaml
---
disable-model-invocation: true
---
```

### commandType (string)

Set to `"slash-command"` for explicit type preservation in round-trip conversion (PRPM extension).

```yaml
---
commandType: slash-command
---
```

## Format Requirements

### Basic Structure

```markdown
---
description: Generate documentation for code
allowed-tools: Read, Edit
model: sonnet
---

# 📝 Documentation Generator

Generate comprehensive documentation for the selected code.

## Instructions

- Analyze code structure and purpose
- Generate clear, concise documentation
- Include parameter descriptions
- Add usage examples
```

### Minimal Command (No Frontmatter)

```markdown
Review the current file for:
- Code quality issues
- Security vulnerabilities
- Performance bottlenecks
```

### With Arguments

```markdown
---
description: Manage tags for files
argument-hint: add [tagId] | remove [tagId] | list
allowed-tools: Read, Write
---

# Tag Manager

Manage tags for project files.

## Usage

- `/tags add <tagId>` - Add a tag
- `/tags remove <tagId>` - Remove a tag
- `/tags list` - List all tags
```

## Content Guidelines

### H1 Title (Optional)

Can include emoji icon for visual identification:

```markdown
# 📝 Documentation Generator
```

Icons go in the H1 heading, NOT in frontmatter.

### Instructions

Provide clear, actionable guidance:

```markdown
## Instructions

- Analyze code structure and purpose
- Generate clear, concise documentation
- Follow JSDoc/TSDoc format for TypeScript
```

### Output Format

Specify expected output:

```markdown
## Output Format

Return formatted documentation ready to paste above the code.
```

### Examples

Show Claude what good output looks like:

```markdown
## Example

```typescript
/**
 * Calculates total price with tax
 * @param price - Base price before tax
 * @returns Total price including tax
 */
function calculateTotal(price: number, taxRate: number): number {
  return price * (1 + taxRate);
}
```
```

## Schema Reference

Commands are validated against the JSON Schema:

**Schema URL:** https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-slash-command.schema.json

**Schema Structure:**
```json
{
  "frontmatter": {
    "description": "string (optional)",
    "allowed-tools": "string (optional)",
    "argument-hint": "string (optional)",
    "model": "string (optional)",
    "disable-model-invocation": "boolean (optional)",
    "commandType": "slash-command (optional)"
  },
  "content": "string (markdown content)"
}
```

## Common Mistakes to Avoid

### 1. Array for allowed-tools

**Wrong:**
```yaml
---
allowed-tools: [Read, Write, Edit]
---
```

**Correct:**
```yaml
---
allowed-tools: Read, Write, Edit
---
```

### 2. Wrong Field Names

**Wrong:**
```yaml
---
tools: Read, Write
arguments: [file-path]
---
```

**Correct:**
```yaml
---
allowed-tools: Read, Write
argument-hint: [file-path]
---
```

### 3. Invalid Tool Names

**Wrong:**
```yaml
---
allowed-tools: bash, grep, read
---
```

**Correct:**
```yaml
---
allowed-tools: Bash, Grep, Read
---
```

### 4. Invalid Model Values

**Wrong:**
```yaml
---
model: claude-3-5-sonnet-20241022
---
```

**Correct:**
```yaml
---
model: sonnet
---
```

### 5. Icon in Frontmatter

**Wrong:**
```yaml
---
icon: 📝
description: Generate docs
---
```

**Correct:**
```yaml
---
description: Generate docs
---

# 📝 Documentation Generator
```

## Validation Checklist

Before finalizing a slash command:

- [ ] File saved to `.claude/commands/*.md`
- [ ] Frontmatter uses correct field names
- [ ] `allowed-tools` is comma-separated string (not array)
- [ ] `model` uses short values (`sonnet`, not `claude-3-5-sonnet-20241022`)
- [ ] Icon (if used) is in H1 heading, not frontmatter
- [ ] Description is specific and actionable
- [ ] Tool permissions are minimal
- [ ] Arguments documented in `argument-hint` if needed
- [ ] Instructions are clear
- [ ] Expected output format specified
- [ ] Examples included in prompt

## Examples

### Documentation Generator

```markdown
---
description: Generate comprehensive documentation for selected code
allowed-tools: Read, Edit
model: sonnet
---

# 📝 Documentation Generator

Generate comprehensive documentation for the selected code.

## Instructions

- Analyze code structure and purpose
- Generate clear, concise documentation
- Include parameter descriptions with types
- Add usage examples
- Follow JSDoc/TSDoc format for TypeScript

## Output Format

Return formatted documentation ready to paste above the code:

/**
 * Function description
 * @param {Type} paramName - Parameter description
 * @returns {ReturnType} Return value description
 */
```

### Code Reviewer

```markdown
---
description: Review code for quality, security, and performance
allowed-tools: Read, Grep
---

# 🔍 Code Reviewer

Review the selected code or current file for:

## Code Quality
- Clean, readable code
- Proper naming conventions
- DRY principle

## Security
- Input validation
- SQL injection risks
- XSS vulnerabilities

## Performance
- Inefficient algorithms
- Unnecessary computations
- Memory leaks

Provide specific file:line references for all issues.
```

### Test Generator

```markdown
---
description: Generate test cases for selected code
allowed-tools: Read, Write
---

# 🧪 Test Generator

Generate comprehensive test cases for the selected code.

## Test Coverage

- Happy path scenarios
- Edge cases
- Error conditions
- Boundary values

## Structure

Follow the project's testing conventions and match existing patterns.

## Example

```typescript
describe('calculateTotal', () => {
  it('should calculate total with valid inputs', () => {
    expect(calculateTotal(100, 0.08)).toBe(108);
  });

  it('should throw for negative price', () => {
    expect(() => calculateTotal(-100, 0.08)).toThrow();
  });
});
```
```

### Git Workflow with Arguments

```markdown
---
description: Create and push feature branch
argument-hint: <feature-name>
allowed-tools: Bash(git *)
---

# 🌿 Feature Branch Creator

Create and push a new feature branch.

## Usage

```bash
/feature user-authentication
/feature api-optimization
```

Creates branch: `feature/<feature-name>`
```

### Minimal Command

```markdown
---
description: Quick code quality check
---

Review this code for:
- Naming issues
- Code smells
- Quick wins for improvement
```

## Best Practices

1. **Keep commands focused** - One command, one purpose
2. **Use clear descriptions** - Make them specific and actionable
3. **Minimal tool permissions** - Only request tools actually needed
4. **Document arguments** - Use `argument-hint` for expected args
5. **Include examples** - Show Claude what good output looks like
6. **Specify output format** - Be explicit about what you want
7. **Add icons to H1** - Use emoji in heading for visual identification
8. **Test before committing** - Invoke and verify it works

## Related Documentation

- **Schema:** https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-slash-command.schema.json
- **Claude Docs:** https://docs.claude.com/claude-code
