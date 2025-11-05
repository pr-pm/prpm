/**
 * Buy Credits command - Purchase one-time playground credits
 */

import { Command } from 'commander';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getWebappUrl } from '../utils/webapp-url';

const execAsync = promisify(exec);

interface CreditsBalance {
  balance: number;
  purchased_credits: number;
}

/**
 * Make authenticated API call
 */
async function apiCall(endpoint: string): Promise<Response> {
  const config = await getConfig();
  const baseUrl = (config.registryUrl || 'https://registry.prpm.dev').replace(/\/$/, '');

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
 * Get current credits balance
 */
async function getBalance(): Promise<CreditsBalance> {
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
 * Poll for credits balance increase
 */
async function pollForPurchase(
  initialBalance: number,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<number | null> {
  console.log('\n⏳ Waiting for purchase confirmation...');
  console.log('   (This may take a minute. Press Ctrl+C to cancel)');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    try {
      const status = await getBalance();

      if (status.balance > initialBalance) {
        return status.balance - initialBalance;
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

  return null;
}

/**
 * Handle the buy-credits command
 */
export async function handleBuyCredits(options: { package?: string }): Promise<void> {
  const startTime = Date.now();
  let success = false;
  let error: string | undefined;

  try {
    const config = await getConfig();
    if (!config.token) {
      console.error('❌ Authentication required');
      console.log('\n💡 Please login first:');
      console.log('   prpm login');
      process.exit(1);
    }

    // Get current balance
    console.log('🔍 Checking current credits balance...');
    const initialStatus = await getBalance();
    console.log(`   Current balance: ${initialStatus.balance} credits`);

    console.log('\n💰 Available credit packages:');
    console.log('   Small:   100 credits  - $5.00  ($0.05 per credit)');
    console.log('   Medium:  250 credits  - $11.25 ($0.045 per credit) - 10% savings');
    console.log('   Large:   600 credits  - $24.00 ($0.04 per credit) - 20% savings');
    console.log('\n✨ These credits never expire!');
    console.log('💡 Tip: Subscribe to PRPM+ for 100 monthly credits at just $6/month');

    // Build URL with package parameter if specified
    const webappUrl = getWebappUrl(config.registryUrl || 'https://registry.prpm.dev');
    let purchaseUrl = `${webappUrl}/playground/credits/buy`;
    if (options.package) {
      const validPackages = ['small', 'medium', 'large'];
      if (!validPackages.includes(options.package)) {
        console.error(`\n❌ Invalid package: ${options.package}`);
        console.log('   Valid options: small, medium, large');
        process.exit(1);
      }
      purchaseUrl += `?package=${options.package}`;
    }

    // Open purchase page
    console.log(`\n🌐 Opening purchase page in your browser...`);
    await openBrowser(purchaseUrl);

    // Poll for purchase confirmation
    const creditsAdded = await pollForPurchase(initialStatus.balance);

    if (creditsAdded !== null) {
      const updatedStatus = await getBalance();
      console.log('\n\n🎉 Successfully purchased credits!');
      console.log('\n📊 Credits added:');
      console.log(`   + ${creditsAdded} credits`);
      console.log(`   💳 New balance: ${updatedStatus.balance} credits`);
      console.log('\n✅ You can now:');
      console.log('   - Test packages: prpm playground <package> "<input>"');
      console.log('   - Check balance: prpm credits');
      console.log('   - View history:  prpm credits --history');
      success = true;
    } else {
      console.log('\n\n⏱️  Purchase process timed out or was canceled.');
      console.log('\n💡 If you completed the purchase, run this to verify:');
      console.log('   prpm credits');
      console.log('\n💡 Or check your transaction history:');
      console.log('   prpm credits --history');
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Purchase failed: ${error}`);
    process.exit(1);
  } finally {
    await telemetry.track({
      command: 'buy-credits',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        package: options.package,
      },
    });
    await telemetry.shutdown();
  }
}

/**
 * Create the buy-credits command
 */
export function createBuyCreditsCommand(): Command {
  const command = new Command('buy-credits');

  command
    .description('Purchase one-time playground credits (never expire)')
    .option(
      '-p, --package <package>',
      'Credit package to purchase (small, medium, large)'
    )
    .addHelpText(
      'after',
      `
Credit Packages:
  Small:   100 credits  - $5.00  ($0.05 per credit)
  Medium:  250 credits  - $11.25 ($0.045 per credit) - 10% savings
  Large:   600 credits  - $24.00 ($0.04 per credit) - 20% savings

Credits Usage:
  - Testing packages in playground uses 1-5 credits per request
  - Token-based pricing: 1 credit = 5,000 tokens
  - Model multipliers apply (Opus 5x, GPT-4o 2x, etc.)
  - Credits never expire

How it works:
  1. Opens purchase page in your browser
  2. Select package and complete payment with Stripe
  3. Credits are added to your account immediately
  4. Start testing packages right away

Examples:
  # Browse all packages
  $ prpm buy-credits

  # Pre-select a specific package
  $ prpm buy-credits --package small
  $ prpm buy-credits --package medium
  $ prpm buy-credits --package large

  # After purchase, check balance
  $ prpm credits

  # Test packages in playground
  $ prpm playground @user/prompt "test input"

💡 Better Value:
  Subscribe to PRPM+ for 100 monthly credits at just $6/month
  Run: prpm subscribe

Note: Purchased credits are one-time and never expire, unlike monthly credits.
`
    )
    .action(async (options: { package?: string }) => {
      await handleBuyCredits(options);
      process.exit(0);
    });

  return command;
}
