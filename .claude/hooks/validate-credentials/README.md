# Validate Credentials

Warns when Claude attempts to write code that may contain hardcoded credentials or secrets.

## What It Does

Scans code for patterns that suggest hardcoded credentials (API keys, passwords, tokens) and warns you before the file is written.

## Detected Patterns

- `password = "..."`
- `api_key = "..."`
- `secret = "..."`
- `token = "..."`
- `AWS_SECRET_ACCESS_KEY`
- `PRIVATE_KEY`

## How It Works

- **Event**: `PreToolUse` (before write/edit)
- **Triggers On**: `Write` and `Edit` tools
- **Action**: Warns (doesn't block) when patterns detected
- **Performance**: Fast pattern matching (< 10ms)

## Example

```bash
⚠️  Warning: Potential hardcoded credential detected in src/config.ts
   Pattern matched: api_key\s*=\s*["'][^"']+["']
   Consider using environment variables instead.
```

## Installation

```bash
prpm install @prpm/validate-credentials
```

## Use Cases

- Prevent accidental credential commits
- Enforce environment variable usage
- Security code review automation
- Education about secure coding practices

## Best Practices

When this hook triggers, consider:
1. Using environment variables (`process.env.API_KEY`)
2. Using a secrets management service
3. Using configuration files excluded from git (`.env` with `.gitignore`)
4. Using a secret scanning service in CI/CD

## Limitations

This hook uses pattern matching and may produce:
- **False positives**: Detecting example code or test fixtures
- **False negatives**: Missing obfuscated or complex patterns

It's a helpful safety net, not a replacement for proper secret management.

## Uninstall

```bash
prpm uninstall @prpm/validate-credentials
```
