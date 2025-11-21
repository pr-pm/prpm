# OpenCode Support: Why Custom Tools Matter More Than Another Format

We just added OpenCode support to PRPM. On the surface, this looks like checking another box in the endless list of AI editor formats. But there's something here worth paying attention to: custom tools.

## The Format Part (Quick Version)

OpenCode agents live in `.opencode/agent/` as markdown files with YAML frontmatter. Standard stuff - you get description, model selection, temperature control, and tool permissions. We built the converters, wrote the schema, wired up the filesystem. You can install OpenCode packages now:

```bash
prpm install some-package --as opencode
```

Done. But that's not the interesting part.

## Custom Tools: The Actually Interesting Part

Most AI editors give you a fixed set of tools. Claude Code has Read, Write, Edit, Bash, Grep, Glob, WebFetch, WebSearch. Cursor has similar. You work within those constraints.

OpenCode lets you define your own tools. Here's what that looks like:

```typescript
// .opencode/tool/get-jira-ticket.ts
import { tool } from 'ai';
import { z } from 'zod';

export const getJiraTicket = tool({
  description: 'Fetch a Jira ticket by ID',
  parameters: z.object({
    ticketId: z.string().describe('The Jira ticket ID (e.g., PROJ-123)'),
  }),
  execute: async ({ ticketId }) => {
    const response = await fetch(`https://your-domain.atlassian.net/rest/api/3/issue/${ticketId}`, {
      headers: { Authorization: `Basic ${process.env.JIRA_API_TOKEN}` }
    });
    return await response.json();
  },
});
```

Now your AI agent can call `getJiraTicket("PROJ-123")` directly. No prompting, no copy-paste, no "go check Jira and come back." The agent just does it.

## What This Actually Enables

**Company-specific workflows**: Your standup bot can pull yesterday's merged PRs from GitHub, check deployment status from your internal API, and format the update in your team's template. One tool call.

**Domain expertise**: A legal review agent with tools that check contract clauses against your company's standard terms, query your internal precedent database, and verify compliance requirements.

**External service integration**: Database query tools that run read-only SQL against production, monitoring tools that check error rates, analytics tools that pull metrics. The agent stops being a chatbot and starts being an operator.

**Multi-language execution**: The tool definition is TypeScript, but the execute function can shell out to Python, call a Go binary, invoke a Rust CLI. Whatever works.

## The Catch

Custom tools require maintenance. That Jira integration breaks when Atlassian changes their API. The database query tool needs permission management. The deployment checker needs credentials rotation.

This isn't like installing a package and forgetting about it. Custom tools are code you own, with all the responsibility that implies.

## Why PRPM Should Care

Right now, PRPM converts packages between formats. Cursor rule → Claude agent → Continue prompt. Works great for prompts and configurations.

Custom tools change the equation. A tool is executable code with dependencies. Converting an OpenCode tool to Cursor means either:

1. Dropping the tool entirely (lossy conversion)
2. Converting it to a Cursor plugin (if Cursor supports that pattern)
3. Inlining instructions to prompt the agent to ask the user to run the tool manually (terrible UX)

None of these are good. But that's also the opportunity: if we handle custom tools properly in PRPM, we enable cross-editor tool sharing in a way that doesn't exist yet.

## What We're Thinking About

**Tool registry**: Searchable, installable tools separate from agents. `prpm install tools/jira-integration` that works across OpenCode, Claude Code (if they add custom tools), and potentially Cursor.

**Conversion strategies**: Detecting when a tool can be automatically converted (HTTP request → equivalent in another format) vs. when it needs manual adaptation.

**Security model**: Tools execute code. That requires sandboxing, permission prompts, and audit logging. Getting this wrong means supply chain attacks.

**Standard library**: Common tools (HTTP requests, file operations, database queries) that most people need, maintained and secured centrally.

## The Bigger Picture

We're moving from "AI editors with prompts" to "AI editors with capabilities." Custom tools blur the line between agent and automation. An agent with the right tools is just a workflow that decides its own steps.

That's where this is heading. The format support is table stakes. The tools are the actual feature.

---

*OpenCode support is live in PRPM now. Try it: `prpm search opencode` to find packages, or publish your own OpenCode agents. Custom tool conversion is coming - we'll share details as we figure out the right approach.*
