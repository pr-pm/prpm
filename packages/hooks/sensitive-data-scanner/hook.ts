#!/usr/bin/env tsx
/**
 * Sensitive Data Scanner Hook
 * Scans code for sensitive data patterns like API keys, private keys, and tokens
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

  // Sensitive data patterns to detect
  const patterns = [
    { regex: /AKIA[0-9A-Z]{16}/, name: 'AWS Access Key' },
    { regex: /BEGIN.*PRIVATE KEY/, name: 'Private key block' },
    { regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, name: 'JWT token' },
    { regex: /["']([A-Za-z0-9]{32,})["']/, name: 'Long alphanumeric string (possible API key)' },
    {
      regex: /(password|secret|key).*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
      name: 'Email in sensitive context',
    },
  ];

  let warned = false;

  // Check content for sensitive data patterns
  for (const pattern of patterns) {
    if (pattern.regex.test(content)) {
      if (!warned) {
        logWarning(`⚠️  Warning: Potential sensitive data detected in ${filePath}`);
        warned = true;
      }
      logWarning(`   Pattern matched: ${pattern.name}`);
    }
  }

  if (warned) {
    logWarning(`   Review the content before committing to version control.`);
  }

  exitHook(HookExitCode.Success);
}

main().catch(() => {
  exitHook(HookExitCode.Success); // Don't block on errors
});
