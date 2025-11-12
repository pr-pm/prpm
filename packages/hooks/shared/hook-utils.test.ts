import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  getFilePath,
  getCommand,
  getContent,
  hasExtension,
  matchesPattern,
  getTimestamp,
} from './hook-utils';
import type { HookInput } from './types';

describe('hook-utils', () => {
  describe('getFilePath', () => {
    it('should extract file_path from input.file_path', () => {
      const input: HookInput = {
        input: { file_path: '/path/to/file.ts' },
      };
      expect(getFilePath(input)).toBe('/path/to/file.ts');
    });

    it('should return undefined if no file_path exists', () => {
      const input: HookInput = {
        input: { command: 'echo test' },
      };
      expect(getFilePath(input)).toBeUndefined();
    });

    it('should return undefined if input is empty', () => {
      const input: HookInput = {};
      expect(getFilePath(input)).toBeUndefined();
    });
  });

  describe('getCommand', () => {
    it('should extract command from input.command', () => {
      const input: HookInput = {
        input: { command: 'npm install' },
      };
      expect(getCommand(input)).toBe('npm install');
    });

    it('should return undefined if no command exists', () => {
      const input: HookInput = {
        input: { file_path: '/path/to/file.ts' },
      };
      expect(getCommand(input)).toBeUndefined();
    });
  });

  describe('getContent', () => {
    it('should extract content from input.content', () => {
      const input: HookInput = {
        input: { content: 'const x = 1;' },
      };
      expect(getContent(input)).toBe('const x = 1;');
    });

    it('should extract new_string from input.new_string', () => {
      const input: HookInput = {
        input: { new_string: 'const y = 2;' },
      };
      expect(getContent(input)).toBe('const y = 2;');
    });

    it('should return undefined if no content exists', () => {
      const input: HookInput = {
        input: { command: 'echo test' },
      };
      expect(getContent(input)).toBeUndefined();
    });
  });

  describe('hasExtension', () => {
    it('should return true for matching extension', () => {
      expect(hasExtension('/path/to/file.ts', ['.ts', '.js'])).toBe(true);
    });

    it('should return true for matching extension in the middle of list', () => {
      expect(hasExtension('/path/to/file.json', ['.ts', '.json', '.md'])).toBe(true);
    });

    it('should return false for non-matching extension', () => {
      expect(hasExtension('/path/to/file.py', ['.ts', '.js'])).toBe(false);
    });

    it('should handle files without extension', () => {
      expect(hasExtension('/path/to/file', ['.ts', '.js'])).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(hasExtension('/path/to/file.TS', ['.ts', '.js'])).toBe(false);
    });
  });

  describe('matchesPattern', () => {
    it('should match exact filename', () => {
      const result = matchesPattern('.env', ['.env', '.env.*']);
      expect(result.matched).toBe(true);
      expect(result.pattern).toBe('.env');
    });

    it('should match glob pattern', () => {
      const result = matchesPattern('.env.local', ['.env', '.env.*']);
      expect(result.matched).toBe(true);
      expect(result.pattern).toBe('.env.*');
    });

    it('should match wildcard patterns', () => {
      const result = matchesPattern('credentials.json', ['*credentials*']);
      expect(result.matched).toBe(true);
      expect(result.pattern).toBe('*credentials*');
    });

    it('should match path patterns', () => {
      const result = matchesPattern('.git/config', ['.git/*']);
      expect(result.matched).toBe(true);
      expect(result.pattern).toBe('.git/*');
    });

    it('should not match non-matching patterns', () => {
      const result = matchesPattern('test.ts', ['.env', '.env.*']);
      expect(result.matched).toBe(false);
      expect(result.pattern).toBeUndefined();
    });

    it('should return first matching pattern', () => {
      const result = matchesPattern('.env', ['.env', '.env.*', '*env*']);
      expect(result.matched).toBe(true);
      expect(result.pattern).toBe('.env');
    });
  });

  describe('getTimestamp', () => {
    it('should return a valid timestamp in YYYY-MM-DD HH:MM:SS format', () => {
      const timestamp = getTimestamp();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should return current time', () => {
      const before = new Date();
      const timestamp = getTimestamp();
      const after = new Date();

      // Parse the timestamp by replacing space back to T for ISO format
      const parsed = new Date(timestamp.replace(' ', 'T') + 'Z');
      expect(parsed.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000); // Allow 1s tolerance
      expect(parsed.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);
    });
  });
});
