# Claude Code Format Specification

**File Locations:**
- Agents: `.claude/agents/*.md`
- Skills: `.claude/skills/*.md`
- Slash Commands: `.claude/commands/*.md`
- Hooks: `.claude/hooks/*` (executable files)

**Format:** Markdown with YAML frontmatter
**Official Docs:** https://docs.claude.com/claude-code

## Overview

Claude Code uses markdown files with YAML frontmatter for agents, skills, and slash commands, plus executable files for hooks. Each type has specific capabilities and use cases.

## Frontmatter Fields

### Required Fields

- **`name`** (string): Identifier/slug (e.g., `code-reviewer`, `refactor-helper`)
- **`description`** (string): Human-readable description

### Optional Fields

- **`allowed-tools`** (string): Comma-separated list of available tools
  - Valid tools: `Read`, `Write`, `Edit`, `Grep`, `Glob`, `Bash`, `WebSearch`, `WebFetch`, `Task`, `Skill`, `SlashCommand`, `TodoWrite`, `AskUserQuestion`
  - Example: `"Read, Write, Bash"`

- **`model`** (string): Claude model to use
  - Values: `sonnet`, `opus`, `haiku`, `inherit` (inherits from parent)
  - Default: `inherit`

## Content Format

Plain markdown content following the frontmatter:

- **H1 title**: Main title (can include emoji icon, e.g., `# 🔍 Code Reviewer`)
- **Persona definition**: For agents (e.g., "You are...")
- **Instructions**: Clear, actionable guidance
- **Examples**: Code samples and use cases
- **Guidelines**: Best practices and rules

**Note:** Icons are placed in the H1 heading as emojis, not in frontmatter.

## Package Types

### Agents

Agents are long-running assistants with access to tools. They can perform complex, multi-step tasks.

```markdown
---
name: code-reviewer
description: Reviews code for best practices
allowed-tools: Read, Grep, Bash
model: sonnet
---

# 🔍 Code Reviewer

You are an expert code reviewer with deep knowledge of software engineering principles.

## Instructions

- Check for code smells and anti-patterns
- Verify test coverage
- Ensure documentation exists
- Review error handling

## Examples

When reviewing code:
\`\`\`typescript
// Check for proper error handling
try {
  await fetchData();
} catch (error) {
  // ❌ Bad: Silent failure
  console.log(error);

  // ✅ Good: Proper error handling
  logger.error('Failed to fetch data', error);
  throw new AppError('Data fetch failed', { cause: error });
}
\`\`\`
```

### Skills

Skills are reusable patterns that can be invoked during a conversation. They don't have persistent state.

```markdown
---
name: refactor-helper
description: Assists with code refactoring
allowed-tools: Read, Edit, Grep
---

# Refactor Helper Skill

Helps refactor code while maintaining functionality.

## Guidelines

- Preserve existing behavior
- Improve code structure and readability
- Update tests accordingly
- Maintain backward compatibility

## Process

1. Read and understand current implementation
2. Identify refactoring opportunities
3. Propose changes with explanations
4. Update related tests and documentation
```

### Slash Commands

Slash commands are quick actions triggered by typing `/command-name`.

**Frontmatter Fields:**
- **`allowed-tools`** (string): List of tools the command can use (inherits from conversation if not specified)
- **`argument-hint`** (string): Arguments expected for the slash command (e.g., `add [tagId] | remove [tagId] | list`). Shown when auto-completing the command.
- **`description`** (string): Brief description of the command (defaults to first line from the prompt if not specified)
- **`model`** (string): Specific model string (inherits from conversation if not specified)
- **`disable-model-invocation`** (boolean): Whether to prevent SlashCommand tool from calling this command

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
- Follow JSDoc/TSDoc format for TypeScript

## Output Format

Return formatted documentation ready to paste above the code.
```

**With Arguments:**

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

### Hooks

Hooks are executable files (shell scripts or binaries) that run in response to specific events. Unlike agents, skills, and commands (which are markdown), hooks are executable code.

**File Location:** `.claude/hooks/<event-name>`

**Format:** Executable file (shell script, binary, etc.)

**Available Events:**
- `session-start` - Runs when a new session begins
- `user-prompt-submit` - Runs before each user message is processed
- `tool-call` - Runs before tool execution
- `assistant-response` - Runs after assistant responds

#### Shell Script Hook Example

```bash
#!/bin/bash
# .claude/hooks/session-start

# Log session start time
echo "Session started at $(date)" >> ~/.claude/session.log

# Run project setup
npm install --silent

# Output message to Claude (stdout)
echo "Development environment ready"
```

#### TypeScript Hook Example

```typescript
#!/usr/bin/env node
// .claude/hooks/user-prompt-submit

import { readFileSync } from 'fs';
import { join } from 'path';

// Read hook input from stdin
const input = readFileSync(0, 'utf-8');
const data = JSON.parse(input);

// Check for security concerns
if (data.prompt.includes('API_KEY') || data.prompt.includes('SECRET')) {
  console.error('Warning: Prompt may contain secrets');
  process.exit(1); // Non-zero exit blocks the action
}

// Allow the prompt to proceed
console.log('Prompt validated');
process.exit(0);
```

#### Hook Input/Output

**Input (via stdin):**
Hooks receive JSON input describing the event:
```json
{
  "event": "user-prompt-submit",
  "timestamp": "2025-01-15T10:30:00Z",
  "prompt": "Write a function to...",
  "context": {
    "workingDir": "/path/to/project",
    "files": ["src/index.ts"]
  }
}
```

**Output (via stdout):**
- Normal output shown to user as feedback
- Empty output runs silently

**Exit Codes:**
- `0` - Success, continue normal execution
- Non-zero - Error, may block the action (depending on event)

#### Hook Permissions

Hooks are powerful and run arbitrary code. Claude Code:
- Requires explicit user confirmation to install hooks
- Shows hook source code before installation
- Warns about hook execution

#### Best Practices for Hooks

1. **Keep them fast**: Hooks run synchronously and block execution
2. **Handle errors gracefully**: Always exit with appropriate codes
3. **Log for debugging**: Write to log files, not just stdout
4. **Make executable**: `chmod +x .claude/hooks/hook-name`
5. **Use shebangs**: Start scripts with `#!/bin/bash` or `#!/usr/bin/env node`
6. **Document behavior**: Add comments explaining what the hook does

#### Hook Package Structure

When distributing hooks via PRPM:
```markdown
---
name: session-logger
description: Logs session start/end times
hookType: hook
---

# Session Logger Hook

Logs Claude Code session activity for tracking and debugging.

## Installation

This hook will be installed to `.claude/hooks/session-start`.

## Behavior

- Logs session start time to `~/.claude/session.log`
- Displays environment status
- Runs silent dependency checks

## Source Code

\`\`\`bash
#!/bin/bash
echo "Session started at $(date)" >> ~/.claude/session.log
echo "✅ Session initialized"
\`\`\`
```

## Best Practices

1. **Clear personas**: Start agents with "You are..." to establish role
2. **Tool selection**: Only include tools actually needed
3. **Model choice**: Use `haiku` for simple tasks, `sonnet` for complex reasoning
4. **Examples**: Show both good and bad patterns
5. **Actionable instructions**: Be specific about what to do

## Conversion Notes

### From Canonical

- Frontmatter `name` uses package identifier
- Display title from H1 heading
- Tools formatted as comma-separated string in `allowed-tools` field
- Persona converted to "You are..." format

### To Canonical

- Parses H1 for display title and icon
- Extracts tools from `allowed-tools` into array
- Detects subtype from file path (.claude/agents/, .claude/skills/, .claude/commands/)
- Persona extracted if "You are..." pattern found
- Hook executable code preserved in code blocks

## Limitations

- Tools configuration may not work in all contexts
- Some features require specific Claude Code versions
- Model selection only affects agents (not skills/commands)
