#!/usr/bin/env tsx
/**
 * Command Logger Hook
 * Logs all bash commands Claude executes to a file for audit and debugging
 */

import { join } from 'path';
import { homedir } from 'os';
import {
  readStdin,
  getCommand,
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

  // Set log file location
  const logFile = join(homedir(), '.claude-commands.log');

  // Log command with timestamp
  const logLine = `[${getTimestamp()}] ${command}`;
  appendToLog(logFile, logLine);

  exitHook(HookExitCode.Success);
}

main().catch(() => {
  exitHook(HookExitCode.Success); // Don't block on errors
});
