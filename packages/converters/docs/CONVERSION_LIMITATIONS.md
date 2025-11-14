# Conversion Limitations

## What the Canonical Format Actually Preserves

The canonical format is an **intermediate representation** that enables format conversion, but it does **NOT** preserve all metadata and content from all formats.

## Information Lost During Conversions

### 1. Tools Section
**Lost when converting TO:**
- Cursor (not supported)
- Continue (not supported)
- Copilot (not supported)
- Kiro (not supported)
- Windsurf (not supported)
- agents.md (not supported)

**Only preserved in:**
- Claude (via `allowed-tools` field)

### 2. Persona Section
**Lost when converting TO:**
- Continue (not supported)
- Copilot (not supported)
- Kiro (not supported)
- agents.md (not supported)

**Preserved in:**
- Claude (as "You are..." text)
- Cursor (as markdown content)
- Windsurf (as markdown content)

### 3. Subtype Information
**Lost in round-trip conversions** unless PRPM extension fields (`agentType`, `skillType`, `commandType`) are present:

```
.claude/agents/test.md (agent)
   ↓ convert to Cursor
.cursor/rules/test.mdc (no agentType field)
   ↓ parse back
Detected as 'rule' ❌ Lost
```

**Solution:** CLI must preserve subtype through file path tracking.

### 4. Format-Specific Fields

#### Copilot path-specific configuration
```yaml
applyTo: ["src/**/*.ts", "lib/**/*.js"]
```
**Lost when converting to:** Any other format (Cursor, Claude, Continue, etc.)

#### Continue regex patterns
```yaml
regex: "^import .* from '.*';$"
```
**Lost:** Not preserved in canonical format (documented limitation)

#### Kiro file matching
```yaml
fileMatchPattern: "*.ts"
```
**Lost when converting to:** Formats without equivalent feature

#### Windsurf character limit
**Max:** 12,000 characters
**Impact:** Content may be truncated; lossy conversion flagged

### 5. Custom Editor-Specific Sections

Any `CustomSection` with `editorType` set to a specific editor is **skipped** when converting to other formats.

```typescript
{
  type: 'custom',
  editorType: 'cursor',
  content: 'Cursor-only instructions'
}
```
**Lost when converting to:** Any non-Cursor format

## Misleading Claims to Correct

### ❌ "Claude's emoji icons"

**Reality:** Emojis are placed in the H1 heading as standard markdown:

```markdown
# 🔍 Code Reviewer
```

This is **not a Claude-specific feature**. Any format can have emojis in headings. The canonical format extracts the emoji from the H1 and stores it as `metadata.icon`, but this works for all formats.

### ❌ "Preserves all metadata and content from all formats"

**Reality:** Many features are format-specific and cannot be preserved:
- Tools (Claude-only)
- Persona sections (Claude/Cursor/Windsurf only)
- Regex patterns (Continue-only)
- Path-specific rules (Copilot-only)
- Subtype information (lost without file path context)

## What IS Preserved

✅ **Core content:**
- Instructions
- Rules and guidelines
- Code examples
- Descriptions

✅ **Common metadata:**
- Title
- Description
- Tags (when supported)
- Version (when supported)

✅ **Format-agnostic features:**
- Markdown formatting
- Code blocks
- Lists
- Headings

## Conversion Quality Scores

Each conversion returns a `qualityScore` (0-100) and `lossyConversion` flag:

```typescript
{
  content: "...",
  format: "cursor",
  qualityScore: 80,        // Reduced from 100
  lossyConversion: true,   // Information was lost
  warnings: [
    "Tools section skipped (Claude-specific)",
    "Persona section skipped (not supported by Cursor)"
  ]
}
```

## Best Practices

1. **One-way conversions work best** - Download and install packages in target format
2. **Avoid round-tripping** - Don't convert back and forth; information degrades
3. **Use file path context** - CLI should determine subtype from file location
4. **Check quality scores** - Monitor `lossyConversion` flag and warnings
5. **Test conversions** - Always verify converted packages work as expected

## Summary

The canonical format is a **best-effort intermediate representation** that:
- ✅ Preserves core instructional content
- ✅ Enables format conversion
- ✅ Flags lossy conversions
- ❌ Does NOT preserve all format-specific features
- ❌ Does NOT guarantee perfect round-trips

It's designed for **one-way package distribution**, not perfect bidirectional conversion.
