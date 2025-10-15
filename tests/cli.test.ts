/**
 * CLI integration tests using child_process
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

describe('CLI Integration Tests', () => {
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

  const runCLI = (args: string[]): Promise<{ code: number; stdout: string; stderr: string }> => {
    return new Promise((resolve) => {
      const child = spawn('node', [path.join(__dirname, '../dist/index.js'), ...args], {
        cwd: tempDir,
        stdio: 'pipe'
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          code: code || 0,
          stdout,
          stderr
        });
      });
    });
  };

  describe('Help Commands', () => {
    it('should show help for main command', async () => {
      const result = await runCLI(['--help']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Universal AI Coding Prompt Manager');
      expect(result.stdout).toContain('add');
      expect(result.stdout).toContain('list');
      expect(result.stdout).toContain('remove');
      expect(result.stdout).toContain('index');
    });

    it('should show help for add command', async () => {
      const result = await runCLI(['add', '--help']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Add a prompt package from a URL');
      expect(result.stdout).toContain('--as');
    });

    it('should show help for list command', async () => {
      const result = await runCLI(['list', '--help']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('List all installed prompt packages');
    });

    it('should show help for remove command', async () => {
      const result = await runCLI(['remove', '--help']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Remove a prompt package');
    });

    it('should show help for index command', async () => {
      const result = await runCLI(['index', '--help']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Scan existing');
    });

    it('should show version', async () => {
      const result = await runCLI(['--version']);
      expect(result.code).toBe(0);
      expect(result.stdout.trim()).toBe('2.3.0');
    });
  });

  describe('List Command', () => {
    it('should show empty list when no packages', async () => {
      const result = await runCLI(['list']);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('No packages installed');
    });
  });

  describe('Add Command', () => {
    it('should fail with invalid URL', async () => {
      const result = await runCLI(['add', 'invalid-url']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Failed to add package');
    });

    it('should fail with invalid type', async () => {
      const result = await runCLI(['add', 'https://raw.githubusercontent.com/user/repo/main/test.md', '--as', 'invalid']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Invalid type. Must be one of:');
    });

    it('should fail with missing URL', async () => {
      const result = await runCLI(['add']);
      expect(result.code).toBe(1);
    });
  });

  describe('Remove Command', () => {
    it('should fail with missing ID', async () => {
      const result = await runCLI(['remove']);
      expect(result.code).toBe(1);
    });

    it('should fail with non-existent package', async () => {
      const result = await runCLI(['remove', 'non-existent']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Package "non-existent" not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown command', async () => {
      const result = await runCLI(['unknown-command']);
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('unknown command');
    });

    it('should handle missing arguments gracefully', async () => {
      const result = await runCLI(['add']);
      expect(result.code).toBe(1);
    });
  });
});
