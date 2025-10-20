# Cursor Terminology Fix - Complete Summary

## Issue

The codebase incorrectly referred to "Cursor skills" and used `.cursorrules` format.

**Cursor IDE only has:**
- **Rules** (not "skills")
- Located in **`.cursor/rules/*.md`** (not `.cursorrules`)

Claude Code has skills in `.claude/skills/`, but Cursor is different.

## What Was Fixed

### 1. Package Structure ✅

**Before:**
```
packages/cursorrules/creating-cursorrules/
  .cursorrules
  package.json
  README.md
```

**After:**
```
packages/cursor-rules/creating-cursor-rules/
  .cursor/rules/creating-cursor-rules.md
  package.json
  README.md
```

### 2. Package Metadata ✅

**package.json changes:**
- Name: `@prpm-official/creating-cursorrules` → `@prpm-official/creating-cursor-rules`
- Type: `cursor-rule` → `cursor`
- Keywords: `cursorrules` → `cursor-rules`
- Install path: `.cursorrules/meta` → `.cursor/rules`
- Files: `.cursorrules` → `.cursor/rules/creating-cursor-rules.md`

### 3. Documentation ✅

**README.md:**
- Removed all references to `.cursorrules`
- Updated to `.cursor/rules/` format
- Added section explaining correct file location
- Fixed installation command name

**Rule content file:**
- Global find-replace: `.cursorrules` → `.cursor/rules`
- Updated all examples and references
- Fixed title

### 4. Remaining Work Needed

#### Registry & CLI Code

**Files that need updates:**
1. `packages/registry/src/routes/convert.ts` - Returns `.cursorrules` extension
2. `packages/cli/src/commands/publish.ts` - Checks for `.cursorrules` file
3. `scripts/seed/upload-packages.ts` - References `.cursorrules`
4. `scripts/scraper/*.ts` - Multiple files scraping `.cursorrules`

**Package type references:**
- All three packages (`registry`, `cli`, `registry-client`) use:
  ```typescript
  export type PackageType = 'cursor' | 'claude' | 'claude-skill' | ...
  ```
  This is **CORRECT** - "cursor" is the type, rules are the format.

#### Scraped Data

Files in `converted-cursor-skills/` directory - these are historical scraped data:
- Already converted from old `.cursorrules` format
- Can keep as-is for historical reference
- Or rename directory to `converted-cursor-rules/` for clarity

## Correct Terminology Going Forward

### Cursor IDE

❌ **WRONG:**
- "Cursor skills"
- "Cursor has a .cursorrules file"
- ".cursorrules format"

✅ **CORRECT:**
- "Cursor rules"
- "Cursor has rules in `.cursor/rules/`"
- "Cursor rule format"

### Claude Code

✅ **CORRECT:**
- "Claude Code skills"
- "Skills in `.claude/skills/`"
- "Claude skill format"

### PRPM Package Types

✅ **CORRECT:**
```typescript
type: 'cursor'        // Cursor rules
type: 'claude-skill'  // Claude Code skills
type: 'claude'        // Claude prompts (generic)
```

## Updated File Structure

### For Cursor Rules Package:
```
@prpm-official/creating-cursor-rules/
  .cursor/
    rules/
      creating-cursor-rules.md  ← The actual rule
  package.json
  README.md
```

### Installation Result:
```
your-project/
  .cursor/
    rules/
      creating-cursor-rules.md  ← Installed here
```

## Migration Guide

### For Package Authors

If you have packages with `.cursorrules`:

1. **Create new structure:**
   ```bash
   mkdir -p .cursor/rules
   mv .cursorrules .cursor/rules/your-rule-name.md
   ```

2. **Update package.json:**
   ```json
   {
     "prpm": {
       "format": "cursor",
       "installPath": ".cursor/rules",
       "files": [".cursor/rules/your-rule-name.md"]
     }
   }
   ```

3. **Update documentation** - Replace all `.cursorrules` references

### For PRPM Registry

Need to update:
- Converter functions (to-cursor, from-cursor)
- Publish command validation
- Seed scripts
- Search/display to use correct terminology

## Status

✅ **Completed:**
- Meta-rule package fixed
- Package metadata corrected
- Documentation updated
- File structure corrected

⏳ **TODO:**
- Update registry converter code
- Update CLI publish validation
- Update scraper references
- Consider renaming `converted-cursor-skills/` directory

---

**Key Takeaway:** Cursor uses **rules** in **`.cursor/rules/`**, not "skills" or ".cursorrules". This is now fixed in our official meta-rule package.
