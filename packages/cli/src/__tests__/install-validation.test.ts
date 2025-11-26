import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createInstallCommand } from '../commands/install';
import { CLIError } from '../core/errors';

describe('install command validation', () => {
  it('shows full format list when invalid format is provided', async () => {
    const cmd = createInstallCommand();
    cmd.exitOverride();

    const run = cmd.parseAsync(['node', 'prpm', 'install', 'pkg', '--as', 'not-a-format'], { from: 'user' });

    await expect(run).rejects.toThrow(CLIError);
    await expect(run).rejects.toThrow(/zencoder/); // ensure extended formats are listed
    await expect(run).rejects.toThrow(/gemini\.md/);
  });
});
