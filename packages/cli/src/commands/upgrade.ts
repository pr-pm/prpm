/**
 * Upgrade command - Upgrade packages to latest versions (including major)
 */

import { Command } from "commander";
import { getRegistryClient } from "@pr-pm/registry-client";
import { getConfig } from "../core/user-config";
import {
  listPackages,
  parseLockfileKey,
  readLockfile,
  writeLockfile,
  addCollectionToLockfile,
  listCollectionsFromLockfile,
} from "../core/lockfile";
import { handleInstall } from "./install";
import { telemetry } from "../core/telemetry";
import { CLIError } from "../core/errors";

/**
 * Upgrade packages to latest versions (including major updates)
 */
export async function handleUpgrade(
  packageName?: string,
  options: { all?: boolean; force?: boolean } = {},
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let upgradedCount = 0;

  try {
    const config = await getConfig();
    const client = getRegistryClient(config);
    const installedPackages = await listPackages();

    if (installedPackages.length === 0) {
      console.log("No packages installed.");
      success = true;
      return;
    }

    // Determine which packages to upgrade
    let packagesToUpgrade = installedPackages;

    if (packageName) {
      // Upgrade specific package - match against both the full lockfile key and the base package ID
      packagesToUpgrade = installedPackages.filter((p) => {
        const { packageId } = parseLockfileKey(p.id);
        return p.id === packageName || packageId === packageName;
      });
      if (packagesToUpgrade.length === 0) {
        throw new Error(`Package ${packageName} is not installed`);
      }
    }

    console.log("🚀 Checking for upgrades...\n");

    for (const pkg of packagesToUpgrade) {
      // Parse the lockfile key to get the actual package ID (without #format suffix)
      // Also extract format from key as fallback for older lockfiles
      const { packageId, format: keyFormat } = parseLockfileKey(pkg.id);

      try {
        // Get package info from registry using the base package ID
        const registryPkg = await client.getPackage(packageId);

        if (!registryPkg.latest_version || !pkg.version) {
          continue;
        }

        const currentVersion = pkg.version;
        const latestVersion = registryPkg.latest_version.version;

        if (currentVersion === latestVersion) {
          console.log(
            `✅ ${packageId} is already at latest version (${currentVersion})`,
          );
          continue;
        }

        const updateType = getUpdateType(currentVersion, latestVersion);
        const emoji =
          updateType === "major" ? "🔴" : updateType === "minor" ? "🟡" : "🟢";

        console.log(
          `\n${emoji} Upgrading ${packageId}: ${currentVersion} → ${latestVersion} (${updateType})`,
        );

        if (updateType === "major" && !options.force) {
          console.log(
            `   ⚠️  This is a major version upgrade and may contain breaking changes`,
          );
        }

        // Install new version, preserving the installed format from the lockfile
        // Use pkg.format (entry data) with keyFormat (from key suffix) as fallback for older lockfiles
        // Always pass the format to ensure upgrades go to the same location, not auto-detect
        const installedFormat = pkg.format || keyFormat;
        await handleInstall(`${packageId}@${latestVersion}`, {
          as: installedFormat,
        });

        upgradedCount++;
      } catch (err) {
        console.error(
          `   ❌ Failed to upgrade ${packageId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Check for new packages in installed collections
    // Only do this when upgrading all packages (not a specific package)
    if (!packageName) {
      const lockfile = await readLockfile();
      if (lockfile) {
        const installedCollections = listCollectionsFromLockfile(lockfile);

        for (const collection of installedCollections) {
          try {
            // Get latest collection info from registry
            const latestCollection = await client.getCollection(
              collection.name_slug,
            );

            if (!latestCollection) continue;

            // Check if collection version has changed
            const currentVersion = collection.version;
            const latestVersion = latestCollection.version || "1.0.0";

            if (currentVersion !== latestVersion) {
              console.log(
                `\n📦 Collection ${collection.name_slug}: ${currentVersion} → ${latestVersion}`,
              );

              // Find packages in latest version that aren't in installed version
              const installedPackageIds = new Set(collection.packages);
              const newPackages = latestCollection.packages.filter(
                (pkg) => !installedPackageIds.has(pkg.package?.name || ""),
              );

              if (newPackages.length > 0) {
                console.log(
                  `   📥 ${newPackages.length} new package(s) added to collection`,
                );

                // Get format from an existing collection package to maintain consistency
                const existingCollectionPkg = installedPackages.find(
                  (p) =>
                    p.fromCollection?.name_slug === collection.name_slug,
                );
                const collectionFormat = existingCollectionPkg?.format;

                for (const pkg of newPackages) {
                  const pkgName = pkg.package?.name;
                  if (!pkgName) continue;

                  try {
                    console.log(`   📥 Installing new package: ${pkgName}`);
                    await handleInstall(`${pkgName}@${pkg.version || "latest"}`, {
                      as: collectionFormat,
                      fromCollection: {
                        name_slug: collection.name_slug,
                        version: latestVersion,
                      },
                    });
                    upgradedCount++;
                  } catch (err) {
                    console.error(
                      `   ❌ Failed to install ${pkgName}: ${err instanceof Error ? err.message : String(err)}`,
                    );
                  }
                }
              }

              // Update collection version in lockfile
              addCollectionToLockfile(lockfile, collection.name_slug, {
                name_slug: collection.name_slug,
                version: latestVersion,
                packages: [
                  ...collection.packages,
                  ...newPackages
                    .map((p) => p.package?.name)
                    .filter((n): n is string => !!n),
                ],
              });
              await writeLockfile(lockfile);
            }
          } catch (err) {
            console.error(
              `   ⚠️ Could not check collection ${collection.name_slug}: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }
      }
    }

    if (upgradedCount === 0) {
      console.log("\n✅ All packages are at the latest version!\n");
    } else {
      console.log(`\n✅ Upgraded ${upgradedCount} package(s)\n`);
    }

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    throw new CLIError(`\n❌ Upgrade failed: ${error}`, 1);
  } finally {
    await telemetry.track({
      command: "upgrade",
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageName,
        upgradedCount,
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
 * Create the upgrade command
 */
export function createUpgradeCommand(): Command {
  return new Command("upgrade")
    .description(
      "Upgrade packages to latest versions (including major updates)",
    )
    .argument("[package]", "Specific package to upgrade (optional)")
    .option("--all", "Upgrade all packages")
    .option("--force", "Skip warning for major version upgrades")
    .action(
      async (
        packageName?: string,
        options?: { all?: boolean; force?: boolean },
      ) => {
        await handleUpgrade(packageName, options);
      },
    );
}
