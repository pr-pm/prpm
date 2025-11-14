---
description: Guidelines for creating Claude Code agents with proper frontmatter, persona definition, and schema validation
globs:
  - "**/.claude/agents/*.md"
  - "**/.claude/agents/*.markdown"
  - "**/claude-agents.md"
  - "**/creating-claude-agents.md"
---

# Creating Claude Code Agents

Claude Code agents are long-running AI assistants with tool access that perform complex, multi-step tasks. This guide ensures agents conform to the required format and schema.

## File Location

Agents must be placed in `.claude/agents/` directory as markdown files:

```
.claude/agents/agent-name.md
```

## Format Requirements

### Frontmatter

All agents require YAML frontmatter with required and optional fields:

```yaml
---
name: agent-name                    # REQUIRED: lowercase, hyphens only, max 64 chars
description: Brief description      # REQUIRED: max 1024 chars
allowed-tools: Read, Write, Bash    # OPTIONAL: comma-separated list
model: sonnet                       # OPTIONAL: sonnet|opus|haiku|inherit
agentType: agent                    # OPTIONAL: explicit type marker
---
```

#### Required Fields

- **name** (string): Agent identifier
  - Pattern: `^[a-z0-9-]+$`
  - Only lowercase letters, numbers, and hyphens
  - Max length: 64 characters
  - Examples: `code-reviewer`, `debugger`, `data-scientist`

- **description** (string): Human-readable description
  - Max length: 1024 characters
  - Should clearly explain when to use the agent
  - Start with action words: "Reviews...", "Analyzes...", "Helps with..."

#### Optional Fields

- **allowed-tools** (string): Comma-separated list of available tools
  - Valid tools: `Read`, `Write`, `Edit`, `Grep`, `Glob`, `Bash`, `WebSearch`, `WebFetch`, `Task`, `Skill`, `SlashCommand`, `TodoWrite`, `AskUserQuestion`
  - Omit to inherit all tools from parent conversation
  - Examples:
    - `Read, Grep` - Read-only access
    - `Read, Edit, Bash(git *)` - Edit files and git commands only
    - `Read, Write, Bash` - Full file and command access

- **model** (string): Claude model to use
  - Values: `sonnet` (default), `opus`, `haiku`, `inherit`
  - Use `opus` for complex reasoning
  - Use `haiku` for speed-critical tasks
  - Use `inherit` to match parent conversation

- **agentType** (string): Explicit marker
  - Value: `agent`
  - Preserves type information during format conversions

### Content Structure

Content must follow this structure:

```markdown
# 🔍 Agent Display Name

You are [persona definition - describe the agent's role and expertise].

## Instructions

[What the agent does and how it approaches tasks]

## Process

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Examples

[Code samples and use cases]

## Guidelines

- [Best practice 1]
- [Best practice 2]
```

#### H1 Heading (Required)

- First line of content must be H1 with emoji icon
- Use title case
- Include relevant emoji for visual distinction
- Examples: `# 🔍 Code Reviewer`, `# 🐛 Debugger`, `# 📊 Data Scientist`

#### Persona Definition (Required)

- Start with "You are..."
- Define role and expertise clearly
- Set expectations for capabilities and approach
- Example: `You are an expert code reviewer with deep knowledge of software engineering principles and security best practices.`

## Schema Validation

Agents must conform to the JSON schema at:

**Schema URL:**
```
https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-agent.schema.json
```

### Valid Example

```markdown
---
name: code-reviewer
description: Reviews code changes for quality, security, and maintainability issues
allowed-tools: Read, Grep, Bash(git *)
model: sonnet
agentType: agent
---

# 🔍 Code Reviewer

You are an expert code reviewer with deep knowledge of software engineering principles.

## Instructions

Review code changes thoroughly for:
1. Code quality and readability
2. Security vulnerabilities
3. Performance issues
4. Best practices adherence
5. Test coverage

## Process

1. **Read the changes**
   - Get recent git diff or specified files
   - Understand the context and purpose

2. **Analyze systematically**
   - Check each category (quality, security, performance, etc.)
   - Provide specific file:line references
   - Explain why something is an issue

3. **Provide actionable feedback**
   Format findings by severity with specific fix recommendations.

## Examples

When reviewing error handling:

❌ **Bad - Silent failure:**
\`\`\`typescript
try {
  await fetchData();
} catch (error) {
  console.log(error);
}
\`\`\`

✅ **Good - Proper error handling:**
\`\`\`typescript
try {
  await fetchData();
} catch (error) {
  logger.error('Failed to fetch data', error);
  throw new AppError('Data fetch failed', { cause: error });
}
\`\`\`

## Guidelines

- Provide specific file:line references for all issues
- Explain the "why" behind each recommendation
- Include code examples in feedback
- Focus on what matters, be thorough but concise
```

## Common Validation Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Missing required field 'name' | No name in frontmatter | Add `name: agent-name` |
| Missing required field 'description' | No description in frontmatter | Add `description: ...` |
| Invalid name pattern | Uppercase or special characters | Use lowercase and hyphens only |
| Name too long | Exceeds 64 characters | Shorten the name |
| Invalid model value | Model not in enum | Use: `sonnet`, `opus`, `haiku`, or `inherit` |
| Missing H1 heading | Content doesn't start with # | Add `# Agent Name` as first line |
| No persona definition | Missing "You are..." | Add persona after H1 |

## Tool Configuration

### Grant Minimal Permissions

Follow principle of least privilege:

```yaml
# Read-only analysis
allowed-tools: Read, Grep

# Code modification
allowed-tools: Read, Edit, Bash(git *)

# Full development
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
```

### Bash Tool Restrictions

Use command patterns to restrict Bash access:

```yaml
# Only git commands
allowed-tools: Bash(git *), Read

# Only npm test scripts
allowed-tools: Bash(npm test:*), Read

# Multiple specific commands
allowed-tools: Bash(git status:*), Bash(git diff:*), Read
```

### Inherit All Tools

Omit `allowed-tools` field to inherit all tools from parent conversation:

```yaml
---
name: full-access-agent
description: Agent with access to all available tools
# No allowed-tools field = inherits all
---
```

## Model Selection

Choose the appropriate model for the agent's complexity:

### Sonnet (Default)
Use for most agents - balanced performance:
- Code review
- Debugging
- Data analysis
- General problem-solving

```yaml
model: sonnet
```

### Opus (Complex Reasoning)
Use for sophisticated analysis:
- Architecture decisions
- Complex refactoring
- Deep security analysis
- Novel problem-solving

```yaml
model: opus
```

### Haiku (Speed)
Use for simple, fast tasks:
- Syntax checks
- Simple formatting
- Quick validations
- Low-latency needs

```yaml
model: haiku
```

### Inherit (Context-Dependent)
Use to match parent conversation:
- Cost-sensitive scenarios
- User preference respect

```yaml
model: inherit
```

## Best Practices

### 1. Single Responsibility
Each agent should excel at ONE specific task.

✅ Good:
- `code-reviewer` - Reviews code for quality and security
- `debugger` - Root cause analysis and minimal fixes

❌ Poor:
- `code-helper` - Reviews, debugs, tests, refactors (too broad)

### 2. Clear, Specific Descriptions
The description determines when Claude automatically invokes your agent.

✅ Good:
```yaml
description: Reviews code changes for quality, security, and maintainability issues
```

❌ Poor:
```yaml
description: A helpful agent  # Too vague
description: Does code stuff  # Not specific
```

### 3. Strong Persona Definitions
Establish expertise immediately after H1:

```markdown
You are an expert TypeScript developer with 10+ years of experience in building scalable web applications. You specialize in React, Node.js, and modern JavaScript patterns, with a focus on type safety and maintainability.
```

### 4. Step-by-Step Processes
Guide the agent's workflow explicitly:

```markdown
## Process

1. **Gather Context**
   - Read relevant files
   - Check recent changes
   - Understand the goal

2. **Analyze Systematically**
   - Apply quality checks
   - Verify patterns
   - Identify issues

3. **Provide Feedback**
   - Categorize by severity
   - Include file:line refs
   - Suggest fixes
```

### 5. Include Examples
Show both good and bad patterns:

```markdown
## Examples

❌ **Anti-pattern:**
\`\`\`typescript
// Bad code example
\`\`\`

✅ **Best practice:**
\`\`\`typescript
// Good code example
\`\`\`
```

### 6. Use Emoji Icons in H1
Choose emojis that represent the agent's purpose:
- 🔍 Code Reviewer
- 🐛 Debugger
- 📊 Data Scientist
- 🔒 Security Auditor
- ⚡ Performance Optimizer
- 📝 Documentation Writer
- 🧪 Test Generator

### 7. Always Include agentType
Preserve type information for conversions:

```yaml
---
name: my-agent
description: My agent description
agentType: agent
---
```

## Validation Checklist

Before finalizing an agent:

- [ ] Name is lowercase with hyphens only (max 64 chars)
- [ ] Description clearly explains when to use (max 1024 chars)
- [ ] Content starts with H1 heading (with emoji icon)
- [ ] Persona is defined using "You are..." format
- [ ] Process/instructions are clearly outlined
- [ ] Examples are included (good/bad patterns)
- [ ] Tool access is minimal and specific
- [ ] Model selection is appropriate
- [ ] agentType field is set to "agent"
- [ ] File is saved in `.claude/agents/` directory
- [ ] No validation errors against schema

## Example Templates

### Minimal Agent

```markdown
---
name: quick-reviewer
description: Fast code review for common issues
allowed-tools: Read, Grep
model: haiku
agentType: agent
---

# 🔍 Quick Code Reviewer

You are a code reviewer focused on catching common mistakes quickly.

## Instructions

Review code for:
- Syntax errors
- Common anti-patterns
- Missing error handling
- Console.log statements

Provide concise feedback with file:line references.
```

### Comprehensive Agent

```markdown
---
name: security-auditor
description: Deep security vulnerability analysis for code changes
allowed-tools: Read, Grep, WebSearch, Bash(git *)
model: opus
agentType: agent
---

# 🔒 Security Auditor

You are a security expert specializing in application security, with expertise in OWASP Top 10, secure coding practices, and threat modeling.

## Review Process

1. **Gather Context**
   - Read changed files
   - Review git history
   - Identify data flows

2. **Security Analysis**
   - Input validation
   - Authentication/authorization
   - SQL injection risks
   - XSS vulnerabilities
   - Secrets exposure

3. **Threat Assessment**
   - Rate severity
   - Assess exploitability
   - Provide remediation

4. **Report Findings**
   Structured format with CVE references.

## Output Format

**Security Score: X/10**

### Critical Issues
- [Vulnerability] (file:line) - [Fix]

### High Priority
- [Issue] (file:line) - [Fix]

### Best Practices
- [Positive patterns]

## Examples

❌ **Vulnerable:**
\`\`\`typescript
const query = \`SELECT * FROM users WHERE id = \${userId}\`;
\`\`\`

✅ **Safe:**
\`\`\`typescript
const query = 'SELECT * FROM users WHERE id = $1';
db.query(query, [userId]);
\`\`\`
```

## Agents vs Skills vs Commands

### Use Agents When:
- Long-running assistants with persistent context
- Complex multi-step workflows
- Specialized expertise needed
- Tool access required
- Repeatable processes with quality standards

### Use Skills When:
- Context-aware automatic activation
- Reference documentation and patterns
- Team standardization
- No persistent state needed

### Use Slash Commands When:
- Simple, focused prompts
- Quick manual invocation
- Personal productivity shortcuts
- Single-file prompts

## Schema Reference

**Official Schema:**
- GitHub: https://github.com/pr-pm/prpm/blob/main/packages/converters/schemas/claude-agent.schema.json
- Schema ID: https://prpm.dev/schemas/claude-agent.schema.json

**Required Structure:**
```json
{
  "frontmatter": {
    "name": "string (pattern: ^[a-z0-9-]+$, maxLength: 64)",
    "description": "string (maxLength: 1024)",
    "allowed-tools": "string (optional)",
    "model": "enum: sonnet|opus|haiku|inherit (optional)",
    "agentType": "string: 'agent' (optional)"
  },
  "content": "string (markdown with H1, persona, instructions)"
}
```

## Related Resources

- Agent Builder Skill: `.claude/skills/agent-builder/SKILL.md`
- Claude Code Docs: https://docs.claude.com/claude-code
- PRPM Format Spec: `/packages/converters/docs/claude.md`

## Common Mistakes to Avoid

1. Using underscores or uppercase in name: `code_reviewer` or `CodeReviewer` ❌
2. Missing H1 heading in content ❌
3. No persona definition ("You are...") ❌
4. Vague description that doesn't explain when to use ❌
5. Granting too many tools (violates least privilege) ❌
6. Missing agentType field (loses type info) ❌
7. Creating overly broad agents (should be specialized) ❌
8. No examples or process steps ❌

---

**Remember:** Great agents are specialized experts with clear personas, explicit processes, and minimal tool access. Focus each agent on doing ONE thing exceptionally well.
