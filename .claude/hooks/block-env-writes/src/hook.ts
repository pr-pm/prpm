#!/usr/bin/env tsx
/**
 * Block Env Writes Hook
 * Prevents Claude from writing to or editing sensitive files that may contain credentials
 */

import {
  readStdin,
  getFilePath,
  matchesPattern,
  logError,
  exitHook,
  HookExitCode,
} from './hook-utils';

async function main() {
  // Read input from stdin
  const input = readStdin();

  // Extract file path
  const filePath = getFilePath(input);
  if (!filePath) {
    exitHook(HookExitCode.Success);
  }

  // List of sensitive file patterns to block
  const blockedPatterns = [
    '.env',
    '.env.*',
    '*.pem',
    '*.key',
    '*credentials*',
    '*secrets*',
    '.git/*',
    '.ssh/*',
    '*.p12',
    '*.pfx',
  ];

  // Check if file matches any blocked pattern
  const match = matchesPattern(filePath, blockedPatterns);

  if (match.matched) {
    logError(`⛔ Blocked: Cannot modify sensitive file '${filePath}'`);
    logError(`   Matches protected pattern: ${match.pattern}`);
    logError(`   This file may contain credentials or secrets.`);
    exitHook(HookExitCode.Block); // Block the operation
  }

  exitHook(HookExitCode.Success);
}

main().catch(() => {
  exitHook(HookExitCode.Success); // Don't block on errors
});
