/**
 * Package reconciler for comparing detected packages against prpm.json
 * Identifies packages that are in sync, new, or missing
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { DetectedPackage } from './package-scanner';

/**
 * Package configuration from prpm.json
 */
export interface ManifestPackage {
  name: string;
  version?: string;
  description?: string;
  format: string;
  subtype?: string;
  tags?: string[];
  files: string[];
  private?: boolean;
}

/**
 * Result of reconciling detected packages with manifest
 */
export interface ReconciliationResult {
  /** Packages that exist in both manifest and on disk */
  inSync: Array<{
    manifest: ManifestPackage;
    detected: DetectedPackage;
  }>;
  /** Packages detected on disk but not in manifest */
  newPackages: DetectedPackage[];
  /** Packages in manifest but files not found on disk */
  missingPackages: ManifestPackage[];
}

/**
 * Read and parse prpm.json manifest
 */
export async function readManifest(cwd: string = process.cwd()): Promise<{
  raw: Record<string, unknown>;
  packages: ManifestPackage[];
  isMultiPackage: boolean;
} | null> {
  try {
    const manifestPath = path.join(cwd, 'prpm.json');
    const content = await fs.readFile(manifestPath, 'utf-8');
    const raw = JSON.parse(content) as Record<string, unknown>;

    // Check if it's a multi-package manifest
    if ('packages' in raw && Array.isArray(raw.packages)) {
      return {
        raw,
        packages: raw.packages as ManifestPackage[],
        isMultiPackage: true,
      };
    }

    // Single package manifest - treat as array of one
    if ('name' in raw && 'files' in raw) {
      return {
        raw,
        packages: [raw as unknown as ManifestPackage],
        isMultiPackage: false,
      };
    }

    return null;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize file path for comparison
 */
function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').toLowerCase();
}

/**
 * Check if two packages match based on their files
 */
function packagesMatch(manifest: ManifestPackage, detected: DetectedPackage): boolean {
  // Primary matching: check if any files overlap
  const manifestFiles = new Set(manifest.files.map(normalizePath));
  const detectedFiles = new Set(detected.files.map(normalizePath));

  for (const file of detectedFiles) {
    if (manifestFiles.has(file)) {
      return true;
    }
  }

  // Secondary matching: same name and format
  if (
    manifest.name.toLowerCase() === detected.name.toLowerCase() &&
    manifest.format === detected.format
  ) {
    return true;
  }

  return false;
}

/**
 * Reconcile detected packages against manifest
 *
 * @param detected - Packages detected on disk
 * @param manifest - Packages from prpm.json
 * @param cwd - Working directory for file existence checks
 * @returns Reconciliation result with in-sync, new, and missing packages
 */
export async function reconcilePackages(
  detected: DetectedPackage[],
  manifest: ManifestPackage[],
  cwd: string = process.cwd()
): Promise<ReconciliationResult> {
  const result: ReconciliationResult = {
    inSync: [],
    newPackages: [],
    missingPackages: [],
  };

  // Track which manifest packages have been matched
  const matchedManifestIndices = new Set<number>();

  // Track which detected packages have been matched
  const matchedDetectedIndices = new Set<number>();

  // Find matches between detected and manifest packages
  for (let di = 0; di < detected.length; di++) {
    const detectedPkg = detected[di];

    for (let mi = 0; mi < manifest.length; mi++) {
      if (matchedManifestIndices.has(mi)) continue;

      const manifestPkg = manifest[mi];
      if (packagesMatch(manifestPkg, detectedPkg)) {
        result.inSync.push({
          manifest: manifestPkg,
          detected: detectedPkg,
        });
        matchedManifestIndices.add(mi);
        matchedDetectedIndices.add(di);
        break;
      }
    }
  }

  // Unmatched detected packages are new
  for (let di = 0; di < detected.length; di++) {
    if (!matchedDetectedIndices.has(di)) {
      result.newPackages.push(detected[di]);
    }
  }

  // Unmatched manifest packages - check if their files exist
  for (let mi = 0; mi < manifest.length; mi++) {
    if (matchedManifestIndices.has(mi)) continue;

    const manifestPkg = manifest[mi];
    let anyFileExists = false;

    for (const file of manifestPkg.files) {
      const fullPath = path.join(cwd, file);
      if (await fileExists(fullPath)) {
        anyFileExists = true;
        break;
      }
    }

    if (!anyFileExists) {
      result.missingPackages.push(manifestPkg);
    }
  }

  return result;
}

/**
 * Generate a unique package name to avoid collisions
 */
export function generateUniqueName(
  baseName: string,
  existingNames: Set<string>
): string {
  if (!existingNames.has(baseName)) {
    return baseName;
  }

  let counter = 2;
  while (existingNames.has(`${baseName}-${counter}`)) {
    counter++;
  }

  return `${baseName}-${counter}`;
}

/**
 * Convert detected packages to manifest format
 */
export function detectedToManifest(detected: DetectedPackage): ManifestPackage {
  return {
    name: detected.name,
    version: '1.0.0',
    description: detected.description,
    format: detected.format,
    subtype: detected.subtype,
    tags: detected.tags,
    files: detected.files,
  };
}

/**
 * Merge new packages into existing manifest
 */
export function mergePackagesIntoManifest(
  existingRaw: Record<string, unknown>,
  existingPackages: ManifestPackage[],
  newPackages: DetectedPackage[],
  removedNames: Set<string>,
  isMultiPackage: boolean
): Record<string, unknown> {
  // Filter out removed packages
  const filteredPackages = existingPackages.filter(
    pkg => !removedNames.has(pkg.name)
  );

  // Add new packages
  const newManifestPackages = newPackages.map(detectedToManifest);
  const allPackages = [...filteredPackages, ...newManifestPackages];

  if (isMultiPackage || allPackages.length > 1) {
    // Multi-package format
    return {
      ...existingRaw,
      packages: allPackages,
    };
  } else if (allPackages.length === 1) {
    // Single package format
    const pkg = allPackages[0];
    const { packages: _packages, ...rest } = existingRaw;
    return {
      ...rest,
      name: pkg.name,
      version: pkg.version || '1.0.0',
      description: pkg.description,
      format: pkg.format,
      subtype: pkg.subtype || 'rule',
      tags: pkg.tags,
      files: pkg.files,
    };
  }

  return existingRaw;
}

/**
 * Create a new manifest from detected packages
 */
export function createManifestFromDetected(
  packages: DetectedPackage[],
  defaults?: {
    author?: string;
    license?: string;
    repository?: string;
  }
): Record<string, unknown> {
  if (packages.length === 0) {
    throw new Error('No packages to create manifest from');
  }

  if (packages.length === 1) {
    // Single package format
    const pkg = packages[0];
    return {
      name: pkg.name,
      version: '1.0.0',
      description: pkg.description,
      format: pkg.format,
      subtype: pkg.subtype,
      author: defaults?.author,
      license: defaults?.license || 'MIT',
      repository: defaults?.repository,
      tags: pkg.tags,
      files: pkg.files,
    };
  }

  // Multi-package format
  // Derive a project name from the current directory
  const projectName = path.basename(process.cwd()).toLowerCase().replace(/[^a-z0-9-]/g, '-');

  return {
    name: `${projectName}-packages`,
    version: '1.0.0',
    description: `AI packages from ${projectName}`,
    author: defaults?.author,
    license: defaults?.license || 'MIT',
    repository: defaults?.repository,
    packages: packages.map(detectedToManifest),
  };
}
