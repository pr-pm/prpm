import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';

// Mock the hook-utils module
vi.mock('./hook-utils', () => ({
  readStdin: vi.fn(),
  getFilePath: vi.fn(),
  hasExtension: vi.fn(),
  execCommand: vi.fn(),
  exitHook: vi.fn((code: number) => {
    throw new Error(`EXIT_${code}`);
  }),
  HookExitCode: {
    Success: 0,
    Error: 1,
    Block: 2,
  },
}));

describe('prettier-on-save hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should exit successfully if no file path is provided', async () => {
    const { readStdin, getFilePath, exitHook, HookExitCode } = await import('./hook-utils');

    vi.mocked(readStdin).mockReturnValue({});
    vi.mocked(getFilePath).mockReturnValue(undefined);

    try {
      await import('./hook');
    } catch (error: any) {
      expect(error.message).toBe('EXIT_0');
    }

    expect(exitHook).toHaveBeenCalledWith(HookExitCode.Success);
  });

  it('should exit successfully if file has unsupported extension', async () => {
    const { readStdin, getFilePath, hasExtension, exitHook, HookExitCode } = await import('./hook-utils');

    vi.mocked(readStdin).mockReturnValue({
      input: { file_path: '/path/to/file.py' },
    });
    vi.mocked(getFilePath).mockReturnValue('/path/to/file.py');
    vi.mocked(hasExtension).mockReturnValue(false);

    try {
      await import('./hook');
    } catch (error: any) {
      expect(error.message).toBe('EXIT_0');
    }

    expect(exitHook).toHaveBeenCalledWith(HookExitCode.Success);
  });

  it('should call prettier for supported file types', async () => {
    const { readStdin, getFilePath, hasExtension, execCommand, exitHook, HookExitCode } = await import('./hook-utils');

    vi.mocked(readStdin).mockReturnValue({
      input: { file_path: '/path/to/file.ts' },
    });
    vi.mocked(getFilePath).mockReturnValue('/path/to/file.ts');
    vi.mocked(hasExtension).mockReturnValue(true);

    try {
      await import('./hook');
    } catch (error: any) {
      expect(error.message).toBe('EXIT_0');
    }

    expect(execCommand).toHaveBeenCalledWith(
      'prettier',
      ['--write', '/path/to/file.ts'],
      { skipOnMissing: true, background: true }
    );
    expect(exitHook).toHaveBeenCalledWith(HookExitCode.Success);
  });

  it('should handle TypeScript files', async () => {
    const { readStdin, getFilePath, hasExtension, execCommand } = await import('./hook-utils');

    vi.mocked(readStdin).mockReturnValue({
      input: { file_path: '/path/to/component.tsx' },
    });
    vi.mocked(getFilePath).mockReturnValue('/path/to/component.tsx');
    vi.mocked(hasExtension).mockReturnValue(true);

    try {
      await import('./hook');
    } catch (error: any) {
      // Expected exit
    }

    expect(execCommand).toHaveBeenCalledWith(
      'prettier',
      ['--write', '/path/to/component.tsx'],
      expect.objectContaining({ background: true })
    );
  });

  it('should handle JSON files', async () => {
    const { readStdin, getFilePath, hasExtension, execCommand } = await import('./hook-utils');

    vi.mocked(readStdin).mockReturnValue({
      input: { file_path: '/path/to/config.json' },
    });
    vi.mocked(getFilePath).mockReturnValue('/path/to/config.json');
    vi.mocked(hasExtension).mockReturnValue(true);

    try {
      await import('./hook');
    } catch (error: any) {
      // Expected exit
    }

    expect(execCommand).toHaveBeenCalledWith(
      'prettier',
      ['--write', '/path/to/config.json'],
      expect.objectContaining({ skipOnMissing: true })
    );
  });
});
