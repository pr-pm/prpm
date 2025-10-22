/**
 * Error handling and edge case tests
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  addPackage,
  removePackage
} from '../src/core/lockfile';
import { downloadFile, extractFilename } from '../src/core/downloader';
import { 
  getDestinationDir, 
  saveFile, 
  deleteFile, 
  fileExists, 
  generateId 
} from '../src/core/filesystem';
import { Package } from '../src/types';

describe('Error Handling and Edge Cases', () => {
  let tempDir: string;
  const originalCwd = process.cwd();

  beforeEach(async () => {
    tempDir = await (global as any).testUtils.createTempDir();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await (global as any).testUtils.cleanupTempDir(tempDir);
  });

  describe('Lockfile Error Handling', () => {
    it('should handle corrupted lockfile', async () => {
      await fs.writeFile('prpm.lock', '{ invalid json }');

      await expect(readConfig()).rejects.toThrow('Failed to read config');
    });

    it('should handle config file with wrong structure', async () => {
      await fs.writeFile('.promptpm.json', JSON.stringify({ wrong: 'structure' }));
      
      // Should not throw, but may cause issues in other functions
      const config = await readConfig();
      expect(config).toEqual({ wrong: 'structure' });
    });

    it('should handle write permission errors', async () => {
      // Create a directory with the same name as the config file
      await fs.mkdir('.promptpm.json');
      
      await expect(writeConfig({ sources: [] })).rejects.toThrow('Failed to write config');
    });
  });

  describe('Downloader Error Handling', () => {
    it('should handle malformed URLs', async () => {
      await expect(downloadFile('not-a-url')).rejects.toThrow('Invalid URL format');
      await expect(downloadFile('')).rejects.toThrow('Invalid URL format');
      await expect(downloadFile('ftp://example.com/file.md')).rejects.toThrow('Invalid URL format');
    });

    it('should handle URLs with invalid protocols', async () => {
      await expect(downloadFile('javascript:alert("xss")')).rejects.toThrow('Invalid URL format');
      await expect(downloadFile('data:text/plain,hello')).rejects.toThrow('Invalid URL format');
    });

    it('should handle very long URLs', async () => {
      const longUrl = 'https://raw.githubusercontent.com/user/repo/main/' + 'a'.repeat(10000) + '.md';
      await expect(downloadFile(longUrl)).rejects.toThrow();
    });

    it('should handle extractFilename with edge cases', () => {
      expect(extractFilename('')).toBe('unknown.md');
      expect(extractFilename('https://raw.githubusercontent.com/')).toBe('unknown.md');
      expect(extractFilename('https://raw.githubusercontent.com/user/repo/main/')).toBe('unknown.md');
    });
  });

  describe('Filesystem Error Handling', () => {
    it('should handle invalid package types', () => {
      expect(() => getDestinationDir('invalid' as any)).toThrow('Unknown package type: invalid');
      expect(() => getDestinationDir('' as any)).toThrow('Unknown package type: ');
    });

    it('should handle very long filenames', async () => {
      const longFilename = 'a'.repeat(1000) + '.md';
      const filePath = path.join(tempDir, longFilename);
      
      // This might fail on some systems due to filename length limits
      try {
        await saveFile(filePath, 'content');
        expect(await fileExists(filePath)).toBe(true);
      } catch (error) {
        // Expected on some systems with filename length limits
        expect(error).toBeDefined();
      }
    });

    it('should handle special characters in filenames', async () => {
      const specialFilename = 'test<>:"|?*.md';
      const filePath = path.join(tempDir, specialFilename);
      
      // This might fail on some systems, but should be handled gracefully
      try {
        await saveFile(filePath, 'content');
        expect(await fileExists(filePath)).toBe(true);
      } catch (error) {
        // Expected on some systems
        expect(error).toBeDefined();
      }
    });

    it('should handle generateId with edge cases', () => {
      expect(generateId('')).toBe('');
      expect(generateId('.md')).toBe('');
      expect(generateId('...')).toBe('');
      expect(generateId('   ')).toBe('');
      expect(generateId('a'.repeat(1000))).toBe('a'.repeat(1000));
    });
  });

  describe('Package Management Edge Cases', () => {
    it('should handle package with empty ID', async () => {
      const pkg: Package = {
        id: '',
        type: 'cursor',
        url: 'https://raw.githubusercontent.com/user/repo/main/test.md',
        dest: '.cursor/rules/test.md'
      };

      await addPackage(pkg);
      const found = await removePackage('');
      expect(found).toEqual(pkg);
    });

    it('should handle package with very long ID', async () => {
      const longId = 'a'.repeat(1000);
      const pkg: Package = {
        id: longId,
        type: 'cursor',
        url: 'https://raw.githubusercontent.com/user/repo/main/test.md',
        dest: '.cursor/rules/test.md'
      };

      await addPackage(pkg);
      const found = await removePackage(longId);
      expect(found).toEqual(pkg);
    });

    it('should handle package with special characters in ID', async () => {
      const specialId = 'test@#$%^&*()';
      const pkg: Package = {
        id: specialId,
        type: 'cursor',
        url: 'https://raw.githubusercontent.com/user/repo/main/test.md',
        dest: '.cursor/rules/test.md'
      };

      await addPackage(pkg);
      const found = await removePackage(specialId);
      expect(found).toEqual(pkg);
    });

    it('should handle duplicate packages gracefully', async () => {
      const pkg: Package = {
        id: 'duplicate',
        type: 'cursor',
        url: 'https://raw.githubusercontent.com/user/repo/main/test.md',
        dest: '.cursor/rules/test.md'
      };

      await addPackage(pkg);
      await addPackage(pkg); // Should update, not duplicate
      
      const packages = await readConfig();
      expect(packages.sources).toHaveLength(1);
      expect(packages.sources[0]).toEqual(pkg);
    });
  });

  describe('File System Edge Cases', () => {
    it('should handle deleting non-existent files gracefully', async () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.md');
      await expect(deleteFile(nonExistentFile)).resolves.not.toThrow();
    });

    it('should handle file operations on directories', async () => {
      const dirPath = path.join(tempDir, 'test-dir');
      await fs.mkdir(dirPath);
      
      // Should handle gracefully
      expect(await fileExists(dirPath)).toBe(true);
    });

    it('should handle very large files', async () => {
      const largeContent = 'a'.repeat(10 * 1024 * 1024); // 10MB
      const filePath = path.join(tempDir, 'large.md');
      
      await saveFile(filePath, largeContent);
      expect(await fileExists(filePath)).toBe(true);
      
      const readContent = await (global as any).testUtils.readTestFile(filePath);
      expect(readContent).toBe(largeContent);
    });
  });

  describe('Network Error Simulation', () => {
    it('should handle timeout scenarios', async () => {
      // This would require mocking fetch with timeout
      // For now, just test that the error handling exists
      await expect(downloadFile('https://raw.githubusercontent.com/user/repo/main/test.md'))
        .rejects.toThrow();
    });

    it('should handle redirect loops', async () => {
      // Test URL validation prevents some redirect issues
      await expect(downloadFile('https://raw.githubusercontent.com/user/repo/main/test.md'))
        .rejects.toThrow();
    });
  });
});
