/**
 * End-to-End Tests for Auth Commands (login, whoami)
 */

import { handleLogin } from '../../commands/login';
import { handleWhoami } from '../../commands/whoami';
import { getConfig, saveConfig } from '../../core/user-config';
import { getRegistryClient } from '@pr-pm/registry-client';
import { createTestDir, cleanupTestDir } from './test-helpers';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import os from 'os';
import { CLIError } from '../../core/errors';

// Mock dependencies
jest.mock('../../core/user-config');
jest.mock('@pr-pm/registry-client');
jest.mock('../../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

// Mock open for browser opening (virtual mock since 'open' isn't installed)
jest.mock('open', () => jest.fn(), { virtual: true });

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
    it.skip('should initiate GitHub OAuth flow', async () => {
      const open = require('open');

      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3111',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          url: 'https://github.com/login/oauth/authorize?client_id=test',
          device_code: 'test-device-code',
          connectSessionToken: 'test-session-token',
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

      await handleLogin({});

      expect(open).toHaveBeenCalledWith(expect.stringContaining('github.com'));
      expect(saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          token: 'test-access-token',
        })
      );
    });

    it('should handle manual token input', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3111',
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
        registryUrl: 'http://localhost:3111',
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ error: 'authorization_pending' }),
      });

      // This would timeout in real scenario, but we'll mock it to fail quickly
      jest.setTimeout(1000);

      await expect(handleLogin()).rejects.toThrow();

      jest.setTimeout(5000); // Reset timeout
    });

    it('should handle network errors during login', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3111',
      });

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(handleLogin()).rejects.toThrow();
    });

    it('should handle invalid token error', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3111',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid token' }),
      });

      await expect(handleLogin({ token: 'invalid-token' })).rejects.toThrow();
    });
  });

  describe('Whoami Command', () => {
    it('should display current user info', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3111',
        token: 'valid-token',
        username: 'testuser',
      });

      const mockClient = {
        getUserProfile: jest.fn().mockResolvedValue({
          id: 'user-123',
          username: 'testuser',
          email: 'test@example.com',
          verified_author: true,
          created_at: '2024-01-01T00:00:00Z',
        }),
      };

      (getRegistryClient as jest.Mock).mockReturnValue(mockClient);

      await handleWhoami();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('testuser'));

      logSpy.mockRestore();
    });

    it('should require authentication', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3111',
        token: undefined,
      });

      await handleWhoami();

      expect(logSpy).toHaveBeenCalledWith('Not logged in');

      logSpy.mockRestore();
    });

    it('should handle invalid/expired token', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3111',
        token: 'expired-token',
        username: 'testuser',
      });

      const mockClient = {
        getUserProfile: jest.fn().mockRejectedValue(new Error('Unauthorized')),
      };

      (getRegistryClient as jest.Mock).mockReturnValue(mockClient);

      await handleWhoami();

      // Should fallback to simple username display
      expect(logSpy).toHaveBeenCalledWith('testuser');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('token may be outdated'));

      logSpy.mockRestore();
    });

    it('should display user stats', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3111',
        token: 'valid-token',
        username: 'poweruser',
      });

      const mockClient = {
        getUserProfile: jest.fn().mockResolvedValue({
          id: 'user-123',
          username: 'poweruser',
          email: 'power@example.com',
          verified_author: true,
          stats: {
            total_packages: 15,
            total_downloads: 50000,
          },
          created_at: '2024-01-01T00:00:00Z',
        }),
      };

      (getRegistryClient as jest.Mock).mockReturnValue(mockClient);

      await handleWhoami();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('poweruser'));

      logSpy.mockRestore();
    });

    it('should show verified badge', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3111',
        token: 'valid-token',
        username: 'verified-user',
      });

      const mockClient = {
        getUserProfile: jest.fn().mockResolvedValue({
          id: 'user-123',
          username: 'verified-user',
          email: 'verified@example.com',
          verified_author: true,
        }),
      };

      (getRegistryClient as jest.Mock).mockReturnValue(mockClient);

      await handleWhoami();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));

      logSpy.mockRestore();
    });

    it('should handle network errors', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3111',
        token: 'valid-token',
        username: 'testuser',
      });

      const mockClient = {
        getUserProfile: jest.fn().mockRejectedValue(new Error('Network error')),
      };

      (getRegistryClient as jest.Mock).mockReturnValue(mockClient);

      await handleWhoami();

      // Should fallback to simple username display
      expect(logSpy).toHaveBeenCalledWith('testuser');

      logSpy.mockRestore();
    });
  });

  describe('Authentication Flow', () => {
    it.skip('should complete full login and whoami flow', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      // Step 1: Login
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3111',
      });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            url: 'https://github.com/login/oauth/authorize?client_id=test',
            device_code: 'device-code-123',
            connectSessionToken: 'test-session-token',
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

      await handleLogin({});

      // Step 2: Verify with whoami
      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3111',
        token: 'new-access-token',
        username: 'newuser',
      });

      const mockClient = {
        getUserProfile: jest.fn().mockResolvedValue({
          id: 'user-new',
          username: 'newuser',
          email: 'new@example.com',
          verified_author: false,
        }),
      };

      (getRegistryClient as jest.Mock).mockReturnValue(mockClient);

      await handleWhoami();

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('newuser'));

      logSpy.mockRestore();
    });

    it('should persist token across commands', async () => {
      const testToken = 'persistent-token-123';

      (getConfig as jest.Mock).mockResolvedValue({
        registryUrl: 'http://localhost:3111',
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
