---
title: "Slash Commands Across 7 AI Coding Assistants: What Works, What Doesn't"
date: 2025-01-20
author: PRPM Team
tags: [comparison, slash-commands, formats]
description: We analyzed slash command implementations in Claude Code, Cursor, Factory Droid, OpenCode, Zed, Gemini CLI, and Codex. Here's what each one gets right—and where they fall short.
---

# Slash Commands Across 7 AI Coding Assistants

Slash commands let you trigger specific AI behaviors without typing the same instructions every time. Instead of "generate tests for this file following our patterns," you type `/test`.

Seven AI coding assistants support slash commands natively. Each took a different approach. We tested all of them. Here's what we found.

## The Formats

### 1. Claude Code — Most Feature-Complete

**Location:** `.claude/commands/*.md`
**Format:** Markdown with YAML frontmatter

Claude's implementation has the most advanced features:

**File referencing with `@`:**
```markdown
Compare @src/old.js with @src/new.js and explain the differences.
```

**Bash execution with `!`:**
```markdown
Current git status: !`git status --short`
Recent commits: !`git log --oneline -5`
```

**Argument handling:**
- `$ARGUMENTS` — everything after the command name
- `$1`, `$2`... `$9` — individual positional arguments

**Namespacing:**
Subdirectories create dot-notation commands:
- `.claude/commands/git/commit.md` → `/git.commit`

**Frontmatter options:**
```yaml
---
allowed-tools: Bash(git *), Read, Write
argument-hint: <commit-message>
description: Create conventional commit
model: sonnet
disable-model-invocation: false
---
```

**What works:** The `@` file reference syntax is brilliant. No more "read this file first, then..." The bash execution `!` lets you inject live system state. Arguments make commands reusable.

**What doesn't:** Tool restrictions like `Bash(git *)` are powerful but the syntax isn't obvious. New users will miss this feature.

**Example:**
```markdown
---
allowed-tools: Bash(git *)
argument-hint: <type> <message>
---

# Quick Commit

Create conventional commit: $1($2): $ARGUMENTS

Current changes:
!`git diff --stat`

Run: git commit -m "$1: $ARGUMENTS"
```

### 2. Cursor — Simplest

**Location:** `.cursor/commands/*.md`
**Format:** Plain markdown (NO frontmatter)

Cursor went minimal. Commands are just markdown files. No configuration. No special syntax.

```markdown
# Review Code

Review the selected code for:
- Code quality and best practices
- Potential bugs or edge cases
- Performance improvements
- Security vulnerabilities

Provide specific, actionable feedback with code examples.
```

**What works:** Zero learning curve. Create a markdown file, write instructions, done. Team commands via Cursor Dashboard means everyone gets the same commands without Git.

**What doesn't:** No arguments. No file references. No bash execution. Every command is static. Want a "test this specific file" command? Can't do it. You get "test selected file" or nothing.

**When to use it:** Quick, one-off commands that apply to whatever you have selected. Perfect for code review checklists or generation templates.

### 3. Factory Droid — Best for Scripts

**Location:** `.factory/commands/*.md` or executable scripts
**Format:** Markdown with YAML frontmatter OR executable files

Factory Droid supports two command types:

**Markdown commands:**
```markdown
---
description: Run code review checklist
argument-hint: <branch-name>
---

Review `$ARGUMENTS` and respond with:
1. Summary of changes
2. Correctness assessment
3. Potential risks
4. Follow-up tasks
```

**Executable scripts:**
```bash
#!/usr/bin/env bash
set -euo pipefail

target=${1:-"src"}
npm run lint -- "$target"
npm test -- --runTestsByPath "$target"
```

**What works:** Executable scripts mean your slash command can do anything a shell script can do. Output goes straight to chat. Combine AI reasoning with real tooling.

**What doesn't:** `$ARGUMENTS` for markdown commands but `$1` for shell scripts. Pick one convention. Also, detection is based on `argument-hint` presence—easy to accidentally create a skill instead of a command.

**When to use it:** When you need to run actual tools (linters, formatters, test runners) and feed the output to AI for interpretation.

### 4. OpenCode — Template-Driven

**Location:** `.opencode/command/*.md`
**Format:** Markdown with YAML frontmatter

OpenCode uses a `template` field to define command behavior:

```markdown
---
description: Create a new React component
agent: build
model: anthropic/claude-3-5-sonnet-20241022
template: Create a React component named $ARGUMENTS with TypeScript support.
---
```

**Special syntax:**
- `$ARGUMENTS`, `$1`, `$2` — arguments
- `@filename` — include file contents
- `!`command`` — inject bash output

**What works:** The `template` field makes intent clear. This is a command, not documentation. Specifying which agent runs the command is smart—review commands go to review agent, build commands go to build agent.

**What doesn't:** Having both a `template` field AND markdown body is confusing. Which one gets sent to AI? (Answer: the template. The body is ignored.) Just use the template.

**When to use it:** When you want different agents for different commands. Your `/review` command should use a different model or prompt than your `/build` command.

### 5. Zed — Extension-Based

**Location:** Rust/WASM extension
**Format:** `extension.toml` + Rust implementation

Zed slash commands require writing a full extension:

**extension.toml:**
```toml
[slash_commands.echo]
description = "echoes the provided input"
requires_argument = true
```

**src/lib.rs:**
```rust
use zed_extension_api::{SlashCommand, SlashCommandOutput};

fn run_slash_command(
    command: SlashCommand,
    args: Vec<String>,
) -> Result<SlashCommandOutput, String> {
    match command.name.as_str() {
        "echo" => Ok(SlashCommandOutput {
            text: args.join(" "),
            sections: vec![],
        }),
        _ => Err(format!("Unknown command: {}", command.name)),
    }
}
```

**What works:** Full control. Your slash command can do anything Rust can do. Call APIs, parse complex formats, interact with the filesystem—no limits.

**What doesn't:** You have to write Rust. Compile to WASM. Publish to extension registry. For "generate a test file," this is massive overkill.

**When to use it:** When you're building a full extension anyway (language server, theme, debugger) and want to add commands. Not worth it for standalone commands.

**Also:** Zed has built-in slash commands in `.rules` files (`/default`, `/diagnostics`, `/file`, etc.) but these are fixed—you can't add custom ones without an extension.

### 6. Gemini CLI — TOML Commands

**Location:** `.gemini/commands/*.toml`
**Format:** TOML configuration files

Gemini CLI uses standalone TOML files for slash commands. Drop a file in `.gemini/commands/`, it auto-loads.

**Format:**
```toml
prompt = """
Review the code for:
- Security vulnerabilities
- Performance issues
- Best practices violations

Provide specific, actionable feedback.
"""

description = "Comprehensive code review"
```

**What works:** Dead simple. Two fields (`prompt` and `description`). No frontmatter. No special syntax. TOML auto-loads from the directory. Perfect for standardized prompts.

**What doesn't:** Zero dynamic features. No arguments (`$1`, `$ARGUMENTS`). No file references. No bash execution. The prompt is static—same text every time. Want to pass a filename? Can't do it.

**When to use it:** Simple, reusable prompts that don't need customization. Code review checklists, generation templates, or standard analysis patterns that work the same every time.

### 7. Codex — AGENTS.md Sections

**Location:** `AGENTS.md` or `.cursorrules` with command sections
**Format:** Markdown sections

Codex doesn't have a dedicated slash command format. Commands are sections within larger configuration files. Support is indirect—more about progressive disclosure than dedicated command files.

## Feature Comparison

| Feature | Claude | Cursor | Factory | OpenCode | Zed | Gemini | Codex |
|---------|--------|--------|---------|----------|-----|--------|-------|
| **File references** (`@`) | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Bash execution** (`!`) | ✅ | ❌ | ✅ (scripts) | ✅ | ✅ (Rust) | ❌ | ❌ |
| **Arguments** (`$1`, `$ARGUMENTS`) | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Namespacing** (subdirs) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Model override** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Tool restrictions** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Executable scripts** | ❌ | ❌ | ✅ | ❌ | ✅ (Rust) | ❌ | ❌ |
| **Agent routing** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Team sharing** | ❌ | ✅ (Dashboard) | ❌ | ❌ | ✅ (Extensions) | ❌ | ❌ |
| **Standalone files** | ✅ | ✅ | ✅ | ✅ | ❌ (Extension) | ✅ | ❌ |

## What PRPM Does

PRPM converts between all these formats. Write a slash command once, install it across Claude, Cursor, Factory Droid, OpenCode, and Zed.

**Example:**

1. Write a command in Claude format (most features):
```markdown
---
allowed-tools: Bash(git *)
argument-hint: <message>
description: Quick conventional commit
---

# 🚀 Quick Commit

Status: !`git status --short`
Create conventional commit: $ARGUMENTS
```

2. Publish to PRPM:
```bash
prpm publish
```

3. Install in Cursor:
```bash
prpm install @you/quick-commit --as cursor
```

PRPM converts it:
```markdown
# Quick Commit

Create conventional commit based on current git status.

When invoked, check git status and create a conventional commit with the provided message.
```

Features that don't translate (bash execution, arguments) get converted to plain instructions. Cursor gets a functional command. Claude users get the advanced version.

## Recommendations

**Use Claude Code format** if you want maximum power. File references and bash execution eliminate entire classes of repetitive tasks.

**Use Cursor format** for simple, team-wide commands. The Dashboard makes distribution trivial.

**Use Factory Droid** if your commands need to run actual tools. Executable scripts + AI interpretation is underrated.

**Use OpenCode** if you have multiple specialized agents and want routing built-in.

**Skip Zed and Gemini** for standalone commands. Extension overhead isn't worth it unless you're building something bigger.

**Write commands in Claude format, convert with PRPM.** Even if you only use Cursor, having the canonical version in the most expressive format means you can convert it later without losing intent.

## What's Missing (Everywhere)

None of these formats support:

1. **Command composition** — Can't call `/test` from within `/review`
2. **Conditional logic** — No "if branch is main, do X, else do Y"
3. **State persistence** — Commands can't remember previous runs
4. **Output validation** — No way to ensure command ran successfully
5. **Versioning** — Commands update, break, no rollback

Some of these (composition, validation) could be added without breaking existing formats. Others (state, logic) would require rethinking what a slash command is.

For now, slash commands are stateless, single-purpose triggers. That's enough to be useful. But there's room to grow.

## Try It

Install PRPM:
```bash
npm install -g prpm
```

Browse slash command packages:
```bash
prpm search subtype:slash-command
```

Install one:
```bash
prpm install @example/conventional-commits
```

Convert between formats:
```bash
prpm convert my-command.md --from claude --to cursor
```

Have thoughts on slash command design? [Open an issue](https://github.com/pr-pm/prpm/issues) or message us on [Twitter](https://twitter.com/prpmdev).

---

*This comparison is based on January 2025 implementations. Features change. If we missed something or got something wrong, [let us know](https://github.com/pr-pm/prpm/issues).*
