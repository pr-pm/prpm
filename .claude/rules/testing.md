---
description: Testing patterns and requirements for the PRPM monorepo
globs:
  - "**/*.test.ts"
  - "**/*.e2e.test.ts"
  - "**/vitest.config.ts"
---

# Testing Patterns

## Test File Structure

```
src/
  __tests__/
    *.test.ts           # Unit tests
    e2e/
      *.e2e.test.ts     # End-to-end tests
  utils/
    __tests__/
      *.test.ts         # Utility tests
```

## Vitest Configuration

Standard configuration pattern:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    testTimeout: 10000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },  // Sequential for port conflicts
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@pr-pm/types': new URL('../types/src', import.meta.url).pathname,
    },
  },
});
```

## Mocking Pattern

```typescript
import { vi, Mock, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('@pr-pm/registry-client');
vi.mock('../core/user-config');
vi.mock('../core/telemetry');  // Always mock telemetry

beforeEach(() => {
  (getRegistryClient as Mock).mockReturnValue(mockClient);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreMocks();
});
```

## Temp Directory Pattern

For tests that create files:

```typescript
import { mkdtemp, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('file operations', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'prpm-test-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('creates files correctly', async () => {
    // Use tempDir for all file operations
  });
});
```

## Converter Test Requirements

For converter changes, include:

1. **Basic conversion tests** - Normal input produces expected output
2. **Security tests** - Path traversal, injection prevention
3. **Roundtrip tests** - from -> to -> from consistency
4. **Edge cases** - Empty content, missing metadata

```typescript
describe('security', () => {
  it('rejects path traversal', () => {
    expect(() => convert('content', { path: '../escape' }))
      .toThrow(/invalid path/i);
  });

  it('rejects absolute paths', () => {
    expect(() => convert('content', { path: '/etc/passwd' }))
      .toThrow(/invalid path/i);
  });
});
```

## CLI Test Requirements

1. Mock external dependencies (registry client, telemetry)
2. Test success and error paths
3. Verify exit codes via CLIError

```typescript
it('throws CLIError for missing package', async () => {
  mockClient.getPackage.mockResolvedValue(null);

  await expect(installCommand('nonexistent'))
    .rejects.toThrow(CLIError);
});
```

## Shared Test Fixtures

Use fixtures from setup files:

```typescript
import { sampleCanonicalPackage, minimalCanonicalPackage } from './setup.js';

it('converts sample package', () => {
  const result = toFormat(sampleCanonicalPackage);
  expect(result.qualityScore).toBeGreaterThan(80);
});
```
