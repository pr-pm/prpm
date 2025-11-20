/**
 * Utility for executing package lifecycle scripts
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ScriptExecutionOptions {
  cwd?: string;
  timeout?: number; // in milliseconds
  maxBuffer?: number; // in bytes
}

export interface ScriptExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Execute a package lifecycle script
 * @param script - The script command to execute
 * @param scriptName - Name of the script (for logging)
 * @param options - Execution options
 * @throws Error if script fails
 */
export async function executeScript(
  script: string,
  scriptName: string,
  options: ScriptExecutionOptions = {}
): Promise<ScriptExecutionResult> {
  const {
    cwd = process.cwd(),
    timeout = 5 * 60 * 1000, // 5 minutes default
    maxBuffer = 10 * 1024 * 1024, // 10MB default
  } = options;

  console.log(`🔧 Running ${scriptName} script...`);
  console.log(`   $ ${script}\n`);

  try {
    const { stdout, stderr } = await execAsync(script, {
      cwd,
      timeout,
      maxBuffer,
      // Inherit environment variables
      env: process.env,
    });

    // Show output in real-time
    if (stdout) {
      process.stdout.write(stdout);
    }
    if (stderr) {
      process.stderr.write(stderr);
    }

    console.log(`\n✓ ${scriptName} script completed successfully\n`);

    return {
      stdout,
      stderr,
      exitCode: 0,
    };
  } catch (error: any) {
    // Show error output
    if (error.stdout) {
      process.stdout.write(error.stdout);
    }
    if (error.stderr) {
      process.stderr.write(error.stderr);
    }

    const errorMessage =
      error.code === 'ETIMEDOUT'
        ? `${scriptName} script timed out after ${timeout}ms`
        : error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'
        ? `${scriptName} script output exceeded maximum buffer size`
        : `${scriptName} script failed with exit code ${error.code || 1}`;

    throw new Error(errorMessage);
  }
}

/**
 * Execute prepublishOnly script if defined
 * @param scripts - Package scripts object
 * @param options - Execution options
 */
export async function executePrepublishOnly(
  scripts: { prepublishOnly?: string } | undefined,
  options: ScriptExecutionOptions = {}
): Promise<void> {
  if (!scripts?.prepublishOnly) {
    return; // No script defined, nothing to do
  }

  await executeScript(scripts.prepublishOnly, 'prepublishOnly', options);
}
