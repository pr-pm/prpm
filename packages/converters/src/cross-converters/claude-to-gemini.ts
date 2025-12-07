/**
 * Claude Plugin → Gemini Extension Converter
 *
 * Converts Claude Code plugins to Gemini CLI extensions with high fidelity.
 * Both formats support MCP servers with nearly identical structure (85-95% compatible).
 *
 * Key mappings:
 * - Claude mcpServers → Gemini mcpServers (via MCP transformer)
 * - Claude instructions → Gemini contextFileName + context content
 * - Claude metadata → Gemini extension config
 * - Restored Gemini metadata from previous conversions
 */

import type { CanonicalPackage } from '../types/canonical.js';
import { claudeToGeminiMCP, type ClaudeMCPServers } from './mcp-transformer.js';

/**
 * Claude plugin configuration structure
 */
interface ClaudePluginConfig {
  name: string;
  version: string;
  description?: string;
  author?: string;
  mcpServers?: ClaudeMCPServers;
  instructions?: string;
  // Metadata from previous Gemini → Claude conversion
  _geminiMetadata?: {
    contextFileName?: string;
    excludeTools?: string[];
    experimentalSettings?: Record<string, any>;
  };
}

/**
 * Gemini extension configuration structure
 */
interface GeminiExtensionConfig {
  name: string;
  version: string;
  description?: string;
  author?: string;
  mcpServers?: Record<string, any>;
  contextFileName?: string;
  excludeTools?: string[];
  experimentalSettings?: Record<string, any>;
}

/**
 * Conversion result with quality metrics
 */
export interface ConversionResult {
  geminiPackage: CanonicalPackage;
  warnings: string[];
  lossyConversion: boolean;
  qualityScore: number; // 0-100
}

/**
 * Convert Claude plugin to Gemini extension
 *
 * @param claudePackage - Canonical package with Claude plugin data
 * @returns Conversion result with Gemini package and quality metrics
 */
export function claudeToGeminiExtension(claudePackage: CanonicalPackage): ConversionResult {
  const warnings: string[] = [];
  let lossyConversion = false;
  let qualityScore = 100;

  // Extract Claude plugin metadata
  const claudeMeta = claudePackage.metadata?.claudePlugin;
  const metadataSection = claudePackage.content.sections.find(s => s.type === 'metadata');
  const claudeData = metadataSection?.type === 'metadata' ? metadataSection.data?.claudePlugin : undefined;

  const claudeConfig = claudeMeta || claudeData;

  if (!claudeConfig) {
    throw new Error('No Claude plugin metadata found in package');
  }

  // Build Gemini extension configuration
  const geminiConfig: GeminiExtensionConfig = {
    name: claudePackage.name,
    version: claudePackage.version,
  };

  // Add description
  if (claudePackage.description) {
    geminiConfig.description = claudePackage.description;
  }

  // Add author
  if (claudePackage.author) {
    geminiConfig.author = claudePackage.author;
  }

  // Transform MCP servers
  if (claudeConfig.mcpServers) {
    const mcpResult = claudeToGeminiMCP(claudeConfig.mcpServers as ClaudeMCPServers);
    geminiConfig.mcpServers = mcpResult.servers;

    if (mcpResult.warnings.length > 0) {
      warnings.push(...mcpResult.warnings);
    }

    if (!mcpResult.lossless) {
      lossyConversion = true;
      qualityScore -= 10;
    }
  }

  // Convert instructions to context file
  if (claudeConfig.instructions) {
    // Check if we have original contextFileName from metadata
    if (claudeConfig._geminiMetadata?.contextFileName) {
      geminiConfig.contextFileName = claudeConfig._geminiMetadata.contextFileName;
    } else {
      // Default context file name
      geminiConfig.contextFileName = 'context.md';
      warnings.push(
        'Claude plugin instructions converted to context.md. ' +
        'Original Gemini context filename not preserved.'
      );
      lossyConversion = true;
      qualityScore -= 5;
    }
  }

  // Restore excludeTools if available in metadata
  if (claudeConfig._geminiMetadata?.excludeTools) {
    geminiConfig.excludeTools = claudeConfig._geminiMetadata.excludeTools;
    warnings.push(
      `Restored tool exclusions from metadata: ${geminiConfig.excludeTools.join(', ')}`
    );
  }

  // Restore experimental settings if available in metadata
  if (claudeConfig._geminiMetadata?.experimentalSettings) {
    geminiConfig.experimentalSettings = claudeConfig._geminiMetadata.experimentalSettings;
    warnings.push('Restored Gemini experimental settings from metadata.');
  }

  // Build Gemini canonical package
  const sections: CanonicalPackage['content']['sections'] = [];

  // Metadata section with Gemini extension data
  sections.push({
    type: 'metadata',
    data: {
      title: claudePackage.name,
      description: claudePackage.description || '',
      author: claudePackage.author,
      version: claudePackage.version,
      geminiExtension: geminiConfig,
    },
  });

  // Context section (from instructions)
  if (claudeConfig.instructions) {
    sections.push({
      type: 'context',
      title: 'Extension Context',
      content: claudeConfig.instructions,
    });
  }

  // MCP servers as custom section
  if (geminiConfig.mcpServers && Object.keys(geminiConfig.mcpServers).length > 0) {
    sections.push({
      type: 'custom',
      title: 'MCP Servers',
      content: JSON.stringify(geminiConfig.mcpServers, null, 2),
      metadata: {
        mcpServers: geminiConfig.mcpServers,
      },
    });
  }

  const geminiPackage: CanonicalPackage = {
    ...claudePackage,
    format: 'gemini',
    subtype: 'extension',
    content: {
      format: 'canonical',
      version: '1.0',
      sections,
    },
    metadata: {
      ...claudePackage.metadata,
      geminiExtension: geminiConfig,
    },
  };

  // Adjust quality score based on completeness
  if (!geminiConfig.mcpServers || Object.keys(geminiConfig.mcpServers).length === 0) {
    qualityScore -= 20;
    warnings.push('No MCP servers found - Gemini extension may have limited functionality');
  }

  if (!claudeConfig.instructions) {
    qualityScore -= 10;
    warnings.push('No instructions found - consider adding context file content');
  }

  return {
    geminiPackage,
    warnings,
    lossyConversion,
    qualityScore: Math.max(0, qualityScore),
  };
}

/**
 * Check if a canonical package is a Claude plugin
 */
export function isClaudePlugin(pkg: CanonicalPackage): boolean {
  return pkg.format === 'claude' && pkg.subtype === 'plugin';
}

/**
 * Check if conversion is recommended
 * Returns recommendation score (0-100) and reasons
 */
export function shouldConvert(claudePackage: CanonicalPackage): {
  recommended: boolean;
  score: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 50; // Base score

  if (!isClaudePlugin(claudePackage)) {
    return {
      recommended: false,
      score: 0,
      reasons: ['Package is not a Claude plugin'],
    };
  }

  const claudeMeta = claudePackage.metadata?.claudePlugin;

  // Has MCP servers = highly convertible
  if (claudeMeta?.mcpServers && Object.keys(claudeMeta.mcpServers).length > 0) {
    score += 30;
    reasons.push(`Has ${Object.keys(claudeMeta.mcpServers).length} MCP server(s) - highly compatible`);
  }

  // Has instructions = good conversion
  if (claudeMeta?.instructions) {
    score += 10;
    reasons.push('Has instructions - will convert to context file');
  }

  // Has preserved Gemini metadata = excellent roundtrip
  if (claudeMeta?._geminiMetadata) {
    score += 20;
    reasons.push('Has preserved Gemini metadata - excellent roundtrip quality');
  }

  return {
    recommended: score >= 50,
    score: Math.max(0, Math.min(100, score)),
    reasons,
  };
}
