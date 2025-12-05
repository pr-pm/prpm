#!/usr/bin/env tsx
/**
 * Desktop Alerts Hook
 * Sends desktop notifications when Claude Code shows alerts or needs input
 */

import {
  readStdin,
  commandExists,
  execCommand,
  exitHook,
  HookExitCode,
} from './hook-utils';

async function main() {
  // Read input from stdin
  const input = readStdin();

  // Extract message
  const message = input.message || 'Claude Code notification';

  // Send notification based on platform
  if (commandExists('notify-send')) {
    // Linux (libnotify)
    execCommand(
      'notify-send',
      ['Claude Code', message, '--icon=dialog-information'],
      { skipOnMissing: true }
    );
  } else if (commandExists('terminal-notifier')) {
    // macOS (terminal-notifier)
    execCommand(
      'terminal-notifier',
      ['-title', 'Claude Code', '-message', message, '-sound', 'default'],
      { skipOnMissing: true }
    );
  } else if (commandExists('osascript')) {
    // macOS (AppleScript fallback)
    const script = `display notification "${message.replace(/"/g, '\\"')}" with title "Claude Code"`;
    execCommand('osascript', ['-e', script], { skipOnMissing: true });
  }

  exitHook(HookExitCode.Success);
}

main().catch(() => {
  exitHook(HookExitCode.Success); // Don't block on errors
});
