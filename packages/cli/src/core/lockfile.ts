/**
 * Lock file management for reproducible installations
 * prpm.lock format similar to package-lock.json
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

/**
 * MCP Server configuration stored in lockfile
 */
export interface LockfileMCPServer {
  type?: 'stdio' | 'http' | 'sse';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

export interface LockfilePackage {
  version: string;
  resolved: string; // Tarball URL
  integrity: string; // SHA-256 hash
  dependencies?: Record<string, string>;
  format?: string; // Installed format
  subtype?: string; // Installed subtype
  sourceFormat?: string; // Original package format from registry
  sourceSubtype?: string; // Original subtype from registry
  installedPath?: string; // Path where the package was installed
  fromCollection?: {
    scope?: string;
    name_slug: string;
    version?: string;
  };
  // For Claude hooks: track which hook events were added
  hookMetadata?: {
    events: string[]; // e.g., ['PreToolUse', 'PostToolUse']
    hookId: string; // Unique identifier to find and remove this hook
  };
  // For progressive disclosure (agents.md skills in .openskills/, agents in .openagents/, commands in .opencommands/)
  progressiveDisclosure?: {
    mode: 'progressive'; // Progressive disclosure mode
    resourceDir: string; // Path to resource directory (e.g., '.openskills/package-name' or '.openagents/agent-name')
    manifestPath: string; // Path to AGENTS.md manifest file
    resourceName: string; // Resource name as referenced in XML
    resourceType: 'skill' | 'agent' | 'command'; // Type of resource
    // Legacy fields for backward compatibility
    skillsDir?: string; // Deprecated: use resourceDir
    skillName?: string; // Deprecated: use resourceName
  };
  // For Claude plugins: track installed files and MCP servers
  pluginMetadata?: {
    files: string[]; // List of installed file paths (relative to project root)
    mcpServers?: Record<string, LockfileMCPServer>; // MCP servers that were installed
    mcpGlobal?: boolean; // Whether MCP servers were installed globally
    mcpEditor?: string; // Editor target used for MCP server installation
  };
  // For snippet packages: track where content was appended
  snippetMetadata?: {
    targetPath: string; // Target file where snippet was installed
    config: {
      target: string;
      position?: 'append' | 'prepend' | string; // section:## Header
      header?: string;
    };
  };
}

export interface LockfileCollection {
  name_slug: string;
  version: string;
  installedAt: string; // Timestamp
  packages: string[]; // Package IDs installed from this collection
}

export interface Lockfile {
  version: string; // Lock file format version
  lockfileVersion: number;
  packages: Record<string, LockfilePackage>;
  collections?: Record<string, LockfileCollection>; // Track installed collections
  generated: string; // Timestamp
}

const LOCKFILE_NAME = 'prpm.lock';
const LOCKFILE_VERSION = 1;

/**
 * Read lock file from current directory
 */
export async function readLockfile(cwd: string = process.cwd()): Promise<Lockfile | null> {
  try {
    const lockfilePath = join(cwd, LOCKFILE_NAME);
    const content = await fs.readFile(lockfilePath, 'utf-8');
    return JSON.parse(content) as Lockfile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null; // Lock file doesn't exist
    }
    throw new Error(`Failed to read lock file: ${error}`);
  }
}

/**
 * Write lock file to current directory
 */
export async function writeLockfile(
  lockfile: Lockfile,
  cwd: string = process.cwd()
): Promise<void> {
  try {
    const lockfilePath = join(cwd, LOCKFILE_NAME);
    const content = JSON.stringify(lockfile, null, 2);
    await fs.writeFile(lockfilePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write lock file: ${error}`);
  }
}

/**
 * Create new lock file
 */
export function createLockfile(): Lockfile {
  return {
    version: '1.0.0',
    lockfileVersion: LOCKFILE_VERSION,
    packages: {},
    generated: new Date().toISOString(),
  };
}

/**
 * Generate lockfile key for a package with optional format suffix
 * Format: packageId, packageId#format, or packageId#format:location (for snippets)
 */
export function getLockfileKey(packageId: string, format?: string, location?: string): string {
  if (!format) {
    return packageId;
  }
  if (location) {
    // For snippets installed to specific files, include location in key
    return `${packageId}#${format}:${location}`;
  }
  return `${packageId}#${format}`;
}

/**
 * Parse lockfile key to extract package ID, format, and optional location
 */
export function parseLockfileKey(key: string): { packageId: string; format?: string; location?: string } {
  const hashIndex = key.indexOf('#');
  if (hashIndex === -1) {
    return { packageId: key };
  }

  const packageId = key.substring(0, hashIndex);
  const rest = key.substring(hashIndex + 1);

  const colonIndex = rest.indexOf(':');
  if (colonIndex === -1) {
    return { packageId, format: rest };
  }

  return {
    packageId,
    format: rest.substring(0, colonIndex),
    location: rest.substring(colonIndex + 1),
  };
}

/**
 * Add package to lock file
 */
export function addToLockfile(
  lockfile: Lockfile,
  packageId: string,
  packageInfo: {
    version: string;
    tarballUrl: string;
    dependencies?: Record<string, string>;
    format?: string;
    subtype?: string;
    sourceFormat?: string;
    sourceSubtype?: string;
    installedPath?: string;
    fromCollection?: {
      scope?: string;
      name_slug: string;
      version?: string;
    };
    hookMetadata?: {
      events: string[];
      hookId: string;
    };
    progressiveDisclosure?: {
      mode: 'progressive';
      resourceDir: string;
      manifestPath: string;
      resourceName: string;
      resourceType: 'skill' | 'agent' | 'command';
      // Legacy support
      skillsDir?: string;
      skillName?: string;
    };
    pluginMetadata?: {
      files: string[];
      mcpServers?: Record<string, LockfileMCPServer>;
      mcpGlobal?: boolean;
      mcpEditor?: string;
    };
    snippetMetadata?: {
      targetPath: string;
      config: {
        target: string;
        position?: 'append' | 'prepend' | string;
        header?: string;
      };
    };
  }
): void {
  // Use format-specific key if format is provided (enables multiple formats per package)
  // For snippets, include target path in key to allow multiple installations to different files
  const snippetLocation = packageInfo.subtype === 'snippet' ? packageInfo.snippetMetadata?.targetPath : undefined;
  const lockfileKey = getLockfileKey(packageId, packageInfo.format, snippetLocation);

  lockfile.packages[lockfileKey] = {
    version: packageInfo.version,
    resolved: packageInfo.tarballUrl,
    integrity: '', // Will be set after download
    dependencies: packageInfo.dependencies,
    format: packageInfo.format,
    subtype: packageInfo.subtype,
    sourceFormat: packageInfo.sourceFormat,
    sourceSubtype: packageInfo.sourceSubtype,
    installedPath: packageInfo.installedPath,
    fromCollection: packageInfo.fromCollection,
    hookMetadata: packageInfo.hookMetadata,
    progressiveDisclosure: packageInfo.progressiveDisclosure,
    pluginMetadata: packageInfo.pluginMetadata,
    snippetMetadata: packageInfo.snippetMetadata,
  };
  lockfile.generated = new Date().toISOString();
}

/**
 * Update package integrity hash after download
 */
export function setPackageIntegrity(
  lockfile: Lockfile,
  packageId: string,
  tarballBuffer: Buffer,
  format?: string,
  location?: string
): void {
  const lockfileKey = getLockfileKey(packageId, format, location);

  if (!lockfile.packages[lockfileKey]) {
    throw new Error(`Package ${lockfileKey} not found in lock file`);
  }

  const hash = createHash('sha256').update(tarballBuffer).digest('hex');
  lockfile.packages[lockfileKey].integrity = `sha256-${hash}`;
}

/**
 * Verify package integrity
 */
export function verifyPackageIntegrity(
  lockfile: Lockfile,
  packageId: string,
  tarballBuffer: Buffer,
  format?: string,
  location?: string
): boolean {
  // Use format-specific key if format is provided
  const lockfileKey = getLockfileKey(packageId, format, location);
  const pkg = lockfile.packages[lockfileKey];
  if (!pkg || !pkg.integrity) {
    return false;
  }

  const hash = createHash('sha256').update(tarballBuffer).digest('hex');
  const expectedHash = pkg.integrity.replace('sha256-', '');

  return hash === expectedHash;
}

/**
 * Get locked version for a package (searches all formats)
 */
export function getLockedVersion(
  lockfile: Lockfile | null,
  packageId: string,
  format?: string
): string | null {
  if (!lockfile) {
    return null;
  }

  // If format specified, check specific key
  if (format) {
    const lockfileKey = getLockfileKey(packageId, format);
    return lockfile.packages[lockfileKey]?.version || null;
  }

  // Otherwise, find any matching package (without format suffix first, then with format)
  if (lockfile.packages[packageId]) {
    return lockfile.packages[packageId].version;
  }

  // Search for format-specific entries
  for (const key of Object.keys(lockfile.packages)) {
    const parsed = parseLockfileKey(key);
    if (parsed.packageId === packageId) {
      return lockfile.packages[key].version;
    }
  }

  return null;
}

/**
 * Check if lock file is out of sync with dependencies
 */
export function isLockfileOutOfSync(
  lockfile: Lockfile | null,
  requiredPackages: Record<string, string>
): boolean {
  if (!lockfile) {
    return true;
  }

  // Check if all required packages are in lock file
  for (const [pkgId, version] of Object.entries(requiredPackages)) {
    const locked = lockfile.packages[pkgId];
    if (!locked || locked.version !== version) {
      return true;
    }
  }

  return false;
}

/**
 * Merge lock files (for conflict resolution)
 */
export function mergeLockfiles(
  base: Lockfile,
  incoming: Lockfile
): Lockfile {
  const merged = createLockfile();

  // Merge packages from both lock files
  const allPackages = new Set([
    ...Object.keys(base.packages),
    ...Object.keys(incoming.packages),
  ]);

  for (const pkgId of allPackages) {
    const basePkg = base.packages[pkgId];
    const incomingPkg = incoming.packages[pkgId];

    if (!basePkg) {
      merged.packages[pkgId] = incomingPkg;
    } else if (!incomingPkg) {
      merged.packages[pkgId] = basePkg;
    } else {
      // Both exist - prefer newer version
      const baseVersion = basePkg.version;
      const incomingVersion = incomingPkg.version;

      merged.packages[pkgId] = compareVersions(baseVersion, incomingVersion) >= 0
        ? basePkg
        : incomingPkg;
    }
  }

  return merged;
}

/**
 * Simple semver comparison (returns 1 if a > b, -1 if a < b, 0 if equal)
 */
function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;

    if (aVal > bVal) return 1;
    if (aVal < bVal) return -1;
  }

  return 0;
}

/**
 * Prune unused packages from lock file
 */
export function pruneLockfile(
  lockfile: Lockfile,
  requiredPackages: Set<string>
): Lockfile {
  const pruned = { ...lockfile };
  pruned.packages = {};

  for (const pkgId of requiredPackages) {
    if (lockfile.packages[pkgId]) {
      pruned.packages[pkgId] = lockfile.packages[pkgId];
    }
  }

  pruned.generated = new Date().toISOString();
  return pruned;
}

/**
 * Add package to lock file (convenience wrapper)
 */
export async function addPackage(packageInfo: {
  id: string;
  version: string;
  tarballUrl: string;
  dependencies?: Record<string, string>;
  format?: string;
  subtype?: string;
  sourceFormat?: string;
  sourceSubtype?: string;
  installedPath?: string;
}): Promise<void> {
  const lockfile = (await readLockfile()) || createLockfile();
  addToLockfile(lockfile, packageInfo.id, {
    version: packageInfo.version,
    tarballUrl: packageInfo.tarballUrl,
    dependencies: packageInfo.dependencies,
    format: packageInfo.format,
    subtype: packageInfo.subtype,
    sourceFormat: packageInfo.sourceFormat,
    sourceSubtype: packageInfo.sourceSubtype,
    installedPath: packageInfo.installedPath,
  });
  await writeLockfile(lockfile);
}

/**
 * Remove package from lock file
 */
export async function removePackage(packageId: string): Promise<LockfilePackage | null> {
  const lockfile = await readLockfile();
  if (!lockfile || !lockfile.packages[packageId]) {
    return null;
  }

  const removed = lockfile.packages[packageId];
  delete lockfile.packages[packageId];
  lockfile.generated = new Date().toISOString();
  await writeLockfile(lockfile);
  return removed;
}

/**
 * List all packages in lock file
 */
export async function listPackages(): Promise<Array<{ id: string } & LockfilePackage>> {
  const lockfile = await readLockfile();
  if (!lockfile) {
    return [];
  }

  return Object.entries(lockfile.packages).map(([id, pkg]) => ({
    id,
    ...pkg,
  }));
}

/**
 * Get a specific package from lock file
 */
export async function getPackage(packageId: string): Promise<LockfilePackage | null> {
  const lockfile = await readLockfile();
  if (!lockfile || !lockfile.packages[packageId]) {
    return null;
  }
  return lockfile.packages[packageId];
}

/**
 * Add or update collection in lock file
 */
export function addCollectionToLockfile(
  lockfile: Lockfile,
  collectionKey: string,
  collectionInfo: {
    name_slug: string;
    version: string;
    packages: string[];
  }
): void {
  if (!lockfile.collections) {
    lockfile.collections = {};
  }

  lockfile.collections[collectionKey] = {
    name_slug: collectionInfo.name_slug,
    version: collectionInfo.version,
    installedAt: new Date().toISOString(),
    packages: collectionInfo.packages,
  };
  lockfile.generated = new Date().toISOString();
}

/**
 * Get collection from lock file
 */
export function getCollectionFromLockfile(
  lockfile: Lockfile | null,
  collectionKey: string
): LockfileCollection | null {
  if (!lockfile || !lockfile.collections) {
    return null;
  }
  return lockfile.collections[collectionKey] || null;
}

/**
 * Remove collection from lock file
 */
export function removeCollectionFromLockfile(
  lockfile: Lockfile,
  collectionKey: string
): void {
  if (!lockfile.collections) {
    return;
  }
  delete lockfile.collections[collectionKey];
  lockfile.generated = new Date().toISOString();
}

/**
 * List all collections in lock file
 */
export function listCollectionsFromLockfile(
  lockfile: Lockfile | null
): Array<{ key: string } & LockfileCollection> {
  if (!lockfile || !lockfile.collections) {
    return [];
  }

  return Object.entries(lockfile.collections).map(([key, collection]) => ({
    key,
    ...collection,
  }));
}
