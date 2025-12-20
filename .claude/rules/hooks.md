---
description: Claude Code hooks development patterns
globs:
  - "packages/hooks/**/*.ts"
  - ".claude/hooks/**/*.ts"
  - ".claude/hooks/**/*.js"
---

# Hooks Package Rules

## Hook Structure

Each hook lives in its own directory with:
- `hook.ts` - Main hook implementation
- `hook-utils.ts` - Hook-specific utilities
- `types.ts` - Type definitions

## Hook Implementation Pattern

```typescript
#!/usr/bin/env tsx
import {
  readStdin,
  getFilePath,
  logError,
  exitHook,
  HookExitCode,
} from './hook-utils';

async function main() {
  // Read input from stdin (JSON)
  const input = readStdin();

  // Process the input
  const filePath = getFilePath(input);
  if (!filePath) {
    exitHook(HookExitCode.Success);
  }

  // Perform validation/checks
  if (shouldBlock) {
    logError(`Blocked: reason`);
    exitHook(HookExitCode.Block);
  }

  exitHook(HookExitCode.Success);
}

// Always catch errors and allow to proceed
main().catch(() => {
  exitHook(HookExitCode.Success);
});
```

## Exit Codes

Use the HookExitCode enum:

```typescript
enum HookExitCode {
  Success = 0,   // Allow operation to proceed
  Block = 2,     // Block the operation
}
```

## Error Handling

ALWAYS catch errors and exit with success to avoid blocking user operations due to hook bugs:

```typescript
main().catch(() => {
  exitHook(HookExitCode.Success);  // Don't block on errors
});
```

## Shared Utilities

Use shared utilities from `shared/`:
- `readStdin()` - Read JSON input from stdin
- `getFilePath(input)` - Extract file path from hook input
- `matchesPattern(path, patterns)` - Glob pattern matching
- `logError(message)` - Log to stderr (visible to user)
- `exitHook(code)` - Clean exit with code

## Building Hooks

Hooks are compiled with esbuild:
- Source: `hook.ts`
- Output: `hook.js` (bundled, executable)
- Build command: `npm run build` in packages/hooks

## Testing Hooks

```typescript
import { describe, it, expect } from 'vitest';
import { matchesPattern } from '../block-env-writes/hook-utils';

describe('matchesPattern', () => {
  it('matches .env files', () => {
    expect(matchesPattern('.env', ['.env', '.env.*']).matched).toBe(true);
  });
});
```
