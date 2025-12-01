/**
 * JSON schema re-exports for consumers that want direct imports.
 * Using createRequire keeps runtime compatibility without JSON import assertions.
 */
import { createRequire } from 'module';
import { dirname, join } from 'path';

type JsonSchema = Record<string, unknown>;

// Create a require function for loading JSON files (ESM)
const schemaRequire = createRequire(import.meta.url);

// Resolve schemas directory from the converters package
const convertersPackagePath = schemaRequire.resolve('@pr-pm/converters/package.json');
const convertersDir = dirname(convertersPackagePath);

const loadSchema = (filename: string): JsonSchema =>
  schemaRequire(join(convertersDir, 'schemas', filename)) as JsonSchema;

// Format registry schema
export const formatRegistrySchema = loadSchema('format-registry.schema.json');

// Base schemas
export const agentsMdSchema = loadSchema('agents-md.schema.json');
export const canonicalSchema = loadSchema('canonical.schema.json');
export const claudeSchema = loadSchema('claude.schema.json');
export const continueSchema = loadSchema('continue.schema.json');
export const copilotSchema = loadSchema('copilot.schema.json');
export const cursorSchema = loadSchema('cursor.schema.json');
export const droidSchema = loadSchema('droid.schema.json');
export const geminiMdSchema = loadSchema('gemini-md.schema.json');
export const geminiSchema = loadSchema('gemini.schema.json');
export const kiroSteeringSchema = loadSchema('kiro-steering.schema.json');
export const opencodeSchema = loadSchema('opencode.schema.json');
export const rulerSchema = loadSchema('ruler.schema.json');
export const windsurfSchema = loadSchema('windsurf.schema.json');
export const traeSchema = loadSchema('trae.schema.json');
export const aiderSchema = loadSchema('aider.schema.json');
export const zencoderSchema = loadSchema('zencoder.schema.json');
export const replitSchema = loadSchema('replit.schema.json');

// Subtype schemas
export const claudeAgentSchema = loadSchema('claude-agent.schema.json');
export const claudeHookSchema = loadSchema('claude-hook.schema.json');
export const claudeSkillSchema = loadSchema('claude-skill.schema.json');
export const claudeSlashCommandSchema = loadSchema('claude-slash-command.schema.json');
export const cursorCommandSchema = loadSchema('cursor-command.schema.json');
export const droidHookSchema = loadSchema('droid-hook.schema.json');
export const droidSkillSchema = loadSchema('droid-skill.schema.json');
export const droidSlashCommandSchema = loadSchema('droid-slash-command.schema.json');
export const kiroAgentSchema = loadSchema('kiro-agent.schema.json');
export const kiroHookSchema = loadSchema('kiro-hook.schema.json');
export const opencodeSlashCommandSchema = loadSchema('opencode-slash-command.schema.json');
