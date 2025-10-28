# Multi-Package Performance Analysis

## Current Single-Package Publish Flow

Per package, the publish command performs:

1. **Validation** (~5-10ms)
   - JSON schema validation
   - Field validation
   - File existence checks

2. **File Operations** (~50-200ms depending on file count/size)
   - Read LICENSE file
   - Extract license text
   - Read snippet content (first 2KB of main file)
   - Create tarball from all files

3. **API Calls** (~500-2000ms depending on network)
   - `whoami()` - Get user info + organizations
   - `publish()` - Upload tarball + metadata

4. **Total per package**: ~600-2500ms (mostly network I/O)

## Multi-Package Scenarios

### Sequential Publishing (Current naive approach)
```
10 packages × 1000ms avg = 10,000ms (10 seconds)
```

### Parallel Publishing (Optimized)
```
10 packages / 5 concurrent = 2 batches × 1000ms = 2,000ms (2 seconds)
5x improvement
```

## Performance Considerations

### 1. **Network I/O** (Biggest bottleneck)
- **Issue**: Sequential uploads waste time
- **Solution**: Parallel uploads with concurrency limit
- **Benefit**: 3-5x faster for 5-10 packages

### 2. **File Operations** (Medium impact)
- **Issue**: Re-reading LICENSE for each package
- **Solution**: Cache license info at root level
- **Benefit**: ~50-100ms saved per package after first

### 3. **API Calls** (Medium impact)
- **Issue**: Multiple `whoami()` calls for org validation
- **Solution**: Single `whoami()` call, cache result
- **Benefit**: ~500ms saved (already done in current design)

### 4. **Validation** (Low impact)
- **Issue**: Per-package validation
- **Solution**: Already fast, no optimization needed
- **Benefit**: Negligible

### 5. **Memory Usage** (Consideration)
- **Issue**: Multiple tarballs in memory simultaneously
- **Solution**: Stream tarballs or limit concurrency
- **Mitigation**: Max 5 concurrent uploads = ~50MB max (10MB each)

## Recommended Implementation

### Strategy: Controlled Parallel Publishing

```typescript
async function publishMultiPackage(manifest: MultiPackageManifest, options: PublishOptions) {
  // 1. Validate ALL packages first (fail fast)
  const packages = getPackagesWithInheritance(manifest);
  await validateAllPackages(packages);

  // 2. Extract shared resources ONCE
  const sharedLicense = await extractLicenseInfo(manifest.repository);
  const userInfo = await client.whoami();

  // 3. Publish in batches with concurrency control
  const results = await publishInBatches(packages, {
    concurrency: 5,
    sharedLicense,
    userInfo,
    onProgress: (pkg, index, total) => {
      console.log(`Publishing ${index + 1}/${total}: ${pkg.name}`);
    }
  });

  // 4. Report results
  reportResults(results);
}
```

### Concurrency Limits

**Recommended**: 5 concurrent uploads
- **Rationale**:
  - Network bandwidth typically supports 5-10 parallel connections
  - Memory usage: 5 × 10MB = 50MB (acceptable)
  - Registry load: Reasonable for server
  - Error isolation: Easier to debug with limited concurrency

**Configurable**: Allow override via CLI
```bash
prpm publish --concurrency 3
```

## Error Handling Strategy

### Partial Failure Scenarios

**Problem**: Package 3 of 10 fails - what happens to the rest?

**Options**:

#### 1. **Fail Fast** (Recommended for safety)
```
✓ pkg1
✓ pkg2
✗ pkg3 - STOP HERE
  pkg4-10 not published
```
- **Pros**: Prevents partial state, easier rollback
- **Cons**: Slower for large batches

#### 2. **Continue on Error** (Faster but riskier)
```
✓ pkg1
✓ pkg2
✗ pkg3 - LOG ERROR, CONTINUE
✓ pkg4
...
Final: 9/10 succeeded, 1 failed
```
- **Pros**: Publishes as many as possible
- **Cons**: Partial success state, harder to reason about

#### 3. **Hybrid** (Best of both)
```
Validate ALL packages first
If any validation fails -> STOP
If all valid -> publish with continue-on-error
```
- **Pros**: Fast validation catches most issues early
- **Cons**: Still possible network/server errors during upload

**Recommendation**: Hybrid approach with CLI flag
```bash
prpm publish --continue-on-error  # Enable partial success
prpm publish --strict             # Stop on first error (default)
```

## Optimization Techniques

### 1. **Shared Resource Caching**
```typescript
class PublishContext {
  private licenseCache = new Map<string, LicenseInfo>();
  private userInfoCache: UserInfo | null = null;

  async getLicense(repo: string): Promise<LicenseInfo> {
    if (!this.licenseCache.has(repo)) {
      this.licenseCache.set(repo, await extractLicenseInfo(repo));
    }
    return this.licenseCache.get(repo)!;
  }
}
```
**Benefit**: Avoid re-reading LICENSE 10 times for 10 packages

### 2. **Tarball Streaming**
```typescript
// Instead of:
const tarball = await createTarball(files); // Load all into memory
await client.publish(manifest, tarball);

// Do:
const tarballStream = createTarballStream(files);
await client.publishStream(manifest, tarballStream);
```
**Benefit**: Reduced memory usage for large packages

### 3. **Progress Reporting**
```typescript
const progress = new ProgressBar('Publishing [:bar] :current/:total :package', {
  total: packages.length
});

for (const pkg of packages) {
  await publish(pkg);
  progress.tick({ package: pkg.name });
}
```
**Benefit**: User experience, shows which package is slow

### 4. **Retry Logic**
```typescript
async function publishWithRetry(pkg: PackageManifest, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await client.publish(pkg);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```
**Benefit**: Handle transient network failures

## Performance Benchmarks (Estimated)

### 5 Packages

| Strategy | Time | Speedup |
|----------|------|---------|
| Sequential | 5s | 1x |
| Parallel (3) | 2.5s | 2x |
| Parallel (5) | 1.5s | 3.3x |

### 10 Packages

| Strategy | Time | Speedup |
|----------|------|---------|
| Sequential | 10s | 1x |
| Parallel (3) | 4s | 2.5x |
| Parallel (5) | 2.5s | 4x |

### 20 Packages

| Strategy | Time | Speedup |
|----------|------|---------|
| Sequential | 20s | 1x |
| Parallel (3) | 7.5s | 2.7x |
| Parallel (5) | 5s | 4x |

## Memory Considerations

### Per-Package Memory Usage
- **Tarball**: ~1-10MB (depending on files)
- **Metadata**: ~1-5KB
- **License text**: ~5-50KB

### Total Memory (Parallel)
- **5 concurrent × 10MB** = **50MB peak**
- **10 concurrent × 10MB** = **100MB peak**

**Recommendation**: Keep concurrency ≤ 5 to stay under 100MB

## Registry Considerations

### Rate Limiting
- Current registry may have rate limits
- **Solution**: Respect `Retry-After` headers
- **Solution**: Add `--delay` flag between uploads

### Server Load
- Parallel uploads increase server load
- **Mitigation**: Concurrency limit protects server
- **Mitigation**: Add server-side queueing if needed

## Implementation Priorities

### Phase 1: Basic Sequential (MVP)
- [x] Validate all packages
- [ ] Publish one at a time
- [ ] Simple error handling
- **ETA**: ~2 hours
- **Performance**: 1x baseline

### Phase 2: Parallel Publishing
- [ ] Batch processing with concurrency
- [ ] Shared resource caching
- [ ] Progress reporting
- **ETA**: ~4 hours
- **Performance**: 3-4x faster

### Phase 3: Advanced Features
- [ ] Retry logic
- [ ] Streaming tarballs
- [ ] Configurable concurrency
- **ETA**: ~3 hours
- **Performance**: 4-5x faster + robust

## Recommendations

1. ✅ **Start with sequential** for MVP (simpler, safer)
2. ✅ **Add concurrency** in Phase 2 (big performance win)
3. ✅ **Cache shared resources** (easy optimization)
4. ✅ **Fail fast on validation** (prevent wasted time)
5. ⚠️ **Consider partial success mode** for advanced users
6. ⚠️ **Add progress reporting** for UX
7. ⚠️ **Monitor memory usage** with large package counts

## Configuration Example

```json
{
  "name": "@myorg/monorepo",
  "publishConfig": {
    "concurrency": 5,
    "continueOnError": false,
    "retries": 3,
    "retryDelay": 1000
  },
  "packages": [...]
}
```

## CLI Flags

```bash
# Performance tuning
prpm publish --concurrency 3
prpm publish --sequential  # Force sequential (debugging)
prpm publish --delay 500   # 500ms delay between uploads

# Error handling
prpm publish --strict              # Stop on first error (default)
prpm publish --continue-on-error   # Publish all, report failures
prpm publish --retries 5           # Retry failed uploads

# Progress
prpm publish --quiet               # No progress output
prpm publish --verbose             # Detailed progress
```
