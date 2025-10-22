/**
 * JSON Schema validation for PRPM manifests
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { PackageManifest } from '../types/registry.js';

// Load the JSON schema
const schemaPath = join(__dirname, '../../schemas/prpm-manifest.schema.json');
let schema: any;

try {
  schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
} catch (error) {
  // Schema file not found, validation will be skipped
  console.warn('⚠️  Could not load manifest schema, skipping schema validation');
}

/**
 * Validate manifest against JSON schema
 */
export function validateManifestSchema(manifest: unknown): {
  valid: boolean;
  errors?: string[];
} {
  if (!schema) {
    // Schema not loaded, skip validation
    return { valid: true };
  }

  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
  });
  addFormats(ajv);

  const validate = ajv.compile(schema);
  const valid = validate(manifest);

  if (!valid && validate.errors) {
    const errors = validate.errors.map(err => {
      const path = err.instancePath || 'manifest';
      const message = err.message || 'validation failed';

      // Format error messages to be more user-friendly
      if (err.keyword === 'required') {
        const missingProp = err.params.missingProperty;
        return `Missing required field: ${missingProp}`;
      }

      if (err.keyword === 'pattern') {
        return `${path}: ${message}. Value does not match required pattern.`;
      }

      if (err.keyword === 'enum') {
        const allowedValues = err.params.allowedValues;
        return `${path}: ${message}. Allowed values: ${allowedValues.join(', ')}`;
      }

      if (err.keyword === 'minLength' || err.keyword === 'maxLength') {
        const limit = err.params.limit;
        return `${path}: ${message} (${err.keyword}: ${limit})`;
      }

      if (err.keyword === 'oneOf') {
        return `${path}: must match exactly one schema (check if files array uses either all strings or all objects, not mixed)`;
      }

      return `${path}: ${message}`;
    });

    return { valid: false, errors };
  }

  return { valid: true };
}

/**
 * Get the JSON schema (for documentation/export purposes)
 */
export function getManifestSchema(): any {
  return schema;
}
