/**
 * Convert command - convert packages between tool formats
 */

import { Command } from 'commander';
import { convertPackage, getCompatibleTypes, isConversionRecommended } from '../core/converter';
import { getDestinationDir, saveFile, getFileExtension, getSpecialFilename } from '../core/filesystem';
import { telemetry } from '../core/telemetry';
import { PackageType } from '../types';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Handle convert command
 */
export async function handleConvert(
  sourcePath: string,
  options: {
    from: string;
    to: string;
    output?: string;
    dryRun?: boolean;
  }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    const sourceType = options.from as PackageType;
    const targetType = options.to as PackageType;

    // Validate types
    if (!isValidPackageType(sourceType)) {
      console.error(`❌ Invalid source type: ${options.from}`);
      process.exit(1);
    }

    if (!isValidPackageType(targetType)) {
      console.error(`❌ Invalid target type: ${options.to}`);
      process.exit(1);
    }

    // Check if file exists
    try {
      await fs.access(sourcePath);
    } catch {
      console.error(`❌ Source file not found: ${sourcePath}`);
      process.exit(1);
    }

    // Check conversion recommendation
    const recommendation = isConversionRecommended(sourceType, targetType);
    console.log(`🔄 Converting ${sourceType} → ${targetType}`);
    console.log(`   Compatibility: ${recommendation.reason}\n`);

    // Perform conversion
    const result = await convertPackage(sourcePath, sourceType, targetType);

    // Display warnings
    if (result.warnings.length > 0) {
      console.log('⚠️  Conversion notes:');
      result.warnings.forEach((warning) => {
        console.log(`   - ${warning}`);
      });
      console.log();
    }

    // Determine output path
    let outputPath = options.output;
    if (!outputPath) {
      const sourceFilename = path.basename(sourcePath);
      const specialFilename = getSpecialFilename(targetType);
      const extension = getFileExtension(targetType);

      let filename: string;
      if (specialFilename) {
        filename = specialFilename;
      } else {
        const nameWithoutExt = sourceFilename.replace(/\.[^/.]+$/, '');
        filename = nameWithoutExt + extension;
      }

      const destDir = getDestinationDir(targetType);
      outputPath = `${destDir}/${filename}`;
    }

    if (options.dryRun) {
      console.log('🔍 Dry run - converted content:');
      console.log('─'.repeat(50));
      console.log(result.content);
      console.log('─'.repeat(50));
      console.log(`\nWould save to: ${outputPath}`);
    } else {
      // Save the converted file
      await saveFile(outputPath, result.content);
      console.log(`✅ Successfully converted package`);
      console.log(`   📁 Saved to: ${outputPath}`);
      console.log(`\n💡 Next steps:`);
      console.log(`   1. Review the converted file`);
      console.log(`   2. Make any necessary adjustments`);
      console.log(`   3. Run 'prmp lint ${outputPath}' to validate`);
    }

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`❌ Conversion failed: ${error}`);
    process.exit(1);
  } finally {
    await telemetry.track({
      command: 'convert',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        from: options.from,
        to: options.to,
        dryRun: options.dryRun,
      },
    });
  }
}

/**
 * List compatible types for conversion
 */
function handleListCompatible(type: string): void {
  if (!isValidPackageType(type)) {
    console.error(`❌ Invalid type: ${type}`);
    process.exit(1);
  }

  const compatible = getCompatibleTypes(type as PackageType);
  console.log(`\nCompatible conversion targets for ${type}:`);

  if (compatible.length === 0) {
    console.log('  No compatible types found');
    return;
  }

  compatible.forEach((targetType) => {
    const rec = isConversionRecommended(type as PackageType, targetType);
    const status = rec.recommended ? '✓' : '⚠';
    console.log(`  ${status} ${targetType} - ${rec.reason}`);
  });
}

/**
 * Validate package type
 */
function isValidPackageType(type: string): type is PackageType {
  const validTypes: PackageType[] = [
    'cursor',
    'claude',
    'windsurf',
    'continue',
    'aider',
    'copilot',
    'copilot-instructions',
    'copilot-path',
  ];
  return validTypes.includes(type as PackageType);
}

/**
 * Create the convert command
 */
export function createConvertCommand(): Command {
  const command = new Command('convert');

  command
    .description('Convert packages between tool formats')
    .argument('<source>', 'Source package file path')
    .requiredOption('--from <type>', 'Source package type')
    .requiredOption('--to <type>', 'Target package type')
    .option('--output <path>', 'Output file path (default: auto-generated)')
    .option('--dry-run', 'Show conversion without saving')
    .action(async (source: string, options) => {
      await handleConvert(source, options);
    });

  // Add subcommand for listing compatible types
  const listCommand = new Command('list-compatible');
  listCommand
    .description('List compatible conversion targets')
    .argument('<type>', 'Package type')
    .action((type: string) => {
      handleListCompatible(type);
    });

  command.addCommand(listCommand);

  return command;
}
