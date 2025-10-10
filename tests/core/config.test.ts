/**
 * Unit tests for config management
 */

import { promises as fs } from 'fs';
import path from 'path';
import { 
  readConfig, 
  writeConfig, 
  addPackage, 
  removePackage, 
  getPackage, 
  listPackages 
} from '../../src/core/config';
import { Package } from '../../src/types';

describe('Config Management', () => {
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

  describe('readConfig', () => {
    it('should return empty config when file does not exist', async () => {
      const config = await readConfig();
      expect(config).toEqual({ sources: [] });
    });

    it('should read existing config file', async () => {
      const testConfig = {
        sources: [
          {
            id: 'test-package',
            type: 'cursor' as const,
            url: 'https://example.com/test.md',
            dest: '.cursor/rules/test.md'
          }
        ]
      };

      await fs.writeFile('.promptpm.json', JSON.stringify(testConfig, null, 2));
      const config = await readConfig();
      expect(config).toEqual(testConfig);
    });

    it('should throw error for invalid JSON', async () => {
      await fs.writeFile('.promptpm.json', 'invalid json');
      await expect(readConfig()).rejects.toThrow('Failed to read config');
    });
  });

  describe('writeConfig', () => {
    it('should write config to file', async () => {
      const testConfig = {
        sources: [
          {
            id: 'test-package',
            type: 'cursor' as const,
            url: 'https://example.com/test.md',
            dest: '.cursor/rules/test.md'
          }
        ]
      };

      await writeConfig(testConfig);
      const content = await fs.readFile('.promptpm.json', 'utf-8');
      expect(JSON.parse(content)).toEqual(testConfig);
    });
  });

  describe('addPackage', () => {
    it('should add new package to empty config', async () => {
      const pkg: Package = {
        id: 'test-package',
        type: 'cursor',
        url: 'https://example.com/test.md',
        dest: '.cursor/rules/test.md'
      };

      await addPackage(pkg);
      const config = await readConfig();
      expect(config.sources).toHaveLength(1);
      expect(config.sources[0]).toEqual(pkg);
    });

    it('should update existing package with same ID', async () => {
      const pkg1: Package = {
        id: 'test-package',
        type: 'cursor',
        url: 'https://example.com/test1.md',
        dest: '.cursor/rules/test1.md'
      };

      const pkg2: Package = {
        id: 'test-package',
        type: 'claude',
        url: 'https://example.com/test2.md',
        dest: '.claude/agents/test2.md'
      };

      await addPackage(pkg1);
      await addPackage(pkg2);
      
      const config = await readConfig();
      expect(config.sources).toHaveLength(1);
      expect(config.sources[0]).toEqual(pkg2);
    });

    it('should add multiple packages', async () => {
      const pkg1: Package = {
        id: 'package-1',
        type: 'cursor',
        url: 'https://example.com/test1.md',
        dest: '.cursor/rules/test1.md'
      };

      const pkg2: Package = {
        id: 'package-2',
        type: 'claude',
        url: 'https://example.com/test2.md',
        dest: '.claude/agents/test2.md'
      };

      await addPackage(pkg1);
      await addPackage(pkg2);
      
      const config = await readConfig();
      expect(config.sources).toHaveLength(2);
      expect(config.sources).toContainEqual(pkg1);
      expect(config.sources).toContainEqual(pkg2);
    });
  });

  describe('removePackage', () => {
    it('should remove existing package', async () => {
      const pkg: Package = {
        id: 'test-package',
        type: 'cursor',
        url: 'https://example.com/test.md',
        dest: '.cursor/rules/test.md'
      };

      await addPackage(pkg);
      const removed = await removePackage('test-package');
      
      expect(removed).toEqual(pkg);
      
      const config = await readConfig();
      expect(config.sources).toHaveLength(0);
    });

    it('should return null for non-existent package', async () => {
      const removed = await removePackage('non-existent');
      expect(removed).toBeNull();
    });
  });

  describe('getPackage', () => {
    it('should return existing package', async () => {
      const pkg: Package = {
        id: 'test-package',
        type: 'cursor',
        url: 'https://example.com/test.md',
        dest: '.cursor/rules/test.md'
      };

      await addPackage(pkg);
      const found = await getPackage('test-package');
      expect(found).toEqual(pkg);
    });

    it('should return null for non-existent package', async () => {
      const found = await getPackage('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('listPackages', () => {
    it('should return all packages', async () => {
      const pkg1: Package = {
        id: 'package-1',
        type: 'cursor',
        url: 'https://example.com/test1.md',
        dest: '.cursor/rules/test1.md'
      };

      const pkg2: Package = {
        id: 'package-2',
        type: 'claude',
        url: 'https://example.com/test2.md',
        dest: '.claude/agents/test2.md'
      };

      await addPackage(pkg1);
      await addPackage(pkg2);
      
      const packages = await listPackages();
      expect(packages).toHaveLength(2);
      expect(packages).toContainEqual(pkg1);
      expect(packages).toContainEqual(pkg2);
    });

    it('should return empty array when no packages', async () => {
      const packages = await listPackages();
      expect(packages).toEqual([]);
    });
  });
});
