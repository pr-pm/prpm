/**
 * Integration tests for WebFetch domain validation middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWebFetchValidationHook } from '../webfetch-validator.js';
import type { PreToolUseHookInput } from '@anthropic-ai/claude-agent-sdk';

// Mock Fastify server
const createMockServer = () => {
  const queryMock = vi.fn();

  return {
    log: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
    pg: {
      query: queryMock,
    },
    _queryMock: queryMock,
  };
};

describe('createWebFetchValidationHook', () => {
  let mockServer: any;
  let hook: any;
  const userId = 'user-123';
  const packageId = 'pkg-456';
  const sessionId = 'session-789';

  beforeEach(() => {
    mockServer = createMockServer();
    hook = createWebFetchValidationHook(mockServer, userId, packageId, sessionId);
  });

  describe('Hook filtering', () => {
    it('should only process PreToolUse events', async () => {
      const input = {
        hook_event_name: 'PostToolUse',
        session_id: sessionId,
        transcript_path: '/tmp/transcript',
        cwd: '/tmp',
        tool_name: 'WebFetch',
        tool_input: { url: 'https://github.com' },
        tool_response: 'response',
      };

      const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

      expect(result).toEqual({ continue: true });
      expect(mockServer.log.info).not.toHaveBeenCalled();
    });

    it('should only process WebFetch tool calls', async () => {
      const input: PreToolUseHookInput = {
        hook_event_name: 'PreToolUse',
        session_id: sessionId,
        transcript_path: '/tmp/transcript',
        cwd: '/tmp',
        tool_name: 'Read',
        tool_input: { file_path: '/etc/passwd' },
      };

      const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

      expect(result).toEqual({ continue: true });
      expect(mockServer.log.info).not.toHaveBeenCalled();
    });
  });

  describe('Allowed domains', () => {
    it('should allow WebFetch to allowlisted domains', async () => {
      const input: PreToolUseHookInput = {
        hook_event_name: 'PreToolUse',
        session_id: sessionId,
        transcript_path: '/tmp/transcript',
        cwd: '/tmp',
        tool_name: 'WebFetch',
        tool_input: { url: 'https://github.com' },
      };

      const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

      expect(result).toEqual({ continue: true });
      expect(mockServer.log.info).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'security_allowed_webfetch',
          userId,
          packageId,
          sessionId,
          url: 'https://github.com',
        }),
        expect.stringContaining('Allowed WebFetch')
      );
    });

    it('should allow Hacker News (news.ycombinator.com)', async () => {
      const input: PreToolUseHookInput = {
        hook_event_name: 'PreToolUse',
        session_id: sessionId,
        transcript_path: '/tmp/transcript',
        cwd: '/tmp',
        tool_name: 'WebFetch',
        tool_input: { url: 'https://news.ycombinator.com' },
      };

      const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

      expect(result).toEqual({ continue: true });
      expect(mockServer.log.info).toHaveBeenCalled();
    });

    it('should allow subdomains of allowlisted domains', async () => {
      const input: PreToolUseHookInput = {
        hook_event_name: 'PreToolUse',
        session_id: sessionId,
        transcript_path: '/tmp/transcript',
        cwd: '/tmp',
        tool_name: 'WebFetch',
        tool_input: { url: 'https://api.github.com/repos' },
      };

      const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

      expect(result).toEqual({ continue: true });
    });
  });

  describe('Blocked domains', () => {
    it('should block WebFetch to non-allowlisted domains', async () => {
      mockServer._queryMock.mockResolvedValue({ rows: [] });

      const input: PreToolUseHookInput = {
        hook_event_name: 'PreToolUse',
        session_id: sessionId,
        transcript_path: '/tmp/transcript',
        cwd: '/tmp',
        tool_name: 'WebFetch',
        tool_input: { url: 'https://evil.com' },
      };

      const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

      expect(result).toEqual({
        continue: false,
        suppressOutput: false,
      });

      expect(mockServer.log.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'security_blocked_webfetch',
          userId,
          packageId,
          sessionId,
          url: 'https://evil.com',
        }),
        expect.stringContaining('SECURITY: Blocked WebFetch')
      );
    });

    it('should block localhost', async () => {
      mockServer._queryMock.mockResolvedValue({ rows: [] });

      const input: PreToolUseHookInput = {
        hook_event_name: 'PreToolUse',
        session_id: sessionId,
        transcript_path: '/tmp/transcript',
        cwd: '/tmp',
        tool_name: 'WebFetch',
        tool_input: { url: 'http://localhost:3000' },
      };

      const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

      expect(result.continue).toBe(false);
      expect(mockServer.log.warn).toHaveBeenCalled();
    });

    it('should block private IP addresses (SSRF protection)', async () => {
      mockServer._queryMock.mockResolvedValue({ rows: [] });

      const testUrls = [
        'http://192.168.1.1',
        'http://10.0.0.1',
        'http://172.16.0.1',
        'http://127.0.0.1',
      ];

      for (const url of testUrls) {
        const input: PreToolUseHookInput = {
          hook_event_name: 'PreToolUse',
          session_id: sessionId,
          transcript_path: '/tmp/transcript',
          cwd: '/tmp',
          tool_name: 'WebFetch',
          tool_input: { url },
        };

        const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

        expect(result.continue).toBe(false);
      }
    });

    it('should block cloud metadata endpoints (SSRF protection)', async () => {
      mockServer._queryMock.mockResolvedValue({ rows: [] });

      const input: PreToolUseHookInput = {
        hook_event_name: 'PreToolUse',
        session_id: sessionId,
        transcript_path: '/tmp/transcript',
        cwd: '/tmp',
        tool_name: 'WebFetch',
        tool_input: { url: 'http://169.254.169.254/latest/meta-data/' },
      };

      const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

      expect(result.continue).toBe(false);
    });

    it('should record blocked attempts to database', async () => {
      mockServer._queryMock.mockResolvedValue({ rows: [] });

      const input: PreToolUseHookInput = {
        hook_event_name: 'PreToolUse',
        session_id: sessionId,
        transcript_path: '/tmp/transcript',
        cwd: '/tmp',
        tool_name: 'WebFetch',
        tool_input: { url: 'https://evil.com', prompt: 'Exfiltrate data' },
      };

      await hook(input, 'tool-use-id', { signal: new AbortController().signal });

      // Wait for async recording
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockServer._queryMock).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO security_blocked_webfetch_attempts'),
        expect.arrayContaining([
          userId,
          packageId,
          sessionId,
          'https://evil.com',
          expect.any(String), // JSON stringified tool_input
          expect.any(Date),
        ])
      );
    });

    it('should handle database errors gracefully when recording blocked attempts', async () => {
      mockServer._queryMock.mockRejectedValue(new Error('Database error'));

      const input: PreToolUseHookInput = {
        hook_event_name: 'PreToolUse',
        session_id: sessionId,
        transcript_path: '/tmp/transcript',
        cwd: '/tmp',
        tool_name: 'WebFetch',
        tool_input: { url: 'https://evil.com' },
      };

      // Should still block even if recording fails
      const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

      expect(result.continue).toBe(false);

      // Wait for async error logging
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockServer.log.error).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should block WebFetch calls without URL parameter', async () => {
      const input: PreToolUseHookInput = {
        hook_event_name: 'PreToolUse',
        session_id: sessionId,
        transcript_path: '/tmp/transcript',
        cwd: '/tmp',
        tool_name: 'WebFetch',
        tool_input: { prompt: 'Get some data' }, // Missing url
      };

      const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

      expect(result).toEqual({
        continue: false,
        suppressOutput: false,
      });

      expect(mockServer.log.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          packageId,
          sessionId,
        }),
        expect.stringContaining('WebFetch called without URL')
      );
    });

    it('should block invalid URLs', async () => {
      mockServer._queryMock.mockResolvedValue({ rows: [] });

      const input: PreToolUseHookInput = {
        hook_event_name: 'PreToolUse',
        session_id: sessionId,
        transcript_path: '/tmp/transcript',
        cwd: '/tmp',
        tool_name: 'WebFetch',
        tool_input: { url: 'not a valid url' },
      };

      const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

      expect(result.continue).toBe(false);
    });

    it('should handle validation errors gracefully (fail closed)', async () => {
      // Simulate error in validation logic
      const input: PreToolUseHookInput = {
        hook_event_name: 'PreToolUse',
        session_id: sessionId,
        transcript_path: '/tmp/transcript',
        cwd: '/tmp',
        tool_name: 'WebFetch',
        tool_input: null as any, // Invalid input that will cause error
      };

      const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

      // Should fail closed (block) on error
      expect(result.continue).toBe(false);
      expect(mockServer.log.error).toHaveBeenCalled();
    });
  });

  describe('Case sensitivity', () => {
    it('should handle case-insensitive domain matching', async () => {
      const urls = [
        'https://GitHub.com',
        'https://GITHUB.COM',
        'https://GiThUb.CoM',
        'https://NEWS.YCOMBINATOR.COM',
      ];

      for (const url of urls) {
        const input: PreToolUseHookInput = {
          hook_event_name: 'PreToolUse',
          session_id: sessionId,
          transcript_path: '/tmp/transcript',
          cwd: '/tmp',
          tool_name: 'WebFetch',
          tool_input: { url },
        };

        const result = await hook(input, 'tool-use-id', { signal: new AbortController().signal });

        expect(result.continue).toBe(true);
      }
    });
  });
});
