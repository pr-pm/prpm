/**
 * Multi-package manifest utilities
 * Handles merging root-level fields with package-level fields
 */

import type { MultiPackageManifest, PackageManifest } from '@pr-pm/types';

/**
 * Fields that can be inherited from root to packages
 */
const INHERITABLE_FIELDS = [
  'author',
  'license',
  'repository',
  'homepage',
  'documentation',
  'organization',
  'keywords',
  'tags',
] as const;

/**
 * Merge root-level fields into a package manifest
 * Package-level fields take precedence over root-level fields
 */
export function mergePackageFields(
  root: MultiPackageManifest,
  pkg: PackageManifest
): PackageManifest {
  const merged: PackageManifest = { ...pkg };

  // Inherit each inheritable field if not defined in package
  for (const field of INHERITABLE_FIELDS) {
    if (merged[field] === undefined && root[field] !== undefined) {
      // @ts-ignore - dynamic field access
      merged[field] = root[field];
    }
  }

  return merged;
}

/**
 * Get all packages from a multi-package manifest with inherited fields
 */
export function getPackagesWithInheritance(
  manifest: MultiPackageManifest
): PackageManifest[] {
  return manifest.packages.map(pkg => mergePackageFields(manifest, pkg));
}

/**
 * Validate multi-package manifest
 */
export function validateMultiPackageManifest(manifest: MultiPackageManifest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check packages array exists and is not empty
  if (!manifest.packages || !Array.isArray(manifest.packages)) {
    errors.push('packages field must be an array');
    return { valid: false, errors };
  }

  if (manifest.packages.length === 0) {
    errors.push('packages array must contain at least one package');
    return { valid: false, errors };
  }

  // Check for duplicate package names
  const names = new Set<string>();
  for (let i = 0; i < manifest.packages.length; i++) {
    const pkg = manifest.packages[i];
    if (names.has(pkg.name)) {
      errors.push(`Duplicate package name: ${pkg.name}`);
    }
    names.add(pkg.name);
  }

  // Validate each package has required fields
  for (let i = 0; i < manifest.packages.length; i++) {
    const pkg = manifest.packages[i];
    const pkgPrefix = `Package ${i} (${pkg.name || 'unnamed'})`;

    if (!pkg.name) {
      errors.push(`${pkgPrefix}: missing required field 'name'`);
    }
    if (!pkg.version) {
      errors.push(`${pkgPrefix}: missing required field 'version'`);
    }
    if (!pkg.description) {
      errors.push(`${pkgPrefix}: missing required field 'description'`);
    }
    if (!pkg.format) {
      errors.push(`${pkgPrefix}: missing required field 'format'`);
    }
    if (!pkg.files || pkg.files.length === 0) {
      errors.push(`${pkgPrefix}: must have at least one file in 'files' array`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Filter packages by name or pattern
 */
export function filterPackages(
  packages: PackageManifest[],
  filter: string | number
): PackageManifest[] {
  // If filter is a number, treat as index
  if (typeof filter === 'number') {
    if (filter < 0 || filter >= packages.length) {
      throw new Error(`Package index ${filter} out of range (0-${packages.length - 1})`);
    }
    return [packages[filter]];
  }

  // If exact match, return that package
  const exactMatch = packages.find(pkg => pkg.name === filter);
  if (exactMatch) {
    return [exactMatch];
  }

  // Try as glob pattern
  const pattern = filter.replace(/\*/g, '.*');
  const regex = new RegExp(`^${pattern}$`);
  const matches = packages.filter(pkg => regex.test(pkg.name));

  if (matches.length === 0) {
    throw new Error(`No packages match filter: ${filter}`);
  }

  return matches;
}
