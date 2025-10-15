/**
 * Unit tests for test command
 */

import { handleTest } from '../../src/commands/test';

// Mock the core modules
jest.mock('../../src/core/cli-bridge');
jest.mock('../../src/core/test-runner');
jest.mock('../../src/core/role-scenarios');
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
  },
}));

describe('Test Command', () => {
  const originalExit = process.exit;

  beforeEach(() => {
    process.exit = jest.fn() as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.exit = originalExit;
  });

  it('should handle test execution successfully', async () => {
    const { isCLIAvailable } = require('../../src/core/cli-bridge');
    const { runTests, generateTestReport } = require('../../src/core/test-runner');
    const { promises: fs } = require('fs');

    // Mock file exists
    fs.access.mockResolvedValue(undefined);

    // Mock CLI availability
    isCLIAvailable.mockResolvedValue(true);

    // Mock test execution
    const mockResult = {
      passed: true,
      total: 5,
      passedCount: 5,
      failedCount: 0,
      results: [],
    };
    runTests.mockResolvedValue(mockResult);

    // Mock report generation
    generateTestReport.mockReturnValue('Test report');

    await handleTest('test-prompt.md', {
      with: 'cursor',
      verbose: false,
    });

    expect(fs.access).toHaveBeenCalledWith('test-prompt.md');
    expect(isCLIAvailable).toHaveBeenCalledWith('cursor');
    expect(runTests).toHaveBeenCalledWith('test-prompt.md', {
      tool: 'cursor',
      scenarios: undefined,
      role: undefined,
      autoDetectRole: undefined,
      verbose: false,
      isolated: undefined,
    });
    expect(generateTestReport).toHaveBeenCalledWith('test-prompt.md', 'cursor', mockResult);
  });

  it('should fail when prompt file does not exist', async () => {
    const { promises: fs } = require('fs');

    // Mock file does not exist
    fs.access.mockRejectedValue(new Error('ENOENT'));

    await handleTest('nonexistent.md', {
      with: 'cursor',
    });

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should fail when tool is not available', async () => {
    const { isCLIAvailable } = require('../../src/core/cli-bridge');
    const { promises: fs } = require('fs');

    // Mock file exists
    fs.access.mockResolvedValue(undefined);

    // Mock CLI not available
    isCLIAvailable.mockResolvedValue(false);

    await handleTest('test-prompt.md', {
      with: 'cursor',
    });

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should fail when tool is invalid', async () => {
    await handleTest('test-prompt.md', {
      with: 'invalid-tool',
    });

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle test failures', async () => {
    const { isCLIAvailable } = require('../../src/core/cli-bridge');
    const { runTests, generateTestReport } = require('../../src/core/test-runner');
    const { promises: fs } = require('fs');

    // Mock file exists
    fs.access.mockResolvedValue(undefined);

    // Mock CLI availability
    isCLIAvailable.mockResolvedValue(true);

    // Mock test execution with failures
    const mockResult = {
      passed: false,
      total: 5,
      passedCount: 3,
      failedCount: 2,
      results: [],
    };
    runTests.mockResolvedValue(mockResult);

    // Mock report generation
    generateTestReport.mockReturnValue('Test report with failures');

    await handleTest('test-prompt.md', {
      with: 'cursor',
    });

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should load custom scenarios when provided', async () => {
    const { isCLIAvailable } = require('../../src/core/cli-bridge');
    const { runTests, generateTestReport, loadTestScenarios } = require('../../src/core/test-runner');
    const { promises: fs } = require('fs');

    // Mock file exists
    fs.access.mockResolvedValue(undefined);

    // Mock CLI availability
    isCLIAvailable.mockResolvedValue(true);

    // Mock scenario loading
    const mockScenarios = [
      { description: 'Test 1', input: 'input 1' },
      { description: 'Test 2', input: 'input 2' },
    ];
    loadTestScenarios.mockResolvedValue(mockScenarios);

    // Mock test execution
    const mockResult = {
      passed: true,
      total: 2,
      passedCount: 2,
      failedCount: 0,
      results: [],
    };
    runTests.mockResolvedValue(mockResult);

    // Mock report generation
    generateTestReport.mockReturnValue('Test report');

    await handleTest('test-prompt.md', {
      with: 'cursor',
      scenarios: 'scenarios.json',
    });

    expect(loadTestScenarios).toHaveBeenCalledWith('scenarios.json');
    expect(runTests).toHaveBeenCalledWith('test-prompt.md', {
      tool: 'cursor',
      scenarios: mockScenarios,
      role: undefined,
      autoDetectRole: undefined,
      verbose: undefined,
      isolated: undefined,
    });
  });

  it('should handle verbose mode', async () => {
    const { isCLIAvailable } = require('../../src/core/cli-bridge');
    const { runTests, generateTestReport } = require('../../src/core/test-runner');
    const { promises: fs } = require('fs');

    // Mock file exists
    fs.access.mockResolvedValue(undefined);

    // Mock CLI availability
    isCLIAvailable.mockResolvedValue(true);

    // Mock test execution
    const mockResult = {
      passed: true,
      total: 5,
      passedCount: 5,
      failedCount: 0,
      results: [],
    };
    runTests.mockResolvedValue(mockResult);

    // Mock report generation
    generateTestReport.mockReturnValue('Verbose test report');

    await handleTest('test-prompt.md', {
      with: 'claude',
      verbose: true,
    });

    expect(runTests).toHaveBeenCalledWith('test-prompt.md', {
      tool: 'claude',
      scenarios: undefined,
      role: undefined,
      autoDetectRole: undefined,
      verbose: true,
      isolated: undefined,
    });
  });

  it('should handle role-specific testing', async () => {
    const { isCLIAvailable } = require('../../src/core/cli-bridge');
    const { runTests, generateTestReport } = require('../../src/core/test-runner');
    const { promises: fs } = require('fs');

    // Mock file exists
    fs.access.mockResolvedValue(undefined);

    // Mock CLI availability
    isCLIAvailable.mockResolvedValue(true);

    // Mock test execution
    const mockResult = {
      passed: true,
      total: 3,
      passedCount: 3,
      failedCount: 0,
      results: [],
    };
    runTests.mockResolvedValue(mockResult);

    // Mock report generation
    generateTestReport.mockReturnValue('Role-based test report');

    await handleTest('test-prompt.md', {
      with: 'cursor',
      role: 'code-reviewer',
    });

    expect(runTests).toHaveBeenCalledWith('test-prompt.md', {
      tool: 'cursor',
      scenarios: undefined,
      role: 'code-reviewer',
      autoDetectRole: undefined,
      verbose: undefined,
      isolated: undefined,
    });
  });
});
