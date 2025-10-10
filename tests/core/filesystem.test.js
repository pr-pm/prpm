"use strict";
/**
 * Unit tests for filesystem operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const filesystem_1 = require("../../src/core/filesystem");
describe('Filesystem Operations', () => {
    let tempDir;
    beforeEach(async () => {
        tempDir = await global.testUtils.createTempDir();
    });
    afterEach(async () => {
        await global.testUtils.cleanupTempDir(tempDir);
    });
    describe('getDestinationDir', () => {
        it('should return cursor directory for cursor type', () => {
            const dir = (0, filesystem_1.getDestinationDir)('cursor');
            expect(dir).toBe('.cursor/rules');
        });
        it('should return claude directory for claude type', () => {
            const dir = (0, filesystem_1.getDestinationDir)('claude');
            expect(dir).toBe('.claude/agents');
        });
        it('should throw error for unknown type', () => {
            expect(() => (0, filesystem_1.getDestinationDir)('unknown')).toThrow('Unknown package type: unknown');
        });
    });
    describe('ensureDirectoryExists', () => {
        it('should create directory if it does not exist', async () => {
            const dirPath = path_1.default.join(tempDir, 'new-dir');
            await (0, filesystem_1.ensureDirectoryExists)(dirPath);
            const exists = await global.testUtils.fileExists(dirPath);
            expect(exists).toBe(true);
        });
        it('should not throw error if directory already exists', async () => {
            const dirPath = path_1.default.join(tempDir, 'existing-dir');
            await fs_1.promises.mkdir(dirPath);
            await expect((0, filesystem_1.ensureDirectoryExists)(dirPath)).resolves.not.toThrow();
        });
        it('should create nested directories', async () => {
            const dirPath = path_1.default.join(tempDir, 'nested', 'deep', 'directory');
            await (0, filesystem_1.ensureDirectoryExists)(dirPath);
            const exists = await global.testUtils.fileExists(dirPath);
            expect(exists).toBe(true);
        });
    });
    describe('saveFile', () => {
        it('should save file with content', async () => {
            const filePath = path_1.default.join(tempDir, 'test.md');
            const content = '# Test Content\nThis is a test file.';
            await (0, filesystem_1.saveFile)(filePath, content);
            const exists = await global.testUtils.fileExists(filePath);
            expect(exists).toBe(true);
            const savedContent = await global.testUtils.readTestFile(filePath);
            expect(savedContent).toBe(content);
        });
        it('should create parent directories if they do not exist', async () => {
            const filePath = path_1.default.join(tempDir, 'nested', 'deep', 'test.md');
            const content = 'test content';
            await (0, filesystem_1.saveFile)(filePath, content);
            const exists = await global.testUtils.fileExists(filePath);
            expect(exists).toBe(true);
        });
        it('should overwrite existing file', async () => {
            const filePath = path_1.default.join(tempDir, 'test.md');
            const originalContent = 'original content';
            const newContent = 'new content';
            await (0, filesystem_1.saveFile)(filePath, originalContent);
            await (0, filesystem_1.saveFile)(filePath, newContent);
            const savedContent = await global.testUtils.readTestFile(filePath);
            expect(savedContent).toBe(newContent);
        });
    });
    describe('deleteFile', () => {
        it('should delete existing file', async () => {
            const filePath = path_1.default.join(tempDir, 'test.md');
            await global.testUtils.createTestFile(filePath, 'test content');
            await (0, filesystem_1.deleteFile)(filePath);
            const exists = await global.testUtils.fileExists(filePath);
            expect(exists).toBe(false);
        });
        it('should not throw error if file does not exist', async () => {
            const filePath = path_1.default.join(tempDir, 'nonexistent.md');
            await expect((0, filesystem_1.deleteFile)(filePath)).resolves.not.toThrow();
        });
    });
    describe('fileExists', () => {
        it('should return true for existing file', async () => {
            const filePath = path_1.default.join(tempDir, 'test.md');
            await global.testUtils.createTestFile(filePath, 'test content');
            const exists = await (0, filesystem_1.fileExists)(filePath);
            expect(exists).toBe(true);
        });
        it('should return false for non-existent file', async () => {
            const filePath = path_1.default.join(tempDir, 'nonexistent.md');
            const exists = await (0, filesystem_1.fileExists)(filePath);
            expect(exists).toBe(false);
        });
        it('should return true for existing directory', async () => {
            const dirPath = path_1.default.join(tempDir, 'test-dir');
            await fs_1.promises.mkdir(dirPath);
            const exists = await (0, filesystem_1.fileExists)(dirPath);
            expect(exists).toBe(true);
        });
    });
    describe('generateId', () => {
        it('should generate ID from filename', () => {
            const id = (0, filesystem_1.generateId)('test-file.md');
            expect(id).toBe('test-file');
        });
        it('should convert to lowercase', () => {
            const id = (0, filesystem_1.generateId)('Test-File.md');
            expect(id).toBe('test-file');
        });
        it('should replace spaces with hyphens', () => {
            const id = (0, filesystem_1.generateId)('test file.md');
            expect(id).toBe('test-file');
        });
        it('should replace special characters with hyphens', () => {
            const id = (0, filesystem_1.generateId)('test@file#name.md');
            expect(id).toBe('test-file-name');
        });
        it('should remove leading and trailing hyphens', () => {
            const id = (0, filesystem_1.generateId)('-test-file-.md');
            expect(id).toBe('test-file');
        });
        it('should handle multiple consecutive special characters', () => {
            const id = (0, filesystem_1.generateId)('test___file---name.md');
            expect(id).toBe('test-file-name');
        });
        it('should handle empty filename', () => {
            const id = (0, filesystem_1.generateId)('');
            expect(id).toBe('');
        });
        it('should handle filename with only special characters', () => {
            const id = (0, filesystem_1.generateId)('@@@.md');
            expect(id).toBe('');
        });
        it('should handle complex filenames', () => {
            const id = (0, filesystem_1.generateId)('My Awesome Cursor Rules v2.0.md');
            expect(id).toBe('my-awesome-cursor-rules-v2-0');
        });
    });
});
//# sourceMappingURL=filesystem.test.js.map