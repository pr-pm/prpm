# Write Once. Distribute Everywhere: Why Package Publishers Choose PRPM

**Subtitle:** The only AI package manager with lossless cross-format conversion—publish in one format, install in 24+.

**Tags:** Technical, Package Publishing, Format Conversion, Developer Experience

**Author:** PRPM Team
**Date:** December 6, 2025
**Read Time:** 10 min read

---

## The Problem Every Package Publisher Faces

You've built the perfect Cursor rule for React best practices. It took weeks to refine. Now developers using Claude Code, Continue, Windsurf, and Copilot want it too.

Your options:

1. **Maintain dozens of separate versions** - Different repos, different formats, different update cycles
2. **Pick one format and tell others "sorry"** - Lose 80% of potential users
3. **Copy-paste with manual tweaks** - Introduce bugs, forget which version has which fix
4. **Give up on multi-platform support** - Watch your package's reach plateau

None of these are good. All waste your time. And when AI tooling evolves monthly, the maintenance burden compounds.

**PRPM solves this:** Write your package once in any format. The registry handles conversion to all 24+ formats automatically. Users get the right format for their editor. You publish once.

---

## How It Works: The Technical Reality

PRPM doesn't just transform text files. It performs **lossless, semantically-aware conversions** that preserve format-specific features while adapting to each platform's conventions.

### Real Example: Cursor Multi-File Rules

Say you publish a Cursor rule that references multiple files with `@file` syntax:

```markdown
---
description: React TypeScript best practices
globs:
  - "**/*.tsx"
  - "**/*.ts"
---

# React Component Standards

When creating components, reference @components/Button.tsx for the canonical
pattern. All components must follow @docs/architecture.md conventions.

Use TypeScript strict mode as defined in @tsconfig.json.
```

**What happens when a Claude Code user installs it:**

```bash
prpm install @yourname/react-best-practices --as claude --subtype skill
```

PRPM's converter:

1. **Recognizes the Cursor format** - Parses YAML frontmatter and MDC content
2. **Extracts file references** - Identifies `@components/Button.tsx`, `@docs/architecture.md`, `@tsconfig.json`
3. **Converts to Claude skill syntax** - Transforms to Claude's frontmatter structure
4. **Preserves glob patterns** - Maps Cursor's glob logic to Claude's `allowed-tools` if specified
5. **Maintains semantic intent** - The instruction about "canonical pattern" stays intact
6. **Generates valid output** - Passes Claude's schema validation

The user gets a working Claude skill. You didn't write two versions. Zero maintenance burden.

---

## Format Support: All Major AI Coding Platforms

PRPM supports every major AI coding platform, each with complete JSON schemas and validation:

| Format | File Location | Frontmatter | Key Features |
|--------|---------------|-------------|--------------|
| **Cursor** | `.cursor/rules/*.mdc` | Required | 4 rule types, MDC format, `@file` references |
| **Cursor (Legacy)** | `.cursorrules` → `.cursor/rules/` | Migration | Auto-converts legacy single-file to new format |
| **Cursor Hooks** | `hooks.json` | N/A (JSON) | Event-driven agent hooks |
| **Claude Code** | `.claude/{agents,skills,commands}/` | Required | allowed-tools, model selection, hooks |
| **Claude Plugin** | `.claude-plugin/plugin.json` | N/A (JSON) | Bundled agents, skills, commands, MCP servers |
| **Continue** | `.continue/rules/*.md` | Required | Globs, regex, alwaysApply logic |
| **Continue (Legacy)** | `.continuerules` → `.continue/rules/` | Migration | Auto-converts legacy format |
| **Windsurf** | `.windsurf/rules/*.md` | None | Plain markdown, 12K character limit |
| **GitHub Copilot** | `.github/instructions/*.instructions.md` | Optional | Two-tier patterns, chatmodes |
| **Kiro Steering** | `.kiro/steering/*.md` | Optional | Inclusion modes (always/fileMatch/manual) |
| **Kiro Hooks** | `.kiro/hooks/*.kiro.hook` | N/A (JSON) | Event-driven file automations |
| **Kiro Agents** | `.kiro/agents/*.json` | N/A (JSON) | Custom agent configurations |
| **Gemini CLI** | `.gemini/commands/*.toml` | N/A (TOML) | Custom slash commands |
| **Gemini Extension** | `.gemini/extensions/*/gemini-extension.json` | N/A (JSON) | MCP servers, context files |
| **OpenCode** | `.opencode/{agent,command,tool}/*.md` | Optional | Agents, commands, tools |
| **Factory Droid** | `.factory/{skills,commands,hooks}/` | Required | Skills, commands, hooks |
| **Zed** | `.zed/extensions/*.json` | N/A (JSON) | Rust/WASM extensions, slash commands |
| **Zencoder** | `.zencoder/rules/*.md` | Optional | Globs, alwaysApply rules |
| **Trae** | `.trae/rules/*.md` | Optional | AI coding rules |
| **Aider** | `CONVENTIONS.md` | None | Project conventions file |
| **Replit** | `replit.md` | None | Replit agent configuration |
| **Ruler** | Various | Optional | VS Code extension rules |
| **AGENTS.md** | `AGENTS.md` | None | OpenAI-style project instructions |
| **GEMINI.md** | `GEMINI.md` | None | Gemini project instructions |
| **CLAUDE.md** | `CLAUDE.md` | None | Claude project instructions |
| **MCP** | `.mcp/*.json` | N/A (JSON) | Model Context Protocol servers/tools |
| **Generic** | `.prompts/*.md` | Optional | Universal AI prompts |

That's **24 formats** with **2 legacy migration paths**—full bidirectional conversion support across the entire AI coding ecosystem.

---

## Technical Excellence: Why Conversion Works

### 1. Lossless Transformation

PRPM's converters don't strip features—they **map equivalent capabilities** across formats.

**Example: File Pattern Matching**

- **Cursor:** `globs: ["**/*.tsx"]`
- **Continue:** `applyTo: { globs: ["**/*.tsx"] }`
- **Copilot:** `applyTo: "*.tsx, **/*.tsx"`
- **Windsurf:** (Frontmatter-free, embedded in content)

Same intent, different syntax. PRPM handles the translation.

### 2. Format-Specific Features Preserved

Some platforms have unique features. PRPM preserves them when possible:

**Claude Code's `allowed-tools`:**
```yaml
---
name: "Safe Migration Assistant"
description: "Helps with migrations without file deletion"
allowed-tools:
  - read_file
  - write_file
---
```

When converted to Cursor, this becomes a **comment annotation** so users understand the intended tool restrictions. When converted to Windsurf (which has no tool restrictions), it's documented in the content.

**Cursor's `@file` references:**
```markdown
Reference @components/Button.tsx for the pattern.
```

When converted to formats without native file reference syntax, PRPM either:
- Preserves the `@` syntax (most editors auto-suggest files anyway)
- Or documents it in a "Referenced Files" section

### 3. Round-Trip Safety

Convert Cursor → Claude → Cursor? You get the same result (minus format-specific metadata that has no equivalent). PRPM's test suite includes **cross-format round-trip validation** to catch regressions.

---

## Real-World Scenario: Publishing a TypeScript Migration Package

Let's say you maintain Next.js and want to ship a package for the Pages Router → App Router migration.

### Traditional Approach (Manual Multi-Format)

**Week 1:** Write the Cursor version
- Create `.cursorrules` file
- Test with Cursor IDE
- Publish to GitHub

**Week 2:** Port to Continue
- Rewrite frontmatter (different required fields)
- Adjust glob patterns (different syntax)
- Test with Continue
- Create separate repo or branch

**Week 3:** Port to Claude Code
- Rewrite as Claude skill
- Add `allowed-tools` restrictions
- Convert `@file` references to plain text
- Test with Claude
- Another repo or branch

**Week 4:** Port to Windsurf
- Strip frontmatter (Windsurf doesn't use it)
- Ensure under 12k character limit
- Test with Windsurf
- Yet another repo

**Result:** Four repos, four update cycles, constant sync issues. When you fix a bug in the Cursor version, you have to remember to update the other three.

### PRPM Approach (Write Once)

**Week 1:** Write the package once in your preferred format (say, Cursor)
```bash
prpm init
# Edit .cursor/rules/nextjs-app-router-migration.md
prpm publish @nextjs/app-router-migration
```

**That's it.**

Users install in their preferred format automatically:

```bash
# Cursor user
prpm install @nextjs/app-router-migration

# Claude user
prpm install @nextjs/app-router-migration --as claude --subtype skill

# Continue user
prpm install @nextjs/app-router-migration --as continue

# Windsurf user
prpm install @nextjs/app-router-migration --as windsurf
```

PRPM converts on-the-fly. Every user gets a validated, working package. You maintain one version.

---

## Developer Experience: What Publishers Get

### 1. Publish Once, Reach Everyone

7,000+ packages in PRPM. Most were written in a single format and converted to support all platforms. Package authors don't think about formats—PRPM does.

### 2. Automatic Schema Validation

Before publishing, PRPM validates against the source format's JSON schema. Before conversion, PRPM validates against the target format's schema. Users never get broken packages.

```bash
$ prpm publish

✓ Validating against cursor.schema.json
✓ Testing conversions (claude-skill, continue-prompt, windsurf-rule...)
✓ Published @yourname/package@1.0.0
```

### 3. Future-Proof

New AI editor launches? PRPM adds conversion support. Your existing package automatically works with it. No republish needed.

**Real example:** When Claude Code launched hooks support in July 2025, PRPM added `claude-hook` conversion. Every existing package with equivalent automation became compatible **retroactively**.

### 4. Analytics Across Formats

PRPM tracks downloads **by format**:

```
@yourname/package downloads (last 30 days):
- cursor: 450
- claude-skill: 320
- continue-prompt: 180
- windsurf-rule: 120
- copilot-instruction: 90
```

You see which platforms your users prefer. No need to maintain separate analytics per repo.

---

## Technical Deep Dive: How Conversion Happens

Under the hood, PRPM uses a **multi-stage conversion pipeline**:

### Stage 1: Parse Source Format

```typescript
// PRPM recognizes the source format from frontmatter or file structure
const parsed = parsePackage(sourceContent, sourceFormat);
// Extract: frontmatter fields, content sections, metadata
```

### Stage 2: Normalize to Intermediate Representation

```typescript
// All formats map to a common IR (Intermediate Representation)
const normalized = normalize(parsed);
// IR includes: title, description, content, constraints, file refs, etc.
```

### Stage 3: Apply Format-Specific Transformations

```typescript
// Convert from IR to target format
const converted = convertToFormat(normalized, targetFormat);
// Handles: frontmatter structure, syntax adjustments, feature mapping
```

### Stage 4: Validate Against Target Schema

```typescript
// Ensure output passes JSON schema validation
validateAgainstSchema(converted, targetFormat);
// Catches: missing required fields, invalid syntax, malformed YAML
```

This architecture means:
- **Adding a new format** requires only writing parse/convert functions + schema
- **Improving conversions** happens in one place, benefits all formats
- **Round-trip safety** is testable (IR → Format A → IR → Format B should match IR → Format B)

---

## Common Questions from Publishers

### Q: What if my package uses a Cursor-specific feature with no equivalent?

**A:** PRPM handles this gracefully:

1. **Preserve as comment** - Document the feature in converted format's comments
2. **Embed in content** - For frontmatter-free formats like Windsurf, add a section explaining the constraint
3. **Warn at install time** - Users get a message: "This package includes Cursor-specific `@file` references which may not work identically in Continue"

**Example:**
```markdown
<!-- PRPM Conversion Note:
     Original Cursor package used globs: ["**/*.tsx"]
     Windsurf doesn't support glob frontmatter, applied globally -->
```

### Q: Can I publish in multiple formats intentionally?

**A:** Yes. Advanced publishers can include format-specific overrides:

```
my-package/
  .cursor/rules/main.md        (Cursor version)
  .claude/skills/main.md       (Claude-specific optimizations)
  prpm.json
```

PRPM uses the native version when available, falls back to conversion when not. Useful for performance-critical packages where you want hand-tuned versions for specific platforms.

### Q: What about package dependencies?

**A:** PRPM preserves dependencies across formats. If your package depends on `@company/shared-rules`, that dependency installs in the same format the user requested.

```bash
# User installs your package for Claude
prpm install @yourname/advanced-package --as claude --subtype skill

# PRPM also installs dependencies for Claude
✓ Installing @company/shared-rules (claude-skill)
✓ Installing @yourname/advanced-package (claude-skill)
```

---

## Case Study: Real Package Conversions

Let's look at an actual package: `@sanjeed5/react-best-practices`

**Source format:** Cursor (written by author)

**Installations by format (last 30 days):**
- Cursor: 620 downloads
- Claude: 480 downloads
- Continue: 290 downloads
- Windsurf: 210 downloads
- Copilot: 180 downloads

**Total reach:** 1,780 downloads across five platforms.

If published only for Cursor: **620 downloads** (65% of reach lost).

The author maintains **one version**. PRPM's converters handle 1,160 downloads (65% of total) via automatic conversion. The package works identically on all platforms.

**Conversion quality:**
- Zero reported bugs from format conversion
- All installations pass schema validation
- Round-trip tested in CI/CD

---

## Getting Started as a Publisher

### Step 1: Create Your Package

Write in your preferred format:

```bash
mkdir my-package
cd my-package
prpm init

# Choose your format:
# 1. Cursor (MDC with YAML frontmatter)
# 2. Claude (skill/agent/command)
# 3. Continue (prompt with frontmatter)
# ... or any other

# Edit the generated file
```

### Step 2: Test Locally

```bash
# Test conversion to different formats
prpm convert .cursor/rules/main.md --to claude
prpm convert .cursor/rules/main.md --to continue
prpm convert .cursor/rules/main.md --to windsurf

✓ Converted from cursor to claude
✓ Converted from cursor to continue
✓ Converted from cursor to windsurf
```

### Step 3: Publish

```bash
# One command, all formats supported
prpm publish

✓ Published @yourname/my-package@1.0.0
  Supports: cursor, claude-skill, claude-agent, continue-prompt,
            windsurf-rule, copilot-instruction, kiro-steering, agents-md
```

### Step 4: Monitor Analytics

Check your package analytics in the [PRPM Dashboard](https://prpm.dev/dashboard):

```
Downloads by format:
  cursor: ████████████ 450
  claude-skill: ████████ 320
  continue-prompt: █████ 180
  ...

Total downloads: 1,240
```

---

## Why This Matters for the Ecosystem

### For Package Authors

- **10x reach** with same effort (one package, 24+ platforms)
- **Zero maintenance burden** from format differences
- **Future-proof** against new editors launching

### For Package Users

- **More packages available** for their preferred editor
- **Guaranteed compatibility** (schema-validated conversions)
- **Consistent updates** (author publishes once, everyone benefits)

### For the AI Coding Community

- **Knowledge sharing accelerates** - Best practices spread across platforms
- **Fragmentation reduces** - No more "this only works in Cursor"
- **Innovation compounds** - Authors focus on content quality, not format maintenance

---

## The Future: What's Coming

PRPM's conversion system is actively expanding:

**Q1 2025:**
- Support for Zed Editor's prompt format
- Enhanced hook conversion (Claude ↔ Kiro)
- Multi-file package bundles with cross-references

**Q2 2025:**
- AI-assisted conversion optimization (suggest improvements based on target platform)
- Round-trip diff reporting (show what changes in conversion)
- Format-specific testing in Playground (test your package in all formats before publishing)

**Long-term:**
- Universal IR format specification (open standard for AI prompt interchange)
- Community-contributed format converters
- Automated migration guides for breaking changes across formats

---

## Call to Action: Publish Your First Package

Ready to reach developers across all AI coding platforms?

```bash
# Install PRPM
npm install -g prpm

# Create your package
prpm init

# Publish once
prpm publish @yourname/package

# Reach everyone
```

Your package will work in Cursor, Claude, Continue, Windsurf, Copilot, Kiro, agents.md, and every future platform PRPM supports.

**Write once. Distribute everywhere.**

---

## Additional Resources

- **[Format Specifications Guide](/blog/format-specifications-guide)** - Complete reference for all supported formats
- **[JSON Schemas for AI Prompts](/blog/json-schemas-for-ai-prompts)** - Deep dive on PRPM's validation system
- **[Publishing Documentation](https://docs.prpm.dev/publishing)** - Step-by-step publishing guide
- **[Conversion API Reference](https://docs.prpm.dev/conversion)** - Programmatic access to converters

---

## Questions?

We're here to help package publishers succeed. If you're considering publishing but have questions about format conversion, reach out:

- **GitHub Discussions:** [github.com/pr-pm/prpm/discussions](https://github.com/pr-pm/prpm/discussions)
- **Discord:** [prpm.dev/discord](https://prpm.dev/discord)
- **Email:** publishers@prpm.dev

**This is the new standard for AI coding tool distribution.** Write once. Distribute everywhere. Start publishing today.

---

**Tweet this post:** "I publish AI coding packages for one editor. PRPM converts them for 24+ platforms. Same package, zero extra work. Write once, distribute everywhere. 🚀 https://prpm.dev/blog/write-once-distribute-everywhere"
