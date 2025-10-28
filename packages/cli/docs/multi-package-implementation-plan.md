# Multi-Package Publishing Implementation Plan

## Current State

The foundation is complete:
- ✅ Type definitions (`MultiPackageManifest`, `Manifest`)
- ✅ Utilities (field inheritance, validation, filtering)
- ✅ Parallel publisher (concurrency control, retry logic)
- ✅ Performance analysis and benchmarks
- ✅ 38 tests passing (20 multi-package + 18 parallel publisher)

## What's Missing

The `publish` command (`packages/cli/src/commands/publish.ts`) only handles single packages.

## Implementation Steps

### 1. Update `findAndLoadManifests()` Function

**Current behavior:**
```typescript
async function findAndLoadManifests(): Promise<{
  manifests: PackageManifest[];
  source: string
}> {
  // Returns single manifest in array
  return { manifests: [validated], source: 'prpm.json' };
}
```

**New behavior:**
```typescript
async function findAndLoadManifests(): Promise<{
  manifests: PackageManifest[];
  source: string;
  isMultiPackage: boolean;
}> {
  const content = await readFile(prpmJsonPath, 'utf-8');
  const parsed = JSON.parse(content);

  // Check if multi-package manifest
  if (isMultiPackageManifest(parsed)) {
    const packages = getPackagesWithInheritance(parsed);

    // Validate each package
    packages.forEach(pkg => validateManifest(pkg));

    // Validate multi-package structure
    const validation = validateMultiPackageManifest(parsed);
    if (!validation.valid) {
      throw new Error(`Multi-package validation failed: ${validation.errors.join(', ')}`);
    }

    return {
      manifests: packages,
      source: 'prpm.json (multi-package)',
      isMultiPackage: true
    };
  }

  // Single package
  const validated = validateManifest(parsed);
  return {
    manifests: [validated],
    source: 'prpm.json',
    isMultiPackage: false
  };
}
```

### 2. Add CLI Options for Multi-Package

**New options:**
```typescript
interface PublishOptions {
  access?: 'public' | 'private';
  tag?: string;
  dryRun?: boolean;

  // Multi-package options
  package?: string;        // Filter by name, index, or pattern
  concurrency?: number;    // Parallel publish limit (default: 5)
  continueOnError?: boolean; // Don't stop on first failure
}
```

**Commander definition:**
```typescript
publishCommand
  .option('--package <name|index|pattern>', 'Publish specific package(s)')
  .option('--concurrency <number>', 'Number of concurrent uploads', '5')
  .option('--continue-on-error', 'Continue publishing remaining packages on error')
  .option('--sequential', 'Disable parallel publishing (publish one at a time)')
```

### 3. Update `handlePublish()` Main Function

**Current structure:**
```typescript
export async function handlePublish(options: PublishOptions): Promise<void> {
  const { manifests, source } = await findAndLoadManifests();
  const manifest = manifests[0]; // Only handles first

  // Validate, create tarball, publish
  await publishSinglePackage(manifest);
}
```

**New structure:**
```typescript
export async function handlePublish(options: PublishOptions): Promise<void> {
  const { manifests, source, isMultiPackage } = await findAndLoadManifests();

  // Filter packages if --package flag provided
  let packagesToPublish = manifests;
  if (options.package) {
    packagesToPublish = filterPackages(manifests, options.package);
    console.log(`Filtered to ${packagesToPublish.length} package(s)`);
  }

  // Single package or filtered to one package - use existing flow
  if (packagesToPublish.length === 1) {
    return publishSinglePackage(packagesToPublish[0], options);
  }

  // Multi-package - use parallel publisher
  return publishMultiplePackages(packagesToPublish, options, isMultiPackage);
}
```

### 4. Create `publishMultiplePackages()` Function

**New function:**
```typescript
async function publishMultiplePackages(
  manifests: PackageManifest[],
  options: PublishOptions,
  isMultiPackage: boolean
): Promise<void> {
  console.log(`\n📦 Publishing ${manifests.length} packages...\n`);

  // Shared resources (cache to avoid re-reading)
  const sharedContext = {
    userInfo: null as any,
    licenseCache: new Map<string, LicenseInfo>(),
  };

  // Get user info once (for org validation)
  try {
    const client = getRegistryClient(await getConfig());
    sharedContext.userInfo = await client.whoami();
  } catch (error) {
    // If no organization specified in any package, can continue
    const needsOrg = manifests.some(m => m.organization);
    if (needsOrg) {
      throw new Error('Failed to fetch user info for organization validation');
    }
  }

  // Create publish tasks
  const tasks = manifests.map((manifest, index) => ({
    name: `${manifest.name}@${manifest.version}`,
    execute: async () => {
      return publishPackageTask(manifest, options, sharedContext);
    },
  }));

  // Execute with concurrency control
  const concurrency = options.sequential ? 1 : (options.concurrency || 5);
  const results = await publishInParallel(tasks, {
    concurrency,
    continueOnError: options.continueOnError || false,
    onProgress: (current, total, name) => {
      console.log(`[${current}/${total}] Publishing ${name}...`);
    },
    onSuccess: (name, result) => {
      console.log(`✓ ${name} published successfully`);
    },
    onError: (name, error) => {
      console.error(`✗ ${name} failed: ${error.message}`);
    },
  });

  // Report results
  reportPublishResults(results, isMultiPackage);
}
```

### 5. Create `publishPackageTask()` Helper

**New helper function:**
```typescript
async function publishPackageTask(
  manifest: PackageManifest,
  options: PublishOptions,
  sharedContext: SharedPublishContext
): Promise<PublishResponse> {
  // Extract license (use cache)
  let licenseInfo = sharedContext.licenseCache.get(manifest.repository || '');
  if (!licenseInfo && manifest.repository) {
    licenseInfo = await extractLicenseInfo(manifest.repository);
    sharedContext.licenseCache.set(manifest.repository, licenseInfo);
  }

  // Update manifest with license
  if (licenseInfo?.text) {
    if (licenseInfo.type && !manifest.license) {
      manifest.license = licenseInfo.type;
    }
    manifest.license_text = licenseInfo.text;
    manifest.license_url = licenseInfo.url || undefined;
  }

  // Extract snippet
  const snippet = await extractSnippet(manifest);
  if (snippet) {
    manifest.snippet = snippet;
  }

  // Validate organization if specified
  let orgId: string | undefined;
  if (manifest.organization && sharedContext.userInfo) {
    const org = sharedContext.userInfo.organizations.find(
      (o: any) => o.id === manifest.organization || o.name === manifest.organization
    );

    if (!org) {
      throw new Error(`Organization not found: ${manifest.organization}`);
    }

    if (!['owner', 'admin', 'maintainer'].includes(org.role)) {
      throw new Error(`Insufficient permissions for organization: ${org.name}`);
    }

    orgId = org.id;
  }

  // Create tarball
  const tarball = await createPackageTarball(manifest);

  // Publish
  const client = getRegistryClient(await getConfig());
  const result = await client.publish(
    manifest,
    tarball,
    orgId ? { orgId } : undefined
  );

  return result;
}
```

### 6. Create `reportPublishResults()` Function

**New reporting function:**
```typescript
function reportPublishResults(
  results: PublishResult<PublishResponse>[],
  isMultiPackage: boolean
): void {
  const stats = calculateStats(results);

  console.log('\n' + '='.repeat(60));
  console.log('📊 Publish Results');
  console.log('='.repeat(60));

  if (isMultiPackage) {
    console.log(`Total packages:     ${stats.total}`);
    console.log(`✓ Succeeded:        ${stats.succeeded}`);
    console.log(`✗ Failed:           ${stats.failed}`);
    if (stats.skipped > 0) {
      console.log(`⊘ Skipped:          ${stats.skipped}`);
    }
    console.log(`Success rate:       ${(stats.successRate * 100).toFixed(1)}%`);
    console.log(`Total duration:     ${formatDuration(stats.totalDuration)}`);
    console.log(`Average per package: ${formatDuration(stats.avgDuration)}`);
  } else {
    // Single package reporting
    if (stats.succeeded === 1) {
      console.log('✅ Package published successfully!');
    } else {
      console.log('❌ Package publication failed');
    }
  }

  console.log('='.repeat(60) + '\n');

  // Exit with error if any failures
  if (stats.failed > 0) {
    process.exit(1);
  }
}
```

### 7. Refactor Existing Code

**Extract reusable logic:**
```typescript
// Current publishSinglePackage has all logic inline
// Need to extract into helpers:

async function createPackageTarball(manifest: PackageManifest): Promise<Buffer> {
  // Tarball creation logic
}

async function validateOrganization(
  manifest: PackageManifest,
  userInfo: any
): Promise<string | undefined> {
  // Organization validation logic
}
```

## File Changes Required

### Modified Files
1. `packages/cli/src/commands/publish.ts` - Main implementation
   - Update `findAndLoadManifests()`
   - Add `publishMultiplePackages()`
   - Add `publishPackageTask()`
   - Add `reportPublishResults()`
   - Refactor existing code into helpers
   - Add new CLI options

2. `packages/cli/src/commands/index.ts` - Export new options type

### New Imports Needed
```typescript
import {
  isMultiPackageManifest,
  getPackagesWithInheritance,
  validateMultiPackageManifest,
  filterPackages,
  type MultiPackageManifest,
} from '../utils/multi-package';

import {
  publishInParallel,
  calculateStats,
  formatDuration,
  type PublishTask,
  type PublishResult,
} from '../utils/parallel-publisher';
```

## Testing Strategy

### Unit Tests (New)
- `packages/cli/src/commands/__tests__/publish-multi.test.ts`
  - Test multi-package detection
  - Test package filtering
  - Test shared context caching
  - Test error handling (fail-fast vs continue-on-error)

### Integration Tests (New)
- `packages/cli/src/__tests__/e2e/publish-multi.e2e.test.ts`
  - End-to-end multi-package publish
  - Test with 2-5 packages
  - Test with organization
  - Test parallel vs sequential
  - Test filtering

### Manual Testing
```bash
# Test cases:
1. prpm publish                    # All packages, parallel
2. prpm publish --package pkg1     # Single package by name
3. prpm publish --package 0        # Single package by index
4. prpm publish --package "pkg-*"  # Pattern matching
5. prpm publish --sequential       # No parallelism
6. prpm publish --concurrency 3    # Custom concurrency
7. prpm publish --continue-on-error # Don't stop on error
8. prpm publish --dry-run          # Preview only
```

## Backward Compatibility

✅ **100% backward compatible**
- Single-package `prpm.json` files work unchanged
- No breaking changes to existing behavior
- Multi-package is opt-in via `packages` field

## Error Scenarios

### Validation Errors
- Missing required fields in any package → fail fast, publish nothing
- Duplicate package names → fail fast
- Invalid package filters → fail fast

### Runtime Errors
- **Fail-fast mode (default)**: Stop on first error, skip remaining
- **Continue-on-error mode**: Publish all, report failures at end
- Network errors → retry with backoff (per parallel-publisher)

## Performance Impact

### Single Package
- **No performance impact** - uses existing code path
- Same behavior as before

### Multi-Package (5 packages)
- **Without optimization**: 5s (sequential)
- **With optimization**: 1.5s (3.3x faster)
- Memory usage: ~50MB peak

## CLI Output Examples

### Success (3 packages)
```
📦 Publishing 3 packages...

[1/3] Publishing @myorg/cursor-rules@1.0.0...
✓ @myorg/cursor-rules@1.0.0 published successfully

[2/3] Publishing @myorg/claude-agent@2.0.0...
✓ @myorg/claude-agent@2.0.0 published successfully

[3/3] Publishing @myorg/claude-skill@1.5.0...
✓ @myorg/claude-skill@1.5.0 published successfully

============================================================
📊 Publish Results
============================================================
Total packages:      3
✓ Succeeded:         3
✗ Failed:            0
Success rate:        100.0%
Total duration:      1.8s
Average per package: 0.6s
============================================================

✅ Successfully published 3 packages!
```

### Partial Failure (continue-on-error mode)
```
📦 Publishing 3 packages...

[1/3] Publishing @myorg/pkg1@1.0.0...
✓ @myorg/pkg1@1.0.0 published successfully

[2/3] Publishing @myorg/pkg2@2.0.0...
✗ @myorg/pkg2@2.0.0 failed: Network error

[3/3] Publishing @myorg/pkg3@1.5.0...
✓ @myorg/pkg3@1.5.0 published successfully

============================================================
📊 Publish Results
============================================================
Total packages:      3
✓ Succeeded:         2
✗ Failed:            1
Success rate:        66.7%
Total duration:      2.1s
Average per package: 0.7s
============================================================

❌ Some packages failed to publish
```

### Strict Mode Failure
```
📦 Publishing 4 packages...

[1/4] Publishing @myorg/pkg1@1.0.0...
✓ @myorg/pkg1@1.0.0 published successfully

[2/4] Publishing @myorg/pkg2@2.0.0...
✗ @myorg/pkg2@2.0.0 failed: Authentication failed

Stopping due to error (strict mode)

============================================================
📊 Publish Results
============================================================
Total packages:      4
✓ Succeeded:         1
✗ Failed:            1
⊘ Skipped:           2
Success rate:        25.0%
Total duration:      0.9s
============================================================

❌ Publication stopped due to error
```

## Estimated Implementation Time

- **Step 1-3**: Update manifest loading and CLI options - 1 hour
- **Step 4-6**: Implement multi-package publishing - 2 hours
- **Step 7**: Refactor existing code - 1 hour
- **Testing**: Unit + integration tests - 2 hours
- **Manual testing & debugging**: 1 hour

**Total: ~7 hours** for complete implementation

## Risk Assessment

### Low Risk
- ✅ Foundation is solid (38 tests passing)
- ✅ Backward compatible
- ✅ Well-tested utilities

### Medium Risk
- ⚠️ Refactoring existing publish code (may break single-package flow)
- ⚠️ Organization validation with cached userInfo
- ⚠️ Error handling edge cases

### Mitigation
- Keep single-package path separate (minimal changes)
- Comprehensive testing before merge
- Feature flag if needed

## Next Steps

1. **Review this plan** - Get approval on approach
2. **Implement in phases** - Start with detection, then basic multi-package, then parallelism
3. **Test thoroughly** - Both unit and integration tests
4. **Update documentation** - CLI help text, README examples
5. **Create example prpm.json** - Show multi-package format

## Open Questions

1. **Default behavior**: Should `prpm publish` without `--package` publish all packages or prompt?
2. **Progress UI**: Use simple console.log or a progress bar library?
3. **Dry run**: Should `--dry-run` show what would be published for all packages?
4. **Rate limiting**: Should we add delays between publishes to respect registry rate limits?
5. **Telemetry**: How should multi-package publishes be tracked differently?
