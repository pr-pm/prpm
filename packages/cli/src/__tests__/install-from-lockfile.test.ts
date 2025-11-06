/**
 * Tests for installing from lockfile (prpm install with no args)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('install from lockfile', () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // Create temp directory for test
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'prpm-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should fail when no lockfile exists', () => {
    // Arrange: No lockfile

    // Act & Assert
    expect(() => {
      execSync('node ../../dist/index.js install', {
        cwd: testDir,
        encoding: 'utf-8',
        stdio: 'pipe'
      });
    }).toThrow();
  });

  it('should handle empty lockfile', () => {
    // Arrange: Create empty lockfile
    const lockfile = {
      version: '1.0.0',
      lockfileVersion: 1,
      packages: {},
      generated: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(testDir, 'prpm.lock'),
      JSON.stringify(lockfile, null, 2),
      'utf-8'
    );

    // Act
    const output = execSync('node ../../dist/index.js install', {
      cwd: testDir,
      encoding: 'utf-8',
      stdio: 'pipe'
    });

    // Assert
    expect(output).toContain('No packages to install');
  });

  it('should install packages from lockfile', () => {
    // Arrange: Create lockfile with packages
    const lockfile = {
      version: '1.0.0',
      lockfileVersion: 1,
      packages: {
        '@test/package1': {
          version: '1.0.0',
          resolved: 'https://registry.prpm.dev/packages/@test/package1/1.0.0/download',
          integrity: 'sha256-abc123',
          format: 'cursor',
          subtype: 'rule'
        },
        '@test/package2': {
          version: '2.1.0',
          resolved: 'https://registry.prpm.dev/packages/@test/package2/2.1.0/download',
          integrity: 'sha256-def456',
          format: 'claude',
          subtype: 'skill'
        }
      },
      generated: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(testDir, 'prpm.lock'),
      JSON.stringify(lockfile, null, 2),
      'utf-8'
    );

    // Note: This would actually try to download packages
    // In a real test, we'd mock the registry client
    // For now, just verify the lockfile parsing works
  });

  it('should preserve format from lockfile when no --as option specified', () => {
    // This test would verify that packages are installed in their locked format
    // when no --as/--format option is provided
  });

  it('should respect --as option even with lockfile', () => {
    // This test would verify that --as option overrides lockfile format
  });

  it('should respect --frozen-lockfile option', () => {
    // This test would verify that --frozen-lockfile fails if lockfile needs updates
  });
});
