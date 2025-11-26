/**
 * Format Registry - Single source of truth for AI editor format configurations
 *
 * This module provides typed access to the format-registry.json data which defines:
 * - Directory structures for each format/subtype
 * - File patterns for scanning
 * - Nested package configurations
 * - File extensions
 */

import formatRegistryData from './format-registry.json' assert { type: 'json' };

/**
 * Configuration for a specific subtype within a format
 */
export interface SubtypeConfig {
  /** Directory path relative to project root where packages are stored */
  directory: string;
  /** Directory to scan if different from install directory (e.g., Claude hooks) */
  scanDirectory?: string;
  /** Glob patterns for matching package files */
  filePatterns: string[];
  /** Whether packages are in subdirectories */
  nested?: boolean;
  /** File that indicates a valid package in nested mode */
  nestedIndicator?: string;
  /** Default file extension for this format */
  fileExtension: string;
  /** Whether directory path includes package name */
  usesPackageSubdirectory?: boolean;
}

/**
 * Configuration for a format (e.g., cursor, claude, windsurf)
 */
export interface FormatConfig {
  /** Display name for the format */
  name: string;
  /** Brief description of the format */
  description: string;
  /** URL to official documentation */
  documentationUrl?: string;
  /** Root-level files that indicate this format */
  rootFiles?: string[];
  /** Default subtype to use when an unknown subtype is requested */
  defaultSubtype?: string;
  /** Map of subtype names to their configurations */
  subtypes: Record<string, SubtypeConfig>;
}

/**
 * The complete format registry structure
 */
export interface FormatRegistry {
  /** Schema reference */
  $schema?: string;
  /** Schema version */
  version: string;
  /** Map of format names to their configurations */
  formats: Record<string, FormatConfig>;
}

// Type assertion to ensure the JSON data matches our interface
const formatRegistry: FormatRegistry = formatRegistryData as FormatRegistry;

/**
 * Get the complete format registry
 */
export function getFormatRegistry(): FormatRegistry {
  return formatRegistry;
}

/**
 * Get all format names
 */
export function getFormatNames(): string[] {
  return Object.keys(formatRegistry.formats);
}

/**
 * Get configuration for a specific format
 */
export function getFormatConfig(format: string): FormatConfig | undefined {
  return formatRegistry.formats[format];
}

/**
 * Get subtype configuration for a format/subtype combination
 */
export function getSubtypeConfig(format: string, subtype: string): SubtypeConfig | undefined {
  const formatConfig = formatRegistry.formats[format];
  if (!formatConfig) return undefined;
  return formatConfig.subtypes[subtype];
}

/**
 * Get the directory where packages of this type should be installed
 * @param format - Format name (e.g., 'cursor', 'claude')
 * @param subtype - Subtype name (e.g., 'rule', 'skill', 'agent')
 * @param packageName - Optional package name for formats that use subdirectories
 */
export function getDestinationDirectory(
  format: string,
  subtype: string,
  packageName?: string
): string | undefined {
  const config = getSubtypeConfig(format, subtype);
  if (!config) return undefined;

  // If the format uses package subdirectories and a name is provided
  if (config.usesPackageSubdirectory && packageName) {
    return `${config.directory}/${packageName}`;
  }

  return config.directory;
}

/**
 * Get the directory to scan for packages (may differ from install directory)
 * @param format - Format name
 * @param subtype - Subtype name
 */
export function getScanDirectory(format: string, subtype: string): string | undefined {
  const config = getSubtypeConfig(format, subtype);
  if (!config) return undefined;

  // Use scanDirectory if specified, otherwise use directory
  return config.scanDirectory ?? config.directory;
}

/**
 * Get file patterns for scanning a format/subtype
 */
export function getFilePatterns(format: string, subtype: string): string[] | undefined {
  const config = getSubtypeConfig(format, subtype);
  return config?.filePatterns;
}

/**
 * Get the default file extension for a format/subtype
 */
export function getFileExtension(format: string, subtype: string): string | undefined {
  const config = getSubtypeConfig(format, subtype);
  return config?.fileExtension;
}

/**
 * Check if a format/subtype uses nested packages
 */
export function isNestedPackage(format: string, subtype: string): boolean {
  const config = getSubtypeConfig(format, subtype);
  return config?.nested ?? false;
}

/**
 * Get the nested indicator file for a format/subtype
 */
export function getNestedIndicator(format: string, subtype: string): string | undefined {
  const config = getSubtypeConfig(format, subtype);
  return config?.nestedIndicator;
}

/**
 * Get root files that indicate a format
 */
export function getRootFiles(format: string): string[] | undefined {
  const formatConfig = formatRegistry.formats[format];
  return formatConfig?.rootFiles;
}

/**
 * Get all subtypes for a format
 */
export function getSubtypes(format: string): string[] {
  const formatConfig = formatRegistry.formats[format];
  if (!formatConfig) return [];
  return Object.keys(formatConfig.subtypes);
}

/**
 * Get the default subtype for a format (used when an unknown subtype is requested)
 */
export function getDefaultSubtype(format: string): string | undefined {
  const formatConfig = formatRegistry.formats[format];
  if (!formatConfig) return undefined;
  // Return explicit default if set, otherwise the first subtype
  return formatConfig.defaultSubtype ?? Object.keys(formatConfig.subtypes)[0];
}

/**
 * Find format by root file
 */
export function findFormatByRootFile(filename: string): string | undefined {
  for (const [format, config] of Object.entries(formatRegistry.formats)) {
    if (config.rootFiles?.includes(filename)) {
      return format;
    }
  }
  return undefined;
}

export { formatRegistry };
