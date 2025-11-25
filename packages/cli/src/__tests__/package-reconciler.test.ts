/**
 * Tests for package reconciler module
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  readManifest,
  reconcilePackages,
  createManifestFromDetected,
  mergePackagesIntoManifest,
  detectedToManifest,
  generateUniqueName,
  ManifestPackage,
} from '../core/package-reconciler';
import { DetectedPackage } from '../core/package-scanner';

describe('package-reconciler', () => {
  let testDir: string;
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();
  });

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'prpm-reconciler-test-'));
    process.chdir(testDir);
  });

  afterEach(async () => {
    try {
      process.chdir(originalCwd);
    } catch {
      process.chdir(tmpdir());
    }

    if (testDir) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('readManifest', () => {
    it('should return null when no prpm.json exists', async () => {
      const result = await readManifest(testDir);
      expect(result).toBeNull();
    });

    it('should read single-package manifest', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'test-package',
          version: '1.0.0',
          format: 'cursor',
          files: ['.cursorrules'],
        })
      );

      const result = await readManifest(testDir);

      expect(result).not.toBeNull();
      expect(result!.isMultiPackage).toBe(false);
      expect(result!.packages).toHaveLength(1);
      expect(result!.packages[0].name).toBe('test-package');
    });

    it('should read multi-package manifest', async () => {
      await writeFile(
        join(testDir, 'prpm.json'),
        JSON.stringify({
          name: 'my-packages',
          version: '1.0.0',
          packages: [
            {
              name: 'package-1',
              format: 'cursor',
              files: ['.cursor/rules/rule1.mdc'],
            },
            {
              name: 'package-2',
              format: 'claude',
              subtype: 'skill',
              files: ['.claude/skills/skill1/SKILL.md'],
            },
          ],
        })
      );

      const result = await readManifest(testDir);

      expect(result).not.toBeNull();
      expect(result!.isMultiPackage).toBe(true);
      expect(result!.packages).toHaveLength(2);
      expect(result!.packages[0].name).toBe('package-1');
      expect(result!.packages[1].name).toBe('package-2');
    });
  });

  describe('reconcilePackages', () => {
    const createDetectedPackage = (overrides: Partial<DetectedPackage> = {}): DetectedPackage => ({
      name: 'test-package',
      format: 'cursor',
      subtype: 'rule',
      description: 'Test package',
      tags: ['test'],
      files: ['.cursor/rules/test.mdc'],
      primaryFile: '.cursor/rules/test.mdc',
      ...overrides,
    });

    const createManifestPackage = (overrides: Partial<ManifestPackage> = {}): ManifestPackage => ({
      name: 'test-package',
      format: 'cursor',
      files: ['.cursor/rules/test.mdc'],
      ...overrides,
    });

    it('should identify in-sync packages by file match', async () => {
      // Create the file on disk
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(join(testDir, '.cursor/rules/test.mdc'), '# Test');

      const detected = [createDetectedPackage()];
      const manifest = [createManifestPackage()];

      const result = await reconcilePackages(detected, manifest, testDir);

      expect(result.inSync).toHaveLength(1);
      expect(result.newPackages).toHaveLength(0);
      expect(result.missingPackages).toHaveLength(0);
    });

    it('should identify new packages on disk', async () => {
      const detected = [
        createDetectedPackage({ name: 'existing' }),
        createDetectedPackage({ name: 'new-package', files: ['.cursor/rules/new.mdc'] }),
      ];
      const manifest = [createManifestPackage({ name: 'existing' })];

      // Create files on disk
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(join(testDir, '.cursor/rules/test.mdc'), '# Test');

      const result = await reconcilePackages(detected, manifest, testDir);

      expect(result.inSync).toHaveLength(1);
      expect(result.newPackages).toHaveLength(1);
      expect(result.newPackages[0].name).toBe('new-package');
    });

    it('should identify missing packages', async () => {
      const detected: DetectedPackage[] = [];
      const manifest = [
        createManifestPackage({ name: 'missing-package', files: ['.cursor/rules/missing.mdc'] }),
      ];

      const result = await reconcilePackages(detected, manifest, testDir);

      expect(result.inSync).toHaveLength(0);
      expect(result.newPackages).toHaveLength(0);
      expect(result.missingPackages).toHaveLength(1);
      expect(result.missingPackages[0].name).toBe('missing-package');
    });

    it('should match packages by name and format when files differ', async () => {
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(join(testDir, '.cursor/rules/different.mdc'), '# Test');

      const detected = [
        createDetectedPackage({
          name: 'same-name',
          files: ['.cursor/rules/different.mdc'],
        }),
      ];
      const manifest = [
        createManifestPackage({
          name: 'same-name',
          files: ['.cursor/rules/original.mdc'], // Different file
        }),
      ];

      const result = await reconcilePackages(detected, manifest, testDir);

      // Should match by name + format
      expect(result.inSync).toHaveLength(1);
    });

    it('should handle mixed scenario', async () => {
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(join(testDir, '.cursor/rules/existing.mdc'), '# Existing');
      await writeFile(join(testDir, '.cursor/rules/new.mdc'), '# New');

      const detected = [
        createDetectedPackage({ name: 'existing', files: ['.cursor/rules/existing.mdc'] }),
        createDetectedPackage({ name: 'new-package', files: ['.cursor/rules/new.mdc'] }),
      ];
      const manifest = [
        createManifestPackage({ name: 'existing', files: ['.cursor/rules/existing.mdc'] }),
        createManifestPackage({ name: 'deleted', files: ['.cursor/rules/deleted.mdc'] }),
      ];

      const result = await reconcilePackages(detected, manifest, testDir);

      expect(result.inSync).toHaveLength(1);
      expect(result.inSync[0].manifest.name).toBe('existing');

      expect(result.newPackages).toHaveLength(1);
      expect(result.newPackages[0].name).toBe('new-package');

      expect(result.missingPackages).toHaveLength(1);
      expect(result.missingPackages[0].name).toBe('deleted');
    });
  });

  describe('createManifestFromDetected', () => {
    const createDetectedPackage = (overrides: Partial<DetectedPackage> = {}): DetectedPackage => ({
      name: 'test-package',
      format: 'cursor',
      subtype: 'rule',
      description: 'Test package',
      tags: ['test'],
      files: ['.cursor/rules/test.mdc'],
      primaryFile: '.cursor/rules/test.mdc',
      ...overrides,
    });

    it('should create single-package manifest for one package', () => {
      const packages = [createDetectedPackage()];

      const manifest = createManifestFromDetected(packages);

      expect(manifest.name).toBe('test-package');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.format).toBe('cursor');
      expect(manifest.subtype).toBe('rule');
      expect(manifest.files).toEqual(['.cursor/rules/test.mdc']);
      expect(manifest).not.toHaveProperty('packages');
    });

    it('should create multi-package manifest for multiple packages', () => {
      const packages = [
        createDetectedPackage({ name: 'package-1' }),
        createDetectedPackage({ name: 'package-2', format: 'claude', subtype: 'skill' }),
      ];

      const manifest = createManifestFromDetected(packages) as { packages: unknown[] };

      expect(manifest).toHaveProperty('packages');
      expect(manifest.packages).toHaveLength(2);
    });

    it('should include author and license from defaults', () => {
      const packages = [createDetectedPackage()];

      const manifest = createManifestFromDetected(packages, {
        author: 'Test Author',
        license: 'Apache-2.0',
      });

      expect(manifest.author).toBe('Test Author');
      expect(manifest.license).toBe('Apache-2.0');
    });

    it('should throw when given empty array', () => {
      expect(() => createManifestFromDetected([])).toThrow('No packages to create manifest from');
    });
  });

  describe('mergePackagesIntoManifest', () => {
    it('should add new packages to existing manifest', () => {
      const existingRaw = {
        name: 'my-packages',
        version: '1.0.0',
        packages: [],
      };
      const existingPackages: ManifestPackage[] = [
        { name: 'existing', format: 'cursor', files: ['file1.mdc'] },
      ];
      const newPackages: DetectedPackage[] = [
        {
          name: 'new-package',
          format: 'claude',
          subtype: 'skill',
          description: 'New skill',
          tags: ['new'],
          files: ['.claude/skills/new/SKILL.md'],
          primaryFile: '.claude/skills/new/SKILL.md',
        },
      ];

      const result = mergePackagesIntoManifest(
        existingRaw,
        existingPackages,
        newPackages,
        new Set(),
        true
      ) as { packages: ManifestPackage[] };

      expect(result.packages).toHaveLength(2);
      expect(result.packages.some(p => p.name === 'existing')).toBe(true);
      expect(result.packages.some(p => p.name === 'new-package')).toBe(true);
    });

    it('should remove packages by name', () => {
      const existingRaw = {
        name: 'my-packages',
        version: '1.0.0',
        packages: [],
      };
      const existingPackages: ManifestPackage[] = [
        { name: 'keep-me', format: 'cursor', files: ['file1.mdc'] },
        { name: 'remove-me', format: 'cursor', files: ['file2.mdc'] },
      ];

      const result = mergePackagesIntoManifest(
        existingRaw,
        existingPackages,
        [],
        new Set(['remove-me']),
        true
      ) as { packages: ManifestPackage[] };

      expect(result.packages).toHaveLength(1);
      expect(result.packages[0].name).toBe('keep-me');
    });

    it('should convert to single-package format when only one package remains', () => {
      const existingRaw = {
        name: 'my-packages',
        version: '1.0.0',
        packages: [],
      };
      const existingPackages: ManifestPackage[] = [];
      const newPackages: DetectedPackage[] = [
        {
          name: 'only-package',
          format: 'cursor',
          subtype: 'rule',
          description: 'The only package',
          tags: ['only'],
          files: ['rule.mdc'],
          primaryFile: 'rule.mdc',
        },
      ];

      const result = mergePackagesIntoManifest(
        existingRaw,
        existingPackages,
        newPackages,
        new Set(),
        false // Not originally multi-package
      );

      expect(result).not.toHaveProperty('packages');
      expect(result.name).toBe('only-package');
      expect(result.format).toBe('cursor');
    });
  });

  describe('detectedToManifest', () => {
    it('should convert detected package to manifest format', () => {
      const detected: DetectedPackage = {
        name: 'test-package',
        format: 'cursor',
        subtype: 'rule',
        description: 'Test description',
        tags: ['tag1', 'tag2'],
        files: ['file1.mdc', 'file2.mdc'],
        primaryFile: 'file1.mdc',
      };

      const manifest = detectedToManifest(detected);

      expect(manifest).toEqual({
        name: 'test-package',
        version: '1.0.0',
        description: 'Test description',
        format: 'cursor',
        subtype: 'rule',
        tags: ['tag1', 'tag2'],
        files: ['file1.mdc', 'file2.mdc'],
      });
    });
  });

  describe('generateUniqueName', () => {
    it('should return base name when not in existing set', () => {
      const result = generateUniqueName('my-package', new Set(['other']));
      expect(result).toBe('my-package');
    });

    it('should append number when name exists', () => {
      const result = generateUniqueName('my-package', new Set(['my-package']));
      expect(result).toBe('my-package-2');
    });

    it('should increment number until unique', () => {
      const existing = new Set(['my-package', 'my-package-2', 'my-package-3']);
      const result = generateUniqueName('my-package', existing);
      expect(result).toBe('my-package-4');
    });
  });
});
