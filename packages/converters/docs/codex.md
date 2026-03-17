# Codex Format Specification

**File Locations:**
- Skills: `.agents/skills/{skill-name}/SKILL.md`
- Agents/Subagents (project): `.codex/agents/*.toml`
- Agents/Subagents (global): `~/.codex/agents/*.toml`
- Rules/Instructions: `AGENTS.md`
- Slash Commands: `.opencommands/*.md`

**Format:** TOML (agents), Markdown with YAML frontmatter (skills), plain Markdown (AGENTS.md)
**Official Docs:** https://developers.openai.com/codex/multi-agent/

## Overview

OpenAI Codex CLI supports multiple format types for configuring AI agent behavior:

1. **Skills** (Agent Skills format): Markdown files with YAML frontmatter following the agentskills.io specification
2. **Agents/Subagents**: TOML configuration files that define specialized agent roles for multi-agent workflows
3. **Rules**: Project-level instructions via AGENTS.md
4. **Slash Commands**: Custom commands via `.opencommands/`

## Subagent TOML Format

### Required Fields

- **`name`** (string): Display name of the agent/subagent
- **`description`** (string): Short description of what this agent does and when to use it
- **`developer_instructions`** (string): System prompt / developer instructions for this agent role

### Optional Fields

- **`nickname_candidates`** (string[]): Alternative names the agent can be referred to as
- **`model`** (string): Model identifier to use (e.g., "o3", "o3-mini")
- **`model_reasoning_effort`** (enum): Reasoning effort level — `low`, `medium`, or `high`
- **`sandbox_mode`** (enum): Filesystem/network sandbox policy — `read-only` (default), `workspace-write`, or `danger-full-access`
- **`mcp_servers`** (object): MCP server configurations available to this agent
- **`skills.config`** (object): Skills configuration key-value pairs

### Global Settings (in codex config, not agent files)

- `agents.max_threads` (default: 6): Maximum parallel agent threads
- `agents.max_depth` (default: 1): Maximum spawning depth
- `agents.job_max_runtime_seconds`: Maximum runtime per agent job

### Built-in Agents

Codex includes three built-in agents: `default`, `worker`, and `explorer`.

## Skill Format (Agent Skills)

### Required Fields

- **`name`** (string): 1-64 chars, lowercase alphanumeric and hyphens, must match parent directory name
- **`description`** (string): 1-1024 chars, explains what skill does and when to use it

### Optional Fields

- **`license`** (string): Licensing terms
- **`compatibility`** (string): Environment requirements (max 500 chars)
- **`allowed-tools`** (string): Space-delimited list of pre-approved tools
- **`metadata`** (object): Arbitrary key-value pairs

## Content Format

### Subagent TOML

```toml
name = "Security Reviewer"
description = "Find security vulnerabilities and unsafe code patterns"
developer_instructions = "Focus on OWASP Top 10 vulnerabilities, injection attacks, and authentication issues."
nickname_candidates = ["sec-review", "security"]
model = "o3"
model_reasoning_effort = "high"
sandbox_mode = "read-only"

[mcp_servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]

[skills.config]
focus_areas = "security,authentication"
```

### Skill SKILL.md

```markdown
---
name: typescript-expert
description: Expert TypeScript development assistance with type safety and best practices.
license: MIT
allowed-tools: Bash(tsc:*) Read Write
---

You are an expert TypeScript developer.

## Guidelines

- Always use strict type checking
- Prefer `unknown` over `any`
```

## Best Practices

1. Keep `developer_instructions` focused and specific to the agent's role
2. Use `sandbox_mode: "read-only"` for agents that only need to analyze code
3. Provide meaningful `nickname_candidates` for easier agent invocation
4. Configure `model_reasoning_effort` based on task complexity (use "low" for simple tasks)
5. Limit MCP server configurations to only what the agent needs

## Conversion Notes

### From Codex to Canonical

- `name` and `description` from TOML map to package metadata and `codexAgent` metadata
- `developer_instructions` maps to an instructions section
- `model`, `model_reasoning_effort`, `sandbox_mode` are stored in `codexAgent` metadata
- `nickname_candidates`, `mcp_servers`, `skills.config` are preserved in `codexAgent` metadata for roundtrip

### From Canonical to Codex

- Package name and description populate the `name` and `description` TOML fields
- Instructions sections map to `developer_instructions`
- Tools sections are skipped with a warning (not supported by agent role TOML)
- Persona sections are skipped with a warning
- `codexAgent` metadata fields are restored for roundtrip fidelity

## Limitations

- Agent role TOML does not support tools sections (use `allowed-tools` in skill format instead)
- Persona sections cannot be represented in TOML format
- File reference sections are not supported
- Hook sections are not supported
- `mcp_servers` and `skills.config` are opaque to PRPM — values are preserved but not interpreted

## Examples

### Minimal Subagent

```toml
name = "Code Reviewer"
description = "Reviews code for bugs and best practices"
developer_instructions = "Review code changes for correctness, performance, and security issues."
```

### Full-Featured Subagent

```toml
name = "Security Auditor"
description = "Deep security analysis of code changes"
nickname_candidates = ["sec-audit", "security-check"]
model = "o3"
model_reasoning_effort = "high"
sandbox_mode = "read-only"
developer_instructions = """
You are a security auditor. Analyze code for:
- OWASP Top 10 vulnerabilities
- Injection attacks (SQL, command, XSS)
- Authentication and authorization issues
- Sensitive data exposure
- Security misconfigurations
"""

[mcp_servers.semgrep]
command = "npx"
args = ["-y", "semgrep-mcp-server"]

[skills.config]
severity_threshold = "medium"
```

## Related Documentation

- [Codex Multi-Agent Docs](https://developers.openai.com/codex/multi-agent/)
- [Codex Skills Docs](https://developers.openai.com/codex/skills)
- [Agent Skills Specification](https://agentskills.io/specification)
- [PRPM Format Guide](../../docs/formats.mdx)

## Changelog

- **2026-03-17**: Added subagent support (name, description, nickname_candidates, mcp_servers, skills.config)
- **2025-01-15**: Initial Codex format support (skills, agent roles)
