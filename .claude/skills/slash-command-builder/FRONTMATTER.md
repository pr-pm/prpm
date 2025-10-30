# Slash Command Frontmatter Reference

Complete reference for all frontmatter options in Claude Code slash commands.

## Basic Structure

```yaml
---
description: Brief description
argument-hint: [arg1] <arg2>
allowed-tools: Tool1, Tool2(pattern)
model: model-id
disable-model-invocation: false
---
```

## Field Reference

### `description` (Required for Auto-Invocation)

**Purpose:** Brief description shown in autocomplete menu

**Format:** String, single line

**Best Practices:**
- Keep under 60 characters
- Start with action verb
- Be specific to avoid false auto-invocation

**Examples:**
```yaml
description: Review pull request for code quality
description: Generate TypeScript component boilerplate
description: Run database migrations
```

**Note:** Commands without `description` won't appear in autocomplete or be auto-invokable by Claude.

---

### `argument-hint`

**Purpose:** Show expected arguments in autocomplete

**Format:** Space-separated argument list

**Syntax:**
- `[required-arg]` - Required argument (square brackets)
- `<optional-arg>` - Optional argument (angle brackets)
- `[choices: a|b|c]` - Enum/choice arguments
- Free-form text for complex hints

**Examples:**
```yaml
# Simple required args
argument-hint: [pr-number] [reviewer]

# Mix of required and optional
argument-hint: [file-path] <format: json|yaml>

# Descriptive hints
argument-hint: [component-name] [type: class|functional] <props>

# No args (omit field entirely)
# (no argument-hint field)
```

---

### `allowed-tools`

**Purpose:** Restrict which tools Claude can use when executing command

**Format:** Comma-separated list of tool names with optional patterns

**Available Tools:**
- `Bash` - Execute shell commands
- `Read` - Read files
- `Write` - Write/create files
- `Edit` - Edit existing files
- `Glob` - Find files by pattern
- `Grep` - Search file contents
- `WebFetch` - Fetch web content
- `WebSearch` - Search the web

**Pattern Syntax:**

**Bash patterns:**
```yaml
# Allow all git commands
allowed-tools: Bash(git *)

# Allow specific git commands
allowed-tools: Bash(git status:*), Bash(git diff:*)

# Allow multiple commands
allowed-tools: Bash(npm *), Bash(node *)
```

**File patterns:**
```yaml
# Read TypeScript files
allowed-tools: Read(**/*.ts)

# Read specific directory
allowed-tools: Read(src/**/*.js)

# Write to specific location
allowed-tools: Write(docs/*.md)

# Multiple file tools
allowed-tools: Read, Write(output/*.json), Edit(**/*.ts)
```

**Wildcards:**
- `*` - Any single path segment
- `**` - Any number of path segments
- `?` - Single character

**Examples:**
```yaml
# Safe git status only
allowed-tools: Bash(git status:*)

# Read and write tests
allowed-tools: Read(**/*.test.ts), Write(**/*.test.ts)

# Full file access
allowed-tools: Read, Write, Edit

# Web research
allowed-tools: WebSearch, WebFetch

# Common development workflow
allowed-tools: Bash(git *), Bash(npm *), Read, Write
```

**Security Note:** Be specific with permissions. `Bash` allows ALL commands, which is dangerous. Use `Bash(git *)` instead.

---

### `model`

**Purpose:** Override default model for this command

**Format:** Model identifier string

**Available Models:**
- `claude-3-5-haiku-20241022` - Fast, low-cost (simple tasks)
- `claude-3-5-sonnet-20241022` - Balanced (default for most commands)
- `claude-opus-4-20250514` - Powerful, expensive (complex reasoning)

**When to Override:**

**Use Haiku for:**
- Simple formatting tasks
- Quick syntax fixes
- Repetitive operations
- Low-latency needs

**Use Sonnet for:**
- General purpose commands (default)
- Code reviews
- Documentation generation

**Use Opus for:**
- Complex architectural decisions
- Deep code analysis
- Creative problem-solving

**Examples:**
```yaml
# Fast formatting
model: claude-3-5-haiku-20241022

# Default (can omit)
model: claude-3-5-sonnet-20241022

# Complex analysis
model: claude-opus-4-20250514
```

**Cost Consideration:** Opus is ~15x more expensive than Haiku. Use appropriately.

---

### `disable-model-invocation`

**Purpose:** Prevent Claude from auto-invoking this command

**Format:** Boolean (`true` or `false`)

**Default:** `false` (command can be auto-invoked)

**When to Disable:**
- Destructive operations (delete files, reset databases)
- Commands requiring human confirmation
- Expensive API calls
- Commands with side effects

**Examples:**
```yaml
# Destructive command
disable-model-invocation: true

# Safe to auto-invoke (default)
disable-model-invocation: false
```

**Use Cases:**

**Disable for:**
```markdown
---
description: Delete all node_modules
disable-model-invocation: true
---
!`find . -name node_modules -type d -exec rm -rf {} +`
```

**Allow for:**
```markdown
---
description: Show git status
disable-model-invocation: false
---
!`git status`
```

---

## Complete Examples

### Minimal Command (Description Only)

```markdown
---
description: Format code with prettier
---

Format the current file using prettier with project settings.
```

### Simple Command with Args

```markdown
---
description: Create React component
argument-hint: [component-name]
---

Generate a React functional component named $1 with TypeScript.
```

### Safe Command with Tool Restrictions

```markdown
---
description: Review git changes
allowed-tools: Bash(git status:*), Bash(git diff:*)
---

Show current changes:

!`git status`
!`git diff`
```

### Fast Command with Haiku

```markdown
---
description: Fix ESLint errors
model: claude-3-5-haiku-20241022
allowed-tools: Read, Edit
---

Automatically fix ESLint errors in current file.
```

### Destructive Command (Disabled Auto-Invoke)

```markdown
---
description: Reset database
disable-model-invocation: true
allowed-tools: Bash(npm run db:reset:*)
---

**WARNING:** This will delete all data.

!`npm run db:reset`
```

### Full-Featured Command

```markdown
---
description: Deploy to production environment
argument-hint: [environment: staging|prod] <version>
allowed-tools: Bash(git *), Bash(npm *), Bash(docker *)
model: claude-3-5-sonnet-20241022
disable-model-invocation: true
---

Deploy to $1 environment${2:+ version $2}:

1. Verify git status
!`git status`

2. Run tests
!`npm test`

3. Build for production
!`npm run build`

4. Deploy
!`docker compose -f docker-compose.$1.yml up -d`

Deployment complete to $1.
```

---

## Frontmatter Validation

### Common Errors

**Invalid YAML syntax:**
```yaml
# ❌ Wrong
description: Review code
argument-hint [file]  # Missing colon

# ✅ Correct
description: Review code
argument-hint: [file]
```

**Wrong data types:**
```yaml
# ❌ Wrong
disable-model-invocation: "true"  # String, not boolean

# ✅ Correct
disable-model-invocation: true
```

**Typos in field names:**
```yaml
# ❌ Wrong
descripton: Review code  # Typo

# ✅ Correct
description: Review code
```

### Testing Frontmatter

1. Save command file
2. Restart Claude Code (if needed)
3. Type `/` to see if command appears
4. Check description shows correctly
5. Verify argument hints display
6. Test tool permissions work

---

## Best Practices Summary

1. **Always include `description`** for discoverability
2. **Use specific `allowed-tools` patterns** for security
3. **Choose appropriate `model`** for cost/performance balance
4. **Add `argument-hint`** to guide users
5. **Disable auto-invocation** for destructive commands
6. **Keep frontmatter minimal** - only add what you need
7. **Test after changes** to ensure YAML is valid

---

## Related Files

- **SKILL.md** - Main slash command builder guide
- **EXAMPLES.md** - Real-world command examples
- **PATTERNS.md** - Common command patterns
