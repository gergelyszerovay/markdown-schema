import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import n from 'eslint-plugin-n';
import jsdoc from 'eslint-plugin-jsdoc';
import tsdoc from 'eslint-plugin-tsdoc';
import prettier from 'eslint-config-prettier';
import { loadBoundProfile } from '@gergelyszerovay/architecture-skills/load-profile.cjs';
import {
  buildEntryOnly,
  tsdocSyntaxPlugin,
} from '@gergelyszerovay/architecture-skills/eslint-rules.cjs';

// Top-level declarations that need TSDoc; `_`-prefixed schema checks are exempt.
const topLevel = [
  'FunctionDeclaration',
  'ClassDeclaration',
  'TSTypeAliasDeclaration',
  'TSInterfaceDeclaration',
  'VariableDeclaration:not(:has(VariableDeclarator[id.name=/^_/]))',
];

export default defineConfig(
  {
    // `examples/` holds the demos the README walks through; they aren't part of the package's code.
    // `bin/` holds only the committed shim that loads the built CLI from `dist/`.
    ignores: [
      '**/.notes/**',
      'node_modules/',
      'dist/',
      'bin/',
      'coverage/',
      'examples/',
      '**/*.cjs',
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  n.configs['flat/recommended-module'],
  jsdoc.configs['flat/recommended-typescript-error'],
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { 'architecture-skills': tsdocSyntaxPlugin(tsdoc) },
    settings: {
      jsdoc: { mode: 'typescript' },
      n: { convertPath: { 'app/*.main.ts': ['^app/(.+)\\.ts$', 'dist/$1.mjs'] } },
    },
    rules: {
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          allowForKnownSafeCalls: [
            { from: 'package', package: 'node:test', name: ['it', 'test', 'describe', 'suite'] },
          ],
        },
      ],
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowTypedFunctionExpressions: true, allowHigherOrderFunctions: false },
      ],
      '@typescript-eslint/explicit-module-boundary-types': [
        'error',
        { allowHigherOrderFunctions: false },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportAllDeclaration',
          message: 'No wildcard re-exports; re-export names explicitly.',
        },
        {
          selector: 'ImportDeclaration[source.value=/^#libs\\//] > ImportNamespaceSpecifier',
          message:
            'Import named symbols from a library barrel, not the whole barrel as a namespace.',
        },
      ],
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
      'no-console': 'error',
      'n/no-process-exit': 'error',
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: false,
          require: { FunctionDeclaration: false },
          contexts: topLevel.flatMap((selector) => [
            `Program > ${selector}`,
            `Program > ExportNamedDeclaration:has(> ${selector})`,
          ]),
        },
      ],
      // TSDoc on every top-level declaration, with @param and @returns.
      // `enableFixer: false` on both: the fixer inserts the tag but cannot write the
      // description, so `--fix` leaves `@param name` with no text and no hyphen, which then
      // fails require-param-description and tsdoc/syntax. One honest finding becomes three,
      // in a file an agent may have touched for an unrelated reason. The tag is written by
      // hand; the rule only reports.
      'jsdoc/require-param': [
        'error',
        { checkDestructured: false, checkDestructuredRoots: false, enableFixer: false },
      ],
      'jsdoc/check-param-names': ['error', { checkDestructured: false }],
      // tsdoc/syntax (through its wrapper, which accepts a root row link) checks TSDoc syntax
      // (tags, @param hyphens); jsdoc keeps the presence rules
      'architecture-skills/tsdoc-syntax': 'error',
      'jsdoc/check-tag-names': 'off',
      'jsdoc/require-yields': 'off',
      'jsdoc/require-returns': [
        'error',
        { forceRequireReturn: false, forceReturnsWithAsync: true, enableFixer: false },
      ],
    },
  },
  // The profile's entry-only rule (D59): an `.entry.ts` holds only `export … from` declarations.
  ...buildEntryOnly(loadBoundProfile(import.meta.dirname), { severity: 'error' }),
  { files: ['**/adapters-driving/**', 'app/*.main.ts'], rules: { 'no-console': 'off' } },
  {
    // Only `.config.ts` blocks read the environment (node-block-architecture D26); tests may
    // pass it on to child processes they start.
    files: ['**/*.ts'],
    ignores: ['**/*.config.ts', '**/*.test.ts'],
    rules: { 'n/no-process-env': 'error' },
  },
  {
    // The package is published as tsdown bundles, so the source files behind an entry are never
    // published; `mdast` is the types-only module that `@types/mdast` declares.
    rules: {
      'n/no-unpublished-import': 'off',
      'n/no-missing-import': ['error', { allowModules: ['mdast'] }],
    },
  },
  {
    // Specs, including port contract suites, label their arrange/act/assert phases
    // (node-block-architecture D43); the labels document the phases and are never jump targets.
    files: ['**/*.test.ts', '**/*.contract.ts'],
    rules: { 'no-unused-labels': 'off', 'jsdoc/require-jsdoc': 'off' },
  },
  {
    files: ['*.config.js', '*.config.ts'],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      'no-restricted-exports': 'off',
      'jsdoc/require-jsdoc': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
  prettier,
);
