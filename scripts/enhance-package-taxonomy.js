/**
 * Enhance Package Taxonomy
 *
 * Adds standardized categories, tags, and metadata to all PRPM packages
 * Run: node scripts/enhance-package-taxonomy.js
 */

const fs = require('fs');
const path = require('path');

// Standardized tag mappings
const TAG_MAPPINGS = {
  // Programming Languages (normalize)
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'golang': 'go',
  'c++': 'cpp',
  'c#': 'csharp',
  '.net': 'dotnet',

  // Frameworks (normalize)
  'next.js': 'nextjs',
  'next': 'nextjs',
  'vue.js': 'vue',
  'vuejs': 'vue',
  'nuxt.js': 'nuxt',
  'react.js': 'react',
  'reactjs': 'react',
  'angular.js': 'angular',
  'svelte-kit': 'sveltekit',
};

// Category inference rules
const CATEGORY_RULES = [
  {
    name: 'frontend-frameworks',
    test: (pkg) => hasAny(pkg.tags, ['react', 'vue', 'angular', 'svelte', 'solid', 'astro', 'nextjs', 'nuxt', 'remix', 'gatsby']),
    subcategory: (pkg) => {
      if (hasAny(pkg.tags, ['react', 'nextjs', 'remix', 'gatsby'])) return 'react-ecosystem';
      if (hasAny(pkg.tags, ['vue', 'nuxt'])) return 'vue-ecosystem';
      if (has(pkg.tags, 'angular')) return 'angular';
      if (hasAny(pkg.tags, ['svelte', 'sveltekit'])) return 'svelte';
      return 'other';
    }
  },
  {
    name: 'backend-frameworks',
    test: (pkg) => hasAny(pkg.tags, ['backend', 'api', 'server', 'django', 'fastapi', 'flask', 'laravel', 'rails', 'express', 'nestjs', 'spring', 'springboot']),
    subcategory: (pkg) => {
      if (hasAny(pkg.tags, ['python', 'django', 'fastapi', 'flask'])) return 'python';
      if (hasAny(pkg.tags, ['nodejs', 'node', 'express', 'nestjs', 'fastify'])) return 'nodejs';
      if (hasAny(pkg.tags, ['php', 'laravel', 'wordpress', 'drupal'])) return 'php';
      if (hasAny(pkg.tags, ['ruby', 'rails'])) return 'ruby';
      if (hasAny(pkg.tags, ['java', 'spring', 'springboot'])) return 'java';
      if (has(pkg.tags, 'go')) return 'go';
      if (has(pkg.tags, 'rust')) return 'rust';
      return 'other';
    }
  },
  {
    name: 'mobile-development',
    test: (pkg) => hasAny(pkg.tags, ['mobile', 'ios', 'android', 'react-native', 'flutter', 'expo', 'swift', 'kotlin', 'ionic']),
    subcategory: (pkg) => {
      if (hasAny(pkg.tags, ['react-native', 'expo'])) return 'react-native';
      if (has(pkg.tags, 'flutter')) return 'flutter';
      if (hasAny(pkg.tags, ['swift', 'swiftui', 'ios'])) return 'ios';
      if (hasAny(pkg.tags, ['kotlin', 'android'])) return 'android';
      return 'cross-platform';
    }
  },
  {
    name: 'infrastructure',
    test: (pkg) => hasAny(pkg.tags, ['infrastructure', 'devops', 'cloud', 'kubernetes', 'docker', 'terraform', 'aws', 'gcp', 'azure', 'cicd']),
    subcategory: (pkg) => {
      if (hasAny(pkg.tags, ['kubernetes', 'k8s', 'docker', 'containers'])) return 'containers';
      if (hasAny(pkg.tags, ['aws', 'gcp', 'azure', 'cloud'])) return 'cloud';
      if (hasAny(pkg.tags, ['terraform', 'iac'])) return 'iac';
      if (hasAny(pkg.tags, ['cicd', 'deployment'])) return 'cicd';
      return 'devops';
    }
  },
  {
    name: 'data-ai',
    test: (pkg) => hasAny(pkg.tags, ['ai', 'ml', 'machine-learning', 'deep-learning', 'data-science', 'analytics', 'nlp', 'llm', 'pytorch', 'tensorflow']),
    subcategory: (pkg) => {
      if (hasAny(pkg.tags, ['llm', 'nlp', 'gpt'])) return 'llm-nlp';
      if (hasAny(pkg.tags, ['ml', 'machine-learning', 'deep-learning', 'pytorch', 'tensorflow'])) return 'machine-learning';
      if (hasAny(pkg.tags, ['data-engineering', 'etl', 'pipelines'])) return 'data-engineering';
      if (hasAny(pkg.tags, ['analytics', 'bi'])) return 'analytics';
      return 'data-science';
    }
  },
  {
    name: 'quality-testing',
    test: (pkg) => hasAny(pkg.tags, ['testing', 'test', 'qa', 'quality', 'jest', 'vitest', 'pytest', 'cypress', 'playwright', 'code-review']),
    subcategory: (pkg) => {
      if (hasAny(pkg.tags, ['unit', 'unit-testing'])) return 'unit-testing';
      if (hasAny(pkg.tags, ['e2e', 'cypress', 'playwright'])) return 'e2e-testing';
      if (hasAny(pkg.tags, ['code-review', 'quality'])) return 'code-quality';
      if (hasAny(pkg.tags, ['performance', 'optimization'])) return 'performance';
      return 'testing';
    }
  },
  {
    name: 'specialized-domains',
    test: (pkg) => hasAny(pkg.tags, ['ecommerce', 'healthcare', 'fintech', 'gaming', 'blockchain', 'web3', 'education']),
    subcategory: (pkg) => {
      if (hasAny(pkg.tags, ['ecommerce', 'shopify'])) return 'ecommerce';
      if (hasAny(pkg.tags, ['healthcare', 'hipaa'])) return 'healthcare';
      if (hasAny(pkg.tags, ['fintech', 'finance', 'payments'])) return 'fintech';
      if (hasAny(pkg.tags, ['blockchain', 'web3', 'ethereum', 'solidity'])) return 'blockchain';
      if (hasAny(pkg.tags, ['gaming', 'game', 'unity'])) return 'gaming';
      return 'other';
    }
  },
  {
    name: 'developer-experience',
    test: (pkg) => hasAny(pkg.tags, ['tooling', 'cli', 'documentation', 'refactoring', 'build', 'workflow', 'automation']),
    subcategory: (pkg) => {
      if (hasAny(pkg.tags, ['documentation', 'docs'])) return 'documentation';
      if (hasAny(pkg.tags, ['cli', 'terminal'])) return 'cli-tools';
      if (hasAny(pkg.tags, ['refactoring', 'cleanup'])) return 'refactoring';
      if (hasAny(pkg.tags, ['build', 'bundler'])) return 'build-tools';
      return 'tooling';
    }
  }
];

// Tag enhancement rules (add implied tags)
const TAG_ENHANCEMENT_RULES = [
  {
    if: ['react'],
    add: ['frontend', 'ui', 'javascript', 'web']
  },
  {
    if: ['vue'],
    add: ['frontend', 'ui', 'javascript', 'web']
  },
  {
    if: ['angular'],
    add: ['frontend', 'ui', 'typescript', 'web']
  },
  {
    if: ['nextjs'],
    add: ['react', 'frontend', 'ssr', 'fullstack', 'web']
  },
  {
    if: ['nuxt'],
    add: ['vue', 'frontend', 'ssr', 'fullstack', 'web']
  },
  {
    if: ['django'],
    add: ['python', 'backend', 'web', 'mvc', 'orm']
  },
  {
    if: ['fastapi'],
    add: ['python', 'backend', 'api', 'async']
  },
  {
    if: ['flask'],
    add: ['python', 'backend', 'web', 'microframework']
  },
  {
    if: ['laravel'],
    add: ['php', 'backend', 'web', 'mvc']
  },
  {
    if: ['rails'],
    add: ['ruby', 'backend', 'web', 'mvc']
  },
  {
    if: ['express'],
    add: ['nodejs', 'javascript', 'backend', 'web', 'api']
  },
  {
    if: ['nestjs'],
    add: ['nodejs', 'typescript', 'backend', 'api']
  },
  {
    if: ['react-native'],
    add: ['react', 'mobile', 'cross-platform', 'ios', 'android']
  },
  {
    if: ['flutter'],
    add: ['dart', 'mobile', 'cross-platform', 'ios', 'android']
  },
  {
    if: ['kubernetes'],
    add: ['infrastructure', 'containers', 'devops', 'orchestration']
  },
  {
    if: ['docker'],
    add: ['containers', 'infrastructure', 'devops']
  },
  {
    if: ['typescript'],
    add: ['javascript', 'types', 'type-safety']
  },
  {
    if: ['tailwind', 'tailwindcss'],
    add: ['css', 'styling', 'utility-first', 'frontend']
  }
];

// Helper functions
function has(arr, item) {
  return arr && arr.includes(item);
}

function hasAny(arr, items) {
  return arr && items.some(item => arr.includes(item));
}

function normalizeTags(tags) {
  if (!tags || !Array.isArray(tags)) return [];

  return tags
    .map(tag => {
      const lower = tag.toLowerCase().trim();
      return TAG_MAPPINGS[lower] || lower;
    })
    .filter((tag, index, self) => tag && self.indexOf(tag) === index); // unique, non-empty
}

function enhanceTags(tags) {
  let enhanced = [...tags];

  TAG_ENHANCEMENT_RULES.forEach(rule => {
    const hasRequired = rule.if.every(tag => enhanced.includes(tag));
    if (hasRequired) {
      rule.add.forEach(tag => {
        if (!enhanced.includes(tag)) {
          enhanced.push(tag);
        }
      });
    }
  });

  return enhanced;
}

function inferCategory(pkg) {
  for (const rule of CATEGORY_RULES) {
    if (rule.test(pkg)) {
      return {
        primary: rule.name,
        subcategory: rule.subcategory(pkg)
      };
    }
  }

  // Default category based on type
  if (pkg.type === 'agent') return { primary: 'claude-agents', subcategory: 'general' };
  if (pkg.type === 'cursor') return { primary: 'cursor-rules', subcategory: 'general' };
  if (pkg.type === 'rule') return { primary: 'windsurf-rules', subcategory: 'general' };

  return { primary: 'general', subcategory: 'other' };
}

function generateKeywords(pkg) {
  const keywords = new Set();

  // Add name words
  pkg.name.split(/[-_]/).forEach(word => keywords.add(word.toLowerCase()));

  // Add description words (important ones)
  if (pkg.description) {
    const words = pkg.description.toLowerCase()
      .match(/\b[a-z]{4,}\b/g) || [];
    words.slice(0, 10).forEach(word => keywords.add(word));
  }

  // Add all tags as keywords
  pkg.tags.forEach(tag => keywords.add(tag));

  // Add category as keyword
  if (pkg.category) {
    keywords.add(pkg.category);
    keywords.add(pkg.subcategory);
  }

  return Array.from(keywords).filter(k => k);
}

function enhancePackage(pkg) {
  // Normalize tags
  let tags = normalizeTags(pkg.tags || []);

  // Enhance tags with implied tags
  tags = enhanceTags(tags);

  // Infer category
  const category = inferCategory({ ...pkg, tags });

  // Generate keywords
  const keywords = generateKeywords({ ...pkg, tags, ...category });

  // Add editor tags
  const editorTags = [];
  if (pkg.type === 'cursor' || pkg.name.includes('cursor')) editorTags.push('cursor', 'cursor-rule');
  if (pkg.type === 'agent' || pkg.name.includes('claude')) editorTags.push('claude', 'claude-agent');
  if (pkg.type === 'rule' || pkg.name.includes('windsurf')) editorTags.push('windsurf', 'windsurf-rule');

  tags = [...new Set([...tags, ...editorTags])];

  return {
    ...pkg,
    tags,
    category: category.primary,
    subcategory: category.subcategory,
    keywords,
    // Add metadata
    verified: false,
    karenScore: null,
    downloads: 0,
    stars: 0,
    // Preserve original for reference
    _original: {
      tags: pkg.tags,
      category: pkg.category
    }
  };
}

// Main function
async function enhanceAllPackages() {
  const packageFiles = [
    'scraped-claude-skills.json',
    'scraped-darcyegb-agents.json',
    'converted-cursor-skills.json',
    'scraped-packages-additional.json',
    'new-scraped-packages.json',
    'scraped-windsurf-packages.json',
    'scraped-cursor-directory.json',
    'scraped-volt-agent-subagents.json',
    'scraped-additional-agents.json',
    'scraped-mdc-packages.json'
  ];

  let totalPackages = 0;
  const categoryStats = {};
  const tagStats = {};

  for (const file of packageFiles) {
    const filePath = path.join(__dirname, '..', file);

    try {
      console.log(`\n📦 Processing ${file}...`);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const packages = Array.isArray(data) ? data : data.packages || [];

      const enhanced = packages.map(pkg => {
        const result = enhancePackage(pkg);

        // Track stats
        categoryStats[result.category] = (categoryStats[result.category] || 0) + 1;
        result.tags.forEach(tag => {
          tagStats[tag] = (tagStats[tag] || 0) + 1;
        });

        return result;
      });

      // Write enhanced version
      const outputPath = filePath.replace('.json', '-enhanced.json');
      fs.writeFileSync(outputPath, JSON.stringify(enhanced, null, 2));

      console.log(`  ✓ Enhanced ${enhanced.length} packages`);
      console.log(`  → ${outputPath}`);

      totalPackages += enhanced.length;
    } catch (error) {
      console.error(`  ✗ Error processing ${file}:`, error.message);
    }
  }

  console.log(`\n\n✅ Enhanced ${totalPackages} total packages!`);

  // Print stats
  console.log(`\n📊 Category Distribution:`);
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} packages`);
    });

  console.log(`\n🏷️  Top 20 Tags:`);
  Object.entries(tagStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([tag, count]) => {
      console.log(`  ${tag}: ${count} packages`);
    });

  // Write taxonomy summary
  const summary = {
    totalPackages,
    categories: categoryStats,
    topTags: Object.fromEntries(
      Object.entries(tagStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
    ),
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(__dirname, '..', 'taxonomy-summary.json'),
    JSON.stringify(summary, null, 2)
  );

  console.log(`\n📋 Taxonomy summary written to taxonomy-summary.json`);
}

// Run
enhanceAllPackages().catch(console.error);
