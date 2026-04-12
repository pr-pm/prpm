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

  describe('multi-format --as', () => {
    it('rejects when any comma-separated token is invalid', async () => {
      const cmd = createInstallCommand();
      cmd.exitOverride();

      const run = cmd.parseAsync(
        ['node', 'prpm', 'install', 'pkg', '--as', 'claude,nope'],
        { from: 'user' },
      );

      await expect(run).rejects.toThrow(CLIError);
      await expect(run).rejects.toThrow(/Format must be one of/);
    });

    it('rejects --as values that parse to zero usable tokens (commas/whitespace only)', async () => {
      for (const malformed of [',', ' , ,', '  ', ',,,']) {
        const cmd = createInstallCommand();
        cmd.exitOverride();

        const run = cmd.parseAsync(
          ['node', 'prpm', 'install', 'pkg', '--as', malformed],
          { from: 'user' },
        );

        await expect(run).rejects.toThrow(CLIError);
        await expect(run).rejects.toThrow(/--as requires at least one format/);
      }
    });

    it('rejects multi-format --as when installing from lockfile (no package spec)', async () => {
      const cmd = createInstallCommand();
      cmd.exitOverride();

      const run = cmd.parseAsync(
        ['--as', 'claude,codex'],
        { from: 'user' },
      );

      await expect(run).rejects.toThrow(CLIError);
      await expect(run).rejects.toThrow(/Multi-format --as is not supported when installing from prpm.lock/);
    });
  });
});
