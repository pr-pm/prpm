# Progressive Disclosure for Agents - Proposal

## Overview

Extend PRPM's progressive disclosure system to support Claude agents alongside skills, using a unified manifest approach inspired by OpenSkills.

## Current State (Implemented)

### Skills Progressive Disclosure
- ✅ Skills installed to `.openskills/package-name/SKILL.md`
- ✅ XML manifest entries in `AGENTS.md` (or custom via `--manifest-file`)
- ✅ Tracked in lockfile with `progressiveDisclosure` metadata
- ✅ Clean uninstall removes both files and manifest entries
- ✅ Context-efficient: skills listed but not loaded until needed

### Example Current Implementation
```bash
prpm install @anthropic/backend-architect --as agents.md --subtype skill
```

**Directory Structure:**
```
.openskills/
  └── backend-architect/
      └── SKILL.md
AGENTS.md
```

**AGENTS.md:**
```markdown
<!-- PRPM Manifest -->
<!-- Skills are loaded on-demand, agents are spawned via Task tool -->

<skill name="backend-architect" path=".openskills/backend-architect/SKILL.md">
  Backend architecture patterns and best practices
</skill>

<!-- End PRPM Manifest -->
```

## Proposed: Add Agent Support

### Goals
1. Use same unified manifest approach for agents
2. Separate directory structure (`.openagents/` vs `.openskills/`)
3. Different XML tags (`<agent>` vs `<skill>`) to distinguish resource types
4. Same installation workflow with `--subtype` flag
5. Support custom manifest files (AGENTS.md, GEMINI.md, CLAUDE.md, etc.)

---

## Detailed Specification

### 1. Directory Structure

```
.openskills/                    # Skills (loaded into main context)
  └── backend-architect/
      └── SKILL.md
  └── database-optimizer/
      └── SKILL.md

.openagents/                    # Agents (spawned via Task tool)
  └── code-reviewer/
      └── AGENT.md
  └── test-writer/
      └── AGENT.md
  └── documentation-writer/
      └── AGENT.md

AGENTS.md                       # Unified manifest (both skills + agents)
```

### 2. Unified Manifest Format

**AGENTS.md (Single Source of Truth):**
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

<agent name="code-reviewer" path=".openagents/code-reviewer/AGENT.md">
  Reviews code for best practices, security, and performance
</agent>

<agent name="test-writer" path=".openagents/test-writer/AGENT.md">
  Writes comprehensive unit and integration tests
</agent>

<agent name="documentation-writer" path=".openagents/documentation-writer/AGENT.md">
  Creates technical documentation from code and requirements
</agent>

<!-- End PRPM Manifest -->
```

### 3. XML Schema

#### Skills
```xml
<skill name="skill-name" path=".openskills/skill-name/SKILL.md">
  Brief description for progressive disclosure (loaded into main context)
</skill>
```

#### Agents
```xml
<agent name="agent-name" path=".openagents/agent-name/AGENT.md">
  Brief description for agent discovery (spawned via Task tool)
</agent>
```

**Key Differences:**
- **Tag name**: `<skill>` vs `<agent>`
- **Path prefix**: `.openskills/` vs `.openagents/`
- **Main file**: `SKILL.md` vs `AGENT.md`
- **Usage**: Skills are context, agents are sub-processes

### 4. Installation Examples

```bash
# Install skill (to .openskills/)
prpm install @anthropic/backend-architect --as agents.md --subtype skill

# Install agent (to .openagents/)
prpm install @anthropic/code-reviewer --as agents.md --subtype agent

# Use custom manifest file
prpm install @anthropic/code-reviewer --as agents.md --subtype agent --manifest-file GEMINI.md

# Install without updating manifest
prpm install @anthropic/code-reviewer --as agents.md --subtype agent --no-append
```

### 5. Lockfile Format

```json
{
  "packages": {
    "@anthropic/backend-architect": {
      "version": "1.0.0",
      "format": "agents.md",
      "subtype": "skill",
      "installedPath": ".openskills/backend-architect/SKILL.md",
      "progressiveDisclosure": {
        "mode": "progressive",
        "resourceDir": ".openskills/backend-architect",
        "manifestPath": "AGENTS.md",
        "resourceName": "backend-architect",
        "resourceType": "skill"
      }
    },
    "@anthropic/code-reviewer": {
      "version": "1.0.0",
      "format": "agents.md",
      "subtype": "agent",
      "installedPath": ".openagents/code-reviewer/AGENT.md",
      "progressiveDisclosure": {
        "mode": "progressive",
        "resourceDir": ".openagents/code-reviewer",
        "manifestPath": "AGENTS.md",
        "resourceName": "code-reviewer",
        "resourceType": "agent"
      }
    }
  }
}
```

**Lockfile Changes:**
- Rename `skillsDir` → `resourceDir` (generic for both)
- Rename `skillName` → `resourceName` (generic for both)
- Add `resourceType: 'skill' | 'agent'` field

### 6. User Workflows

#### Installing a Collection with Both Skills and Agents

```bash
prpm install collections/fullstack-pro --as agents.md
```

**Result:**
```
.openskills/
  └── backend-architect/SKILL.md
  └── database-optimizer/SKILL.md
  └── api-designer/SKILL.md

.openagents/
  └── code-reviewer/AGENT.md
  └── test-writer/AGENT.md
  └── security-auditor/AGENT.md

AGENTS.md  # Contains 3 <skill> + 3 <agent> entries
```

#### Using Custom Manifest Files for Different Tools

```bash
# Gemini-specific skills and agents
prpm install @gemini/api-optimizer --as agents.md --subtype skill --manifest-file GEMINI.md
prpm install @gemini/doc-generator --as agents.md --subtype agent --manifest-file GEMINI.md

# Claude-specific skills and agents
prpm install @anthropic/backend-architect --as agents.md --subtype skill --manifest-file CLAUDE.md
prpm install @anthropic/code-reviewer --as agents.md --subtype agent --manifest-file CLAUDE.md
```

**Result:**
```
.openskills/
  └── api-optimizer/SKILL.md
  └── backend-architect/SKILL.md

.openagents/
  └── doc-generator/AGENT.md
  └── code-reviewer/AGENT.md

GEMINI.md   # Contains api-optimizer skill + doc-generator agent
CLAUDE.md   # Contains backend-architect skill + code-reviewer agent
```

### 7. How Agents Discover and Use Resources

#### Main Claude Agent's Perspective

When Claude Code starts, it reads `AGENTS.md`:

1. **Sees skill entries** → Knows skills are available for progressive loading
2. **Sees agent entries** → Knows which sub-agents can be spawned
3. **Doesn't load full definitions** → Context stays clean

#### When to Load Skills

```markdown
User: "Design a microservices architecture for our payment system"

Claude sees: <skill name="backend-architect" path=".openskills/backend-architect/SKILL.md">
Claude loads: .openskills/backend-architect/SKILL.md into context
Claude applies: Backend architecture patterns from skill
```

#### When to Spawn Agents

```markdown
User: "Review my authentication code for security issues"

Claude sees: <agent name="security-auditor" path=".openagents/security-auditor/AGENT.md">
Claude spawns: New Task with security-auditor agent
Sub-agent loads: .openagents/security-auditor/AGENT.md in its own context
Sub-agent returns: Security review findings
```

### 8. Implementation Checklist

#### Phase 1: Core Infrastructure (Already Complete ✅)
- [x] `.openskills/` directory support
- [x] `AGENTS.md` manifest generation
- [x] Custom manifest files via `--manifest-file`
- [x] Lockfile `progressiveDisclosure` metadata
- [x] Uninstall manifest cleanup
- [x] Rename to "PRPM Manifest"

#### Phase 2: Agent Support (Proposed)
- [ ] Add `.openagents/` directory support in `filesystem.ts`
- [ ] Create `ManifestEntry` interface with `resourceType: 'skill' | 'agent'`
- [ ] Add `generateAgentXML()` function
- [ ] Update manifest parsing to handle both `<skill>` and `<agent>` tags
- [ ] Update lockfile to use `resourceType` and `resourceDir`
- [ ] Update install logic to detect agent vs skill based on `subtype`
- [ ] Update uninstall to handle both resource types
- [ ] Add tests for agent installation/uninstall

#### Phase 3: Developer Experience
- [ ] `prpm list --skills` - Show installed skills
- [ ] `prpm list --agents` - Show installed agents
- [ ] `prpm list --manifest` - Show what's in AGENTS.md
- [ ] Update docs with agent examples
- [ ] Create sample collections with mixed skills/agents

### 9. Benefits

#### For Users
✅ **Unified Discovery** - One file shows all AI resources
✅ **Context Efficiency** - Neither skills nor agents bloat main context
✅ **Flexible Organization** - Mix and match per project needs
✅ **Tool-Specific Manifests** - GEMINI.md for Gemini, CLAUDE.md for Claude
✅ **Consistent UX** - Same commands, just different `--subtype`

#### For PRPM Ecosystem
✅ **OpenSkills Compatible** - Matches their pattern for progressive disclosure
✅ **Extensible** - Easy to add more resource types (tools, workflows, etc.)
✅ **Cross-Platform** - Works with any tool supporting AGENTS.md
✅ **Future-Proof** - Standard-based approach vs proprietary formats

### 10. Open Questions

1. **Naming**: Should we rename `agents-md-progressive.ts` → `manifest-progressive.ts`?
2. **Backward Compatibility**: How to handle existing `.openskills/` installations when agents are added?
3. **Collection Defaults**: Should collections specify which packages are skills vs agents in metadata?
4. **Multi-file Agents**: Do agents support multi-file packages like Claude skills do?
5. **Agent Discovery**: Do we need a `prpm activate` command, or just rely on manifest for discovery?

### 11. Example Use Cases

#### Use Case 1: Full-Stack Development Team
```bash
# Install shared skills for all developers
prpm install @team/backend-patterns --as agents.md --subtype skill
prpm install @team/frontend-patterns --as agents.md --subtype skill

# Install code quality agents
prpm install @team/code-reviewer --as agents.md --subtype agent
prpm install @team/test-writer --as agents.md --subtype agent
```

**Team workflow:**
- All devs get same skills loaded progressively
- Agents invoked when needed for reviews/tests
- Single AGENTS.md checked into repo

#### Use Case 2: AI Tool-Specific Setup
```bash
# Gemini setup
prpm install @gemini/optimizer --as agents.md --manifest-file GEMINI.md --subtype skill
prpm install @gemini/analyzer --as agents.md --manifest-file GEMINI.md --subtype agent

# Claude setup
prpm install @anthropic/architect --as agents.md --manifest-file CLAUDE.md --subtype skill
prpm install @anthropic/reviewer --as agents.md --manifest-file CLAUDE.md --subtype agent
```

**Result:**
- Gemini CLI reads GEMINI.md
- Claude Code reads CLAUDE.md
- Each tool gets relevant resources

#### Use Case 3: Large Collections
```bash
prpm install collections/enterprise-toolkit --as agents.md
```

**Contents:**
- 20 skills (patterns, best practices, frameworks)
- 10 agents (reviewers, generators, analyzers)
- All in one manifest
- Progressive disclosure keeps context clean

---

## Conclusion

This proposal extends PRPM's existing progressive disclosure system to support agents alongside skills using a unified manifest approach. The implementation is straightforward, consistent with the current design, and provides significant value for managing AI resources across different tools and workflows.

**Status**: Ready for implementation pending approval.
