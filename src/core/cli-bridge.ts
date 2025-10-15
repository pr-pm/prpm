/**
 * CLI Bridge - Spawn and interact with AI coding tools
 * Inspired by Zen MCP's clink tool
 */

import { spawn, ChildProcess } from 'child_process';
import { PackageType } from '../types';
import { promises as fs } from 'fs';

export interface CLIConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface CLIResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  duration: number;
}

export interface SpawnOptions {
  role?: string;
  files?: string[];
  context?: string;
  isolated?: boolean;
  timeout?: number;
}

/**
 * Get CLI configuration for each AI tool
 */
export function getCLIConfig(tool: PackageType): CLIConfig | null {
  const configs: Record<string, CLIConfig> = {
    cursor: {
      command: 'cursor',
      args: ['--permission-mode', 'acceptEdits'],
    },
    claude: {
      command: 'claude',
      args: ['--permission-mode', 'acceptEdits'],
    },
    windsurf: {
      command: 'windsurf',
      args: [],
    },
    continue: {
      command: 'continue',
      args: [],
    },
    aider: {
      command: 'aider',
      args: ['--yes', '--no-auto-commits'],
    },
    // Note: Copilot doesn't have a standalone CLI we can spawn
  };

  return configs[tool] || null;
}

/**
 * Check if a CLI tool is available
 */
export async function isCLIAvailable(tool: PackageType): Promise<boolean> {
  const config = getCLIConfig(tool);
  if (!config) return false;

  return new Promise((resolve) => {
    const process = spawn('which', [config.command], {
      shell: true,
    });

    process.on('close', (code) => {
      resolve(code === 0);
    });

    process.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Build prompt with context
 */
function buildPromptWithContext(
  prompt: string,
  options: SpawnOptions
): string {
  let fullPrompt = '';

  // Add role context if specified
  if (options.role) {
    fullPrompt += `[Role: ${options.role}]\n\n`;
  }

  // Add file context
  if (options.files && options.files.length > 0) {
    fullPrompt += `[Files to analyze: ${options.files.join(', ')}]\n\n`;
  }

  // Add additional context
  if (options.context) {
    fullPrompt += `[Context: ${options.context}]\n\n`;
  }

  // Add the actual prompt
  fullPrompt += prompt;

  return fullPrompt;
}

/**
 * Spawn an AI tool CLI with a prompt
 */
export async function spawnAITool(
  tool: PackageType,
  prompt: string,
  options: SpawnOptions = {}
): Promise<CLIResult> {
  const startTime = Date.now();
  const config = getCLIConfig(tool);

  if (!config) {
    return {
      success: false,
      output: '',
      error: `No CLI configuration for tool: ${tool}`,
      exitCode: -1,
      duration: 0,
    };
  }

  // Check if tool is available
  const available = await isCLIAvailable(tool);
  if (!available) {
    return {
      success: false,
      output: '',
      error: `CLI tool not found: ${config.command}. Please install it first.`,
      exitCode: -1,
      duration: 0,
    };
  }

  return new Promise((resolve) => {
    const fullPrompt = buildPromptWithContext(prompt, options);
    let output = '';
    let errorOutput = '';

    // Spawn the process
    const childProcess: ChildProcess = spawn(config.command, config.args, {
      env: {
        ...process.env,
        ...config.env,
      },
      cwd: process.cwd(),
    });

    // Set timeout if specified
    const timeout = options.timeout || 300000; // 5 minutes default
    const timer = setTimeout(() => {
      childProcess.kill();
      resolve({
        success: false,
        output,
        error: `Process timed out after ${timeout}ms`,
        exitCode: -1,
        duration: Date.now() - startTime,
      });
    }, timeout);

    // Send prompt to stdin
    if (childProcess.stdin) {
      childProcess.stdin.write(fullPrompt);
      childProcess.stdin.end();
    }

    // Collect stdout
    if (childProcess.stdout) {
      childProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
    }

    // Collect stderr
    if (childProcess.stderr) {
      childProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
    }

    // Handle process completion
    childProcess.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        success: code === 0,
        output,
        error: errorOutput || undefined,
        exitCode: code || 0,
        duration: Date.now() - startTime,
      });
    });

    // Handle errors
    childProcess.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        success: false,
        output,
        error: err.message,
        exitCode: -1,
        duration: Date.now() - startTime,
      });
    });
  });
}

/**
 * Test a prompt file with an AI tool
 */
export async function testPromptWithTool(
  promptPath: string,
  tool: PackageType,
  options: SpawnOptions = {}
): Promise<CLIResult> {
  try {
    // Read the prompt file
    const promptContent = await fs.readFile(promptPath, 'utf-8');

    // Add test scenario context
    const testPrompt = options.context
      ? `${promptContent}\n\n[Test Scenario]\n${options.context}`
      : promptContent;

    // Spawn the tool and test
    return await spawnAITool(tool, testPrompt, options);
  } catch (error) {
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
      exitCode: -1,
      duration: 0,
    };
  }
}

/**
 * List available AI tools
 */
export async function listAvailableTools(): Promise<
  Array<{ tool: PackageType; available: boolean; command: string }>
> {
  const tools: PackageType[] = ['cursor', 'claude', 'windsurf', 'continue', 'aider'];
  const results = [];

  for (const tool of tools) {
    const config = getCLIConfig(tool);
    if (config) {
      const available = await isCLIAvailable(tool);
      results.push({
        tool,
        available,
        command: config.command,
      });
    }
  }

  return results;
}
