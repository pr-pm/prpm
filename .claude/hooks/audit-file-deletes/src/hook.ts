#!/usr/bin/env tsx
/**
 * Audit File Deletes Hook
 * Logs all file deletion operations Claude performs for security auditing
 */

import { join } from 'path';
import { homedir } from 'os';
import {
  readStdin,
  getCommand,
  getEnv,
  appendToLog,
  getTimestamp,
  exitHook,
  HookExitCode,
} from './hook-utils';

async function main() {
  // Read input from stdin
  const input = readStdin();

  // Extract command
  const command = getCommand(input);
  if (!command) {
    exitHook(HookExitCode.Success);
  }

  // Check if command contains file deletion operations
  if (!/\brm\b|\bunlink\b/.test(command)) {
    exitHook(HookExitCode.Success);
  }

  // Set audit log location
  const logFile = join(homedir(), '.claude-deletions.log');

  // Get working directory
  const workingDir = getEnv('CLAUDE_PROJECT_DIR') || process.cwd();

  // Log the deletion command with timestamp and context
  const logLine = `[${getTimestamp()}] [DELETE] ${command}\n  Working Directory: ${workingDir}`;
  appendToLog(logFile, logLine);

  exitHook(HookExitCode.Success);
}

main().catch(() => {
  exitHook(HookExitCode.Success); // Don't block on errors
});
