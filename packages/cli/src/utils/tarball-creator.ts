/**
 * Tarball creation utilities for publish command
 */

import { readFile, stat, mkdir, rm, copyFile, writeFile } from "fs/promises";
import { join, dirname, basename } from "path";
import * as tar from "tar";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import type { PackageManifest, PackageFileMetadata } from "../types/registry";
import { normalizeFilePaths } from "./manifest-loader";

/**
 * Configuration for auto-relocating files to canonical locations
 * Maps format -> subtype -> { directory, extension, checkPath }
 */
interface RelocationConfig {
  directory: string;
  extension?: string; // If set, changes file extension
  checkPath: string; // Path fragment to check if already in correct location
}

const RELOCATION_CONFIG: Record<string, Record<string, RelocationConfig>> = {
  claude: {
    "slash-command": {
      directory: ".claude/commands",
      checkPath: ".claude/commands/",
    },
    agent: {
      directory: ".claude/agents",
      checkPath: ".claude/agents/",
    },
  },
  cursor: {
    rule: {
      directory: ".cursor/rules",
      extension: ".mdc",
      checkPath: ".cursor/rules/",
    },
    agent: {
      directory: ".cursor/agents",
      checkPath: ".cursor/agents/",
    },
    "slash-command": {
      directory: ".cursor/commands",
      checkPath: ".cursor/commands/",
    },
  },
  continue: {
    rule: {
      directory: ".continue/rules",
      checkPath: ".continue/rules/",
    },
    prompt: {
      directory: ".continue/prompts",
      checkPath: ".continue/prompts/",
    },
  },
  windsurf: {
    rule: {
      directory: ".windsurf/rules",
      checkPath: ".windsurf/rules/",
    },
  },
  copilot: {
    rule: {
      directory: ".github/instructions",
      extension: ".instructions.md",
      checkPath: ".github/instructions/",
    },
    chatmode: {
      directory: ".github/chatmodes",
      extension: ".chatmode.md",
      checkPath: ".github/chatmodes/",
    },
  },
  kiro: {
    rule: {
      directory: ".kiro/steering",
      checkPath: ".kiro/steering/",
    },
    agent: {
      directory: ".kiro/agents",
      checkPath: ".kiro/agents/",
    },
  },
  opencode: {
    agent: {
      directory: ".opencode/agent",
      checkPath: ".opencode/agent/",
    },
    "slash-command": {
      directory: ".opencode/command",
      checkPath: ".opencode/command/",
    },
    tool: {
      directory: ".opencode/tool",
      checkPath: ".opencode/tool/",
    },
  },
  factory: {
    "slash-command": {
      directory: ".factory/commands",
      checkPath: ".factory/commands/",
    },
  },
};

/**
 * Create tarball from current directory
 */
export async function createTarball(
  manifest: PackageManifest,
): Promise<Buffer> {
  const tmpDir = join(tmpdir(), `prpm-${randomBytes(8).toString("hex")}`);
  const tarballPath = join(tmpDir, "package.tar.gz");
  const stagingDir = join(tmpDir, "staging");

  try {
    // Create temp directories
    await mkdir(tmpDir, { recursive: true });
    await mkdir(stagingDir, { recursive: true });

    // Get files to include - normalize to string paths
    const filePaths = normalizeFilePaths(manifest.files);

    // Add standard files if not already included
    const standardFiles = ["prpm.json", "README.md", "LICENSE"];
    for (const file of standardFiles) {
      if (!filePaths.includes(file)) {
        filePaths.push(file);
      }
    }

    // Check which files exist and handle file renaming/relocation
    const existingFiles: string[] = [];
    const fileRenames: Map<string, string> = new Map();

    // Special case: Claude skills with a single .md file (not SKILL.md), auto-rename to SKILL.md
    if (manifest.format === "claude" && manifest.subtype === "skill") {
      const hasSkillMd = filePaths.some(
        (path) => path.endsWith("/SKILL.md") || path === "SKILL.md",
      );

      if (!hasSkillMd) {
        // Count .md files (excluding README)
        const mdFiles = filePaths.filter(
          (path) => path.endsWith(".md") && !path.toLowerCase().includes("readme"),
        );

        // Only auto-rename if there's exactly one .md file
        if (mdFiles.length === 1) {
          const file = mdFiles[0];
          try {
            await stat(file);
            // Determine the new path - replace the filename with SKILL.md
            const dir = dirname(file);
            const newPath = dir === "." ? "SKILL.md" : join(dir, "SKILL.md");
            fileRenames.set(file, newPath);
            console.log(`   📝 Renaming ${file} → ${newPath}`);
          } catch {
            // File doesn't exist, skip
          }
        }
        // Note: Multiple .md files without SKILL.md should have been caught by manifest validation
      }
    }

    // Generic auto-relocation for all formats based on RELOCATION_CONFIG
    const formatConfig = RELOCATION_CONFIG[manifest.format];
    const subtypeConfig = formatConfig?.[manifest.subtype || "rule"];

    if (subtypeConfig) {
      // Get content files (excluding README, LICENSE, prpm.json)
      const contentFiles = filePaths.filter(
        (path) =>
          !path.toLowerCase().includes("readme") &&
          !path.toLowerCase().includes("license") &&
          path !== "prpm.json" &&
          (path.endsWith(".md") || path.endsWith(".mdc") || path.endsWith(".json")),
      );

      for (const file of contentFiles) {
        // Skip files already in the correct location
        if (file.includes(subtypeConfig.checkPath)) {
          continue;
        }

        try {
          await stat(file);

          // Determine the new filename
          let fileName = basename(file);

          // Handle extension changes (e.g., .md → .mdc for Cursor rules)
          if (subtypeConfig.extension) {
            const nameWithoutExt = fileName.replace(/\.[^.]+$/, "");
            fileName = nameWithoutExt + subtypeConfig.extension;
          }

          const newPath = join(subtypeConfig.directory, fileName);
          fileRenames.set(file, newPath);
          console.log(`   📝 Relocating ${file} → ${newPath}`);
        } catch {
          // File doesn't exist, skip
        }
      }
    }

    // Copy files to staging directory, applying renames
    for (const file of filePaths) {
      try {
        await stat(file);
        const targetPath = fileRenames.get(file) || file;
        const stagingPath = join(stagingDir, targetPath);

        // Ensure target directory exists
        await mkdir(dirname(stagingPath), { recursive: true });

        // Copy file to staging
        await copyFile(file, stagingPath);
        existingFiles.push(targetPath);
      } catch {
        // File doesn't exist, skip
      }
    }

    if (existingFiles.length === 0) {
      throw new Error("No package files found to include in tarball");
    }

    // Create tarball from staging directory
    await tar.create(
      {
        gzip: true,
        file: tarballPath,
        cwd: stagingDir,
      },
      existingFiles,
    );

    // Read tarball into buffer
    const tarballBuffer = await readFile(tarballPath);

    // Check size (max 10MB)
    const sizeMB = tarballBuffer.length / (1024 * 1024);
    if (sizeMB > 10) {
      throw new Error(
        `Package size (${sizeMB.toFixed(2)}MB) exceeds 10MB limit`,
      );
    }

    return tarballBuffer;
  } catch (error) {
    throw error;
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
 * Format tarball size for display
 */
export function formatTarballSize(sizeInBytes: number): string {
  const sizeInKB = sizeInBytes / 1024;
  const sizeInMB = sizeInBytes / (1024 * 1024);

  if (sizeInMB >= 1) {
    return `${sizeInMB.toFixed(2)}MB`;
  } else {
    return `${sizeInKB.toFixed(2)}KB`;
  }
}
