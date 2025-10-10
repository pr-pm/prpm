/**
 * Integration tests for add command
 */

import { handleAdd } from '../../src/commands/add';
import { mockFetchSuccess } from '../__mocks__/node-fetch';
import { Package } from '../../src/types';

// Mock the core modules
jest.mock('../../src/core/downloader');
jest.mock('../../src/core/filesystem');
jest.mock('../../src/core/config');

describe('Add Command', () => {
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

  it('should add cursor package successfully', async () => {
    const testContent = '# Cursor Rules\nAlways write clean code.';
    const testUrl = 'https://raw.githubusercontent.com/user/repo/main/cursor-rules.md';
    
    mockFetchSuccess(testContent);

    // Mock the core functions
    const { downloadFile, extractFilename } = require('../../src/core/downloader');
    const { getDestinationDir, saveFile, generateId } = require('../../src/core/filesystem');
    const { addPackage } = require('../../src/core/config');

    downloadFile.mockResolvedValue(testContent);
    extractFilename.mockReturnValue('cursor-rules.md');
    getDestinationDir.mockReturnValue('.cursor/rules');
    generateId.mockReturnValue('cursor-rules');
    saveFile.mockResolvedValue(undefined);
    addPackage.mockResolvedValue(undefined);

    await handleAdd(testUrl, 'cursor');

    expect(downloadFile).toHaveBeenCalledWith(testUrl);
    expect(getDestinationDir).toHaveBeenCalledWith('cursor');
    expect(generateId).toHaveBeenCalledWith('cursor-rules.md');
    expect(saveFile).toHaveBeenCalledWith('.cursor/rules/cursor-rules.md', testContent);
    expect(addPackage).toHaveBeenCalledWith({
      id: 'cursor-rules',
      type: 'cursor',
      url: testUrl,
      dest: '.cursor/rules/cursor-rules.md'
    });
  });

  it('should add claude package successfully', async () => {
    const testContent = '# Claude Agent\nYou are a helpful assistant.';
    const testUrl = 'https://raw.githubusercontent.com/user/repo/main/agent.md';
    
    mockFetchSuccess(testContent);

    // Mock the core functions
    const { downloadFile, extractFilename } = require('../../src/core/downloader');
    const { getDestinationDir, saveFile, generateId } = require('../../src/core/filesystem');
    const { addPackage } = require('../../src/core/config');

    downloadFile.mockResolvedValue(testContent);
    extractFilename.mockReturnValue('agent.md');
    getDestinationDir.mockReturnValue('.claude/agents');
    generateId.mockReturnValue('agent');
    saveFile.mockResolvedValue(undefined);
    addPackage.mockResolvedValue(undefined);

    await handleAdd(testUrl, 'claude');

    expect(downloadFile).toHaveBeenCalledWith(testUrl);
    expect(getDestinationDir).toHaveBeenCalledWith('claude');
    expect(generateId).toHaveBeenCalledWith('agent.md');
    expect(saveFile).toHaveBeenCalledWith('.claude/agents/agent.md', testContent);
    expect(addPackage).toHaveBeenCalledWith({
      id: 'agent',
      type: 'claude',
      url: testUrl,
      dest: '.claude/agents/agent.md'
    });
  });

  it('should handle download errors', async () => {
    const testUrl = 'https://raw.githubusercontent.com/user/repo/main/nonexistent.md';
    
    // Mock download error
    const { downloadFile } = require('../../src/core/downloader');
    downloadFile.mockRejectedValue(new Error('HTTP 404: Not Found'));

    await handleAdd(testUrl, 'cursor');

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle filesystem errors', async () => {
    const testContent = '# Test Content';
    const testUrl = 'https://raw.githubusercontent.com/user/repo/main/test.md';
    
    mockFetchSuccess(testContent);

    // Mock filesystem error
    const { downloadFile } = require('../../src/core/downloader');
    const { getDestinationDir, saveFile, generateId } = require('../../src/core/filesystem');

    downloadFile.mockResolvedValue(testContent);
    getDestinationDir.mockReturnValue('.cursor/rules');
    generateId.mockReturnValue('test');
    saveFile.mockRejectedValue(new Error('Permission denied'));

    await handleAdd(testUrl, 'cursor');

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle config errors', async () => {
    const testContent = '# Test Content';
    const testUrl = 'https://raw.githubusercontent.com/user/repo/main/test.md';
    
    mockFetchSuccess(testContent);

    // Mock config error
    const { downloadFile } = require('../../src/core/downloader');
    const { getDestinationDir, saveFile, generateId } = require('../../src/core/filesystem');
    const { addPackage } = require('../../src/core/config');

    downloadFile.mockResolvedValue(testContent);
    getDestinationDir.mockReturnValue('.cursor/rules');
    generateId.mockReturnValue('test');
    saveFile.mockResolvedValue(undefined);
    addPackage.mockRejectedValue(new Error('Config write failed'));

    await handleAdd(testUrl, 'cursor');

    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
