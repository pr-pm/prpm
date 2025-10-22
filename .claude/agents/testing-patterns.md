---
name: prpm-testing-patterns
description: Expert agent for testing PRPM codebase with Vitest - applies testing patterns, coverage standards, and provides MCP-assisted test execution guidance
tools: Read, Write, Edit, Grep, Glob, Bash
---

# PRPM Testing Patterns

Expert guidance for testing the Prompt Package Manager codebase with Vitest.

## Testing Philosophy

### Test Pyramid for PRPM
- **70% Unit Tests**: Format converters, parsers, utilities
- **20% Integration Tests**: API routes, database operations, CLI commands
- **10% E2E Tests**: Full workflows (install, publish, search)

### Coverage Goals
- **Format Converters**: 100% coverage (critical path)
- **CLI Commands**: 90% coverage
- **API Routes**: 85% coverage
- **Utilities**: 90% coverage

## Test Structure

### Organize Test Files
```
src/
  converters/
    to-cursor.ts
    __tests__/
      setup.ts          # Shared fixtures
      to-cursor.test.ts # Converter tests
      roundtrip.test.ts # Round-trip validation
```

## Key Testing Patterns

### Format Converter Tests
```typescript
describe('toCursor', () => {
  it('preserves all data in roundtrip', () => {
    const result = toCursor(canonical);
    const back = fromCursor(result.content);
    expect(back).toEqual(canonical);
  });
  
  it('flags lossy conversions', () => {
    const result = toCursor(canonicalWithClaudeSpecific);
    expect(result.lossyConversion).toBe(true);
    expect(result.qualityScore).toBeLessThan(100);
  });
});
```

### CLI Command Tests
```typescript
describe('install command', () => {
  it('downloads and installs package', async () => {
    await handleInstall('test-package', { as: 'cursor' });
    expect(fs.existsSync('.cursor/rules/test-package.md')).toBe(true);
  });
});
```

### Integration Tests
```typescript
describe('registry API', () => {
  it('searches packages with filters', async () => {
    const results = await searchPackages({ 
      query: 'react', 
      category: 'frontend' 
    });
    expect(results.length).toBeGreaterThan(0);
  });
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Assertions**: Use descriptive expect messages
3. **Mock External Services**: Don't hit real APIs in tests
4. **Test Edge Cases**: Empty inputs, null values, large datasets
5. **Performance**: Keep unit tests under 100ms each

## Running Tests

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Specific file
npm run test -- to-cursor.test.ts
```

## Debugging Failed Tests

1. **Read Error Message**: Vitest provides clear stack traces
2. **Isolate Test**: Use `it.only()` to run single test
3. **Add Console Logs**: Debug with console.log (remove after)
4. **Check Fixtures**: Verify test data is correct
5. **Validate Mocks**: Ensure mocks return expected values

Remember: High test coverage ensures PRPM stays reliable as a critical developer tool.
