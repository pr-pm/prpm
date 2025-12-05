import type {
  CanonicalPackage,
  ConversionResult,
} from './types/canonical.js';

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
 * Convert canonical format to Gemini plugin (gemini-extension.json)
 */
export function toGeminiPlugin(pkg: CanonicalPackage): ConversionResult {
  const warnings: string[] = [];
  let qualityScore = 100;

  try {
    const content = convertContent(pkg, warnings);

    const lossyConversion = warnings.some(w =>
      w.includes('not supported') || w.includes('skipped')
    );

    if (lossyConversion) {
      qualityScore -= 10;
    }

    return {
      content,
      format: 'gemini',
      warnings: warnings.length > 0 ? warnings : undefined,
      lossyConversion,
      qualityScore,
    };
  } catch (error) {
    warnings.push(`Conversion error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      content: '',
      format: 'gemini',
      warnings,
      lossyConversion: true,
      qualityScore: 0,
    };
  }
}

function convertContent(pkg: CanonicalPackage, warnings: string[]): string {
  // Extract sections
  const metadata = pkg.content.sections.find(s => s.type === 'metadata');

  // Build Gemini extension config
  const config: GeminiExtensionConfig = {
    name: pkg.name,
    version: pkg.version,
  };

  // Add description
  if (pkg.description) {
    config.description = pkg.description;
  }

  // Add author
  if (pkg.author) {
    config.author = pkg.author;
  }

  // Restore Gemini-specific metadata (for roundtrip)
  const geminiData = metadata?.type === 'metadata' ? metadata.data.geminiExtension : undefined;
  const geminiMeta = pkg.metadata?.geminiExtension;

  if (geminiData || geminiMeta) {
    const geminiConfig = geminiData || geminiMeta;

    if (geminiConfig?.mcpServers) {
      config.mcpServers = geminiConfig.mcpServers;
    }

    if (geminiConfig?.contextFileName) {
      config.contextFileName = geminiConfig.contextFileName;
    }

    if (geminiConfig?.excludeTools) {
      config.excludeTools = geminiConfig.excludeTools;
    }

    if (geminiConfig?.experimentalSettings) {
      config.experimentalSettings = geminiConfig.experimentalSettings;
    }
  }

  // Warn about unsupported sections
  const unsupportedSections = pkg.content.sections.filter(s =>
    s.type !== 'metadata' && s.type !== 'instructions'
  );

  if (unsupportedSections.length > 0) {
    const types = [...new Set(unsupportedSections.map(s => s.type))];
    warnings.push(`Gemini extensions do not support ${types.join(', ')} sections - these will be skipped`);
  }

  // Generate JSON with pretty formatting
  return JSON.stringify(config, null, 2) + '\n';
}
