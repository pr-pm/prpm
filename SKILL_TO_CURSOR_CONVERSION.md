# Converting Claude Skills to Cursor Rules

## Answer: Yes, Skills Can Be Converted!

There are multiple approaches to convert Claude Skills to Cursor Rules, including creating modular rules that reference each other.

---

## Conversion Approaches

### 1. Direct Conversion (Simple)
Convert the skill's methodology directly into a `.cursorrules` file.

**Pros:**
- Simple one-to-one mapping
- Easy to understand

**Cons:**
- Loses modularity
- Duplication if multiple projects need same skill

### 2. Modular Rules with References (Better)
Organize cursor rules in a hierarchy and reference them:

```
.cursorrules/
  ├── base/                           # Shared methodology skills
  │   ├── tdd.cursorrules
  │   ├── code-review.cursorrules
  │   └── debugging.cursorrules
  ├── frameworks/                     # Framework-specific rules
  │   ├── nextjs.cursorrules
  │   └── react.cursorrules
  └── project.cursorrules            # Project-specific (imports others)
```

**Project-specific rule can reference base skills:**

```markdown
# Project Rules

## Import Base Methodologies

This project follows these core development practices:
- See `.cursorrules/base/tdd.cursorrules` for testing approach
- See `.cursorrules/base/code-review.cursorrules` for review standards
- See `.cursorrules/base/debugging.cursorrules` for debugging methodology

## Project-Specific Rules

[Your custom rules here...]
```

**Pros:**
- Reusable across projects
- Organized by concern
- Easy to maintain

**Cons:**
- Requires manual references
- Cursor doesn't auto-compose multiple files

### 3. Hybrid Automated Conversion (Best)
Use a converter script to generate Cursor rules from Claude Skills with:
- Full skill content included
- Structured methodology section
- Integration guidance
- Reference to other rules

---

## What We Built

### Conversion Script: `convert-skills-to-cursor.mjs`

**Features:**
- Converts all 20 Claude Skills to Cursor Rules format
- Extracts methodology, principles, workflow, examples
- Includes full original skill content for reference
- Adds integration guidance
- Creates modular organization suggestions

**Usage:**
```bash
node /tmp/convert-skills-to-cursor.mjs
```

**Output:**
- 20 `.cursorrules` files in `converted-cursor-skills/`
- Package metadata in `converted-cursor-skills.json`

---

## Converted Skills (20)

All Claude Code skills have been converted:

1. ✅ **brainstorming** - Facilitation and ideation methodology
2. ✅ **condition-based-waiting** - Wait for specific conditions
3. ✅ **defense-in-depth** - Security-first development
4. ✅ **dispatching-parallel-agents** - Parallel task execution
5. ✅ **executing-plans** - Systematic plan execution
6. ✅ **finishing-a-development-branch** - Complete branch workflow
7. ✅ **receiving-code-review** - How to receive feedback
8. ✅ **requesting-code-review** - How to request reviews
9. ✅ **root-cause-tracing** - Debug methodology
10. ✅ **sharing-skills** - Skill documentation patterns
11. ✅ **subagent-driven-development** - Using subagents effectively
12. ✅ **systematic-debugging** - Structured debugging approach
13. ✅ **test-driven-development** - TDD methodology
14. ✅ **testing-anti-patterns** - What to avoid in testing
15. ✅ **testing-skills-with-subagents** - Test skill quality
16. ✅ **using-git-worktrees** - Git worktree workflows
17. ✅ **using-superpowers** - Claude Code superpowers usage
18. ✅ **verification-before-completion** - Quality gates
19. ✅ **writing-plans** - Plan creation methodology
20. ✅ **writing-skills** - Skill authoring guide

---

## Example: Test-Driven Development

**File:** `cursorrules-test-driven-development.cursorrules`

**Structure:**
```markdown
# Test Driven Development - Cursor Rules

## Overview
This cursor rule is based on the Claude Code "Test Driven Development" skill...

## Core Methodology
When working on code, follow this test driven development methodology:
1. [Extracted workflow steps]

## Principles
- [Extracted principles from original skill]

## Implementation Guidelines
- [Practical tips]

## Examples
- [Code examples from skill]

## Integration with Other Rules
This rule works best when combined with:
- Code quality and style guidelines
- Testing best practices
- Project-specific conventions

You can reference other .cursorrules files by organizing them in your project:
.cursorrules/
  ├── base/
  │   ├── test-driven-development.cursorrules (this file)
  │   └── code-quality.cursorrules
  └── project-specific.cursorrules

## Original Skill Content
[Full original Claude Code skill content for reference]
---
```

---

## How Cursor Can Reference Rules

### Method 1: File Organization (Manual)
```
project/
  ├── .cursorrules                    # Main project rules
  └── .cursorrules/                   # Additional methodology rules
      ├── tdd.cursorrules
      ├── code-review.cursorrules
      └── debugging.cursorrules
```

In your main `.cursorrules`, reference them:
```markdown
# Project Rules

## Development Methodologies

Follow these established practices:
- **Testing:** See `.cursorrules/tdd.cursorrules`
- **Code Review:** See `.cursorrules/code-review.cursorrules`
- **Debugging:** See `.cursorrules/debugging.cursorrules`
```

### Method 2: Inline Combination
Combine multiple converted skills into one `.cursorrules` file:
```markdown
# Project Development Standards

## Testing Methodology
[Content from TDD skill]

## Code Review Process
[Content from code-review skill]

## Debugging Approach
[Content from debugging skill]
```

### Method 3: Collection-Based (Recommended)
Use PRPM collections to install related skills as a set:
```bash
prpm install cursor-development-workflow
# Installs: TDD, debugging, code review, git worktrees, verification
```

---

## Updated Package Counts

**Total Packages:** 246
- Claude Agents: 34
- Claude Subagents: 6
- Claude Skills: 20
- Cursor Rules: **202** (182 original + **20 converted skills**)
- MCP Servers: 15

**Note:** The 20 converted skills are **in addition** to the 182 original Cursor rules.

---

## Benefits of Skill Conversion

### For Cursor Users
✅ Access to Claude Code methodologies
✅ Structured development workflows
✅ Best practices from obra/superpowers
✅ Modular, reusable rule sets

### For Claude Users
✅ Skills remain in original format
✅ Can still use native skill system
✅ Option to share with Cursor users

### For PRPM
✅ Cross-IDE compatibility
✅ Larger package ecosystem
✅ Unified methodology library
✅ More collection possibilities

---

## Files Created

- `converted-cursor-skills/` - 20 `.cursorrules` files
- `converted-cursor-skills.json` - Package metadata
- `/tmp/convert-skills-to-cursor.mjs` - Conversion script
- `SKILL_TO_CURSOR_CONVERSION.md` - This documentation

---

## Future Enhancements

### Auto-Composition
Create a Cursor plugin that:
- Reads multiple `.cursorrules` files
- Composes them into a single context
- Respects dependency order
- Handles conflicts

### Bi-Directional Conversion
- Cursor Rules → Claude Skills
- Allows sharing best practices both ways

### Smart References
```markdown
@import .cursorrules/tdd.cursorrules as tdd
@import .cursorrules/debugging.cursorrules as debug

When testing: {{tdd.methodology}}
When debugging: {{debug.approach}}
```

---

## Conclusion

**Yes, Claude Skills can be converted to Cursor Rules**, and we've successfully converted all 20 skills with:
- Full methodology preservation
- Modular organization support
- Integration guidance
- Original content for reference

This allows Cursor users to benefit from Claude Code's proven development workflows while maintaining compatibility with their IDE.
