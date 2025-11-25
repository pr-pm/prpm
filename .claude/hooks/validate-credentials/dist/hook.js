#!/usr/bin/env tsx
#!/usr/bin/env node
"use strict";

// ../../.claude/hooks/validate-credentials/src/hook-utils.ts
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
function getContent(input) {
  let content = input.input?.content;
  if (!content) {
    content = input.input?.new_string;
  }
  if (!content || typeof content !== "string") {
    return void 0;
  }
  return content;
}
function logWarning(message) {
  console.error(message);
}
function exitHook(code) {
  process.exit(code);
}

// ../../.claude/hooks/validate-credentials/src/hook.ts
async function main() {
  const input = readStdin();
  const filePath = getFilePath(input);
  if (!filePath) {
    exitHook(0 /* Success */);
  }
  const content = getContent(input);
  if (!content) {
    exitHook(0 /* Success */);
  }
  const patterns = [
    { regex: /password\s*=\s*["'][^"']+["']/i, name: 'password = "..."' },
    { regex: /api[_-]?key\s*=\s*["'][^"']+["']/i, name: 'api_key = "..."' },
    { regex: /secret\s*=\s*["'][^"']+["']/i, name: 'secret = "..."' },
    { regex: /token\s*=\s*["'][^"']+["']/i, name: 'token = "..."' },
    { regex: /AWS_SECRET_ACCESS_KEY/i, name: "AWS_SECRET_ACCESS_KEY" },
    { regex: /PRIVATE_KEY/i, name: "PRIVATE_KEY" }
  ];
  for (const pattern of patterns) {
    if (pattern.regex.test(content)) {
      logWarning(`\u26A0\uFE0F  Warning: Potential hardcoded credential detected in ${filePath}`);
      logWarning(`   Pattern matched: ${pattern.name}`);
      logWarning(`   Consider using environment variables instead.`);
      break;
    }
  }
  exitHook(0 /* Success */);
}
main().catch(() => {
  exitHook(0 /* Success */);
});
