/**
 * Update command - Update packages to latest compatible versions
 */

import { Command } from "commander";
import { getRegistryClient } from "@pr-pm/registry-client";
import { getConfig } from "../core/user-config";
import { listPackages, parseLockfileKey } from "../core/lockfile";
import { handleInstall } from "./install";
import { telemetry } from "../core/telemetry";
import { CLIError } from "../core/errors";
import type { MCPEditor } from "../core/mcp";

type InstalledPackage = Awaited<ReturnType<typeof listPackages>>[number];

function getPreservedGlobal(pkg: InstalledPackage, location?: string): boolean | undefined {
  return pkg.global ?? pkg.pluginMetadata?.mcpGlobal ?? (location === "global" ? true : undefined);
}

function getPreservedEditor(pkg: InstalledPackage): MCPEditor | undefined {
  return pkg.pluginMetadata?.mcpEditor as MCPEditor | undefined;
}

/**
 * Update packages to latest minor/patch versions
 */
export async function handleUpdate(
  packageName?: string,
  options: { all?: boolean } = {},
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let updatedCount = 0;

  try {
    const config = await getConfig();
    const client = getRegistryClient(config);
    const installedPackages = await listPackages();

    if (installedPackages.length === 0) {
      console.log("No packages installed.");
      success = true;
      return;
    }

    // Determine which packages to update
    let packagesToUpdate = installedPackages;

    if (packageName) {
      // Update specific package - match against both the full lockfile key and the base package ID
      packagesToUpdate = installedPackages.filter((p) => {
        const { packageId } = parseLockfileKey(p.id);
        return p.id === packageName || packageId === packageName;
      });
      if (packagesToUpdate.length === 0) {
        throw new Error(`Package ${packageName} is not installed`);
      }
    }

    console.log("🔄 Checking for updates...\n");

    for (const pkg of packagesToUpdate) {
      // Parse the lockfile key to get the actual package ID (without #format suffix)
      const { packageId, format: installedFormat, location } = parseLockfileKey(pkg.id);

      try {
        // Get package info from registry using the base package ID
        const registryPkg = await client.getPackage(packageId);

        if (!registryPkg.latest_version || !pkg.version) {
          continue;
        }

        const currentVersion = pkg.version;
        const latestVersion = registryPkg.latest_version.version;

        // Only update if it's a minor or patch update (not major)
        const updateType = getUpdateType(currentVersion, latestVersion);

        if (updateType === "major") {
          console.log(
            `⏭️  Skipping ${packageId} (major update ${currentVersion} → ${latestVersion}, use upgrade)`,
          );
          continue;
        }

        if (currentVersion === latestVersion) {
          console.log(
            `✅ ${packageId} is already up to date (${currentVersion})`,
          );
          continue;
        }

        console.log(
          `\n📦 Updating ${packageId}: ${currentVersion} → ${latestVersion}`,
        );

        // Always pass the installed format to prevent auto-detection
        // Use pkg.format (entry data) with installedFormat (from key suffix) as fallback
        const targetFormat = pkg.format || installedFormat;
        const installOptions: Parameters<typeof handleInstall>[1] = { as: targetFormat };
        const preservedGlobal = getPreservedGlobal(pkg, location);
        const preservedEditor = getPreservedEditor(pkg);

        if (preservedGlobal !== undefined) {
          installOptions.global = preservedGlobal;
        }
        if (preservedEditor) {
          installOptions.editor = preservedEditor;
        }

        await handleInstall(`${packageId}@${latestVersion}`, installOptions);

        updatedCount++;
      } catch (err) {
        console.error(
          `   ❌ Failed to update ${packageId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (updatedCount === 0) {
      console.log("\n✅ All packages are up to date!\n");
    } else {
      console.log(`\n✅ Updated ${updatedCount} package(s)\n`);
    }

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    throw new CLIError(`\n❌ Update failed: ${error}`, 1);
  } finally {
    await telemetry.track({
      command: "update",
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageName,
        updatedCount,
      },
    });
    await telemetry.shutdown();
  }
}

/**
 * Determine update type based on semver
 */
function getUpdateType(
  current: string,
  latest: string,
): "major" | "minor" | "patch" {
  const currentParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);

  const [currMajor = 0, currMinor = 0, currPatch = 0] = currentParts;
  const [latestMajor = 0, latestMinor = 0, latestPatch = 0] = latestParts;

  if (latestMajor > currMajor) return "major";
  if (latestMinor > currMinor) return "minor";
  return "patch";
}

/**
 * Create the update command
 */
export function createUpdateCommand(): Command {
  return new Command("update")
    .description(
      "Update packages to latest compatible versions (minor/patch only)",
    )
    .argument("[package]", "Specific package to update (optional)")
    .option("--all", "Update all packages")
    .action(async (packageName?: string, options?: { all?: boolean }) => {
      await handleUpdate(packageName, options);
    });
}
