# Cursor Hooks Format Specification

**File Location:** Project root `hooks.json`
**Format:** JSON configuration file
**Official Docs:** https://cursor.com/docs/agent/hooks

## Overview

Cursor Hooks allow you to configure executable scripts that run at specific points in the Cursor agent loop. These hooks can be used for auditing shell commands, formatting code after edits, scanning for PII/secrets, and implementing custom security policies.

## File Structure

The `hooks.json` file is a simple JSON object mapping hook types to script paths:

```json
{
  "beforeShellExecution": "./scripts/audit-shell.sh",
  "afterFileEdit": "./scripts/format-code.js",
  "beforeSubmitPrompt": "./scripts/check-pii.py"
}
```

## Hook Types

### Agent Hooks (Cmd+K/Agent Chat)

- **`beforeShellExecution`**: Runs before shell commands are executed
  - Use case: Audit and gate risky shell commands

- **`afterShellExecution`**: Runs after shell commands complete
  - Use case: Validate output, log command results

- **`beforeMCPExecution`**: Runs before MCP tool calls
  - Use case: Validate MCP tool usage, enforce security policies

- **`afterMCPExecution`**: Runs after MCP tool calls complete
  - Use case: Log MCP tool results, validate outputs

- **`beforeReadFile`**: Runs before files are read by the agent
  - Use case: Filter sensitive files, validate file access permissions

- **`afterFileEdit`**: Runs after files are edited by the agent
  - Use case: Auto-format code, run linters, validate changes

- **`beforeSubmitPrompt`**: Runs before user prompts are submitted
  - Use case: Scan for PII, secrets, or sensitive data

- **`stop`**: Runs when the agent loop stops
  - Use case: Cleanup, logging, final validation

- **`afterAgentResponse`**: Runs after agent generates a response
  - Use case: Post-process responses, log agent output

- **`afterAgentThought`**: Runs after agent internal thoughts
  - Use case: Monitor agent reasoning, debug decision-making

### Tab Hooks (Inline Completions)

- **`beforeTabFileRead`**: Runs before tab reads file content
  - Use case: Filter sensitive content from context

- **`afterTabFileEdit`**: Runs after tab edits a file
  - Use case: Auto-format inline completions

## Script Requirements

Hook scripts must:
1. Be executable (`chmod +x script.sh`)
2. Read JSON input from stdin
3. Return JSON output to stdout
4. Exit with status code 0 for success (non-zero blocks the operation)

### Input Format

Scripts receive JSON on stdin with fields like:
- `conversation_id`: Unique conversation identifier
- `generation_id`: Unique generation identifier
- `model`: Model being used
- `cursor_version`: Cursor version
- `workspace_roots`: Array of workspace paths
- `user_email`: User's email (if signed in)

Hook-specific fields will vary by hook type.

### Output Format

Scripts should output JSON to stdout. For blocking hooks (like `beforeShellExecution`), return:
```json
{
  "allow": true,
  "message": "Optional message to user"
}
```

## Distribution

Cursor hooks can be distributed via:
- **Version control**: Commit `hooks.json` to your repository
- **PRPM**: Package and share via the PRPM registry
- **MDM tools**: Deploy enterprise-wide policies
- **Cloud distribution**: Enterprise Cursor accounts (upcoming)

## Best Practices

1. **Keep hooks fast**: Hooks run synchronously and block the agent loop
2. **Use exit codes**: Exit 0 to allow, non-zero to block
3. **Log appropriately**: Write logs to files, not stdout (reserved for JSON)
4. **Handle errors gracefully**: Don't crash on unexpected input
5. **Test thoroughly**: Test with various inputs and edge cases

## Conversion Notes

### From Cursor Hooks to Canonical

The converter:
- Parses the `hooks.json` file
- Maps each hook type to a `CursorHookSection` in canonical format
- Preserves script paths and hook configurations

### From Canonical to Cursor Hooks

The converter:
- Extracts all `CursorHookSection` entries
- Generates a `hooks.json` object
- Maps script paths to their respective hook types

## Limitations

- Hooks must be written as executable scripts (bash, python, javascript, etc.)
- No built-in support for inline JavaScript/TypeScript (use separate files)
- Hooks run synchronously and can slow down the agent if not optimized
- No official way to share hook scripts between projects (use PRPM!)

## Examples

### Example 1: Audit Shell Commands

**hooks.json:**
```json
{
  "beforeShellExecution": "./scripts/audit-shell.sh"
}
```

**scripts/audit-shell.sh:**
```bash
#!/bin/bash
# Read JSON from stdin
input=$(cat)

# Parse command from JSON (requires jq)
command=$(echo "$input" | jq -r '.command')

# Block dangerous commands
if [[ "$command" =~ rm\ -rf\ / ]]; then
  echo '{"allow": false, "message": "Blocked dangerous rm command"}'
  exit 1
fi

# Allow all other commands
echo '{"allow": true}'
exit 0
```

### Example 2: Auto-format After Edits

**hooks.json:**
```json
{
  "afterFileEdit": "./scripts/format-code.js"
}
```

**scripts/format-code.js:**
```javascript
#!/usr/bin/env node
const { execSync } = require('child_process');
const input = require('fs').readFileSync(0, 'utf-8');
const data = JSON.parse(input);

// Run prettier on edited file
try {
  execSync(`prettier --write "${data.filePath}"`);
  console.log(JSON.stringify({ success: true }));
} catch (error) {
  console.log(JSON.stringify({ success: false, error: error.message }));
}
```

### Example 3: PII Scanner

**hooks.json:**
```json
{
  "beforeSubmitPrompt": "./scripts/check-pii.py"
}
```

**scripts/check-pii.py:**
```python
#!/usr/bin/env python3
import sys
import json
import re

# Read input
input_data = json.load(sys.stdin)
prompt = input_data.get('prompt', '')

# Check for common PII patterns
pii_patterns = [
    r'\b\d{3}-\d{2}-\d{4}\b',  # SSN
    r'\b\d{16}\b',              # Credit card
]

for pattern in pii_patterns:
    if re.search(pattern, prompt):
        print(json.dumps({
            "allow": False,
            "message": "Potential PII detected. Please remove sensitive data."
        }))
        sys.exit(1)

# No PII detected
print(json.dumps({"allow": True}))
sys.exit(0)
```

## Related Documentation

- [Official Cursor Hooks Docs](https://cursor.com/docs/agent/hooks)
- [PRPM Format Guide](../../docs/formats.mdx)
- [Cursor Rules Format](./cursor.md)

## Changelog

- **2025-01**: Initial cursor-hooks format support added to PRPM
