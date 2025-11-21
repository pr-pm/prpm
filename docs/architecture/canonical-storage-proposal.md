# Canonical Storage Architecture Proposal

## Overview
Store packages in S3 as canonical JSON format and convert on-demand to target formats, enabling lossless conversions and format flexibility.

## Current Architecture
```
Storage: packages/{author}/{name}/{version}/package.tar.gz
Format: Native format-specific files (`.cursorrules`, `.md`, etc.)
Limitation: Hard to convert between formats without data loss
```

## Proposed Architecture
```
Storage: packages/{author}/{name}/{version}/canonical.json
Format: Unified canonical JSON structure
Benefit: Convert to any format on-demand without data loss
```

## Benefits

### 1. **Format Flexibility**
- Convert to any supported format at download time
- Users request format via `?format=cursor` query parameter or `--as` flag
- No need to store multiple versions of the same package

### 2. **Lossless Conversions**
- All metadata preserved in canonical format
- Round-trip conversions (Format A → Canonical → Format B → Canonical) maintain data integrity
- No loss of format-specific features (tools, hooks, configuration)

### 3. **Future-Proof**
- Adding new formats only requires writing converters
- No need to re-ingest existing packages
- Legacy packages automatically available in new formats

### 4. **Richer Metadata**
- Users provide conversion hints in `prpm.json`
- Better quality cross-format transformations
- Preserve intent across different platforms

## Enhanced prpm.json Schema

```typescript
export interface PackageManifest {
  // ... existing fields ...

  /**
   * Conversion hints for cross-format transformations
   * Helps improve quality when converting to other formats
   */
  conversion?: {
    /** Hints for Cursor format conversion */
    cursor?: {
      alwaysApply?: boolean;
      priority?: 'high' | 'medium' | 'low';
      globs?: string[];
    };

    /** Hints for Claude format conversion */
    claude?: {
      model?: 'sonnet' | 'opus' | 'haiku';
      tools?: string[];
      subagentType?: string;
    };

    /** Hints for Kiro format conversion */
    kiro?: {
      inclusion?: 'always' | 'fileMatch' | 'manual';
      fileMatchPattern?: string;
      tools?: string[];
      mcpServers?: Record<string, {
        command: string;
        args?: string[];
      }>;
    };

    /** Hints for GitHub Copilot format conversion */
    copilot?: {
      applyTo?: string | string[];
      excludeAgent?: 'code-review' | 'coding-agent';
    };

    /** Hints for Continue format conversion */
    continue?: {
      alwaysApply?: boolean;
      globs?: string | string[];
      regex?: string | string[];
    };

    /** Hints for Windsurf format conversion */
    windsurf?: {
      // Windsurf-specific hints
    };
  };

  /**
   * Canonical content - optionally store the canonical representation
   * If provided, used directly; otherwise generated from source files
   */
  canonical?: {
    content: CanonicalContent;
    metadata?: Record<string, any>;
  };
}
```

## Implementation Plan

### Phase 1: Storage Layer Updates

#### 1.1 Update S3 Storage Functions
```typescript
// storage/s3.ts

/**
 * Upload canonical package to S3
 */
export async function uploadCanonicalPackage(
  server: FastifyInstance,
  packageName: string,
  version: string,
  canonicalPackage: CanonicalPackage
): Promise<{ url: string; hash: string; size: number }> {
  const key = `packages/${packageName}/${version}/canonical.json`;
  const content = JSON.stringify(canonicalPackage, null, 2);
  const buffer = Buffer.from(content, 'utf-8');
  const hash = createHash('sha256').update(buffer).digest('hex');

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: 'application/json',
      Metadata: {
        packageName,
        version,
        hash,
        format: 'canonical',
      },
    })
  );

  return { url: buildS3Url(key), hash, size: buffer.length };
}

/**
 * Get canonical package from S3
 */
export async function getCanonicalPackage(
  server: FastifyInstance,
  packageName: string,
  version: string
): Promise<CanonicalPackage> {
  const key = `packages/${packageName}/${version}/canonical.json`;

  const command = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });

  const response = await s3Client.send(command);
  const content = await streamToString(response.Body);

  return JSON.parse(content) as CanonicalPackage;
}
```

#### 1.2 Add Conversion Service
```typescript
// services/conversion.ts

import { CanonicalPackage } from '@pr-pm/converters';
import { toCursor, toClaude, toKiro, ... } from '@pr-pm/converters';

export async function convertToFormat(
  canonicalPkg: CanonicalPackage,
  targetFormat: Format,
  options?: ConversionOptions
): Promise<string> {
  switch (targetFormat) {
    case 'cursor':
      return toCursor(canonicalPkg, options).content;
    case 'claude':
      return toClaude(canonicalPkg, options).content;
    case 'kiro':
      return toKiroAgent(canonicalPkg, options).content;
    // ... other formats
    default:
      throw new Error(`Unsupported format: ${targetFormat}`);
  }
}
```

### Phase 2: Publishing Pipeline

#### 2.1 Update Package Publishing
```typescript
// routes/packages.ts - publish endpoint

// 1. Extract files from tarball
// 2. Parse source format (cursor, claude, etc.)
// 3. Convert to canonical format using converters
// 4. Merge conversion hints from prpm.json
// 5. Store canonical JSON in S3
// 6. Store metadata in PostgreSQL

const sourceContent = await extractSourceFile(tarball);
const sourceFormat = detectFormat(sourceContent, manifest);

// Convert to canonical
const canonicalResult = await convertToCanonical(
  sourceContent,
  sourceFormat,
  manifest.conversion
);

// Store in S3
await uploadCanonicalPackage(
  server,
  packageName,
  version,
  canonicalResult.package
);
```

### Phase 3: Download/Export

#### 3.1 Add Format Query Parameter
```typescript
// routes/packages.ts - download endpoint

server.get('/:name/download', async (request, reply) => {
  const { name } = request.params;
  const { version, format } = request.query;

  // Get canonical from S3
  const canonical = await getCanonicalPackage(server, name, version);

  // Convert to requested format (default to original format)
  const targetFormat = format || canonical.format;
  const content = await convertToFormat(canonical, targetFormat);

  // Return as appropriate file type
  const filename = getFilenameForFormat(targetFormat, name);
  reply.header('Content-Disposition', `attachment; filename="${filename}"`);
  reply.type(getContentTypeForFormat(targetFormat));
  return content;
});
```

#### 3.2 CLI Integration
```bash
# Download in original format
prpm install cursor-rules/typescript-best-practices

# Convert to different format
prpm install cursor-rules/typescript-best-practices --as=claude
prpm install cursor-rules/typescript-best-practices --as=kiro
prpm install cursor-rules/typescript-best-practices --as=copilot
```

### Phase 4: Migration Strategy

#### 4.1 Backwards Compatibility
- Keep existing tarball support for a transition period
- Dual-read: Try canonical first, fall back to tarball
- Gradually migrate existing packages

#### 4.2 Migration Script
```typescript
// scripts/migrate-to-canonical.ts

// For each package in S3:
// 1. Download tarball
// 2. Extract and parse source format
// 3. Convert to canonical
// 4. Upload canonical.json
// 5. Keep tarball for backwards compatibility (optional)
```

## Performance Considerations

### 1. **Caching**
- Cache converted formats in CDN (CloudFront)
- Cache conversion results in Redis
- Pre-generate popular format combinations

### 2. **Lazy Conversion**
- Only convert when requested
- Generate and cache on first request
- Invalidate cache on package updates

### 3. **Optimization**
- Compress canonical JSON with gzip
- Use streaming for large packages
- Parallel conversion for batch operations

## Example Workflow

### Publishing
```bash
# User has a Cursor rule
prpm publish

# CLI:
# 1. Reads .cursorrules + prpm.json
# 2. Converts to canonical format
# 3. Merges conversion hints from prpm.json
# 4. Uploads canonical.json to S3
# 5. Stores metadata in PostgreSQL
```

### Installing
```bash
# User wants Claude format
prpm install cursor-rules/typescript-best-practices --as=claude

# CLI:
# 1. Fetches package metadata from registry
# 2. Downloads canonical.json from S3 (or cache)
# 3. Converts canonical → Claude format
# 4. Installs .claude/skills/typescript-best-practices.md
```

## Benefits Summary

1. ✅ **Single source of truth** - One canonical representation
2. ✅ **Format flexibility** - Convert to any format on-demand
3. ✅ **Lossless conversions** - Preserve all metadata and features
4. ✅ **Future-proof** - Easy to add new formats
5. ✅ **Better quality** - Conversion hints improve transformations
6. ✅ **Smaller storage** - One JSON file vs multiple format versions
7. ✅ **Easier maintenance** - Update converters without re-ingesting packages

## Next Steps

1. ✅ Extend canonical types to support Kiro metadata (DONE)
2. ⬜ Add conversion hints to PackageManifest type
3. ⬜ Implement uploadCanonicalPackage and getCanonicalPackage
4. ⬜ Add conversion service layer
5. ⬜ Update publishing pipeline to generate canonical format
6. ⬜ Add format query parameter to download endpoint
7. ⬜ Create migration script for existing packages
8. ⬜ Update CLI to support --as flag
9. ⬜ Add caching layer for converted formats
10. ⬜ Document conversion hints in user guide
