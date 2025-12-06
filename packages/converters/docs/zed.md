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

### Slash Commands in Rules

**Support:** Text threads only
**Official Docs:** https://zed.dev/docs/ai/text-threads#slash-commands-in-rules

Zed supports slash commands within `.rules` files for dynamic content insertion. Slash commands must be on their own line and are evaluated when the text thread is created.

**Available Slash Commands:**

| Command | Description |
|---------|-------------|
| `/default` | Inserts default rule |
| `/diagnostics` | Injects language server errors/warnings |
| `/fetch` | Retrieves webpage content |
| `/file` | Inserts file or directory contents |
| `/now` | Adds current date and time |
| `/prompt` | Adds custom-configured prompt |
| `/symbols` | Inserts current tab's symbols |
| `/tab` | Inserts active tab or all tab contents |
| `/terminal` | Inserts terminal output lines |
| `/selection` | Inserts selected text |

**Example with Slash Commands:**

`.rules`:
```markdown
# Code Review Assistant

You are an expert Rust engineer reviewing a project.

Here is the project configuration:

/file Cargo.toml

Here are the current diagnostics:

/diagnostics

Review the code and provide feedback.
```

**Important Notes:**
- Slash commands only work in **text threads**, not other AI interaction modes
- Commands are evaluated once when the thread is created (not continuously updated)
- Can be nested within other rules for dynamic context injection
- Must be on their own line

---

## Zed Extensions

**Extension Location:**
- **macOS:** `~/Library/Application Support/Zed/extensions`
- **Linux:** `$XDG_DATA_HOME/zed/extensions` or `~/.local/share/zed/extensions`
- **Windows:** `%LOCALAPPDATA%\Zed\extensions`

**Extension Format:** `extension.toml` manifest with Rust/WebAssembly code
**Official Docs:** https://zed.dev/docs/extensions/developing-extensions

Zed extensions are different from coding instructions. Extensions are plugins written in Rust and compiled to WebAssembly.

### Extension Capabilities

- **Language Support**: Syntax highlighting, LSP integration, tree-sitter grammars
- **Debuggers**: Debugging protocol adapters
- **Themes**: Color schemes and UI themes
- **Slash Commands**: Custom `/command` implementations for the Assistant
- **MCP Servers**: Model Context Protocol server integrations

### Extension Structure

**Required Files:**
- `extension.toml` - Manifest with metadata, dependencies, and features
- `Cargo.toml` - Rust package configuration
- `src/lib.rs` - Rust implementation

**Extension Manifest Example (`extension.toml`):**
```toml
id = "my-extension"
name = "My Extension"
description = "Custom development tools"
version = "0.1.0"
authors = ["Your Name"]
repository = "https://github.com/username/my-extension"
license = "MIT"

[slash_commands.echo]
description = "echoes the provided input"
requires_argument = true

[slash_commands.greet]
description = "greets the user"
requires_argument = false
```

**Rust Implementation Example (`src/lib.rs`):**
```rust
use zed_extension_api::{self as zed, SlashCommand, SlashCommandOutput};

struct MyExtension;

impl zed::Extension for MyExtension {
    fn run_slash_command(
        &self,
        command: SlashCommand,
        args: Vec<String>,
        worktree: Option<&zed::Worktree>,
    ) -> Result<SlashCommandOutput, String> {
        match command.name.as_str() {
            "echo" => {
                let text = args.join(" ");
                Ok(SlashCommandOutput {
                    text,
                    sections: vec![],
                })
            }
            "greet" => {
                Ok(SlashCommandOutput {
                    text: "Hello from my extension!".to_string(),
                    sections: vec![],
                })
            }
            _ => Err(format!("Unknown command: {}", command.name)),
        }
    }
}

zed::register_extension!(MyExtension);
```

### License Requirements

**Accepted Licenses (as of October 1st, 2025):**
- MIT
- Apache-2.0
- BSD-3-Clause
- GPL-3.0

**Important:** Extensions MUST specify one of these licenses in `extension.toml` to be published to the Zed extension registry.

### Development Workflow

1. **Install Rust**: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. **Create Extension**: Use `zed_extension_api` crate
3. **Local Testing**: In Zed, click "Install Dev Extension" and select your extension directory
4. **Debugging**: Check `zed.log` or run `zed --foreground` for live output
5. **Publishing**:
   - Fork `zed-industries/extensions`
   - Add extension as Git submodule
   - Update `extensions.toml`
   - Open pull request

**Note:** PRPM currently focuses on AI coding instructions (`.rules` files) and slash command definitions, not full Zed extension development with Rust/WASM. For complete extension development, see https://zed.dev/docs/extensions/developing-extensions

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
