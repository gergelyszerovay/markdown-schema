import { defineConfig } from 'vitest/config';

/**
 * Runs the specs with the spec kinds defined as tags and `strictTags` on
 * (node-block-architecture constitution D42, D48). The JSON report records each spec's
 * tags and `meta.spec` slug for documentation and coverage tools.
 */
export default defineConfig({
  test: {
    include: ['libs/**/*.test.ts', 'app/**/*.test.ts'],
    // The CLI specs start a Node process per spec; on a loaded machine that exceeds the 5 s default.
    testTimeout: 30_000,
    strictTags: true,
    tags: [
      { name: 'scenario', description: 'A caller-visible scenario with exactly one act.' },
      { name: 'edge-case', description: 'Behaviour at a boundary or under a failure condition.' },
      { name: 'invariant', description: 'A rule that holds for all inputs.' },
    ],
    reporters: ['default', ['json', { outputFile: '../../temp/markdown-schema-vitest.json' }]],
  },
});
