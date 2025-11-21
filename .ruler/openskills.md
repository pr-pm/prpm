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
