# Sensitive Data Scanner

Scans code for sensitive data patterns like API keys, private keys, and tokens before files are written.

## What It Does

Detects common patterns of sensitive data in code and warns you before the file is saved, helping prevent accidental exposure of secrets.

## Detected Patterns

- **AWS Access Keys**: `AKIA[0-9A-Z]{16}`
- **Private Keys**: `BEGIN.*PRIVATE KEY` blocks
- **JWT Tokens**: `eyJ...` format tokens
- **API Keys**: Long alphanumeric strings (32+ chars)
- **Email in Sensitive Context**: Emails near password/secret/key keywords

## How It Works

- **Event**: `PreToolUse` (before write/edit)
- **Triggers On**: `Write` and `Edit` tools
- **Action**: Warns when patterns detected (doesn't block)
- **Performance**: Fast regex scanning (< 15ms)

## Example Warning

```bash
⚠️  Warning: Potential AWS Access Key detected in src/config.ts
⚠️  Warning: Long alphanumeric string detected (possible API key) in src/config.ts
   Review the content before committing to version control.
```

## Installation

```bash
prpm install @prpm/sensitive-data-scanner
```

## Use Cases

- Prevent credential leaks before they happen
- Security code review automation
- Compliance with data protection policies
- Educational tool for secure coding practices
- Multi-layer defense against secret exposure

## What This Hook Does NOT Do

- **Does not block operations** - Only warns
- **Does not guarantee** all sensitive data is caught
- **May produce false positives** - Long strings aren't always keys
- **Does not scan existing files** - Only new writes/edits

## Best Practices When Triggered

1. Move secrets to environment variables
2. Use secret management services (AWS Secrets Manager, HashiCorp Vault)
3. Add patterns to `.gitignore`
4. Use git hooks for pre-commit scanning
5. Review code carefully before committing

## Complementary Hooks

Combine with other security hooks for defense-in-depth:
- `@prpm/block-env-writes` - Blocks writes to sensitive files
- `@prpm/validate-credentials` - Detects hardcoded credentials
- `@prpm/audit-file-deletes` - Tracks file deletions

Or install them all:
```bash
prpm install @prpm/secure-coding
```

## Uninstall

```bash
prpm uninstall @prpm/sensitive-data-scanner
```

## Privacy

All scanning happens locally. No data is uploaded or shared.
