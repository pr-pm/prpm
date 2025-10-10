/**
 * Integration tests for list command
 */

import { handleList } from '../../src/commands/list';
import { Package } from '../../src/types';

// Mock the core modules
jest.mock('../../src/core/config');

describe('List Command', () => {
  const originalExit = process.exit;

  beforeEach(() => {
    process.exit = jest.fn() as any;
  });

  afterEach(() => {
    process.exit = originalExit;
    jest.clearAllMocks();
  });

  it('should display empty list when no packages', async () => {
    const { listPackages } = require('../../src/core/config');
    listPackages.mockResolvedValue([]);

    await handleList();

    expect(listPackages).toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should display packages in table format', async () => {
    const packages: Package[] = [
      {
        id: 'cursor-rules',
        type: 'cursor',
        url: 'https://raw.githubusercontent.com/user/repo/main/cursor-rules.md',
        dest: '.cursor/rules/cursor-rules.md'
      },
      {
        id: 'claude-agent',
        type: 'claude',
        url: 'https://raw.githubusercontent.com/user/repo/main/agent.md',
        dest: '.claude/agents/agent.md'
      }
    ];

    const { listPackages } = require('../../src/core/config');
    listPackages.mockResolvedValue(packages);

    await handleList();

    expect(listPackages).toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('should handle config errors', async () => {
    const { listPackages } = require('../../src/core/config');
    listPackages.mockRejectedValue(new Error('Config read failed'));

    await handleList();

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle single package', async () => {
    const packages: Package[] = [
      {
        id: 'single-package',
        type: 'cursor',
        url: 'https://raw.githubusercontent.com/user/repo/main/single.md',
        dest: '.cursor/rules/single.md'
      }
    ];

    const { listPackages } = require('../../src/core/config');
    listPackages.mockResolvedValue(packages);

    await handleList();

    expect(listPackages).toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalled();
  });
});
