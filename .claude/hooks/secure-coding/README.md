# Secure Coding Suite 🔒

Complete security policy for Claude Code with environment protection, credential validation, audit logging, and sensitive data scanning.

## What's Included

This collection installs 4 security hooks that work together to protect your codebase:

### 1. Block Env Writes (`@prpm/block-env-writes`)
Prevents Claude from modifying sensitive files that may contain credentials:
- `.env` and `.env.*` files
- Private keys (`.pem`, `.key`)
- Credential files
- Git and SSH directories

### 2. Validate Credentials (`@prpm/validate-credentials`)
Warns when hardcoded credentials are detected in code:
- API keys and secrets
- Passwords
- Access tokens
- AWS keys

### 3. Audit File Deletes (`@prpm/audit-file-deletes`)
Logs all file deletion operations with timestamps and context:
- Audit trail for compliance
- Troubleshooting deleted files
- Security monitoring

### 4. Sensitive Data Scanner (`@prpm/sensitive-data-scanner`)
Scans for sensitive data patterns before writing files:
- AWS Access Keys
- Private key blocks
- JWT tokens
- Long API keys
- Emails in sensitive contexts

## Installation

```bash
prpm install @prpm/secure-coding
```

This installs all 4 hooks in one command.

## What You Get

**File Protection:**
- Blocks writes to `.env`, `.pem`, `.key`, credential files
- Prevents accidental modification of git internals

**Credential Detection:**
- Warns about hardcoded passwords, API keys, tokens
- Detects AWS keys, JWTs, private keys
- Catches long suspicious strings

**Audit Trail:**
- Logs every file deletion Claude makes
- Timestamp and directory context
- Stored in `~/.claude-deletions.log`

**Multi-Layer Defense:**
- PreToolUse hooks block or warn before operations
- PostToolUse hooks validate after operations
- Complementary security checks

## Use Cases

- **Startups**: Prevent credential leaks before they become expensive
- **Teams**: Enforce security standards automatically
- **Compliance**: Meet audit logging requirements
- **Learning**: Teach secure coding practices
- **Personal Projects**: Extra safety layer for solo developers

## Example Workflow

```bash
# Install the suite
$ prpm install @prpm/secure-coding

# Claude attempts to modify .env
⛔ Blocked: Cannot modify sensitive file '.env'

# Claude writes code with hardcoded key
⚠️  Warning: Potential hardcoded credential detected in src/config.ts

# Claude deletes a file
[Logged to ~/.claude-deletions.log]
[2025-11-12 10:30:45] [DELETE] rm old-config.json
  Working Directory: /Users/me/project

# Claude writes code with AWS key
⚠️  Warning: Potential AWS Access Key detected in src/aws.ts
```

## Individual Hooks

You can also install hooks individually:

```bash
prpm install @prpm/block-env-writes
prpm install @prpm/validate-credentials
prpm install @prpm/audit-file-deletes
prpm install @prpm/sensitive-data-scanner
```

## Logs and Audit Files

The suite creates these log files:
- `~/.claude-deletions.log` - File deletion audit trail

All logs are stored locally and never uploaded.

## Uninstall

```bash
# Uninstall the entire collection
prpm uninstall @prpm/secure-coding

# Or uninstall individual hooks
prpm uninstall @prpm/block-env-writes
prpm uninstall @prpm/validate-credentials
prpm uninstall @prpm/audit-file-deletes
prpm uninstall @prpm/sensitive-data-scanner
```

## Limitations

These hooks provide defense-in-depth but are not foolproof:
- **Not a replacement** for proper secret management
- **May have false positives** (example code, test fixtures)
- **May miss** obfuscated or complex patterns
- **Only scans new code** - doesn't scan existing files

## Best Practices

1. **Use environment variables** for all secrets
2. **Never commit** `.env` files (add to `.gitignore`)
3. **Use secret managers** (AWS Secrets Manager, HashiCorp Vault)
4. **Enable git hooks** for pre-commit scanning (e.g., `git-secrets`)
5. **Review warnings** carefully before committing code
6. **Rotate exposed credentials** immediately

## Security is a Process

This suite provides automated guardrails, but security requires vigilance:
- Review Claude's changes before committing
- Use code review for sensitive changes
- Enable branch protection on important branches
- Run security scanners in CI/CD
- Keep dependencies updated

## Support

Questions or issues? [Open an issue](https://github.com/pr-pm/prpm/issues) or join our [Discord](https://discord.gg/prpm).

## License

MIT - See individual hook packages for details.
