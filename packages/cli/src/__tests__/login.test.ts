import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, type MockedFunction, type MockInstance } from 'vitest';
/**
 * Tests for login command
 */

import { handleLogin } from '../commands/login';
import { CLIError } from '../core/errors';

// Mock dependencies
vi.mock('../core/user-config');
vi.mock('../core/telemetry', () => ({
  telemetry: {
    track: vi.fn(),
    shutdown: vi.fn(),
  },
}));

describe('login command', () => {
  beforeEach(() => {
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation();
    vi.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('login flow', () => {
    it('should handle login errors and throw CLIError', async () => {
      // Login will fail in test environment since there's no real OAuth implementation
      await expect(handleLogin({})).rejects.toThrow(CLIError);

      // Verify error message includes helpful information
      try {
        await handleLogin({});
      } catch (err) {
        expect(err).toBeInstanceOf(CLIError);
        if (err instanceof CLIError) {
          expect(err.message).toContain('Login failed');
        }
      }
    });
  });
});
