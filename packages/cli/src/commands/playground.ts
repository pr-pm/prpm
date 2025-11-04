/**
 * Playground command - Test packages with AI models
 */

import { Command } from 'commander';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import * as readline from 'readline';

interface PlaygroundOptions {
  model?: 'sonnet' | 'opus' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';
  compare?: boolean;
  interactive?: boolean;
  version?: string;
}

interface PlaygroundMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokens?: number;
}

interface PlaygroundResponse {
  session_id: string;
  response: string;
  credits_spent: number;
  credits_remaining: number;
  tokens_used: number;
  duration_ms: number;
  model: string;
  conversation: PlaygroundMessage[];
}

/**
 * Create a readline interface for user input
 */
function createReadline(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompt user for input
 */
function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Make authenticated API call to registry
 */
async function apiCall(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  body?: any
): Promise<Response> {
  const config = await getConfig();
  const baseUrl = (config.registryUrl || "https://registry.prpm.dev").replace(/\/$/, '');

  if (!config.token) {
    throw new Error('Authentication required. Please run `prpm login` first.');
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as { message?: string })) as { message?: string };
    throw new Error(errorData.message || `API request failed: ${response.statusText}`);
  }

  return response;
}

/**
 * Execute a playground run
 */
async function runPlayground(
  packageName: string,
  input: string,
  options: PlaygroundOptions,
  sessionId?: string
): Promise<PlaygroundResponse> {
  const response = await apiCall('/api/v1/playground/run', 'POST', {
    package_id: packageName,
    package_version: options.version,
    input,
    model: options.model || 'sonnet',
    use_no_prompt: options.compare || false,
    session_id: sessionId,
  });

  return response.json() as Promise<PlaygroundResponse>;
}

/**
 * Format and display playground response
 */
function displayResponse(result: PlaygroundResponse, showStats: boolean = true): void {
  // Get the latest assistant response
  const lastMessage = result.conversation[result.conversation.length - 1];

  if (lastMessage?.role === 'assistant') {
    console.log('\n' + '─'.repeat(60));
    console.log('🤖 Assistant:');
    console.log('─'.repeat(60));
    console.log(lastMessage.content);
    console.log('─'.repeat(60));
  }

  if (showStats) {
    console.log(`\n📊 Stats:`);
    console.log(`   Model: ${result.model}`);
    console.log(`   Tokens: ${result.tokens_used.toLocaleString()}`);
    console.log(`   Credits spent: ${result.credits_spent}`);
    console.log(`   Credits remaining: ${result.credits_remaining}`);
    console.log(`   Duration: ${result.duration_ms}ms`);
  }
}

/**
 * Run interactive playground session
 */
async function runInteractive(
  packageName: string,
  options: PlaygroundOptions
): Promise<void> {
  console.log('\n🎮 Interactive Playground Mode');
  console.log(`   Package: ${packageName}`);
  console.log(`   Model: ${options.model || 'sonnet'}`);
  if (options.compare) {
    console.log(`   Mode: Comparing against no prompt (raw model baseline)`);
  }
  console.log(`   Type 'exit' or 'quit' to end session\n`);

  const rl = createReadline();
  let sessionId: string | undefined;
  let turnCount = 0;

  try {
    while (true) {
      const input = await prompt(rl, `\n💬 You: `);

      if (input.trim().toLowerCase() === 'exit' || input.trim().toLowerCase() === 'quit') {
        console.log('\n👋 Ending playground session. Goodbye!');
        break;
      }

      if (!input.trim()) {
        console.log('❌ Please enter a message');
        continue;
      }

      try {
        console.log('\n⏳ Processing...');
        const result = await runPlayground(packageName, input, options, sessionId);

        // Store session ID for conversation continuity
        sessionId = result.session_id;
        turnCount++;

        displayResponse(result, true);
      } catch (error) {
        console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        if (error instanceof Error && error.message.includes('Insufficient credits')) {
          console.log('\n💡 Get more credits:');
          console.log('   - Purchase credits:   prpm buy-credits');
          console.log('   - Subscribe to PRPM+: prpm subscribe');
          console.log('   - Check balance:      prpm credits');
          break;
        }
      }
    }

    if (turnCount > 0) {
      console.log(`\n📝 Session summary: ${turnCount} turn(s)`);
    }
  } finally {
    rl.close();
  }
}

/**
 * Run single playground query
 */
async function runSingle(
  packageName: string,
  input: string,
  options: PlaygroundOptions
): Promise<void> {
  console.log(`\n🎮 Testing package: ${packageName}`);
  console.log(`   Model: ${options.model || 'sonnet'}`);
  if (options.compare) {
    console.log(`   Mode: Comparing against no prompt (raw model baseline)`);
  }

  try {
    console.log('\n⏳ Processing...');
    const result = await runPlayground(packageName, input, options);

    displayResponse(result, true);

    console.log(`\n💡 Tips:`);
    console.log(`   - Use --interactive for multi-turn conversation`);
    console.log(`   - Use --compare to test without the package prompt`);
    console.log(`   - Use --model to choose different models (sonnet, opus, gpt-4o, etc.)`);
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.message.includes('Insufficient credits')) {
      console.log('\n💡 Get more credits:');
      console.log('   - Purchase credits:   prpm buy-credits');
      console.log('   - Subscribe to PRPM+: prpm subscribe');
      console.log('   - Check balance:      prpm credits');
    }
    process.exit(1);
  }
}

/**
 * Handle the playground command
 */
export async function handlePlayground(
  packageName: string,
  input: string | undefined,
  options: PlaygroundOptions
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    // Validate authentication
    const config = await getConfig();
    if (!config.token) {
      console.error('❌ Authentication required');
      console.log('\n💡 Please login first:');
      console.log('   prpm login');
      process.exit(1);
    }

    // Interactive mode or single query
    if (options.interactive || !input) {
      // Interactive mode
      await runInteractive(packageName, options);
    } else {
      // Single query mode
      await runSingle(packageName, input, options);
    }

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Playground execution failed: ${error}`);
    process.exit(1);
  } finally {
    await telemetry.track({
      command: 'playground',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageName,
        model: options.model || 'sonnet',
        compare: options.compare || false,
        interactive: options.interactive || false,
      },
    });
    await telemetry.shutdown();
  }
}

/**
 * Create the playground command
 */
export function createPlaygroundCommand(): Command {
  const command = new Command('playground');

  command
    .description('Test a package with AI models in the playground')
    .argument('<package>', 'Package name to test')
    .argument('[input]', 'Input text to send to the model (omit for interactive mode)')
    .option(
      '-m, --model <model>',
      'AI model to use (sonnet, opus, gpt-4o, gpt-4o-mini, gpt-4-turbo)',
      'sonnet'
    )
    .option('-c, --compare', 'Compare against no prompt (test raw model baseline)', false)
    .option(
      '-i, --interactive',
      'Start interactive multi-turn conversation mode',
      false
    )
    .option('-v, --version <version>', 'Specific package version to test')
    .addHelpText(
      'after',
      `
Examples:
  # Single query with default model (Sonnet)
  $ prpm playground @anthropic/code-reviewer "Review this code: console.log('hello')"

  # Interactive mode for multi-turn conversation
  $ prpm playground @anthropic/brainstorm-assistant --interactive

  # Compare with and without the package prompt
  $ prpm playground @user/custom-prompt "Test input" --compare

  # Use a different model
  $ prpm playground @user/prompt --model opus "Complex task requiring Opus"
  $ prpm playground @user/prompt --model gpt-4o "Test with GPT-4o"

  # Test specific version
  $ prpm playground @user/prompt@1.2.0 "Test input"

Available Models:
  sonnet       - Claude 3.5 Sonnet (default, balanced performance)
  opus         - Claude 3 Opus (most capable, higher cost)
  gpt-4o       - GPT-4o (OpenAI's latest)
  gpt-4o-mini  - GPT-4o Mini (faster, cheaper)
  gpt-4-turbo  - GPT-4 Turbo

Note: Playground usage requires credits. Run 'prpm credits' to check balance.
`
    )
    .action(async (packageName: string, input: string | undefined, options: PlaygroundOptions) => {
      await handlePlayground(packageName, input, options);
      process.exit(0);
    });

  return command;
}
