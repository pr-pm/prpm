#!/usr/bin/env tsx
#!/usr/bin/env node
"use strict";

// ../../.claude/hooks/desktop-alerts/src/hook-utils.ts
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

// ../../.claude/hooks/desktop-alerts/src/hook.ts
async function main() {
  const input = readStdin();
  const message = input.message || "Claude Code notification";
  if (commandExists("notify-send")) {
    execCommand(
      "notify-send",
      ["Claude Code", message, "--icon=dialog-information"],
      { skipOnMissing: true }
    );
  } else if (commandExists("terminal-notifier")) {
    execCommand(
      "terminal-notifier",
      ["-title", "Claude Code", "-message", message, "-sound", "default"],
      { skipOnMissing: true }
    );
  } else if (commandExists("osascript")) {
    const script = `display notification "${message.replace(/"/g, '\\"')}" with title "Claude Code"`;
    execCommand("osascript", ["-e", script], { skipOnMissing: true });
  }
  exitHook(0 /* Success */);
}
main().catch(() => {
  exitHook(0 /* Success */);
});
