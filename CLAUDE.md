* Use the `bd` tool instead of markdown to coordinate all work and tasks.
* NEVER commit changes unless the user explicitly asks you to.

# Using bv as an AI sidecar

bv is a fast terminal UI for Beads projects (.beads/beads.jsonl). It renders lists/details and precomputes dependency metrics (PageRank, critical path, cycles, etc.) so you instantly see blockers and execution order. For agents, it’s a graph sidecar: instead of parsing JSONL or risking hallucinated traversal, call the robot flags to get deterministic, dependency-aware outputs.

*IMPORTANT: As an agent, you must ONLY use bv with the robot flags, otherwise you'll get stuck in the interactive TUI that's intended for human usage only!*

- bv --robot-help — shows all AI-facing commands.
- bv --robot-insights — JSON graph metrics (PageRank, betweenness, HITS, critical path, cycles) with top-N summaries for quick triage.
- bv --robot-plan — JSON execution plan: parallel tracks, items per track, and unblocks lists showing what each item frees up.
- bv --robot-priority — JSON priority recommendations with reasoning and confidence.
- bv --robot-recipes — list recipes (default, actionable, blocked, etc.); apply via bv --recipe <name> to pre-filter/sort before other flags.
- bv --robot-diff --diff-since <commit|date> — JSON diff of issue changes, new/closed items, and cycles introduced/resolved.

Use these commands instead of hand-rolling graph logic; bv already computes the hard parts so agents can act safely and quickly.

## MCP Agent Mail: coordination for multi-agent workflows

What it is
- A mail-like layer that lets coding agents coordinate asynchronously via MCP tools and resources.
- Provides identities, inbox/outbox, searchable threads, and advisory file reservations, with human-auditable artifacts in Git.

Why it's useful
- Prevents agents from stepping on each other with explicit file reservations (leases) for files/globs.
- Keeps communication out of your token budget by storing messages in a per-project archive.
- Offers quick reads (`resource://inbox/...`, `resource://thread/...`) and macros that bundle common flows.

How to use effectively
1) Same repository
   - Register an identity: call `ensure_project`, then `register_agent` using this repo's absolute path as `project_key`.
   - Reserve files before you edit: `file_reservation_paths(project_key, agent_name, ["src/**"], ttl_seconds=3600, exclusive=true)` to signal intent and avoid conflict.
   - Communicate with threads: use `send_message(..., thread_id="FEAT-123")`; check inbox with `fetch_inbox` and acknowledge with `acknowledge_message`.
   - Read fast: `resource://inbox/{Agent}?project=<abs-path>&limit=20` or `resource://thread/{id}?project=<abs-path>&include_bodies=true`.
   - Tip: set `AGENT_NAME` in your environment so the pre-commit guard can block commits that conflict with others' active exclusive file reservations.

2) Across different repos in one project (e.g., Next.js frontend + FastAPI backend)
   - Option A (single project bus): register both sides under the same `project_key` (shared key/path). Keep reservation patterns specific (e.g., `frontend/**` vs `backend/**`).
   - Option B (separate projects): each repo has its own `project_key`; use `macro_contact_handshake` or `request_contact`/`respond_contact` to link agents, then message directly. Keep a shared `thread_id` (e.g., ticket key) across repos for clean summaries/audits.

Macros vs granular tools
- Prefer macros when you want speed or are on a smaller model: `macro_start_session`, `macro_prepare_thread`, `macro_file_reservation_cycle`, `macro_contact_handshake`.
- Use granular tools when you need control: `register_agent`, `file_reservation_paths`, `send_message`, `fetch_inbox`, `acknowledge_message`.

Common pitfalls
- "from_agent not registered": always `register_agent` in the correct `project_key` first.
- "FILE_RESERVATION_CONFLICT": adjust patterns, wait for expiry, or use a non-exclusive reservation when appropriate.
- Auth errors: if JWT+JWKS is enabled, include a bearer token with a `kid` that matches server JWKS; static bearer is used only when JWT is disabled.


## Integrating with Beads (dependency-aware task planning)

Beads provides a lightweight, dependency-aware issue database and a CLI (`bd`) for selecting "ready work," setting priorities, and tracking status. It complements MCP Agent Mail's messaging, audit trail, and file-reservation signals. Project: [steveyegge/beads](https://github.com/steveyegge/beads)

Recommended conventions
- **Single source of truth**: Use **Beads** for task status/priority/dependencies; use **Agent Mail** for conversation, decisions, and attachments (audit).
- **Shared identifiers**: Use the Beads issue id (e.g., `bd-123`) as the Mail `thread_id` and prefix message subjects with `[bd-123]`.
- **Reservations**: When starting a `bd-###` task, call `file_reservation_paths(...)` for the affected paths; include the issue id in the `reason` and release on completion.

Typical flow (agents)
1) **Pick ready work** (Beads)
   - `bd ready --json` → choose one item (highest priority, no blockers)
2) **Reserve edit surface** (Mail)
   - `file_reservation_paths(project_key, agent_name, ["src/**"], ttl_seconds=3600, exclusive=true, reason="bd-123")`
3) **Announce start** (Mail)
   - `send_message(..., thread_id="bd-123", subject="[bd-123] Start: <short title>", ack_required=true)`
4) **Work and update**
   - Reply in-thread with progress and attach artifacts/images; keep the discussion in one thread per issue id
5) **Complete and release**
   - `bd close bd-123 --reason "Completed"` (Beads is status authority)
   - `release_file_reservations(project_key, agent_name, paths=["src/**"])`
   - Final Mail reply: `[bd-123] Completed` with summary and links

Mapping cheat-sheet
- **Mail `thread_id`** ↔ `bd-###`
- **Mail subject**: `[bd-###] …`
- **File reservation `reason`**: `bd-###`
- **Commit messages (optional)**: include `bd-###` for traceability

Event mirroring (optional automation)
- On `bd update --status blocked`, send a high-importance Mail message in thread `bd-###` describing the blocker.
- On Mail "ACK overdue" for a critical decision, add a Beads label (e.g., `needs-ack`) or bump priority to surface it in `bd ready`.

Pitfalls to avoid
- Don't create or manage tasks in Mail; treat Beads as the single task queue.
- Always include `bd-###` in message `thread_id` to avoid ID drift across tools.

# 🔎 cass — Search All Your Agent History

What: cass indexes conversations from Claude Code, Codex, Cursor, Gemini, Aider, ChatGPT, and more into a unified, searchable index. Before solving a problem from scratch, check if any agent already solved something similar.

⚠️ NEVER run bare cass — it launches an interactive TUI. Always use --robot or --json.

Quick Start

# Check if index is healthy (exit 0=ok, 1=run index first)
cass health

# Search across all agent histories
cass search "authentication error" --robot --limit 5

# View a specific result (from search output)
cass view /path/to/session.jsonl -n 42 --json

# Expand context around a line
cass expand /path/to/session.jsonl -n 42 -C 3 --json

# Learn the full API
cass capabilities --json # Feature discovery
cass robot-docs guide # LLM-optimized docs

Why Use It

- Cross-agent knowledge: Find solutions from Codex when using Claude, or vice versa
- Forgiving syntax: Typos and wrong flags are auto-corrected with teaching notes
- Token-efficient: --fields minimal returns only essential data

Key Flags

| Flag | Purpose |
|------------------|--------------------------------------------------------|
| --robot / --json | Machine-readable JSON output (required!) |
| --fields minimal | Reduce payload: source_path, line_number, agent only |
| --limit N | Cap result count |
| --agent NAME | Filter to specific agent (claude, codex, cursor, etc.) |
| --days N | Limit to recent N days |

stdout = data only, stderr = diagnostics. Exit 0 = success.

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: Bash("npx openskills read <skill-name>")
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>agent-builder</name>
<description>Use when creating, improving, or troubleshooting Claude Code subagents. Expert guidance on agent design, system prompts, tool access, model selection, and best practices for building specialized AI assistants.</description>
<location>project</location>
</skill>

<skill>
<name>aws-beanstalk-expert</name>
<description>Expert knowledge for deploying, managing, and troubleshooting AWS Elastic Beanstalk applications with production best practices</description>
<location>project</location>
</skill>

<skill>
<name>beanstalk-deploy</name>
<description>"Robust deployment patterns for Elastic Beanstalk with GitHub Actions, Pulumi, and edge case handling"</description>
<location>project</location>
</skill>

<skill>
<name>claude-hook-writer</name>
<description>Expert guidance for writing secure, reliable, and performant Claude Code hooks - validates design decisions, enforces best practices, and prevents common pitfalls</description>
<location>project</location>
</skill>

<skill>
<name>creating-agents-md</name>
<description>Use when creating agents.md files - provides plain markdown format with NO frontmatter, free-form structure, and project context guidelines for AI coding assistants</description>
<location>project</location>
</skill>

<skill>
<name>creating-claude-agents</name>
<description>Use when creating or improving Claude Code agents. Expert guidance on agent file structure, frontmatter, persona definition, tool access, model selection, and validation against schema.</description>
<location>project</location>
</skill>

<skill>
<name>creating-claude-commands</name>
<description>Expert guidance for creating Claude Code slash commands with correct frontmatter, structure, and best practices</description>
<location>project</location>
</skill>

<skill>
<name>creating-claude-hooks</name>
<description>Use when creating or publishing Claude Code hooks - covers executable format, event types, JSON I/O, exit codes, security requirements, and PRPM package structure</description>
<location>project</location>
</skill>

<skill>
<name>creating-continue-packages</name>
<description>Use when creating Continue rules - provides required name field, alwaysApply semantics, glob/regex patterns, and markdown format with optional frontmatter</description>
<location>project</location>
</skill>

<skill>
<name>creating-copilot-packages</name>
<description>Use when creating GitHub Copilot instructions - provides repository-wide and path-specific formats, applyTo patterns, excludeAgent options, and natural language markdown style</description>
<location>project</location>
</skill>

<skill>
<name>creating-cursor-commands</name>
<description>Expert guidance for creating effective Cursor slash commands with best practices, format requirements, and schema validation</description>
<location>project</location>
</skill>

<skill>
<name>creating-cursor-rules-skill</name>
<description>Expert guidance for creating effective Cursor IDE rules with best practices, patterns, and examples</description>
<location>project</location>
</skill>

<skill>
<name>creating-kiro-agents</name>
<description>Use when building custom Kiro AI agents or when user asks for agent configurations - provides JSON structure, tool configuration, prompt patterns, and security best practices for specialized development assistants</description>
<location>project</location>
</skill>

<skill>
<name>creating-kiro-packages</name>
<description>Use when creating Kiro steering files or hooks - provides inclusion modes (always/fileMatch/manual), foundational files (product.md/tech.md/structure.md), and JSON hook configuration with event triggers</description>
<location>project</location>
</skill>

<skill>
<name>creating-skills</name>
<description>Use when creating new Claude Code skills or improving existing ones - ensures skills are discoverable, scannable, and effective through proper structure, CSO optimization, and real examples</description>
<location>project</location>
</skill>

<skill>
<name>creating-windsurf-packages</name>
<description>Use when creating Windsurf rules - provides plain markdown format with NO frontmatter, 12,000 character limit, and single-file structure requirements</description>
<location>project</location>
</skill>

<skill>
<name>documentation-standards</name>
<description>Standards and guidelines for organizing, structuring, and maintaining documentation in the PRPM repository - ensures consistency across user docs, development docs, and internal references</description>
<location>project</location>
</skill>

<skill>
<name>elastic-beanstalk-deployment</name>
<description>Use when deploying Node.js applications to AWS Elastic Beanstalk or troubleshooting deployment issues - provides dependency installation strategies, monorepo handling, and deployment best practices</description>
<location>project</location>
</skill>

<skill>
<name>github-actions-testing</name>
<description>Expert guidance for testing and validating GitHub Actions workflows before deployment - catches cache errors, path issues, monorepo dependencies, and service container problems that local testing misses</description>
<location>project</location>
</skill>

<skill>
<name>human-writing</name>
<description>Write content that sounds natural, conversational, and authentically human - avoiding AI-generated patterns, corporate speak, and generic phrasing</description>
<location>project</location>
</skill>

<skill>
<name>integrating-stripe-webhooks</name>
<description>Use when implementing Stripe webhook endpoints and getting 'Raw body not available' or signature verification errors - provides raw body parsing solutions and subscription period field fixes across frameworks</description>
<location>project</location>
</skill>

<skill>
<name>karen-repo-reviewer</name>
<description>Use when the user requests a repository review, code assessment, or honest evaluation of their codebase. Provides brutally honest AI-powered reviews with market-aware Karen Scores (0-100) analyzing over-engineering, completion honesty, and practical value. Available as GitHub Action or IDE tool.</description>
<location>project</location>
</skill>

<skill>
<name>postgres-migrations</name>
<description>Comprehensive guide to PostgreSQL migrations - common errors, generated columns, full-text search, indexes, idempotent migrations, and best practices for database schema changes</description>
<location>project</location>
</skill>

<skill>
<name>prpm-development</name>
<description>Use when developing PRPM (Prompt Package Manager) - comprehensive knowledge base covering architecture, format conversion, package types, collections, quality standards, testing, and deployment</description>
<location>project</location>
</skill>

<skill>
<name>prpm-json-best-practices</name>
<description>Best practices for structuring prpm.json package manifests with required fields, tags, organization, multi-package management, enhanced file format, and conversion hints</description>
<location>project</location>
</skill>

<skill>
<name>pulumi-troubleshooting</name>
<description>Comprehensive guide to troubleshooting Pulumi TypeScript errors, infrastructure issues, and best practices - covers common errors, Outputs handling, AWS Beanstalk deployment, and cost optimization</description>
<location>project</location>
</skill>

<skill>
<name>self-improving</name>
<description>Use when starting infrastructure, testing, deployment, or framework-specific tasks - automatically searches PRPM registry for relevant expertise packages and suggests installation to enhance capabilities for the current task</description>
<location>project</location>
</skill>

<skill>
<name>slash-command-builder</name>
<description>Use when creating, improving, or troubleshooting Claude Code slash commands. Expert guidance on command structure, arguments, frontmatter, tool permissions, and best practices for building effective custom commands.</description>
<location>project</location>
</skill>

<skill>
<name>thoroughness</name>
<description>Use when implementing complex multi-step tasks, fixing critical bugs, or when quality and completeness matter more than speed - ensures comprehensive implementation without shortcuts through systematic analysis, implementation, and verification phases</description>
<location>project</location>
</skill>

<skill>
<name>typescript-hook-writer</name>
<description>Expert guidance for developing Claude Code hooks in TypeScript with shared utilities, esbuild compilation, and Vitest testing - distributes compiled JS while maintaining TypeScript development experience</description>
<location>project</location>
</skill>

<skill>
<name>typescript-type-safety</name>
<description>Use when encountering TypeScript any types, type errors, or lax type checking - eliminates type holes and enforces strict type safety through proper interfaces, type guards, and module augmentation</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
