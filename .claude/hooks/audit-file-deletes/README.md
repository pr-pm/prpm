# Audit File Deletes

Logs all file deletion operations Claude performs for security auditing and recovery.

## What It Does

Records every `rm` or `unlink` command Claude executes to an audit log with timestamps and context.

## How It Works

- **Event**: `PreToolUse` (before command execution)
- **Triggers On**: `Bash` commands containing `rm` or `unlink`
- **Log Location**: `~/.claude-deletions.log`
- **Performance**: Fast (< 5ms)

## Log Format

```
[2025-11-12 10:30:45] [DELETE] rm old-file.txt
  Working Directory: /Users/me/project

[2025-11-12 10:31:15] [DELETE] rm -rf temp/
  Working Directory: /Users/me/project
```

## Installation

```bash
prpm install @prpm/audit-file-deletes
```

## Viewing Audit Log

```bash
# View recent deletions
tail -f ~/.claude-deletions.log

# View last 20 deletions
tail -40 ~/.claude-deletions.log  # 2 lines per entry

# Search for specific files
grep "important-file" ~/.claude-deletions.log
```

## Use Cases

- Track what Claude deletes for accountability
- Audit trail for file operations
- Troubleshoot missing files
- Recover information about deleted files
- Security compliance and monitoring

## What Gets Logged

- Timestamp of deletion
- Full command executed
- Working directory context
- All deletion commands (`rm`, `unlink`, `rm -rf`, etc.)

## Privacy

Audit log is stored locally on your machine and never uploaded or shared.

## Uninstall

```bash
prpm uninstall @prpm/audit-file-deletes
```

## Note

This hook logs deletions but does NOT prevent them or create backups. For file protection, use `@prpm/block-env-writes` or similar hooks.
