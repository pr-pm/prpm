/**
 * Tests for script executor utility
 */

// Use var for hoisting compatibility with jest.mock
var mockExecAsync: jest.Mock;

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

// Mock util.promisify to return a function that calls mockExecAsync
// Use a function wrapper so mockExecAsync is resolved at call time
jest.mock('util', () => ({
  promisify: jest.fn(() => {
    return (...args: any[]) => mockExecAsync(...args);
  }),
}));

// Now import after mocks are set up
import { executeScript, executePrepublishOnly } from '../script-executor';

// Initialize the mock
mockExecAsync = jest.fn();

describe('script-executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('executeScript', () => {
    it('should execute a script successfully', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'Build successful\n',
        stderr: '',
      });

      const result = await executeScript('npm run build', 'test-script');

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe('Build successful\n');
      expect(mockExecAsync).toHaveBeenCalledWith(
        'npm run build',
        expect.objectContaining({
          cwd: process.cwd(),
          timeout: 5 * 60 * 1000,
          maxBuffer: 10 * 1024 * 1024,
        })
      );
    });

    it('should show stdout and stderr output', async () => {
      mockExecAsync.mockResolvedValue({
        stdout: 'Output line\n',
        stderr: 'Warning\n',
      });

      await executeScript('echo test', 'echo-script');

      expect(process.stdout.write).toHaveBeenCalledWith('Output line\n');
      expect(process.stderr.write).toHaveBeenCalledWith('Warning\n');
    });

    it('should throw error when script fails', async () => {
      const error: any = new Error('Command failed');
      error.code = 1;
      error.stdout = 'Some output\n';
      error.stderr = 'Error message\n';
      mockExecAsync.mockRejectedValue(error);

      await expect(executeScript('false', 'failing-script')).rejects.toThrow(
        'failing-script script failed with exit code 1'
      );

      // Should show error output
      expect(process.stdout.write).toHaveBeenCalledWith('Some output\n');
      expect(process.stderr.write).toHaveBeenCalledWith('Error message\n');
    });

    it('should handle timeout errors', async () => {
      const error: any = new Error('Timeout');
      error.code = 'ETIMEDOUT';
      mockExecAsync.mockRejectedValue(error);

      await expect(
        executeScript('sleep 1000', 'slow-script', { timeout: 1000 })
      ).rejects.toThrow('slow-script script timed out after 1000ms');
    });

    it('should handle buffer overflow errors', async () => {
      const error: any = new Error('Buffer overflow');
      error.code = 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER';
      mockExecAsync.mockRejectedValue(error);

      await expect(executeScript('generate-huge-output', 'large-script')).rejects.toThrow(
        'large-script script output exceeded maximum buffer size'
      );
    });

    it('should use custom cwd when provided', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await executeScript('npm run build', 'build-script', { cwd: '/custom/path' });

      expect(mockExecAsync).toHaveBeenCalledWith(
        'npm run build',
        expect.objectContaining({
          cwd: '/custom/path',
        })
      );
    });

    it('should use custom timeout when provided', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await executeScript('npm test', 'test-script', { timeout: 10000 });

      expect(mockExecAsync).toHaveBeenCalledWith(
        'npm test',
        expect.objectContaining({
          timeout: 10000,
        })
      );
    });
  });

  describe('executePrepublishOnly', () => {
    it('should execute prepublishOnly script if defined', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'Build complete\n', stderr: '' });

      const scripts = { prepublishOnly: 'npm run build' };
      await executePrepublishOnly(scripts);

      expect(mockExecAsync).toHaveBeenCalledWith(
        'npm run build',
        expect.any(Object)
      );
    });

    it('should do nothing if prepublishOnly not defined', async () => {
      await executePrepublishOnly({});
      await executePrepublishOnly(undefined);

      expect(mockExecAsync).not.toHaveBeenCalled();
    });

    it('should throw error if prepublishOnly script fails', async () => {
      const error: any = new Error('Build failed');
      error.code = 1;
      mockExecAsync.mockRejectedValue(error);

      const scripts = { prepublishOnly: 'npm run build' };

      await expect(executePrepublishOnly(scripts)).rejects.toThrow(
        'prepublishOnly script failed'
      );
    });
  });
});
