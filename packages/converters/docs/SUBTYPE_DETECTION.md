# Subtype Detection Strategy

## Overview

Package subtypes (agent, skill, slash-command, rule, etc.) are determined primarily from **file path context**, not from content analysis. This document explains the detection strategy and why content-based heuristics are unreliable.

## Detection Priority

1. **Explicit subtype parameter** (from file path context)
2. **PRPM extension fields** (backwards compatibility)
3. **Default to 'rule'**

## Why File Path Context?

Official AI IDE formats distinguish package types by file location, not by frontmatter fields:

### Claude Code
- **Agents:** `.claude/agents/*.md`
- **Skills:** `.claude/skills/*/SKILL.md`
- **Slash Commands:** `.claude/commands/*.md`
- **Hooks:** `.claude/hooks/*`

### Cursor
- **Rules:** `.cursor/rules/*.mdc`
- **Slash Commands:** `.cursor/commands/*.md`

### Continue
- **Rules:** `.continue/rules/*.md`
- **Prompts:** `.continue/prompts/*.md`

### Kiro
- **Steering:** `.kiro/steering/*.md`
- **Hooks:** `.kiro/hooks/*.kiro.hook`

## Why Not Content-Based Detection?

Content-based heuristics are unreliable:

### 1. Persona Detection ("You are...")
**❌ Unreliable:**
- Regular rules can have "You are" instructions
- Agents might not have persona sections
- Difficult to distinguish from general instructions

```markdown
<!-- Is this an agent or a rule? -->
# Test Rule

You are expected to follow these guidelines...
```

### 2. Tools Field Detection
**❌ Unreliable:**
- Skills can have tools
- Can't distinguish agent from skill
- Some agents don't use tools

```yaml
# Both agents and skills can have tools
allowed-tools: Read, Write, Bash
```

### 3. No Frontmatter Detection
**❌ Unreliable:**
- What if frontmatter parsing fails?
- What if it's a regular rule without frontmatter?
- Makes false assumptions about format conventions

## Implementation

### For Converters Package (Parsing)

The converters package accepts an optional `explicitSubtype` parameter:

```typescript
function fromClaude(
  content: string,
  metadata: {...},
  sourceFormat: 'claude' | 'cursor' | 'continue' = 'claude',
  explicitSubtype?: Subtype
): CanonicalPackage
```

**Without explicit subtype:**
1. Check for PRPM extension fields (`agentType`, `skillType`, `commandType`)
2. Default to 'rule'

**With explicit subtype:**
- Use the provided subtype directly

### For CLI (File Operations)

The CLI should determine subtype from file paths:

```typescript
// Example: Installing from .claude/agents/code-reviewer.md
const filePath = '.claude/agents/code-reviewer.md';
const subtype = detectSubtypeFromPath(filePath); // Returns 'agent'
const pkg = fromClaude(content, metadata, 'claude', subtype);
```

### Path to Subtype Mapping

```typescript
function detectSubtypeFromPath(filePath: string): Subtype {
  if (filePath.includes('.claude/agents/')) return 'agent';
  if (filePath.includes('.claude/skills/')) return 'skill';
  if (filePath.includes('.claude/commands/')) return 'slash-command';
  if (filePath.includes('.cursor/commands/')) return 'slash-command';
  if (filePath.includes('.continue/prompts/')) return 'prompt';
  if (filePath.includes('.kiro/hooks/')) return 'hook';
  // ... etc
  return 'rule'; // default
}
```

## Backwards Compatibility

For packages created before this change, PRPM extension fields are still detected:

```yaml
---
name: test
description: Test
agentType: agent  # ✅ Still detected for backwards compatibility
---
```

However, new conversions **do not output** these fields, as they're not part of official specs.

## Round-Trip Conversion

Subtype information is **lost during round-trip conversion** unless the CLI preserves it through file path context:

```
Original File: .claude/agents/test.md (agent)
        ↓
   Parse with subtype='agent'
        ↓
 Convert to Cursor (outputs to .cursor/rules/)
        ↓
   No agentType in output
        ↓
Parse back (defaults to 'rule') ❌ LOST

Solution: CLI should track original subtype and write to correct path
```

## Testing

See `src/__tests__/subtype-detection.test.ts` for comprehensive tests covering:

- Explicit subtype parameters
- PRPM extension fields (backwards compat)
- Default behavior
- File path context simulation
- Edge cases

## Summary

**✅ DO:**
- Determine subtype from file path in the CLI
- Pass explicit subtype to converter functions
- Detect PRPM extension fields for backwards compatibility

**❌ DON'T:**
- Rely on content analysis (persona, tools, etc.)
- Assume subtype from frontmatter presence/absence
- Use heuristics that can misclassify packages

The file path is the source of truth for subtype determination.
