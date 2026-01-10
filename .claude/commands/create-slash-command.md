---
description: Create a new Claude Code slash command with best practices
argument-hint: <command-name> [description]
allowed-tools: Write, Read, Bash
model: sonnet
commandType: slash-command
---

# 🔨 Slash Command Generator

Create a new Claude Code slash command following best practices and latest features.

## Command to Create

**Name:** $1
**Description:** $2 (or $ARGUMENTS if multi-word)

## Requirements

1. **Location:** Create in `.claude/commands/$1.md`
2. **Structure:** Include proper frontmatter with:
   - `description` - Clear, actionable description
   - `allowed-tools` - Minimal required tools
   - `argument-hint` - If command takes arguments
   - `model` - Appropriate model selection
   - `commandType: slash-command` - For PRPM compatibility

3. **Features to Consider:**
   - **Arguments:** Use `$ARGUMENTS`, `$1`, `$2`, etc. for user input
   - **File References:** Use `@filepath` to reference files
   - **Bash Execution:** Use `!`command`` for inline bash (requires `Bash` in allowed-tools)
   - **Namespacing:** Use subdirectories for organization (`.claude/commands/category/name.md`)

## Template Structure

```markdown
---
description: [Brief, actionable description]
allowed-tools: [Minimal list: Read, Write, Edit, Bash, etc.]
argument-hint: [Expected arguments format]
model: [sonnet|haiku|opus|inherit]
commandType: slash-command
---

# [Icon] [Title]

[Clear description of what this command does]

## Instructions

- [Specific, actionable steps]
- [What the command should analyze/generate/modify]

## Output Format

[Describe expected output format, with examples if helpful]
```

## Validation Checklist

Before creating, verify:
- [ ] Command name is clear and follows kebab-case
- [ ] Description is specific and actionable (not generic)
- [ ] Tool permissions are minimal and necessary
- [ ] Argument hints provided if arguments expected
- [ ] Model selection appropriate for task complexity
- [ ] Includes helpful examples or output format guidance
- [ ] Uses special features where appropriate (@, !, $ARGUMENTS)

## Examples

### Simple Command (no arguments)
```markdown
---
description: Review current file for security issues
allowed-tools: Read, Grep
---

# 🔒 Security Review

Review the current file for common security vulnerabilities:
- SQL injection
- XSS vulnerabilities
- Authentication issues
- Insecure dependencies
```

### With Arguments
```markdown
---
description: Generate test file for specified source file
argument-hint: <source-file-path>
allowed-tools: Read, Write
---

# 🧪 Test Generator

Generate comprehensive test file for @$1

Include:
- Unit tests for all exported functions
- Edge cases
- Error handling
- Mocking where needed
```

### With Bash Execution
```markdown
---
description: Show git status with context
allowed-tools: Bash(git *)
---

# 📊 Git Context

Current Status:
!`git status --short`

Recent Commits:
!`git log --oneline -5`

Current Branch:
!`git branch --show-current`
```

### Namespaced Command
File: `.claude/commands/db/migrate.md`
```markdown
---
description: Create new database migration
argument-hint: <migration-name>
allowed-tools: Write, Bash
---

# 🗄️ Database Migration

Create migration: $1

Timestamp: !`date +%Y%m%d%H%M%S`

Generate migration file with:
- Up migration
- Down migration
- Type-safe schema changes
```

## Action

Create the slash command file for "$1" with:
1. Proper frontmatter and structure
2. Clear instructions
3. Appropriate use of special features
4. Examples if command is complex

Save to `.claude/commands/$1.md` (or appropriate subdirectory if namespaced).
