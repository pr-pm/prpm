# Bug: Size Limit Error Handling Failure

**Status:** Open
**Priority:** Medium
**Discovered:** 2025-01-08
**Component:** `src/commands/publish.ts`
**Affected Test:** `src/__tests__/e2e/publish.e2e.test.ts` - "should reject packages over size limit"

## Summary

When a package exceeds the 10MB size limit during publishing, the error handling fails with:
```
Cannot read properties of undefined (reading 'name')
```

Instead of the expected error message:
```
Package size (11.00MB) exceeds 10MB limit
```

## Steps to Reproduce

1. Create a package with a prpm.json manifest
2. Include a file larger than 10MB in the package
3. Run `prpm publish`
4. Observe error: "Cannot read properties of undefined (reading 'name')"

### Test Case

```typescript
it('should reject packages over size limit', async () => {
  await createMockPackage(testDir, 'huge-package', 'cursor');

  // Create a large file (> 10MB)
  const largeContent = Buffer.alloc(11 * 1024 * 1024, 'x');
  await writeFile(join(testDir, 'large-file.txt'), largeContent);

  // Update manifest to include the large file
  const manifest = JSON.parse(await readFile(join(testDir, 'prpm.json'), 'utf-8'));
  manifest.files = ['prpm.json', '.cursorrules', 'large-file.txt'];
  await writeFile(join(testDir, 'prpm.json'), JSON.stringify(manifest));

  await expect(handlePublish({})).rejects.toThrow(CLIError);
  await expect(handlePublish({})).rejects.toThrow('exceeds 10MB limit');
});
```

**Currently skipped** in test suite at line 209 of `src/__tests__/e2e/publish.e2e.test.ts`

## Current Behavior

When size limit is exceeded:
1. Error is thrown from `createTarball()` at `src/commands/publish.ts:384`
2. Error is caught in the per-manifest try-catch block at line 681
3. Helper functions try to construct display name
4. One of these helper functions accesses an undefined property
5. Secondary error thrown: "Cannot read properties of undefined (reading 'name')"
6. Original size limit error is lost

## Expected Behavior

When size limit is exceeded:
1. Clear error message showing actual size and limit
2. Proper error propagation through CLIError
3. No secondary errors during error handling
4. Test passes with expected error message

## Root Cause Analysis

### Error Flow

```
handlePublish() [line 403]
  └─> for loop through manifests [line 494]
      └─> try block [line 505]
          └─> createTarball(manifest) [line 617]
              └─> Size check [line 382-385]
                  └─> throw new Error(`Package size...exceeds 10MB limit`)
          └─> catch block [line 681-696]
              └─> predictScopedPackageName() [line 685-689]
                  └─> Likely accessing undefined property
              └─> OR userInfo.username is undefined
              └─> OR manifest object is in unexpected state
```

### Key Code Locations

**1. Size validation** (`src/commands/publish.ts:382-385`):
```typescript
const sizeMB = tarballBuffer.length / (1024 * 1024);
if (sizeMB > 10) {
  throw new Error(`Package size (${sizeMB.toFixed(2)}MB) exceeds 10MB limit`);
}
```

**2. Error handling** (`src/commands/publish.ts:681-696`):
```typescript
} catch (err) {
  const pkgError = err instanceof Error ? err.message : String(err);
  // Try to use scoped name if we have user info, otherwise fall back to manifest name
  const displayName = userInfo
    ? predictScopedPackageName(
        manifest.name,           // ← manifest.name might be undefined?
        userInfo.username,       // ← userInfo.username might be undefined?
        manifest.organization
      )
    : manifest.name;            // ← manifest.name might be undefined?
  console.error(`\n❌ Failed to publish ${displayName}: ${pkgError}\n`);
  failedPackages.push({
    name: displayName,
    error: pkgError
  });
}
```

**3. Variables in scope**:
- `manifest`: Set at line 495 from `filteredManifests[i]`
- `userInfo`: Set at line 422-484 (might be undefined if not logged in or API fails)
- `packageName`: Set at line 496 to `manifest.name`

### Hypothesis

Most likely causes (in order of probability):

1. **`userInfo.username` is undefined**: Even though `userInfo` exists, `username` property might not be set
2. **Helper function assumes properties exist**: `predictScopedPackageName()` doesn't handle undefined inputs
3. **State corruption**: Error occurs during helper function calls before tarball creation, leaving manifest in unexpected state

## Proposed Solutions

### Option 1: Quick Fix (15 minutes)

Add defensive null checking in the error handler:

```typescript
} catch (err) {
  const pkgError = err instanceof Error ? err.message : String(err);

  // Safely construct display name with fallbacks
  let displayName: string;
  try {
    if (userInfo && userInfo.username && manifest?.name) {
      displayName = predictScopedPackageName(
        manifest.name,
        userInfo.username,
        manifest.organization
      );
    } else if (manifest?.name) {
      displayName = manifest.name;
    } else {
      displayName = packageName || 'unknown-package';
    }
  } catch {
    // Fallback if scoped name prediction fails
    displayName = packageName || 'unknown-package';
  }

  console.error(`\n❌ Failed to publish ${displayName}: ${pkgError}\n`);
  failedPackages.push({
    name: displayName,
    error: pkgError
  });
}
```

### Option 2: Proper Fix (30 minutes)

1. **Add null checks to helper functions**:

```typescript
function predictScopedPackageName(
  packageName: string | undefined,
  username: string | undefined,
  organization?: string
): string {
  if (!packageName) {
    throw new Error('Package name is required');
  }
  if (!username) {
    throw new Error('Username is required for scoped package names');
  }
  // ... rest of function
}
```

2. **Update error handling with better structure**:

```typescript
} catch (err) {
  const pkgError = err instanceof Error ? err.message : String(err);

  // Extract safe display name
  const displayName = getSafePackageName(manifest, userInfo, packageName);

  console.error(`\n❌ Failed to publish ${displayName}: ${pkgError}\n`);
  failedPackages.push({
    name: displayName,
    error: pkgError
  });
}

// New helper function
function getSafePackageName(
  manifest: PackageManifest | undefined,
  userInfo: any,
  fallbackName?: string
): string {
  if (!manifest?.name) {
    return fallbackName || 'unknown-package';
  }

  try {
    if (userInfo?.username) {
      return predictScopedPackageName(
        manifest.name,
        userInfo.username,
        manifest.organization
      );
    }
  } catch {
    // Fall through to return manifest name
  }

  return manifest.name;
}
```

3. **Add specific error type for size limit**:

```typescript
class PackageSizeLimitError extends Error {
  constructor(actualMB: number, limitMB: number = 10) {
    super(`Package size (${actualMB.toFixed(2)}MB) exceeds ${limitMB}MB limit`);
    this.name = 'PackageSizeLimitError';
  }
}

// In createTarball():
if (sizeMB > 10) {
  throw new PackageSizeLimitError(sizeMB);
}
```

### Option 3: Comprehensive Fix (1 hour)

Refactor entire error handling flow:

1. Create typed error classes for all publish errors
2. Add error recovery strategies
3. Ensure all helper functions validate inputs
4. Add comprehensive logging for debugging
5. Update all tests to cover error paths

## Testing Strategy

Once fixed, the test should:

```typescript
it('should reject packages over size limit', async () => {
  await createMockPackage(testDir, 'huge-package', 'cursor');

  // Create a large file (> 10MB)
  const largeContent = Buffer.alloc(11 * 1024 * 1024, 'x');
  await writeFile(join(testDir, 'large-file.txt'), largeContent);

  // Update manifest to include the large file
  const manifest = JSON.parse(await readFile(join(testDir, 'prpm.json'), 'utf-8'));
  manifest.files = ['prpm.json', '.cursorrules', 'large-file.txt'];
  await writeFile(join(testDir, 'prpm.json'), JSON.stringify(manifest));

  await expect(handlePublish({})).rejects.toThrow(CLIError);
  await expect(handlePublish({})).rejects.toThrow(/exceeds 10MB limit/i);
});
```

Also add tests for:
- Size exactly at limit (10MB)
- Size just under limit (9.99MB)
- Multiple packages where one exceeds limit
- Error message format and clarity

## Related Issues

- Error handling consistency across publish command
- Input validation in helper functions
- Type safety for user info objects
- Logging for debugging publish errors

## Files to Modify

1. **`src/commands/publish.ts`**:
   - Lines 681-696 (error handler)
   - Lines 382-385 (size validation)
   - Potentially add new helper function

2. **`src/__tests__/e2e/publish.e2e.test.ts`**:
   - Line 209: Un-skip the test
   - Verify test passes after fix

3. **`src/core/errors.ts`** (optional):
   - Add `PackageSizeLimitError` class

## Success Criteria

- [ ] Test "should reject packages over size limit" passes
- [ ] Error message clearly shows size and limit
- [ ] No secondary errors during error handling
- [ ] Other publish tests still pass
- [ ] Error handling documented

## Additional Context

This bug was discovered during test suite hardening after migrating from `process.exit()` to `CLIError` pattern. The test was skipped because it revealed a pre-existing bug in error handling that should be fixed separately from the main migration work.

The bug doesn't affect normal publishing (packages under 10MB), only the error path when limits are exceeded.
