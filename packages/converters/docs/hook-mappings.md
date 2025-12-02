# Cross-Format Hook Mappings

## Overview

Different AI editors use different hook events based on their architecture and lifecycle. This document provides semantic mappings between hook formats to enable cross-format hook conversion.

## Hook Mapping Strategy

When converting hooks between formats, we use **semantic equivalence** where possible:

1. **Direct mapping**: Hook events with identical semantics
2. **Best-effort mapping**: Hook events with similar semantics (lossy)
3. **No mapping**: Hook events with no equivalent (user warned)

## Format Comparison Matrix

| Lifecycle Event | Claude | Cursor | Kiro | Notes |
|----------------|--------|--------|------|-------|
| **Session Start** | `session-start` | - | `agentSpawn` | Cursor has no session start hook |
| **Prompt Submission** | `user-prompt-submit` | `beforeSubmitPrompt` | `userPromptSubmit` | Direct semantic match |
| **Tool/MCP Before** | `tool-call` | `beforeMCPExecution` | `preToolUse` | Semantic match for tool usage |
| **Tool/MCP After** | - | `afterMCPExecution` | `postToolUse` | Claude lacks post-tool hook |
| **Shell Before** | - | `beforeShellExecution` | - | Cursor-specific |
| **Shell After** | - | `afterShellExecution` | - | Cursor-specific |
| **File Read Before** | - | `beforeReadFile` | - | Cursor-specific |
| **File Edit After** | - | `afterFileEdit` | - | Cursor-specific |
| **Agent Response** | `assistant-response` | `afterAgentResponse` | - | Direct semantic match |
| **Agent Thought** | - | `afterAgentThought` | - | Cursor-specific (internal reasoning) |
| **Session Stop** | - | `stop` | `stop` | Direct match |
| **Tab File Read** | - | `beforeTabFileRead` | - | Cursor tab-specific |
| **Tab File Edit** | - | `afterTabFileEdit` | - | Cursor tab-specific |

## Mapping Definitions

### Claude → Cursor

```typescript
{
  'session-start': null,                    // No equivalent (lossy)
  'user-prompt-submit': 'beforeSubmitPrompt', // Direct match
  'tool-call': 'beforeMCPExecution',         // Semantic match
  'assistant-response': 'afterAgentResponse' // Direct match
}
```

**Quality Score Impact:**
- Direct matches: No penalty
- Semantic matches: -5 per hook
- No mapping: -30 per hook

### Cursor → Claude

```typescript
{
  'beforeShellExecution': null,           // No equivalent (lossy)
  'afterShellExecution': null,            // No equivalent (lossy)
  'beforeMCPExecution': 'tool-call',      // Semantic match
  'afterMCPExecution': null,              // No equivalent (lossy)
  'beforeReadFile': null,                 // No equivalent (lossy)
  'afterFileEdit': null,                  // No equivalent (lossy)
  'beforeSubmitPrompt': 'user-prompt-submit', // Direct match
  'stop': null,                           // No equivalent (lossy)
  'afterAgentResponse': 'assistant-response', // Direct match
  'afterAgentThought': null,              // No equivalent (lossy)
  'beforeTabFileRead': null,              // Tab-specific (lossy)
  'afterTabFileEdit': null                // Tab-specific (lossy)
}
```

### Kiro → Cursor

```typescript
{
  'agentSpawn': null,                     // No equivalent (lossy)
  'userPromptSubmit': 'beforeSubmitPrompt', // Direct match
  'preToolUse': 'beforeMCPExecution',       // Semantic match
  'postToolUse': 'afterMCPExecution',       // Semantic match
  'stop': 'stop'                            // Direct match
}
```

### Cursor → Kiro

```typescript
{
  'beforeShellExecution': null,           // No equivalent (lossy)
  'afterShellExecution': null,            // No equivalent (lossy)
  'beforeMCPExecution': 'preToolUse',     // Semantic match
  'afterMCPExecution': 'postToolUse',     // Semantic match
  'beforeReadFile': null,                 // No equivalent (lossy)
  'afterFileEdit': null,                  // No equivalent (lossy)
  'beforeSubmitPrompt': 'userPromptSubmit', // Direct match
  'stop': 'stop',                         // Direct match
  'afterAgentResponse': null,             // No equivalent (lossy)
  'afterAgentThought': null,              // No equivalent (lossy)
  'beforeTabFileRead': null,              // Tab-specific (lossy)
  'afterTabFileEdit': null                // Tab-specific (lossy)
}
```

### Claude → Kiro

```typescript
{
  'session-start': 'agentSpawn',          // Semantic match
  'user-prompt-submit': 'userPromptSubmit', // Direct match
  'tool-call': 'preToolUse',              // Semantic match
  'assistant-response': null              // No equivalent (lossy)
}
```

### Kiro → Claude

```typescript
{
  'agentSpawn': 'session-start',          // Semantic match
  'userPromptSubmit': 'user-prompt-submit', // Direct match
  'preToolUse': 'tool-call',              // Semantic match
  'postToolUse': null,                    // No equivalent (lossy)
  'stop': null                            // No equivalent (lossy)
}
```

## User Control Options

### CLI Flags

**`--hook-mapping <strategy>`**

Strategies:
- `auto` (default): Use best semantic matches, warn on lossy conversions
- `strict`: Only convert direct matches, fail on semantic/no matches
- `manual`: Interactive prompt for each hook mapping
- `skip`: Don't convert hooks at all (preserve original format metadata)

**Examples:**

```bash
# Auto mapping with warnings
prpm convert claude-hook.md --as cursor-hooks --hook-mapping auto

# Strict - only direct matches
prpm convert kiro-hooks.json --as cursor-hooks --hook-mapping strict

# Manual - choose each mapping interactively
prpm install khaliqgant/claude-security-hooks --as cursor-hooks --hook-mapping manual

# Skip hook conversion entirely
prpm install user/kiro-hooks --as cursor-hooks --hook-mapping skip
```

### Interactive Mapping Prompt

When using `--hook-mapping manual`:

```
Converting Claude hooks to Cursor hooks...

Found Claude hook: "session-start" (./scripts/init.sh)
  Description: Initialize security audit logging

No direct Cursor equivalent found. Choose mapping:
  1. Skip this hook (recommended - no semantic match)
  2. Map to beforeShellExecution (user chooses alternative)
  3. Map to beforeSubmitPrompt (user chooses alternative)
  4. Preserve as metadata only

Your choice [1]: _
```

## Mapping Quality Indicators

Each conversion provides a quality score:

- **100**: Perfect conversion (all direct matches)
- **90-99**: Excellent (minor semantic differences)
- **70-89**: Good (some semantic mappings)
- **50-69**: Fair (significant lossy conversions)
- **0-49**: Poor (many incompatible hooks)

## Best Practices

1. **Use native format when possible**: Avoid cross-format conversion if the original format works in your editor
2. **Review warnings**: Always check conversion warnings for lossy mappings
3. **Test converted hooks**: Verify hook behavior in the target editor
4. **Preserve originals**: Keep source format packages for reference
5. **Document mappings**: Add comments explaining your mapping choices

## Implementation Details

### Conversion Flow

1. Parse source format hooks
2. Identify hook events and scripts
3. Look up mapping for each hook
4. Apply mapping strategy (auto/strict/manual)
5. Generate warnings for lossy conversions
6. Calculate quality score
7. Preserve unmapped hooks in metadata (optional)

### Script Path Handling

Hook scripts are preserved during conversion:
- **Path-based**: Script paths are copied as-is
- **Embedded code**: For formats supporting embedded code (Claude), code is written to files
- **Format-specific**: Script extensions adjusted if needed (.sh, .js, .py)

## Future Enhancements

- **Automated script translation**: Convert bash scripts to JavaScript/Python based on target format preferences
- **Hook bundling**: Combine multiple source hooks into single target hook
- **Community mappings**: Allow users to share custom mapping configurations
- **Format-agnostic hooks**: Define hooks in canonical format, auto-generate for all formats

## Related Documentation

- [Cursor Hooks Format](./cursor-hooks.md)
- [Claude Hooks Format](./claude.md)
- [Kiro Hooks Format](./kiro.md)
- [Conversion API](../src/services/conversion.ts)
