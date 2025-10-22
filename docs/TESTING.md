# Testing PRPM

Testing guide for PRPM development.

## Test Pyramid

- 70% Unit Tests
- 20% Integration Tests
- 10% E2E Tests

## Running Tests

```bash
# All tests
npm test

# CLI tests
npm test --workspace=prpm

# Registry tests
npm test --workspace=@prpm/registry

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Key Test Areas

### Format Converters (100% coverage required)
- Canonical ↔ Cursor
- Canonical ↔ Claude
- Canonical ↔ Continue
- Canonical ↔ Windsurf
- Roundtrip tests

### CLI Commands (90% coverage)
- install, remove, update, upgrade
- search, trending, popular
- collections list, collections info

### API Routes (85% coverage)
- Package endpoints
- Collection endpoints
- Authentication

## See Also

- [CLI Reference](./CLI.md)
- [Configuration](./CONFIGURATION.md)
