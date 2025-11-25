/**
 * Tests for package scanner module
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { scanForPackages, getScanConfigs, DetectedPackage } from '../core/package-scanner';

describe('package-scanner', () => {
  let testDir: string;
  let originalCwd: string;

  beforeAll(() => {
    originalCwd = process.cwd();
  });

  beforeEach(async () => {
    // Create temporary directory for each test
    testDir = await mkdtemp(join(tmpdir(), 'prpm-scanner-test-'));
    process.chdir(testDir);
  });

  afterEach(async () => {
    try {
      process.chdir(originalCwd);
    } catch {
      process.chdir(tmpdir());
    }

    // Clean up test directory
    if (testDir) {
      await rm(testDir, { recursive: true, force: true });
    }
  });

  describe('scanForPackages', () => {
    it('should return empty array for empty directory', async () => {
      const packages = await scanForPackages(testDir);
      expect(packages).toEqual([]);
    });

    it('should detect cursor rules in .cursor/rules/', async () => {
      // Create cursor rules directory and file
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(
        join(testDir, '.cursor/rules/typescript-rules.mdc'),
        `---
name: typescript-rules
description: TypeScript coding standards
tags: typescript, standards
---

# TypeScript Rules

Use strict TypeScript configuration.
`
      );

      const packages = await scanForPackages(testDir);

      expect(packages).toHaveLength(1);
      expect(packages[0]).toMatchObject({
        name: 'typescript-rules',
        format: 'cursor',
        subtype: 'rule',
        description: 'TypeScript coding standards',
        tags: ['typescript', 'standards'],
        files: ['.cursor/rules/typescript-rules.mdc'],
        primaryFile: '.cursor/rules/typescript-rules.mdc',
      });
    });

    it('should detect claude skills in .claude/skills/', async () => {
      // Create claude skill directory structure
      await mkdir(join(testDir, '.claude/skills/aws-expert'), { recursive: true });
      await writeFile(
        join(testDir, '.claude/skills/aws-expert/SKILL.md'),
        `---
name: aws-expert
description: AWS deployment expertise
tags: aws, cloud, deployment
---

# AWS Expert

Expert knowledge for AWS deployments.
`
      );

      const packages = await scanForPackages(testDir);

      expect(packages).toHaveLength(1);
      expect(packages[0]).toMatchObject({
        name: 'aws-expert',
        format: 'claude',
        subtype: 'skill',
        description: 'AWS deployment expertise',
        tags: ['aws', 'cloud', 'deployment'],
      });
      expect(packages[0].primaryFile).toBe('.claude/skills/aws-expert/SKILL.md');
    });

    it('should detect claude agents in .claude/agents/', async () => {
      await mkdir(join(testDir, '.claude/agents'), { recursive: true });
      await writeFile(
        join(testDir, '.claude/agents/code-reviewer.md'),
        `---
name: code-reviewer
description: Reviews code for best practices
---

# Code Reviewer Agent

Reviews code and provides feedback.
`
      );

      const packages = await scanForPackages(testDir);

      expect(packages).toHaveLength(1);
      expect(packages[0]).toMatchObject({
        name: 'code-reviewer',
        format: 'claude',
        subtype: 'agent',
        description: 'Reviews code for best practices',
      });
    });

    it('should detect windsurf rules', async () => {
      await mkdir(join(testDir, '.windsurf/rules'), { recursive: true });
      await writeFile(
        join(testDir, '.windsurf/rules/react-patterns.md'),
        `# React Patterns

Best practices for React development.
`
      );

      const packages = await scanForPackages(testDir);

      expect(packages).toHaveLength(1);
      expect(packages[0]).toMatchObject({
        name: 'react-patterns',
        format: 'windsurf',
        subtype: 'rule',
        description: 'React Patterns',
      });
    });

    it('should detect copilot instructions', async () => {
      await mkdir(join(testDir, '.github/instructions'), { recursive: true });
      await writeFile(
        join(testDir, '.github/instructions/typescript.instructions.md'),
        `---
applyTo:
  - "**/*.ts"
---

# TypeScript Instructions

Use strict mode.
`
      );

      const packages = await scanForPackages(testDir);

      expect(packages).toHaveLength(1);
      expect(packages[0]).toMatchObject({
        name: 'typescript-instructions',
        format: 'copilot',
        subtype: 'rule',
      });
    });

    it('should detect copilot-instructions.md in .github root', async () => {
      await mkdir(join(testDir, '.github'), { recursive: true });
      await writeFile(
        join(testDir, '.github/copilot-instructions.md'),
        `# Repository Instructions

General coding guidelines.
`
      );

      const packages = await scanForPackages(testDir);

      expect(packages).toHaveLength(1);
      expect(packages[0]).toMatchObject({
        name: 'copilot-instructions',
        format: 'copilot',
        subtype: 'rule',
        primaryFile: '.github/copilot-instructions.md',
      });
    });

    it('should detect kiro steering files', async () => {
      await mkdir(join(testDir, '.kiro/steering'), { recursive: true });
      await writeFile(
        join(testDir, '.kiro/steering/testing.md'),
        `---
inclusion: always
---

# Testing Guidelines

Write comprehensive tests.
`
      );

      const packages = await scanForPackages(testDir);

      expect(packages).toHaveLength(1);
      expect(packages[0]).toMatchObject({
        name: 'testing',
        format: 'kiro',
        subtype: 'rule',
      });
    });

    it('should detect root-level manifest files', async () => {
      await writeFile(
        join(testDir, '.cursorrules'),
        `# Cursor Rules

Project-wide cursor rules.
`
      );

      const packages = await scanForPackages(testDir);

      expect(packages).toHaveLength(1);
      expect(packages[0]).toMatchObject({
        format: 'cursor',
        subtype: 'rule',
        primaryFile: '.cursorrules',
        description: 'Cursor Rules',
      });
    });

    it('should detect AGENTS.md file', async () => {
      await writeFile(
        join(testDir, 'AGENTS.md'),
        `# Project Guidelines

OpenAI coding guidelines.
`
      );

      const packages = await scanForPackages(testDir);

      expect(packages).toHaveLength(1);
      expect(packages[0]).toMatchObject({
        format: 'agents.md',
        subtype: 'rule',
        primaryFile: 'AGENTS.md',
        description: 'Project Guidelines',
      });
    });

    it('should detect multiple packages from different formats', async () => {
      // Create multiple package types
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(
        join(testDir, '.cursor/rules/rule1.mdc'),
        '# Rule 1\n'
      );

      await mkdir(join(testDir, '.claude/skills/skill1'), { recursive: true });
      await writeFile(
        join(testDir, '.claude/skills/skill1/SKILL.md'),
        '---\nname: skill1\n---\n# Skill 1\n'
      );

      await mkdir(join(testDir, '.windsurf/rules'), { recursive: true });
      await writeFile(
        join(testDir, '.windsurf/rules/wind1.md'),
        '# Wind 1\n'
      );

      const packages = await scanForPackages(testDir);

      expect(packages).toHaveLength(3);

      const formats = packages.map(p => p.format).sort();
      expect(formats).toEqual(['claude', 'cursor', 'windsurf']);
    });

    it('should extract tags from frontmatter', async () => {
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(
        join(testDir, '.cursor/rules/test.mdc'),
        `---
name: test-rule
description: A test rule
tags: [tag1, tag2, tag3]
---

# Test Rule
`
      );

      const packages = await scanForPackages(testDir);

      expect(packages[0].tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should handle comma-separated tags', async () => {
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(
        join(testDir, '.cursor/rules/test.mdc'),
        `---
name: test-rule
tags: tag1, tag2, tag3
---

# Test Rule
`
      );

      const packages = await scanForPackages(testDir);

      expect(packages[0].tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    it('should use filename as name when no frontmatter', async () => {
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(
        join(testDir, '.cursor/rules/my-awesome-rule.mdc'),
        '# My Awesome Rule\n\nSome content.\n'
      );

      const packages = await scanForPackages(testDir);

      expect(packages[0].name).toBe('my-awesome-rule');
    });

    it('should use first heading as description when no frontmatter', async () => {
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      await writeFile(
        join(testDir, '.cursor/rules/test.mdc'),
        '# Descriptive Title\n\nSome content.\n'
      );

      const packages = await scanForPackages(testDir);

      expect(packages[0].description).toBe('Descriptive Title');
    });

    it('should skip directories without relevant files', async () => {
      await mkdir(join(testDir, '.cursor/rules'), { recursive: true });
      // Empty directory

      const packages = await scanForPackages(testDir);

      expect(packages).toHaveLength(0);
    });

    it('should detect claude hooks', async () => {
      await mkdir(join(testDir, '.claude/hooks/my-hook'), { recursive: true });
      await writeFile(
        join(testDir, '.claude/hooks/my-hook/hook.json'),
        JSON.stringify({
          hooks: [{
            event: 'PostToolUse',
            command: './hook.js'
          }]
        })
      );

      const packages = await scanForPackages(testDir);

      expect(packages).toHaveLength(1);
      expect(packages[0]).toMatchObject({
        name: 'my-hook',
        format: 'claude',
        subtype: 'hook',
      });
    });
  });

  describe('getScanConfigs', () => {
    it('should return all scan configurations', () => {
      const configs = getScanConfigs();

      expect(configs.length).toBeGreaterThan(0);

      // Should have cursor config
      expect(configs.some(c => c.format === 'cursor' && c.directory.includes('.cursor/rules'))).toBe(true);

      // Should have claude config
      expect(configs.some(c => c.format === 'claude' && c.directory.includes('.claude/skills'))).toBe(true);

      // Should have windsurf config
      expect(configs.some(c => c.format === 'windsurf')).toBe(true);
    });

    it('should have required fields for each config', () => {
      const configs = getScanConfigs();

      for (const config of configs) {
        expect(config).toHaveProperty('format');
        expect(config).toHaveProperty('subtype');
        expect(config).toHaveProperty('directory');
        expect(config).toHaveProperty('patterns');
        expect(config).toHaveProperty('nested');
        expect(Array.isArray(config.patterns)).toBe(true);
      }
    });
  });
});
