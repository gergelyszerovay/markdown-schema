import { defineConfig } from 'tsdown';

/**
 * Bundles the two package entries with declarations (`.` and `./node`) and the `validate-md`
 * binary as Node ESM outputs.
 */
export default defineConfig({
  entry: {
    index: 'libs/markdown-schema/src/package.entry.ts',
    node: 'libs/markdown-schema/src/package-node.entry.ts',
    'validate-md.main': 'app/validate-md.main.ts',
  },
  outDir: 'dist',
  format: 'esm',
  platform: 'node',
  target: 'node24',
  dts: true,
  sourcemap: true,
  clean: true,
});
