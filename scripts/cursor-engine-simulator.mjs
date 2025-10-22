#!/usr/bin/env node
/**
 * Cursor Engine Simulator
 * Simulates how Cursor detects and loads .cursor/rules/*.mdc files
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class CursorEngineSimulator {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.rulesDir = join(projectRoot, '.cursor/rules');
    this.rules = [];
  }

  /**
   * Discover all rules in .cursor/rules directory
   */
  discoverRules() {
    if (!existsSync(this.rulesDir)) {
      console.log('❌ No .cursor/rules directory found');
      return [];
    }

    console.log(`🔍 Scanning ${this.rulesDir}...`);

    const files = readdirSync(this.rulesDir);
    const mdcFiles = files.filter(f => f.endsWith('.mdc'));

    console.log(`   Found ${mdcFiles.length} .mdc files`);

    this.rules = mdcFiles.map(file => this.loadRule(join(this.rulesDir, file)));

    return this.rules.filter(r => r !== null);
  }

  /**
   * Load and parse a single rule file
   */
  loadRule(filePath) {
    try {
      const content = readFileSync(filePath, 'utf-8');

      // Parse frontmatter
      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!match) {
        console.log(`   ⚠️  Invalid format: ${filePath}`);
        return null;
      }

      const [, frontmatterStr, body] = match;

      // Parse YAML frontmatter
      const metadata = {};
      frontmatterStr.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          metadata[key] = value;
        }
      });

      const rule = {
        file: filePath,
        ruleType: metadata.ruleType || 'contextual',
        alwaysApply: metadata.alwaysApply === 'true',
        description: metadata.description || '',
        source: metadata.source || '',
        skill: metadata.skill || '',
        content: body.trim()
      };

      console.log(`   ✅ Loaded: ${metadata.skill || 'unknown'} (${rule.ruleType})`);

      return rule;
    } catch (error) {
      console.error(`   ❌ Error loading ${filePath}:`, error.message);
      return null;
    }
  }

  /**
   * Get rules that should be applied for a given context
   */
  getApplicableRules(context = {}) {
    const applicable = [];

    for (const rule of this.rules) {
      if (rule.alwaysApply) {
        applicable.push(rule);
        continue;
      }

      if (rule.ruleType === 'conditional' && this.shouldApplyConditional(rule, context)) {
        applicable.push(rule);
        continue;
      }

      if (rule.ruleType === 'contextual' && this.shouldApplyContextual(rule, context)) {
        applicable.push(rule);
      }
    }

    return applicable;
  }

  /**
   * Determine if conditional rule should apply
   */
  shouldApplyConditional(rule, context) {
    // Code review rules
    if (rule.skill?.includes('code-review') && context.isCodeReview) {
      return true;
    }

    // Brainstorming rules
    if (rule.skill?.includes('brainstorm') && context.isBrainstorming) {
      return true;
    }

    return false;
  }

  /**
   * Determine if contextual rule should apply
   */
  shouldApplyContextual(rule, context) {
    // File-based context
    if (context.file) {
      const ext = context.file.split('.').pop();

      // Git-related rules
      if (rule.skill?.includes('git') && (context.file.includes('.git') || ext === 'gitignore')) {
        return true;
      }

      // Test-related rules
      if (rule.skill?.includes('test') && (context.file.includes('test') || context.file.includes('spec'))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Resolve rule references (cross-references between rules)
   */
  resolveReferences(rule) {
    const references = [];
    const refPattern = /\.cursor\/rules\/([\w-]+)\.mdc/g;
    let match;

    while ((match = refPattern.exec(rule.content)) !== null) {
      references.push(match[1]);
    }

    return references;
  }

  /**
   * Build dependency graph of rules
   */
  buildDependencyGraph() {
    const graph = {};

    for (const rule of this.rules) {
      const refs = this.resolveReferences(rule);
      graph[rule.skill || rule.file] = {
        rule,
        references: refs,
        referencedBy: []
      };
    }

    // Build reverse references
    for (const [skillName, node] of Object.entries(graph)) {
      for (const ref of node.references) {
        if (graph[ref]) {
          graph[ref].referencedBy.push(skillName);
        }
      }
    }

    return graph;
  }

  /**
   * Print summary of loaded rules
   */
  printSummary() {
    console.log('\n📊 Rules Summary:');
    console.log(`   Total rules: ${this.rules.length}`);

    const byType = this.rules.reduce((acc, rule) => {
      acc[rule.ruleType] = (acc[rule.ruleType] || 0) + 1;
      return acc;
    }, {});

    console.log('\n   By type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    const alwaysApply = this.rules.filter(r => r.alwaysApply).length;
    console.log(`\n   Always apply: ${alwaysApply}`);

    return {
      total: this.rules.length,
      byType,
      alwaysApply
    };
  }

  /**
   * Validate all rules
   */
  validate() {
    console.log('\n🔍 Validating rules...');

    const issues = [];

    for (const rule of this.rules) {
      // Check required fields
      if (!rule.ruleType) {
        issues.push(`${rule.file}: Missing ruleType`);
      }

      if (rule.alwaysApply === undefined) {
        issues.push(`${rule.file}: Missing alwaysApply`);
      }

      if (!rule.description) {
        issues.push(`${rule.file}: Missing description`);
      }

      // Check references
      const refs = this.resolveReferences(rule);
      for (const ref of refs) {
        const refPath = join(this.rulesDir, `${ref}.mdc`);
        if (!existsSync(refPath)) {
          issues.push(`${rule.file}: References missing rule ${ref}`);
        }
      }
    }

    if (issues.length === 0) {
      console.log('   ✅ All rules valid');
    } else {
      console.log(`   ❌ Found ${issues.length} issues:`);
      issues.forEach(issue => console.log(`      - ${issue}`));
    }

    return { valid: issues.length === 0, issues };
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectRoot = process.argv[2] || process.cwd();

  console.log('🚀 Cursor Engine Simulator\n');
  console.log(`   Project root: ${projectRoot}`);

  const engine = new CursorEngineSimulator(projectRoot);

  // Discover rules
  engine.discoverRules();

  // Print summary
  engine.printSummary();

  // Validate
  const validation = engine.validate();

  // Build dependency graph
  console.log('\n🔗 Building dependency graph...');
  const graph = engine.buildDependencyGraph();

  Object.entries(graph).forEach(([name, node]) => {
    if (node.references.length > 0) {
      console.log(`   ${name} → ${node.references.join(', ')}`);
    }
  });

  // Test applicable rules
  console.log('\n📝 Testing rule application:');

  const contexts = [
    { name: 'Always apply rules', context: {} },
    { name: 'Code review', context: { isCodeReview: true } },
    { name: 'Test file', context: { file: 'test.spec.ts' } },
    { name: 'Git file', context: { file: '.gitignore' } }
  ];

  contexts.forEach(({ name, context }) => {
    const applicable = engine.getApplicableRules(context);
    console.log(`   ${name}: ${applicable.length} rules`);
    applicable.forEach(rule => {
      console.log(`      - ${rule.skill || 'unknown'}`);
    });
  });

  process.exit(validation.valid ? 0 : 1);
}

export default CursorEngineSimulator;
