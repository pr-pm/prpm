# Canonical Storage Usage Guide

## Overview

PRPM now supports storing packages in a universal **canonical format**, enabling seamless cross-format conversions while maintaining full backwards compatibility with legacy tarball storage.

## Backwards Compatibility

✅ **All existing packages continue to work** - No breaking changes
✅ **Legacy tarballs supported** - Automatic fallback to tarball extraction
✅ **Lazy migration** - Packages convert to canonical on first access (optional)
✅ **Gradual rollout** - New packages use canonical, old packages work as-is

## How It Works

### Storage Strategy: Dual Format Support

```
Canonical (New):  packages/{author}/{name}/{version}/canonical.json
Legacy (Old):     packages/{author}/{name}/{version}/package.tar.gz

Read Order: Try canonical.json first → Fallback to package.tar.gz
```

### Format Detection & Conversion

When a legacy package is accessed:
1. Check for `canonical.json`
2. If not found, extract from `package.tar.gz`
3. Detect source format (cursor, claude, kiro, etc.)
4. Convert to canonical on-the-fly
5. Optionally cache canonical version (lazy migration)

## For Package Authors

### Adding Conversion Hints

Enhance your `prpm.json` with conversion hints to improve cross-format quality:

```json
{
  "name": "my-typescript-rules",
  "version": "1.0.0",
  "description": "TypeScript coding standards",
  "format": "cursor",
  "subtype": "rule",
  "files": [".cursorrules"],

  "conversion": {
    "claude": {
      "model": "sonnet",
      "tools": ["Read", "Write", "Bash"]
    },
    "kiro": {
      "inclusion": "fileMatch",
      "fileMatchPattern": "**/*.ts",
      "tools": ["Read", "Write"]
    },
    "copilot": {
      "applyTo": ["src/**/*.ts", "tests/**/*.ts"]
    },
    "continue": {
      "alwaysApply": false,
      "globs": ["**/*.ts", "**/*.tsx"]
    }
  }
}
```

### Publishing Packages

**No changes required!** Just publish as normal:

```bash
prpm publish
```

The registry will:
- Accept your tarball (maintains compatibility)
- Extract and convert to canonical (if enabled)
- Store both formats (during transition period)

## For Package Users

### Installing in Different Formats

Install packages in any format, regardless of source:

```bash
# Install in original format
prpm install author/package-name

# Convert to Claude format
prpm install author/package-name --as=claude

# Convert to Kiro format
prpm install author/package-name --as=kiro

# Convert to Copilot format
prpm install author/package-name --as=copilot
```

### Supported Format Conversions

| From → To | Cursor | Claude | Kiro | Copilot | Continue | Windsurf |
|-----------|--------|--------|------|---------|----------|----------|
| **Cursor** | 100% | 85% | 70% | 80% | 90% | 95% |
| **Claude** | 80% | 100% | 85% | 75% | 85% | 80% |
| **Kiro** | 70% | 85% | 100% | 65% | 75% | 70% |
| **Copilot** | 80% | 75% | 65% | 100% | 85% | 80% |

*Percentages indicate conversion quality score*

## For Registry Operators

### Configuration

Enable lazy migration (optional):

```bash
# Environment variable
export ENABLE_LAZY_MIGRATION=true

# Or in config
ENABLE_LAZY_MIGRATION=true node dist/index.js
```

### Migration Commands

#### Check Migration Status

```bash
# Via API
GET /api/packages/{name}/migration-status?version=1.0.0

# Response:
{
  "migrated": false,
  "format": "tarball"
}
```

#### Batch Migration

Migrate existing packages in batches:

```bash
# Dry run (no changes)
POST /api/admin/migrate-packages
{
  "limit": 100,
  "offset": 0,
  "dryRun": true
}

# Actual migration
POST /api/admin/migrate-packages
{
  "limit": 100,
  "offset": 0,
  "dryRun": false
}

# Response:
{
  "total": 100,
  "migrated": 95,
  "failed": 2,
  "skipped": 3
}
```

#### Estimate Migration Scope

```bash
GET /api/admin/migration-estimate

# Response:
{
  "totalPackages": 1523,
  "needsMigration": 1245,
  "alreadyMigrated": 278
}
```

### Monitoring

Key metrics to track:

- **Canonical hit rate**: % of requests served from canonical storage
- **Migration rate**: Packages migrated per day
- **Conversion failures**: Failed format conversions
- **Storage usage**: Canonical vs tarball storage size

## Migration Strategy

### Phase 1: Dual Storage (Current)
- ✅ Both formats supported
- ✅ New packages can use canonical
- ✅ Old packages work unchanged
- ✅ Lazy migration available

### Phase 2: Gradual Migration (Months 1-3)
- Enable lazy migration
- Batch migrate popular packages
- Monitor conversion quality
- Fix any edge cases

### Phase 3: Canonical-First (Months 4-6)
- New packages stored as canonical only
- Legacy tarballs kept for old versions
- Improved caching for conversions
- Performance optimizations

### Phase 4: Tarball Deprecation (Month 7+)
- Announce tarball deprecation timeline
- Provide migration tools for authors
- Eventually remove tarball support (optional)

## Example Workflows

### Workflow 1: Publishing a New Package

```bash
# Author creates a Cursor rule
echo "# TypeScript Rules" > .cursorrules

# Create prpm.json with conversion hints
cat > prpm.json << EOF
{
  "name": "ts-rules",
  "format": "cursor",
  "conversion": {
    "claude": { "model": "sonnet" },
    "kiro": { "inclusion": "always" }
  }
}
EOF

# Publish (works exactly as before)
prpm publish

# Registry automatically:
# 1. Accepts tarball
# 2. Converts to canonical
# 3. Stores both (during transition)
```

### Workflow 2: Installing in Different Format

```bash
# User wants Claude format of a Cursor package
prpm install author/ts-rules --as=claude

# Registry:
# 1. Fetches canonical.json (or converts from tarball)
# 2. Applies conversion hints from prpm.json
# 3. Converts canonical → Claude format
# 4. Installs to .claude/skills/
```

### Workflow 3: Lazy Migration

```bash
# User accesses old package
GET /api/packages/author/old-package/download?version=1.0.0

# Registry:
# 1. Checks for canonical.json → Not found
# 2. Extracts from package.tar.gz
# 3. Converts to canonical
# 4. (If lazy migration enabled) Stores canonical.json
# 5. Returns requested format
# 6. Next request will use canonical.json ✨
```

## Troubleshooting

### Package won't convert

**Issue**: `Failed to convert cursor to claude format`

**Solutions**:
1. Check package content is valid for source format
2. Add conversion hints in prpm.json
3. Report format-specific issues to PRPM team

### Lossy conversion warning

**Issue**: `Warning: Conversion from kiro to cursor may lose features`

**Understanding**:
- Some formats have features others don't support
- Example: Kiro agent tools → can't convert to simple Cursor rules
- Conversion still works, but some metadata may be lost

**Solutions**:
1. Use target format that supports your features
2. Add conversion hints to guide transformation
3. Accept quality score tradeoff

### Migration failures

**Issue**: Batch migration shows failures

**Common causes**:
1. Corrupted tarball in S3
2. Invalid source format content
3. S3 permissions issues
4. Memory/timeout for large packages

**Solutions**:
1. Check S3 logs for specific package
2. Manually inspect problematic packages
3. Skip and retry later
4. Report persistent issues

## API Reference

### Get Package in Specific Format

```
GET /api/packages/{name}/download?version={version}&format={format}

Query Parameters:
- version: Package version (required)
- format: Target format (optional, defaults to original)
  - cursor | claude | kiro | copilot | continue | windsurf

Response:
- Content-Type: text/markdown or application/json
- Content-Disposition: attachment; filename="..."
- Body: Package content in requested format
```

### Check Conversion Compatibility

```
GET /api/conversion/compatibility?from={format}&to={format}

Response:
{
  "compatible": true,
  "qualityScore": 85,
  "lossy": false,
  "warnings": []
}
```

## Best Practices

### For Package Authors

1. **Add conversion hints** - Helps improve cross-format quality
2. **Test conversions** - Try installing with `--as` flag
3. **Document format-specific features** - Help users understand limitations
4. **Keep metadata rich** - More metadata = better conversions

### For Registry Operators

1. **Enable lazy migration** - Gradual, zero-downtime migration
2. **Monitor conversion errors** - Fix format-specific issues
3. **Cache converted formats** - Improve performance
4. **Start with popular packages** - Batch migrate high-traffic packages first

### For Package Users

1. **Use --as flag** - Get packages in your preferred format
2. **Check quality scores** - Understand conversion tradeoffs
3. **Report issues** - Help improve conversion quality
4. **Try different formats** - Find what works best for your workflow

## FAQ

**Q: Will my old packages break?**
A: No! Full backwards compatibility maintained.

**Q: Do I need to republish my packages?**
A: No. Lazy migration handles conversion automatically.

**Q: What happens if canonical.json is corrupted?**
A: System falls back to tarball extraction.

**Q: Can I opt out of lazy migration?**
A: Yes. Set `ENABLE_LAZY_MIGRATION=false`.

**Q: How much storage does canonical use?**
A: Typically 20-40% smaller than tarballs (JSON vs gzipped tar).

**Q: Can I delete tarballs after migration?**
A: Yes, but keep during transition period for safety.

## Support

- **Issues**: https://github.com/pr-pm/prpm/issues
- **Docs**: https://docs.prpm.com
- **Discord**: https://discord.gg/prpm
