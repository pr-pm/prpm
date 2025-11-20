#!/usr/bin/env tsx
#!/usr/bin/env node
"use strict";

// ../../.claude/hooks/block-env-writes/src/hook-utils.ts
var import_fs = require("fs");
function readStdin() {
  try {
    const input = (0, import_fs.readFileSync)(0, "utf-8");
    return JSON.parse(input);
  } catch {
    return {};
  }
}
function getFilePath(input) {
  const filePath = input.input?.file_path;
  if (!filePath || typeof filePath !== "string" || filePath.trim() === "") {
    return void 0;
  }
  return filePath;
}
function matchesPattern(filePath, patterns) {
  for (const pattern of patterns) {
    const regexPattern = pattern.replace(/\./g, "\\.").replace(/\*/g, ".*").replace(/\?/g, ".");
    const regex = new RegExp(`^${regexPattern}$|/${regexPattern}$`);
    if (regex.test(filePath)) {
      return {
        matched: true,
        pattern
      };
    }
  }
  return { matched: false };
}
function logError(message) {
  console.error(message);
}
function exitHook(code) {
  process.exit(code);
}

// ../../.claude/hooks/block-env-writes/src/hook.ts
async function main() {
  const input = readStdin();
  const filePath = getFilePath(input);
  if (!filePath) {
    exitHook(0 /* Success */);
  }
  const blockedPatterns = [
    ".env",
    ".env.*",
    "*.pem",
    "*.key",
    "*credentials*",
    "*secrets*",
    ".git/*",
    ".ssh/*",
    "*.p12",
    "*.pfx"
  ];
  const match = matchesPattern(filePath, blockedPatterns);
  if (match.matched) {
    logError(`\u26D4 Blocked: Cannot modify sensitive file '${filePath}'`);
    logError(`   Matches protected pattern: ${match.pattern}`);
    logError(`   This file may contain credentials or secrets.`);
    exitHook(2 /* Block */);
  }
  exitHook(0 /* Success */);
}
main().catch(() => {
  exitHook(0 /* Success */);
});
