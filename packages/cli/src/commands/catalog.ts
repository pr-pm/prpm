/**
 * Catalog command - DEPRECATED
 *
 * This command has been merged into `prpm init --scan`.
 * It now shows a deprecation warning and delegates to the init command.
 */

import { Command } from "commander";
import { execSync } from "child_process";

/**
 * Create the catalog command (deprecated - delegates to init --scan)
 */
export function createCatalogCommand(): Command {
  return new Command("catalog")
    .description(
      "[DEPRECATED] Use 'prpm init --scan' instead. Discover and catalog packages.",
    )
    .argument("[directories...]", "Directories to scan for packages")
    .option("-o, --output <path>", "Output path for prpm.json")
    .option("-a, --append", "Append to existing prpm.json")
    .option("--dry-run", "Show what would be cataloged without making changes")
    .action(
      async (
        directories: string[],
        options: { output?: string; append?: boolean; dryRun?: boolean },
      ) => {
        // Show deprecation warning
        console.log(
          "\n⚠️  DEPRECATION WARNING: 'prpm catalog' is deprecated and will be removed in a future version.",
        );
        console.log("   Use 'prpm init --scan' instead.\n");

        // Build the equivalent init --scan command
        const args = ["init", "--scan"];

        if (directories.length > 0) {
          args.push(...directories);
        }

        if (options.output) {
          args.push("--output", options.output);
        }

        if (options.append) {
          args.push("--append");
        }

        if (options.dryRun) {
          args.push("--dry-run");
        }

        console.log(`   Running: prpm ${args.join(" ")}\n`);

        // Import and call the init command directly instead of spawning
        const { initPackage } = await import("./init");
        await initPackage(
          {
            scan: true,
            output: options.output,
            append: options.append,
            dryRun: options.dryRun,
          },
          directories.length > 0 ? directories : ["."],
        );
      },
    );
}
