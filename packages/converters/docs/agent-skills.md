# Agent Skills Format Specification

**Official Spec:** https://agentskills.io/specification
**Format:** Markdown with YAML frontmatter

## Implementations

| Tool | File Location | Documentation |
|------|--------------|---------------|
| **OpenAI Codex** | `.codex/skills/{skill-name}/SKILL.md` | [Codex Skills](https://developers.openai.com/codex/skills) |
| **GitHub Copilot** | `.github/skills/{skill-name}/SKILL.md` | [Copilot Skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills) |

## Overview

Agent Skills is an open standard for giving AI agents new capabilities and expertise. Skills are directories containing instructions, scripts, and resources that agents can discover and use. Multiple AI assistants implement this standard, ensuring skills are portable across tools.

### Codex Discovery Locations

OpenAI Codex CLI discovers skills from these locations (in order of precedence):
1. **REPO**: `$CWD/.codex/skills` - Project-specific skills
2. **REPO**: `$CWD/../.codex/skills` - Parent folder organization skills
3. **REPO**: `$REPO_ROOT/.codex/skills` - Repository-wide skills
4. **USER**: `$CODEX_HOME/skills` - User-personal skills
5. **ADMIN**: `/etc/codex/skills` - System-level defaults
6. **SYSTEM**: Bundled - Built-in skills

### Copilot Discovery Locations

GitHub Copilot discovers skills from:
- `.github/skills/{skill-name}/SKILL.md` - Repository-scoped skills

## Directory Structure

Each skill is a directory containing a `SKILL.md` file and optional supporting directories:

```
my-skill/
├── SKILL.md          (required) - Main skill definition
├── scripts/          (optional) - Executable code (Python, Bash, JS)
├── references/       (optional) - Additional documentation (REFERENCE.md, FORMS.md)
└── assets/           (optional) - Static resources (templates, images, data)
```

## Frontmatter Fields

### Required Fields

- **`name`** (string): Skill identifier
  - 1-64 characters
  - Lowercase alphanumeric and hyphens only
  - Cannot start/end with hyphens or contain consecutive hyphens
  - Must match parent directory name
  - Examples: `pdf-processing`, `code-review`, `data-analysis`

- **`description`** (string): Explains what the skill does and when to use it
  - 1-1024 characters
  - Should include specific keywords for agent identification
  - Example: "Reviews code for best practices, security issues, and improvements. Use when analyzing pull requests or conducting security audits."

### Optional Fields

- **`license`** (string): Specifies skill licensing terms
  - Keep brief (license name or bundled file reference)
  - Example: `MIT`, `Apache-2.0`

- **`compatibility`** (string): Environment requirements
  - 1-500 characters
  - Indicates products, system packages, or network access needed
  - Example: "Requires git, docker, jq, and internet access"

- **`allowed-tools`** (string): Pre-approved tools (experimental)
  - Space-delimited list
  - Support varies by implementation
  - Example: `Bash(git:*) Bash(jq:*) Read Write`

- **`metadata`** (object): Arbitrary string key-value pairs
  - For additional properties not defined by the spec
  - Use uniquely named keys to avoid conflicts
  - Example: `{ "category": "development", "version": "1.0.0" }`

## Content Format

The markdown body after the frontmatter contains instructions for the agent. The Agent Skills spec recommends:
- Keep under 5000 tokens for progressive disclosure
- Metadata (~100 tokens) loads at startup
- Full SKILL.md body loads when skill is activated
- Reference files load on-demand

## Examples

### Basic Skill

```markdown
---
name: typescript-expert
description: Expert TypeScript development assistance with type safety, best practices, and modern patterns. Use for TypeScript projects requiring strict typing, generic programming, or advanced type manipulation.
license: MIT
---

You are an expert TypeScript developer.

## Guidelines

- Always use strict type checking
- Prefer `unknown` over `any`
- Use type guards for runtime type checking
- Leverage template literal types where appropriate

## Best Practices

- Export types from dedicated `.types.ts` files
- Use `readonly` for immutable data
- Prefer interfaces for object shapes, types for unions
```

### Skill with Tools and Compatibility

```markdown
---
name: pdf-processing
description: Extracts and processes content from PDF documents. Use for document analysis, text extraction, and PDF manipulation tasks.
license: Apache-2.0
compatibility: Requires pdftotext, poppler-utils
allowed-tools: Bash(pdftotext:*) Read Write
metadata:
  category: document-processing
  version: 2.0.0
---

Process PDF documents using available command-line tools.

## Capabilities

- Extract text from PDFs using pdftotext
- Convert PDF pages to images
- Merge and split PDF files

## Usage

When asked to process a PDF:
1. First verify the file exists
2. Use pdftotext for text extraction
3. Return structured content to the user
```

### Code Review Skill

```markdown
---
name: code-review
description: Reviews code for best practices, security issues, performance problems, and maintainability. Use when analyzing pull requests, code changes, or conducting security audits.
---

You are an expert code reviewer.

## Process

1. Check for obvious bugs and logic errors
2. Review error handling
3. Assess security implications
4. Evaluate performance characteristics
5. Consider maintainability and readability

## Focus Areas

- Input validation and sanitization
- Resource management (memory, file handles)
- Concurrency and race conditions
- Edge cases and boundary conditions
```

## Invocation Modes

Agent Skills support two invocation modes:

1. **Explicit**: Users invoke via `/skills` command or `$skill-name` mention
2. **Implicit**: Agent automatically selects based on task context using the skill's `description`

## Validation

Use the `skills-ref validate ./my-skill` command to verify:
- Frontmatter validity
- Name format compliance
- Required fields presence

## Conversion Notes

### From Agent Skills to Canonical

The converter parses SKILL.md files and extracts:
- `name` and `description` as title/description
- `license` to package license
- `compatibility` stored in agentSkills metadata
- `allowed-tools` as tools section AND stored for roundtrip
- `metadata` stored for roundtrip
- Body content as instructions

### From Canonical to Agent Skills

The converter generates SKILL.md with:
- YAML frontmatter with all official fields
- `name` slugified from title (or preserved from roundtrip)
- `description` truncated to 1024 chars if needed
- `license` from package or agentSkills metadata
- `compatibility` from agentSkills metadata
- `allowed-tools` from tools section or agentSkills metadata
- `metadata` preserved from roundtrip
- Body content from instructions sections

### Cross-Format Conversion

Skills authored for one tool can be converted for another:
- Codex skill → Copilot skill: Change directory from `.codex/skills/` to `.github/skills/`
- Copilot skill → Codex skill: Change directory from `.github/skills/` to `.codex/skills/`

The content format is identical between implementations.

## Progressive Disclosure Fallback

For Codex subtypes not natively supported as skills:
- **Rules**: Use `AGENTS.md` in project root
- **Slash commands**: Use `.opencommands/{name}.md`
- **Agents**: Use `.openagents/{name}/AGENT.md`

## Related Documentation

- [Agent Skills Specification](https://agentskills.io/specification)
- [OpenAI Codex CLI Docs](https://developers.openai.com/codex)
- [GitHub Copilot Skills Docs](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [Example Skills Repository](https://github.com/anthropics/skills)

## Changelog

- **2025-01-19**: Unified as shared Agent Skills standard for Codex and Copilot
- **2025-01-15**: Initial SKILL.md format support
