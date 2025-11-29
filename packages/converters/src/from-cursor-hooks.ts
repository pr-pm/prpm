/**
 * Cursor Hooks Format Parser
 * Parses Cursor hooks.json configuration files
 */

import type { CanonicalPackage, PackageMetadata, CursorHookSection } from './types/canonical.js';

interface CursorHookConfig {
  [hookType: string]: string; // hookType -> script path
}

/**
 * Parse Cursor hooks.json format
 *
 * @param content - JSON content of hooks.json
 * @param metadata - Package metadata
 */
export function fromCursorHooks(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>
): CanonicalPackage {
  let hooksConfig: CursorHookConfig;

  try {
    hooksConfig = JSON.parse(content);
  } catch (error) {
    throw new Error(`Invalid Cursor hooks JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Convert hooks to CursorHookSections
  const hookSections: CursorHookSection[] = Object.entries(hooksConfig).map(([hookType, scriptPath]) => {
    const validHookTypes = [
      'beforeShellExecution',
      'afterShellExecution',
      'beforeMCPExecution',
      'afterMCPExecution',
      'beforeReadFile',
      'afterFileEdit',
      'beforeSubmitPrompt',
      'stop',
      'afterAgentResponse',
      'afterAgentThought',
      'beforeTabFileRead',
      'afterTabFileEdit'
    ];

    if (!validHookTypes.includes(hookType)) {
      throw new Error(`Invalid hook type: ${hookType}`);
    }

    return {
      type: 'cursor-hook' as const,
      hookType: hookType as CursorHookSection['hookType'],
      scriptPath: scriptPath,
      description: `Cursor ${hookType} hook`
    };
  });

  const pkg: CanonicalPackage = {
    id: metadata.id,
    version: metadata.version,
    name: metadata.name,
    description: metadata.description || `Cursor hooks configuration`,
    author: metadata.author,
    organization: metadata.organization,
    tags: metadata.tags || ['cursor', 'hooks'],
    format: 'cursor-hooks',
    subtype: 'hook',

    // Additional metadata
    license: metadata.license,
    repository: metadata.repository,
    homepage: metadata.homepage,
    documentation: metadata.documentation,
    keywords: metadata.keywords,
    category: metadata.category,
    dependencies: metadata.dependencies,
    peerDependencies: metadata.peerDependencies,
    engines: metadata.engines,

    content: {
      format: 'canonical',
      version: '1.0',
      sections: hookSections
    },

    sourceFormat: 'cursor-hooks'
  };

  return pkg;
}
