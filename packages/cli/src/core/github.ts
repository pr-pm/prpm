/**
 * GitHub repository download and package discovery
 * Supports installing packages directly from GitHub repos via tarball API
 */

import { createHash } from 'crypto';
import { tmpdir } from 'os';
import { join, basename, dirname, extname, relative } from 'path';
import { mkdir, rm, readFile, readdir, stat } from 'fs/promises';
import { randomBytes } from 'crypto';
import * as zlib from 'zlib';
import { promisify } from 'util';
import * as tar from 'tar';
import type { Format, Subtype } from '../types';

const gunzip = promisify(zlib.gunzip);

/**
 * Parsed GitHub repository specification
 */
export interface GitHubSpec {
  owner: string;
  repo: string;
  ref?: string;           // tag, branch, or commit SHA
  subdir?: string;        // subdirectory within repo
  filePath?: string;      // specific file path
}

/**
 * A discovered package from scanning a GitHub repo
 */
export interface DiscoveredPackage {
  /** Derived name from repo + file path */
  name: string;
  /** Original file path within the repo */
  sourcePath: string;
  /** Detected format */
  format: Format;
  /** Detected subtype */
  subtype: Subtype;
  /** File content */
  content: string;
  /** Additional files if it's a directory-based package */
  additionalFiles?: Array<{ path: string; content: string }>;
}

/**
 * Result of downloading and scanning a GitHub repo
 */
export interface GitHubDownloadResult {
  spec: GitHubSpec;
  commitSha: string;
  packages: DiscoveredPackage[];
  /** Raw tarball for integrity hashing */
  tarballBuffer: Buffer;
}

/**
 * Discovery patterns for finding AI tool configurations
 * Maps glob-like patterns to format/subtype
 */
const DISCOVERY_PATTERNS: Array<{
  pattern: RegExp;
  format: Format;
  subtype: Subtype;
  isDirectory?: boolean;
}> = [
  // Claude
  { pattern: /^\.claude\/skills\/.*\.md$/i, format: 'claude', subtype: 'skill', isDirectory: true },
  { pattern: /^\.claude\/commands\/.*\.md$/i, format: 'claude', subtype: 'slash-command' },
  { pattern: /^\.claude\/agents\/.*\.md$/i, format: 'claude', subtype: 'agent' },
  { pattern: /^CLAUDE\.md$/i, format: 'claude', subtype: 'rule' },

  // Cursor
  { pattern: /^\.cursor\/rules\/.*\.mdc$/i, format: 'cursor', subtype: 'rule' },
  { pattern: /^\.cursor\/rules\/.*\.md$/i, format: 'cursor', subtype: 'rule' },
  { pattern: /^\.cursorrules$/i, format: 'cursor', subtype: 'rule' },

  // Continue
  { pattern: /^\.continue\/rules\/.*\.md$/i, format: 'continue', subtype: 'rule' },

  // Windsurf
  { pattern: /^\.windsurf\/rules\/.*\.md$/i, format: 'windsurf', subtype: 'rule' },
  { pattern: /^\.windsurfrules$/i, format: 'windsurf', subtype: 'rule' },

  // Copilot
  { pattern: /^\.github\/copilot-instructions\.md$/i, format: 'copilot', subtype: 'rule' },
  { pattern: /^\.github\/instructions\/.*\.instructions\.md$/i, format: 'copilot', subtype: 'rule' },

  // Kiro
  { pattern: /^\.kiro\/steering\/.*\.md$/i, format: 'kiro', subtype: 'rule' },
  { pattern: /^\.kiro\/agents\/.*\.json$/i, format: 'kiro', subtype: 'agent' },

  // AGENTS.md / agents.md (universal)
  { pattern: /^AGENTS\.md$/i, format: 'agents.md', subtype: 'rule' },

  // Aider
  { pattern: /^\.aider\.conf\.yml$/i, format: 'aider', subtype: 'rule' },
  { pattern: /^CONVENTIONS\.md$/i, format: 'aider', subtype: 'rule' },

  // Codex
  { pattern: /^AGENTS\.md$/i, format: 'codex', subtype: 'rule' },
  { pattern: /^codex\.md$/i, format: 'codex', subtype: 'rule' },

  // OpenCode
  { pattern: /^\.opencode\/agents?\/.*$/i, format: 'opencode', subtype: 'agent' },

  // OpenSkills format (progressive disclosure)
  { pattern: /^\.openskills\/.*\/SKILL\.md$/i, format: 'claude', subtype: 'skill', isDirectory: true },
  { pattern: /^\.openagents\/.*\/AGENT\.md$/i, format: 'claude', subtype: 'agent', isDirectory: true },
  { pattern: /^\.opencommands\/.*\.md$/i, format: 'claude', subtype: 'slash-command' },
];

/**
 * Parse a GitHub spec from various input formats:
 * - owner/repo
 * - github:owner/repo
 * - gh:owner/repo
 * - https://github.com/owner/repo
 * - owner/repo@ref
 * - owner/repo:path/to/file
 * - owner/repo@ref:path/to/file
 */
export function parseGitHubSpec(input: string): GitHubSpec | null {
  let cleaned = input.trim();

  // Remove protocol prefixes
  if (cleaned.startsWith('github:')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('gh:')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('https://github.com/')) {
    cleaned = cleaned.slice(19);
  } else if (cleaned.startsWith('http://github.com/')) {
    cleaned = cleaned.slice(18);
  }

  // Remove trailing .git
  if (cleaned.endsWith('.git')) {
    cleaned = cleaned.slice(0, -4);
  }

  // Extract file path (after :)
  let filePath: string | undefined;
  const colonIndex = cleaned.indexOf(':');
  if (colonIndex > 0 && !cleaned.slice(colonIndex).startsWith('://')) {
    filePath = cleaned.slice(colonIndex + 1);
    cleaned = cleaned.slice(0, colonIndex);
  }

  // Extract ref (after @)
  let ref: string | undefined;
  const atIndex = cleaned.indexOf('@');
  if (atIndex > 0) {
    ref = cleaned.slice(atIndex + 1);
    cleaned = cleaned.slice(0, atIndex);
  }

  // Parse owner/repo
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  const owner = parts[0];
  const repo = parts[1];

  // Remaining parts are subdirectory
  const subdir = parts.length > 2 ? parts.slice(2).join('/') : undefined;

  return {
    owner,
    repo,
    ref,
    subdir,
    filePath,
  };
}

/**
 * Check if a string looks like a GitHub spec (explicit prefixes only)
 * Returns true for github: or gh: prefixes
 */
export function looksLikeGitHubSpec(input: string): boolean {
  // Only support explicit prefixes
  if (input.startsWith('github:') || input.startsWith('gh:')) {
    return true;
  }
  if (input.startsWith('https://github.com/') || input.startsWith('http://github.com/')) {
    return true;
  }
  return false;
}

/**
 * Get GitHub token from environment or config
 */
export function getGitHubToken(): string | undefined {
  // Check environment variables
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
}

/**
 * Resolve a ref (branch/tag) to a commit SHA
 */
export async function resolveGitHubRef(
  spec: GitHubSpec,
  token?: string
): Promise<string> {
  const { owner, repo, ref = 'HEAD' } = spec;

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'prpm-cli',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Try to resolve as a ref (branch or tag)
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${ref}`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Repository '${owner}/${repo}' not found or ref '${ref}' doesn't exist`);
    }
    if (response.status === 403) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        throw new Error('GitHub API rate limit exceeded. Set GITHUB_TOKEN for higher limits.');
      }
      throw new Error('Access denied. For private repos, set GITHUB_TOKEN.');
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { sha: string };
  return data.sha;
}

/**
 * Download repository tarball from GitHub
 */
export async function downloadGitHubTarball(
  spec: GitHubSpec,
  token?: string
): Promise<Buffer> {
  const { owner, repo, ref = 'HEAD' } = spec;

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'prpm-cli',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Use the tarball API endpoint
  const url = `https://api.github.com/repos/${owner}/${repo}/tarball/${ref}`;

  const response = await fetch(url, {
    headers,
    redirect: 'follow',
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Repository '${owner}/${repo}' not found`);
    }
    if (response.status === 403) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        throw new Error('GitHub API rate limit exceeded. Set GITHUB_TOKEN for higher limits.');
      }
      throw new Error('Access denied. For private repos, set GITHUB_TOKEN.');
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Extract tarball to a temporary directory
 */
async function extractTarball(tarballBuffer: Buffer, destDir: string): Promise<void> {
  // GitHub tarballs are gzipped
  const decompressed = await gunzip(tarballBuffer);

  await mkdir(destDir, { recursive: true });

  // Write decompressed tar to temp file and extract
  const tmpTarPath = join(destDir, 'temp.tar');
  const { writeFile: writeFileFs } = await import('fs/promises');
  await writeFileFs(tmpTarPath, decompressed);

  await tar.extract({
    cwd: destDir,
    file: tmpTarPath,
  });

  // Clean up temp tar
  await rm(tmpTarPath, { force: true });
}

/**
 * Recursively list all files in a directory
 */
async function listFilesRecursive(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      // Skip hidden dirs except the ones we care about
      if (entry.name.startsWith('.') &&
          !entry.name.startsWith('.claude') &&
          !entry.name.startsWith('.cursor') &&
          !entry.name.startsWith('.continue') &&
          !entry.name.startsWith('.windsurf') &&
          !entry.name.startsWith('.github') &&
          !entry.name.startsWith('.kiro') &&
          !entry.name.startsWith('.opencode') &&
          !entry.name.startsWith('.openskills') &&
          !entry.name.startsWith('.openagents') &&
          !entry.name.startsWith('.opencommands') &&
          !entry.name.startsWith('.aider')) {
        continue;
      }
      files.push(...await listFilesRecursive(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Derive a package name from the repo and file path
 */
function derivePackageName(spec: GitHubSpec, filePath: string): string {
  const repoSlug = `${spec.owner}-${spec.repo}`;

  // Get meaningful part of the file path
  const fileName = basename(filePath, extname(filePath));
  const parentDir = basename(dirname(filePath));

  // For files like SKILL.md in a named directory, use the directory name
  if (fileName.toLowerCase() === 'skill' || fileName.toLowerCase() === 'agent') {
    return `${repoSlug}-${parentDir}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  // For other files, use the file name
  return `${repoSlug}-${fileName}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

/**
 * Scan extracted files for AI tool packages
 */
async function discoverPackages(
  extractedDir: string,
  spec: GitHubSpec
): Promise<DiscoveredPackage[]> {
  const packages: DiscoveredPackage[] = [];

  // GitHub tarballs extract to a directory named owner-repo-commitsha
  // Find that directory
  const entries = await readdir(extractedDir);
  const repoDir = entries.find(e => e.startsWith(`${spec.owner}-${spec.repo}-`));

  if (!repoDir) {
    throw new Error('Could not find extracted repository directory');
  }

  const rootDir = join(extractedDir, repoDir, spec.subdir || '');

  // List all files
  const files = await listFilesRecursive(rootDir);

  // If a specific file path was requested, only look at that
  if (spec.filePath) {
    const matchedPattern = DISCOVERY_PATTERNS.find(p => p.pattern.test(spec.filePath!));
    if (matchedPattern) {
      try {
        const content = await readFile(join(rootDir, spec.filePath), 'utf-8');
        packages.push({
          name: derivePackageName(spec, spec.filePath),
          sourcePath: spec.filePath,
          format: matchedPattern.format,
          subtype: matchedPattern.subtype,
          content,
        });
      } catch {
        throw new Error(`File not found in repository: ${spec.filePath}`);
      }
    }
    return packages;
  }

  // Track directories we've already processed as packages
  const processedDirs = new Set<string>();

  // Match files against discovery patterns
  for (const file of files) {
    // Normalize path separators
    const normalizedPath = file.replace(/\\/g, '/');

    for (const pattern of DISCOVERY_PATTERNS) {
      if (pattern.pattern.test(normalizedPath)) {
        const filePath = join(rootDir, file);

        // For directory-based packages (like skills), group files by parent directory
        if (pattern.isDirectory) {
          const parentDir = dirname(file);
          if (processedDirs.has(parentDir)) {
            continue; // Already processed this directory
          }
          processedDirs.add(parentDir);

          // Read all files in the directory
          const dirPath = join(rootDir, parentDir);
          const dirFiles = await readdir(dirPath);
          const additionalFiles: Array<{ path: string; content: string }> = [];
          let mainContent = '';

          for (const df of dirFiles) {
            const dfPath = join(dirPath, df);
            const dfStat = await stat(dfPath);
            if (dfStat.isFile()) {
              const content = await readFile(dfPath, 'utf-8');
              if (df.toLowerCase() === 'skill.md' || df.toLowerCase() === 'agent.md' || df === basename(file)) {
                mainContent = content;
              } else {
                additionalFiles.push({ path: df, content });
              }
            }
          }

          packages.push({
            name: derivePackageName(spec, file),
            sourcePath: parentDir,
            format: pattern.format,
            subtype: pattern.subtype,
            content: mainContent,
            additionalFiles: additionalFiles.length > 0 ? additionalFiles : undefined,
          });
        } else {
          // Single file package
          try {
            const content = await readFile(filePath, 'utf-8');
            packages.push({
              name: derivePackageName(spec, file),
              sourcePath: file,
              format: pattern.format,
              subtype: pattern.subtype,
              content,
            });
          } catch {
            // Skip files we can't read
          }
        }
        break; // Only match first pattern
      }
    }
  }

  return packages;
}

/**
 * Download and scan a GitHub repository for packages
 */
export async function downloadGitHubRepo(
  spec: GitHubSpec,
  token?: string
): Promise<GitHubDownloadResult> {
  const effectiveToken = token || getGitHubToken();

  // Resolve ref to commit SHA for reproducibility
  const commitSha = await resolveGitHubRef(spec, effectiveToken);

  // Download tarball
  const specWithSha = { ...spec, ref: commitSha };
  const tarballBuffer = await downloadGitHubTarball(specWithSha, effectiveToken);

  // Create temp directory
  const tmpDir = join(tmpdir(), `prpm-github-${randomBytes(8).toString('hex')}`);

  try {
    // Extract tarball
    await extractTarball(tarballBuffer, tmpDir);

    // Discover packages
    const packages = await discoverPackages(tmpDir, spec);

    return {
      spec,
      commitSha,
      packages,
      tarballBuffer,
    };
  } finally {
    // Clean up temp directory
    try {
      await rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Compute integrity hash for a tarball
 */
export function computeIntegrity(buffer: Buffer): string {
  const hash = createHash('sha256').update(buffer).digest('base64');
  return `sha256-${hash}`;
}

/**
 * Format a GitHub spec as a string for lockfile/display
 */
export function formatGitHubSource(spec: GitHubSpec, commitSha?: string): string {
  let result = `github:${spec.owner}/${spec.repo}`;
  if (spec.ref) {
    result += `@${spec.ref}`;
  }
  if (commitSha && commitSha !== spec.ref) {
    result += `#${commitSha.slice(0, 7)}`;
  }
  if (spec.filePath) {
    result += `:${spec.filePath}`;
  }
  return result;
}
