#!/usr/bin/env node
/**
 * Convert a Cursor rule back to Claude skill format
 * Usage: node scripts/convert-cursor-to-skill.mjs <cursor-rule-path>
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, basename, join } from 'path';

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node convert-cursor-to-skill.mjs <cursor-rule-path>');
  process.exit(1);
}

const rulePath = args[0];
const ruleContent = readFileSync(rulePath, 'utf-8');

// Parse Cursor rule frontmatter and content
const match = ruleContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!match) {
  console.error('Invalid Cursor rule format: missing frontmatter');
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

const skillName = metadata.skill || basename(rulePath, '.mdc');
const description = metadata.description || '';

// Extract main content (remove conversion footer if present)
const mainContent = content.replace(/---\n\n\*\*Converted from:.*$/s, '').trim();

// Determine tools based on content
const tools = extractTools(mainContent);

// Generate Claude skill
const claudeSkill = `---
name: ${skillName}
description: ${description}
tools: ${tools.join(', ')}
---

${mainContent}
`;

// Write output
const outputDir = join(dirname(rulePath), '../../.claude/skills');
mkdirSync(outputDir, { recursive: true });

const outputPath = join(outputDir, `${skillName}-converted.md`);
writeFileSync(outputPath, claudeSkill);

console.log(`✅ Converted: ${rulePath} → ${outputPath}`);
console.log(`   Skill name: ${skillName}`);
console.log(`   Tools: ${tools.join(', ')}`);

function extractTools(content) {
  const tools = new Set(['Read', 'Write', 'Edit']);

  if (content.toLowerCase().includes('search') || content.toLowerCase().includes('grep')) {
    tools.add('Grep');
  }
  if (content.toLowerCase().includes('web') || content.toLowerCase().includes('fetch')) {
    tools.add('WebFetch');
  }
  if (content.toLowerCase().includes('bash') || content.toLowerCase().includes('command')) {
    tools.add('Bash');
  }
  if (content.toLowerCase().includes('todo') || content.toLowerCase().includes('task')) {
    tools.add('TodoWrite');
  }

  return Array.from(tools);
}
