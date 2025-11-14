import { defineConfig } from 'tsup';

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
});
