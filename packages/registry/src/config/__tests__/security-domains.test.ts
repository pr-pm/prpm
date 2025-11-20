/**
 * Unit tests for security domain validation
 */

import { describe, it, expect } from 'vitest';
import { isAllowedWebFetchDomain, getAllowedTools, TASK_TOOL_CONFIG } from '../security-domains.js';

describe('isAllowedWebFetchDomain', () => {
  describe('Allowed domains', () => {
    it('should allow exact domain matches', () => {
      expect(isAllowedWebFetchDomain('https://github.com')).toBe(true);
      expect(isAllowedWebFetchDomain('https://docs.anthropic.com')).toBe(true);
      expect(isAllowedWebFetchDomain('https://news.ycombinator.com')).toBe(true);
      expect(isAllowedWebFetchDomain('https://stackoverflow.com')).toBe(true);
    });

    it('should allow subdomains of allowlisted domains', () => {
      expect(isAllowedWebFetchDomain('https://api.github.com')).toBe(true);
      expect(isAllowedWebFetchDomain('https://raw.githubusercontent.com')).toBe(true);
      expect(isAllowedWebFetchDomain('https://en.wikipedia.org')).toBe(true);
      expect(isAllowedWebFetchDomain('https://subdomain.github.com')).toBe(true);
    });

    it('should allow HTTP and HTTPS protocols', () => {
      expect(isAllowedWebFetchDomain('http://github.com')).toBe(true);
      expect(isAllowedWebFetchDomain('https://github.com')).toBe(true);
    });

    it('should allow URLs with paths and query parameters', () => {
      expect(isAllowedWebFetchDomain('https://github.com/anthropics/claude')).toBe(true);
      expect(isAllowedWebFetchDomain('https://stackoverflow.com/questions/12345?tab=votes')).toBe(true);
      expect(isAllowedWebFetchDomain('https://news.ycombinator.com/item?id=12345678')).toBe(true);
    });

    it('should allow URLs with ports', () => {
      expect(isAllowedWebFetchDomain('https://github.com:443/path')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isAllowedWebFetchDomain('https://GITHUB.COM')).toBe(true);
      expect(isAllowedWebFetchDomain('https://GitHub.com')).toBe(true);
      expect(isAllowedWebFetchDomain('https://NEWS.YCOMBINATOR.COM')).toBe(true);
    });
  });

  describe('Blocked domains', () => {
    it('should block non-allowlisted domains', () => {
      expect(isAllowedWebFetchDomain('https://evil.com')).toBe(false);
      expect(isAllowedWebFetchDomain('https://attacker-site.net')).toBe(false);
      expect(isAllowedWebFetchDomain('https://malicious.io')).toBe(false);
    });

    it('should block localhost and internal IPs', () => {
      expect(isAllowedWebFetchDomain('http://localhost')).toBe(false);
      expect(isAllowedWebFetchDomain('http://127.0.0.1')).toBe(false);
      expect(isAllowedWebFetchDomain('http://192.168.1.1')).toBe(false);
      expect(isAllowedWebFetchDomain('http://10.0.0.1')).toBe(false);
      expect(isAllowedWebFetchDomain('http://172.16.0.1')).toBe(false);
    });

    it('should block similar-looking domains', () => {
      // Domain typosquatting attempts
      expect(isAllowedWebFetchDomain('https://githubcom.com')).toBe(false);
      expect(isAllowedWebFetchDomain('https://github-com.evil.com')).toBe(false);
      expect(isAllowedWebFetchDomain('https://fakegithub.com')).toBe(false);
    });

    it('should not allow subdomains to bypass rules', () => {
      // evil.com is not in allowlist, so evil.github.com should fail
      // (github.com is allowed, but this is backwards)
      expect(isAllowedWebFetchDomain('https://github.com.evil.com')).toBe(false);
    });

    it('should block file:// protocol', () => {
      expect(isAllowedWebFetchDomain('file:///etc/passwd')).toBe(false);
    });

    it('should block data: URLs', () => {
      expect(isAllowedWebFetchDomain('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('should block javascript: URLs', () => {
      expect(isAllowedWebFetchDomain('javascript:alert(1)')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid URLs gracefully', () => {
      expect(isAllowedWebFetchDomain('not a url')).toBe(false);
      expect(isAllowedWebFetchDomain('')).toBe(false);
      expect(isAllowedWebFetchDomain('http://')).toBe(false);
      expect(isAllowedWebFetchDomain('://missing-protocol.com')).toBe(false);
    });

    it('should handle URL-like strings that are not valid', () => {
      // Note: 'https:/github.com' is actually valid (treated as path) but domain is /github.com
      // This test documents current behavior - may want to add stricter validation later
      expect(isAllowedWebFetchDomain('https//github.com')).toBe(false); // missing colon
      expect(isAllowedWebFetchDomain('htp://github.com')).toBe(false); // typo in protocol
    });

    it('should handle international domain names', () => {
      // IDN domains - should be blocked unless explicitly in allowlist
      expect(isAllowedWebFetchDomain('https://münchen.de')).toBe(false);
    });
  });

  describe('SSRF protection', () => {
    it('should block cloud metadata endpoints', () => {
      expect(isAllowedWebFetchDomain('http://169.254.169.254/latest/meta-data/')).toBe(false);
      expect(isAllowedWebFetchDomain('http://metadata.google.internal')).toBe(false);
    });

    it('should block private network ranges', () => {
      expect(isAllowedWebFetchDomain('http://192.168.0.1')).toBe(false);
      expect(isAllowedWebFetchDomain('http://10.0.0.1')).toBe(false);
      expect(isAllowedWebFetchDomain('http://172.16.0.1')).toBe(false);
    });
  });
});

describe('getAllowedTools', () => {
  it('should return no tools for prompt subtype', () => {
    const tools = getAllowedTools('prompt');
    expect(tools).toEqual([]);
  });

  it('should return no tools for rule subtype', () => {
    const tools = getAllowedTools('rule');
    expect(tools).toEqual([]);
  });

  it('should return WebFetch, WebSearch, Skill for skill subtype', () => {
    const tools = getAllowedTools('skill');
    expect(tools).toContain('WebFetch');
    expect(tools).toContain('WebSearch');
    expect(tools).toContain('Skill');
    expect(tools).not.toContain('Task');
  });

  it('should return WebFetch, WebSearch, Skill for slash-command subtype', () => {
    const tools = getAllowedTools('slash-command');
    expect(tools).toContain('WebFetch');
    expect(tools).toContain('WebSearch');
    expect(tools).toContain('Skill');
  });

  it('should return WebFetch, WebSearch, Task for agent subtype', () => {
    const tools = getAllowedTools('agent');
    expect(tools).toContain('WebFetch');
    expect(tools).toContain('WebSearch');
    expect(tools).toContain('Task');
  });

  it('should return WebFetch for tool subtype', () => {
    const tools = getAllowedTools('tool');
    expect(tools).toContain('WebFetch');
    expect(tools.length).toBe(1);
  });

  it('should return empty array for unknown subtype', () => {
    const tools = getAllowedTools('unknown-type');
    expect(tools).toEqual([]);
  });

  it('should return empty array for template subtype', () => {
    const tools = getAllowedTools('template');
    expect(tools).toEqual([]);
  });

  it('should return empty array for collection subtype', () => {
    const tools = getAllowedTools('collection');
    expect(tools).toEqual([]);
  });
});

describe('TASK_TOOL_CONFIG', () => {
  it('should have reasonable recursion depth limit', () => {
    expect(TASK_TOOL_CONFIG.MAX_RECURSION_DEPTH).toBe(2);
    expect(TASK_TOOL_CONFIG.MAX_RECURSION_DEPTH).toBeGreaterThan(0);
    expect(TASK_TOOL_CONFIG.MAX_RECURSION_DEPTH).toBeLessThan(10);
  });

  it('should have reasonable concurrent task limit', () => {
    expect(TASK_TOOL_CONFIG.MAX_CONCURRENT_TASKS).toBe(5);
    expect(TASK_TOOL_CONFIG.MAX_CONCURRENT_TASKS).toBeGreaterThan(0);
    expect(TASK_TOOL_CONFIG.MAX_CONCURRENT_TASKS).toBeLessThan(20);
  });

  it('should have reasonable session task limit', () => {
    expect(TASK_TOOL_CONFIG.MAX_TASKS_PER_SESSION).toBe(10);
    expect(TASK_TOOL_CONFIG.MAX_TASKS_PER_SESSION).toBeGreaterThan(0);
    expect(TASK_TOOL_CONFIG.MAX_TASKS_PER_SESSION).toBeLessThan(100);
  });

  it('should have session limit >= concurrent limit', () => {
    expect(TASK_TOOL_CONFIG.MAX_TASKS_PER_SESSION).toBeGreaterThanOrEqual(
      TASK_TOOL_CONFIG.MAX_CONCURRENT_TASKS
    );
  });
});
