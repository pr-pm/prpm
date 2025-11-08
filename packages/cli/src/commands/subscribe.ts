/**
 * Subscribe command - Subscribe to PRPM+ for monthly credits
 */

import { Command } from 'commander';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getWebappUrl } from '../utils/webapp-url';
import { CLIError } from '../core/errors';

const execAsync = promisify(exec);

interface CreditsBalance {
  balance: number;
  monthly_credits: number;
  prpm_plus_status?: string;
}

/**
 * Make authenticated API call
 */
async function apiCall(endpoint: string): Promise<Response> {
  const config = await getConfig();
  const baseUrl = (config.registryUrl || "https://registry.prpm.dev").replace(/\/$/, '');

  if (!config.token) {
    throw new Error('Authentication required. Please run `prpm login` first.');
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as { message?: string })) as { message?: string };
    throw new Error(errorData.message || `API request failed: ${response.statusText}`);
  }

  return response;
}

/**
 * Get current subscription status
 */
async function getSubscriptionStatus(): Promise<CreditsBalance> {
  const response = await apiCall('/api/v1/playground/credits');
  return response.json() as Promise<CreditsBalance>;
}

/**
 * Open URL in default browser
 */
async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  let command: string;

  if (platform === 'darwin') {
    command = `open "${url}"`;
  } else if (platform === 'win32') {
    command = `start "" "${url}"`;
  } else {
    // Linux and other Unix-like systems
    command = `xdg-open "${url}"`;
  }

  try {
    await execAsync(command);
  } catch (error) {
    // If automatic opening fails, just show the URL
    console.log(`\n🔗 Please open this URL in your browser:`);
    console.log(`   ${url}`);
  }
}

/**
 * Poll for subscription status change
 */
async function pollForSubscription(
  initialStatus: string | undefined,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<boolean> {
  console.log('\n⏳ Waiting for subscription confirmation...');
  console.log('   (This may take a minute. Press Ctrl+C to cancel)');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    try {
      const status = await getSubscriptionStatus();

      if (status.prpm_plus_status === 'active' && initialStatus !== 'active') {
        return true;
      }

      // Show progress indicator
      if (attempt % 5 === 0 && attempt > 0) {
        process.stdout.write('.');
      }
    } catch (error) {
      // Continue polling even if there's an error
      continue;
    }
  }

  return false;
}

/**
 * Handle the subscribe command
 */
export async function handleSubscribe(): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    const config = await getConfig();
    if (!config.token) {
      console.error('❌ Authentication required');
      console.log('\n💡 Please login first:');
      console.log('   prpm login');
      throw new CLIError('❌ Authentication required', 1);
    }

    // Get current status
    console.log('🔍 Checking current subscription status...');
    const initialStatus = await getSubscriptionStatus();

    if (initialStatus.prpm_plus_status === 'active') {
      console.log('\n✅ You are already subscribed to PRPM+!');
      console.log(`\n📊 Current benefits:`);
      console.log(`   💰 Monthly credits: ${initialStatus.monthly_credits}`);
      console.log(`   📦 Priority support`);
      console.log(`   🚀 Early access to new features`);
      console.log('\n💡 Manage your subscription at:');
      console.log('   https://prpm.dev/settings/billing');
      // Handler completes normally = success (exit 0)
      return;
    }

    console.log('\n✨ Subscribe to PRPM+ and get:');
    console.log('   💰 100 monthly playground credits');
    console.log('   ♻️  Rollover unused credits (up to 200)');
    console.log('   📦 Priority support');
    console.log('   🚀 Early access to new features');
    console.log('\n💵 Pricing:');
    console.log('   $6/month for individuals');
    console.log('   $3/month for verified organization members (50% off)');

    // Open subscription page
    const webappUrl = getWebappUrl(config.registryUrl || 'https://registry.prpm.dev');
    const subscribeUrl = `${webappUrl}/playground/credits/subscribe`;
    console.log(`\n🌐 Opening subscription page in your browser...`);
    await openBrowser(subscribeUrl);

    // Poll for subscription confirmation
    const subscribed = await pollForSubscription(initialStatus.prpm_plus_status);

    if (subscribed) {
      const updatedStatus = await getSubscriptionStatus();
      console.log('\n\n🎉 Successfully subscribed to PRPM+!');
      console.log('\n📊 Your benefits:');
      console.log(`   💰 Monthly credits: ${updatedStatus.monthly_credits}`);
      console.log(`   💳 Current balance: ${updatedStatus.balance} credits`);
      console.log('\n✅ You can now:');
      console.log('   - Test packages in playground: prpm playground <package> "<input>"');
      console.log('   - Check credits anytime: prpm credits');
      success = true;
    } else {
      console.log('\n\n⏱️  Subscription process timed out or was canceled.');
      console.log('\n💡 If you completed the subscription, run this to verify:');
      console.log('   prpm credits');
      console.log('\n💡 Or visit your account settings:');
      console.log('   https://prpm.dev/settings/billing');
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Subscription failed: ${error}`);
    throw new CLIError(`\n❌ Subscription failed: ${error}`, 1);
  } finally {
    await telemetry.track({
      command: 'subscribe',
      success,
      error,
      duration: Date.now() - startTime,
    });
    await telemetry.shutdown();
  }
}

/**
 * Create the subscribe command
 */
export function createSubscribeCommand(): Command {
  const command = new Command('subscribe');

  command
    .description('Subscribe to PRPM+ for monthly playground credits and benefits')
    .addHelpText(
      'after',
      `
PRPM+ Benefits:
  ✨ 100 monthly playground credits (worth $6+ in API costs)
  ♻️  Rollover unused credits up to 200 (1-month expiry)
  📦 Priority support and bug fixes
  🚀 Early access to new features
  💬 Access to PRPM+ community

Pricing:
  Individual:     $6/month
  Organization:   $3/month (50% discount for verified org members)

How it works:
  1. Opens subscription page in your browser
  2. Complete payment with Stripe
  3. Credits are added automatically
  4. Start testing packages immediately

Examples:
  # Subscribe to PRPM+
  $ prpm subscribe

  # After subscribing, check your credits
  $ prpm credits

  # Test packages in playground
  $ prpm playground @anthropic/assistant "Help me brainstorm ideas"

Note: You can cancel anytime from https://prpm.dev/settings/billing
`
    )
    .action(async () => {
      await handleSubscribe();
      // Handler completes normally = success (exit 0)
    });

  return command;
}
