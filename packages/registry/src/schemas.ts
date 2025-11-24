/**
 * Schema imports
 * Loads JSON schemas from the converters package using fs.readFileSync
 * This avoids ES module import assertion complexity
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Helper to load a schema JSON file
function loadSchema(filename: string): object {
  // Resolve the converters package path
  const convertersPackagePath = require.resolve('@pr-pm/converters/package.json');
  const convertersDir = dirname(convertersPackagePath);
  const schemaPath = join(convertersDir, 'schemas', filename);
  return JSON.parse(readFileSync(schemaPath, 'utf-8'));
}

// Base schemas
const cursorSchema = loadSchema('cursor.schema.json');
const claudeSchema = loadSchema('claude.schema.json');
const continueSchema = loadSchema('continue.schema.json');
const windsurfSchema = loadSchema('windsurf.schema.json');
const copilotSchema = loadSchema('copilot.schema.json');
const kiroSteeringSchema = loadSchema('kiro-steering.schema.json');
const droidSchema = loadSchema('droid.schema.json');
const opencodeSchema = loadSchema('opencode.schema.json');
const geminiSchema = loadSchema('gemini.schema.json');
const rulerSchema = loadSchema('ruler.schema.json');
const agentsMdSchema = loadSchema('agents-md.schema.json');
const geminiMdSchema = loadSchema('gemini-md.schema.json');
const canonicalSchema = loadSchema('canonical.schema.json');

// Claude subtypes
const claudeAgentSchema = loadSchema('claude-agent.schema.json');
const claudeSkillSchema = loadSchema('claude-skill.schema.json');
const claudeSlashCommandSchema = loadSchema('claude-slash-command.schema.json');
const claudeHookSchema = loadSchema('claude-hook.schema.json');

// Cursor subtypes
const cursorCommandSchema = loadSchema('cursor-command.schema.json');

// Kiro subtypes
const kiroAgentSchema = loadSchema('kiro-agent.schema.json');
const kiroHookSchema = loadSchema('kiro-hook.schema.json');

// Droid subtypes
const droidSkillSchema = loadSchema('droid-skill.schema.json');
const droidSlashCommandSchema = loadSchema('droid-slash-command.schema.json');
const droidHookSchema = loadSchema('droid-hook.schema.json');

// OpenCode subtypes
const opencodeSlashCommandSchema = loadSchema('opencode-slash-command.schema.json');

/**
 * Map of schema filename to schema object
 */
export const SCHEMAS = new Map<string, object>([
  // Base schemas
  ['cursor.schema.json', cursorSchema],
  ['claude.schema.json', claudeSchema],
  ['continue.schema.json', continueSchema],
  ['windsurf.schema.json', windsurfSchema],
  ['copilot.schema.json', copilotSchema],
  ['kiro-steering.schema.json', kiroSteeringSchema],
  ['droid.schema.json', droidSchema],
  ['opencode.schema.json', opencodeSchema],
  ['gemini.schema.json', geminiSchema],
  ['ruler.schema.json', rulerSchema],
  ['agents-md.schema.json', agentsMdSchema],
  ['gemini-md.schema.json', geminiMdSchema],
  ['canonical.schema.json', canonicalSchema],

  // Claude subtypes
  ['claude-agent.schema.json', claudeAgentSchema],
  ['claude-skill.schema.json', claudeSkillSchema],
  ['claude-slash-command.schema.json', claudeSlashCommandSchema],
  ['claude-hook.schema.json', claudeHookSchema],

  // Cursor subtypes
  ['cursor-command.schema.json', cursorCommandSchema],

  // Kiro subtypes
  ['kiro-agent.schema.json', kiroAgentSchema],
  ['kiro-hook.schema.json', kiroHookSchema],

  // Droid subtypes
  ['droid-skill.schema.json', droidSkillSchema],
  ['droid-slash-command.schema.json', droidSlashCommandSchema],
  ['droid-hook.schema.json', droidHookSchema],

  // OpenCode subtypes
  ['opencode-slash-command.schema.json', opencodeSlashCommandSchema],
]);

// Base format schemas (format-only, no subtype)
export const BASE_SCHEMAS = [
  'cursor.schema.json',
  'claude.schema.json',
  'continue.schema.json',
  'windsurf.schema.json',
  'copilot.schema.json',
  'kiro-steering.schema.json',
  'droid.schema.json',
  'opencode.schema.json',
  'gemini.schema.json',
  'ruler.schema.json',
  'agents-md.schema.json',
  'gemini-md.schema.json',
  'canonical.schema.json',
];

// Subtype schemas (format + subtype)
export const SUBTYPE_SCHEMAS: Record<string, { format: string; subtype: string }> = {
  // Claude subtypes
  'claude-agent.schema.json': { format: 'claude', subtype: 'agent' },
  'claude-skill.schema.json': { format: 'claude', subtype: 'skill' },
  'claude-slash-command.schema.json': { format: 'claude', subtype: 'slash-command' },
  'claude-hook.schema.json': { format: 'claude', subtype: 'hook' },

  // Cursor subtypes
  'cursor-command.schema.json': { format: 'cursor', subtype: 'command' },

  // Kiro subtypes
  'kiro-agent.schema.json': { format: 'kiro', subtype: 'agent' },
  'kiro-hook.schema.json': { format: 'kiro', subtype: 'hook' },

  // Factory Droid subtypes
  'droid-skill.schema.json': { format: 'droid', subtype: 'skill' },
  'droid-slash-command.schema.json': { format: 'droid', subtype: 'slash-command' },
  'droid-hook.schema.json': { format: 'droid', subtype: 'hook' },

  // OpenCode subtypes
  'opencode-slash-command.schema.json': { format: 'opencode', subtype: 'slash-command' },
};

// Combined list of all available schemas
export const AVAILABLE_SCHEMAS = [...BASE_SCHEMAS, ...Object.keys(SUBTYPE_SCHEMAS)];
