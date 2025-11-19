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
export { fromGemini } from './from-gemini.js';

// To converters (canonical → target format)
export { toCursor, isCursorFormat } from './to-cursor.js';
export { toClaude, toClaudeMd, isClaudeFormat } from './to-claude.js';
export { toContinue, isContinueFormat } from './to-continue.js';
export { toCopilot, isCopilotFormat } from './to-copilot.js';
export { toKiro, isKiroFormat } from './to-kiro.js';
export { toWindsurf, isWindsurfFormat } from './to-windsurf.js';
export { toAgentsMd, isAgentsMdFormat } from './to-agents-md.js';
export { toGemini } from './to-gemini.js';

// Utilities
export * from './taxonomy-utils.js';
export * from './validation.js';
