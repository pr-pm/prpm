/**
 * Unit tests for HTTP downloader
 */

import { downloadFile, extractFilename } from '../../src/core/downloader';

describe('Downloader', () => {
  // Mock global fetch
  const mockFetch = jest.fn();
  global.fetch = mockFetch as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      const testContent = '# Test Content\nThis is a test file.';
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(testContent)
      });

      const result = await downloadFile('https://raw.githubusercontent.com/user/repo/main/test.md');
      expect(result).toBe(testContent);
    });

    it('should throw error for invalid URL', async () => {
      await expect(downloadFile('invalid-url')).rejects.toThrow('Invalid URL format');
    });

    it('should throw error for non-GitHub URL', async () => {
      await expect(downloadFile('https://example.com/file.md')).rejects.toThrow('Invalid URL format');
    });

    it('should accept raw.githubusercontent.com URLs', async () => {
      const testContent = 'test content';
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(testContent)
      });

      const result = await downloadFile('https://raw.githubusercontent.com/user/repo/main/file.md');
      expect(result).toBe(testContent);
    });

    it('should accept github.com raw URLs', async () => {
      const testContent = 'test content';
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(testContent)
      });

      const result = await downloadFile('https://github.com/user/repo/raw/main/file.md');
      expect(result).toBe(testContent);
    });

    it('should throw error for HTTP error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('')
      });

      await expect(downloadFile('https://raw.githubusercontent.com/user/repo/main/nonexistent.md'))
        .rejects.toThrow('HTTP 404: Not Found');
    });

    it('should throw error for network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      await expect(downloadFile('https://raw.githubusercontent.com/user/repo/main/file.md'))
        .rejects.toThrow('Failed to download file: Network error');
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValue('Unknown error');

      await expect(downloadFile('https://raw.githubusercontent.com/user/repo/main/file.md'))
        .rejects.toThrow('Failed to download file: Unknown error');
    });
  });

  describe('extractFilename', () => {
    it('should extract filename from URL', () => {
      const filename = extractFilename('https://raw.githubusercontent.com/user/repo/main/test.md');
      expect(filename).toBe('test.md');
    });

    it('should handle URLs without extension', () => {
      const filename = extractFilename('https://raw.githubusercontent.com/user/repo/main/README');
      expect(filename).toBe('README.md');
    });

    it('should handle URLs with query parameters', () => {
      const filename = extractFilename('https://raw.githubusercontent.com/user/repo/main/test.md?v=1');
      expect(filename).toBe('test.md');
    });

    it('should handle URLs with fragments', () => {
      const filename = extractFilename('https://raw.githubusercontent.com/user/repo/main/test.md#section');
      expect(filename).toBe('test.md');
    });

    it('should handle malformed URLs', () => {
      const filename = extractFilename('invalid-url');
      expect(filename).toBe('unknown.md');
    });

    it('should handle empty pathname', () => {
      const filename = extractFilename('https://raw.githubusercontent.com/');
      expect(filename).toBe('unknown.md');
    });

    it('should handle complex filenames', () => {
      const filename = extractFilename('https://raw.githubusercontent.com/user/repo/main/my-awesome-rules.md');
      expect(filename).toBe('my-awesome-rules.md');
    });

    it('should handle filenames with dots', () => {
      const filename = extractFilename('https://raw.githubusercontent.com/user/repo/main/config.json');
      expect(filename).toBe('config.json');
    });
  });
});
