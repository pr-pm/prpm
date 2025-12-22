/**
 * Tests for GitHub package installation
 */

import { describe, it, expect } from 'vitest';
import {
  parseGitHubSpec,
  looksLikeGitHubSpec,
  formatGitHubSource,
} from '../core/github';

describe('parseGitHubSpec', () => {
  it('parses simple owner/repo format', () => {
    const result = parseGitHubSpec('anthropics/skills');
    expect(result).toEqual({
      owner: 'anthropics',
      repo: 'skills',
      ref: undefined,
      subdir: undefined,
      filePath: undefined,
    });
  });

  it('parses owner/repo@ref format', () => {
    const result = parseGitHubSpec('anthropics/skills@v1.0.0');
    expect(result).toEqual({
      owner: 'anthropics',
      repo: 'skills',
      ref: 'v1.0.0',
      subdir: undefined,
      filePath: undefined,
    });
  });

  it('parses owner/repo@branch format', () => {
    const result = parseGitHubSpec('cursor-tools/rules@main');
    expect(result).toEqual({
      owner: 'cursor-tools',
      repo: 'rules',
      ref: 'main',
      subdir: undefined,
      filePath: undefined,
    });
  });

  it('parses owner/repo:path format', () => {
    const result = parseGitHubSpec('someone/dotfiles:.cursor/rules/typescript.mdc');
    expect(result).toEqual({
      owner: 'someone',
      repo: 'dotfiles',
      ref: undefined,
      subdir: undefined,
      filePath: '.cursor/rules/typescript.mdc',
    });
  });

  it('parses owner/repo@ref:path format', () => {
    const result = parseGitHubSpec('someone/dotfiles@main:.cursor/rules/typescript.mdc');
    expect(result).toEqual({
      owner: 'someone',
      repo: 'dotfiles',
      ref: 'main',
      subdir: undefined,
      filePath: '.cursor/rules/typescript.mdc',
    });
  });

  it('parses github: prefix', () => {
    const result = parseGitHubSpec('github:anthropics/skills');
    expect(result).toEqual({
      owner: 'anthropics',
      repo: 'skills',
      ref: undefined,
      subdir: undefined,
      filePath: undefined,
    });
  });

  it('parses gh: prefix', () => {
    const result = parseGitHubSpec('gh:anthropics/skills@v2.0.0');
    expect(result).toEqual({
      owner: 'anthropics',
      repo: 'skills',
      ref: 'v2.0.0',
      subdir: undefined,
      filePath: undefined,
    });
  });

  it('parses full https URL', () => {
    const result = parseGitHubSpec('https://github.com/anthropics/skills');
    expect(result).toEqual({
      owner: 'anthropics',
      repo: 'skills',
      ref: undefined,
      subdir: undefined,
      filePath: undefined,
    });
  });

  it('parses URL with .git suffix', () => {
    const result = parseGitHubSpec('https://github.com/anthropics/skills.git');
    expect(result).toEqual({
      owner: 'anthropics',
      repo: 'skills',
      ref: undefined,
      subdir: undefined,
      filePath: undefined,
    });
  });

  it('parses subdirectory path', () => {
    const result = parseGitHubSpec('anthropics/monorepo/packages/skills');
    expect(result).toEqual({
      owner: 'anthropics',
      repo: 'monorepo',
      ref: undefined,
      subdir: 'packages/skills',
      filePath: undefined,
    });
  });

  it('returns null for invalid specs', () => {
    expect(parseGitHubSpec('just-a-name')).toBeNull();
    expect(parseGitHubSpec('')).toBeNull();
  });
});

describe('looksLikeGitHubSpec', () => {
  it('returns true for github: prefix', () => {
    expect(looksLikeGitHubSpec('github:foo/bar')).toBe(true);
    expect(looksLikeGitHubSpec('github:anthropics/skills')).toBe(true);
    expect(looksLikeGitHubSpec('github:foo/bar@v1.0.0')).toBe(true);
  });

  it('returns true for gh: prefix', () => {
    expect(looksLikeGitHubSpec('gh:foo/bar')).toBe(true);
    expect(looksLikeGitHubSpec('gh:cursor-tools/rules')).toBe(true);
  });

  it('returns true for full GitHub URLs', () => {
    expect(looksLikeGitHubSpec('https://github.com/foo/bar')).toBe(true);
    expect(looksLikeGitHubSpec('http://github.com/foo/bar')).toBe(true);
  });

  it('returns false for owner/repo without prefix (registry packages)', () => {
    expect(looksLikeGitHubSpec('anthropics/skills')).toBe(false);
    expect(looksLikeGitHubSpec('cursor-tools/rules')).toBe(false);
    expect(looksLikeGitHubSpec('foo/bar')).toBe(false);
    expect(looksLikeGitHubSpec('foo/bar@v1.0.0')).toBe(false);
  });

  it('returns false for scoped packages', () => {
    expect(looksLikeGitHubSpec('@scope/package')).toBe(false);
    expect(looksLikeGitHubSpec('@pr-pm/cli')).toBe(false);
  });

  it('returns false for simple package names', () => {
    expect(looksLikeGitHubSpec('react-rules')).toBe(false);
    expect(looksLikeGitHubSpec('some-package')).toBe(false);
  });
});

describe('formatGitHubSource', () => {
  it('formats basic spec', () => {
    const result = formatGitHubSource({ owner: 'foo', repo: 'bar' });
    expect(result).toBe('github:foo/bar');
  });

  it('formats spec with ref', () => {
    const result = formatGitHubSource({ owner: 'foo', repo: 'bar', ref: 'v1.0.0' });
    expect(result).toBe('github:foo/bar@v1.0.0');
  });

  it('formats spec with commit SHA', () => {
    const result = formatGitHubSource(
      { owner: 'foo', repo: 'bar', ref: 'main' },
      'abc123def456'
    );
    expect(result).toBe('github:foo/bar@main#abc123d');
  });

  it('formats spec with file path', () => {
    const result = formatGitHubSource({
      owner: 'foo',
      repo: 'bar',
      filePath: '.cursor/rules/test.mdc',
    });
    expect(result).toBe('github:foo/bar:.cursor/rules/test.mdc');
  });
});
