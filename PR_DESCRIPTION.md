# Pre-Commit Hooks - Initial Implementation (Alpha)

## Summary

Implements the foundation for running PRPM agents as git pre-commit hooks. This PR establishes the architecture, commands, and configuration system. **Agent execution is NOT yet implemented** - this is a POC/alpha release to validate the approach.

## What's Included ✅

### Core Commands
- `prpm hooks install` - Install git hooks in repository
- `prpm hooks uninstall` - Remove git hooks
- `prpm hooks status` - Show hook installation status
- `prpm hooks run <hook-type>` - Execute hooks (called by git)

### Configuration System
- JSON Schema for hook configuration (`schemas/hooks.json`)
- Auto-generated `.prpm/hooks.json` with template
- Support for multiple hook types (pre-commit, pre-push, commit-msg)
- Agent configuration: file patterns, severity levels, auto-fix flags
- Global settings: API key, timeout, caching

### Git Integration
- Auto-generated pre-commit hook script
- Proper exit codes to block/allow commits
- Detection of PRPM vs. non-PRPM hooks

### Documentation
- User guide: `packages/cli/docs/HOOKS.md`
- Implementation checklist: `packages/cli/docs/PRE_COMMIT_HOOKS_CHECKLIST.md`
- Ideas document: `IDEAS.md` with full concept exploration

## What's NOT Implemented ⏳

See [PRE_COMMIT_HOOKS_CHECKLIST.md](packages/cli/docs/PRE_COMMIT_HOOKS_CHECKLIST.md) for full details:

- ❌ Agent execution logic (placeholder only)
- ❌ Anthropic SDK integration
- ❌ File glob matching and filtering
- ❌ Staged file detection (`git diff --cached`)
- ❌ Response caching
- ❌ Auto-fix functionality
- ❌ Unit/integration tests
- ❌ Error handling for API failures
- ❌ Performance optimizations

Currently, `prpm hooks run pre-commit` just prints what *would* be executed.

## Testing

### Manual Testing
```bash
# Build CLI
cd packages/cli
npm run build

# Test commands
cd /tmp && mkdir test-hooks && cd test-hooks
git init

# Install hooks
prpm hooks install
# → Should create .prpm/hooks.json and .git/hooks/pre-commit

# Check status
prpm hooks status
# → Should show installed hooks

# Test hook execution
prpm hooks run pre-commit
# → Shows placeholder output (no actual agent execution)

# Uninstall
prpm hooks uninstall
# → Should remove .git/hooks/pre-commit
```

### Expected Behavior
- Commands run without errors
- Configuration files created correctly
- Git hook script has proper permissions (executable)
- Status command shows accurate state

## Architecture

### File Structure
```
packages/cli/
├── src/commands/hooks.ts        # Main implementation
├── schemas/hooks.json            # JSON schema
├── docs/
│   ├── HOOKS.md                  # User documentation
│   └── PRE_COMMIT_HOOKS_CHECKLIST.md

.prpm/
└── hooks.json                    # User configuration (auto-generated)

.git/hooks/
└── pre-commit                    # Generated hook script
```

### Execution Flow (When Complete)
```
git commit
  ↓
.git/hooks/pre-commit
  ↓
prpm hooks run pre-commit
  ↓
Read .prpm/hooks.json
  ↓
Get staged files (git diff --cached)
  ↓
Filter by glob patterns
  ↓
For each agent:
  - Load agent package
  - Execute via Anthropic SDK
  - Parse results
  ↓
Display results + exit 0/1
```

## Configuration Example

`.prpm/hooks.json`:
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
        }
      ]
    }
  },
  "settings": {
    "anthropicApiKey": null,
    "enabled": true,
    "timeout": 30000,
    "cache": {
      "enabled": true,
      "ttl": 3600
    }
  }
}
```

## Next Steps (Follow-up PRs)

### v0.2.0 - Agent Execution
- Add @anthropic-ai/sdk dependency
- Implement agent loading from installed packages
- Implement file filtering (staged files + glob matching)
- Execute agents via Anthropic API
- Parse and display results
- **Estimate**: 2-3 days

### v0.3.0 - Polish & Testing
- Add response caching
- Improve terminal output (colors, formatting, progress)
- Add comprehensive tests
- Better error handling
- **Estimate**: 2-3 days

### v1.0.0 - Stable Release
- Performance optimizations
- Example agents published to registry
- Complete documentation
- E2E testing in real projects
- **Estimate**: 1-2 weeks

## Related

- **Original Idea**: `IDEAS.md` - AI-Powered Code Review Agents
- **Alternative Approach**: Pre-commit hooks (less competitive than GitHub PR review)
- **Inspiration**: CodeRabbit, Husky, pre-commit framework

## Breaking Changes

None - this is a new feature.

## Checklist

- [x] Commands implemented and working
- [x] Configuration schema defined
- [x] Git hook scripts generated correctly
- [x] Documentation written
- [x] Builds successfully (`npm run build`)
- [ ] Tests written (deferred to v0.2)
- [x] Checklist document created
- [x] User guide created

## Notes for Reviewers

**This is intentionally incomplete.** The goal is to:
1. ✅ Validate the UX (commands, configuration)
2. ✅ Establish the architecture
3. ✅ Get feedback before implementing agent execution

**Key Questions:**
1. Is the configuration schema intuitive?
2. Is the command structure (install/uninstall/run/status) clear?
3. Should we support other hook types in v1 (pre-push, commit-msg)?
4. API key in config vs. env var only?

## Demo Output

```bash
$ prpm hooks install
✓ Created hooks configuration at .prpm/hooks.json
✓ Git hooks installed successfully

Installed hooks:
  - pre-commit → /path/to/.git/hooks/pre-commit

Configuration: .prpm/hooks.json

Run prpm hooks uninstall to remove hooks.

$ prpm hooks status
📋 PRPM Hooks Status

✓ Git hooks: Installed
✓ Configuration: .prpm/hooks.json
  Enabled: yes

  Configured hooks:
    - pre-commit: enabled, 1 agent(s)
```

---

**Ready for review!** Comments and suggestions welcome before proceeding with agent execution implementation.
