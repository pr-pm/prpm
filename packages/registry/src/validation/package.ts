/**
 * Package validation
 */

import { z } from 'zod';
import * as semver from 'semver';

// Package manifest schema
export const packageManifestSchema = z.object({
  name: z.string()
    .min(1)
    .max(214)
    .regex(/^(@[a-z0-9-]+\/)?[a-z0-9-]+$/, 'Package name must be lowercase alphanumeric with hyphens'),
  version: z.string().refine(
    (v) => semver.valid(v) !== null,
    'Version must be valid semver (e.g., 1.0.0)'
  ),
  description: z.string().min(10).max(500),
  author: z.union([
    z.string(),
    z.object({
      name: z.string(),
      email: z.string().email().optional(),
      url: z.string().url().optional(),
    }),
  ]).optional(),
  license: z.string().optional(),
  repository: z.string().url().optional(),
  homepage: z.string().url().optional(),
  documentation: z.string().url().optional(),
  format: z.enum(['cursor', 'claude', 'continue', 'windsurf', 'copilot', 'kiro', 'agents.md', 'generic', 'mcp']),
  subtype: z.enum(['rule', 'agent', 'skill', 'slash-command', 'prompt', 'workflow', 'tool', 'template', 'collection', 'chatmode']).optional(),
  // Legacy field support for backwards compatibility
  type: z.enum(['cursor', 'claude', 'continue', 'windsurf', 'generic']).optional(),
  tags: z.array(z.string()).max(10).optional(),
  keywords: z.array(z.string()).max(20).optional(),
  category: z.string().optional(),
  dependencies: z.record(z.string()).optional(),
  peerDependencies: z.record(z.string()).optional(),
  engines: z.record(z.string()).optional(),
  files: z.array(z.string()).min(1),
  main: z.string().optional(),
});

export type PackageManifest = z.infer<typeof packageManifestSchema>;

/**
 * Validate package manifest
 */
export function validateManifest(manifest: unknown): { valid: boolean; errors?: string[] } {
  try {
    packageManifestSchema.parse(manifest);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      };
    }
    return {
      valid: false,
      errors: ['Invalid manifest format'],
    };
  }
}

/**
 * Validate package name availability
 */
export function validatePackageName(name: string): { valid: boolean; error?: string } {
  // Reserved names
  const reserved = ['prpm', 'npm', 'node', 'admin', 'api', 'www'];
  if (reserved.includes(name.toLowerCase())) {
    return {
      valid: false,
      error: `Package name "${name}" is reserved`,
    };
  }

  // Inappropriate names (basic check)
  const inappropriate = ['fuck', 'shit', 'damn'];
  if (inappropriate.some(word => name.toLowerCase().includes(word))) {
    return {
      valid: false,
      error: 'Package name contains inappropriate content',
    };
  }

  return { valid: true };
}

/**
 * Validate package size
 */
export function validatePackageSize(size: number, maxSize: number): { valid: boolean; error?: string } {
  if (size > maxSize) {
    return {
      valid: false,
      error: `Package size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds maximum (${(maxSize / 1024 / 1024).toFixed(2)}MB)`,
    };
  }
  return { valid: true };
}

/**
 * Validate file extensions
 */
export function validateFileExtensions(
  files: string[],
  allowedExtensions: string[]
): { valid: boolean; error?: string } {
  const invalidFiles = files.filter(file => {
    const ext = `.${file.split('.').pop()}`;
    return !allowedExtensions.includes(ext) && !allowedExtensions.includes('*');
  });

  if (invalidFiles.length > 0) {
    return {
      valid: false,
      error: `Files with unsupported extensions: ${invalidFiles.join(', ')}. Allowed: ${allowedExtensions.join(', ')}`,
    };
  }

  return { valid: true };
}
