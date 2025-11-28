/**
 * Tarball creation utilities for publish command
 */

import { readFile, stat, mkdir, rm } from "fs/promises";
import { join } from "path";
import * as tar from "tar";
import { tmpdir } from "os";
import { randomBytes } from "crypto";
import type { PackageManifest, PackageFileMetadata } from "../types/registry";
import { normalizeFilePaths } from "./manifest-loader";

/**
 * Create tarball from current directory
 */
export async function createTarball(
  manifest: PackageManifest,
): Promise<Buffer> {
  const tmpDir = join(tmpdir(), `prpm-${randomBytes(8).toString("hex")}`);
  const tarballPath = join(tmpDir, "package.tar.gz");

  try {
    // Create temp directory
    await mkdir(tmpDir, { recursive: true });

    // Get files to include - normalize to string paths
    const filePaths = normalizeFilePaths(manifest.files);

    // Add standard files if not already included
    const standardFiles = ["prpm.json", "README.md", "LICENSE"];
    for (const file of standardFiles) {
      if (!filePaths.includes(file)) {
        filePaths.push(file);
      }
    }

    // Check which files exist
    const existingFiles: string[] = [];
    for (const file of filePaths) {
      try {
        await stat(file);
        existingFiles.push(file);
      } catch {
        // File doesn't exist, skip
      }
    }

    if (existingFiles.length === 0) {
      throw new Error("No package files found to include in tarball");
    }

    // Create tarball
    await tar.create(
      {
        gzip: true,
        file: tarballPath,
        cwd: process.cwd(),
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
