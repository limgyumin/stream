import { defineConfig } from 'tsup';

export default defineConfig({
  format: ['cjs', 'esm'],
  entry: ['src/index.ts'],
  splitting: false,
  minify: true,
  clean: true,
  dts: true,
});
