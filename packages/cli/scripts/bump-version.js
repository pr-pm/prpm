#!/usr/bin/env node

/**
 * Bump version script
 * Usage: npm run version:bump [major|minor|patch]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const versionType = process.argv[2] || 'patch';

if (!['major', 'minor', 'patch'].includes(versionType)) {
  console.error('❌ Invalid version type. Use: major, minor, or patch');
  process.exit(1);
}

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

const [major, minor, patch] = packageJson.version.split('.').map(Number);

let newVersion;
switch (versionType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`✅ Bumped version from ${major}.${minor}.${patch} to ${newVersion}`);

// Git commit
try {
  execSync('git add package.json', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  execSync(`git commit -m "chore(cli): bump version to ${newVersion}"`, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  console.log(`✅ Committed version bump to git`);
} catch (error) {
  console.warn('⚠️  Failed to commit to git (this is okay if not in a git repo)');
}

console.log('\n📦 Next steps:');
console.log('   1. npm run build');
console.log('   2. npm publish');
console.log(`   3. git tag v${newVersion}`);
console.log('   4. git push && git push --tags');
