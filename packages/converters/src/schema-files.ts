/**
 * JSON schema re-exports for consumers that want direct imports.
 * Using createRequire keeps runtime compatibility without JSON import assertions.
 */
import { createRequire } from 'module';

type JsonSchema = Record<string, unknown>;

// Works in both ESM (runtime) and Jest's CJS transform by avoiding direct import.meta usage
const getRequire = (): NodeRequire => {
  if (typeof require !== 'undefined') {
    return require;
  }

  try {
    // Access import.meta lazily so CJS parsers don't choke
    const importMeta = (0, eval)('import.meta');
    if (importMeta?.url) {
      return createRequire(importMeta.url);
    }
  } catch (error) {
    // Ignore and fall back
  }

  // Fallback: current working directory
  return createRequire(process.cwd() + '/');
};

const schemaRequire = getRequire();
const loadSchema = (filename: string): JsonSchema => schemaRequire(`../schemas/${filename}`) as JsonSchema;

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
