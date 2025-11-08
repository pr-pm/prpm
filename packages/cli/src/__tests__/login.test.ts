/**
 * Tests for login command
 */

import { handleLogin } from '../commands/login';
import { CLIError } from '../core/errors';

// Mock dependencies
jest.mock('../core/user-config');
jest.mock('../core/telemetry', () => ({
  telemetry: {
    track: jest.fn(),
    shutdown: jest.fn(),
  },
}));

describe('login command', () => {
  beforeEach(() => {
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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
