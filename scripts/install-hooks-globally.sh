#!/bin/bash

# install-hooks-globally.sh
# Installs PRPM blog writer hooks to global Claude Code settings

set -e

GLOBAL_SETTINGS="$HOME/.claude/settings.json"
PROJECT_HOOKS=".claude/settings.json"

echo "🔧 Installing PRPM blog writer hooks globally..."

# Check if project hooks file exists
if [ ! -f "$PROJECT_HOOKS" ]; then
  echo "❌ Error: Project hooks file not found at $PROJECT_HOOKS"
  exit 1
fi

# Create ~/.claude directory if it doesn't exist
mkdir -p "$HOME/.claude"

# Check if global settings.json exists
if [ ! -f "$GLOBAL_SETTINGS" ]; then
  echo "📝 Creating new global settings.json..."
  echo '{}' > "$GLOBAL_SETTINGS"
fi

# Backup existing settings
cp "$GLOBAL_SETTINGS" "$GLOBAL_SETTINGS.backup"
echo "💾 Backed up existing settings to $GLOBAL_SETTINGS.backup"

# Merge hooks using Node.js
node -e "
const fs = require('fs');
const path = require('path');

// Read global settings
const globalPath = process.env.HOME + '/.claude/settings.json';
const global = JSON.parse(fs.readFileSync(globalPath, 'utf8'));

// Read project hooks
const projectHooks = JSON.parse(fs.readFileSync('.claude/settings.json', 'utf8'));

// Merge hooks
if (!global.hooks) {
  global.hooks = {};
}

if (!global.hooks.PostToolUse) {
  global.hooks.PostToolUse = [];
}

// Add project hooks (only if not already present)
const existingMatchers = new Set(
  global.hooks.PostToolUse.map(h => h.matcher)
);

for (const hook of projectHooks.hooks.PostToolUse) {
  if (!existingMatchers.has(hook.matcher)) {
    global.hooks.PostToolUse.push(hook);
    console.log('✅ Added hook:', hook.matcher);
  } else {
    console.log('⏭️  Hook already exists:', hook.matcher);
  }
}

// Write back to global settings
fs.writeFileSync(globalPath, JSON.stringify(global, null, 2));
console.log('');
console.log('✨ Global hooks updated successfully!');
console.log('📍 Location:', globalPath);
"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Installation complete!"
  echo ""
  echo "The following hooks are now active globally:"
  echo "  • Write:packages/webapp/src/app/blog/*/page.tsx"
  echo "  • Edit:packages/webapp/src/app/blog/*/page.tsx"
  echo ""
  echo "These hooks will trigger in any PRPM project with blog posts."
  echo ""
  echo "To revert: cp $GLOBAL_SETTINGS.backup $GLOBAL_SETTINGS"
else
  echo ""
  echo "❌ Installation failed. Restoring backup..."
  cp "$GLOBAL_SETTINGS.backup" "$GLOBAL_SETTINGS"
  exit 1
fi
