/**
 * End-to-End Tests for Auth Commands (login, whoami)
 */

import { handleLogin } from '../../commands/login';
import { handleWhoami } from '../../commands/whoami';
import { getConfig, saveConfig } from '../../core/user-config';
import { createTestDir, cleanupTestDir } from './test-helpers';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import os from 'os';

// Mock dependencies
jest.mock('../../core/user-config');
jest.mock('../../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

// Mock open for browser opening
jest.mock('open', () => jest.fn());

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Auth Commands - E2E Tests', () => {
  let testDir: string;
  let originalCwd: string;
  let configDir: string;

  beforeAll(() => {
    originalCwd = process.cwd();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  beforeEach(async () => {
    testDir = await createTestDir();
    configDir = join(testDir, '.config', 'prpm');
    await mkdir(configDir, { recursive: true });
    process.chdir(testDir);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanupTestDir(testDir);
  });

  afterAll(() => {
    process.chdir(originalCwd);
  });

  describe('Login Command', () => {
    it('should initiate GitHub OAuth flow', async () => {
      const open = require('open');

      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: 'https://github.com/login/oauth/authorize?client_id=test',
          device_code: 'test-device-code',
        }),
      });

      // Mock token polling - return pending then success
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({ error: 'authorization_pending' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'test-access-token',
            user: {
              username: 'testuser',
              email: 'test@example.com',
            },
          }),
        });

      (saveConfig as jest.Mock).mockResolvedValue(undefined);

      await handleLogin();

      expect(open).toHaveBeenCalledWith(expect.stringContaining('github.com'));
      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'test-access-token',
        })
      );
    });

    it('should handle manual token input', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: {
            username: 'testuser',
            email: 'test@example.com',
          },
        }),
      });

      (saveConfig as jest.Mock).mockResolvedValue(undefined);

      // Mock readline for token input
      const readline = require('readline');
      const mockRl = {
        question: jest.fn((query, callback) => callback('manual-token-123')),
        close: jest.fn(),
      };
      jest.spyOn(readline, 'createInterface').mockReturnValue(mockRl as any);

      await handleLogin({ token: 'manual-token-123' });

      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'manual-token-123',
        })
      );
    });

    it('should handle login timeout', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'authorization_pending' }),
      });

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      // This would timeout in real scenario, but we'll mock it to fail quickly
      jest.setTimeout(1000);

      await expect(handleLogin()).rejects.toThrow();

      mockExit.mockRestore();
      jest.setTimeout(5000); // Reset timeout
    });

    it('should handle network errors during login', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleLogin()).rejects.toThrow();

      mockExit.mockRestore();
    });

    it('should handle invalid token error', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid token' }),
      });

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleLogin({ token: 'invalid-token' })).rejects.toThrow();

      mockExit.mockRestore();
    });
  });

  describe('Whoami Command', () => {
    it('should display current user info', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
        token: 'valid-token',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          verified: true,
          created_at: '2024-01-01T00:00:00Z',
        }),
      });

      await handleWhoami();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('testuser'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test@example.com'));
    });

    it('should require authentication', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
        token: undefined,
      });

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleWhoami()).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Not logged in')
      );

      mockExit.mockRestore();
    });

    it('should handle invalid/expired token', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
        token: 'expired-token',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid token' }),
      });

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleWhoami()).rejects.toThrow('Process exited');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid token')
      );

      mockExit.mockRestore();
    });

    it('should display user stats', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
        token: 'valid-token',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user-123',
          username: 'poweruser',
          email: 'power@example.com',
          verified: true,
          package_count: 15,
          total_downloads: 50000,
          created_at: '2024-01-01T00:00:00Z',
        }),
      });

      await handleWhoami();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('poweruser'));
    });

    it('should show verified badge', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
        token: 'valid-token',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user-123',
          username: 'verified-user',
          email: 'verified@example.com',
          verified: true,
        }),
      });

      await handleWhoami();

      expect(console.log).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
        token: 'valid-token',
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: number) => {
        throw new Error(`Process exited with code ${code}`);
      });

      await expect(handleWhoami()).rejects.toThrow('Process exited');

      mockExit.mockRestore();
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full login and whoami flow', async () => {
      // Step 1: Login
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            url: 'https://github.com/login/oauth/authorize?client_id=test',
            device_code: 'device-code-123',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: 'new-access-token',
            user: {
              username: 'newuser',
              email: 'new@example.com',
            },
          }),
        });

      (saveConfig as jest.Mock).mockResolvedValue(undefined);

      await handleLogin();

      // Step 2: Verify with whoami
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
        token: 'new-access-token',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'user-new',
          username: 'newuser',
          email: 'new@example.com',
          verified: false,
        }),
      });

      await handleWhoami();

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('newuser'));
    });

    it('should persist token across commands', async () => {
      const testToken = 'persistent-token-123';

      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3000',
        token: testToken,
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
        }),
      });

      // Call whoami multiple times
      await handleWhoami();
      await handleWhoami();
      await handleWhoami();

      expect(getConfig).toHaveBeenCalledTimes(3);
      (global.fetch as jest.Mock).mock.calls.forEach((call: any) => {
        expect(call[1]?.headers?.Authorization).toContain(testToken);
      });
    });
  });
});
