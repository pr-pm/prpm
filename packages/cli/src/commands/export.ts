/**
 * Export command - Export installed packages to external tools
 */

import { Command } from 'commander';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import chalk from 'chalk';
import { CLIError } from '../core/errors';
import { listPackages } from '../core/lockfile';
import { telemetry } from '../core/telemetry';

export interface ExportOptions {
  to: 'ruler';
  output?: string; // Custom output directory (defaults to .ruler/)
  yes?: boolean; // Skip confirmation prompts
}

/**
 * Export packages to Ruler format
 * Ruler expects markdown files in .ruler/ directory
 */
async function exportToRuler(options: ExportOptions): Promise<void> {
  console.log(chalk.dim('📦 Exporting installed packages to Ruler format...'));
  console.log();

  // Get installed packages
  const packages = await listPackages();

  if (packages.length === 0) {
    console.log(chalk.yellow('⚠ No packages installed'));
    console.log(chalk.dim('Install packages first with: prpm install <package>'));
    return;
  }

  console.log(chalk.green(`✓ Found ${packages.length} installed package${packages.length === 1 ? '' : 's'}`));
  console.log();

  // Determine output directory
  const outputDir = options.output || join(process.cwd(), '.ruler');

  // Check if .ruler directory exists
  let rulerExists = false;
  try {
    await fs.access(outputDir);
    rulerExists = true;
  } catch {
    // Directory doesn't exist
  }

  if (!rulerExists) {
    console.log(chalk.yellow(`⚠ ${outputDir} directory not found`));
    console.log(chalk.dim('Creating .ruler directory...'));
    await fs.mkdir(outputDir, { recursive: true });
    console.log(chalk.green(`✓ Created ${outputDir}/`));
    console.log();
  }

  // Read package contents from their installed locations
  let exportedCount = 0;
  let skippedCount = 0;

  for (const pkg of packages) {
    const packageName = pkg.id.split('/').pop() || pkg.id;

    if (!pkg.installedPath) {
      console.log(chalk.yellow(`⚠ Skipping ${pkg.id} - no installation path found`));
      skippedCount++;
      continue;
    }

    try {
      // Read the installed file content
      const content = await fs.readFile(pkg.installedPath, 'utf-8');

      // Create a Ruler-compatible markdown file
      // Ruler expects simple markdown files with optional YAML frontmatter
      const rulerContent = createRulerFormat(pkg.id, pkg.version, content, pkg.format, pkg.subtype);

      // Write to .ruler directory with descriptive name
      const rulerFilename = `${packageName}.md`;
      const rulerPath = join(outputDir, rulerFilename);

      await fs.writeFile(rulerPath, rulerContent, 'utf-8');

      console.log(chalk.green(`✓ Exported ${pkg.id} → ${rulerFilename}`));
      exportedCount++;
    } catch (error) {
      console.log(chalk.red(`✖ Failed to export ${pkg.id}: ${error instanceof Error ? error.message : String(error)}`));
      skippedCount++;
    }
  }

  console.log();
  console.log(chalk.green(`✓ Export complete`));
  console.log(chalk.dim(`   Exported: ${exportedCount} package${exportedCount === 1 ? '' : 's'}`));
  if (skippedCount > 0) {
    console.log(chalk.dim(`   Skipped: ${skippedCount} package${skippedCount === 1 ? '' : 's'}`));
  }
  console.log();

  // Create/update ruler.toml if it doesn't exist
  await ensureRulerConfig(outputDir);

  // Show next steps
  console.log(chalk.bold('📋 Next steps:'));
  console.log(chalk.dim('1. Review the exported files in .ruler/'));
  console.log(chalk.dim('2. Edit ruler.toml to configure which agents should use these rules'));
  console.log(chalk.dim('3. Run: ruler apply'));
  console.log();
  console.log(chalk.dim('💡 Learn more about Ruler: https://okigu.com/ruler'));
}

/**
 * Create Ruler-compatible markdown format
 */
function createRulerFormat(
  packageId: string,
  version: string,
  content: string,
  format?: string,
  subtype?: string
): string {
  // Strip existing frontmatter if present
  const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');

  // Create new frontmatter with PRPM metadata
  const frontmatter = [
    '---',
    `# Exported from PRPM`,
    `# Package: ${packageId}`,
    `# Version: ${version}`,
    format ? `# Original Format: ${format}` : '',
    subtype ? `# Subtype: ${subtype}` : '',
    `# Exported: ${new Date().toISOString()}`,
    '---',
    '',
  ].filter(Boolean).join('\n');

  return frontmatter + contentWithoutFrontmatter;
}

/**
 * Ensure ruler.toml exists with basic configuration
 */
async function ensureRulerConfig(rulerDir: string): Promise<void> {
  const configPath = join(dirname(rulerDir), 'ruler.toml');

  try {
    await fs.access(configPath);
    console.log(chalk.dim('ℹ ruler.toml already exists (not modified)'));
  } catch {
    // Create basic ruler.toml
    const basicConfig = `# Ruler Configuration
# Learn more: https://okigu.com/ruler

# Define which agents should use these rules
# Example:
# [agents.cursor]
# enabled = true
# rules = ["*"]  # Apply all rules
#
# [agents.claude]
# enabled = true
# rules = ["*"]

# Uncomment and configure the agents you use:
# [agents.cursor]
# enabled = false
#
# [agents.claude]
# enabled = false
#
# [agents.github-copilot]
# enabled = false
`;

    await fs.writeFile(configPath, basicConfig, 'utf-8');
    console.log(chalk.green(`✓ Created ruler.toml configuration template`));
  }
}

/**
 * Handle the export command
 */
export async function handleExport(options: ExportOptions): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let packageCount = 0;

  try {
    if (options.to === 'ruler') {
      await exportToRuler(options);
      const packages = await listPackages();
      packageCount = packages.length;
      success = true;
    } else {
      throw new CLIError(`Unsupported export target: ${options.to}`);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    throw new CLIError(`❌ Export failed: ${error}`, 1);
  } finally {
    // Track telemetry
    await telemetry.track({
      command: 'export',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        target: options.to,
        packageCount,
      },
    });
    await telemetry.shutdown();
  }
}

/**
 * Create the export command
 */
export function createExportCommand(): Command {
  const command = new Command('export');

  command
    .description('Export installed packages to external tools')
    .option('--to <tool>', 'Export target (currently supports: ruler)', 'ruler')
    .option('-o, --output <dir>', 'Custom output directory')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (options: any) => {
      try {
        if (!options.to) {
          throw new CLIError('Export target is required. Use --to <tool>');
        }

        const validTargets = ['ruler'];
        if (!validTargets.includes(options.to)) {
          throw new CLIError(
            `Invalid export target: ${options.to}\n\nCurrently supported: ${validTargets.join(', ')}`
          );
        }

        await handleExport({
          to: options.to as 'ruler',
          output: options.output,
          yes: options.yes,
        });
      } catch (error: any) {
        if (error instanceof CLIError) {
          throw error;
        }
        throw new CLIError(error.message);
      }
    });

  return command;
}
