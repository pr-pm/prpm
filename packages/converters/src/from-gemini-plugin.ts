import type {
  CanonicalPackage,
  PackageMetadata,
  Section,
  MetadataSection,
} from './types/canonical.js';
import { setTaxonomy } from './taxonomy-utils.js';

/**
 * Gemini Extension JSON structure
 */
interface GeminiExtensionConfig {
  name: string;
  version: string;
  description?: string;
  author?: string;
  mcpServers?: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    disabled?: boolean;
  }>;
  contextFileName?: string;
  excludeTools?: string[];
  experimentalSettings?: Record<string, any>;
}

/**
 * Convert Gemini plugin (gemini-extension.json) to canonical format
 */
export function fromGeminiPlugin(
  content: string,
  metadata: Partial<PackageMetadata> & Pick<PackageMetadata, 'id' | 'name' | 'version' | 'author'>
): CanonicalPackage {
  const config: GeminiExtensionConfig = JSON.parse(content);

  const sections: Section[] = [];

  // 1. Create metadata section
  const metadataSection: MetadataSection = {
    type: 'metadata',
    data: {
      title: config.name || metadata.name || metadata.id,
      description: config.description || metadata.description || '',
      version: config.version || metadata.version,
      author: config.author || metadata.author,
    },
  };

  // Store Gemini-specific data for roundtrip conversion
  if (config.mcpServers || config.contextFileName || config.excludeTools || config.experimentalSettings) {
    metadataSection.data.geminiExtension = {
      mcpServers: config.mcpServers,
      contextFileName: config.contextFileName,
      excludeTools: config.excludeTools,
      experimentalSettings: config.experimentalSettings,
    };
  }

  sections.push(metadataSection);

  // 2. Add instructions if there's a description
  if (config.description) {
    sections.push({
      type: 'instructions',
      title: 'Extension Description',
      content: config.description,
    });
  }

  // 3. Build canonical package
  const canonicalContent: CanonicalPackage['content'] = {
    format: 'canonical',
    version: '1.0',
    sections
  };

  const pkg: CanonicalPackage = {
    ...metadata,
    id: metadata.id,
    name: metadata.name || config.name || metadata.id,
    version: metadata.version || config.version,
    author: metadata.author || config.author || 'unknown',
    description: metadata.description || config.description || '',
    tags: metadata.tags || [],
    format: 'gemini',
    subtype: 'extension',
    content: canonicalContent,
  };

  // Store extension-specific metadata in top-level metadata for easier access
  if (config.mcpServers || config.contextFileName || config.excludeTools || config.experimentalSettings) {
    pkg.metadata = {
      ...pkg.metadata,
      geminiExtension: {
        mcpServers: config.mcpServers,
        contextFileName: config.contextFileName,
        excludeTools: config.excludeTools,
        experimentalSettings: config.experimentalSettings,
      },
    };
  }

  setTaxonomy(pkg, 'gemini', 'extension');
  return pkg;
}
