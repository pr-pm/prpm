#!/usr/bin/env tsx
#!/usr/bin/env node
"use strict";

// ../../.claude/hooks/sensitive-data-scanner/src/hook-utils.ts
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

// ../../.claude/hooks/sensitive-data-scanner/src/hook.ts
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
    { regex: /AKIA[0-9A-Z]{16}/, name: "AWS Access Key" },
    { regex: /BEGIN.*PRIVATE KEY/, name: "Private key block" },
    { regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, name: "JWT token" },
    { regex: /["']([A-Za-z0-9]{32,})["']/, name: "Long alphanumeric string (possible API key)" },
    {
      regex: /(password|secret|key).*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
      name: "Email in sensitive context"
    }
  ];
  let warned = false;
  for (const pattern of patterns) {
    if (pattern.regex.test(content)) {
      if (!warned) {
        logWarning(`\u26A0\uFE0F  Warning: Potential sensitive data detected in ${filePath}`);
        warned = true;
      }
      logWarning(`   Pattern matched: ${pattern.name}`);
    }
  }
  if (warned) {
    logWarning(`   Review the content before committing to version control.`);
  }
  exitHook(0 /* Success */);
}
main().catch(() => {
  exitHook(0 /* Success */);
});
