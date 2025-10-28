/**
 * Tests for multi-package manifest utilities
 */

import {
  mergePackageFields,
  getPackagesWithInheritance,
  validateMultiPackageManifest,
  filterPackages,
} from '../multi-package';
import type { MultiPackageManifest, PackageManifest } from '@pr-pm/types';

describe('multi-package utilities', () => {
  describe('mergePackageFields', () => {
    it('should inherit author from root', () => {
      const root: MultiPackageManifest = {
        name: 'monorepo',
        version: '1.0.0',
        author: 'Root Author',
        packages: [],
      };

      const pkg: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        files: ['test.txt'],
      };

      const merged = mergePackageFields(root, pkg);

      expect(merged.author).toBe('Root Author');
    });

    it('should not override package-level author', () => {
      const root: MultiPackageManifest = {
        name: 'monorepo',
        version: '1.0.0',
        author: 'Root Author',
        packages: [],
      };

      const pkg: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        files: ['test.txt'],
        author: 'Package Author',
      };

      const merged = mergePackageFields(root, pkg);

      expect(merged.author).toBe('Package Author');
    });

    it('should inherit multiple fields', () => {
      const root: MultiPackageManifest = {
        name: 'monorepo',
        version: '1.0.0',
        author: 'Root Author',
        license: 'MIT',
        repository: 'https://github.com/org/repo',
        organization: 'myorg',
        packages: [],
      };

      const pkg: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        files: ['test.txt'],
      };

      const merged = mergePackageFields(root, pkg);

      expect(merged.author).toBe('Root Author');
      expect(merged.license).toBe('MIT');
      expect(merged.repository).toBe('https://github.com/org/repo');
      expect(merged.organization).toBe('myorg');
    });

    it('should inherit keywords and tags', () => {
      const root: MultiPackageManifest = {
        name: 'monorepo',
        version: '1.0.0',
        keywords: ['root', 'keywords'],
        tags: ['root-tag'],
        packages: [],
      };

      const pkg: PackageManifest = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        format: 'cursor',
        files: ['test.txt'],
      };

      const merged = mergePackageFields(root, pkg);

      expect(merged.keywords).toEqual(['root', 'keywords']);
      expect(merged.tags).toEqual(['root-tag']);
    });

    it('should preserve package-specific fields', () => {
      const root: MultiPackageManifest = {
        name: 'monorepo',
        version: '1.0.0',
        author: 'Root Author',
        packages: [],
      };

      const pkg: PackageManifest = {
        name: 'test-package',
        version: '2.0.0',
        description: 'Test package',
        format: 'claude',
        subtype: 'agent',
        files: ['agent.md'],
        main: 'agent.md',
      };

      const merged = mergePackageFields(root, pkg);

      expect(merged.name).toBe('test-package');
      expect(merged.version).toBe('2.0.0');
      expect(merged.description).toBe('Test package');
      expect(merged.format).toBe('claude');
      expect(merged.subtype).toBe('agent');
      expect(merged.files).toEqual(['agent.md']);
      expect(merged.main).toBe('agent.md');
    });
  });

  describe('getPackagesWithInheritance', () => {
    it('should merge all packages with root fields', () => {
      const manifest: MultiPackageManifest = {
        name: 'monorepo',
        version: '1.0.0',
        author: 'Monorepo Author',
        license: 'MIT',
        packages: [
          {
            name: 'pkg1',
            version: '1.0.0',
            description: 'Package 1',
            format: 'cursor',
            files: ['pkg1.txt'],
          },
          {
            name: 'pkg2',
            version: '2.0.0',
            description: 'Package 2',
            format: 'claude',
            files: ['pkg2.md'],
            license: 'Apache-2.0', // Override
          },
        ],
      };

      const packages = getPackagesWithInheritance(manifest);

      expect(packages).toHaveLength(2);
      expect(packages[0].author).toBe('Monorepo Author');
      expect(packages[0].license).toBe('MIT');
      expect(packages[1].author).toBe('Monorepo Author');
      expect(packages[1].license).toBe('Apache-2.0'); // Overridden
    });
  });

  describe('validateMultiPackageManifest', () => {
    it('should validate a correct multi-package manifest', () => {
      const manifest: MultiPackageManifest = {
        name: 'monorepo',
        version: '1.0.0',
        author: 'Author',
        packages: [
          {
            name: 'pkg1',
            version: '1.0.0',
            description: 'Package 1',
            format: 'cursor',
            files: ['test.txt'],
          },
        ],
      };

      const result = validateMultiPackageManifest(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject manifest without packages array', () => {
      const manifest = {
        name: 'monorepo',
        version: '1.0.0',
      } as any;

      const result = validateMultiPackageManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('packages field must be an array');
    });

    it('should reject manifest with empty packages array', () => {
      const manifest: MultiPackageManifest = {
        name: 'monorepo',
        version: '1.0.0',
        packages: [],
      };

      const result = validateMultiPackageManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('packages array must contain at least one package');
    });

    it('should detect duplicate package names', () => {
      const manifest: MultiPackageManifest = {
        name: 'monorepo',
        version: '1.0.0',
        packages: [
          {
            name: 'pkg1',
            version: '1.0.0',
            description: 'Package 1',
            format: 'cursor',
            files: ['test1.txt'],
          },
          {
            name: 'pkg1', // Duplicate
            version: '2.0.0',
            description: 'Package 1 again',
            format: 'claude',
            files: ['test2.md'],
          },
        ],
      };

      const result = validateMultiPackageManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate package name'))).toBe(true);
    });

    it('should validate required fields in each package', () => {
      const manifest: MultiPackageManifest = {
        name: 'monorepo',
        version: '1.0.0',
        packages: [
          {
            name: 'pkg1',
            // missing version, description, format, files
          } as any,
        ],
      };

      const result = validateMultiPackageManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('version'))).toBe(true);
      expect(result.errors.some(e => e.includes('description'))).toBe(true);
      expect(result.errors.some(e => e.includes('format'))).toBe(true);
      expect(result.errors.some(e => e.includes('files'))).toBe(true);
    });

    it('should reject package with empty files array', () => {
      const manifest: MultiPackageManifest = {
        name: 'monorepo',
        version: '1.0.0',
        packages: [
          {
            name: 'pkg1',
            version: '1.0.0',
            description: 'Package 1',
            format: 'cursor',
            files: [], // Empty
          },
        ],
      };

      const result = validateMultiPackageManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('at least one file'))).toBe(true);
    });

    it('should provide detailed error messages with package info', () => {
      const manifest: MultiPackageManifest = {
        name: 'monorepo',
        version: '1.0.0',
        packages: [
          {
            name: 'good-package',
            version: '1.0.0',
            description: 'Good',
            format: 'cursor',
            files: ['test.txt'],
          },
          {
            name: 'bad-package',
            // missing fields
          } as any,
        ],
      };

      const result = validateMultiPackageManifest(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('bad-package'))).toBe(true);
    });
  });

  describe('filterPackages', () => {
    const packages: PackageManifest[] = [
      {
        name: '@myorg/cursor-rules',
        version: '1.0.0',
        description: 'Cursor rules',
        format: 'cursor',
        files: ['test.txt'],
      },
      {
        name: '@myorg/claude-agent',
        version: '1.0.0',
        description: 'Claude agent',
        format: 'claude',
        files: ['agent.md'],
      },
      {
        name: '@myorg/claude-skill',
        version: '1.0.0',
        description: 'Claude skill',
        format: 'claude',
        subtype: 'skill',
        files: ['skill.md'],
      },
    ];

    it('should filter by index', () => {
      const result = filterPackages(packages, 0);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('@myorg/cursor-rules');
    });

    it('should filter by exact name match', () => {
      const result = filterPackages(packages, '@myorg/claude-agent');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('@myorg/claude-agent');
    });

    it('should filter by glob pattern', () => {
      const result = filterPackages(packages, '@myorg/claude-*');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('@myorg/claude-agent');
      expect(result[1].name).toBe('@myorg/claude-skill');
    });

    it('should filter by wildcard pattern', () => {
      const result = filterPackages(packages, '*-skill');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('@myorg/claude-skill');
    });

    it('should throw error for invalid index', () => {
      expect(() => filterPackages(packages, 10)).toThrow('out of range');
      expect(() => filterPackages(packages, -1)).toThrow('out of range');
    });

    it('should throw error when no packages match filter', () => {
      expect(() => filterPackages(packages, 'nonexistent')).toThrow('No packages match');
    });

    it('should return all packages with * pattern', () => {
      const result = filterPackages(packages, '*');
      expect(result).toHaveLength(3);
    });
  });
});
