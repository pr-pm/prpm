#!/usr/bin/env tsx
#!/usr/bin/env node
"use strict";

// ../../.claude/hooks/prettier-on-save/src/hook-utils.ts
var import_fs = require("fs");
var import_child_process = require("child_process");
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
function hasExtension(filePath, extensions) {
  return extensions.some((ext) => filePath.endsWith(ext));
}
function commandExists(command) {
  try {
    (0, import_child_process.execSync)(`command -v ${command}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
function execCommand(command, args = [], options = {}) {
  if (!commandExists(command)) {
    if (options.skipOnMissing) {
      return;
    }
    throw new Error(`Command not found: ${command}`);
  }
  const fullCommand = [command, ...args].join(" ");
  if (options.background) {
    (0, import_child_process.spawn)(command, args, {
      detached: true,
      stdio: "ignore",
      env: { ...process.env, ...options.env }
    }).unref();
    return;
  }
  try {
    (0, import_child_process.execSync)(fullCommand, {
      stdio: "inherit",
      timeout: options.timeout,
      env: { ...process.env, ...options.env }
    });
  } catch (error) {
    if (!options.skipOnMissing) {
      throw error;
    }
  }
}
function exitHook(code) {
  process.exit(code);
}

// ../../.claude/hooks/prettier-on-save/src/hook.ts
async function main() {
  const input = readStdin();
  const filePath = getFilePath(input);
  if (!filePath) {
    exitHook(0 /* Success */);
  }
  const supportedExtensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".yml",
    ".yaml",
    ".css",
    ".scss",
    ".html"
  ];
  if (!hasExtension(filePath, supportedExtensions)) {
    exitHook(0 /* Success */);
  }
  execCommand("prettier", ["--write", filePath], {
    skipOnMissing: true,
    background: true
  });
  exitHook(0 /* Success */);
}
main().catch(() => {
  exitHook(0 /* Success */);
});
