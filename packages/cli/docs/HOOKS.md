# PRPM Git Hooks

> ⚠️ **ALPHA FEATURE**: Git hooks are currently in early development. Core commands work, but agent execution is not yet implemented.

Run AI agents on your code changes before committing. Catch issues early with intelligent, context-aware code review at commit time.

## Quick Start

```bash
# 1. Setup hooks in your repo
cd your-project/
prpm hooks install

# 2. Install review agents
prpm install @pre-commit/security-scanner
prpm install @pre-commit/docs-checker

# 3. Configure which agents run (edit .prpm/hooks.json)
# 4. Commit as usual - agents run automatically!
git add .
git commit -m "your changes"
```

## Commands

### `prpm hooks install`
Install PRPM git hooks in your repository.

```bash
prpm hooks install
```

This will:
- Create `.prpm/hooks.json` configuration file
- Install pre-commit hook script in `.git/hooks/`
- Show next steps

### `prpm hooks uninstall`
Remove PRPM git hooks from your repository.

```bash
prpm hooks uninstall
```

### `prpm hooks status`
Show status of installed hooks and configuration.

```bash
prpm hooks status
```

Output:
```
📋 PRPM Hooks Status

✓ Git hooks: Installed
✓ Configuration: .prpm/hooks.json
  Enabled: yes

  Configured hooks:
    - pre-commit: enabled, 2 agent(s)
```

### `prpm hooks run <hook-type>`
Run agents for a specific hook type (used internally by git).

```bash
prpm hooks run pre-commit
```

## Configuration

### `.prpm/hooks.json`

```json
{
  "hooks": {
    "pre-commit": {
      "enabled": true,
      "agents": [
        {
          "name": "@pre-commit/security-scanner",
          "files": "**/*.{js,ts,py}",
          "severity": "error",
          "autoFix": false
        },
        {
          "name": "@pre-commit/docs-checker",
          "files": "**/*.md",
          "severity": "warning",
          "autoFix": false
        }
      ]
    }
  },
  "settings": {
    "enabled": true,
    "timeout": 30000,
    "cache": {
      "enabled": true,
      "ttl": 3600
    }
  }
}
```

### Agent Configuration

Each agent has the following options:

- **name** (required): Package name of the agent
- **files**: Glob pattern to match files (default: `**/*`)
- **severity**: `error` (blocks commit) | `warning` (shows but allows) | `info` (informational)
- **autoFix**: Automatically apply fixes (default: false, not yet implemented)
- **enabled**: Enable/disable this agent (default: true)

### Global Settings

- **enabled**: Master toggle for all hooks
- **timeout**: Timeout in milliseconds for agent execution
- **cache.enabled**: Enable caching of agent responses
- **cache.ttl**: Cache time-to-live in seconds

### API Key

Set your Anthropic API key (required for agent execution):

```bash
# Option 1: Environment variable (recommended)
export ANTHROPIC_API_KEY=your-api-key

# Option 2: In configuration (not recommended for shared repos)
# Add to .prpm/hooks.json:
{
  "settings": {
    "anthropicApiKey": "your-api-key"
  }
}
```

## Examples

### Security Scanner

```json
{
  "name": "@pre-commit/security-scanner",
  "files": "**/*.{js,ts,py,go}",
  "severity": "error",
  "autoFix": false
}
```

Scans code for:
- Hardcoded secrets (API keys, passwords)
- SQL injection vulnerabilities
- XSS vulnerabilities
- Insecure dependencies

### Documentation Checker

```json
{
  "name": "@pre-commit/docs-checker",
  "files": "**/*.{ts,tsx}",
  "severity": "warning",
  "autoFix": false
}
```

Checks for:
- Missing JSDoc comments on public functions
- Outdated documentation
- Broken internal links

### Linter

```json
{
  "name": "@pre-commit/linter",
  "files": "**/*.{js,ts}",
  "severity": "warning",
  "autoFix": true
}
```

Enforces:
- Code style consistency
- Best practices
- Naming conventions

## How It Works

```
┌─────────────────┐
│  git commit     │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│  .git/hooks/        │
│  pre-commit script  │
└────────┬────────────┘
         │
         ▼
┌──────────────────────────┐
│  prpm hooks run          │
│  pre-commit              │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Read .prpm/hooks.json   │
│  Get staged files        │
│  Filter by glob patterns │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  For each agent:         │
│  - Load package          │
│  - Execute via API       │
│  - Parse results         │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Display results         │
│  Exit 0 (allow) or       │
│  Exit 1 (block)          │
└──────────────────────────┘
```

## Bypassing Hooks

If you need to commit without running hooks (not recommended):

```bash
git commit --no-verify
```

## Troubleshooting

### Hooks not running

```bash
# Check status
prpm hooks status

# Reinstall if needed
prpm hooks uninstall
prpm hooks install
```

### Agent not found

```bash
# Install the agent
prpm install @pre-commit/security-scanner

# Verify installation
prpm list
```

### API errors

```bash
# Verify API key is set
echo $ANTHROPIC_API_KEY

# Or set it:
export ANTHROPIC_API_KEY=your-api-key
```

## Limitations (Current Alpha)

- ⚠️ **Agent execution not implemented** - Hooks install/configure but don't run agents yet
- ⚠️ **No Anthropic SDK integration** - Coming in next version
- ⚠️ **No caching** - Will be slow on large changesets (once implemented)
- ⚠️ **Limited file types** - Best for text files
- ⚠️ **No auto-fix** - Manual fixes only for now

## Roadmap

- [ ] **v0.2** - Anthropic SDK integration, basic agent execution
- [ ] **v0.3** - Response caching, improved output formatting
- [ ] **v0.4** - Auto-fix support, parallel execution
- [ ] **v1.0** - Stable release with full feature set

## FAQ

**Q: How much does it cost?**
A: You pay for Anthropic API usage with your own API key. Typical cost: ~$0.01-0.05 per commit depending on changeset size.

**Q: Can I use other AI providers?**
A: Currently Anthropic/Claude only. More providers planned for v2.0.

**Q: Does it work with pre-push hooks?**
A: Not yet, but planned for v0.4.

**Q: Can agents modify files?**
A: Auto-fix support is planned but not yet implemented.

**Q: Will this slow down my commits?**
A: Depends on changeset size and API latency. Caching (coming soon) will help.

## Creating Custom Agents

See [Agent Development Guide](./AGENT_DEVELOPMENT.md) (coming soon) for how to create your own pre-commit agents.

Example agent structure:
```
@myorg/custom-checker/
  prpm.json          # Package manifest
  agent.md           # Agent instructions
  README.md          # Documentation
```

---

**Need help?** [Open an issue](https://github.com/pr-pm/prpm/issues) or [join discussions](https://github.com/pr-pm/prpm/discussions)
