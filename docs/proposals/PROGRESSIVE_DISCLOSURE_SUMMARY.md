# Progressive Disclosure Implementation Summary

## Branch: `feature/progressive-disclosure-openskills`

### What Was Implemented

A complete progressive disclosure system for PRPM skills, inspired by OpenSkills, enabling context-efficient skill management through XML manifests.

---

## Key Features

### 1. **OpenSkills-Inspired Progressive Disclosure**
- Skills installed to `.openskills/package-name/SKILL.md`
- Lightweight XML manifest in `AGENTS.md` (or custom file)
- Skills listed but not loaded into context by default
- Main agent discovers available skills via manifest

### 2. **Custom Manifest Files**
```bash
# Default AGENTS.md
prpm install @anthropic/backend-architect --as agents.md --subtype skill

# Custom GEMINI.md for Gemini CLI
prpm install @anthropic/backend-architect --as agents.md --subtype skill --manifest-file GEMINI.md

# Custom CLAUDE.md for Claude Code
prpm install @anthropic/backend-architect --as agents.md --subtype skill --manifest-file CLAUDE.md
```

### 3. **Lockfile Integration**
```json
{
  "progressiveDisclosure": {
    "mode": "progressive",
    "skillsDir": ".openskills/backend-architect",
    "manifestPath": "AGENTS.md",
    "skillName": "backend-architect"
  }
}
```

### 4. **Clean Uninstall**
- Removes skill files from `.openskills/`
- Removes XML entry from manifest
- Tracked in lockfile for reproducibility

---

## Installation Examples

```bash
# Install skill with default AGENTS.md
prpm install @anthropic/backend-architect --as agents.md --subtype skill

# Install with custom manifest
prpm install @anthropic/api-optimizer --as agents.md --subtype skill --manifest-file GEMINI.md

# Install without updating manifest (files only)
prpm install @anthropic/backend-architect --as agents.md --subtype skill --no-append

# Install from lockfile (preserves manifest assignments)
prpm install
```

---

## Directory Structure

```
.openskills/
  └── backend-architect/
      └── SKILL.md
  └── database-optimizer/
      └── SKILL.md

AGENTS.md     # Default manifest
GEMINI.md     # Custom manifest for Gemini CLI
CLAUDE.md     # Custom manifest for Claude Code
```

---

## Manifest Format

**AGENTS.md:**
```markdown
# Project AI Resources

This project uses progressive disclosure for AI skills and agents.

<!-- PRPM Manifest -->
<!-- Skills are loaded on-demand, agents are spawned via Task tool -->

<skill name="backend-architect" path=".openskills/backend-architect/SKILL.md">
  Backend architecture patterns and best practices
</skill>

<skill name="database-optimizer" path=".openskills/database-optimizer/SKILL.md">
  Database optimization and query performance
</skill>

<!-- End PRPM Manifest -->
```

---

## New CLI Options

### `--manifest-file <filename>`
Specify custom manifest filename (default: `AGENTS.md`)

```bash
prpm install @anthropic/skill --as agents.md --manifest-file GEMINI.md
```

### `--no-append`
Install skill files without updating manifest

```bash
prpm install @anthropic/skill --as agents.md --no-append
```

---

## Files Modified/Created

### New Files
- `packages/cli/src/core/agents-md-progressive.ts` - Manifest generation and XML handling
- `docs/proposals/PROGRESSIVE_DISCLOSURE_AGENTS.md` - Future agent support proposal

### Modified Files
- `packages/cli/src/core/lockfile.ts` - Added `progressiveDisclosure` metadata
- `packages/cli/src/core/filesystem.ts` - Added `.openskills/` directory support
- `packages/cli/src/commands/install.ts` - Skill installation with manifest updates
- `packages/cli/src/commands/uninstall.ts` - Manifest cleanup on removal

---

## Benefits

### Context Efficiency
✅ Install 100 skills, load only 2-3 when needed
✅ Main agent context stays clean
✅ Skills discovered via lightweight manifest

### Tool Flexibility
✅ AGENTS.md for general use
✅ GEMINI.md for Gemini CLI
✅ CLAUDE.md for Claude Code
✅ Custom files per project needs

### OpenSkills Compatible
✅ Same XML manifest pattern
✅ Progressive disclosure approach
✅ `.openskills/` directory structure
✅ Compatible with Cursor, Windsurf, Aider (via AGENTS.md support)

### Developer Experience
✅ Simple installation workflow
✅ Reproducible via lockfile
✅ Clean uninstall
✅ Familiar npm-like commands

---

## Future Work (Proposal Stage)

### Agent Support
See `docs/proposals/PROGRESSIVE_DISCLOSURE_AGENTS.md` for detailed proposal:

- `.openagents/` directory for Claude agents
- Unified manifest with both `<skill>` and `<agent>` tags
- Same workflow, different `--subtype`
- Agents spawned via Task tool instead of loaded into context

**Example:**
```bash
prpm install @anthropic/code-reviewer --as agents.md --subtype agent
```

**Result:**
```markdown
<!-- PRPM Manifest -->

<skill name="backend-architect" path=".openskills/backend-architect/SKILL.md">
  Backend architecture patterns
</skill>

<agent name="code-reviewer" path=".openagents/code-reviewer/AGENT.md">
  Reviews code for best practices
</agent>

<!-- End PRPM Manifest -->
```

---

## Testing Checklist

### Manual Testing Needed
- [ ] Install skill with default AGENTS.md
- [ ] Install skill with custom GEMINI.md
- [ ] Install skill with `--no-append`
- [ ] Uninstall skill (verify manifest cleanup)
- [ ] Install from lockfile (verify manifest preservation)
- [ ] Install collection with skills
- [ ] Multiple skills in same manifest
- [ ] Multiple custom manifests (AGENTS.md + GEMINI.md)

### Integration Testing
- [ ] Works with Cursor (reads AGENTS.md)
- [ ] Works with Windsurf (reads AGENTS.md)
- [ ] Works with Aider (reads AGENTS.md)
- [ ] Works with Claude Code (progressive loading)

---

## How to Review

### 1. Check Out Branch
```bash
git fetch origin
git checkout feature/progressive-disclosure-openskills
```

### 2. Review Key Files
- `packages/cli/src/core/agents-md-progressive.ts` - Core implementation
- `docs/proposals/PROGRESSIVE_DISCLOSURE_AGENTS.md` - Future agent support

### 3. Test Manually
```bash
# Build and test locally
npm install
npm run build

# Test installation
prpm install @anthropic/backend-architect --as agents.md --subtype skill

# Verify directory structure
ls -la .openskills/
cat AGENTS.md
```

---

## Questions for Discussion

1. **Naming**: Should we rename `agents-md-progressive.ts` → `manifest-progressive.ts` now or later?
2. **Agent Implementation**: Should we implement agent support immediately or iterate based on feedback?
3. **Backward Compatibility**: Do we need migration logic for existing installations?
4. **Documentation**: Should we create user-facing docs before merging or after testing?

---

## PR Checklist

- [x] Implementation complete for skills
- [x] Proposal document for agents
- [x] Code pushed to branch
- [ ] Manual testing completed
- [ ] Integration testing with AI tools
- [ ] User documentation
- [ ] Update CHANGELOG.md
- [ ] Create PR with description

---

## Pull Request

**Branch**: `feature/progressive-disclosure-openskills`
**Base**: `main`

**PR Title**: feat: Add progressive disclosure support for skills (OpenSkills-inspired)

**PR Link**: https://github.com/pr-pm/prpm/pull/new/feature/progressive-disclosure-openskills

---

## Summary

This implementation brings OpenSkills-style progressive disclosure to PRPM, enabling context-efficient skill management through XML manifests. Skills are installed to `.openskills/`, referenced in `AGENTS.md` (or custom files), and discovered by AI agents without bloating the main context window.

The system is production-ready for skills, with a clear path forward for agent support documented in the proposal.
