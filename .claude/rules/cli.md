---
description: CLI package development patterns
paths:
  - "packages/cli/**/*.ts"
---

# CLI Package Rules

## Error Handling

ALWAYS use CLIError instead of `process.exit()`:

```typescript
import { CLIError, createError, createSuccess } from '../core/errors.js';

// Correct - enables testability
throw new CLIError('Package not found', 1);
throw createError('Invalid format');

// Wrong - breaks tests
process.exit(1);  // NO!
console.error('Error'); process.exit(1);  // NO!
```

## Exit Codes

- `0` - Success (use `createSuccess()`)
- `1` - General error (use `createError()`)
- Use appropriate exit codes for different error types

## Command Structure

Commands live in `src/commands/` and use Commander.js:

```typescript
import { Command } from 'commander';

export const myCommand = new Command('my-command')
  .description('Command description')
  .argument('<required>', 'Required argument')
  .option('-o, --optional <value>', 'Optional flag')
  .action(async (required, options) => {
    // Implementation
  });
```

## Output Formatting

Use chalk for colored output:

```typescript
import chalk from 'chalk';

console.log(chalk.green('Success:'), 'Package installed');
console.log(chalk.yellow('Warning:'), 'Deprecated package');
console.log(chalk.red('Error:'), 'Installation failed');
```

## Registry Client Usage

Always use the registry client from `@pr-pm/registry-client`:

```typescript
import { getRegistryClient } from '@pr-pm/registry-client';

const client = getRegistryClient();
const pkg = await client.getPackage(packageName);
```

## User Configuration

Access user config through the core module:

```typescript
import { getUserConfig, saveUserConfig } from '../core/user-config.js';

const config = await getUserConfig();
```

## Telemetry

Telemetry calls should be fire-and-forget:

```typescript
telemetry.track('command_executed', { command: 'install' }).catch(() => {});
```
