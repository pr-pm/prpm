#!/usr/bin/env tsx
/**
 * Prettier On Save Hook
 * Automatically formats code files with Prettier after Claude edits or creates them
 */

import {
  readStdin,
  getFilePath,
  hasExtension,
  execCommand,
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

  // Only format supported file types
  const supportedExtensions = [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.json',
    '.md',
    '.yml',
    '.yaml',
    '.css',
    '.scss',
    '.html',
  ];

  if (!hasExtension(filePath, supportedExtensions)) {
    exitHook(HookExitCode.Success);
  }

  // Run prettier in background to avoid blocking
  execCommand('prettier', ['--write', filePath], {
    skipOnMissing: true,
    background: true,
  });

  exitHook(HookExitCode.Success);
}

main().catch(() => {
  exitHook(HookExitCode.Success); // Don't block on errors
});
