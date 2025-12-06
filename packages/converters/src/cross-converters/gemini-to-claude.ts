/**
 * Gemini Extension → Claude Plugin Converter
 *
 * Converts Gemini CLI extensions to Claude Code plugins with high fidelity.
 * Both formats support MCP servers with nearly identical structure (85-95% compatible).
 *
 * Key mappings:
 * - Gemini mcpServers → Claude mcpServers (via MCP transformer)
 * - Gemini contextFileName → Claude context/instructions
 * - Gemini excludeTools → Warning (Claude doesn't support)
 * - Gemini experimentalSettings → Metadata storage for roundtrip
 */

import type { CanonicalPackage } from '../types/canonical.js';
import { geminiToClaudeMCP, type GeminiMCPServers } from './mcp-transformer.js';

/**
 * Gemini extension configuration structure
 */
interface GeminiExtensionConfig {
  name: string;
  version: string;
  description?: string;
  author?: string;
  mcpServers?: GeminiMCPServers;
  contextFileName?: string;
  excludeTools?: string[];
  experimentalSettings?: Record<string, any>;
}

/**
 * Claude plugin configuration structure
 */
interface ClaudePluginConfig {
  name: string;
  version: string;
  description?: string;
  author?: string;
  mcpServers?: Record<string, any>;
  instructions?: string;
  // Metadata for roundtrip conversion
  _geminiMetadata?: {
    contextFileName?: string;
    excludeTools?: string[];
    experimentalSettings?: Record<string, any>;
  };
}

/**
 * Conversion result with quality metrics
 */
export interface ConversionResult {
  claudePackage: CanonicalPackage;
  warnings: string[];
  lossyConversion: boolean;
  qualityScore: number; // 0-100
}

/**
 * Convert Gemini extension to Claude plugin
 *
 * @param geminiPackage - Canonical package with Gemini extension data
 * @returns Conversion result with Claude package and quality metrics
 */
export function geminiToClaudePlugin(geminiPackage: CanonicalPackage): ConversionResult {
  const warnings: string[] = [];
  let lossyConversion = false;
  let qualityScore = 100;

  // Extract Gemini extension metadata
  const geminiMeta = geminiPackage.metadata?.geminiExtension;
  const metadataSection = geminiPackage.content.sections.find(s => s.type === 'metadata');
  const geminiData = metadataSection?.type === 'metadata' ? metadataSection.data?.geminiExtension : undefined;

  const geminiConfig = geminiMeta || geminiData;

  if (!geminiConfig) {
    throw new Error('No Gemini extension metadata found in package');
  }

  // Build Claude plugin configuration
  const claudeConfig: ClaudePluginConfig = {
    name: geminiPackage.name,
    version: geminiPackage.version,
  };

  // Add description
  if (geminiPackage.description) {
    claudeConfig.description = geminiPackage.description;
  }

  // Add author
  if (geminiPackage.author) {
    claudeConfig.author = geminiPackage.author;
  }

  // Transform MCP servers
  if (geminiConfig.mcpServers) {
    const mcpResult = geminiToClaudeMCP(geminiConfig.mcpServers);
    claudeConfig.mcpServers = mcpResult.servers;

    if (mcpResult.warnings.length > 0) {
      warnings.push(...mcpResult.warnings);
    }

    if (!mcpResult.lossless) {
      lossyConversion = true;
      qualityScore -= 10;
    }
  }

  // Convert context file to instructions
  if (geminiConfig.contextFileName) {
    // Find context file content in sections
    const contextSection = geminiPackage.content.sections.find(
      s => s.type === 'context'
    );

    if (contextSection && contextSection.type === 'context') {
      claudeConfig.instructions = contextSection.content;
    } else {
      warnings.push(
        `Gemini extension references context file '${geminiConfig.contextFileName}' but content not found. ` +
        `Manual setup may be required.`
      );
      lossyConversion = true;
      qualityScore -= 15;
    }
  }

  // Handle excludeTools (Claude doesn't support this)
  if (geminiConfig.excludeTools && geminiConfig.excludeTools.length > 0) {
    warnings.push(
      `Gemini extension excludes tools: ${geminiConfig.excludeTools.join(', ')}. ` +
      `Claude plugins don't support tool exclusion - you'll need to configure this manually.`
    );
    lossyConversion = true;
    qualityScore -= 10;
  }

  // Store Gemini-specific metadata for roundtrip
  if (geminiConfig.contextFileName || geminiConfig.excludeTools || geminiConfig.experimentalSettings) {
    claudeConfig._geminiMetadata = {};

    if (geminiConfig.contextFileName) {
      claudeConfig._geminiMetadata.contextFileName = geminiConfig.contextFileName;
    }

    if (geminiConfig.excludeTools) {
      claudeConfig._geminiMetadata.excludeTools = geminiConfig.excludeTools;
    }

    if (geminiConfig.experimentalSettings) {
      claudeConfig._geminiMetadata.experimentalSettings = geminiConfig.experimentalSettings;
      warnings.push(
        'Gemini experimental settings preserved in metadata but not active in Claude. ' +
        'Conversion back to Gemini will restore these settings.'
      );
    }
  }

  // Build Claude canonical package
  const sections: CanonicalPackage['content']['sections'] = [];

  // Metadata section with Claude plugin data
  sections.push({
    type: 'metadata',
    data: {
      title: geminiPackage.name,
      description: geminiPackage.description || '',
      author: geminiPackage.author,
      version: geminiPackage.version,
      claudePlugin: claudeConfig,
    },
  });

  // Instructions section
  if (claudeConfig.instructions) {
    sections.push({
      type: 'instructions',
      title: 'Plugin Instructions',
      content: claudeConfig.instructions,
    });
  }

  // MCP servers as custom section (no dedicated 'configuration' type)
  if (claudeConfig.mcpServers && Object.keys(claudeConfig.mcpServers).length > 0) {
    sections.push({
      type: 'custom',
      title: 'MCP Servers',
      content: JSON.stringify(claudeConfig.mcpServers, null, 2),
      metadata: {
        mcpServers: claudeConfig.mcpServers,
      },
    });
  }

  const claudePackage: CanonicalPackage = {
    ...geminiPackage,
    format: 'claude',
    subtype: 'plugin',
    content: {
      format: 'canonical',
      version: '1.0',
      sections,
    },
    metadata: {
      ...geminiPackage.metadata,
      claudePlugin: claudeConfig,
    },
  };

  // Adjust quality score based on completeness
  if (!claudeConfig.mcpServers || Object.keys(claudeConfig.mcpServers).length === 0) {
    qualityScore -= 20;
    warnings.push('No MCP servers found - Claude plugin may have limited functionality');
  }

  if (!claudeConfig.instructions) {
    qualityScore -= 10;
    warnings.push('No instructions provided - consider adding usage guidance');
  }

  return {
    claudePackage,
    warnings,
    lossyConversion,
    qualityScore: Math.max(0, qualityScore),
  };
}

/**
 * Check if a canonical package is a Gemini extension
 */
export function isGeminiExtension(pkg: CanonicalPackage): boolean {
  return pkg.format === 'gemini' && pkg.subtype === 'extension';
}

/**
 * Check if conversion is recommended
 * Returns recommendation score (0-100) and reasons
 */
export function shouldConvert(geminiPackage: CanonicalPackage): {
  recommended: boolean;
  score: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 50; // Base score

  if (!isGeminiExtension(geminiPackage)) {
    return {
      recommended: false,
      score: 0,
      reasons: ['Package is not a Gemini extension'],
    };
  }

  const geminiMeta = geminiPackage.metadata?.geminiExtension;

  // Has MCP servers = highly convertible
  if (geminiMeta?.mcpServers && Object.keys(geminiMeta.mcpServers).length > 0) {
    score += 30;
    reasons.push(`Has ${Object.keys(geminiMeta.mcpServers).length} MCP server(s) - highly compatible`);
  }

  // Has context = good conversion
  if (geminiMeta?.contextFileName) {
    score += 10;
    reasons.push('Has context file - will convert to instructions');
  }

  // Has excludeTools = lossy conversion
  if (geminiMeta?.excludeTools && geminiMeta.excludeTools.length > 0) {
    score -= 15;
    reasons.push('Uses tool exclusions - not supported in Claude (lossy)');
  }

  // Has experimental settings = partial loss
  if (geminiMeta?.experimentalSettings) {
    score -= 10;
    reasons.push('Uses experimental settings - will be preserved but inactive');
  }

  return {
    recommended: score >= 50,
    score: Math.max(0, Math.min(100, score)),
    reasons,
  };
}
