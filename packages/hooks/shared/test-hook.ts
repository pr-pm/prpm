#!/usr/bin/env tsx
/**
 * Hook Testing Utility
 *
 * Test Claude Code hooks with sample inputs and edge cases.
 *
 * Usage:
 *   npx tsx test-hook.ts <hook-script> [event-type]
 *
 * Examples:
 *   npx tsx test-hook.ts ./my-hook.sh PreToolUse
 *   npx tsx test-hook.ts ./my-hook.ts PostToolUse
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import type {
  PreToolUseInput,
  PostToolUseInput,
  SessionStartInput,
  UserPromptSubmitInput,
  NotificationInput,
  HookEventName,
} from './types';

// Test case definition
interface TestCase {
  name: string;
  description: string;
  input: Record<string, unknown>;
  expectedExit: number;
}

// Sample inputs for each event type
const sampleInputs: Record<HookEventName, Record<string, unknown>> = {
  PreToolUse: {
    session_id: 'test-session-123',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: '/home/user/project',
    permission_mode: 'default',
    hook_event_name: 'PreToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: '/home/user/project/src/index.ts',
      content: 'console.log("Hello, World!");',
    },
    tool_use_id: 'toolu_01ABC123',
  } satisfies PreToolUseInput,

  PostToolUse: {
    session_id: 'test-session-123',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: '/home/user/project',
    permission_mode: 'default',
    hook_event_name: 'PostToolUse',
    tool_name: 'Write',
    tool_input: {
      file_path: '/home/user/project/src/index.ts',
      content: 'console.log("Hello, World!");',
    },
    tool_response: {
      filePath: '/home/user/project/src/index.ts',
      success: true,
    },
    tool_use_id: 'toolu_01ABC123',
  } satisfies PostToolUseInput,

  PermissionRequest: {
    session_id: 'test-session-123',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: '/home/user/project',
    permission_mode: 'default',
    hook_event_name: 'PermissionRequest',
    tool_name: 'Bash',
    tool_input: {
      command: 'rm -rf /tmp/test',
    },
  },

  Notification: {
    session_id: 'test-session-123',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: '/home/user/project',
    permission_mode: 'default',
    hook_event_name: 'Notification',
    message: 'Claude needs your permission to use Bash',
    notification_type: 'permission_prompt',
  } satisfies NotificationInput,

  UserPromptSubmit: {
    session_id: 'test-session-123',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: '/home/user/project',
    permission_mode: 'default',
    hook_event_name: 'UserPromptSubmit',
    prompt: 'Write a function to calculate factorial',
  } satisfies UserPromptSubmitInput,

  Stop: {
    session_id: 'test-session-123',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: '/home/user/project',
    permission_mode: 'default',
    hook_event_name: 'Stop',
    stop_hook_active: true,
  },

  SubagentStop: {
    session_id: 'test-session-123',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: '/home/user/project',
    permission_mode: 'default',
    hook_event_name: 'SubagentStop',
    stop_hook_active: true,
  },

  PreCompact: {
    session_id: 'test-session-123',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: '/home/user/project',
    permission_mode: 'default',
    hook_event_name: 'PreCompact',
    trigger: 'manual',
    custom_instructions: '',
  },

  SessionStart: {
    session_id: 'test-session-123',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: '/home/user/project',
    permission_mode: 'default',
    hook_event_name: 'SessionStart',
    source: 'startup',
  } satisfies SessionStartInput,

  SessionEnd: {
    session_id: 'test-session-123',
    transcript_path: '/tmp/transcript.jsonl',
    cwd: '/home/user/project',
    permission_mode: 'default',
    hook_event_name: 'SessionEnd',
    reason: 'logout',
  },
};

// Edge case test inputs
const edgeCases: TestCase[] = [
  {
    name: 'File with spaces',
    description: 'Tests handling of file paths with spaces',
    input: {
      ...sampleInputs.PreToolUse,
      tool_input: {
        file_path: '/home/user/my project/file with spaces.ts',
        content: 'test',
      },
    },
    expectedExit: 0,
  },
  {
    name: 'Unicode filename',
    description: 'Tests handling of Unicode characters in paths',
    input: {
      ...sampleInputs.PreToolUse,
      tool_input: {
        file_path: '/home/user/project/文件.ts',
        content: 'test',
      },
    },
    expectedExit: 0,
  },
  {
    name: 'Sensitive .env file',
    description: 'Should typically be blocked by security hooks',
    input: {
      ...sampleInputs.PreToolUse,
      tool_input: {
        file_path: '/home/user/project/.env',
        content: 'API_KEY=secret123',
      },
    },
    expectedExit: 2, // Expected to block
  },
  {
    name: 'Path traversal attempt',
    description: 'Should be blocked by security hooks',
    input: {
      ...sampleInputs.PreToolUse,
      tool_input: {
        file_path: '/home/user/project/../../../etc/passwd',
        content: 'malicious',
      },
    },
    expectedExit: 2, // Expected to block
  },
  {
    name: 'Empty file path',
    description: 'Tests handling of missing/empty file path',
    input: {
      ...sampleInputs.PreToolUse,
      tool_input: {
        file_path: '',
        content: 'test',
      },
    },
    expectedExit: 0, // Should gracefully handle
  },
  {
    name: 'Malformed JSON (missing fields)',
    description: 'Tests handling of incomplete input',
    input: {
      session_id: 'test',
    },
    expectedExit: 0, // Should gracefully handle
  },
];

/**
 * Run a hook with given input
 */
async function runHook(
  hookPath: string,
  input: Record<string, unknown>
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(hookPath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        CLAUDE_PROJECT_DIR: '/home/user/project',
        CLAUDE_CURRENT_DIR: '/home/user/project',
        SESSION_ID: 'test-session-123',
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', data => {
      stdout += data.toString();
    });

    child.stderr.on('data', data => {
      stderr += data.toString();
    });

    child.on('error', reject);

    child.on('close', exitCode => {
      resolve({ exitCode: exitCode ?? 1, stdout, stderr });
    });

    // Send input via stdin
    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
}

/**
 * Run a single test case
 */
async function runTest(
  hookPath: string,
  testCase: TestCase
): Promise<{ passed: boolean; actual: number; expected: number }> {
  const result = await runHook(hookPath, testCase.input);
  return {
    passed: result.exitCode === testCase.expectedExit,
    actual: result.exitCode,
    expected: testCase.expectedExit,
  };
}

/**
 * Main test runner
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Hook Testing Utility');
    console.log('');
    console.log('Usage:');
    console.log('  npx tsx test-hook.ts <hook-script> [event-type]');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx test-hook.ts ./my-hook.sh PreToolUse');
    console.log('  npx tsx test-hook.ts ./my-hook.ts --edge-cases');
    console.log('');
    console.log('Event types:');
    Object.keys(sampleInputs).forEach(event => {
      console.log(`  ${event}`);
    });
    process.exit(1);
  }

  const hookPath = args[0];
  const eventType = args[1] as HookEventName | undefined;
  const runEdgeCases = args.includes('--edge-cases');

  // Verify hook exists
  if (!existsSync(hookPath)) {
    console.error(`Error: Hook not found: ${hookPath}`);
    process.exit(1);
  }

  console.log(`Testing hook: ${hookPath}`);
  console.log('');

  let passed = 0;
  let failed = 0;

  if (runEdgeCases) {
    // Run edge case tests
    console.log('Running edge case tests...');
    console.log('');

    for (const testCase of edgeCases) {
      process.stdout.write(`  ${testCase.name}... `);
      try {
        const result = await runTest(hookPath, testCase);
        if (result.passed) {
          console.log('PASS');
          passed++;
        } else {
          console.log(`FAIL (expected ${result.expected}, got ${result.actual})`);
          failed++;
        }
      } catch (error) {
        console.log(`ERROR: ${error}`);
        failed++;
      }
    }
  } else if (eventType && eventType in sampleInputs) {
    // Run single event type test
    console.log(`Testing ${eventType} event...`);
    console.log('');

    const input = sampleInputs[eventType];
    console.log('Input:');
    console.log(JSON.stringify(input, null, 2));
    console.log('');

    try {
      const result = await runHook(hookPath, input);
      console.log(`Exit code: ${result.exitCode}`);
      if (result.stdout) {
        console.log('Stdout:', result.stdout);
      }
      if (result.stderr) {
        console.log('Stderr:', result.stderr);
      }
    } catch (error) {
      console.error('Error running hook:', error);
      process.exit(1);
    }
  } else {
    // Run all event type tests
    console.log('Running all event type tests...');
    console.log('');

    for (const [event, input] of Object.entries(sampleInputs)) {
      process.stdout.write(`  ${event}... `);
      try {
        const result = await runHook(hookPath, input);
        if (result.exitCode === 0) {
          console.log('PASS');
          passed++;
        } else if (result.exitCode === 2) {
          console.log(`BLOCKED (exit 2)`);
          passed++; // Blocking is a valid response
        } else {
          console.log(`ERROR (exit ${result.exitCode})`);
          failed++;
        }
      } catch (error) {
        console.log(`ERROR: ${error}`);
        failed++;
      }
    }
  }

  if (passed + failed > 0) {
    console.log('');
    console.log(`Results: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
