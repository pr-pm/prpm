#!/usr/bin/env node

/**
 * Scraper for JhonMA82/awesome-clinerules repository
 * Scrapes .cursorrules files and converts to PRPM canonical format
 */

import https from 'https';
import fs from 'fs';

const REPO = 'JhonMA82/awesome-clinerules';
const BRANCH = 'main';
const OUTPUT_FILE = 'scraped-jhonma82-cursorrules.json';

// Helper to fetch URLs
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'PRPM-Scraper' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

// Extract category from directory path
function extractCategory(path) {
  const match = path.match(/rules\/([^/]+)/);
  if (!match) return 'general';

  const dirname = match[1];

  // Map directory names to categories
  if (dirname.includes('react') || dirname.includes('vue') || dirname.includes('angular') || dirname.includes('svelte')) {
    return 'frontend-frameworks';
  }
  if (dirname.includes('nextjs') || dirname.includes('nuxt') || dirname.includes('gatsby')) {
    return 'frontend-frameworks';
  }
  if (dirname.includes('django') || dirname.includes('fastapi') || dirname.includes('flask') || dirname.includes('express')) {
    return 'backend-frameworks';
  }
  if (dirname.includes('node') || dirname.includes('deno') || dirname.includes('bun')) {
    return 'backend-frameworks';
  }
  if (dirname.includes('python') || dirname.includes('java') || dirname.includes('ruby') || dirname.includes('go')) {
    return 'languages';
  }
  if (dirname.includes('typescript') || dirname.includes('javascript')) {
    return 'languages';
  }
  if (dirname.includes('flutter') || dirname.includes('react-native') || dirname.includes('android') || dirname.includes('ios')) {
    return 'mobile-development';
  }
  if (dirname.includes('test') || dirname.includes('jest') || dirname.includes('cypress')) {
    return 'quality-testing';
  }
  if (dirname.includes('docker') || dirname.includes('kubernetes') || dirname.includes('aws') || dirname.includes('terraform')) {
    return 'infrastructure';
  }
  if (dirname.includes('tailwind') || dirname.includes('css') || dirname.includes('sass')) {
    return 'frontend-frameworks';
  }
  if (dirname.includes('database') || dirname.includes('postgres') || dirname.includes('mongo')) {
    return 'backend-frameworks';
  }
  if (dirname.includes('game') || dirname.includes('simulation')) {
    return 'specialized-domains';
  }
  if (dirname.includes('wordpress') || dirname.includes('drupal')) {
    return 'specialized-domains';
  }

  return 'general';
}

// Extract tags from path and content
function extractTags(path) {
  const tags = ['cursor', 'cursor-rule'];
  const pathLower = path.toLowerCase();

  // Add technology tags
  const techMap = {
    'react': 'react',
    'vue': 'vue',
    'angular': 'angular',
    'svelte': 'svelte',
    'nextjs': 'nextjs',
    'nuxt': 'nuxtjs',
    'gatsby': 'gatsby',
    'python': 'python',
    'javascript': 'javascript',
    'typescript': 'typescript',
    'java': 'java',
    'ruby': 'ruby',
    'go': 'golang',
    'rust': 'rust',
    'flutter': 'flutter',
    'react-native': 'react-native',
    'android': 'android',
    'ios': 'ios',
    'docker': 'docker',
    'kubernetes': 'kubernetes',
    'aws': 'aws',
    'tailwind': 'tailwind',
    'fastapi': 'fastapi',
    'django': 'django',
    'flask': 'flask',
    'express': 'express',
    'nodejs': 'nodejs',
    'deno': 'deno',
    'wordpress': 'wordpress',
    'test': 'testing',
    'api': 'api',
    'firebase': 'firebase',
    'supabase': 'supabase',
    'graphql': 'graphql',
    'postgres': 'postgresql',
    'mongo': 'mongodb',
  };

  for (const [key, tag] of Object.entries(techMap)) {
    if (pathLower.includes(key)) {
      tags.push(tag);
    }
  }

  return [...new Set(tags)];
}

// Create package name from path
function createPackageName(path) {
  if (path === '.cursorrules') {
    return 'jhonma82-default';
  }

  const match = path.match(/rules\/([^/]+)/);
  if (!match) return 'jhonma82-' + path.replace(/[^a-z0-9]/g, '-');

  const dirname = match[1];
  // Clean up the directory name
  let name = dirname
    .replace(/-cursorrules-prompt-file$/i, '')
    .replace(/-cursorrules-pro$/i, '')
    .replace(/-cursorrules$/i, '')
    .replace(/^cursorrules-/i, '')
    .replace(/cursor-ai-/i, '')
    .toLowerCase()
    .trim();

  return 'jhonma82-' + name;
}

// Create display name from path
function createDisplayName(path) {
  if (path === '.cursorrules') {
    return 'JhonMA82 Default Rules';
  }

  const match = path.match(/rules\/([^/]+)/);
  if (!match) return path;

  const dirname = match[1];
  return dirname
    .replace(/-cursorrules-prompt-file$/i, '')
    .replace(/-cursorrules-pro$/i, '')
    .replace(/-cursorrules$/i, '')
    .replace(/^cursorrules-/i, '')
    .replace(/cursor-ai-/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

async function main() {
  console.log('🔍 Fetching file tree from GitHub...');

  // Fetch recursive tree
  const tree = await fetchUrl(`https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`);

  if (!tree.tree) {
    console.error('❌ Failed to fetch repository tree');
    process.exit(1);
  }

  // Filter .cursorrules files
  const cursorruleFiles = tree.tree.filter(item =>
    item.path.endsWith('.cursorrules') && item.type === 'blob'
  );

  console.log(`📦 Found ${cursorruleFiles.length} .cursorrules files`);

  const packages = [];
  let processed = 0;

  for (const file of cursorruleFiles) {
    processed++;
    const name = createPackageName(file.path);
    const displayName = createDisplayName(file.path);
    const category = extractCategory(file.path);
    const tags = extractTags(file.path);

    console.log(`[${processed}/${cursorruleFiles.length}] Processing: ${displayName}`);

    // Fetch file content
    let content = '';
    try {
      const rawUrl = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${file.path}`;
      content = await fetchUrl(rawUrl);

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err) {
      console.warn(`  ⚠️  Failed to fetch content: ${err.message}`);
    }

    // Create description from first few lines of content
    let description = displayName;
    if (typeof content === 'string' && content.length > 0) {
      const firstLines = content.split('\n').slice(0, 3).join(' ').trim();
      if (firstLines.length > 20 && firstLines.length < 200) {
        description = firstLines.substring(0, 150);
      }
    }

    packages.push({
      name,
      slug: name.replace('jhonma82-', ''),
      displayName,
      description,
      author: 'JhonMA82',
      type: 'cursor',
      category,
      tags,
      content: typeof content === 'string' ? content : '',
      sourceUrl: `https://github.com/${REPO}/blob/${BRANCH}/${file.path}`,
      version: '1.0.0',
      metadata: {
        originalPath: file.path,
        sha: file.sha,
      }
    });
  }

  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(packages, null, 2));
  console.log(`\n✅ Successfully scraped ${packages.length} packages!`);
  console.log(`📄 Output written to: ${OUTPUT_FILE}`);

  // Statistics
  const categoryStats = {};
  packages.forEach(pkg => {
    categoryStats[pkg.category] = (categoryStats[pkg.category] || 0) + 1;
  });

  console.log('\n📊 Category Distribution:');
  Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
