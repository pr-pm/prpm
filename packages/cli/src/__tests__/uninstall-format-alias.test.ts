import * as fs from 'fs/promises';
import * as path from 'path';
import { handleUninstall } from '../commands/uninstall';
import { readLockfile, removePackage, getLockfileKey } from '../core/lockfile';

jest.mock('../core/lockfile', () => {
  const actual = jest.requireActual('../core/lockfile');
  return {
    ...actual,
    readLockfile: jest.fn(),
    removePackage: jest.fn(),
  };
});

describe('uninstall command format alias', () => {
  const readLockfileMock = readLockfile as jest.MockedFunction<typeof readLockfile>;
  const removePackageMock = removePackage as jest.MockedFunction<typeof removePackage>;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(process.cwd(), '.uninstall-test-'));
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
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
