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
- **Naming Conventions**: Gerund form (verb + -ing), avoid vague names
- **Code Examples**: One excellent example > many mediocre ones
- **Token Efficiency**: Keep SKILL.md under 500 lines, challenge each piece
- **File Organization**: When to split into multiple files
- **Degrees of Freedom**: Match specificity to task complexity
- **Workflow Patterns**: Sequential steps, feedback loops, checklists
- **Advanced Practices**: Iterative development, evaluations-first approach

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

1. **Concise**: Only add context Claude doesn't already have (<500 lines)
2. **Discoverable**: Future Claude can find it (CSO optimization)
3. **Scannable**: Quick to evaluate relevance (headers, tables)
4. **Actionable**: Clear examples to adapt
5. **Right Specificity**: Match degrees of freedom to task complexity

## Real-World Impact

- ✅ Skills get found when needed (not lost in directory)
- ✅ Can be evaluated in seconds (quick reference)
- ✅ Provide clear implementation guidance
- ✅ Prevent repeating research across projects

## Tags

`meta` `skill-creation` `documentation` `best-practices`

## License

MIT
