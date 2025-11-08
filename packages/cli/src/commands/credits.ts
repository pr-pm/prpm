/**
 * Credits command - Check and manage playground credits
 */

import { Command } from 'commander';
import { getConfig } from '../core/user-config';
import { telemetry } from '../core/telemetry';
import { CLIError } from '../core/errors';

interface CreditsBalance {
  balance: number;
  monthly_credits: number;
  monthly_credits_used: number;
  rollover_credits: number;
  purchased_credits: number;
  rollover_expires_at?: string;
  monthly_reset_at?: string;
  prpm_plus_status?: string;
}

interface CreditTransaction {
  amount: number;
  balance_after: number;
  transaction_type: string;
  description: string;
  created_at: string;
  metadata?: any;
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
 * Display credits balance
 */
async function showBalance(): Promise<void> {
  console.log('💳 Fetching playground credits balance...\n');

  const response = await apiCall('/api/v1/playground/credits');
  const balance: CreditsBalance = await response.json() as CreditsBalance;

  console.log('═'.repeat(5));
  console.log('  PLAYGROUND CREDITS BALANCE');
  console.log('═'.repeat(5));

  // Total balance
  console.log(`\n💰 Total Balance: ${balance.balance} credits`);

  // Breakdown
  console.log('\n📊 Breakdown:');
  if (balance.monthly_credits > 0) {
    const monthlyRemaining = balance.monthly_credits - balance.monthly_credits_used;
    console.log(`   Monthly (PRPM+):    ${monthlyRemaining}/${balance.monthly_credits} credits`);
    if (balance.monthly_reset_at) {
      const resetDate = new Date(balance.monthly_reset_at).toLocaleDateString();
      console.log(`                       (Resets: ${resetDate})`);
    }
  }

  if (balance.rollover_credits > 0) {
    console.log(`   Rollover:           ${balance.rollover_credits} credits`);
    if (balance.rollover_expires_at) {
      const expiresDate = new Date(balance.rollover_expires_at).toLocaleDateString();
      console.log(`                       (Expires: ${expiresDate})`);
    }
  }

  if (balance.purchased_credits > 0) {
    console.log(`   Purchased:          ${balance.purchased_credits} credits`);
    console.log(`                       (Never expire)`);
  }

  // PRPM+ Status
  if (balance.prpm_plus_status === 'active') {
    console.log('\n✨ PRPM+ Active - You get 100 monthly credits!');
  } else {
    console.log('\n💡 Upgrade to PRPM+ for 100 monthly credits');
    console.log('   Visit: https://prpm.dev/pricing');
  }

  console.log('\n═'.repeat(5));
}

/**
 * Display recent credit transactions
 */
async function showHistory(limit: number = 10): Promise<void> {
  console.log(`💳 Fetching recent credit transactions...\n`);

  const response = await apiCall(`/api/v1/playground/credits/history?limit=${limit}`);
  const data: { transactions: CreditTransaction[] } = await response.json() as { transactions: CreditTransaction[] };

  if (data.transactions.length === 0) {
    console.log('No transaction history yet.');
    return;
  }

  console.log('═'.repeat(5));
  console.log('  CREDIT TRANSACTION HISTORY');
  console.log('═'.repeat(5));
  console.log();

  for (const tx of data.transactions) {
    const date = new Date(tx.created_at).toLocaleString();
    const amount = tx.amount >= 0 ? `+${tx.amount}` : `${tx.amount}`;
    const emoji = tx.amount >= 0 ? '💰' : '💸';

    console.log(`${emoji} ${date}`);
    console.log(`   Type:     ${tx.transaction_type}`);
    console.log(`   Amount:   ${amount} credits`);
    console.log(`   Balance:  ${tx.balance_after} credits`);
    console.log(`   Details:  ${tx.description}`);
    console.log();
  }

  console.log('═'.repeat(5));
}

/**
 * Handle the credits command
 */
export async function handleCredits(options: {
  history?: boolean;
  limit?: number;
}): Promise<void> {
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

    if (options.history) {
      await showHistory(options.limit || 10);
    } else {
      await showBalance();
    }

    console.log('\n💡 Tips:');
    console.log('   - Test packages:      prpm playground <package> "<input>"');
    console.log('   - View history:       prpm credits --history');
    console.log('   - Purchase credits:   prpm buy-credits');
    console.log('   - Subscribe to PRPM+: prpm subscribe');

    success = true;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Failed to fetch credits: ${error}`);
    throw new CLIError(`\n❌ Failed to fetch credits: ${error}`, 1);
  } finally {
    await telemetry.track({
      command: 'credits',
      success,
      error,
      duration: Date.now() - startTime,
      data: {
        showHistory: options.history || false,
      },
    });
    await telemetry.shutdown();
  }
}

/**
 * Create the credits command
 */
export function createCreditsCommand(): Command {
  const command = new Command('credits');

  command
    .description('Check playground credits balance and transaction history')
    .option('-h, --history', 'Show transaction history instead of balance', false)
    .option('-l, --limit <number>', 'Number of transactions to show in history', '10')
    .addHelpText(
      'after',
      `
Examples:
  # Check current balance
  $ prpm credits

  # View transaction history
  $ prpm credits --history

  # View last 20 transactions
  $ prpm credits --history --limit 20

Credits are used for:
  - Testing packages in the playground
  - Running prompts with AI models
  - Comparing packages against baselines

Get more credits:
  - PRPM+ subscribers get 100 monthly credits
  - Purchase additional credits at https://prpm.dev/playground/credits/buy
  - Free tier gets 5 trial credits
`
    )
    .action(async (options: { history?: boolean; limit?: string }) => {
      await handleCredits({
        history: options.history,
        limit: options.limit ? parseInt(options.limit, 10) : undefined,
      });
    });

  return command;
}
