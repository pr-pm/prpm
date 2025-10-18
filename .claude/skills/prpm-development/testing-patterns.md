---
name: PRPM Testing Patterns
version: 1.0.0
description: Testing patterns for PRPM with MCP-assisted test execution
author: PRPM Team
tools:
  - filesystem
  - bash
mcpServers:
  filesystem:
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-filesystem"
      - "/home/khaliqgant/projects/prompt-package-manager"
---

# PRPM Testing Patterns (Claude + MCP)

Expert guidance for testing the Prompt Package Manager codebase with Vitest, enhanced with MCP filesystem and bash integrations.

## MCP-Enhanced Testing Workflow

### Use Filesystem MCP
- **Read Test Files**: Load test fixtures efficiently
- **Write Test Data**: Generate test scenarios
- **List Test Suites**: Discover all test files
- **Watch Tests**: Monitor test file changes

### Use Bash MCP
- **Run Tests**: Execute Vitest commands
- **Check Coverage**: View coverage reports
- **Run Specific Tests**: Target individual test files
- **Watch Mode**: Run tests in watch mode

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

## MCP-Assisted Test Execution

### Run Tests with Bash MCP
```typescript
// Execute Vitest via bash MCP
const result = await mcp.bash.execute('npm run test');
console.log(result.stdout);

// Run specific test file
const converterTest = await mcp.bash.execute(
  'npm run test -- to-cursor.test.ts'
);

// Run with coverage
const coverage = await mcp.bash.execute('npm run test:coverage');
```

### Load Test Fixtures with Filesystem MCP
```typescript
// Read test fixture
const fixture = await mcp.filesystem.readFile(
  'registry/src/converters/__tests__/setup.ts'
);

// List all test files
const testFiles = await mcp.filesystem.listFiles(
  'registry/src/converters/__tests__/',
  { pattern: '*.test.ts' }
);

// Load sample packages
const samplePackage = await mcp.filesystem.readFile(
  'examples/sample-cursor-rule.cursorrules'
);
```

## Test Structure with MCP

### Organize Test Files
```
src/
  converters/
    to-cursor.ts
    __tests__/
      setup.ts          # Fixtures loaded via MCP
      to-cursor.test.ts # Tests executed via MCP
      roundtrip.test.ts # Round-trip validation
```

### Create Fixtures with MCP
```typescript
// Use filesystem MCP to create test data
async function setupTestFixtures() {
  const fixtures = [
    {
      name: 'sample-cursor.cursorrules',
      content: generateCursorRule()
    },
    {
      name: 'sample-claude.md',
      content: generateClaudeAgent()
    }
  ];

  for (const fixture of fixtures) {
    await mcp.filesystem.writeFile(
      `__tests__/fixtures/${fixture.name}`,
      fixture.content
    );
  }
}
```

## Converter Testing with MCP

### Load Real Examples
```typescript
describe('toCursor with real examples', () => {
  it('should convert actual package', async () => {
    // Use filesystem MCP to load real package
    const realPackage = await mcp.filesystem.readFile(
      'packages/prpm-dogfooding-skill/cursor/core-principles.cursorrules'
    );

    const canonical = fromCursor(realPackage);
    const result = toCursor(canonical);

    expect(result.qualityScore).toBeGreaterThan(90);
  });
});
```

### Validate Against Files
```typescript
describe('Round-trip with file validation', () => {
  it('should preserve content through conversion', async () => {
    // Load original
    const original = await mcp.filesystem.readFile('examples/test.cursorrules');

    // Convert and write
    const canonical = fromCursor(original);
    const converted = toCursor(canonical);

    await mcp.filesystem.writeFile('temp/converted.cursorrules', converted.content);

    // Load and compare
    const convertedFile = await mcp.filesystem.readFile('temp/converted.cursorrules');

    expect(normalizeWhitespace(convertedFile))
      .toContain(normalizeWhitespace(original));
  });
});
```

## Running Tests with MCP

### Execute Full Test Suite
```typescript
async function runAllTests() {
  const result = await mcp.bash.execute('npm run test');

  if (result.exitCode !== 0) {
    console.error('Tests failed:', result.stderr);
    return false;
  }

  console.log('✅ All tests passed');
  return true;
}
```

### Run Specific Test Category
```typescript
async function runConverterTests() {
  const result = await mcp.bash.execute(
    'npm run test -- converters/__tests__/'
  );

  return result;
}
```

### Get Coverage Report
```typescript
async function checkCoverage() {
  // Run tests with coverage
  await mcp.bash.execute('npm run test:coverage');

  // Read coverage report
  const coverageJson = await mcp.filesystem.readFile(
    'coverage/coverage-summary.json'
  );

  const coverage = JSON.parse(coverageJson);
  return coverage.total;
}
```

## Test Fixtures with MCP

### Generate Test Data
```typescript
async function generateTestFixtures() {
  const packages = [
    {
      format: 'cursor',
      name: 'typescript-expert',
      content: generateTypeScriptExpert()
    },
    {
      format: 'claude',
      name: 'format-converter',
      content: generateFormatConverter()
    }
  ];

  for (const pkg of packages) {
    const path = `__tests__/fixtures/${pkg.format}/${pkg.name}.md`;
    await mcp.filesystem.writeFile(path, pkg.content);
  }
}
```

### Load Fixtures Dynamically
```typescript
describe('Converter tests with dynamic fixtures', () => {
  let fixtures: Map<string, string>;

  beforeAll(async () => {
    fixtures = new Map();

    // Use MCP to load all fixtures
    const files = await mcp.filesystem.listFiles('__tests__/fixtures/');

    for (const file of files) {
      const content = await mcp.filesystem.readFile(file);
      fixtures.set(file, content);
    }
  });

  it('should convert all fixtures', () => {
    for (const [name, content] of fixtures) {
      const result = convert(content);
      expect(result).toBeDefined();
    }
  });
});
```

## API Testing with MCP

### Test with Real Database
```typescript
describe('Package API with database', () => {
  beforeAll(async () => {
    // Reset database
    await mcp.bash.execute('npm run db:reset');

    // Seed test data
    const seedScript = await mcp.filesystem.readFile('scripts/seed/test-data.sql');
    await mcp.bash.execute(`psql -f ${seedScript}`);
  });

  it('should retrieve package', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/api/v1/packages/test-package'
    });

    expect(response.statusCode).toBe(200);
  });
});
```

## CLI Testing with MCP

### Execute CLI Commands
```typescript
describe('prpm install', () => {
  it('should install package via CLI', async () => {
    const result = await mcp.bash.execute(
      'node dist/index.js install test-package'
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('✅ Successfully installed');

    // Verify installation
    const installed = await mcp.filesystem.exists(
      '.cursor/rules/test-package.cursorrules'
    );
    expect(installed).toBe(true);
  });
});
```

### Test Collection Installation
```typescript
describe('prpm collections', () => {
  it('should install collection', async () => {
    const result = await mcp.bash.execute(
      'node dist/index.js install @collection/typescript-fullstack'
    );

    expect(result.exitCode).toBe(0);

    // Verify all packages installed
    const packages = ['typescript-expert', 'nodejs-backend', 'react-typescript'];

    for (const pkg of packages) {
      const exists = await mcp.filesystem.exists(
        `.cursor/rules/${pkg}.cursorrules`
      );
      expect(exists).toBe(true);
    }
  });
});
```

## Test Utilities with MCP

### Create Test Helper Functions
```typescript
export async function loadTestPackage(name: string): Promise<string> {
  return await mcp.filesystem.readFile(`__tests__/fixtures/${name}`);
}

export async function writeTestOutput(name: string, content: string): Promise<void> {
  await mcp.filesystem.writeFile(`__tests__/output/${name}`, content);
}

export async function cleanTestDir(): Promise<void> {
  await mcp.bash.execute('rm -rf __tests__/output/*');
}

export async function runTestCommand(cmd: string): Promise<CommandResult> {
  return await mcp.bash.execute(cmd);
}
```

## Watch Mode with MCP

### Run Tests in Watch Mode
```typescript
async function watchTests() {
  // Start watch mode (non-blocking)
  mcp.bash.executeBackground('npm run test:watch');

  console.log('📺 Tests running in watch mode');
  console.log('   Edit files to trigger re-run');
}
```

### Monitor Test File Changes
```typescript
async function watchTestFiles() {
  const watcher = await mcp.filesystem.watch('src/**/*.test.ts');

  watcher.on('change', async (file) => {
    console.log(`File changed: ${file}`);

    // Run specific test
    const result = await mcp.bash.execute(`npm run test -- ${file}`);
    console.log(result.stdout);
  });
}
```

## Coverage Analysis with MCP

### Generate and Read Coverage
```typescript
async function analyzeCoverage() {
  // Run tests with coverage
  await mcp.bash.execute('npm run test:coverage');

  // Read coverage data
  const coverageData = await mcp.filesystem.readFile(
    'coverage/coverage-summary.json'
  );

  const coverage = JSON.parse(coverageData);

  // Analyze converter coverage
  const converterCoverage = coverage['src/converters/'];

  console.log('Converter Coverage:');
  console.log(`  Lines: ${converterCoverage.lines.pct}%`);
  console.log(`  Functions: ${converterCoverage.functions.pct}%`);
  console.log(`  Branches: ${converterCoverage.branches.pct}%`);

  return converterCoverage;
}
```

### Find Uncovered Code
```typescript
async function findUncoveredCode() {
  const lcovReport = await mcp.filesystem.readFile('coverage/lcov.info');

  // Parse LCOV to find uncovered lines
  const uncovered = parseLcov(lcovReport)
    .filter(line => !line.covered)
    .map(line => `${line.file}:${line.number}`);

  console.log('Uncovered lines:', uncovered);
  return uncovered;
}
```

## Debugging with MCP

### Run Single Test with Debug
```typescript
async function debugTest(testFile: string) {
  // Run test with debug output
  const result = await mcp.bash.execute(
    `DEBUG=* npm run test -- ${testFile}`
  );

  // Save debug output
  await mcp.filesystem.writeFile(
    `debug/${testFile}.log`,
    result.stdout + '\n' + result.stderr
  );

  return result;
}
```

### Capture Test Failures
```typescript
async function captureFailures() {
  const result = await mcp.bash.execute('npm run test');

  if (result.exitCode !== 0) {
    // Save failure output
    await mcp.filesystem.writeFile(
      'test-failures.log',
      `${new Date().toISOString()}\n${result.stderr}`
    );
  }

  return result;
}
```

## Common MCP Testing Patterns

### Setup Test Environment
```bash
# Via MCP bash
await mcp.bash.execute('npm run db:setup');
await mcp.bash.execute('npm run seed:test-data');
```

### Clean Test Artifacts
```bash
# Via MCP bash
await mcp.bash.execute('rm -rf __tests__/output');
await mcp.bash.execute('rm -rf coverage');
```

### Build Before Testing
```bash
# Via MCP bash
await mcp.bash.execute('npm run build');
await mcp.bash.execute('npm run test');
```

## Best Practices with MCP

1. **Use Filesystem MCP for Test Data**
   - Load fixtures dynamically
   - Generate test files
   - Validate outputs

2. **Use Bash MCP for Test Execution**
   - Run test commands
   - Execute setup scripts
   - Clean up after tests

3. **Cache Test Results**
   - Save coverage reports
   - Store test outputs
   - Keep failure logs

4. **Parallel Test Execution**
   - Use MCP to run tests in parallel
   - Monitor multiple test runs
   - Aggregate results

Remember: MCP makes testing more efficient. Use filesystem MCP for test data, bash MCP for test execution, and combine them for powerful test workflows.
