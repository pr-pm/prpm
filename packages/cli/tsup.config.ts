import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  shims: true,
  external: [
    '@pr-pm/registry-client',
    '@pr-pm/types',
    // Node.js built-ins
    'readline/promises',
    'stream/promises',
  ],
  noExternal: [
    '@pr-pm/converters', // Bundle converters to handle ESM
  ],
  platform: 'node',
  target: 'node16',
  onSuccess: async () => {
    // Copy schema files to dist
    try {
      const distSchemasDir = join('dist', 'schemas');
      mkdirSync(distSchemasDir, { recursive: true });
      copyFileSync(
        join('schemas', 'prpm-manifest.schema.json'),
        join(distSchemasDir, 'prpm-manifest.schema.json')
      );

      // Copy converter format schemas
      const converterSchemasDir = join('..', 'converters', 'schemas');
      const schemaFiles = readdirSync(converterSchemasDir);
      schemaFiles.forEach(file => {
        if (!file.endsWith('.schema.json')) {
          return;
        }
        copyFileSync(
          join(converterSchemasDir, file),
          join(distSchemasDir, file)
        );
      });
      console.log('✓ Copied schema files to dist/');
    } catch (err) {
      console.warn('Warning: Could not copy schema files:', err);
    }
  },
});
