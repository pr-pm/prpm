# Zed Format Specification

**File Location:** `.rules` at project root
**Alternative Files (Priority Order):**
- `.cursorrules`
- `.windsurfrules`
- `.clinerules`
- `.github/copilot-instructions.md`
- `AGENT.md`
- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`

**Format:** Plain Markdown (NO frontmatter)
**Official Docs:** https://zed.dev/docs/assistant/assistant-settings

## Overview

Zed is a high-performance code editor that supports AI coding assistants. Zed reads plain markdown files containing coding instructions and best practices for AI assistants. The first matching file from the priority list above is used (no merging).

## File Format

Zed uses plain markdown without any YAML frontmatter or special syntax:

- **Plain Markdown Only**: No frontmatter, no JSON, just pure markdown
- **Standard Markdown**: Headings, lists, code blocks, emphasis, links
- **First Match Wins**: Zed reads the first file it finds from the priority list
- **No Merging**: Only one file is loaded per project

## File Priority Order

When multiple instruction files exist, Zed uses this priority:

1. `.rules` (primary Zed file)
2. `.cursorrules` (Cursor compatibility)
3. `.windsurfrules` (Windsurf compatibility)
4. `.clinerules` (Cline compatibility)
5. `.github/copilot-instructions.md` (Copilot compatibility)
6. `AGENT.md` (singular, legacy)
7. `AGENTS.md` (universal agent format)
8. `CLAUDE.md` (Claude Code compatibility)
9. `GEMINI.md` (Gemini CLI compatibility)

## Format Examples

### Basic Rules File

`.rules`:
```markdown
# TypeScript Development Guidelines

Follow these standards when working with TypeScript code.

## Code Style

- Use const over let
- Prefer functional components
- Always add explicit types
- Keep functions under 50 lines

## Testing

Write comprehensive unit tests for all business logic using Vitest.

## Example

\`\`\`typescript
function getUserById(id: string): Promise<User> {
  return db.users.findOne({ id });
}
\`\`\`
```

### API Development Standards

`.rules`:
```markdown
# API Development Standards

When working on API endpoints:

1. Use REST conventions
2. Always validate input
3. Return proper HTTP status codes
4. Include error messages in responses

## Example

\`\`\`typescript
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  const user = await db.users.findOne({ id });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});
\`\`\`
```

### React Component Guidelines

`.rules`:
```markdown
# React Component Standards

## Component Structure

- Use functional components with hooks
- Keep components under 200 lines
- Extract logic into custom hooks
- Co-locate styles with components

## Example: Good Component

\`\`\`tsx
function UserProfile({ userId }: Props) {
  const user = useUser(userId);

  return (
    <div className={styles.profile}>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
\`\`\`

## Example: Avoid

❌ Don't use class components:

\`\`\`tsx
class UserProfile extends React.Component {
  render() {
    return <div>...</div>;
  }
}
\`\`\`
```

---

## Zed Extensions

**Extension Location:**
- **macOS:** `~/Library/Application Support/Zed/extensions`
- **Linux:** `$XDG_DATA_HOME/zed/extensions` or `~/.local/share/zed/extensions`
- **Windows:** `%LOCALAPPDATA%\Zed\extensions`

**Extension Format:** `extension.toml` manifest

Zed extensions are different from coding instructions. Extensions are plugins written in Rust and compiled to WebAssembly. They support:

- Language support (syntax highlighting, LSP)
- Debuggers
- Themes
- Slash commands
- MCP (Model Context Protocol) servers

**Note:** PRPM focuses on AI coding instructions (`.rules` files), not Zed extensions. For extension development, see https://zed.dev/docs/extensions/developing-extensions

---

## Best Practices

1. **Keep It Simple**: Plain markdown only, no frontmatter needed
2. **Be Specific**: Provide concrete examples with code blocks
3. **Use Headings**: Organize rules into clear sections
4. **Add Context**: Explain *why* rules exist, not just *what* they are
5. **Code Examples**: Show good and bad examples with actual code
6. **Priority Awareness**: If using multiple compatible files, remember only first match is used

## Conversion Notes

### From Canonical to Zed

PRPM converts canonical packages to plain markdown:

- Strips all frontmatter and metadata
- Converts to clean markdown format
- Skips persona and tools sections (not supported)
- Preserves instructions, rules, examples, and context
- Can target alternative filenames (`.cursorrules`, `AGENTS.md`, etc.)

### From Zed to Canonical

PRPM parses plain markdown:

- Detects as Zed if no frontmatter and no JSON
- Uses markdown parser for section extraction
- Sets format and sourceFormat to `zed`
- Preserves all markdown structure and content

## Round-Trip Conversion

Zed ↔ Canonical conversion is lossless for plain markdown content:

- ✅ Headings preserved
- ✅ Lists preserved
- ✅ Code blocks preserved
- ✅ Emphasis and formatting preserved
- ❌ Persona information lost (not supported by Zed)
- ❌ Tool definitions lost (not supported by Zed)

## Differences from Other Formats

**vs Cursor:**
- Zed: Plain markdown only, no frontmatter
- Cursor: MDC format with YAML frontmatter (description, globs, alwaysApply)

**vs Claude:**
- Zed: Plain markdown, no frontmatter
- Claude: Markdown with optional frontmatter (name, description, tags)

**vs Continue:**
- Zed: Plain markdown, no structure required
- Continue: JSON format with system message and context files

**vs agents.md:**
- Zed: Reads `AGENTS.md` as one of many compatible formats
- agents.md: Universal format specifically designed for agents.md standard

---

## Migration Tips

1. **From Cursor**: Use PRPM to convert `.cursor/rules/*.mdc` to `.rules`
2. **From Claude**: Use PRPM to convert `CLAUDE.md` to `.rules`
3. **From Copilot**: Rename `.github/copilot-instructions.md` to `.rules` (or keep both)
4. **From Windsurf**: Rename `.windsurfrules` to `.rules` (or keep for compatibility)
5. **Universal Approach**: Use `AGENTS.md` for maximum compatibility across editors

## Example: Multi-Editor Support

To support multiple editors with one file:

```bash
# Option 1: Use AGENTS.md (supported by Zed, Cursor, Copilot, etc.)
cp .rules AGENTS.md

# Option 2: Create symlinks
ln -s .rules .cursorrules
ln -s .rules AGENTS.md
ln -s .rules CLAUDE.md

# Option 3: Use PRPM to convert and install to multiple formats
prpm convert .rules --to cursor --to claude --to agents.md
```

---

## Limitations

- **No Frontmatter Support**: Cannot specify file patterns or metadata
- **No Versioning**: No built-in version tracking
- **No Agents**: Zed doesn't have agent packages (just instructions)
- **No Skills/Plugins**: No native support for advanced package types
- **First Match Only**: Doesn't merge multiple instruction files
- **Extension System Separate**: Extensions are Rust/WASM, not markdown instructions

## Supported by PRPM

- ✅ Reading `.rules` files
- ✅ Converting to/from all compatible formats
- ✅ Generating alternative filenames (`.cursorrules`, `AGENTS.md`, etc.)
- ✅ Round-trip conversion (Zed → Canonical → Zed)
- ✅ Progressive disclosure (fallback to AGENTS.md)
- ❌ Zed extension development (out of scope)
