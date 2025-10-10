/**
 * Unit tests for filesystem operations
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  getDestinationDir,
  ensureDirectoryExists,
  saveFile,
  deleteFile,
  fileExists,
  generateId
} from '../../src/core/filesystem';

describe('Filesystem Operations', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await (global as any).testUtils.createTempDir();
  });

  afterEach(async () => {
    await (global as any).testUtils.cleanupTempDir(tempDir);
  });

  describe('getDestinationDir', () => {
    it('should return cursor directory for cursor type', () => {
      const dir = getDestinationDir('cursor');
      expect(dir).toBe('.cursor/rules');
    });

    it('should return claude directory for claude type', () => {
      const dir = getDestinationDir('claude');
      expect(dir).toBe('.claude/agents');
    });

    it('should throw error for unknown type', () => {
      expect(() => getDestinationDir('unknown' as any)).toThrow('Unknown package type: unknown');
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', async () => {
      const dirPath = path.join(tempDir, 'new-dir');
      await ensureDirectoryExists(dirPath);
      
      const exists = await (global as any).testUtils.fileExists(dirPath);
      expect(exists).toBe(true);
    });

    it('should not throw error if directory already exists', async () => {
      const dirPath = path.join(tempDir, 'existing-dir');
      await fs.mkdir(dirPath);
      
      await expect(ensureDirectoryExists(dirPath)).resolves.not.toThrow();
    });

    it('should create nested directories', async () => {
      const dirPath = path.join(tempDir, 'nested', 'deep', 'directory');
      await ensureDirectoryExists(dirPath);
      
      const exists = await (global as any).testUtils.fileExists(dirPath);
      expect(exists).toBe(true);
    });
  });

  describe('saveFile', () => {
    it('should save file with content', async () => {
      const filePath = path.join(tempDir, 'test.md');
      const content = '# Test Content\nThis is a test file.';
      
      await saveFile(filePath, content);
      
      const exists = await (global as any).testUtils.fileExists(filePath);
      expect(exists).toBe(true);
      
      const savedContent = await (global as any).testUtils.readTestFile(filePath);
      expect(savedContent).toBe(content);
    });

    it('should create parent directories if they do not exist', async () => {
      const filePath = path.join(tempDir, 'nested', 'deep', 'test.md');
      const content = 'test content';
      
      await saveFile(filePath, content);
      
      const exists = await (global as any).testUtils.fileExists(filePath);
      expect(exists).toBe(true);
    });

    it('should overwrite existing file', async () => {
      const filePath = path.join(tempDir, 'test.md');
      const originalContent = 'original content';
      const newContent = 'new content';
      
      await saveFile(filePath, originalContent);
      await saveFile(filePath, newContent);
      
      const savedContent = await (global as any).testUtils.readTestFile(filePath);
      expect(savedContent).toBe(newContent);
    });
  });

  describe('deleteFile', () => {
    it('should delete existing file', async () => {
      const filePath = path.join(tempDir, 'test.md');
      await (global as any).testUtils.createTestFile(filePath, 'test content');
      
      await deleteFile(filePath);
      
      const exists = await (global as any).testUtils.fileExists(filePath);
      expect(exists).toBe(false);
    });

    it('should not throw error if file does not exist', async () => {
      const filePath = path.join(tempDir, 'nonexistent.md');
      
      await expect(deleteFile(filePath)).resolves.not.toThrow();
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(tempDir, 'test.md');
      await (global as any).testUtils.createTestFile(filePath, 'test content');
      
      const exists = await fileExists(filePath);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const filePath = path.join(tempDir, 'nonexistent.md');
      
      const exists = await fileExists(filePath);
      expect(exists).toBe(false);
    });

    it('should return true for existing directory', async () => {
      const dirPath = path.join(tempDir, 'test-dir');
      await fs.mkdir(dirPath);
      
      const exists = await fileExists(dirPath);
      expect(exists).toBe(true);
    });
  });

  describe('generateId', () => {
    it('should generate ID from filename', () => {
      const id = generateId('test-file.md');
      expect(id).toBe('test-file');
    });

    it('should convert to lowercase', () => {
      const id = generateId('Test-File.md');
      expect(id).toBe('test-file');
    });

    it('should replace spaces with hyphens', () => {
      const id = generateId('test file.md');
      expect(id).toBe('test-file');
    });

    it('should replace special characters with hyphens', () => {
      const id = generateId('test@file#name.md');
      expect(id).toBe('test-file-name');
    });

    it('should remove leading and trailing hyphens', () => {
      const id = generateId('-test-file-.md');
      expect(id).toBe('test-file');
    });

    it('should handle multiple consecutive special characters', () => {
      const id = generateId('test___file---name.md');
      expect(id).toBe('test-file-name');
    });

    it('should handle empty filename', () => {
      const id = generateId('');
      expect(id).toBe('');
    });

    it('should handle filename with only special characters', () => {
      const id = generateId('@@@.md');
      expect(id).toBe('');
    });

    it('should handle complex filenames', () => {
      const id = generateId('My Awesome Cursor Rules v2.0.md');
      expect(id).toBe('my-awesome-cursor-rules-v2-0');
    });
  });
});
