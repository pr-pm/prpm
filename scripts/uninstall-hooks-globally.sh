#!/bin/bash

# uninstall-hooks-globally.sh
# Removes PRPM blog writer hooks from global Claude Code settings

set -e

GLOBAL_SETTINGS="$HOME/.claude/settings.json"

echo "🔧 Uninstalling PRPM blog writer hooks globally..."

# Check if global settings.json exists
if [ ! -f "$GLOBAL_SETTINGS" ]; then
  echo "⚠️  No global settings.json found at $GLOBAL_SETTINGS"
  exit 0
fi

# Backup existing settings
cp "$GLOBAL_SETTINGS" "$GLOBAL_SETTINGS.backup"
echo "💾 Backed up existing settings to $GLOBAL_SETTINGS.backup"

# Remove hooks using Node.js
node -e "
const fs = require('fs');

// Read global settings
const globalPath = process.env.HOME + '/.claude/settings.json';
const global = JSON.parse(fs.readFileSync(globalPath, 'utf8'));

// Remove PRPM blog hooks
if (global.hooks && global.hooks.PostToolUse) {
  const before = global.hooks.PostToolUse.length;

  global.hooks.PostToolUse = global.hooks.PostToolUse.filter(hook => {
    const isBlogHook = hook.matcher && (
      hook.matcher === 'Write:packages/webapp/src/app/blog/*/page.tsx' ||
      hook.matcher === 'Edit:packages/webapp/src/app/blog/*/page.tsx'
    );

    if (isBlogHook) {
      console.log('🗑️  Removed hook:', hook.matcher);
    }

    return !isBlogHook;
  });

  const after = global.hooks.PostToolUse.length;
  const removed = before - after;

  // Clean up empty hooks object
  if (global.hooks.PostToolUse.length === 0) {
    delete global.hooks.PostToolUse;
  }

  if (Object.keys(global.hooks).length === 0) {
    delete global.hooks;
  }

  console.log('');
  if (removed > 0) {
    console.log('✨ Removed', removed, 'hook(s) successfully!');
  } else {
    console.log('ℹ️  No PRPM blog hooks found to remove');
  }
}

// Write back to global settings
fs.writeFileSync(globalPath, JSON.stringify(global, null, 2));
console.log('📍 Location:', globalPath);
"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Uninstallation complete!"
  echo ""
  echo "To revert: cp $GLOBAL_SETTINGS.backup $GLOBAL_SETTINGS"
else
  echo ""
  echo "❌ Uninstallation failed. Restoring backup..."
  cp "$GLOBAL_SETTINGS.backup" "$GLOBAL_SETTINGS"
  exit 1
fi
