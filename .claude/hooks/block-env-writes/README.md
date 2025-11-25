# Block Env Writes

Prevents Claude from writing to or editing sensitive files that may contain credentials or secrets.

## What It Does

Blocks write and edit operations on files that match sensitive patterns like `.env`, `.pem`, `.key`, and credential files.

## Protected Patterns

- `.env` and `.env.*` (environment files)
- `*.pem` (private keys)
- `*.key` (key files)
- `*credentials*` (credential files)
- `*secrets*` (secret files)
- `.git/*` (git internals)
- `.ssh/*` (SSH keys)
- `*.p12`, `*.pfx` (certificates)

## How It Works

- **Event**: `PreToolUse` (before write/edit)
- **Triggers On**: `Write` and `Edit` tools
- **Action**: Blocks the operation with exit code 2
- **Performance**: Fast (< 5ms)

## Example

```bash
# Claude attempts to edit .env
$ claude "Update the API key in .env"

⛔ Blocked: Cannot modify sensitive file '.env'
   Matches protected pattern: .env
   This file may contain credentials or secrets.
```

## Installation

```bash
prpm install @prpm/block-env-writes
```

## Use Cases

- Prevent accidental credential exposure
- Protect SSH keys from modification
- Guard environment configuration files
- Add safety layer for sensitive file operations

## Customization

To add custom patterns, fork this hook and add patterns to the `BLOCKED_PATTERNS` array.

## Uninstall

```bash
prpm uninstall @prpm/block-env-writes
```

## Security Note

This hook provides a defense-in-depth layer but should not be your only security measure. Always use proper access controls and never commit secrets to version control.
