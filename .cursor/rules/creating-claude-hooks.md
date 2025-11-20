---
description: Guidelines for creating Claude Code hooks - executable scripts triggered by events with JSON I/O
globs:
  - "**/.claude/hooks/*"
  - "**/claude-hooks.md"
  - "**/creating-claude-hooks.md"
---

# Claude Code Hooks - Format Guidelines

## Hook File Format

Claude Code hooks are executable files (not markdown) that run in response to specific events.

**Location:** `.claude/hooks/<event-name>`

**Format:** Executable file (shell script, TypeScript, Python, binary)

### Required Elements

1. **Shebang line** (first line):
```bash
#!/bin/bash
# or
#!/usr/bin/env node
# or
#!/usr/bin/env python3
```

2. **Executable permissions:**
```bash
chmod +x .claude/hooks/hook-name
```

3. **JSON input via stdin:**
```bash
INPUT=$(cat)
DATA=$(echo "$INPUT" | jq -r '.input.field')
```

4. **Exit with appropriate code:**
- `0` = Success (continue)
- `2` = Block operation (show error)
- `1` or other = Error (log but continue)

## Available Events

- `session-start` - Runs when new session begins
- `user-prompt-submit` - Runs before user message processes
- `tool-call` - Runs before tool execution
- `assistant-response` - Runs after assistant responds

## Input/Output Format

### JSON Input Structure

Hooks receive event data via stdin:

```json
{
  "event": "tool-call",
  "timestamp": "2025-01-15T10:30:00Z",
  "session_id": "abc123",
  "current_dir": "/path/to/project",
  "input": {
    "file_path": "/path/to/file.ts",
    "command": "npm test",
    "old_string": "...",
    "new_string": "..."
  }
}
```

### Output via stdout

- Normal output shown to user as feedback
- Empty output runs silently
- Use stderr (`>&2`) for debug logs

## Schema Reference

Validate hook structure against:

**URL:** https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-hook.schema.json

**Required fields:**
- `name` - Hook identifier (lowercase, hyphens)
- `description` - What hook does (max 1024 chars)

**Optional fields:**
- `event` - Event type (inferred from filename if omitted)
- `language` - bash, typescript, javascript, python, binary
- `hookType: "hook"` - For round-trip conversion

## Basic Examples

### Shell Script Hook

```bash
#!/bin/bash
# .claude/hooks/session-start

# Log session start
echo "Session started at $(date)" >> ~/.claude/session.log

# Run setup
npm install --silent

# Output to user
echo "Development environment ready"
exit 0
```

### TypeScript Hook

```typescript
#!/usr/bin/env node
// .claude/hooks/user-prompt-submit

import { readFileSync } from 'fs';

// Read JSON from stdin
const input = readFileSync(0, 'utf-8');
const data = JSON.parse(input);

// Check for security issues
if (data.prompt.includes('API_KEY') || data.prompt.includes('SECRET')) {
  console.error('Warning: Prompt may contain secrets');
  process.exit(2); // Block operation
}

// Allow prompt
console.log('Prompt validated');
process.exit(0);
```

## Validation Guidelines

### 1. Input Validation

Always validate JSON input:

```bash
INPUT=$(cat)

# Parse with error handling
if ! FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty' 2>&1); then
  echo "JSON parse failed: $FILE" >&2
  exit 1
fi

# Check field exists
if [[ -z "$FILE" ]]; then
  echo "No file path provided" >&2
  exit 1
fi
```

### 2. Path Sanitization

Prevent directory traversal:

```bash
# Block traversal attempts
if [[ "$FILE" == *".."* ]]; then
  echo "Path traversal detected" >&2
  exit 2
fi

# Keep files in project
if [[ "$FILE" != "$CLAUDE_PROJECT_DIR"* ]]; then
  echo "File outside project" >&2
  exit 2
fi
```

### 3. Variable Quoting

Always quote variables:

```bash
# WRONG - breaks on spaces
prettier --write $FILE

# RIGHT - handles spaces
prettier --write "$FILE"
```

### 4. Dependency Checks

Handle missing tools gracefully:

```bash
# Check tool exists
if ! command -v prettier &> /dev/null; then
  echo "prettier not installed, skipping" >&2
  exit 0
fi
```

## Security Best Practices

### Block Sensitive Files

```bash
#!/bin/bash
set -euo pipefail

INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty')

[[ -n "$FILE" ]] || exit 0

# Sensitive patterns
BLOCKED=(".env" ".env.*" "*.pem" "*.key" "*secret*" "*credential*")

for pattern in "${BLOCKED[@]}"; do
  case "$FILE" in
    $pattern)
      echo "Blocked: $FILE is sensitive" >&2
      exit 2  # Block operation
      ;;
  esac
done

exit 0  # Allow
```

### User Confirmation

Claude Code automatically:
- Requires explicit user confirmation to install hooks
- Shows hook source code before installation
- Warns about hook execution
- Displays hook output in transcript mode

## Performance Guidelines

### Keep Hooks Fast

Target < 100ms for PreToolUse hooks:

```bash
# BAD - blocks Claude for 30 seconds
npm test

# GOOD - run in background
(npm test &)
exit 0
```

### Use Specific Matchers

In hook configuration JSON:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write",  // Only file writes
      "hooks": [{ "type": "command", "command": "./hook.sh" }]
    }]
  }
}
```

## Publishing as PRPM Package

### Package Structure

```
my-hook/
├── prpm.json          # Package manifest
├── HOOK.md            # Hook documentation
└── hook-script.sh     # Hook executable
```

### HOOK.md Format

When distributing via PRPM, document hooks with frontmatter:

```markdown
---
name: session-logger
description: Logs session start/end times for tracking
event: SessionStart
language: bash
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
echo "Session initialized"
exit 0
\`\`\`
```

### prpm.json

```json
{
  "name": "@username/hook-name",
  "version": "1.0.0",
  "description": "Brief description shown in search",
  "author": "Your Name",
  "format": "claude",
  "subtype": "hook",
  "tags": ["automation", "security", "formatting"],
  "main": "HOOK.md"
}
```

## Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| Hook doesn't run | Not executable | `chmod +x hook-file` |
| Parse errors | Missing shebang | Add `#!/bin/bash` |
| Breaks on spaces | Unquoted variables | Use `"$VAR"` |
| Can't find scripts | Relative paths | Use `$CLAUDE_PLUGIN_ROOT` |
| Clutters transcript | Logging to stdout | Use stderr: `>&2` |
| Doesn't block | Wrong exit code | Use `exit 2` |
| Security risk | No validation | Always validate input |
| Slow | Blocking operations | Run in background |

## Environment Variables

Available in hooks:

- `$CLAUDE_PROJECT_DIR` - Project root directory
- `$CLAUDE_CURRENT_DIR` - Current working directory
- `$SESSION_ID` - Session identifier
- `$CLAUDE_PLUGIN_ROOT` - Hook installation directory
- `$CLAUDE_ENV_FILE` - File for persisting variables

## Testing Hooks

### Manual Testing

```bash
# Create test input
echo '{
  "session_id": "test",
  "input": {
    "file_path": "/tmp/test.ts"
  }
}' | ./my-hook.sh

# Check exit code
echo $?  # Should be 0, 1, or 2
```

### Edge Cases

Test with:
- Files with spaces: `"my file.txt"`
- Unicode filenames: `"文件.txt"`
- Deep paths: `"src/deep/nested/path/file.tsx"`
- Missing fields in JSON
- Malformed JSON
- Empty strings

## Related Documentation

- [Claude Code Hooks Official Docs](https://docs.claude.com/claude-code)
- [JSON Schema](https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-hook.schema.json)
- See `claude-hook-writer` skill for advanced guidance
- See `typescript-hook-writer` skill for TypeScript hooks

## Quick Checklist

Before deploying a hook:

- [ ] Shebang line included
- [ ] File is executable (`chmod +x`)
- [ ] Validates all stdin input
- [ ] Quotes all variables
- [ ] Handles missing dependencies
- [ ] Uses appropriate exit codes (0, 1, 2)
- [ ] Logs errors to stderr or file
- [ ] Tests with edge cases
- [ ] Documents dependencies
- [ ] Includes installation instructions
