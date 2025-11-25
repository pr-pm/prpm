#!/usr/bin/env tsx
/**
 * Validate Credentials Hook
 * Warns when Claude attempts to write code that may contain hardcoded credentials
 */

import {
  readStdin,
  getFilePath,
  getContent,
  logWarning,
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

  // Extract content
  const content = getContent(input);
  if (!content) {
    exitHook(HookExitCode.Success);
  }

  // Patterns that might indicate hardcoded credentials
  const patterns = [
    { regex: /password\s*=\s*["'][^"']+["']/i, name: 'password = "..."' },
    { regex: /api[_-]?key\s*=\s*["'][^"']+["']/i, name: 'api_key = "..."' },
    { regex: /secret\s*=\s*["'][^"']+["']/i, name: 'secret = "..."' },
    { regex: /token\s*=\s*["'][^"']+["']/i, name: 'token = "..."' },
    { regex: /AWS_SECRET_ACCESS_KEY/i, name: 'AWS_SECRET_ACCESS_KEY' },
    { regex: /PRIVATE_KEY/i, name: 'PRIVATE_KEY' },
  ];

  // Check content for credential patterns
  for (const pattern of patterns) {
    if (pattern.regex.test(content)) {
      logWarning(`⚠️  Warning: Potential hardcoded credential detected in ${filePath}`);
      logWarning(`   Pattern matched: ${pattern.name}`);
      logWarning(`   Consider using environment variables instead.`);
      break; // Only warn once
    }
  }

  exitHook(HookExitCode.Success);
}

main().catch(() => {
  exitHook(HookExitCode.Success); // Don't block on errors
});
