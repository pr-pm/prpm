/**
 * Integration tests for index command
 */

import { handleIndex } from '../../src/commands/index';
import { Package } from '../../src/types';

// Mock the core modules
jest.mock('../../src/core/config');
jest.mock('../../src/core/filesystem');

describe('Index Command', () => {
  let tempDir: string;
  const originalCwd = process.cwd();
  const originalExit = process.exit;

  beforeEach(async () => {
    tempDir = await (global as any).testUtils.createTempDir();
    process.chdir(tempDir);
    process.exit = jest.fn() as any;
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    process.exit = originalExit;
    await (global as any).testUtils.cleanupTempDir(tempDir);
    jest.clearAllMocks();
  });

  it('should index existing cursor files', async () => {
    // Create test files
    await (global as any).testUtils.createTestFile('.cursor/rules/test-rules.md', '# Test Cursor Rules');
    await (global as any).testUtils.createTestFile('.cursor/rules/another-rules.md', '# Another Rules');

    // Mock empty existing packages
    const { listPackages, addPackage } = require('../../src/core/config');
    const { generateId } = require('../../src/core/filesystem');

    listPackages.mockResolvedValue([]);
    generateId.mockImplementation((filename: string) => {
      return filename.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    });
    addPackage.mockResolvedValue(undefined);

    await handleIndex();

    expect(listPackages).toHaveBeenCalled();
    expect(addPackage).toHaveBeenCalledTimes(2);
    expect(addPackage).toHaveBeenCalledWith({
      id: 'test-rules',
      type: 'cursor',
      url: expect.stringContaining('file://'),
      dest: '.cursor/rules/test-rules.md'
    });
    expect(addPackage).toHaveBeenCalledWith({
      id: 'another-rules',
      type: 'cursor',
      url: expect.stringContaining('file://'),
      dest: '.cursor/rules/another-rules.md'
    });
  });

  it('should index existing claude files', async () => {
    // Create test files
    await (global as any).testUtils.createTestFile('.claude/agents/helper-agent.md', '# Helper Agent');
    await (global as any).testUtils.createTestFile('.claude/agents/reviewer-agent.md', '# Reviewer Agent');

    // Mock empty existing packages
    const { listPackages, addPackage } = require('../../src/core/config');
    const { generateId } = require('../../src/core/filesystem');

    listPackages.mockResolvedValue([]);
    generateId.mockImplementation((filename: string) => {
      return filename.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    });
    addPackage.mockResolvedValue(undefined);

    await handleIndex();

    expect(addPackage).toHaveBeenCalledTimes(2);
    expect(addPackage).toHaveBeenCalledWith({
      id: 'helper-agent',
      type: 'claude',
      url: expect.stringContaining('file://'),
      dest: '.claude/agents/helper-agent.md'
    });
    expect(addPackage).toHaveBeenCalledWith({
      id: 'reviewer-agent',
      type: 'claude',
      url: expect.stringContaining('file://'),
      dest: '.claude/agents/reviewer-agent.md'
    });
  });

  it('should skip already registered files', async () => {
    // Create test files
    await (global as any).testUtils.createTestFile('.cursor/rules/test-rules.md', '# Test Cursor Rules');
    await (global as any).testUtils.createTestFile('.cursor/rules/new-rules.md', '# New Rules');

    // Mock existing packages
    const existingPackages: Package[] = [
      {
        id: 'test-rules',
        type: 'cursor',
        url: 'file:///path/to/test-rules.md',
        dest: '.cursor/rules/test-rules.md'
      }
    ];

    const { listPackages, addPackage } = require('../../src/core/config');
    const { generateId } = require('../../src/core/filesystem');

    listPackages.mockResolvedValue(existingPackages);
    generateId.mockImplementation((filename: string) => {
      return filename.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    });
    addPackage.mockResolvedValue(undefined);

    await handleIndex();

    // Should only add the new file, not the already registered one
    expect(addPackage).toHaveBeenCalledTimes(1);
    expect(addPackage).toHaveBeenCalledWith({
      id: 'new-rules',
      type: 'cursor',
      url: expect.stringContaining('file://'),
      dest: '.cursor/rules/new-rules.md'
    });
  });

  it('should handle missing directories gracefully', async () => {
    // Don't create any directories

    const { listPackages, addPackage } = require('../../src/core/config');
    listPackages.mockResolvedValue([]);
    addPackage.mockResolvedValue(undefined);

    await handleIndex();

    // Should not add any packages
    expect(addPackage).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should handle mixed existing and new files', async () => {
    // Create test files
    await (global as any).testUtils.createTestFile('.cursor/rules/existing-rules.md', '# Existing Rules');
    await (global as any).testUtils.createTestFile('.cursor/rules/new-rules.md', '# New Rules');
    await (global as any).testUtils.createTestFile('.claude/agents/existing-agent.md', '# Existing Agent');
    await (global as any).testUtils.createTestFile('.claude/agents/new-agent.md', '# New Agent');

    // Mock existing packages
    const existingPackages: Package[] = [
      {
        id: 'existing-rules',
        type: 'cursor',
        url: 'file:///path/to/existing-rules.md',
        dest: '.cursor/rules/existing-rules.md'
      },
      {
        id: 'existing-agent',
        type: 'claude',
        url: 'file:///path/to/existing-agent.md',
        dest: '.claude/agents/existing-agent.md'
      }
    ];

    const { listPackages, addPackage } = require('../../src/core/config');
    const { generateId } = require('../../src/core/filesystem');

    listPackages.mockResolvedValue(existingPackages);
    generateId.mockImplementation((filename: string) => {
      return filename.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    });
    addPackage.mockResolvedValue(undefined);

    await handleIndex();

    // Should only add the new files
    expect(addPackage).toHaveBeenCalledTimes(2);
    expect(addPackage).toHaveBeenCalledWith({
      id: 'new-rules',
      type: 'cursor',
      url: expect.stringContaining('file://'),
      dest: '.cursor/rules/new-rules.md'
    });
    expect(addPackage).toHaveBeenCalledWith({
      id: 'new-agent',
      type: 'claude',
      url: expect.stringContaining('file://'),
      dest: '.claude/agents/new-agent.md'
    });
  });

  it('should handle config errors', async () => {
    const { listPackages } = require('../../src/core/config');
    listPackages.mockRejectedValue(new Error('Config read failed'));

    await handleIndex();

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle add package errors', async () => {
    // Create test files
    await (global as any).testUtils.createTestFile('.cursor/rules/test-rules.md', '# Test Cursor Rules');

    const { listPackages, addPackage } = require('../../src/core/config');
    const { generateId } = require('../../src/core/filesystem');

    listPackages.mockResolvedValue([]);
    generateId.mockReturnValue('test-rules');
    addPackage.mockRejectedValue(new Error('Add package failed'));

    await handleIndex();

    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
