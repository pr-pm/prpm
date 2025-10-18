# Cursor Rules - New Format (.cursor/rules/*.mdc)

## ⚠️ Important: .cursorrules is Deprecated!

The old `.cursorrules` format is **deprecated**. Cursor now uses:

**New Format:** `.cursor/rules/*.mdc`
- Markdown files with YAML frontmatter
- Located in `.cursor/rules/` directory
- Multiple rule files that can reference each other

## New Format Structure

```
project/
  └── .cursor/
      └── rules/
          ├── tdd.mdc
          ├── code-review.mdc
          ├── debugging.mdc
          └── style-guide.mdc
```

### File Format (.mdc)

```markdown
---
ruleType: always | conditional | contextual
alwaysApply: true | false
description: Brief description of the rule
source: optional-source
---

# Rule Title

Rule content in markdown format...

## Sections

Can include any markdown sections, code blocks, etc.
```

---

## Converted Claude Skills (20)

All 20 Claude Code Skills have been converted to the new Cursor rules format:

### Files Created

**Location:** `.cursor/rules/*.mdc`

1. **brainstorming.mdc** - Ideation and exploration methodology
2. **condition-based-waiting.mdc** - Wait for specific conditions
3. **defense-in-depth.mdc** - Security-first development
4. **dispatching-parallel-agents.mdc** - Parallel task orchestration
5. **executing-plans.mdc** - Systematic plan execution
6. **finishing-a-development-branch.mdc** - Branch completion workflow
7. **receiving-code-review.mdc** - Feedback integration process
8. **requesting-code-review.mdc** - Review request preparation
9. **root-cause-tracing.mdc** - Deep debugging methodology
10. **sharing-skills.mdc** - Skill documentation patterns
11. **subagent-driven-development.mdc** - Task decomposition patterns
12. **systematic-debugging.mdc** - Structured debugging approach
13. **test-driven-development.mdc** - TDD methodology (always apply)
14. **testing-anti-patterns.mdc** - What to avoid in testing
15. **testing-skills-with-subagents.mdc** - Skill quality validation
16. **using-git-worktrees.mdc** - Git worktree workflows
17. **using-superpowers.mdc** - Claude Code superpowers guide
18. **verification-before-completion.mdc** - Quality gates (always apply)
19. **writing-plans.mdc** - Plan creation methodology
20. **writing-skills.mdc** - Skill authoring guide

---

## Rule Types

### `ruleType: always`
Applied to all files and contexts automatically.

**Examples:**
- `test-driven-development.mdc`
- `verification-before-completion.mdc`
- `defense-in-depth.mdc`

### `ruleType: conditional`
Applied based on specific triggers or contexts.

**Examples:**
- `requesting-code-review.mdc` (when creating PRs)
- `receiving-code-review.mdc` (when responding to reviews)
- `brainstorming.mdc` (when planning)

### `ruleType: contextual`
Applied based on file type, directory, or other context.

**Examples:**
- `using-git-worktrees.mdc` (git operations)
- `dispatching-parallel-agents.mdc` (task orchestration)

---

## How Rules Reference Each Other

### In Frontmatter (Future)
```yaml
---
ruleType: always
alwaysApply: true
dependencies:
  - verification-before-completion
  - systematic-debugging
---
```

### In Content
```markdown
## Integration

This rule works best when combined with:
- `.cursor/rules/verification-before-completion.mdc`
- `.cursor/rules/systematic-debugging.mdc`
```

### By File Organization
```
.cursor/rules/
  ├── core/                    # Always-apply foundational rules
  │   ├── tdd.mdc
  │   └── verification.mdc
  ├── workflows/               # Conditional workflow rules
  │   ├── code-review.mdc
  │   └── branching.mdc
  └── project-specific.mdc     # Custom rules
```

---

## Installation with PRPM

### Install Individual Rule
```bash
prpm install cursor-rule-test-driven-development
# Installs to: .cursor/rules/test-driven-development.mdc
```

### Install Collection
```bash
prpm install cursor-development-workflow
# Installs 6 rules:
#   - test-driven-development.mdc
#   - systematic-debugging.mdc
#   - requesting-code-review.mdc
#   - receiving-code-review.mdc
#   - using-git-worktrees.mdc
#   - verification-before-completion.mdc
```

---

## Example: test-driven-development.mdc

```markdown
---
ruleType: always
alwaysApply: true
description: Use when implementing any feature or bugfix, before writing implementation code - write the test first, watch it fail, write minimal code to pass
source: claude-code-skill
skill: test-driven-development
---

# Test Driven Development

Write the test first. Watch it fail. Write minimal code to pass.

## Overview

This cursor rule is based on the Claude Code "Test Driven Development" skill.

**When to apply:** When implementing any feature or bug fix

## Methodology

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

## Workflow

1. Write a failing test
2. Run the test and verify it fails for the right reason
3. Write minimal code to make the test pass
4. Run the test and verify it passes
5. Refactor if needed
6. Repeat

## Integration

This rule works best when combined with:
- `.cursor/rules/verification-before-completion.mdc`
- `.cursor/rules/systematic-debugging.mdc`

[... full content ...]
```

---

## Collections with New Format

### New Collections Created

1. **cursor-development-workflow** (6 rules)
   - TDD, debugging, code review, git practices
   - Install path: `.cursor/rules/`

2. **cursor-planning-execution** (5 rules)
   - Planning, execution, orchestration workflows
   - Install path: `.cursor/rules/`

---

## Migration from Old Format

### Old (Deprecated)
```
project/
  └── .cursorrules
```

### New (Current)
```
project/
  └── .cursor/
      └── rules/
          ├── rule1.mdc
          ├── rule2.mdc
          └── rule3.mdc
```

### Conversion Script

```bash
node /tmp/convert-skills-to-cursor-new-format.mjs
```

**Output:**
- Creates `.cursor/rules/` directory
- Generates 20 `.mdc` files
- Creates `converted-cursor-rules-new.json` package metadata

---

## Package Metadata Format

```json
{
  "name": "cursor-rule-test-driven-development",
  "description": "Cursor rule: TDD methodology...",
  "content": "[full .mdc content]",
  "type": "cursor",
  "format": "cursor-mdc",
  "installPath": ".cursor/rules/test-driven-development.mdc",
  "originalSkill": "claude-skill-test-driven-development",
  "tags": ["cursor", "cursor-rule", "tdd", "testing"]
}
```

---

## Benefits of New Format

### vs Old .cursorrules
✅ Multiple rule files (not one monolith)
✅ Better organization by concern
✅ Easier to share and reuse
✅ Structured metadata (YAML frontmatter)
✅ Rule type system (always/conditional/contextual)

### vs Claude Skills
✅ Works in Cursor IDE
✅ Can reference other rules
✅ Organized file structure
✅ Same methodology, different format

---

## Files Generated

- `.cursor/rules/*.mdc` - 20 rule files in new format
- `converted-cursor-rules-new.json` - Package metadata
- `convert-skills-to-cursor-new-format.mjs` - Conversion script
- Updated `scraped-collections.json` - Collections with new format

---

## Summary

**✅ All 20 Claude Skills converted to new Cursor .mdc format**
- Format: `.cursor/rules/*.mdc` (not deprecated `.cursorrules`)
- Structure: Markdown with YAML frontmatter
- Organization: Multiple files in `.cursor/rules/` directory
- References: Rules can reference each other
- Collections: 2 new collections created for Cursor rule workflows

**Total Cursor packages: 202**
- 182 original Cursor rules (from PatrickJS/awesome-cursorrules)
- 20 converted Claude Skills (new .mdc format)
