/**
 * Package scanner for detecting existing AI editor packages on disk
 * Scans known directories and extracts metadata from files
 * Uses the format-registry.json as the single source of truth.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { Format, Subtype } from '../types';
import {
  getFormatRegistry,
  getScanDirectory,
  getFilePatterns,
  isNestedPackage,
  getNestedIndicator,
  type FormatRegistry,
} from '@pr-pm/converters';

/**
 * Detected package from filesystem scan
 */
export interface DetectedPackage {
  name: string;
  format: Format;
  subtype: Subtype;
  description: string;
  tags: string[];
  files: string[];
  /** Primary file path used for display */
  primaryFile: string;
}

/**
 * Scan configuration for a format/subtype combination
 */
interface ScanConfig {
  format: Format;
  subtype: Subtype;
  directory: string;
  /** File patterns to match (glob-like) */
  patterns: string[];
  /** Whether packages are in subdirectories (like .claude/skills/skill-name/) */
  nested: boolean;
  /** File to look for in nested directories */
  nestedIndicator?: string;
}

/**
 * Build scan configurations dynamically from format-registry.json
 */
function buildScanConfigs(): ScanConfig[] {
  const configs: ScanConfig[] = [];
  const registry = getFormatRegistry();

  // Formats that don't support file-based scanning (root file formats)
  const skipFormats = ['agents.md', 'gemini.md', 'claude.md', 'aider', 'replit'];

  for (const [formatName, formatConfig] of Object.entries(registry.formats)) {
    // Skip formats that use root files instead of directories
    if (skipFormats.includes(formatName)) continue;

    for (const [subtypeName, subtypeConfig] of Object.entries(formatConfig.subtypes)) {
      // Get scan directory (may differ from install directory)
      const directory = subtypeConfig.scanDirectory ?? subtypeConfig.directory;

      // Skip root directory entries
      if (directory === '.') continue;

      configs.push({
        format: formatName as Format,
        subtype: subtypeName as Subtype,
        directory,
        patterns: subtypeConfig.filePatterns,
        nested: subtypeConfig.nested ?? false,
        nestedIndicator: subtypeConfig.nestedIndicator,
      });
    }
  }

  return configs;
}

// Build configs once at module load
const SCAN_CONFIGS = buildScanConfigs();

/**
 * Extract metadata from file content (YAML frontmatter)
 */
async function extractMetadata(filePath: string): Promise<{
  name?: string;
  description?: string;
  tags?: string[];
}> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const metadata: { name?: string; description?: string; tags?: string[] } = {};

    // Try to extract YAML frontmatter (---\nkey: value\n---)
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];

      // Extract name
      const nameMatch = frontmatter.match(/name:\s*(.+)/i);
      if (nameMatch) {
        metadata.name = nameMatch[1].trim().replace(/^["']|["']$/g, '');
      }

      // Extract description
      const descMatch = frontmatter.match(/description:\s*(.+)/i);
      if (descMatch) {
        metadata.description = descMatch[1].trim().replace(/^["']|["']$/g, '');
      }

      // Extract tags
      const tagsMatch = frontmatter.match(/tags:\s*(.+)/i);
      if (tagsMatch) {
        const tagsStr = tagsMatch[1].trim();
        if (tagsStr.startsWith('[')) {
          metadata.tags = tagsStr
            .replace(/[\[\]]/g, '')
            .split(',')
            .map(t => t.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean);
        } else {
          metadata.tags = tagsStr
            .split(',')
            .map(t => t.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean);
        }
      }
    }

    // If no description from frontmatter, try first heading
    if (!metadata.description) {
      const headingMatch = content.match(/^#\s+(.+)/m);
      if (headingMatch) {
        metadata.description = headingMatch[1].trim();
      }
    }

    return metadata;
  } catch {
    return {};
  }
}

/**
 * Convert filename to kebab-case package name
 */
function filenameToPackageName(filename: string): string {
  // Remove extension
  const name = filename.replace(/\.[^/.]+$/, '');
  // Convert to kebab-case
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if a file matches any of the given patterns
 */
function matchesPattern(filename: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // Simple glob matching (*.md, *.mdc, etc.)
    if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1); // e.g., ".md"
      if (filename.endsWith(ext)) {
        return true;
      }
    } else if (pattern === filename) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a directory exists
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
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
 * Scan a directory for packages based on config
 */
async function scanDirectory(
  config: ScanConfig,
  cwd: string
): Promise<DetectedPackage[]> {
  const packages: DetectedPackage[] = [];
  const fullDir = path.join(cwd, config.directory);

  if (!(await directoryExists(fullDir))) {
    return packages;
  }

  const entries = await fs.readdir(fullDir, { withFileTypes: true });

  if (config.nested) {
    // For nested packages (like .claude/skills/skill-name/)
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const packageDir = path.join(fullDir, entry.name);

      // Look for the indicator file
      if (config.nestedIndicator) {
        const indicatorPath = path.join(packageDir, config.nestedIndicator);
        if (!(await fileExists(indicatorPath))) continue;

        // Collect all files in the package directory
        const packageFiles = await collectPackageFiles(packageDir, config.directory, entry.name);

        const metadata = await extractMetadata(indicatorPath);
        const relativePath = path.join(config.directory, entry.name, config.nestedIndicator);

        packages.push({
          name: metadata.name || filenameToPackageName(entry.name),
          format: config.format,
          subtype: config.subtype,
          description: metadata.description || `${config.format} ${config.subtype}`,
          tags: metadata.tags || [config.format],
          files: packageFiles.length > 0 ? packageFiles : [relativePath],
          primaryFile: relativePath,
        });
      } else {
        // Just scan for matching files in subdirectory
        const subEntries = await fs.readdir(packageDir, { withFileTypes: true });
        for (const subEntry of subEntries) {
          if (!subEntry.isFile()) continue;
          if (!matchesPattern(subEntry.name, config.patterns)) continue;

          const filePath = path.join(packageDir, subEntry.name);
          const relativePath = path.join(config.directory, entry.name, subEntry.name);
          const metadata = await extractMetadata(filePath);

          packages.push({
            name: metadata.name || filenameToPackageName(entry.name),
            format: config.format,
            subtype: config.subtype,
            description: metadata.description || `${config.format} ${config.subtype}`,
            tags: metadata.tags || [config.format],
            files: [relativePath],
            primaryFile: relativePath,
          });
        }
      }
    }
  } else {
    // For flat packages (like .cursor/rules/my-rule.mdc)
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!matchesPattern(entry.name, config.patterns)) continue;

      const filePath = path.join(fullDir, entry.name);
      const relativePath = path.join(config.directory, entry.name);
      const metadata = await extractMetadata(filePath);

      packages.push({
        name: metadata.name || filenameToPackageName(entry.name),
        format: config.format,
        subtype: config.subtype,
        description: metadata.description || `${config.format} ${config.subtype}`,
        tags: metadata.tags || [config.format],
        files: [relativePath],
        primaryFile: relativePath,
      });
    }
  }

  return packages;
}

/**
 * Collect all relevant files in a package directory
 */
async function collectPackageFiles(
  packageDir: string,
  baseDir: string,
  packageName: string
): Promise<string[]> {
  const files: string[] = [];

  async function walkDir(dir: string, relativeBase: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(relativeBase, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, dist, and other common build directories
        if (['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) {
          continue;
        }
        await walkDir(fullPath, relativePath);
      } else if (entry.isFile()) {
        // Include relevant files
        const ext = path.extname(entry.name).toLowerCase();
        if (['.md', '.json', '.js', '.ts', '.toml'].includes(ext)) {
          files.push(relativePath);
        }
      }
    }
  }

  await walkDir(packageDir, path.join(baseDir, packageName));
  return files;
}

/**
 * Build root manifest files list from format-registry.json
 * Deduplicates by file path - first format to list a file wins
 * (e.g., agents.md format takes precedence over amp for AGENTS.md)
 */
function buildRootManifestFiles(): Array<{ file: string; format: Format }> {
  const files: Array<{ file: string; format: Format }> = [];
  const seenFiles = new Set<string>();
  const registry = getFormatRegistry();

  for (const [formatName, formatConfig] of Object.entries(registry.formats)) {
    if (formatConfig.rootFiles) {
      for (const rootFile of formatConfig.rootFiles) {
        // Only add if we haven't seen this file before
        if (!seenFiles.has(rootFile)) {
          seenFiles.add(rootFile);
          files.push({ file: rootFile, format: formatName as Format });
        }
      }
    }
  }

  return files;
}

const ROOT_MANIFEST_FILES = buildRootManifestFiles();

/**
 * Scan for all packages in a directory
 *
 * @param cwd - Directory to scan (defaults to process.cwd())
 * @returns Array of detected packages
 */
export async function scanForPackages(cwd: string = process.cwd()): Promise<DetectedPackage[]> {
  const allPackages: DetectedPackage[] = [];

  // Scan all configured directories
  for (const config of SCAN_CONFIGS) {
    const packages = await scanDirectory(config, cwd);
    allPackages.push(...packages);
  }

  // Check for root-level manifest files
  for (const { file, format } of ROOT_MANIFEST_FILES) {
    const filePath = path.join(cwd, file);
    if (await fileExists(filePath)) {
      const metadata = await extractMetadata(filePath);
      allPackages.push({
        name: metadata.name || filenameToPackageName(file),
        format,
        subtype: 'rule',
        description: metadata.description || `${format} configuration`,
        tags: metadata.tags || [format],
        files: [file],
        primaryFile: file,
      });
    }
  }

  // Also check for copilot-instructions.md in .github root
  const copilotInstructionsPath = path.join(cwd, '.github/copilot-instructions.md');
  if (await fileExists(copilotInstructionsPath)) {
    const metadata = await extractMetadata(copilotInstructionsPath);
    allPackages.push({
      name: metadata.name || 'copilot-instructions',
      format: 'copilot',
      subtype: 'rule',
      description: metadata.description || 'GitHub Copilot instructions',
      tags: metadata.tags || ['copilot'],
      files: ['.github/copilot-instructions.md'],
      primaryFile: '.github/copilot-instructions.md',
    });
  }

  return allPackages;
}

/**
 * Get the scan configurations (useful for testing)
 */
export function getScanConfigs(): readonly ScanConfig[] {
  return SCAN_CONFIGS;
}
