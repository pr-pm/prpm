/**
 * Convert command - Convert AI prompt files between formats
 */

import { Command } from 'commander';
import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { dirname, join, basename, extname } from 'path';
import { existsSync } from 'fs';
import { createInterface } from 'readline';
import chalk from 'chalk';
import { CLIError } from '../core/errors.js';
import { Subtype } from '@pr-pm/types';
import {
  fromCursor,
  fromClaude,
  fromContinue,
  fromCopilot,
  fromKiro,
  fromWindsurf,
  fromAgentsMd,
  fromGemini,
  toCursor,
  toClaude,
  toContinue,
  toCopilot,
  toKiro,
  toWindsurf,
  toAgentsMd,
  type CanonicalPackage,
} from '@pr-pm/converters';

export interface ConvertOptions {
  to: 'cursor' | 'claude' | 'windsurf' | 'continue' | 'copilot' | 'kiro' | 'agents.md' | 'gemini';
  subtype?: Subtype;
  output?: string;
  yes?: boolean; // Skip confirmation prompts
}

/**
 * Get the default installation path for a format
 */
function getDefaultPath(format: string, filename: string, subtype?: string): string {
  const baseName = basename(filename, extname(filename));

  switch (format) {
    case 'cursor':
      // Cursor has two types: slash commands (.cursor/commands/*.md) and rules (.cursor/rules/*.mdc)
      if (subtype === 'slash-command') {
        return join(process.cwd(), '.cursor', 'commands', `${baseName}.md`);
      }
      // Default to rules
      return join(process.cwd(), '.cursor', 'rules', `${baseName}.mdc`);
    case 'claude':
      // Use subtype to determine the directory
      if (subtype === 'skill') {
        return join(process.cwd(), '.claude', 'skills', baseName, 'SKILL.md');
      } else if (subtype === 'slash-command') {
        return join(process.cwd(), '.claude', 'commands', `${baseName}.md`);
      } else {
        // Default to agents (for 'agent' subtype or unspecified)
        return join(process.cwd(), '.claude', 'agents', `${baseName}.md`);
      }
    case 'windsurf':
      return join(process.cwd(), '.windsurf', 'rules', `${baseName}.md`);
    case 'kiro':
      // Kiro has two types: steering files (.kiro/steering/*.md) and hooks (.kiro/hooks/*.kiro.hook)
      if (subtype === 'hook') {
        return join(process.cwd(), '.kiro', 'hooks', `${baseName}.kiro.hook`);
      }
      // Default to steering files for conversion
      return join(process.cwd(), '.kiro', 'steering', `${baseName}.md`);
    case 'copilot':
      // Copilot uses NAME.instructions.md format in .github/instructions/ directory
      return join(process.cwd(), '.github', 'instructions', `${baseName}.instructions.md`);
    case 'continue':
      // Continue uses .continue/rules/*.md for rules (default) or .continue/prompts/*.md for slash commands/prompts
      if (subtype === 'slash-command' || subtype === 'prompt') {
        return join(process.cwd(), '.continue', 'prompts', `${baseName}.md`);
      }
      return join(process.cwd(), '.continue', 'rules', `${baseName}.md`);
    case 'agents.md':
      return join(process.cwd(), 'agents.md');
    case 'gemini':
      // Gemini uses .gemini/commands/*.toml
      return join(process.cwd(), '.gemini', 'commands', `${baseName}.toml`);
    default:
      throw new CLIError(`Unknown format: ${format}`);
  }
}

/**
 * Detect the source format from file content and extension
 */
function detectFormat(content: string, filepath: string): string | null {
  const ext = extname(filepath).toLowerCase();

  // Try to detect from extension
  if (ext === '.mdc' || filepath.includes('.cursor/rules') || filepath.includes('.cursor/commands')) {
    return 'cursor';
  }
  if (filepath.includes('.claude/')) {
    if (filepath.includes('/agents/')) return 'claude-agent';
    if (filepath.includes('/skills/')) return 'claude-skill';
    if (filepath.includes('/commands/')) return 'claude-command';
    return 'claude';
  }
  if (filepath.includes('.windsurf/rules')) {
    return 'windsurf';
  }
  if (filepath.includes('.kiro/steering') || filepath.includes('.kiro/hooks')) {
    return 'kiro';
  }
  if (filepath.includes('copilot-instructions') || filepath.includes('.github/instructions')) {
    return 'copilot';
  }
  if (filepath.includes('.continue/rules') || filepath.includes('.continue/prompts') || filepath.includes('.continuerules')) {
    return 'continue';
  }
  if (basename(filepath) === 'agents.md') {
    return 'agents.md';
  }
  if (ext === '.toml' || filepath.includes('.gemini/commands')) {
    return 'gemini';
  }

  // Try to detect from content patterns
  if (content.includes('---') && content.includes('name:') && content.includes('description:')) {
    if (content.includes('type: skill')) return 'claude-skill';
    if (content.includes('type: agent')) return 'claude-agent';
    if (content.includes('type: command')) return 'claude-command';
    return 'claude';
  }

  if (content.match(/^\s*<agent>/) || content.match(/^\s*<agents>/)) {
    return 'agents.md';
  }

  if (content.includes('# Cursor Rules') || content.includes('<!-- Cursor Rules -->')) {
    return 'cursor';
  }

  if (content.includes('# Kiro Rules') || content.includes('rules:')) {
    return 'kiro';
  }

  return null;
}

/**
 * Confirm overwrite with user
 */
async function confirmOverwrite(filepath: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      chalk.yellow(`File ${filepath} already exists. Overwrite? (y/N): `),
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      }
    );
  });
}

export async function handleConvert(sourcePath: string, options: ConvertOptions) {
  try {
    console.log(chalk.dim('Reading source file...'));

    // Read source file
    let content: string;
    try {
      content = await readFile(sourcePath, 'utf-8');
    } catch (error: any) {
      throw new CLIError(`Failed to read source file: ${error.message}`);
    }

    // Detect source format
    const sourceFormat = detectFormat(content, sourcePath);
    if (!sourceFormat) {
      console.log(chalk.red('✖ Could not detect source format'));
      console.log(chalk.dim('\nSupported formats:'));
      console.log(chalk.dim('  - Cursor rules (.cursor/rules/*.mdc)'));
      console.log(chalk.dim('  - Claude agents/skills/commands (.claude/*/*)'));
      console.log(chalk.dim('  - Windsurf rules (.windsurf/rules/*.md)'));
      console.log(chalk.dim('  - Kiro steering files (.kiro/steering/*.md)'));
      console.log(chalk.dim('  - GitHub Copilot instructions'));
      console.log(chalk.dim('  - Continue rules (.continue/rules/*.md)'));
      console.log(chalk.dim('  - agents.md format'));
      throw new CLIError('Unsupported source format');
    }

    console.log(chalk.green(`✓ Detected source format: ${sourceFormat}`));

    console.log(chalk.dim('Converting format...'));

    // Convert locally using shared converters (no network round trip!)
    const metadata = {
      id: 'converted-package',
      name: 'Converted Package',
      version: '1.0.0',
      author: 'user',
      tags: [],
    };

    // Parse source format to canonical
    let canonicalPkg: CanonicalPackage;
    switch (sourceFormat.toLowerCase()) {
      case 'cursor':
        canonicalPkg = fromCursor(content, metadata);
        break;
      case 'claude':
      case 'claude-agent':
      case 'claude-skill':
      case 'claude-command':
        canonicalPkg = fromClaude(content, metadata);
        break;
      case 'windsurf':
        canonicalPkg = fromWindsurf(content, metadata);
        break;
      case 'kiro':
        canonicalPkg = fromKiro(content, metadata);
        break;
      case 'copilot':
        canonicalPkg = fromCopilot(content, metadata);
        break;
      case 'continue':
        canonicalPkg = fromContinue(JSON.parse(content), metadata);
        break;
      case 'agents.md':
        canonicalPkg = fromAgentsMd(content, metadata);
        break;
      case 'gemini':
        canonicalPkg = fromGemini(content, metadata);
        break;
      default:
        throw new CLIError(`Unsupported source format: ${sourceFormat}`);
    }

    // Override subtype if specified
    if (options.subtype) {
      canonicalPkg.subtype = options.subtype;
    }

    // Convert from canonical to target format
    let result;
    switch (options.to) {
      case 'cursor':
        result = toCursor(canonicalPkg);
        break;
      case 'claude':
        result = toClaude(canonicalPkg);
        break;
      case 'continue':
        result = toContinue(canonicalPkg);
        break;
      case 'windsurf':
        result = toWindsurf(canonicalPkg);
        break;
      case 'copilot':
        result = toCopilot(canonicalPkg);
        break;
      case 'kiro':
        result = toKiro(canonicalPkg, {
          kiroConfig: { inclusion: 'always' } // Default to always include
        });
        break;
      case 'agents.md':
        result = toAgentsMd(canonicalPkg);
        break;
      case 'gemini':
        result = toGemini(canonicalPkg);
        break;
      default:
        throw new CLIError(`Unsupported target format: ${options.to}`);
    }

    if (!result.content) {
      throw new CLIError('Conversion failed: No content generated');
    }

    console.log(chalk.green(`✓ Converted from ${sourceFormat} to ${options.to}`));

    // Determine output path
    const outputPath = options.output || getDefaultPath(options.to, sourcePath, options.subtype);

    // Check if file exists
    if (existsSync(outputPath) && !options.yes) {
      const shouldOverwrite = await confirmOverwrite(outputPath);
      if (!shouldOverwrite) {
        console.log(chalk.yellow('\n✖ Conversion cancelled'));
        return;
      }
    }

    // Create directory if it doesn't exist
    const outputDir = dirname(outputPath);
    await mkdir(outputDir, { recursive: true });

    // Write converted content
    console.log(chalk.dim('Writing converted file...'));
    await writeFile(outputPath, result.content, 'utf-8');

    console.log(chalk.green(`✓ Converted file written to ${outputPath}`));

    // Show helpful info based on format
    console.log();
    if (options.to === 'cursor') {
      console.log(chalk.dim('💡 Cursor will automatically load rules from .cursor/rules/'));
    } else if (options.to === 'claude') {
      console.log(chalk.dim('💡 Claude Code will automatically load from .claude/'));
    } else if (options.to === 'windsurf') {
      console.log(chalk.dim('💡 Windsurf will automatically load rules from .windsurf/rules/'));
    } else if (options.to === 'kiro') {
      console.log(chalk.dim('💡 Kiro will automatically load steering files from .kiro/steering/'));
    } else if (options.to === 'gemini') {
      console.log(chalk.dim('💡 Gemini will automatically load commands from .gemini/commands/'));
    }

  } catch (error: any) {
    console.log(chalk.red('✖ Conversion failed'));
    throw error;
  }
}

/**
 * Create the convert command
 */
export function createConvertCommand() {
  const command = new Command('convert')
    .description('Convert AI prompt files between formats')
    .argument('<source>', 'Source file path to convert')
    .option('-t, --to <format>', 'Target format (cursor, claude, windsurf, kiro, copilot, continue, agents.md, gemini)')
    .option('-s, --subtype <subtype>', 'Target subtype (agent, skill, slash-command, rule, prompt, etc.)')
    .option('-o, --output <path>', 'Output path (defaults to format-specific location)')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (source: string, options: any) => {
      try {
        if (!options.to) {
          throw new CLIError('Target format is required. Use --to <format>');
        }

        const validFormats = ['cursor', 'claude', 'windsurf', 'kiro', 'copilot', 'continue', 'agents.md', 'gemini'];
        if (!validFormats.includes(options.to)) {
          throw new CLIError(
            `Invalid format: ${options.to}\n\nValid formats: ${validFormats.join(', ')}`
          );
        }

        const validSubtypes = ['agent', 'skill', 'slash-command', 'rule', 'prompt', 'workflow', 'tool', 'template', 'collection', 'chatmode', 'hook'];
        if (options.subtype && !validSubtypes.includes(options.subtype)) {
          throw new CLIError(
            `Invalid subtype: ${options.subtype}\n\nValid subtypes: ${validSubtypes.join(', ')}`
          );
        }

        await handleConvert(source, {
          to: options.to,
          subtype: options.subtype,
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
