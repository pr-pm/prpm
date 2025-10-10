"use strict";
/**
 * Unit tests for HTTP downloader
 */
Object.defineProperty(exports, "__esModule", { value: true });
const downloader_1 = require("../../src/core/downloader");
const node_fetch_1 = require("../__mocks__/node-fetch");
// Mock node-fetch
jest.mock('node-fetch');
describe('Downloader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('downloadFile', () => {
        it('should download file successfully', async () => {
            const testContent = '# Test Content\nThis is a test file.';
            (0, node_fetch_1.mockFetchSuccess)(testContent);
            const result = await (0, downloader_1.downloadFile)('https://raw.githubusercontent.com/user/repo/main/test.md');
            expect(result).toBe(testContent);
        });
        it('should throw error for invalid URL', async () => {
            await expect((0, downloader_1.downloadFile)('invalid-url')).rejects.toThrow('Invalid URL format');
        });
        it('should throw error for non-GitHub URL', async () => {
            await expect((0, downloader_1.downloadFile)('https://example.com/file.md')).rejects.toThrow('Invalid URL format');
        });
        it('should accept raw.githubusercontent.com URLs', async () => {
            const testContent = 'test content';
            (0, node_fetch_1.mockFetchSuccess)(testContent);
            const result = await (0, downloader_1.downloadFile)('https://raw.githubusercontent.com/user/repo/main/file.md');
            expect(result).toBe(testContent);
        });
        it('should accept github.com raw URLs', async () => {
            const testContent = 'test content';
            (0, node_fetch_1.mockFetchSuccess)(testContent);
            const result = await (0, downloader_1.downloadFile)('https://github.com/user/repo/raw/main/file.md');
            expect(result).toBe(testContent);
        });
        it('should throw error for HTTP error responses', async () => {
            (0, node_fetch_1.mockFetchError)(404, 'Not Found');
            await expect((0, downloader_1.downloadFile)('https://raw.githubusercontent.com/user/repo/main/nonexistent.md'))
                .rejects.toThrow('HTTP 404: Not Found');
        });
        it('should throw error for network errors', async () => {
            const networkError = new Error('Network error');
            (0, node_fetch_1.mockFetchNetworkError)(networkError);
            await expect((0, downloader_1.downloadFile)('https://raw.githubusercontent.com/user/repo/main/file.md'))
                .rejects.toThrow('Failed to download file: Network error');
        });
        it('should handle unknown errors', async () => {
            const mockFetch = require('node-fetch').default;
            mockFetch.mockRejectedValue('Unknown error');
            await expect((0, downloader_1.downloadFile)('https://raw.githubusercontent.com/user/repo/main/file.md'))
                .rejects.toThrow('Failed to download file: Unknown error');
        });
    });
    describe('extractFilename', () => {
        it('should extract filename from URL', () => {
            const filename = (0, downloader_1.extractFilename)('https://raw.githubusercontent.com/user/repo/main/test.md');
            expect(filename).toBe('test.md');
        });
        it('should handle URLs without extension', () => {
            const filename = (0, downloader_1.extractFilename)('https://raw.githubusercontent.com/user/repo/main/README');
            expect(filename).toBe('README.md');
        });
        it('should handle URLs with query parameters', () => {
            const filename = (0, downloader_1.extractFilename)('https://raw.githubusercontent.com/user/repo/main/test.md?v=1');
            expect(filename).toBe('test.md');
        });
        it('should handle URLs with fragments', () => {
            const filename = (0, downloader_1.extractFilename)('https://raw.githubusercontent.com/user/repo/main/test.md#section');
            expect(filename).toBe('test.md');
        });
        it('should handle malformed URLs', () => {
            const filename = (0, downloader_1.extractFilename)('invalid-url');
            expect(filename).toBe('unknown.md');
        });
        it('should handle empty pathname', () => {
            const filename = (0, downloader_1.extractFilename)('https://raw.githubusercontent.com/');
            expect(filename).toBe('unknown.md');
        });
        it('should handle complex filenames', () => {
            const filename = (0, downloader_1.extractFilename)('https://raw.githubusercontent.com/user/repo/main/my-awesome-rules.md');
            expect(filename).toBe('my-awesome-rules.md');
        });
        it('should handle filenames with dots', () => {
            const filename = (0, downloader_1.extractFilename)('https://raw.githubusercontent.com/user/repo/main/config.json');
            expect(filename).toBe('config.json');
        });
    });
});
//# sourceMappingURL=downloader.test.js.map