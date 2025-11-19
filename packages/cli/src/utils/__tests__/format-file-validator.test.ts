
import { validatePackageFiles } from '../format-file-validator.js';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue('content'),
}));

// Mock @pr-pm/converters
jest.mock('@pr-pm/converters', () => ({
  validateMarkdown: jest.fn(),
  validateFormat: jest.fn(),
}));

import { readFile } from 'fs/promises';
import { validateMarkdown, validateFormat } from '@pr-pm/converters';

describe('validatePackageFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (readFile as jest.Mock).mockResolvedValue('content');
    (validateMarkdown as jest.Mock).mockReturnValue({ valid: true, errors: [], warnings: [] });
    (validateFormat as jest.Mock).mockReturnValue({ valid: true, errors: [], warnings: [] });
  });

  it('should validate Claude files', async () => {
    const manifest = {
      name: 'test',
      version: '1.0.0',
      format: 'claude',
      subtype: 'agent',
      files: ['.claude/agents/agent.md'],
    };

    await validatePackageFiles(manifest as any);

    expect(validateMarkdown).toHaveBeenCalledWith('claude', 'content', 'agent');
  });

  it('should validate Kiro hooks using validateFormat', async () => {
    const manifest = {
      name: 'test',
      version: '1.0.0',
      format: 'kiro',
      files: ['hook.json'],
    };

    // Setup readFile for json
    (readFile as jest.Mock).mockResolvedValue('{}');

    await validatePackageFiles(manifest as any);

    expect(validateFormat).toHaveBeenCalledWith('kiro', {}, 'hook');
  });

  it('should validate Kiro steering files using validateMarkdown', async () => {
    const manifest = {
      name: 'test',
      version: '1.0.0',
      format: 'kiro',
      files: ['steering.md'],
    };

    await validatePackageFiles(manifest as any);

    expect(validateMarkdown).toHaveBeenCalledWith('kiro', 'content', undefined); // Subtype undefined for steering
  });

  it('should warn for unknown formats', async () => {
    const manifest = {
      name: 'test',
      version: '1.0.0',
      format: 'unknown',
      files: ['file.md'],
    };

    const result = await validatePackageFiles(manifest as any);

    expect(result.warnings[0]).toContain('not recognized');
  });
});
