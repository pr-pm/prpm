/**
 * E2E Format Conversion Tests
 * Tests conversion between Claude Skills, Cursor Rules, and package formats
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

const TEST_DIR = join(process.cwd(), 'tests/e2e/fixtures/conversion-test');
const DOCKER_COMPOSE_FILE = join(process.cwd(), 'docker-compose.yml');

describe('E2E Format Conversion Tests', () => {
  beforeAll(async () => {
    // Create test directory
    await mkdir(TEST_DIR, { recursive: true });
    await mkdir(join(TEST_DIR, '.cursor/rules'), { recursive: true });
    await mkdir(join(TEST_DIR, '.claude/skills'), { recursive: true });
  });

  afterAll(async () => {
    // Cleanup
    if (existsSync(TEST_DIR)) {
      await rm(TEST_DIR, { recursive: true, force: true });
    }
  });

  describe('Claude Skill → Cursor Rule Conversion', () => {
    it('should convert Claude skill to Cursor .mdc format', async () => {
      // Create a test Claude skill
      const claudeSkill = `---
name: test-skill
description: A test skill for conversion
tools: Read, Write, Edit
---

# Test Skill

## Overview
This is a test skill for conversion testing.

## Principles
- Write clean code
- Test thoroughly
- Document well

## Workflow
1. Understand the requirements
2. Write the code
3. Test the code
4. Document the solution
`;

      const skillPath = join(TEST_DIR, '.claude/skills/test-skill.md');
      await writeFile(skillPath, claudeSkill);

      // Run conversion
      const { stdout, stderr } = await execAsync(
        `node scripts/convert-skill-to-cursor.mjs ${skillPath}`
      );

      expect(stderr).toBe('');

      // Check output file exists
      const cursorRulePath = join(TEST_DIR, '.cursor/rules/test-skill.mdc');
      expect(existsSync(cursorRulePath)).toBe(true);

      // Verify format
      const cursorRule = await readFile(cursorRulePath, 'utf-8');
      expect(cursorRule).toContain('---');
      expect(cursorRule).toContain('ruleType:');
      expect(cursorRule).toContain('description:');
      expect(cursorRule).toContain('# Test Skill');
    });

    it('should preserve skill content during conversion', async () => {
      const cursorRulePath = join(TEST_DIR, '.cursor/rules/test-skill.mdc');
      const content = await readFile(cursorRulePath, 'utf-8');

      expect(content).toContain('Write clean code');
      expect(content).toContain('Test thoroughly');
      expect(content).toContain('Document well');
      expect(content).toContain('Understand the requirements');
    });

    it('should create proper YAML frontmatter', async () => {
      const cursorRulePath = join(TEST_DIR, '.cursor/rules/test-skill.mdc');
      const content = await readFile(cursorRulePath, 'utf-8');

      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      expect(frontmatterMatch).toBeTruthy();

      const frontmatter = frontmatterMatch![1];
      expect(frontmatter).toContain('ruleType:');
      expect(frontmatter).toContain('description: A test skill for conversion');
      expect(frontmatter).toContain('source: claude-code-skill');
    });
  });

  describe('Cursor Rule Engine Detection', () => {
    it('should detect .cursor/rules directory', async () => {
      const rulesDir = join(TEST_DIR, '.cursor/rules');
      expect(existsSync(rulesDir)).toBe(true);
    });

    it('should parse .mdc file with YAML frontmatter', async () => {
      const cursorRulePath = join(TEST_DIR, '.cursor/rules/test-skill.mdc');
      const content = await readFile(cursorRulePath, 'utf-8');

      // Simulate Cursor engine parsing
      const [, frontmatter, body] = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) || [];

      expect(frontmatter).toBeTruthy();
      expect(body).toBeTruthy();

      // Parse YAML frontmatter
      const metadata: Record<string, string> = {};
      frontmatter.split('\n').forEach(line => {
        const [key, ...values] = line.split(':');
        if (key && values.length) {
          metadata[key.trim()] = values.join(':').trim();
        }
      });

      expect(metadata.ruleType).toBeTruthy();
      expect(metadata.description).toBeTruthy();
    });

    it('should identify rule type for conditional application', async () => {
      const cursorRulePath = join(TEST_DIR, '.cursor/rules/test-skill.mdc');
      const content = await readFile(cursorRulePath, 'utf-8');

      const ruleTypeMatch = content.match(/ruleType:\s*(\w+)/);
      expect(ruleTypeMatch).toBeTruthy();

      const ruleType = ruleTypeMatch![1];
      expect(['always', 'conditional', 'contextual']).toContain(ruleType);
    });

    it('should check alwaysApply flag', async () => {
      const cursorRulePath = join(TEST_DIR, '.cursor/rules/test-skill.mdc');
      const content = await readFile(cursorRulePath, 'utf-8');

      const alwaysApplyMatch = content.match(/alwaysApply:\s*(true|false)/);
      expect(alwaysApplyMatch).toBeTruthy();
    });
  });

  describe('Cursor Rule → Claude Skill Conversion', () => {
    it('should convert Cursor rule back to Claude skill', async () => {
      const cursorRulePath = join(TEST_DIR, '.cursor/rules/test-skill.mdc');

      // Run reverse conversion
      const { stdout, stderr } = await execAsync(
        `node scripts/convert-cursor-to-skill.mjs ${cursorRulePath}`
      );

      expect(stderr).toBe('');

      // Check output file
      const claudeSkillPath = join(TEST_DIR, '.claude/skills/test-skill-converted.md');
      expect(existsSync(claudeSkillPath)).toBe(true);

      const skill = await readFile(claudeSkillPath, 'utf-8');
      expect(skill).toContain('---');
      expect(skill).toContain('name:');
      expect(skill).toContain('description:');
    });

    it('should preserve rule content in converted skill', async () => {
      const claudeSkillPath = join(TEST_DIR, '.claude/skills/test-skill-converted.md');
      const content = await readFile(claudeSkillPath, 'utf-8');

      expect(content).toContain('Write clean code');
      expect(content).toContain('Test thoroughly');
      expect(content).toContain('Understand the requirements');
    });
  });

  describe('Docker Container Integration', () => {
    it('should start registry container', async () => {
      const { stdout } = await execAsync(
        'docker-compose -f docker-compose.yml up -d registry'
      );

      // Wait for container to be ready
      await new Promise(resolve => setTimeout(resolve, 5000));

      const { stdout: psOutput } = await execAsync(
        'docker-compose -f docker-compose.yml ps registry'
      );

      expect(psOutput).toContain('registry');
    }, 30000);

    it('should upload converted package to registry', async () => {
      // Create package tarball
      const packageJson = {
        name: '@pr-pm/cursor-rule-test-skill',
        version: '1.0.0',
        type: 'cursor',
        format: 'cursor-mdc',
        files: ['.cursor/rules/test-skill.mdc']
      };

      await writeFile(
        join(TEST_DIR, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Create tarball
      await execAsync(`cd ${TEST_DIR} && tar -czf test-skill.tgz .cursor/`);

      // Upload to registry
      const { stdout, stderr } = await execAsync(
        `curl -X POST http://localhost:3001/api/v1/packages \
         -H "Content-Type: application/json" \
         -d '${JSON.stringify({
           name: 'cursor-rule-test-skill',
           version: '1.0.0',
           type: 'cursor',
           description: 'Test skill converted to cursor rule',
           tarballUrl: 'http://localhost:3001/tarballs/test-skill.tgz'
         })}'`
      );

      expect(stderr).toBe('');
      const response = JSON.parse(stdout);
      expect(response.success).toBe(true);
    }, 30000);

    it('should download and verify package format', async () => {
      const { stdout } = await execAsync(
        'curl http://localhost:3001/api/v1/packages/cursor-rule-test-skill'
      );

      const pkg = JSON.parse(stdout);
      expect(pkg.name).toBe('cursor-rule-test-skill');
      expect(pkg.type).toBe('cursor');
      expect(pkg.format).toBe('cursor-mdc');
    }, 30000);

    afterAll(async () => {
      // Stop containers
      await execAsync('docker-compose -f docker-compose.yml down');
    });
  });

  describe('Cross-format Compatibility', () => {
    it('should maintain semantic equivalence across conversions', async () => {
      // Original Claude skill
      const originalSkillPath = join(TEST_DIR, '.claude/skills/test-skill.md');
      const originalSkill = await readFile(originalSkillPath, 'utf-8');

      // Converted Cursor rule
      const cursorRulePath = join(TEST_DIR, '.cursor/rules/test-skill.mdc');
      const cursorRule = await readFile(cursorRulePath, 'utf-8');

      // Back-converted Claude skill
      const convertedSkillPath = join(TEST_DIR, '.claude/skills/test-skill-converted.md');
      const convertedSkill = await readFile(convertedSkillPath, 'utf-8');

      // Extract key principles from all three
      const extractPrinciples = (content: string) => {
        const principlesMatch = content.match(/## Principles\n([\s\S]*?)(?=\n##|$)/);
        return principlesMatch ? principlesMatch[1].trim() : '';
      };

      const originalPrinciples = extractPrinciples(originalSkill);
      const cursorPrinciples = extractPrinciples(cursorRule);
      const convertedPrinciples = extractPrinciples(convertedSkill);

      // All should contain same core principles
      expect(cursorPrinciples).toContain('clean code');
      expect(convertedPrinciples).toContain('clean code');
    });

    it('should preserve metadata across conversions', async () => {
      const originalSkillPath = join(TEST_DIR, '.claude/skills/test-skill.md');
      const originalContent = await readFile(originalSkillPath, 'utf-8');
      const originalMeta = originalContent.match(/^---\n([\s\S]*?)\n---/)?.[1];

      const convertedSkillPath = join(TEST_DIR, '.claude/skills/test-skill-converted.md');
      const convertedContent = await readFile(convertedSkillPath, 'utf-8');
      const convertedMeta = convertedContent.match(/^---\n([\s\S]*?)\n---/)?.[1];

      expect(originalMeta).toContain('name: test-skill');
      expect(convertedMeta).toContain('name:');
      expect(convertedMeta).toContain('description:');
    });
  });

  describe('Rule Reference Resolution', () => {
    it('should detect cross-references in Cursor rules', async () => {
      // Create a rule with references
      const ruleWithRefs = `---
ruleType: always
alwaysApply: true
---

# Main Rule

## Integration
This rule works with:
- \`.cursor/rules/test-skill.mdc\`
- \`.cursor/rules/another-rule.mdc\`
`;

      const mainRulePath = join(TEST_DIR, '.cursor/rules/main-rule.mdc');
      await writeFile(mainRulePath, ruleWithRefs);

      const content = await readFile(mainRulePath, 'utf-8');
      const references = content.match(/\.cursor\/rules\/([\w-]+)\.mdc/g);

      expect(references).toBeTruthy();
      expect(references!.length).toBeGreaterThan(0);
      expect(references).toContain('.cursor/rules/test-skill.mdc');
    });

    it('should validate referenced rules exist', async () => {
      const mainRulePath = join(TEST_DIR, '.cursor/rules/main-rule.mdc');
      const content = await readFile(mainRulePath, 'utf-8');

      const references = content.match(/\.cursor\/rules\/([\w-]+)\.mdc/g) || [];

      for (const ref of references) {
        const refPath = join(TEST_DIR, ref);
        const exists = existsSync(refPath);

        if (ref.includes('test-skill')) {
          expect(exists).toBe(true);
        }
        // another-rule.mdc doesn't exist, should be false
        if (ref.includes('another-rule')) {
          expect(exists).toBe(false);
        }
      }
    });
  });
});
