/**
 * Playground command - Test packages with AI models
 */

import { Command } from 'commander';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
import { CLIError } from '../core/errors';

interface PlaygroundOptions {
  model?: 'sonnet' | 'opus' | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';
  compare?: boolean;
  interactive?: boolean;
  version?: string;
  custom?: string;
  promptFile?: string;
  package?: string;
  input?: string;
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
 * Ask user for feedback on the result (subtle, non-intrusive)
 */
async function promptFeedback(sessionId: string): Promise<void> {
  const rl = createReadline();

  try {
    console.log('\n💭 Was this result effective? (y/n, or press Enter to skip)');
    const answer = await prompt(rl, '   ');

    const normalized = answer.toLowerCase().trim();

    if (normalized === 'y' || normalized === 'yes') {
      // Optional comment
      console.log('\n   Any comments? (optional, press Enter to skip)');
      const comment = await prompt(rl, '   ');

      await submitFeedback(sessionId, true, comment.trim() || undefined);

      if (comment.trim()) {
        console.log('   ✓ Feedback submitted with comment\n');
      } else {
        console.log('   ✓ Feedback submitted\n');
      }
    } else if (normalized === 'n' || normalized === 'no') {
      // Optional comment
      console.log('\n   Any comments? (optional, press Enter to skip)');
      const comment = await prompt(rl, '   ');

      await submitFeedback(sessionId, false, comment.trim() || undefined);

      if (comment.trim()) {
        console.log('   ✓ Feedback submitted with comment\n');
      } else {
        console.log('   ✓ Feedback submitted\n');
      }
    }
    // If empty or anything else, silently skip
  } catch (error) {
    // Silently fail - feedback is optional
  } finally {
    rl.close();
  }
}

/**
 * Submit feedback to the API
 */
async function submitFeedback(
  sessionId: string,
  isEffective: boolean,
  comment?: string
): Promise<void> {
  try {
    const response = await apiCall('/api/v1/playground/feedback', 'POST', {
      session_id: sessionId,
      is_effective: isEffective,
      comment: comment || undefined,
    });

    if (!response.ok) {
      // Silently fail - don't interrupt user flow
      return;
    }
  } catch (error) {
    // Silently fail - feedback is optional
  }
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
 * Resolve package name to UUID
 */
async function resolvePackageId(packageName: string): Promise<string> {
  // If it's already a UUID, return it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(packageName)) {
    return packageName;
  }

  // Look up package by name directly
  const config = await getConfig();
  const baseUrl = (config.registryUrl || "https://registry.prpm.dev").replace(/\/$/, '');

  // URL encode the package name to handle scoped packages like @user/package
  const encodedName = encodeURIComponent(packageName);
  const response = await fetch(`${baseUrl}/api/v1/packages/${encodedName}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Package not found: ${packageName}`);
    }
    throw new Error(`Failed to fetch package: ${response.statusText}`);
  }

  const data = await response.json() as { id: string; name: string };
  return data.id;
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
  // Resolve package name to UUID
  const packageId = await resolvePackageId(packageName);

  const response = await apiCall('/api/v1/playground/run', 'POST', {
    package_id: packageId,
    package_version: options.version,
    input,
    model: options.model || 'sonnet',
    use_no_prompt: options.compare || false,
    session_id: sessionId,
  });

  return response.json() as Promise<PlaygroundResponse>;
}

/**
 * Execute a custom prompt playground run
 */
async function runCustomPrompt(
  customPrompt: string,
  input: string,
  options: PlaygroundOptions,
  sessionId?: string
): Promise<PlaygroundResponse> {
  const response = await apiCall('/api/v1/custom-prompt/run', 'POST', {
    custom_prompt: customPrompt,
    input,
    model: options.model || 'sonnet',
    session_id: sessionId,
  });

  return response.json() as Promise<PlaygroundResponse>;
}

/**
 * Read custom prompt from file
 */
function readPromptFile(filePath: string): string {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Prompt file not found: ${filePath}`);
  }

  return fs.readFileSync(absolutePath, 'utf-8');
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

        // Prompt for feedback in interactive mode (subtle, can skip)
        await promptFeedback(result.session_id);
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
 * Run interactive custom prompt session
 */
async function runCustomInteractive(
  customPrompt: string,
  options: PlaygroundOptions
): Promise<void> {
  console.log('\n🎮 Interactive Custom Prompt Mode');
  console.log(`   Model: ${options.model || 'sonnet'}`);
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
        const result = await runCustomPrompt(customPrompt, input, options, sessionId);

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
 * Run baseline (no prompt) comparison
 */
async function runBaseline(
  input: string,
  options: PlaygroundOptions
): Promise<PlaygroundResponse> {
  // Use a minimal package but with use_no_prompt flag to get raw model baseline
  // We need any valid package ID because the API requires it, but the prompt will be ignored
  // Let's use a well-known minimal package (we'll search for any package)
  const config = await getConfig();
  const baseUrl = (config.registryUrl || "https://registry.prpm.dev").replace(/\/$/, '');

  // Get any package to use for baseline comparison (the prompt will be ignored anyway)
  const searchResponse = await fetch(`${baseUrl}/api/v1/search?q=coding&limit=1`);
  if (!searchResponse.ok) {
    throw new Error('Failed to find a package for baseline comparison');
  }

  const searchData = await searchResponse.json() as { packages: Array<{ id: string }> };
  if (!searchData.packages || searchData.packages.length === 0) {
    throw new Error('No packages found for baseline comparison');
  }

  const dummyPackageId = searchData.packages[0].id;

  // Call playground with use_no_prompt flag (this ignores the package prompt)
  const response = await apiCall('/api/v1/playground/run', 'POST', {
    package_id: dummyPackageId,
    input,
    model: options.model || 'sonnet',
    use_no_prompt: true, // This makes it a raw baseline with no system prompt
  });

  return response.json() as Promise<PlaygroundResponse>;
}

/**
 * Run single custom prompt query
 */
async function runCustomSingle(
  customPrompt: string,
  input: string,
  options: PlaygroundOptions
): Promise<void> {
  console.log(`\n🎮 Testing custom prompt`);
  console.log(`   Model: ${options.model || 'sonnet'}`);
  console.log(`   Credits: 2x normal cost (custom prompts)`);
  if (options.compare) {
    console.log(`   Mode: Comparing custom prompt vs. no prompt (baseline)`);
  }

  try {
    if (options.compare) {
      // Comparison mode: run with custom prompt and without any prompt
      console.log('\n⏳ Processing comparison (2 requests)...');

      // Run with custom prompt
      const resultWithPrompt = await runCustomPrompt(customPrompt, input, options);

      // Run baseline (no prompt at all)
      const resultBaseline = await runBaseline(input, options);

      // Display both results
      console.log('\n' + '═'.repeat(60));
      console.log('✨ WITH CUSTOM PROMPT');
      console.log('═'.repeat(60));
      displayResponse(resultWithPrompt, false);

      console.log('\n' + '═'.repeat(60));
      console.log('🔵 WITHOUT PROMPT (BASELINE)');
      console.log('═'.repeat(60));
      displayResponse(resultBaseline, false);

      // Combined stats
      console.log(`\n📊 Combined Stats:`);
      console.log(`   Total tokens: ${resultWithPrompt.tokens_used + resultBaseline.tokens_used}`);
      console.log(`   Total credits: ${resultWithPrompt.credits_spent + resultBaseline.credits_spent}`);
      console.log(`   Credits remaining: ${resultBaseline.credits_remaining}`);
      console.log(`\n💡 Compare the responses to evaluate your custom prompt's effectiveness!`);
    } else {
      // Single mode: run with custom prompt only
      console.log('\n⏳ Processing...');
      const result = await runCustomPrompt(customPrompt, input, options);
      displayResponse(result, true);

      console.log(`\n💡 Tips:`);
      console.log(`   - Use --interactive for multi-turn conversation`);
      console.log(`   - Use --compare to test against baseline (no prompt)`);
      console.log(`   - Use --prompt-file to iterate on a prompt file`);
      console.log(`   - Custom prompts cost 2x credits (no caching)`);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.message.includes('Insufficient credits')) {
      console.log('\n💡 Get more credits:');
      console.log('   - Purchase credits:   prpm buy-credits');
      console.log('   - Subscribe to PRPM+: prpm subscribe');
      console.log('   - Check balance:      prpm credits');
    }
    throw new CLIError(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`, 1);
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
    console.log(`   Mode: Comparing with package vs. without (baseline)`);
  }

  try {
    if (options.compare) {
      // Comparison mode: run both with package and without
      console.log('\n⏳ Processing comparison (2 requests)...');

      // Run with package (without use_no_prompt flag)
      const withPackageOptions = { ...options, compare: false };
      const resultWithPackage = await runPlayground(packageName, input, withPackageOptions);

      // Run without package (with use_no_prompt flag)
      const withoutPackageOptions = { ...options, compare: true };
      const resultWithoutPackage = await runPlayground(packageName, input, withoutPackageOptions);

      // Display both results
      console.log('\n' + '═'.repeat(60));
      console.log('📦 WITH PACKAGE PROMPT');
      console.log('═'.repeat(60));
      displayResponse(resultWithPackage, false);

      console.log('\n' + '═'.repeat(60));
      console.log('🔵 WITHOUT PACKAGE (BASELINE)');
      console.log('═'.repeat(60));
      displayResponse(resultWithoutPackage, false);

      // Combined stats
      console.log(`\n📊 Combined Stats:`);
      console.log(`   Total tokens: ${resultWithPackage.tokens_used + resultWithoutPackage.tokens_used}`);
      console.log(`   Total credits: ${resultWithPackage.credits_spent + resultWithoutPackage.credits_spent}`);
      console.log(`   Credits remaining: ${resultWithoutPackage.credits_remaining}`);

      // Prompt for feedback on the with-package result
      await promptFeedback(resultWithPackage.session_id);
    } else {
      // Single mode: run with package only
      console.log('\n⏳ Processing...');
      const result = await runPlayground(packageName, input, options);
      displayResponse(result, true);

      // Prompt for feedback
      await promptFeedback(result.session_id);
    }

    console.log(`\n💡 Tips:`);
    console.log(`   - Use --interactive for multi-turn conversation`);
    console.log(`   - Use --compare to test with and without the package prompt`);
    console.log(`   - Use --model to choose different models (sonnet, opus, gpt-4o, etc.)`);
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.message.includes('Insufficient credits')) {
      console.log('\n💡 Get more credits:');
      console.log('   - Purchase credits:   prpm buy-credits');
      console.log('   - Subscribe to PRPM+: prpm subscribe');
      console.log('   - Check balance:      prpm credits');
    }
    throw new CLIError(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`, 1);
  }
}

/**
 * Handle the playground command
 */
export async function handlePlayground(
  options: PlaygroundOptions
): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;
  let customPromptMode = false;

  try {
    // Validate authentication
    const config = await getConfig();
    if (!config.token) {
      console.error('❌ Authentication required');
      console.log('\n💡 Please login first:');
      console.log('   prpm login');
      throw new CLIError('❌ Authentication required', 1);
    }

    // Check for custom prompt mode
    if (options.custom || options.promptFile) {
      customPromptMode = true;

      // Get custom prompt from option or file
      let customPrompt: string;
      if (options.promptFile) {
        console.log(`📄 Loading prompt from: ${options.promptFile}`);
        customPrompt = readPromptFile(options.promptFile);
        console.log(`✅ Loaded ${customPrompt.length} characters\n`);
      } else {
        customPrompt = options.custom!;
      }

      // Validate custom prompt length
      if (customPrompt.length < 10) {
        throw new Error('Custom prompt too short (minimum 10 characters)');
      }
      if (customPrompt.length > 50000) {
        throw new Error('Custom prompt too long (maximum 50000 characters)');
      }

      // Interactive mode or single query
      if (options.interactive || !options.input) {
        // Interactive mode with custom prompt
        await runCustomInteractive(customPrompt, options);
      } else {
        // Single query mode with custom prompt
        await runCustomSingle(customPrompt, options.input, options);
      }
    } else {
      // Regular package-based playground
      if (!options.package) {
        throw new Error('Either --package or --custom/--prompt-file is required');
      }

      // Interactive mode or single query
      if (options.interactive || !options.input) {
        // Interactive mode
        await runInteractive(options.package, options);
      } else {
        // Single query mode
        await runSingle(options.package, options.input, options);
      }
    }

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Playground execution failed: ${error}`);
    throw new CLIError(`\n❌ Playground execution failed: ${error}`, 1);
  } finally {
    await telemetry.track({
      command: 'playground',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        packageName: customPromptMode ? 'custom-prompt' : (options.package || 'unknown'),
        model: options.model || 'sonnet',
        compare: options.compare || false,
        interactive: options.interactive || false,
        customPrompt: customPromptMode,
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
    .description('Test a package or custom prompt with AI models in the playground')
    .option('-p, --package <name>', 'Package name to test')
    .option('--input <text>', 'Input text to send to the model (omit for interactive mode)')
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
    .option('--custom <prompt>', 'Use a custom prompt string (verified authors only)')
    .option('--prompt-file <file>', 'Load custom prompt from a file (verified authors only)')
    .addHelpText(
      'after',
      `
Examples:
  # Test a package (single query)
  $ prpm playground --package @anthropic/code-reviewer --input "Review this code: console.log('hello')"

  # Interactive mode for multi-turn conversation
  $ prpm playground --package @anthropic/brainstorm-assistant --interactive

  # Compare with and without the package prompt
  $ prpm playground --package @user/custom-prompt --input "Test input" --compare

  # Use a different model
  $ prpm playground --package @user/prompt --model opus --input "Complex task requiring Opus"
  $ prpm playground --package @user/prompt --model gpt-4o --input "Test with GPT-4o"

  # Test specific version
  $ prpm playground --package @user/prompt --version 1.2.0 --input "Test input"

  # Use a custom prompt string (verified authors only)
  $ prpm playground --custom "You are a helpful coding assistant" --input "Explain async/await"

  # Load custom prompt from a file (verified authors only)
  $ prpm playground --prompt-file ./my-prompt.txt --input "Test input"

  # Compare custom prompt against baseline (no prompt)
  $ prpm playground --custom "You are concise" --input "Explain recursion" --compare
  $ prpm playground --prompt-file ./my-prompt.txt --input "Test" --compare

  # Interactive mode with custom prompt from file
  $ prpm playground --prompt-file ./my-prompt.txt --interactive

  # Short flags for common usage
  $ prpm playground -p @user/prompt --input "Test this"
  $ prpm playground -p @user/prompt -i

Available Models:
  sonnet       - Claude 3.5 Sonnet (default, balanced performance)
  opus         - Claude 3 Opus (most capable, higher cost)
  gpt-4o       - GPT-4o (OpenAI's latest)
  gpt-4o-mini  - GPT-4o Mini (faster, cheaper)
  gpt-4-turbo  - GPT-4 Turbo

Custom Prompts:
  - Available to verified authors (link your GitHub account)
  - Cost 2x normal credits (no prompt caching)
  - Min 10 characters, max 50,000 characters
  - Perfect for iterating on prompt files locally

Note: Playground usage requires credits. Run 'prpm credits' to check balance.
`
    )
    .action(async (options: PlaygroundOptions) => {
      await handlePlayground(options);
    });

  return command;
}
