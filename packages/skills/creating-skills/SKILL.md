---
name: creating-skills
description: Use when creating new Claude Code skills or improving existing ones - ensures skills are discoverable, scannable, and effective through proper structure, CSO optimization, and real examples
tags: meta
---

# Creating Skills

## Overview

**Skills are reference guides for proven techniques, patterns, or tools.** Write them to help future Claude instances quickly find and apply effective approaches.

Skills must be **discoverable** (Claude can find them), **scannable** (quick to evaluate), and **actionable** (clear examples).

## When to Use

**Create a skill when:**
- Technique wasn't intuitively obvious
- Pattern applies broadly across projects
- You'd reference this again
- Others would benefit

**Don't create for:**
- One-off solutions specific to single project
- Standard practices well-documented elsewhere
- Project conventions (put those in `.claude/CLAUDE.md`)

## Required Structure

### Frontmatter (YAML)

```yaml
---
name: skill-name-with-hyphens
description: Use when [triggers/symptoms] - [what it does and how it helps]
---
```

**Rules:**
- Only `name` and `description` fields supported (max 1024 chars total)
- Name: letters, numbers, hyphens only (no special chars)
- Description: Third person, starts with "Use when..."
- Include BOTH triggering conditions AND what skill does

### Document Structure

```markdown
# Skill Name

## Overview
Core principle in 1-2 sentences. What is this?

## When to Use
- Bullet list with symptoms and use cases
- When NOT to use

## Quick Reference
Table or bullets for common operations

## Implementation
Inline code for simple patterns
Link to separate file for heavy reference (100+ lines)

## Common Mistakes
What goes wrong + how to fix

## Real-World Impact (optional)
Concrete results from using this technique
```

## Claude Search Optimization (CSO)

**Critical:** Future Claude reads the description to decide if skill is relevant. Optimize for discovery.

### Description Best Practices

```yaml
# ❌ BAD - Too vague, doesn't mention when to use
description: For async testing

# ❌ BAD - First person (injected into system prompt)
description: I help you with flaky tests

# ✅ GOOD - Triggers + what it does
description: Use when tests have race conditions or pass/fail inconsistently - replaces arbitrary timeouts with condition polling for reliable async tests

# ✅ GOOD - Technology-specific with explicit trigger
description: Use when using React Router and handling auth redirects - provides patterns for protected routes and auth state management
```

### Keyword Coverage

Use words Claude would search for:
- **Error messages**: "ENOENT", "Cannot read property", "Timeout"
- **Symptoms**: "flaky", "hanging", "race condition", "memory leak"
- **Synonyms**: "cleanup/teardown/afterEach", "timeout/hang/freeze"
- **Tools**: Actual command names, library names, file types

### Naming Conventions

**Active voice, verb-first:**
- ✅ `creating-skills` not `skill-creation`
- ✅ `testing-with-subagents` not `subagent-testing`
- ✅ `debugging-memory-leaks` not `memory-leak-debugging`

**Gerunds (-ing) work well:**
- Describes the action you're taking
- Active and clear

## Code Examples

**One excellent example beats many mediocre ones.**

### Choose Language by Use Case

- Testing techniques → TypeScript/JavaScript
- System debugging → Shell/Python
- Data processing → Python
- API calls → TypeScript/JavaScript

### Good Example Checklist

- [ ] Complete and runnable
- [ ] Well-commented explaining **WHY** not just what
- [ ] From real scenario (not contrived)
- [ ] Shows pattern clearly
- [ ] Ready to adapt (not generic template)
- [ ] Shows both BAD (❌) and GOOD (✅) approaches
- [ ] Includes realistic context/setup code

### Example Template

```typescript
// ✅ GOOD - Clear, complete, ready to adapt
interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoff?: 'linear' | 'exponential';
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, delayMs, backoff = 'linear' } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts) throw error;

      const delay = backoff === 'exponential'
        ? delayMs * Math.pow(2, attempt - 1)
        : delayMs * attempt;

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unreachable');
}

// Usage
const data = await retryOperation(
  () => fetchUserData(userId),
  { maxAttempts: 3, delayMs: 1000, backoff: 'exponential' }
);
```

### Don't

- ❌ Implement in 5+ languages (you're good at porting)
- ❌ Create fill-in-the-blank templates
- ❌ Write contrived examples
- ❌ Show only code without comments

## File Organization

### Self-Contained (Preferred)

```
typescript-type-safety/
  SKILL.md    # Everything inline
```

**When:** All content fits in ~500 words, no heavy reference needed

### With Supporting Files

```
api-integration/
  SKILL.md           # Overview + patterns
  retry-helpers.ts   # Reusable code
  examples/
    auth-example.ts
    pagination-example.ts
```

**When:** Reusable tools or multiple complete examples needed

### With Heavy Reference

```
aws-sdk/
  SKILL.md       # Overview + workflows
  s3-api.md      # 600 lines API reference
  lambda-api.md  # 500 lines API reference
```

**When:** Reference material > 100 lines

## Token Efficiency

Skills load into every conversation. Keep them concise.

### Target Word Counts

- Getting-started workflows: <150 words
- Frequently-loaded skills: <200 words total
- Other skills: <500 words

### Compression Techniques

```markdown
# ❌ BAD - Verbose (42 words)
Your human partner asks: "How did we handle authentication errors in React Router before?"
You should respond: "I'll search past conversations for React Router authentication patterns."
Then dispatch a subagent with the search query: "React Router authentication error handling 401"

# ✅ GOOD - Concise (20 words)
Partner: "How did we handle auth errors in React Router?"
You: Searching...
[Dispatch subagent → synthesis]
```

**Techniques:**
- Reference tool `--help` instead of documenting all flags
- Cross-reference other skills instead of repeating content
- Show minimal example of pattern
- Eliminate redundancy

## Common Mistakes

| Mistake | Why It Fails | Fix |
|---------|--------------|-----|
| Narrative example | "In session 2025-10-03..." | Focus on reusable pattern |
| Multi-language dilution | Same example in 5 languages | One excellent example |
| Code in flowcharts | `step1 [label="import fs"]` | Use markdown code blocks |
| Generic labels | helper1, helper2, step3 | Use semantic names |
| Missing description triggers | "For testing" | "Use when tests are flaky..." |
| First-person description | "I help you..." | "Use when... - provides..." |

## Flowchart Usage

**Only use flowcharts for:**
- Non-obvious decision points
- Process loops where you might stop too early
- "When to use A vs B" decisions

**Never use for:**
- Reference material → Use tables/lists
- Code examples → Use markdown blocks
- Linear instructions → Use numbered lists

## Cross-Referencing Skills

```markdown
# ✅ GOOD - Name only with clear requirement
**REQUIRED:** Use superpowers:test-driven-development before proceeding

**RECOMMENDED:** See typescript-type-safety for proper type guards

# ❌ BAD - Unclear if required
See skills/testing/test-driven-development

# ❌ BAD - Force-loads file, wastes context
@skills/testing/test-driven-development/SKILL.md
```

## Skill Creation Checklist

**Before writing:**
- [ ] Technique isn't obvious or well-documented elsewhere
- [ ] Pattern applies broadly (not project-specific)
- [ ] I would reference this across multiple projects

**Frontmatter:**
- [ ] Name uses only letters, numbers, hyphens
- [ ] Description starts with "Use when..."
- [ ] Description includes triggers AND what skill does
- [ ] Description is third person
- [ ] Total frontmatter < 1024 characters

**Content:**
- [ ] Overview states core principle (1-2 sentences)
- [ ] "When to Use" section with symptoms
- [ ] Quick reference table for common operations
- [ ] One excellent code example (if technique skill)
- [ ] Common mistakes section
- [ ] Keywords throughout for searchability

**Quality:**
- [ ] Word count appropriate for frequency (see targets above)
- [ ] No narrative storytelling
- [ ] Flowcharts only for non-obvious decisions
- [ ] Supporting files only if needed (100+ lines reference)
- [ ] Cross-references use skill name, not file paths

**Testing (if discipline-enforcing skill):**
- [ ] Tested with subagent scenarios
- [ ] Addresses common rationalizations
- [ ] Includes red flags list

## Directory Structure

```
skills/
  skill-name/
    SKILL.md              # Required
    supporting-file.*     # Optional
    examples/             # Optional
      example1.ts
    scripts/              # Optional
      helper.py
```

**Flat namespace** - all skills in one searchable directory

## Real-World Impact

**Good skills:**
- Future Claude finds them quickly (CSO optimization)
- Can be scanned in seconds (quick reference)
- Provide clear actionable examples
- Prevent repeating same research

**Bad skills:**
- Get ignored (vague description)
- Take too long to evaluate (no quick reference)
- Leave gaps in understanding (no examples)
- Waste token budget (verbose)

---

**Remember:** Skills are for future Claude, not current you. Optimize for discovery, scanning, and action.