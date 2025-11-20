/**
 * Gemini Format Parser
 * Gemini uses TOML format for custom commands
 */

import * as TOML from '@iarna/toml';
import type { CanonicalPackage, PackageMetadata, CanonicalContent, Section } from './types/canonical.js';
import type { Subtype } from './taxonomy-utils.js';

export interface GeminiCommand {
  prompt: string;
  description?: string;
}

/**
 * Parse Gemini TOML format and convert to canonical package
 *
 * @param content - TOML content
 * @param metadata - Package metadata
 * @param explicitSubtype - Optional explicit subtype (defaults to 'slash-command')
 */
export function fromGemini(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>,
  explicitSubtype?: Subtype
): CanonicalPackage {
  // Parse TOML
  let parsed: GeminiCommand;
  try {
    const tomlData = TOML.parse(content) as unknown;
    parsed = tomlData as GeminiCommand;
  } catch (error) {
    throw new Error(`Failed to parse Gemini TOML: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Validate required fields
  if (!parsed.prompt) {
    throw new Error('Gemini command must have a "prompt" field');
  }

  // Build canonical sections
  const sections: Section[] = [];

  // Add metadata section
  sections.push({
    type: 'metadata',
    data: {
      title: metadata.name || metadata.id,
      description: parsed.description || 'Gemini custom command',
    },
  });

  // Add instructions section with the prompt
  sections.push({
    type: 'instructions',
    title: 'Prompt',
    content: parsed.prompt,
    priority: 'high',
  });

  // Build canonical package
  const canonicalContent: CanonicalContent = {
    format: 'canonical',
    version: '1.0',
    sections,
  };

  const pkg: CanonicalPackage = {
    id: metadata.id,
    version: metadata.version || '1.0.0',
    name: metadata.name || metadata.id,
    description: parsed.description || 'Gemini custom command',
    author: metadata.author || 'unknown',
    tags: metadata.tags || ['gemini', 'command'],
    format: 'gemini',
    subtype: explicitSubtype || 'slash-command',
    content: canonicalContent,
    sourceFormat: 'gemini',
    metadata: {
      description: parsed.description,
    },
  };

  return pkg;
}
