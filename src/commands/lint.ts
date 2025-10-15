/**
 * Lint command - validate and score package quality
 */

import { Command } from 'commander';
import { validatePackage } from '../core/validator';
import { telemetry } from '../core/telemetry';
import { PackageType } from '../types';
import { promises as fs } from 'fs';

/**
 * Handle lint command
 */
export async function handleLint(
  packagePath: string,
  options: { type?: string; strict?: boolean }
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    // Determine package type from path or option
    const type = (options.type as PackageType) || inferTypeFromPath(packagePath);

    if (!type) {
      console.error(
        '❌ Could not determine package type. Use --type to specify.'
      );
      process.exit(1);
    }

    // Check if file exists
    try {
      await fs.access(packagePath);
    } catch {
      console.error(`❌ File not found: ${packagePath}`);
      process.exit(1);
    }

    console.log(`🔍 Linting ${packagePath} as ${type}...\n`);

    // Validate the package
    const result = await validatePackage(packagePath, type);

    // Display results
    console.log(`📊 Quality Score: ${result.score}/100`);

    if (result.valid) {
      console.log('✅ Valid\n');
    } else {
      console.log('❌ Invalid\n');
    }

    // Display errors
    if (result.errors.length > 0) {
      console.log('❌ Errors:');
      result.errors.forEach((err, index) => {
        const location = err.line ? ` (line ${err.line})` : '';
        console.log(`  ${index + 1}. ${err.message}${location}`);
        if (err.rule) {
          console.log(`     Rule: ${err.rule}`);
        }
      });
      console.log();
    }

    // Display warnings
    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      result.warnings.forEach((warn, index) => {
        const location = warn.line ? ` (line ${warn.line})` : '';
        console.log(`  ${index + 1}. ${warn.message}${location}`);
        if (warn.rule) {
          console.log(`     Rule: ${warn.rule}`);
        }
      });
      console.log();
    }

    // Display suggestions
    if (result.suggestions.length > 0) {
      console.log('💡 Suggestions:');
      result.suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion}`);
      });
      console.log();
    }

    // Score interpretation
    console.log('Score Interpretation:');
    if (result.score >= 90) {
      console.log('  🌟 Excellent quality!');
    } else if (result.score >= 75) {
      console.log('  ✨ Good quality');
    } else if (result.score >= 60) {
      console.log('  👍 Acceptable quality');
    } else if (result.score >= 40) {
      console.log('  ⚠️  Needs improvement');
    } else {
      console.log('  ❗ Poor quality - significant issues detected');
    }

    success = result.valid;

    // Exit with error code if strict mode and not valid
    if (options.strict && !result.valid) {
      process.exit(1);
    }

    // Exit with error code if score is too low
    if (options.strict && result.score < 60) {
      console.log('\n❌ Failed strict mode (score < 60)');
      process.exit(1);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`❌ Linting failed: ${error}`);
    process.exit(1);
  } finally {
    await telemetry.track({
      command: 'lint',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packagePath: packagePath.substring(0, 100),
        type: options.type,
        strict: options.strict,
      },
    });
  }
}

/**
 * Infer package type from file path
 */
function inferTypeFromPath(filePath: string): PackageType | null {
  if (filePath.includes('.cursor/rules')) return 'cursor';
  if (filePath.includes('.claude/agents')) return 'claude';
  if (filePath.includes('.windsurf')) return 'windsurf';
  if (filePath.includes('.continue/prompts')) return 'continue';
  if (filePath.includes('.aider')) return 'aider';
  if (filePath.includes('copilot-instructions.md')) return 'copilot-instructions';
  if (filePath.includes('.github/instructions')) return 'copilot-path';
  if (filePath.includes('.github/prompts')) return 'copilot';

  return null;
}

/**
 * Create the lint command
 */
export function createLintCommand(): Command {
  const command = new Command('lint');

  command
    .description('Validate and score package quality')
    .argument('<path>', 'Path to the package file')
    .option('--type <type>', 'Package type (cursor, claude, etc.)')
    .option('--strict', 'Exit with error if validation fails or score < 60')
    .action(async (path: string, options) => {
      await handleLint(path, options);
    });

  return command;
}
