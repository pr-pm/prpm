/**
 * @pr-pm/converters
 * Format conversion utilities for AI prompts
 * Shared between CLI and registry
 */

// Types
export * from './types/canonical.js';

// From converters (parse format → canonical)
export { fromCursor } from './from-cursor.js';
export { fromClaude } from './from-claude.js';
export { fromContinue } from './from-continue.js';
export { fromCopilot } from './from-copilot.js';
export { fromKiro } from './from-kiro.js';
export { fromWindsurf } from './from-windsurf.js';
export { fromAgentsMd } from './from-agents-md.js';

// To converters (canonical → target format)
export { toCursor } from './to-cursor.js';
export { toClaude, toClaudeMd } from './to-claude.js';
export { toContinue } from './to-continue.js';
export { toCopilot } from './to-copilot.js';
export { toKiro } from './to-kiro.js';
export { toWindsurf } from './to-windsurf.js';
export { toAgentsMd } from './to-agents-md.js';

// Utilities
export * from './taxonomy-utils.js';
export * from './validation.js';
