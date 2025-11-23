/**
 * Schema imports
 * Directly imports all JSON schemas from the converters package
 */

// Base schemas
import cursorSchema from '@pr-pm/converters/schemas/cursor.schema.json';
import claudeSchema from '@pr-pm/converters/schemas/claude.schema.json';
import continueSchema from '@pr-pm/converters/schemas/continue.schema.json';
import windsurfSchema from '@pr-pm/converters/schemas/windsurf.schema.json';
import copilotSchema from '@pr-pm/converters/schemas/copilot.schema.json';
import kiroSteeringSchema from '@pr-pm/converters/schemas/kiro-steering.schema.json';
import droidSchema from '@pr-pm/converters/schemas/droid.schema.json';
import opencodeSchema from '@pr-pm/converters/schemas/opencode.schema.json';
import geminiSchema from '@pr-pm/converters/schemas/gemini.schema.json';
import rulerSchema from '@pr-pm/converters/schemas/ruler.schema.json';
import agentsMdSchema from '@pr-pm/converters/schemas/agents-md.schema.json';
import geminiMdSchema from '@pr-pm/converters/schemas/gemini-md.schema.json';
import canonicalSchema from '@pr-pm/converters/schemas/canonical.schema.json';

// Claude subtypes
import claudeAgentSchema from '@pr-pm/converters/schemas/claude-agent.schema.json';
import claudeSkillSchema from '@pr-pm/converters/schemas/claude-skill.schema.json';
import claudeSlashCommandSchema from '@pr-pm/converters/schemas/claude-slash-command.schema.json';
import claudeHookSchema from '@pr-pm/converters/schemas/claude-hook.schema.json';

// Cursor subtypes
import cursorCommandSchema from '@pr-pm/converters/schemas/cursor-command.schema.json';

// Kiro subtypes
import kiroAgentSchema from '@pr-pm/converters/schemas/kiro-agent.schema.json';
import kiroHookSchema from '@pr-pm/converters/schemas/kiro-hook.schema.json';

// Droid subtypes
import droidSkillSchema from '@pr-pm/converters/schemas/droid-skill.schema.json';
import droidSlashCommandSchema from '@pr-pm/converters/schemas/droid-slash-command.schema.json';
import droidHookSchema from '@pr-pm/converters/schemas/droid-hook.schema.json';

// OpenCode subtypes
import opencodeSlashCommandSchema from '@pr-pm/converters/schemas/opencode-slash-command.schema.json';

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
