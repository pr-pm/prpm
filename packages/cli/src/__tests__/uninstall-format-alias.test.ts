import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, type MockedFunction, type MockInstance } from 'vitest'; type Mock = ReturnType<typeof vi.fn>;
import * as fs from 'fs/promises';
import * as path from 'path';
import { handleUninstall } from '../commands/uninstall';
import { readLockfile, removePackage, getLockfileKey } from '../core/lockfile';

vi.mock('../core/lockfile', async () => {
  const actual = await vi.importActual('../core/lockfile');
  return {
    ...actual,
    readLockfile: vi.fn(),
    removePackage: vi.fn(),
  };
});

describe('uninstall command format alias', () => {
  const readLockfileMock = readLockfile as MockedFunction<typeof readLockfile>;
  const removePackageMock = removePackage as MockedFunction<typeof removePackage>;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(process.cwd(), '.uninstall-test-'));
    vi.spyOn(console, 'log').mockImplementation();
    vi.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    removePackageMock.mockReset();
    readLockfileMock.mockReset();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('accepts --as alias and uninstalls specific format', async () => {
    const packageId = '@obra/skill-brainstorming';
    const format = 'aider';
    const lockKey = getLockfileKey(packageId, format);
    const installPath = path.join(tempDir, 'CONVENTIONS.md');

    await fs.writeFile(installPath, '# test');

    readLockfileMock.mockResolvedValue({
      version: '1.0.0',
      lockfileVersion: 1,
      packages: {
        [lockKey]: {
          version: '1.0.0',
          tarballUrl: 'https://example.com',
          format,
          subtype: 'skill',
          sourceFormat: 'claude',
          installedPath: installPath,
        },
      },
      generated: new Date().toISOString(),
    });

    removePackageMock.mockResolvedValue({
      version: '1.0.0',
      tarballUrl: 'https://example.com',
      format,
      subtype: 'skill',
      sourceFormat: 'claude',
      installedPath: installPath,
    } as any);

    await handleUninstall(packageId, { as: format });

    expect(removePackageMock).toHaveBeenCalledWith(lockKey);
    await expect(fs.stat(installPath)).rejects.toHaveProperty('code', 'ENOENT');
  });
});
