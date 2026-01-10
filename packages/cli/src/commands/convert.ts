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
  fromKiroAgent,
  fromWindsurf,
  fromAgentsMd,
  fromGemini,
  fromGeminiPlugin,
  fromRuler,
  fromCursorHooks,
  fromZed,
  fromOpencode,
  fromAider,
  fromTrae,
  fromReplit,
  fromZencoder,
  fromDroid,
  fromCodex,
  isCodexSkillFormat,
  toCursor,
  toClaude,
  toContinue,
  toCopilot,
  toKiro,
  toKiroAgent,
  toWindsurf,
  toAgentsMd,
  toGemini,
  toGeminiPlugin,
  toRuler,
  toCursorHooks,
  toZed,
  toOpencode,
  toAider,
  toTrae,
  toReplit,
  toZencoder,
  toDroid,
  toCodex,
  isCursorFormat,
  isClaudeFormat,
  isContinueFormat,
  isCopilotFormat,
  isKiroFormat,
  isKiroAgentFormat,
  isWindsurfFormat,
  isAgentsMdFormat,
  isRulerFormat,
  isCursorHooksFormat,
  isZedFormat,
  isTraeFormat,
  isAiderFormat,
  isReplitFormat,
  isZencoderFormat,
  VALID_HOOK_MAPPING_STRATEGIES,
  isValidHookMappingStrategy,
  CLI_SUPPORTED_FORMATS,
  type CLISupportedFormat,
  type CanonicalPackage,
  type HookMappingStrategy,
} from '@pr-pm/converters';

export interface ConvertOptions {
  to: CLISupportedFormat;
  subtype?: Subtype;
  output?: string;
  name?: string; // Custom output filename (without extension)
  yes?: boolean; // Skip confirmation prompts
  hookMapping?: HookMappingStrategy; // Hook mapping strategy for cross-format hook conversion (used with --subtype hook)
}

/**
 * Get the default installation path for a format
 */
function getDefaultPath(format: string, filename: string, subtype?: string, customName?: string): string {
  const baseName = customName || basename(filename, extname(filename));

  switch (format) {
    case 'cursor':
      // Cursor has multiple subtypes: slash commands, hooks, and rules
      if (subtype === 'slash-command') {
        return join(process.cwd(), '.cursor', 'commands', `${baseName}.md`);
      }
      if (subtype === 'hook') {
        return join(process.cwd(), '.cursor', 'hooks', 'hooks.json');
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
      // Kiro has three types:
      // - Steering files: .kiro/steering/*.md
      // - Hooks: .kiro/hooks/*.kiro.hook (JSON files)
      // - Agents: .kiro/agents/*.json (custom AI agent configurations)
      if (subtype === 'hook') {
        return join(process.cwd(), '.kiro', 'hooks', `${baseName}.kiro.hook`);
      }
      if (subtype === 'agent') {
        return join(process.cwd(), '.kiro', 'agents', `${baseName}.json`);
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
    case 'ruler':
      // Ruler uses .ruler/*.md (plain markdown files)
      return join(process.cwd(), '.ruler', `${baseName}.md`);
    case 'zed':
      // Zed uses .zed/extensions/ for extensions or slash_commands/ for commands
      if (subtype === 'slash-command') {
        return join(process.cwd(), '.zed', 'slash_commands', `${baseName}.md`);
      }
      // Default to extensions
      return join(process.cwd(), '.zed', 'extensions', `${baseName}.json`);
    case 'opencode':
      return join(process.cwd(), '.opencode', `${baseName}.md`);
    case 'aider':
      return join(process.cwd(), '.aider', `${baseName}.md`);
    case 'trae':
      return join(process.cwd(), '.trae', 'rules', `${baseName}.md`);
    case 'replit':
      return join(process.cwd(), '.replit', `${baseName}.md`);
    case 'zencoder':
      return join(process.cwd(), '.zencoder', `${baseName}.md`);
    case 'droid':
      return join(process.cwd(), '.factory', `${baseName}.md`);
    case 'codex':
      // Codex skills go to .codex/skills/{name}/SKILL.md
      if (subtype === 'skill') {
        return join(process.cwd(), '.codex', 'skills', baseName, 'SKILL.md');
      }
      // Other subtypes use AGENTS.md
      return join(process.cwd(), 'AGENTS.md');
    default:
      throw new CLIError(`Unknown format: ${format}`);
  }
}

/**
 * Detect the source format from file content and extension
 */
function detectFormat(content: string, filepath: string): string | null {
  const ext = extname(filepath).toLowerCase();

  // Try to detect from file path first (strongest signal)
  if (ext === '.mdc' || filepath.includes('.cursor/rules') || filepath.includes('.cursor/commands')) {
    return 'cursor';
  }
  if (filepath.includes('.claude/')) {
    if (filepath.includes('/agents/')) return 'claude-agent';
    if (filepath.includes('/skills/')) return 'claude-skill';
    if (filepath.includes('/commands/')) return 'claude-command';
    return 'claude';
  }
  if (filepath.includes('.windsurf/rules') || filepath.includes('.windsurfrules')) {
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
  if (basename(filepath) === 'gemini-extension.json' || filepath.includes('.gemini/extensions')) {
    return 'gemini-extension';
  }
  if (ext === '.toml' || filepath.includes('.gemini/commands')) {
    return 'gemini';
  }
  if (filepath.includes('.ruler/')) {
    return 'ruler';
  }
  if (filepath.includes('.zed/extensions') || filepath.includes('.zed/slash_commands')) {
    return 'zed';
  }
  if (filepath.includes('.codex/skills')) {
    return 'codex';
  }

  // Use robust content detection from converters
  // Check cursor-hooks first (more specific than cursor)
  if (isCursorHooksFormat(content)) return 'cursor-hooks';

  if (isClaudeFormat(content)) {
    // Further refine claude subtype if possible
    if (content.includes('type: skill')) return 'claude-skill';
    if (content.includes('type: agent')) return 'claude-agent';
    if (content.includes('type: command')) return 'claude-command';
    return 'claude';
  }

  if (isCursorFormat(content)) return 'cursor';
  if (isWindsurfFormat(content)) return 'windsurf';
  if (isKiroFormat(content)) return 'kiro';
  if (isCopilotFormat(content)) return 'copilot';
  if (isContinueFormat(content)) return 'continue';
  if (isAgentsMdFormat(content)) return 'agents.md';
  if (isRulerFormat(content)) return 'ruler';
  if (isZedFormat(content)) return 'zed';
  if (isCodexSkillFormat(content)) return 'codex';

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
      console.log(chalk.dim('  - Zed extensions (.zed/extensions/*)'));
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
        // Auto-detect if we should resolve @file references
        const hasFileReferences = /@[\w\-\/\.]+\.[\w]+/m.test(content);
        if (hasFileReferences) {
          console.log(chalk.dim('📁 Detected @file references - resolving linked files...'));
        }
        canonicalPkg = fromCursor(content, metadata, {
          resolveFiles: hasFileReferences,
          basePath: hasFileReferences ? dirname(sourcePath) : undefined,
        });
        break;
      case 'cursor-hooks':
        canonicalPkg = fromCursorHooks(content, metadata);
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
        // Check if content is agent format (JSON) vs steering file (markdown)
        if (isKiroAgentFormat(content)) {
          const result = fromKiroAgent(content);
          canonicalPkg = JSON.parse(result.content) as CanonicalPackage;
        } else {
          canonicalPkg = fromKiro(content, metadata);
        }
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
      case 'gemini-extension':
        canonicalPkg = fromGeminiPlugin(content, metadata);
        break;
      case 'gemini':
        canonicalPkg = fromGemini(content, metadata);
        break;
      case 'ruler':
        // fromRuler returns ConversionResult, need to parse the JSON content
        const rulerResult = fromRuler(content);
        canonicalPkg = JSON.parse(rulerResult.content) as CanonicalPackage;
        break;
      case 'zed':
        canonicalPkg = fromZed(content, metadata);
        break;
      case 'opencode':
        canonicalPkg = fromOpencode(content, metadata);
        break;
      case 'aider':
        canonicalPkg = fromAider(content, metadata);
        break;
      case 'trae':
        canonicalPkg = fromTrae(content, metadata);
        break;
      case 'replit':
        canonicalPkg = fromReplit(content, metadata);
        break;
      case 'zencoder':
        canonicalPkg = fromZencoder(content, metadata);
        break;
      case 'droid':
        canonicalPkg = fromDroid(content, metadata);
        break;
      case 'codex':
        canonicalPkg = fromCodex(content, metadata);
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
        // Use toCursorHooks when subtype is 'hook'
        if (options.subtype === 'hook') {
          result = toCursorHooks(canonicalPkg, {
            hookMappingStrategy: options.hookMapping || 'auto'
          });
        } else {
          result = toCursor(canonicalPkg);
        }
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
        // Check if agent subtype to use toKiroAgent instead
        if (options.subtype === 'agent') {
          result = toKiroAgent(canonicalPkg);
        } else {
          result = toKiro(canonicalPkg, {
            kiroConfig: { inclusion: 'always' } // Default to always include
          });
        }
        break;
      case 'agents.md':
        result = toAgentsMd(canonicalPkg);
        break;
      case 'gemini':
        // Check subtype: extension uses toGeminiPlugin, slash-command uses toGemini
        if (canonicalPkg.subtype === 'extension' || options.subtype === 'extension') {
          result = toGeminiPlugin(canonicalPkg);
        } else {
          result = toGemini(canonicalPkg);
        }
        break;
      case 'ruler':
        result = toRuler(canonicalPkg);
        break;
      case 'zed':
        result = toZed(canonicalPkg);
        break;
      case 'opencode':
        result = toOpencode(canonicalPkg);
        break;
      case 'aider':
        result = toAider(canonicalPkg);
        break;
      case 'trae':
        result = toTrae(canonicalPkg);
        break;
      case 'replit':
        result = toReplit(canonicalPkg);
        break;
      case 'zencoder':
        result = toZencoder(canonicalPkg);
        break;
      case 'droid':
        result = toDroid(canonicalPkg);
        break;
      case 'codex':
        result = toCodex(canonicalPkg);
        break;
      default:
        throw new CLIError(`Unsupported target format: ${options.to}`);
    }

    if (!result.content) {
      throw new CLIError('Conversion failed: No content generated');
    }

    console.log(chalk.green(`✓ Converted from ${sourceFormat} to ${options.to}`));

    // Determine output path
    const outputPath = options.output || getDefaultPath(options.to, sourcePath, options.subtype, options.name);

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
    } else if (options.to === 'ruler') {
      console.log(chalk.dim('💡 Ruler will automatically load and distribute rules from .ruler/'));
    } else if (options.to === 'zed') {
      console.log(chalk.dim('💡 Zed will automatically load extensions from .zed/extensions/'));
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
    .option('-t, --to <format>', `Target format (${CLI_SUPPORTED_FORMATS.join(', ')})`)
    .option('-s, --subtype <subtype>', 'Target subtype (agent, skill, slash-command, rule, hook, prompt, etc.)')
    .option('-o, --output <path>', 'Output path (defaults to format-specific location)')
    .option('-n, --name <name>', 'Custom output filename (without extension, e.g., "my-rule")')
    .option('--hook-mapping <strategy>', 'Hook mapping strategy: auto (default), strict, skip', 'auto')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (source: string, options: any) => {
      try {
        if (!options.to) {
          throw new CLIError('Target format is required. Use --to <format>');
        }

        if (!CLI_SUPPORTED_FORMATS.includes(options.to)) {
          throw new CLIError(
            `Invalid format: ${options.to}\n\nValid formats: ${CLI_SUPPORTED_FORMATS.join(', ')}\n\n💡 For Cursor hooks, use: --to cursor --subtype hook`
          );
        }

        if (options.hookMapping && !isValidHookMappingStrategy(options.hookMapping)) {
          throw new CLIError(
            `Invalid hook mapping strategy: ${options.hookMapping}\n\nValid strategies: ${VALID_HOOK_MAPPING_STRATEGIES.join(', ')}`
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
          name: options.name,
          yes: options.yes,
          hookMapping: options.hookMapping as HookMappingStrategy,
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
