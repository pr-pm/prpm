---
name: creating-claude-hooks
description: Use when creating or publishing Claude Code hooks - covers executable format, event types, JSON I/O, exit codes, security requirements, and PRPM package structure
---

# Creating Claude Code Hooks

Use this skill when creating, improving, or publishing Claude Code hooks. Provides essential guidance on hook format, event handling, I/O conventions, and package structure.

## When to Use This Skill

Activate this skill when:
- User asks to create a new Claude Code hook
- User wants to publish a hook as a PRPM package
- User needs to understand hook format or events
- User is troubleshooting hook execution
- User asks about hook vs skill vs command differences

## Quick Reference

### Two Hook Configuration Methods

**Method 1: JSON Configuration** (Recommended)
- Configure in `.claude/settings.json`, `~/.claude/settings.json`, or plugin's `hooks.json`
- Supports both command hooks and prompt hooks
- More flexible, supports matchers and timeouts

**Method 2: Executable Files** (Legacy)
- Place executables in `.claude/hooks/<event-name>`
- Simpler but less configurable

### Hook Types

| Type | Description | Speed | Use Case |
|------|-------------|-------|----------|
| **Command** | Runs external script | Fast (ms) | Formatting, logging, file checks |
| **Prompt** | Uses LLM reasoning | Slow (2-10s) | Complex validation, security analysis |

### Available Events

| Event | When It Fires | Can Block? | Common Use Cases |
|-------|---------------|------------|------------------|
| `PreToolUse` | Before tool execution | Yes (exit 2) | Validation, permission checks, input modification |
| `PostToolUse` | After tool completes | No | Formatting, logging, cleanup |
| `UserPromptSubmit` | Before user input processes | Yes | Prompt validation, enhancement |
| `SessionStart` | New session begins | No | Environment setup, context loading |
| `Stop` | When assistant finishes | No | Cleanup, summary, verification |
| `SubagentStop` | When subagent finishes | No | Subagent result processing |
| `PreCompact` | Before context compaction | No | Save important context |
| `Notification` | During alerts | No | Desktop notifications, logging |
| `PermissionRequest` | When permission needed | Yes | Custom permission handling |

### Exit Codes

| Code | Meaning | Behavior |
|------|---------|----------|
| `0` | Success | Continue normally |
| `2` | Block | Stop operation (PreToolUse only) |
| `1` or other | Error | Log error, continue |

## JSON Hook Configuration

### Settings-Based Hooks

Configure hooks in `.claude/settings.json` (project) or `~/.claude/settings.json` (global):

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "/path/to/validate-write.sh",
        "timeout": 5000
      }]
    }],
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "/path/to/format-file.sh"
      }]
    }],
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "prompt",
        "prompt": "Verify all requested changes were completed."
      }]
    }]
  }
}
```

### Plugin hooks.json

For PRPM packages, use `hook.json`:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/validate.sh",
        "timeout": 5000
      }]
    }]
  }
}
```

### Matcher Patterns

| Pattern | Matches |
|---------|---------|
| `"Write"` | Only Write tool |
| `"Write\|Edit"` | Write OR Edit tools |
| `"Bash"` | Only Bash tool |
| `"mcp__github__*"` | All GitHub MCP tools |
| `"*"` | All tools (use sparingly) |

### Hook Options

```json
{
  "type": "command",
  "command": "./my-hook.sh",
  "timeout": 5000,
  "once": true,
  "continue": true,
  "stopReason": "Message when blocked",
  "suppressOutput": false,
  "systemMessage": "Warning to show user"
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | number | 60000 | Max execution time in ms |
| `once` | boolean | false | Run only once per session |
| `continue` | boolean | true | Continue after hook completes |
| `stopReason` | string | - | Message when continue=false |
| `suppressOutput` | boolean | false | Hide stdout from transcript |
| `systemMessage` | string | - | Warning message to user |

## Command Hooks

Command hooks run external scripts. They're fast and deterministic.

### Shell Script Hook

```bash
#!/bin/bash
set -euo pipefail

# Read JSON input
INPUT=$(cat)
FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty')

# Validate
[[ -n "$FILE" ]] || exit 0
[[ -f "$FILE" ]] || exit 0

# Block sensitive files
case "$FILE" in
  *.env|*.pem|*.key)
    echo "Blocked: $FILE is sensitive" >&2
    exit 2
    ;;
esac

exit 0
```

### TypeScript Hook

```typescript
#!/usr/bin/env node
import { readFileSync } from 'fs';

const input = JSON.parse(readFileSync(0, 'utf-8'));
const filePath = input.input?.file_path;

if (!filePath) process.exit(0);

// Block .env files
if (filePath.endsWith('.env')) {
  console.error('Blocked: Cannot modify .env files');
  process.exit(2);
}

process.exit(0);
```

## Prompt Hooks

Prompt hooks use LLM reasoning for complex validation. Use sparingly - they take 2-10 seconds.

### Basic Prompt Hook

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "prompt",
        "prompt": "Check if the content being written contains hardcoded secrets, API keys, or credentials. If found, block the operation."
      }]
    }]
  }
}
```

### Prompt Hook with Schema Validation

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "prompt",
        "prompt": "Analyze the file content for security issues. Return your decision.",
        "schema": {
          "type": "object",
          "properties": {
            "decision": {
              "type": "string",
              "enum": ["allow", "block"]
            },
            "reason": {
              "type": "string"
            },
            "severity": {
              "type": "string",
              "enum": ["low", "medium", "high", "critical"]
            }
          },
          "required": ["decision"]
        }
      }]
    }]
  }
}
```

### When to Use Prompt Hooks

**Good use cases:**
- Security analysis that requires understanding code context
- Detecting logic errors or anti-patterns
- Validating architectural decisions
- Complex permission checks

**Avoid for:**
- Simple pattern matching (use command hooks)
- File extension checks
- Path validation
- Anything that can be done with regex

## File-Based Hooks (Legacy)

Simpler approach - place executables directly in hooks directory.

### File Location

**Project hooks:**
```
.claude/hooks/PreToolUse
.claude/hooks/PostToolUse
.claude/hooks/SessionStart
```

**User-global hooks:**
```
~/.claude/hooks/PreToolUse
~/.claude/hooks/Stop
```

### Requirements

Every file-based hook MUST:

1. **Have a shebang line:**
```bash
#!/bin/bash
#!/usr/bin/env node
#!/usr/bin/env python3
```

2. **Be executable:**
```bash
chmod +x .claude/hooks/PreToolUse
```

3. **Handle JSON input from stdin**

4. **Exit with appropriate code**

## JSON Input Structure

Hooks receive JSON via stdin:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "current_dir": "/path/to/project",
  "tool_name": "Write",
  "input": {
    "file_path": "/path/to/file.ts",
    "content": "file contents...",
    "command": "npm test",
    "old_string": "...",
    "new_string": "..."
  }
}
```

### Tool-Specific Input Fields

| Tool | Available Fields |
|------|------------------|
| Write | `file_path`, `content` |
| Edit | `file_path`, `old_string`, `new_string` |
| Read | `file_path` |
| Bash | `command` |
| Glob | `pattern`, `path` |
| Grep | `pattern`, `path` |

## Environment Variables

Available in hook execution:

| Variable | Description |
|----------|-------------|
| `CLAUDE_PROJECT_DIR` | Project root directory |
| `CLAUDE_CURRENT_DIR` | Current working directory |
| `CLAUDE_PLUGIN_ROOT` | Hook installation directory |
| `CLAUDE_ENV_FILE` | File for persisting variables |
| `SESSION_ID` | Current session identifier |

## Common Patterns

### Pattern 1: Format on Save

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/format.sh",
        "timeout": 5000
      }]
    }]
  }
}
```

### Pattern 2: Block Sensitive Files

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit|Read",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/block-sensitive.sh"
      }]
    }]
  }
}
```

### Pattern 3: Test Verification Before Stop

```json
{
  "hooks": {
    "Stop": [{
      "matcher": "*",
      "hooks": [{
        "type": "prompt",
        "prompt": "Before finishing, verify: 1) All tests pass 2) No linting errors 3) Types check. If any issues, list them."
      }]
    }]
  }
}
```

### Pattern 4: Session Context Loading

```json
{
  "hooks": {
    "SessionStart": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/load-context.sh",
        "once": true
      }]
    }]
  }
}
```

### Pattern 5: Multi-Stage Validation

Combine PreToolUse (validate) with PostToolUse (verify):

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "./validate-before.sh"
      }]
    }],
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "./verify-after.sh"
      }]
    }]
  }
}
```

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Not quoting variables | Breaks on spaces | Always use `"$VAR"` |
| Missing shebang | Won't execute | Add `#!/bin/bash` |
| Not executable | Permission denied | Run `chmod +x hook-file` |
| Logging to stdout | Clutters transcript | Use stderr: `echo "log" >&2` |
| Wrong exit code | Doesn't block when needed | Use `exit 2` to block |
| No input validation | Security risk | Always validate JSON fields |
| Slow operations | Blocks Claude | Run in background or use PostToolUse |
| Absolute paths missing | Can't find scripts | Use `${CLAUDE_PLUGIN_ROOT}` |
| Using `*` matcher | Runs on everything | Be specific: `Write\|Edit` |
| Prompt hooks everywhere | Slow experience | Use only for complex logic |

## Best Practices

### 1. Keep Hooks Fast

Target < 100ms for PreToolUse hooks:
- Cache results where possible
- Run heavy operations in background
- Use specific matchers, not wildcards

### 2. Handle Errors Gracefully

```bash
# Check dependencies exist
if ! command -v jq &> /dev/null; then
  echo "jq not installed, skipping" >&2
  exit 0
fi

# Validate input
FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty')
if [[ -z "$FILE" ]]; then
  echo "No file path provided" >&2
  exit 1
fi
```

### 3. Use Shebangs

Always start with shebang:
```bash
#!/bin/bash
#!/usr/bin/env node
#!/usr/bin/env python3
```

### 4. Secure Sensitive Files

```bash
BLOCKED=(".env" ".env.*" "*.pem" "*.key")
for pattern in "${BLOCKED[@]}"; do
  case "$FILE" in
    $pattern)
      echo "Blocked: $FILE is sensitive" >&2
      exit 2
      ;;
  esac
done
```

### 5. Quote All Variables

```bash
# WRONG - breaks on spaces
prettier --write $FILE

# RIGHT - handles spaces
prettier --write "$FILE"
```

### 6. Log for Debugging

```bash
LOG_FILE=~/.claude-hooks/debug.log

# Log to file
echo "[$(date)] Processing $FILE" >> "$LOG_FILE"

# Log to stderr (shows in transcript)
echo "Hook running..." >&2
```

## Publishing as PRPM Package

### Package Structure

```
my-hook/
├── prpm.json          # Package manifest
├── HOOK.md            # Hook documentation
└── hook-script.sh     # Hook executable
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

### HOOK.md Format

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

## Requirements

- bash 4.0+
- write access to `~/.claude/`

## Source Code

\`\`\`bash
#!/bin/bash
echo "Session started at $(date)" >> ~/.claude/session.log
echo "Environment ready"
exit 0
\`\`\`
```

### Publishing Process

```bash
# Test locally first
prpm test

# Publish to registry
prpm publish

# Version bumps
prpm publish patch  # 1.0.0 -> 1.0.1
prpm publish minor  # 1.0.0 -> 1.1.0
prpm publish major  # 1.0.0 -> 2.0.0
```

## Security Requirements

### Input Validation

```bash
# Parse JSON safely
INPUT=$(cat)
if ! FILE=$(echo "$INPUT" | jq -r '.input.file_path // empty' 2>&1); then
  echo "JSON parse failed" >&2
  exit 1
fi

# Validate field exists
[[ -n "$FILE" ]] || exit 1
```

### Path Sanitization

```bash
# Prevent directory traversal
if [[ "$FILE" == *".."* ]]; then
  echo "Path traversal detected" >&2
  exit 2
fi

# Keep in project directory
if [[ "$FILE" != "$CLAUDE_PROJECT_DIR"* ]]; then
  echo "File outside project" >&2
  exit 2
fi
```

### User Confirmation

Claude Code automatically:
- Requires confirmation before installing hooks
- Shows hook source code to user
- Warns about hook execution
- Displays hook output in transcript

## Hooks vs Skills vs Commands

| Feature | Hooks | Skills | Commands |
|---------|-------|--------|----------|
| **Format** | Executable code | Markdown | Markdown |
| **Trigger** | Automatic (events) | Automatic (context) | Manual (`/command`) |
| **Language** | Any executable | N/A | N/A |
| **Use Case** | Automation, validation | Reference, patterns | Quick tasks |
| **Security** | Requires confirmation | No special permissions | Inherits from session |

**Examples:**
- **Hook:** Auto-format files on save
- **Skill:** Reference guide for testing patterns
- **Command:** `/review-pr` quick code review

## Related Resources

- **claude-hook-writer skill** - Detailed hook development guidance
- **typescript-hook-writer skill** - TypeScript-specific hook development
- [Claude Code Docs](https://docs.claude.com/claude-code)
- [Schema](https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-hook.schema.json)

## Checklist for New Hooks

Before publishing:

- [ ] Shebang line included
- [ ] File is executable (`chmod +x`)
- [ ] Validates all stdin input
- [ ] Quotes all variables
- [ ] Handles missing dependencies gracefully
- [ ] Uses appropriate exit codes
- [ ] Logs errors to stderr or file
- [ ] Tests with edge cases (spaces, Unicode, missing fields)
- [ ] Documents dependencies in HOOK.md
- [ ] Includes installation instructions
- [ ] Source code included in documentation
- [ ] Clear description and tags in prpm.json
- [ ] Version number is semantic
