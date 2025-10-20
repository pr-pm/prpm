# Creating Skills - Meta Claude Code Skill

**Official PRPM Meta-Skill**

Learn how to create effective Claude Code skills with proper structure, Claude Search Optimization (CSO), and actionable examples.

## Installation

```bash
prpm install @prpm-official/creating-skills
```

## What This Skill Does

- Teaches the complete skill creation process
- Shows how to write discoverable descriptions (CSO)
- Provides templates and best practices
- Explains file organization patterns
- Includes code example guidelines

## When to Use

Use when:
- Creating new Claude Code skills
- Improving existing skills
- Ensuring skills are discoverable by future Claude instances
- Converting documentation to skill format

## What You'll Learn

- **Skill Structure**: Required frontmatter and sections
- **CSO (Claude Search Optimization)**: How Claude finds your skills
- **Naming Conventions**: Active voice, verb-first patterns
- **Code Examples**: One excellent example > many mediocre ones
- **Token Efficiency**: Keep frequently-loaded skills concise
- **File Organization**: When to split into multiple files

## Quick Example

```yaml
---
name: skill-name-with-hyphens
description: Use when [triggers/symptoms] - [what it does and how it helps]
---

# Skill Name

## Overview
Core principle in 1-2 sentences.

## When to Use
- Symptom 1
- Symptom 2

## Quick Reference
[Table or code example]
```

## Key Principles

1. **Discoverable**: Future Claude can find it (CSO optimization)
2. **Scannable**: Quick to evaluate relevance (headers, tables)
3. **Actionable**: Clear examples to adapt

## Real-World Impact

- ✅ Skills get found when needed (not lost in directory)
- ✅ Can be evaluated in seconds (quick reference)
- ✅ Provide clear implementation guidance
- ✅ Prevent repeating research across projects

## Tags

`meta` `skill-creation` `documentation` `best-practices`

## License

MIT
