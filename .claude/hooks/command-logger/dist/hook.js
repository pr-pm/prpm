#!/usr/bin/env tsx
#!/usr/bin/env node
"use strict";

// ../../.claude/hooks/command-logger/src/hook.ts
var import_path = require("path");
var import_os = require("os");

// ../../.claude/hooks/command-logger/src/hook-utils.ts
var import_fs = require("fs");
function readStdin() {
  try {
    const input = (0, import_fs.readFileSync)(0, "utf-8");
    return JSON.parse(input);
  } catch {
    return {};
  }
}
function getCommand(input) {
  const command = input.input?.command;
  if (!command || typeof command !== "string" || command.trim() === "") {
    return void 0;
  }
  return command;
}
function exitHook(code) {
  process.exit(code);
}
function appendToLog(logFile, line) {
  try {
    const fs = require("fs");
    const path = require("path");
    const dir = path.dirname(logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(logFile, line + "\n", "utf-8");
  } catch (error) {
  }
}
function getTimestamp() {
  return (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 19);
}

// ../../.claude/hooks/command-logger/src/hook.ts
async function main() {
  const input = readStdin();
  const command = getCommand(input);
  if (!command) {
    exitHook(0 /* Success */);
  }
  const logFile = (0, import_path.join)((0, import_os.homedir)(), ".claude-commands.log");
  const logLine = `[${getTimestamp()}] ${command}`;
  appendToLog(logFile, logLine);
  exitHook(0 /* Success */);
}
main().catch(() => {
  exitHook(0 /* Success */);
});
