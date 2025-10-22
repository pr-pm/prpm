#!/usr/bin/env node
/**
 * Convert a single Claude skill to Cursor rule format
 * Usage: node scripts/convert-skill-to-cursor.mjs <skill-file-path>
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, basename, join } from 'path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node convert-skill-to-cursor.mjs <skill-file-path>');
  process.exit(1);
}

const skillPath = args[0];
const skillContent = readFileSync(skillPath, 'utf-8');

// Parse skill frontmatter and content
const match = skillContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!match) {
  console.error('Invalid skill format: missing frontmatter');
  process.exit(1);
}

const [, frontmatter, content] = match;

// Parse frontmatter
const metadata = {};
frontmatter.split('\n').forEach(line => {
  const [key, ...values] = line.split(':');
  if (key && values.length) {
    metadata[key.trim()] = values.join(':').trim();
  }
});

const skillName = metadata.name || basename(skillPath, '.md');
const description = metadata.description || '';

// Determine rule type
const ruleType = determineRuleType(skillName, content);
const alwaysApply = ruleType === 'always';

// Generate Cursor rule
const cursorRule = `---
ruleType: ${ruleType}
alwaysApply: ${alwaysApply}
description: ${description}
source: claude-code-skill
skill: ${skillName}
---

${content.trim()}

---

**Converted from:** Claude Code Skill - ${skillName}
**Format:** Cursor Rules (.mdc)
`;

// Write output
const outputDir = join(dirname(skillPath), '../../.cursor/rules');
mkdirSync(outputDir, { recursive: true });

const outputPath = join(outputDir, `${skillName}.mdc`);
writeFileSync(outputPath, cursorRule);

console.log(`✅ Converted: ${skillPath} → ${outputPath}`);
console.log(`   Rule type: ${ruleType}`);
console.log(`   Always apply: ${alwaysApply}`);

function determineRuleType(name, content) {
  const lower = content.toLowerCase();

  // Always apply rules
  if (name.includes('test-driven') || lower.includes('always use')) {
    return 'always';
  }

  // Conditional rules
  if (name.includes('code-review') || name.includes('brainstorm')) {
    return 'conditional';
  }

  return 'contextual';
}
