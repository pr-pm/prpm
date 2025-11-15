# Command Logger

Logs all bash commands Claude executes to a file for audit and debugging.

## What It Does

Records every bash command Claude runs with a timestamp to `~/.claude-commands.log`.

## How It Works

- **Event**: `PreToolUse` (before command execution)
- **Triggers On**: `Bash` tool only
- **Performance**: Fast (< 10ms)
- **Log Location**: `~/.claude-commands.log`

## Log Format

```
[2025-11-12 10:30:45] npm install express
[2025-11-12 10:31:02] git status
[2025-11-12 10:31:15] npm test
```

## Installation

```bash
prpm install @prpm/command-logger
```

## Viewing Logs

```bash
# View recent commands
tail -f ~/.claude-commands.log

# View last 20 commands
tail -20 ~/.claude-commands.log

# Search for specific commands
grep "npm" ~/.claude-commands.log
```

## Use Cases

- Audit trail of AI-executed commands
- Debugging command sequences
- Learning what commands Claude uses
- Security monitoring

## Uninstall

```bash
prpm uninstall @prpm/command-logger
```

## Privacy

Commands are logged locally to your machine. Log file is never uploaded or shared.
