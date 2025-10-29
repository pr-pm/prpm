# Pre-Commit Hooks Implementation Checklist

This document tracks the implementation status of the pre-commit hooks feature for PRPM.

## ✅ Completed

### Core Infrastructure
- [x] **Configuration Schema** - Created `schemas/hooks.json` with full JSON schema
  - Hook types: pre-commit, pre-push, commit-msg
  - Agent configuration with file patterns, severity levels
  - Global settings (API key, timeout, caching)

- [x] **CLI Commands** - Implemented `commands/hooks.ts`
  - [x] `prpm hooks install` - Install git hooks
  - [x] `prpm hooks uninstall` - Remove git hooks
  - [x] `prpm hooks run <hook-type>` - Execute hooks (called by git)
  - [x] `prpm hooks status` - Show hook installation status

- [x] **Git Hook Script** - Auto-generated pre-commit hook script
  - Calls `prpm hooks run pre-commit`
  - Properly exits with error code to block commits

- [x] **Configuration File** - Auto-generates `.prpm/hooks.json` template
  - Example security scanner agent configured
  - Sensible defaults for all settings

## ⏳ In Progress / TODO

### Agent Execution Engine
- [ ] **Load Installed Agents**
  - Read agent packages from installed location
  - Parse agent instructions/rules
  - Validate agent format compatibility

- [ ] **File Filtering**
  - Get staged files via `git diff --cached --name-only`
  - Match files against glob patterns (using minimatch or similar)
  - Group files by agent configuration
  - Handle file encoding and reading

- [ ] **Anthropic SDK Integration**
  - Install @anthropic-ai/sdk dependency
  - Create agent execution context with file contents
  - Format prompts with agent instructions + file context
  - Handle API key from config or environment variable
  - Implement timeout handling
  - Handle rate limiting and retries

- [ ] **Result Processing**
  - Parse agent responses
  - Extract issues/suggestions from agent output
  - Categorize by severity (error/warning/info)
  - Map issues to file locations (line numbers if possible)

- [ ] **Auto-fix Implementation** (optional for v1)
  - Apply agent-suggested fixes
  - Re-stage modified files
  - Provide dry-run mode

### User Experience
- [ ] **Terminal Output**
  - Colorized, formatted output using chalk
  - Progress indicators for long-running checks
  - File-by-file issue reporting
  - Summary of total issues found
  - Clear error messages
  - Helpful hints for resolution

- [ ] **Performance Optimization**
  - Response caching (hash files + agent → cache result)
  - Parallel agent execution where possible
  - Smart file chunking for large diffs
  - Skip unchanged files (use git status)

- [ ] **Error Handling**
  - Graceful failures (network issues, API errors)
  - Clear error messages for missing API keys
  - Handle missing/uninstalled agents
  - Timeout handling with clear messages

### Testing
- [ ] **Unit Tests**
  - Test hooks command functions
  - Test configuration parsing/validation
  - Test file pattern matching
  - Mock git commands
  - Mock Anthropic API calls

- [ ] **Integration Tests**
  - Test full flow in a test git repository
  - Test agent execution end-to-end
  - Test error scenarios
  - Test different severity levels blocking/allowing commits

- [ ] **E2E Tests**
  - Test in real project with real agents
  - Test performance with large changesets
  - Test caching behavior

### Documentation
- [ ] **User Documentation**
  - Getting started guide
  - Configuration reference
  - Agent creation guide for hooks
  - Troubleshooting guide
  - Performance tuning tips

- [ ] **Example Agents**
  - Create @pre-commit/security-scanner
  - Create @pre-commit/docs-checker
  - Create @pre-commit/linter
  - Publish to registry

- [ ] **README Updates**
  - Add hooks section to main CLI README
  - Add examples and use cases
  - Add screenshots/GIFs of output

## 📋 Technical Decisions Needed

### 1. Agent Package Format
**Question**: How should pre-commit agents be structured differently from regular agents?

**Options**:
- A) Use existing agent format, but add special context about files
- B) Create new subtype: `pre-commit`
- C) Use metadata field to indicate hook compatibility

**Recommendation**: Option A - reuse existing agents, add file context to prompt

### 2. Caching Strategy
**Question**: How to cache agent responses?

**Options**:
- A) Hash file content + agent name → cache result
- B) Use git object hashes for files
- C) No caching for v1 (add later)

**Recommendation**: Option C for v1, implement A in v1.1

### 3. API Key Management
**Question**: Where should users store Anthropic API keys?

**Options**:
- A) `.prpm/hooks.json` (local config)
- B) Environment variable only (ANTHROPIC_API_KEY)
- C) Both (config takes precedence)

**Recommendation**: Option C - both supported, env var recommended

### 4. Severity Enforcement
**Question**: How strictly should severity levels block commits?

**Current**:
- `error` - blocks commit (exit 1)
- `warning` - shows but allows commit (exit 0)
- `info` - shows informational messages

**Consideration**: Allow override with --no-verify flag (git default)

## 🚀 Release Plan

### v0.1.0-alpha (Initial PR)
- ✅ Core commands (install/uninstall/status/run)
- ✅ Configuration schema
- ✅ Git hook script generation
- ⏳ Basic agent execution (stub/placeholder)
- 📄 Documentation of what's NOT implemented

### v0.2.0-alpha (Follow-up PR)
- ⏳ Anthropic SDK integration
- ⏳ File filtering and glob matching
- ⏳ Basic terminal output
- ⏳ Unit tests

### v0.3.0-beta (Feature Complete)
- ⏳ Full agent execution
- ⏳ Caching
- ⏳ Integration tests
- ⏳ Example agents
- ⏳ Complete documentation

### v1.0.0 (Stable Release)
- ⏳ All features working
- ⏳ E2E tests passing
- ⏳ Performance optimized
- ⏳ Published example agents

## 📝 Notes

### Dependencies to Add
```json
{
  "@anthropic-ai/sdk": "^0.31.0",
  "minimatch": "^9.0.3"  // for glob pattern matching
}
```

### Example Hook Flow
```
1. User commits → git pre-commit hook runs
2. Hook calls: prpm hooks run pre-commit
3. PRPM reads .prpm/hooks.json
4. Gets staged files: git diff --cached --name-only
5. Filters files by agent glob patterns
6. For each enabled agent:
   - Load agent package
   - Prepare prompt with file context
   - Call Anthropic API
   - Parse response
   - Collect issues
7. Display results to terminal
8. Exit 0 (allow commit) or 1 (block commit)
```

### File Structure
```
.prpm/
  hooks.json          # Configuration
  .hooks-cache/       # Cached agent responses (future)

.git/hooks/
  pre-commit          # Generated script (calls prpm)

packages/cli/src/
  commands/hooks.ts   # Main commands
  core/hooks/         # Future: agent execution logic
    executor.ts
    file-matcher.ts
    cache.ts
```

## 🐛 Known Issues / Limitations

1. **No agent execution yet** - Placeholder in `handleRun()` function
2. **No Anthropic SDK integration** - Need to add dependency and implement
3. **No file filtering** - Need to implement glob matching
4. **No caching** - Will be slow on large changesets
5. **Limited error handling** - Need graceful failures
6. **No tests** - Need comprehensive test coverage

## 💡 Future Enhancements (v2.0+)

- **Pre-push hooks** - Run agents before pushing
- **Commit-msg hooks** - Validate commit messages
- **Post-commit hooks** - Track metrics after commits
- **Parallel execution** - Run multiple agents concurrently
- **Agent marketplace** - Browse pre-commit specific agents
- **Team sharing** - Share hook configurations across team
- **CI integration** - Run same agents in CI/CD pipelines
- **Auto-fix mode** - Automatically apply suggestions
- **Interactive mode** - Ask user to approve/reject each issue

---

**Last Updated**: 2025-01-29
**Status**: Initial implementation complete, agent execution pending
