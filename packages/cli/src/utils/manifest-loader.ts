/**
 * Manifest loading and validation utilities for publish command
 */

import { readFile } from "fs/promises";
import { join } from "path";
import type {
  PackageManifest,
  PackageFileMetadata,
  MultiPackageManifest,
  Manifest,
} from "../types/registry";
import {
  marketplaceToManifest,
  validateMarketplaceJson,
  type MarketplaceJson,
} from "../core/marketplace-converter";
import { validateManifestSchema } from "../core/schema-validator";

function toOrganizationSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export interface CollectionManifest {
  id: string;
  name: string;
  description: string;
  version?: string;
  category?: string;
  tags?: string[];
  icon?: string;
  packages: Array<{
    packageId: string;
    version?: string;
    required?: boolean;
    reason?: string;
  }>;
}

export interface LoadedManifests {
  manifests: PackageManifest[];
  collections: CollectionManifest[];
  source: string;
}

/**
 * Try to find and load manifest files
 * Checks for:
 * 1. prpm.json (native format) - returns single manifest or array of packages and collections
 * 2. .claude/marketplace.json (Claude format) - returns all plugins as separate manifests
 * 3. .claude-plugin/marketplace.json (Claude format - alternative location) - returns all plugins
 */
export async function findAndLoadManifests(): Promise<LoadedManifests> {
  // Try prpm.json first (native format)
  const prpmJsonPath = join(process.cwd(), "prpm.json");
  let prpmJsonExists = false;

  try {
    const content = await readFile(prpmJsonPath, "utf-8");
    prpmJsonExists = true; // Mark file as found after successful read
    const manifest = JSON.parse(content) as Manifest;

    // Extract collections if present
    const collections: CollectionManifest[] = [];
    if (
      "collections" in manifest &&
      Array.isArray((manifest as any).collections)
    ) {
      const rawCollections = (manifest as any).collections;
      collections.push(...rawCollections);
    }

    // Check if this is a multi-package manifest
    if ("packages" in manifest && Array.isArray(manifest.packages)) {
      const multiManifest = manifest as MultiPackageManifest;

      // Validate each package in the array
      const validatedManifests = multiManifest.packages.map((pkg, idx) => {
        // Inherit top-level fields if not specified in package - using explicit undefined checks
        const packageWithDefaults: PackageManifest = {
          name: pkg.name,
          version: pkg.version,
          description: pkg.description,
          format: pkg.format,
          files: pkg.files,
          author: pkg.author ?? multiManifest.author,
          license: pkg.license ?? multiManifest.license,
          repository: pkg.repository ?? multiManifest.repository,
          homepage: pkg.homepage ?? multiManifest.homepage,
          documentation: pkg.documentation ?? multiManifest.documentation,
          organization: pkg.organization ?? multiManifest.organization,
          private: pkg.private ?? multiManifest.private,
          tags: pkg.tags ?? multiManifest.tags,
          keywords: pkg.keywords ?? multiManifest.keywords,
          subtype: pkg.subtype,
          dependencies: pkg.dependencies,
          peerDependencies: pkg.peerDependencies,
          engines: pkg.engines,
          main: pkg.main,
        };
        const label = pkg.name || `package #${idx + 1}`;
        return validateManifest(packageWithDefaults, label);
      });

      return {
        manifests: validatedManifests,
        collections,
        source: "prpm.json (multi-package)",
      };
    }

    // Collections-only manifest (no packages)
    if (collections.length > 0) {
      return {
        manifests: [],
        collections,
        source: "prpm.json (collections-only)",
      };
    }

    // Single package manifest
    const validated = validateManifest(
      manifest as PackageManifest,
      (manifest as PackageManifest).name,
    );
    return { manifests: [validated], collections, source: "prpm.json" };
  } catch (error) {
    // If it's a validation or parsing error, throw it immediately (don't try marketplace.json)
    if (
      prpmJsonExists &&
      error instanceof Error &&
      (error.message.includes("Invalid JSON") ||
        error.message.includes("Manifest validation failed") ||
        error.message.includes("Claude skill") ||
        error.message.includes("SKILL.md"))
    ) {
      throw error;
    }
    // Otherwise, prpm.json not found or other error, try marketplace.json
  }

  // Try .claude/marketplace.json (Claude format)
  const marketplaceJsonPath = join(
    process.cwd(),
    ".claude",
    "marketplace.json",
  );
  try {
    const content = await readFile(marketplaceJsonPath, "utf-8");
    const marketplaceData = JSON.parse(content) as MarketplaceJson;

    if (!validateMarketplaceJson(marketplaceData)) {
      throw new Error("Invalid marketplace.json format");
    }

    // Convert each plugin in marketplace.json to a separate PRPM manifest
    const manifests: PackageManifest[] = [];
    for (let i = 0; i < marketplaceData.plugins.length; i++) {
      const manifest = marketplaceToManifest(marketplaceData, i);
      const validated = validateManifest(manifest, manifest.name);
      manifests.push(validated);
    }

    return { manifests, collections: [], source: ".claude/marketplace.json" };
  } catch (error) {
    // marketplace.json not found or invalid at .claude path, try .claude-plugin
  }

  // Try .claude-plugin/marketplace.json (alternative Claude format)
  const marketplaceJsonPluginPath = join(
    process.cwd(),
    ".claude-plugin",
    "marketplace.json",
  );
  try {
    const content = await readFile(marketplaceJsonPluginPath, "utf-8");
    const marketplaceData = JSON.parse(content) as MarketplaceJson;

    if (!validateMarketplaceJson(marketplaceData)) {
      throw new Error("Invalid marketplace.json format");
    }

    // Convert each plugin in marketplace.json to a separate PRPM manifest
    const manifests: PackageManifest[] = [];
    for (let i = 0; i < marketplaceData.plugins.length; i++) {
      const manifest = marketplaceToManifest(marketplaceData, i);
      const validated = validateManifest(manifest, manifest.name);
      manifests.push(validated);
    }

    return {
      manifests,
      collections: [],
      source: ".claude-plugin/marketplace.json",
    };
  } catch (error) {
    // marketplace.json not found or invalid
  }

  // No manifest file found
  throw new Error(
    "No manifest file found. Expected either:\n" +
      "  - prpm.json in the current directory, or\n" +
      "  - .claude/marketplace.json (Claude format), or\n" +
      "  - .claude-plugin/marketplace.json (Claude format)",
  );
}

/**
 * Validate package manifest
 */
export function validateManifest(
  manifest: PackageManifest,
  contextLabel?: string,
): PackageManifest {
  const context = contextLabel || manifest.name || "manifest";
  const prefix = `[${context}] `;

  // Set default subtype to 'rule' if not provided
  if (!manifest.subtype) {
    manifest.subtype = "rule";
  }

  // First, validate against JSON schema
  const schemaValidation = validateManifestSchema(manifest);
  if (!schemaValidation.valid) {
    const errorMessages =
      schemaValidation.errors?.join("\n  - ") || "Unknown validation error";
    throw new Error(
      `${prefix}Manifest validation failed:\n  - ${errorMessages}`,
    );
  }

  // Additional custom validations (beyond what JSON schema can express)

  // Check if using enhanced format (file objects)
  const hasEnhancedFormat = manifest.files.some((f) => typeof f === "object");

  if (hasEnhancedFormat) {
    // Check if files have multiple distinct formats
    const fileFormats = new Set(
      (manifest.files as PackageFileMetadata[])
        .filter((f) => typeof f === "object")
        .map((f) => f.format),
    );

    // Only suggest "collection" if there are multiple distinct formats
    if (fileFormats.size > 1 && manifest.subtype !== "collection") {
      console.warn(
        `${prefix}⚠️  Package contains multiple file formats. Consider setting subtype to "collection" for clarity.`,
      );
    }
  }

  // Validate Claude skills - allow single .md file to be auto-renamed, but multiple files require SKILL.md
  if (manifest.format === "claude" && manifest.subtype === "skill") {
    const filePaths = normalizeFilePaths(manifest.files);
    const hasSkillMd = filePaths.some(
      (path) => path.endsWith("/SKILL.md") || path === "SKILL.md",
    );

    // Count .md files (excluding README.md specifically, not files containing "readme")
    const mdFiles = filePaths.filter((filePath) => {
      if (!filePath.endsWith(".md")) return false;
      const filename = filePath.split(/[\\/]/).pop()?.toLowerCase() || '';
      return filename !== "readme.md";
    });

    if (!hasSkillMd && mdFiles.length === 0) {
      throw new Error(
        `${prefix}Claude skills must contain a markdown file.\n` +
          "No .md file found in the files array.\n" +
          "Please add your skill file to the prpm.json files array.",
      );
    }

    if (!hasSkillMd && mdFiles.length === 1) {
      // Single .md file - will be auto-renamed during tarball creation
      console.log(
        `${prefix}⚠️  Skill file will be auto-renamed to SKILL.md during publish`,
      );
    }

    if (!hasSkillMd && mdFiles.length > 1) {
      // Multiple .md files - require SKILL.md to identify the main skill
      throw new Error(
        `${prefix}Claude skills with multiple .md files must use SKILL.md for the main skill file.\n` +
          `Found ${mdFiles.length} .md files but no SKILL.md.\n` +
          "Please rename your main skill file to SKILL.md so we know which file is the skill.",
      );
    }

    // Validate skill name length (max 64 characters)
    if (manifest.name.length > 64) {
      throw new Error(
        `${prefix}Claude skill name "${manifest.name}" exceeds 64 character limit (${manifest.name.length} characters).\n` +
          "According to Claude documentation, skill names must be max 64 characters.\n" +
          "Please shorten your package name.",
      );
    }

    // Validate skill name format (lowercase, numbers, hyphens only)
    if (!/^[a-z0-9-]+$/.test(manifest.name)) {
      throw new Error(
        `${prefix}Claude skill name "${manifest.name}" contains invalid characters.\n` +
          "According to Claude documentation, skill names must use lowercase letters, numbers, and hyphens only.\n" +
          "Please update your package name.",
      );
    }

    // Validate description length (max 1024 characters)
    if (manifest.description.length > 1024) {
      throw new Error(
        `${prefix}Claude skill description exceeds 1024 character limit (${manifest.description.length} characters).\n` +
          "According to Claude documentation, skill descriptions must be max 1024 characters.\n" +
          "Please shorten your description.",
      );
    }

    // Warn if description is approaching the limit (80% = 819 chars)
    if (manifest.description.length > 819) {
      console.warn(
        `${prefix}⚠️  Warning: Skill description is ${manifest.description.length}/1024 characters (${Math.round((manifest.description.length / 1024) * 100)}% of limit).\n` +
          "   Consider keeping it concise for better discoverability.",
      );
    }

    // Warn if description is too short (less than 100 chars)
    if (manifest.description.length < 100) {
      console.warn(
        `${prefix}⚠️  Warning: Skill description is only ${manifest.description.length} characters.\n` +
          "   Claude uses descriptions for skill discovery - consider adding more detail about:\n" +
          "   - What the skill does\n" +
          "   - When Claude should use it\n" +
          "   - What problems it solves",
      );
    }
  }

  return manifest;
}

/**
 * Normalize files array to string paths
 * Converts both simple and enhanced formats to string array
 */
export function normalizeFilePaths(
  files: string[] | PackageFileMetadata[],
): string[] {
  return files.map((file) => {
    if (typeof file === "string") {
      return file;
    } else {
      return file.path;
    }
  });
}

/**
 * Predict what the scoped package name will be after publishing
 * This matches the server-side logic in packages.ts
 */
export function predictScopedPackageName(
  manifestName: string,
  username: string,
  organization?: string,
): string {
  const usernameLowercase = username.toLowerCase();

  // If organization is specified, use @org-name/
  if (organization) {
    const orgSlug = toOrganizationSlug(organization);
    const expectedPrefix = `@${orgSlug}/`;
    if (!manifestName.startsWith(expectedPrefix)) {
      return `${expectedPrefix}${manifestName}`;
    }
    return manifestName;
  }

  // If package name doesn't already have a scope, add @username/
  if (!manifestName.startsWith("@")) {
    return `@${usernameLowercase}/${manifestName}`;
  }

  // Package already has a scope, return as-is
  return manifestName;
}

/**
 * Safely get package name for error messages, with fallbacks
 */
export function getSafePackageName(
  manifest: PackageManifest | undefined,
  userInfo: any,
  fallbackName?: string,
): string {
  if (!manifest?.name) {
    return fallbackName || "unknown-package";
  }

  try {
    if (userInfo?.username) {
      return predictScopedPackageName(
        manifest.name,
        userInfo.username,
        manifest.organization,
      );
    }
  } catch {
    // Fall through to return manifest name
  }

  return manifest.name;
}
