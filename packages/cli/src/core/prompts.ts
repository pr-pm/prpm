import * as readline from 'readline/promises';

/**
 * Prompt the user for a yes/no confirmation.
 * Returns false automatically when running in a non-interactive environment.
 */
export async function promptYesNo(question: string, nonInteractiveWarning?: string): Promise<boolean> {
  const stdinIsTTY = process.stdin.isTTY;
  const stdoutIsTTY = process.stdout.isTTY;

  if (stdinIsTTY === false || stdoutIsTTY === false) {
    if (nonInteractiveWarning) {
      console.log(nonInteractiveWarning);
    }
    return false;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = (await rl.question(question)).trim().toLowerCase();
    return answer === 'y' || answer === 'yes';
  } finally {
    rl.close();
  }
}
