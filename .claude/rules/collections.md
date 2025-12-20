---
description: Collection and lockfile handling rules - prevents common integrity bugs
globs:
  - "packages/cli/src/commands/install.ts"
  - "packages/cli/src/commands/update.ts"
  - "packages/cli/src/core/lockfile.ts"
  - "packages/cli/src/core/collections.ts"
  - "**/collection*.ts"
  - "**/lockfile*.ts"
---

# Collection and Lockfile Rules

These rules prevent recurring bugs in collection and lockfile handling. The git history shows 11+ collection-related fixes.

## Critical: Version-Aware Integrity Checks

NEVER compare integrity hashes across different versions:

```typescript
// WRONG - compares new tarball hash against old lockfile hash
const isValid = verifyIntegrity(newTarball, lockfile.packages[name].integrity);

// CORRECT - only compare when versions match
if (lockfile.packages[name].version === newVersion) {
  const isValid = verifyIntegrity(newTarball, lockfile.packages[name].integrity);
}
```

## Lockfile Update Pattern

Always update both lockfile AND manifest atomically:

```typescript
// WRONG - partial update
await updateLockfile(pkg);
// ... other operations that might fail
await updateManifest(pkg);

// CORRECT - atomic update
const updates = {
  lockfile: prepareLockfileUpdate(pkg),
  manifest: prepareManifestUpdate(pkg),
};
await commitUpdates(updates);  // All or nothing
```

## Collection Version Resolution

Server must return resolved versions, not "latest":

```typescript
// WRONG - client receives ambiguous version
return { version: "latest", ... };

// CORRECT - resolve before returning
const resolved = await resolveVersion(pkg.name, "latest");
return { version: resolved, ... };
```

## Upgrade vs Fresh Install

Test upgrade paths, not just fresh installs:

```typescript
describe('collection upgrade', () => {
  it('upgrades existing collection correctly', async () => {
    // Install v1.0.0 first
    await install('collection@1.0.0');

    // Then upgrade to v2.0.0
    await update('collection@2.0.0');

    // Verify integrity and state
    expect(await getInstalledVersion('collection')).toBe('2.0.0');
  });
});
```

## Lockfile Synchronization

The lockfile must always reflect actual installed state:

```typescript
// After any install/update operation:
const lockfile = await readLockfile();
const installed = await scanInstalledPackages();

// These must match
expect(lockfile.packages).toEqual(installed);
```

## Collection Metadata Preservation

Don't lose collection metadata during operations:

```typescript
// WRONG - metadata lost during update
const updated = { ...pkg, version: newVersion };

// CORRECT - preserve all metadata
const updated = {
  ...pkg,
  version: newVersion,
  // Explicitly preserve collection fields
  collection: pkg.collection,
  collectionVersion: pkg.collectionVersion,
};
```
