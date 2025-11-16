import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync } from 'fs';
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
      mkdirSync('dist/schemas', { recursive: true });
      copyFileSync(
        join('schemas', 'prpm-manifest.schema.json'),
        join('dist', 'schemas', 'prpm-manifest.schema.json')
      );
      console.log('✓ Copied schema files to dist/');
    } catch (err) {
      console.warn('Warning: Could not copy schema files:', err);
    }
  },
});
