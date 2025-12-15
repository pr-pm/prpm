/**
 * Publish command implementation
 */

import { Command } from "commander";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getRegistryClient } from "@pr-pm/registry-client";
import { getConfig } from "../core/user-config";
import { telemetry } from "../core/telemetry";
import type { PackageManifest } from "../types/registry";
import { CLIError } from "../core/errors";
import {
  extractLicenseInfo,
  validateLicenseInfo,
} from "../utils/license-extractor";
import { extractSnippet, validateSnippet } from "../utils/snippet-extractor";
import { executePrepublishOnly } from "../utils/script-executor";
import { validatePackageFiles } from "../utils/format-file-validator";
import {
  findAndLoadManifests,
  predictScopedPackageName,
  getSafePackageName,
  type CollectionManifest,
} from "../utils/manifest-loader";
import { createTarball, formatTarballSize } from "../utils/tarball-creator";
import { smartInit } from "./init.js";

const toOrgSlug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

interface PublishOptions {
  access?: "public" | "private";
  tag?: string;
  dryRun?: boolean;
  package?: string; // Filter to specific package name in multi-package repos
  collection?: string; // Filter to specific collection name in multi-collection repos
  list?: boolean; // List packages in manifest without publishing
}

/**
 * List packages in manifest in a table format
 */
async function listPackages(): Promise<void> {
  const { manifests, collections, source } = await findAndLoadManifests();

  console.log(`\n📦 Packages in ${source}\n`);

  if (manifests.length === 0 && collections.length === 0) {
    console.log("   No packages or collections found.\n");
    return;
  }

  if (manifests.length > 0) {
    // Calculate column widths
    const nameWidth = Math.max(20, ...manifests.map((m) => m.name.length));
    const versionWidth = Math.max(8, ...manifests.map((m) => m.version.length));
    const formatWidth = Math.max(8, ...manifests.map((m) => m.format.length));
    const subtypeWidth = Math.max(
      8,
      ...manifests.map((m) => (m.subtype || "rule").length),
    );

    // Header
    console.log(
      `   ${"Name".padEnd(nameWidth)}  ${"Version".padEnd(versionWidth)}  ${"Format".padEnd(formatWidth)}  ${"Subtype".padEnd(subtypeWidth)}  Files`,
    );
    console.log(
      "   " +
        "─".repeat(nameWidth + versionWidth + formatWidth + subtypeWidth + 20),
    );

    // Rows
    for (const manifest of manifests) {
      const fileCount = manifest.files.length;
      const filesDisplay = fileCount === 1 ? "1 file" : `${fileCount} files`;
      console.log(
        `   ${manifest.name.padEnd(nameWidth)}  ${manifest.version.padEnd(versionWidth)}  ${manifest.format.padEnd(formatWidth)}  ${(manifest.subtype || "rule").padEnd(subtypeWidth)}  ${filesDisplay}`,
      );
    }

    console.log(`\n   Total: ${manifests.length} package(s)\n`);
  }

  if (collections.length > 0) {
    console.log("📚 Collections:\n");

    // Calculate column widths for collections
    const idWidth = Math.max(15, ...collections.map((c) => c.id.length));
    const nameWidth = Math.max(20, ...collections.map((c) => c.name.length));

    // Header
    console.log(
      `   ${"ID".padEnd(idWidth)}  ${"Name".padEnd(nameWidth)}  Packages`,
    );
    console.log("   " + "─".repeat(idWidth + nameWidth + 15));

    // Rows
    for (const collection of collections) {
      const pkgCount = collection.packages.length;
      const pkgsDisplay = pkgCount === 1 ? "1 package" : `${pkgCount} packages`;
      console.log(
        `   ${collection.id.padEnd(idWidth)}  ${collection.name.padEnd(nameWidth)}  ${pkgsDisplay}`,
      );
    }

    console.log(`\n   Total: ${collections.length} collection(s)\n`);
  }
}

export async function handlePublish(options: PublishOptions): Promise<void> {
  // Handle --list flag
  if (options.list) {
    await listPackages();
    return;
  }

  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let packageName: string | undefined;
  let version: string | undefined;

  try {
    const config = await getConfig();

    // Check if logged in (skip in CI mode)
    const isCIMode = process.env.CI_MODE === 'true';
    if (!config.token && !isCIMode) {
      throw new CLIError('❌ Not logged in. Run "prpm login" first.', 1);
    }

    if (isCIMode && !config.token) {
      console.log("🤖 CI Mode: Publishing without authentication\n");
    }

    console.log("📦 Publishing package...\n");

    // Check if any manifest file exists
    const prpmJsonPath = join(process.cwd(), "prpm.json");
    const marketplaceJsonPath = join(
      process.cwd(),
      ".claude",
      "marketplace.json",
    );
    const marketplaceJsonPluginPath = join(
      process.cwd(),
      ".claude-plugin",
      "marketplace.json",
    );

    const hasManifest =
      existsSync(prpmJsonPath) ||
      existsSync(marketplaceJsonPath) ||
      existsSync(marketplaceJsonPluginPath);

    // If no manifest exists, run init first
    if (!hasManifest) {
      console.log("No prpm.json found. Let's create one first.\n");
      await smartInit({});

      // Check if init created a manifest
      if (!existsSync(prpmJsonPath)) {
        throw new CLIError(
          "No prpm.json was created. Cannot publish without a manifest.",
          1,
        );
      }

      console.log("\n📦 Continuing with publish...\n");
    }

    // Read and validate manifests
    console.log("🔍 Validating package manifest(s)...");
    const { manifests, collections, source } = await findAndLoadManifests();

    // Execute prepublishOnly script if defined (for multi-package manifests)
    // This runs before any packages are published
    if (source === "prpm.json (multi-package)" || source === "prpm.json") {
      try {
        // Re-read the raw prpm.json to check for scripts
        const prpmJsonPath = join(process.cwd(), "prpm.json");
        const prpmContent = await readFile(prpmJsonPath, "utf-8");
        const prpmManifest = JSON.parse(prpmContent);

        if (prpmManifest.scripts) {
          await executePrepublishOnly(prpmManifest.scripts);
        }
      } catch (error) {
        // If script execution fails, abort publish
        if (error instanceof Error && error.message.includes("script")) {
          throw error;
        }
        // Ignore other errors (e.g., file not found - shouldn't happen at this point)
      }
    }

    if (manifests.length > 1 || collections.length > 0) {
      if (manifests.length > 0) {
        console.log(`   Found ${manifests.length} package(s) in ${source}`);
        if (options.package) {
          console.log(`   Filtering to package: ${options.package}`);
        }
      }
      if (collections.length > 0) {
        console.log(
          `   Found ${collections.length} collection(s) in ${source}`,
        );
        if (options.collection) {
          console.log(`   Filtering to collection: ${options.collection}`);
        }
      }
      console.log("   Will publish each separately\n");
    }

    // Filter to specific package if requested
    // Skip all packages if --collection flag is used (publish only collection)
    let filteredManifests = manifests;
    if (options.collection) {
      // When --collection is specified, skip all packages
      filteredManifests = [];
      console.log(`   Skipping packages (publishing collection only)\n`);
    } else if (options.package) {
      filteredManifests = manifests.filter((m) => m.name === options.package);
      if (filteredManifests.length === 0) {
        throw new Error(
          `Package "${options.package}" not found in manifest. Available packages: ${manifests.map((m) => m.name).join(", ")}`,
        );
      }
      console.log(`   ✓ Found package "${options.package}"\n`);
    }

    // Get user info to check for organizations (once for all packages)
    console.log("🔍 Checking authentication...");
    const client = getRegistryClient(config);
    let userInfo: any;

    try {
      userInfo = await client.whoami();
    } catch (err) {
      console.log(
        "   Could not fetch user organizations, publishing as personal packages",
      );
    }
    console.log("");

    // Check for duplicate package names (only in filtered set)
    if (filteredManifests.length > 1) {
      const nameMap = new Map<string, number>();
      const duplicates: string[] = [];

      filteredManifests.forEach((manifest, index) => {
        const existingIndex = nameMap.get(manifest.name);
        if (existingIndex !== undefined) {
          duplicates.push(
            `  - "${manifest.name}" appears in positions ${existingIndex + 1} and ${index + 1}`,
          );
        } else {
          nameMap.set(manifest.name, index);
        }
      });

      if (duplicates.length > 0) {
        console.error("❌ Duplicate package names detected:\n");
        duplicates.forEach((dup) => console.error(dup));
        console.error("\n⚠️  Each package must have a unique name.");
        console.error(
          "   Package names are globally unique per author/organization.",
        );
        console.error(
          "   If you want to publish the same package for different formats,",
        );
        console.error(
          '   use different names (e.g., "react-rules-cursor" vs "react-rules-claude").\n',
        );
        throw new Error("Cannot publish packages with duplicate names");
      }
    }

    // Track published packages and collections
    const publishedPackages: Array<{
      name: string;
      version: string;
      url: string;
      authorOverride?: string;
    }> = [];
    const failedPackages: Array<{ name: string; error: string }> = [];
    const publishedCollections: Array<{
      id: string;
      name: string;
      version: string;
    }> = [];
    const failedCollections: Array<{ id: string; error: string }> = [];

    // Batch configuration
    const BATCH_SIZE = parseInt(process.env.PRPM_BATCH_SIZE || "5");
    // Use 0ms delay in tests or dry run mode
    const BATCH_DELAY_MS =
      options.dryRun || process.env.NODE_ENV === "test"
        ? 0
        : parseInt(process.env.PRPM_BATCH_DELAY_MS || "2000");
    const MAX_RETRIES = parseInt(process.env.PRPM_MAX_RETRIES || "3");
    const RETRY_DELAY_MS =
      options.dryRun || process.env.NODE_ENV === "test"
        ? 0
        : parseInt(process.env.PRPM_RETRY_DELAY_MS || "5000");

    // Helper to delay between batches
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // Helper to check if error is retriable
    const isRetriableError = (error: string): boolean => {
      return (
        error.includes("Service Unavailable") ||
        error.includes("Bad Gateway") ||
        error.includes("at capacity") ||
        error.includes("502") ||
        error.includes("503") ||
        error.includes("ECONNRESET") ||
        error.includes("ETIMEDOUT")
      );
    };

    // Show batch info if publishing multiple packages (only if delays are enabled)
    if (filteredManifests.length > 1 && BATCH_DELAY_MS > 0) {
      console.log(
        `📦 Publishing ${filteredManifests.length} packages in batches of ${BATCH_SIZE}`,
      );
      console.log(
        `⏱️  ${BATCH_DELAY_MS}ms delay between batches, ${RETRY_DELAY_MS}ms retry delay`,
      );
      console.log("");
    }

    // Publish each manifest (filtered set) in batches
    for (let i = 0; i < filteredManifests.length; i++) {
      const manifest = filteredManifests[i];
      packageName = manifest.name;
      version = manifest.version;

      // Add batch delay between packages (but not before first package or in dry run/test mode)
      if (i > 0 && i % BATCH_SIZE === 0 && BATCH_DELAY_MS > 0) {
        console.log(
          `⏸️  Batch delay (${BATCH_DELAY_MS}ms) before next ${Math.min(BATCH_SIZE, filteredManifests.length - i)} packages...`,
        );
        await delay(BATCH_DELAY_MS);
      }

      if (filteredManifests.length > 1) {
        console.log(`\n${"=".repeat(60)}`);
        console.log(
          `📦 Publishing package ${i + 1} of ${filteredManifests.length}`,
        );
        console.log(`${"=".repeat(60)}\n`);
      }

      // Retry logic wrapper
      let lastError: Error | null = null;
      let retryCount = 0;
      let publishSuccess = false;

      while (retryCount <= MAX_RETRIES && !publishSuccess) {
        try {
          if (retryCount > 0 && RETRY_DELAY_MS > 0) {
            console.log(
              `   🔄 Retry ${retryCount}/${MAX_RETRIES} after ${RETRY_DELAY_MS}ms...`,
            );
            await delay(RETRY_DELAY_MS);
          } else if (retryCount > 0) {
            console.log(`   🔄 Retry ${retryCount}/${MAX_RETRIES}...`);
          }

          // Debug: Log access override logic only if DEBUG env var is set
          if (process.env.DEBUG) {
            console.log(`\n🔍 Before access override:`);
            console.log(`   - manifest.private: ${manifest.private}`);
            console.log(`   - options.access: ${options.access}`);
          }

          // Determine access level:
          // 1. If --access flag is provided, it overrides manifest setting
          // 2. Otherwise, use manifest setting (defaults to false/public if not specified)
          let isPrivate: boolean;
          if (options.access !== undefined) {
            // CLI flag explicitly provided - use it
            isPrivate = options.access === "private";
            if (process.env.DEBUG) {
              console.log(`   - Using CLI flag override: ${options.access}`);
            }
          } else {
            // No CLI flag - use manifest setting
            isPrivate = manifest.private || false;
            if (process.env.DEBUG) {
              console.log(`   - Using manifest setting: ${isPrivate}`);
            }
          }

          if (process.env.DEBUG) {
            console.log(`   - calculated isPrivate: ${isPrivate}`);
          }

          // Update manifest with final private setting
          manifest.private = isPrivate;

          if (process.env.DEBUG) {
            console.log(`   - final manifest.private: ${manifest.private}`);
            console.log("");
          }

          let selectedOrgId: string | undefined;
          let selectedOrgName: string | undefined;
          let selectedOrgSlug: string | undefined;

          // Check if organization is specified in manifest
          if (manifest.organization && userInfo) {
            const manifestOrgSlug = toOrgSlug(manifest.organization);
            const orgFromManifest = userInfo.organizations?.find(
              (org: any) =>
                org.id === manifest.organization ||
                org.name === manifest.organization ||
                (org.slug &&
                  typeof org.slug === "string" &&
                  org.slug.toLowerCase() === manifestOrgSlug) ||
                (org.name &&
                  toOrgSlug(typeof org.name === "string" ? org.name : "") ===
                    manifestOrgSlug),
            );

            if (!orgFromManifest) {
              throw new Error(
                `Organization "${manifest.organization}" not found or you are not a member`,
              );
            }

            // Check if user has publishing rights
            if (
              !["owner", "admin", "maintainer"].includes(orgFromManifest.role)
            ) {
              throw new Error(
                `You do not have permission to publish to organization "${orgFromManifest.name}". ` +
                  `Your role: ${orgFromManifest.role}. Required: owner, admin, or maintainer`,
              );
            }

            selectedOrgId = orgFromManifest.id;
            selectedOrgName = orgFromManifest.name;
            selectedOrgSlug =
              (typeof orgFromManifest.slug === "string"
                ? orgFromManifest.slug
                : undefined) ||
              (orgFromManifest.name
                ? toOrgSlug(String(orgFromManifest.name))
                : undefined);
          }

          // Check if admin should override author (check early so it shows in package info)
          let publishAsAuthor: string | undefined;
          if (userInfo?.is_admin && manifest.author) {
            // Author can be string or object { name, email }
            publishAsAuthor =
              typeof manifest.author === "string"
                ? manifest.author
                : manifest.author.name;
          }

          // Predict what the scoped package name will be
          const scopedPackageName = predictScopedPackageName(
            manifest.name,
            userInfo?.username || config.username || "unknown",
            selectedOrgSlug || manifest.organization,
          );

          console.log(`   Source: ${source}`);
          console.log(`   Package: ${scopedPackageName}@${manifest.version}`);
          console.log(
            `   Format: ${manifest.format} | Subtype: ${manifest.subtype}`,
          );
          console.log(`   Description: ${manifest.description}`);
          console.log(`   Access: ${manifest.private ? "private" : "public"}`);
          if (publishAsAuthor) {
            console.log(`   🔐 Author Override: ${publishAsAuthor} (admin)`);
          }
          if (selectedOrgId && userInfo) {
            const selectedOrg = userInfo.organizations.find(
              (org: any) => org.id === selectedOrgId,
            );
            console.log(
              `   Publishing to: ${selectedOrg?.name || "organization"}`,
            );
          }
          console.log("");

          // Validate package files against format schema
          console.log("🔍 Validating package files...");
          const fileValidation = await validatePackageFiles(manifest);

          if (fileValidation.errors.length > 0) {
            console.log("   ❌ Format validation errors:");
            fileValidation.errors.forEach((err) => {
              console.log(`      - ${err}`);
            });
            console.log("");
            throw new Error(
              "Package files do not match the specified format. Please fix the errors above.",
            );
          }

          if (fileValidation.warnings.length > 0) {
            console.log("   ⚠️  Format validation warnings:");
            fileValidation.warnings.forEach((warn) => {
              console.log(`      - ${warn}`);
            });
            console.log("");
          } else {
            console.log("   ✓ All files valid");
            console.log("");
          }

          // Extract license information
          console.log("📄 Extracting license information...");
          const licenseInfo = await extractLicenseInfo(manifest.repository);

          // Update manifest with license information from LICENSE file if found
          // Only set fields that aren't already manually specified in prpm.json
          if (licenseInfo.type && !manifest.license) {
            manifest.license = licenseInfo.type;
          }
          if (licenseInfo.text && !manifest.license_text) {
            manifest.license_text = licenseInfo.text;
          }
          if (licenseInfo.url && !manifest.license_url) {
            manifest.license_url = licenseInfo.url || undefined;
          }

          // Validate and warn about license (optional - will extract if present)
          validateLicenseInfo(licenseInfo, scopedPackageName);
          console.log("");

          // Extract content snippet
          console.log("📝 Extracting content snippet...");
          const snippet = await extractSnippet(manifest);
          if (snippet) {
            manifest.snippet = snippet;
          }
          validateSnippet(snippet, scopedPackageName);
          console.log("");

          // Create tarball
          console.log("📦 Creating package tarball...");
          const tarball = await createTarball(manifest);

          console.log(`   Size: ${formatTarballSize(tarball.length)}`);
          console.log("");

          if (selectedOrgId) {
            console.log(
              `   Publishing as organization: ${userInfo.organizations.find((org: any) => org.id === selectedOrgId)?.name}`,
            );
            console.log(`   Organization ID: ${selectedOrgId}`);
          }

          if (options.dryRun) {
            console.log("✅ Dry run successful! Package is ready to publish.");
            publishedPackages.push({
              name: scopedPackageName,
              version: manifest.version,
              url: "",
              authorOverride: publishAsAuthor,
            });
            publishSuccess = true;
            break;
          }

          // Publish to registry
          console.log("🚀 Publishing to registry...");

          // Build publish options
          const publishOptions: { orgId?: string; publishAsAuthor?: string } =
            {};
          if (selectedOrgId) {
            publishOptions.orgId = selectedOrgId;
          }
          if (publishAsAuthor) {
            publishOptions.publishAsAuthor = publishAsAuthor;
          }

          const result = await client.publish(
            manifest,
            tarball,
            Object.keys(publishOptions).length > 0 ? publishOptions : undefined,
          );

          // Determine the webapp URL based on registry URL
          let webappUrl: string;
          const registryUrl = config.registryUrl || "https://registry.prpm.dev";
          if (
            registryUrl.includes("localhost") ||
            registryUrl.includes("127.0.0.1")
          ) {
            // Local development - webapp is on port 5173
            webappUrl = "http://localhost:5173";
          } else if (registryUrl.includes("registry.prpm.dev")) {
            // Production - webapp is on prpm.dev
            webappUrl = "https://prpm.dev";
          } else {
            // Default to registry URL for unknown environments
            webappUrl = registryUrl;
          }

          // Use the name returned from the API (which includes auto-prefixed scope)
          const packageSlug = result.name.startsWith("@")
            ? result.name.slice(1)
            : result.name;
          const packagePath = packageSlug
            .split("/")
            .map((segment) => encodeURIComponent(segment))
            .join("/");
          const packageUrl = `${webappUrl}/packages/${packagePath}`;

          console.log("");
          console.log("✅ Package published successfully!");
          console.log("");
          console.log(`   Package: ${result.name}@${result.version}`);
          console.log(`   Install: prpm install ${result.name}`);
          console.log("");

          publishedPackages.push({
            name: result.name, // Use scoped name from server
            version: result.version,
            url: packageUrl,
            authorOverride: publishAsAuthor,
          });

          // Mark as successful to exit retry loop
          publishSuccess = true;
        } catch (err) {
          const pkgError = err instanceof Error ? err.message : String(err);
          lastError = err instanceof Error ? err : new Error(String(err));

          // Safely construct display name with fallbacks
          const displayName = getSafePackageName(
            manifest,
            userInfo,
            packageName,
          );

          // Check if error is retriable
          if (isRetriableError(pkgError) && retryCount < MAX_RETRIES) {
            console.error(
              `\n⚠️  Temporary error publishing ${displayName}: ${pkgError}`,
            );
            console.error(
              `   Will retry (${retryCount + 1}/${MAX_RETRIES})...\n`,
            );
            retryCount++;
          } else {
            // Non-retriable error or max retries exceeded
            if (retryCount >= MAX_RETRIES) {
              console.error(
                `\n❌ Failed to publish ${displayName} after ${MAX_RETRIES} retries: ${pkgError}\n`,
              );
            } else {
              console.error(
                `\n❌ Failed to publish ${displayName}: ${pkgError}\n`,
              );
            }
            failedPackages.push({
              name: displayName,
              error: pkgError,
            });
            break; // Exit retry loop
          }
        }
      } // End of retry while loop
    }

    // Publish collections if present
    // Only publish collections if:
    // 1. No --package flag (publish all collections), OR
    // 2. --collection flag explicitly specified (publish specific collection)
    // Note: --package flag skips collections, --collection flag skips packages
    const shouldPublishCollections = !options.package || options.collection;

    if (collections.length > 0 && shouldPublishCollections) {
      // Filter to specific collection if requested
      let filteredCollections = collections;
      if (options.collection) {
        filteredCollections = collections.filter(
          (c) => c.id === options.collection,
        );
        if (filteredCollections.length === 0) {
          throw new Error(
            `Collection "${options.collection}" not found in manifest. Available collections: ${collections.map((c) => c.id).join(", ")}`,
          );
        }
        console.log(`   ✓ Found collection "${options.collection}"\n`);
      }

      for (const collection of filteredCollections) {
        if (filteredCollections.length > 1) {
          console.log(`\n${"=".repeat(60)}`);
          console.log(`📚 Publishing collection`);
          console.log(`${"=".repeat(60)}\n`);
        }

        try {
          console.log(`📚 Publishing collection "${collection.name}"...`);
          console.log(`   ID: ${collection.id}`);
          console.log(`   Packages: ${collection.packages.length}`);
          console.log("");

          if (options.dryRun) {
            console.log(
              "✅ Dry run successful! Collection is ready to publish.",
            );
            publishedCollections.push({
              id: collection.id,
              name: collection.name,
              version: collection.version || "1.0.0",
            });
            continue;
          }

          // Import and call the collection publish logic
          const { handleCollectionPublish } = await import("./collections.js");

          // Create a temporary manifest object for the collection
          const collectionData = {
            id: collection.id,
            name: collection.name,
            description: collection.description,
            version: collection.version,
            category: collection.category,
            tags: collection.tags,
            icon: collection.icon,
            packages: collection.packages.map((pkg) => ({
              packageId: pkg.packageId,
              version: pkg.version,
              required: pkg.required !== false,
              reason: pkg.reason,
            })),
          };

          const result = await client.createCollection(collectionData);

          console.log(`✅ Collection published successfully!`);
          console.log(`   Name: ${result.name_slug}`);
          console.log(`   Version: ${result.version || "1.0.0"}`);
          console.log("");
          console.log(
            `💡 Install: prpm install collections/${result.name_slug}`,
          );
          console.log("");

          publishedCollections.push({
            id: collection.id,
            name: collection.name,
            version: result.version || "1.0.0",
          });
        } catch (err) {
          const collError = err instanceof Error ? err.message : String(err);
          console.error(
            `\n❌ Failed to publish collection ${collection.id}: ${collError}\n`,
          );
          failedCollections.push({
            id: collection.id,
            error: collError,
          });
        }
      }

      // Add collection results to summary
      if (publishedCollections.length > 0) {
        console.log(
          `✅ Successfully published ${publishedCollections.length} collection(s):`,
        );
        publishedCollections.forEach((coll) => {
          console.log(`   - ${coll.name} (${coll.id}) v${coll.version}`);
        });
        console.log("");
      }

      if (failedCollections.length > 0) {
        console.log(
          `❌ Failed to publish ${failedCollections.length} collection(s):`,
        );
        failedCollections.forEach((coll) => {
          console.log(`   - ${coll.id}: ${coll.error}`);
        });
        console.log("");
      }
    }

    // Print summary if multiple packages
    if (manifests.length > 1) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📊 Publishing Summary`);
      console.log(`${"=".repeat(60)}\n`);

      if (publishedPackages.length > 0) {
        // Check if any packages have author override
        const hasAuthorOverride = publishedPackages.some(
          (pkg) => pkg.authorOverride,
        );
        if (hasAuthorOverride) {
          console.log(`🔐 Admin author override active\n`);
        }

        console.log(
          `✅ Successfully published ${publishedPackages.length} package(s):`,
        );
        publishedPackages.forEach((pkg) => {
          const overrideSuffix = pkg.authorOverride
            ? ` (as ${pkg.authorOverride})`
            : "";
          console.log(`   - ${pkg.name}@${pkg.version}${overrideSuffix}`);
          if (pkg.url) {
            console.log(`     ${pkg.url}`);
          }
        });
        console.log("");
      }

      if (failedPackages.length > 0) {
        console.log(
          `❌ Failed to publish ${failedPackages.length} package(s):`,
        );
        failedPackages.forEach((pkg) => {
          console.log(`   - ${pkg.name}: ${pkg.error}`);
        });
        console.log("");

        // Provide hints for common permission errors
        if (failedPackages.some((pkg) => pkg.error.includes("Forbidden"))) {
          console.log("💡 Forbidden errors usually mean:");
          console.log(
            "   - The package already exists and you don't have permission to update it",
          );
          console.log(
            "   - The package belongs to an organization and you're not a member with publish rights",
          );
          console.log(
            "   - Try: prpm whoami  (to check your organization memberships)",
          );
          console.log("");
        }
      }
    }

    // Success if we published any packages OR collections
    success = publishedPackages.length > 0 || publishedCollections.length > 0;

    if (
      failedPackages.length > 0 &&
      publishedPackages.length === 0 &&
      publishedCollections.length === 0
    ) {
      // Use the first failed package's error for telemetry
      const firstError = failedPackages[0]?.error || "Unknown error";
      throw new CLIError(firstError, 1);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    if (err instanceof CLIError) {
      throw err;
    }
    let errorMsg = `\n❌ Failed to publish package: ${error}\n`;

    // Provide helpful hints based on error type
    if (error.includes("Manifest validation failed")) {
      errorMsg += "\n💡 Common validation issues:\n";
      errorMsg +=
        "   - Missing required fields (name, version, description, format)\n";
      errorMsg += "   - Invalid format or subtype values\n";
      errorMsg +=
        "   - Description too short (min 10 chars) or too long (max 500 chars)\n";
      errorMsg += "   - Package name must be lowercase with hyphens only\n";
      errorMsg += "\n💡 For Claude skills specifically:\n";
      errorMsg += '   - Add "subtype": "skill" to your prpm.json\n';
      errorMsg += "   - Ensure files include a SKILL.md file\n";
      errorMsg += "   - Package name must be max 64 characters\n";
      errorMsg += "\n💡 View the schema: prpm schema\n";
    } else if (error.includes("SKILL.md")) {
      errorMsg += "\n💡 Claude skills require:\n";
      errorMsg += "   - A file named SKILL.md (all caps) in your package\n";
      errorMsg +=
        '   - "format": "claude" and "subtype": "skill" in prpm.json\n';
    } else if (error.includes("No manifest file found")) {
      errorMsg += "\n💡 Create a manifest file:\n";
      errorMsg += "   - Run: prpm init\n";
      errorMsg += "   - Or create prpm.json manually\n";
    }

    throw new CLIError(errorMsg, 1);
  } finally {
    // Track telemetry
    await telemetry.track({
      command: "publish",
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageName,
        version,
        dryRun: options.dryRun,
      },
    });
    await telemetry.shutdown();
  }
}

/**
 * Create the publish command
 */
export function createPublishCommand(): Command {
  return new Command("publish")
    .description("Publish packages and collections to the registry")
    .option(
      "--access <type>",
      "Package access (public or private) - overrides manifest setting",
    )
    .option("--tag <tag>", "NPM-style tag (e.g., latest, beta)", "latest")
    .option("--dry-run", "Validate package without publishing")
    .option(
      "--package <name>",
      "Publish only a specific package from multi-package manifest",
    )
    .option(
      "--collection <id>",
      "Publish only a specific collection from manifest",
    )
    .option("-l, --list", "List all packages in prpm.json without publishing")
    .action(async (options: PublishOptions) => {
      await handlePublish(options);
    });
}
