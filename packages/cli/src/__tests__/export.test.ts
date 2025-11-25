/**
 * Tests for export command
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { handleExport, ExportOptions } from '../commands/export';
import * as lockfile from '../core/lockfile';

// Mock dependencies
jest.mock('../core/lockfile');
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

describe('export command', () => {
  const mockTmpDir = '/tmp/prpm-test-export';

  beforeEach(async () => {
    jest.clearAllMocks();
    // Create test directory
    await fs.mkdir(mockTmpDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    await fs.rm(mockTmpDir, { recursive: true, force: true });
  });

  describe('export to ruler', () => {
    it('should export installed packages to .ruler directory', async () => {
      const testPackagePath = join(mockTmpDir, 'test-rule.md');
      await fs.writeFile(testPackagePath, '# Test Rule\n\nThis is a test rule.', 'utf-8');

      // Mock listPackages to return test data
      jest.spyOn(lockfile, 'listPackages').mockResolvedValue([
        {
          id: '@test/test-rule',
          version: '1.0.0',
          resolved: 'https://example.com/test.tar.gz',
          integrity: 'sha256-test',
          format: 'cursor',
          subtype: 'rule',
          installedPath: testPackagePath,
        },
      ]);

      const options: ExportOptions = {
        to: 'ruler',
        output: join(mockTmpDir, '.ruler'),
        yes: true,
      };

      // Change to tmp directory for test
      const originalCwd = process.cwd();
      process.chdir(mockTmpDir);

      try {
        await handleExport(options);

        // Verify .ruler directory was created
        const rulerDir = join(mockTmpDir, '.ruler');
        const exists = await fs.access(rulerDir).then(() => true).catch(() => false);
        expect(exists).toBe(true);

        // Verify package was exported
        const exportedFile = join(rulerDir, 'test-rule.md');
        const exportedExists = await fs.access(exportedFile).then(() => true).catch(() => false);
        expect(exportedExists).toBe(true);

        // Verify content has frontmatter
        const content = await fs.readFile(exportedFile, 'utf-8');
        expect(content).toContain('---');
        expect(content).toContain('# Exported from PRPM');
        expect(content).toContain('# Package: @test/test-rule');
        expect(content).toContain('# Version: 1.0.0');
        expect(content).toContain('# Original Format: cursor');
        expect(content).toContain('This is a test rule.');

        // Verify ruler.toml was created
        const rulerConfig = join(mockTmpDir, 'ruler.toml');
        const configExists = await fs.access(rulerConfig).then(() => true).catch(() => false);
        expect(configExists).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle multiple packages', async () => {
      const package1Path = join(mockTmpDir, 'rule1.md');
      const package2Path = join(mockTmpDir, 'rule2.md');

      await fs.writeFile(package1Path, '# Rule 1', 'utf-8');
      await fs.writeFile(package2Path, '# Rule 2', 'utf-8');

      jest.spyOn(lockfile, 'listPackages').mockResolvedValue([
        {
          id: '@test/rule1',
          version: '1.0.0',
          resolved: 'https://example.com/test1.tar.gz',
          integrity: 'sha256-test1',
          format: 'cursor',
          subtype: 'rule',
          installedPath: package1Path,
        },
        {
          id: '@test/rule2',
          version: '2.0.0',
          resolved: 'https://example.com/test2.tar.gz',
          integrity: 'sha256-test2',
          format: 'claude',
          subtype: 'skill',
          installedPath: package2Path,
        },
      ]);

      const options: ExportOptions = {
        to: 'ruler',
        output: join(mockTmpDir, '.ruler'),
        yes: true,
      };

      const originalCwd = process.cwd();
      process.chdir(mockTmpDir);

      try {
        await handleExport(options);

        // Verify both packages were exported
        const rulerDir = join(mockTmpDir, '.ruler');
        const files = await fs.readdir(rulerDir);
        expect(files).toContain('rule1.md');
        expect(files).toContain('rule2.md');

        // Verify content of both files
        const content1 = await fs.readFile(join(rulerDir, 'rule1.md'), 'utf-8');
        expect(content1).toContain('@test/rule1');
        expect(content1).toContain('cursor');

        const content2 = await fs.readFile(join(rulerDir, 'rule2.md'), 'utf-8');
        expect(content2).toContain('@test/rule2');
        expect(content2).toContain('claude');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle no installed packages gracefully', async () => {
      jest.spyOn(lockfile, 'listPackages').mockResolvedValue([]);

      const options: ExportOptions = {
        to: 'ruler',
        output: join(mockTmpDir, '.ruler'),
        yes: true,
      };

      const originalCwd = process.cwd();
      process.chdir(mockTmpDir);

      try {
        // Should not throw, just show warning
        await handleExport(options);

        // .ruler directory should still be created
        const rulerDir = join(mockTmpDir, '.ruler');
        const exists = await fs.access(rulerDir).then(() => true).catch(() => false);
        expect(exists).toBe(false); // Should not create directory if no packages
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should skip packages without installed path', async () => {
      const testPackagePath = join(mockTmpDir, 'test-rule.md');
      await fs.writeFile(testPackagePath, '# Test Rule', 'utf-8');

      jest.spyOn(lockfile, 'listPackages').mockResolvedValue([
        {
          id: '@test/good-package',
          version: '1.0.0',
          resolved: 'https://example.com/good.tar.gz',
          integrity: 'sha256-good',
          format: 'cursor',
          subtype: 'rule',
          installedPath: testPackagePath,
        },
        {
          id: '@test/bad-package',
          version: '1.0.0',
          resolved: 'https://example.com/bad.tar.gz',
          integrity: 'sha256-bad',
          format: 'cursor',
          subtype: 'rule',
          // No installedPath
        },
      ]);

      const options: ExportOptions = {
        to: 'ruler',
        output: join(mockTmpDir, '.ruler'),
        yes: true,
      };

      const originalCwd = process.cwd();
      process.chdir(mockTmpDir);

      try {
        await handleExport(options);

        const rulerDir = join(mockTmpDir, '.ruler');
        const files = await fs.readdir(rulerDir);

        // Only good package should be exported
        expect(files).toContain('good-package.md');
        expect(files).not.toContain('bad-package.md');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should not overwrite existing ruler.toml', async () => {
      const testPackagePath = join(mockTmpDir, 'test-rule.md');
      await fs.writeFile(testPackagePath, '# Test Rule', 'utf-8');

      // Create existing ruler.toml
      const existingConfig = '# Existing config\n[agents.cursor]\nenabled = true\n';
      await fs.writeFile(join(mockTmpDir, 'ruler.toml'), existingConfig, 'utf-8');

      jest.spyOn(lockfile, 'listPackages').mockResolvedValue([
        {
          id: '@test/test-rule',
          version: '1.0.0',
          resolved: 'https://example.com/test.tar.gz',
          integrity: 'sha256-test',
          format: 'cursor',
          subtype: 'rule',
          installedPath: testPackagePath,
        },
      ]);

      const options: ExportOptions = {
        to: 'ruler',
        output: join(mockTmpDir, '.ruler'),
        yes: true,
      };

      const originalCwd = process.cwd();
      process.chdir(mockTmpDir);

      try {
        await handleExport(options);

        // Verify ruler.toml wasn't overwritten
        const config = await fs.readFile(join(mockTmpDir, 'ruler.toml'), 'utf-8');
        expect(config).toBe(existingConfig);
        expect(config).toContain('# Existing config');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});
