import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the hook-utils module
vi.mock('./hook-utils', () => ({
  readStdin: vi.fn(),
  getFilePath: vi.fn(),
  getContent: vi.fn(),
  logWarning: vi.fn(),
  exitHook: vi.fn((code: number) => {
    throw new Error(`EXIT_${code}`);
  }),
  HookExitCode: {
    Success: 0,
    Error: 1,
    Block: 2,
  },
}));

describe('validate-credentials hook', () => {
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

  it('should exit successfully if no content is provided', async () => {
    const { readStdin, getFilePath, getContent, exitHook, HookExitCode } = await import('./hook-utils');

    vi.mocked(readStdin).mockReturnValue({
      input: { file_path: '/path/to/file.ts' },
    });
    vi.mocked(getFilePath).mockReturnValue('/path/to/file.ts');
    vi.mocked(getContent).mockReturnValue(undefined);

    try {
      await import('./hook');
    } catch (error: any) {
      expect(error.message).toBe('EXIT_0');
    }

    expect(exitHook).toHaveBeenCalledWith(HookExitCode.Success);
  });

  it('should warn about hardcoded passwords', async () => {
    const { readStdin, getFilePath, getContent, logWarning, exitHook, HookExitCode } = await import('./hook-utils');

    const content = 'const password = "supersecret123";';
    vi.mocked(readStdin).mockReturnValue({
      input: { file_path: '/path/to/config.ts', content },
    });
    vi.mocked(getFilePath).mockReturnValue('/path/to/config.ts');
    vi.mocked(getContent).mockReturnValue(content);

    try {
      await import('./hook');
    } catch (error: any) {
      expect(error.message).toBe('EXIT_0');
    }

    expect(logWarning).toHaveBeenCalledWith(
      expect.stringContaining('Potential hardcoded credential detected')
    );
    expect(logWarning).toHaveBeenCalledWith(
      expect.stringContaining('password = "..."')
    );
  });

  it('should warn about API keys', async () => {
    const { readStdin, getFilePath, getContent, logWarning } = await import('./hook-utils');

    const content = 'const api_key = "sk-1234567890abcdef";';
    vi.mocked(readStdin).mockReturnValue({
      input: { file_path: '/path/to/config.ts', content },
    });
    vi.mocked(getFilePath).mockReturnValue('/path/to/config.ts');
    vi.mocked(getContent).mockReturnValue(content);

    try {
      await import('./hook');
    } catch (error: any) {
      // Expected exit
    }

    expect(logWarning).toHaveBeenCalledWith(
      expect.stringContaining('Potential hardcoded credential detected')
    );
    expect(logWarning).toHaveBeenCalledWith(
      expect.stringContaining('api_key = "..."')
    );
  });

  it('should warn about AWS credentials', async () => {
    const { readStdin, getFilePath, getContent, logWarning } = await import('./hook-utils');

    const content = 'const AWS_SECRET_ACCESS_KEY = "abc123def456";';
    vi.mocked(readStdin).mockReturnValue({
      input: { file_path: '/path/to/aws.ts', content },
    });
    vi.mocked(getFilePath).mockReturnValue('/path/to/aws.ts');
    vi.mocked(getContent).mockReturnValue(content);

    try {
      await import('./hook');
    } catch (error: any) {
      // Expected exit
    }

    expect(logWarning).toHaveBeenCalledWith(
      expect.stringContaining('AWS_SECRET_ACCESS_KEY')
    );
  });

  it('should warn about private keys', async () => {
    const { readStdin, getFilePath, getContent, logWarning } = await import('./hook-utils');

    const content = 'const PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\n...";';
    vi.mocked(readStdin).mockReturnValue({
      input: { file_path: '/path/to/crypto.ts', content },
    });
    vi.mocked(getFilePath).mockReturnValue('/path/to/crypto.ts');
    vi.mocked(getContent).mockReturnValue(content);

    try {
      await import('./hook');
    } catch (error: any) {
      // Expected exit
    }

    expect(logWarning).toHaveBeenCalledWith(
      expect.stringContaining('PRIVATE_KEY')
    );
  });

  it('should not warn about safe code', async () => {
    const { readStdin, getFilePath, getContent, logWarning } = await import('./hook-utils');

    const content = 'const username = "john_doe";\nconst isValid = true;';
    vi.mocked(readStdin).mockReturnValue({
      input: { file_path: '/path/to/user.ts', content },
    });
    vi.mocked(getFilePath).mockReturnValue('/path/to/user.ts');
    vi.mocked(getContent).mockReturnValue(content);

    try {
      await import('./hook');
    } catch (error: any) {
      // Expected exit
    }

    expect(logWarning).not.toHaveBeenCalled();
  });

  it('should only warn once even if multiple patterns match', async () => {
    const { readStdin, getFilePath, getContent, logWarning } = await import('./hook-utils');

    const content = `
      const password = "secret123";
      const api_key = "sk-1234567890";
      const token = "bearer abc123";
    `;
    vi.mocked(readStdin).mockReturnValue({
      input: { file_path: '/path/to/config.ts', content },
    });
    vi.mocked(getFilePath).mockReturnValue('/path/to/config.ts');
    vi.mocked(getContent).mockReturnValue(content);

    try {
      await import('./hook');
    } catch (error: any) {
      // Expected exit
    }

    // Should only call logWarning 3 times (once for each: warning, pattern, suggestion)
    expect(logWarning).toHaveBeenCalledTimes(3);
  });
});
