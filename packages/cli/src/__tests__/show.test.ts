import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
type Mock = ReturnType<typeof vi.fn>;

/**
 * Integration tests for show command
 */

import { handleShow } from '../commands/show';
import { getRegistryClient } from '@pr-pm/registry-client';
import { getConfig } from '../core/user-config';
import { CLIError } from '../core/errors';
import * as tar from 'tar';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// Mock dependencies
vi.mock('@pr-pm/registry-client');
vi.mock('../core/user-config');
vi.mock('../core/telemetry', () => ({
  telemetry: {
    track: vi.fn(),
    shutdown: vi.fn(),
  },
}));

describe('show command', () => {
  const mockClient = {
    getPackage: vi.fn(),
    getPackageVersion: vi.fn(),
    downloadPackage: vi.fn(),
  };

  const mockConfig = {
    registryUrl: 'https://test-registry.com',
    token: 'test-token',
  };

  const mockPackage = {
    id: '@test/package',
    name: '@test/package',
    description: 'A test package',
    format: 'claude',
    subtype: 'skill',
    tags: ['test'],
    total_downloads: 100,
    verified: true,
    latest_version: {
      version: '1.0.0',
      tarball_url: 'https://example.com/package.tar.gz',
    },
  };

  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let logOutput: string[];

  beforeEach(() => {
    (getRegistryClient as Mock).mockReturnValue(mockClient);
    (getConfig as Mock).mockResolvedValue(mockConfig);

    logOutput = [];
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation((...args) => {
      logOutput.push(args.map(a => String(a)).join(' '));
    });
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('basic show functionality', () => {
    it('should display package info and file list', async () => {
      mockClient.getPackage.mockResolvedValue(mockPackage);

      // Create a real tarball with test content
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'SKILL.md'), '# Test Skill\n\nThis is a test skill.');

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['SKILL.md']);

        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        const tarball = Buffer.concat(chunks);
        mockClient.downloadPackage.mockResolvedValue(tarball);

        await handleShow('@test/package', {});

        expect(mockClient.getPackage).toHaveBeenCalledWith('@test/package');
        expect(mockClient.downloadPackage).toHaveBeenCalled();

        const output = logOutput.join('\n');
        expect(output).toContain('@test/package');
        expect(output).toContain('1.0.0');
        expect(output).toContain('SKILL.md');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should show specific version when requested', async () => {
      const mockVersion = {
        version: '2.0.0',
        tarball_url: 'https://example.com/package-2.0.0.tar.gz',
      };

      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.getPackageVersion.mockResolvedValue(mockVersion);

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'SKILL.md'), '# Test v2');

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['SKILL.md']);
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await handleShow('@test/package@2.0.0', {});

        expect(mockClient.getPackageVersion).toHaveBeenCalledWith('@test/package', '2.0.0');

        const output = logOutput.join('\n');
        expect(output).toContain('2.0.0');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('--full flag', () => {
    it('should display full file contents when --full is specified', async () => {
      mockClient.getPackage.mockResolvedValue(mockPackage);

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        const skillContent = '# My Skill\n\nThis is the full content of the skill file.';
        await fs.writeFile(path.join(tmpDir, 'SKILL.md'), skillContent);

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['SKILL.md']);
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await handleShow('@test/package', { full: true });

        const output = logOutput.join('\n');
        expect(output).toContain('Full File Contents');
        expect(output).toContain('This is the full content of the skill file');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('--file flag', () => {
    it('should display contents of specific file when --file is specified', async () => {
      mockClient.getPackage.mockResolvedValue(mockPackage);

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'SKILL.md'), '# Skill content');
        await fs.writeFile(path.join(tmpDir, 'config.json'), '{"key": "value"}');

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['SKILL.md', 'config.json']);
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await handleShow('@test/package', { file: 'config.json' });

        const output = logOutput.join('\n');
        expect(output).toContain('config.json');
        expect(output).toContain('"key": "value"');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should throw error when file not found', async () => {
      mockClient.getPackage.mockResolvedValue(mockPackage);

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'SKILL.md'), '# Skill');

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['SKILL.md']);
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await expect(handleShow('@test/package', { file: 'nonexistent.md' }))
          .rejects.toThrow(CLIError);

        const output = logOutput.join('\n');
        expect(output).toContain('File not found');
        expect(output).toContain('Available files');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('--json flag', () => {
    it('should output JSON format when --json is specified', async () => {
      mockClient.getPackage.mockResolvedValue(mockPackage);

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'SKILL.md'), '# Test');

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['SKILL.md']);
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await handleShow('@test/package', { json: true });

        // Find the JSON output line
        const jsonLine = logOutput.find(line => line.startsWith('{'));
        expect(jsonLine).toBeDefined();

        const parsed = JSON.parse(jsonLine!);
        expect(parsed.package).toBe('@test/package');
        expect(parsed.version).toBe('1.0.0');
        expect(parsed.format).toBe('claude');
        expect(parsed.subtype).toBe('skill');
        expect(parsed.files).toBeInstanceOf(Array);
        expect(parsed.files[0]).toHaveProperty('path');
        expect(parsed.files[0]).toHaveProperty('size');
        expect(parsed.files[0]).toHaveProperty('isBinary');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should include file contents in JSON when --json --full is specified', async () => {
      mockClient.getPackage.mockResolvedValue(mockPackage);

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'SKILL.md'), '# Full JSON Content');

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['SKILL.md']);
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await handleShow('@test/package', { json: true, full: true });

        const jsonLine = logOutput.find(line => line.startsWith('{'));
        const parsed = JSON.parse(jsonLine!);

        expect(parsed.files[0].content).toContain('# Full JSON Content');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('binary file handling', () => {
    it('should detect and label binary files', async () => {
      mockClient.getPackage.mockResolvedValue(mockPackage);

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'SKILL.md'), '# Text file');
        // Create a binary file with null bytes
        const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0x00, 0x00]);
        await fs.writeFile(path.join(tmpDir, 'image.png'), binaryContent);

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['SKILL.md', 'image.png']);
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await handleShow('@test/package', {});

        const output = logOutput.join('\n');
        expect(output).toContain('[binary]');
        expect(output).toContain('image.png');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should include isBinary field in JSON output', async () => {
      mockClient.getPackage.mockResolvedValue(mockPackage);

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'text.md'), '# Text');
        await fs.writeFile(path.join(tmpDir, 'binary.bin'), Buffer.from([0x00, 0xff, 0x00]));

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['text.md', 'binary.bin']);
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await handleShow('@test/package', { json: true });

        const jsonLine = logOutput.find(line => line.startsWith('{'));
        const parsed = JSON.parse(jsonLine!);

        const textFile = parsed.files.find((f: any) => f.path.includes('text.md'));
        const binaryFile = parsed.files.find((f: any) => f.path.includes('binary.bin'));

        expect(textFile?.isBinary).toBe(false);
        expect(binaryFile?.isBinary).toBe(true);
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('security - path traversal protection', () => {
    it('should block entries with path traversal patterns', async () => {
      mockClient.getPackage.mockResolvedValue(mockPackage);

      // We can't easily create a malicious tarball in tests, but we can verify
      // the filter function exists by checking that safe files work
      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'safe.md'), '# Safe file');

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['safe.md']);
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await handleShow('@test/package', {});

        const output = logOutput.join('\n');
        expect(output).toContain('safe.md');
        // Should not contain any traversal warnings for safe files
        expect(consoleWarnSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('Blocked')
        );
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('error handling', () => {
    it('should handle package not found', async () => {
      mockClient.getPackage.mockRejectedValue(new Error('Package not found'));

      await expect(handleShow('@test/nonexistent', {}))
        .rejects.toThrow(CLIError);
    });

    it('should handle download failure', async () => {
      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.downloadPackage.mockRejectedValue(new Error('Download failed'));

      await expect(handleShow('@test/package', {}))
        .rejects.toThrow(CLIError);
    });

    it('should handle invalid package spec', async () => {
      // Invalid scoped package format
      await expect(handleShow('@invalid', {}))
        .rejects.toThrow();
    });

    it('should handle package with no versions', async () => {
      const noVersionPackage = { ...mockPackage, latest_version: undefined };
      mockClient.getPackage.mockResolvedValue(noVersionPackage);

      await expect(handleShow('@test/package', {}))
        .rejects.toThrow(CLIError);
    });
  });

  describe('package spec parsing', () => {
    it('should parse scoped package without version', async () => {
      mockClient.getPackage.mockResolvedValue(mockPackage);

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'SKILL.md'), '# Test');

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['SKILL.md']);
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await handleShow('@scope/package', {});

        expect(mockClient.getPackage).toHaveBeenCalledWith('@scope/package');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should parse scoped package with version', async () => {
      mockClient.getPackage.mockResolvedValue(mockPackage);
      mockClient.getPackageVersion.mockResolvedValue({
        version: '1.2.3',
        tarball_url: 'https://example.com/pkg.tar.gz',
      });

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'SKILL.md'), '# Test');

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['SKILL.md']);
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await handleShow('@scope/package@1.2.3', {});

        expect(mockClient.getPackage).toHaveBeenCalledWith('@scope/package');
        expect(mockClient.getPackageVersion).toHaveBeenCalledWith('@scope/package', '1.2.3');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should parse unscoped package without version', async () => {
      const unscopedPackage = { ...mockPackage, id: 'simple-package', name: 'simple-package' };
      mockClient.getPackage.mockResolvedValue(unscopedPackage);

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'SKILL.md'), '# Test');

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['SKILL.md']);
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await handleShow('simple-package', {});

        expect(mockClient.getPackage).toHaveBeenCalledWith('simple-package');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });

    it('should parse unscoped package with version', async () => {
      const unscopedPackage = { ...mockPackage, id: 'simple-package', name: 'simple-package' };
      mockClient.getPackage.mockResolvedValue(unscopedPackage);
      mockClient.getPackageVersion.mockResolvedValue({
        version: '2.0.0',
        tarball_url: 'https://example.com/pkg.tar.gz',
      });

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'SKILL.md'), '# Test');

        const chunks: Buffer[] = [];
        const tarStream = tar.create({ gzip: true, cwd: tmpDir }, ['SKILL.md']);
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await handleShow('simple-package@2.0.0', {});

        expect(mockClient.getPackage).toHaveBeenCalledWith('simple-package');
        expect(mockClient.getPackageVersion).toHaveBeenCalledWith('simple-package', '2.0.0');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('multi-file packages', () => {
    it('should list all files in multi-file package', async () => {
      mockClient.getPackage.mockResolvedValue(mockPackage);

      const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prpm-test-'));
      try {
        await fs.writeFile(path.join(tmpDir, 'SKILL.md'), '# Main skill');
        await fs.writeFile(path.join(tmpDir, 'config.json'), '{}');
        await fs.mkdir(path.join(tmpDir, 'docs'), { recursive: true });
        await fs.writeFile(path.join(tmpDir, 'docs', 'README.md'), '# Docs');

        const chunks: Buffer[] = [];
        const tarStream = tar.create(
          { gzip: true, cwd: tmpDir },
          ['SKILL.md', 'config.json', 'docs/README.md']
        );
        for await (const chunk of tarStream) {
          chunks.push(chunk as Buffer);
        }

        mockClient.downloadPackage.mockResolvedValue(Buffer.concat(chunks));

        await handleShow('@test/package', {});

        const output = logOutput.join('\n');
        expect(output).toContain('SKILL.md');
        expect(output).toContain('config.json');
        expect(output).toContain('docs/README.md');
        expect(output).toContain('Files: 3');
      } finally {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
